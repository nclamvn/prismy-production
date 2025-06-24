/**
 * PRISMY INVITE REDEMPTION API
 * Allows authenticated users to redeem invite codes for credits
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Helper function to hash invite code
function hashInviteCode(code: string): string {
  const salt = process.env.INVITE_SALT || 'prismy-default-salt'
  return crypto.createHash('sha256').update(code + salt).digest('hex')
}

// Helper function to validate invite code format
function isValidInviteFormat(code: string): boolean {
  // Expected format: PRISMY-XXXX-XXXX
  const pattern = /^PRISMY-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return pattern.test(code.toUpperCase())
}

/**
 * POST - Redeem invite code
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

    // Parse request body
    const body = await request.json()
    const { inviteCode } = body

    // Validate input
    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    const cleanCode = inviteCode.trim().toUpperCase()
    if (!isValidInviteFormat(cleanCode)) {
      return NextResponse.json(
        { error: 'Invalid invite code format. Expected: PRISMY-XXXX-XXXX' },
        { status: 400 }
      )
    }

    // Check if user already has credits (prevent multiple redemptions)
    const { data: existingCredits } = await supabase
      .from('user_credits')
      .select('credits_left, invite_code_used')
      .eq('user_id', session.user.id)
      .single()

    if (existingCredits && existingCredits.invite_code_used) {
      return NextResponse.json(
        { 
          error: 'Invite code already redeemed',
          message: `You have already redeemed invite code: ${existingCredits.invite_code_used}`,
          currentCredits: existingCredits.credits_left
        },
        { status: 409 }
      )
    }

    // Hash the invite code for lookup
    const codeHash = hashInviteCode(cleanCode)

    // Start transaction-like operation
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('id, credits_initial, is_used, expires_at, used_by')
      .eq('code_hash', codeHash)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    // Validate invite status
    if (invite.is_used) {
      return NextResponse.json(
        { 
          error: 'Invite code already used',
          message: 'This invite code has already been redeemed by another user'
        },
        { status: 409 }
      )
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { 
          error: 'Invite code expired',
          message: 'This invite code has expired'
        },
        { status: 410 }
      )
    }

    // Mark invite as used first (atomic operation)
    const { error: updateInviteError } = await supabase
      .from('invites')
      .update({
        is_used: true,
        used_by: session.user.id,
        used_at: new Date().toISOString(),
        metadata: {
          ...invite.metadata,
          redeemedByEmail: session.user.email,
          redeemedAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent')
        }
      })
      .eq('id', invite.id)
      .eq('is_used', false) // Only update if still unused (race condition prevention)

    if (updateInviteError) {
      console.error('[Redeem Invite] Invite update error:', updateInviteError)
      return NextResponse.json(
        { error: 'Failed to process invite code. It may have been used by another user.' },
        { status: 409 }
      )
    }

    // Add credits to user account using SQL function
    const { data: creditResult, error: creditError } = await supabase
      .rpc('add_credits', {
        _user_id: session.user.id,
        _credits_amount: invite.credits_initial,
        _source: 'invite',
        _metadata: {
          inviteCode: cleanCode,
          inviteId: invite.id
        }
      })

    if (creditError || !creditResult?.success) {
      console.error('[Redeem Invite] Credit addition error:', creditError, creditResult)
      
      // Rollback invite status
      await supabase
        .from('invites')
        .update({
          is_used: false,
          used_by: null,
          used_at: null
        })
        .eq('id', invite.id)

      return NextResponse.json(
        { error: 'Failed to add credits to your account. Please try again.' },
        { status: 500 }
      )
    }

    // Update user_credits with invite tracking
    const { error: trackingError } = await supabase
      .from('user_credits')
      .update({
        invite_code_used: cleanCode,
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days trial
      })
      .eq('user_id', session.user.id)

    if (trackingError) {
      console.warn('[Redeem Invite] Tracking update warning:', trackingError)
      // Don't fail the whole operation for tracking errors
    }

    // Log successful redemption
    console.log(`[Redeem Invite] Success: User ${session.user.email} redeemed ${invite.credits_initial} credits`)

    return NextResponse.json({
      success: true,
      message: 'Invite code redeemed successfully!',
      credits: {
        added: invite.credits_initial,
        total: creditResult.credits_total
      },
      trial: {
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    })

  } catch (error) {
    console.error('[Redeem Invite API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check if user needs to redeem invite code
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

    // Check if user has credits account
    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits_left, invite_code_used, trial_ends_at, created_at')
      .eq('user_id', session.user.id)
      .single()

    const needsInvite = !credits || credits.credits_left === 0
    const hasActiveCredits = credits && credits.credits_left > 0
    const trialExpired = credits?.trial_ends_at && new Date(credits.trial_ends_at) < new Date()

    return NextResponse.json({
      success: true,
      user: {
        email: session.user.email,
        hasCredits: hasActiveCredits,
        needsInvite,
        inviteUsed: credits?.invite_code_used || null,
        trialExpired,
        trialEndsAt: credits?.trial_ends_at || null,
        creditsLeft: credits?.credits_left || 0,
        accountCreated: credits?.created_at || null
      }
    })

  } catch (error) {
    console.error('[Redeem Invite API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}