/**
 * Collaborative Editor Component
 * Real-time text editing with conflict resolution and user presence
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Wifi, WifiOff, Save, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'

interface CollaborativeUser {
  id: string
  name: string
  email: string
  color: string
  cursor?: {
    position: number
    selection?: { start: number; end: number }
  }
  lastSeen: number
}

interface CollaborativeEditorProps {
  documentId: string
  initialContent?: string
  placeholder?: string
  className?: string
  onSave?: (content: string) => void
  readOnly?: boolean
}

interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  initialContent = '',
  placeholder = 'Start typing...',
  className = '',
  onSave,
  readOnly = false
}) => {
  const { user } = useAuth()
  const [content, setContent] = useState(initialContent)
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastOperationRef = useRef<number>(0)

  // WebSocket connection
  const connect = useCallback(() => {
    if (!user) return

    try {
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:3001/ws'
        : 'wss://prismy.in/ws'
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsReconnecting(false)
        setConnectionError(null)
        
        // Join document
        ws.send(JSON.stringify({
          type: 'join_document',
          payload: {
            documentId,
            user: {
              name: user.email?.split('@')[0] || 'Anonymous',
              email: user.email || '',
              color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
            }
          },
          timestamp: Date.now()
        }))

        logger.info('Connected to collaboration server', { documentId })
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          logger.error('Invalid WebSocket message', { error })
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        if (!isReconnecting) {
          scheduleReconnect()
        }
      }

      ws.onerror = (error) => {
        logger.error('WebSocket error', { error })
        setConnectionError('Connection failed')
        setIsConnected(false)
      }

    } catch (error) {
      logger.error('Failed to create WebSocket connection', { error })
      setConnectionError('Failed to connect')
      scheduleReconnect()
    }
  }, [user, documentId, isReconnecting])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return

    setIsReconnecting(true)
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null
      connect()
    }, 3000)
  }, [connect])

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'document_state':
        setContent(message.payload.content)
        setActiveUsers(message.payload.activeUsers)
        break

      case 'operation':
        applyRemoteOperation(message.payload)
        break

      case 'document_updated':
        setActiveUsers(message.payload.activeUsers)
        break

      case 'cursor_update':
        updateUserCursor(message.payload)
        break

      case 'user_joined':
        setActiveUsers(prev => [...prev, message.payload.user])
        break

      case 'user_left':
        setActiveUsers(prev => prev.filter(u => u.id !== message.payload.userId))
        break

      case 'error':
        logger.error('Collaboration error', { error: message.payload.error })
        setConnectionError(message.payload.error)
        break

      default:
        logger.warn('Unknown message type', { type: message.type })
    }
  }, [])

  const applyRemoteOperation = useCallback((operation: any) => {
    const { type, position, content: opContent, length } = operation

    setContent(currentContent => {
      switch (type) {
        case 'insert':
          return currentContent.slice(0, position) + opContent + currentContent.slice(position)
        
        case 'delete':
          return currentContent.slice(0, position) + currentContent.slice(position + length)
        
        default:
          return currentContent
      }
    })
  }, [])

  const updateUserCursor = useCallback((payload: any) => {
    const { userId, position, selection } = payload
    
    setActiveUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, cursor: { position, selection } }
        : user
    ))
  }, [])

  // Text editing handlers
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return

    const newContent = e.target.value
    const oldContent = content

    // Calculate operation
    const operation = calculateOperation(oldContent, newContent, lastOperationRef.current)
    
    if (operation && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'operation',
        payload: operation,
        timestamp: Date.now()
      }))
    }

    setContent(newContent)
    setHasUnsavedChanges(true)
    lastOperationRef.current = Date.now()

    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 2000)
  }, [content, readOnly])

  const calculateOperation = (oldText: string, newText: string, cursorPos: number) => {
    // Simple diff algorithm - in production, use a more sophisticated one
    if (newText.length > oldText.length) {
      // Insertion
      const insertPos = findInsertPosition(oldText, newText)
      const insertedText = newText.slice(insertPos, insertPos + (newText.length - oldText.length))
      
      return {
        type: 'insert',
        position: insertPos,
        content: insertedText
      }
    } else if (newText.length < oldText.length) {
      // Deletion
      const deletePos = findDeletePosition(oldText, newText)
      const deleteLength = oldText.length - newText.length
      
      return {
        type: 'delete',
        position: deletePos,
        length: deleteLength
      }
    }
    
    return null
  }

  const findInsertPosition = (oldText: string, newText: string): number => {
    for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
      if (oldText[i] !== newText[i]) {
        return i
      }
    }
    return oldText.length
  }

  const findDeletePosition = (oldText: string, newText: string): number => {
    for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
      if (oldText[i] !== newText[i]) {
        return i
      }
    }
    return newText.length
  }

  const handleCursorChange = useCallback(() => {
    if (!textareaRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const textarea = textareaRef.current
    const position = textarea.selectionStart
    const selection = textarea.selectionStart !== textarea.selectionEnd 
      ? { start: textarea.selectionStart, end: textarea.selectionEnd }
      : undefined

    wsRef.current.send(JSON.stringify({
      type: 'cursor_update',
      payload: { position, selection },
      timestamp: Date.now()
    }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges || !onSave) return

    try {
      await onSave(content)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      logger.info('Document saved', { documentId })
    } catch (error) {
      logger.error('Failed to save document', { documentId, error })
    }
  }, [content, hasUnsavedChanges, onSave, documentId])

  // Effects
  useEffect(() => {
    connect()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [connect])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return (
    <div className={`relative ${className}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
            </span>
          </div>

          {/* Active Users */}
          {activeUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div className="flex space-x-1">
                {activeUsers.slice(0, 5).map(user => (
                  <div
                    key={user.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name[0]?.toUpperCase()}
                  </div>
                ))}
                {activeUsers.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white font-medium">
                    +{activeUsers.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Save Status */}
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-1 text-amber-600"
              >
                <Save className="h-4 w-4" />
                <span className="text-sm">Unsaved</span>
              </motion.div>
            ) : lastSaved ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Save className="h-4 w-4" />
                <span className="text-sm">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            ) : null}
          </div>

          {/* Manual Save Button */}
          {hasUnsavedChanges && onSave && (
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {connectionError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border-b border-red-200 p-3"
          >
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{connectionError}</span>
              <button
                onClick={connect}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleCursorChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className="w-full h-96 p-4 border-none resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed"
          style={{ minHeight: '400px' }}
        />

        {/* User Cursors */}
        {activeUsers.map(user => (
          user.cursor && (
            <motion.div
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none"
              style={{
                left: `${calculateCursorPosition(user.cursor.position)}px`,
                top: `${calculateCursorLine(user.cursor.position) * 24 + 16}px`
              }}
            >
              <div
                className="w-0.5 h-6"
                style={{ backgroundColor: user.color }}
              />
              <div
                className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
                style={{ backgroundColor: user.color }}
              >
                {user.name}
              </div>
            </motion.div>
          )
        ))}
      </div>
    </div>
  )
}

// Helper functions for cursor positioning
const calculateCursorPosition = (position: number): number => {
  // Simplified calculation - in production, use a more accurate method
  return position * 8 + 16
}

const calculateCursorLine = (position: number): number => {
  // Simplified calculation - in production, use a more accurate method
  return Math.floor(position / 80)
}

export default CollaborativeEditor