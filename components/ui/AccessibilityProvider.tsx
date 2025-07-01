import React, { createContext, useContext, useEffect, useState } from 'react'

interface AccessibilityContextType {
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large'
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void
  focusElement: (selector: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    // Check for high contrast preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    // Load saved font size preference
    const savedFontSize = localStorage.getItem('accessibility-font-size')
    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
      setFontSize(savedFontSize as 'small' | 'medium' | 'large')
    }
  }, [])

  useEffect(() => {
    // Apply accessibility classes to document
    const root = document.documentElement
    
    // Font size
    root.classList.remove('text-sm', 'text-base', 'text-lg')
    switch (fontSize) {
      case 'small':
        root.classList.add('text-sm')
        break
      case 'large':
        root.classList.add('text-lg')
        break
      default:
        root.classList.add('text-base')
    }

    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
  }, [fontSize, highContrast, reducedMotion])

  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create announcement element
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement is made
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      
      // Announce focus change for screen readers
      const label = element.getAttribute('aria-label') || 
                   element.getAttribute('title') || 
                   element.textContent || 
                   'Element'
      announceMessage(`Focused on ${label}`)
    }
  }

  const value: AccessibilityContextType = {
    reducedMotion,
    highContrast,
    fontSize,
    announceMessage,
    focusElement,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Screen reader announcements region */}
      <div
        id="accessibility-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Skip links */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50">
        <a
          href="#main-content"
          className="bg-accent text-white px-4 py-2 rounded-button text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
      </div>
    </AccessibilityContext.Provider>
  )
}

// Accessibility enhancement hook
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key handling
      if (event.key === 'Escape') {
        // Close modals, dropdowns, etc.
        const openModal = document.querySelector('[role="dialog"][aria-modal="true"]')
        if (openModal) {
          const closeButton = openModal.querySelector('[aria-label*="close"], [aria-label*="Close"]')
          if (closeButton) {
            (closeButton as HTMLElement).click()
          }
        }
      }

      // Tab navigation improvements
      if (event.key === 'Tab') {
        // Add visual focus indicators
        document.body.classList.add('keyboard-navigation')
      }
    }

    const handleMouseDown = () => {
      // Remove keyboard navigation class when mouse is used
      document.body.classList.remove('keyboard-navigation')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])
}

// Focus management hook
export function useFocusManagement() {
  const focusHistory: HTMLElement[] = []

  const pushFocus = (element: HTMLElement) => {
    focusHistory.push(document.activeElement as HTMLElement)
    element.focus()
  }

  const popFocus = () => {
    const previousElement = focusHistory.pop()
    if (previousElement && previousElement.focus) {
      previousElement.focus()
    }
  }

  const trapFocus = (containerSelector: string) => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          event.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          event.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  return { pushFocus, popFocus, trapFocus }
}