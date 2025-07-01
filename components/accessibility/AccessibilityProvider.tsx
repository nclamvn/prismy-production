'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AccessibilitySettings {
  highContrast: boolean
  reducedMotion: boolean
  largeText: boolean
  dyslexiaFriendly: boolean
  keyboardNavigation: boolean
  screenReaderMode: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  dyslexiaFriendly: false,
  keyboardNavigation: true,
  screenReaderMode: false
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [announceElement, setAnnounceElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('accessibility-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error)
      }
    }

    // Detect system preferences
    const detectSystemPreferences = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      setSettings(prev => ({
        ...prev,
        reducedMotion: prev.reducedMotion || prefersReducedMotion,
        highContrast: prev.highContrast || prefersHighContrast
      }))
    }

    detectSystemPreferences()

    // Listen for system preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }))
    }
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }))
    }

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
    highContrastQuery.addEventListener('change', handleHighContrastChange)

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
      highContrastQuery.removeEventListener('change', handleHighContrastChange)
    }
  }, [])

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))

    // Apply settings to document
    const root = document.documentElement
    
    root.classList.toggle('high-contrast', settings.highContrast)
    root.classList.toggle('reduced-motion', settings.reducedMotion)
    root.classList.toggle('large-text', settings.largeText)
    root.classList.toggle('dyslexia-friendly', settings.dyslexiaFriendly)
    root.classList.toggle('keyboard-navigation', settings.keyboardNavigation)
    root.classList.toggle('screen-reader-mode', settings.screenReaderMode)

    // Set CSS custom properties
    if (settings.largeText) {
      root.style.setProperty('--accessibility-font-scale', '1.2')
    } else {
      root.style.removeProperty('--accessibility-font-scale')
    }

  }, [settings])

  useEffect(() => {
    // Create announcement element for screen readers with safer styling
    const element = document.createElement('div')
    element.setAttribute('aria-live', 'polite')
    element.setAttribute('aria-atomic', 'true')
    element.className = 'aria-live-region'
    element.style.position = 'absolute'
    element.style.left = '-10000px'
    element.style.width = '1px'
    element.style.height = '1px'
    element.style.overflow = 'hidden'
    element.style.clip = 'rect(0 0 0 0)'
    
    // Use a safer container approach
    let container = document.getElementById('accessibility-announcements')
    if (!container) {
      container = document.createElement('div')
      container.id = 'accessibility-announcements'
      container.style.position = 'absolute'
      container.style.left = '-10000px'
      document.body.appendChild(container)
    }
    
    container.appendChild(element)
    setAnnounceElement(element)

    return () => {
      // Safe DOM cleanup with defensive checks
      try {
        if (element && element.parentNode && element.parentNode.contains(element)) {
          element.parentNode.removeChild(element)
        }
      } catch (error) {
        // Silently handle if element was already removed by React reconciliation
        console.debug('Accessibility element already removed:', error)
      }
    }
  }, [])

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceElement) return

    // Clear previous message
    announceElement.textContent = ''
    announceElement.setAttribute('aria-live', priority)
    
    // Set new message with a small delay to ensure screen readers pick it up
    setTimeout(() => {
      announceElement.textContent = message
    }, 100)

    // Clear message after a delay
    setTimeout(() => {
      announceElement.textContent = ''
    }, 5000)
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, announceToScreenReader }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

// Keyboard navigation helper hook
export function useKeyboardNavigation() {
  const { settings } = useAccessibility()
  
  useEffect(() => {
    if (!settings.keyboardNavigation) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab trapping for modals
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement?.closest('[role="dialog"]')) {
          const closeButton = activeElement.closest('[role="dialog"]')?.querySelector('[data-close]') as HTMLElement
          closeButton?.click()
        }
      }

      // Arrow key navigation for grids and lists
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const activeElement = document.activeElement as HTMLElement
        const container = activeElement?.closest('[role="grid"], [role="listbox"], [role="menu"]')
        
        if (container) {
          event.preventDefault()
          handleArrowKeyNavigation(event.key, container as HTMLElement)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [settings.keyboardNavigation])
}

function handleArrowKeyNavigation(key: string, container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement)
  let nextIndex = currentIndex

  const isGrid = container.getAttribute('role') === 'grid'
  const columns = isGrid ? parseInt(container.getAttribute('aria-colcount') || '1') : 1

  switch (key) {
    case 'ArrowUp':
      nextIndex = isGrid ? currentIndex - columns : currentIndex - 1
      break
    case 'ArrowDown':
      nextIndex = isGrid ? currentIndex + columns : currentIndex + 1
      break
    case 'ArrowLeft':
      nextIndex = currentIndex - 1
      break
    case 'ArrowRight':
      nextIndex = currentIndex + 1
      break
  }

  if (nextIndex >= 0 && nextIndex < focusableElements.length) {
    focusableElements[nextIndex].focus()
  }
}

// Skip link component
export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: { href?: string; children?: ReactNode }) {
  return (
    <a href={href} className="skip-link sr-only-focusable">
      {children}
    </a>
  )
}

// Live region for announcements
export function LiveRegion({ 
  message, 
  priority = 'polite' 
}: { 
  message: string; 
  priority?: 'polite' | 'assertive' 
}) {
  return (
    <div 
      aria-live={priority} 
      aria-atomic="true" 
      className="aria-live-region"
    >
      {message}
    </div>
  )
}