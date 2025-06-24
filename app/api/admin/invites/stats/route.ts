/**
 * PRISMY ADMIN INVITE STATISTICS API
 * Provides aggregated statistics about invite codes usage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Helper function to check if user is admin
async function isUserAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', userId)
    .single()
  
  return profile?.subscription_tier === 'enterprise'
}

/**
 * GET - Get invite statistics (admin only)
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

    // Check admin privileges
    if (!(await isUserAdmin(supabase, session.user.id))) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Get current timestamp for expiry calculations
    const now = new Date().toISOString()

    // Get basic invite counts
    const [totalResult, usedResult, expiredResult] = await Promise.all([
      // Total invites
      supabase
        .from('invites')
        .select('*', { count: 'exact', head: true }),
      
      // Used invites
      supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', true),
      
      // Expired invites (unused and past expiry date)
      supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', false)
        .lt('expires_at', now)
    ])

    const total = totalResult.count || 0
    const used = usedResult.count || 0
    const expired = expiredResult.count || 0
    const active = total - used - expired

    // Get credits statistics
    const { data: inviteData } = await supabase
      .from('invites')
      .select('credits_initial, is_used, created_at, used_at')

    let totalCreditsIssued = 0
    let totalCreditsRedeemed = 0
    let redemptionTimes: number[] = []

    if (inviteData) {
      for (const invite of inviteData) {
        totalCreditsIssued += invite.credits_initial
        
        if (invite.is_used) {
          totalCreditsRedeemed += invite.credits_initial
          
          // Calculate redemption time if both dates exist
          if (invite.created_at && invite.used_at) {
            const created = new Date(invite.created_at).getTime()
            const used = new Date(invite.used_at).getTime()
            redemptionTimes.push(used - created)
          }
        }
      }
    }

    // Calculate average redemption time (in hours)
    const averageRedemptionTime = redemptionTimes.length > 0
      ? redemptionTimes.reduce((sum, time) => sum + time, 0) / redemptionTimes.length / (1000 * 60 * 60)
      : 0

    // Get usage over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentUsage } = await supabase
      .from('invites')
      .select('used_at, credits_initial')
      .eq('is_used', true)
      .gte('used_at', thirtyDaysAgo.toISOString())
      .order('used_at', { ascending: true })

    // Group by day
    const dailyStats: Record<string, { invites: number; credits: number }> = {}
    
    if (recentUsage) {
      for (const usage of recentUsage) {
        const date = new Date(usage.used_at).toISOString().split('T')[0]
        if (!dailyStats[date]) {
          dailyStats[date] = { invites: 0, credits: 0 }
        }
        dailyStats[date].invites += 1
        dailyStats[date].credits += usage.credits_initial
      }
    }

    // Get top users by credits redeemed
    const { data: topUsers } = await supabase
      .from('user_credits')
      .select('user_id, total_earned')
      .order('total_earned', { ascending: false })
      .limit(10)

    // Get user details for top users
    let topUsersWithDetails = []
    if (topUsers && topUsers.length > 0) {
      const userIds = topUsers.map(u => u.user_id)
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', userIds)

      const { data: authUsers } = await supabase.auth.admin.listUsers()
      
      topUsersWithDetails = topUsers.map(user => {
        const profile = userProfiles?.find(p => p.user_id === user.user_id)
        const authUser = authUsers.data?.users?.find(u => u.id === user.user_id)
        
        return {
          userId: user.user_id,
          name: profile?.full_name || 'Unknown',
          email: authUser?.email || 'Unknown',
          creditsEarned: user.total_earned
        }
      })
    }

    // Calculate conversion rate (invites used vs created)
    const conversionRate = total > 0 ? (used / total) * 100 : 0

    return NextResponse.json({
      success: true,
      stats: {
        // Basic counts
        total,
        used,
        expired,
        active,
        
        // Credits
        totalCreditsIssued,
        totalCreditsRedeemed,
        averageCreditsPerInvite: total > 0 ? totalCreditsIssued / total : 0,
        
        // Timing
        averageRedemptionTime: Math.round(averageRedemptionTime * 100) / 100, // Round to 2 decimals
        
        // Performance
        conversionRate: Math.round(conversionRate * 100) / 100,
        
        // Trends
        dailyUsage: dailyStats,
        topUsers: topUsersWithDetails.slice(0, 5), // Top 5 users
        
        // Meta
        generatedAt: new Date().toISOString(),
        period: '30 days'
      }
    })

  } catch (error) {
    console.error('[Admin Invite Stats API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}