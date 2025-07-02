/**
 * Performance Monitoring & Optimization System
 * Real-time performance tracking, bottleneck detection, and optimization
 */

import { logger } from '@/lib/logger'
import { createServiceRoleClient } from '@/lib/supabase'

// Always use service role client for server-side performance monitoring
function getSupabaseClient() {
  return createServiceRoleClient()
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags: Record<string, string>
  dimensions: Record<string, any>
}

export interface PerformanceAlert {
  id: string
  metric: string
  threshold: number
  currentValue: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
}

export interface PerformanceReport {
  timeRange: { start: Date; end: Date }
  metrics: {
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    throughput: number
    errorRate: number
    memoryUsage: number
    cpuUsage: number
  }
  slowQueries: Array<{
    query: string
    duration: number
    frequency: number
  }>
  bottlenecks: Array<{
    component: string
    issue: string
    impact: number
    recommendation: string
  }>
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics = new Map<string, PerformanceMetric[]>()
  private alerts: PerformanceAlert[] = []
  private thresholds = new Map<string, { warning: number; critical: number }>()
  private timers = new Map<string, number>()

  private constructor() {
    this.setupDefaultThresholds()
    this.startPeriodicReporting()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    try {
      const fullMetric: PerformanceMetric = {
        ...metric,
        timestamp: new Date(),
      }

      // Store in memory for immediate analysis
      if (!this.metrics.has(metric.name)) {
        this.metrics.set(metric.name, [])
      }

      const metricArray = this.metrics.get(metric.name)!
      metricArray.push(fullMetric)

      // Keep only last 1000 metrics per type
      if (metricArray.length > 1000) {
        metricArray.shift()
      }

      // Check for threshold violations
      this.checkThresholds(fullMetric)

      // Store in database for long-term analysis
      this.persistMetric(fullMetric)
    } catch (error) {
      logger.error('Failed to record performance metric', { error, metric })
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(operationId: string): void {
    this.timers.set(operationId, performance.now())
  }

  /**
   * End timing and record metric
   */
  endTimer(
    operationId: string,
    metricName: string,
    tags: Record<string, string> = {},
    dimensions: Record<string, any> = {}
  ): number {
    const startTime = this.timers.get(operationId)
    if (!startTime) {
      logger.warn('Timer not found for operation', { operationId })
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(operationId)

    this.recordMetric({
      name: metricName,
      value: duration,
      unit: 'milliseconds',
      tags,
      dimensions,
    })

    return duration
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    fn: () => Promise<T>,
    metricName: string,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const operationId = `${metricName}_${Date.now()}_${Math.random()}`
    this.startTimer(operationId)

    try {
      const result = await fn()
      this.endTimer(operationId, metricName, { ...tags, status: 'success' })
      return result
    } catch (error) {
      this.endTimer(operationId, metricName, { ...tags, status: 'error' })
      throw error
    }
  }

  /**
   * Measure synchronous function execution time
   */
  measure<T>(
    fn: () => T,
    metricName: string,
    tags: Record<string, string> = {}
  ): T {
    const operationId = `${metricName}_${Date.now()}_${Math.random()}`
    this.startTimer(operationId)

    try {
      const result = fn()
      this.endTimer(operationId, metricName, { ...tags, status: 'success' })
      return result
    } catch (error) {
      this.endTimer(operationId, metricName, { ...tags, status: 'error' })
      throw error
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(
    componentName: string,
    tags: Record<string, string> = {}
  ): void {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memory = process.memoryUsage()

        this.recordMetric({
          name: 'memory_usage',
          value: memory.heapUsed / 1024 / 1024, // MB
          unit: 'megabytes',
          tags: { component: componentName, type: 'heap_used', ...tags },
          dimensions: { total: memory.heapTotal, external: memory.external },
        })

        this.recordMetric({
          name: 'memory_usage',
          value: memory.rss / 1024 / 1024, // MB
          unit: 'megabytes',
          tags: { component: componentName, type: 'rss', ...tags },
          dimensions: { total: memory.heapTotal, external: memory.external },
        })
      }
    } catch (error) {
      logger.error('Failed to record memory usage', { error, componentName })
    }
  }

  /**
   * Record database query performance
   */
  async measureDatabaseQuery<T>(
    queryName: string,
    query: () => Promise<T>,
    queryText?: string
  ): Promise<T> {
    const operationId = `db_query_${Date.now()}_${Math.random()}`
    this.startTimer(operationId)

    try {
      const result = await query()
      const duration = this.endTimer(
        operationId,
        'database_query_time',
        {
          query_name: queryName,
          status: 'success',
        },
        { query_text: queryText }
      )

      // Log slow queries
      if (duration > 1000) {
        // > 1 second
        logger.warn('Slow database query detected', {
          queryName,
          duration,
          queryText: queryText?.substring(0, 200),
        })
      }

      return result
    } catch (error) {
      this.endTimer(
        operationId,
        'database_query_time',
        {
          query_name: queryName,
          status: 'error',
        },
        { query_text: queryText, error: error.message }
      )

      throw error
    }
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(timeRange: {
    start: Date
    end: Date
  }): Promise<PerformanceReport> {
    try {
      // Get metrics from database
      const { data: dbMetrics, error } = await getSupabaseClient()
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', timeRange.start.toISOString())
        .lte('recorded_at', timeRange.end.toISOString())

      if (error) throw error

      // Calculate summary metrics
      const responseTimeMetrics =
        dbMetrics?.filter(m => m.metric_name === 'api_response_time') || []
      const responseTimes = responseTimeMetrics
        .map(m => m.metric_value)
        .sort((a, b) => a - b)

      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, val) => sum + val, 0) /
            responseTimes.length
          : 0

      const p95ResponseTime =
        responseTimes.length > 0
          ? responseTimes[Math.floor(responseTimes.length * 0.95)]
          : 0

      const p99ResponseTime =
        responseTimes.length > 0
          ? responseTimes[Math.floor(responseTimes.length * 0.99)]
          : 0

      // Calculate throughput (requests per minute)
      const timeRangeMinutes =
        (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60)
      const throughput = responseTimeMetrics.length / timeRangeMinutes

      // Calculate error rate
      const errorMetrics =
        dbMetrics?.filter(
          m =>
            m.metric_name === 'api_response_time' &&
            m.dimensions?.status === 'error'
        ) || []
      const errorRate =
        responseTimeMetrics.length > 0
          ? (errorMetrics.length / responseTimeMetrics.length) * 100
          : 0

      // Get memory and CPU metrics
      const memoryMetrics =
        dbMetrics?.filter(m => m.metric_name === 'memory_usage') || []
      const memoryUsage =
        memoryMetrics.length > 0
          ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
            memoryMetrics.length
          : 0

      const cpuMetrics =
        dbMetrics?.filter(m => m.metric_name === 'cpu_usage') || []
      const cpuUsage =
        cpuMetrics.length > 0
          ? cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
            cpuMetrics.length
          : 0

      // Identify slow queries
      const queryMetrics =
        dbMetrics?.filter(m => m.metric_name === 'database_query_time') || []
      const slowQueries = this.identifySlowQueries(queryMetrics)

      // Identify bottlenecks
      const bottlenecks = this.identifyBottlenecks(dbMetrics || [])

      return {
        timeRange,
        metrics: {
          averageResponseTime,
          p95ResponseTime,
          p99ResponseTime,
          throughput,
          errorRate,
          memoryUsage,
          cpuUsage,
        },
        slowQueries,
        bottlenecks,
      }
    } catch (error) {
      logger.error('Failed to generate performance report', {
        error,
        timeRange,
      })
      throw error
    }
  }

  /**
   * Get current performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  /**
   * Clear resolved alerts
   */
  clearAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId)
  }

  /**
   * Set performance threshold
   */
  setThreshold(metricName: string, warning: number, critical: number): void {
    this.thresholds.set(metricName, { warning, critical })
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    metricsCollected: number
    activeAlerts: number
    memoryUsage: number
    uptimeSeconds: number
  } {
    const totalMetrics = Array.from(this.metrics.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    )

    return {
      metricsCollected: totalMetrics,
      activeAlerts: this.alerts.length,
      memoryUsage: process.memoryUsage?.()?.heapUsed || 0,
      uptimeSeconds: process.uptime?.() || 0,
    }
  }

  /**
   * Setup default performance thresholds
   */
  private setupDefaultThresholds(): void {
    this.thresholds.set('api_response_time', { warning: 1000, critical: 5000 })
    this.thresholds.set('database_query_time', { warning: 500, critical: 2000 })
    this.thresholds.set('memory_usage', { warning: 512, critical: 1024 }) // MB
    this.thresholds.set('cpu_usage', { warning: 70, critical: 90 }) // Percentage
    this.thresholds.set('error_rate', { warning: 5, critical: 10 }) // Percentage
  }

  /**
   * Check metric against thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name)
    if (!threshold) return

    let severity: PerformanceAlert['severity'] | null = null

    if (metric.value >= threshold.critical) {
      severity = 'critical'
    } else if (metric.value >= threshold.warning) {
      severity = 'medium'
    }

    if (severity) {
      const alert: PerformanceAlert = {
        id: `${metric.name}_${Date.now()}`,
        metric: metric.name,
        threshold:
          severity === 'critical' ? threshold.critical : threshold.warning,
        currentValue: metric.value,
        severity,
        message: `${metric.name} exceeded ${severity} threshold: ${metric.value}${metric.unit}`,
        timestamp: new Date(),
      }

      this.alerts.push(alert)

      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts.shift()
      }

      logger.warn('Performance threshold exceeded', {
        metric: metric.name,
        value: metric.value,
        threshold: alert.threshold,
        severity,
      })
    }
  }

  /**
   * Persist metric to database
   */
  private async persistMetric(metric: PerformanceMetric): Promise<void> {
    try {
      await getSupabaseClient().rpc('record_performance_metric', {
        p_metric_name: metric.name,
        p_metric_value: metric.value,
        p_metric_unit: metric.unit,
        p_dimensions: metric.dimensions,
        p_service_name: 'prismy-api',
        p_endpoint: metric.tags.endpoint || null,
      })
    } catch (error) {
      logger.error('Failed to persist performance metric', { error, metric })
    }
  }

  /**
   * Identify slow queries from metrics
   */
  private identifySlowQueries(queryMetrics: any[]): Array<{
    query: string
    duration: number
    frequency: number
  }> {
    const queryStats = new Map<
      string,
      { totalDuration: number; count: number; maxDuration: number }
    >()

    queryMetrics.forEach(metric => {
      const queryName = metric.dimensions?.query_name || 'unknown'
      const duration = metric.metric_value

      if (!queryStats.has(queryName)) {
        queryStats.set(queryName, {
          totalDuration: 0,
          count: 0,
          maxDuration: 0,
        })
      }

      const stats = queryStats.get(queryName)!
      stats.totalDuration += duration
      stats.count++
      stats.maxDuration = Math.max(stats.maxDuration, duration)
    })

    return Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        duration: stats.maxDuration,
        frequency: stats.count,
      }))
      .filter(query => query.duration > 1000) // Only slow queries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10) // Top 10
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(metrics: any[]): Array<{
    component: string
    issue: string
    impact: number
    recommendation: string
  }> {
    const bottlenecks: Array<{
      component: string
      issue: string
      impact: number
      recommendation: string
    }> = []

    // Check for high response times
    const responseTimeMetrics = metrics.filter(
      m => m.metric_name === 'api_response_time'
    )
    const avgResponseTime =
      responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          responseTimeMetrics.length
        : 0

    if (avgResponseTime > 1000) {
      bottlenecks.push({
        component: 'API',
        issue: 'High average response time',
        impact: Math.min(avgResponseTime / 100, 10), // Scale impact 1-10
        recommendation:
          'Optimize database queries, add caching, or scale infrastructure',
      })
    }

    // Check for memory issues
    const memoryMetrics = metrics.filter(m => m.metric_name === 'memory_usage')
    const avgMemoryUsage =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          memoryMetrics.length
        : 0

    if (avgMemoryUsage > 512) {
      // > 512MB
      bottlenecks.push({
        component: 'Memory',
        issue: 'High memory usage',
        impact: Math.min(avgMemoryUsage / 100, 10),
        recommendation:
          'Review memory leaks, optimize data structures, or increase memory allocation',
      })
    }

    // Check for database performance
    const dbMetrics = metrics.filter(
      m => m.metric_name === 'database_query_time'
    )
    const avgDbTime =
      dbMetrics.length > 0
        ? dbMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          dbMetrics.length
        : 0

    if (avgDbTime > 500) {
      bottlenecks.push({
        component: 'Database',
        issue: 'Slow query performance',
        impact: Math.min(avgDbTime / 50, 10),
        recommendation:
          'Add database indexes, optimize queries, or consider read replicas',
      })
    }

    return bottlenecks.sort((a, b) => b.impact - a.impact)
  }

  /**
   * Start periodic performance reporting
   */
  private startPeriodicReporting(): void {
    // Report memory usage every 5 minutes
    setInterval(
      () => {
        this.recordMemoryUsage('system')
      },
      5 * 60 * 1000
    )

    // Clean up old metrics every hour
    setInterval(
      () => {
        this.cleanupOldMetrics()
      },
      60 * 60 * 1000
    )
  }

  /**
   * Clean up old metrics from memory
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    for (const [metricName, metricArray] of this.metrics.entries()) {
      const filteredMetrics = metricArray.filter(m => m.timestamp > oneHourAgo)
      this.metrics.set(metricName, filteredMetrics)
    }

    // Clean up old alerts
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo)

    logger.debug('Cleaned up old performance metrics and alerts')
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Performance decorators
export function Monitored(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const metric = metricName || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsync(
        () => originalMethod.apply(this, args),
        metric,
        { class: target.constructor.name, method: propertyKey }
      )
    }

    return descriptor
  }
}
