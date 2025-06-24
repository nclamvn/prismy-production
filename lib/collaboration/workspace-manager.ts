/**
 * SHARED WORKSPACE MANAGER
 * Manages collaborative workspaces with real-time updates
 */

import { WebSocketManager } from '@/lib/websocket/websocket-manager'
import { logger } from '@/lib/logger'

export interface SharedWorkspace {
  id: string
  name: string
  description: string
  type: 'translation' | 'document_processing' | 'general'
  ownerId: string
  members: WorkspaceMember[]
  documents: WorkspaceDocument[]
  activities: WorkspaceActivity[]
  settings: WorkspaceSettings
  permissions: WorkspacePermissions
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'archived' | 'suspended'
}

export interface WorkspaceMember {
  userId: string
  userName: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  permissions: MemberPermissions
  joinedAt: Date
  lastActiveAt: Date
  status: 'active' | 'idle' | 'offline'
  currentActivity?: {
    type: 'editing' | 'translating' | 'reviewing' | 'commenting'
    documentId: string
    location: string
  }
  color: string
  invitedBy?: string
}

export interface WorkspaceDocument {
  id: string
  name: string
  type: 'text' | 'translation' | 'collaborative_doc' | 'uploaded_file'
  content?: string
  metadata: {
    language?: string
    targetLanguage?: string
    fileType?: string
    fileSize?: number
    tags: string[]
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
  version: number
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
  assignedTo?: string[]
  sharedWith: string[]
  comments: DocumentComment[]
  versions: DocumentVersion[]
}

export interface DocumentComment {
  id: string
  userId: string
  userName: string
  content: string
  position?: {
    line: number
    column: number
    selection?: { start: number; end: number }
  }
  timestamp: Date
  resolved: boolean
  replies: DocumentComment[]
}

export interface DocumentVersion {
  version: number
  content: string
  changes: string
  createdBy: string
  createdAt: Date
  comment?: string
}

export interface WorkspaceActivity {
  id: string
  type: 'document_created' | 'document_updated' | 'member_joined' | 'member_left' | 
        'comment_added' | 'task_assigned' | 'workspace_settings_updated'
  userId: string
  userName: string
  description: string
  metadata: Record<string, any>
  timestamp: Date
}

export interface WorkspaceSettings {
  visibility: 'private' | 'team' | 'organization' | 'public'
  allowInvites: boolean
  autoSave: boolean
  saveInterval: number
  versionControl: boolean
  maxMembers: number
  allowGuests: boolean
  defaultRole: 'editor' | 'viewer'
  integrations: {
    slack?: { webhookUrl: string; enabled: boolean }
    teams?: { webhookUrl: string; enabled: boolean }
    email?: { notifications: boolean; digest: boolean }
  }
}

export interface WorkspacePermissions {
  canCreateDocuments: string[]
  canDeleteDocuments: string[]
  canInviteMembers: string[]
  canManageSettings: string[]
  canExportData: string[]
  canArchiveWorkspace: string[]
}

export interface MemberPermissions {
  canEdit: boolean
  canComment: boolean
  canShare: boolean
  canInvite: boolean
  canManageMembers: boolean
  canDeleteDocuments: boolean
  canManageSettings: boolean
}

export interface WorkspaceInvitation {
  id: string
  workspaceId: string
  workspaceName: string
  inviterUserId: string
  inviterName: string
  inviteeEmail: string
  role: WorkspaceMember['role']
  token: string
  expiresAt: Date
  createdAt: Date
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}

export class WorkspaceManager {
  private workspaces = new Map<string, SharedWorkspace>()
  private workspaceSubscriptions = new Map<string, Set<string>>() // workspaceId -> Set of userIds
  private userWorkspaces = new Map<string, Set<string>>() // userId -> Set of workspaceIds
  private invitations = new Map<string, WorkspaceInvitation>()
  private websocketManager: WebSocketManager

  constructor(websocketManager: WebSocketManager) {
    this.websocketManager = websocketManager
  }

  // Workspace Management
  async createWorkspace(
    userId: string,
    name: string,
    description: string,
    type: SharedWorkspace['type'] = 'general',
    settings: Partial<WorkspaceSettings> = {}
  ): Promise<SharedWorkspace> {
    const workspaceId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const workspace: SharedWorkspace = {
      id: workspaceId,
      name,
      description,
      type,
      ownerId: userId,
      members: [{
        userId,
        userName: 'Workspace Owner',
        email: '',
        role: 'owner',
        permissions: {
          canEdit: true,
          canComment: true,
          canShare: true,
          canInvite: true,
          canManageMembers: true,
          canDeleteDocuments: true,
          canManageSettings: true
        },
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        status: 'active',
        color: this.generateUserColor(userId)
      }],
      documents: [],
      activities: [{
        id: `activity_${Date.now()}`,
        type: 'workspace_settings_updated',
        userId,
        userName: 'Workspace Owner',
        description: 'Workspace created',
        metadata: { action: 'created' },
        timestamp: new Date()
      }],
      settings: {
        visibility: 'private',
        allowInvites: true,
        autoSave: true,
        saveInterval: 30000,
        versionControl: true,
        maxMembers: 50,
        allowGuests: false,
        defaultRole: 'editor',
        integrations: {},
        ...settings
      },
      permissions: {
        canCreateDocuments: ['owner', 'admin', 'editor'],
        canDeleteDocuments: ['owner', 'admin'],
        canInviteMembers: ['owner', 'admin'],
        canManageSettings: ['owner'],
        canExportData: ['owner', 'admin', 'editor'],
        canArchiveWorkspace: ['owner']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    }

    this.workspaces.set(workspaceId, workspace)
    
    // Track user workspace membership
    if (!this.userWorkspaces.has(userId)) {
      this.userWorkspaces.set(userId, new Set())
    }
    this.userWorkspaces.get(userId)!.add(workspaceId)

    return workspace
  }

  async joinWorkspace(
    workspaceId: string,
    userId: string,
    userName: string,
    email: string,
    role: WorkspaceMember['role'] = 'editor'
  ): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return false

    // Check if user is already a member
    const existingMember = workspace.members.find(m => m.userId === userId)
    if (existingMember) {
      existingMember.status = 'active'
      existingMember.lastActiveAt = new Date()
    } else {
      // Check member limit
      if (workspace.members.length >= workspace.settings.maxMembers) {
        return false
      }

      const permissions = this.getRolePermissions(role)
      workspace.members.push({
        userId,
        userName,
        email,
        role,
        permissions,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        status: 'active',
        color: this.generateUserColor(userId)
      })

      // Add activity
      workspace.activities.push({
        id: `activity_${Date.now()}`,
        type: 'member_joined',
        userId,
        userName,
        description: `${userName} joined the workspace`,
        metadata: { role },
        timestamp: new Date()
      })
    }

    // Track subscriptions
    if (!this.workspaceSubscriptions.has(workspaceId)) {
      this.workspaceSubscriptions.set(workspaceId, new Set())
    }
    this.workspaceSubscriptions.get(workspaceId)!.add(userId)

    if (!this.userWorkspaces.has(userId)) {
      this.userWorkspaces.set(userId, new Set())
    }
    this.userWorkspaces.get(userId)!.add(workspaceId)

    workspace.updatedAt = new Date()

    // Notify other members
    this.broadcastToWorkspace(workspaceId, {
      type: 'member_joined',
      workspaceId,
      member: workspace.members.find(m => m.userId === userId),
      totalMembers: workspace.members.length
    }, userId)

    return true
  }

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return

    // Update member status
    const member = workspace.members.find(m => m.userId === userId)
    if (member) {
      if (member.role === 'owner') {
        // Transfer ownership to next admin or remove workspace
        const nextAdmin = workspace.members.find(m => m.role === 'admin')
        if (nextAdmin) {
          nextAdmin.role = 'owner'
          nextAdmin.permissions = this.getRolePermissions('owner')
        } else {
          // Archive workspace if no suitable successor
          workspace.status = 'archived'
        }
      }

      member.status = 'offline'
      member.lastActiveAt = new Date()
      member.currentActivity = undefined

      // Add activity
      workspace.activities.push({
        id: `activity_${Date.now()}`,
        type: 'member_left',
        userId,
        userName: member.userName,
        description: `${member.userName} left the workspace`,
        metadata: {},
        timestamp: new Date()
      })
    }

    // Remove subscriptions
    this.workspaceSubscriptions.get(workspaceId)?.delete(userId)
    this.userWorkspaces.get(userId)?.delete(workspaceId)

    workspace.updatedAt = new Date()

    // Notify other members
    this.broadcastToWorkspace(workspaceId, {
      type: 'member_left',
      workspaceId,
      userId,
      totalMembers: workspace.members.filter(m => m.status === 'active').length
    }, userId)
  }

  // Document Management
  async createDocument(
    workspaceId: string,
    userId: string,
    name: string,
    type: WorkspaceDocument['type'],
    content: string = '',
    metadata: Partial<WorkspaceDocument['metadata']> = {}
  ): Promise<WorkspaceDocument | null> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return null

    const member = workspace.members.find(m => m.userId === userId)
    if (!member || !member.permissions.canEdit) return null

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const document: WorkspaceDocument = {
      id: documentId,
      name,
      type,
      content,
      metadata: {
        tags: [],
        priority: 'medium',
        ...metadata
      },
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      status: 'draft',
      sharedWith: [userId],
      comments: [],
      versions: [{
        version: 1,
        content,
        changes: 'Initial version',
        createdBy: userId,
        createdAt: new Date(),
        comment: 'Document created'
      }]
    }

    workspace.documents.push(document)

    // Add activity
    workspace.activities.push({
      id: `activity_${Date.now()}`,
      type: 'document_created',
      userId,
      userName: member.userName,
      description: `Created document "${name}"`,
      metadata: { documentId, documentType: type },
      timestamp: new Date()
    })

    workspace.updatedAt = new Date()

    // Broadcast document creation
    this.broadcastToWorkspace(workspaceId, {
      type: 'document_created',
      workspaceId,
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        status: document.status,
        createdBy: document.createdBy,
        createdAt: document.createdAt
      }
    })

    return document
  }

  async updateDocument(
    workspaceId: string,
    documentId: string,
    userId: string,
    updates: Partial<Pick<WorkspaceDocument, 'content' | 'name' | 'status' | 'metadata'>>
  ): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return false

    const document = workspace.documents.find(d => d.id === documentId)
    if (!document) return false

    const member = workspace.members.find(m => m.userId === userId)
    if (!member || !member.permissions.canEdit) return false

    const oldContent = document.content

    // Apply updates
    if (updates.content !== undefined) document.content = updates.content
    if (updates.name !== undefined) document.name = updates.name
    if (updates.status !== undefined) document.status = updates.status
    if (updates.metadata !== undefined) {
      document.metadata = { ...document.metadata, ...updates.metadata }
    }

    // Create version if content changed
    if (updates.content !== undefined && updates.content !== oldContent) {
      document.version += 1
      document.versions.push({
        version: document.version,
        content: updates.content,
        changes: this.calculateChanges(oldContent, updates.content),
        createdBy: userId,
        createdAt: new Date()
      })

      // Limit version history
      if (document.versions.length > 50) {
        document.versions = document.versions.slice(-25)
      }
    }

    document.updatedAt = new Date()

    // Add activity
    workspace.activities.push({
      id: `activity_${Date.now()}`,
      type: 'document_updated',
      userId,
      userName: member.userName,
      description: `Updated document "${document.name}"`,
      metadata: { documentId, changes: Object.keys(updates) },
      timestamp: new Date()
    })

    workspace.updatedAt = new Date()

    // Broadcast document update
    this.broadcastToWorkspace(workspaceId, {
      type: 'document_updated',
      workspaceId,
      documentId,
      updates,
      version: document.version,
      updatedBy: userId
    }, userId)

    return true
  }

  // Member Activity Tracking
  async updateMemberActivity(
    workspaceId: string,
    userId: string,
    activity: WorkspaceMember['currentActivity']
  ): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return

    const member = workspace.members.find(m => m.userId === userId)
    if (!member) return

    member.currentActivity = activity
    member.lastActiveAt = new Date()
    member.status = 'active'

    // Broadcast activity update
    this.broadcastToWorkspace(workspaceId, {
      type: 'member_activity_updated',
      workspaceId,
      userId,
      activity
    }, userId)
  }

  // Invitations
  async createInvitation(
    workspaceId: string,
    inviterUserId: string,
    inviteeEmail: string,
    role: WorkspaceMember['role'] = 'editor'
  ): Promise<WorkspaceInvitation | null> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return null

    const inviter = workspace.members.find(m => m.userId === inviterUserId)
    if (!inviter || !inviter.permissions.canInvite) return null

    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const token = Math.random().toString(36).substr(2, 32)
    
    const invitation: WorkspaceInvitation = {
      id: invitationId,
      workspaceId,
      workspaceName: workspace.name,
      inviterUserId,
      inviterName: inviter.userName,
      inviteeEmail,
      role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      status: 'pending'
    }

    this.invitations.set(invitationId, invitation)

    return invitation
  }

  async acceptInvitation(token: string, userId: string, userName: string, email: string): Promise<boolean> {
    const invitation = Array.from(this.invitations.values()).find(inv => inv.token === token)
    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return false
    }

    const success = await this.joinWorkspace(
      invitation.workspaceId,
      userId,
      userName,
      email,
      invitation.role
    )

    if (success) {
      invitation.status = 'accepted'
    }

    return success
  }

  // Utility Methods
  private getRolePermissions(role: WorkspaceMember['role']): MemberPermissions {
    switch (role) {
      case 'owner':
        return {
          canEdit: true,
          canComment: true,
          canShare: true,
          canInvite: true,
          canManageMembers: true,
          canDeleteDocuments: true,
          canManageSettings: true
        }
      case 'admin':
        return {
          canEdit: true,
          canComment: true,
          canShare: true,
          canInvite: true,
          canManageMembers: true,
          canDeleteDocuments: true,
          canManageSettings: false
        }
      case 'editor':
        return {
          canEdit: true,
          canComment: true,
          canShare: true,
          canInvite: false,
          canManageMembers: false,
          canDeleteDocuments: false,
          canManageSettings: false
        }
      case 'viewer':
        return {
          canEdit: false,
          canComment: true,
          canShare: false,
          canInvite: false,
          canManageMembers: false,
          canDeleteDocuments: false,
          canManageSettings: false
        }
    }
  }

  private generateUserColor(userId: string): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
    ]
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  private calculateChanges(oldContent: string, newContent: string): string {
    // Simple change detection - in production, use a proper diff algorithm
    const oldLines = oldContent.split('\n').length
    const newLines = newContent.split('\n').length
    
    if (newLines > oldLines) {
      return `Added ${newLines - oldLines} lines`
    } else if (newLines < oldLines) {
      return `Removed ${oldLines - newLines} lines`
    } else {
      return 'Content modified'
    }
  }

  private broadcastToWorkspace(workspaceId: string, message: any, excludeUserId?: string): void {
    const subscribers = this.workspaceSubscriptions.get(workspaceId)
    if (!subscribers) return

    for (const userId of subscribers) {
      if (userId !== excludeUserId) {
        this.websocketManager.sendToUser(userId, {
          id: `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: message.type,
          userId: 'workspace_system',
          timestamp: Date.now(),
          data: message
        })
      }
    }
  }

  // Public API
  async getWorkspace(workspaceId: string): Promise<SharedWorkspace | null> {
    return this.workspaces.get(workspaceId) || null
  }

  async getUserWorkspaces(userId: string): Promise<SharedWorkspace[]> {
    const userWorkspaceIds = this.userWorkspaces.get(userId) || new Set()
    const workspaces: SharedWorkspace[] = []
    
    for (const workspaceId of userWorkspaceIds) {
      const workspace = this.workspaces.get(workspaceId)
      if (workspace && workspace.status === 'active') {
        workspaces.push(workspace)
      }
    }
    
    return workspaces
  }

  async getWorkspaceStats(workspaceId: string): Promise<{
    totalMembers: number
    activeMembers: number
    totalDocuments: number
    recentActivities: number
  } | null> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return null

    const recentActivities = workspace.activities.filter(
      a => a.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length

    return {
      totalMembers: workspace.members.length,
      activeMembers: workspace.members.filter(m => m.status === 'active').length,
      totalDocuments: workspace.documents.length,
      recentActivities
    }
  }
}

// Export singleton instance
export const workspaceManager = new WorkspaceManager({} as WebSocketManager)