/**
 * PRISMY USAGE TRACKING SERVICE
 * Real-time usage monitoring and quota enforcement
 */

import { createRouteHandlerClient } from './supabase'
import { cookies } from 'next/headers'
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from './stripe'

export interface UsageStats {
  translations: number
  documents: number
  characters: number
  lastReset: Date
}

export interface UsageResult {
  allowed: boolean
  reason?: string
  remaining: {
    translations: number
    documents: number
    characters: number
  }
  usage: UsageStats
  plan: SubscriptionPlan
}

export interface TrackUsageRequest {
  userId: string
  type: 'translation' | 'document' | 'batch'
  characters: number
  documents?: number
  metadata?: Record<string, any>
}

class UsageTracker {
  private cache = new Map<string, UsageStats>()

  /**
   * Check if user can perform an action and track usage
   */
  async checkAndTrackUsage(request: TrackUsageRequest): Promise<UsageResult> {
    const supabase = createRouteHandlerClient({ cookies })

    // Get user subscription info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, usage_limit, usage_count, usage_reset_date')
      .eq('user_id', request.userId)
      .single()

    if (profileError || !profile) {
      return {
        allowed: false,
        reason: 'User profile not found',
        remaining: { translations: 0, documents: 0, characters: 0 },
        usage: {
          translations: 0,
          documents: 0,
          characters: 0,
          lastReset: new Date(),
        },
        plan: 'free',
      }
    }

    const plan = (profile.subscription_tier || 'free') as SubscriptionPlan
    const planLimits = SUBSCRIPTION_PLANS[plan].limits

    // Get current usage stats
    const currentUsage = await this.getCurrentUsage(request.userId)

    // Check if user needs usage reset
    const needsReset = this.shouldResetUsage(profile.usage_reset_date)
    if (needsReset) {
      await this.resetUserUsage(request.userId)
      currentUsage.translations = 0
      currentUsage.documents = 0
      currentUsage.characters = 0
    }

    // Calculate new usage after this request
    const newTranslations =
      currentUsage.translations + (request.type === 'translation' ? 1 : 0)
    const newDocuments = currentUsage.documents + (request.documents || 0)
    const newCharacters = currentUsage.characters + request.characters

    // Check quotas
    const quotaCheck = this.checkQuotas(
      {
        translations: newTranslations,
        documents: newDocuments,
        characters: newCharacters,
      },
      planLimits
    )

    if (!quotaCheck.allowed) {
      return {
        allowed: false,
        reason: quotaCheck.reason,
        remaining: this.calculateRemaining(currentUsage, planLimits),
        usage: currentUsage,
        plan,
      }
    }

    // Track the usage
    await this.trackUsage(request)

    // Update cache
    this.cache.set(request.userId, {
      translations: newTranslations,
      documents: newDocuments,
      characters: newCharacters,
      lastReset: currentUsage.lastReset,
    })

    return {
      allowed: true,
      remaining: this.calculateRemaining(
        {
          translations: newTranslations,
          documents: newDocuments,
          characters: newCharacters,
        },
        planLimits
      ),
      usage: {
        translations: newTranslations,
        documents: newDocuments,
        characters: newCharacters,
        lastReset: currentUsage.lastReset,
      },
      plan,
    }
  }

  /**
   * Get current usage for a user
   */
  async getCurrentUsage(userId: string): Promise<UsageStats> {
    // Check cache first
    const cached = this.cache.get(userId)
    if (cached) {
      return cached
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get usage from database
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('usage_reset_date')
      .eq('user_id', userId)
      .single()

    const resetDate = profile?.usage_reset_date || new Date()

    // Get current month's usage from translation_history
    const { data: translations } = await supabase
      .from('translation_history')
      .select('character_count')
      .eq('user_id', userId)
      .gte('created_at', resetDate.toISOString())

    // Get document usage (assuming documents are tracked in translation_history with type)
    const { data: documents } = await supabase
      .from('translation_history')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'document')
      .gte('created_at', resetDate.toISOString())

    const usage: UsageStats = {
      translations: translations?.length || 0,
      documents: documents?.length || 0,
      characters:
        translations?.reduce((sum, t) => sum + (t.character_count || 0), 0) ||
        0,
      lastReset: new Date(resetDate),
    }

    // Cache the result
    this.cache.set(userId, usage)

    return usage
  }

  /**
   * Track usage in the database
   */
  private async trackUsage(request: TrackUsageRequest): Promise<void> {
    const supabase = createRouteHandlerClient({ cookies })

    // Insert into translation_history for tracking
    await supabase.from('translation_history').insert({
      user_id: request.userId,
      type: request.type,
      character_count: request.characters,
      metadata: request.metadata,
      created_at: new Date().toISOString(),
    })

    // Update user_profiles usage count
    await supabase.rpc('increment_usage_count', {
      user_uuid: request.userId,
      characters: request.characters,
    })
  }

  /**
   * Check if usage should be reset
   */
  private shouldResetUsage(lastReset?: string | Date): boolean {
    if (!lastReset) return true

    const resetDate = new Date(lastReset)
    const now = new Date()

    // Reset monthly (if last reset was more than 30 days ago)
    const daysSinceReset =
      (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceReset >= 30
  }

  /**
   * Reset user usage for new period
   */
  private async resetUserUsage(userId: string): Promise<void> {
    const supabase = createRouteHandlerClient({ cookies })

    await supabase
      .from('user_profiles')
      .update({
        usage_count: 0,
        usage_reset_date: new Date().toISOString(),
      })
      .eq('user_id', userId)

    // Clear cache
    this.cache.delete(userId)
  }

  /**
   * Check if usage is within quotas
   */
  private checkQuotas(
    usage: { translations: number; documents: number; characters: number },
    limits: { translations: number; documents: number; characters: number }
  ): { allowed: boolean; reason?: string } {
    // Check translation limit
    if (
      limits.translations !== -1 &&
      usage.translations > limits.translations
    ) {
      return {
        allowed: false,
        reason: `Translation limit exceeded (${limits.translations} per month)`,
      }
    }

    // Check document limit
    if (limits.documents !== -1 && usage.documents > limits.documents) {
      return {
        allowed: false,
        reason: `Document limit exceeded (${limits.documents} per month)`,
      }
    }

    // Check character limit
    if (limits.characters !== -1 && usage.characters > limits.characters) {
      return {
        allowed: false,
        reason: `Character limit exceeded (${limits.characters.toLocaleString()} per month)`,
      }
    }

    return { allowed: true }
  }

  /**
   * Calculate remaining usage
   */
  private calculateRemaining(
    usage: { translations: number; documents: number; characters: number },
    limits: { translations: number; documents: number; characters: number }
  ) {
    return {
      translations:
        limits.translations === -1
          ? -1
          : Math.max(0, limits.translations - usage.translations),
      documents:
        limits.documents === -1
          ? -1
          : Math.max(0, limits.documents - usage.documents),
      characters:
        limits.characters === -1
          ? -1
          : Math.max(0, limits.characters - usage.characters),
    }
  }

  /**
   * Get usage statistics for dashboard
   */
  async getUsageStatistics(userId: string): Promise<{
    current: UsageStats
    limits: { translations: number; documents: number; characters: number }
    remaining: { translations: number; documents: number; characters: number }
    percentage: { translations: number; documents: number; characters: number }
    plan: SubscriptionPlan
  }> {
    const supabase = createRouteHandlerClient({ cookies })

    // Get user subscription
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', userId)
      .single()

    const plan = (profile?.subscription_tier || 'free') as SubscriptionPlan
    const limits = SUBSCRIPTION_PLANS[plan].limits
    const current = await this.getCurrentUsage(userId)
    const remaining = this.calculateRemaining(current, limits)

    // Calculate usage percentages
    const percentage = {
      translations:
        limits.translations === -1
          ? 0
          : (current.translations / limits.translations) * 100,
      documents:
        limits.documents === -1
          ? 0
          : (current.documents / limits.documents) * 100,
      characters:
        limits.characters === -1
          ? 0
          : (current.characters / limits.characters) * 100,
    }

    return {
      current,
      limits,
      remaining,
      percentage,
      plan,
    }
  }

  /**
   * Clear cache for a user (useful for subscription changes)
   */
  clearUserCache(userId: string): void {
    this.cache.delete(userId)
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const usageTracker = new UsageTracker()
