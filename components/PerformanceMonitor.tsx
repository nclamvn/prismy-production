'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// Temporarily disabled for zen build
// import PerformanceDashboard, { usePerformanceMonitor } from '../src/components/monitoring/PerformanceDashboard'

function usePerformanceMonitor() {
  return { isVisible: false, toggle: () => {} }
}

interface PerformanceMetrics {
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  FCP?: number // First Contentful Paint
  TTFB?: number // Time to First Byte
  navigationTiming?: PerformanceNavigationTiming
  memoryUsage?: any
  connectionInfo?: any
}

interface PerformanceThresholds {
  LCP: { good: number; poor: number }
  FID: { good: number; poor: number }
  CLS: { good: number; poor: number }
  FCP: { good: number; poor: number }
  TTFB: { good: number; poor: number }
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [showDetails, setShowDetails] = useState(false)
  const [isCollecting, setIsCollecting] = useState(true)
  const { isVisible: isDashboardVisible, toggle: toggleDashboard } =
    usePerformanceMonitor()

  const thresholds: PerformanceThresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  }

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      process.env.NODE_ENV !== 'development'
    ) {
      return
    }

    let observer: PerformanceObserver | null = null

    const collectMetrics = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming

      setMetrics(prev => ({
        ...prev,
        navigationTiming: navigation,
        TTFB: navigation.responseStart - navigation.requestStart,
      }))

      // Collect memory info if available
      if ('memory' in performance) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: (performance as any).memory,
        }))
      }

      // Collect connection info if available
      if ('connection' in navigator) {
        setMetrics(prev => ({
          ...prev,
          connectionInfo: (navigator as any).connection,
        }))
      }

      // Web Vitals collection
      if ('PerformanceObserver' in window) {
        try {
          observer = new PerformanceObserver(list => {
            list.getEntries().forEach(entry => {
              switch (entry.entryType) {
                case 'largest-contentful-paint':
                  setMetrics(prev => ({ ...prev, LCP: entry.startTime }))
                  break
                case 'first-input':
                  setMetrics(prev => ({
                    ...prev,
                    FID: (entry as any).processingStart - entry.startTime,
                  }))
                  break
                case 'layout-shift':
                  if (!(entry as any).hadRecentInput) {
                    setMetrics(prev => ({
                      ...prev,
                      CLS: (prev.CLS || 0) + (entry as any).value,
                    }))
                  }
                  break
                case 'paint':
                  if (entry.name === 'first-contentful-paint') {
                    setMetrics(prev => ({ ...prev, FCP: entry.startTime }))
                  }
                  break
              }
            })
          })

          observer.observe({
            entryTypes: [
              'largest-contentful-paint',
              'first-input',
              'layout-shift',
              'paint',
            ],
          })
        } catch (error) {
          console.warn('[Performance Monitor] Observer setup failed:', error)
        }
      }
    }

    // Initial collection
    if (document.readyState === 'complete') {
      collectMetrics()
    } else {
      window.addEventListener('load', collectMetrics)
    }

    // Stop collecting after 30 seconds
    const timeout = setTimeout(() => {
      setIsCollecting(false)
      observer?.disconnect()
    }, 30000)

    return () => {
      isMounted = false
      observer?.disconnect()
      clearTimeout(timeout)
      clearInterval(enhancedInterval)
      window.removeEventListener('load', collectMetrics)
    }
  }, [])

  // Real User Monitoring (RUM) - Report to analytics
  const reportWebVital = useCallback((metric: string, value: number) => {
    // Only report in production
    if (process.env.NODE_ENV !== 'production') return

    try {
      // Send to your analytics service
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric,
          value,
          url: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      }).catch(() => {}) // Silent fail
    } catch (error) {
      // Silent fail for analytics
    }
  }, [])

  const getMetricStatus = (
    metric: keyof PerformanceThresholds,
    value?: number
  ): 'good' | 'needs-improvement' | 'poor' => {
    if (!value) return 'good'
    const threshold = thresholds[metric]
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatMetric = (
    value: number | undefined,
    unit: string = 'ms'
  ): string => {
    if (!value) return 'N/A'
    if (unit === 'ms') return `${Math.round(value)}ms`
    if (unit === 'score') return value.toFixed(3)
    return value.toString()
  }

  // Enhanced real-time performance score
  const getPerformanceScore = useCallback((): number => {
    const { LCP = 0, FID = 0, CLS = 0, FCP = 0, TTFB = 0 } = metrics

    let score = 100

    // LCP scoring (weight: 25%)
    if (LCP > 4000) score -= 25
    else if (LCP > 2500) score -= 15

    // FID scoring (weight: 25%)
    if (FID > 300) score -= 25
    else if (FID > 100) score -= 15

    // CLS scoring (weight: 25%)
    if (CLS > 0.25) score -= 25
    else if (CLS > 0.1) score -= 15

    // FCP scoring (weight: 15%)
    if (FCP > 3000) score -= 15
    else if (FCP > 1800) score -= 10

    // TTFB scoring (weight: 10%)
    if (TTFB > 1800) score -= 10
    else if (TTFB > 800) score -= 5

    return Math.max(0, score)
  }, [metrics])

  const performanceScore = getPerformanceScore()

  return (
    <>
      {/* Enhanced Performance Dashboard - Temporarily disabled */}
      {/* <PerformanceDashboard 
        isVisible={isDashboardVisible} 
        onClose={() => toggleDashboard()} 
      /> */}

      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {showDetails && (
            <motion.div
              className="mb-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 max-w-md"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  Performance Metrics
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {/* Core Web Vitals */}
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Core Web Vitals
                  </h4>

                  <div
                    className={`text-xs px-2 py-1 rounded border ${getStatusColor(getMetricStatus('LCP', metrics.LCP))}`}
                  >
                    LCP: {formatMetric(metrics.LCP)}
                  </div>

                  <div
                    className={`text-xs px-2 py-1 rounded border ${getStatusColor(getMetricStatus('FID', metrics.FID))}`}
                  >
                    FID: {formatMetric(metrics.FID)}
                  </div>

                  <div
                    className={`text-xs px-2 py-1 rounded border ${getStatusColor(getMetricStatus('CLS', metrics.CLS))}`}
                  >
                    CLS: {formatMetric(metrics.CLS, 'score')}
                  </div>
                </div>

                {/* Other Metrics */}
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Other Metrics
                  </h4>

                  <div
                    className={`text-xs px-2 py-1 rounded border ${getStatusColor(getMetricStatus('FCP', metrics.FCP))}`}
                  >
                    FCP: {formatMetric(metrics.FCP)}
                  </div>

                  <div
                    className={`text-xs px-2 py-1 rounded border ${getStatusColor(getMetricStatus('TTFB', metrics.TTFB))}`}
                  >
                    TTFB: {formatMetric(metrics.TTFB)}
                  </div>
                </div>

                {/* Memory Usage */}
                {metrics.memoryUsage && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Memory
                    </h4>
                    <div className="text-xs text-gray-600">
                      Used:{' '}
                      {Math.round(
                        metrics.memoryUsage.usedJSHeapSize / 1024 / 1024
                      )}
                      MB
                      <br />
                      Limit:{' '}
                      {Math.round(
                        metrics.memoryUsage.jsHeapSizeLimit / 1024 / 1024
                      )}
                      MB
                    </div>
                  </div>
                )}

                {/* Connection Info */}
                {metrics.connectionInfo && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Connection
                    </h4>
                    <div className="text-xs text-gray-600">
                      Type: {metrics.connectionInfo.effectiveType}
                      <br />
                      Downlink: {metrics.connectionInfo.downlink}Mbps
                    </div>
                  </div>
                )}

                {isCollecting && (
                  <div className="text-xs text-blue-600 flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                    Collecting metrics...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${getMetricStatus('LCP', metrics.LCP) === 'good' ? 'bg-green-500' : getMetricStatus('LCP', metrics.LCP) === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'}`}
              ></div>
              <div
                className={`w-2 h-2 rounded-full ${getMetricStatus('FID', metrics.FID) === 'good' ? 'bg-green-500' : getMetricStatus('FID', metrics.FID) === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'}`}
              ></div>
              <div
                className={`w-2 h-2 rounded-full ${getMetricStatus('CLS', metrics.CLS) === 'good' ? 'bg-green-500' : getMetricStatus('CLS', metrics.CLS) === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'}`}
              ></div>
            </div>
            <span className="text-xs font-medium text-gray-700">Perf</span>
          </div>
        </motion.button>
      </div>
    </>
  )
}
