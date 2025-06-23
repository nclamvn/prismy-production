'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CloudOff,
  Wifi,
  RefreshCw,
  FileText,
  Clock,
  Database,
  ArrowRight,
} from 'lucide-react'
import { offlineManager } from '@/lib/offline/offline-manager'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : false
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [storageUsage, setStorageUsage] = useState({
    operations: 0,
    cache: 0,
    translations: 0,
  })
  const [cachedTranslation, setCachedTranslation] = useState('')
  const [translationResult, setTranslationResult] = useState('')

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    const unsubscribe = offlineManager.subscribeToOnlineStatus(setIsOnline)

    const updateStats = async () => {
      setPendingCount(offlineManager.getPendingOperationsCount())
      setFailedCount(offlineManager.getFailedOperationsCount())
      const usage = await offlineManager.getStorageUsage()
      setStorageUsage(usage)
    }

    updateStats()
    const interval = setInterval(updateStats, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleOfflineTranslation = async () => {
    if (!cachedTranslation.trim()) return

    // Check cache first
    const cached = await offlineManager.getCachedTranslation(
      cachedTranslation,
      'en',
      'vi'
    )

    if (cached) {
      setTranslationResult(cached.translatedText)
    } else {
      // Add to offline queue
      const operationId = await offlineManager.addOfflineOperation(
        'translation',
        {
          text: cachedTranslation,
          sourceLang: 'en',
          targetLang: 'vi',
        }
      )

      setTranslationResult('Translation queued for when online')

      // Cache a placeholder result
      await offlineManager.cacheTranslation(cachedTranslation, 'en', 'vi', {
        translatedText: 'Translation pending...',
        confidence: 0,
      })
    }
  }

  const handleRetrySync = () => {
    if (isOnline && typeof window !== 'undefined') {
      // Trigger manual sync
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            {isOnline ? (
              <Wifi className="h-16 w-16 text-green-500" />
            ) : (
              <CloudOff className="h-16 w-16 text-gray-400" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isOnline ? 'Back Online!' : "You're Offline"}
          </h1>

          <p className="text-gray-600 text-lg">
            {isOnline
              ? 'Your connection has been restored. Syncing pending operations...'
              : "Don't worry! You can still use many features while offline."}
          </p>
        </motion.div>

        {/* Status Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Pending Operations */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">
                {pendingCount}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Pending</h3>
            <p className="text-sm text-gray-600">Operations waiting to sync</p>
          </div>

          {/* Failed Operations */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <RefreshCw className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">
                {failedCount}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Failed</h3>
            <p className="text-sm text-gray-600">
              Operations that need attention
            </p>
          </div>

          {/* Cached Data */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Database className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">
                {storageUsage.translations + storageUsage.cache}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Cached</h3>
            <p className="text-sm text-gray-600">Items available offline</p>
          </div>
        </motion.div>

        {/* Offline Translation Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Try Offline Translation
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter text to translate (cached results will be used)
              </label>
              <textarea
                value={cachedTranslation}
                onChange={e => setCachedTranslation(e.target.value)}
                placeholder="Type something to translate..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <button
              onClick={handleOfflineTranslation}
              disabled={!cachedTranslation.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Translate
            </button>

            {translationResult && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Result:
                </p>
                <p className="text-gray-900">{translationResult}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Available Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What you can do offline:
          </h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">View cached translations</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">
                Queue new translations for later
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">
                Browse your translation history
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Access saved documents</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
        >
          <button
            onClick={handleRetrySync}
            disabled={!isOnline}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>{isOnline ? 'Retry Sync' : 'Waiting for Connection'}</span>
          </button>

          <a
            href="/workspace"
            className="flex-1 bg-white hover:bg-gray-50 text-gray-900 py-3 px-6 rounded-lg font-medium border border-gray-300 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Go to Workspace</span>
            <ArrowRight className="h-5 w-5" />
          </a>
        </motion.div>

        {/* Storage Details */}
        {storageUsage.operations +
          storageUsage.cache +
          storageUsage.translations >
          0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 rounded-lg p-4 border border-blue-200"
          >
            <h4 className="font-medium text-blue-900 mb-2">
              Storage Usage Details
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>Operations: {storageUsage.operations} items</div>
              <div>Cache: {storageUsage.cache} items</div>
              <div>Translations: {storageUsage.translations} items</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Offline Indicator */}
      <OfflineIndicator showDetails={true} />
    </div>
  )
}
