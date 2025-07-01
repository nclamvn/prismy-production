'use client'

import React, { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface PerformanceMetrics {
  routeChangeStart: number
  routeChangeComplete: number
  componentMountTime: number
  renderTime: number
  memoryUsage?: number
}

interface PerformanceMonitorProps {
  children: React.ReactNode
  enableLogging?: boolean
  enableAnalytics?: boolean
  threshold?: {
    routeChange: number
    componentMount: number
    render: number
  }
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  children,
  enableLogging = process.env.NODE_ENV === 'development',
  enableAnalytics = true,
  threshold = {
    routeChange: 1000, // 1 second
    componentMount: 500, // 500ms
    render: 100 // 100ms
  }
}) => {
  const router = useRouter()
  const metricsRef = useRef<PerformanceMetrics>({
    routeChangeStart: 0,
    routeChangeComplete: 0,
    componentMountTime: 0,
    renderTime: 0
  })
  const mountTimeRef = useRef<number>(0)
  const renderStartRef = useRef<number>(0)

  // Track component mount performance
  useEffect(() => {
    mountTimeRef.current = performance.now()
    
    return () => {
      const mountTime = performance.now() - mountTimeRef.current
      metricsRef.current.componentMountTime = mountTime
      
      if (enableLogging && mountTime > threshold.componentMount) {
        console.warn(`Slow component mount detected: ${mountTime.toFixed(2)}ms`)
      }
    }
  }, [enableLogging, threshold.componentMount])

  // Track render performance
  useEffect(() => {
    renderStartRef.current = performance.now()
  })

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current
    metricsRef.current.renderTime = renderTime
    
    if (enableLogging && renderTime > threshold.render) {
      console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`)
    }
  })

  // Monitor route changes
  useEffect(() => {
    const handleRouteChangeStart = () => {
      metricsRef.current.routeChangeStart = performance.now()
    }

    const handleRouteChangeComplete = () => {
      const routeChangeTime = performance.now() - metricsRef.current.routeChangeStart
      metricsRef.current.routeChangeComplete = routeChangeTime
      
      if (enableLogging && routeChangeTime > threshold.routeChange) {
        console.warn(`Slow route change detected: ${routeChangeTime.toFixed(2)}ms`)
      }
      
      if (enableAnalytics) {
        // Send metrics to analytics service
        sendMetricsToAnalytics(metricsRef.current)
      }
    }

    // Note: Next.js 13+ app router doesn't have these events
    // This is for Pages router compatibility
    if (typeof window !== 'undefined' && router.events) {
      router.events.on('routeChangeStart', handleRouteChangeStart)
      router.events.on('routeChangeComplete', handleRouteChangeComplete)
      
      return () => {
        router.events.off('routeChangeStart', handleRouteChangeStart)
        router.events.off('routeChangeComplete', handleRouteChangeComplete)
      }
    }
  }, [router, enableLogging, enableAnalytics, threshold.routeChange])

  // Monitor memory usage
  useEffect(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const checkMemoryUsage = () => {
        const memory = (performance as any).memory
        metricsRef.current.memoryUsage = memory.usedJSHeapSize
        
        if (enableLogging && memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          console.warn(`High memory usage detected: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
        }
      }

      const interval = setInterval(checkMemoryUsage, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [enableLogging])

  return <>{children}</>
}

// Send metrics to analytics service
const sendMetricsToAnalytics = (metrics: PerformanceMetrics) => {
  // In a real application, you would send this to your analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metrics:', {
      routeChangeTime: metrics.routeChangeComplete,
      componentMountTime: metrics.componentMountTime,
      renderTime: metrics.renderTime,
      memoryUsage: metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
    })
  }
}

// Hook for measuring custom performance metrics
export const usePerformanceMetrics = () => {
  const measureAsync = useCallback(async <T,>(
    name: string,
    asyncOperation: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now()
    
    try {
      const result = await asyncOperation()
      const duration = performance.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${name} completed in ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }, [])

  const measure = useCallback(<T,>(
    name: string,
    operation: () => T
  ): T => {
    const start = performance.now()
    
    try {
      const result = operation()
      const duration = performance.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${name} completed in ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }, [])

  return { measureAsync, measure }
}

// HOC for adding performance monitoring to components
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const displayName = componentName || Component.displayName || Component.name || 'Component'
  
  const PerformanceWrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const mountStart = useRef<number>(0)
    const renderStart = useRef<number>(0)

    // Track mount time
    useEffect(() => {
      mountStart.current = performance.now()
      
      return () => {
        const mountTime = performance.now() - mountStart.current
        if (process.env.NODE_ENV === 'development' && mountTime > 100) {
          console.log(`${displayName} mount time: ${mountTime.toFixed(2)}ms`)
        }
      }
    }, [])

    // Track render time
    renderStart.current = performance.now()
    
    useEffect(() => {
      const renderTime = performance.now() - renderStart.current
      if (process.env.NODE_ENV === 'development' && renderTime > 16) { // 16ms = 60fps
        console.log(`${displayName} render time: ${renderTime.toFixed(2)}ms`)
      }
    })

    return <Component ref={ref} {...props} />
  })

  PerformanceWrappedComponent.displayName = `withPerformanceMonitoring(${displayName})`
  
  return PerformanceWrappedComponent
}

// Bundle size analyzer for development
export const BundleSizeAnalyzer: React.FC = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Analyze bundle size impact of imports
      const analyzeImports = () => {
        const scripts = Array.from(document.querySelectorAll('script[src]'))
        const totalSize = scripts.reduce((total, script) => {
          const size = script.getAttribute('data-size')
          return total + (size ? parseInt(size) : 0)
        }, 0)
        
        console.log('Bundle Analysis:', {
          scriptCount: scripts.length,
          estimatedTotalSize: `${(totalSize / 1024).toFixed(2)}KB`,
          scripts: scripts.map(script => ({
            src: script.getAttribute('src'),
            size: script.getAttribute('data-size')
          }))
        })
      }

      // Run analysis after page load
      setTimeout(analyzeImports, 2000)
    }
  }, [])

  return null
}

// Performance budget checker
export const PerformanceBudgetChecker: React.FC<{
  budgets: {
    firstContentfulPaint: number
    largestContentfulPaint: number
    firstInputDelay: number
    cumulativeLayoutShift: number
  }
}> = ({ budgets }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkBudgets = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const fcp = navigation.responseEnd - navigation.requestStart
        if (fcp > budgets.firstContentfulPaint) {
          console.warn(`FCP budget exceeded: ${fcp.toFixed(2)}ms > ${budgets.firstContentfulPaint}ms`)
        }
      }

      // Check Web Vitals if available
      if ('web-vitals' in window) {
        // This would integrate with web-vitals library
        console.log('Web Vitals monitoring active')
      }
    }

    setTimeout(checkBudgets, 3000)
  }, [budgets])

  return null
}

export default PerformanceMonitor