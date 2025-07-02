/**
 * PRISMY PERFORMANCE TRACKING HOOK
 * React hook for tracking performance metrics in components
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { productionMetrics } from '@/lib/performance/production-metrics'
import { logger } from '@/lib/logger'

interface UsePerformanceTrackingOptions {
  trackPageLoad?: boolean
  trackComponentMount?: boolean
  trackUserInteractions?: boolean
  componentName?: string
  customMetrics?: string[]
}

interface PerformanceTracker {
  startTiming: (name: string) => void
  endTiming: (name: string) => void
  recordMetric: (name: string, value: number, unit?: string) => void
  trackFeatureUsage: (feature: string, properties?: Record<string, any>) => void
  trackAPICall: (
    endpoint: string,
    method: string,
    duration: number,
    status: number
  ) => void
  trackBusinessEvent: (
    event: string,
    value?: number,
    properties?: Record<string, any>
  ) => void
}

const timings = new Map<string, number>()

export function usePerformanceTracking(
  options: UsePerformanceTrackingOptions = {}
): PerformanceTracker {
  const {
    trackPageLoad = true,
    trackComponentMount = true,
    trackUserInteractions = false,
    componentName = 'Unknown',
    customMetrics = [],
  } = options

  const mountTime = useRef<number>(Date.now())
  const isUnmounted = useRef<boolean>(false)

  // Track component mount performance
  useEffect(() => {
    if (trackComponentMount) {
      const mountDuration = Date.now() - mountTime.current

      productionMetrics.recordMetric(
        `COMPONENT_MOUNT_${componentName.toUpperCase()}`,
        mountDuration,
        'ms',
        { componentName }
      )

      // Log slow component mounts
      if (mountDuration > 100) {
        logger.warn(`Slow component mount: ${componentName}`, {
          duration: mountDuration,
          component: componentName,
        })
      }
    }

    // Cleanup on unmount
    return () => {
      isUnmounted.current = true

      if (trackComponentMount) {
        const totalMountTime = Date.now() - mountTime.current
        productionMetrics.recordMetric(
          `COMPONENT_LIFETIME_${componentName.toUpperCase()}`,
          totalMountTime,
          'ms',
          { componentName }
        )
      }
    }
  }, [trackComponentMount, componentName])

  // Track page load performance
  useEffect(() => {
    if (trackPageLoad && typeof window !== 'undefined') {
      const handleLoad = () => {
        // Wait a bit for all resources to finish loading
        setTimeout(() => {
          if (!isUnmounted.current) {
            recordPageLoadMetrics()
          }
        }, 100)
      }

      if (document.readyState === 'complete') {
        handleLoad()
      } else {
        window.addEventListener('load', handleLoad)
        return () => window.removeEventListener('load', handleLoad)
      }
    }
  }, [trackPageLoad])

  // Track user interactions
  useEffect(() => {
    if (trackUserInteractions && typeof window !== 'undefined') {
      const handleInteraction = (event: Event) => {
        const target = event.target as HTMLElement
        const tagName = target.tagName.toLowerCase()
        const interaction = `${tagName}_${event.type}`

        productionMetrics.recordMetric(
          `INTERACTION_${interaction.toUpperCase()}`,
          1,
          'count',
          {
            component: componentName,
            target: tagName,
            className: target.className,
            id: target.id,
          }
        )
      }

      const events = ['click', 'keydown', 'touchstart']
      events.forEach(eventType => {
        document.addEventListener(eventType, handleInteraction)
      })

      return () => {
        events.forEach(eventType => {
          document.removeEventListener(eventType, handleInteraction)
        })
      }
    }
  }, [trackUserInteractions, componentName])

  const recordPageLoadMetrics = useCallback(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return

    try {
      // Navigation timing
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      if (navigation) {
        const metrics = {
          PAGE_LOAD_TIME: navigation.loadEventEnd - navigation.navigationStart,
          DOM_CONTENT_LOADED:
            navigation.domContentLoadedEventEnd - navigation.navigationStart,
          FIRST_BYTE: navigation.responseStart - navigation.navigationStart,
          DOM_INTERACTIVE:
            navigation.domInteractive - navigation.navigationStart,
        }

        Object.entries(metrics).forEach(([name, value]) => {
          if (value > 0) {
            productionMetrics.recordMetric(name, value, 'ms', {
              component: componentName,
              url: window.location.pathname,
            })
          }
        })
      }

      // Resource timing
      const resources = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[]
      let totalResourceTime = 0
      let largestResource = 0
      let resourceCount = 0

      resources.forEach(resource => {
        totalResourceTime += resource.duration
        largestResource = Math.max(largestResource, resource.duration)
        resourceCount++
      })

      if (resourceCount > 0) {
        productionMetrics.recordMetric(
          'AVERAGE_RESOURCE_TIME',
          totalResourceTime / resourceCount,
          'ms',
          { component: componentName, resourceCount, largestResource }
        )
      }
    } catch (error) {
      logger.error('Failed to record page load metrics', {
        error,
        component: componentName,
      })
    }
  }, [componentName])

  const startTiming = useCallback(
    (name: string) => {
      const key = `${componentName}_${name}`
      timings.set(key, performance.now())
    },
    [componentName]
  )

  const endTiming = useCallback(
    (name: string) => {
      const key = `${componentName}_${name}`
      const startTime = timings.get(key)

      if (startTime !== undefined) {
        const duration = performance.now() - startTime
        timings.delete(key)

        productionMetrics.recordMetric(
          `TIMING_${name.toUpperCase()}`,
          duration,
          'ms',
          { component: componentName }
        )

        // Log slow operations
        if (duration > 500) {
          logger.warn(`Slow operation: ${name} in ${componentName}`, {
            duration,
            component: componentName,
            operation: name,
          })
        }

        return duration
      }

      logger.warn(`Timing not found for ${name} in ${componentName}`)
      return 0
    },
    [componentName]
  )

  const recordMetric = useCallback(
    (name: string, value: number, unit: string = 'count') => {
      productionMetrics.recordMetric(name, value, unit, {
        component: componentName,
      })
    },
    [componentName]
  )

  const trackFeatureUsage = useCallback(
    (feature: string, properties?: Record<string, any>) => {
      productionMetrics.markFeatureUsage(feature, {
        component: componentName,
        ...properties,
      })

      logger.info(`Feature used: ${feature}`, {
        component: componentName,
        feature,
        properties,
      })
    },
    [componentName]
  )

  const trackAPICall = useCallback(
    (endpoint: string, method: string, duration: number, status: number) => {
      productionMetrics.recordAPIMetric({
        endpoint,
        method,
        statusCode: status,
        responseTime: duration,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      })

      // Log API performance issues
      if (duration > 5000) {
        logger.warn('Slow API call detected', {
          endpoint,
          method,
          duration,
          status,
          component: componentName,
        })
      }

      if (status >= 400) {
        logger.error('API error detected', {
          endpoint,
          method,
          status,
          duration,
          component: componentName,
        })
      }
    },
    [componentName]
  )

  const trackBusinessEvent = useCallback(
    (event: string, value?: number, properties?: Record<string, any>) => {
      productionMetrics.recordBusinessMetric({
        event,
        value: value || 1,
        timestamp: new Date().toISOString(),
        properties: {
          component: componentName,
          ...properties,
        },
      })

      logger.info(`Business event: ${event}`, {
        event,
        value,
        component: componentName,
        properties,
      })
    },
    [componentName]
  )

  return {
    startTiming,
    endTiming,
    recordMetric,
    trackFeatureUsage,
    trackAPICall,
    trackBusinessEvent,
  }
}

// Specialized hooks for common use cases

export function useAPIPerformanceTracking() {
  const { trackAPICall } = usePerformanceTracking()

  const wrapAPICall = useCallback(
    async <T>(
      endpoint: string,
      method: string,
      apiCall: () => Promise<T>
    ): Promise<T> => {
      const startTime = performance.now()
      let status = 200

      try {
        const result = await apiCall()
        return result
      } catch (error) {
        status = error instanceof Response ? error.status : 500
        throw error
      } finally {
        const duration = performance.now() - startTime
        trackAPICall(endpoint, method, duration, status)
      }
    },
    [trackAPICall]
  )

  return { wrapAPICall, trackAPICall }
}

export function useFeatureTracking(componentName: string) {
  const { trackFeatureUsage } = usePerformanceTracking({ componentName })

  const trackClick = useCallback(
    (feature: string, properties?: Record<string, any>) => {
      trackFeatureUsage(`${feature}_click`, properties)
    },
    [trackFeatureUsage]
  )

  const trackView = useCallback(
    (feature: string, properties?: Record<string, any>) => {
      trackFeatureUsage(`${feature}_view`, properties)
    },
    [trackFeatureUsage]
  )

  const trackComplete = useCallback(
    (feature: string, properties?: Record<string, any>) => {
      trackFeatureUsage(`${feature}_complete`, properties)
    },
    [trackFeatureUsage]
  )

  return {
    trackClick,
    trackView,
    trackComplete,
    trackFeatureUsage,
  }
}

export function useBusinessMetrics() {
  const { trackBusinessEvent } = usePerformanceTracking()

  const trackTranslation = useCallback(
    (
      sourceLanguage: string,
      targetLanguage: string,
      characterCount: number,
      duration: number
    ) => {
      trackBusinessEvent('translation_completed', characterCount, {
        sourceLanguage,
        targetLanguage,
        duration,
        efficiency: characterCount / duration, // characters per ms
      })
    },
    [trackBusinessEvent]
  )

  const trackDocumentUpload = useCallback(
    (fileType: string, fileSize: number, processingTime: number) => {
      trackBusinessEvent('document_uploaded', fileSize, {
        fileType,
        processingTime,
        sizeCategory:
          fileSize > 1024 * 1024
            ? 'large'
            : fileSize > 100 * 1024
              ? 'medium'
              : 'small',
      })
    },
    [trackBusinessEvent]
  )

  const trackSubscriptionEvent = useCallback(
    (
      event: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate',
      plan: string,
      value?: number
    ) => {
      trackBusinessEvent(`subscription_${event}`, value, { plan })
    },
    [trackBusinessEvent]
  )

  return {
    trackTranslation,
    trackDocumentUpload,
    trackSubscriptionEvent,
    trackBusinessEvent,
  }
}

// HOC for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  options?: UsePerformanceTrackingOptions
) {
  const WrappedComponent = (props: P) => {
    usePerformanceTracking({
      componentName: Component.displayName || Component.name || 'Unknown',
      ...options,
    })

    return React.createElement(Component, props)
  }

  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name})`
  return WrappedComponent
}
