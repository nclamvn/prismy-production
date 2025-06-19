import { NextRequest } from 'next/server'
import { POST } from '@/app/api/translate/route'

// Mock external services
jest.mock('@google-cloud/translate', () => ({
  Translate: jest.fn(() => ({
    translate: jest.fn().mockResolvedValue([['Xin chào thế giới'], { confidence: 0.95 }])
  }))
}))

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: () => ({
    from: () => ({
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      select: jest.fn().mockResolvedValue({ 
        data: [{ subscription_tier: 'standard', usage_count: 5 }], 
        error: null 
      })
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })
    }
  })
}))

jest.mock('@/lib/cache/cache-coordinator', () => ({
  cacheCoordinator: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined)
  }
}))

jest.mock('@/lib/rate-limiter', () => ({
  rateLimiter: {
    limit: jest.fn().mockResolvedValue({ success: true, remaining: 9 })
  }
}))

describe('Translation Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Translation Flow', () => {
    it('should handle end-to-end translation request', async () => {
      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi',
          qualityTier: 'standard'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        translatedText: 'Xin chào thế giới',
        confidence: expect.any(Number),
        sourceLang: 'en',
        targetLang: 'vi',
        cached: false
      })
    })

    it('should return cached translation when available', async () => {
      const { cacheCoordinator } = require('@/lib/cache/cache-coordinator')
      cacheCoordinator.get.mockResolvedValue({
        translatedText: 'Xin chào thế giới (cached)',
        confidence: 0.98,
        sourceLang: 'en',
        targetLang: 'vi',
        cached: true
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi',
          qualityTier: 'standard'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.translatedText).toBe('Xin chào thế giới (cached)')
      expect(data.cached).toBe(true)
    })

    it('should enforce rate limits', async () => {
      const { rateLimiter } = require('@/lib/rate-limiter')
      rateLimiter.limit.mockResolvedValue({ success: false, remaining: 0 })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('rate limit')
    })

    it('should validate input parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: '', // Empty text
          sourceLang: 'en',
          targetLang: 'vi'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('validation')
    })

    it('should handle subscription limits', async () => {
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      
      // Mock user with exceeded usage
      mockSupabase.from().select.mockResolvedValue({
        data: [{ subscription_tier: 'free', usage_count: 10 }], // Exceeded free limit
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('usage limit')
    })

    it('should handle authentication failures', async () => {
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token')
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('authentication')
    })

    it('should track usage in database', async () => {
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      const mockInsert = mockSupabase.from().insert

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi',
          qualityTier: 'standard'
        })
      })

      await POST(request)

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          source_text: 'Hello world',
          translated_text: 'Xin chào thế giới',
          source_lang: 'en',
          target_lang: 'vi',
          quality_tier: 'standard'
        })
      )
    })

    it('should cache new translations', async () => {
      const { cacheCoordinator } = require('@/lib/cache/cache-coordinator')

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi',
          qualityTier: 'standard'
        })
      })

      await POST(request)

      expect(cacheCoordinator.set).toHaveBeenCalledWith(
        expect.stringContaining('translation:'),
        expect.objectContaining({
          translatedText: 'Xin chào thế giới',
          confidence: 0.95
        }),
        expect.any(Number),
        expect.arrayContaining(['translation', 'user:user-123'])
      )
    })

    it('should handle Google Translate API failures', async () => {
      const { Translate } = require('@google-cloud/translate')
      const mockTranslate = new Translate()
      mockTranslate.translate.mockRejectedValue(new Error('API quota exceeded'))

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('translation service')
    })

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        new NextRequest('http://localhost:3000/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify({
            text: `Hello world ${i}`,
            sourceLang: 'en',
            targetLang: 'vi'
          })
        })
      )

      const responses = await Promise.all(requests.map(req => POST(req)))
      
      expect(responses).toHaveLength(5)
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Error Recovery', () => {
    it('should gracefully degrade when cache is unavailable', async () => {
      const { cacheCoordinator } = require('@/lib/cache/cache-coordinator')
      cacheCoordinator.get.mockRejectedValue(new Error('Cache unavailable'))
      cacheCoordinator.set.mockRejectedValue(new Error('Cache unavailable'))

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      // Should still work without cache
      expect(response.status).toBe(200)
      expect(data.translatedText).toBe('Xin chào thế giới')
      expect(data.cached).toBe(false)
    })

    it('should handle database connection failures', async () => {
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      // Should still return translation but log the database error
      expect(response.status).toBe(200)
      expect(data.translatedText).toBe('Xin chào thế giới')
    })
  })
})