// Server and client-side request optimization utilities

/* ============================================================================ */
/* PRISMY REQUEST OPTIMIZATION SYSTEM */
/* Advanced Request Deduplication & Batching */
/* ============================================================================ */

import { createHash } from 'crypto'

// Request optimization configuration
export const REQUEST_CONFIG = {
  // Deduplication settings
  DEDUP_WINDOW: 5000, // 5 seconds
  MAX_PENDING_REQUESTS: 100,

  // Batching settings
  BATCH_DELAY: 50, // 50ms batch delay
  MAX_BATCH_SIZE: 10,
  AUTO_BATCH_THRESHOLD: 3, // Auto-batch after 3 similar requests

  // Performance limits
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const

// Request state interfaces
interface PendingRequest<T = any> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
  retryCount: number
}

interface BatchRequest<T = any> {
  id: string
  data: any
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
}

interface RequestStats {
  deduplicated: number
  batched: number
  total: number
  errors: number
  avgResponseTime: number
}

/* ============================================================================ */
/* REQUEST DEDUPLICATION SYSTEM */
/* ============================================================================ */

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>()
  private stats: RequestStats = {
    deduplicated: 0,
    batched: 0,
    total: 0,
    errors: 0,
    avgResponseTime: 0,
  }
  private responseTimes: number[] = []

  // Generate request signature for deduplication
  private generateSignature(
    url: string,
    method: string,
    body?: any,
    headers?: Record<string, string>
  ): string {
    const data = {
      url: url.split('?')[0], // Exclude query params for some cases
      method,
      body: body ? JSON.stringify(body) : null,
      // Only include relevant headers
      headers: headers
        ? {
            'content-type': headers['content-type'],
            authorization: headers['authorization'] ? '[REDACTED]' : undefined,
          }
        : null,
    }

    return createHash('md5').update(JSON.stringify(data)).digest('hex')
  }

  // Deduplicated fetch wrapper
  async dedupeFetch<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const method = options.method || 'GET'
    const signature = this.generateSignature(
      url,
      method,
      options.body,
      options.headers as Record<string, string>
    )

    this.stats.total++

    // Check for existing pending request
    const existing = this.pendingRequests.get(signature)
    if (existing) {
      // Check if request is still within deduplication window
      if (Date.now() - existing.timestamp < REQUEST_CONFIG.DEDUP_WINDOW) {
        this.stats.deduplicated++
        return existing.promise as Promise<T>
      } else {
        // Remove stale request
        this.pendingRequests.delete(signature)
      }
    }

    // Create new request
    const startTime = Date.now()
    let resolve: (value: T) => void
    let reject: (error: Error) => void

    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })

    const pendingRequest: PendingRequest<T> = {
      promise,
      resolve: resolve!,
      reject: reject!,
      timestamp: Date.now(),
      retryCount: 0,
    }

    this.pendingRequests.set(signature, pendingRequest)

    // Execute request with retry logic
    this.executeWithRetry(url, options, pendingRequest, startTime, signature)

    return promise
  }

  // Execute request with automatic retry
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    pendingRequest: PendingRequest<T>,
    startTime: number,
    signature: string
  ): Promise<void> {
    try {
      // Add timeout to request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, REQUEST_CONFIG.REQUEST_TIMEOUT)

      const fetchOptions: RequestInit = {
        ...options,
        signal: controller.signal,
      }

      const response = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Record response time
      const responseTime = Date.now() - startTime
      this.responseTimes.push(responseTime)
      if (this.responseTimes.length > 100) {
        this.responseTimes.shift() // Keep only last 100 measurements
      }
      this.updateAvgResponseTime()

      // Resolve all waiting promises
      pendingRequest.resolve(data)
      this.pendingRequests.delete(signature)
    } catch (error) {
      // Retry logic
      if (
        pendingRequest.retryCount < REQUEST_CONFIG.RETRY_ATTEMPTS &&
        this.shouldRetry(error as Error)
      ) {
        pendingRequest.retryCount++

        // Exponential backoff
        const delay =
          REQUEST_CONFIG.RETRY_DELAY *
          Math.pow(2, pendingRequest.retryCount - 1)

        setTimeout(() => {
          this.executeWithRetry(
            url,
            options,
            pendingRequest,
            startTime,
            signature
          )
        }, delay)
      } else {
        // Final failure
        this.stats.errors++
        pendingRequest.reject(error as Error)
        this.pendingRequests.delete(signature)
      }
    }
  }

  // Determine if error is retryable
  private shouldRetry(error: Error): boolean {
    // Retry on network errors, timeouts, and 5xx errors
    const retryableErrors = [
      'Failed to fetch',
      'NetworkError',
      'TimeoutError',
      'AbortError',
    ]

    return (
      retryableErrors.some(
        retryable =>
          error.message.includes(retryable) || error.name.includes(retryable)
      ) || error.message.includes('HTTP 5')
    )
  }

  // Update average response time
  private updateAvgResponseTime(): void {
    if (this.responseTimes.length > 0) {
      this.stats.avgResponseTime =
        this.responseTimes.reduce((sum, time) => sum + time, 0) /
        this.responseTimes.length
    }
  }

  // Get deduplication statistics
  getStats(): RequestStats {
    return { ...this.stats }
  }

  // Cleanup expired requests
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [signature, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > REQUEST_CONFIG.DEDUP_WINDOW) {
        request.reject(new Error('Request timeout'))
        this.pendingRequests.delete(signature)
        cleaned++
      }
    }

    return cleaned
  }
}

/* ============================================================================ */
/* REQUEST BATCHING SYSTEM */
/* ============================================================================ */

class RequestBatcher {
  private batches = new Map<string, BatchRequest[]>()
  private batchTimeouts = new Map<string, NodeJS.Timeout>()
  private similarRequests = new Map<string, number>()

  // Add request to batch
  async batchRequest<T = any>(
    batchKey: string,
    requestData: any,
    batchProcessor: (requests: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = createHash('md5')
        .update(JSON.stringify(requestData))
        .digest('hex')

      const batchRequest: BatchRequest<T> = {
        id: requestId,
        data: requestData,
        resolve,
        reject,
        timestamp: Date.now(),
      }

      // Add to batch
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, [])
      }

      const batch = this.batches.get(batchKey)!
      batch.push(batchRequest)

      // Track similar requests for auto-batching
      this.similarRequests.set(
        batchKey,
        (this.similarRequests.get(batchKey) || 0) + 1
      )

      // Check if we should process immediately
      const shouldProcessNow =
        batch.length >= REQUEST_CONFIG.MAX_BATCH_SIZE ||
        this.similarRequests.get(batchKey)! >=
          REQUEST_CONFIG.AUTO_BATCH_THRESHOLD

      if (shouldProcessNow) {
        this.processBatch(batchKey, batchProcessor)
      } else {
        // Set timeout for batch processing
        if (!this.batchTimeouts.has(batchKey)) {
          const timeout = setTimeout(() => {
            this.processBatch(batchKey, batchProcessor)
          }, REQUEST_CONFIG.BATCH_DELAY)

          this.batchTimeouts.set(batchKey, timeout)
        }
      }
    })
  }

  // Process batch of requests
  private async processBatch<T>(
    batchKey: string,
    batchProcessor: (requests: any[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(batchKey)
    if (!batch || batch.length === 0) return

    // Clear timeout and batch
    const timeout = this.batchTimeouts.get(batchKey)
    if (timeout) {
      clearTimeout(timeout)
      this.batchTimeouts.delete(batchKey)
    }

    this.batches.delete(batchKey)
    this.similarRequests.delete(batchKey)

    try {
      // Process all requests in batch
      const requestData = batch.map(req => req.data)
      const results = await batchProcessor(requestData)

      // Resolve individual promises
      batch.forEach((request, index) => {
        if (index < results.length) {
          request.resolve(results[index])
        } else {
          request.reject(new Error('Batch processing incomplete'))
        }
      })
    } catch (error) {
      // Reject all promises in batch
      batch.forEach(request => {
        request.reject(error as Error)
      })
    }
  }

  // Cleanup expired batches
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [batchKey, batch] of this.batches.entries()) {
      const hasExpired = batch.some(
        req => now - req.timestamp > REQUEST_CONFIG.REQUEST_TIMEOUT
      )

      if (hasExpired) {
        // Reject expired requests
        batch.forEach(req => {
          if (now - req.timestamp > REQUEST_CONFIG.REQUEST_TIMEOUT) {
            req.reject(new Error('Batch request timeout'))
          }
        })

        this.batches.delete(batchKey)
        this.batchTimeouts.delete(batchKey)
        this.similarRequests.delete(batchKey)
        cleaned++
      }
    }

    return cleaned
  }
}

/* ============================================================================ */
/* GLOBAL INSTANCES */
/* ============================================================================ */

export const requestDeduplicator = new RequestDeduplicator()
export const requestBatcher = new RequestBatcher()

/* ============================================================================ */
/* HIGH-LEVEL API */
/* ============================================================================ */

// Optimized fetch with deduplication
export const optimizedFetch =
  requestDeduplicator.dedupeFetch.bind(requestDeduplicator)

// Batch multiple similar requests
export async function batchSimilarRequests<T>(
  requests: Array<{ key: string; data: any }>,
  processor: (groupedData: any[]) => Promise<T[]>
): Promise<T[]> {
  const batchKey = createHash('md5')
    .update(JSON.stringify(requests.map(r => r.key).sort()))
    .digest('hex')

  const promises = requests.map(req =>
    requestBatcher.batchRequest(batchKey, req.data, processor)
  )

  return Promise.all(promises)
}

// Utility for API route optimization
export function optimizeApiRoute<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options: {
    enableDeduplication?: boolean
    enableBatching?: boolean
    batchKey?: string
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const { enableDeduplication = true } = options

    if (enableDeduplication) {
      // Create a signature for the API call
      const signature = createHash('md5')
        .update(JSON.stringify(args))
        .digest('hex')

      // Use optimized fetch for the API call
      return optimizedFetch(`/internal/${signature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args, handler: handler.name }),
      })
    }

    return handler(...args)
  }) as T
}

// Auto cleanup (every 2 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const dedupCleaned = requestDeduplicator.cleanup()
    const batchCleaned = requestBatcher.cleanup()

    if (dedupCleaned > 0 || batchCleaned > 0) {
      console.log(
        `Request optimization cleanup: ${dedupCleaned} dedup, ${batchCleaned} batch`
      )
    }
  }, 120000)
}

export default { requestDeduplicator, requestBatcher, optimizedFetch }
