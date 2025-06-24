/**
 * PRISMY ANALYTICS ENGINE
 * Comprehensive analytics and tracking system
 */

export interface AnalyticsEvent {
  id: string
  type: string
  category: 'user' | 'system' | 'business' | 'performance' | 'error'
  action: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
  metadata: Record<string, any>
  timestamp: Date
  source: 'web' | 'mobile' | 'api' | 'system'
  environment: 'development' | 'staging' | 'production'
}

export interface UserSession {
  id: string
  userId?: string
  startTime: Date
  endTime?: Date
  duration?: number
  pageViews: number
  events: number
  referrer?: string
  userAgent: string
  ip: string
  country?: string
  city?: string
  device: {
    type: 'desktop' | 'mobile' | 'tablet'
    os: string
    browser: string
  }
  isFirstVisit: boolean
  isReturning: boolean
}

export interface AnalyticsMetrics {
  // User metrics
  activeUsers: {
    current: number
    daily: number
    weekly: number
    monthly: number
  }
  
  // Usage metrics
  translations: {
    total: number
    successful: number
    failed: number
    averageTime: number
    totalWords: number
    totalCharacters: number
  }
  
  // Performance metrics
  performance: {
    averageResponseTime: number
    apiLatency: number
    errorRate: number
    uptime: number
  }
  
  // Business metrics
  revenue: {
    total: number
    mrr: number // Monthly Recurring Revenue
    arr: number // Annual Recurring Revenue
    churn: number
    ltv: number // Lifetime Value
  }
  
  // Feature usage
  features: Record<string, {
    usage: number
    uniqueUsers: number
    averageTime: number
  }>
}

export interface AnalyticsFilter {
  dateRange?: {
    start: Date
    end: Date
  }
  userId?: string
  category?: AnalyticsEvent['category']
  source?: AnalyticsEvent['source']
  eventType?: string
}

export class AnalyticsEngine {
  private events = new Map<string, AnalyticsEvent>()
  private sessions = new Map<string, UserSession>()
  private metrics: AnalyticsMetrics
  private subscribers = new Set<(event: AnalyticsEvent) => void>()

  constructor() {
    this.metrics = this.initializeMetrics()
    
    // Auto-cleanup old events and sessions
    setInterval(() => {
      this.cleanup()
    }, 60000) // Every minute
  }

  // Event tracking
  async track(eventData: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<string> {
    const event: AnalyticsEvent = {
      ...eventData,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    this.events.set(event.id, event)
    
    // Update metrics
    await this.updateMetrics(event)
    
    // Notify subscribers
    this.notifySubscribers(event)
    
    // Store in external services if configured
    await this.storeEvent(event)

    return event.id
  }

  // Session management
  async startSession(sessionData: Omit<UserSession, 'id' | 'startTime' | 'pageViews' | 'events'>): Promise<string> {
    const session: UserSession = {
      ...sessionData,
      id: this.generateSessionId(),
      startTime: new Date(),
      pageViews: 0,
      events: 0
    }

    this.sessions.set(session.id, session)
    
    // Track session start event
    await this.track({
      type: 'session_start',
      category: 'user',
      action: 'start_session',
      sessionId: session.id,
      userId: session.userId,
      metadata: {
        device: session.device,
        referrer: session.referrer,
        isFirstVisit: session.isFirstVisit,
        isReturning: session.isReturning
      },
      source: session.device.type === 'mobile' ? 'mobile' : 'web',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    })

    return session.id
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.endTime = new Date()
    session.duration = session.endTime.getTime() - session.startTime.getTime()

    // Track session end event
    await this.track({
      type: 'session_end',
      category: 'user',
      action: 'end_session',
      sessionId,
      userId: session.userId,
      value: session.duration,
      metadata: {
        duration: session.duration,
        pageViews: session.pageViews,
        events: session.events
      },
      source: session.device.type === 'mobile' ? 'mobile' : 'web',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    })
  }

  // Page view tracking
  async trackPageView(sessionId: string, path: string, title?: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.pageViews++
    }

    await this.track({
      type: 'page_view',
      category: 'user',
      action: 'view_page',
      label: path,
      sessionId,
      userId: session?.userId,
      metadata: {
        path,
        title,
        referrer: document?.referrer
      },
      source: 'web',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    })
  }

  // Translation analytics
  async trackTranslation(
    sessionId: string,
    userId: string | undefined,
    translationData: {
      sourceLanguage: string
      targetLanguage: string
      wordCount: number
      characterCount: number
      processingTime: number
      success: boolean
      method: 'text' | 'document' | 'image' | 'voice'
      error?: string
    }
  ): Promise<void> {
    await this.track({
      type: 'translation',
      category: 'business',
      action: translationData.success ? 'translation_success' : 'translation_failure',
      value: translationData.wordCount,
      sessionId,
      userId,
      metadata: translationData,
      source: 'web',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    })

    // Update translation metrics
    this.metrics.translations.total++
    this.metrics.translations.totalWords += translationData.wordCount
    this.metrics.translations.totalCharacters += translationData.characterCount
    
    if (translationData.success) {
      this.metrics.translations.successful++
      this.metrics.translations.averageTime = 
        (this.metrics.translations.averageTime * (this.metrics.translations.successful - 1) + translationData.processingTime) 
        / this.metrics.translations.successful
    } else {
      this.metrics.translations.failed++
    }
  }

  // Error tracking
  async trackError(
    sessionId: string,
    userId: string | undefined,
    error: {
      message: string
      stack?: string
      code?: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      context?: Record<string, any>
    }
  ): Promise<void> {
    await this.track({
      type: 'error',
      category: 'error',
      action: 'error_occurred',
      label: error.code || 'unknown',
      sessionId,
      userId,
      metadata: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        severity: error.severity,
        context: error.context
      },
      source: 'system',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    })
  }

  // Performance tracking
  async trackPerformance(
    sessionId: string,
    metric: {
      name: string
      value: number
      unit: 'ms' | 'bytes' | 'count' | 'percentage'
      category: 'load_time' | 'bundle_size' | 'api_response' | 'memory_usage'
      context?: Record<string, any>
    }
  ): Promise<void> {
    await this.track({
      type: 'performance',
      category: 'performance',
      action: 'metric_recorded',
      label: metric.name,
      value: metric.value,
      sessionId,
      metadata: {
        unit: metric.unit,
        category: metric.category,
        context: metric.context
      },
      source: 'system',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    })

    // Update performance metrics
    if (metric.category === 'api_response') {
      this.metrics.performance.apiLatency = 
        (this.metrics.performance.apiLatency + metric.value) / 2
    }
  }

  // Feature usage tracking
  async trackFeatureUsage(
    sessionId: string,
    userId: string | undefined,
    feature: string,
    action: 'start' | 'complete' | 'cancel',
    duration?: number
  ): Promise<void> {
    await this.track({
      type: 'feature_usage',
      category: 'user',
      action: `feature_${action}`,
      label: feature,
      value: duration,
      sessionId,
      userId,
      metadata: {
        feature,
        duration
      },
      source: 'web',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    })

    // Update feature metrics
    if (!this.metrics.features[feature]) {
      this.metrics.features[feature] = {
        usage: 0,
        uniqueUsers: 0,
        averageTime: 0
      }
    }

    const featureMetric = this.metrics.features[feature]
    
    if (action === 'complete' && duration) {
      featureMetric.usage++
      featureMetric.averageTime = 
        (featureMetric.averageTime * (featureMetric.usage - 1) + duration) / featureMetric.usage
    }
  }

  // Query and reporting
  async getEvents(filter?: AnalyticsFilter): Promise<AnalyticsEvent[]> {
    let events = Array.from(this.events.values())

    if (filter) {
      events = events.filter(event => {
        if (filter.dateRange) {
          const eventTime = event.timestamp.getTime()
          const start = filter.dateRange.start.getTime()
          const end = filter.dateRange.end.getTime()
          if (eventTime < start || eventTime > end) return false
        }

        if (filter.userId && event.userId !== filter.userId) return false
        if (filter.category && event.category !== filter.category) return false
        if (filter.source && event.source !== filter.source) return false
        if (filter.eventType && event.type !== filter.eventType) return false

        return true
      })
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  async getMetrics(): Promise<AnalyticsMetrics> {
    // Update real-time metrics
    await this.calculateRealTimeMetrics()
    return { ...this.metrics }
  }

  async getUserJourney(userId: string): Promise<AnalyticsEvent[]> {
    return this.getEvents({ userId })
  }

  async getSessionEvents(sessionId: string): Promise<AnalyticsEvent[]> {
    return Array.from(this.events.values())
      .filter(event => event.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  // Subscription system for real-time updates
  subscribe(callback: (event: AnalyticsEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // Private methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeMetrics(): AnalyticsMetrics {
    return {
      activeUsers: {
        current: 0,
        daily: 0,
        weekly: 0,
        monthly: 0
      },
      translations: {
        total: 0,
        successful: 0,
        failed: 0,
        averageTime: 0,
        totalWords: 0,
        totalCharacters: 0
      },
      performance: {
        averageResponseTime: 0,
        apiLatency: 0,
        errorRate: 0,
        uptime: 100
      },
      revenue: {
        total: 0,
        mrr: 0,
        arr: 0,
        churn: 0,
        ltv: 0
      },
      features: {}
    }
  }

  private async updateMetrics(event: AnalyticsEvent): Promise<void> {
    // Update active users based on sessions
    const now = new Date()
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => !session.endTime || (now.getTime() - session.endTime.getTime()) < 30 * 60 * 1000) // 30 minutes

    this.metrics.activeUsers.current = activeSessions.length
  }

  private async calculateRealTimeMetrics(): Promise<void> {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Calculate daily, weekly, monthly active users
    const dailyUsers = new Set()
    const weeklyUsers = new Set()
    const monthlyUsers = new Set()

    for (const event of this.events.values()) {
      if (!event.userId) continue

      if (event.timestamp >= oneDayAgo) dailyUsers.add(event.userId)
      if (event.timestamp >= oneWeekAgo) weeklyUsers.add(event.userId)
      if (event.timestamp >= oneMonthAgo) monthlyUsers.add(event.userId)
    }

    this.metrics.activeUsers.daily = dailyUsers.size
    this.metrics.activeUsers.weekly = weeklyUsers.size
    this.metrics.activeUsers.monthly = monthlyUsers.size

    // Calculate error rate
    const totalEvents = this.events.size
    const errorEvents = Array.from(this.events.values())
      .filter(event => event.category === 'error').length
    
    this.metrics.performance.errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0
  }

  private notifySubscribers(event: AnalyticsEvent): void {
    for (const callback of this.subscribers) {
      try {
        callback(event)
      } catch (error) {
        console.error('Analytics subscriber error:', error)
      }
    }
  }

  private async storeEvent(event: AnalyticsEvent): Promise<void> {
    // Store in external analytics services (Google Analytics, Mixpanel, etc.)
    // This would be implemented based on configured services
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external analytics service
      // await this.sendToGoogleAnalytics(event)
      // await this.sendToMixpanel(event)
    }
  }

  private cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    
    // Remove old events
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoff) {
        this.events.delete(id)
      }
    }

    // Remove old sessions
    for (const [id, session] of this.sessions.entries()) {
      if (session.endTime && session.endTime < cutoff) {
        this.sessions.delete(id)
      }
    }
  }
}

// Export singleton instance
export const analyticsEngine = new AnalyticsEngine()