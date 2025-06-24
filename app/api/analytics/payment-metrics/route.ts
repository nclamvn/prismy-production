/**
 * PAYMENT ANALYTICS API
 * Provides comprehensive payment and subscription metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { getRateLimitForTier } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication and admin permissions
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin (you may want to add admin role checking)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, email')
      .eq('user_id', session.user.id)
      .single()

    // For demo purposes, allow enterprise users to view analytics
    // In production, you'd want proper admin role checking
    if (!profile || (profile.subscription_tier !== 'enterprise' && !profile.email?.includes('admin'))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Apply rate limiting
    const rateLimitResult = await getRateLimitForTier(request, 'enterprise')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get payment metrics
    const metrics = await calculatePaymentMetrics(supabase)

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Payment Analytics API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function calculatePaymentMetrics(supabase: any) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Get active subscriptions count
  const { data: activeSubscriptions, count: activeCount } = await supabase
    .from('user_profiles')
    .select('subscription_tier, subscription_status', { count: 'exact' })
    .not('subscription_tier', 'eq', 'free')
    .not('subscription_tier', 'is', null)
    .in('subscription_status', ['active', 'trialing'])

  // Get subscription events for revenue calculation
  const { data: subscriptionEvents } = await supabase
    .from('subscription_events')
    .select('event_type, metadata, created_at')
    .in('event_type', ['payment_succeeded', 'subscription_created', 'subscription_canceled'])
    .gte('created_at', new Date(now.getFullYear() - 1, 0, 1).toISOString())

  // Calculate total revenue from successful payments
  const totalRevenue = subscriptionEvents
    ?.filter(event => event.event_type === 'payment_succeeded')
    ?.reduce((sum, event) => sum + (event.metadata?.amount || 0), 0) / 100 || 0

  // Calculate monthly revenue for the last 6 months
  const monthlyRevenue = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const monthRevenue = subscriptionEvents
      ?.filter(event => 
        event.event_type === 'payment_succeeded' &&
        new Date(event.created_at) >= monthStart &&
        new Date(event.created_at) <= monthEnd
      )
      ?.reduce((sum, event) => sum + (event.metadata?.amount || 0), 0) / 100 || 0
    
    monthlyRevenue.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: monthRevenue
    })
  }

  // Calculate churn rate (canceled subscriptions this month / active subscriptions last month)
  const canceledThisMonth = subscriptionEvents
    ?.filter(event => 
      event.event_type === 'subscription_canceled' &&
      new Date(event.created_at) >= startOfMonth
    )?.length || 0

  const activeLastMonth = subscriptionEvents
    ?.filter(event => 
      event.event_type === 'subscription_created' &&
      new Date(event.created_at) < startOfMonth
    )?.length || 1

  const churnRate = canceledThisMonth / Math.max(activeLastMonth, 1)

  // Calculate ARPU (Average Revenue Per User)
  const averageRevenuePerUser = activeCount ? totalRevenue / activeCount : 0

  // Group subscriptions by plan
  const subscriptionsByPlan = activeSubscriptions?.reduce((acc: Record<string, number>, sub) => {
    const plan = sub.subscription_tier || 'free'
    acc[plan] = (acc[plan] || 0) + 1
    return acc
  }, {}) || {}

  // Get recent subscription events (last 50)
  const { data: recentEvents } = await supabase
    .from('subscription_events')
    .select('id, event_type, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return {
    totalRevenue,
    activeSubscriptions: activeCount || 0,
    churnRate,
    averageRevenuePerUser,
    subscriptionsByPlan,
    recentEvents: recentEvents || [],
    monthlyRevenue
  }
}