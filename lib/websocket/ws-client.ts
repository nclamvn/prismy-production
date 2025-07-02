/**
 * WebSocket Client - Phase 3.4-A
 * Client-side WebSocket utilities for real-time job progress
 * 
 * Features:
 * - Auto-reconnection with exponential backoff
 * - JWT authentication
 * - Room subscription management
 * - Type-safe message handling
 * - Connection state management
 * 
 * Usage:
 * ```typescript
 * const client = new WebSocketClient()
 * await client.connect(token)
 * client.subscribeToJob(jobId, (progress) => {
 *   console.log('Job progress:', progress)
 * })
 * ```
 */

interface WebSocketMessage {
  type: 'auth' | 'subscribe' | 'unsubscribe' | 'heartbeat' | 'job_progress' | 'error'
  payload?: any
  roomId?: string
  jobId?: string
  timestamp?: string
}

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

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private token: string | null = null
  private state: ConnectionState = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  
  // Event handlers
  private onConnectionChange: ((state: ConnectionState) => void) | null = null
  private jobProgressHandlers = new Map<string, (progress: JobProgress) => void>()
  private roomHandlers = new Map<string, (message: any) => void>()
  
  constructor(wsUrl?: string) {
    this.url = wsUrl || this.getWebSocketUrl()
  }

  /**
   * Connect to WebSocket server with authentication
   */
  async connect(authToken: string): Promise<void> {
    if (this.state === 'connected' || this.state === 'authenticated') {
      return
    }

    this.token = authToken
    this.setState('connecting')

    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('[WS CLIENT] Connected to WebSocket server')
        this.setState('connected')
        this.reconnectAttempts = 0
        this.authenticate()
        this.startHeartbeat()
      }
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }
      
      this.ws.onclose = (event) => {
        console.log('[WS CLIENT] WebSocket connection closed:', event.code, event.reason)
        this.setState('disconnected')
        this.stopHeartbeat()
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('[WS CLIENT] WebSocket error:', error)
        this.setState('error')
      }

    } catch (error) {
      console.error('[WS CLIENT] Failed to connect:', error)
      this.setState('error')
      throw error
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.setState('disconnected')
    this.token = null
    this.reconnectAttempts = 0
  }

  /**
   * Subscribe to job progress updates
   */
  subscribeToJob(jobId: string, onProgress: (progress: JobProgress) => void): void {
    this.jobProgressHandlers.set(jobId, onProgress)
    
    if (this.state === 'authenticated') {
      this.sendMessage({
        type: 'subscribe',
        roomId: `job:${jobId}`,
        payload: { jobId }
      })
    }
  }

  /**
   * Unsubscribe from job progress updates
   */
  unsubscribeFromJob(jobId: string): void {
    this.jobProgressHandlers.delete(jobId)
    
    if (this.state === 'authenticated') {
      this.sendMessage({
        type: 'unsubscribe',
        roomId: `job:${jobId}`
      })
    }
  }

  /**
   * Subscribe to custom room
   */
  subscribeToRoom(roomId: string, onMessage: (message: any) => void): void {
    this.roomHandlers.set(roomId, onMessage)
    
    if (this.state === 'authenticated') {
      this.sendMessage({
        type: 'subscribe',
        roomId
      })
    }
  }

  /**
   * Unsubscribe from custom room
   */
  unsubscribeFromRoom(roomId: string): void {
    this.roomHandlers.delete(roomId)
    
    if (this.state === 'authenticated') {
      this.sendMessage({
        type: 'unsubscribe',
        roomId
      })
    }
  }

  /**
   * Set connection state change handler
   */
  onStateChange(handler: (state: ConnectionState) => void): void {
    this.onConnectionChange = handler
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state
  }

  /**
   * Check if client is connected and authenticated
   */
  isReady(): boolean {
    return this.state === 'authenticated'
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('[WS CLIENT] Received message:', message.type, message.payload)
    
    switch (message.type) {
      case 'auth':
        if (message.payload?.status === 'authenticated') {
          this.setState('authenticated')
          this.resubscribeToRooms()
        }
        break
        
      case 'job_progress':
        if (message.payload?.jobId) {
          const handler = this.jobProgressHandlers.get(message.payload.jobId)
          if (handler) {
            handler(message.payload as JobProgress)
          }
        }
        break
        
      case 'subscribe':
        console.log('[WS CLIENT] Subscribed to room:', message.payload?.roomId)
        break
        
      case 'unsubscribe':
        console.log('[WS CLIENT] Unsubscribed from room:', message.payload?.roomId)
        break
        
      case 'heartbeat':
        // Handle heartbeat/pong
        break
        
      case 'error':
        console.error('[WS CLIENT] Server error:', message.payload?.message)
        break
        
      default:
        // Handle custom room messages
        if (message.roomId) {
          const handler = this.roomHandlers.get(message.roomId)
          if (handler) {
            handler(message.payload)
          }
        }
    }
  }

  /**
   * Authenticate with the server
   */
  private authenticate(): void {
    if (this.token && this.ws) {
      this.sendMessage({
        type: 'auth',
        payload: this.token
      })
    }
  }

  /**
   * Re-subscribe to all rooms after reconnection
   */
  private resubscribeToRooms(): void {
    // Re-subscribe to job rooms
    for (const jobId of this.jobProgressHandlers.keys()) {
      this.sendMessage({
        type: 'subscribe',
        roomId: `job:${jobId}`,
        payload: { jobId }
      })
    }
    
    // Re-subscribe to custom rooms
    for (const roomId of this.roomHandlers.keys()) {
      this.sendMessage({
        type: 'subscribe',
        roomId
      })
    }
  }

  /**
   * Send message to server
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  /**
   * Set connection state and notify handlers
   */
  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state
      if (this.onConnectionChange) {
        this.onConnectionChange(state)
      }
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`[WS CLIENT] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (this.token) {
        this.connect(this.token)
      }
    }, delay)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'heartbeat',
          payload: { ping: Date.now() }
        })
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.hostname
      const port = process.env.NODE_ENV === 'production' ? '' : ':3001'
      return `${protocol}//${host}${port}/ws`
    }
    
    return 'ws://localhost:3001/ws'
  }
}

/**
 * WebSocket Authentication Token Generator
 */
export class WebSocketAuth {
  private static readonly JWT_SECRET = process.env.WS_JWT_SECRET || 'fallback-ws-secret'

  /**
   * Generate WebSocket authentication token (server-side only)
   */
  static async generateToken(payload: {
    userId?: string
    sessionId?: string
    orgId?: string
  }): Promise<string> {
    // This should only run on server-side
    if (typeof window !== 'undefined') {
      throw new Error('WebSocket token generation must happen on server-side')
    }

    const jwt = await import('jsonwebtoken')
    
    return jwt.sign(
      {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
      },
      this.JWT_SECRET
    )
  }

  /**
   * Get WebSocket token from server endpoint (client-side)
   */
  static async getToken(): Promise<string> {
    const response = await fetch('/api/ws/token', {
      method: 'POST',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to get WebSocket token')
    }

    const data = await response.json()
    return data.token
  }
}

// Export singleton instance for convenience
export const wsClient = new WebSocketClient()