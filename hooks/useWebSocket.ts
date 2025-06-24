'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'

export interface WebSocketMessage {
  id: string
  type: string
  userId: string
  timestamp: number
  data: any
  channel?: string
  targetUsers?: string[]
}

export interface WebSocketOptions {
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  reconnectAttempts: number
  lastMessage: WebSocketMessage | null
  connectionId: string | null
}

export function useWebSocket(
  userId: string | null,
  token: string | null,
  options: WebSocketOptions = {}
) {
  const {
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000
  } = options

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
    lastMessage: null,
    connectionId: null
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageHandlersRef = useRef<Map<string, ((message: WebSocketMessage) => void)[]>>(new Map())
  const channelsRef = useRef<Set<string>>(new Set())

  // Generate WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const port = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || '8080'
    const host = window.location.hostname
    return `${protocol}//${host}:${port}?userId=${userId}&token=${token}`
  }, [userId, token])

  // Send message to WebSocket
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'id' | 'userId' | 'timestamp'>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send message: WebSocket not connected')
      return false
    }

    try {
      const fullMessage: WebSocketMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId || 'anonymous',
        timestamp: Date.now()
      }

      wsRef.current.send(JSON.stringify(fullMessage))
      return true
    } catch (error) {
      logger.error('Error sending WebSocket message:', error)
      return false
    }
  }, [userId])

  // Join a channel
  const joinChannel = useCallback((channelId: string) => {
    if (channelsRef.current.has(channelId)) {
      return true // Already joined
    }

    const success = sendMessage({
      type: 'join_channel',
      data: { channelId }
    })

    if (success) {
      channelsRef.current.add(channelId)
    }

    return success
  }, [sendMessage])

  // Leave a channel
  const leaveChannel = useCallback((channelId: string) => {
    if (!channelsRef.current.has(channelId)) {
      return true // Not joined
    }

    const success = sendMessage({
      type: 'leave_channel',
      data: { channelId }
    })

    if (success) {
      channelsRef.current.delete(channelId)
    }

    return success
  }, [sendMessage])

  // Send message to channel
  const sendToChannel = useCallback((channelId: string, type: string, data: any) => {
    return sendMessage({
      type,
      data,
      channel: channelId
    })
  }, [sendMessage])

  // Send direct message to users
  const sendToUsers = useCallback((userIds: string[], type: string, data: any) => {
    return sendMessage({
      type,
      data,
      targetUsers: userIds
    })
  }, [sendMessage])

  // Add message handler
  const onMessage = useCallback((messageType: string, handler: (message: WebSocketMessage) => void) => {
    const handlers = messageHandlersRef.current.get(messageType) || []
    handlers.push(handler)
    messageHandlersRef.current.set(messageType, handlers)

    // Return unsubscribe function
    return () => {
      const currentHandlers = messageHandlersRef.current.get(messageType) || []
      const index = currentHandlers.indexOf(handler)
      if (index > -1) {
        currentHandlers.splice(index, 1)
        if (currentHandlers.length === 0) {
          messageHandlersRef.current.delete(messageType)
        } else {
          messageHandlersRef.current.set(messageType, currentHandlers)
        }
      }
    }
  }, [])

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      setState(prev => ({ ...prev, lastMessage: message }))

      // Handle system messages
      if (message.type === 'connection_established') {
        setState(prev => ({ 
          ...prev, 
          connectionId: message.data.connectionId,
          connected: true,
          connecting: false,
          error: null,
          reconnectAttempts: 0
        }))
        return
      }

      if (message.type === 'pong') {
        // Handle heartbeat response
        return
      }

      // Call registered handlers
      const handlers = messageHandlersRef.current.get(message.type) || []
      handlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          logger.error(`Error in message handler for ${message.type}:`, error)
        }
      })

      // Call global handlers
      const globalHandlers = messageHandlersRef.current.get('*') || []
      globalHandlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          logger.error('Error in global message handler:', error)
        }
      })

    } catch (error) {
      logger.error('Error parsing WebSocket message:', error)
    }
  }, [])

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current)
    }

    heartbeatTimeoutRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({
          type: 'ping',
          data: { timestamp: Date.now() }
        })
      }
    }, heartbeatInterval)
  }, [heartbeatInterval, sendMessage])

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId || !token) {
      setState(prev => ({ ...prev, error: 'User ID and token required' }))
      return
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      return // Already connecting
    }

    setState(prev => ({ ...prev, connecting: true, error: null }))

    try {
      const url = getWebSocketUrl()
      const ws = new WebSocket(url)

      ws.onopen = () => {
        logger.info('WebSocket connected')
        startHeartbeat()
      }

      ws.onmessage = handleMessage

      ws.onclose = (event) => {
        logger.info('WebSocket disconnected:', event.code, event.reason)
        
        setState(prev => ({ 
          ...prev, 
          connected: false, 
          connecting: false,
          connectionId: null
        }))

        stopHeartbeat()

        // Auto-reconnect if enabled
        if (autoReconnect && state.reconnectAttempts < maxReconnectAttempts) {
          setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }))
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        logger.error('WebSocket error:', error)
        setState(prev => ({ 
          ...prev, 
          error: 'Connection error',
          connected: false,
          connecting: false
        }))
      }

      wsRef.current = ws

    } catch (error) {
      logger.error('Error creating WebSocket connection:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to create connection',
        connecting: false
      }))
    }
  }, [
    userId, 
    token, 
    getWebSocketUrl, 
    handleMessage, 
    autoReconnect, 
    maxReconnectAttempts, 
    reconnectInterval, 
    startHeartbeat, 
    stopHeartbeat,
    state.reconnectAttempts
  ])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    stopHeartbeat()

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setState({
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0,
      lastMessage: null,
      connectionId: null
    })

    channelsRef.current.clear()
  }, [stopHeartbeat])

  // Auto-connect when dependencies are available
  useEffect(() => {
    if (userId && token && !state.connected && !state.connecting) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [userId, token])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    // State
    ...state,
    
    // Connection methods
    connect,
    disconnect,
    
    // Channel methods
    joinChannel,
    leaveChannel,
    
    // Messaging methods
    sendMessage,
    sendToChannel,
    sendToUsers,
    onMessage,
    
    // Utility
    isConnected: state.connected,
    channels: Array.from(channelsRef.current)
  }
}