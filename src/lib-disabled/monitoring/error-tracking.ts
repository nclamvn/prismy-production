/**
 * Error Tracking and Monitoring Utilities
 * 
 * Centralized error handling and reporting for production monitoring
 */

// Disabled Sentry for production build stability
// import * as Sentry from '@sentry/nextjs'
import { isFeatureEnabled } from '@/lib/feature-flags'

export interface ErrorContext {
  userId?: string
  userRole?: string
  action?: string
  resource?: string
  metadata?: Record<string, any>
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  tags?: Record<string, string>
}

/**
 * Reports an error to Sentry with context
 */
export function reportError(
  error: Error | string,
  context?: ErrorContext,
  level: 'error' | 'warning' | 'info' = 'error'
) {
  if (!isFeatureEnabled('ENABLE_ERROR_TRACKING')) {
    console.error('Error:', error, context)
    return
  }

  console.error('Error:', error, context)
}

/**
 * Reports a performance metric
 */
export function reportPerformanceMetric(metric: PerformanceMetric) {
  if (!isFeatureEnabled('ENABLE_PERFORMANCE_MONITORING')) {
    console.log('Performance:', metric)
    return
  }

  console.log('Performance:', metric)
}

/**
 * Tracks user actions for debugging
 */
export function trackUserAction(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  if (!isFeatureEnabled('ENABLE_ANALYTICS')) {
    console.log('Action:', action, { userId, metadata })
    return
  }

  console.log('Action:', action, { userId, metadata })
}

/**
 * Wraps an async function with error reporting
 */
export function withErrorReporting<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Omit<ErrorContext, 'metadata'>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      reportError(error as Error, {
        ...context,
        metadata: { args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg) }
      })
      throw error
    }
  }) as T
}

/**
 * Measures function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  const startTime = performance.now()
  
  try {
    const result = fn()
    
    const duration = performance.now() - startTime
    reportPerformanceMetric({
      name,
      value: Math.round(duration),
      unit: 'ms',
      tags
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    reportPerformanceMetric({
      name: `${name}_error`,
      value: Math.round(duration),
      unit: 'ms',
      tags: { ...tags, error: 'true' }
    })
    
    throw error
  }
}

/**
 * Measures async function execution time
 */
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await fn()
    
    const duration = performance.now() - startTime
    reportPerformanceMetric({
      name,
      value: Math.round(duration),
      unit: 'ms',
      tags
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    reportPerformanceMetric({
      name: `${name}_error`,
      value: Math.round(duration),
      unit: 'ms',
      tags: { ...tags, error: 'true' }
    })
    
    throw error
  }
}

/**
 * Sets user context for error tracking
 */
export function setUserContext(user: {
  id: string
  email?: string
  role?: string
}) {
  if (!isFeatureEnabled('ENABLE_ERROR_TRACKING')) {
    return
  }

  console.log('User context set:', user)
}

/**
 * Clears user context (on logout)
 */
export function clearUserContext() {
  if (!isFeatureEnabled('ENABLE_ERROR_TRACKING')) {
    return
  }

  console.log('User context cleared')
}

/**
 * Reports API endpoint performance
 */
export function reportAPIPerformance(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  size?: number
) {
  reportPerformanceMetric({
    name: 'api_request_duration',
    value: Math.round(duration),
    unit: 'ms',
    tags: {
      endpoint,
      method,
      status_code: statusCode.toString(),
      status_class: `${Math.floor(statusCode / 100)}xx`
    }
  })
  
  if (size !== undefined) {
    reportPerformanceMetric({
      name: 'api_response_size',
      value: size,
      unit: 'bytes',
      tags: {
        endpoint,
        method
      }
    })
  }
}

/**
 * Reports upload/download performance
 */
export function reportTransferPerformance(
  type: 'upload' | 'download',
  size: number,
  duration: number,
  success: boolean
) {
  const throughput = success ? Math.round((size / duration) * 1000) : 0 // bytes per second
  
  reportPerformanceMetric({
    name: `${type}_duration`,
    value: Math.round(duration),
    unit: 'ms',
    tags: {
      success: success.toString(),
      size_category: size > 50 * 1024 * 1024 ? 'large' : 'normal'
    }
  })
  
  if (success && throughput > 0) {
    reportPerformanceMetric({
      name: `${type}_throughput`,
      value: throughput,
      unit: 'bytes',
      tags: {
        size_category: size > 50 * 1024 * 1024 ? 'large' : 'normal'
      }
    })
  }
}

/**
 * Error types for consistent error reporting
 */
export const ErrorTypes = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  FILE_PROCESSING: 'file_processing',
  TRANSLATION: 'translation',
  OCR: 'ocr',
  STORAGE: 'storage',
  DATABASE: 'database',
  EXTERNAL_API: 'external_api',
  RATE_LIMIT: 'rate_limit',
  CONFIGURATION: 'configuration',
  SYSTEM: 'system'
} as const

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes]

/**
 * Reports typed errors with consistent categorization
 */
export function reportTypedError(
  error: Error | string,
  type: ErrorType,
  context?: ErrorContext
) {
  reportError(error, {
    ...context,
    metadata: {
      ...context?.metadata,
      error_type: type
    }
  })
}