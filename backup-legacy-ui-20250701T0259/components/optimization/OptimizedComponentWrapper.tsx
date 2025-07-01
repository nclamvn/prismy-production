'use client'

import React, { useEffect, useRef, useState, memo, useMemo } from 'react'
import {
  MemoryOptimizer,
  FrameRateOptimizer,
  OperationOptimizer,
  PerformanceMonitor
} from '@/lib/performance-optimizer'
import {
  LiveRegionManager,
  KeyboardNavigator,
  ScreenReaderOptimizer,
  MotionAccessibility,
  TouchAccessibility
} from '@/lib/accessibility-enhancer'

interface OptimizedComponentWrapperProps {
  children: React.ReactNode
  componentId: string
  enableVirtualization?: boolean
  enableAccessibilityEnhancements?: boolean
  enablePerformanceOptimization?: boolean
  ariaLabel?: string
  ariaDescription?: string
  role?: string
  onPerformanceIssue?: (issue: string) => void
  className?: string
}

// Virtualized list component for large data sets
const VirtualizedList = memo(({ 
  items, 
  itemHeight = 50, 
  containerHeight = 400,
  renderItem 
}: {
  items: any[]
  itemHeight?: number
  containerHeight?: number
  renderItem: (item: any, index: number) => React.ReactNode
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 2,
      items.length
    )
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length])

  const handleScroll = OperationOptimizer.throttle(
    'virtualized-scroll',
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    },
    16 // 60fps
  )

  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex)

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      role="listbox"
      aria-label="Virtualized list"
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={visibleRange.startIndex + index}
            style={{
              position: 'absolute',
              top: (visibleRange.startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
            role="option"
            aria-setsize={items.length}
            aria-posinset={visibleRange.startIndex + index + 1}
          >
            {renderItem(item, visibleRange.startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  )
})

VirtualizedList.displayName = 'VirtualizedList'

// Lazy loading wrapper for images and heavy components
const LazyComponent = memo(({ 
  children, 
  fallback = <div>Loading...</div>,
  threshold = 0.1 
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, hasLoaded])

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
})

LazyComponent.displayName = 'LazyComponent'

// Optimized image component
const OptimizedImage = memo(({ 
  src, 
  alt, 
  width, 
  height, 
  className,
  loading = 'lazy',
  ...props 
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current) {
      TouchAccessibility.ensureMinimumTouchTarget(imgRef.current)
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    LiveRegionManager.announce('image-load', `Image loaded: ${alt}`)
  }

  const handleError = () => {
    setHasError(true)
    LiveRegionManager.announce('image-error', `Failed to load image: ${alt}`)
  }

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={`Failed to load: ${alt}`}
      >
        <span className="text-gray-500 text-sm">Image unavailable</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt || ''}
        width={width}
        height={height}
        className={className}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
        {...props}
      />
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

// Main wrapper component
export default function OptimizedComponentWrapper({
  children,
  componentId,
  enableVirtualization = false,
  enableAccessibilityEnhancements = true,
  enablePerformanceOptimization = true,
  ariaLabel,
  ariaDescription,
  role,
  onPerformanceIssue,
  className = ''
}: OptimizedComponentWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [performanceLevel, setPerformanceLevel] = useState<'high' | 'medium' | 'low'>('high')
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  // Initialize optimizations
  useEffect(() => {
    if (enablePerformanceOptimization) {
      // Track memory usage
      const memorySize = containerRef.current?.innerHTML?.length || 1000
      MemoryOptimizer.trackMemoryUsage(componentId, memorySize)

      // Monitor performance level
      const checkPerformance = () => {
        const level = PerformanceMonitor.getPerformanceLevel()
        setPerformanceLevel(level)
        
        if (level === 'low') {
          onPerformanceIssue?.('Low performance detected, consider optimizations')
        }
      }

      const interval = setInterval(checkPerformance, 5000)
      checkPerformance()

      return () => {
        clearInterval(interval)
        MemoryOptimizer.clearComponent(componentId)
      }
    }
  }, [componentId, enablePerformanceOptimization, onPerformanceIssue])

  // Setup accessibility enhancements
  useEffect(() => {
    if (enableAccessibilityEnhancements && containerRef.current) {
      const container = containerRef.current

      // Add descriptive labels
      if (ariaDescription) {
        ScreenReaderOptimizer.addDescriptiveLabels(container, ariaDescription)
      }

      // Ensure keyboard accessibility
      KeyboardNavigator.addKeyboardShortcut('Escape', () => {
        KeyboardNavigator.releaseFocus(container)
      })

      // Add touch accessibility
      const interactiveElements = container.querySelectorAll('button, a, input')
      interactiveElements.forEach(element => {
        TouchAccessibility.ensureMinimumTouchTarget(element as HTMLElement)
        TouchAccessibility.addTouchFeedback(element as HTMLElement)
      })

      // Monitor reduced motion preference
      const shouldReduce = MotionAccessibility.shouldReduceMotion()
      setIsReducedMotion(shouldReduce)
    }
  }, [enableAccessibilityEnhancements, ariaDescription])

  // Debounced resize handler for responsive optimizations
  useEffect(() => {
    const handleResize = OperationOptimizer.debounce(
      `resize-${componentId}`,
      () => {
        if (containerRef.current) {
          // Trigger re-optimization on resize
          const event = new CustomEvent('component-resize', {
            detail: { componentId }
          })
          containerRef.current.dispatchEvent(event)
        }
      },
      250
    )

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [componentId])

  // Apply performance-based optimizations
  const optimizedChildren = useMemo(() => {
    if (!enablePerformanceOptimization) return children

    // Apply different optimizations based on performance level
    switch (performanceLevel) {
      case 'low':
        // Most aggressive optimizations
        return React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && index > 5) {
            // Lazy load components after the first 5
            return (
              <LazyComponent key={index} fallback={<div className="h-16 bg-gray-100 animate-pulse rounded" />}>
                {child}
              </LazyComponent>
            )
          }
          return child
        })

      case 'medium':
        // Moderate optimizations
        return React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && child.type === 'img') {
            // Replace img tags with optimized images
            return (
              <OptimizedImage
                key={index}
                {...(child.props as any)}
              />
            )
          }
          return child
        })

      default:
        return children
    }
  }, [children, performanceLevel, enablePerformanceOptimization])

  return (
    <div
      ref={containerRef}
      className={`optimized-component ${className} ${!isReducedMotion ? 'animate-fade-in' : ''}`}
      role={role}
      aria-label={ariaLabel}
      data-component-id={componentId}
      data-performance-level={performanceLevel}
    >
      {optimizedChildren}
      
      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-2 py-1 text-xs rounded ${
            performanceLevel === 'high' ? 'bg-green-100 text-green-800' :
            performanceLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {componentId}: {performanceLevel}
          </div>
        </div>
      )}
    </div>
  )
}

// Export optimized components for reuse
export {
  VirtualizedList,
  LazyComponent,
  OptimizedImage
}