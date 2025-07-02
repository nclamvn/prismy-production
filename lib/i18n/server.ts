/**
 * Server-side i18n utilities
 * For use in Next.js App Router and server components
 */

import { cookies, headers } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, type Language } from './config'

// Server-side language detection
export async function detectServerLanguage(): Promise<string> {
  try {
    // 1. Check user session and preferences
    const authHeader = headers().get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const {
        data: { user },
      } = await supabase.auth.getUser(token)

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('language')
          .eq('user_id', user.id)
          .single()

        if (profile?.language && isValidLanguage(profile.language)) {
          return profile.language
        }
      }
    }

    // 2. Check cookie preference
    const cookieStore = cookies()
    const langCookie = cookieStore.get('i18next')
    if (langCookie?.value && isValidLanguage(langCookie.value)) {
      return langCookie.value
    }

    // 3. Check Accept-Language header
    const acceptLanguage = headers().get('accept-language')
    if (acceptLanguage) {
      const browserLanguage = parseBrowserLanguage(acceptLanguage)
      if (browserLanguage && isValidLanguage(browserLanguage)) {
        return browserLanguage
      }
    }

    // 4. Default fallback
    return DEFAULT_LANGUAGE
  } catch (error) {
    console.error('Error detecting server language:', error)
    return DEFAULT_LANGUAGE
  }
}

// Parse browser Accept-Language header
function parseBrowserLanguage(acceptLanguage: string): string | null {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, quality = '1'] = lang.trim().split(';q=')
      return {
        code: code.split('-')[0].toLowerCase(),
        quality: parseFloat(quality),
      }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const lang of languages) {
    if (isValidLanguage(lang.code)) {
      return lang.code
    }
  }

  return null
}

// Validate if language code is supported
function isValidLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code)
}

// Get language by code
export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
}

// Server-side translation function
export async function getServerTranslation(
  key: string,
  language: string = DEFAULT_LANGUAGE,
  namespace: string = 'common',
  fallback?: string
): Promise<string> {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data } = await supabase
      .from('translations')
      .select('value')
      .eq('namespace', namespace)
      .eq('key', key)
      .eq('language', language)
      .single()

    if (data?.value) {
      return data.value
    }

    // Try English as fallback
    if (language !== 'en') {
      const { data: fallbackData } = await supabase
        .from('translations')
        .select('value')
        .eq('namespace', namespace)
        .eq('key', key)
        .eq('language', 'en')
        .single()

      if (fallbackData?.value) {
        return fallbackData.value
      }
    }

    // Return provided fallback or key
    return fallback || key
  } catch (error) {
    console.error('Error getting server translation:', error)
    return fallback || key
  }
}

// Get user's language preference from database
export async function getUserLanguage(userId: string): Promise<string> {
  try {
    const { data } = await supabase.rpc('get_user_language', {
      p_user_id: userId,
    })

    return data || DEFAULT_LANGUAGE
  } catch (error) {
    console.error('Error getting user language:', error)
    return DEFAULT_LANGUAGE
  }
}

// Set user's language preference
export async function setUserLanguage(
  userId: string,
  language: string,
  timezone?: string
): Promise<void> {
  try {
    if (!isValidLanguage(language)) {
      throw new Error(`Invalid language code: ${language}`)
    }

    await supabase.rpc('set_user_language', {
      p_user_id: userId,
      p_language: language,
      p_timezone: timezone,
    })
  } catch (error) {
    console.error('Error setting user language:', error)
    throw error
  }
}

// Get organization's supported languages
export async function getOrganizationLanguages(
  organizationId: string
): Promise<string[]> {
  try {
    const { data } = await supabase.rpc('get_organization_languages', {
      p_organization_id: organizationId,
    })

    if (Array.isArray(data)) {
      return data
    }

    return [DEFAULT_LANGUAGE]
  } catch (error) {
    console.error('Error getting organization languages:', error)
    return [DEFAULT_LANGUAGE]
  }
}

// Generate language alternates for SEO
export function generateLanguageAlternates(pathname: string): Array<{
  hreflang: string
  href: string
}> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prismy.com'

  return SUPPORTED_LANGUAGES.map(lang => ({
    hreflang: lang.code,
    href: `${baseUrl}/${lang.code}${pathname}`,
  }))
}

// Server component wrapper for translations
export async function ServerTranslation({
  children,
  language,
}: {
  children: (
    t: (key: string, namespace?: string) => Promise<string>
  ) => React.ReactNode
  language?: string
}) {
  const lang = language || (await detectServerLanguage())

  const t = async (key: string, namespace: string = 'common') => {
    return await getServerTranslation(key, lang, namespace)
  }

  return children(t)
}

// Middleware helper for language detection
export function getLanguageFromRequest(request: Request): string {
  // Extract language from URL path
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/').filter(Boolean)

  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0]
    if (isValidLanguage(firstSegment)) {
      return firstSegment
    }
  }

  // Extract from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const browserLanguage = parseBrowserLanguage(acceptLanguage)
    if (browserLanguage) {
      return browserLanguage
    }
  }

  return DEFAULT_LANGUAGE
}

// Generate OpenGraph and meta tags with language
export function generateLanguageMeta(
  language: string,
  title: string,
  description: string
) {
  const lang = getLanguageByCode(language)
  const isRTL = lang?.rtl || false

  return {
    lang: language,
    dir: isRTL ? 'rtl' : 'ltr',
    openGraph: {
      locale: lang?.locale || 'en_US',
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  }
}

// Format date according to user's language
export function formatServerDate(
  date: Date | string,
  language: string = DEFAULT_LANGUAGE,
  options?: Intl.DateTimeFormatOptions
): string {
  const lang = getLanguageByCode(language)
  const locale = lang?.locale || 'en-US'
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return dateObj.toLocaleDateString(locale, options || defaultOptions)
}

// Format currency according to user's language
export function formatServerCurrency(
  amount: number,
  language: string = DEFAULT_LANGUAGE,
  currency: string = 'USD'
): string {
  const lang = getLanguageByCode(language)
  const locale = lang?.locale || 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

// Format number according to user's language
export function formatServerNumber(
  number: number,
  language: string = DEFAULT_LANGUAGE
): string {
  const lang = getLanguageByCode(language)
  const locale = lang?.locale || 'en-US'

  return new Intl.NumberFormat(locale).format(number)
}
