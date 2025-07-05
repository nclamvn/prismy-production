import { createClient } from '@/lib/supabase/client'

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percent'
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface PerformanceReport {
  metrics: PerformanceMetric[]
  userAgent: string
  url: string
  timestamp: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private observers: PerformanceObserver[] = []
  private supabase = createClient()

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
      this.monitorWebVitals()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers(): void {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming
            this.recordMetric('page-load', nav.loadEventEnd - nav.fetchStart, 'ms')
            this.recordMetric('dom-interactive', nav.domInteractive - nav.fetchStart, 'ms')
            this.recordMetric('dom-complete', nav.domComplete - nav.fetchStart, 'ms')
          }
        }
      })

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navigationObserver)
      } catch {
        console.warn('Navigation observer not supported')
      }

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming
            const duration = resource.responseEnd - resource.startTime
            
            // Track slow resources
            if (duration > 1000) {
              this.recordMetric('slow-resource', duration, 'ms', {
                name: resource.name,
                type: resource.initiatorType,
                size: resource.transferSize
              })
            }
          }
        }
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch {
        console.warn('Resource observer not supported')
      }

      // Long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.recordMetric('long-task', entry.duration, 'ms', {
              startTime: entry.startTime
            })
          }
        }
      })

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch {
        console.warn('Long task observer not supported')
      }
    }
  }

  private monitorWebVitals(): void {
    // First Contentful Paint (FCP)
    this.observePaint('first-contentful-paint', 'fcp')
    
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric('lcp', lastEntry.startTime, 'ms')
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch {
        console.warn('LCP observer not supported')
      }
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as unknown as Record<string, unknown>
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value as number
            this.recordMetric('cls', clsValue, 'count')
          }
        }
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch {
        console.warn('CLS observer not supported')
      }
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const firstInput = entry as unknown as Record<string, unknown>
          const fid = (firstInput.processingStart as number) - entry.startTime
          this.recordMetric('fid', fid, 'ms')
        }
      })

      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch {
        console.warn('FID observer not supported')
      }
    }
  }

  private observePaint(paintType: string, metricName: string): void {
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === paintType) {
            this.recordMetric(metricName, entry.startTime, 'ms')
          }
        }
      })

      try {
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(paintObserver)
      } catch {
        console.warn(`${paintType} observer not supported`)
      }
    }
  }

  recordMetric(
    name: string, 
    value: number, 
    unit: PerformanceMetric['unit'] = 'ms',
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    this.metrics.get(name)!.push(metric)

    // Keep only last 100 metrics per type
    const metrics = this.metrics.get(name)!
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    return fn().finally(() => {
      const duration = performance.now() - start
      this.recordMetric(name, duration, 'ms')
    })
  }

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    try {
      return fn()
    } finally {
      const duration = performance.now() - start
      this.recordMetric(name, duration, 'ms')
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || []
    }

    const allMetrics: PerformanceMetric[] = []
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics)
    }
    return allMetrics
  }

  getAverageMetric(name: string): number | null {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return null

    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  getPercentile(name: string, percentile: number): number | null {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return null

    const sorted = [...metrics].sort((a, b) => a.value - b.value)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index].value
  }

  async sendReport(userId?: string): Promise<void> {
    const report: PerformanceReport = {
      metrics: this.getMetrics(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now()
    }

    try {
      await this.supabase.from('analytics_events').insert({
        event_type: 'performance_report',
        event_data: report,
        user_id: userId,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to send performance report:', error)
    }
  }

  // Memory monitoring
  monitorMemory(): void {
    if ('performance' in window && 'memory' in performance) {
      setInterval(() => {
        const memory = (performance as unknown as Record<string, unknown>).memory as {
          usedJSHeapSize: number
          totalJSHeapSize: number
          jsHeapSizeLimit: number
        }
        this.recordMetric('js-heap-used', memory.usedJSHeapSize, 'bytes')
        this.recordMetric('js-heap-total', memory.totalJSHeapSize, 'bytes')
        this.recordMetric('js-heap-limit', memory.jsHeapSizeLimit, 'bytes')
        
        const heapUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        this.recordMetric('js-heap-usage', heapUsagePercent, 'percent')
      }, 10000) // Every 10 seconds
    }
  }

  // Bundle size tracking
  trackBundleSize(): void {
    if ('PerformanceObserver' in window) {
      const scriptSizes = new Map<string, number>()
      
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming
            if (resource.initiatorType === 'script' || resource.initiatorType === 'link') {
              scriptSizes.set(resource.name, resource.transferSize)
            }
          }
        }
        
        // Calculate total bundle size
        const totalSize = Array.from(scriptSizes.values()).reduce((a, b) => a + b, 0)
        this.recordMetric('bundle-size', totalSize, 'bytes')
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch {
        console.warn('Resource size observer not supported')
      }
    }
  }

  cleanup(): void {
    for (const observer of this.observers) {
      observer.disconnect()
    }
    this.observers = []
    this.metrics.clear()
  }
}