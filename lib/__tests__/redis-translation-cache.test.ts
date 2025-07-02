/**
 * Redis Translation Cache Test Suite
 * Target: 85% coverage for caching system
 */

// Mock Redis
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  flushall: jest.fn(),
  keys: jest.fn(),
  mget: jest.fn(),
  mset: jest.fn(),
  ping: jest.fn(),
}

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => mockRedisClient),
}))

// Mock environment variables
const originalEnv = process.env
beforeAll(() => {
  process.env = {
    ...originalEnv,
    UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    NODE_ENV: 'test',
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('Redis Translation Cache', () => {
  let redisTranslationCache: any

  beforeAll(() => {
    const cacheModule = require('../redis-translation-cache')
    redisTranslationCache = cacheModule.redisTranslationCache
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Cache Operations', () => {
    it('should set cache entry', async () => {
      mockRedisClient.set.mockResolvedValue('OK')

      const cacheData = {
        translatedText: 'Xin chào thế giới',
        detectedSourceLanguage: 'en',
        confidence: 0.95,
        qualityScore: 0.9,
      }

      await redisTranslationCache.set('test-key', cacheData, 3600)

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(cacheData),
        { ex: 3600 }
      )
    })

    it('should get cache entry', async () => {
      const cachedData = {
        translatedText: 'Cached translation',
        detectedSourceLanguage: 'en',
        confidence: 0.95,
      }

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData))

      const result = await redisTranslationCache.get('test-key')

      expect(result).toEqual(cachedData)
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key')
    })

    it('should return null for missing cache entry', async () => {
      mockRedisClient.get.mockResolvedValue(null)

      const result = await redisTranslationCache.get('missing-key')

      expect(result).toBeNull()
    })

    it('should delete cache entry', async () => {
      mockRedisClient.del.mockResolvedValue(1)

      await redisTranslationCache.delete('test-key')

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key')
    })

    it('should check if cache entry exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1)

      const exists = await redisTranslationCache.exists('test-key')

      expect(exists).toBe(true)
      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key')
    })

    it('should handle cache miss', async () => {
      mockRedisClient.exists.mockResolvedValue(0)

      const exists = await redisTranslationCache.exists('missing-key')

      expect(exists).toBe(false)
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const key1 = redisTranslationCache.generateKey(
        'Hello world',
        'en',
        'vi',
        'standard'
      )
      const key2 = redisTranslationCache.generateKey(
        'Hello world',
        'en',
        'vi',
        'standard'
      )

      expect(key1).toBe(key2)
      expect(typeof key1).toBe('string')
      expect(key1.length).toBeGreaterThan(0)
    })

    it('should generate different keys for different inputs', () => {
      const key1 = redisTranslationCache.generateKey(
        'Hello world',
        'en',
        'vi',
        'standard'
      )
      const key2 = redisTranslationCache.generateKey(
        'Hello world',
        'en',
        'fr',
        'standard'
      )
      const key3 = redisTranslationCache.generateKey(
        'Hello world',
        'en',
        'vi',
        'premium'
      )

      expect(key1).not.toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key2).not.toBe(key3)
    })

    it('should handle special characters in text', () => {
      const key = redisTranslationCache.generateKey(
        'Hello @user! 🌍',
        'en',
        'vi',
        'standard'
      )

      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    })

    it('should handle very long text', () => {
      const longText = 'A'.repeat(10000)
      const key = redisTranslationCache.generateKey(
        longText,
        'en',
        'vi',
        'standard'
      )

      expect(typeof key).toBe('string')
      expect(key.length).toBeLessThan(500) // Should be hashed/truncated
    })

    it('should be case sensitive', () => {
      const key1 = redisTranslationCache.generateKey(
        'Hello',
        'en',
        'vi',
        'standard'
      )
      const key2 = redisTranslationCache.generateKey(
        'hello',
        'en',
        'vi',
        'standard'
      )

      expect(key1).not.toBe(key2)
    })
  })

  describe('Batch Operations', () => {
    it('should get multiple cache entries', async () => {
      const mockData = [
        JSON.stringify({ translatedText: 'Translation 1' }),
        JSON.stringify({ translatedText: 'Translation 2' }),
        null,
      ]

      mockRedisClient.mget.mockResolvedValue(mockData)

      const results = await redisTranslationCache.getMultiple([
        'key1',
        'key2',
        'key3',
      ])

      expect(results).toEqual([
        { translatedText: 'Translation 1' },
        { translatedText: 'Translation 2' },
        null,
      ])
      expect(mockRedisClient.mget).toHaveBeenCalledWith([
        'key1',
        'key2',
        'key3',
      ])
    })

    it('should set multiple cache entries', async () => {
      const entries = {
        key1: { translatedText: 'Translation 1' },
        key2: { translatedText: 'Translation 2' },
      }

      mockRedisClient.mset.mockResolvedValue('OK')

      await redisTranslationCache.setMultiple(entries, 3600)

      expect(mockRedisClient.mset).toHaveBeenCalledWith({
        key1: JSON.stringify(entries.key1),
        key2: JSON.stringify(entries.key2),
      })
    })

    it('should handle empty batch operations', async () => {
      const results = await redisTranslationCache.getMultiple([])
      expect(results).toEqual([])

      await redisTranslationCache.setMultiple({}, 3600)
      expect(mockRedisClient.mset).not.toHaveBeenCalled()
    })
  })

  describe('Cache Statistics', () => {
    it('should get cache statistics', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3'])

      const stats = await redisTranslationCache.getStats()

      expect(stats).toEqual({
        totalKeys: 3,
        keyPattern: expect.any(String),
      })
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })

    it('should handle empty cache stats', async () => {
      mockRedisClient.keys.mockResolvedValue([])

      const stats = await redisTranslationCache.getStats()

      expect(stats.totalKeys).toBe(0)
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate user history cache', async () => {
      mockRedisClient.keys.mockResolvedValue([
        'user:123:history:1',
        'user:123:history:2',
      ])
      mockRedisClient.del.mockResolvedValue(2)

      await redisTranslationCache.invalidateUserHistory('user-123')

      expect(mockRedisClient.keys).toHaveBeenCalledWith(
        '*user:user-123:history*'
      )
      expect(mockRedisClient.del).toHaveBeenCalledWith([
        'user:123:history:1',
        'user:123:history:2',
      ])
    })

    it('should handle no matching keys for invalidation', async () => {
      mockRedisClient.keys.mockResolvedValue([])

      await redisTranslationCache.invalidateUserHistory('user-123')

      expect(mockRedisClient.del).not.toHaveBeenCalled()
    })

    it('should invalidate pattern-based cache', async () => {
      mockRedisClient.keys.mockResolvedValue([
        'translate:en:vi:1',
        'translate:en:vi:2',
      ])
      mockRedisClient.del.mockResolvedValue(2)

      await redisTranslationCache.invalidatePattern('translate:en:vi:*')

      expect(mockRedisClient.keys).toHaveBeenCalledWith('translate:en:vi:*')
      expect(mockRedisClient.del).toHaveBeenCalledWith([
        'translate:en:vi:1',
        'translate:en:vi:2',
      ])
    })
  })

  describe('Cache Expiration', () => {
    it('should set expiration on cache entry', async () => {
      mockRedisClient.expire.mockResolvedValue(1)

      await redisTranslationCache.expire('test-key', 3600)

      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 3600)
    })

    it('should handle expiration on non-existent key', async () => {
      mockRedisClient.expire.mockResolvedValue(0)

      const result = await redisTranslationCache.expire('missing-key', 3600)

      expect(result).toBe(false)
    })

    it('should use default TTL when not specified', async () => {
      mockRedisClient.set.mockResolvedValue('OK')

      await redisTranslationCache.set('test-key', { test: 'data' })

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        expect.any(String),
        { ex: 3600 } // Default TTL
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle Redis connection errors on get', async () => {
      mockRedisClient.get.mockRejectedValue(
        new Error('Redis connection failed')
      )

      const result = await redisTranslationCache.get('test-key')

      expect(result).toBeNull()
    })

    it('should handle Redis connection errors on set', async () => {
      mockRedisClient.set.mockRejectedValue(
        new Error('Redis connection failed')
      )

      // Should not throw
      await expect(
        redisTranslationCache.set('test-key', { test: 'data' })
      ).resolves.not.toThrow()
    })

    it('should handle malformed JSON in cache', async () => {
      mockRedisClient.get.mockResolvedValue('invalid json')

      const result = await redisTranslationCache.get('test-key')

      expect(result).toBeNull()
    })

    it('should handle Redis network timeouts', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('TIMEOUT'))

      const result = await redisTranslationCache.get('test-key')

      expect(result).toBeNull()
    })

    it('should handle Redis memory issues', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('OOM'))

      await expect(
        redisTranslationCache.set('test-key', { test: 'data' })
      ).resolves.not.toThrow()
    })
  })

  describe('Cache Warming', () => {
    it('should warm cache with common translations', async () => {
      const commonTranslations = [
        {
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'vi',
          result: 'Xin chào',
        },
        {
          text: 'Goodbye',
          sourceLang: 'en',
          targetLang: 'vi',
          result: 'Tạm biệt',
        },
      ]

      mockRedisClient.mset.mockResolvedValue('OK')

      await redisTranslationCache.warmCache(commonTranslations)

      expect(mockRedisClient.mset).toHaveBeenCalled()
    })

    it('should handle empty warm cache data', async () => {
      await redisTranslationCache.warmCache([])

      expect(mockRedisClient.mset).not.toHaveBeenCalled()
    })
  })

  describe('Cache Cleanup', () => {
    it('should clear all cache', async () => {
      mockRedisClient.flushall.mockResolvedValue('OK')

      await redisTranslationCache.clear()

      expect(mockRedisClient.flushall).toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', async () => {
      mockRedisClient.flushall.mockRejectedValue(new Error('Cleanup failed'))

      await expect(redisTranslationCache.clear()).resolves.not.toThrow()
    })
  })

  describe('Connection Health', () => {
    it('should check Redis connection health', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')

      const isHealthy = await redisTranslationCache.healthCheck()

      expect(isHealthy).toBe(true)
      expect(mockRedisClient.ping).toHaveBeenCalled()
    })

    it('should handle unhealthy Redis connection', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection failed'))

      const isHealthy = await redisTranslationCache.healthCheck()

      expect(isHealthy).toBe(false)
    })

    it('should handle ping timeout', async () => {
      mockRedisClient.ping.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 1000)
          )
      )

      const isHealthy = await redisTranslationCache.healthCheck()

      expect(isHealthy).toBe(false)
    })
  })

  describe('Cache Configuration', () => {
    it('should use environment configuration', () => {
      expect(process.env.UPSTASH_REDIS_REST_URL).toBe(
        'https://test-redis.upstash.io'
      )
      expect(process.env.UPSTASH_REDIS_REST_TOKEN).toBe('test-token')
    })

    it('should handle missing environment variables gracefully', () => {
      const originalUrl = process.env.UPSTASH_REDIS_REST_URL
      const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN

      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN

      // Should not crash when importing
      expect(() => {
        jest.resetModules()
        require('../redis-translation-cache')
      }).not.toThrow()

      process.env.UPSTASH_REDIS_REST_URL = originalUrl
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken
    })
  })

  describe('Performance', () => {
    it('should handle concurrent cache operations', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ test: 'data' }))
      mockRedisClient.set.mockResolvedValue('OK')

      const operations = Array(10)
        .fill(0)
        .map((_, i) => [
          redisTranslationCache.get(`key-${i}`),
          redisTranslationCache.set(`key-${i}`, { data: i }),
        ])
        .flat()

      const results = await Promise.allSettled(operations)

      // All operations should complete
      expect(results.every(r => r.status === 'fulfilled')).toBe(true)
    })

    it('should handle large cache entries', async () => {
      const largeData = {
        translatedText: 'A'.repeat(100000),
        metadata: Object.fromEntries(
          Array(1000)
            .fill(0)
            .map((_, i) => [`key${i}`, `value${i}`])
        ),
      }

      mockRedisClient.set.mockResolvedValue('OK')

      await redisTranslationCache.set('large-key', largeData)

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'large-key',
        JSON.stringify(largeData),
        { ex: 3600 }
      )
    })
  })

  describe('Cache Metrics', () => {
    it('should track cache hit rate', async () => {
      // Mock some hits and misses
      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify({ cached: true }))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify({ cached: true }))

      await redisTranslationCache.get('hit-key-1')
      await redisTranslationCache.get('miss-key')
      await redisTranslationCache.get('hit-key-2')

      const metrics = await redisTranslationCache.getMetrics()

      expect(metrics).toEqual({
        hits: 2,
        misses: 1,
        hitRate: 0.67,
      })
    })

    it('should reset cache metrics', async () => {
      await redisTranslationCache.resetMetrics()

      const metrics = await redisTranslationCache.getMetrics()

      expect(metrics).toEqual({
        hits: 0,
        misses: 0,
        hitRate: 0,
      })
    })
  })
})
