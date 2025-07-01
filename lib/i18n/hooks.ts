/**
 * Custom hooks for i18n functionality
 * Enhanced translation hooks with type safety and utility functions
 */

import { useCallback, useMemo } from 'react'
import { useTranslation as useI18nextTranslation } from 'react-i18next'
import { formatCurrency, formatDate, formatNumber, isRTLLanguage, type TranslationKey } from './config'
import { useI18n } from './provider'

// Enhanced useTranslation hook with type safety
export function useTranslation(namespace?: string) {
  const { t, i18n } = useI18nextTranslation(namespace)
  const { currentLanguage } = useI18n()

  // Type-safe translation function
  const translate = useCallback((key: TranslationKey, options?: any) => {
    return t(key, options)
  }, [t])

  // Plural-aware translation
  const translatePlural = useCallback((key: TranslationKey, count: number, options?: any) => {
    return t(key, { count, ...options })
  }, [t])

  // Translation with interpolation
  const translateWithValues = useCallback((key: TranslationKey, values: Record<string, any>) => {
    return t(key, values)
  }, [t])

  // Check if translation exists
  const hasTranslation = useCallback((key: TranslationKey) => {
    return i18n.exists(key)
  }, [i18n])

  return {
    t: translate,
    tPlural: translatePlural,
    tWithValues: translateWithValues,
    hasTranslation,
    language: currentLanguage.code,
    isRTL: currentLanguage.rtl,
    i18n
  }
}

// Hook for formatting values according to current locale
export function useFormatting() {
  const { currentLanguage } = useI18n()

  const formatCurrencyValue = useCallback((value: number, currency = 'USD') => {
    return formatCurrency(value, currentLanguage.code)
  }, [currentLanguage.code])

  const formatDateValue = useCallback((value: Date | string) => {
    return formatDate(value, currentLanguage.code)
  }, [currentLanguage.code])

  const formatNumberValue = useCallback((value: number) => {
    return formatNumber(value, currentLanguage.code)
  }, [currentLanguage.code])

  const formatRelativeTime = useCallback((date: Date | string) => {
    const targetDate = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

    const { t } = useI18nextTranslation('common')

    if (diffInSeconds < 60) {
      return t('time.now')
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return t('time.minute', { count: minutes })
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return t('time.hour', { count: hours })
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return t('time.day', { count: days })
    } else if (diffInSeconds < 2419200) {
      const weeks = Math.floor(diffInSeconds / 604800)
      return t('time.week', { count: weeks })
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2419200)
      return t('time.month', { count: months })
    } else {
      const years = Math.floor(diffInSeconds / 31536000)
      return t('time.year', { count: years })
    }
  }, [currentLanguage.code])

  const formatFileSize = useCallback((bytes: number) => {
    const { t } = useI18nextTranslation('common')
    
    if (bytes === 0) return `0 ${t('units.bytes')}`
    
    const k = 1024
    const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2))
    return `${formatNumberValue(size)} ${t(`units.${sizes[i]}`)}`
  }, [currentLanguage.code, formatNumberValue])

  return {
    formatCurrency: formatCurrencyValue,
    formatDate: formatDateValue,
    formatNumber: formatNumberValue,
    formatRelativeTime,
    formatFileSize
  }
}

// Hook for common UI text patterns
export function useCommonText() {
  const { t } = useTranslation('common')

  const getStatusText = useCallback((status: string) => {
    return t(`status.${status}`, status)
  }, [t])

  const getButtonText = useCallback((action: string) => {
    return t(`buttons.${action}`, action)
  }, [t])

  const getLabelText = useCallback((field: string) => {
    return t(`labels.${field}`, field)
  }, [t])

  const getMessageText = useCallback((message: string) => {
    return t(`messages.${message}`, message)
  }, [t])

  const getNavigationText = useCallback((item: string) => {
    return t(`navigation.${item}`, item)
  }, [t])

  return {
    getStatusText,
    getButtonText,
    getLabelText,
    getMessageText,
    getNavigationText
  }
}

// Hook for error message translation
export function useErrorTranslation() {
  const { t } = useTranslation('errors')

  const translateError = useCallback((error: Error | string | any) => {
    let errorKey = ''
    let errorMessage = ''

    if (typeof error === 'string') {
      errorKey = error
      errorMessage = error
    } else if (error instanceof Error) {
      errorKey = error.message
      errorMessage = error.message
    } else if (error?.message) {
      errorKey = error.message
      errorMessage = error.message
    } else {
      errorKey = 'unexpectedError'
      errorMessage = 'An unexpected error occurred'
    }

    // Try to find translation, fall back to original message
    const translated = t(errorKey, { defaultValue: null })
    return translated || t('unexpectedError', errorMessage)
  }, [t])

  return { translateError }
}

// Hook for form validation messages
export function useValidationTranslation() {
  const { t } = useTranslation('validation')

  const getValidationMessage = useCallback((rule: string, field?: string, options?: any) => {
    const key = field ? `${field}.${rule}` : rule
    return t(key, { field, ...options })
  }, [t])

  const getRequiredMessage = useCallback((field: string) => {
    return getValidationMessage('required', field)
  }, [getValidationMessage])

  const getMinLengthMessage = useCallback((field: string, min: number) => {
    return getValidationMessage('minLength', field, { min })
  }, [getValidationMessage])

  const getMaxLengthMessage = useCallback((field: string, max: number) => {
    return getValidationMessage('maxLength', field, { max })
  }, [getValidationMessage])

  const getPatternMessage = useCallback((field: string, pattern: string) => {
    return getValidationMessage('pattern', field, { pattern })
  }, [getValidationMessage])

  return {
    getValidationMessage,
    getRequiredMessage,
    getMinLengthMessage,
    getMaxLengthMessage,
    getPatternMessage
  }
}

// Hook for handling RTL layouts
export function useRTL() {
  const { isRTL } = useI18n()

  const rtlClass = useMemo(() => isRTL ? 'rtl' : 'ltr', [isRTL])
  
  const getDirectionStyles = useCallback((styles: Record<string, any>) => {
    if (!isRTL) return styles

    // Convert LTR styles to RTL
    const rtlStyles = { ...styles }
    
    // Handle text alignment
    if (styles.textAlign === 'left') rtlStyles.textAlign = 'right'
    else if (styles.textAlign === 'right') rtlStyles.textAlign = 'left'
    
    // Handle margins and padding
    if (styles.marginLeft !== undefined) {
      rtlStyles.marginRight = styles.marginLeft
      rtlStyles.marginLeft = styles.marginRight || 0
    }
    if (styles.paddingLeft !== undefined) {
      rtlStyles.paddingRight = styles.paddingLeft
      rtlStyles.paddingLeft = styles.paddingRight || 0
    }
    
    // Handle positioning
    if (styles.left !== undefined) {
      rtlStyles.right = styles.left
      delete rtlStyles.left
    }
    if (styles.right !== undefined) {
      rtlStyles.left = styles.right
      delete rtlStyles.right
    }

    return rtlStyles
  }, [isRTL])

  const getFlexDirection = useCallback((direction: 'row' | 'row-reverse' | 'column' | 'column-reverse') => {
    if (!isRTL || direction.includes('column')) return direction
    return direction === 'row' ? 'row-reverse' : 'row'
  }, [isRTL])

  return {
    isRTL,
    rtlClass,
    getDirectionStyles,
    getFlexDirection
  }
}

// Hook for language switching
export function useLanguageSwitcher() {
  const { setLanguage, currentLanguage } = useI18n()
  const { t } = useTranslation('common')

  const switchLanguage = useCallback(async (languageCode: string) => {
    try {
      await setLanguage(languageCode)
      // Show success message
      return true
    } catch (error) {
      console.error('Failed to switch language:', error)
      return false
    }
  }, [setLanguage])

  const getCurrentLanguageName = useCallback(() => {
    return currentLanguage.nativeName
  }, [currentLanguage])

  return {
    switchLanguage,
    currentLanguage,
    getCurrentLanguageName
  }
}