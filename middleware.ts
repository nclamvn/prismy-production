import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
 
export default createIntlMiddleware({
  // A list of all locales that are supported
  locales,
 
  // Used when no locale matches - Vietnamese default
  defaultLocale,
  
  // Don't add locale prefix for default locale
  localePrefix: 'as-needed'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
};