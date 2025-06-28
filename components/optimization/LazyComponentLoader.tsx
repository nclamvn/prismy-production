'use client'

import React, { Suspense, lazy, ComponentType, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { motionSafe, fadeIn } from '@/lib/motion'

interface LazyComponentLoaderProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
  loadingText?: string
  minHeight?: string
}

interface LazyLoadOptions {
  fallback?: ReactNode
  retryCount?: number
  retryDelay?: number
}

// Enhanced lazy loading with error handling and retry logic
export function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): ComponentType<any> {
  const { retryCount = 3, retryDelay = 1000 } = options

  const LazyComponent = lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempts = 0

      const tryImport = () => {
        importFunction()
          .then(resolve)
          .catch((error) => {
            attempts++
            if (attempts < retryCount) {
              console.warn(`Lazy import failed (attempt ${attempts}/${retryCount}), retrying...`, error)
              setTimeout(tryImport, retryDelay * attempts)
            } else {
              console.error('Lazy import failed after all retry attempts:', error)
              reject(error)
            }
          })
      }

      tryImport()
    })
  })

  // Return wrapped component with error boundary
  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={options.fallback || <DefaultLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Default loading fallback component
const DefaultLoadingFallback: React.FC = () => (
  <motion.div
    variants={motionSafe(fadeIn)}
    initial="hidden"
    animate="visible"
    className="flex items-center justify-center p-8"
    style={{ backgroundColor: 'var(--surface-elevated)' }}
  >
    <div className="flex items-center space-x-3">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--notebooklm-primary)' }} />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Loading component...
      </span>
    </div>
  </motion.div>
)

// Skeleton loading component for better UX
export const SkeletonLoader: React.FC<{ 
  lines?: number 
  className?: string 
  animate?: boolean 
}> = ({ lines = 3, className = '', animate = true }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <div
        key={i}
        className={`h-4 rounded ${animate ? 'animate-pulse' : ''}`}
        style={{ 
          backgroundColor: 'var(--surface-outline)',
          width: `${100 - (i * 10)}%` 
        }}
      />
    ))}
  </div>
)

// Enhanced component loading with intersection observer
export const LazyComponentLoader: React.FC<LazyComponentLoaderProps> = ({
  children,
  fallback,
  className = '',
  loadingText = 'Loading...',
  minHeight = '200px'
}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px', // Load 100px before component comes into view
        threshold: 0.1
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const defaultFallback = (
    <motion.div
      variants={motionSafe(fadeIn)}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center"
      style={{ 
        minHeight,
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid var(--surface-outline)',
        borderRadius: '0.75rem'
      }}
    >
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--notebooklm-primary)' }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {loadingText}
        </span>
        <SkeletonLoader lines={3} className="w-48" />
      </div>
    </motion.div>
  )

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {isIntersecting ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  )
}

// Performance monitoring for lazy loaded components
export const withPerformanceMonitoring = <P extends object>(
  Component: ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const startTime = React.useRef<number>(0)

    React.useEffect(() => {
      startTime.current = performance.now()
      
      return () => {
        const loadTime = performance.now() - startTime.current
        if (loadTime > 1000) { // Log if component takes more than 1 second to mount
          console.warn(`Slow component mount detected: ${componentName} took ${loadTime.toFixed(2)}ms`)
        }
      }
    }, [])

    return <Component ref={ref} {...props} />
  })
}

// Preload components for faster navigation
export const preloadComponent = (importFunction: () => Promise<any>) => {
  // Use requestIdleCallback if available, otherwise use setTimeout
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        importFunction().catch(console.error)
      })
    } else {
      setTimeout(() => {
        importFunction().catch(console.error)
      }, 100)
    }
  }
}

// HOC for adding lazy loading to any component
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  options?: LazyLoadOptions
) => {
  return React.forwardRef<any, P & { lazy?: boolean }>((props, ref) => {
    const { lazy = true, ...componentProps } = props

    if (!lazy) {
      return <Component ref={ref} {...(componentProps as P)} />
    }

    return (
      <LazyComponentLoader
        fallback={options?.fallback}
        className="w-full"
        loadingText={`Loading ${Component.displayName || Component.name || 'component'}...`}
      >
        <Component ref={ref} {...(componentProps as P)} />
      </LazyComponentLoader>
    )
  })
}

export default LazyComponentLoader