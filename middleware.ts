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

  // CSP is now handled in next.config.js for better Next.js compatibility
  // Generate nonce for future use
  const nonce = crypto.randomUUID().replace(/-/g, '')
  response.headers.set('X-CSP-Nonce', nonce)

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