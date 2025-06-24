'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StreamingProgress {
  totalChunks: number
  processedChunks: number
  currentChunk: number
  percentage: number
  estimatedTimeRemaining: number
  processingRate: number
  status: 'initializing' | 'processing' | 'completed' | 'cancelled' | 'error'
  error?: string
}

interface StreamingProgressDisplayProps {
  jobId: string
  onComplete?: (result: any) => void
  onError?: (error: string) => void
  onCancel?: () => void
  className?: string
}

export default function StreamingProgressDisplay({
  jobId,
  onComplete,
  onError,
  onCancel,
  className = ''
}: StreamingProgressDisplayProps) {
  const [progress, setProgress] = useState<StreamingProgress | null>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Connect to Server-Sent Events stream
  const connectToStream = useCallback(() => {
    if (eventSource) {
      eventSource.close()
    }

    const url = `/api/documents/intelligence/stream?jobId=${jobId}`
    const newEventSource = new EventSource(url)

    newEventSource.onopen = () => {
      setStatus('connected')
      console.log('Connected to streaming progress')
    }

    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'connection':
            setStatus('connected')
            break
            
          case 'progress':
            if (data.streamingProgress) {
              setProgress(data.streamingProgress)
            }
            break
            
          case 'complete':
            setProgress(prev => prev ? { ...prev, status: 'completed', percentage: 100 } : null)
            if (onComplete && data.result) {
              onComplete(data.result)
            }
            newEventSource.close()
            break
            
          case 'error':
            setStatus('error')
            if (onError) {
              onError(data.error || 'Streaming error occurred')
            }
            newEventSource.close()
            break
        }
      } catch (error) {
        console.error('Error parsing streaming data:', error)
      }
    }

    newEventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      setStatus('error')
      setTimeout(() => {
        if (newEventSource.readyState === EventSource.CONNECTING) {
          // Retry connection
          connectToStream()
        }
      }, 5000)
    }

    setEventSource(newEventSource)
  }, [jobId, onComplete, onError])

  // Initialize connection
  useEffect(() => {
    connectToStream()
    
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [connectToStream])

  // Cancel processing
  const handleCancel = async () => {
    if (cancelling) return
    
    setCancelling(true)
    try {
      const response = await fetch('/api/documents/intelligence/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cancel',
          jobId
        })
      })

      if (response.ok) {
        setProgress(prev => prev ? { ...prev, status: 'cancelled' } : null)
        if (onCancel) {
          onCancel()
        }
        if (eventSource) {
          eventSource.close()
        }
      } else {
        throw new Error('Failed to cancel processing')
      }
    } catch (error) {
      console.error('Error cancelling processing:', error)
    } finally {
      setCancelling(false)
    }
  }

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  if (status === 'connecting') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Connecting to progress stream...</span>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-red-600">Connection error occurred</span>
          </div>
          <button
            onClick={connectToStream}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="animate-pulse w-5 h-5 bg-gray-300 rounded-full"></div>
          <span className="text-gray-600">Waiting for processing to begin...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                progress.status === 'completed' ? 'bg-green-500' :
                progress.status === 'error' || progress.status === 'cancelled' ? 'bg-red-500' :
                'bg-blue-500'
              }`}
              animate={progress.status === 'processing' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {progress.status === 'completed' ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : progress.status === 'error' || progress.status === 'cancelled' ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900">
              {progress.status === 'initializing' && 'Initializing Processing'}
              {progress.status === 'processing' && 'Processing Document'}
              {progress.status === 'completed' && 'Processing Complete'}
              {progress.status === 'cancelled' && 'Processing Cancelled'}
              {progress.status === 'error' && 'Processing Error'}
            </h3>
          </div>
          
          {(progress.status === 'processing' || progress.status === 'initializing') && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress: {Math.round(progress.percentage)}%</span>
            <span>{progress.processedChunks} / {progress.totalChunks} chunks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full ${
                progress.status === 'completed' ? 'bg-green-500' :
                progress.status === 'error' || progress.status === 'cancelled' ? 'bg-red-500' :
                'bg-blue-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats */}
        <AnimatePresence>
          {progress.status === 'processing' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-4 text-sm"
            >
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-600">Processing Rate</div>
                <div className="font-semibold text-gray-900">
                  {progress.processingRate.toFixed(1)} chunks/sec
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-600">Time Remaining</div>
                <div className="font-semibold text-gray-900">
                  {formatTimeRemaining(progress.estimatedTimeRemaining)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {progress.status === 'error' && progress.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-800 text-sm">{progress.error}</div>
          </div>
        )}

        {/* Current Chunk Info */}
        {progress.status === 'processing' && (
          <div className="text-xs text-gray-500">
            Currently processing chunk {progress.currentChunk} of {progress.totalChunks}
          </div>
        )}
      </div>
    </div>
  )
}

export type { StreamingProgress }