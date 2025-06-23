import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Enhanced error types for better debugging
enum AuthCallbackError {
  NO_CODE = 'no_code',
  EXCHANGE_FAILED = 'exchange_failed',
  INVALID_SESSION = 'invalid_session',
  INVALID_REDIRECT = 'invalid_redirect',
  SUPABASE_ERROR = 'supabase_error',
  UNKNOWN_ERROR = 'unknown_error',
}

function createErrorUrl(
  origin: string,
  error: AuthCallbackError,
  details?: string
): URL {
  const url = new URL('/', origin)
  url.searchParams.set('auth_error', error)
  if (details) {
    url.searchParams.set('error_details', details)
  }
  return url
}

function validateRedirectUrl(redirectTo: string, origin: string): boolean {
  try {
    const url = new URL(redirectTo, origin)
    // Only allow same-origin redirects for security
    return url.origin === origin
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Enhanced logging for debugging
  console.log('🔄 Auth callback initiated:', {
    code: code ? 'present' : 'missing',
    error: error || 'none',
    origin: requestUrl.origin,
    searchParams: Object.fromEntries(requestUrl.searchParams),
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  })

  // Handle OAuth errors from provider
  if (error) {
    console.error('❌ OAuth provider error:', { error, errorDescription })
    return NextResponse.redirect(
      createErrorUrl(requestUrl.origin, AuthCallbackError.SUPABASE_ERROR, error)
    )
  }

  // Handle missing code
  if (!code) {
    console.error('❌ No authorization code provided in callback')
    return NextResponse.redirect(
      createErrorUrl(requestUrl.origin, AuthCallbackError.NO_CODE)
    )
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    console.log('🔄 Creating Supabase client for session exchange...')

    // Exchange code for session with timeout
    console.log(
      '🔄 Starting session exchange with code:',
      code.substring(0, 10) + '...'
    )

    const exchangePromise = supabase.auth.exchangeCodeForSession(code)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth exchange timeout')), 10000)
    )

    const exchangeResult = (await Promise.race([
      exchangePromise,
      timeoutPromise,
    ])) as any

    console.log('🔄 Session exchange result:', {
      hasData: !!exchangeResult.data,
      hasError: !!exchangeResult.error,
      hasSession: !!exchangeResult.data?.session,
      hasUser: !!exchangeResult.data?.user,
      sessionId: exchangeResult.data?.session?.id,
      userId: exchangeResult.data?.user?.id,
      userEmail: exchangeResult.data?.user?.email,
      errorMessage: exchangeResult.error?.message,
    })

    const { data, error: exchangeError } = exchangeResult

    if (exchangeError) {
      console.error('❌ Auth exchange error details:', {
        message: exchangeError.message,
        code: exchangeError.code,
        details: exchangeError.details,
        hint: exchangeError.hint,
        full: exchangeError,
      })
      return NextResponse.redirect(
        createErrorUrl(
          requestUrl.origin,
          AuthCallbackError.EXCHANGE_FAILED,
          exchangeError.message
        )
      )
    }

    // Verify session was created
    if (!data?.session || !data?.user) {
      console.error('❌ No session created after successful exchange:', {
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        sessionData: data?.session
          ? {
              id: data.session.id,
              expires_at: data.session.expires_at,
              access_token: data.session.access_token ? 'present' : 'missing',
            }
          : null,
        userData: data?.user
          ? {
              id: data.user.id,
              email: data.user.email,
              provider: data.user.app_metadata?.provider,
            }
          : null,
      })
      return NextResponse.redirect(
        createErrorUrl(requestUrl.origin, AuthCallbackError.INVALID_SESSION)
      )
    }

    console.log('✅ Session successfully created:', {
      sessionId: data.session.id,
      userId: data.user.id,
      userEmail: data.user.email,
      provider: data.user.app_metadata?.provider,
      expiresAt: data.session.expires_at,
    })

    // Get and validate redirect URL
    const redirectTo =
      requestUrl.searchParams.get('redirect_to') ||
      requestUrl.searchParams.get('redirectTo') ||
      '/workspace'

    if (!validateRedirectUrl(redirectTo, requestUrl.origin)) {
      console.error('❌ Invalid redirect URL:', redirectTo)
      return NextResponse.redirect(
        createErrorUrl(
          requestUrl.origin,
          AuthCallbackError.INVALID_REDIRECT,
          redirectTo
        )
      )
    }

    console.log('✅ Auth callback successful - preparing redirect:', {
      userId: data.user.id,
      email: data.user.email,
      redirectTo,
      sessionExists: !!data.session,
      sessionId: data.session.id,
    })

    // Create response with session cookies and redirect
    const redirectUrl = new URL(redirectTo, requestUrl.origin)
    console.log('🔄 Creating redirect response to:', redirectUrl.toString())

    const response = NextResponse.redirect(redirectUrl)

    // Debug cookie information
    console.log('🔄 Checking response cookies...')
    const cookieHeader = response.headers.get('set-cookie')
    console.log('🍪 Response cookies:', {
      hasCookies: !!cookieHeader,
      cookieCount: cookieHeader ? cookieHeader.split(',').length : 0,
      cookieHeader: cookieHeader
        ? cookieHeader.substring(0, 200) + '...'
        : 'none',
    })

    // Try to manually verify session was persisted
    try {
      const { data: verifyData } = await supabase.auth.getSession()
      console.log('🔄 Session verification after creation:', {
        hasSession: !!verifyData.session,
        sessionId: verifyData.session?.id,
        matches: verifyData.session?.id === data.session.id,
      })
    } catch (verifyError) {
      console.error('❌ Session verification failed:', verifyError)
    }

    console.log('✅ Redirecting to:', redirectUrl.toString())
    return response
  } catch (error: any) {
    console.error('❌ Critical auth callback error:', {
      error: error.message,
      stack: error.stack,
      code,
      origin: requestUrl.origin,
    })

    return NextResponse.redirect(
      createErrorUrl(
        requestUrl.origin,
        AuthCallbackError.UNKNOWN_ERROR,
        error.message
      )
    )
  }
}
