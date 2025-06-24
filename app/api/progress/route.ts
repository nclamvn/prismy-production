/**
 * TRANSLATION PROGRESS API
 * Real-time progress tracking endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { translationProgressTracker } from '@/lib/progress/translation-progress-tracker'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

// Subscribe to Progress Updates
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user tier for rate limiting
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', session.user.id)
      .single()

    const userTier = profile?.subscription_tier || 'free'

    // Apply rate limiting
    const rateLimitResult = await getRateLimitForTier(request, userTier as any)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { 
      translationId,
      channels = ['websocket'],
      filters = {}
    } = body

    if (!translationId) {
      return NextResponse.json(
        { error: 'Translation ID is required' },
        { status: 400 }
      )
    }

    logger.info(`Subscribing to progress updates`, {
      userId: session.user.id,
      translationId,
      channels
    })

    // Subscribe to progress updates
    const subscriptionId = await translationProgressTracker.subscribe(
      translationId,
      session.user.id,
      channels,
      filters
    )

    return NextResponse.json({
      success: true,
      subscriptionId,
      message: 'Successfully subscribed to progress updates'
    })

  } catch (error) {
    logger.error('Failed to subscribe to progress updates:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to progress updates' },
      { status: 500 }
    )
  }
}

// Get Progress Information
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const translationId = searchParams.get('translationId')
    const action = searchParams.get('action')

    if (translationId) {
      if (action === 'current') {
        // Get current progress for a specific translation
        const progress = await translationProgressTracker.getProgress(translationId)
        
        if (!progress) {
          return NextResponse.json(
            { error: 'Translation progress not found' },
            { status: 404 }
          )
        }

        // Check if user has access to this translation
        if (progress.userId !== session.user.id) {
          // Check if user is admin or has workspace access
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()

          if (profile?.role !== 'admin') {
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            )
          }
        }

        return NextResponse.json({
          success: true,
          progress
        })
      }

      if (action === 'analytics') {
        // Get analytics for a specific translation
        const progress = await translationProgressTracker.getProgress(translationId)
        
        if (!progress || progress.userId !== session.user.id) {
          return NextResponse.json(
            { error: 'Translation not found or access denied' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          analytics: {
            duration: progress.progress.completedAt 
              ? progress.progress.completedAt.getTime() - progress.progress.startedAt.getTime()
              : Date.now() - progress.progress.startedAt.getTime(),
            processingSpeed: progress.performance.processingSpeed,
            quality: progress.quality,
            errors: progress.errors.length,
            warnings: progress.warnings.length,
            steps: progress.steps.map(step => ({
              name: step.name,
              status: step.status,
              duration: step.duration,
              progress: step.progress
            }))
          }
        })
      }
    }

    if (action === 'user') {
      // Get all progress for the current user
      const limit = parseInt(searchParams.get('limit') || '10')
      const userProgress = await translationProgressTracker.getUserProgress(session.user.id, limit)
      
      return NextResponse.json({
        success: true,
        progress: userProgress
      })
    }

    if (action === 'history') {
      // Get progress history for the current user
      const limit = parseInt(searchParams.get('limit') || '20')
      const history = await translationProgressTracker.getProgressHistory(session.user.id, limit)
      
      return NextResponse.json({
        success: true,
        history
      })
    }

    if (action === 'analytics') {
      // Get progress analytics for the current user
      const analytics = await translationProgressTracker.getProgressAnalytics(session.user.id)
      
      return NextResponse.json({
        success: true,
        analytics
      })
    }

    if (action === 'global_analytics') {
      // Check admin access for global analytics
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }

      const analytics = await translationProgressTracker.getProgressAnalytics()
      
      return NextResponse.json({
        success: true,
        analytics
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    )

  } catch (error) {
    logger.error('Failed to get progress information:', error)
    return NextResponse.json(
      { error: 'Failed to get progress information' },
      { status: 500 }
    )
  }
}

// Update Progress (Internal API for translation services)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      translationId,
      updates,
      apiKey
    } = body

    // Verify internal API key
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    if (!translationId || !updates) {
      return NextResponse.json(
        { error: 'Translation ID and updates are required' },
        { status: 400 }
      )
    }

    const success = await translationProgressTracker.updateProgress(translationId, updates)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Translation not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully'
    })

  } catch (error) {
    logger.error('Failed to update progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

// Unsubscribe from Progress Updates
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    const success = await translationProgressTracker.unsubscribe(subscriptionId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from progress updates'
    })

  } catch (error) {
    logger.error('Failed to unsubscribe from progress updates:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}