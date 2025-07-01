'use client'

import { useEffect, useState } from 'react'

/**
 * Portal Root Component
 * Creates a stable container for all portals to prevent DOM conflicts
 */
export function PortalRoot() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Create portal container if it doesn't exist
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

    setMounted(true)

    // Cleanup is handled by unmount
    return () => {
      // Don't remove the portal root to prevent conflicts
      // It will be cleaned up when the page unloads
    }
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