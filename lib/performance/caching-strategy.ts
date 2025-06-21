/**
 * Enhanced Caching Strategy for Performance Optimization
 * Implements intelligent caching with TTL, LRU, and invalidation
 */

import { logger } from '@/lib/logger'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface CacheConfig {
  maxSize: number
  defaultTTL: number
  enableMetrics: boolean
}

export class PerformanceCache<T> {
  private cache = new Map<string, CacheItem<T>>()
  private config: CacheConfig
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      enableMetrics: true,
      ...config
    }
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const itemTTL = ttl || this.config.defaultTTL

    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: itemTTL,
      accessCount: 0,
      lastAccessed: now
    })

    this.updateMetrics()
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.metrics.misses++
      return null
    }

    const now = Date.now()
    
    // Check if expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.metrics.misses++
      this.updateMetrics()
      return null
    }

    // Update access info
    item.accessCount++
    item.lastAccessed = now
    this.cache.set(key, item)
    
    this.metrics.hits++
    return item.data
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.updateMetrics()
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.updateMetrics()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.updateMetrics()
      return false
    }

    return true
  }

  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.metrics.evictions++
    }
  }

  private updateMetrics(): void {
    this.metrics.size = this.cache.size
    
    if (this.config.enableMetrics && process.env.NODE_ENV === 'development') {
      logger.debug('Cache metrics', this.metrics)
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0
    }
  }

  // Intelligent prefetching
  prefetch(keys: string[], loader: (key: string) => Promise<T>): void {
    keys.forEach(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await loader(key)
          this.set(key, data)
        } catch (error) {
          logger.warn('Prefetch failed', { key, error })
        }
      }
    })
  }
}

// Specialized caches for different data types
export const translationCache = new PerformanceCache<any>({
  maxSize: 500,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
})

export const documentCache = new PerformanceCache<any>({
  maxSize: 100,
  defaultTTL: 60 * 60 * 1000, // 1 hour
})

export const userProfileCache = new PerformanceCache<any>({
  maxSize: 1000,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
})

export const apiResponseCache = new PerformanceCache<any>({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
})

// Cache invalidation patterns
export const invalidatePatterns = {
  user: (userId: string) => {
    userProfileCache.delete(`user:${userId}`)
    translationCache.delete(`user:${userId}:translations`)
  },
  
  translation: (userId: string, textHash: string) => {
    translationCache.delete(`translation:${userId}:${textHash}`)
  },
  
  document: (documentId: string) => {
    documentCache.delete(`document:${documentId}`)
    documentCache.delete(`document:${documentId}:analysis`)
  }
}

// Bulk operations
export const bulkInvalidate = (pattern: string) => {
  const caches = [translationCache, documentCache, userProfileCache, apiResponseCache]
  
  caches.forEach(cache => {
    const keysToDelete: string[] = []
    
    // Get all keys (this is a simplified approach - in production use a more efficient method)
    for (const key of (cache as any).cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => cache.delete(key))
  })
}

// Browser storage fallback
export const persistentCache = {
  set: (key: string, data: any, ttl: number = 24 * 60 * 60 * 1000) => {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(`prismy_cache_${key}`, JSON.stringify(item))
    } catch (error) {
      logger.warn('LocalStorage cache set failed', { key, error })
    }
  },

  get: (key: string) => {
    try {
      const item = localStorage.getItem(`prismy_cache_${key}`)
      if (!item) return null

      const parsed = JSON.parse(item)
      const now = Date.now()

      if (now - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(`prismy_cache_${key}`)
        return null
      }

      return parsed.data
    } catch (error) {
      logger.warn('LocalStorage cache get failed', { key, error })
      return null
    }
  },

  delete: (key: string) => {
    try {
      localStorage.removeItem(`prismy_cache_${key}`)
    } catch (error) {
      logger.warn('LocalStorage cache delete failed', { key, error })
    }
  }
}

// Service worker cache coordination
export const swCache = {
  async invalidateRoute(route: string) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'INVALIDATE_CACHE',
        route
      })
    }
  },

  async preloadRoutes(routes: string[]) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PRELOAD_ROUTES',
        routes
      })
    }
  }
}