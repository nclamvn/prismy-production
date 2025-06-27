import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { checkAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const supabase = createServerComponentClient()
    
    // Gather all metrics in parallel
    const [
      usersData,
      invitesData,
      creditsData,
      translationsData,
      recentActivityData
    ] = await Promise.all([
      // User metrics
      supabase.from('auth.users').select('id, created_at', { count: 'exact' }),
      
      // Invite metrics
      supabase.from('invites').select('is_used, credits_initial'),
      
      // Credits metrics
      supabase.from('user_credits').select('credits_left, total_earned, total_spent'),
      
      // Translation metrics
      supabase.from('translations')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // Recent activity (last 24h)
      supabase.from('auth.users')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    // Calculate metrics
    const totalUsers = usersData.count || 0
    const activeUsers24h = recentActivityData.data?.length || 0
    
    const totalInvites = invitesData.data?.length || 0
    const usedInvites = invitesData.data?.filter(i => i.is_used).length || 0
    const totalCreditsIssued = invitesData.data?.reduce((sum, i) => sum + (i.credits_initial || 0), 0) || 0
    
    const totalCreditsUsed = creditsData.data?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0
    const averageCreditsPerUser = totalUsers > 0 ? Math.round(totalCreditsUsed / totalUsers) : 0
    
    const translationsToday = translationsData.data?.length || 0
    
    // Get total translations
    const { count: translationsTotal } = await supabase
      .from('translations')
      .select('*', { count: 'exact', head: true })
    
    // Calculate system health (simplified)
    const errorRate = Math.random() * 2 // Placeholder - implement real error tracking
    const apiLatency = 150 + Math.random() * 100 // Placeholder - implement real latency tracking
    
    let systemHealth: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (errorRate > 5 || apiLatency > 500) {
      systemHealth = 'down'
    } else if (errorRate > 2 || apiLatency > 300) {
      systemHealth = 'degraded'
    }

    const metrics = {
      totalUsers,
      activeUsers24h,
      totalInvites,
      usedInvites,
      totalCreditsIssued,
      totalCreditsUsed,
      averageCreditsPerUser,
      translationsToday,
      translationsTotal: translationsTotal || 0,
      systemHealth,
      apiLatency: Math.round(apiLatency),
      errorRate
    }

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}