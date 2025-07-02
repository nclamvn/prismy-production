'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import en from '@/lib/i18n/locales/en.json'
import vi from '@/lib/i18n/locales/vi.json'

type Locale = 'en' | 'vi'
type Translations = typeof en

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations: Record<Locale, Translations> = {
  en,
  vi,
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    // Get locale from localStorage or browser
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && translations[savedLocale]) {
      setLocale(savedLocale)
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith('vi')) {
        setLocale('vi')
      }
    }
  }, [])

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.')
    let value: any = translations[locale]

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`)
      return key
    }

    // Replace parameters
    if (params) {
      return value.replace(/{(\w+)}/g, (match, param) => {
        return params[param]?.toString() || match
      })
    }

    return value
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    // Return safe defaults instead of throwing error (Production Fix v2.0.1)
    console.warn('useI18n used without I18nProvider, returning defaults')
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: (key: string) => key.split('.').pop() || key,
    }
  }
  return context
}
