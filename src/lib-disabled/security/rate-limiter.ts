/**
 * Rate Limiting System for Production Security
 * 
 * Implements various rate limiting strategies to prevent abuse
 */

import { NextRequest } from 'next/server'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { reportError, ErrorTypes } from '@/lib/monitoring/error-tracking'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// In-memory store for development (use Redis in production)
const store = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimits = {
  // Authentication endpoints
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many login attempts. Please try again later.'
  },
  
  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    message: 'Upload rate limit exceeded. Please wait before uploading again.'
  },
  
  // Translation endpoints
  TRANSLATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 translations per hour
    message: 'Translation quota exceeded. Please wait before submitting more translations.'
  },
  
  // API endpoints
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'API rate limit exceeded. Please slow down your requests.'
  },
  
  // Admin endpoints
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 admin actions per minute
    message: 'Admin action rate limit exceeded.'
  },
  
  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    message: 'Search rate limit exceeded. Please wait before searching again.'
  }
} as const

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  return `ip:${ip}`
}

/**
 * User-based key generator - uses authenticated user ID
 */
export function userKeyGenerator(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  return defaultKeyGenerator(request)
}

/**
 * Endpoint-based key generator - combines IP and endpoint
 */
export function endpointKeyGenerator(request: NextRequest, endpoint: string): string {
  const ip = defaultKeyGenerator(request)
  return `${ip}:${endpoint}`
}

/**
 * Applies rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): Promise<RateLimitResult> {
  // Skip rate limiting if disabled
  if (!isFeatureEnabled('ENABLE_RATE_LIMITING')) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowMs
    }
  }
  
  const key = identifier || (config.keyGenerator ? config.keyGenerator(request) : defaultKeyGenerator(request))
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  // Clean up expired entries
  cleanupExpiredEntries()
  
  // Get or create rate limit entry
  let entry = store.get(key)
  
  if (!entry || entry.resetTime <= now) {
    // Create new window
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    // Report rate limit exceeded
    reportError(
      `Rate limit exceeded for key: ${key}`,
      {
        action: 'rate_limit_exceeded',
        metadata: {
          key,
          limit: config.maxRequests,
          window_ms: config.windowMs,
          retry_after: retryAfter
        }
      },
      'warning'
    )
    
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter
    }
  }
  
  // Increment counter
  entry.count++
  store.set(key, entry)
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    reset: entry.resetTime
  }
}

/**
 * Middleware-friendly rate limiter
 */
export async function rateLimit(
  request: NextRequest,
  limitType: keyof typeof RateLimits,
  identifier?: string
): Promise<RateLimitResult> {
  const config = RateLimits[limitType]
  return applyRateLimit(request, config, identifier)
}

/**
 * Creates rate limit headers for HTTP responses
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString()
  }
  
  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }
  
  return headers
}

/**
 * Custom rate limiter for specific use cases
 */
export class CustomRateLimiter {
  private config: RateLimitConfig
  
  constructor(config: RateLimitConfig) {
    this.config = config
  }
  
  async check(request: NextRequest, identifier?: string): Promise<RateLimitResult> {
    return applyRateLimit(request, this.config, identifier)
  }
  
  async reset(identifier: string): Promise<void> {
    if (!isFeatureEnabled('ENABLE_RATE_LIMITING')) {
      return
    }
    
    store.delete(identifier)
  }
}

/**
 * Sliding window rate limiter (more precise but memory intensive)
 */
export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>()
  private config: RateLimitConfig
  
  constructor(config: RateLimitConfig) {
    this.config = config
  }
  
  async check(request: NextRequest, identifier?: string): Promise<RateLimitResult> {
    if (!isFeatureEnabled('ENABLE_RATE_LIMITING')) {
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        reset: Date.now() + this.config.windowMs
      }
    }
    
    const key = identifier || defaultKeyGenerator(request)
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // Get or create window
    let window = this.windows.get(key) || []
    
    // Remove old requests
    window = window.filter(timestamp => timestamp > windowStart)
    
    // Check limit
    if (window.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...window)
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000)
      
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: oldestRequest + this.config.windowMs,
        retryAfter
      }
    }
    
    // Add current request
    window.push(now)
    this.windows.set(key, window)
    
    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - window.length,
      reset: now + this.config.windowMs
    }
  }
}

/**
 * IP-based rate limiter with geographic considerations
 */
export async function geoRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const country = request.headers.get('cf-ipcountry') || 'unknown'
  const ip = defaultKeyGenerator(request)
  const key = `geo:${country}:${ip}`
  
  return applyRateLimit(request, config, key)
}

/**
 * Adaptive rate limiter that adjusts based on system load
 */
export class AdaptiveRateLimiter {
  private baseConfig: RateLimitConfig
  private loadFactor = 1.0
  
  constructor(config: RateLimitConfig) {
    this.baseConfig = config
  }
  
  updateLoadFactor(factor: number) {
    this.loadFactor = Math.max(0.1, Math.min(2.0, factor))
  }
  
  async check(request: NextRequest, identifier?: string): Promise<RateLimitResult> {
    const adjustedConfig = {
      ...this.baseConfig,
      maxRequests: Math.floor(this.baseConfig.maxRequests * this.loadFactor)
    }
    
    return applyRateLimit(request, adjustedConfig, identifier)
  }
}

/**
 * Cleanup expired entries from memory store
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime <= now) {
      store.delete(key)
    }
  }
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  request: NextRequest,
  limitType: keyof typeof RateLimits,
  identifier?: string
): { remaining: number; reset: number } {
  if (!isFeatureEnabled('ENABLE_RATE_LIMITING')) {
    const config = RateLimits[limitType]
    return {
      remaining: config.maxRequests,
      reset: Date.now() + config.windowMs
    }
  }
  
  const config = RateLimits[limitType]
  const key = identifier || defaultKeyGenerator(request)
  const entry = store.get(key)
  const now = Date.now()
  
  if (!entry || entry.resetTime <= now) {
    return {
      remaining: config.maxRequests,
      reset: now + config.windowMs
    }
  }
  
  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    reset: entry.resetTime
  }
}

// Periodic cleanup (run every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}