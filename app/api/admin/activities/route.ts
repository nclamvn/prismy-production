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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const supabase = createServerComponentClient()
    
    // Fetch recent activities from multiple sources
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    // Get recent signups
    const { data: recentSignups } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .gte('created_at', dayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)
    
    // Get recent invite redemptions
    const { data: recentRedemptions } = await supabase
      .from('invites')
      .select('id, used_by, used_at, auth_users!used_by(email)')
      .eq('is_used', true)
      .gte('used_at', dayAgo.toISOString())
      .order('used_at', { ascending: false })
      .limit(limit)
    
    // Get recent translations
    const { data: recentTranslations } = await supabase
      .from('translations')
      .select('id, user_id, created_at, source_language, target_language, auth_users!user_id(email)')
      .gte('created_at', dayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)
    
    // Combine and format activities
    const activities = []
    
    // Add signups
    recentSignups?.forEach(signup => {
      activities.push({
        id: `signup_${signup.id}`,
        type: 'signup' as const,
        user: signup.email || 'Unknown',
        details: 'New user signed up',
        timestamp: signup.created_at
      })
    })
    
    // Add redemptions
    recentRedemptions?.forEach(redemption => {
      if (redemption.auth_users) {
        activities.push({
          id: `redemption_${redemption.id}`,
          type: 'invite_redeemed' as const,
          user: redemption.auth_users.email || 'Unknown',
          details: 'Redeemed invite code',
          timestamp: redemption.used_at
        })
      }
    })
    
    // Add translations
    recentTranslations?.forEach(translation => {
      if (translation.auth_users) {
        activities.push({
          id: `translation_${translation.id}`,
          type: 'translation' as const,
          user: translation.auth_users.email || 'Unknown',
          details: `Translated from ${translation.source_language} to ${translation.target_language}`,
          timestamp: translation.created_at
        })
      }
    })
    
    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const limitedActivities = activities.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      activities: limitedActivities,
      total: activities.length
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}