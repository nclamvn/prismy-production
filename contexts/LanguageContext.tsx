'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

type Language = 'vi' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en') // Default to English for stability
  const [isLoading, setIsLoading] = useState(false) // Start with false, load immediately

  // Load language preference from localStorage on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('prismy-language') as Language
      if (savedLanguage === 'vi' || savedLanguage === 'en') {
        setLanguageState(savedLanguage)
      } else {
        // If no valid saved language, ensure English is saved
        localStorage.setItem('prismy-language', 'en')
      }
    } catch (error) {
      // Fallback to English if localStorage fails - already set as default
      console.warn('Failed to load language preference:', error)
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
export function withLanguage<T extends {}>(
  Component: React.ComponentType<
    T & { language: Language; setLanguage: (lang: Language) => void }
  >
) {
  return function WrappedComponent(props: T) {
    const { language, setLanguage } = useLanguage()
    return (
      <Component {...props} language={language} setLanguage={setLanguage} />
    )
  }
}
