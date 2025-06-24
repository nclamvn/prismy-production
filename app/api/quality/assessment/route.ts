/**
 * QUALITY ASSESSMENT API
 * Endpoints for quality control assessments and feedback
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
      sourceText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      metadata = {}
    } = body

    // Validate required fields
    if (!translationId || !sourceText || !translatedText || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    logger.info(`Quality assessment requested for translation ${translationId}`, {
      userId: session.user.id,
      sourceLanguage,
      targetLanguage,
      textLength: sourceText.length
    })

    // Perform quality assessment
    const assessment = await qualityEngine.assessTranslationQuality(
      translationId,
      sourceText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      {
        ...metadata,
        userId: session.user.id,
        userTier
      }
    )

    // Store assessment in database
    await supabase
      .from('quality_assessments')
      .insert({
        id: assessment.id,
        translation_id: translationId,
        user_id: session.user.id,
        assessment_type: assessment.type,
        overall_score: assessment.metrics.overallScore,
        accuracy_score: assessment.metrics.accuracy,
        fluency_score: assessment.metrics.fluency,
        consistency_score: assessment.metrics.consistency,
        completeness_score: assessment.metrics.completeness,
        context_relevance_score: assessment.metrics.contextRelevance,
        issues_found: assessment.issues.length,
        suggestions_count: assessment.suggestions.length,
        confidence: assessment.confidence,
        assessment_data: {
          metrics: assessment.metrics,
          issues: assessment.issues,
          suggestions: assessment.suggestions
        }
      })

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        metrics: assessment.metrics,
        issues: assessment.issues,
        suggestions: assessment.suggestions,
        confidence: assessment.confidence
      }
    })

  } catch (error) {
    logger.error('Quality assessment failed:', error)
    return NextResponse.json(
      { error: 'Failed to perform quality assessment' },
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
    const assessmentId = searchParams.get('id')
    const translationId = searchParams.get('translationId')

    if (assessmentId) {
      // Get specific assessment
      const assessment = qualityEngine.getAssessment(assessmentId)
      if (!assessment) {
        return NextResponse.json(
          { error: 'Assessment not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        assessment
      })
    }

    if (translationId) {
      // Get assessments for a translation
      const { data: assessments } = await supabase
        .from('quality_assessments')
        .select('*')
        .eq('translation_id', translationId)
        .order('created_at', { ascending: false })

      return NextResponse.json({
        success: true,
        assessments: assessments || []
      })
    }

    // Get user's recent assessments
    const { data: assessments } = await supabase
      .from('quality_assessments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      assessments: assessments || []
    })

  } catch (error) {
    logger.error('Failed to get quality assessments:', error)
    return NextResponse.json(
      { error: 'Failed to get assessments' },
      { status: 500 }
    )
  }
}