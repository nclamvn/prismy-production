'use client'

import React, { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Theme = 'light' | 'dark' | 'system'

interface ThemeToggleProps {
  className?: string
  variant?: 'icon' | 'dropdown'
}

/**
 * ThemeToggle - Dark/light mode toggle component
 * Supports system preference detection and persistence
 */
export function ThemeToggle({ 
  className = '',
  variant = 'icon'
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
    
    // Get stored theme or default to system
    const stored = localStorage.getItem('theme') as Theme
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    // Apply theme
    if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }

    // Store preference
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        // Trigger re-application of system theme
        setTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getIcon = () => {
    if (!mounted) return <Monitor className="h-4 w-4" />
    
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      case 'system':
        return 'System theme'
      default:
        return 'Theme'
    }
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={`transition-all ${className}`}
        title={getLabel()}
      >
        {getIcon()}
      </Button>
    )
  }

  // Dropdown variant (for future implementation)
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="flex items-center space-x-2"
      >
        {getIcon()}
        <span className="text-sm">{getLabel()}</span>
      </Button>
    </div>
  )
}