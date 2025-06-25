/**
 * PRISMY PERSISTENT AGENT MANAGER
 * Extends DocumentAgentManager with database persistence capabilities
 * Provides seamless restoration of agent state across system restarts
 */

import { DocumentAgentManager, SwarmMetrics, AgentCollaboration } from './agent-manager'
import { DocumentAgent, AgentMemory, AgentEvent, AgentPattern } from './document-agent'
import { agentDatabaseService, PersistedAgent } from './database/agent-database-service'
import { Agent, Document, TaskResult } from '@/components/workspace/types'
import PredictiveIntelligenceService, { PredictiveInsight } from './intelligence/predictive-intelligence'
import CrossDocumentIntelligenceService, { 
  DocumentCluster, 
  CrossDocumentInsight, 
  KnowledgeGraph,
  MultiDocumentQuery,
  MultiDocumentResponse
} from './intelligence/cross-document-intelligence'
import LearningNetworkService, {
  LearningNode,
  LearningSession,
  LearningRecommendation,
  KnowledgeArticle
} from './enterprise/learning-network'
import VoiceControlService, {
  VoiceCommand,
  VoiceProfile
} from './enterprise/voice-control'

export class PersistentDocumentAgentManager extends DocumentAgentManager {
  private persistenceEnabled: boolean = true
  private saveInterval?: NodeJS.Timeout
  private lastMetricsSave: number = 0
  private predictiveIntelligence: PredictiveIntelligenceService
  private crossDocumentIntelligence: CrossDocumentIntelligenceService
  private learningNetwork: LearningNetworkService
  private voiceControl: VoiceControlService

  constructor(userId: string, enablePersistence: boolean = true) {
    super(userId)
    this.persistenceEnabled = enablePersistence
    
    // Initialize predictive intelligence
    this.predictiveIntelligence = new PredictiveIntelligenceService(userId)
    
    // Initialize cross-document intelligence
    this.crossDocumentIntelligence = new CrossDocumentIntelligenceService(userId)
    
    // Initialize learning network
    this.learningNetwork = new LearningNetworkService(userId)
    
    // Initialize voice control
    this.voiceControl = new VoiceControlService(
      userId,
      this.handleVoiceCommand.bind(this),
      this.handleVoiceAgentAction.bind(this)
    )
    
    if (this.persistenceEnabled) {
      this.setupPersistence()
      this.restoreAgentsFromDatabase()
    }
  }

  /**
   * Setup persistence mechanisms
   */
  private setupPersistence(): void {
    // Auto-save agent state every 60 seconds
    this.saveInterval = setInterval(async () => {
      await this.saveAllAgentStates()
      await this.saveMetricsIfNeeded()
    }, 60000)

    // Listen for agent events and persist them
    this.on('agent_created', this.handleAgentCreated.bind(this))
    this.on('agent_removed', this.handleAgentRemoved.bind(this))
    this.on('collaboration_initiated', this.handleCollaborationInitiated.bind(this))
    this.on('collaboration_completed', this.handleCollaborationCompleted.bind(this))
    this.on('swarm_coordination', this.handleSwarmCoordination.bind(this))

    console.log(`[Persistent Agent Manager] Persistence enabled for user ${this.userId}`)
  }

  /**
   * Create agent with database persistence
   */
  public async createAgent(document: Document): Promise<DocumentAgent> {
    // Create agent using parent class
    const agent = await super.createAgent(document)
    
    if (this.persistenceEnabled) {
      try {
        // Persist to database
        const persistedAgent = await agentDatabaseService.createAgent(
          this.userId, 
          document, 
          agent.getAgent()
        )
        
        console.log(`[Persistent Agent Manager] Agent ${persistedAgent.id} persisted to database`)
        
        // Update agent ID to match database ID
        agent.getAgent().id = persistedAgent.id
        
        // Setup agent event listeners for persistence
        this.setupAgentPersistence(agent)
        
        // Register agent in learning network
        await this.learningNetwork.registerLearningNode(agent.getAgent())
        
      } catch (error) {
        console.error(`[Persistent Agent Manager] Failed to persist agent:`, error)
        // Continue without persistence rather than failing
      }
    }
    
    return agent
  }

  /**
   * Remove agent with database cleanup
   */
  public async removeAgent(agentId: string): Promise<void> {
    // Remove from parent class
    await super.removeAgent(agentId)
    
    if (this.persistenceEnabled) {
      try {
        await agentDatabaseService.deleteAgent(agentId)
        console.log(`[Persistent Agent Manager] Agent ${agentId} removed from database`)
      } catch (error) {
        console.error(`[Persistent Agent Manager] Failed to delete agent from database:`, error)
      }
    }
  }

  /**
   * Restore agents from database on startup
   */
  private async restoreAgentsFromDatabase(): Promise<void> {
    try {
      console.log(`[Persistent Agent Manager] Restoring agents from database for user ${this.userId}`)
      
      const persistedAgents = await agentDatabaseService.getUserAgents(
        this.userId, 
        ['active', 'thinking', 'idle', 'paused']
      )
      
      for (const persistedAgent of persistedAgents) {
        await this.restoreAgent(persistedAgent)
      }
      
      console.log(`[Persistent Agent Manager] Restored ${persistedAgents.length} agents from database`)
      
      // Restore collaborations
      await this.restoreCollaborationsFromDatabase()
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to restore agents from database:`, error)
    }
  }

  /**
   * Restore individual agent from database record
   */
  private async restoreAgent(persistedAgent: PersistedAgent): Promise<void> {
    try {
      // Reconstruct document object
      const document: Document = {
        id: persistedAgent.document_id,
        title: persistedAgent.document_title,
        type: persistedAgent.document_type as any,
        size: '0 KB', // Not stored in agent table
        lastModified: persistedAgent.updated_at,
        agentsAssigned: [persistedAgent.id],
        status: 'ready',
        language: persistedAgent.language,
        pageCount: 1,
        wordCount: 0
      }

      // Create new DocumentAgent instance
      const restoredAgent = new DocumentAgent(document, persistedAgent.personality)
      
      // Restore agent state
      const agentData = restoredAgent.getAgent()
      agentData.id = persistedAgent.id
      agentData.name = persistedAgent.name
      agentData.nameVi = persistedAgent.name_vi
      agentData.specialty = persistedAgent.specialty
      agentData.specialtyVi = persistedAgent.specialty_vi
      agentData.avatar = persistedAgent.avatar
      agentData.status = persistedAgent.status as any
      agentData.efficiency = persistedAgent.efficiency
      agentData.tasksCompleted = persistedAgent.tasks_completed
      agentData.tasksInProgress = persistedAgent.tasks_in_progress
      agentData.capabilities = persistedAgent.capabilities
      agentData.culturalContext = persistedAgent.cultural_context
      agentData.lastActivity = persistedAgent.last_activity

      // Restore memory from database
      const restoredMemory = await agentDatabaseService.restoreAgentMemory(persistedAgent.id)
      restoredAgent['memory'] = restoredMemory
      restoredAgent['goals'] = persistedAgent.goals
      
      // Set autonomy level
      restoredAgent.setAutonomyLevel(persistedAgent.autonomy_level)
      
      // Add to agents map
      this.agents.set(persistedAgent.id, restoredAgent)
      
      // Setup persistence listeners
      this.setupAgentPersistence(restoredAgent)
      
      // Resume agent if it was active
      if (persistedAgent.status === 'active' || persistedAgent.status === 'thinking') {
        restoredAgent.resume()
      }
      
      console.log(`[Persistent Agent Manager] Restored agent ${persistedAgent.id} (${persistedAgent.name})`)
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to restore agent ${persistedAgent.id}:`, error)
    }
  }

  /**
   * Restore collaborations from database
   */
  private async restoreCollaborationsFromDatabase(): Promise<void> {
    try {
      const persistedCollaborations = await agentDatabaseService.getUserCollaborations(
        this.userId, 
        ['forming', 'active']
      )
      
      for (const collaboration of persistedCollaborations) {
        // Check if all participants still exist
        const participantsExist = collaboration.participant_ids.every(id => this.agents.has(id))
        
        if (participantsExist) {
          // Restore collaboration
          this.collaborations.set(collaboration.id, {
            id: collaboration.id,
            participants: collaboration.participant_ids,
            objective: collaboration.objective,
            status: collaboration.status as any,
            startTime: new Date(collaboration.started_at),
            endTime: collaboration.completed_at ? new Date(collaboration.completed_at) : undefined,
            results: collaboration.results
          })
          
          console.log(`[Persistent Agent Manager] Restored collaboration ${collaboration.id}`)
        } else {
          // Mark collaboration as failed if participants no longer exist
          await agentDatabaseService.updateCollaboration(collaboration.id, {
            status: 'failed',
            completed_at: new Date().toISOString()
          })
        }
      }
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to restore collaborations:`, error)
    }
  }

  /**
   * Setup persistence listeners for an agent
   */
  private setupAgentPersistence(agent: DocumentAgent): void {
    const agentId = agent.getAgent().id

    // Listen for task completions
    agent.on('task_completed', async (data) => {
      await this.saveTaskResult(agentId, data.result)
      await this.updateAgentInDatabase(agentId, agent)
    })

    // Listen for memory updates
    agent.on('memory_updated', async (data) => {
      await agentDatabaseService.saveMemoryEvent(agentId, data.event)
    })

    // Listen for urgent notifications
    agent.on('urgent_notification', async (notification) => {
      console.log(`[Persistent Agent Manager] Urgent notification from agent ${agentId}:`, notification.message)
      // Could integrate with notification service here
    })

    // Listen for agent status changes
    agent.on('agent_paused', async () => {
      await this.updateAgentInDatabase(agentId, agent)
    })

    agent.on('agent_resumed', async () => {
      await this.updateAgentInDatabase(agentId, agent)
    })
  }

  /**
   * Save all agent states to database
   */
  private async saveAllAgentStates(): Promise<void> {
    const savePromises = Array.from(this.agents.entries()).map(([agentId, agent]) => 
      this.updateAgentInDatabase(agentId, agent)
    )
    
    await Promise.allSettled(savePromises)
  }

  /**
   * Update agent in database
   */
  private async updateAgentInDatabase(agentId: string, agent: DocumentAgent): Promise<void> {
    try {
      const agentData = agent.getAgent()
      const memory = agent.getMemory()
      const goals = agent.getGoals()
      
      await agentDatabaseService.updateAgent(agentId, {
        status: agentData.status as any,
        efficiency: agentData.efficiency,
        tasks_completed: agentData.tasksCompleted,
        tasks_in_progress: agentData.tasksInProgress,
        memory_data: memory,
        goals: goals,
        last_activity: new Date().toISOString()
      })
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to update agent ${agentId} in database:`, error)
    }
  }

  /**
   * Save task result to database
   */
  private async saveTaskResult(agentId: string, taskResult: TaskResult): Promise<void> {
    try {
      await agentDatabaseService.saveTaskResult(agentId, taskResult)
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to save task result:`, error)
    }
  }

  /**
   * Save metrics if enough time has passed
   */
  private async saveMetricsIfNeeded(): Promise<void> {
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    if (now - this.lastMetricsSave > fiveMinutes) {
      await this.saveSwarmMetrics()
      this.lastMetricsSave = now
    }
  }

  /**
   * Save swarm metrics to database
   */
  private async saveSwarmMetrics(): Promise<void> {
    try {
      const metrics = this.getSwarmMetrics()
      await agentDatabaseService.recordSwarmMetrics(this.userId, metrics)
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to save swarm metrics:`, error)
    }
  }

  /**
   * Event handlers for persistence
   */
  private async handleAgentCreated(data: any): Promise<void> {
    console.log(`[Persistent Agent Manager] Agent created: ${data.agentId}`)
    // Agent is already persisted in createAgent method
  }

  private async handleAgentRemoved(data: any): Promise<void> {
    console.log(`[Persistent Agent Manager] Agent removed: ${data.agentId}`)
    // Agent is already removed in removeAgent method
  }

  private async handleCollaborationInitiated(collaboration: AgentCollaboration): Promise<void> {
    try {
      const persistedCollaboration = await agentDatabaseService.createCollaboration(
        this.userId,
        collaboration.objective,
        collaboration.participants,
        0.7 // Default priority
      )
      
      // Update in-memory collaboration with database ID
      collaboration.id = persistedCollaboration.id
      
      console.log(`[Persistent Agent Manager] Collaboration ${collaboration.id} persisted`)
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to persist collaboration:`, error)
    }
  }

  private async handleCollaborationCompleted(collaboration: AgentCollaboration): Promise<void> {
    try {
      await agentDatabaseService.updateCollaboration(collaboration.id, {
        status: collaboration.status,
        completed_at: collaboration.endTime?.toISOString(),
        results: collaboration.results
      })
      
      console.log(`[Persistent Agent Manager] Collaboration ${collaboration.id} completion persisted`)
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to persist collaboration completion:`, error)
    }
  }

  private async handleSwarmCoordination(data: any): Promise<void> {
    // Swarm metrics are saved periodically, not on every coordination
    console.log(`[Persistent Agent Manager] Swarm coordination: ${data.activeCollaborations} active collaborations`)
  }

  /**
   * Enhanced swarm query with persistence
   */
  public async querySwarm(query: string, timeout: number = 30000): Promise<any> {
    if (!this.persistenceEnabled) {
      return super.querySwarm(query, timeout)
    }

    try {
      // Create persistent swarm query
      const swarmQuery = await agentDatabaseService.createSwarmQuery(
        this.userId,
        query,
        timeout
      )
      
      // Execute query using parent method
      const result = await super.querySwarm(query, timeout)
      
      // Save aggregated result
      await agentDatabaseService.completeSwarmQuery(swarmQuery.id, result)
      
      return result
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to execute persistent swarm query:`, error)
      // Fallback to non-persistent query
      return super.querySwarm(query, timeout)
    }
  }

  /**
   * Get analytics data including historical data
   */
  public async getAnalyticsData(days: number = 30): Promise<any> {
    if (!this.persistenceEnabled) {
      return {
        current: this.getSwarmMetrics(),
        historical: null
      }
    }

    try {
      const analyticsData = await agentDatabaseService.getAnalyticsData(this.userId, days)
      
      return {
        current: this.getSwarmMetrics(),
        historical: analyticsData,
        persistence: {
          enabled: true,
          lastSave: new Date(this.lastMetricsSave).toISOString(),
          dataRetention: `${days} days`
        }
      }
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to get analytics data:`, error)
      return {
        current: this.getSwarmMetrics(),
        historical: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get predictive insights for user
   */
  public getPredictiveInsights(): PredictiveInsight[] {
    return this.predictiveIntelligence.getActiveInsights()
  }

  /**
   * Generate predictive insights on demand
   */
  public async generatePredictiveInsights(): Promise<PredictiveInsight[]> {
    return this.predictiveIntelligence.generatePredictiveInsights()
  }

  /**
   * Dismiss a predictive insight
   */
  public async dismissPredictiveInsight(insightId: string): Promise<void> {
    await this.predictiveIntelligence.dismissInsight(insightId)
  }

  /**
   * Cross-Document Intelligence Methods
   */
  
  /**
   * Analyze all documents for cross-document patterns and insights
   */
  public async analyzeAllDocuments(): Promise<{
    clusters: DocumentCluster[]
    insights: CrossDocumentInsight[]
    knowledgeGraph: KnowledgeGraph
    summary: any
  }> {
    return this.crossDocumentIntelligence.analyzeAllDocuments()
  }

  /**
   * Query across multiple documents with intelligent synthesis
   */
  public async queryAcrossDocuments(query: MultiDocumentQuery): Promise<MultiDocumentResponse> {
    return this.crossDocumentIntelligence.queryAcrossDocuments(query)
  }

  /**
   * Find relationships between specific documents
   */
  public async findDocumentRelationships(documentIds: string[]): Promise<any[]> {
    return this.crossDocumentIntelligence.findDocumentRelationships(documentIds)
  }

  /**
   * Detect knowledge gaps across document collection
   */
  public async detectKnowledgeGaps(): Promise<any> {
    return this.crossDocumentIntelligence.detectKnowledgeGaps()
  }

  /**
   * Get cached document clusters
   */
  public getCachedDocumentClusters(): DocumentCluster[] {
    return this.crossDocumentIntelligence.getCachedClusters()
  }

  /**
   * Get cached cross-document insights
   */
  public getCachedCrossDocumentInsights(): CrossDocumentInsight[] {
    return this.crossDocumentIntelligence.getCachedInsights()
  }

  /**
   * Get knowledge graph
   */
  public getKnowledgeGraph(): KnowledgeGraph | null {
    return this.crossDocumentIntelligence.getKnowledgeGraph()
  }

  /**
   * Enterprise Features - Learning Network Methods
   */
  
  /**
   * Create knowledge transfer session between agents
   */
  public async createKnowledgeTransferSession(
    sourceAgentId: string, 
    targetAgentId: string, 
    domain: string
  ): Promise<LearningSession> {
    const sourceNodeId = `node-${sourceAgentId}`
    const targetNodeId = `node-${targetAgentId}`
    return this.learningNetwork.createKnowledgeTransferSession(sourceNodeId, targetNodeId, domain)
  }

  /**
   * Generate learning recommendations for an agent
   */
  public async generateLearningRecommendations(agentId: string): Promise<LearningRecommendation[]> {
    const nodeId = `node-${agentId}`
    return this.learningNetwork.getNodeRecommendations(nodeId)
  }

  /**
   * Create knowledge article
   */
  public async createKnowledgeArticle(
    authorAgentId: string,
    title: string,
    content: string,
    domain: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  ): Promise<KnowledgeArticle> {
    const authorNodeId = `node-${authorAgentId}`
    return this.learningNetwork.createKnowledgeArticle(authorNodeId, title, content, domain, difficulty)
  }

  /**
   * Execute swarm learning session
   */
  public async executeSwarmLearning(
    agentIds: string[],
    objective: string,
    domain: string
  ): Promise<LearningSession> {
    const nodeIds = agentIds.map(id => `node-${id}`)
    return this.learningNetwork.executeSwarmLearning(nodeIds, objective, domain)
  }

  /**
   * Get learning network analytics
   */
  public getLearningNetworkAnalytics(): any {
    return this.learningNetwork.getNetworkAnalytics()
  }

  /**
   * Get learning nodes
   */
  public getLearningNodes(): LearningNode[] {
    return this.learningNetwork.getNetworkNodes()
  }

  /**
   * Get knowledge articles
   */
  public getKnowledgeArticles(): KnowledgeArticle[] {
    return this.learningNetwork.getKnowledgeArticles()
  }

  /**
   * Get learning sessions
   */
  public getLearningSessions(): LearningSession[] {
    return this.learningNetwork.getLearningSessions()
  }

  /**
   * Enterprise Features - Voice Control Methods
   */
  
  /**
   * Start voice listening
   */
  public async startVoiceListening(): Promise<void> {
    return this.voiceControl.startListening()
  }

  /**
   * Stop voice listening
   */
  public stopVoiceListening(): void {
    this.voiceControl.stopListening()
  }

  /**
   * Process voice command manually
   */
  public async processVoiceCommand(transcript: string, confidence?: number): Promise<VoiceCommand> {
    return this.voiceControl.processVoiceCommand(transcript, confidence)
  }

  /**
   * Speak text using voice synthesis
   */
  public async speak(text: string, language?: 'vi' | 'en'): Promise<void> {
    return this.voiceControl.speak(text, language)
  }

  /**
   * Get voice command history
   */
  public getVoiceCommandHistory(): VoiceCommand[] {
    return this.voiceControl.getCommandHistory()
  }

  /**
   * Update voice settings
   */
  public updateVoiceSettings(settings: any): void {
    this.voiceControl.updateVoiceSettings(settings)
  }

  /**
   * Get voice profile
   */
  public getVoiceProfile(): VoiceProfile | null {
    return this.voiceControl.getVoiceProfile()
  }

  /**
   * Add custom voice command
   */
  public addCustomVoiceCommand(command: any): void {
    this.voiceControl.addCustomCommand(command)
  }

  /**
   * Voice Command and Agent Action Handlers
   */
  private handleVoiceCommand(command: VoiceCommand): void {
    console.log(`[Persistent Agent Manager] Voice command executed: ${command.transcript}`)
    // Additional handling logic here if needed
  }

  private async handleVoiceAgentAction(action: string, params: any): Promise<any> {
    try {
      switch (action) {
        case 'create_agent':
          // Handle agent creation via voice
          return { success: true, message: 'Agent creation initiated via voice' }

        case 'pause_agent':
          if (params.agentId) {
            await this.pauseAgent(params.agentId)
            return { success: true, message: `Agent ${params.agentId} paused` }
          }
          break

        case 'resume_agent':
          if (params.agentId) {
            await this.resumeAgent(params.agentId)
            return { success: true, message: `Agent ${params.agentId} resumed` }
          }
          break

        case 'list_agents':
          const agents = this.getAgents()
          return { 
            success: true, 
            agents: agents.map(agent => ({ 
              id: agent.id, 
              name: agent.name, 
              status: agent.status 
            }))
          }

        case 'get_agent_status':
          if (params.agentId) {
            const agent = this.getAgent(params.agentId)
            return { 
              success: true, 
              agent: agent ? {
                id: agent.id,
                name: agent.name,
                status: agent.status,
                efficiency: agent.efficiency
              } : null
            }
          }
          break

        case 'query_swarm':
          const swarmResponse = await this.querySwarm(params.query, params.timeout)
          return { success: true, response: swarmResponse }

        case 'get_swarm_insights':
          const insights = this.getSwarmMetrics()
          return { success: true, insights }

        case 'create_backup':
          const backup = await this.createBackup()
          return { success: true, backup }

        case 'analyze_document':
          // Handle document analysis via voice
          return { success: true, message: 'Document analysis initiated via voice' }

        case 'search_documents':
          // Handle document search via voice
          return { success: true, message: 'Document search initiated via voice' }

        default:
          return { success: false, error: `Unknown action: ${action}` }
      }

      return { success: false, error: 'Missing required parameters' }

    } catch (error) {
      console.error(`[Persistent Agent Manager] Voice action failed:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Cleanup and destroy with persistence
   */
  public destroy(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
    }
    
    // Destroy predictive intelligence
    this.predictiveIntelligence.destroy()
    
    // Destroy cross-document intelligence
    this.crossDocumentIntelligence.clearCache()
    
    // Destroy learning network
    this.learningNetwork.destroy()
    
    // Destroy voice control
    this.voiceControl.destroy()
    
    // Save final state before destroying
    if (this.persistenceEnabled) {
      this.saveAllAgentStates().then(() => {
        console.log(`[Persistent Agent Manager] Final state saved for user ${this.userId}`)
      }).catch(error => {
        console.error(`[Persistent Agent Manager] Failed to save final state:`, error)
      })
    }
    
    super.destroy()
    console.log(`[Persistent Agent Manager] Destroyed persistent manager for user ${this.userId}`)
  }

  /**
   * Manual backup of all agent data
   */
  public async createBackup(): Promise<any> {
    if (!this.persistenceEnabled) {
      throw new Error('Persistence not enabled')
    }

    try {
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const collaborations = await agentDatabaseService.getUserCollaborations(this.userId)
      const analytics = await this.getAnalyticsData(90) // 90 days of analytics
      
      const backup = {
        timestamp: new Date().toISOString(),
        userId: this.userId,
        agents: agents.length,
        collaborations: collaborations.length,
        data: {
          agents,
          collaborations,
          analytics
        }
      }
      
      console.log(`[Persistent Agent Manager] Backup created: ${agents.length} agents, ${collaborations.length} collaborations`)
      return backup
      
    } catch (error) {
      console.error(`[Persistent Agent Manager] Failed to create backup:`, error)
      throw error
    }
  }

  /**
   * Get persistence status
   */
  public getPersistenceStatus(): any {
    return {
      enabled: this.persistenceEnabled,
      userId: this.userId,
      agentsInMemory: this.agents.size,
      collaborationsInMemory: this.collaborations.size,
      lastMetricsSave: new Date(this.lastMetricsSave).toISOString(),
      autoSaveInterval: this.saveInterval ? '60 seconds' : 'disabled'
    }
  }
}

export default PersistentDocumentAgentManager