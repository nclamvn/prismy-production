'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { logger } from '@/lib/logger'

// Supported languages with premium localization
export type Language = 'vi' | 'en'

// Language configuration with premium features
export interface LanguageConfig {
  code: Language
  name: string
  nativeName: string
  flag: string
  rtl: boolean
  direction: 'ltr' | 'rtl'
  dateFormat: string
  numberFormat: string
  currencySymbol: string
  translationDirection: {
    primary: Language
    secondary: Language
  }
}

// Premium language configurations
const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    rtl: false,
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'vi-VN',
    currencySymbol: '₫',
    translationDirection: {
      primary: 'vi',
      secondary: 'en'
    }
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
    currencySymbol: '$',
    translationDirection: {
      primary: 'en',
      secondary: 'vi'
    }
  }
}

// Translation content type
export interface TranslationContent {
  [key: string]: string | TranslationContent
}

// Language context state
export interface LanguageState {
  language: Language
  config: LanguageConfig
  isLoading: boolean
  translations: Record<string, any>
  isRTL: boolean
  direction: 'ltr' | 'rtl'
}

interface LanguageContextType extends LanguageState {
  setLanguage: (lang: Language) => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
  formatDate: (date: Date | string) => string
  formatNumber: (num: number) => string
  formatCurrency: (amount: number) => string
  getAvailableLanguages: () => LanguageConfig[]
  detectUserLanguage: () => Language
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
  defaultLanguage?: Language
  ssrLanguage?: Language // For SSR compatibility
}

export function SSRSafeLanguageProvider({ 
  children, 
  defaultLanguage = 'vi',
  ssrLanguage 
}: LanguageProviderProps) {
  // Initialize with SSR-safe defaults
  const [languageState, setLanguageState] = useState<LanguageState>(() => {
    const initialLang = ssrLanguage || defaultLanguage
    return {
      language: initialLang,
      config: LANGUAGE_CONFIGS[initialLang],
      isLoading: false,
      translations: {},
      isRTL: LANGUAGE_CONFIGS[initialLang].rtl,
      direction: LANGUAGE_CONFIGS[initialLang].rtl ? 'rtl' : 'ltr'
    }
  })

  // Load translations and preferences on mount
  useEffect(() => {
    let mounted = true

    async function initializeLanguage() {
      try {
        setLanguageState(prev => ({ ...prev, isLoading: true }))

        // Detect user's preferred language
        const detectedLanguage = detectUserLanguage()
        
        // Try to get saved language preference
        const savedLanguage = getSavedLanguage()
        const preferredLanguage = savedLanguage || detectedLanguage

        // Load translations for the preferred language
        const translations = await loadTranslations(preferredLanguage)

        if (mounted) {
          const config = LANGUAGE_CONFIGS[preferredLanguage]
          setLanguageState({
            language: preferredLanguage,
            config,
            isLoading: false,
            translations,
            isRTL: config.rtl,
            direction: config.rtl ? 'rtl' : 'ltr'
          })

          // Apply language-specific CSS and document attributes
          applyLanguageStyles(config)
          
          logger.info({ 
            language: preferredLanguage, 
            detected: detectedLanguage, 
            saved: savedLanguage 
          }, 'Language initialized')
        }

      } catch (error) {
        logger.error({ error }, 'Language initialization failed')
        if (mounted) {
          setLanguageState(prev => ({ ...prev, isLoading: false }))
        }
      }
    }

    initializeLanguage()

    return () => {
      mounted = false
    }
  }, [])

  // Change language function
  const setLanguage = async (newLanguage: Language) => {
    if (newLanguage === languageState.language) return

    try {
      setLanguageState(prev => ({ ...prev, isLoading: true }))

      // Load translations for new language
      const translations = await loadTranslations(newLanguage)
      const config = LANGUAGE_CONFIGS[newLanguage]

      // Update state
      setLanguageState({
        language: newLanguage,
        config,
        isLoading: false,
        translations,
        isRTL: config.rtl,
        direction: config.rtl ? 'rtl' : 'ltr'
      })

      // Save preference
      saveLanguagePreference(newLanguage)
      
      // Apply styles
      applyLanguageStyles(config)

      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: newLanguage, config }
      }))

      logger.info({ language: newLanguage }, 'Language changed successfully')

    } catch (error) {
      logger.error({ error, language: newLanguage }, 'Language change failed')
      setLanguageState(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Translation function with interpolation
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = languageState.translations
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }

    if (typeof value !== 'string') {
      logger.warn({ key, language: languageState.language }, 'Translation key not found')
      return key // Return key as fallback
    }

    // Simple parameter interpolation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match
      })
    }

    return value
  }

  // Utility functions
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(languageState.config.numberFormat).format(dateObj)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(languageState.config.numberFormat).format(num)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(languageState.config.numberFormat, {
      style: 'currency',
      currency: languageState.language === 'vi' ? 'VND' : 'USD'
    }).format(amount)
  }

  const getAvailableLanguages = (): LanguageConfig[] => {
    return Object.values(LANGUAGE_CONFIGS)
  }

  const contextValue: LanguageContextType = {
    ...languageState,
    setLanguage,
    t,
    formatDate,
    formatNumber,
    formatCurrency,
    getAvailableLanguages,
    detectUserLanguage
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook to use language context
export function useSSRSafeLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useSSRSafeLanguage must be used within an SSRSafeLanguageProvider')
  }
  return context
}

// Utility functions
function detectUserLanguage(): Language {
  if (typeof window === 'undefined') return 'vi'
  
  // Check navigator language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('vi')) return 'vi'
  if (browserLang.startsWith('en')) return 'en'
  
  // Check navigator languages array
  const supportedLangs = navigator.languages?.find(lang => 
    lang.toLowerCase().startsWith('vi') || lang.toLowerCase().startsWith('en')
  )
  
  if (supportedLangs?.toLowerCase().startsWith('vi')) return 'vi'
  if (supportedLangs?.toLowerCase().startsWith('en')) return 'en'
  
  // Default to Vietnamese for Vietnamese market
  return 'vi'
}

function getSavedLanguage(): Language | null {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem('prismy-language')
    if (saved && (saved === 'vi' || saved === 'en')) {
      return saved as Language
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to get saved language')
  }
  
  return null
}

function saveLanguagePreference(language: Language) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('prismy-language', language)
  } catch (error) {
    logger.warn({ error }, 'Failed to save language preference')
  }
}

function applyLanguageStyles(config: LanguageConfig) {
  if (typeof document === 'undefined') return
  
  // Set document language and direction
  document.documentElement.lang = config.code
  document.documentElement.dir = config.direction
  
  // Set CSS custom properties for language-specific styling
  document.documentElement.style.setProperty('--text-direction', config.direction)
  document.documentElement.style.setProperty('--lang-code', config.code)
}

async function loadTranslations(language: Language): Promise<Record<string, any>> {
  try {
    // In a real implementation, you'd fetch from API or import JSON files
    // For now, return basic translations
    const translations = {
      vi: {
        common: {
          loading: 'Đang tải...',
          error: 'Đã xảy ra lỗi',
          success: 'Thành công',
          save: 'Lưu',
          cancel: 'Hủy',
          confirm: 'Xác nhận',
          delete: 'Xóa',
          edit: 'Chỉnh sửa'
        },
        pricing: {
          title: 'Bảng Giá Dịch Thuật Prismy',
          subtitle: 'Chọn gói phù hợp với nhu cầu dịch thuật của bạn',
          free: 'Miễn phí',
          standard: 'Tiêu chuẩn',
          premium: 'Cao cấp',
          enterprise: 'Doanh nghiệp',
          monthly: 'Hàng tháng',
          yearly: 'Hàng năm',
          perMonth: '/tháng',
          perYear: '/năm',
          choosePlan: 'Chọn gói',
          currentPlan: 'Gói hiện tại',
          upgrade: 'Nâng cấp',
          getStarted: 'Bắt đầu ngay',
          popular: 'Phổ biến',
          save20: 'Tiết kiệm 20%',
          paymentMethod: 'Phương thức thanh toán',
          welcome: 'Xin chào',
          currentTier: 'Gói hiện tại',
          usage: 'Sử dụng',
          features: {
            basicTranslation: 'Dịch thuật cơ bản',
            fiveDocuments: '5 tài liệu/tháng',
            communitySupport: 'Hỗ trợ cộng đồng',
            unlimitedTranslation: 'Dịch thuật không giới hạn',
            ocrSupport: 'Hỗ trợ OCR',
            priorityProcessing: 'Xử lý ưu tiên',
            emailSupport: 'Hỗ trợ email',
            advancedOcr: 'OCR nâng cao',
            batchProcessing: 'Xử lý hàng loạt',
            apiAccess: 'Truy cập API',
            premiumSupport: 'Hỗ trợ cao cấp',
            customModels: 'Mô hình tùy chỉnh',
            unlimitedEverything: 'Không giới hạn mọi thứ',
            dedicatedSupport: 'Hỗ trợ chuyên biệt',
            slaGuarantee: 'Đảm bảo SLA',
            customIntegration: 'Tích hợp tùy chỉnh',
            onPremise: 'Triển khai riêng'
          }
        },
        auth: {
          signIn: 'Đăng nhập',
          signUp: 'Đăng ký',
          signOut: 'Đăng xuất',
          email: 'Email',
          password: 'Mật khẩu',
          confirmPassword: 'Xác nhận mật khẩu',
          forgotPassword: 'Quên mật khẩu?',
          rememberMe: 'Ghi nhớ đăng nhập'
        }
      },
      en: {
        common: {
          loading: 'Loading...',
          error: 'An error occurred',
          success: 'Success',
          save: 'Save',
          cancel: 'Cancel',
          confirm: 'Confirm',
          delete: 'Delete',
          edit: 'Edit'
        },
        pricing: {
          title: 'Prismy Translation Pricing',
          subtitle: 'Choose the plan that fits your translation needs',
          free: 'Free',
          standard: 'Standard',
          premium: 'Premium',
          enterprise: 'Enterprise',
          monthly: 'Monthly',
          yearly: 'Yearly',
          perMonth: '/month',
          perYear: '/year',
          choosePlan: 'Choose Plan',
          currentPlan: 'Current Plan',
          upgrade: 'Upgrade',
          getStarted: 'Get Started',
          popular: 'Popular',
          save20: 'Save 20%',
          paymentMethod: 'Payment Method',
          welcome: 'Welcome',
          currentTier: 'Current Tier',
          usage: 'Usage',
          features: {
            basicTranslation: 'Basic translation',
            fiveDocuments: '5 documents/month',
            communitySupport: 'Community support',
            unlimitedTranslation: 'Unlimited translation',
            ocrSupport: 'OCR support',
            priorityProcessing: 'Priority processing',
            emailSupport: 'Email support',
            advancedOcr: 'Advanced OCR',
            batchProcessing: 'Batch processing',
            apiAccess: 'API access',
            premiumSupport: 'Premium support',
            customModels: 'Custom models',
            unlimitedEverything: 'Unlimited everything',
            dedicatedSupport: 'Dedicated support',
            slaGuarantee: 'SLA guarantee',
            customIntegration: 'Custom integration',
            onPremise: 'On-premise deployment'
          }
        },
        auth: {
          signIn: 'Sign In',
          signUp: 'Sign Up',
          signOut: 'Sign Out',
          email: 'Email',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          forgotPassword: 'Forgot Password?',
          rememberMe: 'Remember Me'
        }
      }
    }

    return translations[language] || translations.vi
  } catch (error) {
    logger.error({ error, language }, 'Failed to load translations')
    return {}
  }
}

// Premium language-aware formatting hooks
export function useLanguageFormatters() {
  const { formatDate, formatNumber, formatCurrency, config } = useSSRSafeLanguage()
  
  return {
    formatDate,
    formatNumber,
    formatCurrency,
    formatFileSize: (bytes: number) => {
      const sizes = config.code === 'vi' 
        ? ['bytes', 'KB', 'MB', 'GB'] 
        : ['bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return `${formatNumber(bytes / Math.pow(1024, i))} ${sizes[i]}`
    },
    formatDuration: (seconds: number) => {
      const units = config.code === 'vi'
        ? { hour: 'giờ', minute: 'phút', second: 'giây' }
        : { hour: 'hour', minute: 'minute', second: 'second' }
      
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) return `${hours} ${units.hour} ${minutes} ${units.minute}`
      if (minutes > 0) return `${minutes} ${units.minute} ${secs} ${units.second}`
      return `${secs} ${units.second}`
    }
  }
}