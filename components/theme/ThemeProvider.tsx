'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  attribute?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  attribute = 'data-theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = () => {
      const isSystemDark = mediaQuery.matches
      let effectiveTheme: 'light' | 'dark'

      if (theme === 'system') {
        effectiveTheme = isSystemDark ? 'dark' : 'light'
      } else {
        effectiveTheme = theme as 'light' | 'dark'
      }

      setResolvedTheme(effectiveTheme)

      // Apply theme to document
      root.setAttribute(attribute, effectiveTheme)
      
      // Remove any existing theme classes
      root.classList.remove('light', 'dark')
      root.classList.add(effectiveTheme)

      // Save to localStorage
      localStorage.setItem('theme', theme)
    }

    updateTheme()

    // Listen for system theme changes
    const handleChange = () => updateTheme()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, attribute])

  const value = {
    theme,
    setTheme,
    resolvedTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}