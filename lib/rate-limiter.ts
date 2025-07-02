import { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// Initialize Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Fallback to in-memory rate limiting if Redis is not available
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const useRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

// Create rate limiters for different purposes
export const rateLimiters = {
  // General API rate limiting
  api: useRedis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
        analytics: true,
        prefix: 'prismy:api',
      })
    : null,

  // Translation rate limiting by subscription tier
  translation: {
    free: useRedis
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 per hour for free tier
          analytics: true,
          prefix: 'prismy:translate:free',
        })
      : null,
    standard: useRedis
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 per hour for standard
          analytics: true,
          prefix: 'prismy:translate:standard',
        })
      : null,
    premium: useRedis
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(200, '1 h'), // 200 per hour for premium
          analytics: true,
          prefix: 'prismy:translate:premium',
        })
      : null,
    enterprise: useRedis
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 per hour for enterprise
          analytics: true,
          prefix: 'prismy:translate:enterprise',
        })
      : null,
  },

  // Authentication rate limiting
  auth: useRedis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
        analytics: true,
        prefix: 'prismy:auth',
      })
    : null,

  // Payment processing rate limiting
  payment: useRedis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '5 m'), // 3 payment attempts per 5 minutes
        analytics: true,
        prefix: 'prismy:payment',
      })
    : null,
}

// Fallback in-memory rate limiting function
async function fallbackRateLimit(
  clientId: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()

  // Clean up expired entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }

  // Get or create rate limit entry
  let rateLimitEntry = rateLimitMap.get(clientId)

  if (!rateLimitEntry || rateLimitEntry.resetTime < now) {
    // Create new rate limit window
    rateLimitEntry = {
      count: 0,
      resetTime: now + windowMs,
    }
  }

  // Check if limit exceeded
  if (rateLimitEntry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: rateLimitEntry.resetTime,
      retryAfter: Math.ceil((rateLimitEntry.resetTime - now) / 1000),
    }
  }

  // Increment counter
  rateLimitEntry.count++
  rateLimitMap.set(clientId, rateLimitEntry)

  return {
    success: true,
    limit,
    remaining: limit - rateLimitEntry.count,
    reset: rateLimitEntry.resetTime,
  }
}

export async function rateLimit(
  request: NextRequest,
  limit: number = 50, // requests per hour
  windowMs: number = 60 * 60 * 1000 // 1 hour in milliseconds
): Promise<RateLimitResult> {
  const clientId = getClientId(request)

  if (useRedis && rateLimiters.api) {
    try {
      const result = await rateLimiters.api.limit(clientId)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success
          ? undefined
          : Math.ceil((result.reset - Date.now()) / 1000),
      }
    } catch (error) {
      console.error(
        'Redis rate limiting failed, falling back to in-memory:',
        error
      )
      return fallbackRateLimit(clientId, limit, windowMs)
    }
  }

  return fallbackRateLimit(clientId, limit, windowMs)
}

function getClientId(request: NextRequest): string {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  // Use the first available IP
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'

  return ip.trim()
}

// Rate limiting tiers based on subscription
export const RATE_LIMITS = {
  free: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  standard: { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  premium: { limit: 200, windowMs: 60 * 60 * 1000 }, // 200 per hour
  enterprise: { limit: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
}

export async function getRateLimitForTier(
  request: NextRequest,
  tier: keyof typeof RATE_LIMITS = 'standard'
): Promise<RateLimitResult> {
  const clientId = getClientId(request)
  const { limit, windowMs } = RATE_LIMITS[tier]

  if (useRedis && rateLimiters.translation[tier]) {
    try {
      const result = await rateLimiters.translation[tier]!.limit(clientId)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success
          ? undefined
          : Math.ceil((result.reset - Date.now()) / 1000),
      }
    } catch (error) {
      console.error(
        `Redis rate limiting failed for tier ${tier}, falling back to in-memory:`,
        error
      )
      return fallbackRateLimit(clientId, limit, windowMs)
    }
  }

  return fallbackRateLimit(clientId, limit, windowMs)
}

// Helper function for authentication rate limiting
export async function checkAuthRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (useRedis && rateLimiters.auth) {
    try {
      const result = await rateLimiters.auth.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success
          ? undefined
          : Math.ceil((result.reset - Date.now()) / 1000),
      }
    } catch (error) {
      console.error(
        'Redis auth rate limiting failed, falling back to in-memory:',
        error
      )
      return fallbackRateLimit(identifier, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes
    }
  }

  return fallbackRateLimit(identifier, 5, 15 * 60 * 1000)
}

// Helper function for payment rate limiting
export async function checkPaymentRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (useRedis && rateLimiters.payment) {
    try {
      const result = await rateLimiters.payment.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success
          ? undefined
          : Math.ceil((result.reset - Date.now()) / 1000),
      }
    } catch (error) {
      console.error(
        'Redis payment rate limiting failed, falling back to in-memory:',
        error
      )
      return fallbackRateLimit(identifier, 3, 5 * 60 * 1000) // 3 attempts per 5 minutes
    }
  }

  return fallbackRateLimit(identifier, 3, 5 * 60 * 1000)
}
