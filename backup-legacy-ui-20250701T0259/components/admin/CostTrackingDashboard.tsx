'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Brain,
  FileText,
  Globe,
  Calendar,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'

interface CostMetrics {
  totalCost: number
  byProvider: {
    openai: number
    anthropic: number
    google: number
    other: number
  }
  byService: {
    translation: number
    documentProcessing: number
    ocr: number
    embedding: number
  }
  byTier: {
    free: number
    standard: number
    premium: number
    enterprise: number
  }
  costPerUser: {
    userId: string
    email: string
    totalCost: number
    usageCount: number
  }[]
  trend: {
    daily: { date: string; cost: number }[]
    hourly: { hour: number; cost: number }[]
  }
}

interface ProviderMetrics {
  provider: string
  totalRequests: number
  totalCost: number
  avgCostPerRequest: number
  avgLatency: number
  errorRate: number
  costTrend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

export default function CostTrackingDashboard() {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null)
  const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchCostMetrics = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/analytics/cost-tracking?period=${dateRange}`)
      const data = await response.json()
      
      setMetrics(data.metrics)
      setProviderMetrics(data.providerMetrics)
    } catch (error) {
      console.error('Failed to fetch cost metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCostMetrics()
    
    if (autoRefresh) {
      const interval = setInterval(fetchCostMetrics, 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [dateRange, autoRefresh])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount)
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return <Brain className="h-5 w-5" />
      case 'anthropic':
        return <Brain className="h-5 w-5 text-purple-500" />
      case 'google':
        return <Globe className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', percentage: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center text-red-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm">+{percentage}%</span>
        </div>
      )
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-green-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm">-{percentage}%</span>
        </div>
      )
    }
    return <span className="text-sm text-gray-500">Stable</span>
  }

  const exportData = () => {
    if (!metrics) return

    const csvContent = [
      ['Date Range', dateRange],
      ['Total Cost', metrics.totalCost],
      [''],
      ['Provider', 'Cost'],
      ...Object.entries(metrics.byProvider).map(([provider, cost]) => [provider, cost]),
      [''],
      ['Service', 'Cost'],
      ...Object.entries(metrics.byService).map(([service, cost]) => [service, cost]),
      [''],
      ['User', 'Email', 'Total Cost', 'Usage Count'],
      ...metrics.costPerUser.map(user => [
        user.userId,
        user.email,
        user.totalCost,
        user.usageCount
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cost-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
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
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Tracking Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor AI provider costs and usage patterns
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border ${
              autoRefresh 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className={`h-4 w-4 inline mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>

          {/* Export Button */}
          <button
            onClick={exportData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Download className="h-4 w-4 inline mr-2" />
            Export CSV
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchCostMetrics}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Total Cost Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Total Cost</h2>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {formatCurrency(metrics.totalCost)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Period: {dateRange}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-500 opacity-50" />
            </div>
          </div>

          {/* Provider Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cost by Provider */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Cost by Provider</h3>
              <div className="space-y-3">
                {Object.entries(metrics.byProvider).map(([provider, cost]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(provider)}
                      <span className="capitalize">{provider}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(cost)}</div>
                      <div className="text-xs text-gray-500">
                        {((cost / metrics.totalCost) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost by Service */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Cost by Service</h3>
              <div className="space-y-3">
                {Object.entries(metrics.byService).map(([service, cost]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(cost)}</div>
                      <div className="text-xs text-gray-500">
                        {((cost / metrics.totalCost) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Provider Performance Metrics */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold mb-4">Provider Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Cost/Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Latency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providerMetrics.map((provider) => (
                    <tr key={provider.provider}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getProviderIcon(provider.provider)}
                          <span className="font-medium capitalize">{provider.provider}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {provider.totalRequests.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {formatCurrency(provider.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(provider.avgCostPerRequest)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {provider.avgLatency.toFixed(0)}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`${
                          provider.errorRate > 5 ? 'text-red-600' : 
                          provider.errorRate > 2 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {provider.errorRate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTrendIcon(provider.costTrend, provider.trendPercentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Users by Cost */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Top Users by Cost</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Cost/Usage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.costPerUser.slice(0, 10).map((user) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.userId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.usageCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {formatCurrency(user.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatCurrency(user.totalCost / user.usageCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}