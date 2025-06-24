/**
 * USER BEHAVIOR ANALYTICS
 * Advanced user behavior tracking and analysis
 */

import { analyticsEngine, AnalyticsEvent } from './analytics-engine'

export interface UserBehaviorProfile {
  userId: string
  createdAt: Date
  lastActiveAt: Date
  
  // Engagement metrics
  totalSessions: number
  totalPageViews: number
  averageSessionDuration: number
  bounceRate: number
  
  // Feature usage
  featuresUsed: Record<string, {
    firstUsed: Date
    lastUsed: Date
    usage_count: number
    total_time: number
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }>
  
  // Translation patterns
  translationBehavior: {
    totalTranslations: number
    favoriteLanguagePairs: Array<{
      source: string
      target: string
      count: number
    }>
    averageWordsPerTranslation: number
    preferredMethods: Record<'text' | 'document' | 'image' | 'voice', number>
    timePatterns: Record<string, number> // hour of day usage
    qualityScore: number // based on revision patterns
  }
  
  // User journey
  conversionFunnel: {
    discovery: Date | null
    trial: Date | null
    purchase: Date | null
    retention: 'new' | 'returning' | 'loyal' | 'churned'
  }
  
  // Segmentation
  segment: 'casual' | 'professional' | 'enterprise' | 'power_user'
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
  
  // Preferences and patterns
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
    notifications: boolean
    autoSave: boolean
  }
  
  riskScores: {
    churn: number // 0-1, probability of churning
    upgrade: number // 0-1, probability of upgrading
    advocacy: number // 0-1, likelihood to recommend
  }
}

export interface BehaviorInsight {
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk'
  title: string
  description: string
  confidence: number
  severity: 'low' | 'medium' | 'high'
  actionable: boolean
  recommendations: string[]
  metadata: Record<string, any>
}

export interface UserJourney {
  userId: string
  sessions: Array<{
    id: string
    startTime: Date
    endTime: Date
    events: AnalyticsEvent[]
    funnel_stage: 'awareness' | 'interest' | 'consideration' | 'purchase' | 'retention'
    conversion_events: string[]
  }>
  milestones: Array<{
    event: string
    timestamp: Date
    significance: 'minor' | 'major' | 'critical'
  }>
  dropoffPoints: Array<{
    step: string
    count: number
    percentage: number
  }>
}

export class UserBehaviorAnalyzer {
  private profiles = new Map<string, UserBehaviorProfile>()
  private journeys = new Map<string, UserJourney>()
  private insights = new Map<string, BehaviorInsight[]>()

  constructor() {
    // Subscribe to analytics events
    analyticsEngine.subscribe((event) => {
      this.processEvent(event)
    })

    // Periodic analysis
    setInterval(() => {
      this.runPeriodicAnalysis()
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  // Profile management
  async getUserProfile(userId: string): Promise<UserBehaviorProfile | null> {
    let profile = this.profiles.get(userId)
    
    if (!profile) {
      profile = await this.buildUserProfile(userId)
      if (profile) {
        this.profiles.set(userId, profile)
      }
    }

    return profile || null
  }

  private async buildUserProfile(userId: string): Promise<UserBehaviorProfile | null> {
    const userEvents = await analyticsEngine.getUserJourney(userId)
    if (userEvents.length === 0) return null

    const profile: UserBehaviorProfile = {
      userId,
      createdAt: userEvents[userEvents.length - 1].timestamp,
      lastActiveAt: userEvents[0].timestamp,
      totalSessions: 0,
      totalPageViews: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      featuresUsed: {},
      translationBehavior: {
        totalTranslations: 0,
        favoriteLanguagePairs: [],
        averageWordsPerTranslation: 0,
        preferredMethods: { text: 0, document: 0, image: 0, voice: 0 },
        timePatterns: {},
        qualityScore: 0.8 // Default
      },
      conversionFunnel: {
        discovery: null,
        trial: null,
        purchase: null,
        retention: 'new'
      },
      segment: 'casual',
      tier: 'free',
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: true,
        autoSave: true
      },
      riskScores: {
        churn: 0.3,
        upgrade: 0.2,
        advocacy: 0.5
      }
    }

    // Process events to build profile
    await this.processEventsForProfile(profile, userEvents)

    return profile
  }

  private async processEventsForProfile(profile: UserBehaviorProfile, events: AnalyticsEvent[]): Promise<void> {
    const sessions = new Map<string, AnalyticsEvent[]>()
    
    // Group events by session
    for (const event of events) {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, [])
      }
      sessions.get(event.sessionId)!.push(event)
    }

    profile.totalSessions = sessions.size

    // Process each session
    for (const [sessionId, sessionEvents] of sessions) {
      await this.processSession(profile, sessionEvents)
    }

    // Calculate derived metrics
    this.calculateDerivedMetrics(profile)
    this.updateSegmentation(profile)
    this.calculateRiskScores(profile)
  }

  private async processSession(profile: UserBehaviorProfile, events: AnalyticsEvent[]): Promise<void> {
    const sessionStart = events[events.length - 1]?.timestamp || new Date()
    const sessionEnd = events[0]?.timestamp || new Date()
    const duration = sessionEnd.getTime() - sessionStart.getTime()

    // Update session metrics
    if (profile.averageSessionDuration === 0) {
      profile.averageSessionDuration = duration
    } else {
      profile.averageSessionDuration = (profile.averageSessionDuration + duration) / 2
    }

    // Process individual events
    for (const event of events) {
      await this.processEventForProfile(profile, event)
    }

    // Check for bounce (single page view, short duration)
    const pageViews = events.filter(e => e.type === 'page_view').length
    if (pageViews === 1 && duration < 30000) { // Less than 30 seconds
      profile.bounceRate = (profile.bounceRate * (profile.totalSessions - 1) + 1) / profile.totalSessions
    }
  }

  private async processEventForProfile(profile: UserBehaviorProfile, event: AnalyticsEvent): Promise<void> {
    switch (event.type) {
      case 'page_view':
        profile.totalPageViews++
        break

      case 'translation':
        this.processTranslationEvent(profile, event)
        break

      case 'feature_usage':
        this.processFeatureUsage(profile, event)
        break

      case 'session_start':
        this.updateTimePatterns(profile, event)
        break
    }

    // Update conversion funnel
    this.updateConversionFunnel(profile, event)
  }

  private processTranslationEvent(profile: UserBehaviorProfile, event: AnalyticsEvent): void {
    const metadata = event.metadata
    profile.translationBehavior.totalTranslations++

    // Language pairs
    if (metadata.sourceLanguage && metadata.targetLanguage) {
      const pair = `${metadata.sourceLanguage}-${metadata.targetLanguage}`
      const existing = profile.translationBehavior.favoriteLanguagePairs.find(
        p => p.source === metadata.sourceLanguage && p.target === metadata.targetLanguage
      )
      
      if (existing) {
        existing.count++
      } else {
        profile.translationBehavior.favoriteLanguagePairs.push({
          source: metadata.sourceLanguage,
          target: metadata.targetLanguage,
          count: 1
        })
      }
    }

    // Translation method
    if (metadata.method) {
      profile.translationBehavior.preferredMethods[metadata.method as keyof typeof profile.translationBehavior.preferredMethods]++
    }

    // Word count
    if (metadata.wordCount) {
      const currentTotal = profile.translationBehavior.averageWordsPerTranslation * (profile.translationBehavior.totalTranslations - 1)
      profile.translationBehavior.averageWordsPerTranslation = (currentTotal + metadata.wordCount) / profile.translationBehavior.totalTranslations
    }
  }

  private processFeatureUsage(profile: UserBehaviorProfile, event: AnalyticsEvent): void {
    const feature = event.label || event.metadata.feature
    if (!feature) return

    if (!profile.featuresUsed[feature]) {
      profile.featuresUsed[feature] = {
        firstUsed: event.timestamp,
        lastUsed: event.timestamp,
        usage_count: 0,
        total_time: 0,
        proficiency: 'beginner'
      }
    }

    const featureData = profile.featuresUsed[feature]
    featureData.lastUsed = event.timestamp
    featureData.usage_count++
    
    if (event.value) {
      featureData.total_time += event.value
    }

    // Update proficiency based on usage
    if (featureData.usage_count >= 50) {
      featureData.proficiency = 'expert'
    } else if (featureData.usage_count >= 20) {
      featureData.proficiency = 'advanced'
    } else if (featureData.usage_count >= 5) {
      featureData.proficiency = 'intermediate'
    }
  }

  private updateTimePatterns(profile: UserBehaviorProfile, event: AnalyticsEvent): void {
    const hour = event.timestamp.getHours().toString()
    profile.translationBehavior.timePatterns[hour] = (profile.translationBehavior.timePatterns[hour] || 0) + 1
  }

  private updateConversionFunnel(profile: UserBehaviorProfile, event: AnalyticsEvent): void {
    switch (event.type) {
      case 'session_start':
        if (!profile.conversionFunnel.discovery) {
          profile.conversionFunnel.discovery = event.timestamp
        }
        break
      
      case 'translation':
        if (!profile.conversionFunnel.trial) {
          profile.conversionFunnel.trial = event.timestamp
        }
        break
        
      case 'subscription_created':
        profile.conversionFunnel.purchase = event.timestamp
        break
    }
  }

  private calculateDerivedMetrics(profile: UserBehaviorProfile): void {
    // Sort favorite language pairs
    profile.translationBehavior.favoriteLanguagePairs.sort((a, b) => b.count - a.count)
    profile.translationBehavior.favoriteLanguagePairs = profile.translationBehavior.favoriteLanguagePairs.slice(0, 5)

    // Calculate retention status
    const daysSinceLastActive = (Date.now() - profile.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLastActive > 30) {
      profile.conversionFunnel.retention = 'churned'
    } else if (profile.totalSessions > 20) {
      profile.conversionFunnel.retention = 'loyal'
    } else if (profile.totalSessions > 5) {
      profile.conversionFunnel.retention = 'returning'
    }
  }

  private updateSegmentation(profile: UserBehaviorProfile): void {
    const translations = profile.translationBehavior.totalTranslations
    const sessions = profile.totalSessions
    const avgWords = profile.translationBehavior.averageWordsPerTranslation

    if (translations > 1000 || avgWords > 500) {
      profile.segment = 'enterprise'
    } else if (translations > 100 || sessions > 50) {
      profile.segment = 'professional'
    } else if (translations > 20 || sessions > 10) {
      profile.segment = 'power_user'
    } else {
      profile.segment = 'casual'
    }
  }

  private calculateRiskScores(profile: UserBehaviorProfile): void {
    // Churn risk
    const daysSinceLastActive = (Date.now() - profile.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
    const sessionFrequency = profile.totalSessions / Math.max(1, daysSinceLastActive)
    
    profile.riskScores.churn = Math.min(1, Math.max(0, 
      (daysSinceLastActive / 30) * 0.6 + (1 - sessionFrequency) * 0.4
    ))

    // Upgrade probability
    const featureUsage = Object.keys(profile.featuresUsed).length
    const translationVolume = profile.translationBehavior.totalTranslations
    
    profile.riskScores.upgrade = Math.min(1, 
      (translationVolume / 100) * 0.5 + (featureUsage / 10) * 0.3 + (profile.segment === 'professional' ? 0.2 : 0)
    )

    // Advocacy score
    const engagementScore = Math.min(1, profile.totalSessions / 20)
    const satisfactionProxy = 1 - profile.bounceRate
    
    profile.riskScores.advocacy = engagementScore * 0.6 + satisfactionProxy * 0.4
  }

  // Event processing
  private async processEvent(event: AnalyticsEvent): Promise<void> {
    if (!event.userId) return

    const profile = await this.getUserProfile(event.userId)
    if (profile) {
      await this.processEventForProfile(profile, event)
      this.calculateDerivedMetrics(profile)
      this.updateSegmentation(profile)
      this.calculateRiskScores(profile)
    }

    // Update user journey
    await this.updateUserJourney(event)
  }

  private async updateUserJourney(event: AnalyticsEvent): Promise<void> {
    if (!event.userId) return

    let journey = this.journeys.get(event.userId)
    if (!journey) {
      journey = {
        userId: event.userId,
        sessions: [],
        milestones: [],
        dropoffPoints: []
      }
      this.journeys.set(event.userId, journey)
    }

    // Update journey with event
    // Implementation would track user flow through application
  }

  // Analysis and insights
  async generateInsights(userId: string): Promise<BehaviorInsight[]> {
    const profile = await this.getUserProfile(userId)
    if (!profile) return []

    const insights: BehaviorInsight[] = []

    // Churn risk insight
    if (profile.riskScores.churn > 0.7) {
      insights.push({
        type: 'risk',
        title: 'High Churn Risk',
        description: `User shows ${Math.round(profile.riskScores.churn * 100)}% probability of churning`,
        confidence: profile.riskScores.churn,
        severity: 'high',
        actionable: true,
        recommendations: [
          'Send re-engagement email campaign',
          'Offer limited-time discount',
          'Provide personalized feature recommendations'
        ],
        metadata: {
          lastActive: profile.lastActiveAt,
          sessionCount: profile.totalSessions
        }
      })
    }

    // Upgrade opportunity
    if (profile.riskScores.upgrade > 0.6 && profile.tier === 'free') {
      insights.push({
        type: 'opportunity',
        title: 'Upgrade Opportunity',
        description: `User shows high potential for premium conversion`,
        confidence: profile.riskScores.upgrade,
        severity: 'medium',
        actionable: true,
        recommendations: [
          'Show premium feature benefits',
          'Offer trial of premium features',
          'Highlight usage limits approaching'
        ],
        metadata: {
          segment: profile.segment,
          usage: profile.translationBehavior.totalTranslations
        }
      })
    }

    // Usage pattern insights
    const topHour = Object.entries(profile.translationBehavior.timePatterns)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (topHour) {
      insights.push({
        type: 'pattern',
        title: 'Peak Usage Time',
        description: `User is most active at ${topHour[0]}:00`,
        confidence: 0.8,
        severity: 'low',
        actionable: true,
        recommendations: [
          'Schedule notifications for peak hours',
          'Optimize server capacity for user timezone'
        ],
        metadata: {
          peakHour: topHour[0],
          usageCount: topHour[1]
        }
      })
    }

    this.insights.set(userId, insights)
    return insights
  }

  // Cohort analysis
  async getCohortAnalysis(timeframe: 'weekly' | 'monthly'): Promise<{
    cohorts: Array<{
      period: string
      users: number
      retention: Record<string, number>
    }>
  }> {
    // Implementation would analyze user retention by signup cohorts
    return { cohorts: [] }
  }

  // Funnel analysis
  async getFunnelAnalysis(steps: string[]): Promise<{
    totalUsers: number
    conversionRates: Record<string, number>
    dropoffPoints: Array<{
      step: string
      dropoffRate: number
      users: number
    }>
  }> {
    // Implementation would analyze conversion through defined steps
    return {
      totalUsers: 0,
      conversionRates: {},
      dropoffPoints: []
    }
  }

  // Periodic analysis
  private async runPeriodicAnalysis(): Promise<void> {
    // Run analysis for all active users
    for (const [userId, profile] of this.profiles) {
      await this.generateInsights(userId)
    }

    // Clean up old data
    this.cleanup()
  }

  private cleanup(): void {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    
    for (const [userId, profile] of this.profiles) {
      if (profile.lastActiveAt < cutoff) {
        this.profiles.delete(userId)
        this.journeys.delete(userId)
        this.insights.delete(userId)
      }
    }
  }

  // Data export
  async exportUserData(userId: string): Promise<{
    profile: UserBehaviorProfile | null
    journey: UserJourney | null
    insights: BehaviorInsight[]
  }> {
    return {
      profile: await this.getUserProfile(userId),
      journey: this.journeys.get(userId) || null,
      insights: this.insights.get(userId) || []
    }
  }

  // Aggregated analytics
  async getAggregatedMetrics(): Promise<{
    totalUsers: number
    activeUsers: {
      daily: number
      weekly: number
      monthly: number
    }
    segmentDistribution: Record<string, number>
    averageMetrics: {
      sessionsPerUser: number
      translationsPerUser: number
      sessionDuration: number
    }
    churnRate: number
    conversionRate: number
  }> {
    const profiles = Array.from(this.profiles.values())
    const now = Date.now()
    
    const activeDaily = profiles.filter(p => 
      now - p.lastActiveAt.getTime() < 24 * 60 * 60 * 1000
    ).length
    
    const activeWeekly = profiles.filter(p => 
      now - p.lastActiveAt.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length
    
    const activeMonthly = profiles.filter(p => 
      now - p.lastActiveAt.getTime() < 30 * 24 * 60 * 60 * 1000
    ).length

    const segmentDistribution: Record<string, number> = {}
    let totalSessions = 0
    let totalTranslations = 0
    let totalDuration = 0
    let churnedUsers = 0
    let convertedUsers = 0

    for (const profile of profiles) {
      segmentDistribution[profile.segment] = (segmentDistribution[profile.segment] || 0) + 1
      totalSessions += profile.totalSessions
      totalTranslations += profile.translationBehavior.totalTranslations
      totalDuration += profile.averageSessionDuration
      
      if (profile.conversionFunnel.retention === 'churned') churnedUsers++
      if (profile.tier !== 'free') convertedUsers++
    }

    return {
      totalUsers: profiles.length,
      activeUsers: {
        daily: activeDaily,
        weekly: activeWeekly,
        monthly: activeMonthly
      },
      segmentDistribution,
      averageMetrics: {
        sessionsPerUser: profiles.length > 0 ? totalSessions / profiles.length : 0,
        translationsPerUser: profiles.length > 0 ? totalTranslations / profiles.length : 0,
        sessionDuration: profiles.length > 0 ? totalDuration / profiles.length : 0
      },
      churnRate: profiles.length > 0 ? (churnedUsers / profiles.length) * 100 : 0,
      conversionRate: profiles.length > 0 ? (convertedUsers / profiles.length) * 100 : 0
    }
  }
}

// Export singleton instance
export const userBehaviorAnalyzer = new UserBehaviorAnalyzer()