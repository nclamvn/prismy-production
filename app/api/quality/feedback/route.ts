/**
 * QUALITY FEEDBACK API
 * Endpoints for submitting and managing user feedback
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { qualityEngine } from '@/lib/quality-control/quality-engine'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

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

    // Apply rate limiting for feedback submissions
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
      documentId,
      type,
      rating,
      feedback,
      categories = [],
      severity,
      suggestedImprovement,
      metadata = {}
    } = body

    // Validate required fields
    if (!type || !rating || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: type, rating, feedback' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const validTypes = ['translation', 'document_analysis', 'feature', 'bug_report']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    logger.info(`Feedback submission from user ${session.user.id}`, {
      type,
      rating,
      categories,
      severity
    })

    // Get user agent and platform info
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const platform = userAgent.includes('Mobile') ? 'mobile' : 'desktop'

    // Submit feedback to quality engine
    const feedbackId = await qualityEngine.submitFeedback({
      translationId,
      documentId,
      userId: session.user.id,
      type: type as any,
      rating,
      feedback,
      categories,
      severity: severity as any,
      suggestedImprovement,
      metadata: {
        ...metadata,
        userTier,
        platform,
        userAgent,
        timestamp: Date.now()
      }
    })

    // Store feedback in database
    await supabase
      .from('quality_feedback')
      .insert({
        id: feedbackId,
        user_id: session.user.id,
        translation_id: translationId,
        document_id: documentId,
        feedback_type: type,
        rating,
        feedback_text: feedback,
        categories: categories,
        severity,
        suggested_improvement: suggestedImprovement,
        user_tier: userTier,
        platform,
        metadata: {
          ...metadata,
          userAgent
        }
      })

    // Send acknowledgment notification to user
    // Note: In a real implementation, this might trigger an email or in-app notification
    logger.info(`Feedback ${feedbackId} submitted successfully`)

    return NextResponse.json({
      success: true,
      feedbackId,
      message: 'Thank you for your feedback! We will use it to improve our service.'
    })

  } catch (error) {
    logger.error('Feedback submission failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

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
    const feedbackId = searchParams.get('id')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (feedbackId) {
      // Get specific feedback
      const feedback = qualityEngine.getFeedback(feedbackId)
      if (!feedback) {
        return NextResponse.json(
          { error: 'Feedback not found' },
          { status: 404 }
        )
      }

      // Check if user owns this feedback or is admin
      if (feedback.userId !== session.user.id) {
        // Check if user is admin
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
        feedback
      })
    }

    // Build query
    let query = supabase
      .from('quality_feedback')
      .select('*')
      .eq('user_id', session.user.id)

    if (type) {
      query = query.eq('feedback_type', type)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: feedback, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      feedback: feedback || [],
      pagination: {
        limit,
        offset,
        hasMore: (feedback || []).length === limit
      }
    })

  } catch (error) {
    logger.error('Failed to get feedback:', error)
    return NextResponse.json(
      { error: 'Failed to get feedback' },
      { status: 500 }
    )
  }
}