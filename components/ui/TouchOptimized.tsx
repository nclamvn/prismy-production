'use client'

import { useRef, useEffect, useCallback, useState, ReactNode, CSSProperties } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ============================================================================ */
/* PRISMY TOUCH OPTIMIZATION SYSTEM */
/* 120fps mobile interactions with hardware acceleration */
/* ============================================================================ */

interface TouchOptimizedProps {
  children: ReactNode
  className?: string
  onTap?: () => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void
  onLongPress?: () => void
  enableScale?: boolean
  enableRotate?: boolean
  enableDrag?: boolean
  dragConstraints?: {
    top?: number
    left?: number
    right?: number
    bottom?: number
  }
  hapticFeedback?: boolean
  preventScrollOnDrag?: boolean
}

// Touch-optimized wrapper with 120fps performance
export function TouchOptimized({
  children,
  className,
  onTap,
  onSwipe,
  onLongPress,
  enableScale = true,
  enableRotate = false,
  enableDrag = false,
  dragConstraints,
  hapticFeedback = true,
  preventScrollOnDrag = true,
}: TouchOptimizedProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout>()
  const touchStartTime = useRef<number>(0)
  const touchStartPos = useRef({ x: 0, y: 0 })
  
  // Motion values for smooth transforms
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const rotate = useMotionValue(0)
  
  // Transform with GPU acceleration
  const transform = useTransform(
    [x, y, scale, rotate],
    ([x, y, scale, rotate]) => {
      return `translate3d(${x}px, ${y}px, 0) scale3d(${scale}, ${scale}, 1) rotateZ(${rotate}deg)`
    }
  )

  // Haptic feedback utility
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !('vibrate' in navigator)) return
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    }
    
    navigator.vibrate(patterns[type])
  }, [hapticFeedback])

  // Handle tap with 120fps response
  const handleTap = useCallback(() => {
    triggerHaptic('light')
    onTap?.()
  }, [onTap, triggerHaptic])

  // Handle swipe detection
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 50
    const velocity = 0.5
    
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocity) {
      const direction = info.offset.x > 0 ? 'right' : 'left'
      triggerHaptic('medium')
      onSwipe?.(direction)
    } else if (Math.abs(info.offset.y) > threshold || Math.abs(info.velocity.y) > velocity) {
      const direction = info.offset.y > 0 ? 'down' : 'up'
      triggerHaptic('medium')
      onSwipe?.(direction)
    }
  }, [onSwipe, triggerHaptic])

  // Handle long press
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartTime.current = Date.now()
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
    
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        triggerHaptic('heavy')
        onLongPress()
      }, 500)
    }
  }, [onLongPress, triggerHaptic])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }, [])

  // Prevent scroll on drag
  useEffect(() => {
    if (!preventScrollOnDrag || !enableDrag) return
    
    const element = elementRef.current
    if (!element) return
    
    const preventScroll = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault()
      }
    }
    
    element.addEventListener('touchmove', preventScroll, { passive: false })
    
    return () => {
      element.removeEventListener('touchmove', preventScroll)
    }
  }, [preventScrollOnDrag, enableDrag])

  return (
    <motion.div
      ref={elementRef}
      className={cn('touch-optimized', className)}
      style={{
        transform,
        touchAction: enableDrag ? 'none' : 'auto',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      } as CSSProperties}
      drag={enableDrag}
      dragConstraints={dragConstraints}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      whileTap={enableScale ? { scale: 0.95 } : {}}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 400,
      }}
      onTouchStart={handleTouchStart as any}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </motion.div>
  )
}

/* ============================================================================ */
/* SPECIALIZED TOUCH COMPONENTS */
/* ============================================================================ */

// Touch-optimized button with instant feedback
export function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  haptic = true,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  haptic?: boolean
}) {
  const variantClasses = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50',
  }
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  return (
    <TouchOptimized
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onTap={disabled ? undefined : onClick}
      hapticFeedback={haptic}
      enableScale
    >
      {children}
    </TouchOptimized>
  )
}

// Swipeable card with smooth physics
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className,
}: {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  className?: string
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-30, 30])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft()
    } else if (info.offset.y < -threshold && onSwipeUp) {
      onSwipeUp()
    } else if (info.offset.y > threshold && onSwipeDown) {
      onSwipeDown()
    } else {
      // Spring back to center
      x.set(0)
      y.set(0)
    }
  }

  return (
    <motion.div
      className={cn('swipeable-card', className)}
      style={{
        x,
        y,
        rotate,
        opacity,
        willChange: 'transform',
      }}
      drag
      dragElastic={1}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
    >
      {children}
    </motion.div>
  )
}

// Pull to refresh component
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
}: {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!startY.current) return
    
    currentY.current = e.touches[0].clientY
    const distance = currentY.current - startY.current
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
    startY.current = 0
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, threshold, isRefreshing])

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 180

  return (
    <div
      ref={containerRef}
      className={cn('pull-to-refresh relative overflow-auto', className)}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: pullDistance === 0 ? 'transform 0.3s' : 'none',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center h-20"
        style={{
          transform: `translateY(${-80 + pullDistance * 0.8}px)`,
          opacity: progress,
        }}
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : rotation }}
          transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0 }}
        >
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </motion.div>
      </div>
      {children}
    </div>
  )
}

// Pinch to zoom component
export function PinchZoom({
  children,
  minScale = 1,
  maxScale = 4,
  className,
}: {
  children: ReactNode
  minScale?: number
  maxScale?: number
  className?: string
}) {
  const [scale, setScale] = useState(1)
  const [origin, setOrigin] = useState({ x: '50%', y: '50%' })
  const elementRef = useRef<HTMLDivElement>(null)
  const initialDistance = useRef(0)
  const initialScale = useRef(1)

  const getDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getMidpoint = (touches: TouchList) => {
    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return { x: '50%', y: '50%' }
    
    const x = (touches[0].clientX + touches[1].clientX) / 2
    const y = (touches[0].clientY + touches[1].clientY) / 2
    
    return {
      x: `${((x - rect.left) / rect.width) * 100}%`,
      y: `${((y - rect.top) / rect.height) * 100}%`,
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches)
      initialScale.current = scale
      setOrigin(getMidpoint(e.touches))
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const distance = getDistance(e.touches)
      const newScale = (distance / initialDistance.current) * initialScale.current
      setScale(Math.min(Math.max(newScale, minScale), maxScale))
    }
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [scale, minScale, maxScale])

  return (
    <div
      ref={elementRef}
      className={cn('pinch-zoom', className)}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: `${origin.x} ${origin.y}`,
        transition: 'transform 0.1s',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}