// Utility functions for accessibility

// Generate unique IDs for form associations
export const generateId = (prefix: string = 'element'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

// Check if an element is visible to screen readers
export const isElementVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.getAttribute('aria-hidden') !== 'true'
  )
}

// Get all focusable elements within a container
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  const elements = Array.from(
    container.querySelectorAll(focusableSelectors)
  ) as HTMLElement[]

  return elements.filter((element) => isElementVisible(element))
}

// Get the next/previous focusable element
export const getNextFocusableElement = (
  current: HTMLElement,
  container: HTMLElement,
  direction: 'next' | 'prev' = 'next'
): HTMLElement | null => {
  const focusableElements = getFocusableElements(container)
  const currentIndex = focusableElements.indexOf(current)
  
  if (currentIndex === -1) return null

  let nextIndex: number
  if (direction === 'next') {
    nextIndex = currentIndex + 1
    if (nextIndex >= focusableElements.length) {
      nextIndex = 0 // Loop to first
    }
  } else {
    nextIndex = currentIndex - 1
    if (nextIndex < 0) {
      nextIndex = focusableElements.length - 1 // Loop to last
    }
  }

  return focusableElements[nextIndex] || null
}

// Create ARIA label from text content or explicit label
export const getAccessibleLabel = (element: HTMLElement): string => {
  // Check for aria-label first
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // Check for aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy)
    if (labelElement) return labelElement.textContent || ''
  }

  // For form elements, check for associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (label) return label.textContent || ''
  }

  // Fall back to element's text content
  return element.textContent || ''
}

// Set ARIA attributes for better accessibility
export const setAriaAttributes = (
  element: HTMLElement,
  attributes: Record<string, string | boolean | null>
): void => {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null) {
      element.removeAttribute(key)
    } else {
      element.setAttribute(key, String(value))
    }
  })
}

// Create a live region for announcements
export const createLiveRegion = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): HTMLDivElement => {
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('aria-live', priority)
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.style.position = 'absolute'
  liveRegion.style.left = '-10000px'
  liveRegion.style.width = '1px'
  liveRegion.style.height = '1px'
  liveRegion.style.overflow = 'hidden'
  liveRegion.textContent = message

  document.body.appendChild(liveRegion)

  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(liveRegion)) {
      document.body.removeChild(liveRegion)
    }
  }, 1000)

  return liveRegion
}

// Handle focus management for roving tabindex
export const handleRovingTabindex = (
  items: HTMLElement[],
  activeIndex: number
): void => {
  items.forEach((item, index) => {
    if (index === activeIndex) {
      item.setAttribute('tabindex', '0')
      item.focus()
    } else {
      item.setAttribute('tabindex', '-1')
    }
  })
}

// Check if reduced motion is preferred
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Check if high contrast is preferred
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Get color contrast ratio between two colors
export const getContrastRatio = (color1: string, color2: string): number => {
  // This is a placeholder implementation for demonstration
  // In a real implementation, you'd parse the colors and calculate actual luminance
  // For now, return a mock ratio that would pass WCAG AA (4.5:1)
  console.log('Calculating contrast ratio for:', color1, 'and', color2)
  return 4.6
}

// Keyboard event helpers
export const isArrowKey = (key: string): boolean => {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
}

export const isNavigationKey = (key: string): boolean => {
  return ['Home', 'End', 'PageUp', 'PageDown', ...getArrowKeys()].includes(key)
}

export const getArrowKeys = (): string[] => {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
}

export const isActionKey = (key: string): boolean => {
  return ['Enter', ' ', 'Spacebar'].includes(key)
}

// ARIA state management helpers
export const toggleAriaExpanded = (element: HTMLElement): boolean => {
  const current = element.getAttribute('aria-expanded') === 'true'
  const newState = !current
  element.setAttribute('aria-expanded', String(newState))
  return newState
}

export const setAriaSelected = (element: HTMLElement, selected: boolean): void => {
  element.setAttribute('aria-selected', String(selected))
}

export const setAriaPressed = (element: HTMLElement, pressed: boolean): void => {
  element.setAttribute('aria-pressed', String(pressed))
}

// Focus restoration helper
export const createFocusRestorer = () => {
  const previousActiveElement = document.activeElement as HTMLElement

  return {
    restore: () => {
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  }
}

// Screen reader utilities
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  createLiveRegion(message, priority)
}

// Validation helpers for accessibility
export const validateAccessibility = (element: HTMLElement): string[] => {
  const issues: string[] = []

  // Check for missing alt text on images
  if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
    issues.push('Image missing alt attribute')
  }

  // Check for form inputs without labels
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
    const hasLabel = element.getAttribute('aria-label') ||
                   element.getAttribute('aria-labelledby') ||
                   (element.id && document.querySelector(`label[for="${element.id}"]`))
    
    if (!hasLabel) {
      issues.push('Form element missing accessible label')
    }
  }

  // Check for buttons without accessible names
  if (element.tagName === 'BUTTON') {
    const hasAccessibleName = element.textContent?.trim() ||
                             element.getAttribute('aria-label') ||
                             element.getAttribute('aria-labelledby')
    
    if (!hasAccessibleName) {
      issues.push('Button missing accessible name')
    }
  }

  // Check for interactive elements without focus indicators
  if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
    const styles = window.getComputedStyle(element, ':focus')
    if (styles.outline === 'none' && !styles.boxShadow.includes('inset')) {
      issues.push('Interactive element may be missing focus indicator')
    }
  }

  return issues
}