'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Import translation files
import enTranslations from '@/packages/i18n/en.json'
import viTranslations from '@/packages/i18n/vi.json'

// Helper function to get nested translation keys
function getNestedTranslation(translations: Record<string, any>, key: string): string {
  const keys = key.split('.')
  let result = translations
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k]
    } else {
      return key // Return the key if translation not found
    }
  }
  
  return typeof result === 'string' ? result : key
}

// Template string interpolation helper
function interpolateString(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(variables[key] ?? match)
  })
}

export type Locale = 'en' | 'vi'

const translations = {
  en: enTranslations,
  vi: viTranslations,
} as const

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, variables?: Record<string, string | number>) => string
  isRTL: boolean
}

export const I18nContext = createContext<I18nContextType | null>(null)

interface I18nProviderProps {
  children: ReactNode
  defaultLocale?: Locale
}

export function I18nProvider({ children, defaultLocale = 'en' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('pry-locale') as Locale
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'vi')) {
      setLocaleState(savedLocale)
    }
  }, [])

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('pry-locale', newLocale)
    
    // Update document direction for RTL languages (future support)
    document.documentElement.setAttribute('lang', newLocale)
    document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr')
  }

  // Translation function
  const t = (key: string, variables?: Record<string, string | number>): string => {
    const currentTranslations = translations[locale]
    let translation = getNestedTranslation(currentTranslations, key)
    
    // If translation not found, try fallback to English
    if (translation === key && locale !== 'en') {
      translation = getNestedTranslation(translations.en, key)
    }
    
    // Apply variable interpolation if provided
    if (variables && typeof translation === 'string') {
      translation = interpolateString(translation, variables)
    }
    
    return translation
  }

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    isRTL: false, // Vietnamese and English are LTR
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}