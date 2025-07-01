import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import {
  databaseOptimizer,
  backgroundJobProcessor,
} from '@/lib/database-optimizer'

/**
 * DATABASE OPTIMIZATION API - PHASE 1.2
 * Enterprise database performance monitoring and optimization
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication and admin role
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For now, allow all authenticated users - in production, restrict to admins
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'health':
        const health = await databaseOptimizer.getDatabaseHealth()
        return NextResponse.json({
          success: true,
          ...health,
          timestamp: new Date().toISOString(),
        })

      case 'warm-cache':
        const jobId = await backgroundJobProcessor.queueJob('cache_warming', {
          requestedBy: session.user.id,
        })

        return NextResponse.json({
          success: true,
          message: 'Cache warming job queued',
          jobId,
          status:
            'Background job started - check status with /api/admin/jobs/{jobId}',
        })

      case 'user-analytics':
        const userId = url.searchParams.get('userId')
        const timeRange =
          (url.searchParams.get('timeRange') as '24h' | '7d' | '30d') || '24h'

        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter is required for user analytics' },
            { status: 400 }
          )
        }

        const analytics = await databaseOptimizer.getUserAnalyticsOptimized(
          userId,
          timeRange
        )
        return NextResponse.json({
          success: true,
          analytics,
          optimizations: {
            cached: true,
            queryTime: 'Optimized with intelligent caching',
            batchQueries: 'Multiple queries executed in parallel',
          },
        })

      default:
        return NextResponse.json({
          success: true,
          message: 'Database Optimization API - Phase 1.2',
          availableActions: [
            'health - Get database performance metrics and optimization suggestions',
            'warm-cache - Queue background job to warm database caches',
            'user-analytics - Get optimized user analytics with intelligent caching',
          ],
          example: '/api/admin/database/optimize?action=health',
        })
    }
  } catch (error) {
    console.error('Database optimization API error:', error)
    return NextResponse.json(
      {
        error: 'Database optimization operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, payload } = body

    switch (action) {
      case 'optimize-user-profile':
        const { userId } = payload
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required' },
            { status: 400 }
          )
        }

        const profile = await databaseOptimizer.getUserProfileOptimized(userId)
        return NextResponse.json({
          success: true,
          profile,
          optimizations: {
            cached: 'User profile cached for 10 minutes',
            minimalFields: 'Only essential fields retrieved',
            singleQuery: 'Optimized single query execution',
          },
        })

      case 'queue-large-processing':
        const { fileSize, chunks, userId: processingUserId } = payload

        const jobId = await backgroundJobProcessor.queueJob(
          'large_document_processing',
          {
            size: fileSize,
            chunks,
            userId: processingUserId,
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Large document processing job queued',
          jobId,
          estimatedTime: `${Math.ceil(chunks / 5)} minutes`,
          status: 'Job queued for background processing',
        })

      case 'generate-analytics':
        const { userId: analyticsUserId, timeRange: analyticsTimeRange } =
          payload

        const analyticsJobId = await backgroundJobProcessor.queueJob(
          'analytics_generation',
          {
            userId: analyticsUserId,
            timeRange: analyticsTimeRange || '24h',
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Analytics generation job queued',
          jobId: analyticsJobId,
          status: 'Comprehensive analytics being generated in background',
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Database optimization POST error:', error)
    return NextResponse.json(
      {
        error: 'Database optimization operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
