import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🔥 SIMPLE AUTH ROUTE CALLED')
  
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({ error: 'No auth code provided' }, { status: 400 })
    }
    
    console.log('🔥 Auth code received:', code.substring(0, 10) + '...')
    
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    console.log('🔥 Attempting simple code exchange...')
    
    // Try to get session first - maybe user is already authenticated
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      console.log('🔥 User already has session:', sessionData.session.user.email)
      return NextResponse.json({ 
        success: true, 
        user: sessionData.session.user.email,
        userId: sessionData.session.user.id,
        method: 'existing_session'
      })
    }
    
    // Try code exchange without PKCE
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('🔥 Exchange error:', error)
      return NextResponse.json({ 
        error: 'Code exchange failed', 
        details: error.message 
      }, { status: 400 })
    }
    
    if (data.user) {
      console.log('🔥 User authenticated:', data.user.email)
      return NextResponse.json({ 
        success: true, 
        user: data.user.email,
        userId: data.user.id 
      })
    }
    
    return NextResponse.json({ error: 'No user returned' }, { status: 400 })
    
  } catch (error) {
    console.error('🔥 Simple auth error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}