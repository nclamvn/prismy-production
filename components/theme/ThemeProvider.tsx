/**
 * UI/UX Polish Sprint - Phase 1.2: Theme Provider Component
 * 
 * React provider for theme management with flash prevention
 * Integrates with the theme system for smooth transitions
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeSystem, type Theme, type ResolvedTheme, THEME_TRANSITION_CSS } from '@/lib/theme/theme-system'

interface ThemeContextValue {
  theme: ResolvedTheme
  currentTheme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isUIv2: boolean
  enableUIv2: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  enableSystem?: boolean
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ResolvedTheme>('light')
  const [currentTheme, setCurrentThemeState] = useState<Theme>(defaultTheme)
  const [isUIv2, setIsUIv2] = useState(false)
  const [mounted, setMounted] = useState(false)

  const themeSystem = ThemeSystem.getInstance()

  useEffect(() => {
    setMounted(true)
    
    // Initialize theme state from system
    setThemeState(themeSystem.getResolvedTheme())
    setCurrentThemeState(themeSystem.getTheme())
    setIsUIv2(themeSystem.isUIv2Enabled())

    // Subscribe to theme changes
    const unsubscribe = themeSystem.subscribe((newTheme) => {
      setThemeState(newTheme)
    })

    // Add transition CSS to document
    addTransitionStyles()

    return () => {
      unsubscribe()
      removeTransitionStyles()
    }
  }, [])

  const setTheme = React.useCallback((newTheme: Theme) => {
    themeSystem.setTheme(newTheme)
    setCurrentThemeState(newTheme)
  }, [])

  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }, [theme])

  const enableUIv2 = React.useCallback((enabled: boolean) => {
    themeSystem.enableUIv2(enabled)
    setIsUIv2(enabled)
  }, [])

  const contextValue: ThemeContextValue = {
    theme,
    currentTheme,
    setTheme,
    toggleTheme,
    isUIv2,
    enableUIv2
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

// Helper to add theme transition styles
function addTransitionStyles() {
  if (typeof document === 'undefined') return

  const styleId = 'theme-transitions'
  
  // Remove existing styles
  const existing = document.getElementById(styleId)
  if (existing) {
    existing.remove()
  }

  // Add new styles
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = THEME_TRANSITION_CSS
  document.head.appendChild(style)
}

function removeTransitionStyles() {
  if (typeof document === 'undefined') return

  const existing = document.getElementById('theme-transitions')
  if (existing) {
    existing.remove()
  }
}

// Theme toggle button component
interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ThemeToggle({ 
  className = '', 
  size = 'md',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, toggleTheme, currentTheme } = useTheme()

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center rounded-md 
        transition-colors duration-150 ease-out
        hover:bg-workspace-panel focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${sizeClasses[size]} ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Current theme: ${currentTheme} (${theme})`}
    >
      {theme === 'dark' ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  )
}

// Icon components
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  )
}

// UI Version toggle (for development/testing)
interface UIVersionToggleProps {
  className?: string
}

export function UIVersionToggle({ className = '' }: UIVersionToggleProps) {
  const { isUIv2, enableUIv2 } = useTheme()

  return (
    <button
      onClick={() => enableUIv2(!isUIv2)}
      className={`
        inline-flex items-center px-3 py-1 rounded-md text-xs font-medium
        transition-colors duration-150 ease-out
        ${isUIv2 
          ? 'bg-primary-100 text-primary-800 hover:bg-primary-200' 
          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
        }
        ${className}
      `}
      title="Toggle between UI v1 and v2"
    >
      UI {isUIv2 ? 'v2' : 'v1'}
    </button>
  )
}