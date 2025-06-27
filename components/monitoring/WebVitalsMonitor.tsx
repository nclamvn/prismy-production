'use client'

import { useEffect, useRef } from 'react'

// Web Vitals types
interface Metric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender'
}

interface WebVitalsMonitorProps {
  onMetric?: (metric: Metric) => void
  debug?: boolean
}

// Thresholds for Core Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
}

function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

export function WebVitalsMonitor({
  onMetric,
  debug = false,
}: WebVitalsMonitorProps) {
  const reportedMetrics = useRef(new Set<string>())

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const reportMetric = (metric: any) => {
      // Avoid duplicate reports
      const metricId = `${metric.name}-${metric.id}`
      if (reportedMetrics.current.has(metricId)) return
      reportedMetrics.current.add(metricId)

      const formattedMetric: Metric = {
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType || 'navigate',
      }

      if (debug) {
        console.log('Web Vital:', formattedMetric)
      }

      // Send to analytics/monitoring service
      if (onMetric) {
        onMetric(formattedMetric)
      } else {
        // Default: send to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `📊 ${formattedMetric.name}: ${formattedMetric.value.toFixed(2)}ms (${formattedMetric.rating})`
          )
        }
      }

      // Send to analytics service (placeholder)
      sendToAnalytics(formattedMetric)
    }

    // Dynamically import web-vitals if available
    try {
      // Only attempt to load web-vitals in production or if explicitly enabled
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === 'true'
      ) {
        import('web-vitals')
          .then(({ onCLS, onFCP, onFID, onLCP, onTTFB, onINP }) => {
            onCLS(reportMetric)
            onFCP(reportMetric)
            onFID(reportMetric)
            onLCP(reportMetric)
            onTTFB(reportMetric)

            // INP is newer and might not be available in all versions
            if (onINP) {
              onINP(reportMetric)
            }
          })
          .catch(error => {
            if (debug) {
              console.warn('web-vitals package not available:', error)
            }
          })
      } else {
        // Fallback: Use Performance API directly for basic metrics
        // Performance monitoring disabled to fix hooks error
      }
    } catch (error) {
      if (debug) {
        console.warn('Performance monitoring failed to initialize:', error)
      }
    }

    // Custom performance observers for additional metrics
    observeResourceTiming()
    observeNavigationTiming()
    observeLayoutShifts()
  }, [onMetric, debug])

  return null // This component doesn't render anything
}

// Fallback performance monitoring using native Performance API
function useBasicPerformanceMonitoring(reportMetric: (metric: any) => void) {
  if (typeof window === 'undefined' || !('performance' in window)) return

  // Basic LCP approximation using load event
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigationTiming = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      if (navigationTiming) {
        const loadTime =
          navigationTiming.loadEventStart - navigationTiming.navigationStart
        reportMetric({
          name: 'LCP_APPROX',
          value: loadTime,
          delta: loadTime,
          id: 'basic-lcp',
          navigationType: 'navigate',
        })
      }
    }, 0)
  })

  // Basic FCP using Performance API
  const paintEntries = performance.getEntriesByType('paint')
  paintEntries.forEach(entry => {
    if (entry.name === 'first-contentful-paint') {
      reportMetric({
        name: 'FCP_BASIC',
        value: entry.startTime,
        delta: entry.startTime,
        id: 'basic-fcp',
        navigationType: 'navigate',
      })
    }
  })
}

// Send metrics to your analytics service
function sendToAnalytics(metric: Metric) {
  // Example integrations:

  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      custom_map: { metric_rating: 'custom_metric_rating' },
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_id: metric.id,
    })
  }

  // PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    ;(window as any).posthog.capture('web_vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_id: metric.id,
    })
  }

  // Custom API endpoint - disabled for production stability
  if (false && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web_vital',
        ...metric,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silently fail for analytics
    })
  }
}

// Observe resource loading performance
function observeResourceTiming() {
  if (!('PerformanceObserver' in window)) return

  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming

          // Track slow resources
          if (resourceEntry.duration > 1000) {
            console.warn(
              `Slow resource: ${resourceEntry.name} (${resourceEntry.duration.toFixed(2)}ms)`
            )
          }

          // Track large resources
          if (resourceEntry.transferSize > 1000000) {
            // 1MB
            console.warn(
              `Large resource: ${resourceEntry.name} (${(resourceEntry.transferSize / 1024 / 1024).toFixed(2)}MB)`
            )
          }
        }
      }
    })

    observer.observe({ entryTypes: ['resource'] })
  } catch (error) {
    console.warn('Resource timing observer failed:', error)
  }
}

// Observe navigation timing
function observeNavigationTiming() {
  if (!('PerformanceObserver' in window)) return

  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming

          // Calculate custom metrics
          const metrics = {
            DNS: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            TCP: navEntry.connectEnd - navEntry.connectStart,
            SSL:
              navEntry.secureConnectionStart > 0
                ? navEntry.connectEnd - navEntry.secureConnectionStart
                : 0,
            TTFB: navEntry.responseStart - navEntry.requestStart,
            Download: navEntry.responseEnd - navEntry.responseStart,
            DOMParse: navEntry.domInteractive - navEntry.responseEnd,
            DOMReady:
              navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
            WindowLoad: navEntry.loadEventEnd - navEntry.navigationStart,
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('Navigation Timing:', metrics)
          }
        }
      }
    })

    observer.observe({ entryTypes: ['navigation'] })
  } catch (error) {
    console.warn('Navigation timing observer failed:', error)
  }
}

// Observe layout shifts in detail
function observeLayoutShifts() {
  if (!('PerformanceObserver' in window)) return

  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (
          entry.entryType === 'layout-shift' &&
          !(entry as any).hadRecentInput
        ) {
          const layoutShiftEntry = entry as any

          if (layoutShiftEntry.value > 0.1) {
            console.warn(
              `Large layout shift detected: ${layoutShiftEntry.value.toFixed(4)}`
            )

            // Log the sources of the shift
            if (layoutShiftEntry.sources) {
              layoutShiftEntry.sources.forEach((source: any, index: number) => {
                console.warn(`  Source ${index + 1}:`, source.node)
              })
            }
          }
        }
      }
    })

    observer.observe({ entryTypes: ['layout-shift'] })
  } catch (error) {
    console.warn('Layout shift observer failed:', error)
  }
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const markStart = (name: string) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${name}-start`)
    }
  }

  const markEnd = (name: string) => {
    if (
      'performance' in window &&
      'mark' in performance &&
      'measure' in performance
    ) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)

      const measures = performance.getEntriesByName(name, 'measure')
      if (measures.length > 0) {
        const duration = measures[measures.length - 1].duration

        if (process.env.NODE_ENV === 'development') {
          console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
        }

        // Clean up marks and measures
        performance.clearMarks(`${name}-start`)
        performance.clearMarks(`${name}-end`)
        performance.clearMeasures(name)

        return duration
      }
    }
    return 0
  }

  const measureAsync = async <T,>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    markStart(name)
    try {
      const result = await fn()
      markEnd(name)
      return result
    } catch (error) {
      markEnd(name)
      throw error
    }
  }

  return { markStart, markEnd, measureAsync }
}

// Component performance wrapper
interface PerformanceWrapperProps {
  name: string
  children: React.ReactNode
  threshold?: number // ms
}

export function PerformanceWrapper({
  name,
  children,
  threshold = 16,
}: PerformanceWrapperProps) {
  const { markStart, markEnd } = usePerformanceMonitoring()

  useEffect(() => {
    markStart(`component-${name}`)

    return () => {
      const duration = markEnd(`component-${name}`)

      if (duration > threshold) {
        console.warn(
          `⚠️ Slow component render: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
        )
      }
    }
  })

  return <>{children}</>
}
