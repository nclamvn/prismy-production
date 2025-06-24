/**
 * COLLABORATIVE DOCUMENT EDITOR
 * Real-time collaborative editing with conflict resolution
 */

import { WebSocketManager } from '@/lib/websocket/websocket-manager'

export interface CollaborativeDocument {
  id: string
  title: string
  content: string
  version: number
  lastModified: Date
  collaborators: DocumentCollaborator[]
  permissions: DocumentPermissions
  history: DocumentVersion[]
}

export interface DocumentCollaborator {
  userId: string
  userName: string
  email: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'active' | 'idle' | 'offline'
  cursor?: CursorPosition
  selection?: TextSelection
  lastSeen: Date
}

export interface CursorPosition {
  line: number
  column: number
  userId: string
}

export interface TextSelection {
  start: { line: number; column: number }
  end: { line: number; column: number }
  userId: string
}

export interface DocumentPermissions {
  canEdit: boolean
  canComment: boolean
  canShare: boolean
  canExport: boolean
}

export interface DocumentVersion {
  version: number
  content: string
  changes: TextOperation[]
  timestamp: Date
  userId: string
  comment?: string
}

export interface TextOperation {
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: number
}

export interface DocumentChange {
  documentId: string
  operations: TextOperation[]
  version: number
  userId: string
  timestamp: number
}

export class CollaborativeEditor {
  private documents = new Map<string, CollaborativeDocument>()
  private documentSubscriptions = new Map<string, Set<string>>() // documentId -> Set of userIds
  private userSessions = new Map<string, Set<string>>() // userId -> Set of documentIds
  private websocketManager: WebSocketManager

  constructor(websocketManager: WebSocketManager) {
    this.websocketManager = websocketManager
  }

  // Document Management
  async createDocument(
    userId: string, 
    title: string, 
    initialContent: string = '',
    permissions: Partial<DocumentPermissions> = {}
  ): Promise<CollaborativeDocument> {
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const document: CollaborativeDocument = {
      id: documentId,
      title,
      content: initialContent,
      version: 1,
      lastModified: new Date(),
      collaborators: [{
        userId,
        userName: 'Document Owner',
        email: '',
        role: 'owner',
        status: 'active',
        lastSeen: new Date()
      }],
      permissions: {
        canEdit: true,
        canComment: true,
        canShare: true,
        canExport: true,
        ...permissions
      },
      history: [{
        version: 1,
        content: initialContent,
        changes: [],
        timestamp: new Date(),
        userId,
        comment: 'Document created'
      }]
    }

    this.documents.set(documentId, document)
    return document
  }

  async getDocument(documentId: string): Promise<CollaborativeDocument | null> {
    return this.documents.get(documentId) || null
  }

  async joinDocument(documentId: string, userId: string, userName: string, email: string): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    // Add or update collaborator
    const existingCollaborator = document.collaborators.find(c => c.userId === userId)
    if (existingCollaborator) {
      existingCollaborator.status = 'active'
      existingCollaborator.lastSeen = new Date()
    } else {
      document.collaborators.push({
        userId,
        userName,
        email,
        role: 'editor',
        status: 'active',
        lastSeen: new Date()
      })
    }

    // Track subscriptions
    if (!this.documentSubscriptions.has(documentId)) {
      this.documentSubscriptions.set(documentId, new Set())
    }
    this.documentSubscriptions.get(documentId)!.add(userId)

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set())
    }
    this.userSessions.get(userId)!.add(documentId)

    // Notify other collaborators
    this.broadcastToDocument(documentId, {
      type: 'collaborator_joined',
      documentId,
      collaborator: document.collaborators.find(c => c.userId === userId),
      totalCollaborators: document.collaborators.length
    }, userId)

    return true
  }

  async leaveDocument(documentId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) return

    // Update collaborator status
    const collaborator = document.collaborators.find(c => c.userId === userId)
    if (collaborator) {
      collaborator.status = 'offline'
      collaborator.lastSeen = new Date()
      collaborator.cursor = undefined
      collaborator.selection = undefined
    }

    // Remove subscriptions
    this.documentSubscriptions.get(documentId)?.delete(userId)
    this.userSessions.get(userId)?.delete(documentId)

    // Notify other collaborators
    this.broadcastToDocument(documentId, {
      type: 'collaborator_left',
      documentId,
      userId,
      totalCollaborators: document.collaborators.filter(c => c.status === 'active').length
    }, userId)
  }

  // Real-time Editing
  async applyChanges(documentId: string, changes: DocumentChange): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    // Validate version (simple conflict resolution)
    if (changes.version !== document.version) {
      // Send current document state back to client for resolution
      this.websocketManager.sendToUser(changes.userId, {
        id: `conflict_${Date.now()}`,
        type: 'document_conflict',
        userId: 'system',
        timestamp: Date.now(),
        data: {
          documentId,
          currentVersion: document.version,
          serverContent: document.content
        }
      })
      return false
    }

    // Apply operations to document content
    let newContent = document.content
    const appliedOperations: TextOperation[] = []

    for (const operation of changes.operations) {
      newContent = this.applyOperation(newContent, operation)
      appliedOperations.push(operation)
    }

    // Update document
    document.content = newContent
    document.version += 1
    document.lastModified = new Date()

    // Add to history
    document.history.push({
      version: document.version,
      content: newContent,
      changes: appliedOperations,
      timestamp: new Date(),
      userId: changes.userId
    })

    // Limit history size
    if (document.history.length > 100) {
      document.history = document.history.slice(-50)
    }

    // Broadcast changes to all other collaborators
    this.broadcastToDocument(documentId, {
      type: 'document_changed',
      documentId,
      version: document.version,
      operations: appliedOperations,
      userId: changes.userId,
      timestamp: changes.timestamp
    }, changes.userId)

    return true
  }

  private applyOperation(content: string, operation: TextOperation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position)
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0))
      
      case 'retain':
        return content // No change needed for retain operations
      
      default:
        return content
    }
  }

  // Cursor and Selection Tracking
  async updateCursor(documentId: string, userId: string, cursor: CursorPosition): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) return

    const collaborator = document.collaborators.find(c => c.userId === userId)
    if (collaborator) {
      collaborator.cursor = cursor
      collaborator.lastSeen = new Date()
    }

    // Broadcast cursor update
    this.broadcastToDocument(documentId, {
      type: 'cursor_updated',
      documentId,
      cursor
    }, userId)
  }

  async updateSelection(documentId: string, userId: string, selection: TextSelection): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) return

    const collaborator = document.collaborators.find(c => c.userId === userId)
    if (collaborator) {
      collaborator.selection = selection
      collaborator.lastSeen = new Date()
    }

    // Broadcast selection update
    this.broadcastToDocument(documentId, {
      type: 'selection_updated',
      documentId,
      selection
    }, userId)
  }

  // Permissions Management
  async updatePermissions(
    documentId: string,
    userId: string,
    targetUserId: string,
    role: 'owner' | 'editor' | 'viewer'
  ): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    // Check if user has permission to change roles
    const requestingUser = document.collaborators.find(c => c.userId === userId)
    if (!requestingUser || requestingUser.role !== 'owner') return false

    const targetCollaborator = document.collaborators.find(c => c.userId === targetUserId)
    if (!targetCollaborator) return false

    targetCollaborator.role = role

    // Broadcast permission change
    this.broadcastToDocument(documentId, {
      type: 'permissions_updated',
      documentId,
      userId: targetUserId,
      role
    })

    return true
  }

  // Document History and Versioning
  async getDocumentHistory(documentId: string, limit: number = 20): Promise<DocumentVersion[]> {
    const document = this.documents.get(documentId)
    if (!document) return []

    return document.history.slice(-limit).reverse()
  }

  async revertToVersion(documentId: string, userId: string, version: number): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    // Check permissions
    const collaborator = document.collaborators.find(c => c.userId === userId)
    if (!collaborator || (collaborator.role !== 'owner' && collaborator.role !== 'editor')) {
      return false
    }

    const targetVersion = document.history.find(v => v.version === version)
    if (!targetVersion) return false

    // Revert content
    document.content = targetVersion.content
    document.version += 1
    document.lastModified = new Date()

    // Add revert to history
    document.history.push({
      version: document.version,
      content: targetVersion.content,
      changes: [],
      timestamp: new Date(),
      userId,
      comment: `Reverted to version ${version}`
    })

    // Broadcast revert
    this.broadcastToDocument(documentId, {
      type: 'document_reverted',
      documentId,
      version: document.version,
      content: document.content,
      revertedToVersion: version,
      userId
    })

    return true
  }

  // Utility Methods
  private broadcastToDocument(documentId: string, message: any, excludeUserId?: string): void {
    const subscribers = this.documentSubscriptions.get(documentId)
    if (!subscribers) return

    for (const userId of subscribers) {
      if (userId !== excludeUserId) {
        this.websocketManager.sendToUser(userId, {
          id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: message.type,
          userId: 'collaboration',
          timestamp: Date.now(),
          data: message
        })
      }
    }
  }

  async getActiveCollaborators(documentId: string): Promise<DocumentCollaborator[]> {
    const document = this.documents.get(documentId)
    if (!document) return []

    return document.collaborators.filter(c => c.status === 'active')
  }

  async getDocumentStats(documentId: string): Promise<{
    totalCollaborators: number
    activeCollaborators: number
    totalVersions: number
    documentSize: number
  } | null> {
    const document = this.documents.get(documentId)
    if (!document) return null

    return {
      totalCollaborators: document.collaborators.length,
      activeCollaborators: document.collaborators.filter(c => c.status === 'active').length,
      totalVersions: document.history.length,
      documentSize: document.content.length
    }
  }

  // Cleanup inactive sessions
  async cleanupInactiveSessions(): Promise<void> {
    const now = new Date()
    const inactiveThreshold = 30 * 60 * 1000 // 30 minutes

    for (const [documentId, document] of this.documents) {
      for (const collaborator of document.collaborators) {
        if (collaborator.status === 'active' && 
            now.getTime() - collaborator.lastSeen.getTime() > inactiveThreshold) {
          await this.leaveDocument(documentId, collaborator.userId)
        }
      }
    }
  }
}

// Initialize singleton instance
let collaborativeEditorInstance: CollaborativeEditor | null = null

export function initializeCollaborativeEditor(websocketManager: WebSocketManager): CollaborativeEditor {
  if (!collaborativeEditorInstance) {
    collaborativeEditorInstance = new CollaborativeEditor(websocketManager)
  }
  return collaborativeEditorInstance
}

export function getCollaborativeEditor(): CollaborativeEditor {
  if (!collaborativeEditorInstance) {
    throw new Error('Collaborative editor not initialized. Call initializeCollaborativeEditor first.')
  }
  return collaborativeEditorInstance
}

// Default export for backward compatibility
export const collaborativeEditor = new CollaborativeEditor({} as WebSocketManager)