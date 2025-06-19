import { NextRequest, NextResponse } from 'next/server'
import { logApiRequest, logApiResponse, performanceLogger } from '@/lib/logger'

// Performance tracking middleware
export function withLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const [request] = args as [NextRequest, ...any[]]
    const startTime = Date.now()
    
    // Generate request ID for tracing
    const requestId = Math.random().toString(36).substring(2, 15)
    
    // Log incoming request
    logApiRequest(request, { requestId })
    
    let response: NextResponse
    
    try {
      // Execute the handler
      response = await handler(...args)
      
      const duration = Date.now() - startTime
      
      // Log successful response
      logApiResponse(request, response, duration, { requestId })
      
      // Log performance metrics
      if (duration > 500) {
        performanceLogger.warn({
          requestId,
          duration: `${duration}ms`,
          endpoint: request.url,
          method: request.method
        }, 'Slow API Response')
      }
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Request-ID', requestId)
      
      return response
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Create error response
      response = NextResponse.json(
        { error: 'Internal Server Error', requestId },
        { status: 500 }
      )
      
      // Log error response
      logApiResponse(request, response, duration, { 
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Re-throw for Sentry
      throw error
    }
  }
}

// Request/Response logging middleware for API routes
export function createApiLogger(endpoint: string) {
  return (handler: Function) => {
    return withLogging(async (request: NextRequest) => {
      const startTime = Date.now()
      
      try {
        const response = await handler(request)
        
        const duration = Date.now() - startTime
        performanceLogger.info({
          endpoint,
          method: request.method,
          duration: `${duration}ms`,
          status: response.status
        }, 'API Call Completed')
        
        return response
        
      } catch (error) {
        const duration = Date.now() - startTime
        performanceLogger.error({
          endpoint,
          method: request.method,
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'API Call Failed')
        
        throw error
      }
    })
  }
}