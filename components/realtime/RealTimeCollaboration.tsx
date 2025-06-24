'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from '@/hooks/useWebSocket'

interface CollaboratorInfo {
  userId: string
  name: string
  avatar?: string
  color: string
  cursor?: {
    x: number
    y: number
    selection?: {
      start: number
      end: number
    }
  }
  lastActivity: number
  status: 'active' | 'idle' | 'away'
}

interface DocumentChange {
  id: string
  type: 'insert' | 'delete' | 'replace' | 'format'
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: number
  metadata?: any
}

interface RealTimeCollaborationProps {
  documentId: string
  userId: string
  token: string
  userName: string
  onCollaboratorsChange?: (collaborators: CollaboratorInfo[]) => void
  onDocumentChange?: (change: DocumentChange) => void
  className?: string
}

export default function RealTimeCollaboration({
  documentId,
  userId,
  token,
  userName,
  onCollaboratorsChange,
  onDocumentChange,
  className = ''
}: RealTimeCollaborationProps) {
  const [collaborators, setCollaborators] = useState<Map<string, CollaboratorInfo>>(new Map())
  const [recentChanges, setRecentChanges] = useState<DocumentChange[]>([])
  const [showActivity, setShowActivity] = useState(false)

  const {
    isConnected,
    joinChannel,
    leaveChannel,
    sendToChannel,
    onMessage
  } = useWebSocket(userId, token)

  // Color palette for collaborators
  const collaboratorColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]

  // Get a unique color for a user
  const getUserColor = useCallback((userId: string): string => {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return collaboratorColors[Math.abs(hash) % collaboratorColors.length]
  }, [])

  // Join collaboration channel when connected
  useEffect(() => {
    if (isConnected && documentId) {
      const channelId = `collaboration:${documentId}`
      joinChannel(channelId)

      // Announce presence
      sendToChannel(channelId, 'user_joined', {
        documentId,
        user: {
          userId,
          name: userName,
          color: getUserColor(userId),
          status: 'active'
        }
      })

      return () => {
        // Announce leaving
        sendToChannel(channelId, 'user_left', {
          documentId,
          userId
        })
        leaveChannel(channelId)
      }
    }
  }, [isConnected, documentId, userId, userName, joinChannel, leaveChannel, sendToChannel, getUserColor])

  // Set up message handlers
  useEffect(() => {
    const unsubscribeUserJoined = onMessage('user_joined', (message) => {
      if (message.data.documentId === documentId && message.data.user.userId !== userId) {
        setCollaborators(prev => {
          const newCollaborators = new Map(prev)
          newCollaborators.set(message.data.user.userId, {
            ...message.data.user,
            lastActivity: Date.now(),
            status: 'active'
          })
          return newCollaborators
        })
      }
    })

    const unsubscribeUserLeft = onMessage('user_left', (message) => {
      if (message.data.documentId === documentId) {
        setCollaborators(prev => {
          const newCollaborators = new Map(prev)
          newCollaborators.delete(message.data.userId)
          return newCollaborators
        })
      }
    })

    const unsubscribeCursorMove = onMessage('cursor_moved', (message) => {
      if (message.data.documentId === documentId && message.userId !== userId) {
        setCollaborators(prev => {
          const newCollaborators = new Map(prev)
          const collaborator = newCollaborators.get(message.userId)
          if (collaborator) {
            newCollaborators.set(message.userId, {
              ...collaborator,
              cursor: message.data.cursor,
              lastActivity: Date.now(),
              status: 'active'
            })
          }
          return newCollaborators
        })
      }
    })

    const unsubscribeDocumentChange = onMessage('document_change', (message) => {
      if (message.data.documentId === documentId) {
        const change: DocumentChange = {
          id: message.id,
          type: message.data.type,
          position: message.data.position,
          content: message.data.content,
          length: message.data.length,
          userId: message.userId,
          timestamp: message.timestamp,
          metadata: message.data.metadata
        }

        setRecentChanges(prev => {
          const newChanges = [change, ...prev].slice(0, 50) // Keep last 50 changes
          return newChanges
        })

        if (onDocumentChange) {
          onDocumentChange(change)
        }

        // Update collaborator activity
        setCollaborators(prev => {
          const newCollaborators = new Map(prev)
          const collaborator = newCollaborators.get(message.userId)
          if (collaborator) {
            newCollaborators.set(message.userId, {
              ...collaborator,
              lastActivity: Date.now(),
              status: 'active'
            })
          }
          return newCollaborators
        })
      }
    })

    const unsubscribeStatusChange = onMessage('user_status_changed', (message) => {
      if (message.data.documentId === documentId) {
        setCollaborators(prev => {
          const newCollaborators = new Map(prev)
          const collaborator = newCollaborators.get(message.userId)
          if (collaborator) {
            newCollaborators.set(message.userId, {
              ...collaborator,
              status: message.data.status,
              lastActivity: Date.now()
            })
          }
          return newCollaborators
        })
      }
    })

    return () => {
      unsubscribeUserJoined()
      unsubscribeUserLeft()
      unsubscribeCursorMove()
      unsubscribeDocumentChange()
      unsubscribeStatusChange()
    }
  }, [documentId, userId, onMessage, onDocumentChange])

  // Send cursor position
  const sendCursorPosition = useCallback((x: number, y: number, selection?: { start: number; end: number }) => {
    if (isConnected) {
      sendToChannel(`collaboration:${documentId}`, 'cursor_moved', {
        documentId,
        cursor: { x, y, selection }
      })
    }
  }, [isConnected, documentId, sendToChannel])

  // Send document change
  const sendDocumentChange = useCallback((change: Omit<DocumentChange, 'id' | 'userId' | 'timestamp'>) => {
    if (isConnected) {
      sendToChannel(`collaboration:${documentId}`, 'document_change', {
        documentId,
        ...change
      })
    }
  }, [isConnected, documentId, sendToChannel])

  // Update status
  const updateStatus = useCallback((status: 'active' | 'idle' | 'away') => {
    if (isConnected) {
      sendToChannel(`collaboration:${documentId}`, 'user_status_changed', {
        documentId,
        status
      })
    }
  }, [isConnected, documentId, sendToChannel])

  // Auto-update status based on activity
  useEffect(() => {
    const handleActivity = () => updateStatus('active')
    const handleVisibilityChange = () => {
      updateStatus(document.hidden ? 'away' : 'active')
    }

    let idleTimer: NodeJS.Timeout
    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => updateStatus('idle'), 300000) // 5 minutes
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    resetIdleTimer()

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(idleTimer)
    }
  }, [updateStatus])

  // Notify parent about collaborator changes
  useEffect(() => {
    if (onCollaboratorsChange) {
      onCollaboratorsChange(Array.from(collaborators.values()))
    }
  }, [collaborators, onCollaboratorsChange])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      case 'idle':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
      case 'away':
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      default:
        return <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
    }
  }

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
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
        <button
          onClick={() => setShowActivity(!showActivity)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showActivity ? 'Hide Activity' : 'Show Activity'}
        </button>
      </div>

      {/* Active Collaborators */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">
            Active Collaborators ({collaborators.size + 1})
          </h3>
        </div>

        <div className="space-y-2">
          {/* Current user */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: getUserColor(userId) }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{userName}</span>
                <span className="text-xs text-gray-500">(you)</span>
                {getStatusIcon('active')}
              </div>
            </div>
          </div>

          {/* Other collaborators */}
          <AnimatePresence>
            {Array.from(collaborators.values()).map((collaborator) => (
              <motion.div
                key={collaborator.userId}
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: collaborator.color }}
                >
                  {collaborator.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{collaborator.name}</span>
                    {getStatusIcon(collaborator.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last active {formatTimeAgo(collaborator.lastActivity)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {collaborators.size === 0 && (
            <div className="text-sm text-gray-500 italic py-2">
              No other collaborators online
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <AnimatePresence>
        {showActivity && (
          <motion.div
            className="bg-white rounded-lg border border-gray-200 p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentChanges.length > 0 ? (
                recentChanges.slice(0, 10).map((change) => {
                  const collaborator = collaborators.get(change.userId)
                  const userName = collaborator?.name || (change.userId === userId ? 'You' : 'Unknown User')
                  
                  return (
                    <div key={change.id} className="flex items-start space-x-2 text-xs">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: collaborator?.color || getUserColor(change.userId) }}
                      ></div>
                      <div className="flex-1">
                        <span className="font-medium">{userName}</span>
                        <span className="text-gray-600 ml-1">
                          {change.type === 'insert' ? 'added text' :
                           change.type === 'delete' ? 'deleted text' :
                           change.type === 'replace' ? 'replaced text' :
                           'formatted text'}
                        </span>
                        <span className="text-gray-400 ml-2">
                          {formatTimeAgo(change.timestamp)}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-gray-500 italic">No recent activity</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export type { CollaboratorInfo, DocumentChange }