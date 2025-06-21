/**
 * Advanced Analytics Dashboard
 * Comprehensive visualization of business metrics, user insights, and system performance
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Zap,
  DollarSign,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Target
} from 'lucide-react'
import { analytics, BusinessMetrics, UserInsight, LanguageInsights, SystemInsights } from '@/lib/analytics/advanced-analytics'

interface MetricCard {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
}

export const AnalyticsDashboard: React.FC = () => {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [systemInsights, setSystemInsights] = useState<SystemInsights | null>(null)
  const [languageInsights, setLanguageInsights] = useState<LanguageInsights[]>([])
  const [topEvents, setTopEvents] = useState<Array<{ event: string; count: number }>>([])
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'languages' | 'performance' | 'business'>('overview')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadAnalyticsData()
    const interval = setInterval(loadAnalyticsData, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dateRange])

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      const [business, system, languages, events] = await Promise.all([
        analytics.calculateBusinessMetrics(),
        analytics.generateSystemInsights(),
        analytics.generateLanguageInsights(),
        analytics.getTopEvents(10)
      ])

      setBusinessMetrics(business)
      setSystemInsights(system)
      setLanguageInsights(languages)
      setTopEvents(events)
      setLastUpdate(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    const data = analytics.exportAnalytics('json')
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prismy-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getOverviewMetrics = (): MetricCard[] => {
    if (!businessMetrics || !systemInsights) return []

    return [
      {
        title: 'Total Revenue',
        value: `$${businessMetrics.revenue.total.toLocaleString()}`,
        change: businessMetrics.revenue.growth,
        icon: <DollarSign className="h-6 w-6" />,
        color: 'text-green-500'
      },
      {
        title: 'Active Users',
        value: businessMetrics.users.active.toLocaleString(),
        change: 15.2,
        icon: <Users className="h-6 w-6" />,
        color: 'text-blue-500'
      },
      {
        title: 'Translations',
        value: businessMetrics.usage.totalTranslations.toLocaleString(),
        change: 8.7,
        icon: <Globe className="h-6 w-6" />,
        color: 'text-purple-500'
      },
      {
        title: 'Avg Response Time',
        value: `${systemInsights.performance.responseTime.p50}ms`,
        change: -12.3,
        icon: <Zap className="h-6 w-6" />,
        color: 'text-yellow-500'
      },
      {
        title: 'Success Rate',
        value: `${(businessMetrics.performance.successRate * 100).toFixed(1)}%`,
        change: 2.1,
        icon: <CheckCircle className="h-6 w-6" />,
        color: 'text-green-500'
      },
      {
        title: 'Uptime',
        value: `${systemInsights.reliability.uptime}%`,
        change: 0.05,
        icon: <Activity className="h-6 w-6" />,
        color: 'text-green-500'
      }
    ]
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getOverviewMetrics().map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={metric.color}>{metric.icon}</div>
              {metric.change !== undefined && (
                <div className={`flex items-center text-sm ${
                  metric.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <BarChart3 className="h-16 w-16 mb-2" />
            <p>Revenue chart would be implemented here</p>
          </div>
        </div>

        {/* Usage Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation Volume</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <Activity className="h-16 w-16 mb-2" />
            <p>Usage chart would be implemented here</p>
          </div>
        </div>
      </div>

      {/* Top Events */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Events</h3>
        <div className="space-y-3">
          {topEvents.map((event, index) => (
            <div key={event.event} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                  {index + 1}
                </div>
                <span className="text-gray-900">{event.event.replace('_', ' ')}</span>
              </div>
              <span className="text-gray-600 font-medium">{event.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderLanguagesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Language Pair Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language Pair
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satisfaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {languageInsights.slice(0, 10).map((insight, index) => (
                <tr key={`${insight.pair.from}-${insight.pair.to}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {insight.pair.from.toUpperCase()} → {insight.pair.to.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {insight.volume.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${insight.accuracy * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {(insight.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {'★'.repeat(Math.floor(insight.userSatisfaction))}
                      <span className="ml-1 text-sm text-gray-600">
                        {insight.userSatisfaction.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    ${insight.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {systemInsights && (
        <>
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Clock className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {systemInsights.performance.responseTime.p50}ms
                </span>
              </div>
              <h3 className="font-medium text-gray-900">P50 Response Time</h3>
              <p className="text-sm text-gray-600">Median response time</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Zap className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {systemInsights.performance.throughput.rps.toFixed(1)}
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Requests/sec</h3>
              <p className="text-sm text-gray-600">Current throughput</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {systemInsights.reliability.uptime}%
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Uptime</h3>
              <p className="text-sm text-gray-600">System availability</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {systemInsights.reliability.slaCompliance}%
                </span>
              </div>
              <h3 className="font-medium text-gray-900">SLA Compliance</h3>
              <p className="text-sm text-gray-600">Service level agreement</p>
            </div>
          </div>

          {/* Resource Utilization */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'CPU', value: systemInsights.performance.resourceUtilization.cpu, color: 'bg-blue-500' },
                { name: 'Memory', value: systemInsights.performance.resourceUtilization.memory, color: 'bg-green-500' },
                { name: 'Storage', value: systemInsights.performance.resourceUtilization.storage, color: 'bg-yellow-500' }
              ].map((resource) => (
                <div key={resource.name} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-2">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12" cy="12" r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-gray-200"
                      />
                      <circle
                        cx="12" cy="12" r="10"
                        fill="none"
                        strokeWidth="2"
                        strokeDasharray={`${resource.value * 0.628} 62.8`}
                        className={resource.color.replace('bg-', 'stroke-')}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-900">{resource.value}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottlenecks & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Bottlenecks</h3>
              <div className="space-y-3">
                {systemInsights.capacity.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className={`h-5 w-5 mr-2 ${
                        bottleneck.severity === 'high' ? 'text-red-500' :
                        bottleneck.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <span className="text-gray-900">{bottleneck.component}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bottleneck.severity === 'high' ? 'bg-red-100 text-red-800' :
                      bottleneck.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bottleneck.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scaling Recommendations</h3>
              <div className="space-y-3">
                {systemInsights.capacity.scalingRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderBusinessTab = () => (
    <div className="space-y-6">
      {businessMetrics && (
        <>
          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">
                  ${businessMetrics.revenue.mrr.toLocaleString()}
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Monthly Recurring Revenue</h3>
              <p className="text-sm text-gray-600">Current MRR</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">
                  ${businessMetrics.revenue.arr.toLocaleString()}
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Annual Recurring Revenue</h3>
              <p className="text-sm text-gray-600">Projected ARR</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {((1 - businessMetrics.users.retention.monthly) * 100).toFixed(1)}%
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Churn Rate</h3>
              <p className="text-sm text-gray-600">Monthly customer churn</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {((businessMetrics.users.conversions / businessMetrics.users.total) * 100).toFixed(1)}%
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Conversion Rate</h3>
              <p className="text-sm text-gray-600">Signup to subscription</p>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {businessMetrics.usage.totalTranslations.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Total Translations</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {(businessMetrics.usage.totalCharacters / 1000000).toFixed(1)}M
                </div>
                <p className="text-sm text-gray-600">Characters Processed</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {Math.round(businessMetrics.usage.averageTranslationLength)}
                </div>
                <p className="text-sm text-gray-600">Avg Translation Length</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (isLoading && !businessMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Comprehensive insights into your translation platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Last Update */}
      <div className="text-sm text-gray-500">
        Last updated: {lastUpdate.toLocaleString()}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'business', label: 'Business', icon: DollarSign },
            { id: 'languages', label: 'Languages', icon: Globe },
            { id: 'performance', label: 'Performance', icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'business' && renderBusinessTab()}
        {selectedTab === 'languages' && renderLanguagesTab()}
        {selectedTab === 'performance' && renderPerformanceTab()}
      </div>
    </div>
  )
}

export default AnalyticsDashboard