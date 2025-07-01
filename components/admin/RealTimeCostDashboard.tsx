'use client'

import React, { useState, useEffect } from 'react'
import {
  LazyAreaChart as AreaChart,
  LazyBarChart as BarChart,
  LazyResponsiveContainer as ResponsiveContainer,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from '@/components/charts/LazyChartComponents'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'

interface RealTimeMetrics {
  totalCost: number
  costChange24h: number
  activeJobs: number
  completedToday: number
  errorRate: number
  avgResponseTime: number
  topProviders: {
    name: string
    cost: number
    requests: number
    errorRate: number
  }[]
  costTrend: {
    time: string
    cost: number
    requests: number
  }[]
  userActivity: {
    userId: string
    email: string
    cost: number
    requests: number
    lastActive: string
  }[]
  insights: {
    id: string
    type: 'cost_spike' | 'error_increase' | 'efficiency_drop' | 'recommendation'
    title: string
    description: string
    severity: 'low' | 'medium' | 'high'
    actionRequired: boolean
    createdAt: string
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function RealTimeCostDashboard() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/analytics/realtime-cost?period=${selectedTimeRange}`)
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, selectedTimeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'cost_spike': return <TrendingUp className="h-4 w-4" />
      case 'error_increase': return <AlertTriangle className="h-4 w-4" />
      case 'efficiency_drop': return <TrendingDown className="h-4 w-4" />
      case 'recommendation': return <CheckCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading && !metrics) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Cost Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Live monitoring of AI service costs and performance
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>

          {/* Refresh Interval */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>1min</option>
            <option value={300}>5min</option>
          </select>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              autoRefresh 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>

          {/* Sensitive Data Toggle */}
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 flex items-center gap-2"
          >
            {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSensitiveData ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.totalCost)}
                  </p>
                  <div className="flex items-center mt-1">
                    {metrics.costChange24h >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                    )}
                    <span className={`text-sm ${metrics.costChange24h >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(metrics.costChange24h).toFixed(1)}% vs yesterday
                    </span>
                  </div>
                </div>
                <DollarSign className="h-12 w-12 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeJobs}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {metrics.completedToday} completed today
                  </p>
                </div>
                <Activity className="h-12 w-12 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Error Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.errorRate.toFixed(2)}%</p>
                  <p className={`text-sm mt-1 ${metrics.errorRate < 1 ? 'text-green-600' : metrics.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {metrics.errorRate < 1 ? 'Excellent' : metrics.errorRate < 5 ? 'Good' : 'Needs attention'}
                  </p>
                </div>
                <AlertTriangle className={`h-12 w-12 opacity-50 ${metrics.errorRate < 1 ? 'text-green-500' : metrics.errorRate < 5 ? 'text-yellow-500' : 'text-red-500'}`} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.avgResponseTime}ms</p>
                  <p className={`text-sm mt-1 ${metrics.avgResponseTime < 1000 ? 'text-green-600' : metrics.avgResponseTime < 3000 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {metrics.avgResponseTime < 1000 ? 'Fast' : metrics.avgResponseTime < 3000 ? 'Moderate' : 'Slow'}
                  </p>
                </div>
                <Zap className={`h-12 w-12 opacity-50 ${metrics.avgResponseTime < 1000 ? 'text-green-500' : metrics.avgResponseTime < 3000 ? 'text-yellow-500' : 'text-red-500'}`} />
              </div>
            </div>
          </div>

          {/* Cost Trend Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Cost Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.costTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={formatTime}
                />
                <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Cost']}
                  labelFormatter={formatTime}
                />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Provider Performance & User Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Performance */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Provider Performance</h3>
              <div className="space-y-4">
                {metrics.topProviders.map((provider, index) => (
                  <div key={provider.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium capitalize">{provider.name}</p>
                        <p className="text-sm text-gray-600">
                          {provider.requests} requests
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(provider.cost)}</p>
                      <p className={`text-sm ${provider.errorRate < 1 ? 'text-green-600' : provider.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {provider.errorRate.toFixed(1)}% errors
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Activity */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Top Users by Cost</h3>
              <div className="space-y-4">
                {metrics.userActivity.slice(0, 5).map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {showSensitiveData ? user.email : user.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {user.requests} requests • Last active {new Date(user.lastActive).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(user.cost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time Insights */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Real-Time Insights</h3>
            <div className="space-y-4">
              {metrics.insights.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">All systems operating normally</p>
                </div>
              ) : (
                metrics.insights.map((insight) => (
                  <div 
                    key={insight.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{insight.title}</h4>
                          <span className="text-xs">
                            {new Date(insight.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{insight.description}</p>
                        {insight.actionRequired && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Action Required
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Request Volume Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Request Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.costTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={formatTime}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [value, 'Requests']}
                  labelFormatter={formatTime}
                />
                <Bar dataKey="requests" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}