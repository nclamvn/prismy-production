import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  // Content Security Policy - Ultra permissive for emergency fix
  const csp = [
    'default-src *',
    "script-src * 'unsafe-inline' 'unsafe-eval'",
    "style-src * 'unsafe-inline'",
    'font-src *',
    'img-src * data: blob:',
    'media-src * data: blob:',
    "object-src 'none'",
    "base-uri 'self'",
    'form-action *',
    "frame-ancestors 'none'",
    'connect-src * wss: data: blob:',
    'worker-src * blob:',
    'child-src *',
    'frame-src *',
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Strict Transport Security (HSTS) - only for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Additional security headers
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Simplified matcher for maximum compatibility
     * Exclude all static assets and API routes
     */
    '/((?!_next|api|favicon.ico|robots.txt|manifest.json).*)',
  ],
}
