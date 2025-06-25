/**
 * PRISMY AGENT DATABASE SERVICE
 * Handles persistent storage and retrieval of agent state, memory, and collaborations
 * Provides high-level abstraction over the agent database schema
 */

import { createClient } from '@supabase/supabase-js'
import { Agent, Document, Task, TaskResult, AgentCapability } from '@/components/workspace/types'
import { AgentMemory, AgentEvent, AgentPattern, AgentGoal, AutonomousContext } from '../document-agent'
import { AgentCollaboration, SwarmMetrics, SwarmQuery, SwarmQueryResponse } from '../agent-manager'

export interface PersistedAgent {
  id: string
  user_id: string
  document_id: string
  document_title: string
  document_type: string
  personality: 'legal' | 'financial' | 'project' | 'research' | 'general'
  name: string
  name_vi: string
  specialty: string
  specialty_vi: string
  avatar: string
  status: 'active' | 'thinking' | 'idle' | 'paused' | 'error' | 'retired'
  autonomy_level: number
  efficiency: number
  tasks_completed: number
  tasks_in_progress: number
  memory_data: AgentMemory
  goals: AgentGoal[]
  capabilities: AgentCapability[]
  cultural_context: string
  language: string
  created_at: string
  updated_at: string
  last_activity: string
}

export interface AgentPerformanceMetrics {
  id: string
  agent_id: string
  efficiency: number
  tasks_completed_delta: number
  average_confidence: number
  collaboration_rate: number
  specialization_focus: number
  measurement_context: any
  measured_at: string
}

export interface CollaborationRecord {
  id: string
  user_id: string
  objective: string
  status: 'forming' | 'active' | 'completed' | 'failed' | 'cancelled'
  priority: number
  participant_ids: string[]
  participant_count: number
  results?: any
  success_metrics?: any
  started_at: string
  completed_at?: string
}

export interface KnowledgeRecord {
  id: string
  source_agent_id: string
  knowledge_type: 'insight' | 'pattern' | 'best_practice' | 'warning'
  title: string
  content: string
  confidence: number
  domain: string
  tags: string[]
  applicable_contexts: any
  validation_score: number
  usage_count: number
  success_rate: number
  created_at: string
  updated_at: string
}

export class AgentDatabaseService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  /**
   * Create a new persistent agent
   */
  async createAgent(userId: string, document: Document, agent: Agent): Promise<PersistedAgent> {
    const agentData = {
      user_id: userId,
      document_id: document.id,
      document_title: document.title,
      document_type: document.type,
      personality: this.mapPersonality(agent.specialty),
      name: agent.name,
      name_vi: agent.nameVi,
      specialty: agent.specialty,
      specialty_vi: agent.specialtyVi,
      avatar: agent.avatar,
      status: agent.status,
      autonomy_level: 75, // Default autonomy level
      efficiency: agent.efficiency,
      tasks_completed: agent.tasksCompleted,
      tasks_in_progress: agent.tasksInProgress,
      memory_data: {
        shortTerm: [],
        longTerm: [],
        lastActivity: new Date()
      },
      goals: [],
      capabilities: agent.capabilities || [],
      cultural_context: agent.culturalContext,
      language: 'vi'
    }

    const { data, error } = await this.supabase
      .from('document_agents')
      .insert(agentData)
      .select()
      .single()

    if (error) {
      console.error('[Agent DB Service] Create agent error:', error)
      throw new Error(`Failed to create agent: ${error.message}`)
    }

    return data
  }

  /**
   * Update agent state
   */
  async updateAgent(agentId: string, updates: Partial<PersistedAgent>): Promise<PersistedAgent> {
    const { data, error } = await this.supabase
      .from('document_agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single()

    if (error) {
      console.error('[Agent DB Service] Update agent error:', error)
      throw new Error(`Failed to update agent: ${error.message}`)
    }

    return data
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<PersistedAgent | null> {
    const { data, error } = await this.supabase
      .from('document_agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('[Agent DB Service] Get agent error:', error)
      throw new Error(`Failed to get agent: ${error.message}`)
    }

    return data
  }

  /**
   * Get all agents for a user
   */
  async getUserAgents(userId: string, status?: string[]): Promise<PersistedAgent[]> {
    let query = this.supabase
      .from('document_agents')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false })

    if (status && status.length > 0) {
      query = query.in('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Agent DB Service] Get user agents error:', error)
      throw new Error(`Failed to get user agents: ${error.message}`)
    }

    return data || []
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('document_agents')
      .delete()
      .eq('id', agentId)

    if (error) {
      console.error('[Agent DB Service] Delete agent error:', error)
      throw new Error(`Failed to delete agent: ${error.message}`)
    }
  }

  /**
   * Save agent memory event
   */
  async saveMemoryEvent(agentId: string, event: AgentEvent): Promise<void> {
    const { error } = await this.supabase
      .from('agent_memory_events')
      .insert({
        agent_id: agentId,
        event_type: event.type,
        event_data: event.data,
        importance: event.importance
      })

    if (error) {
      console.error('[Agent DB Service] Save memory event error:', error)
      // Don't throw - memory events are not critical
    }
  }

  /**
   * Get agent memory events
   */
  async getMemoryEvents(agentId: string, limit: number = 100): Promise<AgentEvent[]> {
    const { data, error } = await this.supabase
      .from('agent_memory_events')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Agent DB Service] Get memory events error:', error)
      return []
    }

    return data.map(row => ({
      id: row.id,
      type: row.event_type,
      data: row.event_data,
      timestamp: new Date(row.created_at),
      importance: row.importance
    }))
  }

  /**
   * Save agent memory pattern
   */
  async saveMemoryPattern(agentId: string, pattern: AgentPattern): Promise<void> {
    const { error } = await this.supabase
      .from('agent_memory_patterns')
      .upsert({
        agent_id: agentId,
        pattern: pattern.pattern,
        frequency: pattern.frequency,
        confidence: pattern.confidence,
        last_seen: new Date()
      })

    if (error) {
      console.error('[Agent DB Service] Save memory pattern error:', error)
      // Don't throw - patterns are not critical
    }
  }

  /**
   * Get agent memory patterns
   */
  async getMemoryPatterns(agentId: string): Promise<AgentPattern[]> {
    const { data, error } = await this.supabase
      .from('agent_memory_patterns')
      .select('*')
      .eq('agent_id', agentId)
      .order('frequency', { ascending: false })

    if (error) {
      console.error('[Agent DB Service] Get memory patterns error:', error)
      return []
    }

    return data.map(row => ({
      id: row.id,
      pattern: row.pattern,
      frequency: row.frequency,
      confidence: row.confidence,
      lastSeen: new Date(row.last_seen)
    }))
  }

  /**
   * Save task result
   */
  async saveTaskResult(agentId: string, taskResult: TaskResult): Promise<void> {
    const { error } = await this.supabase
      .from('agent_task_results')
      .insert({
        agent_id: agentId,
        task_type: taskResult.type,
        result_type: taskResult.type,
        content: taskResult.content,
        confidence: taskResult.confidence,
        metadata: taskResult.metadata,
        processing_time: taskResult.metadata?.processingTime,
        ai_provider: taskResult.metadata?.provider,
        ai_model: taskResult.metadata?.model,
        tokens_used: taskResult.metadata?.tokensUsed
      })

    if (error) {
      console.error('[Agent DB Service] Save task result error:', error)
      // Don't throw - task results are not critical for operation
    }
  }

  /**
   * Create collaboration
   */
  async createCollaboration(
    userId: string, 
    objective: string, 
    participantIds: string[],
    priority: number = 0.5
  ): Promise<CollaborationRecord> {
    // Insert collaboration
    const { data: collaboration, error: collabError } = await this.supabase
      .from('agent_collaborations')
      .insert({
        user_id: userId,
        objective,
        participant_ids: participantIds,
        priority,
        status: 'forming'
      })
      .select()
      .single()

    if (collabError) {
      console.error('[Agent DB Service] Create collaboration error:', collabError)
      throw new Error(`Failed to create collaboration: ${collabError.message}`)
    }

    // Insert participants
    const participants = participantIds.map(agentId => ({
      collaboration_id: collaboration.id,
      agent_id: agentId,
      role: 'participant'
    }))

    const { error: participantError } = await this.supabase
      .from('collaboration_participants')
      .insert(participants)

    if (participantError) {
      console.error('[Agent DB Service] Create collaboration participants error:', participantError)
      // Cleanup collaboration if participants failed
      await this.supabase.from('agent_collaborations').delete().eq('id', collaboration.id)
      throw new Error(`Failed to create collaboration participants: ${participantError.message}`)
    }

    return collaboration
  }

  /**
   * Update collaboration status
   */
  async updateCollaboration(
    collaborationId: string, 
    updates: Partial<CollaborationRecord>
  ): Promise<CollaborationRecord> {
    const { data, error } = await this.supabase
      .from('agent_collaborations')
      .update(updates)
      .eq('id', collaborationId)
      .select()
      .single()

    if (error) {
      console.error('[Agent DB Service] Update collaboration error:', error)
      throw new Error(`Failed to update collaboration: ${error.message}`)
    }

    return data
  }

  /**
   * Get user collaborations
   */
  async getUserCollaborations(userId: string, status?: string[]): Promise<CollaborationRecord[]> {
    let query = this.supabase
      .from('agent_collaborations')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (status && status.length > 0) {
      query = query.in('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Agent DB Service] Get user collaborations error:', error)
      throw new Error(`Failed to get user collaborations: ${error.message}`)
    }

    return data || []
  }

  /**
   * Record performance metrics
   */
  async recordPerformanceMetrics(agentId: string, metrics: any): Promise<void> {
    const { error } = await this.supabase
      .from('agent_performance_metrics')
      .insert({
        agent_id: agentId,
        efficiency: metrics.efficiency,
        tasks_completed_delta: metrics.tasksCompletedDelta || 0,
        average_confidence: metrics.averageConfidence,
        collaboration_rate: metrics.collaborationRate,
        specialization_focus: metrics.specializationFocus,
        measurement_context: metrics.context || {}
      })

    if (error) {
      console.error('[Agent DB Service] Record performance metrics error:', error)
      // Don't throw - metrics are not critical
    }
  }

  /**
   * Record swarm metrics
   */
  async recordSwarmMetrics(userId: string, metrics: SwarmMetrics): Promise<void> {
    const { error } = await this.supabase
      .from('swarm_metrics')
      .insert({
        user_id: userId,
        total_agents: metrics.totalAgents,
        active_agents: metrics.activeAgents,
        total_collaborations: metrics.totalCollaborations,
        average_efficiency: metrics.averageEfficiency,
        emergent_behaviors: metrics.emergentBehaviors,
        collective_intelligence: metrics.collectiveIntelligence
      })

    if (error) {
      console.error('[Agent DB Service] Record swarm metrics error:', error)
      // Don't throw - metrics are not critical
    }
  }

  /**
   * Create swarm query
   */
  async createSwarmQuery(
    userId: string, 
    query: string, 
    timeout: number = 30000,
    requiredAgents?: string[]
  ): Promise<SwarmQuery> {
    const { data, error } = await this.supabase
      .from('swarm_queries')
      .insert({
        user_id: userId,
        query,
        timeout,
        required_agents: requiredAgents,
        status: 'processing'
      })
      .select()
      .single()

    if (error) {
      console.error('[Agent DB Service] Create swarm query error:', error)
      throw new Error(`Failed to create swarm query: ${error.message}`)
    }

    return {
      id: data.id,
      query: data.query,
      timeout: data.timeout,
      requiredAgents: data.required_agents,
      responses: [],
      aggregatedResult: data.aggregated_result
    }
  }

  /**
   * Save swarm query response
   */
  async saveSwarmQueryResponse(
    queryId: string, 
    agentId: string, 
    response: SwarmQueryResponse
  ): Promise<void> {
    const { error } = await this.supabase
      .from('swarm_query_responses')
      .insert({
        query_id: queryId,
        agent_id: agentId,
        response: response.response,
        confidence: response.confidence,
        response_time: Date.now() - response.timestamp.getTime()
      })

    if (error) {
      console.error('[Agent DB Service] Save swarm query response error:', error)
      // Don't throw - individual responses failing shouldn't break the swarm query
    }
  }

  /**
   * Complete swarm query
   */
  async completeSwarmQuery(queryId: string, aggregatedResult: any): Promise<void> {
    const { error } = await this.supabase
      .from('swarm_queries')
      .update({
        status: 'completed',
        aggregated_result: aggregatedResult,
        completed_at: new Date().toISOString()
      })
      .eq('id', queryId)

    if (error) {
      console.error('[Agent DB Service] Complete swarm query error:', error)
      // Don't throw - query completion errors are not critical
    }
  }

  /**
   * Restore agent memory from database
   */
  async restoreAgentMemory(agentId: string): Promise<AgentMemory> {
    const [events, patterns] = await Promise.all([
      this.getMemoryEvents(agentId, 100),
      this.getMemoryPatterns(agentId)
    ])

    return {
      shortTerm: events,
      longTerm: patterns,
      lastActivity: events.length > 0 ? events[0].timestamp : new Date()
    }
  }

  /**
   * Clean up old data (maintenance function)
   */
  async cleanupOldData(retentionDays: number = 90): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    // Clean up old memory events
    await this.supabase
      .from('agent_memory_events')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    // Clean up old performance metrics
    await this.supabase
      .from('agent_performance_metrics')
      .delete()
      .lt('measured_at', cutoffDate.toISOString())

    // Clean up completed collaborations older than retention period
    await this.supabase
      .from('agent_collaborations')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', cutoffDate.toISOString())

    console.log(`[Agent DB Service] Cleaned up data older than ${retentionDays} days`)
  }

  /**
   * Get analytics data for dashboard
   */
  async getAnalyticsData(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [agents, collaborations, taskResults, swarmMetrics] = await Promise.all([
      this.getUserAgents(userId),
      this.getUserCollaborations(userId),
      this.getRecentTaskResults(userId, days),
      this.getRecentSwarmMetrics(userId, days)
    ])

    return {
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        byPersonality: this.groupBy(agents, 'personality'),
        avgEfficiency: agents.reduce((sum, a) => sum + a.efficiency, 0) / Math.max(agents.length, 1)
      },
      collaborations: {
        total: collaborations.length,
        active: collaborations.filter(c => c.status === 'active').length,
        completed: collaborations.filter(c => c.status === 'completed').length,
        avgDuration: this.calculateAverageCollaborationDuration(collaborations)
      },
      tasks: {
        total: taskResults.length,
        avgConfidence: taskResults.reduce((sum, t) => sum + t.confidence, 0) / Math.max(taskResults.length, 1),
        byType: this.groupBy(taskResults, 'task_type')
      },
      swarmMetrics: swarmMetrics[0] || null,
      timeline: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        dataPoints: days
      }
    }
  }

  /**
   * Helper methods
   */
  private mapPersonality(specialty: string): 'legal' | 'financial' | 'project' | 'research' | 'general' {
    if (specialty.toLowerCase().includes('legal')) return 'legal'
    if (specialty.toLowerCase().includes('financial')) return 'financial'
    if (specialty.toLowerCase().includes('project')) return 'project'
    if (specialty.toLowerCase().includes('research')) return 'research'
    return 'general'
  }

  private async getRecentTaskResults(userId: string, days: number): Promise<any[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('agent_task_results')
      .select(`
        *,
        document_agents!inner(user_id)
      `)
      .eq('document_agents.user_id', userId)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('[Agent DB Service] Get recent task results error:', error)
      return []
    }

    return data || []
  }

  private async getRecentSwarmMetrics(userId: string, days: number): Promise<any[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('swarm_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('measured_at', startDate.toISOString())
      .order('measured_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[Agent DB Service] Get recent swarm metrics error:', error)
      return []
    }

    return data || []
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((groups, item) => {
      const value = item[key] || 'unknown'
      groups[value] = (groups[value] || 0) + 1
      return groups
    }, {})
  }

  private calculateAverageCollaborationDuration(collaborations: CollaborationRecord[]): number {
    const completed = collaborations.filter(c => c.completed_at && c.started_at)
    if (completed.length === 0) return 0

    const totalDuration = completed.reduce((sum, c) => {
      const duration = new Date(c.completed_at!).getTime() - new Date(c.started_at).getTime()
      return sum + duration
    }, 0)

    return totalDuration / completed.length / (1000 * 60) // Return average duration in minutes
  }
}

// Export singleton instance
export const agentDatabaseService = new AgentDatabaseService()
export default agentDatabaseService