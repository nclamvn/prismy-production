'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Monitor,
  Shield,
  DollarSign,
  Globe,
  Smartphone,
  Download,
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react'

interface AnalyticsDashboardProps {
  className?: string
}

interface MetricCard {
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
  }>
}

export default function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'performance' | 'errors' | 'revenue'>('overview')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Simulate API calls - replace with actual endpoints
      const [metricsRes, analyticsRes, errorsRes, performanceRes] = await Promise.all([
        fetch(`/api/admin/metrics?timeRange=${timeRange}`),
        fetch(`/api/admin/analytics?timeRange=${timeRange}`),
        fetch(`/api/admin/errors?timeRange=${timeRange}`),
        fetch(`/api/admin/performance?timeRange=${timeRange}`)
      ])

      // For now, simulate data
      setData({
        metrics: await simulateMetrics(),
        analytics: await simulateAnalytics(),
        errors: await simulateErrors(),
        performance: await simulatePerformance()
      })
      
      setAlerts(await simulateAlerts())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const simulateMetrics = async (): Promise<MetricCard[]> => [
    {
      title: 'Total Users',
      value: '12,543',
      change: 8.2,
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Users (24h)',
      value: '2,847',
      change: 5.1,
      trend: 'up',
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Translations Today',
      value: '45,792',
      change: 12.3,
      trend: 'up',
      icon: Globe,
      color: 'purple'
    },
    {
      title: 'Revenue (MTD)',
      value: '$18,429',
      change: 15.7,
      trend: 'up',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Error Rate',
      value: '0.23%',
      change: -2.1,
      trend: 'down',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: 'Avg Response Time',
      value: '145ms',
      change: -8.5,
      trend: 'down',
      icon: Clock,
      color: 'yellow'
    }
  ]

  const simulateAnalytics = async () => ({
    userGrowth: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'New Users',
        data: [1200, 1890, 2100, 2400, 2100, 2543],
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6'
      }]
    },
    translationVolume: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Translations',
        data: [8200, 9100, 8500, 9800, 10200, 7600, 6800],
        borderColor: '#10B981',
        backgroundColor: '#10B981'
      }]
    },
    languagePairs: [
      { pair: 'EN → ES', count: 12543, percentage: 28.5 },
      { pair: 'EN → FR', count: 9876, percentage: 22.4 },
      { pair: 'EN → DE', count: 7654, percentage: 17.3 },
      { pair: 'EN → ZH', count: 6543, percentage: 14.8 },
      { pair: 'Others', count: 7456, percentage: 17.0 }
    ]
  })

  const simulateErrors = async () => ({
    total: 127,
    critical: 3,
    high: 12,
    medium: 45,
    low: 67,
    trends: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [{
        label: 'Error Count',
        data: [5, 3, 8, 15, 12, 7],
        borderColor: '#EF4444',
        backgroundColor: '#EF4444'
      }]
    },
    topErrors: [
      { message: 'Translation timeout for large documents', count: 23, severity: 'high' },
      { message: 'API rate limit exceeded', count: 18, severity: 'medium' },
      { message: 'Invalid language code provided', count: 15, severity: 'low' },
      { message: 'Database connection timeout', count: 8, severity: 'critical' }
    ]
  })

  const simulatePerformance = async () => ({
    webVitals: {
      LCP: 1.8,
      FID: 45,
      CLS: 0.08
    },
    apiMetrics: {
      averageResponseTime: 145,
      p95ResponseTime: 380,
      p99ResponseTime: 890,
      throughput: 1250
    },
    systemHealth: {
      cpu: 45,
      memory: 67,
      disk: 23,
      network: 12
    }
  })

  const simulateAlerts = async () => [
    {
      id: '1',
      type: 'critical',
      message: 'Error rate spike in translation API',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      resolved: false
    },
    {
      id: '2',
      type: 'warning',
      message: 'High memory usage on server cluster',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      resolved: false
    },
    {
      id: '3',
      type: 'info',
      message: 'New user signup surge detected',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      resolved: true
    }
  ]

  const getMetricColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      emerald: 'bg-emerald-100 text-emerald-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
      default: return <Target className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((timestamp.getTime() - Date.now()) / (1000 * 60)),
      'minute'
    )
  }

  if (isLoading && !data) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights and monitoring</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.filter(alert => !alert.resolved).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-900">Active Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.filter(alert => !alert.resolved).map(alert => (
              <div key={alert.id} className="flex items-center justify-between text-sm">
                <span className="text-red-800">{alert.message}</span>
                <span className="text-red-600">{formatTimestamp(alert.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {data?.metrics?.map((metric: MetricCard, index: number) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${getMetricColor(metric.color)}`}>
                <metric.icon className="w-5 h-5" />
              </div>
              {getTrendIcon(metric.trend)}
            </div>
            
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.title}</p>
              <div className="flex items-center space-x-1">
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
                <span className="text-sm text-gray-500">vs last period</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'performance', label: 'Performance', icon: Monitor },
            { id: 'errors', label: 'Errors', icon: Shield },
            { id: 'revenue', label: 'Revenue', icon: DollarSign }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <p className="text-gray-500">Chart: User growth over time</p>
                </div>
              </div>

              {/* Translation Volume */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation Volume</h3>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <p className="text-gray-500">Chart: Translation volume trends</p>
                </div>
              </div>

              {/* Top Language Pairs */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Language Pairs</h3>
                <div className="space-y-3">
                  {data?.analytics?.languagePairs?.map((pair: any, index: number) => (
                    <div key={pair.pair} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">{pair.pair}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${pair.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{pair.count.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{pair.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h3>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <p className="text-gray-500">User behavior analytics charts</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Segments</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">45%</div>
                    <div className="text-sm text-gray-600">Casual Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">30%</div>
                    <div className="text-sm text-gray-600">Professional</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">25%</div>
                    <div className="text-sm text-gray-600">Enterprise</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Web Vitals */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Web Vitals</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Largest Contentful Paint</span>
                    <span className="font-medium text-green-600">{data?.performance?.webVitals?.LCP}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">First Input Delay</span>
                    <span className="font-medium text-green-600">{data?.performance?.webVitals?.FID}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cumulative Layout Shift</span>
                    <span className="font-medium text-green-600">{data?.performance?.webVitals?.CLS}</span>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-4">
                  {Object.entries(data?.performance?.systemHealth || {}).map(([metric, value]) => (
                    <div key={metric}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 capitalize">{metric}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (value as number) > 80 ? 'bg-red-500' :
                            (value as number) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-6">
              {/* Error Summary */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Errors', value: data?.errors?.total, color: 'blue' },
                  { label: 'Critical', value: data?.errors?.critical, color: 'red' },
                  { label: 'High', value: data?.errors?.high, color: 'orange' },
                  { label: 'Medium', value: data?.errors?.medium, color: 'yellow' }
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                    <div className="text-sm text-gray-600">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Top Errors */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Errors</h3>
                <div className="space-y-3">
                  {data?.errors?.topErrors?.map((error: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{error.message}</p>
                        <p className="text-xs text-gray-500">Count: {error.count}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        error.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {error.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <p className="text-gray-500">Revenue analytics chart</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">MRR</span>
                    <span className="font-medium">$24,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ARR</span>
                    <span className="font-medium">$294,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Churn Rate</span>
                    <span className="font-medium">2.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">LTV</span>
                    <span className="font-medium">$1,250</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}