import { NextRequest, NextResponse } from 'next/server'
import { auditLogger } from '@/lib/security/audit-logger'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null
    return user.id
  } catch (error) {
    logger.error('Failed to get user from request', { error })
    return null
  }
}

// Helper function to check if user has admin access to organization
async function hasOrgAdminAccess(userId: string, organizationId: string): Promise<boolean> {
  try {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return membership && ['owner', 'admin'].includes(membership.role)
  } catch (error) {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'analytics':
        // Get security analytics
        const organizationId = searchParams.get('organizationId')
        const days = parseInt(searchParams.get('days') || '30')
        const operations = searchParams.get('operations')?.split(',').filter(Boolean)
        const severity = searchParams.get('severity')?.split(',').filter(Boolean) as any

        // Verify access
        if (organizationId) {
          const hasAccess = await hasOrgAdminAccess(userId, organizationId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

        const analytics = await auditLogger.getSecurityAnalytics({
          timeRange: { start: startDate, end: endDate },
          userId: organizationId ? undefined : userId,
          organizationId,
          operations,
          severity
        })

        return NextResponse.json({
          success: true,
          ...analytics
        })

      case 'summary':
        // Get security summary
        const summaryOrgId = searchParams.get('organizationId')
        const summaryDays = parseInt(searchParams.get('days') || '30')

        // Verify access
        if (summaryOrgId) {
          const hasAccess = await hasOrgAdminAccess(userId, summaryOrgId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const { data: summary, error: summaryError } = await supabase.rpc('get_security_summary', {
          p_organization_id: summaryOrgId || null,
          p_days: summaryDays
        })

        if (summaryError) throw summaryError

        return NextResponse.json({
          success: true,
          summary: summary[0] || {}
        })

      case 'export':
        // Export audit logs
        const exportOrgId = searchParams.get('organizationId')
        const exportDays = parseInt(searchParams.get('days') || '30')
        const format = searchParams.get('format') as 'csv' | 'json' || 'csv'

        // Verify access
        if (exportOrgId) {
          const hasAccess = await hasOrgAdminAccess(userId, exportOrgId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const exportEndDate = new Date()
        const exportStartDate = new Date(exportEndDate.getTime() - exportDays * 24 * 60 * 60 * 1000)

        const exportData = await auditLogger.exportAuditLogs(
          {
            timeRange: { start: exportStartDate, end: exportEndDate },
            userId: exportOrgId ? undefined : userId,
            organizationId: exportOrgId
          },
          format
        )

        // Log export event
        await auditLogger.logDataAccess(
          userId,
          'read',
          'security_audit_logs',
          'export',
          exportOrgId,
          {
            format,
            timeRange: { start: exportStartDate, end: exportEndDate },
            recordCount: exportData.split('\n').length - 1 // Rough count for CSV
          }
        )

        const contentType = format === 'json' ? 'application/json' : 'text/csv'
        const filename = `security_audit_${exportStartDate.toISOString().slice(0, 10)}_to_${exportEndDate.toISOString().slice(0, 10)}.${format}`

        return new NextResponse(exportData, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        })

      case 'alerts':
        // Get security alerts
        const alertsOrgId = searchParams.get('organizationId')
        const alertStatus = searchParams.get('status')
        const alertSeverity = searchParams.get('severity')
        const limit = parseInt(searchParams.get('limit') || '50')

        // Verify access
        if (alertsOrgId) {
          const hasAccess = await hasOrgAdminAccess(userId, alertsOrgId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        let alertsQuery = supabase
          .from('security_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (alertsOrgId) {
          alertsQuery = alertsQuery.eq('affected_organization_id', alertsOrgId)
        } else {
          alertsQuery = alertsQuery.eq('affected_user_id', userId)
        }

        if (alertStatus) {
          alertsQuery = alertsQuery.eq('status', alertStatus)
        }

        if (alertSeverity) {
          alertsQuery = alertsQuery.eq('severity', alertSeverity)
        }

        const { data: alerts, error: alertsError } = await alertsQuery

        if (alertsError) throw alertsError

        return NextResponse.json({
          success: true,
          alerts: alerts || []
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Security audit GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')

    switch (action) {
      case 'log-event':
        // Log a custom security event
        const {
          operation,
          resourceType,
          resourceId,
          organizationId,
          severity = 'low',
          outcome = 'success',
          metadata = {}
        } = data

        if (!operation || !resourceType) {
          return NextResponse.json(
            { error: 'Operation and resource type required' },
            { status: 400 }
          )
        }

        await auditLogger.logEvent({
          userId,
          operation,
          resourceType,
          resourceId,
          organizationId,
          severity,
          outcome,
          metadata,
          ipAddress: clientIP,
          userAgent
        })

        return NextResponse.json({
          success: true,
          message: 'Security event logged successfully'
        })

      case 'create-alert':
        // Create a security alert
        const {
          alertType,
          severity: alertSeverity,
          title,
          description,
          affectedUserId,
          affectedOrganizationId,
          detectionData = {}
        } = data

        if (!alertType || !alertSeverity || !title || !description) {
          return NextResponse.json(
            { error: 'Alert type, severity, title, and description required' },
            { status: 400 }
          )
        }

        // Verify permission to create alert for organization
        if (affectedOrganizationId) {
          const hasAccess = await hasOrgAdminAccess(userId, affectedOrganizationId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const { data: alertData, error: alertError } = await supabase.rpc('create_security_alert', {
          p_alert_type: alertType,
          p_severity: alertSeverity,
          p_title: title,
          p_description: description,
          p_affected_user_id: affectedUserId || null,
          p_affected_organization_id: affectedOrganizationId || null,
          p_source_ip: clientIP,
          p_detection_data: detectionData
        })

        if (alertError) throw alertError

        // Log alert creation
        await auditLogger.logEvent({
          userId,
          operation: 'security_alert_created',
          resourceType: 'security_alert',
          resourceId: alertData,
          organizationId: affectedOrganizationId,
          severity: 'medium',
          outcome: 'success',
          metadata: {
            alertType,
            alertSeverity,
            title
          },
          ipAddress: clientIP,
          userAgent
        })

        return NextResponse.json({
          success: true,
          alertId: alertData,
          message: 'Security alert created successfully'
        })

      case 'resolve-alert':
        // Resolve a security alert
        const { alertId, resolution, notes } = data

        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID required' },
            { status: 400 }
          )
        }

        // Get alert to verify permissions
        const { data: alert, error: getAlertError } = await supabase
          .from('security_alerts')
          .select('affected_organization_id, affected_user_id')
          .eq('id', alertId)
          .single()

        if (getAlertError) throw getAlertError
        if (!alert) {
          return NextResponse.json(
            { error: 'Alert not found' },
            { status: 404 }
          )
        }

        // Verify permissions
        let hasPermission = false
        if (alert.affected_organization_id) {
          hasPermission = await hasOrgAdminAccess(userId, alert.affected_organization_id)
        } else if (alert.affected_user_id === userId) {
          hasPermission = true
        }

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }

        // Update alert
        const { error: updateError } = await supabase
          .from('security_alerts')
          .update({
            status: resolution || 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
            resolution_notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', alertId)

        if (updateError) throw updateError

        // Log alert resolution
        await auditLogger.logEvent({
          userId,
          operation: 'security_alert_resolved',
          resourceType: 'security_alert',
          resourceId: alertId,
          organizationId: alert.affected_organization_id,
          severity: 'low',
          outcome: 'success',
          metadata: {
            resolution: resolution || 'resolved',
            notes
          },
          ipAddress: clientIP,
          userAgent
        })

        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Security audit POST API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}