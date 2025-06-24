/**
 * AI Workspace Analytics System
 * Comprehensive tracking for AI agent interactions and document processing
 */

import { supabase } from '@/lib/supabase'

export interface WorkspaceEvent {
  type: 
    | 'workspace_entered'
    | 'agent_selected'
    | 'document_uploaded'
    | 'document_processed'
    | 'agent_collaboration_started'
    | 'insight_generated'
    | 'chat_message_sent'
    | 'workspace_mode_changed'
    | 'mobile_gesture_used'
    | 'feedback_submitted'
  metadata: {
    agentId?: string
    agentType?: string
    documentType?: string
    documentSize?: number
    processingTime?: number
    collaborationMode?: boolean
    workspaceMode?: string
    deviceType?: 'desktop' | 'tablet' | 'mobile'
    culturalContext?: string
    successRate?: number
    userSatisfaction?: number
    [key: string]: any
  }
  userId?: string
  sessionId: string
  timestamp: Date
  userAgent?: string
  culturalRhythm?: 'morning' | 'midday' | 'evening' | 'night'
}

export interface WorkspaceMetrics {
  totalUsers: number
  activeUsers: number
  documentsProcessed: number
  agentInteractions: number
  averageSessionDuration: number
  conversionRate: number
  culturalAdaptationScore: number
  mobileUsageRate: number
  collaborationUsageRate: number
  feedbackScore: number
}

export interface AgentPerformance {
  agentId: string
  agentName: string
  totalInteractions: number
  successRate: number
  averageResponseTime: number
  userSatisfactionScore: number
  popularTasks: string[]
  culturalRelevanceScore: number
}

export class WorkspaceAnalytics {
  private static instance: WorkspaceAnalytics
  private sessionId: string
  private userId?: string
  private deviceType: 'desktop' | 'tablet' | 'mobile'

  constructor() {
    this.sessionId = this.generateSessionId()
    this.deviceType = this.detectDeviceType()
    
    // Initialize session
    this.trackEvent('workspace_entered', {
      deviceType: this.deviceType,
      culturalContext: 'vietnamese'
    })
  }

  static getInstance(): WorkspaceAnalytics {
    if (!WorkspaceAnalytics.instance) {
      WorkspaceAnalytics.instance = new WorkspaceAnalytics()
    }
    return WorkspaceAnalytics.instance
  }

  /**
   * Track workspace events
   */
  async trackEvent(type: WorkspaceEvent['type'], metadata: WorkspaceEvent['metadata'] = {}) {
    const event: WorkspaceEvent = {
      type,
      metadata: {
        ...metadata,
        deviceType: this.deviceType
      },
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      culturalRhythm: this.getCulturalRhythm()
    }

    try {
      // Store in Supabase
      const { error } = await supabase
        .from('workspace_analytics')
        .insert([{
          event_type: event.type,
          metadata: event.metadata,
          user_id: event.userId,
          session_id: event.sessionId,
          timestamp: event.timestamp.toISOString(),
          user_agent: event.userAgent,
          cultural_rhythm: event.culturalRhythm
        }])

      if (error) {
        console.error('Analytics tracking error:', error)
      }

      // Also send to client-side analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', type, {
          custom_parameter_1: metadata.agentId || '',
          custom_parameter_2: metadata.documentType || '',
          custom_parameter_3: this.deviceType
        })
      }

    } catch (error) {
      console.error('Failed to track workspace event:', error)
    }
  }

  /**
   * Track agent interactions
   */
  async trackAgentInteraction(agentId: string, interactionType: string, success: boolean, responseTime?: number) {
    await this.trackEvent('agent_selected', {
      agentId,
      agentType: agentId.split('-')[0],
      interactionType,
      success,
      responseTime,
      culturalContext: 'vietnamese'
    })
  }

  /**
   * Track document processing
   */
  async trackDocumentProcessing(
    documentType: string, 
    documentSize: number, 
    processingTime: number,
    success: boolean,
    insightsGenerated: number
  ) {
    await this.trackEvent('document_processed', {
      documentType,
      documentSize,
      processingTime,
      success,
      insightsGenerated,
      successRate: success ? 100 : 0
    })

    if (insightsGenerated > 0) {
      await this.trackEvent('insight_generated', {
        documentType,
        insightsCount: insightsGenerated,
        processingTime
      })
    }
  }

  /**
   * Track collaboration usage
   */
  async trackCollaboration(agentIds: string[], taskType: string, duration: number) {
    await this.trackEvent('agent_collaboration_started', {
      agentIds,
      agentCount: agentIds.length,
      taskType,
      duration,
      collaborationMode: true
    })
  }

  /**
   * Track mobile gestures
   */
  async trackMobileGesture(gestureType: string, success: boolean) {
    if (this.deviceType === 'mobile') {
      await this.trackEvent('mobile_gesture_used', {
        gestureType,
        success,
        deviceType: this.deviceType
      })
    }
  }

  /**
   * Track workspace mode changes
   */
  async trackModeChange(from: string, to: string) {
    await this.trackEvent('workspace_mode_changed', {
      fromMode: from,
      toMode: to,
      workspaceMode: to
    })
  }

  /**
   * Track feedback submission
   */
  async trackFeedback(rating: number, category: string, feedback: string) {
    await this.trackEvent('feedback_submitted', {
      rating,
      category,
      feedbackLength: feedback.length,
      userSatisfaction: rating
    })
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    this.userId = userId
  }

  /**
   * Get workspace metrics
   */
  async getWorkspaceMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<WorkspaceMetrics> {
    const startDate = new Date()
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    try {
      const { data, error } = await supabase
        .from('workspace_analytics')
        .select('*')
        .gte('timestamp', startDate.toISOString())

      if (error) throw error

      // Calculate metrics
      const events = data || []
      const uniqueUsers = new Set(events.map(e => e.user_id).filter(Boolean)).size
      const uniqueSessions = new Set(events.map(e => e.session_id)).size
      
      const documentsProcessed = events.filter(e => e.event_type === 'document_processed').length
      const agentInteractions = events.filter(e => e.event_type === 'agent_selected').length
      const feedbackEvents = events.filter(e => e.event_type === 'feedback_submitted')
      const mobileEvents = events.filter(e => e.metadata?.deviceType === 'mobile')
      const collaborationEvents = events.filter(e => e.event_type === 'agent_collaboration_started')

      const averageFeedback = feedbackEvents.length > 0 
        ? feedbackEvents.reduce((sum, e) => sum + (e.metadata?.rating || 0), 0) / feedbackEvents.length 
        : 0

      return {
        totalUsers: uniqueUsers,
        activeUsers: uniqueUsers, // Simplified for now
        documentsProcessed,
        agentInteractions,
        averageSessionDuration: 0, // TODO: Calculate based on session data
        conversionRate: uniqueUsers > 0 ? (documentsProcessed / uniqueUsers) * 100 : 0,
        culturalAdaptationScore: 85, // TODO: Calculate based on Vietnamese usage patterns
        mobileUsageRate: events.length > 0 ? (mobileEvents.length / events.length) * 100 : 0,
        collaborationUsageRate: events.length > 0 ? (collaborationEvents.length / events.length) * 100 : 0,
        feedbackScore: averageFeedback
      }
    } catch (error) {
      console.error('Failed to get workspace metrics:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        documentsProcessed: 0,
        agentInteractions: 0,
        averageSessionDuration: 0,
        conversionRate: 0,
        culturalAdaptationScore: 0,
        mobileUsageRate: 0,
        collaborationUsageRate: 0,
        feedbackScore: 0
      }
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<AgentPerformance[]> {
    const startDate = new Date()
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    try {
      const { data, error } = await supabase
        .from('workspace_analytics')
        .select('*')
        .eq('event_type', 'agent_selected')
        .gte('timestamp', startDate.toISOString())

      if (error) throw error

      const agentStats = new Map<string, {
        interactions: number
        successes: number
        responseTimes: number[]
        satisfactionScores: number[]
        tasks: string[]
      }>()

      // Process agent interactions
      data?.forEach(event => {
        const agentId = event.metadata?.agentId
        if (!agentId) return

        if (!agentStats.has(agentId)) {
          agentStats.set(agentId, {
            interactions: 0,
            successes: 0,
            responseTimes: [],
            satisfactionScores: [],
            tasks: []
          })
        }

        const stats = agentStats.get(agentId)!
        stats.interactions++
        
        if (event.metadata?.success) stats.successes++
        if (event.metadata?.responseTime) stats.responseTimes.push(event.metadata.responseTime)
        if (event.metadata?.userSatisfaction) stats.satisfactionScores.push(event.metadata.userSatisfaction)
        if (event.metadata?.interactionType) stats.tasks.push(event.metadata.interactionType)
      })

      // Convert to performance metrics
      return Array.from(agentStats.entries()).map(([agentId, stats]) => ({
        agentId,
        agentName: this.getAgentDisplayName(agentId),
        totalInteractions: stats.interactions,
        successRate: stats.interactions > 0 ? (stats.successes / stats.interactions) * 100 : 0,
        averageResponseTime: stats.responseTimes.length > 0 
          ? stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length 
          : 0,
        userSatisfactionScore: stats.satisfactionScores.length > 0
          ? stats.satisfactionScores.reduce((sum, score) => sum + score, 0) / stats.satisfactionScores.length
          : 0,
        popularTasks: [...new Set(stats.tasks)].slice(0, 3),
        culturalRelevanceScore: agentId === 'cultural-advisor' ? 95 : 80
      }))
    } catch (error) {
      console.error('Failed to get agent performance:', error)
      return []
    }
  }

  // Helper methods
  private generateSessionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  private getCulturalRhythm(): 'morning' | 'midday' | 'evening' | 'night' {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 11) return 'morning'
    if (hour >= 11 && hour < 18) return 'midday'
    if (hour >= 18 && hour < 22) return 'evening'
    return 'night'
  }

  private getAgentDisplayName(agentId: string): string {
    const names: Record<string, string> = {
      'legal-expert': 'Legal Expert',
      'financial-analyst': 'Financial Analyst',
      'research-assistant': 'Research Assistant',
      'content-strategist': 'Content Strategist',
      'technical-writer': 'Technical Writer',
      'project-manager': 'Project Manager',
      'cultural-advisor': 'Cultural Advisor',
      'business-strategist': 'Business Strategist',
      'data-scientist': 'Data Scientist',
      'customer-advocate': 'Customer Advocate',
      'innovation-catalyst': 'Innovation Catalyst',
      'compliance-guardian': 'Compliance Guardian'
    }
    return names[agentId] || agentId
  }
}

// Export singleton instance
export const workspaceAnalytics = WorkspaceAnalytics.getInstance()

// Helper functions for easy tracking
export const trackWorkspaceEvent = (type: WorkspaceEvent['type'], metadata?: WorkspaceEvent['metadata']) => {
  return workspaceAnalytics.trackEvent(type, metadata)
}

export const trackAgentInteraction = (agentId: string, type: string, success: boolean, responseTime?: number) => {
  return workspaceAnalytics.trackAgentInteraction(agentId, type, success, responseTime)
}

export const trackDocumentProcessing = (type: string, size: number, time: number, success: boolean, insights: number) => {
  return workspaceAnalytics.trackDocumentProcessing(type, size, time, success, insights)
}

export const trackMobileGesture = (gestureType: string, success: boolean) => {
  return workspaceAnalytics.trackMobileGesture(gestureType, success)
}

export const setAnalyticsUserId = (userId: string) => {
  workspaceAnalytics.setUserId(userId)
}