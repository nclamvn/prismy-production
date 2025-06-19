import { logger, securityLogger } from './logger'
import { performanceMonitor } from './performance-monitor'

// Alert types and interfaces
export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  timestamp: number
  resolved: boolean
  resolvedAt?: number
  metadata: Record<string, any>
  source: AlertSource
}

export type AlertType = 
  | 'performance'
  | 'security'
  | 'error_rate'
  | 'system_health'
  | 'business_metric'
  | 'cache_failure'
  | 'database_issue'
  | 'payment_failure'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertSource = 
  | 'performance_monitor'
  | 'cache_system'
  | 'database'
  | 'api_gateway'
  | 'payment_system'
  | 'security_monitor'
  | 'health_check'

export interface AlertRule {
  id: string
  name: string
  type: AlertType
  severity: AlertSeverity
  condition: AlertCondition
  enabled: boolean
  cooldown: number // minutes
  notifications: NotificationChannel[]
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  timeWindow?: number // minutes
  evaluationFrequency?: number // seconds
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'discord'
  target: string
  enabled: boolean
  severityFilter?: AlertSeverity[]
}

export interface AlertingConfig {
  enabled: boolean
  defaultCooldown: number
  maxAlertsPerHour: number
  enableAutoResolution: boolean
  autoResolutionTimeout: number // minutes
}

class AlertingSystem {
  private alerts: Alert[] = []
  private rules: AlertRule[] = []
  private lastAlerts = new Map<string, number>()
  private config: AlertingConfig
  private notificationHandlers = new Map<string, Function>()
  
  constructor(config: Partial<AlertingConfig> = {}) {
    this.config = {
      enabled: true,
      defaultCooldown: 5,
      maxAlertsPerHour: 50,
      enableAutoResolution: true,
      autoResolutionTimeout: 30,
      ...config
    }

    this.initializeDefaultRules()
    this.setupPerformanceMonitoringIntegration()
    this.startAlertProcessor()
  }

  // Create and trigger an alert
  async triggerAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata: Record<string, any> = {},
    source: AlertSource = 'api_gateway'
  ): Promise<Alert | null> {
    if (!this.config.enabled) return null

    // Check rate limiting
    if (!this.checkRateLimit()) {
      logger.warn('Alert rate limit exceeded, dropping alert', { title, severity })
      return null
    }

    const alertId = this.generateAlertId()
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      timestamp: Date.now(),
      resolved: false,
      metadata,
      source
    }

    // Add to alerts list
    this.alerts.push(alert)

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000)
    }

    // Log the alert
    const logLevel = this.getLogLevel(severity)
    logger[logLevel]({
      alert: {
        id: alertId,
        type,
        severity,
        title,
        source
      },
      metadata
    }, `Alert triggered: ${title}`)

    // Send notifications
    await this.sendNotifications(alert)

    // Log to security logger for critical alerts
    if (severity === 'critical') {
      securityLogger.error({
        alert,
        event: 'critical_alert_triggered'
      }, 'Critical alert triggered')
    }

    return alert
  }

  // Resolve an alert
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId && !a.resolved)
    if (!alert) return false

    alert.resolved = true
    alert.resolvedAt = Date.now()
    
    if (resolvedBy) {
      alert.metadata.resolvedBy = resolvedBy
    }

    logger.info({
      alertId,
      resolvedBy,
      duration: Date.now() - alert.timestamp
    }, 'Alert resolved')

    return true
  }

  // Get active alerts
  getActiveAlerts(filters?: {
    type?: AlertType
    severity?: AlertSeverity
    source?: AlertSource
  }): Alert[] {
    let activeAlerts = this.alerts.filter(a => !a.resolved)

    if (filters) {
      if (filters.type) {
        activeAlerts = activeAlerts.filter(a => a.type === filters.type)
      }
      if (filters.severity) {
        activeAlerts = activeAlerts.filter(a => a.severity === filters.severity)
      }
      if (filters.source) {
        activeAlerts = activeAlerts.filter(a => a.source === filters.source)
      }
    }

    return activeAlerts.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Get alert history
  getAlertHistory(
    timeRange: number = 24 * 60 * 60 * 1000, // 24 hours
    includeResolved: boolean = true
  ): Alert[] {
    const cutoff = Date.now() - timeRange
    
    return this.alerts
      .filter(a => {
        const timeMatch = a.timestamp >= cutoff
        const resolvedMatch = includeResolved || !a.resolved
        return timeMatch && resolvedMatch
      })
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // Add alert rule
  addRule(rule: AlertRule): void {
    this.rules.push(rule)
    logger.info({ rule }, 'Alert rule added')
  }

  // Remove alert rule
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId)
    if (index === -1) return false

    this.rules.splice(index, 1)
    logger.info({ ruleId }, 'Alert rule removed')
    return true
  }

  // Register notification handler
  registerNotificationHandler(
    type: string,
    handler: (alert: Alert, channel: NotificationChannel) => Promise<void>
  ): void {
    this.notificationHandlers.set(type, handler)
  }

  // Get alerting statistics
  getStatistics(timeRange: number = 24 * 60 * 60 * 1000): {
    totalAlerts: number
    alertsBySeverity: Record<AlertSeverity, number>
    alertsByType: Record<AlertType, number>
    averageResolutionTime: number
    activeAlerts: number
  } {
    const cutoff = Date.now() - timeRange
    const recentAlerts = this.alerts.filter(a => a.timestamp >= cutoff)
    
    const alertsBySeverity = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<AlertSeverity, number>)

    const alertsByType = recentAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1
      return acc
    }, {} as Record<AlertType, number>)

    const resolvedAlerts = recentAlerts.filter(a => a.resolved && a.resolvedAt)
    const averageResolutionTime = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((sum, a) => sum + (a.resolvedAt! - a.timestamp), 0) / resolvedAlerts.length
      : 0

    return {
      totalAlerts: recentAlerts.length,
      alertsBySeverity,
      alertsByType,
      averageResolutionTime,
      activeAlerts: this.getActiveAlerts().length
    }
  }

  // Built-in alert triggers for common scenarios
  async triggerHighErrorRate(errorRate: number, threshold: number = 0.05): Promise<void> {
    if (errorRate > threshold) {
      await this.triggerAlert(
        'error_rate',
        errorRate > threshold * 2 ? 'critical' : 'high',
        'High Error Rate Detected',
        `Error rate is ${(errorRate * 100).toFixed(1)}%, exceeding threshold of ${(threshold * 100).toFixed(1)}%`,
        { errorRate, threshold },
        'api_gateway'
      )
    }
  }

  async triggerSlowResponse(responseTime: number, endpoint: string): Promise<void> {
    const severity: AlertSeverity = responseTime > 3000 ? 'critical' : 
                                   responseTime > 1000 ? 'high' : 'medium'
    
    await this.triggerAlert(
      'performance',
      severity,
      'Slow API Response',
      `${endpoint} responded in ${responseTime}ms`,
      { responseTime, endpoint },
      'api_gateway'
    )
  }

  async triggerCacheFailure(operation: string, error: string): Promise<void> {
    await this.triggerAlert(
      'cache_failure',
      'high',
      'Cache Operation Failed',
      `Cache ${operation} operation failed: ${error}`,
      { operation, error },
      'cache_system'
    )
  }

  async triggerSecurityEvent(event: string, severity: AlertSeverity, details: any): Promise<void> {
    await this.triggerAlert(
      'security',
      severity,
      'Security Event Detected',
      `Security event: ${event}`,
      { event, details },
      'security_monitor'
    )
  }

  async triggerPaymentFailure(paymentMethod: string, amount: number, error: string): Promise<void> {
    await this.triggerAlert(
      'payment_failure',
      'high',
      'Payment Processing Failed',
      `${paymentMethod} payment of ${amount} failed: ${error}`,
      { paymentMethod, amount, error },
      'payment_system'
    )
  }

  // Private methods
  private async sendNotifications(alert: Alert): Promise<void> {
    const applicableChannels = this.getApplicableNotificationChannels(alert)
    
    for (const channel of applicableChannels) {
      try {
        const handler = this.notificationHandlers.get(channel.type)
        if (handler) {
          await handler(alert, channel)
        } else {
          logger.warn(`No handler for notification type: ${channel.type}`)
        }
      } catch (error) {
        logger.error({ error, channel, alert }, 'Failed to send notification')
      }
    }
  }

  private getApplicableNotificationChannels(alert: Alert): NotificationChannel[] {
    // Get all enabled notification channels from rules
    const applicableRules = this.rules.filter(rule => 
      rule.type === alert.type && rule.enabled
    )

    const channels: NotificationChannel[] = []
    
    for (const rule of applicableRules) {
      for (const channel of rule.notifications) {
        if (!channel.enabled) continue
        
        // Check severity filter
        if (channel.severityFilter && !channel.severityFilter.includes(alert.severity)) {
          continue
        }
        
        channels.push(channel)
      }
    }

    return channels
  }

  private checkRateLimit(): boolean {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const recentAlerts = this.alerts.filter(a => a.timestamp > oneHourAgo)
    
    return recentAlerts.length < this.config.maxAlertsPerHour
  }

  private getLogLevel(severity: AlertSeverity): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'low': return 'info'
      case 'medium': return 'warn'
      case 'high': return 'error'
      case 'critical': return 'error'
      default: return 'info'
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupPerformanceMonitoringIntegration(): void {
    // Register with performance monitor for automatic alerts
    performanceMonitor.onAlert((alert) => {
      this.triggerAlert(
        'performance',
        alert.severity,
        'Performance Alert',
        `${alert.metric} value ${alert.value} exceeded threshold ${alert.threshold}`,
        alert,
        'performance_monitor'
      )
    })
  }

  private initializeDefaultRules(): void {
    // High error rate rule
    this.addRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      type: 'error_rate',
      severity: 'high',
      condition: {
        metric: 'error_rate',
        operator: 'gt',
        threshold: 0.05,
        timeWindow: 5
      },
      enabled: true,
      cooldown: 10,
      notifications: [
        {
          type: 'email',
          target: 'alerts@prismy.ai',
          enabled: true,
          severityFilter: ['high', 'critical']
        }
      ]
    })

    // Slow response rule
    this.addRule({
      id: 'slow_response',
      name: 'Slow API Response',
      type: 'performance',
      severity: 'medium',
      condition: {
        metric: 'response_time',
        operator: 'gt',
        threshold: 1000,
        timeWindow: 1
      },
      enabled: true,
      cooldown: 5,
      notifications: [
        {
          type: 'slack',
          target: '#alerts',
          enabled: true
        }
      ]
    })

    // Critical system health rule
    this.addRule({
      id: 'critical_system_health',
      name: 'Critical System Health',
      type: 'system_health',
      severity: 'critical',
      condition: {
        metric: 'system_health_score',
        operator: 'lt',
        threshold: 50,
        timeWindow: 1
      },
      enabled: true,
      cooldown: 1,
      notifications: [
        {
          type: 'email',
          target: 'critical@prismy.ai',
          enabled: true,
          severityFilter: ['critical']
        },
        {
          type: 'sms',
          target: '+1234567890',
          enabled: true,
          severityFilter: ['critical']
        }
      ]
    })
  }

  private startAlertProcessor(): void {
    // Auto-resolve alerts
    if (this.config.enableAutoResolution) {
      setInterval(() => {
        this.processAutoResolution()
      }, 60000) // Check every minute
    }

    // Cleanup old alerts
    setInterval(() => {
      this.cleanupOldAlerts()
    }, 60 * 60 * 1000) // Cleanup every hour
  }

  private processAutoResolution(): void {
    const now = Date.now()
    const timeout = this.config.autoResolutionTimeout * 60 * 1000
    
    const alertsToResolve = this.alerts.filter(alert => 
      !alert.resolved && 
      (now - alert.timestamp) > timeout &&
      alert.type !== 'security' // Never auto-resolve security alerts
    )

    for (const alert of alertsToResolve) {
      this.resolveAlert(alert.id, 'auto-resolution')
    }
  }

  private cleanupOldAlerts(): void {
    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    
    this.alerts = this.alerts.filter(alert => 
      (now - alert.timestamp) < maxAge
    )
  }
}

// Global alerting system instance
export const alertingSystem = new AlertingSystem()

// Register default notification handlers
alertingSystem.registerNotificationHandler('email', async (alert, channel) => {
  // Email notification implementation would go here
  logger.info({ alert, channel }, 'Email notification sent')
})

alertingSystem.registerNotificationHandler('slack', async (alert, channel) => {
  // Slack notification implementation would go here
  logger.info({ alert, channel }, 'Slack notification sent')
})

alertingSystem.registerNotificationHandler('webhook', async (alert, channel) => {
  // Webhook notification implementation would go here
  logger.info({ alert, channel }, 'Webhook notification sent')
})

// Utility functions
export const createAlert = alertingSystem.triggerAlert.bind(alertingSystem)
export const resolveAlert = alertingSystem.resolveAlert.bind(alertingSystem)
export const getActiveAlerts = alertingSystem.getActiveAlerts.bind(alertingSystem)