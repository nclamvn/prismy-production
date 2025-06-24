'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { QualityAssessment, QualityMetrics } from '@/lib/quality-control/quality-engine'

interface QualityAssessmentDisplayProps {
  assessment: QualityAssessment
  showDetails?: boolean
  className?: string
}

export default function QualityAssessmentDisplay({
  assessment,
  showDetails = false,
  className = ''
}: QualityAssessmentDisplayProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBackgroundColor = (score: number): string => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-blue-500'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Fair'
    if (score >= 60) return 'Poor'
    return 'Needs Improvement'
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'grammar':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'terminology':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
          </svg>
        )
      case 'context':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <motion.div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quality Assessment</h3>
          <p className="text-sm text-gray-600">
            Assessed {new Date(assessment.timestamp).toLocaleDateString()} • 
            Confidence: {Math.round(assessment.confidence * 100)}%
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(assessment.metrics.overallScore)}`}>
            {assessment.metrics.overallScore}
          </div>
          <div className="text-sm text-gray-600">
            {getScoreLabel(assessment.metrics.overallScore)}
          </div>
        </div>
      </div>

      {/* Overall Score Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Quality</span>
          <span className="text-sm text-gray-600">{assessment.metrics.overallScore}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className={`h-3 rounded-full ${getScoreBackgroundColor(assessment.metrics.overallScore)}`}
            initial={{ width: 0 }}
            animate={{ width: `${assessment.metrics.overallScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(assessment.metrics).map(([key, value]) => {
          if (key === 'overallScore') return null
          
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
          
          return (
            <div key={key} className="text-center">
              <div className={`text-lg font-semibold ${getScoreColor(value)}`}>
                {value}
              </div>
              <div className="text-xs text-gray-600">{label}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className={`h-1 rounded-full ${getScoreBackgroundColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Issues */}
      {assessment.issues.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Issues Found ({assessment.issues.length})
          </h4>
          <div className="space-y-2">
            {assessment.issues.slice(0, showDetails ? undefined : 3).map((issue) => (
              <div
                key={issue.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100"
              >
                <div className={`p-1 rounded-full ${getSeverityColor(issue.severity)}`}>
                  {getIssueTypeIcon(issue.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {issue.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                  {issue.suggestedFix && (
                    <p className="text-sm text-blue-600 mt-1">
                      💡 {issue.suggestedFix}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {!showDetails && assessment.issues.length > 3 && (
              <div className="text-center">
                <span className="text-sm text-gray-500">
                  +{assessment.issues.length - 3} more issues
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {assessment.suggestions.length > 0 && showDetails && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Improvement Suggestions
          </h4>
          <div className="space-y-3">
            {assessment.suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-3 rounded-lg bg-blue-50 border border-blue-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900 capitalize">
                    {suggestion.type}
                  </span>
                  <span className="text-xs text-blue-600">
                    +{suggestion.estimatedImprovement} points
                  </span>
                </div>
                <p className="text-sm text-blue-800 mb-2">{suggestion.description}</p>
                <p className="text-sm text-blue-600">{suggestion.implementation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {assessment.issues.length === 0 && (
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-3 text-green-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">No quality issues detected</p>
        </div>
      )}
    </motion.div>
  )
}