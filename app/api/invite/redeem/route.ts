import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

interface RedeemInviteRequest {
  code: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎫 Invitation redemption API called')

    // Parse request body
    const body: RedeemInviteRequest = await request.json()
    
    if (!body.code) {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('🔍 Redeeming invitation code', {
      code: body.code,
      userId: user.id
    })

    // Call the Postgres function to redeem invitation
    const { data: result, error: redeemError } = await supabase
      .rpc('redeem_invitation_code', {
        invitation_code: body.code,
        redeeming_user_id: user.id
      })

    if (redeemError) {
      console.error('❌ Invitation redemption error:', redeemError)
      return NextResponse.json(
        { 
          error: 'Failed to redeem invitation',
          details: redeemError.message 
        },
        { status: 400 }
      )
    }

    // Check if redemption was successful
    if (!result.success) {
      console.log('❌ Invitation redemption failed:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log('✅ Invitation redeemed successfully', {
      userId: user.id,
      creditsGranted: result.credits_granted
    })

    // Return success response
    return NextResponse.json({
      success: true,
      credits_granted: result.credits_granted,
      message: result.message
    })

  } catch (error) {
    console.error('❌ Invitation redemption API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check invitation code validity (without redeeming)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check invitation validity
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('code, max_uses, current_uses, expires_at, credit_amount, is_active')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invitation code' },
        { status: 404 }
      )
    }

    // Check if expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Invitation code has expired' },
        { status: 400 }
      )
    }

    // Check if max uses reached
    if (invitation.current_uses >= invitation.max_uses) {
      return NextResponse.json(
        { valid: false, error: 'Invitation code has reached maximum uses' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      credit_amount: invitation.credit_amount,
      uses_remaining: invitation.max_uses - invitation.current_uses
    })

  } catch (error) {
    console.error('❌ Invitation check API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}