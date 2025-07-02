import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🚨 [AUTH CALLBACK] Request received:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    cookies: request.cookies.getAll().map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length,
      valuePreview: c.value?.substring(0, 50)
    }))
  })
  
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? 
                 requestUrl.searchParams.get('redirectTo') ?? 
                 '/app?welcome=1'
    const error = requestUrl.searchParams.get('error')

    console.log('🔍 Auth callback params:', { 
      code: !!code, 
      error, 
      next
    })

    // Handle OAuth errors
    if (error) {
      console.error('❌ Auth callback error:', error)
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', error)
      return NextResponse.redirect(errorUrl)
    }

    if (code) {
      // Create response for cookie management
      const response = NextResponse.redirect(new URL(next, requestUrl.origin))
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const cookieStore = cookies()
              const cookie = cookieStore.get(name)
              console.log(`🍪 [COOKIE GET] ${name}:`, { 
                hasValue: !!cookie?.value,
                valueLength: cookie?.value?.length,
                isCodeVerifier: name.includes('code-verifier')
              })
              
              // If looking for code verifier, try to find any matching cookie
              if (!cookie && name.includes('code-verifier')) {
                const allCookies = cookieStore.getAll()
                const codeVerifierCookie = allCookies.find(c => c.name.includes('code-verifier'))
                if (codeVerifierCookie) {
                  console.log(`🔑 Found alternative code verifier: ${codeVerifierCookie.name}`)
                  return codeVerifierCookie.value
                }
              }
              
              return cookie?.value
            },
            set(name: string, value: string, options: any) {
              console.log(`🍪 [COOKIE SET] ${name}:`, { hasValue: !!value })
              response.cookies.set({ name, value, ...options, path: '/', secure: true, sameSite: 'lax' })
            },
            remove(name: string, options: any) {
              console.log(`🍪 [COOKIE REMOVE] ${name}`)
              response.cookies.set({ name, value: '', ...options, path: '/', maxAge: 0 })
            },
          },
        }
      )

      console.log('🔄 Attempting code exchange...')
      
      // Debug: List all cookies before exchange
      const cookieStore = cookies()
      const allCookies = cookieStore.getAll()
      console.log('🍪 All available cookies:', allCookies.map(c => ({
        name: c.name,
        isCodeVerifier: c.name.includes('code-verifier'),
        valueLength: c.value?.length
      })))

      // 🎯 SIMPLIFIED: Let Supabase handle PKCE automatically
      const { data: { user }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      console.log('✅ Code exchange result:', { 
        hasUser: !!user, 
        userId: user?.id,
        userEmail: user?.email,
        error: exchangeError?.message 
      })

      if (exchangeError) {
        console.error('❌ Code exchange error:', exchangeError)
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'auth_code_exchange_failed')
        errorUrl.searchParams.set('details', exchangeError.message)
        return NextResponse.redirect(errorUrl)
      }

      if (user) {
        console.log('🎉 User authenticated successfully:', user.email)
        
        // Initialize user credits for new users
        try {
          const { data: existingCredits } = await supabase
            .from('user_credits')
            .select('user_id')
            .eq('user_id', user.id)
            .single()
          
          if (!existingCredits) {
            console.log('💰 Creating credits for new user:', user.id)
            
            const { error: insertError } = await supabase
              .from('user_credits')
              .insert({
                user_id: user.id,
                credits_left: 20,
                total_earned: 20,
                total_spent: 0,
                trial_credits: 20,
                purchased_credits: 0,
                daily_usage_count: 0,
                daily_usage_reset: new Date().toISOString().split('T')[0],
                tier: 'free'
              })
            
            if (insertError) {
              console.error('❌ Failed to create credits:', insertError)
            } else {
              console.log('✅ Credits created successfully for user:', user.id)
            }
          } else {
            console.log('💰 User already has credits:', user.id)
          }
        } catch (creditsError) {
          console.error('Credits initialization error:', creditsError)
          // Don't fail the auth flow for credits initialization
        }

        // Successful authentication - redirect to the intended page
        console.log('🚀 Redirecting to:', next)
        return response
      }
    }

    // If no code is provided, redirect to login
    const loginUrl = new URL('/login', requestUrl.origin)
    return NextResponse.redirect(loginUrl)

  } catch (error) {
    console.error('💥 Auth callback error:', error)
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'callback_error')
    return NextResponse.redirect(errorUrl)
  }
}