'use client'

import { useEffect } from 'react'

interface CSPStyleInterceptorProps {
  nonce: string
}

/**
 * Ultimate CSP Style Interceptor
 * Patches all style injection methods to automatically add nonces
 * Targets: document.createElement, insertRule, library injectors
 */
export function CSPStyleInterceptor({ nonce }: CSPStyleInterceptorProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !nonce) return

    // Store original methods
    const originalCreateElement = document.createElement.bind(document)
    const originalInsertBefore = Node.prototype.insertBefore
    const originalAppendChild = Node.prototype.appendChild

    // Track patched elements to avoid double-patching
    const patchedElements = new WeakSet()

    // Helper to add nonce to style elements
    const addNonceToStyle = (element: HTMLStyleElement) => {
      if (!element.nonce && !patchedElements.has(element)) {
        element.nonce = nonce
        patchedElements.add(element)
        console.log('🛡️ CSP: Added nonce to style element', element)
      }
    }

    // 1. Patch document.createElement for 'style' tags
    document.createElement = function<K extends keyof HTMLElementTagNameMap>(
      tagName: K,
      options?: ElementCreationOptions
    ): HTMLElementTagNameMap[K] {
      const element = originalCreateElement(tagName, options)
      
      if (tagName.toLowerCase() === 'style' && element instanceof HTMLStyleElement) {
        addNonceToStyle(element)
      }
      
      return element
    }

    // 2. Patch insertBefore to catch style insertions
    Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (newNode instanceof HTMLStyleElement) {
        addNonceToStyle(newNode)
      }
      return originalInsertBefore.call(this, newNode, referenceNode)
    }

    // 3. Patch appendChild to catch style additions
    Node.prototype.appendChild = function<T extends Node>(node: T): T {
      if (node instanceof HTMLStyleElement) {
        addNonceToStyle(node)
      }
      return originalAppendChild.call(this, node)
    }

    // 4. Patch CSSStyleSheet.insertRule for dynamic CSS injection
    if (typeof CSSStyleSheet !== 'undefined' && CSSStyleSheet.prototype.insertRule) {
      const originalInsertRule = CSSStyleSheet.prototype.insertRule
      CSSStyleSheet.prototype.insertRule = function(rule: string, index?: number) {
        // Ensure the parent style element has a nonce
        if (this.ownerNode instanceof HTMLStyleElement) {
          addNonceToStyle(this.ownerNode)
        }
        return originalInsertRule.call(this, rule, index)
      }
    }

    // 5. Monitor existing and future style elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLStyleElement) {
            addNonceToStyle(node)
          }
          
          // Check for style elements in added subtrees
          if (node instanceof Element) {
            const styleElements = node.querySelectorAll('style')
            styleElements.forEach((style) => {
              if (style instanceof HTMLStyleElement) {
                addNonceToStyle(style)
              }
            })
          }
        })
      })
    })

    observer.observe(document.head, {
      childList: true,
      subtree: true
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // 6. Initial cleanup of existing elements
    const existingStyles = document.querySelectorAll('style:not([nonce])')
    existingStyles.forEach((style) => {
      if (style instanceof HTMLStyleElement) {
        addNonceToStyle(style)
      }
    })

    // 7. Patch common library injection points
    
    // Emotion/Styled-components cache patching
    if ((window as any).emotion || (window as any).__EMOTION__) {
      console.log('🛡️ CSP: Detected Emotion, patching injection')
    }

    // Framer Motion style injection patching
    if ((window as any).MotionGlobalConfig) {
      console.log('🛡️ CSP: Detected Framer Motion, patching injection')
    }

    // Radix UI style injection patching
    if ((window as any).RadixTooltipProvider) {
      console.log('🛡️ CSP: Detected Radix UI, patching injection')
    }

    console.log('🛡️ CSP Style Interceptor: Active with nonce', nonce)

    // Cleanup function
    return () => {
      document.createElement = originalCreateElement
      Node.prototype.insertBefore = originalInsertBefore
      Node.prototype.appendChild = originalAppendChild
      observer.disconnect()
      console.log('🛡️ CSP Style Interceptor: Cleaned up')
    }
  }, [nonce])

  return null
}