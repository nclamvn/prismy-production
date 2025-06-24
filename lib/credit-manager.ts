/**
 * PRISMY CREDIT MANAGEMENT UTILITY
 * Centralized credit verification and deduction logic
 */

import { createRouteHandlerClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface CreditCheckResult {
  success: boolean
  credits_available: number
  credits_needed: number
  error?: string
  message?: string
}

export interface CreditDeductionResult {
  success: boolean
  credits_before: number
  credits_after: number
  credits_used: number
  error?: string
  message?: string
}

export interface CreditCalculationOptions {
  tokens?: number
  characters?: number
  pages?: number
  operation_type?: 'translate' | 'document_process' | 'ai_analysis' | 'ocr'
  quality_tier?: 'free' | 'standard' | 'premium' | 'enterprise'
}

/**
 * Credit calculation based on operation type and content
 */
export function calculateCreditsNeeded(options: CreditCalculationOptions): number {
  const {
    tokens = 0,
    characters = 0,
    pages = 0,
    operation_type = 'translate',
    quality_tier = 'standard'
  } = options

  let baseCredits = 0

  // Primary calculation: token-based (most accurate)
  if (tokens > 0) {
    baseCredits = Math.ceil(tokens / 1000) // 1 credit = 1000 tokens
  }
  // Fallback: character-based estimation
  else if (characters > 0) {
    // Rough conversion: 1000 characters ≈ 250 tokens for most languages
    const estimatedTokens = Math.ceil(characters / 4)
    baseCredits = Math.ceil(estimatedTokens / 1000)
  }
  // Fallback: page-based estimation
  else if (pages > 0) {
    // Rough conversion: 1 page ≈ 500 words ≈ 750 tokens
    const estimatedTokens = pages * 750
    baseCredits = Math.ceil(estimatedTokens / 1000)
  }
  else {
    // Minimum charge for any operation
    baseCredits = 1
  }

  // Apply operation multipliers
  const operationMultipliers = {
    translate: 1.0,      // Base rate
    document_process: 1.5, // More expensive due to processing
    ai_analysis: 2.0,    // Most expensive for AI insights
    ocr: 1.2            // Slightly more for OCR
  }

  // Apply quality tier multipliers
  const qualityMultipliers = {
    free: 0.5,      // Cheaper but lower quality
    standard: 1.0,  // Base rate
    premium: 1.5,   // Higher quality
    enterprise: 2.0 // Highest quality + priority
  }

  const operationMultiplier = operationMultipliers[operation_type] || 1.0
  const qualityMultiplier = qualityMultipliers[quality_tier] || 1.0

  const finalCredits = Math.ceil(baseCredits * operationMultiplier * qualityMultiplier)
  
  // Ensure minimum charge
  return Math.max(1, finalCredits)
}

/**
 * Estimate tokens from text content
 */
export function estimateTokensFromText(text: string): number {
  if (!text || typeof text !== 'string') return 0
  
  // Simple estimation: ~4 characters per token for most languages
  // This is a rough approximation - actual tokenization varies by model
  return Math.ceil(text.length / 4)
}

/**
 * Check if user has sufficient credits
 */
export async function checkCreditsAvailable(
  supabase: any,
  userId: string,
  creditsNeeded: number
): Promise<CreditCheckResult> {
  try {
    const { data: creditInfo, error } = await supabase
      .rpc('get_user_credits', { _user_id: userId })

    if (error) {
      console.error('[Credit Manager] Check credits error:', error)
      return {
        success: false,
        credits_available: 0,
        credits_needed: creditsNeeded,
        error: 'CREDIT_CHECK_FAILED',
        message: 'Failed to check credit balance'
      }
    }

    if (!creditInfo?.success) {
      return {
        success: false,
        credits_available: 0,
        credits_needed: creditsNeeded,
        error: 'NO_CREDIT_ACCOUNT',
        message: 'No credit account found. Please redeem an invite code.'
      }
    }

    const creditsAvailable = creditInfo.credits_left || 0

    if (creditsAvailable < creditsNeeded) {
      return {
        success: false,
        credits_available: creditsAvailable,
        credits_needed: creditsNeeded,
        error: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. You have ${creditsAvailable} but need ${creditsNeeded}.`
      }
    }

    return {
      success: true,
      credits_available: creditsAvailable,
      credits_needed: creditsNeeded
    }

  } catch (error) {
    console.error('[Credit Manager] Check credits exception:', error)
    return {
      success: false,
      credits_available: 0,
      credits_needed: creditsNeeded,
      error: 'SYSTEM_ERROR',
      message: 'System error checking credits'
    }
  }
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(
  supabase: any,
  userId: string,
  creditsNeeded: number,
  operation: string = 'api_call',
  tokensProcessed?: number,
  metadata?: any
): Promise<CreditDeductionResult> {
  try {
    const { data: result, error } = await supabase
      .rpc('decrement_credits', {
        _user_id: userId,
        _credits_needed: creditsNeeded,
        _operation: operation,
        _tokens_processed: tokensProcessed
      })

    if (error) {
      console.error('[Credit Manager] Deduct credits error:', error)
      return {
        success: false,
        credits_before: 0,
        credits_after: 0,
        credits_used: 0,
        error: 'DEDUCTION_FAILED',
        message: 'Failed to deduct credits'
      }
    }

    if (!result?.success) {
      return {
        success: false,
        credits_before: result?.credits_available || 0,
        credits_after: result?.credits_available || 0,
        credits_used: 0,
        error: result?.error || 'DEDUCTION_FAILED',
        message: result?.message || 'Credit deduction failed'
      }
    }

    return {
      success: true,
      credits_before: result.credits_before,
      credits_after: result.credits_after,
      credits_used: result.credits_used
    }

  } catch (error) {
    console.error('[Credit Manager] Deduct credits exception:', error)
    return {
      success: false,
      credits_before: 0,
      credits_after: 0,
      credits_used: 0,
      error: 'SYSTEM_ERROR',
      message: 'System error deducting credits'
    }
  }
}

/**
 * Check and deduct credits in one operation (recommended)
 */
export async function checkAndDeductCredits(
  supabase: any,
  userId: string,
  options: CreditCalculationOptions,
  operation: string = 'api_call',
  metadata?: any
): Promise<CreditDeductionResult & { calculation: CreditCalculationOptions }> {
  const creditsNeeded = calculateCreditsNeeded(options)
  
  // Check if user has enough credits
  const checkResult = await checkCreditsAvailable(supabase, userId, creditsNeeded)
  
  if (!checkResult.success) {
    return {
      success: false,
      credits_before: checkResult.credits_available,
      credits_after: checkResult.credits_available,
      credits_used: 0,
      error: checkResult.error,
      message: checkResult.message,
      calculation: options
    }
  }

  // Deduct credits
  const deductResult = await deductCredits(
    supabase,
    userId,
    creditsNeeded,
    operation,
    options.tokens,
    metadata
  )

  return {
    ...deductResult,
    calculation: options
  }
}

/**
 * Get user credit status (for UI display)
 */
export async function getUserCreditStatus(supabase: any, userId: string) {
  try {
    const { data: creditInfo, error } = await supabase
      .rpc('get_user_credits', { _user_id: userId })

    if (error || !creditInfo?.success) {
      return {
        hasCredits: false,
        creditsLeft: 0,
        needsInvite: true,
        trialExpired: false,
        accountType: 'none'
      }
    }

    const hasCredits = creditInfo.credits_left > 0
    const trialExpired = creditInfo.trial_ends_at && new Date(creditInfo.trial_ends_at) < new Date()
    const isTrialUser = creditInfo.trial_credits > 0
    const isPaidUser = creditInfo.purchased_credits > 0

    let accountType = 'none'
    if (isPaidUser) accountType = 'paid'
    else if (isTrialUser) accountType = trialExpired ? 'trial_expired' : 'trial'

    return {
      hasCredits,
      creditsLeft: creditInfo.credits_left,
      needsInvite: !hasCredits && !isTrialUser && !isPaidUser,
      trialExpired,
      accountType,
      trialEndsAt: creditInfo.trial_ends_at,
      totalEarned: creditInfo.total_earned,
      totalSpent: creditInfo.total_spent
    }

  } catch (error) {
    console.error('[Credit Manager] Get status error:', error)
    return {
      hasCredits: false,
      creditsLeft: 0,
      needsInvite: true,
      trialExpired: false,
      accountType: 'error'
    }
  }
}

/**
 * Express middleware-style credit checker
 */
export async function requireCredits(
  supabase: any,
  user: User,
  minCredits: number = 1
) {
  const status = await getUserCreditStatus(supabase, user.id)
  
  if (!status.hasCredits) {
    return {
      allowed: false,
      status: 402, // Payment Required
      error: 'INSUFFICIENT_CREDITS',
      message: status.needsInvite 
        ? 'Please redeem an invite code to get started'
        : 'Your credit balance is insufficient'
    }
  }

  if (status.creditsLeft < minCredits) {
    return {
      allowed: false,
      status: 402,
      error: 'INSUFFICIENT_CREDITS',
      message: `Need ${minCredits} credits, but only ${status.creditsLeft} available`
    }
  }

  return {
    allowed: true,
    status: 200,
    credits: status.creditsLeft
  }
}