import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid invite code format' },
        { status: 400 }
      )
    }

    // Hash the provided code
    const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex')
    
    const supabase = createServerComponentClient()
    
    // Check if invite exists and is valid
    const { data: invite, error } = await supabase
      .from('invites')
      .select('*')
      .eq('code_hash', codeHash)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired invite code',
          details: error?.message 
        },
        { status: 400 }
      )
    }

    // Return invite details (without exposing sensitive data)
    return NextResponse.json({
      success: true,
      valid: true,
      credits: invite.credits_initial,
      expiresAt: invite.expires_at,
      message: `Valid invite code with ${invite.credits_initial} credits`
    })
  } catch (error) {
    console.error('Error validating invite:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}