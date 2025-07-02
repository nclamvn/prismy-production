import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next =
      requestUrl.searchParams.get('next') ??
      requestUrl.searchParams.get('redirectTo') ??
      '/app?welcome=1'
    const error = requestUrl.searchParams.get('error')

    // Handle OAuth errors
    if (error) {
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

              // If looking for code verifier, try to find any matching cookie
              if (!cookie && name.includes('code-verifier')) {
                const allCookies = cookieStore.getAll()
                const codeVerifierCookie = allCookies.find(c =>
                  c.name.includes('code-verifier')
                )
                if (codeVerifierCookie) {
                  return codeVerifierCookie.value
                }
              }

              return cookie?.value
            },
            set(name: string, value: string, options: any) {
              response.cookies.set({
                name,
                value,
                ...options,
                path: '/',
                secure: true,
                sameSite: 'lax',
              })
            },
            remove(name: string, options: any) {
              response.cookies.set({
                name,
                value: '',
                ...options,
                path: '/',
                maxAge: 0,
              })
            },
          },
        }
      )

      // 🎯 SIMPLIFIED: Let Supabase handle PKCE automatically
      const {
        data: { user },
        error: exchangeError,
      } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'auth_code_exchange_failed')
        errorUrl.searchParams.set('details', exchangeError.message)
        return NextResponse.redirect(errorUrl)
      }

      if (user) {
        // Initialize user credits for new users
        try {
          const { data: existingCredits } = await supabase
            .from('user_credits')
            .select('user_id')
            .eq('user_id', user.id)
            .single()

          if (!existingCredits) {
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
                tier: 'free',
              })

            if (insertError) {
              // Silently fail - don't break auth flow for credits
            } else {
              // Credits created successfully
            }
          } else {
          }
        } catch (creditsError) {
          // Don't fail the auth flow for credits initialization
        }

        // Successful authentication - redirect to the intended page
        return response
      }
    }

    // If no code is provided, redirect to login
    const loginUrl = new URL('/login', requestUrl.origin)
    return NextResponse.redirect(loginUrl)
  } catch (error) {
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'callback_error')
    return NextResponse.redirect(errorUrl)
  }
}
