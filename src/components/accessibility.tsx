'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Skip to main content link for screen readers
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium"
    >
      Skip to main content
    </a>
  )
}

// Accessible focus trap for modals/dialogs
export function FocusTrap({ children, active = true }: { children: React.ReactNode; active?: boolean }) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

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

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [active])

  return (
    <div ref={containerRef} className={cn(active && 'focus-within:outline-none')}>
      {children}
    </div>
  )
}

// Screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

// Accessible heading component
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
  id?: string
}

export function Heading({ level, children, className, id }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  
  return (
    <Tag 
      id={id}
      className={cn(
        'scroll-mt-20', // Account for sticky header
        level === 1 && 'text-4xl font-bold tracking-tight',
        level === 2 && 'text-3xl font-semibold tracking-tight',
        level === 3 && 'text-2xl font-semibold tracking-tight',
        level === 4 && 'text-xl font-semibold tracking-tight',
        level === 5 && 'text-lg font-semibold tracking-tight',
        level === 6 && 'text-base font-semibold tracking-tight',
        className
      )}
    >
      {children}
    </Tag>
  )
}

// Accessible live region for dynamic content announcements
export function LiveRegion({ 
  children, 
  politeness = 'polite',
  className 
}: { 
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  className?: string 
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

// Keyboard navigation hook
export function useKeyboardNavigation(
  items: React.RefObject<HTMLElement>[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical'
  } = {}
) {
  const { loop = true, orientation = 'vertical' } = options
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      const isVertical = orientation === 'vertical'
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

      if (event.key === nextKey) {
        event.preventDefault()
        setCurrentIndex((prev) => {
          const next = prev + 1
          return next >= items.length ? (loop ? 0 : prev) : next
        })
      } else if (event.key === prevKey) {
        event.preventDefault()
        setCurrentIndex((prev) => {
          const next = prev - 1
          return next < 0 ? (loop ? items.length - 1 : prev) : next
        })
      } else if (event.key === 'Home') {
        event.preventDefault()
        setCurrentIndex(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        setCurrentIndex(items.length - 1)
      }
    },
    [items.length, loop, orientation]
  )

  React.useEffect(() => {
    items[currentIndex]?.current?.focus()
  }, [currentIndex, items])

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown
  }
}

// Accessible button with proper ARIA attributes
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  isPressed?: boolean
  isExpanded?: boolean
  controls?: string
  describedBy?: string
}

export function AccessibleButton({
  children,
  isPressed,
  isExpanded,
  controls,
  describedBy,
  className,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      {...props}
      aria-pressed={isPressed}
      aria-expanded={isExpanded}
      aria-controls={controls}
      aria-describedby={describedBy}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors',
        className
      )}
    >
      {children}
    </button>
  )
}