/**
 * WebSocket Manager for Real-time Communication
 * Handles WebSocket connections, reconnection, and message routing
 */

import { logger } from '@/lib/logger'
import { collaborationEngine, CollaborationOperation, CollaborationUser } from './collaboration-engine'

export interface WebSocketMessage {
  type: string
  payload: any
  userId?: string
  documentId?: string
  timestamp: number
}

export interface ConnectionInfo {
  id: string
  userId: string
  documentId?: string
  connectedAt: number
  lastActivity: number
  isActive: boolean
}

export class WebSocketManager {
  private connections = new Map<string, WebSocket>()
  private connectionInfo = new Map<string, ConnectionInfo>()
  private messageHandlers = new Map<string, (message: WebSocketMessage, connectionId: string) => void>()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.setupMessageHandlers()
    this.startHeartbeat()
  }

  // Connection management
  addConnection(connectionId: string, ws: WebSocket, userId: string): void {
    this.connections.set(connectionId, ws)
    this.connectionInfo.set(connectionId, {
      id: connectionId,
      userId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true
    })

    this.setupWebSocketHandlers(connectionId, ws)
    
    // Send welcome message
    this.sendMessage(connectionId, {
      type: 'connected',
      payload: { connectionId, userId },
      timestamp: Date.now()
    })

    logger.info('WebSocket connection established', { connectionId, userId })
  }

  removeConnection(connectionId: string): void {
    const connection = this.connectionInfo.get(connectionId)
    const ws = this.connections.get(connectionId)

    if (connection?.documentId) {
      // Leave collaboration session
      collaborationEngine.leaveDocument(connection.documentId, connection.userId)
    }

    if (ws) {
      ws.close()
    }

    this.connections.delete(connectionId)
    this.connectionInfo.delete(connectionId)

    logger.info('WebSocket connection removed', { connectionId })
  }

  private setupWebSocketHandlers(connectionId: string, ws: WebSocket): void {
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString())
        this.handleMessage(message, connectionId)
      } catch (error) {
        logger.error('Invalid WebSocket message', { connectionId, error })
        this.sendError(connectionId, 'Invalid message format')
      }
    })

    ws.on('close', () => {
      this.removeConnection(connectionId)
    })

    ws.on('error', (error) => {
      logger.error('WebSocket error', { connectionId, error })
      this.removeConnection(connectionId)
    })

    ws.on('pong', () => {
      const info = this.connectionInfo.get(connectionId)
      if (info) {
        info.lastActivity = Date.now()
      }
    })
  }

  // Message handling
  private setupMessageHandlers(): void {
    this.messageHandlers.set('join_document', this.handleJoinDocument.bind(this))
    this.messageHandlers.set('leave_document', this.handleLeaveDocument.bind(this))
    this.messageHandlers.set('operation', this.handleOperation.bind(this))
    this.messageHandlers.set('cursor_update', this.handleCursorUpdate.bind(this))
    this.messageHandlers.set('ping', this.handlePing.bind(this))
  }

  private handleMessage(message: WebSocketMessage, connectionId: string): void {
    const connection = this.connectionInfo.get(connectionId)
    if (!connection) {
      logger.warn('Message from unknown connection', { connectionId })
      return
    }

    connection.lastActivity = Date.now()

    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      try {
        handler(message, connectionId)
      } catch (error) {
        logger.error('Message handler error', { 
          type: message.type, 
          connectionId, 
          error 
        })
        this.sendError(connectionId, 'Failed to process message')
      }
    } else {
      logger.warn('Unknown message type', { type: message.type, connectionId })
      this.sendError(connectionId, `Unknown message type: ${message.type}`)
    }
  }

  // Message handlers
  private handleJoinDocument(message: WebSocketMessage, connectionId: string): void {
    const { documentId, user } = message.payload
    const connection = this.connectionInfo.get(connectionId)
    
    if (!connection || !documentId || !user) {
      this.sendError(connectionId, 'Invalid join_document payload')
      return
    }

    // Leave previous document if any
    if (connection.documentId) {
      collaborationEngine.leaveDocument(connection.documentId, connection.userId)
    }

    // Update connection info
    connection.documentId = documentId

    // Create or get document
    let document = collaborationEngine.getDocument(documentId)
    if (!document) {
      document = collaborationEngine.createDocument(documentId)
    }

    // Join collaboration
    const collaborationUser: CollaborationUser = {
      ...user,
      id: connection.userId,
      lastSeen: Date.now()
    }

    collaborationEngine.joinDocument(documentId, collaborationUser)

    // Send current document state
    this.sendMessage(connectionId, {
      type: 'document_state',
      payload: {
        content: document.content,
        version: document.version,
        activeUsers: Array.from(document.activeUsers.values())
      },
      timestamp: Date.now()
    })

    // Subscribe to document changes
    this.subscribeToDocument(connectionId, documentId)

    logger.info('User joined document', { 
      connectionId, 
      documentId, 
      userId: connection.userId 
    })
  }

  private handleLeaveDocument(message: WebSocketMessage, connectionId: string): void {
    const connection = this.connectionInfo.get(connectionId)
    if (!connection?.documentId) return

    collaborationEngine.leaveDocument(connection.documentId, connection.userId)
    connection.documentId = undefined

    this.sendMessage(connectionId, {
      type: 'left_document',
      payload: { success: true },
      timestamp: Date.now()
    })

    logger.info('User left document', { connectionId, userId: connection.userId })
  }

  private handleOperation(message: WebSocketMessage, connectionId: string): void {
    const connection = this.connectionInfo.get(connectionId)
    if (!connection?.documentId) {
      this.sendError(connectionId, 'No active document')
      return
    }

    const operation: CollaborationOperation = {
      ...message.payload,
      userId: connection.userId,
      documentId: connection.documentId,
      timestamp: Date.now()
    }

    try {
      const updatedDocument = collaborationEngine.applyOperation(operation)
      
      // Broadcast to other users in the document
      this.broadcastToDocument(connection.documentId, {
        type: 'operation',
        payload: operation,
        timestamp: Date.now()
      }, connectionId)

    } catch (error) {
      logger.error('Operation failed', { operation, error })
      this.sendError(connectionId, 'Operation failed')
    }
  }

  private handleCursorUpdate(message: WebSocketMessage, connectionId: string): void {
    const connection = this.connectionInfo.get(connectionId)
    if (!connection?.documentId) return

    const { position, selection } = message.payload

    collaborationEngine.updateUserCursor(
      connection.documentId,
      connection.userId,
      position,
      selection
    )

    // Broadcast cursor update to other users
    this.broadcastToDocument(connection.documentId, {
      type: 'cursor_update',
      payload: {
        userId: connection.userId,
        position,
        selection
      },
      timestamp: Date.now()
    }, connectionId)
  }

  private handlePing(message: WebSocketMessage, connectionId: string): void {
    this.sendMessage(connectionId, {
      type: 'pong',
      payload: { timestamp: Date.now() },
      timestamp: Date.now()
    })
  }

  // Document subscription
  private subscribeToDocument(connectionId: string, documentId: string): void {
    const unsubscribe = collaborationEngine.subscribe(documentId, (state) => {
      this.sendMessage(connectionId, {
        type: 'document_updated',
        payload: {
          version: state.version,
          activeUsers: Array.from(state.activeUsers.values())
        },
        timestamp: Date.now()
      })
    })

    // Store unsubscribe function (in a real implementation, you'd track this)
  }

  // Broadcasting
  private broadcastToDocument(
    documentId: string, 
    message: WebSocketMessage, 
    excludeConnectionId?: string
  ): void {
    this.connectionInfo.forEach((connection, connectionId) => {
      if (
        connection.documentId === documentId && 
        connection.isActive &&
        connectionId !== excludeConnectionId
      ) {
        this.sendMessage(connectionId, message)
      }
    })
  }

  sendMessage(connectionId: string, message: WebSocketMessage): void {
    const ws = this.connections.get(connectionId)
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send message to closed connection', { connectionId })
      return
    }

    try {
      ws.send(JSON.stringify(message))
    } catch (error) {
      logger.error('Failed to send WebSocket message', { connectionId, error })
      this.removeConnection(connectionId)
    }
  }

  private sendError(connectionId: string, error: string): void {
    this.sendMessage(connectionId, {
      type: 'error',
      payload: { error },
      timestamp: Date.now()
    })
  }

  // Heartbeat and cleanup
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.pingConnections()
      this.cleanupInactiveConnections()
    }, 30000) // Every 30 seconds
  }

  private pingConnections(): void {
    this.connections.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping()
        } catch (error) {
          logger.warn('Failed to ping connection', { connectionId })
          this.removeConnection(connectionId)
        }
      }
    })
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now()
    const timeout = 2 * 60 * 1000 // 2 minutes

    this.connectionInfo.forEach((connection, connectionId) => {
      if (now - connection.lastActivity > timeout) {
        logger.info('Removing inactive connection', { connectionId })
        this.removeConnection(connectionId)
      }
    })
  }

  // Statistics
  getConnectionStats() {
    const stats = {
      totalConnections: this.connections.size,
      activeConnections: 0,
      documentsWithUsers: new Set<string>(),
      connections: Array.from(this.connectionInfo.values())
    }

    this.connectionInfo.forEach(connection => {
      if (connection.isActive) {
        stats.activeConnections++
      }
      if (connection.documentId) {
        stats.documentsWithUsers.add(connection.documentId)
      }
    })

    return {
      ...stats,
      documentsWithUsers: stats.documentsWithUsers.size
    }
  }

  // Cleanup
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.connections.forEach((ws, connectionId) => {
      this.removeConnection(connectionId)
    })

    logger.info('WebSocket manager shutdown complete')
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager()