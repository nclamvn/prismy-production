'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from '@/hooks/useWebSocket'

interface TranslationProgress {
  translationId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  estimatedTime: number
  currentStep: string
  result?: {
    translatedText: string
    sourceLanguage: string
    targetLanguage: string
    confidence: number
  }
  error?: string
}

interface RealTimeTranslationProgressProps {
  translationId: string
  userId: string
  token: string
  onComplete?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

export default function RealTimeTranslationProgress({
  translationId,
  userId,
  token,
  onComplete,
  onError,
  className = ''
}: RealTimeTranslationProgressProps) {
  const [progress, setProgress] = useState<TranslationProgress>({
    translationId,
    status: 'pending',
    progress: 0,
    estimatedTime: 0,
    currentStep: 'Initializing...'
  })

  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
    timestamp: number
  }>>([])

  const {
    isConnected,
    joinChannel,
    leaveChannel,
    onMessage,
    sendToChannel
  } = useWebSocket(userId, token)

  // Join translation channel when connected
  useEffect(() => {
    if (isConnected && translationId) {
      const channelId = `translation:${translationId}`
      joinChannel(channelId)

      // Request current status
      sendToChannel(channelId, 'request_status', {
        translationId
      })

      return () => {
        leaveChannel(channelId)
      }
    }
  }, [isConnected, translationId, joinChannel, leaveChannel, sendToChannel])

  // Set up message handlers
  useEffect(() => {
    const unsubscribeProgress = onMessage('translation_progress', (message) => {
      if (message.data.translationId === translationId) {
        setProgress(prev => ({
          ...prev,
          ...message.data
        }))

        // Add notification for status changes
        if (message.data.status !== progress.status) {
          addNotification(
            'info',
            `Translation ${message.data.status}`,
            message.data.currentStep || ''
          )
        }
      }
    })

    const unsubscribeComplete = onMessage('translation_completed', (message) => {
      if (message.data.translationId === translationId) {
        setProgress(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          result: message.data.result
        }))

        addNotification('success', 'Translation completed!', '')
        
        if (onComplete && message.data.result) {
          onComplete(message.data.result)
        }
      }
    })

    const unsubscribeError = onMessage('translation_error', (message) => {
      if (message.data.translationId === translationId) {
        setProgress(prev => ({
          ...prev,
          status: 'failed',
          error: message.data.error
        }))

        addNotification('error', 'Translation failed', message.data.error || '')
        
        if (onError) {
          onError(message.data.error || 'Unknown error')
        }
      }
    })

    const unsubscribeNotification = onMessage('translation_notification', (message) => {
      if (message.data.translationId === translationId) {
        addNotification(
          message.data.type || 'info',
          message.data.title || 'Notification',
          message.data.message || ''
        )
      }
    })

    return () => {
      unsubscribeProgress()
      unsubscribeComplete()
      unsubscribeError()
      unsubscribeNotification()
    }
  }, [translationId, progress.status, onMessage, onComplete, onError])

  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message: `${title}${message ? `: ${message}` : ''}`,
      timestamp: Date.now()
    }

    setNotifications(prev => [...prev, notification])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        )
      default:
        return (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-pulse"></div>
        )
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Translation ID: {translationId.slice(-8)}
        </div>
      </div>

      {/* Progress Card */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Status Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${getStatusColor(progress.status)}`}>
              {getStatusIcon(progress.status)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 capitalize">
                {progress.status}
              </h3>
              <p className="text-sm text-gray-600">{progress.currentStep}</p>
            </div>
          </div>
          
          {progress.status === 'processing' && progress.estimatedTime > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {Math.round(progress.progress)}%
              </div>
              <div className="text-xs text-gray-500">
                {formatTimeRemaining(progress.estimatedTime)}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progress.status !== 'failed' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-2 rounded-full ${
                  progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {progress.status === 'failed' && progress.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">{progress.error}</div>
          </div>
        )}

        {/* Result Preview */}
        {progress.status === 'completed' && progress.result && (
          <motion.div
            className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">
                Translation Complete
              </span>
              <span className="text-xs text-green-600">
                Confidence: {Math.round((progress.result.confidence || 0) * 100)}%
              </span>
            </div>
            <div className="text-sm text-green-700">
              {progress.result.sourceLanguage} → {progress.result.targetLanguage}
            </div>
            <div className="mt-2 p-2 bg-white rounded border text-sm text-gray-900">
              {progress.result.translatedText.length > 100
                ? `${progress.result.translatedText.slice(0, 100)}...`
                : progress.result.translatedText
              }
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className={`p-3 rounded-lg border ${
              notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
            initial={{ opacity: 0, x: 20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{notification.message}</span>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-current opacity-50 hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export type { TranslationProgress }