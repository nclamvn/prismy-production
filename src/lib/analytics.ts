// Comprehensive Analytics Service for Prismy
import { logger } from './logger'

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
  page?: string
  userAgent?: string
  referrer?: string
}

export interface UserProperties {
  id?: string
  email?: string
  plan?: 'free' | 'premium' | 'enterprise'
  language?: string
  country?: string
  timezone?: string
  firstVisit?: string
  lastActive?: string
  totalSessions?: number
}

export interface TranslationAnalytics {
  sourceLanguage: string
  targetLanguage: string
  textLength: number
  documentType?: string
  translationTime: number
  confidence?: number
  correctionsMade?: number
  userSatisfaction?: number
}

export interface DocumentAnalytics {
  documentId: string
  filename: string
  fileSize: number
  fileType: string
  processingTime: number
  pagesCount?: number
  wordsCount?: number
  ocrUsed: boolean
  uploadMethod: 'drag-drop' | 'click' | 'api'
  errors?: string[]
}

export interface PerformanceAnalytics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  bundleSize: number
  api: {
    endpoint: string
    responseTime: number
    status: number
    error?: string
  }[]
}

export interface ConversionAnalytics {
  event: 'signup' | 'upgrade' | 'subscription' | 'cancellation'
  value?: number
  currency?: string
  plan?: string
  source?: string
  medium?: string
  campaign?: string
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private userId?: string
  private userProperties: UserProperties = {}
  private pageStartTime: number = Date.now()
  private isInitialized: boolean = false
  private batchQueue: AnalyticsEvent[] = []
  private batchTimer?: NodeJS.Timeout

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeSession()
  }

  // Initialize analytics service
  async initialize(config?: {
    userId?: string
    userProperties?: UserProperties
    apiEndpoint?: string
    batchSize?: number
    batchInterval?: number
  }) {
    try {
      if (config?.userId) {
        this.userId = config.userId
      }

      if (config?.userProperties) {
        this.userProperties = { ...this.userProperties, ...config.userProperties }
      }

      // Track page view
      this.trackPageView()

      // Setup automatic tracking
      this.setupAutomaticTracking()

      this.isInitialized = true
      logger.info('Analytics service initialized', { sessionId: this.sessionId })
    } catch (error) {
      logger.error({ error }, 'Failed to initialize analytics service')
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Initialize session tracking
  private initializeSession() {
    if (typeof window === 'undefined') return

    // Detect if returning user
    const lastSession = localStorage.getItem('prismy_last_session')
    const isReturning = !!lastSession

    // Update session info
    localStorage.setItem('prismy_last_session', this.sessionId)
    localStorage.setItem('prismy_session_start', Date.now().toString())

    // Track session start
    this.track('session_start', {
      isReturning,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    })
  }

  // Setup automatic event tracking
  private setupAutomaticTracking() {
    if (typeof window === 'undefined') return

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', { timeOnPage: Date.now() - this.pageStartTime })
      } else {
        this.track('page_visible')
        this.pageStartTime = Date.now()
      }
    })

    // Track errors
    window.addEventListener('error', (event) => {
      this.track('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      })
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.track('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      })
    })

    // Track page unload
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - this.pageStartTime
      this.track('page_unload', { timeOnPage })
      this.flush() // Send any pending events
    })

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.closest('button') || target
        this.track('button_click', {
          text: button.textContent?.trim(),
          className: button.className,
          id: button.id
        })
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a') || target as HTMLAnchorElement
        this.track('link_click', {
          url: link.href,
          text: link.textContent?.trim(),
          external: link.hostname !== window.location.hostname
        })
      }
    })
  }

  // Core tracking method
  track(eventName: string, properties?: Record<string, any>, options?: {
    userId?: string
    timestamp?: number
  }) {
    try {
      const event: AnalyticsEvent = {
        name: eventName,
        properties: {
          ...properties,
          sessionId: this.sessionId,
          page: window.location.pathname,
          referrer: document.referrer,
          userAgent: navigator.userAgent
        },
        timestamp: options?.timestamp || Date.now(),
        userId: options?.userId || this.userId,
        sessionId: this.sessionId,
        page: window.location.pathname
      }

      // Add to batch queue
      this.batchQueue.push(event)
      this.events.push(event)

      // Schedule batch send if not already scheduled
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.sendBatch(), 5000)
      }

      logger.debug({ event }, 'Analytics event tracked')
    } catch (error) {
      logger.error({ error, eventName }, 'Failed to track analytics event')
    }
  }

  // Track page views
  trackPageView(page?: string, title?: string) {
    this.pageStartTime = Date.now()
    
    this.track('page_view', {
      page: page || window.location.pathname,
      title: title || document.title,
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    })
  }

  // Track translation events
  trackTranslation(analytics: TranslationAnalytics) {
    this.track('translation_completed', {
      sourceLanguage: analytics.sourceLanguage,
      targetLanguage: analytics.targetLanguage,
      textLength: analytics.textLength,
      documentType: analytics.documentType,
      translationTime: analytics.translationTime,
      confidence: analytics.confidence,
      correctionsMade: analytics.correctionsMade,
      userSatisfaction: analytics.userSatisfaction
    })
  }

  // Track document processing
  trackDocument(analytics: DocumentAnalytics) {
    this.track('document_processed', {
      documentId: analytics.documentId,
      filename: analytics.filename,
      fileSize: analytics.fileSize,
      fileType: analytics.fileType,
      processingTime: analytics.processingTime,
      pagesCount: analytics.pagesCount,
      wordsCount: analytics.wordsCount,
      ocrUsed: analytics.ocrUsed,
      uploadMethod: analytics.uploadMethod,
      hasErrors: analytics.errors && analytics.errors.length > 0,
      errorCount: analytics.errors?.length || 0
    })
  }

  // Track performance metrics
  trackPerformance(analytics: PerformanceAnalytics) {
    this.track('performance_metrics', {
      pageLoadTime: analytics.pageLoadTime,
      firstContentfulPaint: analytics.firstContentfulPaint,
      largestContentfulPaint: analytics.largestContentfulPaint,
      firstInputDelay: analytics.firstInputDelay,
      cumulativeLayoutShift: analytics.cumulativeLayoutShift,
      bundleSize: analytics.bundleSize,
      apiCallsCount: analytics.api.length,
      averageApiResponseTime: analytics.api.reduce((sum, call) => sum + call.responseTime, 0) / analytics.api.length,
      errorRate: analytics.api.filter(call => call.status >= 400).length / analytics.api.length
    })
  }

  // Track conversion events
  trackConversion(analytics: ConversionAnalytics) {
    this.track('conversion', {
      event: analytics.event,
      value: analytics.value,
      currency: analytics.currency,
      plan: analytics.plan,
      source: analytics.source,
      medium: analytics.medium,
      campaign: analytics.campaign
    })
  }

  // Track user actions
  trackUserAction(action: string, properties?: Record<string, any>) {
    this.track('user_action', {
      action,
      ...properties
    })
  }

  // Track feature usage
  trackFeatureUsage(feature: string, properties?: Record<string, any>) {
    this.track('feature_used', {
      feature,
      ...properties
    })
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context
    })
  }

  // Set user properties
  setUserProperties(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties }
    this.track('user_properties_updated', properties)
  }

  // Set user ID
  setUserId(userId: string) {
    this.userId = userId
    this.track('user_identified', { userId })
  }

  // Send batch of events to analytics service
  private async sendBatch() {
    if (this.batchQueue.length === 0) return

    try {
      const events = [...this.batchQueue]
      this.batchQueue = []

      // In a real implementation, send to your analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events })
      // })

      // For now, just log the batch
      logger.info({ 
        eventsCount: events.length,
        eventTypes: [...new Set(events.map(e => e.name))]
      }, 'Analytics batch sent')

    } catch (error) {
      logger.error({ error }, 'Failed to send analytics batch')
      // Re-add events to queue for retry
      this.batchQueue.unshift(...this.batchQueue)
    } finally {
      this.batchTimer = undefined
    }
  }

  // Flush all pending events
  flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }
    this.sendBatch()
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const events = this.events
    const eventTypes = [...new Set(events.map(e => e.name))]
    
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userProperties: this.userProperties,
      totalEvents: events.length,
      eventTypes,
      sessionDuration: Date.now() - (events[0]?.timestamp || Date.now()),
      mostFrequentEvents: this.getMostFrequentEvents(events),
      recentEvents: events.slice(-10)
    }
  }

  // Get most frequent events
  private getMostFrequentEvents(events: AnalyticsEvent[]) {
    const counts = events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }

  // Export analytics data
  exportData(format: 'json' | 'csv' = 'json'): string {
    const summary = this.getAnalyticsSummary()
    
    if (format === 'csv') {
      const headers = ['timestamp', 'event', 'userId', 'sessionId', 'page', 'properties']
      const rows = this.events.map(event => [
        event.timestamp,
        event.name,
        event.userId || '',
        event.sessionId || '',
        event.page || '',
        JSON.stringify(event.properties || {})
      ])
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    }
    
    return JSON.stringify(summary, null, 2)
  }

  // Clear analytics data
  clear() {
    this.events = []
    this.batchQueue = []
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }
  }

  // Privacy compliance - opt out
  optOut() {
    this.clear()
    localStorage.setItem('prismy_analytics_opt_out', 'true')
    logger.info('User opted out of analytics')
  }

  // Check if user has opted out
  hasOptedOut(): boolean {
    return localStorage.getItem('prismy_analytics_opt_out') === 'true'
  }
}

// Singleton instance
export const analytics = new AnalyticsService()

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackTranslation: analytics.trackTranslation.bind(analytics),
    trackDocument: analytics.trackDocument.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics)
  }
}

// Export types
export type {
  AnalyticsEvent,
  UserProperties,
  TranslationAnalytics,
  DocumentAnalytics,
  PerformanceAnalytics,
  ConversionAnalytics
}