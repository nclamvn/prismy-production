/**
 * PRISMY ADMIN INVITES API
 * Manages invite code creation, listing, and administration
 * Only accessible by admin users (enterprise tier)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Helper function to check if user is admin
async function isUserAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', userId)
    .single()
  
  return profile?.subscription_tier === 'enterprise'
}

// Helper function to generate secure invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'PRISMY-'
  
  // Generate PRISMY-XXXX-XXXX format
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  result += '-'
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// Helper function to hash invite code
function hashInviteCode(code: string): string {
  const salt = process.env.INVITE_SALT || 'prismy-default-salt'
  return crypto.createHash('sha256').update(code + salt).digest('hex')
}

/**
 * GET - List all invites (admin only)
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

    // Get query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit
    const showUsed = url.searchParams.get('showUsed') === 'true'

    // Build query
    let query = supabase
      .from('invites')
      .select(`
        id,
        code_preview,
        credits_initial,
        is_used,
        used_by,
        used_at,
        expires_at,
        metadata,
        created_at,
        auth_users:used_by(email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!showUsed) {
      query = query.eq('is_used', false)
    }

    const { data: invites, error } = await query

    if (error) {
      console.error('[Admin Invites API] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('invites')
      .select('*', { count: 'exact', head: true })
      .eq('is_used', showUsed ? undefined : false)

    return NextResponse.json({
      success: true,
      invites: invites.map((invite: any) => ({
        id: invite.id,
        code: invite.code_preview + '...',
        credits: invite.credits_initial,
        isUsed: invite.is_used,
        usedBy: invite.auth_users?.email || null,
        usedAt: invite.used_at,
        expiresAt: invite.expires_at,
        metadata: invite.metadata,
        createdAt: invite.created_at
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('[Admin Invites API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new invite code (admin only)
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

    // Check admin privileges
    if (!(await isUserAdmin(supabase, session.user.id))) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      credits = 500,
      expiryDays = 30,
      purpose = '',
      batchSize = 1
    } = body

    // Validate input
    if (credits < 1 || credits > 10000) {
      return NextResponse.json(
        { error: 'Credits must be between 1 and 10,000' },
        { status: 400 }
      )
    }

    if (batchSize < 1 || batchSize > 50) {
      return NextResponse.json(
        { error: 'Batch size must be between 1 and 50' },
        { status: 400 }
      )
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Math.max(1, Math.min(365, expiryDays)))

    // Generate invite codes
    const invitesToCreate = []
    const generatedCodes = []

    for (let i = 0; i < batchSize; i++) {
      const inviteCode = generateInviteCode()
      const codeHash = hashInviteCode(inviteCode)
      const codePreview = inviteCode.substring(0, 8) // Show "PRISMY-XX"

      invitesToCreate.push({
        code_hash: codeHash,
        code_preview: codePreview,
        credits_initial: credits,
        expires_at: expiresAt.toISOString(),
        created_by: session.user.id,
        metadata: {
          purpose,
          batchId: crypto.randomUUID(),
          createdByEmail: session.user.email
        }
      })

      generatedCodes.push({
        code: inviteCode,
        preview: codePreview,
        credits,
        expiresAt: expiresAt.toISOString()
      })
    }

    // Insert into database
    const { data: createdInvites, error } = await supabase
      .from('invites')
      .insert(invitesToCreate)
      .select('id, code_preview, credits_initial, expires_at, created_at')

    if (error) {
      console.error('[Admin Invites API] Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create invite codes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Created ${batchSize} invite code(s)`,
      invites: generatedCodes,
      created: createdInvites?.length || 0
    })

  } catch (error) {
    console.error('[Admin Invites API] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Revoke/expire invite codes (admin only)
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json()
    const { inviteIds } = body

    if (!Array.isArray(inviteIds) || inviteIds.length === 0) {
      return NextResponse.json(
        { error: 'Invite IDs array required' },
        { status: 400 }
      )
    }

    // Expire the invites (set expires_at to now)
    const { data, error } = await supabase
      .from('invites')
      .update({
        expires_at: new Date().toISOString(),
        metadata: {
          revokedBy: session.user.id,
          revokedAt: new Date().toISOString()
        }
      })
      .in('id', inviteIds)
      .eq('is_used', false) // Only revoke unused invites
      .select('id, code_preview')

    if (error) {
      console.error('[Admin Invites API] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to revoke invite codes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Revoked ${data?.length || 0} invite code(s)`,
      revoked: data
    })

  } catch (error) {
    console.error('[Admin Invites API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}