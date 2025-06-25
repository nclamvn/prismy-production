/**
 * PRISMY AGENT SWARM MANAGER
 * Orchestrates multiple autonomous document agents
 * Enables swarm intelligence, collaboration, and collective learning
 */

import { EventEmitter } from 'events'
import { DocumentAgent } from './document-agent'
import { Agent, Document, CollaborationSession, Task } from '@/components/workspace/types'
import { aiProviderManager, AgentCompatibilityRequest } from '@/lib/ai/providers/ai-provider-manager'

export interface SwarmMetrics {
  totalAgents: number
  activeAgents: number
  totalCollaborations: number
  averageEfficiency: number
  emergentBehaviors: number
  collectiveIntelligence: number
}

export interface AgentCollaboration {
  id: string
  participants: string[] // agent IDs
  objective: string
  status: 'forming' | 'active' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  results?: any[]
}

export interface SwarmQuery {
  id: string
  query: string
  requiredAgents?: string[]
  timeout: number
  responses: SwarmQueryResponse[]
  aggregatedResult?: any
}

export interface SwarmQueryResponse {
  agentId: string
  response: any
  confidence: number
  timestamp: Date
}

export class DocumentAgentManager extends EventEmitter {
  private agents: Map<string, DocumentAgent> = new Map()
  private collaborations: Map<string, AgentCollaboration> = new Map()
  private swarmQueries: Map<string, SwarmQuery> = new Map()
  private maxAgents: number = 50
  private userId: string
  private isActive: boolean = true
  private swarmInterval?: NodeJS.Timeout

  constructor(userId: string) {
    super()
    this.userId = userId
    this.startSwarmIntelligence()
    
    console.log(`[Swarm Manager] Initialized for user ${userId}`)
  }

  /**
   * Create autonomous agent for document
   */
  public async createAgent(document: Document): Promise<DocumentAgent> {
    // Check agent limit
    if (this.agents.size >= this.maxAgents) {
      await this.retireOldestAgent()
    }

    // Create new agent
    const agent = new DocumentAgent(document)
    
    // Set up event listeners
    this.setupAgentListeners(agent)
    
    // Add to swarm
    this.agents.set(agent.getAgent().id, agent)
    
    console.log(`[Swarm Manager] Created agent ${agent.getAgent().id} for document ${document.title}`)
    
    // Check for immediate collaboration opportunities
    await this.checkCollaborationOpportunities(agent.getAgent().id)
    
    this.emit('agent_created', { 
      agentId: agent.getAgent().id, 
      documentId: document.id,
      swarmSize: this.agents.size 
    })
    
    return agent
  }

  /**
   * Remove agent from swarm
   */
  public async removeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) return

    // End any active collaborations
    await this.endAgentCollaborations(agentId)
    
    // Destroy agent
    agent.destroy()
    
    // Remove from swarm
    this.agents.delete(agentId)
    
    console.log(`[Swarm Manager] Removed agent ${agentId}`)
    this.emit('agent_removed', { agentId, swarmSize: this.agents.size })
  }

  /**
   * Start swarm intelligence coordination
   */
  private startSwarmIntelligence(): void {
    if (this.swarmInterval) {
      clearInterval(this.swarmInterval)
    }

    this.swarmInterval = setInterval(async () => {
      if (!this.isActive) return

      try {
        await this.coordinateSwarm()
      } catch (error) {
        console.error('[Swarm Manager] Swarm coordination error:', error)
      }
    }, 60000) // 1 minute
  }

  /**
   * Coordinate swarm activities
   */
  private async coordinateSwarm(): Promise<void> {
    // Check for new collaboration opportunities
    await this.identifyCollaborationOpportunities()
    
    // Process active collaborations
    await this.processActiveCollaborations()
    
    // Update swarm metrics
    const metrics = this.calculateSwarmMetrics()
    
    // Detect emergent behaviors
    const emergentBehaviors = await this.detectEmergentBehaviors()
    
    this.emit('swarm_coordination', { 
      metrics, 
      emergentBehaviors,
      activeCollaborations: this.collaborations.size
    })
  }

  /**
   * Set up event listeners for agent
   */
  private setupAgentListeners(agent: DocumentAgent): void {
    const agentId = agent.getAgent().id

    agent.on('agent_notification', (data) => {
      this.emit('swarm_notification', { ...data, source: 'agent' })
    })

    agent.on('agent_thinking', (data) => {
      // Track thinking patterns across swarm
    })

    agent.on('memory_updated', (data) => {
      // Contribute to collective memory
      this.contributeToCollectiveMemory(agentId, data.event)
    })
  }

  /**
   * AI-powered identification of collaboration opportunities between agents
   */
  private async identifyCollaborationOpportunities(): Promise<void> {
    const agents = Array.from(this.agents.values())
    
    if (agents.length < 2) return
    
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agent1 = agents[i].getAgent()
        const agent2 = agents[j].getAgent()
        
        try {
          // AI-powered compatibility assessment
          const compatibility = await this.calculateAgentCompatibility(agent1, agent2)
          
          // Check if agents are already collaborating
          const isAlreadyCollaborating = Array.from(this.collaborations.values())
            .some(collab => 
              collab.status === 'active' && 
              collab.participants.includes(agent1.id) && 
              collab.participants.includes(agent2.id)
            )

          if (isAlreadyCollaborating) continue

          // Intelligent collaboration decision
          const shouldCollaborate = await this.assessCollaborationNeed(agent1, agent2, compatibility)
          
          if (shouldCollaborate.should) {
            await this.initiateCollaboration(
              [agent1.id, agent2.id], 
              shouldCollaborate.objective
            )
            
            console.log(`[Swarm Manager] AI-initiated collaboration: ${shouldCollaborate.objective}`)
          }
        } catch (error) {
          console.warn(`[Swarm Manager] Collaboration assessment error for agents ${agent1.id}, ${agent2.id}:`, error)
        }
      }
    }
  }

  /**
   * Assess if two agents should collaborate based on AI analysis
   */
  private async assessCollaborationNeed(
    agent1: Agent, 
    agent2: Agent, 
    compatibility: number
  ): Promise<{ should: boolean; objective: string; priority: number }> {
    
    // High compatibility threshold for collaboration
    if (compatibility < 0.7) {
      return { should: false, objective: '', priority: 0 }
    }

    // Analyze agent recent activities for collaboration triggers
    const agent1Recent = this.getAgentRecentActivity(agent1.id)
    const agent2Recent = this.getAgentRecentActivity(agent2.id)

    // Check for complementary activities
    const hasComplementaryActivities = this.hasComplementaryActivities(agent1Recent, agent2Recent)
    
    if (!hasComplementaryActivities && Math.random() > 0.3) {
      return { should: false, objective: '', priority: 0 }
    }

    // Generate intelligent collaboration objective
    const objective = this.generateCollaborationObjective(agent1, agent2, compatibility)
    const priority = this.calculateCollaborationPriority(agent1, agent2, compatibility)

    return {
      should: true,
      objective,
      priority
    }
  }

  /**
   * Get agent's recent activity patterns
   */
  private getAgentRecentActivity(agentId: string): any[] {
    const agent = this.agents.get(agentId)
    if (!agent) return []

    const memory = agent.getMemory()
    return memory.shortTerm
      .filter(event => event.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .slice(-10) // Last 10 events
  }

  /**
   * Check if two agents have complementary activities
   */
  private hasComplementaryActivities(activities1: any[], activities2: any[]): boolean {
    // Look for patterns that suggest benefit from collaboration
    const types1 = new Set(activities1.map(a => a.type))
    const types2 = new Set(activities2.map(a => a.type))

    // Contract + Financial analysis = Good collaboration
    if ((types1.has('contract_review_completed') && types2.has('budget_analysis')) ||
        (types2.has('contract_review_completed') && types1.has('budget_analysis'))) {
      return true
    }

    // Project + Research activities = Good collaboration  
    if ((types1.has('project_status_updated') && types2.has('research_synthesis')) ||
        (types2.has('project_status_updated') && types1.has('research_synthesis'))) {
      return true
    }

    // Any different types of analysis = Potential collaboration
    const analysisTypes1 = Array.from(types1).filter(type => type.includes('_completed') || type.includes('_generated'))
    const analysisTypes2 = Array.from(types2).filter(type => type.includes('_completed') || type.includes('_generated'))

    return analysisTypes1.length > 0 && analysisTypes2.length > 0
  }

  /**
   * Generate intelligent collaboration objective
   */
  private generateCollaborationObjective(agent1: Agent, agent2: Agent, compatibility: number): string {
    const specialties = [agent1.specialty, agent2.specialty].sort()
    
    const objectives = {
      'financial-legal': 'Cross-validate contract financial terms and compliance requirements',
      'legal-project': 'Assess project legal requirements and timeline implications',
      'financial-project': 'Analyze project budget performance and resource allocation',
      'project-research': 'Synthesize research findings for project planning optimization',
      'financial-research': 'Research cost optimization strategies and market analysis',
      'legal-research': 'Research regulatory compliance requirements and best practices'
    }

    const key = specialties.join('-') as keyof typeof objectives
    return objectives[key] || `Cross-analysis collaboration between ${agent1.specialty} and ${agent2.specialty} specialists`
  }

  /**
   * Calculate collaboration priority
   */
  private calculateCollaborationPriority(agent1: Agent, agent2: Agent, compatibility: number): number {
    let priority = compatibility * 0.5 // Base priority from compatibility

    // Boost priority based on agent efficiency
    const avgEfficiency = (agent1.efficiency + agent2.efficiency) / 2
    priority += (avgEfficiency / 100) * 0.3

    // Boost for high-value specialties
    if (agent1.specialty.includes('legal') || agent2.specialty.includes('legal')) {
      priority += 0.1
    }
    if (agent1.specialty.includes('financial') || agent2.specialty.includes('financial')) {
      priority += 0.1
    }

    return Math.min(1.0, priority)
  }

  /**
   * AI-powered agent compatibility calculation
   */
  private async calculateAgentCompatibility(agent1: Agent, agent2: Agent): Promise<number> {
    try {
      const compatibilityRequest: AgentCompatibilityRequest = {
        agent1: {
          specialty: agent1.specialty,
          capabilities: agent1.capabilities?.map(cap => cap.name) || []
        },
        agent2: {
          specialty: agent2.specialty,
          capabilities: agent2.capabilities?.map(cap => cap.name) || []
        },
        context: {
          currentProjects: [], // Could be populated from recent activity
          documentTypes: [agent1.specialty, agent2.specialty],
          userGoals: ['productivity', 'efficiency', 'insights'],
          timeframe: '30days'
        }
      }

      const result = await aiProviderManager.assessAgentCompatibility(compatibilityRequest)
      return result.synergy_score

    } catch (error) {
      console.warn('[Swarm Manager] AI compatibility assessment failed, using fallback:', error)
      
      // Fallback to rule-based compatibility
      return this.calculateAgentCompatibilityFallback(agent1, agent2)
    }
  }

  /**
   * Fallback rule-based compatibility calculation
   */
  private calculateAgentCompatibilityFallback(agent1: Agent, agent2: Agent): number {
    // Legal + Financial = High compatibility (contracts, compliance)
    if ((agent1.specialty.includes('legal') && agent2.specialty.includes('financial')) ||
        (agent1.specialty.includes('financial') && agent2.specialty.includes('legal'))) {
      return 0.9
    }
    
    // Project + Research = High compatibility (planning, insights)
    if ((agent1.specialty.includes('project') && agent2.specialty.includes('research')) ||
        (agent1.specialty.includes('research') && agent2.specialty.includes('project'))) {
      return 0.85
    }
    
    // Different specializations = Medium compatibility
    if (agent1.specialty !== agent2.specialty) {
      return 0.6
    }
    
    // Same specialization = Lower compatibility (less synergy)
    return 0.3
  }

  /**
   * Initiate collaboration between agents
   */
  private async initiateCollaboration(agentIds: string[], objective: string): Promise<string> {
    const collaborationId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const collaboration: AgentCollaboration = {
      id: collaborationId,
      participants: agentIds,
      objective,
      status: 'forming',
      startTime: new Date()
    }
    
    this.collaborations.set(collaborationId, collaboration)
    
    console.log(`[Swarm Manager] Initiated collaboration ${collaborationId}: ${objective}`)
    
    // Notify participating agents
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId)
      if (agent) {
        agent.emit('collaboration_invite', { 
          collaborationId, 
          objective, 
          participants: agentIds 
        })
      }
    }
    
    // Start collaboration after brief formation period
    setTimeout(() => {
      this.activateCollaboration(collaborationId)
    }, 5000)
    
    this.emit('collaboration_initiated', collaboration)
    
    return collaborationId
  }

  /**
   * Activate collaboration
   */
  private async activateCollaboration(collaborationId: string): Promise<void> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration || collaboration.status !== 'forming') return
    
    collaboration.status = 'active'
    
    console.log(`[Swarm Manager] Activated collaboration ${collaborationId}`)
    
    // Execute collaboration logic
    try {
      const results = await this.executeCollaboration(collaboration)
      collaboration.results = results
      collaboration.status = 'completed'
      collaboration.endTime = new Date()
      
      this.emit('collaboration_completed', collaboration)
    } catch (error) {
      collaboration.status = 'failed'
      collaboration.endTime = new Date()
      console.error(`[Swarm Manager] Collaboration ${collaborationId} failed:`, error)
    }
  }

  /**
   * Execute collaboration between agents
   */
  private async executeCollaboration(collaboration: AgentCollaboration): Promise<any[]> {
    const results = []
    
    // Simulate collaboration execution
    for (const agentId of collaboration.participants) {
      const agent = this.agents.get(agentId)
      if (agent) {
        const agentData = agent.getAgent()
        
        results.push({
          agentId,
          contribution: `${agentData.name} contributed ${agentData.specialty} expertise`,
          confidence: 0.8,
          timestamp: new Date()
        })
      }
    }
    
    // Synthesize results
    const synthesis = {
      type: 'collaboration_synthesis',
      participants: collaboration.participants.length,
      insights: results.length,
      quality: Math.random() * 0.3 + 0.7, // 0.7-1.0
      timestamp: new Date()
    }
    
    results.push(synthesis)
    
    return results
  }

  /**
   * Process active collaborations
   */
  private async processActiveCollaborations(): Promise<void> {
    for (const collaboration of this.collaborations.values()) {
      if (collaboration.status === 'active') {
        // Check for timeouts or completion conditions
        const elapsed = Date.now() - collaboration.startTime.getTime()
        
        if (elapsed > 300000) { // 5 minutes timeout
          collaboration.status = 'completed'
          collaboration.endTime = new Date()
          console.log(`[Swarm Manager] Collaboration ${collaboration.id} completed by timeout`)
        }
      }
    }
  }

  /**
   * End collaborations for specific agent
   */
  private async endAgentCollaborations(agentId: string): Promise<void> {
    for (const collaboration of this.collaborations.values()) {
      if (collaboration.participants.includes(agentId) && 
          collaboration.status === 'active') {
        collaboration.status = 'completed'
        collaboration.endTime = new Date()
      }
    }
  }

  /**
   * Contribute to collective memory
   */
  private contributeToCollectiveMemory(agentId: string, event: any): void {
    // TODO: Implement collective memory system
    console.log(`[Swarm Manager] Agent ${agentId} contributed to collective memory: ${event.type}`)
  }

  /**
   * Detect emergent behaviors in swarm
   */
  private async detectEmergentBehaviors(): Promise<string[]> {
    const behaviors = []
    
    // Check for synchronized behaviors
    const recentThoughts = Array.from(this.agents.values())
      .filter(agent => {
        const lastThought = Date.now() - new Date(agent.getAgent().lastActivity).getTime()
        return lastThought < 60000 // Last minute
      })
    
    if (recentThoughts.length > this.agents.size * 0.7) {
      behaviors.push('synchronized_thinking')
    }
    
    // Check for collaboration chains
    const activeCollaborations = Array.from(this.collaborations.values())
      .filter(c => c.status === 'active').length
    
    if (activeCollaborations > 3) {
      behaviors.push('collaboration_cascade')
    }
    
    // Check for specialization clustering
    const specializations = Array.from(this.agents.values())
      .map(agent => agent.getAgent().specialty)
    
    const uniqueSpecs = new Set(specializations)
    if (uniqueSpecs.size < specializations.length * 0.5) {
      behaviors.push('specialization_clustering')
    }
    
    return behaviors
  }

  /**
   * Calculate swarm metrics
   */
  private calculateSwarmMetrics(): SwarmMetrics {
    const agents = Array.from(this.agents.values())
    const activeAgents = agents.filter(agent => agent.getAgent().status === 'active')
    
    const totalEfficiency = agents.reduce((sum, agent) => sum + agent.getAgent().efficiency, 0)
    const averageEfficiency = agents.length > 0 ? totalEfficiency / agents.length : 0
    
    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalCollaborations: this.collaborations.size,
      averageEfficiency,
      emergentBehaviors: 0, // Will be updated by detectEmergentBehaviors
      collectiveIntelligence: Math.min(100, averageEfficiency + (this.collaborations.size * 2))
    }
  }

  /**
   * Query swarm with collective intelligence
   */
  public async querySwarm(query: string, timeout: number = 30000): Promise<any> {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const swarmQuery: SwarmQuery = {
      id: queryId,
      query,
      timeout,
      responses: []
    }
    
    this.swarmQueries.set(queryId, swarmQuery)
    
    console.log(`[Swarm Manager] Broadcasting query to ${this.agents.size} agents: ${query}`)
    
    // Broadcast query to all agents
    const promises = Array.from(this.agents.values()).map(async (agent) => {
      try {
        const agentData = agent.getAgent()
        
        // Simulate agent response based on specialty
        const response = this.generateAgentResponse(agentData, query)
        
        swarmQuery.responses.push({
          agentId: agentData.id,
          response,
          confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
          timestamp: new Date()
        })
      } catch (error) {
        console.error(`[Swarm Manager] Agent ${agent.getAgent().id} query error:`, error)
      }
    })
    
    // Wait for responses or timeout
    await Promise.race([
      Promise.all(promises),
      new Promise(resolve => setTimeout(resolve, timeout))
    ])
    
    // Aggregate responses
    const aggregated = this.aggregateSwarmResponses(swarmQuery.responses, query)
    swarmQuery.aggregatedResult = aggregated
    
    this.emit('swarm_query_completed', swarmQuery)
    
    return aggregated
  }

  /**
   * Generate agent response to query
   */
  private generateAgentResponse(agent: Agent, query: string): any {
    const lowerQuery = query.toLowerCase()
    
    // Legal agent responses
    if (agent.specialty.includes('legal')) {
      if (lowerQuery.includes('contract') || lowerQuery.includes('legal')) {
        return {
          type: 'legal_analysis',
          content: `Legal perspective: ${query} requires compliance review and risk assessment`,
          recommendations: ['Review terms', 'Check regulations', 'Assess risks']
        }
      }
    }
    
    // Financial agent responses
    if (agent.specialty.includes('financial')) {
      if (lowerQuery.includes('budget') || lowerQuery.includes('cost') || lowerQuery.includes('financial')) {
        return {
          type: 'financial_analysis',
          content: `Financial perspective: ${query} impacts budget and resource allocation`,
          recommendations: ['Analyze costs', 'Review budget', 'Assess ROI']
        }
      }
    }
    
    // Project agent responses
    if (agent.specialty.includes('project')) {
      if (lowerQuery.includes('timeline') || lowerQuery.includes('deadline') || lowerQuery.includes('project')) {
        return {
          type: 'project_analysis',
          content: `Project perspective: ${query} affects timeline and deliverables`,
          recommendations: ['Update timeline', 'Check dependencies', 'Assess resources']
        }
      }
    }
    
    // Research agent responses
    if (agent.specialty.includes('research')) {
      return {
        type: 'research_analysis',
        content: `Research perspective: ${query} requires investigation and data collection`,
        recommendations: ['Gather data', 'Analyze trends', 'Find sources']
      }
    }
    
    // General response
    return {
      type: 'general_analysis',
      content: `General perspective on: ${query}`,
      recommendations: ['Further analysis needed']
    }
  }

  /**
   * Aggregate swarm responses
   */
  private aggregateSwarmResponses(responses: SwarmQueryResponse[], query: string): any {
    if (responses.length === 0) {
      return { error: 'No responses from swarm' }
    }
    
    const totalConfidence = responses.reduce((sum, r) => sum + r.confidence, 0)
    const averageConfidence = totalConfidence / responses.length
    
    const responseTypes = responses.map(r => r.response.type)
    const uniqueTypes = [...new Set(responseTypes)]
    
    const allRecommendations = responses.flatMap(r => r.response.recommendations || [])
    const uniqueRecommendations = [...new Set(allRecommendations)]
    
    return {
      query,
      swarmSize: responses.length,
      averageConfidence,
      perspectives: uniqueTypes,
      synthesis: `Collective analysis from ${responses.length} agents with ${averageConfidence.toFixed(2)} confidence`,
      recommendations: uniqueRecommendations,
      responses: responses.map(r => ({
        agentId: r.agentId,
        type: r.response.type,
        confidence: r.confidence
      })),
      timestamp: new Date()
    }
  }

  /**
   * Retire oldest agent when limit reached
   */
  private async retireOldestAgent(): Promise<void> {
    let oldestAgent: DocumentAgent | null = null
    let oldestTime = Date.now()
    
    for (const agent of this.agents.values()) {
      const lastActivity = new Date(agent.getAgent().lastActivity).getTime()
      if (lastActivity < oldestTime) {
        oldestTime = lastActivity
        oldestAgent = agent
      }
    }
    
    if (oldestAgent) {
      const agentId = oldestAgent.getAgent().id
      console.log(`[Swarm Manager] Retiring oldest agent ${agentId}`)
      await this.removeAgent(agentId)
    }
  }

  /**
   * Check collaboration opportunities for specific agent
   */
  private async checkCollaborationOpportunities(agentId: string): Promise<void> {
    const newAgent = this.agents.get(agentId)
    if (!newAgent) return
    
    const newAgentData = newAgent.getAgent()
    
    // Look for complementary agents
    for (const existingAgent of this.agents.values()) {
      if (existingAgent === newAgent) continue
      
      const existingAgentData = existingAgent.getAgent()
      const compatibility = this.calculateAgentCompatibility(newAgentData, existingAgentData)
      
      if (compatibility > 0.8) {
        await this.initiateCollaboration(
          [newAgentData.id, existingAgentData.id],
          `Welcome collaboration for new ${newAgentData.specialty} agent`
        )
        break // Only one welcome collaboration
      }
    }
  }

  /**
   * Public interface methods
   */
  
  public getSwarmMetrics(): SwarmMetrics {
    return this.calculateSwarmMetrics()
  }

  public getAgents(): Agent[] {
    return Array.from(this.agents.values()).map(agent => agent.getAgent())
  }

  public getAgent(agentId: string): Agent | null {
    const agent = this.agents.get(agentId)
    return agent ? agent.getAgent() : null
  }

  public getCollaborations(): AgentCollaboration[] {
    return Array.from(this.collaborations.values())
  }

  public async sendInstructionToAgent(agentId: string, instruction: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (agent) {
      await agent.sendInstruction(instruction)
    }
  }

  public async pauseAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.pause()
    }
  }

  public async resumeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.resume()
    }
  }

  public destroy(): void {
    this.isActive = false
    
    // Stop swarm intelligence
    if (this.swarmInterval) {
      clearInterval(this.swarmInterval)
    }
    
    // Destroy all agents
    for (const agent of this.agents.values()) {
      agent.destroy()
    }
    
    this.agents.clear()
    this.collaborations.clear()
    this.swarmQueries.clear()
    this.removeAllListeners()
    
    console.log(`[Swarm Manager] Destroyed swarm for user ${this.userId}`)
  }
}