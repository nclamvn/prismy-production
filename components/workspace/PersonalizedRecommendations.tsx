'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  TrendingUp,
  Zap,
  Target,
  Clock,
  Star,
  ChevronRight,
  X,
  Check,
  ArrowRight,
  Sparkles,
  Brain,
  Workflow,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useWorkspaceIntelligence } from '@/contexts/WorkspaceIntelligenceContext'
import { motionSafe, slideUp, fadeIn, staggerContainer } from '@/lib/motion'

interface Recommendation {
  id: string
  type: 'workflow' | 'feature' | 'optimization' | 'learning'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  benefit: string
  estimatedTime: string
  category: 'productivity' | 'efficiency' | 'learning' | 'automation'
  action: () => void
  completed?: boolean
  dismissedAt?: Date
  metadata: {
    basedOn: string[]
    confidence: number
    impact: 'high' | 'medium' | 'low'
    difficulty: 'easy' | 'medium' | 'hard'
  }
}

interface PersonalizedRecommendationsProps {
  className?: string
}

export default function PersonalizedRecommendations({
  className = ''
}: PersonalizedRecommendationsProps) {
  const { language } = useSSRSafeLanguage()
  const {
    state,
    getRecentActivities,
    getUserPatterns,
    getWorkflowEfficiency,
    trackActivity,
    addSuggestion
  } = useWorkspaceIntelligence()

  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activeCategory, setActiveCategory] = useState<'all' | 'productivity' | 'efficiency' | 'learning' | 'automation'>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

  const content = {
    vi: {
      title: 'Gợi ý cá nhân hóa',
      subtitle: 'Tối ưu quy trình làm việc dựa trên thói quen sử dụng của bạn',
      generateNew: 'Tạo gợi ý mới',
      categories: {
        all: 'Tất cả',
        productivity: 'Năng suất',
        efficiency: 'Hiệu quả',
        learning: 'Học tập',
        automation: 'Tự động hóa'
      },
      priority: {
        high: 'Ưu tiên cao',
        medium: 'Ưu tiên trung bình',
        low: 'Ưu tiên thấp'
      },
      impact: {
        high: 'Tác động cao',
        medium: 'Tác động trung bình',
        low: 'Tác động thấp'
      },
      difficulty: {
        easy: 'Dễ',
        medium: 'Trung bình',
        hard: 'Khó'
      },
      estimatedTime: 'Thời gian ước tính',
      benefit: 'Lợi ích',
      basedOn: 'Dựa trên',
      confidence: 'Độ tin cậy',
      apply: 'Áp dụng',
      dismiss: 'Bỏ qua',
      completed: 'Đã hoàn thành',
      noRecommendations: 'Chưa có gợi ý nào. Hãy sử dụng workspace để nhận gợi ý cá nhân hóa.',
      generating: 'Đang tạo gợi ý...',
      lastGenerated: 'Cập nhật lần cuối'
    },
    en: {
      title: 'Personalized Recommendations',
      subtitle: 'Optimize your workflow based on your usage patterns',
      generateNew: 'Generate New Recommendations',
      categories: {
        all: 'All',
        productivity: 'Productivity',
        efficiency: 'Efficiency',
        learning: 'Learning',
        automation: 'Automation'
      },
      priority: {
        high: 'High Priority',
        medium: 'Medium Priority',
        low: 'Low Priority'
      },
      impact: {
        high: 'High Impact',
        medium: 'Medium Impact',
        low: 'Low Impact'
      },
      difficulty: {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard'
      },
      estimatedTime: 'Estimated Time',
      benefit: 'Benefit',
      basedOn: 'Based On',
      confidence: 'Confidence',
      apply: 'Apply',
      dismiss: 'Dismiss',
      completed: 'Completed',
      noRecommendations: 'No recommendations yet. Use the workspace to get personalized suggestions.',
      generating: 'Generating recommendations...',
      lastGenerated: 'Last updated'
    }
  }

  const currentContent = content[language]

  // Generate recommendations based on user patterns and activities
  const generateRecommendations = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      const recentActivities = getRecentActivities(20)
      const userPatterns = getUserPatterns()
      const workflowEfficiency = getWorkflowEfficiency()
      
      const newRecommendations: Recommendation[] = []

      // Analyze patterns and generate contextual recommendations
      
      // 1. Workflow Optimization Recommendations
      if (workflowEfficiency < 80) {
        newRecommendations.push({
          id: `rec_workflow_${Date.now()}`,
          type: 'optimization',
          priority: 'high',
          title: language === 'vi' ? 'Tối ưu quy trình làm việc' : 'Optimize Workflow Process',
          description: language === 'vi' 
            ? 'Hiệu suất làm việc hiện tại có thể cải thiện. Hãy xem xét sử dụng batch processing cho các tác vụ lặp lại.'
            : 'Your current workflow efficiency can be improved. Consider using batch processing for repetitive tasks.',
          benefit: language === 'vi' 
            ? 'Tăng hiệu suất lên 25-40%'
            : 'Increase efficiency by 25-40%',
          estimatedTime: '10-15 minutes',
          category: 'efficiency',
          action: () => {
            // Navigate to batch processing or efficiency tools
            trackActivity({
              type: 'workflow_creation',
              mode: 'documents',
              data: { source: 'personalized_recommendation', type: 'workflow_optimization' },
              success: true
            })
          },
          metadata: {
            basedOn: ['workflow_efficiency', 'activity_patterns'],
            confidence: 0.85,
            impact: 'high',
            difficulty: 'easy'
          }
        })
      }

      // 2. Feature Discovery Recommendations
      const translationActivities = recentActivities.filter(a => a.type === 'translation')
      const documentActivities = recentActivities.filter(a => a.type === 'document_upload')
      
      if (translationActivities.length > 3 && documentActivities.length === 0) {
        newRecommendations.push({
          id: `rec_feature_${Date.now()}`,
          type: 'feature',
          priority: 'medium',
          title: language === 'vi' ? 'Khám phá dịch tài liệu' : 'Discover Document Translation',
          description: language === 'vi'
            ? 'Bạn đang dịch văn bản thường xuyên. Hãy thử tính năng dịch tài liệu để xử lý file PDF và Word.'
            : 'You frequently translate text. Try document translation to process PDF and Word files.',
          benefit: language === 'vi'
            ? 'Tiết kiệm thời gian với tài liệu dài'
            : 'Save time with long documents',
          estimatedTime: '5 minutes',
          category: 'productivity',
          action: () => {
            // Navigate to document translation
            addSuggestion({
              type: 'feature',
              title: 'Try Document Translation',
              description: 'Upload documents for automated translation',
              action: () => {},
              priority: 'medium',
              context: { source: 'personalized_recommendation' }
            })
          },
          metadata: {
            basedOn: ['translation_frequency', 'feature_usage'],
            confidence: 0.75,
            impact: 'medium',
            difficulty: 'easy'
          }
        })
      }

      // 3. Automation Recommendations
      if (userPatterns.commonWorkflows.length === 0 && recentActivities.length > 10) {
        newRecommendations.push({
          id: `rec_automation_${Date.now()}`,
          type: 'workflow',
          priority: 'medium',
          title: language === 'vi' ? 'Tạo quy trình tự động' : 'Create Automated Workflows',
          description: language === 'vi'
            ? 'Tạo quy trình tự động cho các tác vụ thường làm để tiết kiệm thời gian.'
            : 'Create automated workflows for your frequent tasks to save time.',
          benefit: language === 'vi'
            ? 'Giảm thời gian lặp lại tác vụ'
            : 'Reduce repetitive task time',
          estimatedTime: '15-20 minutes',
          category: 'automation',
          action: () => {
            // Navigate to workflow creation
            trackActivity({
              type: 'workflow_creation',
              mode: 'intelligence',
              data: { source: 'personalized_recommendation', type: 'automation_setup' },
              success: true
            })
          },
          metadata: {
            basedOn: ['activity_frequency', 'task_repetition'],
            confidence: 0.70,
            impact: 'high',
            difficulty: 'medium'
          }
        })
      }

      // 4. Learning Recommendations
      const usedFeatures = Object.keys(userPatterns.featureUsage)
      const allFeatures = ['translation', 'document_upload', 'ai_interaction', 'settings_change', 'workflow_creation']
      const unusedFeatures = allFeatures.filter(f => !usedFeatures.includes(f))
      
      if (unusedFeatures.length > 0) {
        newRecommendations.push({
          id: `rec_learning_${Date.now()}`,
          type: 'learning',
          priority: 'low',
          title: language === 'vi' ? 'Khám phá tính năng mới' : 'Explore New Features',
          description: language === 'vi'
            ? `Bạn chưa sử dụng ${unusedFeatures.length} tính năng. Hãy khám phá để tối đa hóa hiệu quả.`
            : `You haven't used ${unusedFeatures.length} features yet. Explore them to maximize efficiency.`,
          benefit: language === 'vi'
            ? 'Mở rộng khả năng sử dụng platform'
            : 'Expand platform capabilities',
          estimatedTime: '10 minutes',
          category: 'learning',
          action: () => {
            // Navigate to feature discovery
            addSuggestion({
              type: 'feature',
              title: 'Feature Tour',
              description: 'Take a guided tour of unused features',
              action: () => {},
              priority: 'low',
              context: { unusedFeatures }
            })
          },
          metadata: {
            basedOn: ['feature_usage', 'exploration_patterns'],
            confidence: 0.60,
            impact: 'medium',
            difficulty: 'easy'
          }
        })
      }

      // 5. Time-based Recommendations
      const peakUsageHours = calculatePeakUsageHours(recentActivities)
      if (peakUsageHours.length > 0) {
        newRecommendations.push({
          id: `rec_timing_${Date.now()}`,
          type: 'optimization',
          priority: 'low',
          title: language === 'vi' ? 'Tối ưu thời gian làm việc' : 'Optimize Work Schedule',
          description: language === 'vi'
            ? `Bạn làm việc hiệu quả nhất vào ${peakUsageHours.join(', ')}. Hãy lên kế hoạch tác vụ quan trọng vào thời gian này.`
            : `You're most productive during ${peakUsageHours.join(', ')}. Schedule important tasks during these hours.`,
          benefit: language === 'vi'
            ? 'Tăng hiệu suất cá nhân'
            : 'Improve personal productivity',
          estimatedTime: '2 minutes',
          category: 'productivity',
          action: () => {
            // Track timing optimization
            trackActivity({
              type: 'settings_change',
              mode: 'settings',
              data: { 
                source: 'personalized_recommendation', 
                type: 'timing_optimization',
                peakHours: peakUsageHours 
              },
              success: true
            })
          },
          metadata: {
            basedOn: ['usage_timing', 'productivity_patterns'],
            confidence: 0.65,
            impact: 'medium',
            difficulty: 'easy'
          }
        })
      }

      setRecommendations(newRecommendations)
      setLastGenerated(new Date())
      
      // Track recommendation generation
      trackActivity({
        type: 'ai_interaction',
        mode: 'settings',
        data: {
          action: 'recommendations_generated',
          count: newRecommendations.length,
          basedOnActivities: recentActivities.length
        },
        success: true
      })

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [getRecentActivities, getUserPatterns, getWorkflowEfficiency, language, trackActivity, addSuggestion])

  // Calculate peak usage hours from activities
  const calculatePeakUsageHours = (activities: typeof state.activities) => {
    const hourCounts: Record<number, number> = {}
    
    activities.forEach(activity => {
      const hour = activity.timestamp.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => {
        const h = parseInt(hour)
        return h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`
      })
    
    return sortedHours
  }

  // Handle recommendation action
  const handleRecommendationAction = useCallback((recommendation: Recommendation) => {
    try {
      recommendation.action()
      
      // Mark as completed
      setRecommendations(prev => prev.map(rec => 
        rec.id === recommendation.id 
          ? { ...rec, completed: true }
          : rec
      ))
      
      // Track action
      trackActivity({
        type: 'ai_interaction',
        mode: 'settings',
        data: {
          action: 'recommendation_applied',
          recommendationId: recommendation.id,
          type: recommendation.type,
          category: recommendation.category
        },
        success: true
      })
    } catch (error) {
      console.error('Failed to apply recommendation:', error)
    }
  }, [trackActivity])

  // Handle recommendation dismissal
  const handleRecommendationDismiss = useCallback((recommendationId: string) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === recommendationId 
        ? { ...rec, dismissedAt: new Date() }
        : rec
    ))
    
    trackActivity({
      type: 'ai_interaction',
      mode: 'settings',
      data: {
        action: 'recommendation_dismissed',
        recommendationId
      },
      success: true
    })
  }, [trackActivity])

  // Filter recommendations by category
  const filteredRecommendations = recommendations.filter(rec => {
    if (rec.dismissedAt) return false
    if (activeCategory === 'all') return true
    return rec.category === activeCategory
  })

  // Auto-generate recommendations on component mount
  useEffect(() => {
    if (state.activities.length > 0 && recommendations.length === 0) {
      generateRecommendations()
    }
  }, [state.activities.length, recommendations.length, generateRecommendations])

  // Render recommendation card
  const renderRecommendationCard = (recommendation: Recommendation) => (
    <motion.div
      key={recommendation.id}
      variants={motionSafe(slideUp)}
      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start">
          <div className={`p-2 rounded-lg mr-4 ${
            recommendation.priority === 'high' ? 'bg-red-100' :
            recommendation.priority === 'medium' ? 'bg-yellow-100' :
            'bg-blue-100'
          }`}>
            {recommendation.type === 'workflow' && <Workflow className="w-5 h-5 text-blue-600" />}
            {recommendation.type === 'feature' && <Sparkles className="w-5 h-5 text-purple-600" />}
            {recommendation.type === 'optimization' && <TrendingUp className="w-5 h-5 text-green-600" />}
            {recommendation.type === 'learning' && <Brain className="w-5 h-5 text-orange-600" />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {recommendation.title}
              </h3>
              <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {currentContent.priority[recommendation.priority]}
              </div>
            </div>
            
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              {recommendation.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentContent.benefit}:
                </span>
                <span className="ml-1" style={{ color: 'var(--text-secondary)' }}>
                  {recommendation.benefit}
                </span>
              </div>
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentContent.estimatedTime}:
                </span>
                <span className="ml-1" style={{ color: 'var(--text-secondary)' }}>
                  {recommendation.estimatedTime}
                </span>
              </div>
            </div>
            
            {/* Metadata */}
            <div className="mt-3 flex items-center space-x-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center">
                <Target className="w-3 h-3 mr-1" />
                {currentContent.impact[recommendation.metadata.impact]}
              </div>
              <div className="flex items-center">
                <BarChart3 className="w-3 h-3 mr-1" />
                {currentContent.confidence}: {Math.round(recommendation.metadata.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => handleRecommendationDismiss(recommendation.id)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {recommendation.completed ? (
          <div className="flex items-center text-green-600">
            <Check className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">{currentContent.completed}</span>
          </div>
        ) : (
          <button
            onClick={() => handleRecommendationAction(recommendation)}
            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--notebooklm-primary)',
              color: 'var(--surface-elevated)'
            }}
          >
            {currentContent.apply}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className={`personalized-recommendations ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {currentContent.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {currentContent.subtitle}
          </p>
          {lastGenerated && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {currentContent.lastGenerated}: {lastGenerated.toLocaleString()}
            </p>
          )}
        </div>
        
        <button
          onClick={generateRecommendations}
          disabled={isGenerating}
          className="flex items-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--notebooklm-primary)',
            color: 'var(--surface-elevated)'
          }}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {currentContent.generating}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {currentContent.generateNew}
            </>
          )}
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {(['all', 'productivity', 'efficiency', 'learning', 'automation'] as const).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {currentContent.categories[category]}
          </button>
        ))}
      </div>

      {/* Recommendations */}
      {isGenerating ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--notebooklm-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{currentContent.generating}</p>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>{currentContent.noRecommendations}</p>
        </div>
      ) : (
        <motion.div
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredRecommendations.map(recommendation => renderRecommendationCard(recommendation))}
        </motion.div>
      )}
    </div>
  )
}