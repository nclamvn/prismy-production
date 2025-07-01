'use client'

import React, { useState, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Server,
  Zap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wifi
} from 'lucide-react'

interface HealthCheckData {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    database: HealthCheck
    redis: HealthCheck
    aiServices: HealthCheck
    storage: HealthCheck
    externalApis: HealthCheck
  }
  performance: {
    responseTime: number
    memoryUsage: {
      used: number
      total: number
      external: number
      rss: number
    }
  }
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  error?: string
  details?: Record<string, any>
}

export default function MonitoringDashboard() {
  const [healthData, setHealthData] = useState<HealthCheckData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthData(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200'
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200'
      case 'unhealthy':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  if (loading && !healthData) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Real-time health and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border ${
              autoRefresh 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <Wifi className="h-4 w-4 inline mr-2" />
            Auto Refresh
          </button>
          
          <button
            onClick={fetchHealthData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {!healthData ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load monitoring data
          </h3>
          <p className="text-gray-600">
            Please check the health endpoint and try again.
          </p>
        </div>
      ) : (
        <>
          {/* Overall Status */}
          <div className={`p-6 rounded-lg border-2 mb-8 ${getStatusColor(healthData.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthData.status)}
                <div>
                  <h2 className="text-xl font-semibold capitalize">
                    System {healthData.status}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Version {healthData.version} • {healthData.environment}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-lg font-medium">
                  {formatUptime(healthData.uptime)}
                </p>
              </div>
            </div>
          </div>

          {/* Service Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Object.entries(healthData.checks).map(([service, check]) => (
              <div
                key={service}
                className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {service === 'database' && <Database className="h-5 w-5" />}
                    {service === 'redis' && <Server className="h-5 w-5" />}
                    {service === 'aiServices' && <Zap className="h-5 w-5" />}
                    {service === 'storage' && <Server className="h-5 w-5" />}
                    {service === 'externalApis' && <Globe className="h-5 w-5" />}
                    <h3 className="font-medium capitalize">
                      {service.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                  </div>
                  {getStatusIcon(check.status)}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span>{check.responseTime}ms</span>
                  </div>
                  
                  {check.error && (
                    <div className="text-red-600 text-xs mt-2">
                      {check.error}
                    </div>
                  )}
                  
                  {check.details && (
                    <div className="text-xs text-gray-500 mt-2">
                      {JSON.stringify(check.details)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time */}
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Response Time</h3>
              </div>
              
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {healthData.performance.responseTime}ms
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600">
                {healthData.performance.responseTime < 200 ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                )}
                {healthData.performance.responseTime < 200 ? 'Excellent' : 
                 healthData.performance.responseTime < 500 ? 'Good' : 'Needs attention'}
              </div>
            </div>

            {/* Memory Usage */}
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-purple-500" />
                <h3 className="font-medium">Memory Usage</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Heap Used:</span>
                  <span className="font-medium">
                    {formatMemory(healthData.performance.memoryUsage.used)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Heap Total:</span>
                  <span className="font-medium">
                    {formatMemory(healthData.performance.memoryUsage.total)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>RSS:</span>
                  <span className="font-medium">
                    {formatMemory(healthData.performance.memoryUsage.rss)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{
                      width: `${Math.min(
                        (healthData.performance.memoryUsage.used / healthData.performance.memoryUsage.total) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdate && (
            <div className="text-center text-sm text-gray-500 mt-8">
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </>
      )}
    </div>
  )
}