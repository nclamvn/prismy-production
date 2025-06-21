/**
 * Advanced Analytics Engine
 * Comprehensive analytics, insights, and business intelligence for translation platform
 */

import { logger } from '@/lib/logger'

export interface AnalyticsEvent {
  id: string
  userId?: string
  sessionId: string
  timestamp: number
  event: string
  category: 'user' | 'translation' | 'system' | 'business' | 'performance'
  properties: Record<string, any>
  metadata: {
    userAgent?: string
    ip?: string
    country?: string
    language?: string
    platform?: string
    version?: string
  }
}

export interface UserInsight {
  userId: string
  profile: {
    registrationDate: number
    lastActive: number
    totalTranslations: number
    totalCharacters: number
    averageSessionDuration: number
    preferredLanguages: Array<{ from: string; to: string; count: number }>
    qualityTierUsage: Record<string, number>
    deviceTypes: Record<string, number>
  }
  behavior: {
    translationPatterns: Array<{
      timeOfDay: number
      dayOfWeek: number
      frequency: number
    }>
    featureUsage: Record<string, number>
    conversionFunnel: {
      visits: number
      signups: number
      firstTranslation: number
      subscriptions: number
    }
    retentionRate: {
      day1: number
      day7: number
      day30: number
    }
  }
  predictions: {
    churnRisk: number // 0-1 probability
    lifetimeValue: number
    nextBestAction: string
    upgradeCompatibility: number
  }
}

export interface BusinessMetrics {
  revenue: {
    total: number
    monthly: number
    growth: number
    mrr: number // Monthly Recurring Revenue
    arr: number // Annual Recurring Revenue
    churn: number
  }
  usage: {
    totalTranslations: number
    totalCharacters: number
    averageTranslationLength: number
    topLanguagePairs: Array<{ from: string; to: string; count: number }>
    apiUsage: Record<string, number>
  }
  performance: {
    averageLatency: number
    successRate: number
    errorRate: number
    uptime: number
    providerDistribution: Record<string, number>
  }
  users: {
    total: number
    active: number
    newSignups: number
    conversions: number
    retention: {
      daily: number
      weekly: number
      monthly: number
    }
  }
}

export interface LanguageInsights {
  pair: { from: string; to: string }
  volume: number
  growth: number
  accuracy: number
  userSatisfaction: number
  revenue: number
  topDomains: string[]
  timeDistribution: Record<string, number>
  geographicDistribution: Record<string, number>
}

export interface SystemInsights {
  performance: {
    responseTime: { p50: number; p95: number; p99: number }
    throughput: { rps: number; rpm: number }
    errorRates: Record<string, number>
    resourceUtilization: { cpu: number; memory: number; storage: number }
  }
  capacity: {
    currentLoad: number
    projectedGrowth: number
    scalingRecommendations: string[]
    bottlenecks: Array<{ component: string; severity: 'low' | 'medium' | 'high' }>
  }
  reliability: {
    uptime: number
    mttr: number // Mean Time To Recovery
    mtbf: number // Mean Time Between Failures
    slaCompliance: number
  }
}

export class AdvancedAnalyticsEngine {
  private events: AnalyticsEvent[] = []
  private insights: Map<string, UserInsight> = new Map()
  private businessMetrics: BusinessMetrics | null = null
  private systemInsights: SystemInsights | null = null
  private eventBuffer: AnalyticsEvent[] = []
  private batchSize = 100
  private flushInterval = 30000 // 30 seconds

  constructor() {
    this.startEventProcessor()
    this.startMetricsCalculation()
    this.startInsightGeneration()
  }

  // Event tracking
  trackEvent(
    event: string,
    category: AnalyticsEvent['category'],
    properties: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): void {
    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      userId,
      sessionId: sessionId || this.generateSessionId(),
      timestamp: Date.now(),
      event,
      category,
      properties,
      metadata: this.collectMetadata()
    }

    this.eventBuffer.push(analyticsEvent)

    // Immediate processing for critical events
    if (category === 'system' && properties.severity === 'high') {
      this.processEventImmediate(analyticsEvent)
    }

    logger.debug('Analytics event tracked', {
      event,
      category,
      userId,
      properties: Object.keys(properties)
    })
  }

  // User behavior tracking
  trackUserAction(
    userId: string,
    action: string,
    properties: Record<string, any> = {}
  ): void {
    this.trackEvent(action, 'user', { ...properties, userId }, userId)
  }

  trackTranslation(
    userId: string,
    translationData: {
      sourceLanguage: string
      targetLanguage: string
      characterCount: number
      qualityTier: string
      provider: string
      latency: number
      cost: number
      success: boolean
    }
  ): void {
    this.trackEvent('translation_completed', 'translation', translationData, userId)
  }

  trackBusinessEvent(
    event: string,
    properties: Record<string, any>,
    userId?: string
  ): void {
    this.trackEvent(event, 'business', properties, userId)
  }

  trackPerformanceMetric(
    metric: string,
    value: number,
    properties: Record<string, any> = {}
  ): void {
    this.trackEvent(metric, 'performance', { value, ...properties })
  }

  // User insights generation
  async generateUserInsights(userId: string): Promise<UserInsight> {
    const userEvents = this.getUserEvents(userId)
    if (userEvents.length === 0) {
      throw new Error('No events found for user')
    }

    const profile = this.calculateUserProfile(userEvents)
    const behavior = this.analyzeBehaviorPatterns(userEvents)
    const predictions = await this.generateUserPredictions(userEvents, profile, behavior)

    const insight: UserInsight = {
      userId,
      profile,
      behavior,
      predictions
    }

    this.insights.set(userId, insight)
    
    logger.info('User insights generated', { userId, eventsAnalyzed: userEvents.length })
    
    return insight
  }

  private calculateUserProfile(events: AnalyticsEvent[]) {
    const translationEvents = events.filter(e => e.event === 'translation_completed')
    const sessionEvents = events.filter(e => e.event === 'session_start')
    
    const registrationEvent = events.find(e => e.event === 'user_registered')
    const registrationDate = registrationEvent?.timestamp || events[0]?.timestamp || Date.now()
    
    const lastActive = Math.max(...events.map(e => e.timestamp))
    
    const totalTranslations = translationEvents.length
    const totalCharacters = translationEvents.reduce(
      (sum, e) => sum + (e.properties.characterCount || 0), 0
    )
    
    const sessionDurations = sessionEvents.map(e => e.properties.duration || 0)
    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length 
      : 0

    // Language pair preferences
    const languagePairs = new Map<string, number>()
    translationEvents.forEach(e => {
      const pair = `${e.properties.sourceLanguage}-${e.properties.targetLanguage}`
      languagePairs.set(pair, (languagePairs.get(pair) || 0) + 1)
    })

    const preferredLanguages = Array.from(languagePairs.entries())
      .map(([pair, count]) => {
        const [from, to] = pair.split('-')
        return { from, to, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Quality tier usage
    const qualityTierUsage: Record<string, number> = {}
    translationEvents.forEach(e => {
      const tier = e.properties.qualityTier || 'standard'
      qualityTierUsage[tier] = (qualityTierUsage[tier] || 0) + 1
    })

    // Device types
    const deviceTypes: Record<string, number> = {}
    events.forEach(e => {
      const platform = e.metadata.platform || 'unknown'
      deviceTypes[platform] = (deviceTypes[platform] || 0) + 1
    })

    return {
      registrationDate,
      lastActive,
      totalTranslations,
      totalCharacters,
      averageSessionDuration,
      preferredLanguages,
      qualityTierUsage,
      deviceTypes
    }
  }

  private analyzeBehaviorPatterns(events: AnalyticsEvent[]) {
    // Translation time patterns
    const translationTimes = events
      .filter(e => e.event === 'translation_completed')
      .map(e => {
        const date = new Date(e.timestamp)
        return {
          timeOfDay: date.getHours(),
          dayOfWeek: date.getDay()
        }
      })

    const timePatterns = new Map<string, number>()
    translationTimes.forEach(({ timeOfDay, dayOfWeek }) => {
      const key = `${dayOfWeek}-${timeOfDay}`
      timePatterns.set(key, (timePatterns.get(key) || 0) + 1)
    })

    const translationPatterns = Array.from(timePatterns.entries())
      .map(([key, frequency]) => {
        const [dayOfWeek, timeOfDay] = key.split('-').map(Number)
        return { timeOfDay, dayOfWeek, frequency }
      })
      .sort((a, b) => b.frequency - a.frequency)

    // Feature usage
    const featureUsage: Record<string, number> = {}
    events.forEach(e => {
      if (e.category === 'user') {
        featureUsage[e.event] = (featureUsage[e.event] || 0) + 1
      }
    })

    // Conversion funnel
    const visits = events.filter(e => e.event === 'page_view').length
    const signups = events.filter(e => e.event === 'user_registered').length
    const firstTranslation = events.filter(e => e.event === 'first_translation').length
    const subscriptions = events.filter(e => e.event === 'subscription_created').length

    // Retention calculation
    const firstEvent = Math.min(...events.map(e => e.timestamp))
    const day1Events = events.filter(e => 
      e.timestamp > firstEvent && 
      e.timestamp <= firstEvent + 24 * 60 * 60 * 1000
    )
    const day7Events = events.filter(e => 
      e.timestamp > firstEvent + 6 * 24 * 60 * 60 * 1000 && 
      e.timestamp <= firstEvent + 7 * 24 * 60 * 60 * 1000
    )
    const day30Events = events.filter(e => 
      e.timestamp > firstEvent + 29 * 24 * 60 * 60 * 1000 && 
      e.timestamp <= firstEvent + 30 * 24 * 60 * 60 * 1000
    )

    return {
      translationPatterns,
      featureUsage,
      conversionFunnel: { visits, signups, firstTranslation, subscriptions },
      retentionRate: {
        day1: day1Events.length > 0 ? 1 : 0,
        day7: day7Events.length > 0 ? 1 : 0,
        day30: day30Events.length > 0 ? 1 : 0
      }
    }
  }

  private async generateUserPredictions(
    events: AnalyticsEvent[],
    profile: any,
    behavior: any
  ) {
    // Simplified prediction models - in production, use ML models
    
    // Churn risk based on activity patterns
    const daysSinceLastActive = (Date.now() - profile.lastActive) / (24 * 60 * 60 * 1000)
    const churnRisk = Math.min(daysSinceLastActive / 30, 1) // Higher risk with more days inactive

    // Lifetime value estimation
    const avgTranslationValue = 0.02 // $0.02 per translation
    const projectedTranslations = profile.totalTranslations * 12 // Yearly projection
    const lifetimeValue = projectedTranslations * avgTranslationValue

    // Next best action
    let nextBestAction = 'engage'
    if (profile.totalTranslations === 0) {
      nextBestAction = 'first_translation_guide'
    } else if (profile.totalTranslations > 50 && !behavior.conversionFunnel.subscriptions) {
      nextBestAction = 'upgrade_prompt'
    } else if (churnRisk > 0.7) {
      nextBestAction = 'retention_campaign'
    }

    // Upgrade probability
    const upgradeCompatibility = profile.totalCharacters > 10000 ? 0.8 : 
                                profile.totalTranslations > 20 ? 0.5 : 0.2

    return {
      churnRisk,
      lifetimeValue,
      nextBestAction,
      upgradeCompatibility
    }
  }

  // Business metrics calculation
  async calculateBusinessMetrics(): Promise<BusinessMetrics> {
    const translationEvents = this.events.filter(e => e.event === 'translation_completed')
    const subscriptionEvents = this.events.filter(e => e.event === 'subscription_created')
    const userEvents = this.events.filter(e => e.event === 'user_registered')

    // Revenue calculations
    const totalRevenue = subscriptionEvents.reduce(
      (sum, e) => sum + (e.properties.amount || 0), 0
    )
    
    const now = Date.now()
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000
    const monthlyRevenue = subscriptionEvents
      .filter(e => e.timestamp > monthAgo)
      .reduce((sum, e) => sum + (e.properties.amount || 0), 0)

    // Usage statistics
    const totalTranslations = translationEvents.length
    const totalCharacters = translationEvents.reduce(
      (sum, e) => sum + (e.properties.characterCount || 0), 0
    )
    const averageTranslationLength = totalTranslations > 0 
      ? totalCharacters / totalTranslations 
      : 0

    // Top language pairs
    const languagePairs = new Map<string, number>()
    translationEvents.forEach(e => {
      const pair = `${e.properties.sourceLanguage}-${e.properties.targetLanguage}`
      languagePairs.set(pair, (languagePairs.get(pair) || 0) + 1)
    })

    const topLanguagePairs = Array.from(languagePairs.entries())
      .map(([pair, count]) => {
        const [from, to] = pair.split('-')
        return { from, to, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Performance metrics
    const performanceEvents = this.events.filter(e => e.category === 'performance')
    const latencies = translationEvents
      .map(e => e.properties.latency)
      .filter(l => typeof l === 'number')
    
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length 
      : 0

    const successfulTranslations = translationEvents.filter(e => e.properties.success).length
    const successRate = totalTranslations > 0 ? successfulTranslations / totalTranslations : 0

    this.businessMetrics = {
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        growth: 0, // Would need historical data
        mrr: monthlyRevenue, // Simplified
        arr: monthlyRevenue * 12,
        churn: 0 // Would need churn calculation
      },
      usage: {
        totalTranslations,
        totalCharacters,
        averageTranslationLength,
        topLanguagePairs,
        apiUsage: {} // Would track API endpoint usage
      },
      performance: {
        averageLatency,
        successRate,
        errorRate: 1 - successRate,
        uptime: 0.999, // Would integrate with monitoring
        providerDistribution: {} // Would track provider usage
      },
      users: {
        total: userEvents.length,
        active: this.getActiveUsers().length,
        newSignups: userEvents.filter(e => e.timestamp > monthAgo).length,
        conversions: subscriptionEvents.length,
        retention: {
          daily: 0.8, // Would calculate from actual data
          weekly: 0.6,
          monthly: 0.4
        }
      }
    }

    return this.businessMetrics
  }

  // Language insights
  async generateLanguageInsights(): Promise<LanguageInsights[]> {
    const translationEvents = this.events.filter(e => e.event === 'translation_completed')
    const languagePairs = new Map<string, any[]>()

    // Group by language pair
    translationEvents.forEach(e => {
      const from = e.properties.sourceLanguage
      const to = e.properties.targetLanguage
      const pairKey = `${from}-${to}`
      
      if (!languagePairs.has(pairKey)) {
        languagePairs.set(pairKey, [])
      }
      
      languagePairs.get(pairKey)!.push(e)
    })

    const insights: LanguageInsights[] = []

    for (const [pairKey, events] of languagePairs.entries()) {
      const [from, to] = pairKey.split('-')
      
      const volume = events.length
      const accuracy = events.reduce((sum, e) => sum + (e.properties.accuracy || 0.9), 0) / events.length
      const revenue = events.reduce((sum, e) => sum + (e.properties.cost || 0), 0)
      
      // User satisfaction (simplified)
      const satisfactionEvents = this.events.filter(e => 
        e.event === 'feedback' && 
        e.properties.translationFrom === from && 
        e.properties.translationTo === to
      )
      const userSatisfaction = satisfactionEvents.length > 0
        ? satisfactionEvents.reduce((sum, e) => sum + e.properties.rating, 0) / satisfactionEvents.length
        : 4.0 // Default satisfaction

      // Time distribution
      const timeDistribution: Record<string, number> = {}
      events.forEach(e => {
        const hour = new Date(e.timestamp).getHours()
        const timeSlot = `${Math.floor(hour / 6) * 6}-${Math.floor(hour / 6) * 6 + 5}`
        timeDistribution[timeSlot] = (timeDistribution[timeSlot] || 0) + 1
      })

      // Geographic distribution
      const geographicDistribution: Record<string, number> = {}
      events.forEach(e => {
        const country = e.metadata.country || 'unknown'
        geographicDistribution[country] = (geographicDistribution[country] || 0) + 1
      })

      insights.push({
        pair: { from, to },
        volume,
        growth: 0, // Would need historical comparison
        accuracy,
        userSatisfaction,
        revenue,
        topDomains: [], // Would analyze content domains
        timeDistribution,
        geographicDistribution
      })
    }

    return insights.sort((a, b) => b.volume - a.volume)
  }

  // System insights
  async generateSystemInsights(): Promise<SystemInsights> {
    const performanceEvents = this.events.filter(e => e.category === 'performance')
    
    // Response time analysis
    const latencies = performanceEvents
      .filter(e => e.properties.value && e.event.includes('latency'))
      .map(e => e.properties.value)
      .sort((a, b) => a - b)

    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0

    this.systemInsights = {
      performance: {
        responseTime: { p50, p95, p99 },
        throughput: {
          rps: this.calculateRequestsPerSecond(),
          rpm: this.calculateRequestsPerMinute()
        },
        errorRates: this.calculateErrorRates(),
        resourceUtilization: {
          cpu: 65, // Would integrate with monitoring
          memory: 78,
          storage: 45
        }
      },
      capacity: {
        currentLoad: 0.7,
        projectedGrowth: 0.15,
        scalingRecommendations: [
          'Consider adding database read replicas',
          'Implement connection pooling',
          'Add caching layer for frequent translations'
        ],
        bottlenecks: [
          { component: 'database', severity: 'medium' },
          { component: 'api_gateway', severity: 'low' }
        ]
      },
      reliability: {
        uptime: 99.95,
        mttr: 2.5, // minutes
        mtbf: 720, // hours
        slaCompliance: 99.9
      }
    }

    return this.systemInsights
  }

  // Helper methods
  private getUserEvents(userId: string): AnalyticsEvent[] {
    return this.events.filter(e => e.userId === userId)
  }

  private getActiveUsers(): string[] {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const activeEvents = this.events.filter(e => e.timestamp > weekAgo && e.userId)
    return [...new Set(activeEvents.map(e => e.userId!).filter(Boolean))]
  }

  private calculateRequestsPerSecond(): number {
    const lastMinute = Date.now() - 60 * 1000
    const recentEvents = this.events.filter(e => e.timestamp > lastMinute)
    return recentEvents.length / 60
  }

  private calculateRequestsPerMinute(): number {
    const lastHour = Date.now() - 60 * 60 * 1000
    const recentEvents = this.events.filter(e => e.timestamp > lastHour)
    return recentEvents.length / 60
  }

  private calculateErrorRates(): Record<string, number> {
    const translationEvents = this.events.filter(e => e.event === 'translation_completed')
    const errorEvents = translationEvents.filter(e => !e.properties.success)
    
    return {
      overall: translationEvents.length > 0 ? errorEvents.length / translationEvents.length : 0,
      translation: translationEvents.length > 0 ? errorEvents.length / translationEvents.length : 0
    }
  }

  private processEventImmediate(event: AnalyticsEvent): void {
    // Process critical events immediately
    logger.warn('Critical analytics event', { event: event.event, properties: event.properties })
  }

  private startEventProcessor(): void {
    setInterval(() => {
      if (this.eventBuffer.length > 0) {
        const eventsToProcess = this.eventBuffer.splice(0, this.batchSize)
        this.events.push(...eventsToProcess)
        this.processEventBatch(eventsToProcess)
      }
    }, this.flushInterval)
  }

  private processEventBatch(events: AnalyticsEvent[]): void {
    logger.debug('Processing analytics event batch', { count: events.length })
    
    // In production, this would send events to a data warehouse
    // or analytics service like Amplitude, Mixpanel, etc.
  }

  private startMetricsCalculation(): void {
    // Recalculate business metrics every hour
    setInterval(async () => {
      try {
        await this.calculateBusinessMetrics()
        await this.generateSystemInsights()
      } catch (error) {
        logger.error('Metrics calculation failed', { error })
      }
    }, 60 * 60 * 1000)
  }

  private startInsightGeneration(): void {
    // Generate insights for active users every 6 hours
    setInterval(async () => {
      const activeUsers = this.getActiveUsers()
      for (const userId of activeUsers.slice(0, 10)) { // Limit to prevent overload
        try {
          await this.generateUserInsights(userId)
        } catch (error) {
          logger.error('User insight generation failed', { userId, error })
        }
      }
    }, 6 * 60 * 60 * 1000)
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private collectMetadata() {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
      version: '2.0.0'
    }
  }

  // Public getters
  getBusinessMetrics(): BusinessMetrics | null {
    return this.businessMetrics
  }

  getSystemInsights(): SystemInsights | null {
    return this.systemInsights
  }

  getUserInsight(userId: string): UserInsight | null {
    return this.insights.get(userId) || null
  }

  getEventCount(): number {
    return this.events.length
  }

  getTopEvents(limit: number = 10): Array<{ event: string; count: number }> {
    const eventCounts = new Map<string, number>()
    this.events.forEach(e => {
      eventCounts.set(e.event, (eventCounts.get(e.event) || 0) + 1)
    })

    return Array.from(eventCounts.entries())
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // Export and reporting
  exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'event', 'category', 'userId', 'properties']
      const rows = this.events.map(e => [
        new Date(e.timestamp).toISOString(),
        e.event,
        e.category,
        e.userId || '',
        JSON.stringify(e.properties)
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify({
      events: this.events,
      insights: Object.fromEntries(this.insights),
      businessMetrics: this.businessMetrics,
      systemInsights: this.systemInsights,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  // Data management
  clearOldData(retentionDays: number = 90): void {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
    this.events = this.events.filter(e => e.timestamp > cutoff)
    
    logger.info('Old analytics data cleared', { 
      retentionDays, 
      remainingEvents: this.events.length 
    })
  }

  getDataUsage(): {
    eventCount: number
    memoryUsage: number
    oldestEvent: number
    newestEvent: number
  } {
    const timestamps = this.events.map(e => e.timestamp)
    
    return {
      eventCount: this.events.length,
      memoryUsage: JSON.stringify(this.events).length,
      oldestEvent: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEvent: timestamps.length > 0 ? Math.max(...timestamps) : 0
    }
  }
}

// Singleton instance
export const analytics = new AdvancedAnalyticsEngine()