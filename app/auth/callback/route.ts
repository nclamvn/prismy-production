import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    // Check for both 'next' and 'redirectTo' parameters for compatibility
    const next = requestUrl.searchParams.get('next') ?? 
                 requestUrl.searchParams.get('redirectTo') ?? 
                 '/app?welcome=1'
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    console.log('🔍 Auth callback received:', { 
      code: !!code, 
      error, 
      errorDescription, 
      next,
      redirectTo: requestUrl.searchParams.get('redirectTo'),
      allParams: Object.fromEntries(requestUrl.searchParams.entries()),
      url: requestUrl.toString()
    })

    // Debug: List all cookies to understand naming pattern
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('code-verifier') || 
      cookie.name.includes('auth-token') ||
      cookie.name.startsWith('sb-')
    )
    console.log('🍪 Available auth cookies:', authCookies.map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      isCodeVerifier: c.name.includes('code-verifier')
    })))

    // Handle OAuth errors
    if (error) {
      console.error('❌ Auth callback error:', error, errorDescription)
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', error)
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription)
      }
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
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              response.cookies.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              response.cookies.set({ name, value: '', ...options })
            },
          },
        }
      )

      console.log('🔄 Attempting code exchange with code:', code.substring(0, 20) + '...')

      // 🎯 ENHANCED: Manual code verifier fallback as per your analysis
      const codeVerifierCookie = allCookies.find(cookie => 
        cookie.name.includes('code-verifier')
      )
      
      console.log('🔑 Code verifier cookie found:', {
        found: !!codeVerifierCookie,
        name: codeVerifierCookie?.name,
        hasValue: !!codeVerifierCookie?.value
      })

      try {
        let exchangeResult;
        
        // Try standard exchange first
        const { data: { user }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError && exchangeError.message?.includes('code verifier')) {
          console.log('🔧 Standard exchange failed, trying manual code verifier...')
          
          // Extract code verifier from cookie if available
          if (codeVerifierCookie?.value) {
            let codeVerifier = codeVerifierCookie.value
            
            // Handle base64 encoded verifier
            if (codeVerifier.startsWith('base64-')) {
              try {
                codeVerifier = Buffer.from(codeVerifier.substring(7), 'base64').toString('utf-8')
                // Remove quotes if present
                codeVerifier = codeVerifier.replace(/^"|"$/g, '')
              } catch (decodeError) {
                console.error('Failed to decode base64 verifier:', decodeError)
              }
            }
            
            console.log('🔑 Using manual code verifier, length:', codeVerifier.length)
            
            // Manual exchange with code verifier
            const manualResult = await supabase.auth.exchangeCodeForSession(code, {
              codeVerifier
            })
            
            exchangeResult = manualResult
          } else {
            exchangeResult = { data: { user: null }, error: exchangeError }
          }
        } else {
          exchangeResult = { data: { user }, error: exchangeError }
        }

        const { data: { user: finalUser }, error: finalError } = exchangeResult

        console.log('✅ Code exchange result:', { 
          hasUser: !!finalUser, 
          userId: finalUser?.id,
          userEmail: finalUser?.email,
          exchangeError: finalError?.message 
        })

        if (finalError) {
          console.error('❌ Code exchange error:', finalError)
          const errorUrl = new URL('/login', requestUrl.origin)
          errorUrl.searchParams.set('error', 'auth_code_exchange_failed')
          errorUrl.searchParams.set('details', finalError.message)
          return NextResponse.redirect(errorUrl)
        }

        if (finalUser) {
          console.log('🎉 User authenticated successfully:', finalUser.email)
          
          // Initialize user credits for new users
          try {
            const { data: existingCredits } = await supabase
              .from('user_credits')
              .select('id')
              .eq('user_id', finalUser.id)
              .single()
            
            if (!existingCredits) {
              console.log('💰 Creating credits for new user:', finalUser.id)
              const { error: insertError } = await supabase
                .from('user_credits')
                .insert({
                  user_id: finalUser.id,
                  credits_left: 20,
                  credits_used: 0,
                  tier: 'free'
                })
              
              if (insertError) {
                console.error('Failed to create credits:', insertError)
              } else {
                console.log('✅ Credits created successfully for user:', finalUser.id)
              }
            } else {
              console.log('💰 User already has credits:', finalUser.id)
            }
          } catch (creditsError) {
            console.error('Credits initialization error:', creditsError)
            // Don't fail the auth flow for credits initialization
          }

          // Successful authentication - redirect to the intended page
          console.log('🚀 Redirecting to:', next)
          return response
        }
      } catch (exchangeError) {
        console.error('💥 Unexpected error during code exchange:', exchangeError)
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'exchange_exception')
        errorUrl.searchParams.set('details', 'Unexpected error during authentication')
        return NextResponse.redirect(errorUrl)
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