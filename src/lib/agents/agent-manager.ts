// Agent Manager - Orchestrates the Document Agent Ecosystem
// Enables swarm intelligence and multi-agent collaboration

import { DocumentAgent, DocumentAgentFactory, AgentPersonality, AgentAction } from './document-agent'
import { logger } from '@/lib/logger'
import { analytics } from '../analytics'
import { EventEmitter } from 'events'

export interface AgentSwarmConfig {
  maxActiveAgents: number
  collaborationEnabled: boolean
  learningMode: 'individual' | 'collective' | 'hybrid'
  autonomyThreshold: number
  notificationSettings: {
    urgentOnly: boolean
    batchNotifications: boolean
    quietHours: { start: string; end: string }
  }
}

export interface SwarmIntelligence {
  totalAgents: number
  activeAgents: number
  collaborations: number
  collectiveLearning: {
    sharedPatterns: number
    crossAgentInsights: number
    swarmKnowledge: any[]
  }
  emergentBehaviors: string[]
}

export interface AgentCollaboration {
  id: string
  participants: string[]
  task: any
  status: 'proposed' | 'active' | 'completed' | 'failed'
  startTime: Date
  completionTime?: Date
  outcome?: any
}

export interface AgentNotification {
  id: string
  fromAgent: string
  type: 'urgent' | 'info' | 'collaboration' | 'insight'
  title: string
  message: string
  payload?: any
  timestamp: Date
  read: boolean
}

export class DocumentAgentManager extends EventEmitter {
  private agents: Map<string, DocumentAgent> = new Map()
  private agentsByDocument: Map<string, string> = new Map() // documentId -> agentId
  private agentsByPersonality: Map<AgentPersonality, string[]> = new Map()
  private activeCollaborations: Map<string, AgentCollaboration> = new Map()
  private notifications: AgentNotification[] = []
  private swarmKnowledge: any[] = []
  private config: AgentSwarmConfig
  private userId: string

  constructor(userId: string, config?: Partial<AgentSwarmConfig>) {
    super()
    this.userId = userId
    this.config = {
      maxActiveAgents: 50,
      collaborationEnabled: true,
      learningMode: 'hybrid',
      autonomyThreshold: 0.6,
      notificationSettings: {
        urgentOnly: false,
        batchNotifications: true,
        quietHours: { start: '22:00', end: '08:00' }
      },
      ...config
    }

    this.initializeManager()
    
    logger.info({
      userId: this.userId,
      config: this.config
    }, 'Agent Manager initialized')
  }

  // Agent Lifecycle Management
  public async createAgentForDocument(
    documentId: string,
    documentIntelligence: any,
    userPreferences?: any
  ): Promise<DocumentAgent> {
    // Check if agent already exists for this document
    if (this.agentsByDocument.has(documentId)) {
      const existingAgentId = this.agentsByDocument.get(documentId)!
      return this.agents.get(existingAgentId)!
    }

    // Check agent limits
    if (this.agents.size >= this.config.maxActiveAgents) {
      await this.retireOldestAgent()
    }

    // Create new agent
    const agent = DocumentAgentFactory.createAgent(documentId, documentIntelligence, userPreferences)
    
    // Register agent
    this.registerAgent(agent)
    
    // Setup agent event handlers
    this.setupAgentEventHandlers(agent)
    
    // Introduce agent to the swarm
    await this.introduceAgentToSwarm(agent)
    
    logger.info({
      documentId,
      agentId: agent.agentId,
      personality: agent.personality
    }, 'Agent created for document')
    
    return agent
  }

  public async removeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) return

    // Notify collaborating agents
    await this.notifyAgentRemoval(agentId)
    
    // Remove from all maps
    this.agents.delete(agentId)
    this.agentsByDocument.delete(agent.documentId)
    
    const personalityAgents = this.agentsByPersonality.get(agent.personality) || []
    this.agentsByPersonality.set(
      agent.personality,
      personalityAgents.filter(id => id !== agentId)
    )
    
    // Destroy agent
    agent.destroy()
    
    this.emit('agent:removed', { agentId, documentId: agent.documentId })
  }

  // Swarm Intelligence Coordination
  public async facilitateCollaboration(
    initiatorAgentId: string,
    task: any,
    targetPersonalities?: AgentPersonality[]
  ): Promise<string> {
    const initiator = this.agents.get(initiatorAgentId)
    if (!initiator) throw new Error('Initiator agent not found')

    // Find suitable collaborators
    const collaborators = await this.findCollaborators(initiator, task, targetPersonalities)
    
    if (collaborators.length === 0) {
      logger.warn({ initiatorAgentId, task }, 'No suitable collaborators found')
      return ''
    }

    // Create collaboration
    const collaboration: AgentCollaboration = {
      id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: [initiatorAgentId, ...collaborators.map(c => c.agentId)],
      task,
      status: 'proposed',
      startTime: new Date()
    }

    this.activeCollaborations.set(collaboration.id, collaboration)

    // Notify participants
    for (const collaborator of collaborators) {
      await this.proposeCollaboration(collaboration, collaborator)
    }

    analytics.track('agent_collaboration_initiated', {
      collaborationId: collaboration.id,
      participants: collaboration.participants,
      taskType: task.type
    })

    return collaboration.id
  }

  public async processSwarmLearning(): Promise<void> {
    if (this.config.learningMode === 'individual') return

    try {
      // Collect insights from all agents
      const agentInsights = await this.collectAgentInsights()
      
      // Extract cross-agent patterns
      const patterns = await this.extractSwarmPatterns(agentInsights)
      
      // Distribute learned patterns back to agents
      if (this.config.learningMode === 'collective' || this.config.learningMode === 'hybrid') {
        await this.distributeSwarmKnowledge(patterns)
      }
      
      // Update swarm knowledge base
      this.swarmKnowledge.push(...patterns)
      
      // Identify emergent behaviors
      const emergentBehaviors = await this.identifyEmergentBehaviors()
      
      this.emit('swarm:learning_update', {
        patterns: patterns.length,
        emergentBehaviors,
        totalKnowledge: this.swarmKnowledge.length
      })
      
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Swarm learning process failed')
    }
  }

  // Notification Management
  public async sendNotificationToUser(notification: Omit<AgentNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    // Check quiet hours
    if (this.isQuietHours() && notification.type !== 'urgent') {
      return // Queue for later
    }

    const fullNotification: AgentNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...notification
    }

    this.notifications.push(fullNotification)

    // Emit to real-time UI
    this.emit('notification:new', fullNotification)

    analytics.track('agent_notification_sent', {
      fromAgent: notification.fromAgent,
      type: notification.type,
      userId: this.userId
    })
  }

  public getNotifications(unreadOnly: boolean = false): AgentNotification[] {
    const notifications = unreadOnly 
      ? this.notifications.filter(n => !n.read)
      : this.notifications

    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  public markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  // Agent Query Interface
  public getAgentByDocument(documentId: string): DocumentAgent | undefined {
    const agentId = this.agentsByDocument.get(documentId)
    return agentId ? this.agents.get(agentId) : undefined
  }

  public getAgentsByPersonality(personality: AgentPersonality): DocumentAgent[] {
    const agentIds = this.agentsByPersonality.get(personality) || []
    return agentIds.map(id => this.agents.get(id)!).filter(Boolean)
  }

  public async getSwarmIntelligence(): Promise<SwarmIntelligence> {
    const agents = Array.from(this.agents.values())
    const activeAgents = agents.filter(a => a.state === 'active')
    
    const emergentBehaviors = await this.identifyEmergentBehaviors()
    
    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      collaborations: this.activeCollaborations.size,
      collectiveLearning: {
        sharedPatterns: this.swarmKnowledge.length,
        crossAgentInsights: await this.countCrossAgentInsights(),
        swarmKnowledge: this.swarmKnowledge.slice(-10) // Last 10 patterns
      },
      emergentBehaviors
    }
  }

  public async querySwarm(query: string): Promise<any> {
    // Query all agents and aggregate responses
    const responses = await Promise.all(
      Array.from(this.agents.values()).map(async agent => {
        try {
          return await agent.sendInstruction(`Help answer this query: ${query}`, this.userId)
        } catch (error) {
          return null
        }
      })
    )

    const validResponses = responses.filter(Boolean)
    
    // Synthesize swarm response
    return {
      query,
      agentResponses: validResponses.length,
      synthesis: await this.synthesizeSwarmResponse(validResponses),
      timestamp: new Date()
    }
  }

  // Agent Management Helpers
  private registerAgent(agent: DocumentAgent): void {
    this.agents.set(agent.agentId, agent)
    this.agentsByDocument.set(agent.documentId, agent.agentId)
    
    // Add to personality mapping
    const personalityAgents = this.agentsByPersonality.get(agent.personality) || []
    personalityAgents.push(agent.agentId)
    this.agentsByPersonality.set(agent.personality, personalityAgents)
  }

  private setupAgentEventHandlers(agent: DocumentAgent): void {
    // Handle urgent notifications
    agent.on('agent:urgent_goal', async (data) => {
      await this.sendNotificationToUser({
        fromAgent: data.agentId,
        type: 'urgent',
        title: 'Urgent Goal Detected',
        message: `Agent ${agent.personality} has detected an urgent goal: ${data.goal.description}`,
        payload: data
      })
    })

    // Handle general notifications
    agent.on('agent:notification', async (data) => {
      await this.sendNotificationToUser({
        fromAgent: data.agentId,
        type: 'info',
        title: 'Agent Insight',
        message: `Agent has new insights to share`,
        payload: data.payload
      })
    })

    // Handle collaboration requests
    agent.on('agent:collaboration_request', async (data) => {
      await this.facilitateCollaboration(data.agentId, data.task)
    })
  }

  private async introduceAgentToSwarm(newAgent: DocumentAgent): Promise<void> {
    if (!this.config.collaborationEnabled) return

    // Notify existing agents of the same personality
    const samePersonalityAgents = this.getAgentsByPersonality(newAgent.personality)
    
    for (const agent of samePersonalityAgents) {
      if (agent.agentId !== newAgent.agentId) {
        // Introduce agents to each other
        await agent.collaborateWith(newAgent.agentId, { type: 'introduction' })
      }
    }
  }

  private async retireOldestAgent(): Promise<void> {
    const agents = Array.from(this.agents.values())
    if (agents.length === 0) return

    // Find agent to retire (just pick the first one for simplicity)
    const oldestAgent = agents[0]

    await this.removeAgent(oldestAgent.agentId)
    
    logger.info({
      retiredAgentId: oldestAgent.agentId,
      totalAgents: this.agents.size
    }, 'Retired oldest agent due to limit')
  }

  private async findCollaborators(
    initiator: DocumentAgent,
    task: any,
    targetPersonalities?: AgentPersonality[]
  ): Promise<DocumentAgent[]> {
    const collaborators: DocumentAgent[] = []
    
    // Find agents by personality if specified
    if (targetPersonalities) {
      for (const personality of targetPersonalities) {
        const agents = this.getAgentsByPersonality(personality)
        collaborators.push(...agents.filter(a => a.agentId !== initiator.agentId))
      }
    } else {
      // Find complementary personalities
      const complementary = this.getComplementaryPersonalities(initiator.personality)
      for (const personality of complementary) {
        const agents = this.getAgentsByPersonality(personality)
        collaborators.push(...agents.slice(0, 2)) // Limit to 2 per personality
      }
    }
    
    return collaborators.slice(0, 5) // Limit total collaborators
  }

  private getComplementaryPersonalities(personality: AgentPersonality): AgentPersonality[] {
    const complements: Record<AgentPersonality, AgentPersonality[]> = {
      legal: ['financial', 'project'],
      financial: ['legal', 'project'],
      project: ['legal', 'financial', 'research'],
      research: ['project', 'general'],
      general: ['legal', 'financial', 'project', 'research']
    }
    
    return complements[personality] || []
  }

  private async proposeCollaboration(collaboration: AgentCollaboration, agent: DocumentAgent): Promise<void> {
    // For now, auto-accept collaborations
    // In the future, agents could evaluate and decide
    collaboration.status = 'active'
  }

  private async collectAgentInsights(): Promise<any[]> {
    const insights = []
    
    for (const agent of this.agents.values()) {
      try {
        const status = await agent.getAgentStatus()
        insights.push({
          agentId: agent.agentId,
          personality: agent.personality,
          status,
          // Add memory patterns, goals, etc.
        })
      } catch (error) {
        logger.warn({ error, agentId: agent.agentId }, 'Failed to collect agent insights')
      }
    }
    
    return insights
  }

  private async extractSwarmPatterns(insights: any[]): Promise<any[]> {
    // Analyze cross-agent patterns
    const patterns = []
    
    // Group by personality
    const personalityGroups = insights.reduce((groups, insight) => {
      const key = insight.personality
      if (!groups[key]) groups[key] = []
      groups[key].push(insight)
      return groups
    }, {} as Record<string, any[]>)
    
    // Extract patterns within and across personalities
    for (const [personality, agentInsights] of Object.entries(personalityGroups)) {
      if ((agentInsights as any[]).length > 1) {
        patterns.push({
          type: `${personality}_collective_behavior`,
          pattern: `Common behaviors observed across ${(agentInsights as any[]).length} ${personality} agents`,
          confidence: 0.7,
          timestamp: new Date()
        })
      }
    }
    
    return patterns
  }

  private async distributeSwarmKnowledge(patterns: any[]): Promise<void> {
    // Share learned patterns with all agents
    for (const agent of this.agents.values()) {
      // Agents would incorporate relevant patterns into their own learning
      // Implementation depends on agent's learning mechanism
    }
  }

  private async identifyEmergentBehaviors(): Promise<string[]> {
    const behaviors = []
    
    // Analyze collaboration patterns
    if (this.activeCollaborations.size > this.agents.size * 0.3) {
      behaviors.push('high_collaboration_tendency')
    }
    
    // Analyze notification patterns
    const recentNotifications = this.notifications.filter(
      n => Date.now() - n.timestamp.getTime() < 24 * 60 * 60 * 1000
    )
    
    if (recentNotifications.length > this.agents.size * 2) {
      behaviors.push('high_activity_emergence')
    }
    
    return behaviors
  }

  private async countCrossAgentInsights(): Promise<number> {
    // Count insights that involve multiple agents
    return this.activeCollaborations.size + this.swarmKnowledge.length
  }

  private async synthesizeSwarmResponse(responses: any[]): Promise<string> {
    // Simple synthesis for now - in practice, would use AI to combine responses
    const responseTexts = responses.map(r => r.response).filter(Boolean)
    
    if (responseTexts.length === 0) {
      return "No agents were able to provide insights for this query."
    }
    
    return `Based on input from ${responseTexts.length} agent(s): ${responseTexts.join('; ')}`
  }

  private isQuietHours(): boolean {
    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    
    const startTime = parseInt(this.config.notificationSettings.quietHours.start.replace(':', ''))
    const endTime = parseInt(this.config.notificationSettings.quietHours.end.replace(':', ''))
    
    if (startTime > endTime) {
      // Crosses midnight
      return currentTime >= startTime || currentTime <= endTime
    } else {
      return currentTime >= startTime && currentTime <= endTime
    }
  }

  private async notifyAgentRemoval(agentId: string): Promise<void> {
    // Notify other agents that this agent is being removed
    for (const agent of this.agents.values()) {
      if (agent.agentId !== agentId) {
        // Remove from collaboration networks (commented out for build compatibility)
        // agent.collaborationNetwork?.delete(agentId)
      }
    }
  }

  private initializeManager(): void {
    // Start swarm learning process
    if (this.config.learningMode !== 'individual') {
      setInterval(() => {
        this.processSwarmLearning()
      }, 5 * 60 * 1000) // Every 5 minutes
    }
    
    // Cleanup old notifications
    setInterval(() => {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days
      this.notifications = this.notifications.filter(n => n.timestamp.getTime() > cutoff)
    }, 60 * 60 * 1000) // Every hour
  }

  // Public interface for external systems
  public async destroy(): Promise<void> {
    // Destroy all agents
    for (const agent of this.agents.values()) {
      agent.destroy()
    }
    
    this.agents.clear()
    this.agentsByDocument.clear()
    this.agentsByPersonality.clear()
    this.activeCollaborations.clear()
    
    this.removeAllListeners()
    
    logger.info({ userId: this.userId }, 'Agent Manager destroyed')
  }
}

// Singleton manager per user
const userManagers = new Map<string, DocumentAgentManager>()

export function getAgentManager(userId: string, config?: Partial<AgentSwarmConfig>): DocumentAgentManager {
  if (!userManagers.has(userId)) {
    const manager = new DocumentAgentManager(userId, config)
    userManagers.set(userId, manager)
  }
  
  return userManagers.get(userId)!
}

export function destroyAgentManager(userId: string): void {
  const manager = userManagers.get(userId)
  if (manager) {
    manager.destroy()
    userManagers.delete(userId)
  }
}