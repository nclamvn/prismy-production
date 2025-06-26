'use client'

import React, { Suspense, lazy, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BundleAnalyzer } from '@/lib/bundle-optimizer'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  name?: string
  priority?: 'high' | 'medium' | 'low'
  threshold?: number // Viewport threshold for loading
}

// Enhanced loading skeleton with NotebookLM styling
function LoadingSkeleton({ name }: { name?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="animate-pulse"
      style={{
        backgroundColor: 'var(--surface-filled)',
        borderRadius: 'var(--mat-card-elevated-container-shape)',
        border: '1px solid var(--surface-outline)'
      }}
    >
      <div className="p-6 space-y-4">
        <div 
          className="h-4 rounded"
          style={{ backgroundColor: 'var(--surface-outline)' }}
        />
        <div className="space-y-2">
          <div 
            className="h-3 rounded w-3/4"
            style={{ backgroundColor: 'var(--surface-outline)' }}
          />
          <div 
            className="h-3 rounded w-1/2"
            style={{ backgroundColor: 'var(--surface-outline)' }}
          />
        </div>
        {name && (
          <div 
            className="text-xs opacity-50 mt-4"
            style={{ color: 'var(--text-disabled)' }}
          >
            Loading {name}...
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Intersection Observer hook for lazy loading
function useIntersectionObserver(threshold: number = 0.1) {
  const [isInView, setIsInView] = useState(false)
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold])

  return { ref: setRef, isInView }
}

export function LazyWrapper({ 
  children, 
  fallback, 
  name = 'component',
  priority = 'medium',
  threshold = 0.1 
}: LazyWrapperProps) {
  const { ref, isInView } = useIntersectionObserver(threshold)
  const [shouldLoad, setShouldLoad] = useState(priority === 'high')

  useEffect(() => {
    if (isInView && !shouldLoad) {
      setShouldLoad(true)
      BundleAnalyzer.markBundleLoad(name)
    }
  }, [isInView, shouldLoad, name])

  useEffect(() => {
    if (shouldLoad) {
      // Measure bundle load time
      const timer = setTimeout(() => {
        BundleAnalyzer.measureBundleLoad(name)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [shouldLoad, name])

  if (!shouldLoad) {
    return (
      <div ref={ref}>
        {fallback || <LoadingSkeleton name={name} />}
      </div>
    )
  }

  return (
    <Suspense fallback={fallback || <LoadingSkeleton name={name} />}>
      {children}
    </Suspense>
  )
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    name?: string
    priority?: 'high' | 'medium' | 'low'
    fallback?: React.ComponentType
  } = {}
) {
  const LazyComponent = lazy(async () => {
    // Simulate network delay in development for testing
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    return { default: WrappedComponent }
  })

  return function LazyWrappedComponent(props: P) {
    return (
      <LazyWrapper
        name={options.name || WrappedComponent.displayName || 'Component'}
        priority={options.priority}
        fallback={options.fallback ? <options.fallback {...props} /> : undefined}
      >
        <LazyComponent {...props} />
      </LazyWrapper>
    )
  }
}

// Preloader component for critical resources
export function ResourcePreloader() {
  useEffect(() => {
    // Preload critical CSS
    const preloadCSS = (href: string) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = href
      document.head.appendChild(link)
    }

    // Preload critical scripts
    const preloadScript = (src: string) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = src
      document.head.appendChild(link)
    }

    // Preload next likely pages
    const prefetchPage = (href: string) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    }

    // Critical resources
    preloadCSS('/_next/static/css/app/layout.css')
    
    // Likely next pages based on user flow
    prefetchPage('/workspace')
    prefetchPage('/dashboard')
    prefetchPage('/enterprise')

  }, [])

  return null
}

// Bundle size monitor (development only)
export function BundleSizeMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor performance entries
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.includes('_next/static')) {
            const size = (entry as PerformanceResourceTiming).transferSize
            if (size > 100 * 1024) { // > 100KB
              console.warn(`📦 Large resource detected: ${entry.name} (${Math.round(size / 1024)}KB)`)
            }
          }
        }
      })

      observer.observe({ entryTypes: ['resource'] })
      
      return () => observer.disconnect()
    }
  }, [])

  return null
}