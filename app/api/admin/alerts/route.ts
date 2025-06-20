import { NextRequest, NextResponse } from 'next/server'
import { alertingSystem } from '@/lib/alerting-system'
import { withLogging } from '@/middleware/logging'
import { logger } from '@/lib/logger'

/**
 * @swagger
 * /api/admin/alerts:
 *   get:
 *     summary: Get alerts
 *     description: Retrieve alerts with optional filtering
 *     tags: [Admin, Alerts]
 *     parameters:
 *       - name: type
 *         in: query
 *         description: Filter by alert type
 *         schema:
 *           type: string
 *           enum: [performance, security, error_rate, system_health, business_metric, cache_failure, database_issue, payment_failure]
 *       - name: severity
 *         in: query
 *         description: Filter by severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - name: active
 *         in: query
 *         description: Show only active alerts
 *         schema:
 *           type: boolean
 *       - name: timeRange
 *         in: query
 *         description: Time range in hours
 *         schema:
 *           type: number
 *           default: 24
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 statistics:
 *                   type: object
 *                 total:
 *                   type: number
 *   post:
 *     summary: Create manual alert
 *     description: Create a manual alert for testing or administrative purposes
 *     tags: [Admin, Alerts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, severity, title, message]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [performance, security, error_rate, system_health, business_metric, cache_failure, database_issue, payment_failure]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Alert created successfully
 *       400:
 *         description: Invalid request parameters
 */

export const GET = withLogging(async (request: NextRequest) => {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') as any
    const severity = url.searchParams.get('severity') as any
    const activeOnly = url.searchParams.get('active') === 'true'
    const timeRange = parseInt(url.searchParams.get('timeRange') || '24')

    const filters: any = {}
    if (type) filters.type = type
    if (severity) filters.severity = severity

    const alerts = activeOnly 
      ? alertingSystem.getActiveAlerts(filters)
      : alertingSystem.getAlertHistory(timeRange * 60 * 60 * 1000, true)

    const statistics = alertingSystem.getStatistics(timeRange * 60 * 60 * 1000)

    return NextResponse.json({
      alerts,
      statistics,
      total: alerts.length,
      filters: {
        type,
        severity,
        activeOnly,
        timeRange
      },
      timestamp: Date.now()
    })

  } catch (error) {
    logger.error({ error }, 'Failed to retrieve alerts')
    return NextResponse.json(
      { error: 'Failed to retrieve alerts' },
      { status: 500 }
    )
  }
})

export const POST = withLogging(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { type, severity, title, message, metadata = {} } = body

    // Validate required fields
    if (!type || !severity || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, severity, title, message' },
        { status: 400 }
      )
    }

    // Validate enum values
    const validTypes = ['performance', 'security', 'error_rate', 'system_health', 'business_metric', 'cache_failure', 'database_issue', 'payment_failure']
    const validSeverities = ['low', 'medium', 'high', 'critical']

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      )
    }

    // Create the alert
    const alert = await alertingSystem.triggerAlert(
      type,
      severity,
      title,
      message,
      {
        ...metadata,
        manual: true,
        createdBy: 'admin_api'
      },
      'api_gateway'
    )

    if (!alert) {
      return NextResponse.json(
        { error: 'Failed to create alert (possibly rate limited)' },
        { status: 429 }
      )
    }

    logger.info({ alert }, 'Manual alert created via API')

    return NextResponse.json(
      { 
        success: true,
        alert,
        message: 'Alert created successfully'
      },
      { status: 201 }
    )

  } catch (error) {
    logger.error({ error }, 'Failed to create alert')
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
})

/**
 * @swagger
 * /api/admin/alerts/{alertId}/resolve:
 *   patch:
 *     summary: Resolve an alert
 *     description: Mark an alert as resolved
 *     tags: [Admin, Alerts]
 *     parameters:
 *       - name: alertId
 *         in: path
 *         required: true
 *         description: ID of the alert to resolve
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolvedBy:
 *                 type: string
 *                 description: Name or ID of the person resolving the alert
 *               notes:
 *                 type: string
 *                 description: Optional resolution notes
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 *       404:
 *         description: Alert not found
 */

export const PATCH = withLogging(async (request: NextRequest) => {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const alertId = pathParts[pathParts.length - 2] // Get alertId from path

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { resolvedBy, notes } = body

    const resolved = await alertingSystem.resolveAlert(alertId, resolvedBy)

    if (!resolved) {
      return NextResponse.json(
        { error: 'Alert not found or already resolved' },
        { status: 404 }
      )
    }

    logger.info({ 
      alertId, 
      resolvedBy, 
      notes 
    }, 'Alert resolved via API')

    return NextResponse.json({
      success: true,
      message: 'Alert resolved successfully',
      alertId,
      resolvedBy,
      resolvedAt: Date.now()
    })

  } catch (error) {
    logger.error({ error }, 'Failed to resolve alert')
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    )
  }
})