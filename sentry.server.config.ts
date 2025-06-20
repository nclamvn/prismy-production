// This file configures the initialization of Sentry on the server side
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Configure environment
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.APP_VERSION || 'development',
  
  // Server-specific configuration
  maxBreadcrumbs: 50,
  
  // Error filtering for server-side
  beforeSend(event, hint) {
    // Filter out expected errors
    if (event.exception) {
      const error = hint.originalException
      
      // Skip rate limiting errors (these are expected)
      if ((error as any)?.message?.includes('Rate limit exceeded')) {
        return null
      }
      
      // Skip authentication errors (these are user-related)
      if ((error as any)?.message?.includes('Authentication failed')) {
        return null
      }
      
      // Skip validation errors (these are user input issues)
      if ((error as any)?.message?.includes('Validation failed')) {
        return null
      }
    }
    
    return event
  },
  
  // Tag events with server context
  initialScope: {
    tags: {
      service: 'prismy-translation',
      component: 'server'
    }
  },
  
  // Performance monitoring for API routes
  beforeSendTransaction(event) {
    // Sample API transactions in production
    if (process.env.NODE_ENV === 'production') {
      return Math.random() < 0.1 ? event : null
    }
    return event
  },
  
  // Integration configuration
  integrations: [
    // Http integration disabled for build compatibility
  ],
  
  // Debug settings
  debug: process.env.NODE_ENV === 'development',
  
  // Privacy settings
  sendDefaultPii: false,
  
  // Custom context for Prismy
  beforeBreadcrumb(breadcrumb) {
    // Add translation service context
    if (breadcrumb.category === 'http') {
      if (breadcrumb.data?.url?.includes('/api/translate')) {
        breadcrumb.data.service = 'translation'
      }
      if (breadcrumb.data?.url?.includes('/api/payments')) {
        breadcrumb.data.service = 'payments'
      }
    }
    
    return breadcrumb
  }
})