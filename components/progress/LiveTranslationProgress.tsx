'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react'

interface LiveTranslationProgressProps {
  translationId: string
  userId: string
  autoSubscribe?: boolean
  showDetails?: boolean
  showAnalytics?: boolean
  className?: string
  onProgressComplete?: (progress: any) => void
  onError?: (error: any) => void
}

interface ProgressData {
  translationId: string
  status: 'queued' | 'initializing' | 'processing' | 'quality_check' | 'completed' | 'failed' | 'cancelled'
  progress: {
    percentage: number
    currentStep: string
    totalSteps: number
    completedSteps: number
    estimatedTimeRemaining: number
    startedAt: string
    lastUpdatedAt: string
    completedAt?: string
  }
  content: {
    totalWords: number
    processedWords: number
    totalCharacters: number
    processedCharacters: number
    sourceLanguage: string
    targetLanguage: string
    complexity: string
  }
  quality: {
    confidence: number
    issuesDetected: number
    autoCorrections: number
    reviewRequired: boolean
  }
  performance: {
    processingSpeed: number
    averageResponseTime: number
    cacheHitRate: number
    memoryUsage: number
  }
  currentStep?: {
    id: string
    name: string
    status: string
    progress: number
  }
  errors: Array<{
    id: string
    type: string
    severity: string
    message: string
    timestamp: string
  }>
  warnings: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
}

export default function LiveTranslationProgress({
  translationId,
  userId,
  autoSubscribe = true,
  showDetails = true,
  showAnalytics = false,
  className = '',
  onProgressComplete,
  onError
}: LiveTranslationProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const progressRef = useRef<ProgressData | null>(null)

  // Update ref when progress changes
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  // Auto-subscribe on mount
  useEffect(() => {
    if (autoSubscribe && translationId) {
      subscribeToProgress()
    }
    
    return () => {
      unsubscribeFromProgress()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [translationId, autoSubscribe])

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (isSubscribed) {
      setupWebSocket()
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [isSubscribed])

  // Fetch analytics when requested
  useEffect(() => {
    if (showAnalytics && translationId) {
      fetchAnalytics()
    }
  }, [showAnalytics, translationId])

  const setupWebSocket = () => {
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:3001/ws'
      : 'wss://prismy.in/ws'
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        setConnectionStatus('connected')
        
        // Join progress channel
        ws.send(JSON.stringify({
          type: 'join_progress_channel',
          translationId,
          userId
        }))
      }
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'translation_progress' && message.data.translationId === translationId) {
            handleProgressUpdate(message.data)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      ws.onclose = () => {
        setConnectionStatus('disconnected')
        
        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('connecting')
          setupWebSocket()
        }, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('disconnected')
      }
      
    } catch (error) {
      console.error('Failed to setup WebSocket:', error)
      setConnectionStatus('disconnected')
    }
  }

  const subscribeToProgress = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          translationId,
          channels: ['websocket'],
          filters: {
            statusChanges: true,
            minProgressChange: 1
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe to progress')
      }

      const data = await response.json()
      if (data.success) {
        setSubscriptionId(data.subscriptionId)
        setIsSubscribed(true)
        
        // Fetch initial progress
        await fetchCurrentProgress()
      }
    } catch (error) {
      console.error('Failed to subscribe to progress:', error)
      if (onError) onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromProgress = async () => {
    if (subscriptionId) {
      try {
        await fetch(`/api/progress?subscriptionId=${subscriptionId}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Failed to unsubscribe:', error)
      }
    }
    
    setIsSubscribed(false)
    setSubscriptionId(null)
  }

  const fetchCurrentProgress = async () => {
    try {
      const response = await fetch(`/api/progress?translationId=${translationId}&action=current`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProgress(data.progress)
        }
      }
    } catch (error) {
      console.error('Failed to fetch current progress:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/progress?translationId=${translationId}&action=analytics`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAnalytics(data.analytics)
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const handleProgressUpdate = (progressData: ProgressData) => {
    setProgress(progressData)
    
    // Check for completion
    if (progressData.status === 'completed' && onProgressComplete) {
      onProgressComplete(progressData)
    }
    
    // Check for errors
    if (progressData.errors.length > 0 && onError) {
      const latestError = progressData.errors[progressData.errors.length - 1]
      onError(latestError)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="w-5 h-5 text-gray-500" />
      case 'initializing': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      case 'processing': return <Play className="w-5 h-5 text-blue-500" />
      case 'quality_check': return <Target className="w-5 h-5 text-yellow-500" />
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      case 'cancelled': return <Pause className="w-5 h-5 text-gray-500" />
      default: return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-gray-600 bg-gray-100'
      case 'initializing': return 'text-blue-600 bg-blue-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'quality_check': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatSpeed = (wordsPerMinute: number) => {
    if (wordsPerMinute >= 1000) {
      return `${(wordsPerMinute / 1000).toFixed(1)}k wpm`
    }
    return `${Math.round(wordsPerMinute)} wpm`
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading progress...</p>
        </div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No progress data available</p>
        <button
          onClick={subscribeToProgress}
          className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {getStatusIcon(progress.status)}
          <div>
            <h3 className="font-semibold text-gray-900">Translation Progress</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(progress.status)}`}>
                {progress.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm text-gray-600">
                {progress.content.sourceLanguage} → {progress.content.targetLanguage}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`} title={`Connection: ${connectionStatus}`}></div>

          {/* Progress Percentage */}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(progress.progress.percentage)}%
            </div>
            <div className="text-xs text-gray-600">
              {progress.content.processedWords} / {progress.content.totalWords} words
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {progress.progress.currentStep}
          </span>
          <span className="text-sm text-gray-600">
            Step {progress.progress.completedSteps + 1} of {progress.progress.totalSteps}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <motion.div
            className="bg-blue-600 h-3 rounded-full flex items-center justify-end pr-2"
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress.percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {progress.progress.percentage > 10 && (
              <span className="text-xs text-white font-medium">
                {Math.round(progress.progress.percentage)}%
              </span>
            )}
          </motion.div>
        </div>

        {/* Time Information */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Elapsed: {formatTime(Date.now() - new Date(progress.progress.startedAt).getTime())}
          </span>
          {progress.progress.estimatedTimeRemaining > 0 && (
            <span>
              Remaining: {formatTime(progress.progress.estimatedTimeRemaining)}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
            <span className="text-sm font-medium text-gray-700">Speed</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatSpeed(progress.performance.processingSpeed)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm font-medium text-gray-700">Quality</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(progress.quality.confidence * 100)}%
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-4 h-4 text-yellow-600 mr-1" />
            <span className="text-sm font-medium text-gray-700">Cache</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(progress.performance.cacheHitRate * 100)}%
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-600 mr-1" />
            <span className="text-sm font-medium text-gray-700">Issues</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {progress.quality.issuesDetected}
          </div>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="border-t border-gray-200">
          {/* Current Step Details */}
          {progress.currentStep && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Current Step</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  progress.currentStep.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  progress.currentStep.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {progress.currentStep.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{progress.currentStep.name}</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.currentStep.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Errors and Warnings */}
          {(progress.errors.length > 0 || progress.warnings.length > 0) && (
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-sm font-medium text-gray-900">
                  Issues ({progress.errors.length + progress.warnings.length})
                </h4>
                <motion.div
                  animate={{ rotate: showErrors ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showErrors && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {progress.errors.map(error => (
                      <div key={error.id} className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-red-900">{error.type}</div>
                              <div className="text-sm text-red-700">{error.message}</div>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            error.severity === 'critical' ? 'bg-red-200 text-red-900' :
                            error.severity === 'high' ? 'bg-orange-200 text-orange-900' :
                            'bg-yellow-200 text-yellow-900'
                          }`}>
                            {error.severity}
                          </span>
                        </div>
                      </div>
                    ))}

                    {progress.warnings.map(warning => (
                      <div key={warning.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-yellow-900">{warning.type}</div>
                            <div className="text-sm text-yellow-700">{warning.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Analytics */}
          {showAnalytics && analytics && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Analytics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Duration</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTime(analytics.duration)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg Speed</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatSpeed(analytics.processingSpeed)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}