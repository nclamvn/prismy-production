import { useRef, useEffect, useCallback, useState } from 'react'

export interface GestureState {
  isActive: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  deltaX: number
  deltaY: number
  distance: number
  direction: 'up' | 'down' | 'left' | 'right' | null
  velocity: number
  timestamp: number
}

export interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right'
  distance: number
  velocity: number
  duration: number
}

export interface PinchGesture {
  scale: number
  centerX: number
  centerY: number
  deltaScale: number
}

export interface GestureHandlers {
  onSwipe?: (gesture: SwipeGesture) => void
  onPinch?: (gesture: PinchGesture) => void
  onTap?: (x: number, y: number) => void
  onDoubleTap?: (x: number, y: number) => void
  onLongPress?: (x: number, y: number) => void
  onPan?: (state: GestureState) => void
  onPanStart?: (state: GestureState) => void
  onPanEnd?: (state: GestureState) => void
}

export interface GestureOptions {
  swipeThreshold?: number
  velocityThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
  pinchThreshold?: number
  panThreshold?: number
  preventDefault?: boolean
  stopPropagation?: boolean
}

export function useGestures(
  handlers: GestureHandlers,
  options: GestureOptions = {}
) {
  const {
    swipeThreshold = 50,
    velocityThreshold = 0.3,
    longPressDelay = 500,
    doubleTapDelay = 300,
    pinchThreshold = 0.1,
    panThreshold = 10,
    preventDefault = true,
    stopPropagation = false
  } = options

  const [gestureState, setGestureState] = useState<GestureState | null>(null)
  const elementRef = useRef<HTMLElement>(null)
  
  // Touch tracking
  const touchesRef = useRef<TouchList | null>(null)
  const initialDistanceRef = useRef<number>(0)
  const lastTapRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const panStartedRef = useRef<boolean>(false)

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0
    
    const touch1 = touches[0]
    const touch2 = touches[1]
    
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Get center point of touch gestures
  const getTouchCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY }
    }
    
    const touch1 = touches[0]
    const touch2 = touches[1]
    
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }, [])

  // Determine swipe direction
  const getSwipeDirection = useCallback((deltaX: number, deltaY: number): 'up' | 'down' | 'left' | 'right' => {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (preventDefault) event.preventDefault()
    if (stopPropagation) event.stopPropagation()

    const touches = event.touches
    touchesRef.current = touches
    
    const center = getTouchCenter(touches)
    
    // Initialize gesture state
    const state: GestureState = {
      isActive: true,
      startX: center.x,
      startY: center.y,
      currentX: center.x,
      currentY: center.y,
      deltaX: 0,
      deltaY: 0,
      distance: 0,
      direction: null,
      velocity: 0,
      timestamp: Date.now()
    }
    
    setGestureState(state)
    panStartedRef.current = false

    // Setup long press detection for single touch
    if (touches.length === 1 && handlers.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        handlers.onLongPress!(center.x, center.y)
      }, longPressDelay)
    }

    // Track initial distance for pinch gestures
    if (touches.length === 2) {
      initialDistanceRef.current = getTouchDistance(touches)
    }
  }, [
    preventDefault,
    stopPropagation,
    getTouchCenter,
    getTouchDistance,
    handlers.onLongPress,
    longPressDelay
  ])

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (preventDefault) event.preventDefault()
    if (stopPropagation) event.stopPropagation()

    const touches = event.touches
    if (!gestureState || !touchesRef.current) return

    // Clear long press timer on movement
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const center = getTouchCenter(touches)
    const deltaX = center.x - gestureState.startX
    const deltaY = center.y - gestureState.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const direction = distance > panThreshold ? getSwipeDirection(deltaX, deltaY) : null
    
    const now = Date.now()
    const timeDelta = now - gestureState.timestamp
    const velocity = timeDelta > 0 ? distance / timeDelta : 0

    const newState: GestureState = {
      ...gestureState,
      currentX: center.x,
      currentY: center.y,
      deltaX,
      deltaY,
      distance,
      direction,
      velocity,
      timestamp: now
    }

    setGestureState(newState)

    // Handle pinch gesture
    if (touches.length === 2 && handlers.onPinch) {
      const currentDistance = getTouchDistance(touches)
      const scale = currentDistance / initialDistanceRef.current
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        handlers.onPinch({
          scale,
          centerX: center.x,
          centerY: center.y,
          deltaScale: scale - 1
        })
      }
    }

    // Handle pan gesture
    if (touches.length === 1 && distance > panThreshold) {
      if (!panStartedRef.current) {
        panStartedRef.current = true
        handlers.onPanStart?.(newState)
      }
      handlers.onPan?.(newState)
    }
  }, [
    preventDefault,
    stopPropagation,
    gestureState,
    getTouchCenter,
    getTouchDistance,
    getSwipeDirection,
    panThreshold,
    pinchThreshold,
    handlers.onPinch,
    handlers.onPan,
    handlers.onPanStart
  ])

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (preventDefault) event.preventDefault()
    if (stopPropagation) event.stopPropagation()

    if (!gestureState) return

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const { distance, velocity, direction, startX, startY } = gestureState
    const duration = Date.now() - gestureState.timestamp

    // Handle tap gestures
    if (distance < panThreshold && event.changedTouches.length === 1) {
      const now = Date.now()
      
      if (now - lastTapRef.current < doubleTapDelay && handlers.onDoubleTap) {
        handlers.onDoubleTap(startX, startY)
        lastTapRef.current = 0 // Reset to prevent triple tap
      } else {
        lastTapRef.current = now
        // Delay single tap to check for double tap
        setTimeout(() => {
          if (lastTapRef.current === now && handlers.onTap) {
            handlers.onTap(startX, startY)
          }
        }, doubleTapDelay)
      }
    }

    // Handle swipe gestures
    if (distance > swipeThreshold && velocity > velocityThreshold && direction && handlers.onSwipe) {
      handlers.onSwipe({
        direction,
        distance,
        velocity,
        duration
      })
    }

    // Handle pan end
    if (panStartedRef.current && handlers.onPanEnd) {
      handlers.onPanEnd(gestureState)
    }

    // Reset state
    setGestureState(null)
    touchesRef.current = null
    panStartedRef.current = false
    initialDistanceRef.current = 0
  }, [
    preventDefault,
    stopPropagation,
    gestureState,
    panThreshold,
    swipeThreshold,
    velocityThreshold,
    doubleTapDelay,
    handlers.onDoubleTap,
    handlers.onTap,
    handlers.onSwipe,
    handlers.onPanEnd
  ])

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      
      // Clean up timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    ref: elementRef,
    gestureState,
    isGestureActive: gestureState?.isActive ?? false
  }
}

// Hook for specific gesture types
export function useSwipeGesture(
  onSwipe: (gesture: SwipeGesture) => void,
  options: GestureOptions = {}
) {
  return useGestures({ onSwipe }, options)
}

export function usePinchGesture(
  onPinch: (gesture: PinchGesture) => void,
  options: GestureOptions = {}
) {
  return useGestures({ onPinch }, options)
}

export function useTapGesture(
  onTap?: (x: number, y: number) => void,
  onDoubleTap?: (x: number, y: number) => void,
  options: GestureOptions = {}
) {
  return useGestures({ onTap, onDoubleTap }, options)
}

export function usePanGesture(
  onPan: (state: GestureState) => void,
  onPanStart?: (state: GestureState) => void,
  onPanEnd?: (state: GestureState) => void,
  options: GestureOptions = {}
) {
  return useGestures({ onPan, onPanStart, onPanEnd }, options)
}

// Utility function to determine if device supports touch
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  )
}

// Utility function to get gesture-friendly CSS
export function getGestureCss(): React.CSSProperties {
  return {
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    WebkitTapHighlightColor: 'transparent'
  }
}