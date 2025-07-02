'use client'

/**
 * i18n Provider Component
 * Manages language state and provides translation context
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type Language } from './config'
import { t, getPreferredLanguage, setPreferredLanguage } from './config-simple'
import { createClientComponentClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface I18nContextType {
  currentLanguage: Language
  setLanguage: (languageCode: string) => Promise<void>
  isLoading: boolean
  isRTL: boolean
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: React.ReactNode
  initialLanguage?: string
}

export function I18nProvider({ children, initialLanguage }: I18nProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    SUPPORTED_LANGUAGES.find(
      lang => lang.code === (initialLanguage || DEFAULT_LANGUAGE)
    ) || SUPPORTED_LANGUAGES[0]
  )
  const [isLoading, setIsLoading] = useState(true)

  // Use singleton Supabase client
  const supabase = createClientComponentClient()

  useEffect(() => {
    initializeLanguage()
  }, [])

  useEffect(() => {
    // Safely update document attributes without conflicting with React
    const updateDocumentAttributes = () => {
      try {
        if (typeof document !== 'undefined') {
          // Use requestAnimationFrame to avoid timing conflicts with React rendering
          requestAnimationFrame(() => {
            const html = document.documentElement
            if (html) {
              html.setAttribute('dir', currentLanguage.rtl ? 'rtl' : 'ltr')
              html.setAttribute('lang', currentLanguage.code)

              // Use setAttribute for classes to avoid React conflicts
              if (currentLanguage.rtl) {
                html.classList.add('rtl')
              } else {
                html.classList.remove('rtl')
              }
            }
          })
        }
      } catch (error) {
        // Silently handle DOM manipulation errors to prevent app crashes
        logger.warn('Failed to update document attributes', { error })
      }
    }

    updateDocumentAttributes()
  }, [currentLanguage])

  async function initializeLanguage() {
    try {
      setIsLoading(true)

      // Get user's saved language preference
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('language')
          .eq('user_id', session.user.id)
          .single()

        if (profile?.language) {
          await changeLanguage(profile.language)
          return
        }
      }

      // Fall back to browser/stored language
      const storedLanguage = getPreferredLanguage()
      if (
        storedLanguage &&
        SUPPORTED_LANGUAGES.some(lang => lang.code === storedLanguage)
      ) {
        await changeLanguage(storedLanguage)
      } else {
        // Detect browser language
        const browserLanguage = navigator.language.split('-')[0]
        const supportedBrowserLang = SUPPORTED_LANGUAGES.find(
          lang => lang.code === browserLanguage
        )

        if (supportedBrowserLang) {
          await changeLanguage(supportedBrowserLang.code)
        }
      }
    } catch (error) {
      logger.error('Failed to initialize language', { error })
    } finally {
      setIsLoading(false)
    }
  }

  async function changeLanguage(languageCode: string) {
    try {
      const newLanguage = SUPPORTED_LANGUAGES.find(
        lang => lang.code === languageCode
      )
      if (!newLanguage) {
        throw new Error(`Unsupported language: ${languageCode}`)
      }

      // Update state
      setCurrentLanguage(newLanguage)

      // Store preference locally
      setPreferredLanguage(languageCode)

      // Save to user profile if authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase.from('user_profiles').upsert({
          user_id: session.user.id,
          language: languageCode,
          updated_at: new Date().toISOString(),
        })
      }

      logger.info('Language changed', { language: languageCode })
    } catch (error) {
      logger.error('Failed to change language', { error, languageCode })
      throw error
    }
  }

  const setLanguage = async (languageCode: string) => {
    await changeLanguage(languageCode)
  }

  const contextValue: I18nContextType = {
    currentLanguage,
    setLanguage,
    isLoading,
    isRTL: currentLanguage.rtl,
    t: (key: string) => t(key, currentLanguage.code),
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Hook for getting translation function with type safety
export function useTranslation(namespace?: string) {
  const { t, currentLanguage } = useI18n()
  return {
    t: (key: string) => t(namespace ? `${namespace}.${key}` : key),
    i18n: { language: currentLanguage.code },
  }
}

// Language selector component
export function LanguageSelector({ className = '' }: { className?: string }) {
  const { currentLanguage, setLanguage, isLoading } = useI18n()
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await setLanguage(languageCode)
      setIsOpen(false)
    } catch (error) {
      logger.error('Failed to change language', { error })
    }
  }

  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 h-10 w-32 rounded ${className}`}
      />
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('selectLanguage')}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium">
          {currentLanguage.nativeName}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {SUPPORTED_LANGUAGES.map(language => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                language.code === currentLanguage.code
                  ? 'bg-blue-50 text-blue-600'
                  : ''
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{language.nativeName}</div>
                <div className="text-xs text-gray-500">{language.name}</div>
              </div>
              {language.code === currentLanguage.code && (
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
