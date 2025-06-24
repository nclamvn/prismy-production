/**
 * QUALITY CONTROL ENGINE
 * Advanced quality assessment and feedback system for translations and document analysis
 */

import { logger } from '@/lib/logger'
import { websocketManager } from '@/lib/websocket/websocket-manager'

export interface QualityMetrics {
  accuracy: number          // 0-100 - Translation accuracy
  fluency: number          // 0-100 - Language fluency 
  consistency: number      // 0-100 - Terminology consistency
  completeness: number     // 0-100 - Translation completeness
  contextRelevance: number // 0-100 - Context appropriateness
  overallScore: number     // 0-100 - Weighted overall quality
}

export interface FeedbackSubmission {
  id: string
  translationId?: string
  documentId?: string
  userId: string
  type: 'translation' | 'document_analysis' | 'feature' | 'bug_report'
  rating: number // 1-5 stars
  feedback: string
  categories: string[] // ['accuracy', 'speed', 'ui', 'functionality']
  severity?: 'low' | 'medium' | 'high' | 'critical'
  suggestedImprovement?: string
  metadata: {
    sourceLanguage?: string
    targetLanguage?: string
    textLength?: number
    processingTime?: number
    userTier: string
    platform: string
    timestamp: number
  }
}

export interface QualityAssessment {
  id: string
  type: 'automatic' | 'user_feedback' | 'expert_review'
  subject: {
    type: 'translation' | 'document_analysis'
    id: string
    content: string
    result: string
  }
  metrics: QualityMetrics
  issues: QualityIssue[]
  suggestions: QualitySuggestion[]
  confidence: number
  assessedBy: string
  timestamp: number
  approved?: boolean
}

export interface QualityIssue {
  id: string
  type: 'grammar' | 'terminology' | 'context' | 'completeness' | 'formatting'
  severity: 'low' | 'medium' | 'high'
  description: string
  position?: {
    start: number
    end: number
  }
  suggestedFix?: string
  confidence: number
}

export interface QualitySuggestion {
  id: string
  type: 'improvement' | 'alternative' | 'terminology' | 'style'
  description: string
  impact: 'low' | 'medium' | 'high'
  implementation: string
  estimatedImprovement: number // Expected quality score improvement
}

export interface QualityTrend {
  period: 'hour' | 'day' | 'week' | 'month'
  startDate: Date
  endDate: Date
  metrics: {
    averageQuality: number
    feedbackCount: number
    improvementRate: number
    issueCategories: Record<string, number>
    userSatisfaction: number
  }
  compareToPrevious: {
    qualityChange: number
    feedbackChange: number
    satisfactionChange: number
  }
}

class QualityEngine {
  private assessments: Map<string, QualityAssessment> = new Map()
  private feedback: Map<string, FeedbackSubmission> = new Map()
  private qualityRules: Map<string, QualityRule> = new Map()

  constructor() {
    this.initializeQualityRules()
    logger.info('Quality Control Engine initialized')
  }

  // Assess translation quality automatically
  async assessTranslationQuality(
    translationId: string,
    sourceText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
    metadata: any = {}
  ): Promise<QualityAssessment> {
    const assessmentId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      logger.info(`Starting quality assessment for translation ${translationId}`)

      // Perform automated quality checks
      const metrics = await this.calculateQualityMetrics(
        sourceText,
        translatedText,
        sourceLanguage,
        targetLanguage
      )

      // Detect quality issues
      const issues = await this.detectQualityIssues(
        sourceText,
        translatedText,
        sourceLanguage,
        targetLanguage
      )

      // Generate improvement suggestions
      const suggestions = await this.generateQualitySuggestions(
        sourceText,
        translatedText,
        issues,
        metrics
      )

      // Calculate confidence based on metrics and issue severity
      const confidence = this.calculateAssessmentConfidence(metrics, issues)

      const assessment: QualityAssessment = {
        id: assessmentId,
        type: 'automatic',
        subject: {
          type: 'translation',
          id: translationId,
          content: sourceText,
          result: translatedText
        },
        metrics,
        issues,
        suggestions,
        confidence,
        assessedBy: 'system',
        timestamp: Date.now()
      }

      this.assessments.set(assessmentId, assessment)

      // Log quality assessment
      logger.info(`Quality assessment completed for ${translationId}:`, {
        overallScore: metrics.overallScore,
        issuesFound: issues.length,
        confidence
      })

      return assessment

    } catch (error) {
      logger.error(`Quality assessment failed for translation ${translationId}:`, error)
      throw error
    }
  }

  // Submit user feedback
  async submitFeedback(feedback: Omit<FeedbackSubmission, 'id'>): Promise<string> {
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullFeedback: FeedbackSubmission = {
      ...feedback,
      id: feedbackId
    }

    this.feedback.set(feedbackId, fullFeedback)

    logger.info(`Feedback submitted: ${feedbackId}`, {
      type: feedback.type,
      rating: feedback.rating,
      userId: feedback.userId
    })

    // Send real-time notification to admin channels
    websocketManager.broadcastToChannel('system:quality_control', {
      id: `feedback_notification_${Date.now()}`,
      type: 'feedback_submitted',
      userId: 'system',
      timestamp: Date.now(),
      channel: 'system:quality_control',
      data: {
        feedbackId,
        type: feedback.type,
        rating: feedback.rating,
        severity: feedback.severity,
        categories: feedback.categories
      }
    })

    // Process feedback for quality improvement
    await this.processFeedbackForImprovement(fullFeedback)

    return feedbackId
  }

  // Get quality trends and analytics
  async getQualityTrends(
    period: QualityTrend['period'],
    startDate: Date,
    endDate: Date
  ): Promise<QualityTrend> {
    const assessmentsInPeriod = Array.from(this.assessments.values())
      .filter(a => a.timestamp >= startDate.getTime() && a.timestamp <= endDate.getTime())

    const feedbackInPeriod = Array.from(this.feedback.values())
      .filter(f => f.metadata.timestamp >= startDate.getTime() && f.metadata.timestamp <= endDate.getTime())

    // Calculate metrics
    const averageQuality = assessmentsInPeriod.length > 0
      ? assessmentsInPeriod.reduce((sum, a) => sum + a.metrics.overallScore, 0) / assessmentsInPeriod.length
      : 0

    const userSatisfaction = feedbackInPeriod.length > 0
      ? feedbackInPeriod.reduce((sum, f) => sum + f.rating, 0) / feedbackInPeriod.length * 20 // Convert 1-5 to 0-100
      : 0

    // Count issue categories
    const issueCategories: Record<string, number> = {}
    assessmentsInPeriod.forEach(assessment => {
      assessment.issues.forEach(issue => {
        issueCategories[issue.type] = (issueCategories[issue.type] || 0) + 1
      })
    })

    // Calculate improvement rate
    const improvementRate = this.calculateImprovementRate(assessmentsInPeriod)

    // Get previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodDuration)
    const previousEndDate = new Date(endDate.getTime() - periodDuration)
    const previousTrend = await this.getQualityTrends(period, previousStartDate, previousEndDate)

    return {
      period,
      startDate,
      endDate,
      metrics: {
        averageQuality,
        feedbackCount: feedbackInPeriod.length,
        improvementRate,
        issueCategories,
        userSatisfaction
      },
      compareToPrevious: {
        qualityChange: averageQuality - previousTrend.metrics.averageQuality,
        feedbackChange: feedbackInPeriod.length - previousTrend.metrics.feedbackCount,
        satisfactionChange: userSatisfaction - previousTrend.metrics.userSatisfaction
      }
    }
  }

  // Get quality assessment by ID
  getAssessment(assessmentId: string): QualityAssessment | undefined {
    return this.assessments.get(assessmentId)
  }

  // Get feedback by ID
  getFeedback(feedbackId: string): FeedbackSubmission | undefined {
    return this.feedback.get(feedbackId)
  }

  // Get quality statistics
  getQualityStatistics() {
    const assessments = Array.from(this.assessments.values())
    const feedback = Array.from(this.feedback.values())

    const totalAssessments = assessments.length
    const averageOverallScore = totalAssessments > 0
      ? assessments.reduce((sum, a) => sum + a.metrics.overallScore, 0) / totalAssessments
      : 0

    const issuesByType = assessments.reduce((acc, assessment) => {
      assessment.issues.forEach(issue => {
        acc[issue.type] = (acc[issue.type] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const feedbackByRating = feedback.reduce((acc, f) => {
      acc[f.rating] = (acc[f.rating] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const averageUserRating = feedback.length > 0
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
      : 0

    return {
      totalAssessments,
      totalFeedback: feedback.length,
      averageOverallScore,
      averageUserRating,
      issuesByType,
      feedbackByRating,
      qualityTrend: this.calculateOverallTrend(assessments),
      topIssues: this.getTopIssues(assessments),
      improvementAreas: this.getImprovementAreas(feedback)
    }
  }

  // Private methods

  private initializeQualityRules() {
    // Initialize quality assessment rules
    this.qualityRules.set('length_consistency', {
      id: 'length_consistency',
      description: 'Check if translation length is reasonable compared to source',
      weight: 0.1,
      evaluate: (source: string, translation: string) => {
        const ratio = translation.length / source.length
        if (ratio < 0.3 || ratio > 3.0) return 0.3 // Very poor
        if (ratio < 0.5 || ratio > 2.0) return 0.6 // Poor
        if (ratio < 0.7 || ratio > 1.5) return 0.8 // Good
        return 1.0 // Excellent
      }
    })

    this.qualityRules.set('empty_translation', {
      id: 'empty_translation',
      description: 'Check if translation is empty or too short',
      weight: 0.3,
      evaluate: (source: string, translation: string) => {
        if (!translation.trim()) return 0.0
        if (translation.trim().length < 3) return 0.2
        return 1.0
      }
    })

    this.qualityRules.set('character_repetition', {
      id: 'character_repetition',
      description: 'Detect excessive character repetition',
      weight: 0.1,
      evaluate: (source: string, translation: string) => {
        const repetitionPattern = /(.)\1{4,}/g
        const matches = translation.match(repetitionPattern)
        if (matches && matches.length > 0) return 0.3
        return 1.0
      }
    })
  }

  private async calculateQualityMetrics(
    sourceText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<QualityMetrics> {
    // Apply quality rules
    let totalScore = 0
    let totalWeight = 0

    for (const rule of this.qualityRules.values()) {
      const score = rule.evaluate(sourceText, translatedText)
      totalScore += score * rule.weight
      totalWeight += rule.weight
    }

    const baseScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 50

    // Calculate individual metrics (simplified for demo)
    const accuracy = Math.max(0, Math.min(100, baseScore + this.randomVariation(10)))
    const fluency = Math.max(0, Math.min(100, baseScore + this.randomVariation(15)))
    const consistency = Math.max(0, Math.min(100, baseScore + this.randomVariation(8)))
    const completeness = Math.max(0, Math.min(100, baseScore + this.randomVariation(5)))
    const contextRelevance = Math.max(0, Math.min(100, baseScore + this.randomVariation(12)))

    // Calculate weighted overall score
    const overallScore = Math.round(
      (accuracy * 0.3 + fluency * 0.25 + consistency * 0.2 + completeness * 0.15 + contextRelevance * 0.1)
    )

    return {
      accuracy: Math.round(accuracy),
      fluency: Math.round(fluency),
      consistency: Math.round(consistency),
      completeness: Math.round(completeness),
      contextRelevance: Math.round(contextRelevance),
      overallScore
    }
  }

  private async detectQualityIssues(
    sourceText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []

    // Check for empty translation
    if (!translatedText.trim()) {
      issues.push({
        id: `issue_${Date.now()}_1`,
        type: 'completeness',
        severity: 'high',
        description: 'Translation is empty',
        confidence: 1.0
      })
    }

    // Check for excessive length difference
    const lengthRatio = translatedText.length / sourceText.length
    if (lengthRatio < 0.3 || lengthRatio > 3.0) {
      issues.push({
        id: `issue_${Date.now()}_2`,
        type: 'completeness',
        severity: 'medium',
        description: 'Translation length significantly differs from source',
        confidence: 0.8,
        suggestedFix: 'Review translation completeness'
      })
    }

    // Check for character repetition
    const repetitionPattern = /(.)\1{4,}/g
    const repetitionMatches = translatedText.match(repetitionPattern)
    if (repetitionMatches) {
      issues.push({
        id: `issue_${Date.now()}_3`,
        type: 'formatting',
        severity: 'low',
        description: 'Excessive character repetition detected',
        confidence: 0.9,
        suggestedFix: 'Remove repeated characters'
      })
    }

    // Check for untranslated source language content (basic check)
    if (sourceLanguage !== targetLanguage) {
      const sourceWords = sourceText.toLowerCase().split(/\s+/)
      const translatedWords = translatedText.toLowerCase().split(/\s+/)
      const commonWords = sourceWords.filter(word => 
        word.length > 3 && translatedWords.includes(word)
      )
      
      if (commonWords.length > sourceWords.length * 0.3) {
        issues.push({
          id: `issue_${Date.now()}_4`,
          type: 'completeness',
          severity: 'medium',
          description: 'Possible untranslated content detected',
          confidence: 0.6,
          suggestedFix: 'Review for untranslated words'
        })
      }
    }

    return issues
  }

  private async generateQualitySuggestions(
    sourceText: string,
    translatedText: string,
    issues: QualityIssue[],
    metrics: QualityMetrics
  ): Promise<QualitySuggestion[]> {
    const suggestions: QualitySuggestion[] = []

    // Suggest improvements based on low metrics
    if (metrics.accuracy < 70) {
      suggestions.push({
        id: `suggestion_${Date.now()}_1`,
        type: 'improvement',
        description: 'Consider using a higher quality translation model',
        impact: 'high',
        implementation: 'Upgrade to premium quality tier',
        estimatedImprovement: 15
      })
    }

    if (metrics.fluency < 65) {
      suggestions.push({
        id: `suggestion_${Date.now()}_2`,
        type: 'style',
        description: 'Review translation for natural language flow',
        impact: 'medium',
        implementation: 'Post-edit for better fluency',
        estimatedImprovement: 10
      })
    }

    if (issues.length > 3) {
      suggestions.push({
        id: `suggestion_${Date.now()}_3`,
        type: 'improvement',
        description: 'Multiple issues detected - consider human review',
        impact: 'high',
        implementation: 'Request professional review',
        estimatedImprovement: 20
      })
    }

    return suggestions
  }

  private calculateAssessmentConfidence(metrics: QualityMetrics, issues: QualityIssue[]): number {
    let confidence = 0.8 // Base confidence

    // Reduce confidence for low scores
    if (metrics.overallScore < 50) confidence -= 0.3
    else if (metrics.overallScore < 70) confidence -= 0.15

    // Reduce confidence for high-severity issues
    const highSeverityIssues = issues.filter(i => i.severity === 'high').length
    confidence -= highSeverityIssues * 0.1

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  private async processFeedbackForImprovement(feedback: FeedbackSubmission): Promise<void> {
    // Process feedback to improve system
    if (feedback.rating <= 2 && feedback.type === 'translation') {
      logger.warn(`Low rating feedback received for translation:`, {
        feedbackId: feedback.id,
        rating: feedback.rating,
        categories: feedback.categories
      })
    }

    // TODO: Implement machine learning feedback processing
  }

  private calculateImprovementRate(assessments: QualityAssessment[]): number {
    if (assessments.length < 2) return 0

    // Sort by timestamp
    const sortedAssessments = assessments.sort((a, b) => a.timestamp - b.timestamp)
    const firstHalf = sortedAssessments.slice(0, Math.floor(sortedAssessments.length / 2))
    const secondHalf = sortedAssessments.slice(Math.floor(sortedAssessments.length / 2))

    const firstHalfAvg = firstHalf.reduce((sum, a) => sum + a.metrics.overallScore, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, a) => sum + a.metrics.overallScore, 0) / secondHalf.length

    return secondHalfAvg - firstHalfAvg
  }

  private calculateOverallTrend(assessments: QualityAssessment[]): 'improving' | 'declining' | 'stable' {
    const improvementRate = this.calculateImprovementRate(assessments)
    if (improvementRate > 2) return 'improving'
    if (improvementRate < -2) return 'declining'
    return 'stable'
  }

  private getTopIssues(assessments: QualityAssessment[]) {
    const issueCount: Record<string, number> = {}
    assessments.forEach(assessment => {
      assessment.issues.forEach(issue => {
        issueCount[issue.type] = (issueCount[issue.type] || 0) + 1
      })
    })

    return Object.entries(issueCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))
  }

  private getImprovementAreas(feedback: FeedbackSubmission[]) {
    const lowRatingFeedback = feedback.filter(f => f.rating <= 2)
    const categoryCount: Record<string, number> = {}
    
    lowRatingFeedback.forEach(f => {
      f.categories.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1
      })
    })

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))
  }

  private randomVariation(range: number): number {
    return (Math.random() - 0.5) * range
  }
}

interface QualityRule {
  id: string
  description: string
  weight: number
  evaluate: (source: string, translation: string) => number
}

// Export singleton instance
export const qualityEngine = new QualityEngine()

// Export types
export type {
  QualityMetrics,
  FeedbackSubmission,
  QualityAssessment,
  QualityIssue,
  QualitySuggestion,
  QualityTrend
}