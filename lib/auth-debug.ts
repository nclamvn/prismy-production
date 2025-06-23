'use client'

export interface AuthDebugEvent {
  timestamp: string
  event: string
  level: 'info' | 'warn' | 'error' | 'success'
  data?: any
  source: 'modal' | 'context' | 'callback' | 'supabase'
}

class AuthDebugLogger {
  private events: AuthDebugEvent[] = []
  private maxEvents = 100

  log(
    event: string,
    data?: any,
    level: 'info' | 'warn' | 'error' | 'success' = 'info',
    source: AuthDebugEvent['source'] = 'modal'
  ) {
    const debugEvent: AuthDebugEvent = {
      timestamp: new Date().toISOString(),
      event,
      level,
      data,
      source,
    }

    this.events.unshift(debugEvent)

    // Keep only latest events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents)
    }

    // Console logging with emoji indicators
    const emoji = {
      info: '🔍',
      warn: '⚠️',
      error: '❌',
      success: '✅',
    }

    const prefix = `${emoji[level]} [${source.toUpperCase()}]`

    if (level === 'error') {
      console.error(prefix, event, data)
    } else if (level === 'warn') {
      console.warn(prefix, event, data)
    } else {
      console.log(prefix, event, data)
    }

    // Store in sessionStorage for debugging
    try {
      sessionStorage.setItem(
        'prismy_auth_debug',
        JSON.stringify(this.events.slice(0, 50))
      )
    } catch (e) {
      // Ignore storage errors
    }
  }

  getEvents(): AuthDebugEvent[] {
    return [...this.events]
  }

  getLastError(): AuthDebugEvent | null {
    return this.events.find(e => e.level === 'error') || null
  }

  clear() {
    this.events = []
    try {
      sessionStorage.removeItem('prismy_auth_debug')
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Get formatted debug report for support
  getDebugReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      events: this.events.slice(0, 20),
      supabaseConfig: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    }

    return JSON.stringify(report, null, 2)
  }
}

// Global instance
export const authDebugLogger = new AuthDebugLogger()

// Helper functions for common debug scenarios
export const debugAuth = {
  modalOpened: (mode: string, redirectTo?: string) => {
    authDebugLogger.log('Modal opened', { mode, redirectTo }, 'info', 'modal')
  },

  modalClosed: (reason: string) => {
    authDebugLogger.log('Modal closed', { reason }, 'info', 'modal')
  },

  oauthInitiated: (provider: 'google' | 'apple', redirectTo?: string) => {
    authDebugLogger.log(
      `${provider} OAuth initiated`,
      {
        provider,
        redirectTo,
        callbackUrl: redirectTo
          ? `/auth/callback?redirectTo=${redirectTo}`
          : '/auth/callback',
      },
      'info',
      'modal'
    )
  },

  oauthError: (provider: 'google' | 'apple', error: any) => {
    authDebugLogger.log(
      `${provider} OAuth error`,
      { provider, error },
      'error',
      'modal'
    )
  },

  callbackReceived: (params: Record<string, string>) => {
    authDebugLogger.log('Auth callback received', params, 'info', 'callback')
  },

  callbackSuccess: (userId: string, redirectTo: string) => {
    authDebugLogger.log(
      'Auth callback success',
      { userId, redirectTo },
      'success',
      'callback'
    )
  },

  callbackError: (error: string, details?: string) => {
    authDebugLogger.log(
      'Auth callback error',
      { error, details },
      'error',
      'callback'
    )
  },

  sessionUpdate: (user: any, loading: boolean) => {
    authDebugLogger.log(
      'Session updated',
      {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        loading,
      },
      'info',
      'context'
    )
  },

  supabaseError: (operation: string, error: any) => {
    authDebugLogger.log(
      `Supabase ${operation} error`,
      error,
      'error',
      'supabase'
    )
  },

  redirectUrlMismatch: (expectedUrl: string, actualUrl: string) => {
    authDebugLogger.log(
      'Redirect URL mismatch detected',
      { expectedUrl, actualUrl },
      'error',
      'modal'
    )
  },

  configurationError: (type: string, details: any) => {
    authDebugLogger.log(
      `Configuration error: ${type}`,
      details,
      'error',
      'context'
    )
  },

  environmentCheck: (env: Record<string, any>) => {
    authDebugLogger.log('Environment variables check', env, 'info', 'context')
  },
}

// Browser debugging utilities
if (typeof window !== 'undefined') {
  // Expose debug utilities to browser console
  ;(window as any).__prismyAuthDebug = {
    getEvents: () => authDebugLogger.getEvents(),
    getReport: () => authDebugLogger.getDebugReport(),
    clear: () => authDebugLogger.clear(),
    copy: () => {
      navigator.clipboard.writeText(authDebugLogger.getDebugReport())
      console.log('✅ Debug report copied to clipboard')
    },
  }

  console.log(
    '🔧 Prismy Auth Debug utilities loaded. Use __prismyAuthDebug in console.'
  )
}
