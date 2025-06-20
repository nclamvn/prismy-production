// This file configures the initialization of Sentry on the browser side
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configure Prismy-specific settings
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Error filtering for noise reduction
  beforeSend(event, hint) {
    // Filter out common non-critical errors
    if (event.exception) {
      const error = hint.originalException
      
      // Skip network errors that users can't control
      if ((error as any)?.message?.includes('Network request failed')) {
        return null
      }
      
      // Skip common browser extension errors
      if ((error as any)?.message?.includes('Non-Error promise rejection')) {
        return null
      }
    }
    
    return event
  },
  
  // Tag events with Prismy-specific context
  initialScope: {
    tags: {
      service: 'prismy-translation',
      component: 'client'
    }
  },
  
  // Performance monitoring for Core Web Vitals
  beforeSendTransaction(event) {
    // Sample transactions in production
    if (process.env.NODE_ENV === 'production') {
      return Math.random() < 0.1 ? event : null
    }
    return event
  },
  
  // Integration configuration
  integrations: [
    // BrowserTracing integration disabled for build compatibility
  ],
  
  // Debug settings
  debug: process.env.NODE_ENV === 'development',
  
  // Privacy settings
  sendDefaultPii: false,
  
  // Custom error boundaries
  beforeBreadcrumb(breadcrumb) {
    // Filter sensitive information from breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null
    }
    return breadcrumb
  }
})