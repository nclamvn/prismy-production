import createIntlMiddleware from 'next-intl/middleware';
 
export default createIntlMiddleware({
  // A list of all locales that are supported
  locales: ['vi', 'en'],
 
  // Used when no locale matches - Vietnamese default
  defaultLocale: 'vi',
  
  // Don't add locale prefix for default locale
  localePrefix: 'as-needed'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
};