/**
 * PRISMY ALERT MANAGER
 * Centralized alerting system for production monitoring
 * Handles multiple notification channels and escalation
 */

import { logger } from '@/lib/logger'
import { errorTracker } from './sentry-config'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AlertChannel = 'slack' | 'email' | 'sms' | 'webhook' | 'pagerduty'
export type AlertCategory = 'error' | 'performance' | 'security' | 'business' | 'infrastructure'

export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  category: AlertCategory
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  metadata?: Record<string, any>
  escalationLevel: number
  suppressUntil?: string
}

export interface AlertRule {
  id: string
  name: string
  condition: string
  severity: AlertSeverity
  category: AlertCategory
  channels: AlertChannel[]
  enabled: boolean
  cooldown: number // seconds
  escalation?: {
    levels: AlertChannel[][]
    intervals: number[] // seconds
  }
  suppression?: {
    conditions: string[]
    duration: number // seconds
  }
}

export interface AlertChannel {
  type: AlertChannel
  config: Record<string, any>
  enabled: boolean
}

class AlertManager {
  private static instance: AlertManager
  private alerts: Map<string, Alert> = new Map()
  private alertRules: Map<string, AlertRule> = new Map()
  private channels: Map<AlertChannel, AlertChannel> = new Map()
  private cooldowns: Map<string, number> = new Map()
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {
    this.initializeDefaultRules()
    this.initializeChannels()
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'error_rate > 0.05',
        severity: 'high',
        category: 'error',
        channels: ['slack', 'email'],
        enabled: true,
        cooldown: 300, // 5 minutes
        escalation: {
          levels: [['slack'], ['email'], ['pagerduty']],
          intervals: [300, 600, 1200] // 5min, 10min, 20min
        }
      },
      {
        id: 'critical-error',
        name: 'Critical Application Error',
        condition: 'severity = critical',
        severity: 'critical',
        category: 'error',
        channels: ['slack', 'email', 'pagerduty'],
        enabled: true,
        cooldown: 0, // No cooldown for critical errors
        escalation: {
          levels: [['slack', 'email'], ['pagerduty']],
          intervals: [60, 300] // 1min, 5min
        }
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: 'avg_response_time > 5000',
        severity: 'medium',
        category: 'performance',
        channels: ['slack'],
        enabled: true,
        cooldown: 600, // 10 minutes
      },
      {
        id: 'payment-failure',
        name: 'Payment Processing Failure',
        condition: 'payment_error_rate > 0.02',
        severity: 'high',
        category: 'business',
        channels: ['slack', 'email'],
        enabled: true,
        cooldown: 300,
        escalation: {
          levels: [['slack'], ['email']],
          intervals: [300, 900] // 5min, 15min
        }
      },
      {
        id: 'security-breach',
        name: 'Security Incident',
        condition: 'security_event = true',
        severity: 'critical',
        category: 'security',
        channels: ['slack', 'email', 'pagerduty'],
        enabled: true,
        cooldown: 0,
        escalation: {
          levels: [['slack', 'email', 'pagerduty']],
          intervals: [0] // Immediate
        }
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: 'memory_usage > 0.9',
        severity: 'medium',
        category: 'infrastructure',
        channels: ['slack'],
        enabled: true,
        cooldown: 900, // 15 minutes
      }
    ]

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule)
    })
  }

  private initializeChannels(): void {
    const channels = [
      {
        type: 'slack' as AlertChannel,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
          username: 'Prismy Alerts',
          iconEmoji: ':warning:'
        },
        enabled: !!process.env.SLACK_WEBHOOK_URL
      },
      {
        type: 'email' as AlertChannel,
        config: {
          to: process.env.ALERT_EMAIL_TO?.split(',') || [],
          from: process.env.ALERT_EMAIL_FROM || 'alerts@prismy.ai',
          subject: 'Prismy Alert'
        },
        enabled: !!(process.env.ALERT_EMAIL_TO && process.env.ALERT_EMAIL_API_KEY)
      },
      {
        type: 'webhook' as AlertChannel,
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.ALERT_WEBHOOK_TOKEN ? `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}` : undefined
          }
        },
        enabled: !!process.env.ALERT_WEBHOOK_URL
      },
      {
        type: 'pagerduty' as AlertChannel,
        config: {
          routingKey: process.env.PAGERDUTY_ROUTING_KEY,
          apiUrl: 'https://events.pagerduty.com/v2/enqueue'
        },
        enabled: !!process.env.PAGERDUTY_ROUTING_KEY
      }
    ]

    channels.forEach(channel => {
      this.channels.set(channel.type, channel)
    })
  }

  public async createAlert(
    title: string,
    message: string,
    severity: AlertSeverity,
    category: AlertCategory = 'error',
    metadata?: Record<string, any>
  ): Promise<string> {
    const alertId = this.generateAlertId()
    const timestamp = new Date().toISOString()

    const alert: Alert = {
      id: alertId,
      title,
      message,
      severity,
      category,
      timestamp,
      resolved: false,
      metadata,
      escalationLevel: 0
    }

    // Check for suppression
    if (this.isAlertSuppressed(alert)) {
      logger.info('Alert suppressed', { alertId, title })
      return alertId
    }

    // Check cooldown
    const ruleId = this.findMatchingRule(alert)
    if (ruleId && this.isInCooldown(ruleId)) {
      logger.info('Alert in cooldown', { alertId, ruleId, title })
      return alertId
    }

    // Store alert
    this.alerts.set(alertId, alert)

    // Set cooldown
    if (ruleId) {
      const rule = this.alertRules.get(ruleId)
      if (rule && rule.cooldown > 0) {
        this.cooldowns.set(ruleId, Date.now() + (rule.cooldown * 1000))
      }
    }

    // Send notifications
    await this.sendAlert(alert)

    // Setup escalation if configured
    if (ruleId) {
      this.setupEscalation(alertId, ruleId)
    }

    // Track in error monitoring
    errorTracker.captureMessage(`Alert created: ${title}`, 'warning', {
      tags: {
        alertId,
        severity,
        category
      },
      extra: {
        alert,
        metadata
      }
    })

    logger.info('Alert created', { alertId, title, severity, category })
    return alertId
  }

  public async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId)
    if (!alert || alert.resolved) {
      return false
    }

    alert.resolved = true
    alert.resolvedAt = new Date().toISOString()

    // Cancel escalation
    const timer = this.escalationTimers.get(alertId)
    if (timer) {
      clearTimeout(timer)
      this.escalationTimers.delete(alertId)
    }

    // Send resolution notification
    await this.sendResolutionNotification(alert, resolvedBy)

    logger.info('Alert resolved', { alertId, resolvedBy })
    return true
  }

  private findMatchingRule(alert: Alert): string | null {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue

      if (rule.category === alert.category && rule.severity === alert.severity) {
        return ruleId
      }
    }
    return null
  }

  private isInCooldown(ruleId: string): boolean {
    const cooldownUntil = this.cooldowns.get(ruleId)
    return cooldownUntil ? Date.now() < cooldownUntil : false
  }

  private isAlertSuppressed(alert: Alert): boolean {
    if (alert.suppressUntil) {
      return new Date(alert.suppressUntil) > new Date()
    }
    return false
  }

  private async sendAlert(alert: Alert): Promise<void> {
    const ruleId = this.findMatchingRule(alert)
    const rule = ruleId ? this.alertRules.get(ruleId) : null
    const channels = rule?.channels || ['slack']

    const sendPromises = channels.map(channelType => 
      this.sendToChannel(channelType, alert)
    )

    await Promise.allSettled(sendPromises)
  }

  private async sendToChannel(channelType: AlertChannel, alert: Alert): Promise<void> {
    const channel = this.channels.get(channelType)
    if (!channel || !channel.enabled) {
      return
    }

    try {
      switch (channelType) {
        case 'slack':
          await this.sendSlackAlert(alert, channel.config)
          break
        case 'email':
          await this.sendEmailAlert(alert, channel.config)
          break
        case 'webhook':
          await this.sendWebhookAlert(alert, channel.config)
          break
        case 'pagerduty':
          await this.sendPagerDutyAlert(alert, channel.config)
          break
        default:
          logger.warn('Unknown alert channel type', { channelType })
      }
    } catch (error) {
      logger.error('Failed to send alert to channel', { 
        error, 
        channelType, 
        alertId: alert.id 
      })
    }
  }

  private async sendSlackAlert(alert: Alert, config: any): Promise<void> {
    if (!config.webhookUrl) return

    const color = this.getSeverityColor(alert.severity)
    const emoji = this.getSeverityEmoji(alert.severity)

    const payload = {
      username: config.username,
      icon_emoji: config.iconEmoji,
      channel: config.channel,
      text: `${emoji} ${alert.title}`,
      attachments: [{
        color,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Category',
            value: alert.category,
            short: true
          },
          {
            title: 'Time',
            value: new Date(alert.timestamp).toLocaleString(),
            short: true
          },
          {
            title: 'Alert ID',
            value: alert.id,
            short: true
          },
          {
            title: 'Message',
            value: alert.message,
            short: false
          }
        ],
        footer: 'Prismy Alert System',
        ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
      }]
    }

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  private async sendEmailAlert(alert: Alert, config: any): Promise<void> {
    // Email implementation would go here
    // This is a placeholder for the actual email service integration
    logger.info('Email alert would be sent', { alert, config })
  }

  private async sendWebhookAlert(alert: Alert, config: any): Promise<void> {
    if (!config.url) return

    const payload = {
      type: 'alert',
      alert,
      timestamp: new Date().toISOString()
    }

    await fetch(config.url, {
      method: config.method || 'POST',
      headers: config.headers,
      body: JSON.stringify(payload)
    })
  }

  private async sendPagerDutyAlert(alert: Alert, config: any): Promise<void> {
    if (!config.routingKey) return

    const payload = {
      routing_key: config.routingKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.title,
        source: 'Prismy Alert System',
        severity: alert.severity,
        component: alert.category,
        group: 'prismy-production',
        class: alert.category,
        custom_details: {
          message: alert.message,
          metadata: alert.metadata,
          timestamp: alert.timestamp
        }
      }
    }

    await fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  private async sendResolutionNotification(alert: Alert, resolvedBy?: string): Promise<void> {
    const slackChannel = this.channels.get('slack')
    if (!slackChannel || !slackChannel.enabled) return

    const payload = {
      username: slackChannel.config.username,
      icon_emoji: ':white_check_mark:',
      channel: slackChannel.config.channel,
      text: `✅ Alert Resolved: ${alert.title}`,
      attachments: [{
        color: 'good',
        fields: [
          {
            title: 'Alert ID',
            value: alert.id,
            short: true
          },
          {
            title: 'Resolved By',
            value: resolvedBy || 'System',
            short: true
          },
          {
            title: 'Resolution Time',
            value: new Date().toLocaleString(),
            short: true
          },
          {
            title: 'Duration',
            value: this.calculateDuration(alert.timestamp),
            short: true
          }
        ],
        footer: 'Prismy Alert System'
      }]
    }

    try {
      await fetch(slackChannel.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      logger.error('Failed to send resolution notification', { error })
    }
  }

  private setupEscalation(alertId: string, ruleId: string): void {
    const rule = this.alertRules.get(ruleId)
    if (!rule?.escalation) return

    const escalateAlert = (level: number) => {
      const alert = this.alerts.get(alertId)
      if (!alert || alert.resolved || level >= rule.escalation!.levels.length) {
        return
      }

      alert.escalationLevel = level
      const channels = rule.escalation!.levels[level]
      
      // Send escalated alert
      const sendPromises = channels.map(channelType => 
        this.sendEscalatedAlert(alert, channelType, level)
      )

      Promise.allSettled(sendPromises)

      // Schedule next escalation
      if (level + 1 < rule.escalation!.levels.length) {
        const nextInterval = rule.escalation!.intervals[level + 1] * 1000
        const timer = setTimeout(() => escalateAlert(level + 1), nextInterval)
        this.escalationTimers.set(alertId, timer)
      }
    }

    // Start escalation
    if (rule.escalation.intervals[0] > 0) {
      const timer = setTimeout(() => escalateAlert(0), rule.escalation.intervals[0] * 1000)
      this.escalationTimers.set(alertId, timer)
    }
  }

  private async sendEscalatedAlert(alert: Alert, channelType: AlertChannel, level: number): Promise<void> {
    const escalatedAlert = {
      ...alert,
      title: `🚨 ESCALATED (Level ${level + 1}): ${alert.title}`,
      message: `This alert has been escalated to level ${level + 1}.\n\n${alert.message}`
    }

    await this.sendToChannel(channelType, escalatedAlert)
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'low': return '#36a64f'
      case 'medium': return '#ffcc00'
      case 'high': return '#ff6600'
      case 'critical': return '#ff0000'
      default: return '#808080'
    }
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'low': return '🟢'
      case 'medium': return '🟡'
      case 'high': return '🟠'
      case 'critical': return '🔴'
      default: return '⚪'
    }
  }

  private calculateDuration(startTime: string): string {
    const start = new Date(startTime).getTime()
    const end = Date.now()
    const duration = end - start

    const minutes = Math.floor(duration / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API methods
  public getAlerts(resolved?: boolean): Alert[] {
    const alerts = Array.from(this.alerts.values())
    if (resolved !== undefined) {
      return alerts.filter(alert => alert.resolved === resolved)
    }
    return alerts
  }

  public getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId)
  }

  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values())
  }

  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId)
    if (!rule) return false

    Object.assign(rule, updates)
    return true
  }

  public getChannelStatus(): Record<AlertChannel, boolean> {
    const status: Record<string, boolean> = {}
    for (const [type, channel] of this.channels) {
      status[type] = channel.enabled
    }
    return status as Record<AlertChannel, boolean>
  }

  // Convenience methods for specific alert types
  public async createErrorAlert(error: Error, context?: Record<string, any>): Promise<string> {
    return this.createAlert(
      `Application Error: ${error.name}`,
      error.message,
      'high',
      'error',
      { error: error.stack, ...context }
    )
  }

  public async createPerformanceAlert(metric: string, value: number, threshold: number): Promise<string> {
    return this.createAlert(
      `Performance Issue: ${metric}`,
      `${metric} is ${value}, exceeding threshold of ${threshold}`,
      'medium',
      'performance',
      { metric, value, threshold }
    )
  }

  public async createSecurityAlert(incident: string, details: Record<string, any>): Promise<string> {
    return this.createAlert(
      `Security Incident: ${incident}`,
      `Security incident detected: ${incident}`,
      'critical',
      'security',
      details
    )
  }
}

// Export singleton instance
export const alertManager = AlertManager.getInstance()
export default alertManager