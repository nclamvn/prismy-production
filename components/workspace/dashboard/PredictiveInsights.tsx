/**
 * PRISMY PREDICTIVE INSIGHTS COMPONENT
 * Displays AI-powered predictive insights for proactive user assistance
 * Shows predicted user needs, agent optimizations, and collaboration opportunities
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  Users, 
  FileText, 
  Lightbulb, 
  Clock,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { PredictiveInsight } from '@/lib/agents/intelligence/predictive-intelligence'

interface PredictiveInsightsProps {
  onInsightAction?: (insight: PredictiveInsight, action: string) => void
}

export default function PredictiveInsights({ onInsightAction }: PredictiveInsightsProps) {
  const [insights, setInsights] = useState<PredictiveInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

  useEffect(() => {
    loadPredictiveInsights()
    
    // Auto-refresh insights every 10 minutes
    const interval = setInterval(loadPredictiveInsights, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadPredictiveInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_predictive_insights' })
      })

      if (response.ok) {
        const result = await response.json()
        setInsights(result.data || [])
        setError(null)
      } else {
        setError('Failed to load predictive insights')
      }
    } catch (err) {
      setError('Error loading insights')
      console.error('Failed to load predictive insights:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateNewPredictions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_predictions' })
      })

      if (response.ok) {
        const result = await response.json()
        setInsights(result.data || [])
        setError(null)
      } else {
        setError('Failed to generate new predictions')
      }
    } catch (err) {
      setError('Error generating predictions')
      console.error('Failed to generate predictions:', err)
    } finally {
      setLoading(false)
    }
  }

  const dismissInsight = async (insightId: string) => {
    try {
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss_insight', insightId })
      })

      if (response.ok) {
        setInsights(prev => prev.filter(insight => insight.id !== insightId))
        onInsightAction?.(insights.find(i => i.id === insightId)!, 'dismissed')
      }
    } catch (err) {
      console.error('Failed to dismiss insight:', err)
    }
  }

  const getInsightIcon = (type: PredictiveInsight['type']) => {
    switch (type) {
      case 'user_need': return <FileText className="w-5 h-5" />
      case 'agent_optimization': return <TrendingUp className="w-5 h-5" />
      case 'collaboration_opportunity': return <Users className="w-5 h-5" />
      case 'document_requirement': return <FileText className="w-5 h-5" />
      default: return <Lightbulb className="w-5 h-5" />
    }
  }

  const getPriorityColor = (priority: PredictiveInsight['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: PredictiveInsight['priority']) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <AlertTriangle className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">Predictive Insights Error</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button 
          onClick={loadPredictiveInsights}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Predictive Insights
            </h3>
            <p className="text-sm text-gray-600">
              AI-powered predictions about your needs
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={loadPredictiveInsights}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh insights"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={generateNewPredictions}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            Generate New
          </button>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        <AnimatePresence>
          {insights.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No predictive insights available</p>
              <p className="text-sm">Generate predictions to get started</p>
            </motion.div>
          ) : (
            insights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex space-x-3 flex-1">
                    <div className="flex-shrink-0 pt-1">
                      {getInsightIcon(insight.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {insight.title}
                        </h4>
                        <div className="flex items-center space-x-1 text-xs">
                          {getPriorityIcon(insight.priority)}
                          <span className="uppercase font-medium">
                            {insight.priority}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {insight.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{insight.expectedTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{Math.round(insight.confidence * 100)}% confidence</span>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedInsight === insight.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            {/* Suggested Actions */}
                            <div className="mb-4">
                              <h5 className="font-medium text-gray-900 mb-2">
                                Suggested Actions
                              </h5>
                              <ul className="space-y-1">
                                {insight.suggestedActions.map((action, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {/* Based On */}
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">
                                Based On
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <span className="font-medium">Patterns:</span>
                                  <ul className="mt-1 space-y-0.5">
                                    {insight.basedOn.patterns.map((pattern, index) => (
                                      <li key={index} className="text-gray-600">
                                        • {pattern}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <span className="font-medium">Historical Data:</span>
                                  <ul className="mt-1 space-y-0.5">
                                    {insight.basedOn.historicalData.map((data, index) => (
                                      <li key={index} className="text-gray-600">
                                        • {data}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <span className="font-medium">Context:</span>
                                  <ul className="mt-1 space-y-0.5">
                                    {insight.basedOn.contextualFactors.map((factor, index) => (
                                      <li key={index} className="text-gray-600">
                                        • {factor}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setExpandedInsight(
                        expandedInsight === insight.id ? null : insight.id
                      )}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors"
                      title={expandedInsight === insight.id ? 'Collapse' : 'Expand'}
                    >
                      <motion.div
                        animate={{ rotate: expandedInsight === insight.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </motion.div>
                    </button>
                    
                    <button
                      onClick={() => dismissInsight(insight.id)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-white rounded transition-colors"
                      title="Dismiss insight"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {loading && insights.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Generating insights...</span>
        </div>
      )}
    </div>
  )
}