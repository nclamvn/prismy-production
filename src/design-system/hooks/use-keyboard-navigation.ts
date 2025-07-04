import { useEffect, useRef } from 'react'

// Hook for managing keyboard navigation in components
export const useKeyboardNavigation = (
  items: HTMLElement[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical' | 'both'
    onSelect?: (index: number, item: HTMLElement) => void
    activeIndex?: number
  } = {}
) => {
  const { loop = true, orientation = 'vertical', onSelect, activeIndex = 0 } = options
  const currentIndexRef = useRef(activeIndex)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    currentIndexRef.current = activeIndex
  }, [activeIndex])

  const moveFocus = (direction: 'next' | 'prev' | 'first' | 'last') => {
    if (items.length === 0) return

    let newIndex = currentIndexRef.current

    switch (direction) {
      case 'next':
        newIndex = newIndex + 1
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1
        }
        break
      case 'prev':
        newIndex = newIndex - 1
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0
        }
        break
      case 'first':
        newIndex = 0
        break
      case 'last':
        newIndex = items.length - 1
        break
    }

    const targetItem = items[newIndex]
    if (targetItem) {
      targetItem.focus()
      currentIndexRef.current = newIndex
      onSelect?.(newIndex, targetItem)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const { key } = event

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          moveFocus('next')
        }
        break
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          moveFocus('prev')
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          moveFocus('next')
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          moveFocus('prev')
        }
        break
      case 'Home':
        event.preventDefault()
        moveFocus('first')
        break
      case 'End':
        event.preventDefault()
        moveFocus('last')
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        const currentItem = items[currentIndexRef.current]
        if (currentItem) {
          onSelect?.(currentIndexRef.current, currentItem)
          // Trigger click event for compatibility
          currentItem.click()
        }
        break
    }
  }

  const setupNavigation = (container: HTMLElement) => {
    containerRef.current = container
    container.addEventListener('keydown', handleKeyDown)
    
    // Set initial focus and tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === currentIndexRef.current ? '0' : '-1')
    })

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  return {
    containerRef,
    setupNavigation,
    moveFocus,
    currentIndex: currentIndexRef.current,
  }
}

// Hook for managing focus trap (useful for modals, dropdowns)
export const useFocusTrap = (active: boolean = false) => {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

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

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        // Focus should return to the trigger element
        const trigger = container.getAttribute('data-trigger-id')
        if (trigger) {
          const triggerElement = document.getElementById(trigger)
          triggerElement?.focus()
        }
      }
    }

    // Focus first element when trap becomes active
    firstElement?.focus()

    container.addEventListener('keydown', handleTabKey)
    container.addEventListener('keydown', handleEscapeKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
      container.removeEventListener('keydown', handleEscapeKey)
    }
  }, [active])

  return containerRef
}

// Hook for managing ARIA announcements
export const useAnnouncer = () => {
  const announcerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.style.position = 'absolute'
      announcer.style.left = '-10000px'
      announcer.style.width = '1px'
      announcer.style.height = '1px'
      announcer.style.overflow = 'hidden'
      document.body.appendChild(announcer)
      announcerRef.current = announcer
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current)
      }
    }
  }, [])

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority)
      announcerRef.current.textContent = message
    }
  }

  return { announce }
}

// Hook for managing component IDs for accessibility
export const useId = (prefix: string = 'id') => {
  const idRef = useRef<string | undefined>(undefined)
  
  if (!idRef.current) {
    idRef.current = `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  return idRef.current
}