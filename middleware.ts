import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createIntlMiddleware({
  // A list of all locales that are supported
  locales,
 
  // Used when no locale matches - Vietnamese default
  defaultLocale,
  
  // Don't add locale prefix for default locale
  localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
  // Handle auth first for protected routes
  if (request.nextUrl.pathname.startsWith('/app') || 
      request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup') {
    return await updateSession(request);
  }

  // Handle internationalization for other routes
  return intlMiddleware(request);
}
 
export const config = {
  // Match only internationalized pathnames and auth routes
  matcher: ['/', '/app/:path*', '/login', '/signup', '/((?!api|_next|_vercel|.*\\..*).*)']
};