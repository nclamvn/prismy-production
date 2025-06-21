/**
 * Offline Indicator Component
 * Shows connection status and pending sync operations
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wifi, 
  WifiOff, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'
import { offlineManager } from '@/lib/offline/offline-manager'

interface OfflineIndicatorProps {
  className?: string
  showDetails?: boolean
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showDetails = false
}) => {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [storageUsage, setStorageUsage] = useState({ operations: 0, cache: 0, translations: 0 })
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    // Subscribe to online status changes
    const unsubscribe = offlineManager.subscribeToOnlineStatus((online) => {
      setIsOnline(online)
      if (online) {
        setLastSyncTime(new Date())
      }
    })

    // Update counts periodically
    const updateCounts = () => {
      setPendingCount(offlineManager.getPendingOperationsCount())
      setFailedCount(offlineManager.getFailedOperationsCount())
    }

    const updateStorage = async () => {
      const usage = await offlineManager.getStorageUsage()
      setStorageUsage(usage)
    }

    updateCounts()
    updateStorage()

    const interval = setInterval(() => {
      updateCounts()
      updateStorage()
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const getStatusIcon = () => {
    if (isOnline && pendingCount === 0 && failedCount === 0) {
      return <Wifi className="h-4 w-4 text-green-500" />
    } else if (isOnline && (pendingCount > 0 || failedCount > 0)) {
      return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
    } else {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    if (isOnline && pendingCount === 0 && failedCount === 0) {
      return 'Online'
    } else if (isOnline && pendingCount > 0) {
      return `Syncing (${pendingCount} pending)`
    } else if (isOnline && failedCount > 0) {
      return `${failedCount} failed`
    } else {
      return 'Offline'
    }
  }

  const getStatusColor = () => {
    if (isOnline && pendingCount === 0 && failedCount === 0) {
      return 'text-green-600'
    } else if (isOnline && pendingCount > 0) {
      return 'text-yellow-600'
    } else if (failedCount > 0) {
      return 'text-red-600'
    } else {
      return 'text-gray-600'
    }
  }

  const handleClearCache = async () => {
    try {
      await offlineManager.clearExpiredCache()
      const usage = await offlineManager.getStorageUsage()
      setStorageUsage(usage)
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      try {
        await offlineManager.clearAllData()
        setPendingCount(0)
        setFailedCount(0)
        setStorageUsage({ operations: 0, cache: 0, translations: 0 })
      } catch (error) {
        console.error('Failed to clear all data:', error)
      }
    }
  }

  // Don't show if everything is normal and showDetails is false
  if (!showDetails && isOnline && pendingCount === 0 && failedCount === 0) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {/* Main indicator */}
        <div 
          className="flex items-center space-x-3 p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          
          {/* Status badges */}
          <div className="flex space-x-1">
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                {pendingCount}
              </span>
            )}
            
            {failedCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {failedCount}
              </span>
            )}
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200"
            >
              <div className="p-4 space-y-4">
                {/* Connection status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection</span>
                  <div className="flex items-center space-x-2">
                    {isOnline ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Online</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Offline</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Last sync time */}
                {lastSyncTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last sync</span>
                    <span className="text-sm text-gray-800">
                      {lastSyncTime.toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {/* Storage usage */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Storage Usage</span>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Operations</span>
                      <span className="text-gray-800">{storageUsage.operations}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Cache</span>
                      <span className="text-gray-800">{storageUsage.cache}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Translations</span>
                      <span className="text-gray-800">{storageUsage.translations}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleClearCache}
                    className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Clear Cache
                  </button>
                  <button
                    onClick={handleClearAllData}
                    className="flex-1 px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Mini version for compact display
export const OfflineIndicatorMini: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const unsubscribe = offlineManager.subscribeToOnlineStatus(setIsOnline)
    
    const updateCount = () => {
      setPendingCount(offlineManager.getPendingOperationsCount())
    }

    updateCount()
    const interval = setInterval(updateCount, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  if (isOnline && pendingCount === 0) {
    return null
  }

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      {isOnline ? (
        <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      
      {pendingCount > 0 && (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
          {pendingCount}
        </span>
      )}
    </div>
  )
}

export default OfflineIndicator