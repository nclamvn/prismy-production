/**
 * 🩺 Endoscope Method - Sensor A: Auth Analytics & Event Logger
 * 
 * Centralized OAuth pipeline monitoring with performance timing,
 * error tracking, and Sentry integration for production diagnostics.
 */

type AuthEventType = 
  | 'oauth_start'
  | 'oauth_google_redirect' 
  | 'oauth_callback_enter'
  | 'oauth_exchange_start'
  | 'oauth_exchange_success'
  | 'oauth_exchange_error'
  | 'oauth_workspace_mount'
  | 'oauth_session_restored'
  | 'oauth_complete'
  | 'signout_start'
  | 'signout_local_clear'
  | 'signout_network_call'
  | 'signout_complete'
  | 'session_refresh'
  | 'session_expired'

interface AuthEvent {
  type: AuthEventType
  timestamp: number
  duration?: number
  metadata?: Record<string, any>
  error?: {
    message: string
    code?: string
    stack?: string
  }
  performance?: {
    networkTime?: number
    renderTime?: number
    totalTime?: number
  }
}

interface AuthSession {
  sessionId: string
  startTime: number
  events: AuthEvent[]
  completed: boolean
  success: boolean
}

class AuthAnalytics {
  private sessions = new Map<string, AuthSession>()
  private currentSessionId: string | null = null
  private performanceMarks = new Map<string, number>()

  // Generate unique session ID for this auth flow
  private generateSessionId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  // Start tracking an OAuth flow
  startOAuthFlow(redirectTo?: string): string {
    const sessionId = this.generateSessionId()
    this.currentSessionId = sessionId
    
    const session: AuthSession = {
      sessionId,
      startTime: Date.now(),
      events: [],
      completed: false,
      success: false
    }
    
    this.sessions.set(sessionId, session)
    
    // Performance timing
    performance.mark('oauth_start')
    this.performanceMarks.set('oauth_start', Date.now())
    
    this.logEvent('oauth_start', {
      metadata: { redirectTo, userAgent: navigator.userAgent }
    })
    
    console.time('🚀 OAuth Flow')
    return sessionId
  }

  // Log individual events in the OAuth pipeline
  logEvent(type: AuthEventType, data: Partial<AuthEvent> = {}): void {
    const timestamp = Date.now()
    const event: AuthEvent = {
      type,
      timestamp,
      ...data
    }

    // Add performance data if available
    if (this.performanceMarks.has('oauth_start')) {
      const startTime = this.performanceMarks.get('oauth_start')!
      event.performance = {
        totalTime: timestamp - startTime
      }
    }

    // Add to current session
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId)
      if (session) {
        session.events.push(event)
      }
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🩺 Auth Event [${type}]:`, {
        time: new Date(timestamp).toISOString().split('T')[1],
        duration: event.duration ? `${event.duration}ms` : undefined,
        metadata: event.metadata,
        error: event.error?.message
      })
    }

    // Sentry breadcrumb for production
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'auth',
        message: `Auth event: ${type}`,
        level: event.error ? 'error' : 'info',
        data: {
          type,
          duration: event.duration,
          metadata: event.metadata,
          error: event.error
        }
      })
    }

    // Special handling for completion events
    if (type === 'oauth_complete' || type === 'signout_complete') {
      this.completeSession(type === 'oauth_complete')
    }
  }

  // Mark performance timing points
  markTiming(label: string): void {
    const timestamp = Date.now()
    performance.mark(label)
    this.performanceMarks.set(label, timestamp)
    
    // Calculate duration from previous mark
    const previousMarks = Array.from(this.performanceMarks.entries())
    if (previousMarks.length > 1) {
      const [prevLabel, prevTime] = previousMarks[previousMarks.length - 2]
      const duration = timestamp - prevTime
      
      this.logEvent(label as AuthEventType, {
        duration,
        metadata: { from: prevLabel, to: label }
      })
    }
  }

  // Complete current OAuth session
  completeSession(success: boolean): void {
    if (!this.currentSessionId) return
    
    const session = this.sessions.get(this.currentSessionId)
    if (!session) return
    
    session.completed = true
    session.success = success
    
    const totalDuration = Date.now() - session.startTime
    
    console.timeEnd('🚀 OAuth Flow')
    
    // Development summary
    if (process.env.NODE_ENV === 'development') {
      console.log(`🩺 OAuth Session Complete:`, {
        sessionId: session.sessionId,
        success,
        duration: `${totalDuration}ms`,
        events: session.events.length,
        timeline: session.events.map(e => ({
          event: e.type,
          time: `+${e.timestamp - session.startTime}ms`,
          error: e.error?.message
        }))
      })
    }

    // Performance reporting
    if (success && totalDuration > 5000) {
      console.warn('⚠️ OAuth flow took longer than 5 seconds:', {
        duration: totalDuration,
        slowEvents: session.events.filter(e => e.duration && e.duration > 1000)
      })
    }

    // Clear current session
    this.currentSessionId = null
    
    // Clean up old sessions (keep last 10)
    if (this.sessions.size > 10) {
      const oldestKey = Array.from(this.sessions.keys())[0]
      this.sessions.delete(oldestKey)
    }
  }

  // Get current session data
  getCurrentSession(): AuthSession | null {
    return this.currentSessionId ? this.sessions.get(this.currentSessionId) || null : null
  }

  // Get all session history
  getSessionHistory(): AuthSession[] {
    return Array.from(this.sessions.values())
  }

  // Error tracking with context
  logError(type: AuthEventType, error: Error | string, metadata?: Record<string, any>): void {
    const errorData = typeof error === 'string' 
      ? { message: error } 
      : { 
          message: error.message, 
          stack: error.stack,
          name: error.name 
        }

    this.logEvent(type, {
      error: errorData,
      metadata
    })

    // Send to Sentry in production
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(
        typeof error === 'string' ? new Error(error) : error,
        {
          tags: { authEvent: type },
          extra: metadata
        }
      )
    }
  }

  // Network timing helper
  async trackNetworkCall<T>(
    label: string, 
    networkCall: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await networkCall()
      const duration = Date.now() - startTime
      
      this.logEvent(label as AuthEventType, {
        duration,
        performance: { networkTime: duration },
        metadata: { success: true }
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.logError(label as AuthEventType, error as Error, {
        networkTime: duration
      })
      
      throw error
    }
  }

  // Export session data for debugging
  exportDiagnostics(): string {
    const sessions = this.getSessionHistory()
    const data = {
      timestamp: new Date().toISOString(),
      currentSession: this.currentSessionId,
      sessions: sessions.map(s => ({
        ...s,
        events: s.events.map(e => ({
          ...e,
          relativeTime: e.timestamp - s.startTime
        }))
      }))
    }
    
    return JSON.stringify(data, null, 2)
  }
}

// Singleton instance - P5 fix: proper export pattern to prevent TypeError: n is not a function
export const analytics = new AuthAnalytics()

// Window global for debugging - P5 fix implementation as specified
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.authAnalytics = analytics
}

// Convenience functions with explicit binding to prevent 'this' context issues
export const startOAuthFlow = (redirectTo?: string) => {
  return analytics.startOAuthFlow(redirectTo)
}

export const logAuthEvent = (type: AuthEventType, data?: Partial<AuthEvent>) => {
  return analytics.logEvent(type, data)
}

export const logAuthError = (type: AuthEventType, error: Error | string, metadata?: Record<string, any>) => {
  return analytics.logError(type, error, metadata)
}

export const trackAuthNetwork = <T>(label: string, networkCall: () => Promise<T>) => {
  return analytics.trackNetworkCall(label, networkCall)
}

export const markAuthTiming = (label: string) => {
  return analytics.markTiming(label)
}

export const completeOAuthFlow = (success: boolean) => {
  return analytics.completeSession(success)
}

export const getAuthDiagnostics = () => {
  return analytics.exportDiagnostics()
}

// Export for legacy compatibility
export const authAnalytics = analytics
export default analytics