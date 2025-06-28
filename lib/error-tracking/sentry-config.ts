/**
 * PRISMY SENTRY ERROR TRACKING CONFIGURATION
 * Production-ready error tracking and performance monitoring
 * Integrates with Sentry for comprehensive error reporting
 */

import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'

export interface SentryConfig {
  dsn: string
  environment: string
  sampleRate: number
  tracesSampleRate: number
  profilesSampleRate: number
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null
  beforeSendTransaction?: (event: Sentry.Transaction) => Sentry.Transaction | null
}

export class ErrorTracker {
  private static instance: ErrorTracker
  private isInitialized = false
  private config: SentryConfig

  private constructor() {
    this.config = {
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0'),
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      beforeSend: this.beforeSend.bind(this),
      beforeSendTransaction: this.beforeSendTransaction.bind(this)
    }
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  public initialize(): void {
    if (this.isInitialized || !this.config.dsn) {
      return
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        profilesSampleRate: this.config.profilesSampleRate,
        beforeSend: this.config.beforeSend,
        beforeSendTransaction: this.config.beforeSendTransaction,
        
        // Integration configurations
        integrations: [
          new Sentry.BrowserTracing({
            // Track route changes
            routingInstrumentation: Sentry.nextRouterInstrumentation,
            
            // Capture API routes
            tracePropagationTargets: [
              'localhost',
              /^https:\/\/prismy\.ai/,
              /^https:\/\/.*\.prismy\.ai/
            ]
          }),
          
          // Performance profiling
          new Sentry.ProfilingIntegration()
        ],
        
        // Advanced configurations
        debug: process.env.NODE_ENV === 'development',
        normalizeDepth: 6,
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        sendDefaultPii: false, // Don't send personally identifiable information
        
        // Transport options
        transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
        
        // Release tracking
        release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_APP_VERSION,
        
        // Tag all events
        initialScope: {
          tags: {
            component: 'prismy-frontend',
            version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
          }
        }
      })

      this.isInitialized = true
      logger.info('Sentry error tracking initialized', {
        environment: this.config.environment,
        sampleRate: this.config.sampleRate
      })

    } catch (error) {
      logger.error('Failed to initialize Sentry', { error })
    }
  }

  private beforeSend(event: Sentry.Event): Sentry.Event | null {
    // Filter out development errors
    if (this.config.environment === 'development') {
      return null
    }

    // Filter out known non-critical errors
    if (this.shouldFilterError(event)) {
      return null
    }

    // Enhance error context
    this.enhanceErrorContext(event)

    return event
  }

  private beforeSendTransaction(event: Sentry.Transaction): Sentry.Transaction | null {
    // Filter out development transactions
    if (this.config.environment === 'development') {
      return null
    }

    // Filter out health check requests
    if (event.transaction?.includes('/api/health')) {
      return null
    }

    return event
  }

  private shouldFilterError(event: Sentry.Event): boolean {
    const errorMessage = event.exception?.values?.[0]?.value || ''
    const errorType = event.exception?.values?.[0]?.type || ''

    // Filter out common browser errors that aren't actionable
    const ignoredErrors = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Load failed',
      'Script error',
      'NetworkError',
      'AbortError',
      'ChunkLoadError'
    ]

    // Filter out errors from browser extensions
    const ignoredUrls = [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ms-browser-extension://'
    ]

    // Check error message
    for (const ignored of ignoredErrors) {
      if (errorMessage.includes(ignored) || errorType.includes(ignored)) {
        return true
      }
    }

    // Check error source URLs
    const frames = event.exception?.values?.[0]?.stacktrace?.frames || []
    for (const frame of frames) {
      if (frame.filename) {
        for (const ignoredUrl of ignoredUrls) {
          if (frame.filename.includes(ignoredUrl)) {
            return true
          }
        }
      }
    }

    return false
  }

  private enhanceErrorContext(event: Sentry.Event): void {
    // Add browser information
    if (typeof window !== 'undefined') {
      event.contexts = {
        ...event.contexts,
        browser: {
          name: navigator.userAgent,
          version: navigator.appVersion,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        }
      }

      // Add current URL
      event.tags = {
        ...event.tags,
        page: window.location.pathname,
        referrer: document.referrer || 'direct'
      }
    }

    // Add performance timing if available
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing
      event.extra = {
        ...event.extra,
        performance: {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          domInteractive: timing.domInteractive - timing.navigationStart
        }
      }
    }
  }

  // Public API methods
  public captureError(
    error: Error,
    context?: {
      level?: Sentry.SeverityLevel
      tags?: Record<string, string>
      extra?: Record<string, any>
      user?: Sentry.User
      fingerprint?: string[]
    }
  ): string {
    if (!this.isInitialized) {
      logger.error('Sentry not initialized, logging error locally', { error })
      return ''
    }

    return Sentry.captureException(error, {
      level: context?.level || 'error',
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
      fingerprint: context?.fingerprint
    })
  }

  public captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: {
      tags?: Record<string, string>
      extra?: Record<string, any>
      user?: Sentry.User
    }
  ): string {
    if (!this.isInitialized) {
      logger.info('Sentry not initialized, logging message locally', { message, level })
      return ''
    }

    return Sentry.captureMessage(message, level)
  }

  public setUser(user: {
    id?: string
    email?: string
    username?: string
    subscription?: string
  }): void {
    if (!this.isInitialized) return

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      subscription: user.subscription
    })
  }

  public setTag(key: string, value: string): void {
    if (!this.isInitialized) return
    Sentry.setTag(key, value)
  }

  public setTags(tags: Record<string, string>): void {
    if (!this.isInitialized) return
    Sentry.setTags(tags)
  }

  public setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized) return
    Sentry.setContext(key, context)
  }

  public addBreadcrumb(breadcrumb: {
    message: string
    category?: string
    level?: Sentry.SeverityLevel
    data?: Record<string, any>
  }): void {
    if (!this.isInitialized) return

    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000
    })
  }

  public startTransaction(
    name: string,
    op: string,
    description?: string
  ): Sentry.Transaction | undefined {
    if (!this.isInitialized) return undefined

    return Sentry.startTransaction({
      name,
      op,
      description
    })
  }

  public withScope(callback: (scope: Sentry.Scope) => void): void {
    if (!this.isInitialized) return
    Sentry.withScope(callback)
  }

  // Specialized tracking methods
  public trackTranslationError(
    error: Error,
    context: {
      sourceLanguage: string
      targetLanguage: string
      textLength: number
      provider: string
      userId?: string
    }
  ): string {
    return this.captureError(error, {
      level: 'error',
      tags: {
        errorType: 'translation_error',
        sourceLanguage: context.sourceLanguage,
        targetLanguage: context.targetLanguage,
        provider: context.provider
      },
      extra: {
        textLength: context.textLength,
        translationContext: context
      },
      user: context.userId ? { id: context.userId } : undefined
    })
  }

  public trackAPIError(
    error: Error,
    context: {
      endpoint: string
      method: string
      statusCode?: number
      userId?: string
      duration?: number
    }
  ): string {
    return this.captureError(error, {
      level: 'error',
      tags: {
        errorType: 'api_error',
        endpoint: context.endpoint,
        method: context.method,
        statusCode: context.statusCode?.toString()
      },
      extra: {
        apiContext: context,
        duration: context.duration
      },
      user: context.userId ? { id: context.userId } : undefined
    })
  }

  public trackPaymentError(
    error: Error,
    context: {
      provider: string
      amount?: number
      currency?: string
      userId?: string
    }
  ): string {
    return this.captureError(error, {
      level: 'error',
      tags: {
        errorType: 'payment_error',
        paymentProvider: context.provider,
        currency: context.currency
      },
      extra: {
        paymentContext: {
          ...context,
          amount: context.amount // This is safe to include as it's transaction amount
        }
      },
      user: context.userId ? { id: context.userId } : undefined
    })
  }

  public trackPerformanceIssue(
    metric: string,
    value: number,
    context?: {
      threshold?: number
      component?: string
      userId?: string
    }
  ): string {
    return this.captureMessage(
      `Performance issue detected: ${metric} = ${value}ms`,
      'warning',
      {
        tags: {
          issueType: 'performance',
          metric,
          component: context?.component || 'unknown'
        },
        extra: {
          value,
          threshold: context?.threshold,
          performanceContext: context
        }
      }
    )
  }

  // Health check method
  public isHealthy(): boolean {
    return this.isInitialized && !!this.config.dsn
  }

  public getStats(): {
    initialized: boolean
    environment: string
    sampleRate: number
    dsn: string
  } {
    return {
      initialized: this.isInitialized,
      environment: this.config.environment,
      sampleRate: this.config.sampleRate,
      dsn: this.config.dsn ? '***configured***' : 'not configured'
    }
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance()

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  errorTracker.initialize()
}

// Convenience functions
export const captureError = errorTracker.captureError.bind(errorTracker)
export const captureMessage = errorTracker.captureMessage.bind(errorTracker)
export const setUser = errorTracker.setUser.bind(errorTracker)
export const addBreadcrumb = errorTracker.addBreadcrumb.bind(errorTracker)