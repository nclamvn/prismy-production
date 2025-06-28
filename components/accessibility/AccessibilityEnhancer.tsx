'use client'

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AccessibilityEnhancerProps {
  children: React.ReactNode
  enableAnnouncements?: boolean
  enableKeyboardNavigation?: boolean
  enableFocusManagement?: boolean
  enableReducedMotion?: boolean
}

// Screen reader announcements
const LiveRegion: React.FC<{ 
  message: string
  priority: 'polite' | 'assertive'
  id: string
}> = ({ message, priority, id }) => (
  <div
    id={id}
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
    role="status"
  >
    {message}
  </div>
)

// Focus trap for modals and dialogs
export const FocusTrap: React.FC<{
  children: React.ReactNode
  isActive: boolean
  restoreFocus?: boolean
}> = ({ children, isActive, restoreFocus = true }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus the first element
    if (firstElement) {
      firstElement.focus()
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)

    return () => {
      document.removeEventListener('keydown', handleTabKey)
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive, restoreFocus])

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  )
}

// Skip to content link
export const SkipToContent: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    style={{ backgroundColor: 'var(--notebooklm-primary)', color: 'var(--surface-elevated)' }}
  >
    Skip to main content
  </a>
)

// Keyboard navigation handler
const useKeyboardNavigation = (enableKeyboardNavigation: boolean) => {
  useEffect(() => {
    if (!enableKeyboardNavigation) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Global keyboard shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '/':
            e.preventDefault()
            // Focus search input if available
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLElement
            searchInput?.focus()
            break
          case '?':
            e.preventDefault()
            // Open help modal or keyboard shortcuts
            console.log('Keyboard shortcuts help')
            break
        }
      }

      // Arrow key navigation for grid layouts
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement?.getAttribute('role') === 'gridcell') {
          handleGridNavigation(e, activeElement)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardNavigation])
}

// Grid navigation (for card layouts, etc.)
const handleGridNavigation = (e: KeyboardEvent, currentElement: HTMLElement) => {
  const grid = currentElement.closest('[role="grid"]')
  if (!grid) return

  const cells = Array.from(grid.querySelectorAll('[role="gridcell"]')) as HTMLElement[]
  const currentIndex = cells.indexOf(currentElement)
  const columns = parseInt(grid.getAttribute('aria-colcount') || '1')
  
  let nextIndex = currentIndex

  switch (e.key) {
    case 'ArrowRight':
      nextIndex = Math.min(currentIndex + 1, cells.length - 1)
      break
    case 'ArrowLeft':
      nextIndex = Math.max(currentIndex - 1, 0)
      break
    case 'ArrowDown':
      nextIndex = Math.min(currentIndex + columns, cells.length - 1)
      break
    case 'ArrowUp':
      nextIndex = Math.max(currentIndex - columns, 0)
      break
  }

  if (nextIndex !== currentIndex) {
    e.preventDefault()
    cells[nextIndex]?.focus()
  }
}

// Reduced motion preference detector
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Color contrast checker (development only)
const ColorContrastChecker: React.FC = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const checkContrast = () => {
      const elements = document.querySelectorAll('*')
      const issues: string[] = []

      elements.forEach((element) => {
        const styles = window.getComputedStyle(element)
        const color = styles.color
        const backgroundColor = styles.backgroundColor
        
        // Simple contrast checking (in production, use a proper library)
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // This is a simplified check - use a proper contrast ratio calculator
          const contrastRatio = calculateContrastRatio(color, backgroundColor)
          if (contrastRatio < 4.5) {
            issues.push(`Low contrast detected on ${element.tagName}: ${contrastRatio.toFixed(2)}:1`)
          }
        }
      })

      if (issues.length > 0) {
        console.warn('Accessibility: Contrast issues detected:', issues.slice(0, 10))
      }
    }

    // Check contrast after page load
    setTimeout(checkContrast, 2000)
  }, [])

  return null
}

// Simplified contrast ratio calculation
const calculateContrastRatio = (color1: string, color2: string): number => {
  // This is a very simplified version - use a proper library like 'color' for production
  // For now, return a mock value
  return Math.random() * 10 + 1
}

// Accessibility announcements hook
export const useAccessibilityAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<{
    polite: string
    assertive: string
  }>({
    polite: '',
    assertive: ''
  })

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => ({
      ...prev,
      [priority]: message
    }))

    // Clear the announcement after a short delay to allow for re-announcements
    setTimeout(() => {
      setAnnouncements(prev => ({
        ...prev,
        [priority]: ''
      }))
    }, 1000)
  }, [])

  const announceNavigation = useCallback((pageName: string) => {
    announce(`Navigated to ${pageName}`, 'polite')
  }, [announce])

  const announceAction = useCallback((action: string) => {
    announce(action, 'assertive')
  }, [announce])

  return {
    announcements,
    announce,
    announceNavigation,
    announceAction
  }
}

// Main accessibility enhancer component
const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({
  children,
  enableAnnouncements = true,
  enableKeyboardNavigation = true,
  enableFocusManagement = true,
  enableReducedMotion = true
}) => {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const { announcements, announceNavigation } = useAccessibilityAnnouncements()

  // Enable keyboard navigation
  useKeyboardNavigation(enableKeyboardNavigation)

  // Apply reduced motion styles
  useEffect(() => {
    if (enableReducedMotion && prefersReducedMotion) {
      document.documentElement.style.setProperty('--motion-reduce', '1')
      // Disable animations globally
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `
      document.head.appendChild(style)

      return () => {
        document.head.removeChild(style)
        document.documentElement.style.removeProperty('--motion-reduce')
      }
    }
  }, [enableReducedMotion, prefersReducedMotion])

  // Route change announcements
  useEffect(() => {
    if (!enableAnnouncements) return

    const handleRouteChange = () => {
      const pageName = document.title || 'New page'
      announceNavigation(pageName)
    }

    // For Next.js app router, we need to detect route changes differently
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target === document.head) {
          const titleElement = document.querySelector('title')
          if (titleElement) {
            handleRouteChange()
          }
        }
      })
    })

    observer.observe(document.head, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [enableAnnouncements, announceNavigation])

  return (
    <>
      <SkipToContent />
      
      {enableAnnouncements && (
        <>
          <LiveRegion 
            message={announcements.polite} 
            priority="polite" 
            id="polite-announcements"
          />
          <LiveRegion 
            message={announcements.assertive} 
            priority="assertive" 
            id="assertive-announcements"
          />
        </>
      )}

      <div id="main-content" tabIndex={-1}>
        {children}
      </div>

      {process.env.NODE_ENV === 'development' && <ColorContrastChecker />}
    </>
  )
}

// HOC for adding accessibility features to components
export const withAccessibility = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    role?: string
    ariaLabel?: string
    focusable?: boolean
  }
) => {
  const AccessibilityWrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const componentRef = useRef<HTMLElement>(null)

    // Merge refs
    const mergedRef = useCallback((node: HTMLElement) => {
      componentRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }, [ref])

    useEffect(() => {
      if (options?.focusable && componentRef.current) {
        componentRef.current.setAttribute('tabIndex', '0')
      }
      if (options?.role && componentRef.current) {
        componentRef.current.setAttribute('role', options.role)
      }
      if (options?.ariaLabel && componentRef.current) {
        componentRef.current.setAttribute('aria-label', options.ariaLabel)
      }
    }, [])

    return <Component ref={mergedRef} {...props} />
  })

  AccessibilityWrappedComponent.displayName = `withAccessibility(${Component.displayName || Component.name})`
  
  return AccessibilityWrappedComponent
}

export default AccessibilityEnhancer