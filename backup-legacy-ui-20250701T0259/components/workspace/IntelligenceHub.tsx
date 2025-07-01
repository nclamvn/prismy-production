'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceIntelligence } from '@/contexts/WorkspaceIntelligenceContext'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { motionSafe, slideUp, fadeIn, staggerContainer } from '@/lib/motion'
import {
  Brain,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Search,
  Lightbulb,
  ArrowRight,
  Activity,
  FileText,
  Languages,
  Settings,
  Play,
  Pause,
  MoreHorizontal,
  Star,
  Target
} from 'lucide-react'

interface IntelligenceHubProps {
  className?: string
}

export default function IntelligenceHub({ className = '' }: IntelligenceHubProps) {
  const { language } = useSSRSafeLanguage()
  const {
    state,
    getActiveOperations,
    getSuggestionsByPriority,
    getRecentActivities,
    getUserPatterns,
    getWorkflowEfficiency,
    removeSuggestion,
    setMode,
    trackActivity
  } = useWorkspaceIntelligence()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<'overview' | 'operations' | 'suggestions' | 'insights'>('overview')

  const content = {
    vi: {
      title: 'Trung tâm Thông minh',
      subtitle: 'Tổng quan hoạt động AI và gợi ý thông minh',
      tabs: {
        overview: 'Tổng quan',
        operations: 'Hoạt động AI',
        suggestions: 'Gợi ý',
        insights: 'Phân tích'
      },
      activeOperations: 'Hoạt động đang chạy',
      smartSuggestions: 'Gợi ý thông minh',
      recentActivity: 'Hoạt động gần đây',
      workflowEfficiency: 'Hiệu suất làm việc',
      quickActions: 'Hành động nhanh',
      searchPlaceholder: 'Tìm kiếm trong workspace...',
      noOperations: 'Không có hoạt động AI nào đang chạy',
      noSuggestions: 'Không có gợi ý mới',
      viewAll: 'Xem tất cả',
      accept: 'Chấp nhận',
      dismiss: 'Bỏ qua'
    },
    en: {
      title: 'Intelligence Hub',
      subtitle: 'AI operations overview and smart suggestions',
      tabs: {
        overview: 'Overview',
        operations: 'AI Operations',
        suggestions: 'Suggestions',
        insights: 'Insights'
      },
      activeOperations: 'Active Operations',
      smartSuggestions: 'Smart Suggestions',
      recentActivity: 'Recent Activity',
      workflowEfficiency: 'Workflow Efficiency',
      quickActions: 'Quick Actions',
      searchPlaceholder: 'Search workspace...',
      noOperations: 'No AI operations running',
      noSuggestions: 'No new suggestions',
      viewAll: 'View All',
      accept: 'Accept',
      dismiss: 'Dismiss'
    }
  }

  const currentContent = content[language]
  const activeOperations = getActiveOperations()
  const highPrioritySuggestions = getSuggestionsByPriority('high')
  const recentActivities = getRecentActivities(5)
  const workflowEfficiency = getWorkflowEfficiency()
  const userPatterns = getUserPatterns()

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'translation': return Languages
      case 'document_processing': return FileText
      case 'analysis': return Brain
      case 'suggestion': return Lightbulb
      default: return Activity
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'translation': return Languages
      case 'document_upload': return FileText
      case 'ai_interaction': return Brain
      case 'navigation': return ArrowRight
      case 'settings_change': return Settings
      default: return Activity
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  const handleSuggestionAction = (suggestionId: string, action: () => void) => {
    try {
      action()
      removeSuggestion(suggestionId)
      trackActivity({
        type: 'ai_interaction',
        mode: state.currentMode,
        data: { action: 'suggestion_accepted', suggestionId },
        success: true
      })
    } catch (error) {
      console.error('Failed to execute suggestion action:', error)
    }
  }

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderOverview = () => (
    <motion.div
      variants={motionSafe(staggerContainer)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Operations */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div 
                className="p-2 rounded-lg mr-3"
                style={{ backgroundColor: 'var(--notebooklm-primary-light)' }}
              >
                <Brain className="w-4 h-4" style={{ color: 'var(--notebooklm-primary)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentContent.activeOperations}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {activeOperations.length} running
                </p>
              </div>
            </div>
            {activeOperations.length > 0 && (
              <div className="animate-pulse">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success-500)' }} />
              </div>
            )}
          </div>
        </motion.div>

        {/* Workflow Efficiency */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div 
                className="p-2 rounded-lg mr-3"
                style={{ backgroundColor: workflowEfficiency > 80 ? 'var(--success-100)' : 'var(--warning-100)' }}
              >
                <TrendingUp className="w-4 h-4" style={{ 
                  color: workflowEfficiency > 80 ? 'var(--success-500)' : 'var(--warning-500)' 
                }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentContent.workflowEfficiency}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(workflowEfficiency)}% success rate
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Smart Suggestions */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div 
                className="p-2 rounded-lg mr-3"
                style={{ backgroundColor: 'var(--notebooklm-primary-light)' }}
              >
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--notebooklm-primary)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentContent.smartSuggestions}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {state.suggestions.length} available
                </p>
              </div>
            </div>
            {highPrioritySuggestions.length > 0 && (
              <div className="flex items-center">
                <Star className="w-3 h-3 mr-1" style={{ color: 'var(--warning-500)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--warning-500)' }}>
                  {highPrioritySuggestions.length}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Operations & Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Operations */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="p-6 rounded-xl"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentContent.activeOperations}
            </h3>
            {activeOperations.length > 3 && (
              <button
                onClick={() => setSelectedTab('operations')}
                className="text-sm transition-colors"
                style={{ color: 'var(--notebooklm-primary)' }}
              >
                {currentContent.viewAll}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {activeOperations.length === 0 ? (
              <div className="text-center py-8">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-panel)' }}
                >
                  <Brain className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {currentContent.noOperations}
                </p>
              </div>
            ) : (
              activeOperations.slice(0, 3).map((operation) => {
                const Icon = getOperationIcon(operation.type)
                const duration = Date.now() - operation.startTime.getTime()
                
                return (
                  <div
                    key={operation.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-panel)' }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="p-2 rounded-lg mr-3"
                        style={{ backgroundColor: 'var(--notebooklm-primary-light)' }}
                      >
                        <Icon className="w-4 h-4" style={{ color: 'var(--notebooklm-primary)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {operation.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {formatDuration(duration)} • {operation.progress}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: 'var(--success-500)' }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Smart Suggestions */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="p-6 rounded-xl"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentContent.smartSuggestions}
            </h3>
            {state.suggestions.length > 3 && (
              <button
                onClick={() => setSelectedTab('suggestions')}
                className="text-sm transition-colors"
                style={{ color: 'var(--notebooklm-primary)' }}
              >
                {currentContent.viewAll}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {state.suggestions.length === 0 ? (
              <div className="text-center py-8">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-panel)' }}
                >
                  <Lightbulb className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {currentContent.noSuggestions}
                </p>
              </div>
            ) : (
              state.suggestions.slice(0, 3).map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--surface-panel)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="text-sm font-medium mr-2" style={{ color: 'var(--text-primary)' }}>
                          {suggestion.title}
                        </h4>
                        {suggestion.priority === 'high' && (
                          <div 
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: 'var(--warning-100)', 
                              color: 'var(--warning-700)' 
                            }}
                          >
                            High Priority
                          </div>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => removeSuggestion(suggestion.id)}
                      className="px-3 py-1 text-xs transition-colors rounded"
                      style={{ 
                        color: 'var(--text-secondary)',
                        backgroundColor: 'transparent'
                      }}
                    >
                      {currentContent.dismiss}
                    </button>
                    <button
                      onClick={() => handleSuggestionAction(suggestion.id, suggestion.action)}
                      className="px-3 py-1 text-xs font-medium transition-colors rounded"
                      style={{ 
                        backgroundColor: 'var(--notebooklm-primary)',
                        color: 'var(--surface-elevated)'
                      }}
                    >
                      {currentContent.accept}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )

  const renderOperations = () => (
    <motion.div
      variants={motionSafe(fadeIn)}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {activeOperations.map((operation) => {
        const Icon = getOperationIcon(operation.type)
        const duration = Date.now() - operation.startTime.getTime()
        
        return (
          <div
            key={operation.id}
            className="p-4 rounded-xl"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--surface-outline)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div 
                  className="p-2 rounded-lg mr-3"
                  style={{ backgroundColor: 'var(--notebooklm-primary-light)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--notebooklm-primary)' }} />
                </div>
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {operation.type.replace('_', ' ')}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Started {formatDuration(duration)} ago
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {operation.progress}%
                </span>
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--success-500)' }}
                />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div 
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--surface-outline)' }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${operation.progress}%`,
                  backgroundColor: 'var(--notebooklm-primary)'
                }}
              />
            </div>
          </div>
        )
      })}
    </motion.div>
  )

  const renderSuggestions = () => (
    <motion.div
      variants={motionSafe(fadeIn)}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {state.suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)'
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="font-medium mr-2" style={{ color: 'var(--text-primary)' }}>
                  {suggestion.title}
                </h3>
                <div 
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                    suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}
                >
                  {suggestion.priority}
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {suggestion.description}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => removeSuggestion(suggestion.id)}
              className="px-4 py-2 text-sm transition-colors rounded"
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-panel)'
              }}
            >
              {currentContent.dismiss}
            </button>
            <button
              onClick={() => handleSuggestionAction(suggestion.id, suggestion.action)}
              className="px-4 py-2 text-sm font-medium transition-colors rounded"
              style={{ 
                backgroundColor: 'var(--notebooklm-primary)',
                color: 'var(--surface-elevated)'
              }}
            >
              {currentContent.accept}
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  )

  const renderInsights = () => (
    <motion.div
      variants={motionSafe(fadeIn)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Usage Patterns */}
      <div
        className="p-6 rounded-xl"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--surface-outline)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Usage Patterns
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(userPatterns.featureUsage).map(([feature, count]) => (
            <div key={feature} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {feature.replace('_', ' ')}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="p-6 rounded-xl"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--surface-outline)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {currentContent.recentActivity}
        </h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-center">
                <div 
                  className="p-1.5 rounded-lg mr-3"
                  style={{ backgroundColor: 'var(--surface-panel)' }}
                >
                  <Icon className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {activity.type.replace('_', ' ')} in {activity.mode}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {activity.success ? (
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--success-500)' }} />
                ) : (
                  <AlertCircle className="w-4 h-4" style={{ color: 'var(--error-500)' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {currentContent.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {currentContent.subtitle}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
            style={{ color: 'var(--text-muted)' }} 
          />
          <input
            type="text"
            placeholder={currentContent.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 rounded-lg border transition-colors"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--surface-outline)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-panel)' }}>
        {(['overview', 'operations', 'suggestions', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className="px-4 py-2 text-sm font-medium rounded-md transition-all"
            style={{
              backgroundColor: selectedTab === tab ? 'var(--surface-elevated)' : 'transparent',
              color: selectedTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              ...(selectedTab === tab && { boxShadow: 'var(--elevation-level-1)' })
            }}
          >
            {currentContent.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'operations' && renderOperations()}
        {selectedTab === 'suggestions' && renderSuggestions()}
        {selectedTab === 'insights' && renderInsights()}
      </AnimatePresence>
    </div>
  )
}