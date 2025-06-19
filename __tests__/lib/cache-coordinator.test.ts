import { CacheCoordinator } from '@/lib/cache/cache-coordinator'

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  mget: jest.fn(),
  mset: jest.fn(),
  keys: jest.fn(),
  ping: jest.fn(),
  flushall: jest.fn()
}

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => mockRedis)
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  cacheLogger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

describe('CacheCoordinator', () => {
  let cacheCoordinator: CacheCoordinator
  
  beforeEach(() => {
    jest.clearAllMocks()
    cacheCoordinator = new CacheCoordinator()
    
    // Reset memory cache
    cacheCoordinator['memoryCache'].clear()
  })

  describe('Basic Operations', () => {
    it('should set and get from memory cache', async () => {
      await cacheCoordinator.set('test-key', 'test-value', 300)
      const result = await cacheCoordinator.get('test-key')
      
      expect(result).toBe('test-value')
    })

    it('should handle cache expiration', async () => {
      await cacheCoordinator.set('expiring-key', 'value', 0.1) // 100ms TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const result = await cacheCoordinator.get('expiring-key')
      expect(result).toBeNull()
    })

    it('should fall back to Redis when memory cache misses', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'redis-value', exp: Date.now() + 10000 }))
      
      const result = await cacheCoordinator.get('redis-key')
      
      expect(mockRedis.get).toHaveBeenCalledWith('redis-key')
      expect(result).toBe('redis-value')
    })

    it('should store in both memory and Redis on set', async () => {
      mockRedis.set.mockResolvedValue('OK')
      
      await cacheCoordinator.set('dual-key', 'dual-value', 600)
      
      expect(mockRedis.set).toHaveBeenCalled()
      
      // Should also be in memory
      const memoryResult = await cacheCoordinator.get('dual-key')
      expect(memoryResult).toBe('dual-value')
    })
  })

  describe('Memory Cache Management', () => {
    it('should evict least recently used items when memory is full', async () => {
      // Set memory limit low for testing
      cacheCoordinator['config'].memoryMaxSize = 3
      
      await cacheCoordinator.set('key1', 'value1', 300)
      await cacheCoordinator.set('key2', 'value2', 300)
      await cacheCoordinator.set('key3', 'value3', 300)
      
      // Access key1 to make it recently used
      await cacheCoordinator.get('key1')
      
      // Add key4, should evict key2 (least recently used)
      await cacheCoordinator.set('key4', 'value4', 300)
      
      expect(await cacheCoordinator.get('key1')).toBe('value1') // Recently used
      expect(await cacheCoordinator.get('key3')).toBe('value3') // Newer
      expect(await cacheCoordinator.get('key4')).toBe('value4') // Newest
      
      // key2 should be evicted from memory (but might still be in Redis)
      const memoryCache = cacheCoordinator['memoryCache']
      expect(memoryCache.has('key2')).toBe(false)
    })

    it('should track access patterns for LRU eviction', async () => {
      await cacheCoordinator.set('track1', 'value1', 300)
      await cacheCoordinator.set('track2', 'value2', 300)
      
      // Access track1 multiple times
      await cacheCoordinator.get('track1')
      await cacheCoordinator.get('track1')
      await cacheCoordinator.get('track2')
      
      const stats = cacheCoordinator.getStats()
      expect(stats.memorySize).toBe(2)
    })
  })

  describe('Batch Operations', () => {
    it('should handle mget operations', async () => {
      await cacheCoordinator.set('batch1', 'value1', 300)
      await cacheCoordinator.set('batch2', 'value2', 300)
      
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'redis-value3', exp: Date.now() + 10000 }))
      
      const results = await cacheCoordinator.mget(['batch1', 'batch2', 'batch3'])
      
      expect(results.get('batch1')).toBe('value1')
      expect(results.get('batch2')).toBe('value2')
      expect(results.get('batch3')).toBe('redis-value3')
    })

    it('should handle mset operations', async () => {
      mockRedis.set.mockResolvedValue('OK')
      
      const entries = [
        { key: 'mset1', data: 'value1', ttl: 300 },
        { key: 'mset2', data: 'value2', ttl: 600 }
      ]
      
      await cacheCoordinator.mset(entries)
      
      expect(await cacheCoordinator.get('mset1')).toBe('value1')
      expect(await cacheCoordinator.get('mset2')).toBe('value2')
    })
  })

  describe('Invalidation', () => {
    it('should invalidate single keys', async () => {
      await cacheCoordinator.set('invalid-key', 'value', 300)
      expect(await cacheCoordinator.get('invalid-key')).toBe('value')
      
      mockRedis.del.mockResolvedValue(1)
      await cacheCoordinator.invalidate('invalid-key')
      
      expect(await cacheCoordinator.get('invalid-key')).toBeNull()
      expect(mockRedis.del).toHaveBeenCalledWith('invalid-key')
    })

    it('should invalidate by pattern', async () => {
      await cacheCoordinator.set('pattern:key1', 'value1', 300)
      await cacheCoordinator.set('pattern:key2', 'value2', 300)
      await cacheCoordinator.set('other:key', 'value3', 300)
      
      mockRedis.keys.mockResolvedValue(['pattern:key1', 'pattern:key2'])
      mockRedis.del.mockResolvedValue(2)
      
      const invalidated = await cacheCoordinator.invalidate('pattern:*')
      
      expect(invalidated).toBe(2)
      expect(mockRedis.keys).toHaveBeenCalledWith('pattern:*')
      expect(await cacheCoordinator.get('pattern:key1')).toBeNull()
      expect(await cacheCoordinator.get('other:key')).toBe('value3')
    })

    it('should handle tags for cache invalidation', async () => {
      await cacheCoordinator.set('tagged-key1', 'value1', 300, ['user:123', 'translation'])
      await cacheCoordinator.set('tagged-key2', 'value2', 300, ['user:123', 'document'])
      await cacheCoordinator.set('tagged-key3', 'value3', 300, ['user:456', 'translation'])
      
      // Mock Redis operations for tag-based invalidation
      mockRedis.keys.mockResolvedValue(['tagged-key1', 'tagged-key2'])
      mockRedis.del.mockResolvedValue(2)
      
      const invalidated = await cacheCoordinator.invalidateByTags(['user:123'])
      
      expect(invalidated).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle Redis connection failures gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'))
      
      // Should still work with memory cache
      await cacheCoordinator.set('memory-only', 'value', 300)
      const result = await cacheCoordinator.get('memory-only')
      
      expect(result).toBe('value')
    })

    it('should continue working when Redis is unavailable', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis unavailable'))
      mockRedis.get.mockRejectedValue(new Error('Redis unavailable'))
      
      await cacheCoordinator.set('fallback-key', 'fallback-value', 300)
      const result = await cacheCoordinator.get('fallback-key')
      
      expect(result).toBe('fallback-value')
    })
  })

  describe('Health Status', () => {
    it('should report healthy status when all systems work', async () => {
      mockRedis.ping.mockResolvedValue('PONG')
      
      const health = cacheCoordinator.getHealthStatus()
      
      expect(health.healthy).toBe(true)
      expect(health.layers.memory).toBe(true)
    })

    it('should report unhealthy status when Redis fails', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Redis down'))
      
      // Wait for health check
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const health = cacheCoordinator.getHealthStatus()
      
      expect(health.layers.redis).toBe(false)
    })
  })

  describe('Statistics', () => {
    it('should track hit and miss rates', async () => {
      // Cache hits
      await cacheCoordinator.set('stats-key', 'value', 300)
      await cacheCoordinator.get('stats-key') // hit
      await cacheCoordinator.get('stats-key') // hit
      
      // Cache miss
      await cacheCoordinator.get('nonexistent-key') // miss
      
      const stats = cacheCoordinator.getStats()
      
      expect(stats.hits).toBeGreaterThan(0)
      expect(stats.misses).toBeGreaterThan(0)
      expect(stats.hitRate).toBeGreaterThan(0)
    })

    it('should track memory usage', async () => {
      await cacheCoordinator.set('size-test1', 'value1', 300)
      await cacheCoordinator.set('size-test2', 'value2', 300)
      
      const stats = cacheCoordinator.getStats()
      
      expect(stats.memorySize).toBe(2)
      expect(stats.totalKeys).toBeGreaterThanOrEqual(2)
    })
  })
})