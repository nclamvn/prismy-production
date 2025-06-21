/**
 * Real-time Collaboration Engine
 * Implements operational transforms and conflict resolution for collaborative editing
 */

import { logger } from '@/lib/logger'

export interface CollaborationUser {
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

export interface CollaborationOperation {
  id: string
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: number
  documentId: string
}

export interface DocumentState {
  id: string
  content: string
  version: number
  operations: CollaborationOperation[]
  activeUsers: Map<string, CollaborationUser>
  lastModified: number
}

export class CollaborationEngine {
  private documents = new Map<string, DocumentState>()
  private subscribers = new Map<string, Set<(state: DocumentState) => void>>()
  private operationQueue = new Map<string, CollaborationOperation[]>()

  constructor() {
    // Clean up inactive users every 30 seconds
    setInterval(() => this.cleanupInactiveUsers(), 30000)
  }

  // Document lifecycle
  createDocument(documentId: string, initialContent: string = ''): DocumentState {
    const state: DocumentState = {
      id: documentId,
      content: initialContent,
      version: 0,
      operations: [],
      activeUsers: new Map(),
      lastModified: Date.now()
    }

    this.documents.set(documentId, state)
    this.operationQueue.set(documentId, [])
    
    logger.info('Collaboration document created', { documentId })
    return state
  }

  getDocument(documentId: string): DocumentState | null {
    return this.documents.get(documentId) || null
  }

  deleteDocument(documentId: string): void {
    this.documents.delete(documentId)
    this.subscribers.delete(documentId)
    this.operationQueue.delete(documentId)
    logger.info('Collaboration document deleted', { documentId })
  }

  // User management
  joinDocument(documentId: string, user: CollaborationUser): void {
    const document = this.documents.get(documentId)
    if (!document) {
      throw new Error(`Document ${documentId} not found`)
    }

    user.lastSeen = Date.now()
    document.activeUsers.set(user.id, user)
    
    this.notifySubscribers(documentId, document)
    logger.info('User joined collaboration', { documentId, userId: user.id })
  }

  leaveDocument(documentId: string, userId: string): void {
    const document = this.documents.get(documentId)
    if (!document) return

    document.activeUsers.delete(userId)
    this.notifySubscribers(documentId, document)
    logger.info('User left collaboration', { documentId, userId })
  }

  updateUserCursor(
    documentId: string, 
    userId: string, 
    position: number, 
    selection?: { start: number; end: number }
  ): void {
    const document = this.documents.get(documentId)
    const user = document?.activeUsers.get(userId)
    
    if (!document || !user) return

    user.cursor = { position, selection }
    user.lastSeen = Date.now()
    
    this.notifySubscribers(documentId, document)
  }

  // Operational Transform implementation
  applyOperation(operation: CollaborationOperation): DocumentState {
    const document = this.documents.get(operation.documentId)
    if (!document) {
      throw new Error(`Document ${operation.documentId} not found`)
    }

    // Queue operation for processing
    const queue = this.operationQueue.get(operation.documentId) || []
    queue.push(operation)
    this.operationQueue.set(operation.documentId, queue)

    // Process operations in order
    this.processOperationQueue(operation.documentId)

    return document
  }

  private processOperationQueue(documentId: string): void {
    const document = this.documents.get(documentId)
    const queue = this.operationQueue.get(documentId)
    
    if (!document || !queue || queue.length === 0) return

    // Sort operations by timestamp
    queue.sort((a, b) => a.timestamp - b.timestamp)

    // Apply each operation with conflict resolution
    while (queue.length > 0) {
      const operation = queue.shift()!
      
      try {
        this.applyOperationToDocument(document, operation)
        document.operations.push(operation)
        document.version++
        document.lastModified = Date.now()
      } catch (error) {
        logger.error('Failed to apply operation', { 
          operation, 
          error: error instanceof Error ? error.message : error 
        })
      }
    }

    this.notifySubscribers(documentId, document)
  }

  private applyOperationToDocument(document: DocumentState, operation: CollaborationOperation): void {
    const { type, position, content, length } = operation

    switch (type) {
      case 'insert':
        if (content === undefined) {
          throw new Error('Insert operation requires content')
        }
        if (position < 0 || position > document.content.length) {
          throw new Error(`Invalid insert position: ${position}`)
        }
        document.content = 
          document.content.slice(0, position) + 
          content + 
          document.content.slice(position)
        break

      case 'delete':
        if (length === undefined) {
          throw new Error('Delete operation requires length')
        }
        if (position < 0 || position + length > document.content.length) {
          throw new Error(`Invalid delete range: ${position}-${position + length}`)
        }
        document.content = 
          document.content.slice(0, position) + 
          document.content.slice(position + length)
        break

      case 'retain':
        // Retain operations don't modify content, used for cursor positioning
        break

      default:
        throw new Error(`Unknown operation type: ${type}`)
    }
  }

  // Conflict resolution using operational transform
  transformOperation(
    operation: CollaborationOperation, 
    againstOperation: CollaborationOperation
  ): CollaborationOperation {
    if (operation.timestamp <= againstOperation.timestamp) {
      return operation // No transformation needed
    }

    const transformed = { ...operation }

    // Transform position based on the previous operation
    if (againstOperation.type === 'insert' && againstOperation.position <= operation.position) {
      const insertLength = againstOperation.content?.length || 0
      transformed.position += insertLength
    } else if (
      againstOperation.type === 'delete' && 
      againstOperation.position <= operation.position
    ) {
      const deleteLength = againstOperation.length || 0
      transformed.position = Math.max(
        againstOperation.position, 
        operation.position - deleteLength
      )
    }

    return transformed
  }

  // Subscription management
  subscribe(documentId: string, callback: (state: DocumentState) => void): () => void {
    if (!this.subscribers.has(documentId)) {
      this.subscribers.set(documentId, new Set())
    }
    
    this.subscribers.get(documentId)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.get(documentId)?.delete(callback)
    }
  }

  private notifySubscribers(documentId: string, state: DocumentState): void {
    const callbacks = this.subscribers.get(documentId)
    if (!callbacks) return

    callbacks.forEach(callback => {
      try {
        callback(state)
      } catch (error) {
        logger.error('Collaboration callback error', { error, documentId })
      }
    })
  }

  // Utilities
  private cleanupInactiveUsers(): void {
    const now = Date.now()
    const timeout = 5 * 60 * 1000 // 5 minutes

    this.documents.forEach((document, documentId) => {
      const inactiveUsers: string[] = []
      
      document.activeUsers.forEach((user, userId) => {
        if (now - user.lastSeen > timeout) {
          inactiveUsers.push(userId)
        }
      })

      inactiveUsers.forEach(userId => {
        document.activeUsers.delete(userId)
      })

      if (inactiveUsers.length > 0) {
        this.notifySubscribers(documentId, document)
        logger.info('Cleaned up inactive users', { 
          documentId, 
          count: inactiveUsers.length 
        })
      }
    })
  }

  // Analytics and monitoring
  getCollaborationStats(documentId: string) {
    const document = this.documents.get(documentId)
    if (!document) return null

    return {
      activeUsers: document.activeUsers.size,
      totalOperations: document.operations.length,
      lastModified: document.lastModified,
      version: document.version,
      contentLength: document.content.length,
      users: Array.from(document.activeUsers.values()).map(user => ({
        id: user.id,
        name: user.name,
        lastSeen: user.lastSeen,
        hasCursor: !!user.cursor
      }))
    }
  }

  getAllDocumentStats() {
    const stats = {
      totalDocuments: this.documents.size,
      totalActiveUsers: 0,
      documentsWithActivity: 0,
      documents: new Map<string, any>()
    }

    this.documents.forEach((document, documentId) => {
      const docStats = this.getCollaborationStats(documentId)
      if (docStats) {
        stats.documents.set(documentId, docStats)
        stats.totalActiveUsers += docStats.activeUsers
        if (docStats.activeUsers > 0) {
          stats.documentsWithActivity++
        }
      }
    })

    return stats
  }
}

// Singleton instance
export const collaborationEngine = new CollaborationEngine()