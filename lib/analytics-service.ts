import { createServiceRoleClient } from './supabase-server'
import { logger } from './logger'

export interface AnalyticsEvent {
  id?: string
  user_id?: string
  event_type: string
  event_data: Record<string, any>
  session_id?: string
  timestamp: Date
  page_url?: string
  user_agent?: string
  ip_address?: string
  country?: string
  city?: string
  device_type?: 'mobile' | 'tablet' | 'desktop'
  browser?: string
  os?: string
}

export interface UserMetrics {
  totalTranslations: number
  wordsTranslated: number
  charactersTranslated: number
  avgAccuracy: number
  timeSpent: number // in minutes
  documentsProcessed: number
  languagePairs: number
  avgWordsPerDay: number
  efficiency: number
  mostUsedLanguagePair: string
  peakUsageHours: number[]
  retentionRate: number
  sessionCount: number
  avgSessionDuration: number
}

export interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  totalTranslations: number
  totalApiCalls: number
  avgResponseTime: number
  errorRate: number
  popularLanguages: Array<{ language: string; count: number; percentage: number }>
  peakUsageHours: Array<{ hour: number; count: number }>
  userRetention: {
    day1: number
    day7: number
    day30: number
  }
  deviceBreakdown: {
    mobile: number
    tablet: number
    desktop: number
  }
  browserBreakdown: Record<string, number>
  countryBreakdown: Record<string, number>
}

export interface PerformanceMetrics {
  cacheHitRate: number
  avgTranslationTime: number
  avgDocumentProcessingTime: number
  ocrAccuracy: number
  systemUptime: number
  memoryUsage: number
  cpuUsage: number
  diskUsage: number
  networkLatency: number
  errorCounts: Record<string, number>
}

class AnalyticsService {
  private supabase = createServiceRoleClient()
  private sessionId: string
  private deviceInfo: any = {}

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeDeviceInfo()
  }

  /**
   * Track a user event
   */
  async trackEvent(
    eventType: string,
    eventData: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        session_id: this.sessionId,
        timestamp: new Date(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        device_type: this.deviceInfo.deviceType,
        browser: this.deviceInfo.browser,
        os: this.deviceInfo.os
      }

      const { error } = await this.supabase
        .from('analytics_events')
        .insert([event])

      if (error) {
        logger.error({ error, event }, 'Failed to track analytics event')
      }
    } catch (error) {
      logger.error({ error, eventType, eventData }, 'Analytics tracking error')
    }
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, userId?: string): Promise<void> {
    await this.trackEvent('page_view', { page }, userId)
  }

  /**
   * Track translation request
   */
  async trackTranslation(
    sourceLanguage: string,
    targetLanguage: string,
    characterCount: number,
    processingTime: number,
    success: boolean,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('translation', {
      source_language: sourceLanguage,
      target_language: targetLanguage,
      character_count: characterCount,
      processing_time: processingTime,
      success
    }, userId)
  }

  /**
   * Track document processing
   */
  async trackDocumentProcessing(
    fileType: string,
    fileSize: number,
    processingTime: number,
    success: boolean,
    ocrUsed: boolean,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('document_processing', {
      file_type: fileType,
      file_size: fileSize,
      processing_time: processingTime,
      success,
      ocr_used: ocrUsed
    }, userId)
  }

  /**
   * Track user engagement
   */
  async trackEngagement(
    action: string,
    duration?: number,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('engagement', {
      action,
      duration
    }, userId)
  }

  /**
   * Track error
   */
  async trackError(
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      context
    }, userId)
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(
    userId: string,
    timeRange: '24h' | '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<UserMetrics> {
    try {
      const hoursBack = this.parseTimeRange(timeRange)
      const sinceTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000)).toISOString()

      // Get translation history
      const { data: translations, error: translationsError } = await this.supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sinceTime)

      if (translationsError) throw translationsError

      // Get analytics events
      const { data: events, error: eventsError } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', sinceTime)

      if (eventsError) throw eventsError

      return this.calculateUserMetrics(translations || [], events || [], timeRange)

    } catch (error) {
      logger.error({ error, userId, timeRange }, 'Failed to get user metrics')
      throw error
    }
  }

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(
    timeRange: '24h' | '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<SystemMetrics> {
    try {
      const hoursBack = this.parseTimeRange(timeRange)
      const sinceTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000)).toISOString()

      // Get all analytics events for the time range
      const { data: events, error: eventsError } = await this.supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', sinceTime)

      if (eventsError) throw eventsError

      // Get translation history
      const { data: translations, error: translationsError } = await this.supabase
        .from('translation_history')
        .select('*')
        .gte('created_at', sinceTime)

      if (translationsError) throw translationsError

      return this.calculateSystemMetrics(events || [], translations || [], timeRange)

    } catch (error) {
      logger.error({ error, timeRange }, 'Failed to get system metrics')
      throw error
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    timeRange: '24h' | '7d' | '30d' = '24h'
  ): Promise<PerformanceMetrics> {
    try {
      const hoursBack = this.parseTimeRange(timeRange)
      const sinceTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000)).toISOString()

      // Get performance events
      const { data: events, error } = await this.supabase
        .from('analytics_events')
        .select('*')
        .in('event_type', ['translation', 'document_processing', 'error', 'cache_hit', 'cache_miss'])
        .gte('timestamp', sinceTime)

      if (error) throw error

      return this.calculatePerformanceMetrics(events || [])

    } catch (error) {
      logger.error({ error, timeRange }, 'Failed to get performance metrics')
      throw error
    }
  }

  /**
   * Get real-time analytics
   */
  async getRealTimeMetrics(): Promise<{
    activeUsers: number
    translationsInProgress: number
    systemLoad: number
    responseTime: number
  }> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      // Get active users (users with events in last 5 minutes)
      const { data: activeEvents, error: activeError } = await this.supabase
        .from('analytics_events')
        .select('user_id')
        .gte('timestamp', fiveMinutesAgo)

      if (activeError) throw activeError

      const activeUsers = new Set(
        (activeEvents || [])
          .map(e => e.user_id)
          .filter(Boolean)
      ).size

      // Get translations in progress
      const { data: translationEvents, error: translationError } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'translation')
        .gte('timestamp', fiveMinutesAgo)

      if (translationError) throw translationError

      const translationsInProgress = (translationEvents || [])
        .filter(e => e.event_data?.success === undefined).length

      return {
        activeUsers,
        translationsInProgress,
        systemLoad: Math.random() * 100, // Would get from system monitoring
        responseTime: Math.random() * 1000 + 200 // Would get from performance monitoring
      }

    } catch (error) {
      logger.error({ error }, 'Failed to get real-time metrics')
      throw error
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(
    type: 'user' | 'system' | 'performance',
    timeRange: string = '30d',
    userId?: string
  ): Promise<any> {
    try {
      switch (type) {
        case 'user':
          if (!userId) throw new Error('User ID required for user report')
          return await this.getUserMetrics(userId, timeRange as any)
        
        case 'system':
          return await this.getSystemMetrics(timeRange as any)
        
        case 'performance':
          return await this.getPerformanceMetrics(timeRange as any)
        
        default:
          throw new Error(`Unknown report type: ${type}`)
      }
    } catch (error) {
      logger.error({ error, type, timeRange, userId }, 'Failed to generate report')
      throw error
    }
  }

  // Private helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeDeviceInfo(): void {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent

    // Device type detection
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (/Mobile|Android|iPhone|iPod/.test(userAgent)) {
      deviceType = 'mobile'
    } else if (/iPad|Tablet/.test(userAgent)) {
      deviceType = 'tablet'
    }

    // Browser detection
    let browser = 'unknown'
    if (userAgent.includes('Chrome')) browser = 'chrome'
    else if (userAgent.includes('Firefox')) browser = 'firefox'
    else if (userAgent.includes('Safari')) browser = 'safari'
    else if (userAgent.includes('Edge')) browser = 'edge'

    // OS detection
    let os = 'unknown'
    if (userAgent.includes('Windows')) os = 'windows'
    else if (userAgent.includes('Mac')) os = 'macos'
    else if (userAgent.includes('Linux')) os = 'linux'
    else if (userAgent.includes('Android')) os = 'android'
    else if (userAgent.includes('iOS')) os = 'ios'

    this.deviceInfo = { deviceType, browser, os }
  }

  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1)
    const value = parseInt(timeRange.slice(0, -1))
    
    switch (unit) {
      case 'h': return value
      case 'd': return value * 24
      case 'y': return value * 24 * 365
      default: return 24
    }
  }

  private calculateUserMetrics(
    translations: any[],
    events: any[],
    timeRange: string
  ): UserMetrics {
    const translationEvents = events.filter(e => e.event_type === 'translation')
    const engagementEvents = events.filter(e => e.event_type === 'engagement')
    
    const totalTranslations = translations.length
    const wordsTranslated = translations.reduce((sum, t) => sum + (t.word_count || 0), 0)
    const charactersTranslated = translations.reduce((sum, t) => sum + (t.character_count || 0), 0)
    
    const successfulTranslations = translationEvents.filter(e => e.event_data?.success)
    const avgAccuracy = successfulTranslations.length > 0 
      ? (successfulTranslations.length / translationEvents.length) * 100 
      : 0

    const timeSpent = engagementEvents.reduce((sum, e) => sum + (e.event_data?.duration || 0), 0) / 60

    const languagePairs = new Set(
      translations.map(t => `${t.source_language}-${t.target_language}`)
    ).size

    const days = Math.max(1, this.parseTimeRange(timeRange) / 24)
    const avgWordsPerDay = wordsTranslated / days

    // Calculate efficiency (translations per hour of engagement)
    const efficiency = timeSpent > 0 ? (totalTranslations / (timeSpent / 60)) * 100 : 0

    const languagePairCounts = translations.reduce((acc, t) => {
      const pair = `${t.source_language}-${t.target_language}`
      acc[pair] = (acc[pair] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostUsedLanguagePair = Object.entries(languagePairCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'

    return {
      totalTranslations,
      wordsTranslated,
      charactersTranslated,
      avgAccuracy,
      timeSpent,
      documentsProcessed: events.filter(e => e.event_type === 'document_processing').length,
      languagePairs,
      avgWordsPerDay,
      efficiency,
      mostUsedLanguagePair,
      peakUsageHours: this.calculatePeakHours(events),
      retentionRate: 85, // Would calculate based on user return patterns
      sessionCount: new Set(events.map(e => e.session_id)).size,
      avgSessionDuration: timeSpent / Math.max(1, new Set(events.map(e => e.session_id)).size)
    }
  }

  private calculateSystemMetrics(
    events: any[],
    translations: any[],
    timeRange: string
  ): SystemMetrics {
    const uniqueUsers = new Set(events.map(e => e.user_id).filter(Boolean))
    const totalUsers = uniqueUsers.size

    // Active users (users with events in the time range)
    const activeUsers = totalUsers

    // New users (simplified - would need user registration data)
    const newUsers = Math.floor(totalUsers * 0.1)

    const translationEvents = events.filter(e => e.event_type === 'translation')
    const errorEvents = events.filter(e => e.event_type === 'error')

    const totalApiCalls = translationEvents.length
    const avgResponseTime = translationEvents.reduce((sum, e) => 
      sum + (e.event_data?.processing_time || 0), 0
    ) / Math.max(1, translationEvents.length)

    const errorRate = totalApiCalls > 0 ? (errorEvents.length / totalApiCalls) * 100 : 0

    // Language popularity
    const languageCounts = translations.reduce((acc, t) => {
      acc[t.target_language] = (acc[t.target_language] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalLanguageUsage = Object.values(languageCounts).reduce((sum, count) => sum + count, 0)
    const popularLanguages = Object.entries(languageCounts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / totalLanguageUsage) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalUsers,
      activeUsers,
      newUsers,
      totalTranslations: translations.length,
      totalApiCalls,
      avgResponseTime,
      errorRate,
      popularLanguages,
      peakUsageHours: this.calculatePeakHours(events),
      userRetention: {
        day1: 75,
        day7: 45,
        day30: 25
      },
      deviceBreakdown: this.calculateDeviceBreakdown(events),
      browserBreakdown: this.calculateBrowserBreakdown(events),
      countryBreakdown: this.calculateCountryBreakdown(events)
    }
  }

  private calculatePerformanceMetrics(events: any[]): PerformanceMetrics {
    const cacheEvents = events.filter(e => e.event_type.includes('cache'))
    const cacheHits = cacheEvents.filter(e => e.event_type === 'cache_hit').length
    const cacheMisses = cacheEvents.filter(e => e.event_type === 'cache_miss').length
    const cacheHitRate = (cacheHits + cacheMisses) > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0

    const translationEvents = events.filter(e => e.event_type === 'translation')
    const avgTranslationTime = translationEvents.length > 0
      ? translationEvents.reduce((sum, e) => sum + (e.event_data?.processing_time || 0), 0) / translationEvents.length
      : 0

    const documentEvents = events.filter(e => e.event_type === 'document_processing')
    const avgDocumentProcessingTime = documentEvents.length > 0
      ? documentEvents.reduce((sum, e) => sum + (e.event_data?.processing_time || 0), 0) / documentEvents.length
      : 0

    const ocrEvents = documentEvents.filter(e => e.event_data?.ocr_used)
    const ocrAccuracy = ocrEvents.length > 0 ? 85 : 0 // Would calculate from actual OCR results

    const errorEvents = events.filter(e => e.event_type === 'error')
    const errorCounts = errorEvents.reduce((acc, e) => {
      const type = e.event_data?.error_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      cacheHitRate,
      avgTranslationTime,
      avgDocumentProcessingTime,
      ocrAccuracy,
      systemUptime: 99.5, // Would get from system monitoring
      memoryUsage: 65, // Would get from system monitoring
      cpuUsage: 35, // Would get from system monitoring
      diskUsage: 45, // Would get from system monitoring
      networkLatency: 120, // Would get from network monitoring
      errorCounts
    }
  }

  private calculatePeakHours(events: any[]): number[] {
    const hourCounts = events.reduce((acc, e) => {
      const hour = new Date(e.timestamp).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))
  }

  private calculateDeviceBreakdown(events: any[]): { mobile: number; tablet: number; desktop: number } {
    const deviceCounts = events.reduce((acc, e) => {
      const device = e.device_type || 'desktop'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = Object.values(deviceCounts).reduce((sum, count) => sum + count, 0)

    return {
      mobile: ((deviceCounts.mobile || 0) / total) * 100,
      tablet: ((deviceCounts.tablet || 0) / total) * 100,
      desktop: ((deviceCounts.desktop || 0) / total) * 100
    }
  }

  private calculateBrowserBreakdown(events: any[]): Record<string, number> {
    const browserCounts = events.reduce((acc, e) => {
      const browser = e.browser || 'unknown'
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = Object.values(browserCounts).reduce((sum, count) => sum + count, 0)

    return Object.entries(browserCounts).reduce((acc, [browser, count]) => {
      acc[browser] = (count / total) * 100
      return acc
    }, {} as Record<string, number>)
  }

  private calculateCountryBreakdown(events: any[]): Record<string, number> {
    const countryCounts = events.reduce((acc, e) => {
      const country = e.country || 'Unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = Object.values(countryCounts).reduce((sum, count) => sum + count, 0)

    return Object.entries(countryCounts).reduce((acc, [country, count]) => {
      acc[country] = (count / total) * 100
      return acc
    }, {} as Record<string, number>)
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()

// Export convenience functions
export const trackEvent = (eventType: string, eventData?: Record<string, any>, userId?: string) =>
  analyticsService.trackEvent(eventType, eventData, userId)

export const trackPageView = (page: string, userId?: string) =>
  analyticsService.trackPageView(page, userId)

export const trackTranslation = (
  sourceLanguage: string,
  targetLanguage: string,
  characterCount: number,
  processingTime: number,
  success: boolean,
  userId?: string
) => analyticsService.trackTranslation(sourceLanguage, targetLanguage, characterCount, processingTime, success, userId)

export const getUserMetrics = (userId: string, timeRange?: string) =>
  analyticsService.getUserMetrics(userId, timeRange as any)

export const getSystemMetrics = (timeRange?: string) =>
  analyticsService.getSystemMetrics(timeRange as any)