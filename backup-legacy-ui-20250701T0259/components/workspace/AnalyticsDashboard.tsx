'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Clock,
  Globe,
  FileText,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  Target,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAnalyticsPipeline } from '@/contexts/PipelineContext'
import { analyticsService, UserMetrics, SystemMetrics, PerformanceMetrics } from '@/lib/analytics-service'

interface AnalyticsDashboardProps {
  className?: string
}

export default function AnalyticsDashboard({
  className = '',
}: AnalyticsDashboardProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()
  const { getUserMetrics, getSystemMetrics, status } = useAnalyticsPipeline()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'user' | 'system' | 'performance'>('overview')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d')
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [realTimeData, setRealTimeData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const content = {
    vi: {
      title: 'Bảng điều khiển phân tích',
      subtitle: 'Thống kê và phân tích sử dụng chi tiết',
      tabs: {
        overview: 'Tổng quan',
        user: 'Cá nhân',
        system: 'Hệ thống',
        performance: 'Hiệu suất',
      },
      timeRanges: {
        '24h': '24 giờ',
        '7d': '7 ngày',
        '30d': '30 ngày',
        '90d': '90 ngày',
      },
      metrics: {
        totalTranslations: 'Tổng số dịch',
        wordsTranslated: 'Từ đã dịch',
        accuracy: 'Độ chính xác',
        timeSpent: 'Thời gian sử dụng',
        avgResponseTime: 'Thời gian phản hồi TB',
        activeUsers: 'Người dùng hoạt động',
        systemLoad: 'Tải hệ thống',
        errorRate: 'Tỷ lệ lỗi',
        cacheHitRate: 'Tỷ lệ cache hit',
        uptime: 'Thời gian hoạt động',
      },
      charts: {
        usageOverTime: 'Sử dụng theo thời gian',
        languageDistribution: 'Phân bố ngôn ngữ',
        deviceBreakdown: 'Thiết bị sử dụng',
        performanceTrends: 'Xu hướng hiệu suất',
        errorAnalysis: 'Phân tích lỗi',
      },
      actions: {
        refresh: 'Làm mới',
        export: 'Xuất dữ liệu',
        downloadReport: 'Tải báo cáo',
      },
      status: {
        excellent: 'Xuất sắc',
        good: 'Tốt',
        warning: 'Cảnh báo',
        critical: 'Nghiêm trọng',
      },
    },
    en: {
      title: 'Analytics Dashboard',
      subtitle: 'Detailed usage statistics and analytics',
      tabs: {
        overview: 'Overview',
        user: 'Personal',
        system: 'System',
        performance: 'Performance',
      },
      timeRanges: {
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days',
      },
      metrics: {
        totalTranslations: 'Total Translations',
        wordsTranslated: 'Words Translated',
        accuracy: 'Accuracy',
        timeSpent: 'Time Spent',
        avgResponseTime: 'Avg Response Time',
        activeUsers: 'Active Users',
        systemLoad: 'System Load',
        errorRate: 'Error Rate',
        cacheHitRate: 'Cache Hit Rate',
        uptime: 'Uptime',
      },
      charts: {
        usageOverTime: 'Usage Over Time',
        languageDistribution: 'Language Distribution',
        deviceBreakdown: 'Device Breakdown',
        performanceTrends: 'Performance Trends',
        errorAnalysis: 'Error Analysis',
      },
      actions: {
        refresh: 'Refresh',
        export: 'Export Data',
        downloadReport: 'Download Report',
      },
      status: {
        excellent: 'Excellent',
        good: 'Good',
        warning: 'Warning',
        critical: 'Critical',
      },
    },
  }

  const currentContent = content[language]

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange, activeTab, user])

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'overview') {
        loadRealTimeData()
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [activeTab])

  const loadAnalyticsData = async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Starting pipeline analytics data loading', {
        activeTab,
        timeRange,
        userId: user.id
      })

      const promises = []

      if (activeTab === 'user' || activeTab === 'overview') {
        promises.push(getUserMetrics(timeRange))
      }
      
      if (activeTab === 'system' || activeTab === 'overview') {
        promises.push(getSystemMetrics(timeRange))
      }
      
      if (activeTab === 'performance' || activeTab === 'overview') {
        // Fallback to analytics service for performance metrics (not implemented in pipeline yet)
        promises.push(analyticsService.getPerformanceMetrics(timeRange))
      }

      const results = await Promise.all(promises)
      
      let resultIndex = 0
      if (activeTab === 'user' || activeTab === 'overview') {
        const userResponse = results[resultIndex++]
        if (userResponse.status === 'completed' && userResponse.result) {
          setUserMetrics(userResponse.result as UserMetrics)
        }
      }
      if (activeTab === 'system' || activeTab === 'overview') {
        const systemResponse = results[resultIndex++]
        if (systemResponse.status === 'completed' && systemResponse.result) {
          setSystemMetrics(systemResponse.result as SystemMetrics)
        }
      }
      if (activeTab === 'performance' || activeTab === 'overview') {
        setPerformanceMetrics(results[resultIndex++] as PerformanceMetrics)
      }

      console.log('✅ Pipeline analytics data loading completed')

    } catch (err) {
      console.error('❌ Pipeline analytics data loading failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRealTimeData = async () => {
    try {
      const data = await analyticsService.getRealTimeMetrics()
      setRealTimeData(data)
    } catch (err) {
      console.error('Failed to load real-time data:', err)
    }
  }

  const getStatusColor = (value: number, thresholds: { excellent: number; good: number; warning: number }) => {
    if (value >= thresholds.excellent) return 'text-green-600 bg-green-100'
    if (value >= thresholds.good) return 'text-blue-600 bg-blue-100'
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusText = (value: number, thresholds: { excellent: number; good: number; warning: number }) => {
    if (value >= thresholds.excellent) return currentContent.status.excellent
    if (value >= thresholds.good) return currentContent.status.good
    if (value >= thresholds.warning) return currentContent.status.warning
    return currentContent.status.critical
  }

  // Render metric card
  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    trend?: { value: number; isPositive: boolean },
    status?: { value: number; thresholds: any }
  ) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-50 rounded-lg mr-3">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.value, status.thresholds)}`}>
            {getStatusText(status.value, status.thresholds)}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  )

  // Render overview tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Real-time metrics */}
      {realTimeData && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Real-time Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{realTimeData.activeUsers}</p>
              <p className="text-blue-100 text-sm">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{realTimeData.translationsInProgress}</p>
              <p className="text-blue-100 text-sm">Translations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(realTimeData.systemLoad)}%</p>
              <p className="text-blue-100 text-sm">System Load</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(realTimeData.responseTime)}ms</p>
              <p className="text-blue-100 text-sm">Response Time</p>
            </div>
          </div>
        </div>
      )}

      {/* Key metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userMetrics && (
          <>
            {renderMetricCard(
              currentContent.metrics.totalTranslations,
              userMetrics.totalTranslations.toLocaleString(),
              <FileText className="w-5 h-5 text-blue-600" />,
              { value: 12, isPositive: true }
            )}
            {renderMetricCard(
              currentContent.metrics.wordsTranslated,
              userMetrics.wordsTranslated.toLocaleString(),
              <Globe className="w-5 h-5 text-green-600" />,
              { value: 8, isPositive: true }
            )}
            {renderMetricCard(
              currentContent.metrics.accuracy,
              `${Math.round(userMetrics.avgAccuracy)}%`,
              <Target className="w-5 h-5 text-purple-600" />,
              undefined,
              { 
                value: userMetrics.avgAccuracy,
                thresholds: { excellent: 95, good: 85, warning: 70 }
              }
            )}
          </>
        )}

        {systemMetrics && (
          <>
            {renderMetricCard(
              currentContent.metrics.activeUsers,
              systemMetrics.activeUsers.toLocaleString(),
              <Users className="w-5 h-5 text-indigo-600" />,
              { value: 15, isPositive: true }
            )}
            {renderMetricCard(
              currentContent.metrics.errorRate,
              `${systemMetrics.errorRate.toFixed(1)}%`,
              <AlertTriangle className="w-5 h-5 text-red-600" />,
              { value: 2, isPositive: false },
              {
                value: 100 - systemMetrics.errorRate,
                thresholds: { excellent: 99, good: 95, warning: 90 }
              }
            )}
          </>
        )}

        {performanceMetrics && (
          <>
            {renderMetricCard(
              currentContent.metrics.avgResponseTime,
              `${Math.round(performanceMetrics.avgTranslationTime)}ms`,
              <Zap className="w-5 h-5 text-yellow-600" />,
              { value: 5, isPositive: false },
              {
                value: 2000 - performanceMetrics.avgTranslationTime,
                thresholds: { excellent: 1500, good: 1000, warning: 500 }
              }
            )}
          </>
        )}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentContent.charts.usageOverTime}
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart visualization coming soon</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentContent.charts.languageDistribution}
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Render user metrics tab
  const renderUserMetrics = () => (
    <div className="space-y-6">
      {userMetrics ? (
        <>
          {/* User stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderMetricCard(
              currentContent.metrics.totalTranslations,
              userMetrics.totalTranslations.toLocaleString(),
              <FileText className="w-5 h-5 text-blue-600" />
            )}
            {renderMetricCard(
              currentContent.metrics.wordsTranslated,
              userMetrics.wordsTranslated.toLocaleString(),
              <Globe className="w-5 h-5 text-green-600" />
            )}
            {renderMetricCard(
              'Efficiency Score',
              Math.round(userMetrics.efficiency),
              <TrendingUp className="w-5 h-5 text-purple-600" />
            )}
            {renderMetricCard(
              'Session Count',
              userMetrics.sessionCount,
              <Activity className="w-5 h-5 text-orange-600" />
            )}
          </div>

          {/* User insights */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Most Used Language Pair</h4>
                <p className="text-2xl font-bold text-blue-600">{userMetrics.mostUsedLanguagePair}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Average Words per Day</h4>
                <p className="text-2xl font-bold text-green-600">{Math.round(userMetrics.avgWordsPerDay)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Total Time Spent</h4>
                <p className="text-2xl font-bold text-purple-600">{Math.round(userMetrics.timeSpent)} min</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Language Pairs Used</h4>
                <p className="text-2xl font-bold text-orange-600">{userMetrics.languagePairs}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No user metrics available</p>
        </div>
      )}
    </div>
  )

  // Render system metrics tab
  const renderSystemMetrics = () => (
    <div className="space-y-6">
      {systemMetrics ? (
        <>
          {/* System stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderMetricCard(
              'Total Users',
              systemMetrics.totalUsers.toLocaleString(),
              <Users className="w-5 h-5 text-blue-600" />
            )}
            {renderMetricCard(
              'API Calls',
              systemMetrics.totalApiCalls.toLocaleString(),
              <Zap className="w-5 h-5 text-green-600" />
            )}
            {renderMetricCard(
              'Avg Response Time',
              `${Math.round(systemMetrics.avgResponseTime)}ms`,
              <Clock className="w-5 h-5 text-purple-600" />
            )}
            {renderMetricCard(
              'Error Rate',
              `${systemMetrics.errorRate.toFixed(1)}%`,
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
          </div>

          {/* Device breakdown */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentContent.charts.deviceBreakdown}</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <Monitor className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Desktop</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(systemMetrics.deviceBreakdown.desktop)}%</p>
              </div>
              <div className="text-center">
                <Smartphone className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Mobile</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(systemMetrics.deviceBreakdown.mobile)}%</p>
              </div>
              <div className="text-center">
                <Tablet className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Tablet</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(systemMetrics.deviceBreakdown.tablet)}%</p>
              </div>
            </div>
          </div>

          {/* Popular languages */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Languages</h3>
            <div className="space-y-3">
              {systemMetrics.popularLanguages.slice(0, 5).map((lang, index) => (
                <div key={lang.language} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{lang.language}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${lang.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {lang.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No system metrics available</p>
        </div>
      )}
    </div>
  )

  // Render performance metrics tab
  const renderPerformanceMetrics = () => (
    <div className="space-y-6">
      {performanceMetrics ? (
        <>
          {/* Performance stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderMetricCard(
              'Cache Hit Rate',
              `${performanceMetrics.cacheHitRate.toFixed(1)}%`,
              <CheckCircle className="w-5 h-5 text-green-600" />,
              undefined,
              { 
                value: performanceMetrics.cacheHitRate,
                thresholds: { excellent: 90, good: 75, warning: 60 }
              }
            )}
            {renderMetricCard(
              'System Uptime',
              `${performanceMetrics.systemUptime}%`,
              <Activity className="w-5 h-5 text-blue-600" />,
              undefined,
              { 
                value: performanceMetrics.systemUptime,
                thresholds: { excellent: 99.5, good: 99, warning: 95 }
              }
            )}
            {renderMetricCard(
              'Memory Usage',
              `${performanceMetrics.memoryUsage}%`,
              <Monitor className="w-5 h-5 text-orange-600" />,
              undefined,
              { 
                value: 100 - performanceMetrics.memoryUsage,
                thresholds: { excellent: 30, good: 20, warning: 10 }
              }
            )}
            {renderMetricCard(
              'CPU Usage',
              `${performanceMetrics.cpuUsage}%`,
              <Zap className="w-5 h-5 text-purple-600" />,
              undefined,
              { 
                value: 100 - performanceMetrics.cpuUsage,
                thresholds: { excellent: 40, good: 30, warning: 20 }
              }
            )}
          </div>

          {/* Error analysis */}
          {Object.keys(performanceMetrics.errorCounts).length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentContent.charts.errorAnalysis}</h3>
              <div className="space-y-3">
                {Object.entries(performanceMetrics.errorCounts).map(([errorType, count]) => (
                  <div key={errorType} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{errorType}</span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No performance metrics available</p>
        </div>
      )}
    </div>
  )

  return (
    <div className={`analytics-dashboard ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{currentContent.title}</h2>
          <p className="text-gray-600">{currentContent.subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time range selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(currentContent.timeRanges).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          {/* Actions */}
          <button
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            {currentContent.actions.export}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-8 border-b border-gray-200">
        {(['overview', 'user', 'system', 'performance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {currentContent.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mr-3" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && !error && (
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'user' && renderUserMetrics()}
          {activeTab === 'system' && renderSystemMetrics()}
          {activeTab === 'performance' && renderPerformanceMetrics()}
        </div>
      )}
    </div>
  )
}