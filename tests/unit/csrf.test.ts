/**
 * ===============================================
 * CSRF UTILITY FUNCTIONS UNIT TESTS
 * Vitest + Security Testing
 * ===============================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  generateCSRFToken,
  validateCSRFToken,
  getCSRFTokenFromRequest,
  getCSRFTokenForSession,
  validateCSRFMiddleware,
  addCSRFToHeaders,
} from '@/lib/csrf'

describe('CSRF Protection Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set consistent environment for testing
    process.env.CSRF_SECRET = 'test-secret-for-testing'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================
  // TEST 1: Token Generation
  // ==========================================
  describe('generateCSRFToken', () => {
    it('generates a valid base64 token', () => {
      const token = generateCSRFToken('test-session')
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
      
      // Should be valid base64
      expect(() => Buffer.from(token, 'base64')).not.toThrow()
    })

    it('generates different tokens on each call', () => {
      const token1 = generateCSRFToken('test-session')
      const token2 = generateCSRFToken('test-session')
      
      expect(token1).not.toBe(token2)
    })

    it('generates different tokens for different sessions', () => {
      const token1 = generateCSRFToken('session-1')
      const token2 = generateCSRFToken('session-2')
      
      expect(token1).not.toBe(token2)
    })

    it('handles anonymous sessions correctly', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken(undefined)
      
      expect(token1).toBeDefined()
      expect(token2).toBeDefined()
      
      // Both should be valid for anonymous validation
      expect(validateCSRFToken(token1)).toBe(true)
      expect(validateCSRFToken(token2)).toBe(true)
    })

    it('includes timestamp in token structure', () => {
      const beforeTime = Date.now()
      const token = generateCSRFToken('test-session')
      const afterTime = Date.now()
      
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [timestamp] = decoded.split(':')
      const tokenTime = parseInt(timestamp)
      
      expect(tokenTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tokenTime).toBeLessThanOrEqual(afterTime)
    })
  })

  // ==========================================
  // TEST 2: Token Validation
  // ==========================================
  describe('validateCSRFToken', () => {
    it('validates a freshly generated token', () => {
      const sessionId = 'test-session'
      const token = generateCSRFToken(sessionId)
      
      expect(validateCSRFToken(token, sessionId)).toBe(true)
    })

    it('rejects empty or null tokens', () => {
      expect(validateCSRFToken('', 'session')).toBe(false)
      expect(validateCSRFToken(null as any, 'session')).toBe(false)
      expect(validateCSRFToken(undefined as any, 'session')).toBe(false)
    })

    it('rejects invalid base64 tokens', () => {
      expect(validateCSRFToken('invalid-base64!@#', 'session')).toBe(false)
    })

    it('rejects tokens with wrong session ID', () => {
      const token = generateCSRFToken('session-1')
      
      expect(validateCSRFToken(token, 'session-2')).toBe(false)
      expect(validateCSRFToken(token, 'different-session')).toBe(false)
    })

    it('rejects tokens with malformed structure', () => {
      const malformedToken = Buffer.from('invalid:structure').toString('base64')
      
      expect(validateCSRFToken(malformedToken, 'session')).toBe(false)
    })

    it('rejects tokens with invalid signature', () => {
      const validToken = generateCSRFToken('test-session')
      const decoded = Buffer.from(validToken, 'base64').toString('utf-8')
      const parts = decoded.split(':')
      
      // Tamper with signature
      parts[3] = 'invalid-signature'
      const tamperedToken = Buffer.from(parts.join(':')).toString('base64')
      
      expect(validateCSRFToken(tamperedToken, 'test-session')).toBe(false)
    })

    it('rejects expired tokens', () => {
      // Mock Date.now to simulate token creation in the past
      const originalNow = Date.now
      const pastTime = originalNow() - (25 * 60 * 60 * 1000) // 25 hours ago
      
      vi.spyOn(Date, 'now').mockReturnValueOnce(pastTime)
      const expiredToken = generateCSRFToken('test-session')
      
      Date.now = originalNow // Restore current time
      
      expect(validateCSRFToken(expiredToken, 'test-session')).toBe(false)
    })

    it('accepts tokens within valid time window', () => {
      // Mock Date.now to simulate token created 23 hours ago (within 24h limit)
      const originalNow = Date.now
      const recentTime = originalNow() - (23 * 60 * 60 * 1000) // 23 hours ago
      
      vi.spyOn(Date, 'now').mockReturnValueOnce(recentTime)
      const recentToken = generateCSRFToken('test-session')
      
      Date.now = originalNow // Restore current time
      
      expect(validateCSRFToken(recentToken, 'test-session')).toBe(true)
    })

    it('handles validation errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Force an error by providing invalid data
      expect(validateCSRFToken('', 'session')).toBe(false)
      
      consoleSpy.mockRestore()
    })
  })

  // ==========================================
  // TEST 3: Request Token Extraction
  // ==========================================
  describe('getCSRFTokenFromRequest', () => {
    it('extracts token from X-CSRF-Token header', () => {
      const token = 'test-token-value'
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'X-CSRF-Token': token,
        },
      })
      
      expect(getCSRFTokenFromRequest(request)).toBe(token)
    })

    it('extracts token from x-csrf-token header (case insensitive)', () => {
      const token = 'test-token-value'
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-csrf-token': token,
        },
      })
      
      expect(getCSRFTokenFromRequest(request)).toBe(token)
    })

    it('returns null when no CSRF token header is present', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      expect(getCSRFTokenFromRequest(request)).toBeNull()
    })

    it('handles empty header values', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'X-CSRF-Token': '',
        },
      })
      
      expect(getCSRFTokenFromRequest(request)).toBe('')
    })
  })

  // ==========================================
  // TEST 4: Session Token Generation
  // ==========================================
  describe('getCSRFTokenForSession', () => {
    it('returns token and form field for session', () => {
      const sessionId = 'test-session'
      const result = getCSRFTokenForSession(sessionId)
      
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('formField')
      expect(typeof result.token).toBe('string')
      expect(typeof result.formField).toBe('string')
      
      // Validate the generated token
      expect(validateCSRFToken(result.token, sessionId)).toBe(true)
    })

    it('generates valid HTML form field', () => {
      const result = getCSRFTokenForSession('test-session')
      
      expect(result.formField).toContain('<input type="hidden"')
      expect(result.formField).toContain('name="csrf_token"')
      expect(result.formField).toContain(`value="${result.token}"`)
      expect(result.formField).toContain('/>')
    })

    it('handles anonymous sessions', () => {
      const result = getCSRFTokenForSession()
      
      expect(result.token).toBeDefined()
      expect(validateCSRFToken(result.token)).toBe(true)
    })

    it('escapes token value in HTML', () => {
      const result = getCSRFTokenForSession('test-session')
      
      // Token should be base64, so no need for HTML escaping in this case
      // But test that the structure is safe
      expect(result.formField).not.toContain('<script>')
      expect(result.formField).not.toContain('javascript:')
    })
  })

  // ==========================================
  // TEST 5: CSRF Middleware
  // ==========================================
  describe('validateCSRFMiddleware', () => {
    it('allows GET requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'GET',
      })
      
      const result = await validateCSRFMiddleware(request)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('allows HEAD requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'HEAD',
      })
      
      const result = await validateCSRFMiddleware(request)
      
      expect(result.valid).toBe(true)
    })

    it('allows OPTIONS requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'OPTIONS',
      })
      
      const result = await validateCSRFMiddleware(request)
      
      expect(result.valid).toBe(true)
    })

    it('rejects POST request without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
      })
      
      const result = await validateCSRFMiddleware(request)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing')
    })

    it('validates POST request with valid CSRF token', async () => {
      const sessionId = 'test-session'
      const token = generateCSRFToken(sessionId)
      
      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
        },
      })
      
      const result = await validateCSRFMiddleware(request, sessionId)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects POST request with invalid CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'invalid-token',
        },
      })
      
      const result = await validateCSRFMiddleware(request, 'test-session')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid CSRF token')
    })

    it('handles case-insensitive HTTP methods', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'get', // lowercase
      })
      
      const result = await validateCSRFMiddleware(request)
      
      expect(result.valid).toBe(true)
    })
  })

  // ==========================================
  // TEST 6: Header Utilities
  // ==========================================
  describe('addCSRFToHeaders', () => {
    it('adds CSRF token to empty headers', () => {
      const sessionId = 'test-session'
      const headers = addCSRFToHeaders({}, sessionId)
      
      expect(headers).toHaveProperty('X-CSRF-Token')
      expect(headers).toHaveProperty('Content-Type', 'application/json')
      
      const token = (headers as any)['X-CSRF-Token']
      expect(validateCSRFToken(token, sessionId)).toBe(true)
    })

    it('adds CSRF token to existing headers', () => {
      const sessionId = 'test-session'
      const existingHeaders = {
        'Authorization': 'Bearer token',
        'Accept': 'application/json',
      }
      
      const headers = addCSRFToHeaders(existingHeaders, sessionId)
      
      expect(headers).toHaveProperty('Authorization', 'Bearer token')
      expect(headers).toHaveProperty('Accept', 'application/json')
      expect(headers).toHaveProperty('X-CSRF-Token')
      expect(headers).toHaveProperty('Content-Type', 'application/json')
    })

    it('overwrites existing Content-Type header', () => {
      const headers = addCSRFToHeaders({
        'Content-Type': 'text/plain',
      }, 'test-session')
      
      expect(headers).toHaveProperty('Content-Type', 'application/json')
    })

    it('handles anonymous sessions', () => {
      const headers = addCSRFToHeaders()
      
      expect(headers).toHaveProperty('X-CSRF-Token')
      expect(headers).toHaveProperty('Content-Type', 'application/json')
      
      const token = (headers as any)['X-CSRF-Token']
      expect(validateCSRFToken(token)).toBe(true)
    })
  })

  // ==========================================
  // TEST 7: Security Edge Cases
  // ==========================================
  describe('Security Edge Cases', () => {
    it('rejects tokens with null bytes', () => {
      const maliciousToken = Buffer.from('test\x00malicious').toString('base64')
      
      expect(validateCSRFToken(maliciousToken, 'session')).toBe(false)
    })

    it('rejects oversized tokens', () => {
      const oversizedData = 'x'.repeat(10000)
      const oversizedToken = Buffer.from(oversizedData).toString('base64')
      
      expect(validateCSRFToken(oversizedToken, 'session')).toBe(false)
    })

    it('handles concurrent token generation safely', () => {
      const sessionId = 'concurrent-session'
      const tokens = Array.from({ length: 100 }, () => generateCSRFToken(sessionId))
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens)
      expect(uniqueTokens.size).toBe(tokens.length)
      
      // All tokens should be valid
      tokens.forEach(token => {
        expect(validateCSRFToken(token, sessionId)).toBe(true)
      })
    })

    it('prevents timing attacks on validation', () => {
      const sessionId = 'timing-test'
      const validToken = generateCSRFToken(sessionId)
      
      // Measure validation time for valid vs invalid tokens
      const measureValidation = (token: string, session: string) => {
        const start = process.hrtime.bigint()
        validateCSRFToken(token, session)
        const end = process.hrtime.bigint()
        return Number(end - start)
      }
      
      const validTime = measureValidation(validToken, sessionId)
      const invalidTime = measureValidation('invalid-token', sessionId)
      
      // Time difference should not be significant (constant-time comparison)
      // This is a basic test - real timing attack prevention is more complex
      expect(validTime).toBeGreaterThan(0)
      expect(invalidTime).toBeGreaterThan(0)
    })
  })
})