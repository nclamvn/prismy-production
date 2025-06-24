/**
 * WEBSOCKET API ROUTE
 * WebSocket connection endpoint for real-time communication
 */

import { NextRequest } from 'next/server'
import { websocketManager } from '@/lib/websocket/websocket-manager'
import { createRouteHandlerClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'
import WebSocket from 'ws'

// Store WebSocket server instance
let wss: WebSocket.Server | null = null

// Initialize WebSocket server
function initializeWebSocketServer() {
  if (wss) return wss

  // Create WebSocket server
  wss = new WebSocket.Server({ 
    port: parseInt(process.env.WEBSOCKET_PORT || '8080'),
    perMessageDeflate: false,
    maxPayload: 64 * 1024, // 64KB max message size
  })

  wss.on('connection', async (ws: WebSocket, request) => {
    try {
      // Extract user info from connection
      const url = new URL(request.url || '', `http://${request.headers.host}`)
      const token = url.searchParams.get('token')
      const userId = url.searchParams.get('userId')

      if (!token || !userId) {
        logger.warn('WebSocket connection rejected: missing token or userId')
        ws.close(1008, 'Authentication required')
        return
      }

      // Verify authentication token (simplified - in production, verify JWT)
      // For now, we'll trust the userId if token is provided
      const connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Get user tier (simplified - would normally verify against database)
      const userTier = 'free' // Default tier

      const metadata = {
        userAgent: request.headers['user-agent'] || 'unknown',
        ipAddress: request.socket.remoteAddress || 'unknown',
        tier: userTier
      }

      // Add connection to manager
      const success = websocketManager.addConnection(connectionId, ws, userId, metadata)
      
      if (!success) {
        logger.error('Failed to add WebSocket connection to manager')
        ws.close(1011, 'Internal server error')
        return
      }

      logger.info(`WebSocket connection established: ${connectionId} for user ${userId}`)

    } catch (error) {
      logger.error('Error handling WebSocket connection:', error)
      ws.close(1011, 'Internal server error')
    }
  })

  wss.on('error', (error) => {
    logger.error('WebSocket server error:', error)
  })

  logger.info(`WebSocket server started on port ${process.env.WEBSOCKET_PORT || '8080'}`)
  return wss
}

// HTTP endpoint for WebSocket information and status
export async function GET(request: NextRequest) {
  try {
    // Initialize WebSocket server if not already running
    if (!wss) {
      initializeWebSocketServer()
    }

    // Get connection statistics
    const stats = websocketManager.getConnectionStats()

    return Response.json({
      success: true,
      websocket: {
        status: 'running',
        port: process.env.WEBSOCKET_PORT || '8080',
        endpoint: `ws://localhost:${process.env.WEBSOCKET_PORT || '8080'}`,
        stats
      }
    })

  } catch (error) {
    logger.error('Error getting WebSocket status:', error)
    return Response.json(
      { error: 'Failed to get WebSocket status' },
      { status: 500 }
    )
  }
}

// POST endpoint for sending messages through HTTP (fallback)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, data, channel, targetUsers } = body

    if (!type) {
      return Response.json(
        { error: 'Message type is required' },
        { status: 400 }
      )
    }

    // Create message
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId: session.user.id,
      timestamp: Date.now(),
      data,
      channel,
      targetUsers
    }

    let sentCount = 0

    // Send message based on type
    if (targetUsers && targetUsers.length > 0) {
      // Direct message to specific users
      for (const targetUserId of targetUsers) {
        sentCount += websocketManager.sendToUser(targetUserId, message)
      }
    } else if (channel) {
      // Broadcast to channel
      sentCount = websocketManager.broadcastToChannel(channel, message)
    } else {
      // Send to user's own connections
      sentCount = websocketManager.sendToUser(session.user.id, message)
    }

    return Response.json({
      success: true,
      message: 'Message sent',
      sentCount,
      messageId: message.id
    })

  } catch (error) {
    logger.error('Error sending WebSocket message via HTTP:', error)
    return Response.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// Initialize WebSocket server on module load
if (process.env.NODE_ENV !== 'test') {
  initializeWebSocketServer()
}