'use client'

import { useContext } from 'react'
import { I18nContext } from '@/contexts/I18nContext'

// Default translation function for fallback
const defaultT = (key: string) => key.split('.').pop() || key

export function useI18n() {
  const context = useContext(I18nContext)
  
  if (!context) {
    // Return safe defaults instead of throwing error
    console.warn('useI18n used without I18nProvider, returning defaults')
    return {
      t: defaultT,
      locale: 'en',
      setLocale: () => {},
      translations: {},
    }
  }
  
  return context
}