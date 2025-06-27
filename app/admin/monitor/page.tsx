'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  CreditCard, 
  Activity, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react'

interface SystemMetrics {
  totalUsers: number
  activeUsers24h: number
  totalInvites: number
  usedInvites: number
  totalCreditsIssued: number
  totalCreditsUsed: number
  averageCreditsPerUser: number
  translationsToday: number
  translationsTotal: number
  systemHealth: 'healthy' | 'degraded' | 'down'
  apiLatency: number
  errorRate: number
}

interface RecentActivity {
  id: string
  type: 'signup' | 'invite_redeemed' | 'translation' | 'error'
  user: string
  details: string
  timestamp: string
}

export default function MonitoringDashboard() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    checkAdminAndLoadData()
    
    // Auto refresh every 30 seconds
    const interval = autoRefresh ? setInterval(() => {
      loadMetrics()
      loadActivities()
    }, 30000) : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const checkAdminAndLoadData = async () => {
    try {
      // Check admin access
      const adminRes = await fetch('/api/admin/check')
      if (!adminRes.ok) {
        router.push('/dashboard')
        return
      }

      // Load initial data
      await Promise.all([loadMetrics(), loadActivities()])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics')
      const data = await res.json()
      if (data.success) {
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const loadActivities = async () => {
    try {
      const res = await fetch('/api/admin/activities?limit=10')
      const data = await res.json()
      if (data.success) {
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const getHealthIcon = () => {
    switch (metrics.systemHealth) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'down':
        return <AlertCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'signup':
        return <Users className="w-4 h-4 text-blue-500" />
      case 'invite_redeemed':
        return <CreditCard className="w-4 h-4 text-green-500" />
      case 'translation':
        return <Activity className="w-4 h-4 text-purple-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-1">System Monitoring</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh</span>
            </label>
            <div className="flex items-center gap-2">
              {getHealthIcon()}
              <span className="text-sm font-medium capitalize">{metrics.systemHealth}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold">{metrics.totalUsers}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.activeUsers24h} active in last 24h
            </p>
          </div>

          {/* Invites */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold">{metrics.usedInvites}/{metrics.totalInvites}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Invites Used</h3>
            <p className="text-xs text-gray-500 mt-1">
              {((metrics.usedInvites / metrics.totalInvites) * 100).toFixed(1)}% redemption rate
            </p>
          </div>

          {/* Credits */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold">{metrics.totalCreditsUsed}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Credits Used</h3>
            <p className="text-xs text-gray-500 mt-1">
              Avg {metrics.averageCreditsPerUser} per user
            </p>
          </div>

          {/* Translations */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">{metrics.translationsToday}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Translations Today</h3>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.translationsTotal} total
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card-base p-6">
            <h2 className="heading-3 mb-4">API Performance</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Average Latency</span>
                  <span className="text-sm font-bold">{metrics.apiLatency}ms</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--surface-outline)' }}>
                  <div 
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((metrics.apiLatency / 1000) * 100, 100)}%`,
                      backgroundColor: metrics.apiLatency < 200 ? 'var(--success-500)' : 
                                     metrics.apiLatency < 500 ? 'var(--warning-500)' : 'var(--error-500)'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-sm font-bold">{metrics.errorRate.toFixed(2)}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--surface-outline)' }}>
                  <div 
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${metrics.errorRate}%`,
                      backgroundColor: metrics.errorRate < 1 ? 'var(--success-500)' : 
                                     metrics.errorRate < 5 ? 'var(--warning-500)' : 'var(--error-500)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-base p-6">
            <h2 className="heading-3 mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="font-medium">{activity.user}</p>
                    <p className="text-gray-600">{activity.details}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-base p-6">
          <h2 className="heading-3 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/admin/invites')}
              className="btn-md3-outlined"
            >
              Manage Invites
            </button>
            <button 
              onClick={() => router.push('/admin/users')}
              className="btn-md3-outlined"
            >
              View Users
            </button>
            <button 
              onClick={() => window.open('/api-docs', '_blank')}
              className="btn-md3-outlined"
            >
              API Docs
            </button>
            <button 
              onClick={loadMetrics}
              className="btn-md3-outlined"
            >
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}