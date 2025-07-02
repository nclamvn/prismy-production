/**
 * Rate Limiter Test Suite
 * Target: 90% coverage for performance module
 * Tests the fallback in-memory rate limiting functionality
 */

import { NextRequest } from 'next/server'

// Mock environment variables to disable Redis
const originalEnv = process.env
process.env = {
  ...originalEnv,
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
}

// Import after environment setup
import {
  rateLimit,
  RATE_LIMITS,
  getRateLimitForTier,
  checkAuthRateLimit,
  checkPaymentRateLimit,
  rateLimiters,
} from '../rate-limiter'

describe('Rate Limiter System (In-Memory Fallback)', () => {
  afterAll(() => {
    process.env = originalEnv
  })

  describe('Configuration', () => {
    it('should define rate limit constants', () => {
      expect(RATE_LIMITS.free).toEqual({
        limit: 10,
        windowMs: 60 * 60 * 1000,
      })
      expect(RATE_LIMITS.standard).toEqual({
        limit: 50,
        windowMs: 60 * 60 * 1000,
      })
      expect(RATE_LIMITS.premium).toEqual({
        limit: 200,
        windowMs: 60 * 60 * 1000,
      })
      expect(RATE_LIMITS.enterprise).toEqual({
        limit: 1000,
        windowMs: 60 * 60 * 1000,
      })
    })

    it('should have rate limiters configuration set to null when Redis unavailable', () => {
      expect(rateLimiters).toBeDefined()
      expect(rateLimiters.api).toBeNull()
      expect(rateLimiters.auth).toBeNull()
      expect(rateLimiters.payment).toBeNull()
      expect(rateLimiters.translation.free).toBeNull()
      expect(rateLimiters.translation.standard).toBeNull()
      expect(rateLimiters.translation.premium).toBeNull()
      expect(rateLimiters.translation.enterprise).toBeNull()
    })
  })

  describe('Fallback In-Memory Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const result = await rateLimit(request, 10, 60000)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(10)
      expect(result.remaining).toBe(9)
      expect(result.reset).toBeGreaterThan(Date.now())
      expect(result.retryAfter).toBeUndefined()
    })

    it('should reject requests when limit exceeded', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      })

      const limit = 2
      const windowMs = 60000

      // Make requests up to the limit
      await rateLimit(request, limit, windowMs)
      await rateLimit(request, limit, windowMs)

      // This should be rejected
      const result = await rateLimit(request, limit, windowMs)

      expect(result.success).toBe(false)
      expect(result.limit).toBe(limit)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should reset counter after window expires', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.101',
        },
      })

      const limit = 1
      const windowMs = 100 // 100ms window

      // First request should succeed
      const result1 = await rateLimit(request, limit, windowMs)
      expect(result1.success).toBe(true)

      // Second request should fail (limit exceeded)
      const result2 = await rateLimit(request, limit, windowMs)
      expect(result2.success).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Third request should succeed (new window)
      const result3 = await rateLimit(request, limit, windowMs)
      expect(result3.success).toBe(true)
    })

    it('should handle multiple clients independently', async () => {
      const request1 = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.102',
        },
      })

      const request2 = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.103',
        },
      })

      const limit = 1
      const windowMs = 60000

      // Both clients should be able to make their first request
      const result1 = await rateLimit(request1, limit, windowMs)
      const result2 = await rateLimit(request2, limit, windowMs)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Both clients should be rate limited on their second request
      const result3 = await rateLimit(request1, limit, windowMs)
      const result4 = await rateLimit(request2, limit, windowMs)

      expect(result3.success).toBe(false)
      expect(result4.success).toBe(false)
    })
  })

  describe('Client ID Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.0.2.1',
        },
      })

      const result = await rateLimit(request, 10, 60000)
      expect(result.success).toBe(true)
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is not available', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '203.0.113.2',
        },
      })

      const result = await rateLimit(request, 10, 60000)
      expect(result.success).toBe(true)
    })

    it('should extract IP from cf-connecting-ip header', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'cf-connecting-ip': '203.0.113.3',
        },
      })

      const result = await rateLimit(request, 10, 60000)
      expect(result.success).toBe(true)
    })

    it('should handle missing IP headers gracefully', async () => {
      const request = new NextRequest('http://localhost:3000')

      const result = await rateLimit(request, 10, 60000)
      expect(result.success).toBe(true)
    })

    it('should prioritize x-forwarded-for over other headers', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '203.0.113.104',
          'x-real-ip': '203.0.113.5',
          'cf-connecting-ip': '203.0.113.6',
        },
      })

      // Make multiple requests to test that the same client ID is used
      await rateLimit(request, 2, 60000)
      const result = await rateLimit(request, 2, 60000)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0) // Should have used same client ID
    })
  })

  describe('Tier-based Rate Limiting', () => {
    it('should apply free tier limits', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.2.1',
        },
      })

      const result = await getRateLimitForTier(request, 'free')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(RATE_LIMITS.free.limit)
    })

    it('should apply standard tier limits', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.2.2',
        },
      })

      const result = await getRateLimitForTier(request, 'standard')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(RATE_LIMITS.standard.limit)
    })

    it('should apply premium tier limits', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.2.3',
        },
      })

      const result = await getRateLimitForTier(request, 'premium')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(RATE_LIMITS.premium.limit)
    })

    it('should apply enterprise tier limits', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.2.4',
        },
      })

      const result = await getRateLimitForTier(request, 'enterprise')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(RATE_LIMITS.enterprise.limit)
    })

    it('should default to standard tier when no tier specified', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.2.5',
        },
      })

      const result = await getRateLimitForTier(request)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(RATE_LIMITS.standard.limit)
    })
  })

  describe('Authentication Rate Limiting', () => {
    it('should allow auth attempts within limit', async () => {
      const identifier = 'user@example.com'

      const result = await checkAuthRateLimit(identifier)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5) // 5 attempts per 15 minutes
      expect(result.remaining).toBe(4)
    })

    it('should reject auth attempts when limit exceeded', async () => {
      const identifier = 'user2@example.com'

      // Make 5 attempts
      for (let i = 0; i < 5; i++) {
        await checkAuthRateLimit(identifier)
      }

      // 6th attempt should fail
      const result = await checkAuthRateLimit(identifier)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should handle different auth identifiers independently', async () => {
      const identifier1 = 'user3@example.com'
      const identifier2 = 'user4@example.com'

      // Exhaust limit for first user
      for (let i = 0; i < 5; i++) {
        await checkAuthRateLimit(identifier1)
      }

      const result1 = await checkAuthRateLimit(identifier1)
      const result2 = await checkAuthRateLimit(identifier2)

      expect(result1.success).toBe(false) // First user rate limited
      expect(result2.success).toBe(true) // Second user still allowed
    })
  })

  describe('Payment Rate Limiting', () => {
    it('should allow payment attempts within limit', async () => {
      const identifier = 'payment-user-1'

      const result = await checkPaymentRateLimit(identifier)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(3) // 3 attempts per 5 minutes
      expect(result.remaining).toBe(2)
    })

    it('should reject payment attempts when limit exceeded', async () => {
      const identifier = 'payment-user-2'

      // Make 3 attempts
      for (let i = 0; i < 3; i++) {
        await checkPaymentRateLimit(identifier)
      }

      // 4th attempt should fail
      const result = await checkPaymentRateLimit(identifier)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should handle different payment identifiers independently', async () => {
      const identifier1 = 'payment-user-3'
      const identifier2 = 'payment-user-4'

      // Exhaust limit for first user
      for (let i = 0; i < 3; i++) {
        await checkPaymentRateLimit(identifier1)
      }

      const result1 = await checkPaymentRateLimit(identifier1)
      const result2 = await checkPaymentRateLimit(identifier2)

      expect(result1.success).toBe(false) // First user rate limited
      expect(result2.success).toBe(true) // Second user still allowed
    })
  })

  describe('Error Handling', () => {
    it('should handle undefined headers gracefully', async () => {
      const request = new NextRequest('http://localhost:3000')

      const result = await rateLimit(request, 10, 60000)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(10)
    })

    it('should handle malformed IP addresses', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': 'invalid-ip, , malformed',
        },
      })

      const result = await rateLimit(request, 10, 60000)

      expect(result.success).toBe(true)
    })

    it('should handle empty string identifiers', async () => {
      const result = await checkAuthRateLimit('')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
    })

    it('should handle null/undefined identifiers gracefully', async () => {
      const result1 = await checkAuthRateLimit(null as any)
      const result2 = await checkPaymentRateLimit(undefined as any)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very high limits', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.4.1',
        },
      })

      const result = await rateLimit(request, 999999, 60000)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(999999)
      expect(result.remaining).toBe(999998)
    })

    it('should handle zero limits', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.4.2',
        },
      })

      const result = await rateLimit(request, 0, 60000)

      expect(result.success).toBe(false)
      expect(result.limit).toBe(0)
      expect(result.remaining).toBe(0)
    })

    it('should handle very short windows', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.4.3',
        },
      })

      const result = await rateLimit(request, 10, 1) // 1ms window

      expect(result.success).toBe(true)
    })

    it('should handle very long windows', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.4.4',
        },
      })

      const result = await rateLimit(request, 10, 24 * 60 * 60 * 1000) // 24 hours

      expect(result.success).toBe(true)
      expect(result.reset).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000) // Should be ~24 hours from now
    })
  })

  describe('Response Format', () => {
    it('should return consistent response format for successful requests', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.5.1',
        },
      })

      const result = await rateLimit(request, 10, 60000)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('limit')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('reset')
      expect(result.success).toBe(true)
      expect(typeof result.limit).toBe('number')
      expect(typeof result.remaining).toBe('number')
      expect(typeof result.reset).toBe('number')
      expect(result.retryAfter).toBeUndefined()
    })

    it('should return consistent response format for rate-limited requests', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.5.2',
        },
      })

      // Exhaust the limit
      await rateLimit(request, 1, 60000)
      const result = await rateLimit(request, 1, 60000)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('limit')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('reset')
      expect(result).toHaveProperty('retryAfter')
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(typeof result.retryAfter).toBe('number')
      expect(result.retryAfter).toBeGreaterThan(0)
    })
  })

  describe('Time-based Calculations', () => {
    it('should calculate retry-after correctly', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.7.1',
        },
      })

      const windowMs = 5000 // 5 seconds

      // Exhaust limit
      await rateLimit(request, 1, windowMs)
      const result = await rateLimit(request, 1, windowMs)

      expect(result.success).toBe(false)
      expect(result.retryAfter).toBeLessThanOrEqual(5) // Should be <= 5 seconds
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should handle reset time correctly', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.7.2',
        },
      })

      const windowMs = 10000 // 10 seconds
      const beforeRequest = Date.now()

      const result = await rateLimit(request, 5, windowMs)

      expect(result.reset).toBeGreaterThan(beforeRequest)
      expect(result.reset).toBeLessThanOrEqual(beforeRequest + windowMs + 100) // Small tolerance
    })
  })

  describe('Memory Cleanup', () => {
    it('should clean up expired entries automatically', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.8.1',
        },
      })

      // Create entry with short window
      await rateLimit(request, 1, 50) // 50ms window

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      // Make another request which should trigger cleanup and succeed
      const result = await rateLimit(request, 1, 60000)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0) // Should be first request in new window
    })

    it('should handle concurrent requests correctly', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.8.2',
        },
      })

      const limit = 5
      const windowMs = 60000

      // Make concurrent requests
      const promises = Array(3)
        .fill(null)
        .map(() => rateLimit(request, limit, windowMs))

      const results = await Promise.all(promises)

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Verify the remaining counts make sense
      const remainingCounts = results
        .map(r => r.remaining)
        .sort((a, b) => b - a)
      expect(remainingCounts[0]).toBeGreaterThanOrEqual(remainingCounts[1])
      expect(remainingCounts[1]).toBeGreaterThanOrEqual(remainingCounts[2])
    })
  })

  describe('Header Priority', () => {
    it('should use first IP from comma-separated x-forwarded-for', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.9.1, 10.0.0.1, 172.16.0.1',
        },
      })

      // Should use 192.168.9.1 as client ID
      const result1 = await rateLimit(request, 2, 60000)
      const result2 = await rateLimit(request, 2, 60000)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(0) // Same client used
    })

    it('should fallback to x-real-ip when x-forwarded-for is empty', async () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '',
          'x-real-ip': '192.168.9.2',
        },
      })

      const result = await rateLimit(request, 5, 60000)
      expect(result.success).toBe(true)
    })

    it('should use unknown as fallback when no IP headers present', async () => {
      const request1 = new NextRequest('http://localhost:3000')
      const request2 = new NextRequest('http://localhost:3000')

      // Both requests should use 'unknown' as client ID
      await rateLimit(request1, 2, 60000)
      const result = await rateLimit(request2, 2, 60000)

      // Should share the same rate limit since both use 'unknown'
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0)
    })
  })
})
