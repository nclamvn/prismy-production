'use client'

import { useContext } from 'react'
import { I18nContext } from '@/contexts/I18nContext'

// Default translation function for fallback
const defaultT = (key: string) => key.split('.').pop() || key

/**
 * Safe I18n hook that returns defaults when provider is missing
 * Fixed: No longer throws errors in production - v2.0.1
 */
export function useI18n() {
  const context = useContext(I18nContext)
  
  if (!context) {
    // Return safe defaults instead of throwing error
    console.warn('useI18n used without I18nProvider, returning defaults')
    return {
      t: defaultT,
      locale: 'en' as const,
      setLocale: () => {},
      translations: {},
    }
  }
  
  return context
}