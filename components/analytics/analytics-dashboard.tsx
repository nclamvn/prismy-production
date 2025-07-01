'use client'

/**
 * Enterprise Analytics Dashboard
 * Interactive business intelligence and metrics visualization
 */

import React, { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  DocumentChartBarIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  LazyLineChart as LineChart,
  LazyAreaChart as AreaChart,
  LazyResponsiveContainer as ResponsiveContainer,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from '@/components/charts/LazyChartComponents'
import { useTranslation } from '@/lib/i18n/provider'
import { useFormatting } from '@/lib/i18n/hooks'
import { logger } from '@/lib/logger'

interface AnalyticsDashboardProps {
  organizationId?: string
  timeRange?: {
    start: Date
    end: Date
  }
  onTimeRangeChange?: (range: { start: Date; end: Date }) => void
}

interface Metric {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'flat'
  unit: string
  description: string
}

interface ChartData {
  date: string
  [key: string]: any
}

interface Insight {
  type: 'trend' | 'anomaly' | 'recommendation'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  data: any
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function AnalyticsDashboard({ 
  organizationId,
  timeRange,
  onTimeRangeChange 
}: AnalyticsDashboardProps) {
  const { t } = useTranslation('common')
  const { formatNumber, formatCurrency, formatDate } = useFormatting()
  
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['documents_uploaded', 'translations_completed', 'active_users'])
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'custom'>('overview')
  const [dateRange, setDateRange] = useState(
    timeRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  )

  useEffect(() => {
    loadAnalyticsData()
  }, [organizationId, dateRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Load metrics data
      const params = new URLSearchParams({
        action: 'query',
        metrics: selectedMetrics.join(','),
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        granularity: 'day'
      })

      if (organizationId) {
        params.append('organizationId', organizationId)
      }

      const [metricsResponse, insightsResponse] = await Promise.all([
        fetch(`/api/analytics?${params}`),
        organizationId ? fetch(`/api/analytics?action=insights&organizationId=${organizationId}&days=30`) : Promise.resolve(null)
      ])

      if (!metricsResponse.ok) throw new Error('Failed to load metrics')

      const metricsData = await metricsResponse.json()
      setChartData(metricsData.data || [])

      // Calculate summary metrics
      const summaryMetrics = calculateSummaryMetrics(metricsData.data || [])
      setMetrics(summaryMetrics)

      // Load insights if available
      if (insightsResponse?.ok) {
        const insightsData = await insightsResponse.json()
        setInsights(insightsData.insights || [])
      }

    } catch (error) {
      logger.error('Failed to load analytics data', { error })
    } finally {
      setLoading(false)
    }
  }

  const calculateSummaryMetrics = (data: ChartData[]): Metric[] => {
    const summaryMetrics: Metric[] = []

    selectedMetrics.forEach(metricId => {
      const values = data.map(d => d[metricId] || 0).filter(v => v > 0)
      
      if (values.length === 0) return

      const total = values.reduce((sum, val) => sum + val, 0)
      const average = total / values.length
      const latest = values[values.length - 1] || 0
      const previous = values[values.length - 2] || 0
      const change = previous > 0 ? ((latest - previous) / previous) * 100 : 0

      let name = metricId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      let unit = 'count'

      if (metricId.includes('revenue')) unit = 'currency'
      if (metricId.includes('rate') || metricId.includes('percentage')) unit = 'percentage'
      if (metricId.includes('time')) unit = 'milliseconds'

      summaryMetrics.push({
        id: metricId,
        name,
        value: latest,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
        unit,
        description: `Current ${name.toLowerCase()}`
      })
    })

    return summaryMetrics
  }

  const formatMetricValue = (value: number, unit: string): string => {
    switch (unit) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return `${formatNumber(value)}%`
      case 'milliseconds':
        return `${formatNumber(value)}ms`
      default:
        return formatNumber(value)
    }
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
    } else if (trend === 'down') {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
    }
    return <div className="w-4 h-4" />
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
      case 'recommendation':
        return <DocumentChartBarIcon className="w-5 h-5 text-blue-500" />
      default:
        return <ChartBarIcon className="w-5 h-5 text-green-500" />
    }
  }

  const getInsightColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const MetricsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric) => (
        <div key={metric.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.name}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMetricValue(metric.value, metric.unit)}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(metric.trend, metric.change)}
              <span className={`text-sm font-medium ${
                metric.change > 0 ? 'text-green-600' : 
                metric.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
        </div>
      ))}
    </div>
  )

  const ChartsSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Line Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => formatDate(new Date(value)).split(',')[0]}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => formatDate(new Date(value))}
              formatter={(value: number, name: string) => [formatNumber(value), name]}
            />
            <Legend />
            {selectedMetrics.slice(0, 3).map((metric, index) => (
              <Line 
                key={metric}
                type="monotone" 
                dataKey={metric} 
                stroke={COLORS[index]} 
                strokeWidth={2}
                name={metric.replace(/_/g, ' ')}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Area Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cumulative Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => formatDate(new Date(value)).split(',')[0]}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => formatDate(new Date(value))}
              formatter={(value: number, name: string) => [formatNumber(value), name]}
            />
            <Legend />
            {selectedMetrics.slice(0, 2).map((metric, index) => (
              <Area 
                key={metric}
                type="monotone" 
                dataKey={metric} 
                stackId="1"
                stroke={COLORS[index]} 
                fill={COLORS[index]}
                name={metric.replace(/_/g, ' ')}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const InsightsSection = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Data Insights</h3>
      
      {insights.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No insights available for the selected period</p>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`border rounded-lg p-4 ${getInsightColor(insight.severity)}`}
            >
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  {insight.data && (
                    <div className="mt-2 text-xs text-gray-500">
                      {JSON.stringify(insight.data)}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  insight.severity === 'high' ? 'bg-red-100 text-red-800' :
                  insight.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {insight.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Business intelligence and performance metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <select 
                value={`${Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000))}`}
                onChange={(e) => {
                  const days = parseInt(e.target.value)
                  const newRange = {
                    start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                    end: new Date()
                  }
                  setDateRange(newRange)
                  onTimeRangeChange?.(newRange)
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                  viewMode === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'detailed' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Detailed
              </button>
              <button
                onClick={() => setViewMode('custom')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                  viewMode === 'custom' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Custom
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <MetricsGrid />
      <ChartsSection />
      <InsightsSection />

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Analytics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {selectedMetrics.map(metric => (
                    <th key={metric} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {metric.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.slice(-10).reverse().map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(row.date))}
                    </td>
                    {selectedMetrics.map(metric => (
                      <td key={metric} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(row[metric] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}