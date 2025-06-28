/**
 * PRISMY PRODUCTION MONITORING SYSTEM
 * Comprehensive monitoring for production deployment
 * Integrates with health checks, performance monitoring, and alerting
 */

import { logger } from '@/lib/logger'

export interface MonitoringConfig {
  healthCheckInterval: number
  performanceThresholds: {
    responseTime: number
    errorRate: number
    memoryUsage: number
    cpuUsage: number
  }
  alerting: {
    enabled: boolean
    channels: ('slack' | 'email' | 'webhook')[]
    thresholds: {
      critical: number
      warning: number
    }
  }
  metrics: {
    retention: number
    aggregationInterval: number
  }
}

export interface SystemMetrics {
  timestamp: string
  health: {
    overall: 'healthy' | 'unhealthy' | 'degraded'
    services: Record<string, 'healthy' | 'unhealthy' | 'degraded'>
  }
  performance: {
    responseTime: number
    errorRate: number
    throughput: number
    memoryUsage: number
    cpuUsage?: number
  }
  usage: {
    activeUsers: number
    requestsPerMinute: number
    translationsPerHour: number
    errorCount: number
  }
  resources: {
    database: {
      connections: number
      queryTime: number
      errors: number
    }
    cache: {
      hitRate: number
      missRate: number
      evictions: number
    }
    storage: {
      usage: number
      bandwidth: number
    }
  }
}

export interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  source: string
  resolved: boolean
  resolvedAt?: string
  metadata: Record<string, any>
}

class ProductionMonitor {
  private config: MonitoringConfig
  private metrics: SystemMetrics[] = []
  private alerts: Alert[] = []
  private healthCheckTimer?: NodeJS.Timeout
  private metricsTimer?: NodeJS.Timeout
  private isMonitoring = false

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      performanceThresholds: {
        responseTime: 2000, // 2 seconds
        errorRate: 0.05, // 5%
        memoryUsage: 0.8, // 80%
        cpuUsage: 0.8 // 80%
      },
      alerting: {
        enabled: process.env.NODE_ENV === 'production',
        channels: ['slack', 'webhook'],
        thresholds: {
          critical: 0.1, // 10% failure rate
          warning: 0.05 // 5% failure rate
        }
      },
      metrics: {
        retention: 24 * 60 * 60 * 1000, // 24 hours
        aggregationInterval: 60000 // 1 minute
      },
      ...config
    }
  }

  // Start monitoring system
  async start(): Promise<void> {
    if (this.isMonitoring) return

    logger.info('Starting production monitoring system', {
      config: this.config
    })

    this.isMonitoring = true

    // Start health checks
    this.healthCheckTimer = setInterval(
      () => this.performHealthCheck(),
      this.config.healthCheckInterval
    )

    // Start metrics collection
    this.metricsTimer = setInterval(
      () => this.collectMetrics(),
      this.config.metrics.aggregationInterval
    )

    // Perform initial checks
    await this.performHealthCheck()
    await this.collectMetrics()
  }

  // Stop monitoring system
  stop(): void {
    if (!this.isMonitoring) return

    logger.info('Stopping production monitoring system')

    this.isMonitoring = false

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = undefined
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = undefined
    }
  }

  // Perform comprehensive health check
  private async performHealthCheck(): Promise<void> {
    try {
      const healthResponse = await fetch('/api/health')
      const healthData = await healthResponse.json()

      // Check if any services are unhealthy
      const unhealthyServices = Object.entries(healthData.checks || {})
        .filter(([_, check]: [string, any]) => check.status === 'unhealthy')
        .map(([service]) => service)

      if (unhealthyServices.length > 0) {
        await this.createAlert({
          severity: 'critical',
          title: 'Service Health Check Failed',
          message: `The following services are unhealthy: ${unhealthyServices.join(', ')}`,
          source: 'health-check',
          metadata: {
            unhealthyServices,
            healthData
          }
        })
      }

      // Check response time
      if (healthData.performance?.responseTime > this.config.performanceThresholds.responseTime) {
        await this.createAlert({
          severity: 'warning',
          title: 'High Response Time',
          message: `Health check response time is ${healthData.performance.responseTime}ms (threshold: ${this.config.performanceThresholds.responseTime}ms)`,
          source: 'performance',
          metadata: {
            responseTime: healthData.performance.responseTime,
            threshold: this.config.performanceThresholds.responseTime
          }
        })
      }

    } catch (error) {
      await this.createAlert({
        severity: 'critical',
        title: 'Health Check Failed',
        message: `Unable to perform health check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: 'health-check',
        metadata: { error }
      })
    }
  }

  // Collect system metrics
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherSystemMetrics()
      this.metrics.push(metrics)

      // Clean up old metrics
      const cutoff = Date.now() - this.config.metrics.retention
      this.metrics = this.metrics.filter(
        metric => new Date(metric.timestamp).getTime() > cutoff
      )

      // Analyze metrics for anomalies
      await this.analyzeMetrics(metrics)

    } catch (error) {
      logger.error('Failed to collect metrics', { error })
    }
  }

  // Gather comprehensive system metrics
  private async gatherSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date().toISOString()

    // Get health status
    let healthData: any = {}
    try {
      const healthResponse = await fetch('/api/health')
      healthData = await healthResponse.json()
    } catch (error) {
      logger.warn('Failed to fetch health data for metrics', { error })
    }

    // Get performance data from browser
    let performanceData = {
      responseTime: 0,
      errorRate: 0,
      throughput: 0,
      memoryUsage: 0
    }

    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        performanceData.responseTime = navigation.loadEventEnd - navigation.navigationStart
      }

      // Memory usage (if available)
      const memory = (performance as any).memory
      if (memory) {
        performanceData.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      }
    }

    // Calculate error rate from recent metrics
    const recentMetrics = this.metrics.slice(-10)
    const errorCount = recentMetrics.filter(m => m.health.overall === 'unhealthy').length
    performanceData.errorRate = recentMetrics.length > 0 ? errorCount / recentMetrics.length : 0

    return {
      timestamp,
      health: {
        overall: healthData.status || 'unknown',
        services: healthData.checks ? Object.fromEntries(
          Object.entries(healthData.checks).map(([service, check]: [string, any]) => [
            service,
            check.status
          ])
        ) : {}
      },
      performance: performanceData,
      usage: {
        activeUsers: 0, // Would be tracked via analytics
        requestsPerMinute: 0, // Would be tracked via middleware
        translationsPerHour: 0, // Would be tracked via translation service
        errorCount: 0 // Would be tracked via error monitoring
      },
      resources: {
        database: {
          connections: 0, // Would be tracked via database monitoring
          queryTime: healthData.checks?.database?.responseTime || 0,
          errors: 0
        },
        cache: {
          hitRate: 0, // Would be tracked via cache monitoring
          missRate: 0,
          evictions: 0
        },
        storage: {
          usage: 0, // Would be tracked via storage monitoring
          bandwidth: 0
        }
      }
    }
  }

  // Analyze metrics for anomalies and performance issues
  private async analyzeMetrics(current: SystemMetrics): Promise<void> {
    // Check performance thresholds
    if (current.performance.responseTime > this.config.performanceThresholds.responseTime) {
      await this.createAlert({
        severity: 'warning',
        title: 'High Response Time',
        message: `Response time is ${current.performance.responseTime}ms (threshold: ${this.config.performanceThresholds.responseTime}ms)`,
        source: 'performance-analysis',
        metadata: { metrics: current }
      })
    }

    if (current.performance.errorRate > this.config.performanceThresholds.errorRate) {
      await this.createAlert({
        severity: current.performance.errorRate > this.config.alerting.thresholds.critical ? 'critical' : 'warning',
        title: 'High Error Rate',
        message: `Error rate is ${(current.performance.errorRate * 100).toFixed(1)}% (threshold: ${(this.config.performanceThresholds.errorRate * 100).toFixed(1)}%)`,
        source: 'performance-analysis',
        metadata: { metrics: current }
      })
    }

    if (current.performance.memoryUsage > this.config.performanceThresholds.memoryUsage) {
      await this.createAlert({
        severity: 'warning',
        title: 'High Memory Usage',
        message: `Memory usage is ${(current.performance.memoryUsage * 100).toFixed(1)}% (threshold: ${(this.config.performanceThresholds.memoryUsage * 100).toFixed(1)}%)`,
        source: 'performance-analysis',
        metadata: { metrics: current }
      })
    }

    // Trend analysis
    if (this.metrics.length >= 5) {
      const recent = this.metrics.slice(-5)
      const avgResponseTime = recent.reduce((sum, m) => sum + m.performance.responseTime, 0) / recent.length
      
      if (avgResponseTime > current.performance.responseTime * 1.5) {
        await this.createAlert({
          severity: 'info',
          title: 'Performance Degradation Trend',
          message: `Response time has been trending upward over the last 5 minutes`,
          source: 'trend-analysis',
          metadata: { 
            currentResponseTime: current.performance.responseTime,
            averageResponseTime: avgResponseTime,
            recentMetrics: recent
          }
        })
      }
    }
  }

  // Create and handle alerts
  private async createAlert(alertData: {
    severity: 'critical' | 'warning' | 'info'
    title: string
    message: string
    source: string
    metadata: Record<string, any>
  }): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      timestamp: new Date().toISOString(),
      resolved: false
    }

    this.alerts.push(alert)

    // Log the alert
    const logLevel = alert.severity === 'critical' ? 'error' : 
                    alert.severity === 'warning' ? 'warn' : 'info'
    
    logger[logLevel](`Alert: ${alert.title}`, {
      alert,
      alertMetadata: alert.metadata
    })

    // Send alert notifications
    if (this.config.alerting.enabled) {
      await this.sendAlertNotifications(alert)
    }

    // Auto-resolve info alerts after 5 minutes
    if (alert.severity === 'info') {
      setTimeout(() => this.resolveAlert(alert.id), 5 * 60 * 1000)
    }
  }

  // Send alert notifications
  private async sendAlertNotifications(alert: Alert): Promise<void> {
    for (const channel of this.config.alerting.channels) {
      try {
        switch (channel) {
          case 'slack':
            await this.sendSlackAlert(alert)
            break
          case 'email':
            await this.sendEmailAlert(alert)
            break
          case 'webhook':
            await this.sendWebhookAlert(alert)
            break
        }
      } catch (error) {
        logger.error(`Failed to send ${channel} alert`, { error, alert })
      }
    }
  }

  // Send Slack alert
  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return

    const color = alert.severity === 'critical' ? 'danger' :
                 alert.severity === 'warning' ? 'warning' : 'good'

    const payload = {
      text: `🚨 Prismy Alert: ${alert.title}`,
      attachments: [{
        color,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Source',
            value: alert.source,
            short: true
          },
          {
            title: 'Message',
            value: alert.message,
            short: false
          },
          {
            title: 'Timestamp',
            value: alert.timestamp,
            short: true
          }
        ]
      }]
    }

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  // Send email alert (placeholder)
  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Would integrate with email service like SendGrid, Mailgun, etc.
    logger.info('Email alert would be sent', { alert })
  }

  // Send webhook alert
  private async sendWebhookAlert(alert: Alert): Promise<void> {
    if (!process.env.ALERT_WEBHOOK_URL) return

    await fetch(process.env.ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'alert',
        alert,
        timestamp: new Date().toISOString()
      })
    })
  }

  // Resolve an alert
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date().toISOString()
      
      logger.info('Alert resolved', { alertId, alert })
    }
  }

  // Get current system status
  getSystemStatus(): {
    status: 'healthy' | 'unhealthy' | 'degraded'
    activeAlerts: number
    criticalAlerts: number
    lastMetrics?: SystemMetrics
    uptime: number
  } {
    const activeAlerts = this.alerts.filter(a => !a.resolved)
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
    const lastMetrics = this.metrics[this.metrics.length - 1]

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (criticalAlerts.length > 0) {
      status = 'unhealthy'
    } else if (activeAlerts.length > 0) {
      status = 'degraded'
    }

    return {
      status,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      lastMetrics,
      uptime: process.uptime()
    }
  }

  // Get metrics for a time range
  getMetrics(startTime?: string, endTime?: string): SystemMetrics[] {
    let filtered = this.metrics

    if (startTime) {
      const start = new Date(startTime).getTime()
      filtered = filtered.filter(m => new Date(m.timestamp).getTime() >= start)
    }

    if (endTime) {
      const end = new Date(endTime).getTime()
      filtered = filtered.filter(m => new Date(m.timestamp).getTime() <= end)
    }

    return filtered
  }

  // Get alerts
  getAlerts(resolved?: boolean): Alert[] {
    if (resolved !== undefined) {
      return this.alerts.filter(a => a.resolved === resolved)
    }
    return this.alerts
  }

  // Export monitoring data
  exportData(): {
    config: MonitoringConfig
    metrics: SystemMetrics[]
    alerts: Alert[]
    status: ReturnType<typeof this.getSystemStatus>
  } {
    return {
      config: this.config,
      metrics: this.metrics,
      alerts: this.alerts,
      status: this.getSystemStatus()
    }
  }
}

// Create singleton instance
export const productionMonitor = new ProductionMonitor()

// Auto-start monitoring in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  productionMonitor.start().catch(error => {
    logger.error('Failed to start production monitoring', { error })
  })
}

export default productionMonitor
export type { MonitoringConfig, SystemMetrics, Alert }