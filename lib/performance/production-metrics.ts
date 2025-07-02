/**
 * PRISMY PRODUCTION PERFORMANCE METRICS
 * Comprehensive performance monitoring for production deployment
 * Integrates with multiple monitoring services and provides real-time insights
 */

import { logger } from '@/lib/logger'
import { errorTracker } from '@/lib/error-tracking/mock-sentry'
import { alertManager } from '@/lib/error-tracking/alert-manager'

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  tags?: Record<string, string>
  metadata?: Record<string, any>
}

export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
  url: string
  timestamp: string
}

export interface APIMetric {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: string
  userAgent?: string
  userId?: string
  error?: string
}

export interface ResourceMetric {
  name: string
  type: string
  size: number
  loadTime: number
  cacheStatus: 'hit' | 'miss' | 'bypass'
  timestamp: string
}

export interface BusinessMetric {
  event: string
  value: number
  currency?: string
  userId?: string
  properties?: Record<string, any>
  timestamp: string
}

class ProductionMetrics {
  private static instance: ProductionMetrics
  private metrics: PerformanceMetric[] = []
  private webVitalsBuffer: WebVitalsMetric[] = []
  private apiMetricsBuffer: APIMetric[] = []
  private isInitialized = false
  private batchTimer?: NodeJS.Timeout
  private observers: PerformanceObserver[] = []

  private readonly thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    FID: { good: 100, poor: 300 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
    API_RESPONSE_TIME: { good: 1000, poor: 5000 },
    MEMORY_USAGE: { good: 0.7, poor: 0.9 },
    ERROR_RATE: { good: 0.01, poor: 0.05 },
  }

  private constructor() {}

  public static getInstance(): ProductionMetrics {
    if (!ProductionMetrics.instance) {
      ProductionMetrics.instance = new ProductionMetrics()
    }
    return ProductionMetrics.instance
  }

  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    try {
      // Initialize Web Vitals monitoring
      this.initializeWebVitals()

      // Initialize resource monitoring
      this.initializeResourceMonitoring()

      // Initialize navigation timing
      this.initializeNavigationTiming()

      // Initialize custom metrics collection
      this.initializeCustomMetrics()

      // Start batch processing
      this.startBatchProcessing()

      this.isInitialized = true
      logger.info('Production metrics monitoring initialized')
    } catch (error) {
      logger.error('Failed to initialize production metrics', { error })
    }
  }

  private async initializeWebVitals(): Promise<void> {
    try {
      // Dynamically import web-vitals
      const { onCLS, onFCP, onFID, onLCP, onTTFB, onINP } = await import(
        'web-vitals'
      )

      const handleMetric = (metric: any) => {
        const webVitalMetric: WebVitalsMetric = {
          name: metric.name,
          value: metric.value,
          rating: this.getMetricRating(metric.name, metric.value),
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType || 'navigate',
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }

        this.webVitalsBuffer.push(webVitalMetric)
        this.handleWebVitalMetric(webVitalMetric)
      }

      // Register Web Vitals observers
      onCLS(handleMetric)
      onFCP(handleMetric)
      onFID(handleMetric)
      onLCP(handleMetric)
      onTTFB(handleMetric)

      // INP might not be available in all versions
      if (onINP) {
        onINP(handleMetric)
      }
    } catch (error) {
      logger.warn('Web Vitals not available, using fallback metrics', { error })
      this.initializeFallbackMetrics()
    }
  }

  private initializeFallbackMetrics(): void {
    // Basic performance metrics using native APIs
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor paint timing
      const paintObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP_FALLBACK', entry.startTime, 'ms', {
              type: 'fallback',
            })
          }
        }
      })

      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(paintObserver)
    }
  }

  private initializeResourceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return

    const resourceObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming

          const metric: ResourceMetric = {
            name: resourceEntry.name,
            type: this.getResourceType(resourceEntry.name),
            size: resourceEntry.transferSize || 0,
            loadTime: resourceEntry.duration,
            cacheStatus: this.getCacheStatus(resourceEntry),
            timestamp: new Date().toISOString(),
          }

          this.handleResourceMetric(metric)
        }
      }
    })

    resourceObserver.observe({ entryTypes: ['resource'] })
    this.observers.push(resourceObserver)
  }

  private initializeNavigationTiming(): void {
    if (!('PerformanceObserver' in window)) return

    const navigationObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          this.handleNavigationTiming(navEntry)
        }
      }
    })

    navigationObserver.observe({ entryTypes: ['navigation'] })
    this.observers.push(navigationObserver)
  }

  private initializeCustomMetrics(): void {
    // Monitor memory usage
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        if (memory) {
          const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit

          this.recordMetric('MEMORY_USAGE', usage, 'ratio', {
            usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            totalMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          })

          // Alert if memory usage is high
          if (usage > this.thresholds.MEMORY_USAGE.poor) {
            alertManager.createPerformanceAlert(
              'MEMORY_USAGE',
              usage,
              this.thresholds.MEMORY_USAGE.poor
            )
          }
        }
      }
    }, 30000) // Every 30 seconds

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        this.recordMetric('CONNECTION_DOWNLINK', connection.downlink, 'mbps', {
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
        })
      }
    }
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch()
    }, 10000) // Process every 10 seconds
  }

  private async processBatch(): Promise<void> {
    if (
      this.webVitalsBuffer.length === 0 &&
      this.apiMetricsBuffer.length === 0
    ) {
      return
    }

    try {
      const batch = {
        webVitals: [...this.webVitalsBuffer],
        apiMetrics: [...this.apiMetricsBuffer],
        timestamp: new Date().toISOString(),
      }

      // Clear buffers
      this.webVitalsBuffer = []
      this.apiMetricsBuffer = []

      // Send to monitoring endpoints
      await this.sendMetricsBatch(batch)
    } catch (error) {
      logger.error('Failed to process metrics batch', { error })
    }
  }

  private async sendMetricsBatch(batch: any): Promise<void> {
    const promises = []

    // Send to custom endpoint
    if (process.env.NEXT_PUBLIC_METRICS_ENDPOINT) {
      promises.push(
        fetch(process.env.NEXT_PUBLIC_METRICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        }).catch(error =>
          logger.warn('Failed to send to metrics endpoint', { error })
        )
      )
    }

    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      batch.webVitals.forEach((metric: WebVitalsMetric) => {
        gtag('event', 'web_vital', {
          metric_name: metric.name,
          metric_value: Math.round(metric.value),
          metric_rating: metric.rating,
        })
      })
    }

    await Promise.allSettled(promises)
  }

  private handleWebVitalMetric(metric: WebVitalsMetric): void {
    // Record in Sentry
    errorTracker.addBreadcrumb({
      message: `Web Vital: ${metric.name}`,
      category: 'performance',
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: metric,
    })

    // Create alerts for poor metrics
    if (metric.rating === 'poor') {
      alertManager.createPerformanceAlert(
        metric.name,
        metric.value,
        this.thresholds[metric.name]?.poor || 0
      )
    }

    // Log significant metrics
    if (metric.rating !== 'good') {
      logger.warn(`Poor ${metric.name} performance`, {
        value: metric.value,
        rating: metric.rating,
        url: metric.url,
      })
    }
  }

  private handleResourceMetric(metric: ResourceMetric): void {
    // Alert on large resources
    if (metric.size > 1024 * 1024) {
      // 1MB
      logger.warn('Large resource detected', {
        name: metric.name,
        size: `${Math.round(metric.size / 1024 / 1024)}MB`,
        loadTime: `${metric.loadTime.toFixed(2)}ms`,
      })
    }

    // Alert on slow loading resources
    if (metric.loadTime > 5000) {
      // 5 seconds
      logger.warn('Slow resource loading', {
        name: metric.name,
        loadTime: `${metric.loadTime.toFixed(2)}ms`,
        type: metric.type,
      })
    }
  }

  private handleNavigationTiming(navEntry: PerformanceNavigationTiming): void {
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
      DOMReady: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
      WindowLoad: navEntry.loadEventEnd - navEntry.navigationStart,
    }

    Object.entries(metrics).forEach(([name, value]) => {
      this.recordMetric(`NAV_${name}`, value, 'ms')
    })

    // Alert on slow TTFB
    if (metrics.TTFB > this.thresholds.TTFB.poor) {
      alertManager.createPerformanceAlert(
        'TTFB',
        metrics.TTFB,
        this.thresholds.TTFB.poor
      )
    }
  }

  // Public API methods
  public recordMetric(
    name: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      metadata,
    }

    this.metrics.push(metric)

    // Send to Sentry
    errorTracker.addBreadcrumb({
      message: `Metric: ${name}`,
      category: 'performance',
      data: metric,
    })
  }

  public recordAPIMetric(metric: APIMetric): void {
    this.apiMetricsBuffer.push(metric)

    // Alert on slow API responses
    if (metric.responseTime > this.thresholds.API_RESPONSE_TIME.poor) {
      alertManager.createPerformanceAlert(
        `API_${metric.endpoint}`,
        metric.responseTime,
        this.thresholds.API_RESPONSE_TIME.poor
      )
    }

    // Track API errors
    if (metric.statusCode >= 400) {
      logger.warn('API error recorded', {
        endpoint: metric.endpoint,
        statusCode: metric.statusCode,
        responseTime: metric.responseTime,
      })
    }
  }

  public recordBusinessMetric(metric: BusinessMetric): void {
    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.event, {
        value: metric.value,
        currency: metric.currency,
        custom_parameters: metric.properties,
      })
    }

    // Track in Sentry
    errorTracker.addBreadcrumb({
      message: `Business metric: ${metric.event}`,
      category: 'business',
      data: metric,
    })

    logger.info('Business metric recorded', metric)
  }

  public markFeatureUsage(
    feature: string,
    properties?: Record<string, any>
  ): void {
    this.recordMetric(
      `FEATURE_${feature.toUpperCase()}`,
      1,
      'count',
      properties
    )

    errorTracker.addBreadcrumb({
      message: `Feature used: ${feature}`,
      category: 'user',
      data: properties,
    })
  }

  public startTransaction(name: string): PerformanceTransaction {
    return new PerformanceTransaction(name, this)
  }

  // Utility methods
  private getMetricRating(
    name: string,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[name as keyof typeof this.thresholds]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)/)) return 'font'
    return 'other'
  }

  private getCacheStatus(
    entry: PerformanceResourceTiming
  ): 'hit' | 'miss' | 'bypass' {
    if (entry.transferSize === 0) return 'hit'
    if (entry.transferSize < entry.encodedBodySize) return 'hit'
    return 'miss'
  }

  // Cleanup
  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
    }

    this.observers.forEach(observer => {
      observer.disconnect()
    })
    this.observers = []

    this.isInitialized = false
  }

  // Statistics
  public getStats(): {
    totalMetrics: number
    webVitalsCount: number
    apiMetricsCount: number
    isInitialized: boolean
  } {
    return {
      totalMetrics: this.metrics.length,
      webVitalsCount: this.webVitalsBuffer.length,
      apiMetricsCount: this.apiMetricsBuffer.length,
      isInitialized: this.isInitialized,
    }
  }
}

// Performance transaction class for custom timing
export class PerformanceTransaction {
  private startTime: number
  private endTime?: number
  private metrics: Record<string, number> = {}

  constructor(
    private name: string,
    private metricsInstance: ProductionMetrics
  ) {
    this.startTime = performance.now()
  }

  public mark(name: string): void {
    this.metrics[name] = performance.now() - this.startTime
  }

  public finish(): void {
    this.endTime = performance.now()
    const duration = this.endTime - this.startTime

    this.metricsInstance.recordMetric(
      `TRANSACTION_${this.name}`,
      duration,
      'ms',
      {
        marks: this.metrics,
      }
    )

    // Log slow transactions
    if (duration > 1000) {
      logger.warn(`Slow transaction: ${this.name}`, {
        duration: `${duration.toFixed(2)}ms`,
        marks: this.metrics,
      })
    }
  }
}

// Export singleton instance
export const productionMetrics = ProductionMetrics.getInstance()

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      productionMetrics.initialize()
    })
  } else {
    productionMetrics.initialize()
  }
}

export default productionMetrics
