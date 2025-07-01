import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n/config'

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 100
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, RateLimitEntry>()

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes, and locale routes
  if (
    pathname === '/manifest.json' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/locales/') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/) ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  try {
    // Handle i18n routing first
    const i18nResponse = await handleI18nRouting(request)
    if (i18nResponse) {
      return i18nResponse
    }

    // Apply rate limiting
    if (await shouldRateLimit(request)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + 60).toString()
        }
      })
    }

    // Enhanced security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
    
    // Generate nonce for secure inline scripts/styles
    const nonce = crypto.randomUUID().replace(/-/g, '')
    
    // Store nonce in request headers for use in pages
    response.headers.set('X-CSP-Nonce', nonce)
    
    // Master Prompt compliant CSP - with specific hashes for runtime styles
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://vercel.live 'unsafe-eval'`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com 'unsafe-inline' 'sha256-fmrAi/Sk2PEewIwSMQeP06lkuW9P4P+oXzvxtdiJLss=' 'sha256-boWXoz//DN4J+l44X2HhTsFoy4ZgTIiXnBVRhjYzrmU=' 'sha256-6rHe2UdCy+b7O+z/hWKEjl2UTI/QqAP4U/z/KA/Xcd4=' 'sha256-PvDbtlI4ms8D+C8D1go4LeFtlDyy2zxwVEbM1I4SqZ0=' 'sha256-/1kJ+/3WZMt6qpqGtoBVLdmMoH1y7O9vr97hGMdQoN8=' 'sha256-BtexNHBrCeQHBenkkFeOt6gFJAYAjsmpMl2uKOPFfTA=' 'sha256-cQnQn0wqjCahcTyKwJT4/I5xdTCfn3o9D/T82OuIr2g=' 'sha256-n3W/MMDH20xby1RcHM/j8XxMMTVNPIiU4944F036Yr0='`,
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.com https://translation.googleapis.com https://api.openai.com https://api.anthropic.com https://vercel.live wss://*.supabase.co",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "worker-src 'self' blob:",
      "manifest-src 'self'"
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', csp)

    // HSTS for HTTPS
    if (request.nextUrl.protocol === 'https:') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }

    // Handle API routes with enhanced security
    if (pathname.startsWith('/api/')) {
      return await handleAPIRequest(request, response)
    }

    // Handle authentication flow
    if (pathname.startsWith('/auth/')) {
      return await handleAuthRequest(request, response)
    }

    // Handle protected admin routes
    if (pathname.startsWith('/admin')) {
      return await handleAdminRequest(request, response)
    }

    // Handle organization routes
    if (pathname.startsWith('/org/')) {
      return await handleOrganizationRequest(request, response)
    }

  } catch (error) {
    console.error('Middleware error:', error)
    
    // Log security error
    await logSecurityEvent({
      action: 'middleware_error',
      resource: pathname,
      ip: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Internal Security Error', { status: 500 })
    }
  }

  return response
}

// i18n routing handler
async function handleI18nRouting(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  const pathnameIsMissingLocale = SUPPORTED_LANGUAGES.every(
    (locale) => !pathname.startsWith(`/${locale.code}/`) && pathname !== `/${locale.code}`
  )

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = detectBrowserLanguage(request) || DEFAULT_LANGUAGE
    
    // Redirect to localized version
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    )
  }

  return null
}

// Detect browser language
function detectBrowserLanguage(request: NextRequest): string | null {
  // Check cookie first
  const langCookie = request.cookies.get('i18next')
  if (langCookie?.value && isValidLanguage(langCookie.value)) {
    return langCookie.value
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, quality = '1'] = lang.trim().split(';q=')
        return {
          code: code.split('-')[0].toLowerCase(),
          quality: parseFloat(quality)
        }
      })
      .sort((a, b) => b.quality - a.quality)

    for (const lang of languages) {
      if (isValidLanguage(lang.code)) {
        return lang.code
      }
    }
  }

  return null
}

// Validate language code
function isValidLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code)
}

async function shouldRateLimit(request: NextRequest): Promise<boolean> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  
  // Clean up expired entries
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
  
  const entry = rateLimitMap.get(ip)
  
  if (!entry) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return false
  }
  
  if (entry.resetTime < now) {
    entry.count = 1
    entry.resetTime = now + RATE_LIMIT_WINDOW
    return false
  }
  
  entry.count++
  
  // Allow higher rate limits for API calls
  const limit = request.nextUrl.pathname.startsWith('/api/') 
    ? RATE_LIMIT_REQUESTS 
    : RATE_LIMIT_REQUESTS / 2
    
  return entry.count > limit
}

async function handleAPIRequest(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  // Add API-specific security headers
  response.headers.set('X-API-Version', '1.0')
  
  // Validate API key for external API calls
  if (request.nextUrl.pathname.startsWith('/api/external/')) {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || !await validateAPIKey(apiKey)) {
      return new NextResponse('Invalid API Key', { status: 401 })
    }
  }

  // Enhanced CORS for API routes
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
          ? 'https://prismy.com' 
          : '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  return response
}

async function handleAuthRequest(request: NextRequest, response: NextResponse): Promise<NextResponse> {
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

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()

  // Handle logout
  if (request.nextUrl.pathname === '/auth/logout') {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (session && ['/auth/login', '/auth/register'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

async function handleAdminRequest(request: NextRequest, response: NextResponse): Promise<NextResponse> {
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

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Check admin permissions
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Log admin access
  await logSecurityEvent({
    userId: session.user.id,
    action: 'admin_access',
    resource: request.nextUrl.pathname,
    ip: request.ip || request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent')
  })

  return response
}

async function handleOrganizationRequest(request: NextRequest, response: NextResponse): Promise<NextResponse> {
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

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Extract organization ID from URL
  const orgId = request.nextUrl.pathname.split('/')[2]
  
  if (orgId) {
    // Validate organization access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role, status')
      .eq('organization_id', orgId)
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()
    
    if (!membership) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

async function validateAPIKey(apiKey: string): Promise<boolean> {
  // Implement API key validation logic
  return apiKey.startsWith('pk_') && apiKey.length > 20
}

async function logSecurityEvent(event: {
  userId?: string
  action: string
  resource: string
  ip?: string | null
  userAgent?: string | null
  error?: string
}): Promise<void> {
  try {
    // Only log in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_AUDIT_LOGS) {
      return
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    )

    await supabase.from('security_audit_logs').insert({
      user_id: event.userId,
      operation: event.action,
      resource_type: 'route',
      resource_id: event.resource,
      success: !event.error,
      ip_address: event.ip,
      user_agent: event.userAgent,
      metadata: {
        middleware_version: '2.1',
        i18n_enabled: true,
        error: event.error,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

export const config = {
  matcher: [
    /*
     * Apply middleware to all pages but exclude static files
     * The early return in middleware() handles specific exclusions
     */
    '/((?!_next/static|_next/image|favicon.ico|locales).*)',
  ],
}