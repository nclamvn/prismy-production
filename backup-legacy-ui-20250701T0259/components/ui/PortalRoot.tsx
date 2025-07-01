'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Hydration-Safe Portal Root Component
 * Creates a stable container for all portals with safe DOM manipulation
 */
export function PortalRoot() {
  const [mounted, setMounted] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Store original DOM methods before patching
    const originalRemoveChild = Node.prototype.removeChild
    const originalAppendChild = Node.prototype.appendChild
    const originalInsertBefore = Node.prototype.insertBefore

    // Patch DOM methods for safer operations across all portals
    Node.prototype.removeChild = function<T extends Node>(child: T): T {
      try {
        // Only remove if child is actually a child of this node
        if (this.contains(child) && child.parentNode === this) {
          return originalRemoveChild.call(this, child)
        }
        console.warn('PortalRoot: Prevented invalid removeChild operation')
        return child
      } catch (error) {
        console.warn('PortalRoot: Safe removeChild prevented error', error)
        return child
      }
    }

    Node.prototype.appendChild = function<T extends Node>(child: T): T {
      try {
        // Remove from previous parent if exists
        if (child.parentNode && child.parentNode !== this) {
          if (child.parentNode.contains(child)) {
            originalRemoveChild.call(child.parentNode, child)
          }
        }
        
        if (!this.contains(child)) {
          return originalAppendChild.call(this, child)
        }
        return child
      } catch (error) {
        console.warn('PortalRoot: Safe appendChild prevented error', error)
        return child
      }
    }

    Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
      try {
        // Remove from previous parent if exists
        if (newNode.parentNode && newNode.parentNode !== this) {
          if (newNode.parentNode.contains(newNode)) {
            originalRemoveChild.call(newNode.parentNode, newNode)
          }
        }

        if (!this.contains(newNode)) {
          return originalInsertBefore.call(this, newNode, referenceNode)
        }
        return newNode
      } catch (error) {
        console.warn('PortalRoot: Safe insertBefore prevented error', error)
        return newNode
      }
    }

    // Create portal container safely
    let portalRoot = document.getElementById('portal-root')
    
    if (!portalRoot) {
      portalRoot = document.createElement('div')
      portalRoot.id = 'portal-root'
      portalRoot.style.position = 'fixed'
      portalRoot.style.top = '0'
      portalRoot.style.left = '0'
      portalRoot.style.zIndex = '9999'
      portalRoot.style.pointerEvents = 'none'
      
      try {
        document.body.appendChild(portalRoot)
      } catch (error) {
        console.warn('PortalRoot: Failed to append portal root', error)
      }
    }

    setMounted(true)
    console.log('🛡️ PortalRoot: Hydration-safe DOM patching active')

    // Store cleanup function
    cleanupRef.current = () => {
      Node.prototype.removeChild = originalRemoveChild
      Node.prototype.appendChild = originalAppendChild
      Node.prototype.insertBefore = originalInsertBefore
      console.log('🛡️ PortalRoot: DOM patches restored')
    }

    return cleanupRef.current
  }, [])

  if (!mounted) return null

  return null // This component doesn't render anything visible
}

export function getPortalRoot(): HTMLElement {
  let portalRoot = document.getElementById('portal-root')
  
  if (!portalRoot) {
    portalRoot = document.createElement('div')
    portalRoot.id = 'portal-root'
    portalRoot.style.position = 'fixed'
    portalRoot.style.top = '0'
    portalRoot.style.left = '0'
    portalRoot.style.zIndex = '9999'
    portalRoot.style.pointerEvents = 'none'
    document.body.appendChild(portalRoot)
  }
  
  return portalRoot
}