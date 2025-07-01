'use client'

import { useEffect } from 'react'

interface CSPSafeStylesProps {
  nonce: string
}

/**
 * CSP-Safe Styles Component
 * Ensures all runtime styles use proper nonces for CSP compliance
 */
export function CSPSafeStyles({ nonce }: CSPSafeStylesProps) {
  useEffect(() => {
    // Set the nonce on any dynamically created style elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLStyleElement && !node.nonce) {
            node.nonce = nonce
          }
        })
      })
    })

    observer.observe(document.head, {
      childList: true,
      subtree: true,
    })

    // Clean up existing style elements without nonces
    const existingStyles = document.querySelectorAll('style:not([nonce])')
    existingStyles.forEach((style) => {
      if (style instanceof HTMLStyleElement) {
        style.nonce = nonce
      }
    })

    return () => observer.disconnect()
  }, [nonce])

  return null
}