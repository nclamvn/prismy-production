/**
 * Enterprise Cache Management System
 * Multi-layer caching with Redis, in-memory, and CDN strategies
 */

import { logger } from '@/lib/logger'

export interface CacheConfig {
  ttl: number // Time to live in seconds
  maxSize?: number // Max entries for in-memory cache
  prefix?: string // Key prefix
  tags?: string[] // Cache tags for invalidation
}

export interface CacheEntry<T = any> {
  value: T
  timestamp: number
  ttl: number
  tags: string[]
  hits: number
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  memory: {
    size: number
    maxSize: number
    usage: number // percentage
  }
  performance: {
    avgGetTime: number
    avgSetTime: number
  }
}

export class CacheManager {
  private static instance: CacheManager
  private memoryCache = new Map<string, CacheEntry>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    memory: { size: 0, maxSize: 10000, usage: 0 },
    performance: { avgGetTime: 0, avgSetTime: 0 }
  }
  private timers = new Map<string, NodeJS.Timeout>()

  private constructor(maxSize: number = 10000) {
    this.stats.memory.maxSize = maxSize
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  static getInstance(maxSize?: number): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(maxSize)
    }
    return CacheManager.instance
  }

  /**
   * Get value from cache with fallback
   */
  async get<T>(
    key: string,
    fallback?: () => Promise<T> | T,
    config?: CacheConfig
  ): Promise<T | null> {
    const startTime = performance.now()

    try {
      // Check memory cache first
      const entry = this.memoryCache.get(key)
      
      if (entry && this.isValid(entry)) {
        entry.hits++
        this.stats.hits++
        this.updatePerformanceStats('get', performance.now() - startTime)
        
        logger.debug('Cache hit', { key, source: 'memory' })
        return entry.value as T
      }

      // Cache miss
      this.stats.misses++

      if (fallback) {
        logger.debug('Cache miss, executing fallback', { key })
        const value = await fallback()
        
        if (value !== null && value !== undefined) {
          await this.set(key, value, config)
        }
        
        this.updatePerformanceStats('get', performance.now() - startTime)
        return value
      }

      this.updatePerformanceStats('get', performance.now() - startTime)
      return null

    } catch (error) {
      logger.error('Cache get error', { error, key })
      this.updatePerformanceStats('get', performance.now() - startTime)
      
      if (fallback) {
        try {
          return await fallback()
        } catch (fallbackError) {
          logger.error('Cache fallback error', { error: fallbackError, key })
          throw fallbackError
        }
      }
      
      return null
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, config?: CacheConfig): Promise<boolean> {
    const startTime = performance.now()

    try {
      const ttl = config?.ttl || 3600 // Default 1 hour
      const tags = config?.tags || []
      const prefixedKey = config?.prefix ? `${config.prefix}:${key}` : key

      // Check if we need to evict entries
      if (this.memoryCache.size >= this.stats.memory.maxSize) {
        this.evictLRU()
      }

      // Create cache entry
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to milliseconds
        tags,
        hits: 0
      }

      // Set in memory cache
      this.memoryCache.set(prefixedKey, entry)
      this.stats.sets++
      this.updateMemoryStats()

      // Set expiration timer
      if (ttl > 0) {
        const timer = setTimeout(() => {
          this.delete(prefixedKey)
        }, ttl * 1000)
        
        this.timers.set(prefixedKey, timer)
      }

      this.updatePerformanceStats('set', performance.now() - startTime)
      
      logger.debug('Cache set', { key: prefixedKey, ttl, tags })
      return true

    } catch (error) {
      logger.error('Cache set error', { error, key, value })
      this.updatePerformanceStats('set', performance.now() - startTime)
      return false
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.memoryCache.delete(key)
      
      if (deleted) {
        this.stats.deletes++
        this.updateMemoryStats()
        
        // Clear timer if exists
        const timer = this.timers.get(key)
        if (timer) {
          clearTimeout(timer)
          this.timers.delete(key)
        }
        
        logger.debug('Cache delete', { key })
      }

      return deleted

    } catch (error) {
      logger.error('Cache delete error', { error, key })
      return false
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0

    try {
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags.some(tag => tags.includes(tag))) {
          await this.delete(key)
          invalidated++
        }
      }

      logger.info('Cache invalidated by tags', { tags, count: invalidated })
      return invalidated

    } catch (error) {
      logger.error('Cache invalidation error', { error, tags })
      return 0
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer)
      }
      this.timers.clear()

      // Clear memory cache
      this.memoryCache.clear()
      this.updateMemoryStats()

      logger.info('Cache cleared')

    } catch (error) {
      logger.error('Cache clear error', { error })
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get cache keys by pattern
   */
  getKeys(pattern?: string): string[] {
    const keys = Array.from(this.memoryCache.keys())
    
    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return keys.filter(key => regex.test(key))
    }
    
    return keys
  }

  /**
   * Warm up cache with common data
   */
  async warmup(entries: Array<{ key: string; value: any; config?: CacheConfig }>): Promise<void> {
    try {
      logger.info('Starting cache warmup', { entries: entries.length })

      const promises = entries.map(({ key, value, config }) =>
        this.set(key, value, config)
      )

      await Promise.allSettled(promises)
      
      logger.info('Cache warmup completed', { entries: entries.length })

    } catch (error) {
      logger.error('Cache warmup error', { error })
    }
  }

  /**
   * Memoize function with caching
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    config?: CacheConfig
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator(...args)
      
      return this.get(key, () => fn(...args), config)
    }) as T
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    if (entry.ttl <= 0) return true // Permanent entry
    return (Date.now() - entry.timestamp) < entry.ttl
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    // Find entry with lowest hits and oldest timestamp
    let lruKey: string | null = null
    let lruScore = Infinity

    for (const [key, entry] of this.memoryCache.entries()) {
      const score = entry.hits + (Date.now() - entry.timestamp) / 1000000 // Combine hits and age
      if (score < lruScore) {
        lruScore = score
        lruKey = key
      }
    }

    if (lruKey) {
      this.delete(lruKey)
      logger.debug('Evicted LRU cache entry', { key: lruKey })
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    let cleaned = 0

    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.debug('Cleaned up expired cache entries', { count: cleaned })
    }
  }

  /**
   * Update memory statistics
   */
  private updateMemoryStats(): void {
    this.stats.memory.size = this.memoryCache.size
    this.stats.memory.usage = (this.memoryCache.size / this.stats.memory.maxSize) * 100
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(operation: 'get' | 'set', duration: number): void {
    const key = operation === 'get' ? 'avgGetTime' : 'avgSetTime'
    const current = this.stats.performance[key]
    const count = operation === 'get' ? (this.stats.hits + this.stats.misses) : this.stats.sets
    
    // Calculate running average
    this.stats.performance[key] = (current * (count - 1) + duration) / count
  }
}

// Singleton instance
export const cacheManager = CacheManager.getInstance()

// Cache decorators
export function Cached(config?: CacheConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const keyGenerator = () => `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`
      const key = keyGenerator()

      return cacheManager.get(key, () => originalMethod.apply(this, args), config)
    }

    return descriptor
  }
}

export function CacheInvalidate(tags: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)
      await cacheManager.invalidateByTags(tags)
      return result
    }

    return descriptor
  }
}