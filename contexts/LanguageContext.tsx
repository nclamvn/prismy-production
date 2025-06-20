'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'vi' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('vi') // Default to Vietnamese
  const [isLoading, setIsLoading] = useState(true)

  // Load language preference from localStorage on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('prismy-language') as Language
      if (savedLanguage === 'vi' || savedLanguage === 'en') {
        setLanguageState(savedLanguage)
      } else {
        // If no valid saved language, default to Vietnamese
        setLanguageState('vi')
        localStorage.setItem('prismy-language', 'vi')
      }
    } catch (error) {
      // Fallback to Vietnamese if localStorage fails
      setLanguageState('vi')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update localStorage when language changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('prismy-language', lang)
    } catch (error) {
      console.warn('Failed to save language preference:', error)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Higher-order component for pages that need language
export function withLanguage<T extends {}>(Component: React.ComponentType<T & { language: Language; setLanguage: (lang: Language) => void }>) {
  return function WrappedComponent(props: T) {
    const { language, setLanguage } = useLanguage()
    return <Component {...props} language={language} setLanguage={setLanguage} />
  }
}