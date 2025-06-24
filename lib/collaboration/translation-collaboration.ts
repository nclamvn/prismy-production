/**
 * REAL-TIME TRANSLATION COLLABORATION
 * Enables teams to collaborate on translations in real-time
 */

import { WebSocketManager } from '@/lib/websocket/websocket-manager'
import { logger } from '@/lib/logger'

export interface TranslationSession {
  id: string
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  collaborators: TranslationCollaborator[]
  translations: TranslationProposal[]
  activeSection?: TextSection
  status: 'active' | 'completed' | 'paused'
  createdAt: Date
  updatedAt: Date
  metadata: {
    documentId?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    deadline?: Date
    context?: string
    glossary?: string[]
  }
}

export interface TranslationCollaborator {
  userId: string
  userName: string
  email: string
  role: 'lead' | 'translator' | 'reviewer' | 'observer'
  status: 'active' | 'idle' | 'offline'
  workingOn?: TextSection
  contributionStats: {
    proposalsSubmitted: number
    proposalsAccepted: number
    reviewsCompleted: number
    wordsTranslated: number
  }
  joinedAt: Date
  lastActiveAt: Date
  color: string
}

export interface TextSection {
  id: string
  startIndex: number
  endIndex: number
  text: string
  assignedTo?: string
  status: 'pending' | 'in_progress' | 'completed' | 'under_review'
  priority: number
}

export interface TranslationProposal {
  id: string
  sectionId: string
  translatedText: string
  userId: string
  userName: string
  confidence: number
  timestamp: Date
  votes: TranslationVote[]
  comments: TranslationComment[]
  status: 'proposed' | 'accepted' | 'rejected' | 'needs_revision'
  aiAssisted: boolean
  alternatives: string[]
}

export interface TranslationVote {
  userId: string
  userName: string
  type: 'approve' | 'reject' | 'suggest_revision'
  comment?: string
  timestamp: Date
}

export interface TranslationComment {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: Date
  replyTo?: string
}

export interface TranslationProgress {
  sessionId: string
  totalSections: number
  completedSections: number
  pendingSections: number
  inProgressSections: number
  underReviewSections: number
  percentComplete: number
  estimatedTimeRemaining?: number
  collaboratorProgress: Record<string, {
    sectionsAssigned: number
    sectionsCompleted: number
    avgTimePerSection: number
  }>
}

export class TranslationCollaborationEngine {
  private sessions = new Map<string, TranslationSession>()
  private sessionSubscriptions = new Map<string, Set<string>>() // sessionId -> Set of userIds
  private userSessions = new Map<string, Set<string>>() // userId -> Set of sessionIds
  private websocketManager: WebSocketManager

  constructor(websocketManager: WebSocketManager) {
    this.websocketManager = websocketManager
  }

  // Session Management
  async createTranslationSession(
    userId: string,
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    metadata: Partial<TranslationSession['metadata']> = {}
  ): Promise<TranslationSession> {
    const sessionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Split text into manageable sections
    const sections = this.splitTextIntoSections(sourceText)
    
    const session: TranslationSession = {
      id: sessionId,
      sourceText,
      sourceLanguage,
      targetLanguage,
      collaborators: [{
        userId,
        userName: 'Session Creator',
        email: '',
        role: 'lead',
        status: 'active',
        contributionStats: {
          proposalsSubmitted: 0,
          proposalsAccepted: 0,
          reviewsCompleted: 0,
          wordsTranslated: 0
        },
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        color: this.generateUserColor(userId)
      }],
      translations: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        priority: 'medium',
        ...metadata
      }
    }

    this.sessions.set(sessionId, session)
    
    // Initialize sections
    sections.forEach(section => {
      session.translations.push({
        id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sectionId: section.id,
        translatedText: '',
        userId: '',
        userName: '',
        confidence: 0,
        timestamp: new Date(),
        votes: [],
        comments: [],
        status: 'proposed',
        aiAssisted: false,
        alternatives: []
      })
    })

    return session
  }

  private splitTextIntoSections(text: string): TextSection[] {
    const sections: TextSection[] = []
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text]
    let currentIndex = 0
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim()
      if (trimmedSentence) {
        sections.push({
          id: `section_${index}`,
          startIndex: currentIndex,
          endIndex: currentIndex + trimmedSentence.length,
          text: trimmedSentence,
          status: 'pending',
          priority: 1
        })
        currentIndex += trimmedSentence.length + 1
      }
    })

    return sections
  }

  async joinTranslationSession(
    sessionId: string,
    userId: string,
    userName: string,
    email: string,
    role: TranslationCollaborator['role'] = 'translator'
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    // Add or update collaborator
    const existingCollaborator = session.collaborators.find(c => c.userId === userId)
    if (existingCollaborator) {
      existingCollaborator.status = 'active'
      existingCollaborator.lastActiveAt = new Date()
    } else {
      session.collaborators.push({
        userId,
        userName,
        email,
        role,
        status: 'active',
        contributionStats: {
          proposalsSubmitted: 0,
          proposalsAccepted: 0,
          reviewsCompleted: 0,
          wordsTranslated: 0
        },
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        color: this.generateUserColor(userId)
      })
    }

    // Track subscriptions
    if (!this.sessionSubscriptions.has(sessionId)) {
      this.sessionSubscriptions.set(sessionId, new Set())
    }
    this.sessionSubscriptions.get(sessionId)!.add(userId)

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set())
    }
    this.userSessions.get(userId)!.add(sessionId)

    session.updatedAt = new Date()

    // Notify other collaborators
    this.broadcastToSession(sessionId, {
      type: 'collaborator_joined',
      sessionId,
      collaborator: session.collaborators.find(c => c.userId === userId),
      totalCollaborators: session.collaborators.length
    }, userId)

    return true
  }

  async leaveTranslationSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    // Update collaborator status
    const collaborator = session.collaborators.find(c => c.userId === userId)
    if (collaborator) {
      collaborator.status = 'offline'
      collaborator.lastActiveAt = new Date()
      collaborator.workingOn = undefined
    }

    // Remove subscriptions
    this.sessionSubscriptions.get(sessionId)?.delete(userId)
    this.userSessions.get(userId)?.delete(sessionId)

    session.updatedAt = new Date()

    // Notify other collaborators
    this.broadcastToSession(sessionId, {
      type: 'collaborator_left',
      sessionId,
      userId,
      totalCollaborators: session.collaborators.filter(c => c.status === 'active').length
    }, userId)
  }

  // Translation Proposals
  async submitTranslationProposal(
    sessionId: string,
    sectionId: string,
    userId: string,
    translatedText: string,
    confidence: number = 0.8,
    aiAssisted: boolean = false,
    alternatives: string[] = []
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const collaborator = session.collaborators.find(c => c.userId === userId)
    if (!collaborator) return false

    const proposalId = `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const proposal: TranslationProposal = {
      id: proposalId,
      sectionId,
      translatedText,
      userId,
      userName: collaborator.userName,
      confidence,
      timestamp: new Date(),
      votes: [],
      comments: [],
      status: 'proposed',
      aiAssisted,
      alternatives
    }

    // Replace existing proposal for this section by this user or add new
    const existingIndex = session.translations.findIndex(
      t => t.sectionId === sectionId && t.userId === userId
    )
    
    if (existingIndex >= 0) {
      session.translations[existingIndex] = proposal
    } else {
      session.translations.push(proposal)
    }

    // Update collaborator stats
    collaborator.contributionStats.proposalsSubmitted++
    collaborator.contributionStats.wordsTranslated += translatedText.split(' ').length
    collaborator.lastActiveAt = new Date()

    session.updatedAt = new Date()

    // Broadcast proposal to other collaborators
    this.broadcastToSession(sessionId, {
      type: 'translation_proposal',
      sessionId,
      proposal
    }, userId)

    return true
  }

  async voteOnProposal(
    sessionId: string,
    proposalId: string,
    userId: string,
    voteType: TranslationVote['type'],
    comment?: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const collaborator = session.collaborators.find(c => c.userId === userId)
    if (!collaborator) return false

    const proposal = session.translations.find(t => t.id === proposalId)
    if (!proposal) return false

    // Remove existing vote from this user
    proposal.votes = proposal.votes.filter(v => v.userId !== userId)

    // Add new vote
    proposal.votes.push({
      userId,
      userName: collaborator.userName,
      type: voteType,
      comment,
      timestamp: new Date()
    })

    // Auto-accept if enough approvals from qualified users
    const approvals = proposal.votes.filter(v => v.type === 'approve').length
    const qualifiedVoters = session.collaborators.filter(c => 
      ['lead', 'reviewer'].includes(c.role) && c.userId !== proposal.userId
    ).length

    if (approvals >= Math.max(1, Math.ceil(qualifiedVoters / 2))) {
      proposal.status = 'accepted'
      
      // Update original proposer stats
      const originalCollaborator = session.collaborators.find(c => c.userId === proposal.userId)
      if (originalCollaborator) {
        originalCollaborator.contributionStats.proposalsAccepted++
      }
    }

    // Update voter stats
    collaborator.contributionStats.reviewsCompleted++
    collaborator.lastActiveAt = new Date()

    session.updatedAt = new Date()

    // Broadcast vote to other collaborators
    this.broadcastToSession(sessionId, {
      type: 'proposal_vote',
      sessionId,
      proposalId,
      vote: proposal.votes[proposal.votes.length - 1],
      proposalStatus: proposal.status
    })

    return true
  }

  async addComment(
    sessionId: string,
    proposalId: string,
    userId: string,
    content: string,
    replyTo?: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const collaborator = session.collaborators.find(c => c.userId === userId)
    if (!collaborator) return false

    const proposal = session.translations.find(t => t.id === proposalId)
    if (!proposal) return false

    const comment: TranslationComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: collaborator.userName,
      content,
      timestamp: new Date(),
      replyTo
    }

    proposal.comments.push(comment)
    collaborator.lastActiveAt = new Date()
    session.updatedAt = new Date()

    // Broadcast comment to other collaborators
    this.broadcastToSession(sessionId, {
      type: 'proposal_comment',
      sessionId,
      proposalId,
      comment
    })

    return true
  }

  // Section Assignment
  async assignSection(
    sessionId: string,
    sectionId: string,
    assigneeId: string,
    assignerId: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const assigner = session.collaborators.find(c => c.userId === assignerId)
    if (!assigner || !['lead', 'reviewer'].includes(assigner.role)) return false

    const assignee = session.collaborators.find(c => c.userId === assigneeId)
    if (!assignee) return false

    // Update section assignment
    const sections = this.getSectionsFromSession(session)
    const section = sections.find(s => s.id === sectionId)
    if (section) {
      section.assignedTo = assigneeId
      section.status = 'in_progress'
    }

    // Update collaborator working status
    assignee.workingOn = section
    assignee.lastActiveAt = new Date()
    session.updatedAt = new Date()

    // Broadcast assignment
    this.broadcastToSession(sessionId, {
      type: 'section_assigned',
      sessionId,
      sectionId,
      assigneeId,
      assigneeName: assignee.userName
    })

    return true
  }

  // Progress Tracking
  async getSessionProgress(sessionId: string): Promise<TranslationProgress | null> {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const sections = this.getSectionsFromSession(session)
    const totalSections = sections.length
    const completedSections = sections.filter(s => s.status === 'completed').length
    const pendingSections = sections.filter(s => s.status === 'pending').length
    const inProgressSections = sections.filter(s => s.status === 'in_progress').length
    const underReviewSections = sections.filter(s => s.status === 'under_review').length

    const collaboratorProgress: Record<string, any> = {}
    session.collaborators.forEach(collaborator => {
      const assignedSections = sections.filter(s => s.assignedTo === collaborator.userId)
      const completedByUser = assignedSections.filter(s => s.status === 'completed')
      
      collaboratorProgress[collaborator.userId] = {
        sectionsAssigned: assignedSections.length,
        sectionsCompleted: completedByUser.length,
        avgTimePerSection: this.calculateAvgTimePerSection(collaborator.userId, sessionId)
      }
    })

    return {
      sessionId,
      totalSections,
      completedSections,
      pendingSections,
      inProgressSections,
      underReviewSections,
      percentComplete: totalSections > 0 ? (completedSections / totalSections) * 100 : 0,
      estimatedTimeRemaining: this.estimateTimeRemaining(session),
      collaboratorProgress
    }
  }

  // Utility Methods
  private getSectionsFromSession(session: TranslationSession): TextSection[] {
    // Extract sections from translation proposals
    const sections: TextSection[] = []
    const sentences = session.sourceText.match(/[^\.!?]+[\.!?]+/g) || [session.sourceText]
    let currentIndex = 0
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim()
      if (trimmedSentence) {
        const proposal = session.translations.find(t => t.sectionId === `section_${index}`)
        sections.push({
          id: `section_${index}`,
          startIndex: currentIndex,
          endIndex: currentIndex + trimmedSentence.length,
          text: trimmedSentence,
          status: proposal?.status === 'accepted' ? 'completed' : 'pending',
          priority: 1,
          assignedTo: session.collaborators.find(c => c.workingOn?.id === `section_${index}`)?.userId
        })
        currentIndex += trimmedSentence.length + 1
      }
    })

    return sections
  }

  private generateUserColor(userId: string): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
    ]
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  private calculateAvgTimePerSection(userId: string, sessionId: string): number {
    // Simplified calculation - in production, track actual time spent
    return 300 // 5 minutes average
  }

  private estimateTimeRemaining(session: TranslationSession): number {
    const sections = this.getSectionsFromSession(session)
    const remainingSections = sections.filter(s => s.status !== 'completed').length
    const activeCollaborators = session.collaborators.filter(c => c.status === 'active').length
    const avgTimePerSection = 300 // 5 minutes

    return activeCollaborators > 0 
      ? (remainingSections * avgTimePerSection) / activeCollaborators
      : remainingSections * avgTimePerSection
  }

  private broadcastToSession(sessionId: string, message: any, excludeUserId?: string): void {
    const subscribers = this.sessionSubscriptions.get(sessionId)
    if (!subscribers) return

    for (const userId of subscribers) {
      if (userId !== excludeUserId) {
        this.websocketManager.sendToUser(userId, {
          id: `translation_collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: message.type,
          userId: 'translation_system',
          timestamp: Date.now(),
          data: message
        })
      }
    }
  }

  // Public API
  async getSession(sessionId: string): Promise<TranslationSession | null> {
    return this.sessions.get(sessionId) || null
  }

  async getActiveSessionsForUser(userId: string): Promise<TranslationSession[]> {
    const userSessionIds = this.userSessions.get(userId) || new Set()
    const sessions: TranslationSession[] = []
    
    for (const sessionId of userSessionIds) {
      const session = this.sessions.get(sessionId)
      if (session && session.status === 'active') {
        sessions.push(session)
      }
    }
    
    return sessions
  }

  async getSessionStats(sessionId: string): Promise<{
    totalCollaborators: number
    activeCollaborators: number
    totalProposals: number
    acceptedProposals: number
    pendingReviews: number
  } | null> {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    return {
      totalCollaborators: session.collaborators.length,
      activeCollaborators: session.collaborators.filter(c => c.status === 'active').length,
      totalProposals: session.translations.length,
      acceptedProposals: session.translations.filter(t => t.status === 'accepted').length,
      pendingReviews: session.translations.filter(t => t.status === 'proposed').length
    }
  }
}

// Export singleton instance
export const translationCollaborationEngine = new TranslationCollaborationEngine(
  {} as WebSocketManager
)