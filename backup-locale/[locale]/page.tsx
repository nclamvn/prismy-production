import { getLanguageByCode } from '@/lib/i18n/config'
import { getServerTranslation } from '@/lib/i18n/server'
import { LanguageSelector } from '@/components/ui/language-selector'
import { notFound } from 'next/navigation'

interface LocalePageProps {
  params: { locale: string }
}

export default async function LocalePage({ params }: LocalePageProps) {
  const language = getLanguageByCode(params.locale)
  
  if (!language) {
    notFound()
  }

  // Get server-side translations
  const welcome = await getServerTranslation('welcome', params.locale, 'common')
  const description = await getServerTranslation(
    'description', 
    params.locale, 
    'common',
    'AI-powered document translation and analysis platform'
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Language Selector */}
        <div className="flex justify-end mb-8">
          <LanguageSelector variant="default" showSearch={true} />
        </div>

        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {welcome} to Prismy
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Language Info */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Language Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Current Language:</span>
              <div className="mt-1">
                <span className="text-2xl mr-2">{language.flag}</span>
                <span className="text-lg">{language.nativeName}</span>
                <span className="text-sm text-gray-500 ml-2">({language.name})</span>
              </div>
            </div>
            <div>
              <span className="font-medium">Direction:</span>
              <div className="mt-1">
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {language.rtl ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
                </span>
              </div>
            </div>
            <div>
              <span className="font-medium">Locale:</span>
              <div className="mt-1 text-sm text-gray-600">{language.locale}</div>
            </div>
            <div>
              <span className="font-medium">Code:</span>
              <div className="mt-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                {language.code}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-2xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold mb-2">Multi-language Support</h3>
            <p className="text-gray-600">
              Support for 11 languages with automatic detection and switching.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-2xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2">RTL Support</h3>
            <p className="text-gray-600">
              Full right-to-left language support for Arabic and other RTL languages.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-2xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Fast Loading</h3>
            <p className="text-gray-600">
              Optimized translation loading with caching and lazy loading.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}