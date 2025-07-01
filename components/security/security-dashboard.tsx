'use client'

/**
 * Security Dashboard Component
 * Comprehensive security overview with audit logs and alerts
 */

import React, { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from '@/lib/i18n/provider'
import { useFormatting } from '@/lib/i18n/hooks'
import { logger } from '@/lib/logger'

interface SecurityDashboardProps {
  organizationId?: string
}

interface SecuritySummary {
  totalEvents: number
  failedLogins: number
  suspiciousEvents: number
  activeAlerts: number
  usersWithTwofa: number
  totalUsers: number
}

interface SecurityAlert {
  id: string
  alertType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  status: string
  createdAt: string
  sourceIp?: string
}

interface AuditEvent {
  id: string
  operation: string
  resourceType: string
  resourceId?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
  createdAt: string
}

interface Analytics {
  events: AuditEvent[]
  summary: {
    totalEvents: number
    successfulEvents: number
    failedEvents: number
    suspiciousEvents: number
    topOperations: Array<{ operation: string; count: number }>
    topSources: Array<{ source: string; count: number }>
    timelineTrends: Array<{ date: string; count: number; severity: string }>
  }
}

export function SecurityDashboard({ organizationId }: SecurityDashboardProps) {
  const { t } = useTranslation('common')
  const { formatNumber, formatDate } = useFormatting()
  
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SecuritySummary | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'alerts'>('overview')
  const [timeRange, setTimeRange] = useState(30) // days
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadSecurityData()
  }, [organizationId, timeRange])

  const loadSecurityData = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        days: timeRange.toString()
      })

      if (organizationId) {
        params.append('organizationId', organizationId)
      }

      const [summaryResponse, alertsResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/security/audit?action=summary&${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch(`/api/security/audit?action=alerts&${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch(`/api/security/audit?action=analytics&${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      ])

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummary(summaryData.summary)
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData.alerts || [])
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData)
      }

    } catch (error) {
      logger.error('Failed to load security data', { error })
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadSecurityData()
    setRefreshing(false)
  }

  const exportAuditLogs = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const params = new URLSearchParams({
        action: 'export',
        days: timeRange.toString(),
        format
      })

      if (organizationId) {
        params.append('organizationId', organizationId)
      }

      const response = await fetch(`/api/security/audit?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `security_audit_${new Date().toISOString().slice(0, 10)}.${format}`
      
      // Use React-safe download approach
      a.click()
      window.URL.revokeObjectURL(url)

    } catch (error) {
      logger.error('Failed to export audit logs', { error })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      default:
        return 'text-blue-600 bg-blue-100 border-blue-200'
    }
  }

  const getOperationIcon = (operation: string) => {
    if (operation.includes('login')) return <UserGroupIcon className="w-4 h-4" />
    if (operation.includes('data')) return <DocumentArrowDownIcon className="w-4 h-4" />
    if (operation.includes('security')) return <ShieldCheckIcon className="w-4 h-4" />
    return <ComputerDesktopIcon className="w-4 h-4" />
  }

  if (loading && !summary) {
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
            <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Monitor security events, alerts, and compliance
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={refreshing}
              className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 ${
                refreshing ? 'animate-spin' : ''
              }`}
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => exportAuditLogs('csv')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(summary.totalEvents)}
                </p>
              </div>
              <EyeIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(summary.failedLogins)}
                </p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Suspicious Events</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(summary.suspiciousEvents)}
                </p>
              </div>
              <ShieldCheckIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(summary.activeAlerts)}
                </p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">2FA Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(summary.usersWithTwofa)}
                </p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">2FA Coverage</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {summary.totalUsers > 0 
                    ? Math.round((summary.usersWithTwofa / summary.totalUsers) * 100)
                    : 0}%
                </p>
              </div>
              <ShieldCheckIcon className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: EyeIcon },
            { id: 'events', name: 'Security Events', icon: ClockIcon },
            { id: 'alerts', name: 'Security Alerts', icon: ExclamationTriangleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                selectedTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Operations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Operations</h3>
            <div className="space-y-3">
              {analytics.summary.topOperations.slice(0, 8).map((op, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getOperationIcon(op.operation)}
                    <span className="ml-2 text-sm text-gray-600">
                      {op.operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(op.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sources */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Source IPs</h3>
            <div className="space-y-3">
              {analytics.summary.topSources.slice(0, 8).map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600 font-mono">
                      {source.source === 'unknown' ? 'Unknown' : source.source}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(source.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'events' && analytics && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Security Events</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.events.slice(0, 20).map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(event.createdAt))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getOperationIcon(event.operation)}
                        <span className="ml-2 text-sm text-gray-900">
                          {event.operation.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {event.resourceType}
                      {event.resourceId && ` (${event.resourceId.slice(0, 8)}...)`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {event.ipAddress || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        event.metadata?.outcome === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : event.metadata?.outcome === 'failure'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.metadata?.outcome || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {alerts.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No security alerts found</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 p-1 rounded-full ${getSeverityColor(alert.severity)}`}>
                      <ExclamationTriangleIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(new Date(alert.createdAt))}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                      {alert.sourceIp && (
                        <p className="mt-1 text-xs text-gray-500 font-mono">
                          Source: {alert.sourceIp}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}