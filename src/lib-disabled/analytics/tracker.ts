// Analytics and Usage Metrics Tracker
// Tracks user activity, document uploads, translations, and system usage

export interface AnalyticsEvent {
  event_type: string
  event_data: Record<string, unknown>
  user_id?: string
  session_id?: string
  timestamp: Date
  ip_address?: string
  user_agent?: string
}

export interface UsageMetrics {
  totalUploads: number
  totalTranslations: number
  averageFileSize: number
  popularLanguages: { language: string; count: number }[]
  uploadsByDate: { date: string; count: number }[]
  translationsByDate: { date: string; count: number }[]
  userActivity: { activeUsers: number; newUsers: number }
  storageUsage: number
  processingTime: { average: number; median: number }
}

export interface UserActivityMetrics {
  userId: string
  totalUploads: number
  totalTranslations: number
  storageUsed: number
  lastActive: Date
  joinDate: Date
  favoriteLanguages: string[]
  averageProcessingTime: number
}

export class AnalyticsTracker {
  private static sessionId: string | null = null

  static initializeSession(): string {
    if (typeof window !== 'undefined') {
      this.sessionId = this.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      return this.sessionId
    }
    return `server_session_${Date.now()}`
  }

  static async trackEvent(
    eventType: string,
    eventData: Record<string, unknown> = {},
    userId?: string
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        event_type: eventType,
        event_data: eventData,
        user_id: userId,
        session_id: this.initializeSession(),
        timestamp: new Date(),
        ip_address: await this.getClientIP(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      }

      // Send to analytics API
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics Event:', eventType, eventData)
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }

  // Common event tracking methods
  static async trackPageView(page: string, userId?: string): Promise<void> {
    await this.trackEvent('page_view', { page }, userId)
  }

  static async trackDocumentUpload(
    documentId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('document_upload', {
      document_id: documentId,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType
    }, userId)
  }

  static async trackTranslationStart(
    documentId: string,
    sourceLanguage: string,
    targetLanguage: string,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('translation_start', {
      document_id: documentId,
      source_language: sourceLanguage,
      target_language: targetLanguage
    }, userId)
  }

  static async trackTranslationComplete(
    translationId: string,
    documentId: string,
    sourceLanguage: string,
    targetLanguage: string,
    processingTime: number,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('translation_complete', {
      translation_id: translationId,
      document_id: documentId,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      processing_time: processingTime
    }, userId)
  }

  static async trackSearchQuery(
    query: string,
    filters: Record<string, unknown>,
    resultCount: number,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('search_query', {
      query,
      filters,
      result_count: resultCount
    }, userId)
  }

  static async trackUserLogin(userId: string, method: string = 'email'): Promise<void> {
    await this.trackEvent('user_login', { method }, userId)
  }

  static async trackUserSignup(userId: string, method: string = 'email'): Promise<void> {
    await this.trackEvent('user_signup', { method }, userId)
  }

  static async trackError(
    error: string,
    context: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    await this.trackEvent('error', {
      error_message: error,
      context
    }, userId)
  }

  static async trackFeatureUsage(
    feature: string,
    action: string,
    metadata: Record<string, unknown> = {},
    userId?: string
  ): Promise<void> {
    await this.trackEvent('feature_usage', {
      feature,
      action,
      ...metadata
    }, userId)
  }

  // Analytics data retrieval methods
  static async getUserMetrics(userId: string): Promise<UserActivityMetrics | null> {
    try {
      const response = await fetch(`/api/analytics/user/${userId}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch user metrics:', error)
      return null
    }
  }

  static async getSystemMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<UsageMetrics | null> {
    try {
      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString()
      })
      
      const response = await fetch(`/api/analytics/system?${params}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch system metrics:', error)
      return null
    }
  }

  static async getPopularLanguages(days: number = 30): Promise<{ language: string; count: number }[]> {
    try {
      const response = await fetch(`/api/analytics/languages?days=${days}`)
      if (!response.ok) return []
      const data = await response.json()
      return data.languages || []
    } catch (error) {
      console.error('Failed to fetch popular languages:', error)
      return []
    }
  }

  static async getUsageTrends(days: number = 30): Promise<{
    uploads: { date: string; count: number }[]
    translations: { date: string; count: number }[]
  }> {
    try {
      const response = await fetch(`/api/analytics/trends?days=${days}`)
      if (!response.ok) return { uploads: [], translations: [] }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch usage trends:', error)
      return { uploads: [], translations: [] }
    }
  }

  // Utility methods
  private static async getClientIP(): Promise<string | undefined> {
    try {
      if (typeof window !== 'undefined') {
        // Client-side - use a service or header
        const response = await fetch('/api/analytics/ip')
        const data = await response.json()
        return data.ip
      }
    } catch {
      // Fallback to undefined if IP detection fails
    }
    return undefined
  }

  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }
}