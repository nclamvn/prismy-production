/**
 * PRISMY CREDIT VERIFICATION MIDDLEWARE
 * Middleware to check user credits before accessing protected endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getUserCreditStatus } from '@/lib/credit-manager'
import { cookies } from 'next/headers'

export interface CreditMiddlewareOptions {
  minimumCredits?: number
  bypassForAdmin?: boolean
  requireActiveAccount?: boolean
}

export interface CreditMiddlewareResult {
  allowed: boolean
  user?: any
  credits?: number
  status?: number
  error?: string
  message?: string
  redirect?: string
}

/**
 * Check if user has sufficient credits to access endpoint
 */
export async function verifyCreditAccess(
  request: NextRequest,
  options: CreditMiddlewareOptions = {}
): Promise<CreditMiddlewareResult> {
  const {
    minimumCredits = 1,
    bypassForAdmin = true,
    requireActiveAccount = true,
  } = options

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication first
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return {
        allowed: false,
        status: 401,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Please sign in to access this feature',
        redirect: '/auth/login',
      }
    }

    // Get user profile for admin bypass check
    if (bypassForAdmin) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', session.user.id)
        .single()

      // Admin users (enterprise tier) bypass credit checks
      if (profile?.subscription_tier === 'enterprise') {
        return {
          allowed: true,
          user: session.user,
          credits: -1, // Unlimited for admins
        }
      }
    }

    // Check credit status
    const creditStatus = await getUserCreditStatus(supabase, session.user.id)

    // Handle users without credit accounts
    if (creditStatus.needsInvite && requireActiveAccount) {
      return {
        allowed: false,
        status: 402,
        error: 'INVITE_REQUIRED',
        message: 'Please redeem an invite code to get started',
        redirect: '/invite',
      }
    }

    // Check if trial has expired
    if (creditStatus.trialExpired && !creditStatus.hasCredits) {
      return {
        allowed: false,
        status: 402,
        error: 'TRIAL_EXPIRED',
        message: 'Your trial has expired. Please purchase credits to continue.',
        redirect: '/pricing',
      }
    }

    // Check minimum credit requirement
    if (creditStatus.creditsLeft < minimumCredits) {
      return {
        allowed: false,
        status: 402,
        error: 'INSUFFICIENT_CREDITS',
        message: `You need at least ${minimumCredits} credits. You have ${creditStatus.creditsLeft}.`,
        redirect: '/pricing',
      }
    }

    return {
      allowed: true,
      user: session.user,
      credits: creditStatus.creditsLeft,
    }
  } catch (error) {
    console.error('[Credit Middleware] Error:', error)
    return {
      allowed: false,
      status: 500,
      error: 'SYSTEM_ERROR',
      message: 'System error checking access permissions',
    }
  }
}

/**
 * Express-style middleware wrapper for Next.js API routes
 */
export function withCreditCheck(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: CreditMiddlewareOptions = {}
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    const accessCheck = await verifyCreditAccess(req, options)

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.error,
          message: accessCheck.message,
          redirect: accessCheck.redirect,
          status: accessCheck.status,
        },
        { status: accessCheck.status || 403 }
      )
    }

    // Add user and credit info to context for handler use
    const enhancedContext = {
      ...context,
      user: accessCheck.user,
      credits: accessCheck.credits,
    }

    return handler(req, enhancedContext)
  }
}

/**
 * Page-level credit guard for frontend components
 */
export async function checkPageAccess(
  minimumCredits: number = 1,
  redirectPath: string = '/invite'
): Promise<{
  hasAccess: boolean
  user?: any
  credits?: number
  redirectTo?: string
}> {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        hasAccess: false,
        redirectTo: '/auth/login',
      }
    }

    const creditStatus = await getUserCreditStatus(supabase, session.user.id)

    if (creditStatus.needsInvite) {
      return {
        hasAccess: false,
        user: session.user,
        redirectTo: '/invite',
      }
    }

    if (creditStatus.trialExpired && !creditStatus.hasCredits) {
      return {
        hasAccess: false,
        user: session.user,
        redirectTo: '/pricing',
      }
    }

    if (creditStatus.creditsLeft < minimumCredits) {
      return {
        hasAccess: false,
        user: session.user,
        credits: creditStatus.creditsLeft,
        redirectTo: redirectPath,
      }
    }

    return {
      hasAccess: true,
      user: session.user,
      credits: creditStatus.creditsLeft,
    }
  } catch (error) {
    console.error('[Page Access Check] Error:', error)
    return {
      hasAccess: false,
      redirectTo: '/error',
    }
  }
}

/**
 * Hook for client-side credit verification
 */
export class CreditGuard {
  private static instance: CreditGuard
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 60000 // 1 minute

  static getInstance(): CreditGuard {
    if (!CreditGuard.instance) {
      CreditGuard.instance = new CreditGuard()
    }
    return CreditGuard.instance
  }

  async checkUserCredits(userId: string): Promise<{
    hasCredits: boolean
    creditsLeft: number
    needsAction: boolean
    actionRequired?: 'invite' | 'purchase' | 'none'
  }> {
    const cacheKey = `credits_${userId}`
    const cached = this.cache.get(cacheKey)

    // Return cached result if fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      const response = await fetch('/api/credits/balance')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to check credits')
      }

      const result = {
        hasCredits: data.credits.current > 0,
        creditsLeft: data.credits.current,
        needsAction: data.status.needsInvite || data.status.trialExpired,
        actionRequired: data.status.needsInvite
          ? ('invite' as const)
          : data.status.trialExpired
            ? ('purchase' as const)
            : ('none' as const),
      }

      // Cache result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      })

      return result
    } catch (error) {
      console.error('[CreditGuard] Check error:', error)
      return {
        hasCredits: false,
        creditsLeft: 0,
        needsAction: true,
        actionRequired: 'invite',
      }
    }
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(`credits_${userId}`)
    } else {
      this.cache.clear()
    }
  }
}

/**
 * Rate limiting with credit awareness
 */
export function getCreditAwareRateLimit(creditsLeft: number): {
  requestsPerHour: number
  burstLimit: number
} {
  // Higher credit users get higher rate limits
  if (creditsLeft >= 1000) {
    return { requestsPerHour: 1000, burstLimit: 50 }
  } else if (creditsLeft >= 500) {
    return { requestsPerHour: 500, burstLimit: 25 }
  } else if (creditsLeft >= 100) {
    return { requestsPerHour: 200, burstLimit: 15 }
  } else if (creditsLeft >= 10) {
    return { requestsPerHour: 50, burstLimit: 10 }
  } else {
    return { requestsPerHour: 10, burstLimit: 5 }
  }
}
