'use client'

/**
 * PRODUCTION MONITORING DASHBOARD
 * Real-time monitoring interface for production deployment
 * Shows system health, performance metrics, and alerts
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { productionMonitor, SystemMetrics, Alert } from '@/lib/monitoring/production-monitor'
import { logger } from '@/lib/logger'

interface DashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function ProductionDashboard({ 
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: DashboardProps) {
  const [systemStatus, setSystemStatus] = useState(productionMonitor.getSystemStatus())
  const [metrics, setMetrics] = useState<SystemMetrics[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '4h' | '24h'>('1h')
  const [isLoading, setIsLoading] = useState(false)

  // Auto-refresh system status
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshDashboard()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Initial load
  useEffect(() => {
    refreshDashboard()
  }, [selectedTimeRange])

  const refreshDashboard = async () => {
    setIsLoading(true)
    try {
      // Get current system status
      const status = productionMonitor.getSystemStatus()
      setSystemStatus(status)

      // Get metrics for selected time range
      const endTime = new Date().toISOString()
      const startTime = new Date(Date.now() - getTimeRangeMs(selectedTimeRange)).toISOString()
      const metricsData = productionMonitor.getMetrics(startTime, endTime)
      setMetrics(metricsData)

      // Get active alerts
      const alertsData = productionMonitor.getAlerts(false)
      setAlerts(alertsData)

    } catch (error) {
      logger.error('Failed to refresh dashboard', { error })
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeRangeMs = (range: '1h' | '4h' | '24h') => {
    switch (range) {
      case '1h': return 60 * 60 * 1000
      case '4h': return 4 * 60 * 60 * 1000
      case '24h': return 24 * 60 * 60 * 1000
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-100'
      case 'degraded': return 'text-yellow-500 bg-yellow-100'
      case 'unhealthy': return 'text-red-500 bg-red-100'
      default: return 'text-gray-500 bg-gray-100'
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'warning': return 'border-yellow-500 bg-yellow-50'
      case 'info': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`
    } else if (unit === '%') {
      return `${(value * 100).toFixed(1)}%`
    } else if (unit === 'MB') {
      return `${(value / 1024 / 1024).toFixed(1)}MB`
    }
    return `${value.toFixed(2)} ${unit}`
  }

  const resolveAlert = (alertId: string) => {
    productionMonitor.resolveAlert(alertId)
    refreshDashboard()
  }

  return (
    <div className={`production-dashboard p-6 bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Monitor</h1>
            <p className="text-gray-600 mt-1">Real-time system health and performance monitoring</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex bg-white rounded-lg border border-gray-200">
              {(['1h', '4h', '24h'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600'
                  } ${range === '1h' ? 'rounded-l-lg' : range === '24h' ? 'rounded-r-lg' : ''}`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshDashboard}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Overall Status */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Status</p>
              <p className={`text-lg font-semibold ${getStatusColor(systemStatus.status).split(' ')[0]}`}>
                {systemStatus.status.charAt(0).toUpperCase() + systemStatus.status.slice(1)}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.status).split(' ')[1]}`} />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-lg font-semibold text-gray-900">{systemStatus.activeAlerts}</p>
            </div>
            <div className="text-yellow-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Alerts</p>
              <p className="text-lg font-semibold text-red-600">{systemStatus.criticalAlerts}</p>
            </div>
            <div className="text-red-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-semibold text-gray-900">
                {Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m
              </p>
            </div>
            <div className="text-green-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {systemStatus.lastMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time</h3>
            <div className="text-3xl font-bold text-blue-600">
              {formatMetricValue(systemStatus.lastMetrics.performance.responseTime, 'ms')}
            </div>
            <p className="text-sm text-gray-600 mt-1">Average response time</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Rate</h3>
            <div className="text-3xl font-bold text-red-600">
              {formatMetricValue(systemStatus.lastMetrics.performance.errorRate, '%')}
            </div>
            <p className="text-sm text-gray-600 mt-1">Request error rate</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
            <div className="text-3xl font-bold text-orange-600">
              {formatMetricValue(systemStatus.lastMetrics.performance.memoryUsage, '%')}
            </div>
            <p className="text-sm text-gray-600 mt-1">Current memory usage</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Throughput</h3>
            <div className="text-3xl font-bold text-green-600">
              {formatMetricValue(systemStatus.lastMetrics.performance.throughput, 'req/s')}
            </div>
            <p className="text-sm text-gray-600 mt-1">Requests per second</p>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Alerts</h2>
          <div className="space-y-4">
            <AnimatePresence>
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-white rounded-lg p-6 border-l-4 ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{alert.source}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{alert.title}</h3>
                      <p className="text-gray-700">{alert.message}</p>
                    </div>
                    
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="ml-4 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Service Health Grid */}
      {systemStatus.lastMetrics && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Service Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(systemStatus.lastMetrics.health.services).map(([service, status]) => (
              <div key={service} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {service.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className={`text-sm font-medium ${getStatusColor(status).split(' ')[0]}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[1]}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics History Chart Placeholder */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Trends</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Performance trends chart will appear here</p>
            <p className="text-sm">Data points: {metrics.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}