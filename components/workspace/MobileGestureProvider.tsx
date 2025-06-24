'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { advancedGestures, SwipeGesture, PinchGesture, LongPressGesture } from '@/lib/mobile/advanced-gestures'
import { trackMobileGesture } from '@/lib/analytics/workspace-analytics'

interface MobileGestureContextType {
  isGestureMode: boolean
  enabledGestures: Set<string>
  toggleGestureMode: () => void
  registerGesture: (type: string, handler: (gesture: any) => void) => () => void
  unregisterGesture: (type: string, handler: (gesture: any) => void) => void
}

const MobileGestureContext = createContext<MobileGestureContextType | null>(null)

interface MobileGestureProviderProps {
  children: React.ReactNode
  defaultEnabled?: boolean
  enabledGestures?: string[]
}

export function MobileGestureProvider({ 
  children, 
  defaultEnabled = true,
  enabledGestures = ['swipe', 'pinch', 'longpress', 'tap']
}: MobileGestureProviderProps) {
  const [isGestureMode, setIsGestureMode] = useState(defaultEnabled)
  const [gestureSet] = useState(new Set(enabledGestures))
  const [registeredHandlers] = useState(new Map<string, Set<(gesture: any) => void>>())

  useEffect(() => {
    if (!isGestureMode) return

    // AI Workspace specific gesture handlers
    const handleSwipe = (gesture: SwipeGesture) => {
      trackMobileGesture('swipe', true)
      
      // Handle workspace-specific swipe actions
      switch (gesture.direction) {
        case 'left':
          // Navigate to next agent or document
          document.dispatchEvent(new CustomEvent('workspace:swipe:left', { detail: gesture }))
          break
        case 'right':
          // Navigate to previous agent or document
          document.dispatchEvent(new CustomEvent('workspace:swipe:right', { detail: gesture }))
          break
        case 'up':
          // Show agent dashboard
          document.dispatchEvent(new CustomEvent('workspace:swipe:up', { detail: gesture }))
          break
        case 'down':
          // Hide panels or show document viewer
          document.dispatchEvent(new CustomEvent('workspace:swipe:down', { detail: gesture }))
          break
      }
    }

    const handlePinch = (gesture: PinchGesture) => {
      trackMobileGesture('pinch', true)
      
      // Handle document zoom or workspace scaling
      if (gesture.scale > 1.2) {
        document.dispatchEvent(new CustomEvent('workspace:zoom:in', { detail: gesture }))
      } else if (gesture.scale < 0.8) {
        document.dispatchEvent(new CustomEvent('workspace:zoom:out', { detail: gesture }))
      }
    }

    const handleLongPress = (gesture: LongPressGesture) => {
      trackMobileGesture('longpress', true)
      
      // Show context menu or agent options
      document.dispatchEvent(new CustomEvent('workspace:context:menu', { detail: gesture }))
    }

    const handleTap = (gesture: any) => {
      trackMobileGesture('tap', true)
      
      // Handle workspace interactions
      document.dispatchEvent(new CustomEvent('workspace:tap', { detail: gesture }))
    }

    const handleEdgeTouch = (gesture: any) => {
      trackMobileGesture('edge-swipe', true)
      
      // Handle edge-based navigation
      switch (gesture.edge) {
        case 'left':
          // Show sidebar
          document.dispatchEvent(new CustomEvent('workspace:sidebar:show', { detail: gesture }))
          break
        case 'right':
          // Show agent panel
          document.dispatchEvent(new CustomEvent('workspace:panel:show', { detail: gesture }))
          break
        case 'top':
          // Show notifications or search
          document.dispatchEvent(new CustomEvent('workspace:header:show', { detail: gesture }))
          break
        case 'bottom':
          // Show quick actions
          document.dispatchEvent(new CustomEvent('workspace:quick:actions', { detail: gesture }))
          break
      }
    }

    const handleForceTouch = (gesture: any) => {
      trackMobileGesture('force-touch', true)
      
      // Handle 3D Touch actions
      if (gesture.stage === 'pop') {
        document.dispatchEvent(new CustomEvent('workspace:force:action', { detail: gesture }))
      }
    }

    // Register default gesture handlers
    const unsubscribeFunctions: (() => void)[] = []

    if (gestureSet.has('swipe')) {
      unsubscribeFunctions.push(advancedGestures.on('swipe', handleSwipe))
    }
    if (gestureSet.has('pinch')) {
      unsubscribeFunctions.push(advancedGestures.on('pinch', handlePinch))
    }
    if (gestureSet.has('longpress')) {
      unsubscribeFunctions.push(advancedGestures.on('longpress', handleLongPress))
    }
    if (gestureSet.has('tap')) {
      unsubscribeFunctions.push(advancedGestures.on('tap', handleTap))
    }
    if (gestureSet.has('edgetouch')) {
      unsubscribeFunctions.push(advancedGestures.on('edgetouch', handleEdgeTouch))
    }
    if (gestureSet.has('forcetouch')) {
      unsubscribeFunctions.push(advancedGestures.on('forcetouch', handleForceTouch))
    }

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
  }, [isGestureMode, gestureSet])

  const registerGesture = (type: string, handler: (gesture: any) => void) => {
    if (!registeredHandlers.has(type)) {
      registeredHandlers.set(type, new Set())
    }
    registeredHandlers.get(type)!.add(handler)
    
    return advancedGestures.on(type, handler)
  }

  const unregisterGesture = (type: string, handler: (gesture: any) => void) => {
    registeredHandlers.get(type)?.delete(handler)
    advancedGestures.off(type, handler)
  }

  const toggleGestureMode = () => {
    setIsGestureMode(!isGestureMode)
    trackMobileGesture('toggle-mode', true)
  }

  const contextValue: MobileGestureContextType = {
    isGestureMode,
    enabledGestures: gestureSet,
    toggleGestureMode,
    registerGesture,
    unregisterGesture
  }

  return (
    <MobileGestureContext.Provider value={contextValue}>
      {children}
    </MobileGestureContext.Provider>
  )
}

export function useMobileGestures() {
  const context = useContext(MobileGestureContext)
  if (!context) {
    // Return a default context for SSR compatibility
    if (typeof window === 'undefined') {
      return {
        isGestureMode: false,
        enabledGestures: new Set<string>(),
        toggleGestureMode: () => {},
        registerGesture: () => () => {},
        unregisterGesture: () => {}
      }
    }
    throw new Error('useMobileGestures must be used within a MobileGestureProvider')
  }
  return context
}

// AI Workspace specific gesture hooks
export function useWorkspaceGestures() {
  const gestures = useMobileGestures()

  useEffect(() => {
    // Skip if on server side
    if (typeof window === 'undefined') return
    const handleWorkspaceSwipe = (event: CustomEvent) => {
      const gesture = event.detail
      console.log('Workspace swipe:', gesture.direction, gesture)
    }

    const handleWorkspaceZoom = (event: CustomEvent) => {
      const gesture = event.detail
      console.log('Workspace zoom:', gesture.scale, gesture)
    }

    const handleWorkspaceContext = (event: CustomEvent) => {
      const gesture = event.detail
      console.log('Workspace context menu:', gesture)
    }

    // Listen for workspace-specific gesture events
    document.addEventListener('workspace:swipe:left', handleWorkspaceSwipe as EventListener)
    document.addEventListener('workspace:swipe:right', handleWorkspaceSwipe as EventListener)
    document.addEventListener('workspace:swipe:up', handleWorkspaceSwipe as EventListener)
    document.addEventListener('workspace:swipe:down', handleWorkspaceSwipe as EventListener)
    document.addEventListener('workspace:zoom:in', handleWorkspaceZoom as EventListener)
    document.addEventListener('workspace:zoom:out', handleWorkspaceZoom as EventListener)
    document.addEventListener('workspace:context:menu', handleWorkspaceContext as EventListener)

    return () => {
      document.removeEventListener('workspace:swipe:left', handleWorkspaceSwipe as EventListener)
      document.removeEventListener('workspace:swipe:right', handleWorkspaceSwipe as EventListener)
      document.removeEventListener('workspace:swipe:up', handleWorkspaceSwipe as EventListener)
      document.removeEventListener('workspace:swipe:down', handleWorkspaceSwipe as EventListener)
      document.removeEventListener('workspace:zoom:in', handleWorkspaceZoom as EventListener)
      document.removeEventListener('workspace:zoom:out', handleWorkspaceZoom as EventListener)
      document.removeEventListener('workspace:context:menu', handleWorkspaceContext as EventListener)
    }
  }, [])

  return {
    ...gestures,
    // Workspace-specific gesture utilities
    simulateSwipe: (direction: 'left' | 'right' | 'up' | 'down') => {
      document.dispatchEvent(new CustomEvent(`workspace:swipe:${direction}`, {
        detail: { direction, simulated: true }
      }))
    },
    simulateZoom: (scale: number) => {
      const zoomType = scale > 1 ? 'in' : 'out'
      document.dispatchEvent(new CustomEvent(`workspace:zoom:${zoomType}`, {
        detail: { scale, simulated: true }
      }))
    }
  }
}

// Hook for document-specific gestures
export function useDocumentGestures() {
  const gestures = useMobileGestures()

  const registerDocumentGesture = (gestureType: string, handler: (gesture: any) => void) => {
    if (typeof window === 'undefined') {
      return () => {} // Return empty cleanup function for SSR
    }
    
    return gestures.registerGesture(gestureType, (gesture) => {
      // Filter for document-specific context
      const target = gesture.target as HTMLElement
      if (target && target.closest('.document-viewer, .document-upload')) {
        handler(gesture)
      }
    })
  }

  return {
    ...gestures,
    registerDocumentGesture
  }
}

// Hook for agent interaction gestures
export function useAgentGestures() {
  const gestures = useMobileGestures()

  const registerAgentGesture = (gestureType: string, handler: (gesture: any) => void) => {
    if (typeof window === 'undefined') {
      return () => {} // Return empty cleanup function for SSR
    }
    
    return gestures.registerGesture(gestureType, (gesture) => {
      // Filter for agent dashboard context
      const target = gesture.target as HTMLElement
      if (target && target.closest('.agent-dashboard, .agent-card, .ai-chat-interface')) {
        handler(gesture)
      }
    })
  }

  return {
    ...gestures,
    registerAgentGesture
  }
}