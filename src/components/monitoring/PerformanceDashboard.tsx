'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { bundleAnalyzer } from '@/lib/bundle-analyzer'
import { analytics, useAnalytics } from '@/lib/analytics'

// Mock implementation for build compatibility
function usePerformanceMetrics() {
  return {
    metrics: null,
    suggestions: []
  }
}

interface PerformanceDashboardProps {
  isVisible?: boolean
  onClose?: () => void
  isDevelopment?: boolean
}

export default function PerformanceDashboard({
  isVisible = false,
  onClose,
  isDevelopment = process.env.NODE_ENV === 'development'
}: PerformanceDashboardProps) {
  const { metrics, suggestions } = usePerformanceMetrics()
  const { trackFeatureUsage } = useAnalytics()
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'analytics' | 'suggestions'>('overview')
  const [isExpanded, setIsExpanded] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  useEffect(() => {
    if (isVisible) {
      trackFeatureUsage('performance_dashboard_opened')
      // Get analytics summary
      const summary = analytics.getAnalyticsSummary()
      setAnalyticsData(summary)
    }
  }, [isVisible, trackFeatureUsage])

  if (!isDevelopment && !isVisible) {
    return null
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 70) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const performanceScore = metrics ? bundleAnalyzer.generateReport().summary.overallScore : 0

  return (
    <AnimatePresence>
      {(isVisible || isDevelopment) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed ${isExpanded ? 'inset-4' : 'bottom-4 right-4 w-80'} bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                📊 Performance Monitor
                {metrics && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(performanceScore)} ${getScoreColor(performanceScore)}`}>
                    {performanceScore}/100
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title={isExpanded ? 'Minimize' : 'Expand'}
                >
                  {isExpanded ? '⤓' : '⤢'}
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            {isExpanded && (
              <div className="flex space-x-1 mt-3">
                {(['overview', 'resources', 'analytics', 'suggestions'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`${isExpanded ? 'h-96 overflow-y-auto' : 'max-h-64 overflow-y-auto'} p-3`}>
            {!isExpanded ? (
              /* Compact View */
              <div className="space-y-2">
                {metrics && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">FCP</div>
                        <div className="font-medium">{formatTime(metrics.firstContentfulPaint)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">LCP</div>
                        <div className="font-medium">{formatTime(metrics.largestContentfulPaint)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">FID</div>
                        <div className="font-medium">{formatTime(metrics.firstInputDelay)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">CLS</div>
                        <div className="font-medium">{metrics.cumulativeLayoutShift.toFixed(3)}</div>
                      </div>
                    </div>

                    {metrics.bundleMetrics && (
                      <div className="text-xs">
                        <div className="text-gray-500">Bundle Size</div>
                        <div className="font-medium">{formatBytes(metrics.bundleMetrics.bundleSize)}</div>
                      </div>
                    )}
                  </>
                )}

                {suggestions.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div className="font-medium text-yellow-800">{suggestions.length} optimization(s)</div>
                    <div className="text-yellow-700 truncate">{suggestions[0]}</div>
                  </div>
                )}
              </div>
            ) : (
              /* Expanded View */
              <div className="space-y-4">
                {activeTab === 'overview' && metrics && (
                  <div className="space-y-4">
                    {/* Core Web Vitals */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Core Web Vitals</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">First Contentful Paint</div>
                          <div className="text-lg font-semibold">{formatTime(metrics.firstContentfulPaint)}</div>
                          <div className="text-xs text-gray-500">Target: < 1.8s</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Largest Contentful Paint</div>
                          <div className="text-lg font-semibold">{formatTime(metrics.largestContentfulPaint)}</div>
                          <div className="text-xs text-gray-500">Target: < 2.5s</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">First Input Delay</div>
                          <div className="text-lg font-semibold">{formatTime(metrics.firstInputDelay)}</div>
                          <div className="text-xs text-gray-500">Target: < 100ms</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Cumulative Layout Shift</div>
                          <div className="text-lg font-semibold">{metrics.cumulativeLayoutShift.toFixed(3)}</div>
                          <div className="text-xs text-gray-500">Target: < 0.1</div>
                        </div>
                      </div>
                    </div>

                    {/* Bundle Information */}
                    {metrics.bundleMetrics && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Bundle Information</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Bundle Size:</span>
                              <span className="ml-2 font-medium">{formatBytes(metrics.bundleMetrics.bundleSize)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Gzipped:</span>
                              <span className="ml-2 font-medium">{formatBytes(metrics.bundleMetrics.gzippedSize)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Load Time:</span>
                              <span className="ml-2 font-medium">{formatTime(metrics.bundleMetrics.loadTime)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Assets:</span>
                              <span className="ml-2 font-medium">{metrics.bundleMetrics.assets.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'resources' && metrics?.bundleMetrics && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Resource Analysis</h4>
                    <div className="space-y-2">
                      {metrics.bundleMetrics.assets.slice(0, 10).map((asset, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <div className="flex-1 truncate">
                            <div className="font-medium">{asset.name.split('/').pop()}</div>
                            <div className="text-gray-500">{asset.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatBytes(asset.size)}</div>
                            {asset.loadTime && (
                              <div className="text-gray-500">{formatTime(asset.loadTime)}</div>
                            )}
                          </div>
                          {asset.cached && (
                            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full" title="Cached"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && analyticsData && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Analytics Summary</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Total Events:</span>
                          <span className="ml-2 font-medium">{analyticsData.totalEvents}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Session Duration:</span>
                          <span className="ml-2 font-medium">{formatTime(analyticsData.sessionDuration)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs mb-2">Most Frequent Events</div>
                        <div className="space-y-1">
                          {analyticsData.mostFrequentEvents.map((event: any, index: number) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span>{event.name}</span>
                              <span className="font-medium">{event.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs mb-2">Recent Events</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {analyticsData.recentEvents.map((event: any, index: number) => (
                            <div key={index} className="text-xs p-1 bg-gray-50 rounded">
                              <div className="font-medium">{event.name}</div>
                              <div className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Optimization Suggestions</h4>
                    {suggestions.length > 0 ? (
                      <div className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                          <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="text-sm text-yellow-800">{suggestion}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <div className="text-2xl mb-2">🎉</div>
                        <div className="text-sm">No optimization suggestions!</div>
                        <div className="text-xs">Your app is performing well.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {isExpanded && (
            <div className="border-t border-gray-200 p-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const report = bundleAnalyzer.generateReport()
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `performance-report-${Date.now()}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                    trackFeatureUsage('performance_report_exported')
                  }}
                  className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Export Report
                </button>
                <button
                  onClick={() => {
                    bundleAnalyzer.cleanup()
                    window.location.reload()
                  }}
                  className="flex-1 px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Reset Metrics
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for development mode toggle
export function usePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to toggle performance monitor
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev)
  }
}