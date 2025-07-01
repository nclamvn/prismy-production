/**
 * PRISMY ALERTS API
 * RESTful API for alert management and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { alertManager } from '@/lib/error-tracking/alert-manager'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')
    const severity = searchParams.get('severity')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get alerts with filters
    let alerts = alertManager.getAlerts(
      resolved === 'true' ? true : resolved === 'false' ? false : undefined
    )

    // Apply additional filters
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }

    if (category) {
      alerts = alerts.filter(alert => alert.category === category)
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedAlerts = alerts.slice(offset, offset + limit)

    // Get summary statistics
    const stats = {
      total: alerts.length,
      active: alerts.filter(a => !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      bySeverity: {
        low: alerts.filter(a => a.severity === 'low').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        high: alerts.filter(a => a.severity === 'high').length,
        critical: alerts.filter(a => a.severity === 'critical').length,
      },
      byCategory: {
        error: alerts.filter(a => a.category === 'error').length,
        performance: alerts.filter(a => a.category === 'performance').length,
        security: alerts.filter(a => a.category === 'security').length,
        business: alerts.filter(a => a.category === 'business').length,
        infrastructure: alerts.filter(a => a.category === 'infrastructure').length,
      }
    }

    return NextResponse.json({
      alerts: paginatedAlerts,
      pagination: {
        limit,
        offset,
        total: alerts.length,
        hasMore: offset + limit < alerts.length
      },
      stats
    })

  } catch (error) {
    logger.error('Failed to fetch alerts', { error })
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, message, severity, category, metadata } = body

    // Validate required fields
    if (!title || !message || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, severity' },
        { status: 400 }
      )
    }

    // Validate severity
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be: low, medium, high, or critical' },
        { status: 400 }
      )
    }

    // Validate category
    if (category && !['error', 'performance', 'security', 'business', 'infrastructure'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be: error, performance, security, business, or infrastructure' },
        { status: 400 }
      )
    }

    // Create alert
    const alertId = await alertManager.createAlert(
      title,
      message,
      severity,
      category || 'error',
      metadata
    )

    const alert = alertManager.getAlert(alertId)

    logger.info('Alert created via API', { alertId, title, severity })

    return NextResponse.json({
      success: true,
      alertId,
      alert
    }, { status: 201 })

  } catch (error) {
    logger.error('Failed to create alert', { error })
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json(
        { error: 'Missing alert ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action, resolvedBy } = body

    if (action === 'resolve') {
      const success = await alertManager.resolveAlert(alertId, resolvedBy)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Alert not found or already resolved' },
          { status: 404 }
        )
      }

      const alert = alertManager.getAlert(alertId)
      
      logger.info('Alert resolved via API', { alertId, resolvedBy })

      return NextResponse.json({
        success: true,
        alert
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: resolve' },
      { status: 400 }
    )

  } catch (error) {
    logger.error('Failed to update alert', { error })
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}