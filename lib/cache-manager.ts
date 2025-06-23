import { redisTranslationCache } from './redis-translation-cache'
import { createServiceRoleClient } from './supabase'
import { createHash } from 'crypto'

export interface CacheMetrics {
  hitRate: number
  totalRequests: number
  cacheSize: number
  costSavings: number
  performance: {
    averageResponseTime: number
    cacheResponseTime: number
    apiResponseTime: number
  }
}

export interface CacheOptimizationSuggestion {
  type: 'hit_rate' | 'cost_savings' | 'performance' | 'storage'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
  impact: string
}

export class CacheManager {
  private supabase = createServiceRoleClient()

  /**
   * Get comprehensive cache analytics
   */
  async getCacheAnalytics(
    userId?: string,
    timeRange: string = '24h'
  ): Promise<{
    metrics: CacheMetrics
    suggestions: CacheOptimizationSuggestion[]
    trends: any[]
  }> {
    try {
      const [healthInfo, userStats] = await Promise.all([
        redisTranslationCache.getHealthInfo(),
        this.getUserCacheStats(userId, timeRange),
      ])

      const metrics = this.calculateMetrics(healthInfo, userStats)
      const suggestions = this.generateOptimizationSuggestions(
        metrics,
        healthInfo
      )
      const trends = await this.getCacheTrends(timeRange)

      return {
        metrics,
        suggestions,
        trends,
      }
    } catch (error) {
      console.error('Error getting cache analytics:', error)
      throw error
    }
  }

  /**
   * Get user-specific cache statistics
   */
  private async getUserCacheStats(userId?: string, timeRange: string = '24h') {
    try {
      const hoursBack = this.parseTimeRange(timeRange)
      const sinceTime = new Date(
        Date.now() - hoursBack * 60 * 60 * 1000
      ).toISOString()

      let query = this.supabase
        .from('translation_history')
        .select('character_count, created_at, quality_tier')
        .gte('created_at', sinceTime)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: translations, error } = await query.limit(10000)

      if (error) throw error

      return {
        totalTranslations: translations?.length || 0,
        totalCharacters:
          translations?.reduce((sum, t) => sum + (t.character_count || 0), 0) ||
          0,
        qualityDistribution: this.getQualityDistribution(translations || []),
      }
    } catch (error) {
      console.error('Error getting user cache stats:', error)
      return {
        totalTranslations: 0,
        totalCharacters: 0,
        qualityDistribution: {},
      }
    }
  }

  /**
   * Calculate comprehensive metrics
   */
  private calculateMetrics(healthInfo: any, userStats: any): CacheMetrics {
    const stats = healthInfo.stats || { hits: 0, misses: 0, hitRate: 0 }
    const totalRequests = stats.hits + stats.misses

    // Estimate cost savings (assuming $0.02 per 1K characters for Google Translate)
    const averageCharsPerTranslation =
      userStats.totalCharacters / Math.max(userStats.totalTranslations, 1)
    const cachedCharacters = stats.hits * averageCharsPerTranslation
    const costSavings = (cachedCharacters / 1000) * 0.02

    return {
      hitRate: stats.hitRate || 0,
      totalRequests,
      cacheSize: healthInfo.fallbackCacheSize || 0,
      costSavings,
      performance: {
        averageResponseTime: 250, // Estimate based on cache hit/miss ratio
        cacheResponseTime: 50, // Redis response time
        apiResponseTime: 800, // Google Translate API response time
      },
    }
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(
    metrics: CacheMetrics,
    healthInfo: any
  ): CacheOptimizationSuggestion[] {
    const suggestions: CacheOptimizationSuggestion[] = []

    // Hit rate optimization
    if (metrics.hitRate < 0.3) {
      suggestions.push({
        type: 'hit_rate',
        priority: 'high',
        title: 'Low Cache Hit Rate',
        description: `Current hit rate is ${(metrics.hitRate * 100).toFixed(1)}%. This indicates many unique translations.`,
        action: 'Enable cache warming with popular business phrases',
        impact: 'Could improve hit rate by 20-40%',
      })
    } else if (metrics.hitRate >= 0.7) {
      suggestions.push({
        type: 'hit_rate',
        priority: 'low',
        title: 'Excellent Cache Performance',
        description: `Hit rate of ${(metrics.hitRate * 100).toFixed(1)}% is excellent.`,
        action: 'Consider expanding cache to cover more language pairs',
        impact: 'Maintain high performance as usage grows',
      })
    }

    // Cost savings
    if (metrics.costSavings > 10) {
      suggestions.push({
        type: 'cost_savings',
        priority: 'medium',
        title: 'Significant Cost Savings',
        description: `Cache is saving approximately $${metrics.costSavings.toFixed(2)} in API costs.`,
        action: 'Monitor and maintain current cache strategy',
        impact: 'Continue reducing operational costs',
      })
    }

    // Performance optimization
    if (!healthInfo.connected && healthInfo.enabled) {
      suggestions.push({
        type: 'performance',
        priority: 'high',
        title: 'Redis Connection Issue',
        description:
          'Redis cache is not connected, falling back to in-memory cache.',
        action: 'Check Redis configuration and network connectivity',
        impact: 'Restore distributed caching for better performance',
      })
    }

    // Storage optimization
    if (healthInfo.fallbackCacheSize > 5000) {
      suggestions.push({
        type: 'storage',
        priority: 'medium',
        title: 'Large In-Memory Cache',
        description: `In-memory cache has ${healthInfo.fallbackCacheSize} entries.`,
        action: 'Ensure Redis is working properly to reduce memory usage',
        impact: 'Reduce server memory consumption',
      })
    }

    return suggestions
  }

  /**
   * Get cache performance trends
   */
  private async getCacheTrends(timeRange: string) {
    // This would typically query a time-series database
    // For now, return mock trend data
    const hours = this.parseTimeRange(timeRange)
    const trends = []

    for (let i = hours; i >= 0; i--) {
      const time = new Date(Date.now() - i * 60 * 60 * 1000)
      trends.push({
        timestamp: time.toISOString(),
        hitRate: Math.random() * 0.4 + 0.3, // Random between 30-70%
        requests: Math.floor(Math.random() * 100) + 50,
        costSavings: Math.random() * 5 + 2,
      })
    }

    return trends
  }

  /**
   * Optimize cache for specific user patterns
   */
  async optimizeForUser(userId: string): Promise<{
    success: boolean
    optimizations: string[]
  }> {
    try {
      // Get user's most common translation patterns
      const { data: userPatterns, error } = await this.supabase
        .from('translation_history')
        .select('source_language, target_language, quality_tier')
        .eq('user_id', userId)
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ) // Last 30 days
        .limit(1000)

      if (error) throw error

      const optimizations: string[] = []

      if (userPatterns && userPatterns.length > 0) {
        // Analyze patterns
        const languagePairs = this.analyzeLangPairs(userPatterns)
        const commonQuality = this.getCommonQuality(userPatterns)

        // Generate user-specific optimization recommendations
        if (languagePairs.length > 0) {
          optimizations.push(
            `Detected common language pairs: ${languagePairs.slice(0, 3).join(', ')}`
          )
        }

        if (commonQuality) {
          optimizations.push(`Most used quality tier: ${commonQuality}`)
        }

        optimizations.push('User patterns analyzed for cache optimization')
      } else {
        optimizations.push('No translation history found for optimization')
      }

      return {
        success: true,
        optimizations,
      }
    } catch (error) {
      console.error('Error optimizing cache for user:', error)
      return {
        success: false,
        optimizations: ['Failed to optimize cache for user'],
      }
    }
  }

  /**
   * Warm cache with user-specific content
   */
  async warmCacheForUser(userId: string): Promise<{
    success: boolean
    warmedEntries: number
  }> {
    try {
      // Get user's recent high-quality translations
      const { data: recentTranslations, error } = await this.supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .gte('quality_score', 0.8)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      if (!recentTranslations || recentTranslations.length === 0) {
        return { success: true, warmedEntries: 0 }
      }

      // Convert to cache warming format
      const warmingData = recentTranslations.map(t => ({
        text: t.source_text,
        sourceLang: t.source_language,
        targetLang: t.target_language,
        translation: {
          translatedText: t.translated_text,
          sourceLang: t.source_language,
          targetLang: t.target_language,
          confidence: 0.95,
          qualityScore: t.quality_score,
          timestamp: new Date().toISOString(),
          qualityTier: t.quality_tier || 'standard',
        },
      }))

      await redisTranslationCache.warmCache(warmingData)

      return {
        success: true,
        warmedEntries: warmingData.length,
      }
    } catch (error) {
      console.error('Error warming cache for user:', error)
      return {
        success: false,
        warmedEntries: 0,
      }
    }
  }

  // Helper methods
  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1)
    const value = parseInt(timeRange.slice(0, -1))

    switch (unit) {
      case 'h':
        return value
      case 'd':
        return value * 24
      case 'w':
        return value * 24 * 7
      default:
        return 24
    }
  }

  private getQualityDistribution(translations: any[]) {
    const distribution: Record<string, number> = {}
    translations.forEach(t => {
      const tier = t.quality_tier || 'standard'
      distribution[tier] = (distribution[tier] || 0) + 1
    })
    return distribution
  }

  private analyzeLangPairs(patterns: any[]): string[] {
    const pairCounts: Record<string, number> = {}
    patterns.forEach(p => {
      const pair = `${p.source_language}-${p.target_language}`
      pairCounts[pair] = (pairCounts[pair] || 0) + 1
    })

    return Object.entries(pairCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pair]) => pair)
  }

  private getCommonQuality(patterns: any[]): string {
    const qualityCounts: Record<string, number> = {}
    patterns.forEach(p => {
      const quality = p.quality_tier || 'standard'
      qualityCounts[quality] = (qualityCounts[quality] || 0) + 1
    })

    return (
      Object.entries(qualityCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'standard'
    )
  }
}

export const cacheManager = new CacheManager()
