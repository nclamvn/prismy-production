/**
 * QUALITY ANALYTICS API
 * Endpoints for quality metrics, trends, and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { qualityEngine } from '@/lib/quality-control/quality-engine'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

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

    // Check if user has access to analytics (admin or premium user)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, subscription_tier')
      .eq('user_id', session.user.id)
      .single()

    const userRole = profile?.role
    const userTier = profile?.subscription_tier || 'free'

    if (userRole !== 'admin' && !['premium', 'enterprise'].includes(userTier)) {
      return NextResponse.json(
        { error: 'Analytics access requires premium subscription or admin role' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const period = searchParams.get('period') || 'week'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    logger.info(`Quality analytics requested`, {
      userId: session.user.id,
      type,
      period,
      userRole
    })

    switch (type) {
      case 'overview':
        return await handleOverviewAnalytics(session.user.id, userRole)
      
      case 'trends':
        return await handleTrendsAnalytics(period, startDate, endDate, session.user.id, userRole)
      
      case 'feedback':
        return await handleFeedbackAnalytics(session.user.id, userRole, supabase)
      
      case 'performance':
        return await handlePerformanceAnalytics(session.user.id, userRole, supabase)
      
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Quality analytics failed:', error)
    return NextResponse.json(
      { error: 'Failed to get quality analytics' },
      { status: 500 }
    )
  }
}

async function handleOverviewAnalytics(userId: string, userRole?: string) {
  const statistics = qualityEngine.getQualityStatistics()
  
  return NextResponse.json({
    success: true,
    analytics: {
      type: 'overview',
      data: {
        summary: {
          totalAssessments: statistics.totalAssessments,
          totalFeedback: statistics.totalFeedback,
          averageQualityScore: Math.round(statistics.averageOverallScore * 10) / 10,
          averageUserRating: Math.round(statistics.averageUserRating * 10) / 10,
          qualityTrend: statistics.qualityTrend
        },
        issues: {
          topIssueTypes: statistics.topIssues,
          totalIssues: Object.values(statistics.issuesByType).reduce((a, b) => a + b, 0)
        },
        feedback: {
          ratingDistribution: statistics.feedbackByRating,
          improvementAreas: statistics.improvementAreas
        }
      }
    }
  })
}

async function handleTrendsAnalytics(
  period: string, 
  startDateStr: string | null, 
  endDateStr: string | null,
  userId: string,
  userRole?: string
) {
  // Default to last week if dates not provided
  const endDate = endDateStr ? new Date(endDateStr) : new Date()
  const startDate = startDateStr ? new Date(startDateStr) : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

  const validPeriods = ['hour', 'day', 'week', 'month']
  const selectedPeriod = validPeriods.includes(period) ? period as any : 'week'

  const trends = await qualityEngine.getQualityTrends(selectedPeriod, startDate, endDate)

  return NextResponse.json({
    success: true,
    analytics: {
      type: 'trends',
      period: selectedPeriod,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      data: trends
    }
  })
}

async function handleFeedbackAnalytics(userId: string, userRole: string | undefined, supabase: any) {
  try {
    // Get feedback analytics from database
    let query = supabase
      .from('quality_feedback')
      .select('*')

    // If not admin, limit to user's own feedback
    if (userRole !== 'admin') {
      query = query.eq('user_id', userId)
    }

    const { data: feedbackData, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000) // Limit for performance

    if (error) throw error

    // Process feedback data
    const feedbackByType = feedbackData.reduce((acc: Record<string, number>, f: any) => {
      acc[f.feedback_type] = (acc[f.feedback_type] || 0) + 1
      return acc
    }, {})

    const feedbackByRating = feedbackData.reduce((acc: Record<number, number>, f: any) => {
      acc[f.rating] = (acc[f.rating] || 0) + 1
      return acc
    }, {})

    const feedbackBySeverity = feedbackData
      .filter((f: any) => f.severity)
      .reduce((acc: Record<string, number>, f: any) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1
        return acc
      }, {})

    const averageRating = feedbackData.length > 0
      ? feedbackData.reduce((sum: number, f: any) => sum + f.rating, 0) / feedbackData.length
      : 0

    return NextResponse.json({
      success: true,
      analytics: {
        type: 'feedback',
        data: {
          total: feedbackData.length,
          averageRating: Math.round(averageRating * 10) / 10,
          distribution: {
            byType: feedbackByType,
            byRating: feedbackByRating,
            bySeverity: feedbackBySeverity
          },
          recent: feedbackData.slice(0, 10).map((f: any) => ({
            id: f.id,
            type: f.feedback_type,
            rating: f.rating,
            severity: f.severity,
            createdAt: f.created_at
          }))
        }
      }
    })

  } catch (error) {
    logger.error('Feedback analytics failed:', error)
    throw error
  }
}

async function handlePerformanceAnalytics(userId: string, userRole: string | undefined, supabase: any) {
  try {
    // Get assessment performance data
    let query = supabase
      .from('quality_assessments')
      .select('*')

    // If not admin, limit to user's own assessments
    if (userRole !== 'admin') {
      query = query.eq('user_id', userId)
    }

    const { data: assessmentData, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) throw error

    // Calculate performance metrics
    const totalAssessments = assessmentData.length
    const averageOverallScore = totalAssessments > 0
      ? assessmentData.reduce((sum: number, a: any) => sum + a.overall_score, 0) / totalAssessments
      : 0

    const scoreDistribution = assessmentData.reduce((acc: Record<string, number>, a: any) => {
      const scoreRange = getScoreRange(a.overall_score)
      acc[scoreRange] = (acc[scoreRange] || 0) + 1
      return acc
    }, {})

    const averageMetrics = {
      accuracy: getAverageMetric(assessmentData, 'accuracy_score'),
      fluency: getAverageMetric(assessmentData, 'fluency_score'),
      consistency: getAverageMetric(assessmentData, 'consistency_score'),
      completeness: getAverageMetric(assessmentData, 'completeness_score'),
      contextRelevance: getAverageMetric(assessmentData, 'context_relevance_score')
    }

    const issueStats = {
      totalIssues: assessmentData.reduce((sum: number, a: any) => sum + (a.issues_found || 0), 0),
      averageIssuesPerAssessment: totalAssessments > 0
        ? assessmentData.reduce((sum: number, a: any) => sum + (a.issues_found || 0), 0) / totalAssessments
        : 0
    }

    return NextResponse.json({
      success: true,
      analytics: {
        type: 'performance',
        data: {
          summary: {
            totalAssessments,
            averageOverallScore: Math.round(averageOverallScore * 10) / 10,
            scoreDistribution
          },
          metrics: averageMetrics,
          issues: issueStats,
          recent: assessmentData.slice(0, 10).map((a: any) => ({
            id: a.id,
            overallScore: a.overall_score,
            issuesFound: a.issues_found,
            confidence: a.confidence,
            createdAt: a.created_at
          }))
        }
      }
    })

  } catch (error) {
    logger.error('Performance analytics failed:', error)
    throw error
  }
}

function getScoreRange(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'fair'
  if (score >= 60) return 'poor'
  return 'very_poor'
}

function getAverageMetric(data: any[], field: string): number {
  if (data.length === 0) return 0
  const sum = data.reduce((sum, item) => sum + (item[field] || 0), 0)
  return Math.round((sum / data.length) * 10) / 10
}