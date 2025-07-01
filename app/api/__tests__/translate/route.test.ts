/**
 * Translate API Route Test Suite
 * Target: 85% coverage for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Mock all external dependencies
jest.mock('@/lib/translation-service')
jest.mock('@/lib/chunked-translation-service')
jest.mock('@/lib/rate-limiter')
jest.mock('@/lib/validation')
jest.mock('@/lib/csrf')
jest.mock('@/lib/supabase')
jest.mock('@/lib/redis-translation-cache')
jest.mock('@/lib/credit-manager')
jest.mock('next/headers')

// Mock environment variables
const originalEnv = process.env
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    GOOGLE_TRANSLATE_API_KEY: 'test-api-key',
    UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token'
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('Translate API Route', () => {
  let POST: any
  let OPTIONS: any
  
  // Mock implementations
  const mockTranslationService = {
    translateText: jest.fn()
  }
  
  const mockChunkedTranslationService = {
    translateLargeText: jest.fn(),
    getOptimalChunkingSettings: jest.fn()
  }
  
  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn()
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
  
  const mockCookies = jest.fn()
  
  beforeAll(() => {
    // Setup mocks before importing modules
    const mockTranslationServiceModule = { translationService: mockTranslationService }
    const mockChunkedTranslationServiceModule = { chunkedTranslationService: mockChunkedTranslationService }
    const mockRateLimiterModule = { getRateLimitForTier: jest.fn() }
    const mockValidationModule = { 
      validateRequest: jest.fn(),
      translationSchema: { safeParse: jest.fn() }
    }
    const mockCSRFModule = { validateCSRFMiddleware: jest.fn() }
    const mockSupabaseModule = { createRouteHandlerClient: jest.fn(() => mockSupabaseClient) }
    const mockRedisModule = { redisTranslationCache: { invalidateUserHistory: jest.fn() } }
    const mockCreditModule = { 
      checkAndDeductCredits: jest.fn(),
      estimateTokensFromText: jest.fn()
    }
    const mockHeadersModule = { cookies: mockCookies }

    // Mock modules
    jest.doMock('@/lib/translation-service', () => mockTranslationServiceModule)
    jest.doMock('@/lib/chunked-translation-service', () => mockChunkedTranslationServiceModule) 
    jest.doMock('@/lib/rate-limiter', () => mockRateLimiterModule)
    jest.doMock('@/lib/validation', () => mockValidationModule)
    jest.doMock('@/lib/csrf', () => mockCSRFModule)
    jest.doMock('@/lib/supabase', () => mockSupabaseModule)
    jest.doMock('@/lib/redis-translation-cache', () => mockRedisModule)
    jest.doMock('@/lib/credit-manager', () => mockCreditModule)
    jest.doMock('next/headers', () => mockHeadersModule)
    
    // Import route handlers after mocking
    const routeModule = require('../../translate/unified/route')
    POST = routeModule.POST
    OPTIONS = routeModule.OPTIONS
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/translate', () => {
    const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
      return {
        json: jest.fn().mockResolvedValue(body),
        headers: {
          get: jest.fn((key: string) => headers[key.toLowerCase()] || null)
        }
      } as unknown as NextRequest
    }

    describe('Authentication', () => {
      it('should reject requests without authentication', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null }
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Authentication required')
      })

      it('should accept requests with valid session', async () => {
        const mockSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: { subscription_tier: 'free' }
          }
        }

        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: mockSession }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })

        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi'
          }
        })

        require('@/lib/credit-manager').estimateTokensFromText.mockReturnValue(50)
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: true,
          credits_used: 50,
          credits_before: 1000,
          credits_after: 950
        })

        mockTranslationService.translateText.mockResolvedValue({
          translatedText: 'Xin chào thế giới',
          detectedSourceLanguage: 'en',
          confidence: 0.95,
          qualityScore: 0.9
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.result.translatedText).toBe('Xin chào thế giới')
      })
    })

    describe('Rate Limiting', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })
      })

      it('should reject requests when rate limit exceeded', async () => {
        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: false,
          limit: 100,
          remaining: 0,
          reset: Date.now() + 3600000
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(429)
        expect(data.error).toBe('Too many requests')
        expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      })

      it('should handle different subscription tiers', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'premium' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 1000,
          remaining: 999,
          reset: Date.now() + 3600000
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        expect(require('@/lib/rate-limiter').getRateLimitForTier).toHaveBeenCalledWith(
          request,
          'premium'
        )
      })
    })

    describe('CSRF Protection', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })
      })

      it('should validate CSRF token for web requests', async () => {
        require('@/lib/csrf').validateCSRFMiddleware.mockResolvedValue({
          valid: false
        })

        const request = createMockRequest(
          { text: 'Hello world', targetLang: 'vi' },
          { origin: 'https://prismy.io' }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Invalid CSRF token')
        expect(require('@/lib/csrf').validateCSRFMiddleware).toHaveBeenCalledWith(request)
      })

      it('should skip CSRF validation for non-web requests', async () => {
        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: { text: 'Hello world', targetLang: 'vi' }
        })

        const request = createMockRequest(
          { text: 'Hello world', targetLang: 'vi' },
          { origin: 'https://external-api.com' }
        )

        await POST(request)

        expect(require('@/lib/csrf').validateCSRFMiddleware).not.toHaveBeenCalled()
      })

      it('should handle localhost origins', async () => {
        require('@/lib/csrf').validateCSRFMiddleware.mockResolvedValue({
          valid: true
        })

        const request = createMockRequest(
          { text: 'Hello world', targetLang: 'vi' },
          { origin: 'http://localhost:3000' }
        )

        expect(require('@/lib/csrf').validateCSRFMiddleware).toHaveBeenCalledWith(request)
      })
    })

    describe('Request Validation', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })
      })

      it('should reject invalid request body', async () => {
        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: false,
          error: {
            flatten: () => ({
              fieldErrors: { text: ['Text is required'] }
            })
          }
        })

        const request = createMockRequest({
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request')
        expect(data.details).toBeDefined()
      })

      it('should validate required fields', async () => {
        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi',
            sourceLang: 'en',
            qualityTier: 'standard',
            serviceType: 'google_translate',
            trackHistory: true,
            createTask: false
          }
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          sourceLang: 'en',
          qualityTier: 'standard',
          serviceType: 'google_translate',
          trackHistory: true,
          createTask: false
        })

        expect(require('@/lib/validation').translationSchema.safeParse).toHaveBeenCalledWith({
          text: 'Hello world',
          targetLang: 'vi',
          sourceLang: 'en',
          qualityTier: 'standard',
          serviceType: 'google_translate',
          trackHistory: true,
          createTask: false
        })
      })
    })

    describe('Credit Management', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })

        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi'
          }
        })
      })

      it('should reject requests with insufficient credits', async () => {
        require('@/lib/credit-manager').estimateTokensFromText.mockReturnValue(1000)
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: false,
          credits_before: 500
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(402)
        expect(data.error).toBe('Insufficient credits')
        expect(data.required).toBe(1000)
        expect(data.available).toBe(500)
      })

      it('should calculate credits for tasks vs regular translations', async () => {
        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi',
            createTask: true,
            serviceType: 'llm'
          }
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          createTask: true,
          serviceType: 'llm'
        })

        // Mock credit calculation for task (should use calculateCredits)
        // Text is 'Hello world' = 2 words = 1 page = 500 credits for LLM
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: true,
          credits_used: 500,
          credits_before: 1000,
          credits_after: 500
        })

        await POST(request)

        expect(require('@/lib/credit-manager').checkAndDeductCredits).toHaveBeenCalledWith(
          mockSupabaseClient,
          'user-123',
          {
            tokens: 500, // 1 page * 500 credits per page for LLM
            operation_type: 'translate',
            quality_tier: 'standard'
          },
          'translation'
        )
      })

      it('should handle credit calculation for Google Translate', async () => {
        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi',
            createTask: true,
            serviceType: 'google_translate'
          }
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          createTask: true,
          serviceType: 'google_translate'
        })

        // Text is 'Hello world' = 2 words = 1 page = 30 credits for Google Translate
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: true,
          credits_used: 30,
          credits_before: 1000,
          credits_after: 970
        })

        await POST(request)

        expect(require('@/lib/credit-manager').checkAndDeductCredits).toHaveBeenCalledWith(
          mockSupabaseClient,
          'user-123',
          {
            tokens: 30, // 1 page * 30 credits per page for Google Translate
            operation_type: 'translate',
            quality_tier: 'standard'
          },
          'translation'
        )
      })
    })

    describe('Task Management', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })

        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi',
            createTask: true
          }
        })

        require('@/lib/credit-manager').estimateTokensFromText.mockReturnValue(50)
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: true,
          credits_used: 50,
          credits_before: 1000,
          credits_after: 950
        })
      })

      it('should create task when requested', async () => {
        const mockTask = {
          id: 'task-123',
          user_id: 'user-123',
          type: 'translate',
          status: 'running'
        }

        mockSupabaseClient.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTask,
                error: null
              })
            })
          })
        })

        mockTranslationService.translateText.mockResolvedValue({
          translatedText: 'Xin chào thế giới',
          detectedSourceLanguage: 'en',
          confidence: 0.95,
          qualityScore: 0.9
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          createTask: true
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.taskId).toBe('task-123')
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
      })

      it('should handle task creation errors gracefully', async () => {
        mockSupabaseClient.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Task creation failed' }
              })
            })
          })
        })

        mockTranslationService.translateText.mockResolvedValue({
          translatedText: 'Xin chào thế giới',
          detectedSourceLanguage: 'en',
          confidence: 0.95,
          qualityScore: 0.9
        })

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          createTask: true
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.taskId).toBeUndefined()
        expect(consoleErrorSpy).toHaveBeenCalledWith('Task creation error:', { message: 'Task creation failed' })

        consoleErrorSpy.mockRestore()
      })
    })

    describe('Translation Processing', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })

        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi'
          }
        })

        require('@/lib/credit-manager').estimateTokensFromText.mockReturnValue(50)
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: true,
          credits_used: 50,
          credits_before: 1000,
          credits_after: 950
        })
      })

      it('should use standard translation for small texts', async () => {
        mockTranslationService.translateText.mockResolvedValue({
          translatedText: 'Xin chào thế giới',
          detectedSourceLanguage: 'en',
          confidence: 0.95,
          qualityScore: 0.9,
          cached: false
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(mockTranslationService.translateText).toHaveBeenCalledWith({
          text: 'Hello world',
          sourceLang: 'auto',
          targetLang: 'vi',
          qualityTier: 'standard',
          abTestVariant: 'cache_enabled'
        })
        expect(data.result.translatedText).toBe('Xin chào thế giới')
      })

      it('should use chunked translation for large texts', async () => {
        const largeText = 'A'.repeat(5000) // 5000 characters > 4000 threshold

        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: largeText,
            targetLang: 'vi'
          }
        })

        mockChunkedTranslationService.getOptimalChunkingSettings.mockReturnValue({
          chunkSize: 3000,
          overlap: 100
        })

        mockChunkedTranslationService.translateLargeText.mockResolvedValue({
          translatedText: 'Translated large text',
          detectedSourceLanguage: 'en',
          confidence: 0.95,
          qualityScore: 0.9
        })

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

        const request = createMockRequest({
          text: largeText,
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(mockChunkedTranslationService.translateLargeText).toHaveBeenCalledWith({
          text: largeText,
          sourceLang: 'auto',
          targetLang: 'vi',
          qualityTier: 'standard',
          chunkingOptions: {
            chunkSize: 3000,
            overlap: 100
          },
          onProgress: expect.any(Function)
        })
        expect(data.result.translatedText).toBe('Translated large text')
        expect(consoleLogSpy).toHaveBeenCalledWith('🧩 Using chunked translation for large text', expect.any(Object))

        consoleLogSpy.mockRestore()
      })

      it('should handle translation failures', async () => {
        mockTranslationService.translateText.mockResolvedValue({
          translatedText: null
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Translation failed')
        expect(data.message).toBe('Translation failed - no result returned')
      })

      it('should handle translation service errors', async () => {
        mockTranslationService.translateText.mockRejectedValue(new Error('Service unavailable'))

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Translation failed')
        expect(data.message).toBe('Service unavailable')
      })
    })

    describe('Translation History', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })

        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi'
          }
        })

        require('@/lib/credit-manager').estimateTokensFromText.mockReturnValue(50)
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: true,
          credits_used: 50,
          credits_before: 1000,
          credits_after: 950
        })

        mockTranslationService.translateText.mockResolvedValue({
          translatedText: 'Xin chào thế giới',
          detectedSourceLanguage: 'en',
          confidence: 0.95,
          qualityScore: 0.9,
          cached: false
        })
      })

      it('should track translation history when enabled', async () => {
        const mockHistoryInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
        mockSupabaseClient.from.mockReturnValue({
          insert: mockHistoryInsert
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          trackHistory: true
        })

        await POST(request)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('translation_history')
        expect(mockHistoryInsert).toHaveBeenCalledWith({
          user_id: 'user-123',
          source_text: 'Hello world',
          translated_text: 'Xin chào thế giới',
          source_language: 'en',
          target_language: 'vi',
          quality_tier: 'standard',
          processing_time: expect.any(Number),
          cached: false,
          tokens_used: 50,
          character_count: 11
        })
      })

      it('should skip history tracking when disabled', async () => {
        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi',
            trackHistory: false
          }
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          trackHistory: false
        })

        await POST(request)

        expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('translation_history')
      })

      it('should invalidate user history cache', async () => {
        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          trackHistory: true
        })

        await POST(request)

        expect(require('@/lib/redis-translation-cache').redisTranslationCache.invalidateUserHistory)
          .toHaveBeenCalledWith('user-123')
      })
    })

    describe('Response Format', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })

        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi'
          }
        })

        require('@/lib/credit-manager').estimateTokensFromText.mockReturnValue(50)
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: true,
          credits_used: 50,
          credits_before: 1000,
          credits_after: 950
        })

        mockTranslationService.translateText.mockResolvedValue({
          translatedText: 'Xin chào thế giới',
          detectedSourceLanguage: 'en',
          targetLang: 'vi',
          confidence: 0.95,
          qualityScore: 0.9,
          cached: false
        })
      })

      it('should return complete response structure', async () => {
        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
          success: true,
          translationId: expect.stringMatching(/^trans_\d+_[a-z0-9]{9}$/),
          result: {
            translatedText: 'Xin chào thế giới',
            sourceLanguage: 'en',
            targetLanguage: 'vi',
            qualityTier: 'standard',
            qualityScore: 0.9,
            cached: false,
            processingTime: expect.any(Number)
          },
          credits: {
            used: 50,
            remaining: 950,
            previousBalance: 1000
          },
          billing: {
            charactersTranslated: 11,
            tokensProcessed: 50,
            qualityTier: 'standard',
            serviceType: 'google_translate',
            rateLimit: {
              remaining: 99,
              limit: 100
            }
          }
        })
      })

      it('should include taskId when task is created', async () => {
        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi',
            createTask: true
          }
        })

        const mockTask = {
          id: 'task-123',
          user_id: 'user-123',
          type: 'translate',
          status: 'running'
        }

        mockSupabaseClient.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTask,
                error: null
              })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null })
          })
        })

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          createTask: true
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.taskId).toBe('task-123')
      })
    })

    describe('Credit Refund on Error', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { subscription_tier: 'free' }
              }
            }
          }
        })

        require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 3600000
        })

        require('@/lib/validation').translationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            text: 'Hello world',
            targetLang: 'vi',
            createTask: true
          }
        })

        require('@/lib/credit-manager').estimateTokensFromText.mockReturnValue(50)
        require('@/lib/credit-manager').checkAndDeductCredits.mockResolvedValue({
          success: true,
          credits_used: 50,
          credits_before: 1000,
          credits_after: 950
        })
      })

      it('should refund credits when task creation fails', async () => {
        const mockTask = {
          id: 'task-123',
          user_id: 'user-123',
          type: 'translate',
          status: 'running'
        }

        const mockRefundInsert = jest.fn().mockResolvedValue({ data: {}, error: null })

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'tasks') {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockTask,
                    error: null
                  })
                })
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: {}, error: null })
              })
            }
          } else if (table === 'credits') {
            return {
              insert: mockRefundInsert
            }
          }
          return {}
        })

        mockTranslationService.translateText.mockRejectedValue(new Error('Translation service failed'))

        const request = createMockRequest({
          text: 'Hello world',
          targetLang: 'vi',
          createTask: true
        })

        const response = await POST(request)

        expect(response.status).toBe(500)
        expect(mockRefundInsert).toHaveBeenCalledWith({
          user_id: 'user-123',
          change: 50,
          reason: 'Refund for failed translation task task-123',
          created_at: expect.any(String)
        })
      })
    })
  })

  describe('OPTIONS /api/translate', () => {
    it('should handle CORS preflight requests', async () => {
      const request = {} as NextRequest
      const response = await OPTIONS(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, X-CSRF-Token')
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Translation failed')
    })

    it('should handle missing user email', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: null,
              user_metadata: { subscription_tier: 'free' }
            }
          }
        }
      })

      require('@/lib/rate-limiter').getRateLimitForTier.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 3600000
      })

      const request = createMockRequest({
        text: 'Hello world',
        targetLang: 'vi'
      })

      // Should use user ID as fallback for rate limiting
      expect(require('@/lib/rate-limiter').getRateLimitForTier).toHaveBeenCalledWith(
        request,
        'free'
      )
    })
  })
})