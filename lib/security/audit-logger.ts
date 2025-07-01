/**
 * Security Audit Logging System
 * Comprehensive security event tracking and analysis
 */

import { createServiceRoleClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Always use service role client for server-side security audit logging
function getSupabaseClient() {
  return createServiceRoleClient()
}

export interface SecurityAuditEvent {
  userId?: string
  operation: string
  resourceType: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  organizationId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  outcome: 'success' | 'failure' | 'suspicious'
}

export interface SecurityAnalytics {
  timeRange: { start: Date; end: Date }
  userId?: string
  organizationId?: string
  operations?: string[]
  severity?: ('low' | 'medium' | 'high' | 'critical')[]
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger

  private constructor() {}

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger()
    }
    return SecurityAuditLogger.instance
  }

  /**
   * Log a security audit event
   */
  async logEvent(event: SecurityAuditEvent): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.rpc('log_security_audit', {
        p_user_id: event.userId || null,
        p_operation: event.operation,
        p_resource_type: event.resourceType,
        p_resource_id: event.resourceId || null,
        p_metadata: {
          ...event.metadata,
          severity: event.severity,
          outcome: event.outcome,
          timestamp: new Date().toISOString()
        },
        p_ip_address: event.ipAddress || null,
        p_user_agent: event.userAgent || null,
        p_organization_id: event.organizationId || null
      })

      if (error) throw error

      // Also log to application logger for immediate visibility
      const logLevel = this.getLogLevel(event.severity, event.outcome)
      logger[logLevel]('Security audit event', {
        operation: event.operation,
        resourceType: event.resourceType,
        severity: event.severity,
        outcome: event.outcome,
        userId: event.userId,
        organizationId: event.organizationId
      })

      // Check for suspicious patterns
      if (event.outcome === 'suspicious' || event.severity === 'critical') {
        await this.checkSuspiciousPatterns(event)
      }

    } catch (error) {
      logger.error('Failed to log security audit event', { error, event })
    }
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    userId: string,
    operation: 'login' | 'logout' | 'login_failed' | 'password_reset' | 'password_change',
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const severity = operation === 'login_failed' ? 'medium' : 'low'
    const outcome = operation === 'login_failed' ? 'failure' : 'success'

    await this.logEvent({
      userId,
      operation,
      resourceType: 'authentication',
      metadata,
      ipAddress,
      userAgent,
      severity,
      outcome
    })
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    userId: string,
    operation: 'read' | 'create' | 'update' | 'delete',
    resourceType: string,
    resourceId: string,
    organizationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const severity = operation === 'delete' ? 'medium' : 'low'

    await this.logEvent({
      userId,
      operation: `data_${operation}`,
      resourceType,
      resourceId,
      organizationId,
      metadata,
      severity,
      outcome: 'success'
    })
  }

  /**
   * Log permission changes
   */
  async logPermissionChange(
    adminUserId: string,
    targetUserId: string,
    operation: 'grant' | 'revoke',
    permission: string,
    organizationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId: adminUserId,
      operation: `permission_${operation}`,
      resourceType: 'user_permissions',
      resourceId: targetUserId,
      organizationId,
      metadata: {
        ...metadata,
        permission,
        targetUserId
      },
      severity: 'high',
      outcome: 'success'
    })
  }

  /**
   * Log security configuration changes
   */
  async logSecurityConfigChange(
    userId: string,
    operation: string,
    configType: string,
    organizationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      operation,
      resourceType: 'security_config',
      resourceId: configType,
      organizationId,
      metadata,
      severity: 'high',
      outcome: 'success'
    })
  }

  /**
   * Log suspicious activities
   */
  async logSuspiciousActivity(
    userId: string | undefined,
    operation: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      operation,
      resourceType: 'suspicious_activity',
      metadata: {
        ...metadata,
        reason,
        detectionTimestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      severity: 'critical',
      outcome: 'suspicious'
    })
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(params: SecurityAnalytics): Promise<{
    events: any[]
    summary: {
      totalEvents: number
      successfulEvents: number
      failedEvents: number
      suspiciousEvents: number
      topOperations: Array<{ operation: string; count: number }>
      topSources: Array<{ source: string; count: number }>
      timelineTrends: Array<{ date: string; count: number; severity: string }>
    }
  }> {
    try {
      // Build query conditions
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .gte('created_at', params.timeRange.start.toISOString())
        .lte('created_at', params.timeRange.end.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000)

      if (params.userId) {
        query = query.eq('user_id', params.userId)
      }

      if (params.organizationId) {
        query = query.eq('organization_id', params.organizationId)
      }

      if (params.operations?.length) {
        query = query.in('operation', params.operations)
      }

      if (params.severity?.length) {
        // Filter by severity in metadata
        query = query.or(
          params.severity.map(s => `metadata->>severity.eq.${s}`).join(',')
        )
      }

      const { data: events, error } = await query

      if (error) throw error

      // Calculate summary statistics
      const totalEvents = events?.length || 0
      const successfulEvents = events?.filter(e => e.metadata?.outcome === 'success').length || 0
      const failedEvents = events?.filter(e => e.metadata?.outcome === 'failure').length || 0
      const suspiciousEvents = events?.filter(e => e.metadata?.outcome === 'suspicious').length || 0

      // Top operations
      const operationCounts = new Map<string, number>()
      events?.forEach(event => {
        const count = operationCounts.get(event.operation) || 0
        operationCounts.set(event.operation, count + 1)
      })
      const topOperations = Array.from(operationCounts.entries())
        .map(([operation, count]) => ({ operation, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Top sources (IP addresses)
      const sourceCounts = new Map<string, number>()
      events?.forEach(event => {
        const source = event.ip_address || 'unknown'
        const count = sourceCounts.get(source) || 0
        sourceCounts.set(source, count + 1)
      })
      const topSources = Array.from(sourceCounts.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Timeline trends (daily aggregation)
      const timelineCounts = new Map<string, { count: number; severity: string }>()
      events?.forEach(event => {
        const date = new Date(event.created_at).toISOString().slice(0, 10)
        const severity = event.metadata?.severity || 'low'
        const existing = timelineCounts.get(date) || { count: 0, severity: 'low' }
        
        timelineCounts.set(date, {
          count: existing.count + 1,
          severity: this.getHighestSeverity(existing.severity, severity)
        })
      })
      const timelineTrends = Array.from(timelineCounts.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return {
        events: events || [],
        summary: {
          totalEvents,
          successfulEvents,
          failedEvents,
          suspiciousEvents,
          topOperations,
          topSources,
          timelineTrends
        }
      }

    } catch (error) {
      logger.error('Failed to get security analytics', { error, params })
      throw error
    }
  }

  /**
   * Check for suspicious patterns after logging an event
   */
  private async checkSuspiciousPatterns(event: SecurityAuditEvent): Promise<void> {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Check for excessive failed login attempts
      if (event.operation === 'login_failed' && event.ipAddress) {
        const { data: recentFailures } = await supabase
          .from('security_audit_logs')
          .select('id')
          .eq('operation', 'login_failed')
          .eq('ip_address', event.ipAddress)
          .gte('created_at', oneHourAgo.toISOString())

        if ((recentFailures?.length || 0) >= 5) {
          await this.logSuspiciousActivity(
            undefined,
            'brute_force_attempt',
            'Multiple failed login attempts from same IP',
            event.ipAddress,
            event.userAgent,
            { 
              failureCount: recentFailures?.length,
              timeWindow: '1 hour'
            }
          )
        }
      }

      // Check for unusual access patterns
      if (event.userId && event.ipAddress) {
        const { data: userSessions } = await supabase
          .from('security_audit_logs')
          .select('ip_address, metadata')
          .eq('user_id', event.userId)
          .eq('operation', 'login')
          .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(10)

        const uniqueIPs = new Set(userSessions?.map(s => s.ip_address).filter(Boolean))
        
        if (uniqueIPs.size >= 5 && !uniqueIPs.has(event.ipAddress)) {
          await this.logSuspiciousActivity(
            event.userId,
            'unusual_access_pattern',
            'Login from new IP with multiple recent IPs',
            event.ipAddress,
            event.userAgent,
            {
              uniqueIPsLast7Days: uniqueIPs.size,
              isNewIP: true
            }
          )
        }
      }

      // Check for rapid successive operations
      if (event.userId) {
        const { data: recentOps } = await supabase
          .from('security_audit_logs')
          .select('id, operation')
          .eq('user_id', event.userId)
          .gte('created_at', new Date(now.getTime() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

        if ((recentOps?.length || 0) >= 20) {
          await this.logSuspiciousActivity(
            event.userId,
            'rapid_operations',
            'Unusually high number of operations in short time',
            event.ipAddress,
            event.userAgent,
            {
              operationCount: recentOps?.length,
              timeWindow: '5 minutes'
            }
          )
        }
      }

    } catch (error) {
      logger.error('Failed to check suspicious patterns', { error, event })
    }
  }

  /**
   * Get log level based on severity and outcome
   */
  private getLogLevel(severity: string, outcome: string): 'info' | 'warn' | 'error' {
    if (outcome === 'suspicious' || severity === 'critical') {
      return 'error'
    }
    if (outcome === 'failure' || severity === 'high') {
      return 'warn'
    }
    return 'info'
  }

  /**
   * Get the highest severity between two severity levels
   */
  private getHighestSeverity(severity1: string, severity2: string): string {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
    const level1 = severityOrder[severity1 as keyof typeof severityOrder] || 1
    const level2 = severityOrder[severity2 as keyof typeof severityOrder] || 1
    
    const highest = Math.max(level1, level2)
    return Object.keys(severityOrder).find(
      key => severityOrder[key as keyof typeof severityOrder] === highest
    ) || 'low'
  }

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(
    params: SecurityAnalytics,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    try {
      const analytics = await this.getSecurityAnalytics(params)
      
      if (format === 'json') {
        return JSON.stringify(analytics.events, null, 2)
      }

      // CSV export
      const headers = [
        'Timestamp',
        'User ID',
        'Operation',
        'Resource Type',
        'Resource ID',
        'IP Address',
        'User Agent',
        'Severity',
        'Outcome',
        'Organization ID'
      ]

      const csvRows = analytics.events.map(event => [
        event.created_at,
        event.user_id || '',
        event.operation,
        event.resource_type,
        event.resource_id || '',
        event.ip_address || '',
        event.user_agent || '',
        event.metadata?.severity || '',
        event.metadata?.outcome || '',
        event.organization_id || ''
      ])

      return [headers, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

    } catch (error) {
      logger.error('Failed to export audit logs', { error, params })
      throw error
    }
  }
}

// Singleton instance export
export const auditLogger = SecurityAuditLogger.getInstance()