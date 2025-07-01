import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/performance/performance-monitor'
import { queryOptimizer } from '@/lib/performance/query-optimizer'
import { cacheManager } from '@/lib/cache/cache-manager'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
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

// Helper function to check organization access
async function hasOrgAccess(userId: string, organizationId: string, requiredRoles: string[] = ['owner', 'admin']): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return membership && requiredRoles.includes(membership.role)
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
      case 'stats':
        // Get performance statistics
        const performanceStats = performanceMonitor.getStats()
        const queryStats = queryOptimizer.getQueryStats()
        const cacheStats = cacheManager.getStats()

        return NextResponse.json({
          success: true,
          stats: {
            performance: performanceStats,
            queries: queryStats,
            cache: cacheStats
          }
        })

      case 'report':
        // Generate performance report
        const organizationId = searchParams.get('organizationId')
        const days = parseInt(searchParams.get('days') || '7')

        // Verify organization access if specified
        if (organizationId) {
          const hasAccess = await hasOrgAccess(userId, organizationId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

        const report = await performanceMonitor.getPerformanceReport({
          start: startDate,
          end: endDate
        })

        return NextResponse.json({
          success: true,
          report
        })

      case 'alerts':
        // Get performance alerts
        const alerts = performanceMonitor.getAlerts()

        return NextResponse.json({
          success: true,
          alerts
        })

      case 'optimization-report':
        // Get query optimization report
        const optimizationReport = await queryOptimizer.generateOptimizationReport()

        return NextResponse.json({
          success: true,
          report: optimizationReport
        })

      case 'index-suggestions':
        // Get database index suggestions
        const suggestionsOrgId = searchParams.get('organizationId')

        // Verify organization access if specified
        if (suggestionsOrgId) {
          const hasAccess = await hasOrgAccess(userId, suggestionsOrgId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const indexSuggestions = await queryOptimizer.getIndexSuggestions(suggestionsOrgId)

        return NextResponse.json({
          success: true,
          suggestions: indexSuggestions
        })

      case 'cache-keys':
        // Get cache keys (admin only)
        const pattern = searchParams.get('pattern')
        const keys = cacheManager.getKeys(pattern || undefined)

        return NextResponse.json({
          success: true,
          keys: keys.slice(0, 100) // Limit to first 100 keys
        })

      case 'metrics':
        // Get detailed metrics
        const metricsOrgId = searchParams.get('organizationId')
        const metricName = searchParams.get('metric')
        const metricDays = parseInt(searchParams.get('days') || '1')

        // Verify organization access if specified
        if (metricsOrgId) {
          const hasAccess = await hasOrgAccess(userId, metricsOrgId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const metricsEndDate = new Date()
        const metricsStartDate = new Date(metricsEndDate.getTime() - metricDays * 24 * 60 * 60 * 1000)

        const supabase = createRouteHandlerClient({ cookies })
        let metricsQuery = supabase
          .from('performance_metrics')
          .select('*')
          .gte('recorded_at', metricsStartDate.toISOString())
          .lte('recorded_at', metricsEndDate.toISOString())
          .order('recorded_at', { ascending: false })
          .limit(1000)

        if (metricName) {
          metricsQuery = metricsQuery.eq('metric_name', metricName)
        }

        const { data: metrics, error: metricsError } = await metricsQuery

        if (metricsError) throw metricsError

        return NextResponse.json({
          success: true,
          metrics: metrics || []
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Performance API GET error', { error })
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

    switch (action) {
      case 'record-metric':
        // Record a custom performance metric
        const { name, value, unit = 'count', tags = {}, dimensions = {} } = data

        if (!name || value === undefined) {
          return NextResponse.json(
            { error: 'Metric name and value are required' },
            { status: 400 }
          )
        }

        performanceMonitor.recordMetric({
          name,
          value,
          unit,
          tags: { ...tags, user_id: userId },
          dimensions
        })

        return NextResponse.json({
          success: true,
          message: 'Metric recorded successfully'
        })

      case 'optimize-query':
        // Optimize a database query
        const { query, params } = data

        if (!query) {
          return NextResponse.json(
            { error: 'Query is required' },
            { status: 400 }
          )
        }

        const optimization = await queryOptimizer.optimizeQuery(query, params)

        return NextResponse.json({
          success: true,
          optimization
        })

      case 'execute-optimized-query':
        // Execute an optimized query
        const { 
          query: executeQuery, 
          params: executeParams, 
          cacheTTL, 
          tags: executeTags,
          maxCacheSize 
        } = data

        if (!executeQuery) {
          return NextResponse.json(
            { error: 'Query is required' },
            { status: 400 }
          )
        }

        const result = await queryOptimizer.executeOptimizedQuery(
          executeQuery,
          executeParams,
          { cacheTTL, tags: executeTags, maxCacheSize }
        )

        return NextResponse.json({
          success: true,
          result
        })

      case 'clear-cache':
        // Clear cache (admin operation)
        const { pattern: clearPattern, tags: clearTags } = data

        if (clearTags && Array.isArray(clearTags)) {
          const invalidated = await cacheManager.invalidateByTags(clearTags)
          
          return NextResponse.json({
            success: true,
            message: `Invalidated ${invalidated} cache entries by tags`,
            invalidated
          })
        } else if (clearPattern === '*') {
          await cacheManager.clear()
          
          return NextResponse.json({
            success: true,
            message: 'All cache cleared'
          })
        } else {
          return NextResponse.json(
            { error: 'Specify tags array or pattern "*" for full clear' },
            { status: 400 }
          )
        }

      case 'set-threshold':
        // Set performance threshold
        const { metric, warning, critical } = data

        if (!metric || warning === undefined || critical === undefined) {
          return NextResponse.json(
            { error: 'Metric name, warning, and critical thresholds are required' },
            { status: 400 }
          )
        }

        performanceMonitor.setThreshold(metric, warning, critical)

        return NextResponse.json({
          success: true,
          message: `Threshold set for ${metric}`
        })

      case 'warmup-cache':
        // Warm up cache with common data
        const { entries } = data

        if (!Array.isArray(entries)) {
          return NextResponse.json(
            { error: 'Entries array is required' },
            { status: 400 }
          )
        }

        await cacheManager.warmup(entries)

        return NextResponse.json({
          success: true,
          message: `Cache warmed up with ${entries.length} entries`
        })

      case 'clear-alert':
        // Clear a performance alert
        const { alertId } = data

        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }

        performanceMonitor.clearAlert(alertId)

        return NextResponse.json({
          success: true,
          message: 'Alert cleared'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Performance API POST error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
      case 'cache-key':
        // Delete specific cache key
        const key = searchParams.get('key')

        if (!key) {
          return NextResponse.json(
            { error: 'Cache key is required' },
            { status: 400 }
          )
        }

        const deleted = await cacheManager.delete(key)

        return NextResponse.json({
          success: true,
          deleted,
          message: deleted ? 'Cache key deleted' : 'Cache key not found'
        })

      case 'old-metrics':
        // Delete old performance metrics (admin operation)
        const days = parseInt(searchParams.get('days') || '30')
        
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        
        const supabase = createRouteHandlerClient({ cookies })
        const { error } = await supabase
          .from('performance_metrics')
          .delete()
          .lt('recorded_at', cutoffDate.toISOString())

        if (error) throw error

        return NextResponse.json({
          success: true,
          message: `Deleted metrics older than ${days} days`
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Performance API DELETE error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}