/**
 * PERFORMANCE MONITORING SYSTEM
 * Real-time performance tracking and optimization
 */

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'score'
  category: 'web-vitals' | 'api' | 'database' | 'cache' | 'bundle' | 'network'
  severity: 'info' | 'warning' | 'error' | 'critical'
  timestamp: Date
  metadata: Record<string, any>
  threshold?: {
    warning: number
    error: number
    critical: number
  }
}

export interface WebVitalsMetrics {
  // Core Web Vitals
  LCP: number // Largest Contentful Paint
  FID: number // First Input Delay
  CLS: number // Cumulative Layout Shift
  
  // Other important metrics
  FCP: number // First Contentful Paint
  TTFB: number // Time to First Byte
  FMP: number // First Meaningful Paint
  TTI: number // Time to Interactive
  
  // Custom metrics
  bundleSize: number
  initialLoadTime: number
  routeChangeTime: number
}

export interface APIPerformanceMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  error?: string
  timestamp: Date
  userAgent?: string
  ip?: string
}

export interface SystemMetrics {
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    load: number[]
  }
  network: {
    bytesIn: number
    bytesOut: number
    connections: number
  }
  storage: {
    used: number
    total: number
    percentage: number
  }
}

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>()
  private webVitals: Partial<WebVitalsMetrics> = {}
  private apiMetrics: APIPerformanceMetrics[] = []
  private alerts = new Set<(metric: PerformanceMetric) => void>()
  private isMonitoring = false

  private readonly thresholds = {
    LCP: { warning: 2500, error: 4000, critical: 6000 },
    FID: { warning: 100, error: 300, critical: 500 },
    CLS: { warning: 0.1, error: 0.25, critical: 0.5 },
    FCP: { warning: 1800, error: 3000, critical: 5000 },
    TTFB: { warning: 200, error: 600, critical: 1000 },
    apiResponseTime: { warning: 500, error: 1000, critical: 2000 },
    memoryUsage: { warning: 70, error: 85, critical: 95 },
    errorRate: { warning: 1, error: 5, critical: 10 }
  }

  constructor() {
    this.startMonitoring()
  }

  // Start monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return
    this.isMonitoring = true

    // Monitor Web Vitals (client-side only)
    if (typeof window !== 'undefined') {
      this.initWebVitalsMonitoring()
    }

    // Monitor system metrics (server-side)
    if (typeof process !== 'undefined') {
      this.initSystemMonitoring()
    }

    // Periodic cleanup
    setInterval(() => {
      this.cleanup()
    }, 60000) // Every minute
  }

  // Web Vitals monitoring
  private initWebVitalsMonitoring(): void {
    // LCP - Largest Contentful Paint
    this.observeWebVital('largest-contentful-paint', (entry: any) => {
      this.recordMetric({
        name: 'LCP',
        value: entry.renderTime || entry.loadTime,
        unit: 'ms',
        category: 'web-vitals',
        metadata: {
          element: entry.element?.tagName,
          url: entry.url
        },
        threshold: this.thresholds.LCP
      })
    })

    // FID - First Input Delay
    this.observeWebVital('first-input', (entry: any) => {
      this.recordMetric({
        name: 'FID',
        value: entry.processingStart - entry.startTime,
        unit: 'ms',
        category: 'web-vitals',
        metadata: {
          eventType: entry.name
        },
        threshold: this.thresholds.FID
      })
    })

    // CLS - Cumulative Layout Shift
    this.observeWebVital('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        this.recordMetric({
          name: 'CLS',
          value: entry.value,
          unit: 'score',
          category: 'web-vitals',
          metadata: {
            sources: entry.sources?.map((source: any) => ({
              element: source.node?.tagName,
              previousRect: source.previousRect,
              currentRect: source.currentRect
            }))
          },
          threshold: this.thresholds.CLS
        })
      }
    })

    // FCP - First Contentful Paint
    this.observeWebVital('paint', (entry: any) => {
      if (entry.name === 'first-contentful-paint') {
        this.recordMetric({
          name: 'FCP',
          value: entry.startTime,
          unit: 'ms',
          category: 'web-vitals',
          threshold: this.thresholds.FCP
        })
      }
    })

    // Navigation timing
    if ('navigation' in performance) {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      this.recordMetric({
        name: 'TTFB',
        value: navTiming.responseStart - navTiming.requestStart,
        unit: 'ms',
        category: 'web-vitals',
        threshold: this.thresholds.TTFB
      })

      this.recordMetric({
        name: 'DOMContentLoaded',
        value: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
        unit: 'ms',
        category: 'web-vitals'
      })

      this.recordMetric({
        name: 'LoadComplete',
        value: navTiming.loadEventEnd - navTiming.loadEventStart,
        unit: 'ms',
        category: 'web-vitals'
      })
    }

    // Bundle size monitoring
    this.monitorBundleSize()
  }

  private observeWebVital(entryType: string, callback: (entry: any) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            callback(entry)
          }
        })
        observer.observe({ entryTypes: [entryType] })
      } catch (error) {
        console.warn(`Failed to observe ${entryType}:`, error)
      }
    }
  }

  private monitorBundleSize(): void {
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection
      this.recordMetric({
        name: 'NetworkSpeed',
        value: connection.downlink || 0,
        unit: 'mbps',
        category: 'network',
        metadata: {
          effectiveType: connection.effectiveType,
          rtt: connection.rtt
        }
      })
    }

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming
          
          if (resource.name.includes('.js') || resource.name.includes('.css')) {
            this.recordMetric({
              name: 'ResourceLoadTime',
              value: resource.responseEnd - resource.requestStart,
              unit: 'ms',
              category: 'bundle',
              metadata: {
                url: resource.name,
                size: resource.transferSize,
                type: resource.name.includes('.js') ? 'javascript' : 'css'
              }
            })
          }
        }
      })
      observer.observe({ entryTypes: ['resource'] })
    }
  }

  // System monitoring (server-side)
  private initSystemMonitoring(): void {
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000) // Every 30 seconds
  }

  private collectSystemMetrics(): void {
    if (typeof process !== 'undefined') {
      // Memory usage
      const memUsage = process.memoryUsage()
      const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100

      this.recordMetric({
        name: 'MemoryUsage',
        value: memPercentage,
        unit: 'percentage',
        category: 'system',
        metadata: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        },
        threshold: this.thresholds.memoryUsage
      })

      // CPU usage (basic)
      this.recordMetric({
        name: 'ProcessUptime',
        value: process.uptime(),
        unit: 'seconds',
        category: 'system'
      })
    }
  }

  // API monitoring
  async trackAPICall(
    endpoint: string,
    method: string,
    startTime: number,
    statusCode: number,
    error?: string
  ): Promise<void> {
    const responseTime = Date.now() - startTime
    
    const apiMetric: APIPerformanceMetrics = {
      endpoint,
      method,
      responseTime,
      statusCode,
      error,
      timestamp: new Date()
    }

    this.apiMetrics.push(apiMetric)

    // Record as performance metric
    this.recordMetric({
      name: 'APIResponseTime',
      value: responseTime,
      unit: 'ms',
      category: 'api',
      metadata: {
        endpoint,
        method,
        statusCode,
        error
      },
      threshold: this.thresholds.apiResponseTime
    })

    // Track error rate
    const recentAPICalls = this.apiMetrics.filter(
      m => Date.now() - m.timestamp.getTime() < 60000 // Last minute
    )
    const errorCount = recentAPICalls.filter(m => m.statusCode >= 400).length
    const errorRate = (errorCount / recentAPICalls.length) * 100

    this.recordMetric({
      name: 'APIErrorRate',
      value: errorRate,
      unit: 'percentage',
      category: 'api',
      threshold: this.thresholds.errorRate
    })
  }

  // Database monitoring
  async trackDatabaseQuery(
    query: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    this.recordMetric({
      name: 'DatabaseQueryTime',
      value: duration,
      unit: 'ms',
      category: 'database',
      metadata: {
        query: query.substring(0, 100), // Truncate for privacy
        success,
        ...metadata
      }
    })
  }

  // Cache monitoring
  async trackCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key: string,
    duration: number
  ): Promise<void> {
    this.recordMetric({
      name: 'CacheOperation',
      value: duration,
      unit: 'ms',
      category: 'cache',
      metadata: {
        operation,
        key: key.substring(0, 50) // Truncate for privacy
      }
    })
  }

  // Custom metric recording
  recordMetric(metricData: Omit<PerformanceMetric, 'id' | 'timestamp' | 'severity'>): void {
    const metric: PerformanceMetric = {
      ...metricData,
      id: this.generateMetricId(),
      timestamp: new Date(),
      severity: this.calculateSeverity(metricData.value, metricData.threshold)
    }

    this.metrics.set(metric.id, metric)

    // Update web vitals if applicable
    if (metric.category === 'web-vitals') {
      (this.webVitals as any)[metric.name] = metric.value
    }

    // Check for alerts
    if (metric.severity !== 'info') {
      this.triggerAlert(metric)
    }
  }

  // Alert system
  onAlert(callback: (metric: PerformanceMetric) => void): () => void {
    this.alerts.add(callback)
    return () => this.alerts.delete(callback)
  }

  private triggerAlert(metric: PerformanceMetric): void {
    for (const callback of this.alerts) {
      try {
        callback(metric)
      } catch (error) {
        console.error('Performance alert callback error:', error)
      }
    }
  }

  // Data retrieval
  getMetrics(category?: PerformanceMetric['category'], limit = 100): PerformanceMetric[] {
    let metrics = Array.from(this.metrics.values())
    
    if (category) {
      metrics = metrics.filter(m => m.category === category)
    }

    return metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  getWebVitals(): Partial<WebVitalsMetrics> {
    return { ...this.webVitals }
  }

  getAPIMetrics(limit = 100): APIPerformanceMetrics[] {
    return this.apiMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  getAggregatedMetrics(timeRange: 'hour' | 'day' | 'week' = 'hour'): Record<string, {
    avg: number
    min: number
    max: number
    count: number
  }> {
    const now = Date.now()
    const ranges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    }

    const cutoff = now - ranges[timeRange]
    const recentMetrics = Array.from(this.metrics.values())
      .filter(m => m.timestamp.getTime() > cutoff)

    const aggregated: Record<string, { values: number[] }> = {}

    for (const metric of recentMetrics) {
      if (!aggregated[metric.name]) {
        aggregated[metric.name] = { values: [] }
      }
      aggregated[metric.name].values.push(metric.value)
    }

    const result: Record<string, any> = {}
    for (const [name, data] of Object.entries(aggregated)) {
      const values = data.values
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      }
    }

    return result
  }

  // Utility methods
  private calculateSeverity(
    value: number,
    threshold?: PerformanceMetric['threshold']
  ): PerformanceMetric['severity'] {
    if (!threshold) return 'info'

    if (value >= threshold.critical) return 'critical'
    if (value >= threshold.error) return 'error'
    if (value >= threshold.warning) return 'warning'
    return 'info'
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  private cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    
    // Remove old metrics
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoff) {
        this.metrics.delete(id)
      }
    }

    // Remove old API metrics
    this.apiMetrics = this.apiMetrics.filter(metric => metric.timestamp >= cutoff)
  }

  // Health check
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    metrics: Record<string, any>
  } {
    const recentMetrics = this.getMetrics(undefined, 50)
    const criticalMetrics = recentMetrics.filter(m => m.severity === 'critical')
    const errorMetrics = recentMetrics.filter(m => m.severity === 'error')
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    const issues: string[] = []

    if (criticalMetrics.length > 0) {
      status = 'critical'
      issues.push(`${criticalMetrics.length} critical performance issues detected`)
    } else if (errorMetrics.length > 0) {
      status = 'warning'
      issues.push(`${errorMetrics.length} performance warnings detected`)
    }

    return {
      status,
      issues,
      metrics: {
        webVitals: this.webVitals,
        totalMetrics: this.metrics.size,
        apiCalls: this.apiMetrics.length
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()