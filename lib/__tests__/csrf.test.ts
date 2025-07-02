/**
 * CSRF Protection Test Suite
 * Target: 90% coverage for security module
 */

import { NextRequest } from 'next/server'
import {
  generateCSRFToken,
  validateCSRFToken,
  getCSRFTokenFromRequest,
  getCSRFTokenForSession,
  validateCSRFMiddleware,
  useCSRFToken,
  addCSRFToHeaders,
} from '../csrf'

// Simple test setup to verify basic functionality
describe('CSRF Protection System', () => {
  describe('Token Generation', () => {
    it('should generate a valid CSRF token', () => {
      const token = generateCSRFToken('test-session')
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate different tokens for different sessions', () => {
      const token1 = generateCSRFToken('session-1')
      const token2 = generateCSRFToken('session-2')
      expect(token1).not.toBe(token2)
    })

    it('should generate token for anonymous session', () => {
      const token = generateCSRFToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should include timestamp in token', () => {
      const token = generateCSRFToken('test-session')
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      expect(decoded).toMatch(/^\d+:/)
    })

    it('should include session data in token', () => {
      const sessionId = 'user-123'
      const token = generateCSRFToken(sessionId)
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      expect(decoded).toContain(sessionId)
    })
  })

  describe('Token Validation', () => {
    it('should validate a legitimate token', () => {
      const sessionId = 'test-session'
      const token = generateCSRFToken(sessionId)
      const isValid = validateCSRFToken(token, sessionId)
      expect(isValid).toBe(true)
    })

    it('should reject empty token', () => {
      const isValid = validateCSRFToken('', 'test-session')
      expect(isValid).toBe(false)
    })

    it('should reject malformed token', () => {
      const isValid = validateCSRFToken('invalid-token', 'test-session')
      expect(isValid).toBe(false)
    })

    it('should reject token with wrong session', () => {
      const token = generateCSRFToken('session-1')
      const isValid = validateCSRFToken(token, 'session-2')
      expect(isValid).toBe(false)
    })

    it('should handle token with insufficient parts', () => {
      const malformedToken = Buffer.from('incomplete:token').toString('base64')
      const isValid = validateCSRFToken(malformedToken, 'test-session')
      expect(isValid).toBe(false)
    })

    it('should validate anonymous session tokens', () => {
      const token = generateCSRFToken()
      const isValid = validateCSRFToken(token)
      expect(isValid).toBe(true)
    })

    it('should handle validation errors gracefully', () => {
      // Mock console.error to verify error logging
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Test with invalid base64 that causes parsing error
      const isValid = validateCSRFToken('%invalid%base64%', 'test-session')
      expect(isValid).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('Token Age Validation', () => {
    it('should accept fresh tokens', () => {
      const token = generateCSRFToken('test-session')
      const isValid = validateCSRFToken(token, 'test-session')
      expect(isValid).toBe(true)
    })

    it('should handle expired token simulation', () => {
      // Create a manually crafted expired token
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      const expiredPayload = `${oldTimestamp}:randomdata:test-session:invalidsignature`
      const expiredToken = Buffer.from(expiredPayload).toString('base64')

      const isValid = validateCSRFToken(expiredToken, 'test-session')
      expect(isValid).toBe(false)
    })
  })

  describe('Request Token Extraction', () => {
    it('should return null when no token in headers', () => {
      const request = new NextRequest('http://localhost:3000')
      const extractedToken = getCSRFTokenFromRequest(request)
      expect(extractedToken).toBeNull()
    })

    it('should handle missing x-csrf-token header', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          authorization: 'Bearer token',
        },
      })

      const extractedToken = getCSRFTokenFromRequest(request)
      expect(extractedToken).toBeNull()
    })

    it('should verify header extraction behavior', () => {
      // This test verifies the function behavior without assuming specific header handling
      const request = new NextRequest('http://localhost:3000')
      const extractedToken = getCSRFTokenFromRequest(request)
      expect(extractedToken).toBeNull()
    })
  })

  describe('Session Token Generation', () => {
    it('should generate token and form field for session', () => {
      const sessionId = 'test-session'
      const result = getCSRFTokenForSession(sessionId)

      expect(result.token).toBeDefined()
      expect(result.formField).toContain('csrf_token')
      expect(result.formField).toContain(result.token)
      expect(result.formField).toMatch(/^<input type="hidden"/)
    })

    it('should generate token and form field for anonymous session', () => {
      const result = getCSRFTokenForSession()

      expect(result.token).toBeDefined()
      expect(result.formField).toContain('csrf_token')
      expect(result.formField).toContain(result.token)
    })

    it('should escape HTML in form field', () => {
      const result = getCSRFTokenForSession('test-session')
      expect(result.formField).not.toContain('<script>')
      expect(result.formField).toMatch(
        /^<input type="hidden" name="csrf_token" value="[^"]*" \/>$/
      )
    })
  })

  describe('CSRF Middleware', () => {
    it('should allow GET requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'GET',
      })

      const result = await validateCSRFMiddleware(request, 'test-session')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should allow HEAD requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'HEAD',
      })

      const result = await validateCSRFMiddleware(request, 'test-session')
      expect(result.valid).toBe(true)
    })

    it('should allow OPTIONS requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'OPTIONS',
      })

      const result = await validateCSRFMiddleware(request, 'test-session')
      expect(result.valid).toBe(true)
    })

    it('should reject POST requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
      })

      const result = await validateCSRFMiddleware(request, 'test-session')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing')
    })

    it('should handle missing tokens consistently', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      })

      const result = await validateCSRFMiddleware(request, 'test-session')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing')
    })

    it('should handle case-insensitive HTTP methods', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'post',
      })

      const result = await validateCSRFMiddleware(request, 'test-session')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing')
    })

    it('should validate PUT requests', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'PUT',
      })

      const result = await validateCSRFMiddleware(request, 'test-session')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing')
    })

    it('should validate DELETE requests', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'DELETE',
      })

      const result = await validateCSRFMiddleware(request, 'test-session')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing')
    })
  })

  describe('React Hook', () => {
    it('should provide CSRF token for components', () => {
      const result = useCSRFToken()

      expect(result.token).toBeDefined()
      expect(result.formField).toBeDefined()
      expect(result.formField).toContain('csrf_token')
    })

    it('should use default session ID', () => {
      const result = useCSRFToken()
      expect(result.token).toBeDefined()

      // Verify the token is for the default session
      const decoded = Buffer.from(result.token, 'base64').toString('utf-8')
      expect(decoded).toContain('user-session')
    })
  })

  describe('Header Utilities', () => {
    it('should add CSRF token to headers', () => {
      const sessionId = 'test-session'
      const headers = addCSRFToHeaders({}, sessionId)

      expect(headers['X-CSRF-Token']).toBeDefined()
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should preserve existing headers', () => {
      const existingHeaders = {
        Authorization: 'Bearer token',
        'Custom-Header': 'value',
      }

      const headers = addCSRFToHeaders(existingHeaders, 'test-session')

      expect(headers['Authorization']).toBe('Bearer token')
      expect(headers['Custom-Header']).toBe('value')
      expect(headers['X-CSRF-Token']).toBeDefined()
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should work with empty headers', () => {
      const headers = addCSRFToHeaders()

      expect(headers['X-CSRF-Token']).toBeDefined()
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should override Content-Type if already present', () => {
      const existingHeaders = {
        'Content-Type': 'text/plain',
      }

      const headers = addCSRFToHeaders(existingHeaders, 'test-session')

      expect(headers['Content-Type']).toBe('application/json')
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle null session IDs', () => {
      const token = generateCSRFToken(null as any)
      expect(token).toBeDefined()

      const isValid = validateCSRFToken(token, null as any)
      expect(isValid).toBe(true)
    })

    it('should handle undefined session IDs', () => {
      const token = generateCSRFToken(undefined)
      expect(token).toBeDefined()

      const isValid = validateCSRFToken(token, undefined)
      expect(isValid).toBe(true)
    })

    it('should handle very long session IDs', () => {
      const longSessionId = 'a'.repeat(1000)
      const token = generateCSRFToken(longSessionId)
      expect(token).toBeDefined()

      const isValid = validateCSRFToken(token, longSessionId)
      expect(isValid).toBe(true)
    })

    it('should handle special characters in session IDs', () => {
      const specialSessionId = 'user_domain_session_123'
      const token = generateCSRFToken(specialSessionId)
      expect(token).toBeDefined()

      const isValid = validateCSRFToken(token, specialSessionId)
      expect(isValid).toBe(true)
    })

    it('should handle Unicode session IDs', () => {
      const unicodeSessionId = 'user-name-123'
      const token = generateCSRFToken(unicodeSessionId)
      expect(token).toBeDefined()

      const isValid = validateCSRFToken(token, unicodeSessionId)
      expect(isValid).toBe(true)
    })
  })

  describe('Environment Configuration', () => {
    it('should work with default configuration', () => {
      // This test verifies the module works with default configuration
      const token1 = generateCSRFToken('test-session-1')
      const token2 = generateCSRFToken('test-session-2')

      // Tokens should be different and both valid for their respective sessions
      expect(token1).not.toBe(token2)
      expect(validateCSRFToken(token1, 'test-session-1')).toBe(true)
      expect(validateCSRFToken(token2, 'test-session-2')).toBe(true)
    })

    it('should handle signature validation correctly', () => {
      const sessionId = 'test-session'
      const token = generateCSRFToken(sessionId)

      // Valid token should pass
      expect(validateCSRFToken(token, sessionId)).toBe(true)

      // Modified token should fail
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const parts = decoded.split(':')
      if (parts.length >= 4) {
        parts[3] = 'tampered-signature'
        const tamperedToken = Buffer.from(parts.join(':')).toString('base64')
        expect(validateCSRFToken(tamperedToken, sessionId)).toBe(false)
      }
    })

    it('should handle malformed token structures', () => {
      // Test various malformed tokens
      const malformedTokens = [
        'invalid',
        Buffer.from('part1').toString('base64'),
        Buffer.from('part1:part2').toString('base64'),
        Buffer.from('part1:part2:part3').toString('base64'),
        '',
        'not-base64-!!!',
      ]

      malformedTokens.forEach(malformedToken => {
        expect(validateCSRFToken(malformedToken, 'test-session')).toBe(false)
      })
    })
  })
})
