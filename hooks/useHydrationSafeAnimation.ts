'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook for hydration-safe Framer Motion animations
 * Prevents hydration mismatches by ensuring animations only start after component is mounted
 */
export function useHydrationSafeAnimation() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Set hydrated flag after component mounts (client-side only)
    setIsHydrated(true)
  }, [])

  return {
    isHydrated,
    // Safe initial state for SSR - visible by default
    getInitialState: (animatedState: any) => 
      isHydrated ? animatedState : { opacity: 1, y: 0, scale: 1 },
    // Safe animate state
    getAnimateState: (animatedState: any) => 
      isHydrated ? animatedState : { opacity: 1, y: 0, scale: 1 },
    // Safe transition
    getTransition: (transition: any) => 
      isHydrated ? transition : { duration: 0 }
  }
}

/**
 * Alternative approach: Simple hydration check
 */
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  return isHydrated
}