/**
 * ERROR TRACKING & ALERTING SYSTEM
 * Comprehensive error monitoring and alerting
 */

import { analyticsEngine } from '@/lib/analytics/analytics-engine'

export interface ErrorInfo {
  id: string
  message: string
  stack?: string
  code?: string
  type: 'javascript' | 'api' | 'database' | 'network' | 'validation' | 'authentication' | 'authorization' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  
  // Context information
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  ip?: string
  
  // Request context
  method?: string
  endpoint?: string
  statusCode?: number
  requestId?: string
  
  // Application context
  component?: string
  function?: string
  version?: string
  environment: 'development' | 'staging' | 'production'
  
  // Additional metadata
  metadata: Record<string, any>
  
  // Error frequency
  firstSeen: Date
  lastSeen: Date
  count: number
  
  // Resolution status
  status: 'new' | 'investigating' | 'resolved' | 'ignored'
  resolvedAt?: Date
  resolvedBy?: string
  resolution?: string
}

export interface ErrorAlert {
  id: string
  errorId: string
  type: 'threshold' | 'spike' | 'new_error' | 'critical_error'
  message: string
  timestamp: Date
  severity: ErrorInfo['severity']
  channels: ('email' | 'slack' | 'webhook' | 'sms')[]
  metadata: Record<string, any>
}

export interface ErrorThreshold {
  type: ErrorInfo['type']
  severity: ErrorInfo['severity']
  count: number
  timeWindow: number // minutes
  channels: ErrorAlert['channels']
}

export class ErrorTracker {
  private errors = new Map<string, ErrorInfo>()
  private alertCallbacks = new Set<(alert: ErrorAlert) => void>()
  private thresholds: ErrorThreshold[] = []
  
  constructor() {
    this.initializeDefaultThresholds()
    this.setupGlobalErrorHandlers()
    
    // Periodic cleanup and analysis
    setInterval(() => {
      this.cleanup()
      this.analyzeErrorPatterns()
    }, 60000) // Every minute
  }

  // Error capture methods
  async captureError(errorData: Omit<ErrorInfo, 'id' | 'timestamp' | 'firstSeen' | 'lastSeen' | 'count' | 'status'>): Promise<string> {
    const errorHash = this.generateErrorHash(errorData)
    const existingError = this.findExistingError(errorHash)
    
    if (existingError) {
      // Update existing error
      existingError.count++
      existingError.lastSeen = new Date()
      existingError.metadata = { ...existingError.metadata, ...errorData.metadata }
      
      // Check for spike alerts
      await this.checkSpikeAlert(existingError)
      
      return existingError.id
    } else {
      // Create new error
      const error: ErrorInfo = {
        ...errorData,
        id: this.generateErrorId(),
        timestamp: new Date(),
        firstSeen: new Date(),
        lastSeen: new Date(),
        count: 1,
        status: 'new'
      }
      
      this.errors.set(error.id, error)
      
      // Send new error alert
      await this.sendAlert({
        type: 'new_error',
        errorId: error.id,
        message: `New ${error.severity} error: ${error.message}`,
        severity: error.severity,
        channels: this.getChannelsForSeverity(error.severity),
        metadata: {
          error: {
            type: error.type,
            message: error.message,
            component: error.component,
            url: error.url
          }
        }
      })
      
      // Check critical error alert
      if (error.severity === 'critical') {
        await this.sendAlert({
          type: 'critical_error',
          errorId: error.id,
          message: `CRITICAL ERROR: ${error.message}`,
          severity: 'critical',
          channels: ['email', 'sms', 'slack'],
          metadata: {
            error: {
              stack: error.stack,
              component: error.component,
              userId: error.userId
            }
          }
        })
      }
      
      // Track in analytics
      await analyticsEngine.trackError(
        errorData.sessionId || 'unknown',
        errorData.userId,
        {
          message: error.message,
          stack: error.stack,
          code: error.code,
          severity: error.severity,
          context: error.metadata
        }
      )
      
      return error.id
    }
  }

  // Specific error capture methods
  async captureJavaScriptError(
    error: Error,
    context: {
      userId?: string
      sessionId?: string
      component?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
    return this.captureError({
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      type: 'javascript',
      severity: this.inferSeverity(error),
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      metadata: {
        errorName: error.name,
        ...context.metadata
      },
      ...context
    })
  }

  async captureAPIError(
    error: {
      message: string
      statusCode: number
      endpoint: string
      method: string
      requestId?: string
    },
    context: {
      userId?: string
      sessionId?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
    return this.captureError({
      message: error.message,
      code: error.statusCode.toString(),
      type: 'api',
      severity: this.getSeverityFromStatusCode(error.statusCode),
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      endpoint: error.endpoint,
      method: error.method,
      statusCode: error.statusCode,
      requestId: error.requestId,
      metadata: {
        ...context.metadata
      },
      ...context
    })
  }

  async captureDatabaseError(
    error: Error,
    context: {
      query?: string
      userId?: string
      sessionId?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
    return this.captureError({
      message: error.message,
      stack: error.stack,
      type: 'database',
      severity: 'high', // Database errors are typically serious
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      metadata: {
        query: context.query?.substring(0, 200), // Truncate for security
        ...context.metadata
      },
      ...context
    })
  }

  async captureValidationError(
    message: string,
    field: string,
    value: any,
    context: {
      userId?: string
      sessionId?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
    return this.captureError({
      message,
      type: 'validation',
      severity: 'low',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      metadata: {
        field,
        value: typeof value === 'string' ? value.substring(0, 100) : value,
        ...context.metadata
      },
      ...context
    })
  }

  // Error analysis and management
  getErrors(filter?: {
    type?: ErrorInfo['type']
    severity?: ErrorInfo['severity']
    status?: ErrorInfo['status']
    timeRange?: { start: Date; end: Date }
    limit?: number
  }): ErrorInfo[] {
    let errors = Array.from(this.errors.values())

    if (filter) {
      if (filter.type) errors = errors.filter(e => e.type === filter.type)
      if (filter.severity) errors = errors.filter(e => e.severity === filter.severity)
      if (filter.status) errors = errors.filter(e => e.status === filter.status)
      
      if (filter.timeRange) {
        errors = errors.filter(e => 
          e.timestamp >= filter.timeRange!.start && 
          e.timestamp <= filter.timeRange!.end
        )
      }
    }

    errors.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
    
    if (filter?.limit) {
      errors = errors.slice(0, filter.limit)
    }

    return errors
  }

  getErrorById(id: string): ErrorInfo | undefined {
    return this.errors.get(id)
  }

  async resolveError(
    errorId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<boolean> {
    const error = this.errors.get(errorId)
    if (!error) return false

    error.status = 'resolved'
    error.resolvedAt = new Date()
    error.resolvedBy = resolvedBy
    error.resolution = resolution

    return true
  }

  async ignoreError(errorId: string): Promise<boolean> {
    const error = this.errors.get(errorId)
    if (!error) return false

    error.status = 'ignored'
    return true
  }

  // Error statistics
  getErrorStats(timeRange: 'hour' | 'day' | 'week' = 'day'): {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    byStatus: Record<string, number>
    errorRate: number
    topErrors: { error: ErrorInfo; percentage: number }[]
  } {
    const now = Date.now()
    const ranges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    }

    const cutoff = now - ranges[timeRange]
    const recentErrors = Array.from(this.errors.values())
      .filter(e => e.lastSeen.getTime() > cutoff)

    const stats = {
      total: recentErrors.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      errorRate: 0,
      topErrors: [] as { error: ErrorInfo; percentage: number }[]
    }

    // Count by categories
    for (const error of recentErrors) {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + error.count
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + error.count
      stats.byStatus[error.status] = (stats.byStatus[error.status] || 0) + 1
    }

    // Calculate top errors
    const sortedErrors = recentErrors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const totalCount = recentErrors.reduce((sum, e) => sum + e.count, 0)
    stats.topErrors = sortedErrors.map(error => ({
      error,
      percentage: totalCount > 0 ? (error.count / totalCount) * 100 : 0
    }))

    return stats
  }

  // Alert management
  addAlertCallback(callback: (alert: ErrorAlert) => void): () => void {
    this.alertCallbacks.add(callback)
    return () => this.alertCallbacks.delete(callback)
  }

  addThreshold(threshold: ErrorThreshold): void {
    this.thresholds.push(threshold)
  }

  private async sendAlert(alertData: Omit<ErrorAlert, 'id' | 'timestamp'>): Promise<void> {
    const alert: ErrorAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date()
    }

    // Notify all callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error alert callback failed:', error)
      }
    }

    // Send to external alerting systems
    await this.sendExternalAlert(alert)
  }

  // Private methods
  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Capture unhandled JavaScript errors
      window.addEventListener('error', (event) => {
        this.captureJavaScriptError(
          new Error(event.message),
          {
            metadata: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno
            }
          }
        )
      })

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureJavaScriptError(
          new Error(event.reason?.message || 'Unhandled promise rejection'),
          {
            metadata: {
              reason: event.reason,
              type: 'unhandledrejection'
            }
          }
        )
      })
    }

    if (typeof process !== 'undefined') {
      // Capture uncaught exceptions (Node.js)
      process.on('uncaughtException', (error) => {
        this.captureError({
          message: error.message,
          stack: error.stack,
          type: 'system',
          severity: 'critical',
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
          metadata: {
            type: 'uncaughtException'
          }
        })
      })

      // Capture unhandled promise rejections (Node.js)
      process.on('unhandledRejection', (reason) => {
        this.captureError({
          message: reason instanceof Error ? reason.message : String(reason),
          stack: reason instanceof Error ? reason.stack : undefined,
          type: 'system',
          severity: 'high',
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
          metadata: {
            type: 'unhandledRejection',
            reason
          }
        })
      })
    }
  }

  private generateErrorHash(errorData: Partial<ErrorInfo>): string {
    const key = `${errorData.message}:${errorData.component}:${errorData.function}:${errorData.type}`
    return this.hash(key)
  }

  private findExistingError(hash: string): ErrorInfo | undefined {
    for (const error of this.errors.values()) {
      const errorHash = this.generateErrorHash(error)
      if (errorHash === hash) {
        return error
      }
    }
    return undefined
  }

  private hash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private inferSeverity(error: Error): ErrorInfo['severity'] {
    const message = error.message.toLowerCase()
    
    if (message.includes('critical') || message.includes('fatal')) return 'critical'
    if (message.includes('security') || message.includes('auth')) return 'high'
    if (message.includes('network') || message.includes('timeout')) return 'medium'
    
    return 'low'
  }

  private getSeverityFromStatusCode(statusCode: number): ErrorInfo['severity'] {
    if (statusCode >= 500) return 'high'
    if (statusCode >= 400) return 'medium'
    return 'low'
  }

  private getChannelsForSeverity(severity: ErrorInfo['severity']): ErrorAlert['channels'] {
    switch (severity) {
      case 'critical': return ['email', 'sms', 'slack']
      case 'high': return ['email', 'slack']
      case 'medium': return ['slack']
      default: return []
    }
  }

  private async checkSpikeAlert(error: ErrorInfo): Promise<void> {
    // Check if error count has spiked recently
    const recentCount = error.count
    const timeWindow = 10 * 60 * 1000 // 10 minutes
    
    if (recentCount >= 10 && error.severity !== 'low') {
      await this.sendAlert({
        type: 'spike',
        errorId: error.id,
        message: `Error spike detected: ${error.message} (${recentCount} occurrences)`,
        severity: error.severity,
        channels: this.getChannelsForSeverity(error.severity),
        metadata: {
          count: recentCount,
          timeWindow
        }
      })
    }
  }

  private initializeDefaultThresholds(): void {
    this.thresholds = [
      {
        type: 'javascript',
        severity: 'critical',
        count: 1,
        timeWindow: 5,
        channels: ['email', 'slack']
      },
      {
        type: 'api',
        severity: 'high',
        count: 5,
        timeWindow: 10,
        channels: ['slack']
      },
      {
        type: 'database',
        severity: 'medium',
        count: 3,
        timeWindow: 5,
        channels: ['slack']
      }
    ]
  }

  private async analyzeErrorPatterns(): Promise<void> {
    // Check thresholds
    for (const threshold of this.thresholds) {
      const cutoff = new Date(Date.now() - threshold.timeWindow * 60 * 1000)
      const matchingErrors = Array.from(this.errors.values())
        .filter(e => 
          e.type === threshold.type && 
          e.severity === threshold.severity && 
          e.lastSeen >= cutoff
        )

      const totalCount = matchingErrors.reduce((sum, e) => sum + e.count, 0)

      if (totalCount >= threshold.count) {
        await this.sendAlert({
          type: 'threshold',
          errorId: 'threshold_alert',
          message: `Error threshold exceeded: ${totalCount} ${threshold.type} ${threshold.severity} errors in ${threshold.timeWindow} minutes`,
          severity: threshold.severity,
          channels: threshold.channels,
          metadata: {
            threshold,
            actualCount: totalCount,
            errors: matchingErrors.map(e => ({
              id: e.id,
              message: e.message,
              count: e.count
            }))
          }
        })
      }
    }
  }

  private async sendExternalAlert(alert: ErrorAlert): Promise<void> {
    // Integration with external alerting systems
    // This would be implemented based on configured services
    
    // Example integrations:
    // - Slack webhooks
    // - Email notifications
    // - SMS via Twilio
    // - PagerDuty
    // - Discord webhooks
    
    console.log('Alert:', alert) // Placeholder
  }

  private cleanup(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    
    // Remove old resolved/ignored errors
    for (const [id, error] of this.errors.entries()) {
      if ((error.status === 'resolved' || error.status === 'ignored') && error.lastSeen < cutoff) {
        this.errors.delete(id)
      }
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker()