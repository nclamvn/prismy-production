'use client'

/**
 * PERFORMANCE MONITORING DASHBOARD
 * Real-time performance metrics visualization for production
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { logger } from '@/lib/logger'

interface MetricsSummary {
  webVitals: {
    CLS: MetricStat
    FCP: MetricStat
    FID: MetricStat
    LCP: MetricStat
    TTFB: MetricStat
    INP: MetricStat
  }
  api: {
    averageResponseTime: number
    p95ResponseTime: number
    errorRate: number
    totalRequests: number
    slowRequests: number
    byEndpoint: Record<string, EndpointStat>
  }
  counts: {
    webVitals: number
    apiMetrics: number
  }
  period: {
    since: string
    until: string
  }
}

interface MetricStat {
  average: number
  p75: number
  p95: number
  poor: number
  total: number
}

interface EndpointStat {
  count: number
  averageResponseTime: number
  errors: number
  errorRate: number
}

interface PerformanceDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function PerformanceDashboard({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '6h' | '24h' | 'all'>('1h')

  useEffect(() => {
    fetchMetrics()
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [selectedPeriod, autoRefresh, refreshInterval])

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const since = getSinceTimestamp(selectedPeriod)
      const url = `/api/metrics?type=summary${since ? `&since=${since}` : ''}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setMetrics(data.summary)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics'
      setError(errorMessage)
      logger.error('Failed to fetch performance metrics', { error: err })
    } finally {
      setIsLoading(false)
    }
  }

  const getSinceTimestamp = (period: string): string | null => {
    if (period === 'all') return null
    
    const now = new Date()
    const hours = period === '1h' ? 1 : period === '6h' ? 6 : 24
    
    return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString()
  }

  const getMetricColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-600 bg-green-100'
    if (value <= thresholds.poor) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(1)}s`
    }
    if (unit === '%') {
      return `${(value * 100).toFixed(1)}%`
    }
    if (unit === 'score') {
      return value.toFixed(3)
    }
    return value.toFixed(2)
  }

  const webVitalsThresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    FID: { good: 100, poor: 300 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 }
  }

  if (isLoading && !metrics) {
    return (
      <div className={`performance-dashboard ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading performance metrics...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`performance-dashboard ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Failed to Load Metrics</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`performance-dashboard space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time performance monitoring and metrics</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg">
            {(['1h', '6h', '24h', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                } ${period === '1h' ? 'rounded-l-lg' : period === 'all' ? 'rounded-r-lg' : ''}`}
              >
                {period === 'all' ? 'All' : period}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
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

      {metrics && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Metrics</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(metrics.counts.webVitals + metrics.counts.apiMetrics).toLocaleString()}
                  </p>
                </div>
                <div className="text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">API Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.api.totalRequests.toLocaleString()}
                  </p>
                </div>
                <div className="text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className={`text-2xl font-bold ${
                    metrics.api.errorRate > 0.05 ? 'text-red-600' : 
                    metrics.api.errorRate > 0.01 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {formatMetricValue(metrics.api.errorRate, '%')}
                  </p>
                </div>
                <div className={
                  metrics.api.errorRate > 0.05 ? 'text-red-600' : 
                  metrics.api.errorRate > 0.01 ? 'text-yellow-600' : 'text-green-600'
                }>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className={`text-2xl font-bold ${
                    metrics.api.averageResponseTime > 5000 ? 'text-red-600' : 
                    metrics.api.averageResponseTime > 1000 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {formatMetricValue(metrics.api.averageResponseTime, 'ms')}
                  </p>
                </div>
                <div className={
                  metrics.api.averageResponseTime > 5000 ? 'text-red-600' : 
                  metrics.api.averageResponseTime > 1000 ? 'text-yellow-600' : 'text-green-600'
                }>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(metrics.webVitals).map(([name, stat]) => {
                const threshold = webVitalsThresholds[name as keyof typeof webVitalsThresholds]
                const unit = name === 'CLS' ? 'score' : 'ms'
                
                return (
                  <div key={name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        getMetricColor(stat.average, threshold)
                      }`}>
                        {formatMetricValue(stat.average, unit)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">P75:</span>
                        <span className="font-medium">{formatMetricValue(stat.p75, unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">P95:</span>
                        <span className="font-medium">{formatMetricValue(stat.p95, unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Poor:</span>
                        <span className="font-medium">{stat.poor}/{stat.total}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* API Performance */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Response Time</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatMetricValue(metrics.api.averageResponseTime, 'ms')}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">95th Percentile</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatMetricValue(metrics.api.p95ResponseTime, 'ms')}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Slow Requests</p>
                <p className="text-xl font-bold text-red-600">
                  {metrics.api.slowRequests}
                </p>
              </div>
            </div>

            {/* Endpoints Performance */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Endpoints Performance</h3>
              <div className="space-y-2">
                {Object.entries(metrics.api.byEndpoint).map(([endpoint, stat]) => (
                  <div key={endpoint} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{endpoint}</p>
                      <p className="text-sm text-gray-600">
                        {stat.count} requests • {formatMetricValue(stat.errorRate, '%')} error rate
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatMetricValue(stat.averageResponseTime, 'ms')}
                      </p>
                      <p className="text-sm text-gray-600">avg</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}