'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface HydrationSafePortalProps {
  children: React.ReactNode
  target?: string | Element
  enabled?: boolean
}

/**
 * Hydration-Safe Portal
 * Prevents React DOM removeChild errors by managing portal lifecycle safely
 */
export function HydrationSafePortal({ 
  children, 
  target = 'body', 
  enabled = true 
}: HydrationSafePortalProps) {
  const [mounted, setMounted] = useState(false)
  const [portalTarget, setPortalTarget] = useState<Element | null>(null)
  const portalRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!enabled) return

    let targetElement: Element | null = null

    if (typeof target === 'string') {
      targetElement = document.querySelector(target)
    } else {
      targetElement = target
    }

    if (targetElement) {
      portalRef.current = targetElement
      setPortalTarget(targetElement)
      setMounted(true)
    }

    return () => {
      // Cleanup: safely remove portal without causing removeChild errors
      setMounted(false)
      setPortalTarget(null)
      portalRef.current = null
    }
  }, [target, enabled])

  // Prevent SSR hydration issues
  if (!mounted || !portalTarget || !enabled) {
    return null
  }

  try {
    return createPortal(children, portalTarget)
  } catch (error) {
    console.warn('HydrationSafePortal: Portal creation failed', error)
    return null
  }
}

/**
 * Safe DOM Manipulator
 * Provides safe methods for DOM operations that won't cause removeChild errors
 */
export class SafeDOMManipulator {
  private static removedNodes = new WeakSet()

  static safeRemoveChild(parent: Node, child: Node): boolean {
    try {
      // Check if node is still a child before removal
      if (parent.contains(child) && !this.removedNodes.has(child)) {
        this.removedNodes.add(child)
        parent.removeChild(child)
        return true
      }
    } catch (error) {
      console.warn('SafeDOMManipulator: Safe removal failed', error)
    }
    return false
  }

  static safeAppendChild(parent: Node, child: Node): boolean {
    try {
      // Ensure child isn't already appended elsewhere
      if (child.parentNode && child.parentNode !== parent) {
        this.safeRemoveChild(child.parentNode, child)
      }
      
      if (!parent.contains(child)) {
        parent.appendChild(child)
        return true
      }
    } catch (error) {
      console.warn('SafeDOMManipulator: Safe append failed', error)
    }
    return false
  }

  static safeInsertBefore(parent: Node, newNode: Node, referenceNode: Node | null): boolean {
    try {
      if (newNode.parentNode && newNode.parentNode !== parent) {
        this.safeRemoveChild(newNode.parentNode, newNode)
      }

      if (!parent.contains(newNode)) {
        parent.insertBefore(newNode, referenceNode)
        return true
      }
    } catch (error) {
      console.warn('SafeDOMManipulator: Safe insert failed', error)
    }
    return false
  }
}

/**
 * Hydration Safety Provider
 * Wraps components that might cause hydration issues
 */
export function HydrationSafeWrapper({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return null
  }

  return <>{children}</>
}