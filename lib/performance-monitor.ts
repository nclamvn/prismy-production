import { logger, performanceLogger } from './logger'

// Performance metrics collection
interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  tags?: Record<string, string>
}

interface SystemMetrics {
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
  requests: {
    total: number
    successful: number
    failed: number
    avgResponseTime: number
  }
  cache: {
    hitRate: number
    memoryUsage: number
    totalKeys: number
  }
  database: {
    connectionCount: number
    avgQueryTime: number
    slowQueries: number
  }
}

interface AlertConfig {
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq'
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // minutes
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private alerts: AlertConfig[] = []
  private lastAlerts = new Map<string, number>()
  private alertCallbacks: Array<(alert: any) => void> = []
  
  constructor() {
    this.initializeDefaultAlerts()
    this.startMetricsCollection()
  }

  // Record a performance metric
  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    }

    this.metrics.push(metric)
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log performance metric
    performanceLogger.debug({
      metric: name,
      value,
      unit,
      tags
    }, 'Performance metric recorded')

    // Check for alerts
    this.checkAlerts(metric)
  }

  // Record API response time
  recordApiResponseTime(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.recordMetric('api_response_time', duration, 'ms', {
      endpoint,
      method,
      status: statusCode.toString()
    })

    if (duration > 1000) {
      performanceLogger.warn({
        endpoint,
        method,
        statusCode,
        duration
      }, 'Slow API response detected')
    }
  }

  // Record database query time
  recordDatabaseQuery(query: string, duration: number, success: boolean): void {
    this.recordMetric('db_query_time', duration, 'ms', {
      query: query.substring(0, 50), // Truncate long queries
      success: success.toString()
    })

    if (duration > 500) {
      performanceLogger.warn({
        query: query.substring(0, 100),
        duration,
        success
      }, 'Slow database query detected')
    }
  }

  // Record cache operation
  recordCacheOperation(operation: string, hit: boolean, duration: number): void {
    this.recordMetric('cache_operation_time', duration, 'ms', {
      operation,
      hit: hit.toString()
    })

    this.recordMetric('cache_hit_rate', hit ? 1 : 0, 'boolean', {
      operation
    })
  }

  // Record memory usage
  recordMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      
      this.recordMetric('memory_heap_used', memUsage.heapUsed, 'bytes')
      this.recordMetric('memory_heap_total', memUsage.heapTotal, 'bytes')
      this.recordMetric('memory_rss', memUsage.rss, 'bytes')
      
      const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100
      this.recordMetric('memory_heap_percentage', heapPercentage, 'percent')
    }
  }

  // Get system metrics overview
  getSystemMetrics(): SystemMetrics {
    const now = Date.now()
    const last5Minutes = now - 5 * 60 * 1000
    
    // Filter recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes)
    
    // Calculate memory metrics
    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory_heap_percentage')
    const avgMemoryUsage = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
      : 0

    // Calculate API response metrics
    const apiMetrics = recentMetrics.filter(m => m.name === 'api_response_time')
    const totalRequests = apiMetrics.length
    const successfulRequests = apiMetrics.filter(m => 
      m.tags?.status && parseInt(m.tags.status) < 400
    ).length
    const avgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0

    // Calculate cache metrics
    const cacheHitMetrics = recentMetrics.filter(m => m.name === 'cache_hit_rate')
    const cacheHitRate = cacheHitMetrics.length > 0
      ? cacheHitMetrics.reduce((sum, m) => sum + m.value, 0) / cacheHitMetrics.length
      : 0

    // Calculate database metrics
    const dbMetrics = recentMetrics.filter(m => m.name === 'db_query_time')
    const avgQueryTime = dbMetrics.length > 0
      ? dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length
      : 0
    const slowQueries = dbMetrics.filter(m => m.value > 500).length

    return {
      memory: {
        used: 0, // Would need OS-level metrics
        total: 0,
        percentage: avgMemoryUsage
      },
      cpu: {
        usage: 0, // Would need OS-level metrics
        cores: 0
      },
      requests: {
        total: totalRequests,
        successful: successfulRequests,
        failed: totalRequests - successfulRequests,
        avgResponseTime
      },
      cache: {
        hitRate: cacheHitRate,
        memoryUsage: avgMemoryUsage,
        totalKeys: 0 // Would get from cache coordinator
      },
      database: {
        connectionCount: 0, // Would get from connection pool
        avgQueryTime,
        slowQueries
      }
    }
  }

  // Get metrics for a specific time range
  getMetrics(
    startTime: number,
    endTime: number,
    metricName?: string
  ): PerformanceMetric[] {
    return this.metrics.filter(metric => {
      const timeMatch = metric.timestamp >= startTime && metric.timestamp <= endTime
      const nameMatch = !metricName || metric.name === metricName
      return timeMatch && nameMatch
    })
  }

  // Get performance trends
  getPerformanceTrends(hours: number = 24): {
    responseTime: { average: number; trend: 'up' | 'down' | 'stable' }
    errorRate: { current: number; trend: 'up' | 'down' | 'stable' }
    cacheHitRate: { current: number; trend: 'up' | 'down' | 'stable' }
    memoryUsage: { current: number; trend: 'up' | 'down' | 'stable' }
  } {
    const now = Date.now()
    const timeRange = hours * 60 * 60 * 1000
    const metrics = this.getMetrics(now - timeRange, now)

    // Split into two halves for trend calculation
    const midpoint = now - timeRange / 2
    const firstHalf = metrics.filter(m => m.timestamp < midpoint)
    const secondHalf = metrics.filter(m => m.timestamp >= midpoint)

    const calculateTrend = (first: number, second: number): 'up' | 'down' | 'stable' => {
      const change = Math.abs(second - first) / first
      if (change < 0.05) return 'stable'
      return second > first ? 'up' : 'down'
    }

    // Response time trend
    const firstHalfResponseTime = this.calculateAverage(
      firstHalf.filter(m => m.name === 'api_response_time')
    )
    const secondHalfResponseTime = this.calculateAverage(
      secondHalf.filter(m => m.name === 'api_response_time')
    )

    // Error rate trend (simplified)
    const firstHalfErrors = firstHalf.filter(m => 
      m.name === 'api_response_time' && m.tags?.status && parseInt(m.tags.status) >= 400
    ).length
    const secondHalfErrors = secondHalf.filter(m => 
      m.name === 'api_response_time' && m.tags?.status && parseInt(m.tags.status) >= 400
    ).length

    // Cache hit rate trend
    const firstHalfCacheHit = this.calculateAverage(
      firstHalf.filter(m => m.name === 'cache_hit_rate')
    )
    const secondHalfCacheHit = this.calculateAverage(
      secondHalf.filter(m => m.name === 'cache_hit_rate')
    )

    // Memory usage trend
    const firstHalfMemory = this.calculateAverage(
      firstHalf.filter(m => m.name === 'memory_heap_percentage')
    )
    const secondHalfMemory = this.calculateAverage(
      secondHalf.filter(m => m.name === 'memory_heap_percentage')
    )

    return {
      responseTime: {
        average: secondHalfResponseTime,
        trend: calculateTrend(firstHalfResponseTime, secondHalfResponseTime)
      },
      errorRate: {
        current: secondHalfErrors,
        trend: calculateTrend(firstHalfErrors, secondHalfErrors)
      },
      cacheHitRate: {
        current: secondHalfCacheHit,
        trend: calculateTrend(firstHalfCacheHit, secondHalfCacheHit)
      },
      memoryUsage: {
        current: secondHalfMemory,
        trend: calculateTrend(firstHalfMemory, secondHalfMemory)
      }
    }
  }

  // Add alert configuration
  addAlert(config: AlertConfig): void {
    this.alerts.push(config)
    logger.info({ alert: config }, 'Performance alert added')
  }

  // Register alert callback
  onAlert(callback: (alert: any) => void): void {
    this.alertCallbacks.push(callback)
  }

  // Check if metric triggers any alerts
  private checkAlerts(metric: PerformanceMetric): void {
    for (const alert of this.alerts) {
      if (metric.name !== alert.metric) continue

      const shouldAlert = this.evaluateAlert(alert, metric.value)
      if (!shouldAlert) continue

      // Check cooldown
      const lastAlert = this.lastAlerts.get(alert.metric)
      const cooldownExpired = !lastAlert || 
        Date.now() - lastAlert > alert.cooldown * 60 * 1000

      if (!cooldownExpired) continue

      // Trigger alert
      const alertData = {
        metric: alert.metric,
        value: metric.value,
        threshold: alert.threshold,
        severity: alert.severity,
        timestamp: metric.timestamp,
        tags: metric.tags
      }

      this.triggerAlert(alertData)
      this.lastAlerts.set(alert.metric, Date.now())
    }
  }

  private evaluateAlert(alert: AlertConfig, value: number): boolean {
    switch (alert.operator) {
      case 'gt': return value > alert.threshold
      case 'lt': return value < alert.threshold
      case 'eq': return value === alert.threshold
      default: return false
    }
  }

  private triggerAlert(alert: any): void {
    logger.warn({ alert }, 'Performance alert triggered')

    // Call all registered callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        logger.error({ error, alert }, 'Alert callback failed')
      }
    })
  }

  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }

  private initializeDefaultAlerts(): void {
    // Response time alerts
    this.addAlert({
      metric: 'api_response_time',
      threshold: 1000,
      operator: 'gt',
      severity: 'medium',
      cooldown: 5
    })

    this.addAlert({
      metric: 'api_response_time',
      threshold: 3000,
      operator: 'gt',
      severity: 'high',
      cooldown: 2
    })

    // Memory usage alerts
    this.addAlert({
      metric: 'memory_heap_percentage',
      threshold: 80,
      operator: 'gt',
      severity: 'medium',
      cooldown: 10
    })

    this.addAlert({
      metric: 'memory_heap_percentage',
      threshold: 95,
      operator: 'gt',
      severity: 'critical',
      cooldown: 1
    })

    // Database query alerts
    this.addAlert({
      metric: 'db_query_time',
      threshold: 1000,
      operator: 'gt',
      severity: 'medium',
      cooldown: 5
    })
  }

  private startMetricsCollection(): void {
    // Collect memory metrics every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage()
    }, 30000)

    // Log metrics summary every 5 minutes
    setInterval(() => {
      const metrics = this.getSystemMetrics()
      performanceLogger.info({
        metrics,
        timestamp: Date.now()
      }, 'System metrics summary')
    }, 5 * 60 * 1000)
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Utility functions for common monitoring patterns
export const withPerformanceTracking = <T extends any[]>(
  name: string,
  fn: (...args: T) => Promise<any>,
  tags?: Record<string, string>
) => {
  return async (...args: T) => {
    const startTime = Date.now()
    let success = true
    
    try {
      const result = await fn(...args)
      return result
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = Date.now() - startTime
      performanceMonitor.recordMetric(name, duration, 'ms', {
        ...tags,
        success: success.toString()
      })
    }
  }
}

export const trackApiPerformance = (
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number
) => {
  performanceMonitor.recordApiResponseTime(endpoint, method, statusCode, duration)
}

export const trackDatabasePerformance = (
  query: string,
  duration: number,
  success: boolean
) => {
  performanceMonitor.recordDatabaseQuery(query, duration, success)
}