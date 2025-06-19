'use client'

import { useState, useEffect } from 'react'
import { performanceMonitor } from '@/lib/performance-monitor'

interface SystemMetrics {
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
  requests: {
    total: number
    successful: number
    failed: number
    avgResponseTime: number
  }
  cache: {
    hitRate: number
    memoryUsage: number
    totalKeys: number
  }
  database: {
    connectionCount: number
    avgQueryTime: number
    slowQueries: number
  }
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [trends, setTrends] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    const updateMetrics = () => {
      try {
        const systemMetrics = performanceMonitor.getSystemMetrics()
        const performanceTrends = performanceMonitor.getPerformanceTrends(24)
        
        setMetrics(systemMetrics)
        setTrends(performanceTrends)
        setLastUpdate(new Date().toLocaleTimeString())
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
        setLoading(false)
      }
    }

    // Initial load
    updateMetrics()

    // Update every 30 seconds
    const interval = setInterval(updateMetrics, 30000)

    return () => clearInterval(interval)
  }, [])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      case 'stable': return '➡️'
      default: return '➡️'
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isGoodWhenUp: boolean = false) => {
    if (trend === 'stable') return 'text-gray-500'
    if (isGoodWhenUp) {
      return trend === 'up' ? 'text-green-600' : 'text-red-600'
    } else {
      return trend === 'up' ? 'text-red-600' : 'text-green-600'
    }
  }

  const formatNumber = (num: number, decimals: number = 0) => {
    return num.toFixed(decimals)
  }

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Real-time system metrics and performance analytics
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-900">{lastUpdate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(trends?.responseTime?.average || 0)}ms
                </p>
              </div>
              <div className={`text-2xl ${getTrendColor(trends?.responseTime?.trend, false)}`}>
                {getTrendIcon(trends?.responseTime?.trend)}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cache Hit Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber((trends?.cacheHitRate?.current || 0) * 100, 1)}%
                </p>
              </div>
              <div className={`text-2xl ${getTrendColor(trends?.cacheHitRate?.trend, true)}`}>
                {getTrendIcon(trends?.cacheHitRate?.trend)}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Memory Usage</p>
                <p className={`text-2xl font-bold ${getStatusColor(trends?.memoryUsage?.current || 0, { warning: 70, critical: 85 })}`}>
                  {formatNumber(trends?.memoryUsage?.current || 0, 1)}%
                </p>
              </div>
              <div className={`text-2xl ${getTrendColor(trends?.memoryUsage?.trend, false)}`}>
                {getTrendIcon(trends?.memoryUsage?.trend)}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Error Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(trends?.errorRate?.current || 0, { warning: 5, critical: 10 })}`}>
                  {formatNumber(trends?.errorRate?.current || 0)}
                </p>
              </div>
              <div className={`text-2xl ${getTrendColor(trends?.errorRate?.trend, false)}`}>
                {getTrendIcon(trends?.errorRate?.trend)}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Request Metrics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Requests</span>
                <span className="text-sm font-medium">{metrics?.requests.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Successful</span>
                <span className="text-sm font-medium text-green-600">{metrics?.requests.successful || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Failed</span>
                <span className="text-sm font-medium text-red-600">{metrics?.requests.failed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Avg Response Time</span>
                <span className="text-sm font-medium">{formatNumber(metrics?.requests.avgResponseTime || 0)}ms</span>
              </div>
            </div>
          </div>

          {/* Cache Metrics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Hit Rate</span>
                <span className="text-sm font-medium">{formatNumber(metrics?.cache.hitRate * 100 || 0, 1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Memory Usage</span>
                <span className="text-sm font-medium">{formatNumber(metrics?.cache.memoryUsage || 0, 1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Keys</span>
                <span className="text-sm font-medium">{metrics?.cache.totalKeys || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Metrics */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Database Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Avg Query Time</p>
              <p className={`text-xl font-bold ${getStatusColor(metrics?.database.avgQueryTime || 0, { warning: 500, critical: 1000 })}`}>
                {formatNumber(metrics?.database.avgQueryTime || 0)}ms
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Slow Queries</p>
              <p className={`text-xl font-bold ${getStatusColor(metrics?.database.slowQueries || 0, { warning: 5, critical: 10 })}`}>
                {metrics?.database.slowQueries || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Connections</p>
              <p className="text-xl font-bold text-gray-900">
                {metrics?.database.connectionCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Memory</h4>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (metrics?.memory.percentage || 0) > 85 ? 'bg-red-600' :
                    (metrics?.memory.percentage || 0) > 70 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(metrics?.memory.percentage || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatNumber(metrics?.memory.percentage || 0, 1)}% used
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">CPU Usage</h4>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (metrics?.cpu.usage || 0) > 80 ? 'bg-red-600' :
                    (metrics?.cpu.usage || 0) > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(metrics?.cpu.usage || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatNumber(metrics?.cpu.usage || 0, 1)}% utilization
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}