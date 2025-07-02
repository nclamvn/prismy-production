/**
 * Simplified Internationalization Configuration
 * Basic i18n support without React dependencies
 */

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
    locale: 'en-US',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    rtl: false,
    locale: 'vi-VN',
  },
]

export const DEFAULT_LANGUAGE = 'en'
export const FALLBACK_LANGUAGE = 'en'

// Simple translations object
export const translations = {
  en: {
    common: {
      welcome: 'Welcome',
      home: 'Home',
      features: 'Features',
      pricing: 'Pricing',
      contact: 'Contact',
      support: 'Support',
      documentation: 'Documentation',
      dashboard: 'Dashboard',
      settings: 'Settings',
      logout: 'Logout',
    },
  },
  vi: {
    common: {
      welcome: 'Chào mừng',
      home: 'Trang chủ',
      features: 'Tính năng',
      pricing: 'Bảng giá',
      contact: 'Liên hệ',
      support: 'Hỗ trợ',
      documentation: 'Tài liệu',
      dashboard: 'Bảng điều khiển',
      settings: 'Cài đặt',
      logout: 'Đăng xuất',
    },
  },
}

// Simple translation function
export function t(key: string, lang: string = DEFAULT_LANGUAGE): string {
  const keys = key.split('.')
  let value: any = translations[lang as keyof typeof translations]

  for (const k of keys) {
    value = value?.[k]
  }

  return value || key
}

// Get user's preferred language
export function getPreferredLanguage(): string {
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem('language') ||
      navigator.language.split('-')[0] ||
      DEFAULT_LANGUAGE
    )
  }
  return DEFAULT_LANGUAGE
}

// Set user's preferred language
export function setPreferredLanguage(language: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language)
  }
}
