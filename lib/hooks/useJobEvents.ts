/**
 * useJobEvents Hook - Phase 3.4-B
 * React hook for real-time job progress updates via WebSocket
 * 
 * Features:
 * - Auto-connection management
 * - Job subscription with cleanup
 * - Type-safe progress updates
 * - Connection state tracking
 * - Error handling and retry logic
 * 
 * Usage:
 * ```typescript
 * const { progress, connectionState, error } = useJobEvents(jobId)
 * 
 * // Or with callback
 * useJobEvents(jobId, (progress) => {
 *   console.log('Job progress:', progress)
 * })
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { wsClient, WebSocketClient } from '../websocket/ws-client'

interface JobProgress {
  jobId: string
  status: string
  progress: number
  message: string
  currentStep?: string
  totalSteps?: number
  result?: any
  error?: string
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'error'

interface UseJobEventsOptions {
  onProgress?: (progress: JobProgress) => void
  onError?: (error: string) => void
  onComplete?: (result: any) => void
  autoConnect?: boolean
}

interface UseJobEventsReturn {
  progress: JobProgress | null
  connectionState: ConnectionState
  error: string | null
  isConnected: boolean
  isSubscribed: boolean
  connect: () => Promise<void>
  disconnect: () => void
  retry: () => Promise<void>
}

/**
 * Hook for subscribing to real-time job progress updates
 */
export function useJobEvents(
  jobId: string | null,
  optionsOrCallback?: UseJobEventsOptions | ((progress: JobProgress) => void)
): UseJobEventsReturn {
  const [progress, setProgress] = useState<JobProgress | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  const connectionAttempts = useRef(0)
  const maxConnectionAttempts = 3
  
  // Normalize options
  const options: UseJobEventsOptions = typeof optionsOrCallback === 'function' 
    ? { onProgress: optionsOrCallback, autoConnect: true }
    : { autoConnect: true, ...optionsOrCallback }

  /**
   * Handle job progress updates
   */
  const handleProgress = useCallback((newProgress: JobProgress) => {
    console.log('[useJobEvents] Progress update:', newProgress)
    
    setProgress(newProgress)
    setError(null)
    
    // Call user callback
    options.onProgress?.(newProgress)
    
    // Handle completion
    if (newProgress.status === 'completed' && newProgress.result) {
      options.onComplete?.(newProgress.result)
    }
    
    // Handle errors
    if (newProgress.status === 'failed' && newProgress.error) {
      options.onError?.(newProgress.error)
    }
  }, [options])

  /**
   * Handle connection errors
   */
  const handleError = useCallback((errorMessage: string) => {
    console.error('[useJobEvents] Connection error:', errorMessage)
    setError(errorMessage)
    options.onError?.(errorMessage)
  }, [options])

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      connectionAttempts.current++
      
      // Get authentication token
      const { WebSocketAuth } = await import('../websocket/ws-client')
      const token = await WebSocketAuth.getToken()
      
      // Connect to WebSocket
      await wsClient.connect(token)
      
      console.log('[useJobEvents] WebSocket connected successfully')
      connectionAttempts.current = 0
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      console.error('[useJobEvents] Connection failed:', errorMessage)
      
      if (connectionAttempts.current < maxConnectionAttempts) {
        // Retry connection with exponential backoff
        const delay = Math.pow(2, connectionAttempts.current) * 1000
        setTimeout(() => {
          connect()
        }, delay)
      } else {
        handleError(errorMessage)
      }
    }
  }, [handleError])

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (jobId && isSubscribed) {
      wsClient.unsubscribeFromJob(jobId)
      setIsSubscribed(false)
    }
    
    wsClient.disconnect()
    setProgress(null)
    setError(null)
    connectionAttempts.current = 0
  }, [jobId, isSubscribed])

  /**
   * Retry connection
   */
  const retry = useCallback(async (): Promise<void> => {
    connectionAttempts.current = 0
    await connect()
  }, [connect])

  /**
   * Subscribe to job progress updates
   */
  const subscribeToJob = useCallback(() => {
    if (jobId && connectionState === 'authenticated' && !isSubscribed) {
      console.log('[useJobEvents] Subscribing to job:', jobId)
      
      wsClient.subscribeToJob(jobId, handleProgress)
      setIsSubscribed(true)
    }
  }, [jobId, connectionState, isSubscribed, handleProgress])

  /**
   * Unsubscribe from job progress updates
   */
  const unsubscribeFromJob = useCallback(() => {
    if (jobId && isSubscribed) {
      console.log('[useJobEvents] Unsubscribing from job:', jobId)
      
      wsClient.unsubscribeFromJob(jobId)
      setIsSubscribed(false)
    }
  }, [jobId, isSubscribed])

  // Set up connection state listener
  useEffect(() => {
    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state)
      
      if (state === 'authenticated') {
        subscribeToJob()
      } else if (state === 'disconnected' || state === 'error') {
        setIsSubscribed(false)
      }
    }
    
    wsClient.onStateChange(handleStateChange)
    setConnectionState(wsClient.getState())
    
    return () => {
      wsClient.onStateChange(() => {})
    }
  }, [subscribeToJob])

  // Auto-connect on mount
  useEffect(() => {
    if (options.autoConnect && jobId && connectionState === 'disconnected') {
      connect()
    }
  }, [options.autoConnect, jobId, connectionState, connect])

  // Subscribe to job when authenticated
  useEffect(() => {
    if (jobId && connectionState === 'authenticated' && !isSubscribed) {
      subscribeToJob()
    }
  }, [jobId, connectionState, isSubscribed, subscribeToJob])

  // Unsubscribe when job changes
  useEffect(() => {
    return () => {
      if (jobId && isSubscribed) {
        unsubscribeFromJob()
      }
    }
  }, [jobId]) // Only depend on jobId to avoid unnecessary unsubscribes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSubscribed) {
        unsubscribeFromJob()
      }
    }
  }, [])

  return {
    progress,
    connectionState,
    error,
    isConnected: connectionState === 'authenticated',
    isSubscribed,
    connect,
    disconnect,
    retry
  }
}

/**
 * Hook for subscribing to multiple jobs
 */
export function useMultipleJobEvents(
  jobIds: string[],
  onProgress?: (jobId: string, progress: JobProgress) => void
): {
  progressMap: Record<string, JobProgress>
  connectionState: ConnectionState
  error: string | null
  isConnected: boolean
} {
  const [progressMap, setProgressMap] = useState<Record<string, JobProgress>>({})
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [error, setError] = useState<string | null>(null)

  const handleProgress = useCallback((progress: JobProgress) => {
    setProgressMap(prev => ({
      ...prev,
      [progress.jobId]: progress
    }))
    
    onProgress?.(progress.jobId, progress)
  }, [onProgress])

  // Use individual hooks for each job
  const jobHooks = jobIds.map(jobId => 
    useJobEvents(jobId, { onProgress: handleProgress, autoConnect: false })
  )

  // Aggregate connection state (use the first hook's state)
  useEffect(() => {
    if (jobHooks.length > 0) {
      setConnectionState(jobHooks[0].connectionState)
      setError(jobHooks[0].error)
    }
  }, [jobHooks])

  // Connect all jobs when ready
  useEffect(() => {
    if (jobHooks.length > 0 && connectionState === 'disconnected') {
      jobHooks[0].connect()
    }
  }, [jobHooks, connectionState])

  return {
    progressMap,
    connectionState,
    error,
    isConnected: connectionState === 'authenticated'
  }
}

/**
 * Hook for WebSocket connection status only
 */
export function useWebSocketConnection(): {
  connectionState: ConnectionState
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  error: string | null
} {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    try {
      const { WebSocketAuth } = await import('../websocket/ws-client')
      const token = await WebSocketAuth.getToken()
      await wsClient.connect(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [])

  const disconnect = useCallback(() => {
    wsClient.disconnect()
  }, [])

  useEffect(() => {
    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state)
      if (state === 'error') {
        setError('WebSocket connection error')
      } else {
        setError(null)
      }
    }
    
    wsClient.onStateChange(handleStateChange)
    setConnectionState(wsClient.getState())
    
    return () => {
      wsClient.onStateChange(() => {})
    }
  }, [])

  return {
    connectionState,
    isConnected: connectionState === 'authenticated',
    connect,
    disconnect,
    error
  }
}