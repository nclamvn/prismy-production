/**
 * PRISMY PREDICTIVE INTELLIGENCE
 * AI-powered system that predicts user needs and agent behaviors
 * Analyzes patterns, context, and historical data to provide proactive insights
 */

import { Agent, Document, TaskResult } from '@/components/workspace/types'
import { AgentMemory, AgentEvent, AgentPattern } from '../document-agent'
import { SwarmMetrics, AgentCollaboration } from '../agent-manager'
import { agentDatabaseService } from '../database/agent-database-service'
import { aiProviderManager } from '../../ai/providers/ai-provider-manager'
import PatternAnalyzer, { TimePattern, WorkflowPattern, CollaborationPattern, PerformancePattern } from './pattern-analyzer'

export interface PredictiveInsight {
  id: string
  type: 'user_need' | 'agent_optimization' | 'collaboration_opportunity' | 'document_requirement'
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  expectedTime: string
  suggestedActions: string[]
  basedOn: {
    patterns: string[]
    historicalData: string[]
    contextualFactors: string[]
  }
  metadata: {
    agentIds?: string[]
    documentIds?: string[]
    collaborationId?: string
    predictedAt: string
    validUntil: string
  }
}

export interface UserBehaviorPattern {
  pattern: string
  frequency: number
  confidence: number
  context: {
    timeOfDay?: string[]
    dayOfWeek?: string[]
    documentTypes?: string[]
    agentPersonalities?: string[]
  }
  outcome: {
    actionTaken: string
    successRate: number
    averageTimeToAction: number
  }
}

export interface PredictiveContext {
  currentTime: Date
  recentDocuments: Document[]
  activeAgents: Agent[]
  userActivity: {
    uploadFrequency: number
    preferredDocumentTypes: string[]
    collaborationPatterns: string[]
    timePatterns: string[]
  }
  swarmState: {
    metrics: SwarmMetrics
    collaborations: AgentCollaboration[]
    efficiency: number
  }
}

export class PredictiveIntelligenceService {
  private insights: Map<string, PredictiveInsight> = new Map()
  private userPatterns: Map<string, UserBehaviorPattern[]> = new Map()
  private predictionInterval?: NodeJS.Timeout
  private patternAnalyzer: PatternAnalyzer

  constructor(private userId: string) {
    this.patternAnalyzer = new PatternAnalyzer(userId)
    this.startPredictiveAnalysis()
  }

  /**
   * Start continuous predictive analysis
   */
  private startPredictiveAnalysis(): void {
    // Run predictive analysis every 5 minutes
    this.predictionInterval = setInterval(async () => {
      await this.generatePredictiveInsights()
    }, 5 * 60 * 1000)

    console.log(`[Predictive Intelligence] Started for user ${this.userId}`)
  }

  /**
   * Generate predictive insights based on current context
   */
  async generatePredictiveInsights(): Promise<PredictiveInsight[]> {
    try {
      const context = await this.gatherPredictiveContext()
      const patterns = await this.analyzeUserPatterns(context)
      
      const insights: PredictiveInsight[] = []

      // Predict user document needs
      const documentPredictions = await this.predictDocumentNeeds(context, patterns)
      insights.push(...documentPredictions)

      // Predict agent optimization opportunities
      const agentOptimizations = await this.predictAgentOptimizations(context, patterns)
      insights.push(...agentOptimizations)

      // Predict collaboration opportunities
      const collaborationOpportunities = await this.predictCollaborationOpportunities(context, patterns)
      insights.push(...collaborationOpportunities)

      // Predict workflow improvements
      const workflowPredictions = await this.predictWorkflowImprovements(context, patterns)
      insights.push(...workflowPredictions)

      // Store insights
      for (const insight of insights) {
        this.insights.set(insight.id, insight)
      }

      // Clean up expired insights
      this.cleanupExpiredInsights()

      console.log(`[Predictive Intelligence] Generated ${insights.length} new insights`)
      return insights

    } catch (error) {
      console.error('[Predictive Intelligence] Failed to generate insights:', error)
      return []
    }
  }

  /**
   * Predict what documents user might need next
   */
  private async predictDocumentNeeds(
    context: PredictiveContext, 
    patterns: UserBehaviorPattern[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = []

    // Analyze document upload patterns
    const documentPatterns = patterns.filter(p => p.pattern.includes('document'))
    
    for (const pattern of documentPatterns) {
      if (pattern.confidence > 0.7 && pattern.frequency > 5) {
        const prediction = await this.generateDocumentNeedPrediction(pattern, context)
        if (prediction) insights.push(prediction)
      }
    }

    // AI-powered analysis of document sequence patterns
    if (context.recentDocuments.length >= 3) {
      const aiPrediction = await this.aiPredictNextDocument(context)
      if (aiPrediction) insights.push(aiPrediction)
    }

    return insights
  }

  /**
   * Predict agent optimization opportunities
   */
  private async predictAgentOptimizations(
    context: PredictiveContext, 
    patterns: UserBehaviorPattern[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = []

    // Analyze agent efficiency patterns
    for (const agent of context.activeAgents) {
      if (agent.efficiency < 60) {
        const optimization = await this.generateAgentOptimizationPrediction(agent, context)
        if (optimization) insights.push(optimization)
      }
    }

    // Predict agent specialization needs
    const specializationNeeds = await this.predictSpecializationNeeds(context, patterns)
    insights.push(...specializationNeeds)

    return insights
  }

  /**
   * Predict collaboration opportunities
   */
  private async predictCollaborationOpportunities(
    context: PredictiveContext, 
    patterns: UserBehaviorPattern[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = []

    // Find agents that would benefit from collaboration
    const collaborationCandidates = await this.findCollaborationCandidates(context)
    
    for (const candidate of collaborationCandidates) {
      const prediction = await this.generateCollaborationPrediction(candidate, context)
      if (prediction) insights.push(prediction)
    }

    return insights
  }

  /**
   * Predict workflow improvements
   */
  private async predictWorkflowImprovements(
    context: PredictiveContext, 
    patterns: UserBehaviorPattern[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = []

    // Analyze workflow bottlenecks
    const bottleneckPatterns = patterns.filter(p => 
      p.outcome.successRate < 0.8 || p.outcome.averageTimeToAction > 300000 // 5 minutes
    )

    for (const bottleneck of bottleneckPatterns) {
      const improvement = await this.generateWorkflowImprovementPrediction(bottleneck, context)
      if (improvement) insights.push(improvement)
    }

    return insights
  }

  /**
   * AI-powered document need prediction
   */
  private async aiPredictNextDocument(context: PredictiveContext): Promise<PredictiveInsight | null> {
    try {
      const recentDocs = context.recentDocuments.slice(0, 5)
      const analysisRequest = {
        documentContent: `Recent document sequence analysis: ${recentDocs.map(d => `${d.type}:${d.title}`).join(', ')}. User activity patterns: upload frequency ${context.userActivity.uploadFrequency}, preferred types: ${context.userActivity.preferredDocumentTypes.join(', ')}`,
        documentType: 'pattern_analysis',
        focus: 'daily_insights' as const,
        personality: 'general',
        language: 'vi' as const,
        culturalContext: 'Vietnam' as const
      }

      const analysis = await aiProviderManager.analyzeDocument(analysisRequest)
      
      if (analysis.confidence > 0.6) {
        return {
          id: `doc-pred-${Date.now()}`,
          type: 'document_requirement',
          title: 'Dự đoán tài liệu tiếp theo',
          description: analysis.insights,
          confidence: analysis.confidence,
          priority: analysis.confidence > 0.8 ? 'high' : 'medium',
          expectedTime: this.calculateExpectedTime(context),
          suggestedActions: analysis.keyPoints || [],
          basedOn: {
            patterns: ['document sequence analysis'],
            historicalData: ['recent uploads', 'user behavior'],
            contextualFactors: ['time patterns', 'workflow context']
          },
          metadata: {
            documentIds: recentDocs.map(d => d.id),
            predictedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
          }
        }
      }

      return null

    } catch (error) {
      console.error('[Predictive Intelligence] AI document prediction failed:', error)
      return null
    }
  }

  /**
   * Generate document need prediction from patterns
   */
  private async generateDocumentNeedPrediction(
    pattern: UserBehaviorPattern, 
    context: PredictiveContext
  ): Promise<PredictiveInsight | null> {
    const currentHour = context.currentTime.getHours()
    const currentDay = context.currentTime.getDay()

    // Check if current time matches pattern context
    const timeMatch = !pattern.context.timeOfDay || 
      pattern.context.timeOfDay.some(hour => Math.abs(parseInt(hour) - currentHour) <= 1)
    const dayMatch = !pattern.context.dayOfWeek || 
      pattern.context.dayOfWeek.includes(currentDay.toString())

    if (timeMatch && dayMatch) {
      return {
        id: `doc-pattern-${Date.now()}`,
        type: 'document_requirement',
        title: `Có thể cần ${pattern.context.documentTypes?.[0] || 'tài liệu'} mới`,
        description: `Dựa trên mô hình hoạt động, bạn thường ${pattern.outcome.actionTaken} vào thời điểm này`,
        confidence: pattern.confidence,
        priority: pattern.confidence > 0.8 ? 'high' : 'medium',
        expectedTime: this.calculateExpectedTimeFromPattern(pattern),
        suggestedActions: [
          'Chuẩn bị tài liệu trước',
          'Kích hoạt agent phù hợp',
          'Thiết lập collaboration nếu cần'
        ],
        basedOn: {
          patterns: [pattern.pattern],
          historicalData: [`${pattern.frequency} lần trong quá khứ`],
          contextualFactors: ['time pattern', 'frequency pattern']
        },
        metadata: {
          predictedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        }
      }
    }

    return null
  }

  /**
   * Generate agent optimization prediction
   */
  private async generateAgentOptimizationPrediction(
    agent: Agent, 
    context: PredictiveContext
  ): Promise<PredictiveInsight | null> {
    const suggestions = []
    
    if (agent.efficiency < 40) {
      suggestions.push('Restart agent để reset trạng thái')
      suggestions.push('Kiểm tra workload và giảm số task')
    } else if (agent.efficiency < 60) {
      suggestions.push('Tối ưu hóa memory và patterns')
      suggestions.push('Cần thêm context hoặc training data')
    }

    if (agent.tasksInProgress > 5) {
      suggestions.push('Chia nhỏ tasks để tăng focus')
    }

    return {
      id: `agent-opt-${agent.id}-${Date.now()}`,
      type: 'agent_optimization',
      title: `Tối ưu hóa Agent ${agent.name}`,
      description: `Agent hiệu suất ${agent.efficiency}% - có thể cải thiện`,
      confidence: 0.8,
      priority: agent.efficiency < 40 ? 'urgent' : 'medium',
      expectedTime: 'Trong 30 phút tới',
      suggestedActions: suggestions,
      basedOn: {
        patterns: ['low efficiency pattern'],
        historicalData: [`${agent.tasksCompleted} tasks completed`],
        contextualFactors: ['current workload', 'agent status']
      },
      metadata: {
        agentIds: [agent.id],
        predictedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      }
    }
  }

  /**
   * Gather comprehensive context for predictions
   */
  private async gatherPredictiveContext(): Promise<PredictiveContext> {
    try {
      const [agents, analytics] = await Promise.all([
        agentDatabaseService.getUserAgents(this.userId, ['active', 'thinking', 'idle']),
        agentDatabaseService.getAnalyticsData(this.userId, 30)
      ])

      const activeAgents: Agent[] = agents.map(a => ({
        id: a.id,
        name: a.name,
        nameVi: a.name_vi,
        specialty: a.specialty,
        specialtyVi: a.specialty_vi,
        avatar: a.avatar,
        status: a.status as any,
        efficiency: a.efficiency,
        tasksCompleted: a.tasks_completed,
        tasksInProgress: a.tasks_in_progress,
        capabilities: a.capabilities,
        culturalContext: a.cultural_context,
        personality: a.personality,
        personalityVi: a.personality,
        lastActivity: a.last_activity
      }))

      return {
        currentTime: new Date(),
        recentDocuments: [], // Would be populated from document upload history
        activeAgents,
        userActivity: {
          uploadFrequency: analytics.tasks?.total || 0,
          preferredDocumentTypes: Object.keys(analytics.tasks?.byType || {}),
          collaborationPatterns: [],
          timePatterns: []
        },
        swarmState: {
          metrics: {
            totalAgents: analytics.agents?.total || 0,
            activeAgents: analytics.agents?.active || 0,
            totalCollaborations: analytics.collaborations?.total || 0,
            averageEfficiency: analytics.agents?.avgEfficiency || 0,
            emergentBehaviors: [],
            collectiveIntelligence: 0
          },
          collaborations: [],
          efficiency: analytics.agents?.avgEfficiency || 0
        }
      }

    } catch (error) {
      console.error('[Predictive Intelligence] Failed to gather context:', error)
      return this.getDefaultContext()
    }
  }

  /**
   * Analyze user behavior patterns
   */
  private async analyzeUserPatterns(context: PredictiveContext): Promise<UserBehaviorPattern[]> {
    try {
      // Get comprehensive pattern analysis
      const patternAnalysis = await this.patternAnalyzer.analyzeAllPatterns()
      
      // Convert pattern analysis to user behavior patterns
      const behaviorPatterns: UserBehaviorPattern[] = []

      // Convert time patterns
      for (const timePattern of patternAnalysis.timePatterns) {
        behaviorPatterns.push({
          pattern: `${timePattern.actionType} at ${timePattern.hour}:00 on ${this.getDayName(timePattern.dayOfWeek)}`,
          frequency: timePattern.frequency,
          confidence: timePattern.confidence,
          context: {
            timeOfDay: [timePattern.hour.toString()],
            dayOfWeek: [timePattern.dayOfWeek.toString()]
          },
          outcome: {
            actionTaken: timePattern.actionType,
            successRate: 0.8, // Default success rate
            averageTimeToAction: 300000 // 5 minutes default
          }
        })
      }

      // Convert workflow patterns
      for (const workflowPattern of patternAnalysis.workflowPatterns) {
        behaviorPatterns.push({
          pattern: `workflow: ${workflowPattern.sequence.join(' -> ')}`,
          frequency: workflowPattern.frequency,
          confidence: workflowPattern.confidence,
          context: {
            documentTypes: workflowPattern.context.documentTypes,
            agentPersonalities: workflowPattern.context.agentPersonalities
          },
          outcome: {
            actionTaken: 'complete workflow',
            successRate: workflowPattern.successRate,
            averageTimeToAction: workflowPattern.averageDuration
          }
        })
      }

      // Convert collaboration patterns
      for (const collabPattern of patternAnalysis.collaborationPatterns) {
        behaviorPatterns.push({
          pattern: `collaboration: ${collabPattern.agentCombination.join(' + ')}`,
          frequency: collabPattern.frequency,
          confidence: collabPattern.successRate,
          context: {
            agentPersonalities: collabPattern.agentCombination
          },
          outcome: {
            actionTaken: 'create collaboration',
            successRate: collabPattern.successRate,
            averageTimeToAction: collabPattern.averageDuration
          }
        })
      }

      // Store patterns for future use
      this.userPatterns.set(this.userId, behaviorPatterns)
      
      return behaviorPatterns

    } catch (error) {
      console.error('[Predictive Intelligence] Pattern analysis failed:', error)
      return this.userPatterns.get(this.userId) || []
    }
  }

  /**
   * Helper methods
   */
  private calculateExpectedTime(context: PredictiveContext): string {
    const hour = context.currentTime.getHours()
    
    if (hour >= 9 && hour <= 17) {
      return 'Trong 1-2 giờ tới (giờ làm việc)'
    } else if (hour >= 18 && hour <= 22) {
      return 'Tối nay hoặc sáng mai'
    } else {
      return 'Trong ngày mai'
    }
  }

  private calculateExpectedTimeFromPattern(pattern: UserBehaviorPattern): string {
    const avgTime = pattern.outcome.averageTimeToAction
    const hours = Math.floor(avgTime / (1000 * 60 * 60))
    const minutes = Math.floor((avgTime % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `Trong ${hours} giờ ${minutes} phút tới`
    } else {
      return `Trong ${minutes} phút tới`
    }
  }

  private getDefaultContext(): PredictiveContext {
    return {
      currentTime: new Date(),
      recentDocuments: [],
      activeAgents: [],
      userActivity: {
        uploadFrequency: 0,
        preferredDocumentTypes: [],
        collaborationPatterns: [],
        timePatterns: []
      },
      swarmState: {
        metrics: {
          totalAgents: 0,
          activeAgents: 0,
          totalCollaborations: 0,
          averageEfficiency: 0,
          emergentBehaviors: [],
          collectiveIntelligence: 0
        },
        collaborations: [],
        efficiency: 0
      }
    }
  }

  private cleanupExpiredInsights(): void {
    const now = new Date()
    for (const [id, insight] of this.insights) {
      if (new Date(insight.metadata.validUntil) < now) {
        this.insights.delete(id)
      }
    }
  }

  private async findCollaborationCandidates(context: PredictiveContext): Promise<any[]> {
    // Find agents that would benefit from working together
    return []
  }

  private async generateCollaborationPrediction(candidate: any, context: PredictiveContext): Promise<PredictiveInsight | null> {
    return null
  }

  private async predictSpecializationNeeds(context: PredictiveContext, patterns: UserBehaviorPattern[]): Promise<PredictiveInsight[]> {
    return []
  }

  private async generateWorkflowImprovementPrediction(bottleneck: UserBehaviorPattern, context: PredictiveContext): Promise<PredictiveInsight | null> {
    return null
  }

  /**
   * Public API methods
   */
  public getActiveInsights(): PredictiveInsight[] {
    return Array.from(this.insights.values())
      .filter(insight => new Date(insight.metadata.validUntil) > new Date())
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }

  public async getInsightById(id: string): Promise<PredictiveInsight | null> {
    return this.insights.get(id) || null
  }

  public async dismissInsight(id: string): Promise<void> {
    this.insights.delete(id)
  }

  public async addUserPattern(pattern: UserBehaviorPattern): Promise<void> {
    const patterns = this.userPatterns.get(this.userId) || []
    patterns.push(pattern)
    this.userPatterns.set(this.userId, patterns)
  }

  public destroy(): void {
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval)
    }
    this.insights.clear()
    this.userPatterns.delete(this.userId)
    this.patternAnalyzer.clearCache()
    console.log(`[Predictive Intelligence] Destroyed for user ${this.userId}`)
  }

  /**
   * Get anomaly detection results
   */
  public async getAnomalies(): Promise<any> {
    return this.patternAnalyzer.detectAnomalies()
  }

  /**
   * Get future pattern predictions
   */
  public async getFuturePredictions(): Promise<any> {
    return this.patternAnalyzer.predictFuturePatterns()
  }

  /**
   * Helper method to get day name
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek] || 'Unknown'
  }
}

export default PredictiveIntelligenceService