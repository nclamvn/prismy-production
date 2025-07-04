import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

export interface UserPresence {
  userId: string
  email: string
  displayName?: string
  status: 'online' | 'idle' | 'offline'
  lastSeen: string
  currentDocument?: string
  cursor?: { x: number; y: number }
  selection?: { start: number; end: number }
  color: string
}

export interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'edit' | 'comment' | 'status'
  userId: string
  documentId: string
  data: Record<string, unknown>
  timestamp: string
}

export class CollaborationManager {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private presenceState: Map<string, RealtimePresenceState<UserPresence>> = new Map()
  private eventHandlers: Map<string, Set<(event: CollaborationEvent) => void>> = new Map()
  private userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#5F27CD',
    '#00D2D3', '#FF9FF3', '#54A0FF', '#48DBFB', '#FECA57'
  ]

  async joinDocument(documentId: string, userId: string, userEmail: string, displayName?: string): Promise<void> {
    if (this.channels.has(documentId)) {
      console.log('Already joined document:', documentId)
      return
    }

    const channel = this.supabase.channel(`document:${documentId}`, {
      config: {
        presence: {
          key: userId,
        },
        broadcast: {
          self: false,
        },
      },
    })

    // Set up presence tracking
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<UserPresence>()
      this.presenceState.set(documentId, state)
      this.notifyPresenceChange(documentId)
    })

    // Set up broadcast event handling
    channel.on('broadcast', { event: 'collaboration' }, ({ payload }) => {
      const event = payload as CollaborationEvent
      this.handleCollaborationEvent(documentId, event)
    })

    // Subscribe to the channel
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track user presence
        const userPresence: UserPresence = {
          userId,
          email: userEmail,
          displayName,
          status: 'online',
          lastSeen: new Date().toISOString(),
          currentDocument: documentId,
          color: this.getUserColor(userId),
        }

        await channel.track(userPresence)
      }
    })

    this.channels.set(documentId, channel)
  }

  async leaveDocument(documentId: string): Promise<void> {
    const channel = this.channels.get(documentId)
    if (!channel) return

    await channel.untrack()
    await channel.unsubscribe()
    
    this.channels.delete(documentId)
    this.presenceState.delete(documentId)
    this.eventHandlers.delete(documentId)
  }

  async updateCursor(documentId: string, userId: string, cursor: { x: number; y: number }): Promise<void> {
    const channel = this.channels.get(documentId)
    if (!channel) return

    await channel.send({
      type: 'broadcast',
      event: 'collaboration',
      payload: {
        type: 'cursor',
        userId,
        documentId,
        data: { cursor },
        timestamp: new Date().toISOString(),
      } as CollaborationEvent,
    })
  }

  async updateSelection(
    documentId: string, 
    userId: string, 
    selection: { start: number; end: number }
  ): Promise<void> {
    const channel = this.channels.get(documentId)
    if (!channel) return

    await channel.send({
      type: 'broadcast',
      event: 'collaboration',
      payload: {
        type: 'selection',
        userId,
        documentId,
        data: { selection },
        timestamp: new Date().toISOString(),
      } as CollaborationEvent,
    })
  }

  async broadcastEdit(
    documentId: string, 
    userId: string, 
    edit: { type: 'insert' | 'delete'; position: number; content?: string }
  ): Promise<void> {
    const channel = this.channels.get(documentId)
    if (!channel) return

    await channel.send({
      type: 'broadcast',
      event: 'collaboration',
      payload: {
        type: 'edit',
        userId,
        documentId,
        data: edit,
        timestamp: new Date().toISOString(),
      } as CollaborationEvent,
    })
  }

  async updateUserStatus(documentId: string, userId: string, status: 'online' | 'idle' | 'offline'): Promise<void> {
    const channel = this.channels.get(documentId)
    if (!channel) return

    const presence = await this.getPresence(documentId, userId)
    if (presence) {
      await channel.track({
        ...presence,
        status,
        lastSeen: new Date().toISOString(),
      })
    }
  }

  onCollaborationEvent(documentId: string, handler: (event: CollaborationEvent) => void): () => void {
    if (!this.eventHandlers.has(documentId)) {
      this.eventHandlers.set(documentId, new Set())
    }

    this.eventHandlers.get(documentId)!.add(handler)

    // Return cleanup function
    return () => {
      const handlers = this.eventHandlers.get(documentId)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  getActiveUsers(documentId: string): UserPresence[] {
    const state = this.presenceState.get(documentId)
    if (!state) return []

    return Object.values(state).map(presences => {
      // Get the most recent presence for each user
      return Array.isArray(presences) ? presences[0] : presences
    }).filter(p => p.status === 'online')
  }

  getPresence(documentId: string, userId: string): UserPresence | null {
    const state = this.presenceState.get(documentId)
    if (!state || !state[userId]) return null

    const presences = state[userId]
    return Array.isArray(presences) ? presences[0] : presences
  }

  private handleCollaborationEvent(documentId: string, event: CollaborationEvent): void {
    const handlers = this.eventHandlers.get(documentId)
    if (!handlers) return

    handlers.forEach(handler => handler(event))
  }

  private notifyPresenceChange(documentId: string): void {
    const event: CollaborationEvent = {
      type: 'status',
      userId: 'system',
      documentId,
      data: { users: this.getActiveUsers(documentId) },
      timestamp: new Date().toISOString(),
    }

    this.handleCollaborationEvent(documentId, event)
  }

  private getUserColor(userId: string): string {
    // Generate consistent color based on user ID
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)

    return this.userColors[Math.abs(hash) % this.userColors.length]
  }

  // Singleton instance
  private static instance: CollaborationManager

  static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager()
    }
    return CollaborationManager.instance
  }
}