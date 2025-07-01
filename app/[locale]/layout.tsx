import { notFound } from 'next/navigation'
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '@/lib/i18n/config'
import { detectServerLanguage, generateLanguageMeta } from '@/lib/i18n/server'
import { I18nProvider } from '@/lib/i18n/provider'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

// Generate static params for all supported languages
export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((language) => ({
    locale: language.code
  }))
}

// Generate metadata for each locale
export async function generateMetadata({ params }: { params: { locale: string } }) {
  const language = getLanguageByCode(params.locale)
  
  if (!language) {
    notFound()
  }

  const title = 'Prismy - AI Document Translation Platform'
  const description = 'Transform your documents with AI-powered translation and intelligent analysis'

  return generateLanguageMeta(language.code, title, description)
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  // Validate locale parameter
  const language = getLanguageByCode(params.locale)
  
  if (!language) {
    notFound()
  }

  // Server-side language detection fallback
  const detectedLanguage = await detectServerLanguage()
  const initialLanguage = language.code || detectedLanguage

  return (
    <html lang={initialLanguage} dir={language.rtl ? 'rtl' : 'ltr'}>
      <head>
        {/* Language alternates for SEO */}
        {SUPPORTED_LANGUAGES.map((lang) => (
          <link
            key={lang.code}
            rel="alternate"
            hrefLang={lang.code}
            href={`/${lang.code}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href="/" />
      </head>
      <body className={language.rtl ? 'rtl' : 'ltr'}>
        <I18nProvider initialLanguage={initialLanguage}>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}