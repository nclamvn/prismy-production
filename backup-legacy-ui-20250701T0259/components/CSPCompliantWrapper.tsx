'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface CSPCompliantWrapperProps {
  children: React.ReactNode
  nonce?: string
  className?: string
}

/**
 * CSP Compliant Wrapper
 * Ensures all child components and their styles are CSP-compliant
 */
export function CSPCompliantWrapper({ 
  children, 
  nonce, 
  className = '' 
}: CSPCompliantWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !nonce) return

    const container = containerRef.current

    // Remove any inline styles from child elements
    const removeInlineStyles = (element: HTMLElement) => {
      // Remove style attribute if present
      if (element.hasAttribute('style')) {
        element.removeAttribute('style')
      }

      // Process all child elements
      Array.from(element.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          removeInlineStyles(child)
        }
      })
    }

    // Observer to catch any dynamically added inline styles
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement
          if (target && target.hasAttribute('style')) {
            console.warn('CSP: Removed inline style from', target)
            target.removeAttribute('style')
          }
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            removeInlineStyles(node)
          }
        })
      })
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    })

    // Initial cleanup
    removeInlineStyles(container)

    return () => observer.disconnect()
  }, [nonce])

  return (
    <div 
      ref={containerRef}
      className={`csp-compliant-wrapper ${className}`}
      data-csp-nonce={nonce}
    >
      {children}
    </div>
  )
}