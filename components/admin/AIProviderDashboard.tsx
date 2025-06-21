/**
 * AI Provider Dashboard
 * Real-time monitoring and management of AI providers and routing decisions
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Gauge,
  RefreshCw,
  Settings,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react'
import { enhancedOrchestrator } from '@/lib/ai/enhanced-orchestrator'
import { smartRouter } from '@/lib/ai/smart-routing'

interface ProviderStatus {
  id: string
  name: string
  isActive: boolean
  circuitBreakerOpen: boolean
  currentLoad: number
  recentMetrics: Array<{
    timestamp: number
    averageLatency: number
    errorRate: number
    requestCount: number
    totalCost: number
  }>
}

interface RoutingStats {
  totalProviders: number
  activeProviders: number
  blacklistedProviders: number
  cacheSize: number
  totalRequests: number
}

export const AIProviderDashboard: React.FC = () => {
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [routingStats, setRoutingStats] = useState<RoutingStats>({
    totalProviders: 0,
    activeProviders: 0,
    blacklistedProviders: 0,
    cacheSize: 0,
    totalRequests: 0
  })
  const [orchestratorStats, setOrchestratorStats] = useState({
    cacheSize: 0,
    activeRequests: 0,
    circuitBreakers: 0
  })
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const providerStatus = enhancedOrchestrator.getProviderStatus()
      const stats = enhancedOrchestrator.getStats()
      
      setProviders(providerStatus)
      setRoutingStats(stats.routingStats)
      setOrchestratorStats({
        cacheSize: stats.cacheSize,
        activeRequests: stats.activeRequests,
        circuitBreakers: stats.circuitBreakers
      })
      setLastUpdate(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load provider data:', error)
      setIsLoading(false)
    }
  }

  const getProviderStatusColor = (provider: ProviderStatus) => {
    if (!provider.isActive || provider.circuitBreakerOpen) return 'text-red-500'
    if (provider.currentLoad > 80) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getProviderStatusIcon = (provider: ProviderStatus) => {
    if (!provider.isActive || provider.circuitBreakerOpen) {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
    if (provider.currentLoad > 80) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  const calculateAverageLatency = (provider: ProviderStatus) => {
    if (provider.recentMetrics.length === 0) return 0
    const sum = provider.recentMetrics.reduce((acc, m) => acc + m.averageLatency, 0)
    return Math.round(sum / provider.recentMetrics.length)
  }

  const calculateAverageErrorRate = (provider: ProviderStatus) => {
    if (provider.recentMetrics.length === 0) return 0
    const sum = provider.recentMetrics.reduce((acc, m) => acc + m.errorRate, 0)
    return ((sum / provider.recentMetrics.length) * 100).toFixed(1)
  }

  const calculateTotalCost = (provider: ProviderStatus) => {
    const sum = provider.recentMetrics.reduce((acc, m) => acc + m.totalCost, 0)
    return sum.toFixed(4)
  }

  const handleProviderAction = async (providerId: string, action: 'blacklist' | 'whitelist' | 'reset') => {
    try {
      switch (action) {
        case 'blacklist':
          smartRouter.blacklistProvider(providerId)
          break
        case 'reset':
          // Reset circuit breaker (implementation would depend on your needs)
          break
      }
      await loadData()
    } catch (error) {
      console.error(`Failed to ${action} provider:`, error)
    }
  }

  const clearCaches = async () => {
    try {
      enhancedOrchestrator.clearCache()
      await loadData()
    } catch (error) {
      console.error('Failed to clear caches:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading provider data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Provider Dashboard</h2>
          <p className="text-gray-600">
            Monitor and manage AI providers and routing decisions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{routingStats.activeProviders}</span>
          </div>
          <h3 className="font-medium text-gray-900">Active Providers</h3>
          <p className="text-sm text-gray-600">
            {routingStats.totalProviders} total, {routingStats.blacklistedProviders} blacklisted
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{routingStats.totalRequests}</span>
          </div>
          <h3 className="font-medium text-gray-900">Total Requests</h3>
          <p className="text-sm text-gray-600">Processed across all providers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Zap className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">{orchestratorStats.activeRequests}</span>
          </div>
          <h3 className="font-medium text-gray-900">Active Requests</h3>
          <p className="text-sm text-gray-600">Currently processing</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Settings className="h-8 w-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{routingStats.cacheSize}</span>
          </div>
          <h3 className="font-medium text-gray-900">Cache Entries</h3>
          <p className="text-sm text-gray-600">
            Routing decisions cached
            <button
              onClick={clearCaches}
              className="ml-2 text-xs text-blue-500 hover:text-blue-700"
            >
              Clear
            </button>
          </p>
        </motion.div>
      </div>

      {/* Provider List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Provider Status</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {providers.map((provider) => (
                <motion.tr
                  key={provider.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getProviderStatusIcon(provider)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {provider.name}
                        </div>
                        <div className="text-sm text-gray-500">{provider.id}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${getProviderStatusColor(provider)}`}>
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {provider.circuitBreakerOpen && (
                        <span className="text-xs text-red-500">Circuit Breaker Open</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              provider.currentLoad > 80
                                ? 'bg-red-500'
                                : provider.currentLoad > 60
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(provider.currentLoad, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {provider.currentLoad}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {calculateAverageLatency(provider)}ms
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {calculateAverageErrorRate(provider)}%
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        ${calculateTotalCost(provider)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedProvider(provider.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Details
                      </button>
                      {provider.isActive ? (
                        <button
                          onClick={() => handleProviderAction(provider.id, 'blacklist')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Blacklist
                        </button>
                      ) : (
                        <button
                          onClick={() => handleProviderAction(provider.id, 'whitelist')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Details Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Provider Details: {providers.find(p => p.id === selectedProvider)?.name}
              </h3>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Provider metrics chart would go here */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Recent Metrics</h4>
                  <div className="space-y-2">
                    {providers
                      .find(p => p.id === selectedProvider)
                      ?.recentMetrics.slice(-5)
                      .map((metric, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-gray-900">
                            {metric.averageLatency}ms, {(metric.errorRate * 100).toFixed(1)}% error
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
                  <div className="text-sm text-gray-600">
                    Provider configuration details would be displayed here.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AIProviderDashboard