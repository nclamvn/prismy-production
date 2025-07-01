import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // Generate nonce for CSP
  const nonce = crypto.randomUUID().replace(/-/g, '')
  response.headers.set('X-CSP-Nonce', nonce)

  // Simple CSP for MVP
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://vercel.live`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`, // Allow unsafe-inline for MVP
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://*.supabase.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

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

    await supabase.auth.getUser()
  } catch (error) {
    console.error('Auth error in middleware:', error)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|icons|images).*)',
  ],
}