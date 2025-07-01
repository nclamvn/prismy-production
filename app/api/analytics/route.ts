import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { MetricsEngine } from '@/lib/analytics/metrics-engine'
import { createRouteHandlerClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const supabase = createRouteHandlerClient({ cookies })
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null
    return user.id
  } catch (error) {
    logger.error('Failed to get user from request', { error })
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const metricsEngine = MetricsEngine.getInstance()

    switch (action) {
      case 'metrics':
        // Get available metrics
        const category = searchParams.get('category')
        let metrics = metricsEngine.getAllMetricDefinitions()
        
        if (category) {
          metrics = metrics.filter(m => m.category === category)
        }

        return NextResponse.json({
          success: true,
          metrics
        })

      case 'query':
        // Execute analytics query
        const metricsParam = searchParams.get('metrics')
        const dimensionsParam = searchParams.get('dimensions')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const granularity = searchParams.get('granularity') as 'hour' | 'day' | 'week' | 'month'
        const organizationId = searchParams.get('organizationId')

        if (!metricsParam || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Missing required parameters: metrics, startDate, endDate' },
            { status: 400 }
          )
        }

        const queryMetrics = metricsParam.split(',')
        const queryDimensions = dimensionsParam ? dimensionsParam.split(',') : []

        const analyticsQuery = {
          metrics: queryMetrics,
          dimensions: queryDimensions,
          dateRange: {
            start: new Date(startDate),
            end: new Date(endDate)
          },
          granularity: granularity || 'day',
          organizationId,
          userId
        }

        // Validate organization access
        if (organizationId) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

          if (!membership) {
            return NextResponse.json(
              { error: 'No access to organization analytics' },
              { status: 403 }
            )
          }
        }

        const queryResult = await metricsEngine.executeAnalyticsQuery(analyticsQuery)

        return NextResponse.json({
          success: true,
          ...queryResult
        })

      case 'dashboards':
        // Get user's dashboards
        const orgId = searchParams.get('organizationId')
        let dashboardQuery = supabase
          .from('analytics_dashboards')
          .select('*')
          .or(`user_id.eq.${userId},is_public.eq.true`)

        if (orgId) {
          // Include organization dashboards
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

          if (membership) {
            dashboardQuery = dashboardQuery.or(`organization_id.eq.${orgId}`)
          }
        }

        const { data: dashboards, error } = await dashboardQuery.order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          success: true,
          dashboards
        })

      case 'insights':
        // Get data insights
        const insightOrgId = searchParams.get('organizationId')
        const days = parseInt(searchParams.get('days') || '30')

        if (!insightOrgId) {
          return NextResponse.json(
            { error: 'Organization ID required for insights' },
            { status: 400 }
          )
        }

        // Verify organization access
        const { data: orgMembership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', insightOrgId)
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()

        if (!orgMembership) {
          return NextResponse.json(
            { error: 'No access to organization insights' },
            { status: 403 }
          )
        }

        const dateRange = {
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          end: new Date()
        }

        const insights = await metricsEngine.generateInsights(insightOrgId, dateRange)

        // Also get stored insights from database
        const { data: storedInsights } = await supabase
          .from('data_insights')
          .select('*')
          .eq('organization_id', insightOrgId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(10)

        return NextResponse.json({
          success: true,
          insights: insights.insights,
          storedInsights: storedInsights || []
        })

      case 'usage':
        // Get usage analytics
        const usageOrgId = searchParams.get('organizationId')
        const usageDays = parseInt(searchParams.get('days') || '7')
        
        let usageQuery = supabase
          .from('usage_analytics')
          .select('*')
          .gte('created_at', new Date(Date.now() - usageDays * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1000)

        if (usageOrgId) {
          // Verify organization access
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', usageOrgId)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

          if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json(
              { error: 'Insufficient permissions for usage analytics' },
              { status: 403 }
            )
          }

          usageQuery = usageQuery.eq('organization_id', usageOrgId)
        } else {
          usageQuery = usageQuery.eq('user_id', userId)
        }

        const { data: usageData, error: usageError } = await usageQuery

        if (usageError) throw usageError

        return NextResponse.json({
          success: true,
          usage: usageData
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Analytics GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process analytics request' },
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

    const metricsEngine = MetricsEngine.getInstance()

    switch (action) {
      case 'create_dashboard':
        // Create new dashboard
        const { name, description, widgets, isPublic, organizationId } = data

        if (!name || !widgets) {
          return NextResponse.json(
            { error: 'Missing required fields: name, widgets' },
            { status: 400 }
          )
        }

        // Validate organization access if provided
        if (organizationId) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

          if (!membership) {
            return NextResponse.json(
              { error: 'No access to specified organization' },
              { status: 403 }
            )
          }
        }

        const dashboardId = await metricsEngine.createDashboard({
          name,
          description,
          widgets,
          isPublic: isPublic || false,
          organizationId,
          userId
        })

        return NextResponse.json({
          success: true,
          dashboardId
        })

      case 'track_event':
        // Track usage event
        const { eventType, resourceType, resourceId, properties, organizationId: eventOrgId } = data

        if (!eventType) {
          return NextResponse.json(
            { error: 'Event type required' },
            { status: 400 }
          )
        }

        // Get client IP and user agent
        const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        const userAgent = request.headers.get('user-agent')

        await supabase.rpc('track_usage_event', {
          p_user_id: userId,
          p_organization_id: eventOrgId,
          p_event_type: eventType,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_properties: properties || {},
          p_session_id: null, // Could be extracted from request
          p_ip_address: clientIP,
          p_user_agent: userAgent
        })

        return NextResponse.json({
          success: true,
          message: 'Event tracked successfully'
        })

      case 'record_metric':
        // Record performance metric
        const { metricName, metricValue, metricUnit, dimensions, serviceName, endpoint } = data

        if (!metricName || metricValue === undefined) {
          return NextResponse.json(
            { error: 'Metric name and value required' },
            { status: 400 }
          )
        }

        await supabase.rpc('record_performance_metric', {
          p_metric_name: metricName,
          p_metric_value: metricValue,
          p_metric_unit: metricUnit,
          p_dimensions: dimensions || {},
          p_service_name: serviceName,
          p_endpoint: endpoint
        })

        return NextResponse.json({
          success: true,
          message: 'Metric recorded successfully'
        })

      case 'mark_insight_read':
        // Mark insight as read
        const { insightId } = data

        if (!insightId) {
          return NextResponse.json(
            { error: 'Insight ID required' },
            { status: 400 }
          )
        }

        const { error: markError } = await supabase
          .from('data_insights')
          .update({ is_read: true })
          .eq('id', insightId)

        if (markError) throw markError

        return NextResponse.json({
          success: true,
          message: 'Insight marked as read'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Analytics POST API error', { error })
    return NextResponse.json(
      { error: 'Failed to process analytics request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { dashboardId, ...updates } = body

    if (!dashboardId) {
      return NextResponse.json(
        { error: 'Dashboard ID required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the dashboard or has organization access
    const { data: dashboard } = await supabase
      .from('analytics_dashboards')
      .select('user_id, organization_id')
      .eq('id', dashboardId)
      .single()

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    let hasPermission = dashboard.user_id === userId

    if (dashboard.organization_id && !hasPermission) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', dashboard.organization_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      hasPermission = membership && ['owner', 'admin'].includes(membership.role)
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No permission to modify this dashboard' },
        { status: 403 }
      )
    }

    // Update dashboard
    const { error } = await supabase
      .from('analytics_dashboards')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', dashboardId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Dashboard updated successfully'
    })

  } catch (error) {
    logger.error('Analytics PUT API error', { error })
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboardId = searchParams.get('dashboardId')

    if (!dashboardId) {
      return NextResponse.json(
        { error: 'Dashboard ID required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the dashboard
    const { data: dashboard } = await supabase
      .from('analytics_dashboards')
      .select('user_id, organization_id')
      .eq('id', dashboardId)
      .single()

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    let hasPermission = dashboard.user_id === userId

    if (dashboard.organization_id && !hasPermission) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', dashboard.organization_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      hasPermission = membership && ['owner', 'admin'].includes(membership.role)
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No permission to delete this dashboard' },
        { status: 403 }
      )
    }

    // Delete dashboard
    const { error } = await supabase
      .from('analytics_dashboards')
      .delete()
      .eq('id', dashboardId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Dashboard deleted successfully'
    })

  } catch (error) {
    logger.error('Analytics DELETE API error', { error })
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    )
  }
}