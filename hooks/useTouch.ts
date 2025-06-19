import { useRef, useEffect, useCallback } from 'react'

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

interface PinchGesture {
  scale: number
  center: { x: number; y: number }
  velocity: number
}

interface TapGesture {
  x: number
  y: number
  count: number
  timestamp: number
}

interface LongPressGesture {
  x: number
  y: number
  duration: number
}

interface TouchGestureOptions {
  onSwipe?: (gesture: SwipeGesture) => void
  onPinch?: (gesture: PinchGesture) => void
  onTap?: (gesture: TapGesture) => void
  onDoubleTap?: (gesture: TapGesture) => void
  onLongPress?: (gesture: LongPressGesture) => void
  onTouchStart?: (event: TouchEvent) => void
  onTouchMove?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
  
  // Configuration
  swipeThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
  pinchThreshold?: number
  preventScroll?: boolean
}

export function useTouch(options: TouchGestureOptions = {}) {
  const {
    onSwipe,
    onPinch,
    onTap,
    onDoubleTap,
    onLongPress,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    pinchThreshold = 10,
    preventScroll = false
  } = options

  const startTouch = useRef<TouchPoint | null>(null)
  const lastTap = useRef<TapGesture | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const initialPinchDistance = useRef<number | null>(null)
  const lastPinchScale = useRef<number>(1)
  const isLongPressing = useRef<boolean>(false)
  const elementRef = useRef<HTMLElement | null>(null)

  const getTouchPoint = useCallback((touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now()
  }), [])

  const getDistance = useCallback((point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getPinchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getPinchCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) return { x: 0, y: 0 }
    const touch1 = touches[0]
    const touch2 = touches[1]
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }, [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    onTouchStart?.(event)

    if (event.touches.length === 1) {
      // Single touch - potential swipe, tap, or long press
      const touch = getTouchPoint(event.touches[0])
      startTouch.current = touch
      isLongPressing.current = false

      // Start long press timer
      longPressTimer.current = setTimeout(() => {
        if (startTouch.current) {
          isLongPressing.current = true
          onLongPress?.({
            x: startTouch.current.x,
            y: startTouch.current.y,
            duration: longPressDelay
          })
        }
      }, longPressDelay)

    } else if (event.touches.length === 2) {
      // Two touches - potential pinch
      const distance = getPinchDistance(event.touches)
      initialPinchDistance.current = distance
      lastPinchScale.current = 1
      
      // Clear any ongoing single-touch gestures
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    if (preventScroll) {
      event.preventDefault()
    }
  }, [getTouchPoint, onTouchStart, onLongPress, longPressDelay, preventScroll])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    onTouchMove?.(event)

    if (event.touches.length === 1 && startTouch.current) {
      // Single touch movement - check if we should cancel long press
      const currentTouch = getTouchPoint(event.touches[0])
      const distance = getDistance(startTouch.current, currentTouch)
      
      if (distance > 10 && longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }

    } else if (event.touches.length === 2 && initialPinchDistance.current) {
      // Two touches - handle pinch
      const currentDistance = getPinchDistance(event.touches)
      const scale = currentDistance / initialPinchDistance.current
      const center = getPinchCenter(event.touches)
      
      if (Math.abs(scale - lastPinchScale.current) > 0.1) {
        const velocity = scale - lastPinchScale.current
        onPinch?.({
          scale,
          center,
          velocity
        })
        lastPinchScale.current = scale
      }
    }

    if (preventScroll) {
      event.preventDefault()
    }
  }, [getTouchPoint, getDistance, getPinchDistance, getPinchCenter, onTouchMove, onPinch, preventScroll])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    onTouchEnd?.(event)

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (event.changedTouches.length === 1 && startTouch.current && !isLongPressing.current) {
      const endTouch = getTouchPoint(event.changedTouches[0])
      const distance = getDistance(startTouch.current, endTouch)
      const duration = endTouch.timestamp - startTouch.current.timestamp

      if (distance < 10 && duration < 300) {
        // This is a tap
        const tapGesture: TapGesture = {
          x: endTouch.x,
          y: endTouch.y,
          count: 1,
          timestamp: endTouch.timestamp
        }

        // Check for double tap
        if (lastTap.current && 
            endTouch.timestamp - lastTap.current.timestamp < doubleTapDelay &&
            getDistance(endTouch, lastTap.current) < 50) {
          
          tapGesture.count = 2
          onDoubleTap?.(tapGesture)
          lastTap.current = null
        } else {
          onTap?.(tapGesture)
          lastTap.current = tapGesture
          
          // Clear last tap after delay
          setTimeout(() => {
            if (lastTap.current === tapGesture) {
              lastTap.current = null
            }
          }, doubleTapDelay)
        }

      } else if (distance >= swipeThreshold) {
        // This is a swipe
        const dx = endTouch.x - startTouch.current.x
        const dy = endTouch.y - startTouch.current.y
        const velocity = distance / duration

        let direction: SwipeGesture['direction']
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? 'right' : 'left'
        } else {
          direction = dy > 0 ? 'down' : 'up'
        }

        onSwipe?.({
          direction,
          distance,
          velocity,
          duration
        })
      }
    }

    // Reset touch state
    if (event.touches.length === 0) {
      startTouch.current = null
      initialPinchDistance.current = null
      lastPinchScale.current = 1
      isLongPressing.current = false
    }

    if (preventScroll) {
      event.preventDefault()
    }
  }, [getTouchPoint, getDistance, onTouchEnd, onTap, onDoubleTap, onSwipe, doubleTapDelay, swipeThreshold])

  const bindToElement = useCallback((element: HTMLElement | null) => {
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchstart', handleTouchStart)
      elementRef.current.removeEventListener('touchmove', handleTouchMove)
      elementRef.current.removeEventListener('touchend', handleTouchEnd)
    }

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll })
      element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll })
      element.addEventListener('touchend', handleTouchEnd, { passive: !preventScroll })
      elementRef.current = element
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll])

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', handleTouchStart)
        elementRef.current.removeEventListener('touchmove', handleTouchMove)
        elementRef.current.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    bindToElement,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Hook for simple swipe detection
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) {
  return useTouch({
    swipeThreshold: threshold,
    onSwipe: (gesture) => {
      switch (gesture.direction) {
        case 'left':
          onSwipeLeft?.()
          break
        case 'right':
          onSwipeRight?.()
          break
        case 'up':
          onSwipeUp?.()
          break
        case 'down':
          onSwipeDown?.()
          break
      }
    }
  })
}

// Hook for pinch-to-zoom
export function usePinchZoom(
  onZoom: (scale: number) => void,
  minScale: number = 0.5,
  maxScale: number = 3
) {
  const currentScale = useRef(1)

  return useTouch({
    onPinch: (gesture) => {
      const newScale = Math.max(minScale, Math.min(maxScale, currentScale.current * gesture.scale))
      if (newScale !== currentScale.current) {
        currentScale.current = newScale
        onZoom(newScale)
      }
    }
  })
}

// Hook for pull-to-refresh
export function usePullToRefresh(
  onRefresh: () => void,
  threshold: number = 100,
  enabled: boolean = true
) {
  const pullDistance = useRef(0)
  const isRefreshing = useRef(false)

  return useTouch({
    onTouchMove: (event) => {
      if (!enabled || isRefreshing.current || window.scrollY > 0) return

      if (event.touches.length === 1) {
        const touch = event.touches[0]
        if (pullDistance.current === 0) {
          pullDistance.current = touch.clientY
        } else {
          const distance = touch.clientY - pullDistance.current
          if (distance > threshold) {
            isRefreshing.current = true
            onRefresh()
            setTimeout(() => {
              isRefreshing.current = false
              pullDistance.current = 0
            }, 1000)
          }
        }
      }
    },
    onTouchEnd: () => {
      pullDistance.current = 0
    }
  })
}