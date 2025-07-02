// This file configures the initialization of Sentry for edge runtime
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Configure environment
  environment: process.env.NODE_ENV,

  // Edge runtime specific settings
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Release tracking
  release: process.env.APP_VERSION || 'development',

  // Minimal configuration for edge runtime
  maxBreadcrumbs: 25,

  // Error filtering for edge
  beforeSend(event, hint) {
    // Filter out edge-specific noise
    if (event.exception) {
      const error = hint.originalException

      // Skip edge runtime limitations
      if ((error as any)?.message?.includes('Dynamic code evaluation')) {
        return null
      }
    }

    return event
  },

  // Tag events with edge context
  initialScope: {
    tags: {
      service: 'prismy-translation',
      component: 'edge',
      runtime: 'edge',
    },
  },

  // Debug settings
  debug: process.env.NODE_ENV === 'development',

  // Privacy settings
  sendDefaultPii: false,
})
