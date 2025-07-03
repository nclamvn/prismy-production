/**
 * 🩺 Endoscope Method - Sensor D: Supabase Event Logger
 * 
 * Comprehensive monitoring of Supabase auth state changes,
 * session management, and token refresh cycles.
 */

import { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { logAuthEvent, logAuthError } from './auth-analytics'

interface SessionEvent {
  event: AuthChangeEvent
  session: Session | null
  timestamp: number
  user?: User | null
  metadata?: Record<string, any>
}

interface SessionHealth {
  isHealthy: boolean
  lastRefresh: number
  refreshCount: number
  errors: string[]
  warnings: string[]
}

class SupabaseEventLogger {
  private eventHistory: SessionEvent[] = []
  private refreshTimers = new Map<string, NodeJS.Timeout>()
  private sessionHealth = new Map<string, SessionHealth>()
  private unsubscribe: (() => void) | null = null

  // Initialize event monitoring
  initialize(supabaseClient: any): void {
    if (this.unsubscribe) {
      this.unsubscribe()
    }

    this.unsubscribe = supabaseClient.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        this.handleAuthEvent(event, session)
      }
    ).data.subscription.unsubscribe

    // Monitor initial session
    this.checkInitialSession(supabaseClient)
  }

  // Handle all auth state changes
  private handleAuthEvent(event: AuthChangeEvent, session: Session | null): void {
    const timestamp = Date.now()
    const sessionEvent: SessionEvent = {
      event,
      session,
      timestamp,
      user: session?.user || null
    }

    // Add to history
    this.eventHistory.push(sessionEvent)
    
    // Keep only last 50 events
    if (this.eventHistory.length > 50) {
      this.eventHistory.shift()
    }

    // Log to analytics system
    this.logToAnalytics(event, session, timestamp)

    // Handle specific events
    switch (event) {
      case 'SIGNED_IN':
        this.handleSignIn(session, timestamp)
        break
      case 'SIGNED_OUT':
        this.handleSignOut(session, timestamp)
        break
      case 'TOKEN_REFRESHED':
        this.handleTokenRefresh(session, timestamp)
        break
      case 'USER_UPDATED':
        this.handleUserUpdate(session, timestamp)
        break
      case 'PASSWORD_RECOVERY':
        this.handlePasswordRecovery(session, timestamp)
        break
      default:
        console.log('🩺 Unknown auth event:', event)
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Supabase Auth [${event}]:`, {
        time: new Date(timestamp).toISOString().split('T')[1],
        userId: session?.user?.id?.slice(0, 8) + '...' || 'none',
        hasSession: !!session,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none'
      })
    }
  }

  // Log events to analytics system
  private logToAnalytics(event: AuthChangeEvent, session: Session | null, timestamp: number): void {
    const eventMap: Record<AuthChangeEvent, string> = {
      'SIGNED_IN': 'oauth_complete',
      'SIGNED_OUT': 'signout_complete', 
      'TOKEN_REFRESHED': 'session_refresh',
      'USER_UPDATED': 'oauth_session_restored',
      'PASSWORD_RECOVERY': 'oauth_session_restored'
    }

    const analyticsEvent = eventMap[event] as any
    if (analyticsEvent) {
      logAuthEvent(analyticsEvent, {
        metadata: {
          supabaseEvent: event,
          hasSession: !!session,
          userId: session?.user?.id,
          expiresAt: session?.expires_at
        }
      })
    }
  }

  // Handle successful sign in
  private handleSignIn(session: Session | null, timestamp: number): void {
    if (!session) return

    const userId = session.user.id
    
    // Initialize session health tracking
    this.sessionHealth.set(userId, {
      isHealthy: true,
      lastRefresh: timestamp,
      refreshCount: 0,
      errors: [],
      warnings: []
    })

    // Schedule token refresh monitoring
    this.scheduleRefreshMonitoring(session)

    // Cookie sync verification
    this.verifyCookieSync(session)
  }

  // Handle sign out
  private handleSignOut(session: Session | null, timestamp: number): void {
    // Clear refresh timers
    this.refreshTimers.forEach(timer => clearTimeout(timer))
    this.refreshTimers.clear()

    // Verify cookie cleanup
    this.verifyCookieCleanup()

    // Clear session health
    this.sessionHealth.clear()
  }

  // Handle token refresh
  private handleTokenRefresh(session: Session | null, timestamp: number): void {
    if (!session) return

    const userId = session.user.id
    const health = this.sessionHealth.get(userId)
    
    if (health) {
      health.lastRefresh = timestamp
      health.refreshCount++
      
      // Check refresh frequency
      const timeSinceLastRefresh = timestamp - health.lastRefresh
      if (timeSinceLastRefresh < 30000) { // Less than 30 seconds
        health.warnings.push(`Rapid token refresh detected: ${timeSinceLastRefresh}ms`)
        console.warn('⚠️ Rapid token refresh detected:', timeSinceLastRefresh)
      }
    }

    // Re-schedule next refresh monitoring
    this.scheduleRefreshMonitoring(session)
  }

  // Handle user update
  private handleUserUpdate(session: Session | null, timestamp: number): void {
    if (session) {
      logAuthEvent('oauth_session_restored', {
        metadata: {
          updateType: 'user_metadata',
          userId: session.user.id
        }
      })
    }
  }

  // Handle password recovery
  private handlePasswordRecovery(session: Session | null, timestamp: number): void {
    logAuthEvent('oauth_session_restored', {
      metadata: {
        updateType: 'password_recovery',
        hasSession: !!session
      }
    })
  }

  // Schedule monitoring for token refresh
  private scheduleRefreshMonitoring(session: Session): void {
    if (!session.expires_at) return

    const userId = session.user.id
    const expiresAt = session.expires_at * 1000
    const now = Date.now()
    const timeToExpiry = expiresAt - now
    
    // Clear existing timer
    const existingTimer = this.refreshTimers.get(userId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Schedule warning 1 minute before expiry
    const warningTime = Math.max(0, timeToExpiry - 60000)
    const timer = setTimeout(() => {
      console.warn('⚠️ Session expiring soon:', {
        userId: userId.slice(0, 8) + '...',
        expiresIn: '1 minute'
      })
    }, warningTime)
    
    this.refreshTimers.set(userId, timer)
  }

  // Verify cookie synchronization
  private verifyCookieSync(session: Session): void {
    if (typeof window === 'undefined') return

    setTimeout(() => {
      const cookies = document.cookie
      const hasSupabaseCookie = cookies.includes('sb-') || cookies.includes('supabase')
      
      if (!hasSupabaseCookie) {
        const health = this.sessionHealth.get(session.user.id)
        if (health) {
          health.warnings.push('Session cookie not found in document.cookie')
          health.isHealthy = false
        }
        console.warn('⚠️ Session active but cookie not detected')
      }
    }, 1000) // Check after 1 second
  }

  // Verify cookie cleanup after sign out
  private verifyCookieCleanup(): void {
    if (typeof window === 'undefined') return

    setTimeout(() => {
      const cookies = document.cookie
      const hasSupabaseCookie = cookies.includes('sb-') || cookies.includes('supabase')
      
      if (hasSupabaseCookie) {
        console.warn('⚠️ Supabase cookies still present after sign out')
        logAuthError('signout_complete', 'Cookies not properly cleaned up', {
          remainingCookies: cookies
        })
      }
    }, 2000) // Check after 2 seconds
  }

  // Check initial session state
  private async checkInitialSession(supabaseClient: any): Promise<void> {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      
      if (error) {
        logAuthError('oauth_session_restored', error.message, {
          errorCode: error.status,
          errorName: error.name
        })
        return
      }

      if (session) {
        logAuthEvent('oauth_session_restored', {
          metadata: {
            source: 'initial_check',
            userId: session.user.id,
            expiresAt: session.expires_at
          }
        })
      }
    } catch (error) {
      logAuthError('oauth_session_restored', error as Error)
    }
  }

  // Get session health status
  getSessionHealth(userId?: string): SessionHealth | SessionHealth[] | null {
    if (userId) {
      return this.sessionHealth.get(userId) || null
    }
    return Array.from(this.sessionHealth.values())
  }

  // Get event history
  getEventHistory(): SessionEvent[] {
    return [...this.eventHistory]
  }

  // Get recent events (last N)
  getRecentEvents(count: number = 10): SessionEvent[] {
    return this.eventHistory.slice(-count)
  }

  // Export diagnostics
  exportDiagnostics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      eventHistory: this.eventHistory.map(e => ({
        ...e,
        relativeTime: e.timestamp - (this.eventHistory[0]?.timestamp || 0)
      })),
      sessionHealth: Object.fromEntries(this.sessionHealth),
      activeTimers: this.refreshTimers.size
    }
    
    return JSON.stringify(data, null, 2)
  }

  // Cleanup
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    
    this.refreshTimers.forEach(timer => clearTimeout(timer))
    this.refreshTimers.clear()
    this.sessionHealth.clear()
    this.eventHistory = []
  }
}

// Singleton instance - using function wrapper to prevent webpack minification conflicts
const createSupabaseEventLogger = () => new SupabaseEventLogger()
export const supabaseEventLogger = createSupabaseEventLogger()

// Convenience functions with explicit binding to prevent 'this' context issues
export const getSupabaseEvents = () => {
  return supabaseEventLogger.exportDiagnostics()
}

export const getSupabaseHealth = (userId?: string) => {
  return supabaseEventLogger.getSessionHealth(userId)
}

export const getSupabaseEventHistory = () => {
  return supabaseEventLogger.getEventHistory()
}

// Window global for debugging (development only to prevent webpack minification conflicts)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only expose in development to prevent webpack minification conflicts
  ;(window as any).supabaseEventLogger = supabaseEventLogger
  ;(window as any).getSupabaseEvents = getSupabaseEvents
}

export default supabaseEventLogger