/**
 * WebSocket API Route for Real-time Collaboration
 * Handles WebSocket upgrades and collaboration messaging
 */

import { NextRequest } from 'next/server'
import { webSocketManager } from '@/lib/realtime/websocket-manager'
import { logger } from '@/lib/logger'
import { v4 as uuidv4 } from 'uuid'

// WebSocket upgrade handler
export async function GET(request: NextRequest) {
  try {
    // Check if this is a WebSocket upgrade request
    const upgrade = request.headers.get('upgrade')
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 400 })
    }

    // Extract user information from query parameters or headers
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || 'anonymous'
    const connectionId = uuidv4()

    // In a production environment, you would typically handle WebSocket upgrades
    // differently, possibly using a dedicated WebSocket server or Next.js API routes
    // with custom WebSocket handling
    
    return new Response(JSON.stringify({
      message: 'WebSocket endpoint available',
      connectionId,
      userId,
      endpoint: process.env.NODE_ENV === 'development' ? 'ws://localhost:3001/ws' : 'wss://prismy.in/ws'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    logger.error('WebSocket upgrade error', { error })
    return new Response('Internal Server Error', { status: 500 })
  }
}

// REST API for collaboration stats and management
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'get_stats':
        const stats = webSocketManager.getConnectionStats()
        return Response.json(stats)

      case 'get_document_stats':
        const { documentId } = body
        if (!documentId) {
          return new Response('Document ID required', { status: 400 })
        }
        
        // Get collaboration stats for specific document
        const docStats = webSocketManager.getConnectionStats()
        const documentConnections = docStats.connections.filter(
          conn => conn.documentId === documentId
        )
        
        return Response.json({
          documentId,
          activeUsers: documentConnections.length,
          connections: documentConnections
        })

      case 'broadcast_message':
        const { documentId: broadcastDocId, message } = body
        if (!broadcastDocId || !message) {
          return new Response('Document ID and message required', { status: 400 })
        }

        // Broadcast message to all users in document
        // This would typically be handled through the WebSocket manager
        logger.info('Broadcasting message', { documentId: broadcastDocId, message })
        
        return Response.json({ success: true })

      default:
        return new Response('Unknown action', { status: 400 })
    }

  } catch (error) {
    logger.error('Collaboration API error', { error })
    return new Response('Internal Server Error', { status: 500 })
  }
}