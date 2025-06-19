import { NextRequest } from 'next/server'
import { POST } from '@/app/api/cache/warm/route'

// Mock the cache warming system
jest.mock('@/lib/cache/cache-warming', () => ({
  cacheWarmingSystem: {
    warmPredictively: jest.fn(),
    warmTranslationPatterns: jest.fn(),
    warmUserData: jest.fn(),
    getWarmingStats: jest.fn()
  }
}))

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn()
}))

describe('/api/cache/warm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/cache/warm', () => {
    it('should warm cache predictively', async () => {
      const { cacheWarmingSystem } = require('@/lib/cache/cache-warming')
      cacheWarmingSystem.warmPredictively.mockResolvedValue(undefined)
      cacheWarmingSystem.getWarmingStats.mockReturnValue({
        isWarming: false,
        queueSize: 0,
        successRate: 0.95,
        totalWarmed: 150,
        lastWarming: Date.now() - 1000
      })

      const request = new NextRequest('http://localhost:3000/api/cache/warm', {
        method: 'POST',
        body: JSON.stringify({
          type: 'predictive',
          hours: 2
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Predictive cache warming')
      expect(cacheWarmingSystem.warmPredictively).toHaveBeenCalledWith(2)
    })

    it('should warm translation patterns', async () => {
      const { cacheWarmingSystem } = require('@/lib/cache/cache-warming')
      cacheWarmingSystem.warmTranslationPatterns.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/cache/warm', {
        method: 'POST',
        body: JSON.stringify({
          type: 'patterns'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(cacheWarmingSystem.warmTranslationPatterns).toHaveBeenCalled()
    })

    it('should warm user data selectively', async () => {
      const { cacheWarmingSystem } = require('@/lib/cache/cache-warming')
      cacheWarmingSystem.warmUserData.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/cache/warm', {
        method: 'POST',
        body: JSON.stringify({
          type: 'user',
          selective: true,
          userIds: ['user1', 'user2']
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(cacheWarmingSystem.warmUserData).toHaveBeenCalledWith(['user1', 'user2'], true)
    })

    it('should handle invalid warming type', async () => {
      const request = new NextRequest('http://localhost:3000/api/cache/warm', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid warming type')
    })

    it('should handle warming failures', async () => {
      const { cacheWarmingSystem } = require('@/lib/cache/cache-warming')
      cacheWarmingSystem.warmPredictively.mockRejectedValue(new Error('Warming failed'))

      const request = new NextRequest('http://localhost:3000/api/cache/warm', {
        method: 'POST',
        body: JSON.stringify({
          type: 'predictive',
          hours: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Cache warming failed')
    })

    it('should validate request parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/cache/warm', {
        method: 'POST',
        body: JSON.stringify({
          type: 'predictive',
          hours: -1  // Invalid hours
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('validation')
    })

    it('should provide warming statistics in response', async () => {
      const { cacheWarmingSystem } = require('@/lib/cache/cache-warming')
      cacheWarmingSystem.warmTranslationPatterns.mockResolvedValue(undefined)
      cacheWarmingSystem.getWarmingStats.mockReturnValue({
        isWarming: true,
        queueSize: 25,
        successRate: 0.98,
        totalWarmed: 500,
        lastWarming: Date.now(),
        estimatedCompletion: Date.now() + 30000
      })

      const request = new NextRequest('http://localhost:3000/api/cache/warm', {
        method: 'POST',
        body: JSON.stringify({
          type: 'patterns',
          includeStats: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stats).toBeDefined()
      expect(data.stats.isWarming).toBe(true)
      expect(data.stats.queueSize).toBe(25)
      expect(data.stats.successRate).toBe(0.98)
    })

    it('should handle concurrent warming requests', async () => {
      const { cacheWarmingSystem } = require('@/lib/cache/cache-warming')
      cacheWarmingSystem.getWarmingStats.mockReturnValue({
        isWarming: true,
        queueSize: 10
      })
      cacheWarmingSystem.warmPredictively.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/cache/warm', {
        method: 'POST',
        body: JSON.stringify({
          type: 'predictive',
          hours: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      // Should still succeed but may queue the request
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})