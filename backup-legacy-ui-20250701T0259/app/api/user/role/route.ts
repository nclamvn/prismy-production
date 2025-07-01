import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, validateAndRefreshSession } from '@/lib/supabase'
import { cookies } from 'next/headers'

/**
 * GET /api/user/role
 * Get current user's role and permissions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Validate and refresh session if needed
    const session = await validateAndRefreshSession(supabase)
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'Please sign in to check your role',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      )
    }

    const user = session.user

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, trial_credits, created_at')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user role:', userError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch user role',
          message: 'Could not retrieve user information from database',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      )
    }

    const role = userData?.role || 'unknown'
    const permissions = {
      canAccessAdmin: role === 'admin',
      canUpload: true,
      canTranslate: true,
      canUseAI: role !== 'trial' || (userData?.trial_credits || 0) > 0,
      canInviteUsers: role === 'admin',
      canViewAnalytics: true
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: role,
        trial_credits: userData?.trial_credits || 0,
        created_at: userData?.created_at,
        permissions
      },
      development_info: process.env.NODE_ENV === 'development' ? {
        instructions: role !== 'admin' ? {
          title: 'To grant admin access:',
          steps: [
            'Go to Supabase Dashboard',
            'Navigate to Table Editor → users',
            `Find your user ID: ${user.id}`,
            "Update the 'role' column to 'admin'"
          ]
        } : null
      } : undefined
    })

  } catch (error) {
    console.error('[User Role API] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to check user role',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}