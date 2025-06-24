/**
 * WEBSOCKET MANAGER
 * Real-time communication system for live updates, collaboration, and notifications
 */

import { logger } from '@/lib/logger'
import WebSocket from 'ws'

export interface WebSocketMessage {
  id: string
  type: string
  userId: string
  timestamp: number
  data: any
  channel?: string
  targetUsers?: string[]
}

export interface WebSocketConnection {
  id: string
  userId: string
  ws: WebSocket
  channels: Set<string>
  lastPing: number
  metadata: {
    userAgent?: string
    ipAddress?: string
    connectedAt: number
    tier: string
  }
}

export interface Channel {
  id: string
  type: 'user' | 'document' | 'translation' | 'collaboration' | 'system'
  participants: Set<string>
  metadata: {
    createdAt: number
    lastActivity: number
    messageCount: number
  }
}

class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map()
  private userConnections: Map<string, Set<string>> = new Map()
  private channels: Map<string, Channel> = new Map()
  private messageHistory: Map<string, WebSocketMessage[]> = new Map()
  private pingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeManager()
  }

  private initializeManager() {
    logger.info('WebSocket Manager initialized')
    
    // Start ping/pong mechanism
    this.pingInterval = setInterval(() => {
      this.pingConnections()
    }, 30000) // Ping every 30 seconds

    // Clean up inactive connections every 5 minutes
    setInterval(() => {
      this.cleanupInactiveConnections()
    }, 300000)
  }

  // Add a new WebSocket connection
  addConnection(
    connectionId: string, 
    ws: WebSocket, 
    userId: string, 
    metadata: Partial<WebSocketConnection['metadata']> = {}
  ): boolean {
    try {
      const connection: WebSocketConnection = {
        id: connectionId,
        userId,
        ws,
        channels: new Set(),
        lastPing: Date.now(),
        metadata: {
          connectedAt: Date.now(),
          tier: 'free',
          ...metadata
        }
      }

      // Set up WebSocket event handlers
      ws.on('message', (message) => {
        this.handleMessage(connectionId, message)
      })

      ws.on('close', () => {
        this.removeConnection(connectionId)
      })

      ws.on('error', (error) => {
        logger.error(`WebSocket error for connection ${connectionId}:`, error)
        this.removeConnection(connectionId)
      })

      ws.on('pong', () => {
        const conn = this.connections.get(connectionId)
        if (conn) {
          conn.lastPing = Date.now()
        }
      })

      // Store connection
      this.connections.set(connectionId, connection)
      
      // Track user connections
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set())
      }
      this.userConnections.get(userId)!.add(connectionId)

      // Automatically join user's personal channel
      this.joinChannel(connectionId, `user:${userId}`)

      logger.info(`WebSocket connection added: ${connectionId} for user ${userId}`)
      
      // Send welcome message
      this.sendToConnection(connectionId, {
        id: this.generateMessageId(),
        type: 'connection_established',
        userId: 'system',
        timestamp: Date.now(),
        data: {
          connectionId,
          channels: Array.from(connection.channels),
          serverTime: Date.now()
        }
      })

      return true
    } catch (error) {
      logger.error('Failed to add WebSocket connection:', error)
      return false
    }
  }

  // Remove a WebSocket connection
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      // Leave all channels
      for (const channelId of connection.channels) {
        this.leaveChannel(connectionId, channelId)
      }

      // Remove from user connections
      const userConnections = this.userConnections.get(connection.userId)
      if (userConnections) {
        userConnections.delete(connectionId)
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId)
        }
      }

      // Close WebSocket if still open
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close()
      }

      // Remove connection
      this.connections.delete(connectionId)

      logger.info(`WebSocket connection removed: ${connectionId}`)
    } catch (error) {
      logger.error('Error removing WebSocket connection:', error)
    }
  }

  // Join a channel
  joinChannel(connectionId: string, channelId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    try {
      // Create channel if it doesn't exist
      if (!this.channels.has(channelId)) {
        this.createChannel(channelId, this.getChannelType(channelId))
      }

      const channel = this.channels.get(channelId)!
      
      // Add connection to channel
      connection.channels.add(channelId)
      channel.participants.add(connection.userId)
      channel.metadata.lastActivity = Date.now()

      logger.info(`Connection ${connectionId} joined channel ${channelId}`)

      // Notify channel about new participant
      this.broadcastToChannel(channelId, {
        id: this.generateMessageId(),
        type: 'channel_user_joined',
        userId: 'system',
        timestamp: Date.now(),
        channel: channelId,
        data: {
          userId: connection.userId,
          participantCount: channel.participants.size
        }
      }, connectionId)

      return true
    } catch (error) {
      logger.error('Error joining channel:', error)
      return false
    }
  }

  // Leave a channel
  leaveChannel(connectionId: string, channelId: string): boolean {
    const connection = this.connections.get(connectionId)
    const channel = this.channels.get(channelId)
    
    if (!connection || !channel) return false

    try {
      // Remove from channel
      connection.channels.delete(channelId)
      channel.participants.delete(connection.userId)
      channel.metadata.lastActivity = Date.now()

      logger.info(`Connection ${connectionId} left channel ${channelId}`)

      // Notify channel about participant leaving
      this.broadcastToChannel(channelId, {
        id: this.generateMessageId(),
        type: 'channel_user_left',
        userId: 'system',
        timestamp: Date.now(),
        channel: channelId,
        data: {
          userId: connection.userId,
          participantCount: channel.participants.size
        }
      })

      // Remove channel if empty and not persistent
      if (channel.participants.size === 0 && !this.isPersistentChannel(channelId)) {
        this.channels.delete(channelId)
        this.messageHistory.delete(channelId)
      }

      return true
    } catch (error) {
      logger.error('Error leaving channel:', error)
      return false
    }
  }

  // Send message to specific connection
  sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false
    }

    try {
      connection.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      logger.error(`Error sending message to connection ${connectionId}:`, error)
      this.removeConnection(connectionId)
      return false
    }
  }

  // Send message to all connections of a user
  sendToUser(userId: string, message: WebSocketMessage): number {
    const userConnections = this.userConnections.get(userId)
    if (!userConnections) return 0

    let sentCount = 0
    for (const connectionId of userConnections) {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++
      }
    }
    return sentCount
  }

  // Broadcast message to all connections in a channel
  broadcastToChannel(channelId: string, message: WebSocketMessage, excludeConnectionId?: string): number {
    const channel = this.channels.get(channelId)
    if (!channel) return 0

    // Store message in history
    this.storeMessage(channelId, message)

    let sentCount = 0
    for (const userId of channel.participants) {
      const userConnections = this.userConnections.get(userId)
      if (!userConnections) continue

      for (const connectionId of userConnections) {
        if (connectionId === excludeConnectionId) continue
        
        const connection = this.connections.get(connectionId)
        if (connection && connection.channels.has(channelId)) {
          if (this.sendToConnection(connectionId, message)) {
            sentCount++
          }
        }
      }
    }

    channel.metadata.lastActivity = Date.now()
    channel.metadata.messageCount++
    
    return sentCount
  }

  // Broadcast to all connections
  broadcastToAll(message: WebSocketMessage, excludeUserId?: string): number {
    let sentCount = 0
    for (const [connectionId, connection] of this.connections) {
      if (excludeUserId && connection.userId === excludeUserId) continue
      
      if (this.sendToConnection(connectionId, message)) {
        sentCount++
      }
    }
    return sentCount
  }

  // Handle incoming messages
  private handleMessage(connectionId: string, rawMessage: Buffer | string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      const messageStr = rawMessage.toString()
      const message = JSON.parse(messageStr) as WebSocketMessage

      // Validate message
      if (!message.type || !message.id) {
        logger.warn(`Invalid message from connection ${connectionId}`)
        return
      }

      // Update message metadata
      message.userId = connection.userId
      message.timestamp = Date.now()

      logger.debug(`Received message from ${connectionId}:`, message.type)

      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.sendToConnection(connectionId, {
            id: this.generateMessageId(),
            type: 'pong',
            userId: 'system',
            timestamp: Date.now(),
            data: { originalId: message.id }
          })
          break

        case 'join_channel':
          if (message.data?.channelId) {
            this.joinChannel(connectionId, message.data.channelId)
          }
          break

        case 'leave_channel':
          if (message.data?.channelId) {
            this.leaveChannel(connectionId, message.data.channelId)
          }
          break

        case 'channel_message':
          if (message.channel) {
            this.broadcastToChannel(message.channel, message, connectionId)
          }
          break

        case 'direct_message':
          if (message.targetUsers?.length) {
            for (const targetUserId of message.targetUsers) {
              this.sendToUser(targetUserId, message)
            }
          }
          break

        case 'translation_update':
          this.handleTranslationUpdate(message)
          break

        case 'document_update':
          this.handleDocumentUpdate(message)
          break

        default:
          // Forward custom messages to appropriate channels
          if (message.channel) {
            this.broadcastToChannel(message.channel, message, connectionId)
          }
          break
      }

    } catch (error) {
      logger.error(`Error handling message from connection ${connectionId}:`, error)
    }
  }

  // Handle translation updates
  private handleTranslationUpdate(message: WebSocketMessage): void {
    const { translationId, status, progress, result } = message.data

    // Broadcast to translation channel
    const channelId = `translation:${translationId}`
    this.broadcastToChannel(channelId, {
      ...message,
      type: 'translation_progress',
      channel: channelId
    })

    // Also send to user's personal channel
    this.sendToUser(message.userId, {
      ...message,
      type: 'translation_notification',
      channel: `user:${message.userId}`
    })
  }

  // Handle document updates
  private handleDocumentUpdate(message: WebSocketMessage): void {
    const { documentId, action, data } = message.data

    // Broadcast to document channel
    const channelId = `document:${documentId}`
    this.broadcastToChannel(channelId, {
      ...message,
      type: 'document_change',
      channel: channelId
    })
  }

  // Create a new channel
  private createChannel(channelId: string, type: Channel['type']): void {
    const channel: Channel = {
      id: channelId,
      type,
      participants: new Set(),
      metadata: {
        createdAt: Date.now(),
        lastActivity: Date.now(),
        messageCount: 0
      }
    }

    this.channels.set(channelId, channel)
    this.messageHistory.set(channelId, [])
    
    logger.info(`Created channel: ${channelId} (type: ${type})`)
  }

  // Determine channel type from channel ID
  private getChannelType(channelId: string): Channel['type'] {
    if (channelId.startsWith('user:')) return 'user'
    if (channelId.startsWith('document:')) return 'document'
    if (channelId.startsWith('translation:')) return 'translation'
    if (channelId.startsWith('collaboration:')) return 'collaboration'
    if (channelId.startsWith('system:')) return 'system'
    return 'user'
  }

  // Check if channel should persist when empty
  private isPersistentChannel(channelId: string): boolean {
    return channelId.startsWith('system:') || channelId.startsWith('global:')
  }

  // Store message in channel history
  private storeMessage(channelId: string, message: WebSocketMessage): void {
    if (!this.messageHistory.has(channelId)) {
      this.messageHistory.set(channelId, [])
    }

    const history = this.messageHistory.get(channelId)!
    history.push(message)

    // Keep only last 100 messages per channel
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Ping all connections
  private pingConnections(): void {
    for (const [connectionId, connection] of this.connections) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.ping()
        } catch (error) {
          logger.warn(`Failed to ping connection ${connectionId}`)
          this.removeConnection(connectionId)
        }
      } else {
        this.removeConnection(connectionId)
      }
    }
  }

  // Clean up inactive connections
  private cleanupInactiveConnections(): void {
    const now = Date.now()
    const timeout = 120000 // 2 minutes

    for (const [connectionId, connection] of this.connections) {
      if (now - connection.lastPing > timeout) {
        logger.info(`Removing inactive connection: ${connectionId}`)
        this.removeConnection(connectionId)
      }
    }
  }

  // Get channel message history
  getChannelHistory(channelId: string, limit: number = 50): WebSocketMessage[] {
    const history = this.messageHistory.get(channelId) || []
    return history.slice(-limit)
  }

  // Get connection statistics
  getConnectionStats() {
    const connectionsByUser = new Map<string, number>()
    for (const [, connection] of this.connections) {
      const count = connectionsByUser.get(connection.userId) || 0
      connectionsByUser.set(connection.userId, count + 1)
    }

    return {
      totalConnections: this.connections.size,
      uniqueUsers: this.userConnections.size,
      totalChannels: this.channels.size,
      connectionsByUser: Object.fromEntries(connectionsByUser),
      channelStats: Array.from(this.channels.entries()).map(([id, channel]) => ({
        id,
        type: channel.type,
        participants: channel.participants.size,
        messageCount: channel.metadata.messageCount,
        lastActivity: channel.metadata.lastActivity
      }))
    }
  }

  // Cleanup on shutdown
  destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }

    // Close all connections
    for (const [connectionId] of this.connections) {
      this.removeConnection(connectionId)
    }

    logger.info('WebSocket Manager destroyed')
  }
}

// Export singleton instance
export const websocketManager = new WebSocketManager()

