/**
 * PRISMY ADVANCED MOBILE GESTURES
 * Enhanced touch interaction system with multi-finger support
 */

import React from 'react'

export interface GestureEvent {
  type: string
  target: EventTarget | null
  touches: TouchList
  changedTouches: TouchList
  deltaX: number
  deltaY: number
  distance: number
  scale: number
  rotation: number
  velocity: { x: number; y: number }
  direction: 'up' | 'down' | 'left' | 'right' | 'none'
  timestamp: number
  preventDefault: () => void
}

export interface GestureConfig {
  // Basic gesture thresholds
  swipeThreshold: number
  pinchThreshold: number
  rotationThreshold: number
  longPressDelay: number
  doubleTapDelay: number
  
  // Advanced features
  enableMomentum: boolean
  enableHapticFeedback: boolean
  enableEdgeSwipes: boolean
  enableForceTouch: boolean
  
  // Performance
  throttleInterval: number
  passiveListeners: boolean
}

export interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right'
  distance: number
  velocity: number
  duration: number
  startPoint: { x: number; y: number }
  endPoint: { x: number; y: number }
}

export interface PinchGesture {
  scale: number
  centerPoint: { x: number; y: number }
  startDistance: number
  currentDistance: number
  velocity: number
}

export interface RotationGesture {
  angle: number
  centerPoint: { x: number; y: number }
  startAngle: number
  currentAngle: number
  velocity: number
}

export interface LongPressGesture {
  duration: number
  position: { x: number; y: number }
  pressure?: number
}

export interface ForceTouch {
  force: number
  maxForce: number
  stage: 'peek' | 'pop' | 'cancel'
}

type GestureHandler = (gesture: any) => void

class AdvancedGestureManager {
  private config: GestureConfig
  private handlers = new Map<string, Set<GestureHandler>>()
  private touchState = new Map<number, TouchPoint>()
  private gestureState: {
    isActive: boolean
    startTime: number
    lastTouchTime: number
    initialDistance: number
    initialAngle: number
    lastScale: number
    lastRotation: number
    momentumVelocity: { x: number; y: number }
  }

  constructor(config: Partial<GestureConfig> = {}) {
    this.config = {
      swipeThreshold: 50,
      pinchThreshold: 0.1,
      rotationThreshold: 15,
      longPressDelay: 500,
      doubleTapDelay: 300,
      enableMomentum: true,
      enableHapticFeedback: true,
      enableEdgeSwipes: true,
      enableForceTouch: true,
      throttleInterval: 16, // 60fps
      passiveListeners: false,
      ...config
    }

    this.gestureState = {
      isActive: false,
      startTime: 0,
      lastTouchTime: 0,
      initialDistance: 0,
      initialAngle: 0,
      lastScale: 1,
      lastRotation: 0,
      momentumVelocity: { x: 0, y: 0 }
    }

    this.initialize()
  }

  /**
   * Initialize gesture recognition
   */
  private initialize(): void {
    if (typeof window === 'undefined') return

    // Touch events
    const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel']
    touchEvents.forEach(event => {
      document.addEventListener(event, this.handleTouch.bind(this), {
        passive: this.config.passiveListeners,
        capture: true
      })
    })

    // Force touch events (3D Touch / Force Touch)
    if (this.config.enableForceTouch) {
      document.addEventListener('touchforcechange', this.handleForceTouch.bind(this), {
        passive: this.config.passiveListeners
      })
    }

    console.log('[Advanced Gestures] Initialized with config:', this.config)
  }

  /**
   * Register gesture handler
   */
  public on(gestureType: string, handler: GestureHandler): () => void {
    if (!this.handlers.has(gestureType)) {
      this.handlers.set(gestureType, new Set())
    }
    
    this.handlers.get(gestureType)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.handlers.get(gestureType)?.delete(handler)
    }
  }

  /**
   * Remove gesture handler
   */
  public off(gestureType: string, handler: GestureHandler): void {
    this.handlers.get(gestureType)?.delete(handler)
  }

  /**
   * Emit gesture event
   */
  private emit(gestureType: string, gesture: any): void {
    const handlers = this.handlers.get(gestureType)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(gesture)
        } catch (error) {
          console.error(`[Advanced Gestures] Handler error for ${gestureType}:`, error)
        }
      })
    }
  }

  /**
   * Handle touch events
   */
  private handleTouch(event: TouchEvent): void {
    const now = Date.now()
    
    switch (event.type) {
      case 'touchstart':
        this.handleTouchStart(event, now)
        break
      case 'touchmove':
        this.handleTouchMove(event, now)
        break
      case 'touchend':
      case 'touchcancel':
        this.handleTouchEnd(event, now)
        break
    }
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent, timestamp: number): void {
    const touches = event.touches
    
    // Store touch points
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      this.touchState.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: timestamp,
        lastTime: timestamp,
        velocityX: 0,
        velocityY: 0,
        force: (touch as any).force || 0
      })
    }

    this.gestureState.isActive = true
    this.gestureState.startTime = timestamp
    this.gestureState.lastTouchTime = timestamp

    // Initialize multi-touch gestures
    if (touches.length === 2) {
      this.initializePinchRotation(touches)
    }

    // Check for edge swipes
    if (this.config.enableEdgeSwipes && touches.length === 1) {
      this.checkEdgeSwipe(touches[0])
    }

    // Start long press detection
    this.startLongPressDetection(touches[0], timestamp)

    // Haptic feedback for touch start
    if (this.config.enableHapticFeedback) {
      this.triggerHapticFeedback('light')
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent, timestamp: number): void {
    if (!this.gestureState.isActive) return

    const touches = event.touches
    const deltaTime = timestamp - this.gestureState.lastTouchTime

    // Throttle move events
    if (deltaTime < this.config.throttleInterval) return

    // Update touch state
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      const touchPoint = this.touchState.get(touch.identifier)
      
      if (touchPoint) {
        const deltaX = touch.clientX - touchPoint.currentX
        const deltaY = touch.clientY - touchPoint.currentY
        
        touchPoint.velocityX = deltaX / deltaTime
        touchPoint.velocityY = deltaY / deltaTime
        touchPoint.currentX = touch.clientX
        touchPoint.currentY = touch.clientY
        touchPoint.lastTime = timestamp
        touchPoint.force = (touch as any).force || 0
      }
    }

    // Detect gestures based on touch count
    if (touches.length === 1) {
      this.detectSwipe(touches[0], timestamp)
    } else if (touches.length === 2) {
      this.detectPinchRotation(touches, timestamp)
    }

    this.gestureState.lastTouchTime = timestamp
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent, timestamp: number): void {
    const changedTouches = event.changedTouches
    
    // Remove ended touches
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i]
      const touchPoint = this.touchState.get(touch.identifier)
      
      if (touchPoint) {
        // Check for tap gesture
        this.checkTap(touchPoint, timestamp)
        
        // Apply momentum if enabled
        if (this.config.enableMomentum && event.touches.length === 0) {
          this.applyMomentum(touchPoint)
        }
        
        this.touchState.delete(touch.identifier)
      }
    }

    // Reset gesture state if no touches remaining
    if (event.touches.length === 0) {
      this.gestureState.isActive = false
      this.clearLongPressTimer()
    }
  }

  /**
   * Initialize pinch and rotation detection
   */
  private initializePinchRotation(touches: TouchList): void {
    const touch1 = touches[0]
    const touch2 = touches[1]
    
    this.gestureState.initialDistance = this.calculateDistance(
      touch1.clientX, touch1.clientY,
      touch2.clientX, touch2.clientY
    )
    
    this.gestureState.initialAngle = this.calculateAngle(
      touch1.clientX, touch1.clientY,
      touch2.clientX, touch2.clientY
    )
    
    this.gestureState.lastScale = 1
    this.gestureState.lastRotation = 0
  }

  /**
   * Detect pinch and rotation gestures
   */
  private detectPinchRotation(touches: TouchList, timestamp: number): void {
    if (touches.length !== 2) return
    
    const touch1 = touches[0]
    const touch2 = touches[1]
    
    const currentDistance = this.calculateDistance(
      touch1.clientX, touch1.clientY,
      touch2.clientX, touch2.clientY
    )
    
    const currentAngle = this.calculateAngle(
      touch1.clientX, touch1.clientY,
      touch2.clientX, touch2.clientY
    )
    
    // Calculate scale
    const scale = currentDistance / this.gestureState.initialDistance
    const scaleChange = Math.abs(scale - this.gestureState.lastScale)
    
    if (scaleChange > this.config.pinchThreshold) {
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      
      const pinchGesture: PinchGesture = {
        scale,
        centerPoint: { x: centerX, y: centerY },
        startDistance: this.gestureState.initialDistance,
        currentDistance,
        velocity: (scale - this.gestureState.lastScale) / (timestamp - this.gestureState.lastTouchTime)
      }
      
      this.emit('pinch', pinchGesture)
      this.gestureState.lastScale = scale
      
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('medium')
      }
    }
    
    // Calculate rotation
    const rotation = currentAngle - this.gestureState.initialAngle
    const rotationChange = Math.abs(rotation - this.gestureState.lastRotation)
    
    if (rotationChange > this.config.rotationThreshold) {
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      
      const rotationGesture: RotationGesture = {
        angle: rotation,
        centerPoint: { x: centerX, y: centerY },
        startAngle: this.gestureState.initialAngle,
        currentAngle,
        velocity: (rotation - this.gestureState.lastRotation) / (timestamp - this.gestureState.lastTouchTime)
      }
      
      this.emit('rotation', rotationGesture)
      this.gestureState.lastRotation = rotation
      
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('medium')
      }
    }
  }

  /**
   * Detect swipe gestures
   */
  private detectSwipe(touch: Touch, timestamp: number): void {
    const touchPoint = this.touchState.get(touch.identifier)
    if (!touchPoint) return
    
    const deltaX = touch.clientX - touchPoint.startX
    const deltaY = touch.clientY - touchPoint.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (distance > this.config.swipeThreshold) {
      const duration = timestamp - touchPoint.startTime
      const velocity = distance / duration
      
      let direction: 'up' | 'down' | 'left' | 'right'
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }
      
      const swipeGesture: SwipeGesture = {
        direction,
        distance,
        velocity,
        duration,
        startPoint: { x: touchPoint.startX, y: touchPoint.startY },
        endPoint: { x: touch.clientX, y: touch.clientY }
      }
      
      this.emit('swipe', swipeGesture)
      this.emit(`swipe${direction}`, swipeGesture)
      
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('light')
      }
    }
  }

  /**
   * Check for tap gestures
   */
  private checkTap(touchPoint: TouchPoint, timestamp: number): void {
    const duration = timestamp - touchPoint.startTime
    const distance = Math.sqrt(
      Math.pow(touchPoint.currentX - touchPoint.startX, 2) +
      Math.pow(touchPoint.currentY - touchPoint.startY, 2)
    )
    
    if (duration < 300 && distance < 10) {
      this.emit('tap', {
        position: { x: touchPoint.currentX, y: touchPoint.currentY },
        duration,
        force: touchPoint.force
      })
      
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('light')
      }
    }
  }

  /**
   * Check for edge swipes
   */
  private checkEdgeSwipe(touch: Touch): void {
    const edgeThreshold = 20
    const isLeftEdge = touch.clientX < edgeThreshold
    const isRightEdge = touch.clientX > window.innerWidth - edgeThreshold
    const isTopEdge = touch.clientY < edgeThreshold
    const isBottomEdge = touch.clientY > window.innerHeight - edgeThreshold
    
    if (isLeftEdge || isRightEdge || isTopEdge || isBottomEdge) {
      this.emit('edgetouch', {
        edge: isLeftEdge ? 'left' : isRightEdge ? 'right' : isTopEdge ? 'top' : 'bottom',
        position: { x: touch.clientX, y: touch.clientY }
      })
    }
  }

  /**
   * Start long press detection
   */
  private longPressTimer: number | null = null
  
  private startLongPressDetection(touch: Touch, timestamp: number): void {
    this.clearLongPressTimer()
    
    this.longPressTimer = window.setTimeout(() => {
      const longPressGesture: LongPressGesture = {
        duration: this.config.longPressDelay,
        position: { x: touch.clientX, y: touch.clientY },
        pressure: (touch as any).force
      }
      
      this.emit('longpress', longPressGesture)
      
      if (this.config.enableHapticFeedback) {
        this.triggerHapticFeedback('heavy')
      }
    }, this.config.longPressDelay)
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  /**
   * Handle force touch events
   */
  private handleForceTouch(event: TouchEvent): void {
    const touch = event.touches[0]
    if (!touch) return
    
    const force = (touch as any).force || 0
    const maxForce = (touch as any).radiusX ? 1 : 0 // Approximate max force
    
    let stage: 'peek' | 'pop' | 'cancel' = 'peek'
    if (force > 0.75) stage = 'pop'
    else if (force < 0.1) stage = 'cancel'
    
    const forceTouchGesture: ForceTouch = {
      force,
      maxForce,
      stage
    }
    
    this.emit('forcetouch', forceTouchGesture)
    
    if (stage === 'pop' && this.config.enableHapticFeedback) {
      this.triggerHapticFeedback('heavy')
    }
  }

  /**
   * Apply momentum to gesture
   */
  private applyMomentum(touchPoint: TouchPoint): void {
    if (!this.config.enableMomentum) return
    
    const velocityThreshold = 0.5
    if (Math.abs(touchPoint.velocityX) > velocityThreshold || Math.abs(touchPoint.velocityY) > velocityThreshold) {
      this.emit('momentum', {
        velocity: { x: touchPoint.velocityX, y: touchPoint.velocityY },
        startPoint: { x: touchPoint.currentX, y: touchPoint.currentY }
      })
    }
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      }
      
      navigator.vibrate(patterns[intensity])
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  /**
   * Calculate angle between two points
   */
  private calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI
  }

  /**
   * Destroy gesture manager
   */
  public destroy(): void {
    this.clearLongPressTimer()
    this.handlers.clear()
    this.touchState.clear()
  }
}

interface TouchPoint {
  id: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  startTime: number
  lastTime: number
  velocityX: number
  velocityY: number
  force: number
}

// Export singleton instance
export const advancedGestures = new AdvancedGestureManager()

// Export class for customization
export { AdvancedGestureManager }
export type {
  GestureConfig,
  GestureEvent,
  SwipeGesture,
  PinchGesture,
  RotationGesture,
  LongPressGesture,
  ForceTouch
}