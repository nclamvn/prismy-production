import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  // 🚨 ULTRA DEBUG: Log EVERY callback attempt
  console.log('🚨 [AUTH CALLBACK] Request received:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent')
  })
  
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
              const value = cookieStore.get(name)?.value
              console.log(`🍪 [COOKIE GET] ${name}:`, { hasValue: !!value, length: value?.length })
              return value
            },
            set(name: string, value: string, options: any) {
              console.log(`🍪 [COOKIE SET] ${name}:`, { hasValue: !!value, length: value?.length, options })
              // 🎯 FORCE consistent cookie settings
              const cookieOptions = {
                ...options,
                domain: undefined, // Let browser set domain automatically
                path: '/', // Ensure root path
                secure: true, // HTTPS only
                sameSite: 'lax' as const // Allow cross-site for OAuth
              }
              response.cookies.set({ name, value, ...cookieOptions })
            },
            remove(name: string, options: any) {
              console.log(`🍪 [COOKIE REMOVE] ${name}`)
              response.cookies.set({ 
                name, 
                value: '', 
                ...options,
                domain: undefined,
                path: '/',
                maxAge: 0
              })
            },
          },
        }
      )

      console.log('🔄 Attempting code exchange with code:', code.substring(0, 20) + '...')

      // 🎯 FIXED: Use correct Supabase PKCE cookie pattern
      // Pattern: sb-prismy-auth-prismy-{timestamp}-{random}-code-verifier
      let codeVerifierCookie = allCookies.find(cookie => 
        cookie.name.includes('code-verifier') && cookie.name.startsWith('sb-')
      )
      
      // Fallback patterns
      if (!codeVerifierCookie) {
        const patterns = [
          'code-verifier',
          'code_verifier', 
          'sb-code-verifier',
          'supabase-code-verifier',
          'pkce-code-verifier'
        ]
        
        for (const pattern of patterns) {
          codeVerifierCookie = allCookies.find(cookie => 
            cookie.name.includes(pattern)
          )
          if (codeVerifierCookie) break
        }
      }
      
      console.log('🔑 Code verifier search result:', {
        found: !!codeVerifierCookie,
        name: codeVerifierCookie?.name,
        hasValue: !!codeVerifierCookie?.value,
        patternsChecked: codeVerifierPatterns,
        totalCookies: allCookies.length,
        authCookieNames: authCookies.map(c => c.name)
      })

      try {
        let exchangeResult;
        
        // 🎯 STRATEGY 1: Try standard exchange first (should work if PKCE is properly handled)
        console.log('🔄 [STEP 1] Attempting standard code exchange...')
        const { data: { user }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.log('🔧 [STEP 1 FAILED] Standard exchange failed:', exchangeError.message)
          
          if (exchangeError.message?.includes('code verifier') || exchangeError.message?.includes('PKCE')) {
            console.log('🔧 [STEP 2] PKCE-related error, trying manual code verifier...')
            
            // Extract code verifier from cookie if available
            if (codeVerifierCookie?.value) {
              let codeVerifier = codeVerifierCookie.value
              
              // 🎯 FIXED: Handle Supabase base64 encoding format
              if (codeVerifier.startsWith('base64-')) {
                try {
                  // Remove base64- prefix and decode
                  const base64Data = codeVerifier.substring(7)
                  codeVerifier = Buffer.from(base64Data, 'base64').toString('utf-8')
                  
                  // Remove surrounding quotes if present
                  codeVerifier = codeVerifier.replace(/^"|"$/g, '')
                  
                  console.log('🔑 Decoded base64 code verifier:', {
                    originalLength: base64Data.length,
                    decodedLength: codeVerifier.length,
                    starts: codeVerifier.substring(0, 10)
                  })
                } catch (decodeError) {
                  console.error('Failed to decode base64 verifier:', decodeError)
                }
              }
              
              // Try JSON parse if it looks like JSON
              if (codeVerifier.startsWith('{') || codeVerifier.startsWith('"')) {
                try {
                  const parsed = JSON.parse(codeVerifier)
                  codeVerifier = typeof parsed === 'string' ? parsed : codeVerifier
                } catch (jsonError) {
                  console.log('Not JSON format, using as-is')
                }
              }
              
              console.log('🔑 [STEP 2] Using manual code verifier:', {
                length: codeVerifier.length,
                starts: codeVerifier.substring(0, 10),
                type: typeof codeVerifier
              })
              
              // Manual exchange with code verifier
              const manualResult = await supabase.auth.exchangeCodeForSession(code)
              exchangeResult = manualResult
            } else {
              console.log('🚨 [STEP 2 FAILED] No code verifier found in cookies')
              
              // 🎯 STRATEGY 3: Try without PKCE as last resort (older OAuth flow)
              console.log('🔧 [STEP 3] Attempting legacy OAuth flow without PKCE...')
              try {
                // Create fresh supabase client and try basic exchange
                const legacyResult = await supabase.auth.exchangeCodeForSession(code)
                exchangeResult = legacyResult
              } catch (legacyError) {
                console.error('🚨 [STEP 3 FAILED] Legacy flow also failed:', legacyError)
                exchangeResult = { data: { user: null }, error: exchangeError }
              }
            }
          } else {
            console.log('🚨 Non-PKCE error:', exchangeError.message)
            exchangeResult = { data: { user: null }, error: exchangeError }
          }
        } else {
          console.log('✅ [STEP 1 SUCCESS] Standard exchange worked!')
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
              .select('user_id')
              .eq('user_id', finalUser.id)
              .single()
            
            if (!existingCredits) {
              console.log('💰 Creating credits for new user:', finalUser.id)
              
              // 🎯 SIMPLE: Basic credit creation without optional fields
              const { error: insertError } = await supabase
                .from('user_credits')
                .insert({
                  user_id: finalUser.id,
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
                console.error('Database schema mismatch. Actual error details:', {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint
                })
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