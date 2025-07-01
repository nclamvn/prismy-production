/**
 * Internationalization Configuration
 * Multi-language support with RTL layout and contextual translations
 */

// Simplified i18n without react-i18next to avoid React version conflicts
// import { createInstance, i18n } from 'i18next'
// import { initReactI18next } from 'react-i18next'
// import LanguageDetector from 'i18next-browser-languagedetector'
// import Backend from 'i18next-http-backend'

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl: boolean
  locale: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    locale: 'en-US'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    locale: 'es-ES'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    locale: 'fr-FR'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    locale: 'de-DE'
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    rtl: false,
    locale: 'zh-CN'
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    locale: 'ja-JP'
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    locale: 'ko-KR'
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    locale: 'ar-SA'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    rtl: false,
    locale: 'pt-BR'
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    rtl: false,
    locale: 'ru-RU'
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    rtl: false,
    locale: 'vi-VN'
  }
]

export const DEFAULT_LANGUAGE = 'en'
export const FALLBACK_LANGUAGE = 'en'

// Common namespaces for different parts of the application
export const NAMESPACES = {
  COMMON: 'common',
  AUTH: 'auth',
  DASHBOARD: 'dashboard',
  DOCUMENTS: 'documents',
  TRANSLATIONS: 'translations',
  BILLING: 'billing',
  SETTINGS: 'settings',
  ORGANIZATION: 'organization',
  ADMIN: 'admin',
  ERRORS: 'errors',
  VALIDATION: 'validation'
} as const

export type Namespace = typeof NAMESPACES[keyof typeof NAMESPACES]

// Translation interpolation options
export interface TranslationOptions {
  count?: number
  context?: string
  [key: string]: any
}

// i18next configuration
export const i18nConfig = {
  debug: process.env.NODE_ENV === 'development',
  
  // Default language
  lng: DEFAULT_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  
  // Supported languages
  supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),
  
  // Load all namespaces by default
  defaultNS: NAMESPACES.COMMON,
  ns: Object.values(NAMESPACES),
  
  // Backend configuration for loading translations
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/{{lng}}/{{ns}}_missing.json'
  },
  
  // Language detection configuration
  detection: {
    order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
    caches: ['localStorage', 'cookie'],
    lookupLocalStorage: 'i18nextLng',
    lookupCookie: 'i18next',
    checkWhitelist: true
  },
  
  // React i18next configuration
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
  },
  
  // Interpolation configuration
  interpolation: {
    escapeValue: false, // React already escapes values
    format: (value: any, format: string, lng: string) => {
      if (format === 'currency') {
        return formatCurrency(value, lng)
      }
      if (format === 'date') {
        return formatDate(value, lng)
      }
      if (format === 'number') {
        return formatNumber(value, lng)
      }
      return value
    }
  },
  
  // Pluralization
  pluralSeparator: '_',
  
  // Performance
  load: 'languageOnly',
  cleanCode: true,
  
  // Missing key handling
  saveMissing: process.env.NODE_ENV === 'development',
  missingKeyHandler: (lng: string[], ns: string, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`)
    }
  }
}

// Create i18n instance - placeholder for compatibility
export function createI18nInstance() {
  // Simplified implementation without react-i18next dependencies
  return {
    init: () => Promise.resolve(),
    t: (key: string) => key,
    language: 'en',
    changeLanguage: (lang: string) => Promise.resolve()
  }
}

// Utility functions for formatting
export function formatCurrency(value: number, language: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === language)
  return new Intl.NumberFormat(lang?.locale || 'en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

export function formatDate(value: Date | string, language: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === language)
  const date = typeof value === 'string' ? new Date(value) : value
  
  return new Intl.DateTimeFormat(lang?.locale || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function formatNumber(value: number, language: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === language)
  return new Intl.NumberFormat(lang?.locale || 'en-US').format(value)
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
}

export function isRTLLanguage(code: string): boolean {
  const language = getLanguageByCode(code)
  return language?.rtl || false
}

// Type-safe translation key helper
export type TranslationKey = string

// Common translation keys structure
export interface CommonTranslations {
  buttons: {
    save: string
    cancel: string
    delete: string
    edit: string
    create: string
    update: string
    submit: string
    close: string
    confirm: string
  }
  labels: {
    name: string
    email: string
    password: string
    confirmPassword: string
    language: string
    timezone: string
    status: string
    createdAt: string
    updatedAt: string
  }
  messages: {
    loading: string
    success: string
    error: string
    noData: string
    confirmDelete: string
  }
}