import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes, and auth callback
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/auth/debug') ||
    pathname === '/workspace-direct' ||
    pathname === '/oauth-test'
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // CSP is now handled in next.config.js for better Next.js compatibility
  // Generate nonce for future use
  const nonce = crypto.randomUUID().replace(/-/g, '')
  response.headers.set('X-CSP-Nonce', nonce)

  // Define protected routes that require authentication
  const protectedRoutes = ['/app', '/workspace', '/dashboard']
  const authRoutes = ['/login', '/auth']

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Handle auth flow with Supabase
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && (!user || error)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from auth routes
    if (isAuthRoute && user && !error) {
      const nextUrl = request.nextUrl.searchParams.get('next') || '/app'
      return NextResponse.redirect(new URL(nextUrl, request.url))
    }
  } catch (error) {
    console.error('Auth error in middleware:', error)

    // If there's an auth error on a protected route, redirect to login
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - auth/callback (OAuth callback)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - icons (icon files)
     * - images (image files)
     */
    '/((?!api/|auth/callback|_next/static|_next/image|favicon.ico|robots.txt|icons/|images/).*)',
  ],
}
