'use client'

import { 
  useEffect, 
  useRef, 
  useState, 
  useCallback,
  ReactNode,
  CSSProperties
} from 'react'

/* ============================================================================ */
/* PRISMY INTERSECTION OBSERVER OPTIMIZATION SYSTEM */
/* Advanced scroll-based optimizations for maximum performance */
/* ============================================================================ */

interface IntersectionOptions {
  threshold?: number | number[]
  rootMargin?: string
  triggerOnce?: boolean
  onEnter?: (entry: IntersectionObserverEntry) => void
  onExit?: (entry: IntersectionObserverEntry) => void
  onProgress?: (ratio: number) => void
}

// Enhanced intersection observer hook
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = false,
  onEnter,
  onExit,
  onProgress,
}: IntersectionOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [intersectionRatio, setIntersectionRatio] = useState(0)
  const elementRef = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    const { isIntersecting, intersectionRatio } = entry

    setIsIntersecting(isIntersecting)
    setIntersectionRatio(intersectionRatio)

    if (isIntersecting) {
      onEnter?.(entry)
      if (triggerOnce && observerRef.current) {
        observerRef.current.disconnect()
      }
    } else {
      onExit?.(entry)
    }

    onProgress?.(intersectionRatio)
  }, [onEnter, onExit, onProgress, triggerOnce])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    })

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, threshold, rootMargin])

  return { isIntersecting, intersectionRatio, elementRef }
}

// Scroll-triggered animations
export function ScrollAnimatedElement({
  children,
  animation = 'fadeInUp',
  threshold = 0.2,
  delay = 0,
  duration = 0.6,
  easing = 'ease-out',
  className,
}: {
  children: ReactNode
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'slideInUp'
  threshold?: number
  delay?: number
  duration?: number
  easing?: string
  className?: string
}) {
  const [hasAnimated, setHasAnimated] = useState(false)
  
  const { isIntersecting, elementRef } = useIntersectionObserver({
    threshold,
    triggerOnce: true,
    onEnter: () => {
      setTimeout(() => setHasAnimated(true), delay * 1000)
    },
  })

  const animationStyles: Record<string, CSSProperties> = {
    fadeIn: {
      opacity: hasAnimated ? 1 : 0,
      transition: `opacity ${duration}s ${easing}`,
    },
    fadeInUp: {
      opacity: hasAnimated ? 1 : 0,
      transform: hasAnimated ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity ${duration}s ${easing}, transform ${duration}s ${easing}`,
    },
    fadeInDown: {
      opacity: hasAnimated ? 1 : 0,
      transform: hasAnimated ? 'translateY(0)' : 'translateY(-30px)',
      transition: `opacity ${duration}s ${easing}, transform ${duration}s ${easing}`,
    },
    fadeInLeft: {
      opacity: hasAnimated ? 1 : 0,
      transform: hasAnimated ? 'translateX(0)' : 'translateX(-30px)',
      transition: `opacity ${duration}s ${easing}, transform ${duration}s ${easing}`,
    },
    fadeInRight: {
      opacity: hasAnimated ? 1 : 0,
      transform: hasAnimated ? 'translateX(0)' : 'translateX(30px)',
      transition: `opacity ${duration}s ${easing}, transform ${duration}s ${easing}`,
    },
    scaleIn: {
      opacity: hasAnimated ? 1 : 0,
      transform: hasAnimated ? 'scale(1)' : 'scale(0.9)',
      transition: `opacity ${duration}s ${easing}, transform ${duration}s ${easing}`,
    },
    slideInUp: {
      transform: hasAnimated ? 'translateY(0)' : 'translateY(100%)',
      transition: `transform ${duration}s ${easing}`,
    },
  }

  return (
    <div
      ref={elementRef as any}
      className={className}
      style={{
        ...animationStyles[animation],
        willChange: hasAnimated ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

// Performance-optimized parallax component
export function ParallaxElement({
  children,
  speed = 0.5,
  direction = 'vertical',
  className,
}: {
  children: ReactNode
  speed?: number
  direction?: 'vertical' | 'horizontal'
  className?: string
}) {
  const [offset, setOffset] = useState(0)
  const elementRef = useRef<HTMLDivElement>(null)

  const { isIntersecting } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '100px',
    onEnter: () => {
      // Only start parallax when element is near viewport
      const updateParallax = () => {
        if (!elementRef.current) return

        const rect = elementRef.current.getBoundingClientRect()
        const scrolled = window.pageYOffset
        const rate = scrolled * -speed

        if (direction === 'vertical') {
          setOffset(rate)
        }
      }

      const handleScroll = () => {
        requestAnimationFrame(updateParallax)
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    },
  })

  const transform = direction === 'vertical' 
    ? `translateY(${offset}px)` 
    : `translateX(${offset}px)`

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        transform: isIntersecting ? transform : 'none',
        willChange: isIntersecting ? 'transform' : 'auto',
      }}
    >
      {children}
    </div>
  )
}

// Viewport-based content loading
export function ViewportContent({
  children,
  placeholder,
  threshold = 0.1,
  rootMargin = '100px',
  className,
}: {
  children: ReactNode
  placeholder?: ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
}) {
  const [shouldRender, setShouldRender] = useState(false)

  const { elementRef } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
    onEnter: () => setShouldRender(true),
  })

  return (
    <div ref={elementRef as any} className={className}>
      {shouldRender ? children : (placeholder || <div className="h-64 bg-gray-100 rounded" />)}
    </div>
  )
}

// Progressive image loading with intersection observer
export function ProgressiveImage({
  src,
  lowQualitySrc,
  alt,
  width,
  height,
  className,
  onLoad,
}: {
  src: string
  lowQualitySrc?: string
  alt: string
  width?: number
  height?: number
  className?: string
  onLoad?: () => void
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src)

  const { elementRef } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
    onEnter: () => setShouldLoad(true),
  })

  useEffect(() => {
    if (!shouldLoad) return

    const img = new Image()
    img.src = src
    
    img.onload = () => {
      setCurrentSrc(src)
      setIsLoaded(true)
      onLoad?.()
    }
  }, [shouldLoad, src, onLoad])

  return (
    <img
      ref={elementRef as any}
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} transition-all duration-300 ${
        isLoaded ? 'opacity-100' : lowQualitySrc ? 'opacity-80 filter blur-sm' : 'opacity-0'
      }`}
      style={{
        willChange: isLoaded ? 'auto' : 'opacity, filter',
      }}
    />
  )
}

// Scroll progress indicator
export function ScrollProgress({
  className,
  color = '#667eea',
  height = 3,
  zIndex = 50,
}: {
  className?: string
  color?: string
  height?: number
  zIndex?: number
}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrolled = window.pageYOffset
      const maxHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrolled / maxHeight) * 100
      setProgress(Math.min(progress, 100))
    }

    const handleScroll = () => {
      requestAnimationFrame(updateProgress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateProgress() // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={`fixed top-0 left-0 right-0 ${className}`}
      style={{
        height: `${height}px`,
        background: `linear-gradient(to right, ${color} ${progress}%, transparent ${progress}%)`,
        zIndex,
        willChange: 'background',
      }}
    />
  )
}

// Scroll-based number counter
export function CountUpOnScroll({
  end,
  start = 0,
  duration = 2,
  separator = ',',
  threshold = 0.3,
  className,
}: {
  end: number
  start?: number
  duration?: number
  separator?: string
  threshold?: number
  className?: string
}) {
  const [count, setCount] = useState(start)
  const [hasStarted, setHasStarted] = useState(false)

  const { elementRef } = useIntersectionObserver({
    threshold,
    triggerOnce: true,
    onEnter: () => {
      if (!hasStarted) {
        setHasStarted(true)
        animateCount()
      }
    },
  })

  const animateCount = useCallback(() => {
    const startTime = Date.now()
    const startValue = start
    const endValue = end
    const totalDuration = duration * 1000

    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / totalDuration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      const currentCount = Math.floor(startValue + (endValue - startValue) * easeOutQuart)
      setCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }

    requestAnimationFrame(updateCount)
  }, [start, end, duration])

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  }

  return (
    <span ref={elementRef as any} className={className}>
      {formatNumber(count)}
    </span>
  )
}

// Sticky section with progress
export function StickySection({
  children,
  className,
  onProgressChange,
}: {
  children: ReactNode
  className?: string
  onProgressChange?: (progress: number) => void
}) {
  const [progress, setProgress] = useState(0)
  const elementRef = useRef<HTMLDivElement>(null)

  const { intersectionRatio } = useIntersectionObserver({
    threshold: Array.from({ length: 101 }, (_, i) => i / 100), // 0 to 1 in 0.01 steps
    onProgress: (ratio) => {
      setProgress(ratio)
      onProgressChange?.(ratio)
    },
  })

  return (
    <div
      ref={elementRef}
      className={`sticky top-0 ${className}`}
      style={{
        opacity: Math.max(0.3, intersectionRatio),
        transform: `scale(${0.95 + intersectionRatio * 0.05})`,
        transition: 'opacity 0.1s ease, transform 0.1s ease',
      }}
    >
      {children}
    </div>
  )
}

// Optimized scroll spy for navigation
export function useScrollSpy(
  sectionIds: string[],
  options: {
    threshold?: number
    rootMargin?: string
    offset?: number
  } = {}
) {
  const { threshold = 0.5, rootMargin = '-10% 0px -10% 0px', offset = 0 } = options
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting)
        
        if (visibleEntries.length > 0) {
          // Find the section with the highest intersection ratio
          const mostVisible = visibleEntries.reduce((prev, current) => 
            current.intersectionRatio > prev.intersectionRatio ? current : prev
          )
          setActiveSection(mostVisible.target.id)
        }
      },
      { threshold, rootMargin }
    )

    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  }, [sectionIds, threshold, rootMargin])

  return activeSection
}

// Export all optimization utilities
export const IntersectionOptimizer = {
  useIntersectionObserver,
  ScrollAnimatedElement,
  ParallaxElement,
  ViewportContent,
  ProgressiveImage,
  ScrollProgress,
  CountUpOnScroll,
  StickySection,
  useScrollSpy,
}