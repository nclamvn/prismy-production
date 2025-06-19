import { POST, GET } from '@/app/api/translate/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/translation-service', () => ({
  translationService: {
    translateText: jest.fn(),
    getSupportedLanguages: jest.fn(),
  },
}))

jest.mock('@/lib/rate-limiter', () => ({
  getRateLimitForTier: jest.fn(),
}))

jest.mock('@/lib/validation', () => ({
  validateRequest: jest.fn(),
  translationSchema: {},
}))

jest.mock('@/lib/csrf', () => ({
  validateCSRFMiddleware: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  createRouteHandlerClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}))

describe('/api/translate', () => {
  const mockTranslationService = require('@/lib/translation-service').translationService
  const mockGetRateLimit = require('@/lib/rate-limiter').getRateLimitForTier
  const mockValidateRequest = require('@/lib/validation').validateRequest
  const mockValidateCSRF = require('@/lib/csrf').validateCSRFMiddleware
  const mockSupabase = require('@/lib/supabase').createRouteHandlerClient

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'user-123', email: 'test@example.com' }
            }
          }
        })
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { subscription_tier: 'standard' }
            })
          }))
        })),
        insert: jest.fn().mockResolvedValue({ data: null, error: null })
      }))
    })
  })

  describe('POST /api/translate', () => {
    it('should translate text successfully', async () => {
      // Setup mocks
      mockValidateCSRF.mockResolvedValue({ valid: true })
      mockGetRateLimit.mockResolvedValue({
        success: true,
        remaining: 45,
        limit: 50,
        reset: Date.now() + 3600000
      })
      mockValidateRequest.mockReturnValue(() => Promise.resolve({
        success: true,
        data: {
          text: 'Hello world',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          qualityTier: 'standard'
        }
      }))
      mockTranslationService.translateText.mockResolvedValue({
        translatedText: 'Hola mundo',
        detectedSourceLanguage: 'en',
        qualityScore: 0.95,
        cached: false
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          targetLang: 'es',
          csrf_token: 'valid-token'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.result.translatedText).toBe('Hola mundo')
      expect(data.result.sourceLanguage).toBe('en')
      expect(data.result.targetLanguage).toBe('es')
      expect(data.usage.charactersTranslated).toBe(11)
    })

    it('should reject unauthenticated requests', async () => {
      mockSupabase.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null }
          })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'Hello world' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should reject requests with invalid CSRF tokens', async () => {
      mockValidateCSRF.mockResolvedValue({
        valid: false,
        error: 'Invalid CSRF token'
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          csrf_token: 'invalid-token'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Invalid CSRF token')
    })

    it('should enforce rate limiting', async () => {
      mockValidateCSRF.mockResolvedValue({ valid: true })
      mockGetRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        limit: 50,
        reset: Date.now() + 3600000,
        retryAfter: 3600
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          csrf_token: 'valid-token'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Rate limit exceeded')
      expect(response.headers.get('Retry-After')).toBe('3600')
    })

    it('should validate input data', async () => {
      mockValidateCSRF.mockResolvedValue({ valid: true })
      mockGetRateLimit.mockResolvedValue({ success: true })
      mockValidateRequest.mockReturnValue(() => Promise.resolve({
        success: false,
        errors: ['text: Text cannot be empty']
      }))

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: '',
          csrf_token: 'valid-token'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('text: Text cannot be empty')
    })

    it('should handle translation service errors', async () => {
      mockValidateCSRF.mockResolvedValue({ valid: true })
      mockGetRateLimit.mockResolvedValue({ success: true })
      mockValidateRequest.mockReturnValue(() => Promise.resolve({
        success: true,
        data: {
          text: 'Hello world',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          qualityTier: 'standard'
        }
      }))
      mockTranslationService.translateText.mockRejectedValue(
        new Error('Translation service unavailable')
      )

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          targetLang: 'es',
          csrf_token: 'valid-token'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Translation failed')
      expect(data.message).toBe('Translation service temporarily unavailable')
    })

    it('should normalize legacy field names', async () => {
      mockValidateCSRF.mockResolvedValue({ valid: true })
      mockGetRateLimit.mockResolvedValue({ success: true })
      mockValidateRequest.mockReturnValue(() => Promise.resolve({
        success: true,
        data: {
          text: 'Hello world',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          qualityTier: 'standard'
        }
      }))
      mockTranslationService.translateText.mockResolvedValue({
        translatedText: 'Hola mundo',
        qualityScore: 0.95
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en', // Legacy field name
          targetLang: 'es', // Legacy field name
          csrf_token: 'valid-token'
        })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      // Verify that validateRequest was called with normalized data
      expect(mockValidateRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceLanguage: 'en',
          targetLanguage: 'es'
        })
      )
    })

    it('should track translation in database', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null })
      const mockFrom = jest.fn(() => ({ insert: mockInsert }))
      
      mockSupabase.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'user-123', email: 'test@example.com' }
              }
            }
          })
        },
        from: mockFrom
      })

      mockValidateCSRF.mockResolvedValue({ valid: true })
      mockGetRateLimit.mockResolvedValue({ success: true })
      mockValidateRequest.mockReturnValue(() => Promise.resolve({
        success: true,
        data: {
          text: 'Hello world',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          qualityTier: 'standard'
        }
      }))
      mockTranslationService.translateText.mockResolvedValue({
        translatedText: 'Hola mundo',
        qualityScore: 0.95
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          targetLang: 'es',
          csrf_token: 'valid-token'
        })
      })

      await POST(request)

      expect(mockFrom).toHaveBeenCalledWith('translation_history')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          source_text: 'Hello world',
          translated_text: 'Hola mundo',
          source_language: 'en',
          target_language: 'es',
          quality_tier: 'standard',
          character_count: 11
        })
      )
    })
  })

  describe('GET /api/translate', () => {
    it('should return supported languages', async () => {
      mockGetRateLimit.mockResolvedValue({ success: true })
      mockTranslationService.getSupportedLanguages.mockResolvedValue([
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' }
      ])

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.languages).toHaveLength(3)
      expect(data.languages[0]).toEqual({ code: 'en', name: 'English' })
    })

    it('should enforce rate limiting for languages endpoint', async () => {
      mockGetRateLimit.mockResolvedValue({
        success: false,
        retryAfter: 60
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
    })

    it('should handle language service errors', async () => {
      mockGetRateLimit.mockResolvedValue({ success: true })
      mockTranslationService.getSupportedLanguages.mockRejectedValue(
        new Error('Language service error')
      )

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch supported languages')
    })
  })
})