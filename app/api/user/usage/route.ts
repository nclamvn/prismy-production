/**
 * PRISMY USER USAGE API
 * Provides usage statistics for billing dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { usageTracker } from '@/lib/usage-tracker'
import { getRateLimitForTier } from '@/lib/rate-limiter'

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

    // Apply rate limiting
    const rateLimitResult = await getRateLimitForTier(request, 'standard')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get comprehensive usage statistics
    const usageStats = await usageTracker.getUsageStatistics(session.user.id)

    // Get historical data for charts
    const { data: historyData } = await supabase
      .from('translation_history')
      .select('created_at, character_count, type')
      .eq('user_id', session.user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: true })

    // Process historical data for charts
    const dailyUsage = historyData?.reduce((acc: Record<string, { characters: number; translations: number }>, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { characters: 0, translations: 0 }
      }
      acc[date].characters += item.character_count || 0
      acc[date].translations += 1
      return acc
    }, {}) || {}

    // Get billing period information
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('usage_reset_date, subscription_tier, subscription_current_period_end')
      .eq('user_id', session.user.id)
      .single()

    const billingPeriod = {
      start: profile?.usage_reset_date || new Date(),
      end: profile?.subscription_current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysRemaining: profile?.subscription_current_period_end 
        ? Math.ceil((new Date(profile.subscription_current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30
    }

    return NextResponse.json({
      success: true,
      usage: usageStats,
      history: {
        daily: dailyUsage,
        total: historyData?.length || 0
      },
      billingPeriod,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Usage API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Reset user usage (admin function)
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

    const body = await request.json()
    const { action } = body

    if (action === 'reset') {
      // Clear user cache to force refresh
      usageTracker.clearUserCache(session.user.id)
      
      // Reset usage in database
      await supabase
        .from('user_profiles')
        .update({
          usage_count: 0,
          usage_reset_date: new Date().toISOString()
        })
        .eq('user_id', session.user.id)

      return NextResponse.json({
        success: true,
        message: 'Usage reset successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Usage Reset API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}