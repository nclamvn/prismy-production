/**
 * WebSocket Token Endpoint - Phase 3.4-A
 * Generates JWT tokens for WebSocket authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const WS_JWT_SECRET = process.env.WS_JWT_SECRET || 'fallback-ws-secret'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('[WS TOKEN] Generating WebSocket authentication token')

    // Get session from cookies
    const sessionId = request.cookies.get('session_id')?.value
    
    // Create Supabase client to get user info
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Try to get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    let userId: string | undefined
    let orgId: string | undefined
    
    if (session?.user) {
      userId = session.user.id
      // Get org_id from user metadata or profile
      orgId = session.user.user_metadata?.org_id || session.user.app_metadata?.org_id
    }

    // Generate WebSocket JWT token
    const token = jwt.sign(
      {
        userId,
        sessionId,
        orgId,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
      },
      WS_JWT_SECRET
    )

    console.log('[WS TOKEN] Token generated successfully', {
      userId: userId ? `${userId.substring(0, 8)}...` : 'anonymous',
      sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : 'none',
      orgId: orgId || 'none'
    })

    return NextResponse.json({
      success: true,
      token,
      expiresIn: 3600,
      issuedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('[WS TOKEN] Token generation failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate WebSocket token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}