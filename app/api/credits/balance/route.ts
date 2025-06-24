/**
 * PRISMY CREDITS BALANCE API
 * Provides credit balance and usage information for authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Helper function to calculate usage statistics
async function getUsageStatistics(supabase: any, userId: string) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get usage for different periods
  const [todayUsage, weekUsage, monthUsage] = await Promise.all([
    supabase
      .from('credit_usage_log')
      .select('credits_used, operation')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString()),
    
    supabase
      .from('credit_usage_log')
      .select('credits_used, operation, created_at')
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString()),
    
    supabase
      .from('credit_usage_log')
      .select('credits_used, operation, created_at')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString())
  ])

  // Calculate totals
  const todayTotal = todayUsage.data?.reduce((sum, log) => sum + log.credits_used, 0) || 0
  const weekTotal = weekUsage.data?.reduce((sum, log) => sum + log.credits_used, 0) || 0
  const monthTotal = monthUsage.data?.reduce((sum, log) => sum + log.credits_used, 0) || 0

  // Group by operation type
  const operationStats = monthUsage.data?.reduce((acc, log) => {
    const op = log.operation || 'unknown'
    if (!acc[op]) {
      acc[op] = { count: 0, credits: 0 }
    }
    acc[op].count += 1
    acc[op].credits += log.credits_used
    return acc
  }, {} as Record<string, { count: number; credits: number }>) || {}

  // Daily usage for chart (last 7 days)
  const dailyUsage = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    
    const dayUsage = weekUsage.data?.filter(log => {
      const logDate = new Date(log.created_at)
      return logDate >= dayStart && logDate < dayEnd
    }).reduce((sum, log) => sum + log.credits_used, 0) || 0

    dailyUsage.push({
      date: dayStart.toISOString().split('T')[0],
      credits: dayUsage
    })
  }

  return {
    today: todayTotal,
    week: weekTotal,
    month: monthTotal,
    byOperation: operationStats,
    dailyChart: dailyUsage
  }
}

/**
 * GET - Get credit balance and usage information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get credit information using SQL function
    const { data: creditInfo, error: creditError } = await supabase
      .rpc('get_user_credits', { _user_id: session.user.id })

    if (creditError) {
      console.error('[Credits Balance API] Credit query error:', creditError)
      return NextResponse.json(
        { error: 'Failed to fetch credit information' },
        { status: 500 }
      )
    }

    // If user doesn't have credits account, return default state
    if (!creditInfo?.success) {
      return NextResponse.json({
        success: true,
        credits: {
          current: 0,
          total_earned: 0,
          total_spent: 0,
          trial_credits: 0,
          purchased_credits: 0,
          trial_ends_at: null,
          last_used_at: null
        },
        status: {
          needsInvite: true,
          hasActiveCredits: false,
          trialExpired: false,
          accountType: 'none'
        },
        usage: {
          today: 0,
          week: 0,
          month: 0,
          byOperation: {},
          dailyChart: []
        }
      })
    }

    // Determine account status
    const hasActiveCredits = creditInfo.credits_left > 0
    const trialExpired = creditInfo.trial_ends_at && new Date(creditInfo.trial_ends_at) < new Date()
    const isTrialUser = creditInfo.trial_credits > 0
    const isPaidUser = creditInfo.purchased_credits > 0

    let accountType = 'none'
    if (isPaidUser) accountType = 'paid'
    else if (isTrialUser) accountType = trialExpired ? 'trial_expired' : 'trial'

    // Get usage statistics
    const usageStats = await getUsageStatistics(supabase, session.user.id)

    // Calculate estimated days remaining based on recent usage
    let estimatedDaysRemaining = null
    if (hasActiveCredits && usageStats.week > 0) {
      const avgDailyUsage = usageStats.week / 7
      if (avgDailyUsage > 0) {
        estimatedDaysRemaining = Math.ceil(creditInfo.credits_left / avgDailyUsage)
      }
    }

    return NextResponse.json({
      success: true,
      credits: {
        current: creditInfo.credits_left,
        total_earned: creditInfo.total_earned,
        total_spent: creditInfo.total_spent,
        trial_credits: creditInfo.trial_credits,
        purchased_credits: creditInfo.purchased_credits,
        trial_ends_at: creditInfo.trial_ends_at,
        last_used_at: creditInfo.last_used_at,
        estimated_days_remaining: estimatedDaysRemaining
      },
      status: {
        needsInvite: !hasActiveCredits && !isTrialUser && !isPaidUser,
        hasActiveCredits,
        trialExpired,
        accountType
      },
      usage: usageStats,
      user: {
        email: session.user.email,
        id: session.user.id
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Credits Balance API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Refresh/update credit information (manual refresh)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body for any refresh options
    const body = await request.json()
    const { action } = body

    if (action === 'refresh') {
      // Force refresh by updating the last_used_at timestamp
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)

      if (updateError) {
        console.warn('[Credits Balance API] Refresh warning:', updateError)
      }

      return NextResponse.json({
        success: true,
        message: 'Credit information refreshed',
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Credits Balance API] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}