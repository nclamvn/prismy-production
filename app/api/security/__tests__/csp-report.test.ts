/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST, OPTIONS } from '../csp-report/route'

// Mock console methods
const mockConsoleError = jest.fn()
const mockConsoleWarn = jest.fn()
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

describe('/api/security/csp-report', () => {
  beforeEach(() => {
    console.error = mockConsoleError
    console.warn = mockConsoleWarn
    jest.clearAllMocks()
    
    // Reset environment
    delete process.env.NODE_ENV
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  })

  describe('POST /api/security/csp-report', () => {
    const mockCSPReport = {
      'document-uri': 'https://example.com/page',
      'referrer': 'https://example.com',
      'violated-directive': 'script-src',
      'effective-directive': 'script-src',
      'original-policy': "default-src 'self'; script-src 'self'",
      'disposition': 'enforce',
      'blocked-uri': 'https://malicious-site.com/script.js',
      'line-number': 42,
      'column-number': 15,
      'source-file': 'https://example.com/app.js',
      'status-code': 200,
      'script-sample': 'eval("malicious code")'
    }

    it('handles JSON CSP reports correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 'csp-report': mockCSPReport }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ received: true })
      expect(mockConsoleError).toHaveBeenCalledWith('🚨 CSP Violation Report:', expect.objectContaining({
        documentURI: mockCSPReport['document-uri'],
        violatedDirective: mockCSPReport['violated-directive'],
        blockedURI: mockCSPReport['blocked-uri'],
        sourceFile: mockCSPReport['source-file'],
        lineNumber: mockCSPReport['line-number'],
        originalPolicy: mockCSPReport['original-policy'],
        timestamp: expect.any(String),
      }))
    })

    it('handles CSP reports without wrapper object', async () => {
      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockCSPReport),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ received: true })
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it('handles form-encoded CSP reports', async () => {
      const formData = new FormData()
      formData.append('csp-report', JSON.stringify(mockCSPReport))

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ received: true })
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it('identifies legitimate browser extension violations', async () => {
      const extensionReport = {
        ...mockCSPReport,
        'blocked-uri': 'chrome-extension://abc123/content.js',
        'source-file': 'chrome-extension://abc123/content.js'
      }

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 'csp-report': extensionReport }),
      })

      await POST(request)

      // Should not warn about legitimate extension violations
      expect(mockConsoleWarn).not.toHaveBeenCalled()
    })

    it('identifies legitimate CDN violations', async () => {
      const cdnReport = {
        ...mockCSPReport,
        'blocked-uri': 'https://fonts.googleapis.com/css',
        'source-file': 'https://fonts.googleapis.com/css'
      }

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 'csp-report': cdnReport }),
      })

      await POST(request)

      // Should not warn about legitimate CDN violations
      expect(mockConsoleWarn).not.toHaveBeenCalled()
    })

    it('flags potential security issues', async () => {
      const suspiciousReport = {
        ...mockCSPReport,
        'blocked-uri': 'https://definitely-malicious.com/evil.js',
        'source-file': 'https://definitely-malicious.com/evil.js'
      }

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 'csp-report': suspiciousReport }),
      })

      await POST(request)

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '🔍 Potential security issue or CSP policy update needed:',
        expect.objectContaining({
          directive: suspiciousReport['violated-directive'],
          blocked: suspiciousReport['blocked-uri'],
          source: suspiciousReport['source-file']
        })
      )
    })

    it('handles malformed JSON reports', async () => {
      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: 'invalid json {',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to process CSP report' })
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to process CSP report:', expect.any(Error))
    })

    it('handles invalid form data', async () => {
      const formData = new FormData()
      formData.append('csp-report', 'invalid json {')

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to process CSP report' })
    })

    it('handles missing form data', async () => {
      const formData = new FormData()
      // No csp-report field

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to process CSP report' })
    })

    it('processes reports differently in production', async () => {
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 'csp-report': mockCSPReport }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      // In production, additional processing would occur
      // This is where you'd test database storage, monitoring alerts, etc.
    })

    it('handles script-src violations', async () => {
      const scriptViolation = {
        ...mockCSPReport,
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.com/malware.js'
      }

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 'csp-report': scriptViolation }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockConsoleError).toHaveBeenCalledWith('🚨 CSP Violation Report:', expect.objectContaining({
        violatedDirective: 'script-src',
        blockedURI: 'https://evil.com/malware.js'
      }))
    })

    it('handles style-src violations', async () => {
      const styleViolation = {
        ...mockCSPReport,
        'violated-directive': 'style-src',
        'blocked-uri': 'https://evil.com/malicious.css'
      }

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 'csp-report': styleViolation }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockConsoleError).toHaveBeenCalledWith('🚨 CSP Violation Report:', expect.objectContaining({
        violatedDirective: 'style-src',
        blockedURI: 'https://evil.com/malicious.css'
      }))
    })

    it('logs timestamp for violation tracking', async () => {
      const beforeTime = Date.now()

      const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ 'csp-report': mockCSPReport }),
      })

      await POST(request)

      const afterTime = Date.now()

      expect(mockConsoleError).toHaveBeenCalledWith('🚨 CSP Violation Report:', expect.objectContaining({
        timestamp: expect.any(String)
      }))

      // Verify timestamp is recent
      const loggedData = mockConsoleError.mock.calls[0][1]
      const loggedTime = new Date(loggedData.timestamp).getTime()
      expect(loggedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(loggedTime).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('OPTIONS /api/security/csp-report', () => {
    it('handles CORS preflight requests', async () => {
      const response = await OPTIONS()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type')
    })
  })

  describe('analyzeCSPViolation', () => {
    it('correctly identifies browser extension patterns', async () => {
      const patterns = [
        'chrome-extension://abc123/script.js',
        'moz-extension://def456/content.js',
        'safari-extension://ghi789/inject.js'
      ]

      for (const uri of patterns) {
        const report = {
          ...mockCSPReport,
          'blocked-uri': uri,
          'source-file': uri
        }

        const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ 'csp-report': report }),
        })

        mockConsoleWarn.mockClear()
        await POST(request)

        // Should not warn about browser extensions
        expect(mockConsoleWarn).not.toHaveBeenCalled()
      }
    })

    it('correctly identifies browser internal URIs', async () => {
      const patterns = [
        'about:blank',
        'data:text/html,<script>alert(1)</script>',
      ]

      for (const uri of patterns) {
        const report = {
          ...mockCSPReport,
          'blocked-uri': uri,
        }

        const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ 'csp-report': report }),
        })

        mockConsoleWarn.mockClear()
        await POST(request)

        // Should not warn about browser internal URIs
        expect(mockConsoleWarn).not.toHaveBeenCalled()
      }
    })

    it('correctly identifies legitimate CDN patterns', async () => {
      const patterns = [
        'https://fonts.googleapis.com/css',
        'https://fonts.gstatic.com/font.woff2',
        'https://ajax.googleapis.com/ajax/libs/jquery.js'
      ]

      for (const uri of patterns) {
        const report = {
          ...mockCSPReport,
          'blocked-uri': uri,
          'source-file': uri
        }

        const request = new NextRequest('http://localhost:3000/api/security/csp-report', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ 'csp-report': report }),
        })

        mockConsoleWarn.mockClear()
        await POST(request)

        // Should not warn about legitimate CDNs
        expect(mockConsoleWarn).not.toHaveBeenCalled()
      }
    })
  })
})