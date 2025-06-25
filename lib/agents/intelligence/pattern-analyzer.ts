/**
 * PRISMY PATTERN ANALYZER
 * Advanced pattern recognition for predictive intelligence
 * Analyzes user behavior, agent performance, and workflow patterns
 */

import { AgentEvent, AgentPattern } from '../document-agent'
import { Agent, Document, TaskResult } from '@/components/workspace/types'
import { SwarmMetrics } from '../agent-manager'
import { agentDatabaseService } from '../database/agent-database-service'

export interface TimePattern {
  hour: number
  dayOfWeek: number
  frequency: number
  confidence: number
  actionType: string
}

export interface WorkflowPattern {
  sequence: string[]
  frequency: number
  confidence: number
  averageDuration: number
  successRate: number
  context: {
    documentTypes: string[]
    agentPersonalities: string[]
    timePatterns: TimePattern[]
  }
}

export interface CollaborationPattern {
  agentCombination: string[]
  objective: string
  frequency: number
  successRate: number
  averageDuration: number
  emergentBehaviors: string[]
}

export interface PerformancePattern {
  agentId: string
  pattern: 'efficiency_decline' | 'efficiency_peak' | 'task_overload' | 'specialization_drift'
  triggerConditions: string[]
  frequency: number
  impact: number
  mitigationStrategies: string[]
}

export class PatternAnalyzer {
  private patterns: Map<string, any[]> = new Map()
  private analysisCache: Map<string, any> = new Map()

  constructor(private userId: string) {}

  /**
   * Analyze all user patterns across different dimensions
   */
  async analyzeAllPatterns(): Promise<{
    timePatterns: TimePattern[]
    workflowPatterns: WorkflowPattern[]
    collaborationPatterns: CollaborationPattern[]
    performancePatterns: PerformancePattern[]
  }> {
    try {
      const [timePatterns, workflowPatterns, collaborationPatterns, performancePatterns] = await Promise.all([
        this.analyzeTimePatterns(),
        this.analyzeWorkflowPatterns(),
        this.analyzeCollaborationPatterns(),
        this.analyzePerformancePatterns()
      ])

      return {
        timePatterns,
        workflowPatterns,
        collaborationPatterns,
        performancePatterns
      }

    } catch (error) {
      console.error('[Pattern Analyzer] Failed to analyze patterns:', error)
      return {
        timePatterns: [],
        workflowPatterns: [],
        collaborationPatterns: [],
        performancePatterns: []
      }
    }
  }

  /**
   * Analyze time-based usage patterns
   */
  async analyzeTimePatterns(): Promise<TimePattern[]> {
    const cacheKey = `time_patterns_${this.userId}`
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)
    }

    try {
      // Get user's agent creation and activity data
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const timeData: { [key: string]: number } = {}

      // Analyze agent creation times
      for (const agent of agents) {
        const createdAt = new Date(agent.created_at)
        const hour = createdAt.getHours()
        const dayOfWeek = createdAt.getDay()
        const key = `${hour}_${dayOfWeek}`
        
        timeData[key] = (timeData[key] || 0) + 1
      }

      // Convert to time patterns
      const patterns: TimePattern[] = []
      
      for (const [key, frequency] of Object.entries(timeData)) {
        if (frequency >= 2) { // Minimum frequency threshold
          const [hour, dayOfWeek] = key.split('_').map(Number)
          
          patterns.push({
            hour,
            dayOfWeek,
            frequency,
            confidence: Math.min(frequency / 10, 1), // Normalize confidence
            actionType: 'agent_creation'
          })
        }
      }

      // Sort by frequency and confidence
      patterns.sort((a, b) => b.frequency - a.frequency)

      this.analysisCache.set(cacheKey, patterns)
      return patterns

    } catch (error) {
      console.error('[Pattern Analyzer] Time pattern analysis failed:', error)
      return []
    }
  }

  /**
   * Analyze workflow patterns
   */
  async analyzeWorkflowPatterns(): Promise<WorkflowPattern[]> {
    const cacheKey = `workflow_patterns_${this.userId}`
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)
    }

    try {
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const collaborations = await agentDatabaseService.getUserCollaborations(this.userId)

      const patterns: WorkflowPattern[] = []

      // Analyze agent creation sequences
      if (agents.length >= 3) {
        const agentSequences = this.extractAgentSequences(agents)
        
        for (const sequence of agentSequences) {
          if (sequence.frequency >= 2) {
            patterns.push({
              sequence: sequence.types,
              frequency: sequence.frequency,
              confidence: sequence.frequency / agents.length,
              averageDuration: sequence.averageDuration,
              successRate: sequence.successRate,
              context: {
                documentTypes: sequence.documentTypes,
                agentPersonalities: sequence.agentPersonalities,
                timePatterns: []
              }
            })
          }
        }
      }

      this.analysisCache.set(cacheKey, patterns)
      return patterns

    } catch (error) {
      console.error('[Pattern Analyzer] Workflow pattern analysis failed:', error)
      return []
    }
  }

  /**
   * Analyze collaboration patterns
   */
  async analyzeCollaborationPatterns(): Promise<CollaborationPattern[]> {
    const cacheKey = `collaboration_patterns_${this.userId}`
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)
    }

    try {
      const collaborations = await agentDatabaseService.getUserCollaborations(this.userId)
      const agents = await agentDatabaseService.getUserAgents(this.userId)

      const patterns: CollaborationPattern[] = []
      const collaborationGroups: Map<string, any[]> = new Map()

      // Group collaborations by participant combinations
      for (const collab of collaborations) {
        const agentPersonalities = collab.participant_ids
          .map(id => agents.find(a => a.id === id)?.personality)
          .filter(Boolean)
          .sort()
        
        const key = agentPersonalities.join(',')
        if (!collaborationGroups.has(key)) {
          collaborationGroups.set(key, [])
        }
        collaborationGroups.get(key)!.push(collab)
      }

      // Analyze patterns in each group
      for (const [combination, collabs] of collaborationGroups) {
        if (collabs.length >= 2) {
          const completedCollabs = collabs.filter(c => c.completed_at)
          const successRate = completedCollabs.length / collabs.length
          
          const averageDuration = completedCollabs.length > 0 
            ? completedCollabs.reduce((sum, c) => {
                const duration = new Date(c.completed_at!).getTime() - new Date(c.started_at).getTime()
                return sum + duration
              }, 0) / completedCollabs.length
            : 0

          patterns.push({
            agentCombination: combination.split(','),
            objective: this.findCommonObjective(collabs),
            frequency: collabs.length,
            successRate,
            averageDuration,
            emergentBehaviors: this.identifyEmergentBehaviors(collabs)
          })
        }
      }

      this.analysisCache.set(cacheKey, patterns)
      return patterns

    } catch (error) {
      console.error('[Pattern Analyzer] Collaboration pattern analysis failed:', error)
      return []
    }
  }

  /**
   * Analyze agent performance patterns
   */
  async analyzePerformancePatterns(): Promise<PerformancePattern[]> {
    const cacheKey = `performance_patterns_${this.userId}`
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)
    }

    try {
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const patterns: PerformancePattern[] = []

      for (const agent of agents) {
        const agentPatterns = await this.analyzeAgentPerformance(agent)
        patterns.push(...agentPatterns)
      }

      this.analysisCache.set(cacheKey, patterns)
      return patterns

    } catch (error) {
      console.error('[Pattern Analyzer] Performance pattern analysis failed:', error)
      return []
    }
  }

  /**
   * Detect pattern anomalies that might indicate problems or opportunities
   */
  async detectAnomalies(): Promise<{
    efficiencyDrops: Array<{ agentId: string, severity: number, description: string }>
    unusualBehaviors: Array<{ pattern: string, deviation: number, description: string }>
    opportunities: Array<{ type: string, confidence: number, description: string }>
  }> {
    try {
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const analytics = await agentDatabaseService.getAnalyticsData(this.userId, 7) // Last 7 days

      const anomalies = {
        efficiencyDrops: [] as Array<{ agentId: string, severity: number, description: string }>,
        unusualBehaviors: [] as Array<{ pattern: string, deviation: number, description: string }>,
        opportunities: [] as Array<{ type: string, confidence: number, description: string }>
      }

      // Detect efficiency drops
      for (const agent of agents) {
        if (agent.efficiency < 50) {
          anomalies.efficiencyDrops.push({
            agentId: agent.id,
            severity: (50 - agent.efficiency) / 50,
            description: `Agent ${agent.name} có hiệu suất thấp (${agent.efficiency}%)`
          })
        }
      }

      // Detect collaboration opportunities
      if (agents.length >= 2 && analytics.collaborations?.active === 0) {
        anomalies.opportunities.push({
          type: 'collaboration',
          confidence: 0.7,
          description: 'Có thể tạo collaboration giữa các agent để tăng hiệu quả'
        })
      }

      // Detect specialization opportunities
      const generalAgents = agents.filter(a => a.personality === 'general')
      if (generalAgents.length > 3) {
        anomalies.opportunities.push({
          type: 'specialization',
          confidence: 0.8,
          description: 'Nên chuyên hóa một số agent thành legal, financial, hoặc research'
        })
      }

      return anomalies

    } catch (error) {
      console.error('[Pattern Analyzer] Anomaly detection failed:', error)
      return {
        efficiencyDrops: [],
        unusualBehaviors: [],
        opportunities: []
      }
    }
  }

  /**
   * Predict future patterns based on historical data
   */
  async predictFuturePatterns(): Promise<{
    nextDocumentUpload: { probability: number, timeframe: string, documentType?: string }
    nextCollaboration: { probability: number, agentCombination?: string[] }
    peakUsageTime: { hour: number, dayOfWeek: number, confidence: number }
  }> {
    try {
      const timePatterns = await this.analyzeTimePatterns()
      const workflowPatterns = await this.analyzeWorkflowPatterns()
      const collaborationPatterns = await this.analyzeCollaborationPatterns()

      // Find peak usage time
      const peakPattern = timePatterns.reduce((max, pattern) => 
        pattern.frequency > max.frequency ? pattern : max
      , timePatterns[0] || { hour: 9, dayOfWeek: 1, frequency: 0, confidence: 0, actionType: '' })

      // Predict next document upload
      const now = new Date()
      const currentHour = now.getHours()
      const currentDay = now.getDay()
      
      const matchingTimePattern = timePatterns.find(p => 
        Math.abs(p.hour - currentHour) <= 2 && p.dayOfWeek === currentDay
      )

      const nextUploadProbability = matchingTimePattern ? matchingTimePattern.confidence : 0.2

      // Predict next collaboration
      const recentCollabPattern = collaborationPatterns
        .sort((a, b) => b.frequency - a.frequency)[0]
      
      const nextCollabProbability = recentCollabPattern ? 
        Math.min(recentCollabPattern.frequency / 10, 0.8) : 0.1

      return {
        nextDocumentUpload: {
          probability: nextUploadProbability,
          timeframe: matchingTimePattern ? 'Trong 2 giờ tới' : 'Trong ngày hôm nay',
          documentType: this.predictDocumentType(workflowPatterns)
        },
        nextCollaboration: {
          probability: nextCollabProbability,
          agentCombination: recentCollabPattern?.agentCombination
        },
        peakUsageTime: {
          hour: peakPattern.hour,
          dayOfWeek: peakPattern.dayOfWeek,
          confidence: peakPattern.confidence
        }
      }

    } catch (error) {
      console.error('[Pattern Analyzer] Future pattern prediction failed:', error)
      return {
        nextDocumentUpload: { probability: 0.2, timeframe: 'Unknown' },
        nextCollaboration: { probability: 0.1 },
        peakUsageTime: { hour: 9, dayOfWeek: 1, confidence: 0 }
      }
    }
  }

  /**
   * Helper methods
   */
  private extractAgentSequences(agents: any[]): Array<{
    types: string[]
    frequency: number
    averageDuration: number
    successRate: number
    documentTypes: string[]
    agentPersonalities: string[]
  }> {
    // Simplified sequence extraction - would be more sophisticated in production
    const sequences: Map<string, any> = new Map()
    
    // Group by creation day and analyze sequences
    const agentsByDay = agents.reduce((groups, agent) => {
      const day = new Date(agent.created_at).toDateString()
      if (!groups[day]) groups[day] = []
      groups[day].push(agent)
      return groups
    }, {} as Record<string, any[]>)

    for (const dayAgents of Object.values(agentsByDay)) {
      if (dayAgents.length >= 2) {
        const types = dayAgents.map(a => a.personality).sort()
        const key = types.join(',')
        
        if (!sequences.has(key)) {
          sequences.set(key, {
            types,
            frequency: 0,
            averageDuration: 0,
            successRate: 1,
            documentTypes: [],
            agentPersonalities: types
          })
        }
        
        sequences.get(key).frequency++
      }
    }

    return Array.from(sequences.values())
  }

  private findCommonObjective(collaborations: any[]): string {
    // Simplified - would analyze actual objectives in production
    return 'Document processing and analysis'
  }

  private identifyEmergentBehaviors(collaborations: any[]): string[] {
    // Simplified - would identify actual emergent behaviors
    return ['Cross-domain insights', 'Parallel processing', 'Knowledge synthesis']
  }

  private async analyzeAgentPerformance(agent: any): Promise<PerformancePattern[]> {
    const patterns: PerformancePattern[] = []
    
    // Check for efficiency decline
    if (agent.efficiency < 60) {
      patterns.push({
        agentId: agent.id,
        pattern: 'efficiency_decline',
        triggerConditions: ['high task load', 'memory overflow', 'lack of specialization'],
        frequency: 1,
        impact: (60 - agent.efficiency) / 60,
        mitigationStrategies: [
          'Reduce concurrent tasks',
          'Clear agent memory',
          'Provide specific training data',
          'Restart agent if necessary'
        ]
      })
    }

    // Check for task overload
    if (agent.tasks_in_progress > 5) {
      patterns.push({
        agentId: agent.id,
        pattern: 'task_overload',
        triggerConditions: ['too many concurrent tasks', 'insufficient processing time'],
        frequency: 1,
        impact: Math.min(agent.tasks_in_progress / 10, 1),
        mitigationStrategies: [
          'Distribute tasks to other agents',
          'Implement task prioritization',
          'Create collaboration for complex tasks'
        ]
      })
    }

    return patterns
  }

  private predictDocumentType(workflowPatterns: WorkflowPattern[]): string | undefined {
    if (workflowPatterns.length === 0) return undefined
    
    const mostCommon = workflowPatterns
      .sort((a, b) => b.frequency - a.frequency)[0]
    
    return mostCommon.context.documentTypes[0]
  }

  /**
   * Clear analysis cache
   */
  public clearCache(): void {
    this.analysisCache.clear()
    console.log('[Pattern Analyzer] Analysis cache cleared')
  }
}

export default PatternAnalyzer