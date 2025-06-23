// Server and client-side caching utilities

/* ============================================================================ */
/* PRISMY HIGH-PERFORMANCE CACHING SYSTEM */
/* Advanced Response Caching with Intelligent Invalidation */
/* ============================================================================ */

import { createHash } from 'crypto'

// Cache configuration
export const CACHE_CONFIG = {
  // Default TTL values (in seconds)
  DEFAULT_TTL: 300, // 5 minutes
  TRANSLATION_TTL: 3600, // 1 hour
  USER_PROFILE_TTL: 600, // 10 minutes
  ANALYTICS_TTL: 180, // 3 minutes
  PRICING_TTL: 1800, // 30 minutes

  // Cache sizes
  MAX_MEMORY_CACHE_SIZE: 1000,
  MAX_KEY_LENGTH: 250,

  // Performance settings
  BATCH_SIZE: 50,
  COMPRESSION_THRESHOLD: 1024, // Compress responses > 1KB
} as const

// Cache entry interface
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  compressed?: boolean
  hits: number
  size: number
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
  memory: number
}

/* ============================================================================ */
/* IN-MEMORY CACHE WITH LRU EVICTION */
/* ============================================================================ */

class HighPerformanceCache {
  private cache = new Map<string, CacheEntry>()
  private accessOrder = new Map<string, number>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    memory: 0,
  }
  private accessCounter = 0

  // Generate cache key from request parameters
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key]
          return result
        },
        {} as Record<string, any>
      )

    const paramString = JSON.stringify(sortedParams)
    const hash = createHash('md5').update(paramString).digest('hex')
    const key = `${prefix}:${hash}`

    return key.length > CACHE_CONFIG.MAX_KEY_LENGTH
      ? key.substring(0, CACHE_CONFIG.MAX_KEY_LENGTH)
      : key
  }

  // Compress large responses
  private compress(data: any): string {
    const jsonString = JSON.stringify(data)
    if (jsonString.length > CACHE_CONFIG.COMPRESSION_THRESHOLD) {
      // Simple compression - in production, use proper compression library
      return btoa(jsonString)
    }
    return jsonString
  }

  // Decompress responses
  private decompress(data: string, compressed: boolean): any {
    if (compressed) {
      return JSON.parse(atob(data))
    }
    return JSON.parse(data)
  }

  // Get from cache with performance tracking
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check TTL
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.delete(key)
      this.stats.misses++
      return null
    }

    // Update access tracking
    entry.hits++
    this.accessOrder.set(key, ++this.accessCounter)
    this.stats.hits++

    // Decompress if needed
    const data =
      typeof entry.data === 'string' && entry.compressed
        ? this.decompress(entry.data, true)
        : entry.data

    return data as T
  }

  // Set cache entry with intelligent compression
  set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): void {
    // Check cache size and evict if necessary
    if (this.cache.size >= CACHE_CONFIG.MAX_MEMORY_CACHE_SIZE) {
      this.evictLRU()
    }

    const jsonString = JSON.stringify(data)
    const shouldCompress =
      jsonString.length > CACHE_CONFIG.COMPRESSION_THRESHOLD
    const compressedData = shouldCompress ? this.compress(data) : jsonString

    const entry: CacheEntry<any> = {
      data: shouldCompress ? compressedData : data,
      timestamp: Date.now(),
      ttl,
      compressed: shouldCompress,
      hits: 0,
      size: jsonString.length,
    }

    this.cache.set(key, entry)
    this.accessOrder.set(key, ++this.accessCounter)
    this.stats.sets++
    this.stats.size++
    this.stats.memory += entry.size
  }

  // Delete cache entry
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.stats.memory -= entry.size
      this.stats.size--
      this.stats.deletes++
    }

    this.accessOrder.delete(key)
    return this.cache.delete(key)
  }

  // LRU eviction strategy
  private evictLRU(): void {
    let oldestKey = ''
    let oldestAccess = Infinity

    for (const [key, access] of this.accessOrder.entries()) {
      if (access < oldestAccess) {
        oldestAccess = access
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  // Clear expired entries
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.delete(key)
        cleaned++
      }
    }

    return cleaned
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      memory: 0,
    }
    this.accessCounter = 0
  }

  // Get cache hit ratio
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? this.stats.hits / total : 0
  }
}

/* ============================================================================ */
/* GLOBAL CACHE INSTANCE */
/* ============================================================================ */

export const cache = new HighPerformanceCache()

/* ============================================================================ */
/* CACHE DECORATORS AND UTILITIES */
/* ============================================================================ */

// Cache wrapper for API functions
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    prefix: string
    ttl?: number
    keyGenerator?: (...args: Parameters<T>) => Record<string, any>
  }
): T {
  return (async (...args: Parameters<T>) => {
    const keyParams = options.keyGenerator
      ? options.keyGenerator(...args)
      : { args: args.map(arg => JSON.stringify(arg)) }

    const cacheKey = cache.generateKey(options.prefix, keyParams)

    // Try to get from cache first
    const cached = cache.get(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    try {
      const result = await fn(...args)
      cache.set(cacheKey, result, options.ttl || CACHE_CONFIG.DEFAULT_TTL)
      return result
    } catch (error) {
      // Don't cache errors
      throw error
    }
  }) as T
}

// Cache warming utility
export async function warmCache(
  keys: Array<{
    prefix: string
    params: Record<string, any>
    fetcher: () => Promise<any>
  }>,
  options: { batchSize?: number; ttl?: number } = {}
): Promise<number> {
  const batchSize = options.batchSize || CACHE_CONFIG.BATCH_SIZE
  let warmed = 0

  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async ({ prefix, params, fetcher }) => {
        const key = cache.generateKey(prefix, params)

        // Only warm if not already cached
        if (cache.get(key) === null) {
          try {
            const data = await fetcher()
            cache.set(key, data, options.ttl || CACHE_CONFIG.DEFAULT_TTL)
            warmed++
          } catch (error) {
            console.warn(`Cache warming failed for key ${key}:`, error)
          }
        }
      })
    )
  }

  return warmed
}

// Cache invalidation patterns
export function invalidatePattern(pattern: string): number {
  let invalidated = 0
  const regex = new RegExp(pattern)

  for (const key of cache['cache'].keys()) {
    if (regex.test(key)) {
      cache.delete(key)
      invalidated++
    }
  }

  return invalidated
}

// Auto cleanup interval (run every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleaned = cache.cleanup()
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`)
    }
  }, 300000)
}

/* ============================================================================ */
/* CACHE MIDDLEWARE FOR API ROUTES */
/* ============================================================================ */

export function cacheMiddleware(options: {
  ttl?: number
  prefix: string
  keyGenerator?: (req: Request) => Record<string, any>
}) {
  return function (handler: (req: Request) => Promise<Response>) {
    return async function (req: Request): Promise<Response> {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return handler(req)
      }

      // Generate cache key
      const url = new URL(req.url)
      const keyParams = options.keyGenerator
        ? options.keyGenerator(req)
        : {
            pathname: url.pathname,
            search: url.search,
            headers: Object.fromEntries(req.headers.entries()),
          }

      const cacheKey = cache.generateKey(options.prefix, keyParams)

      // Try cache first
      const cached = cache.get<{
        body: any
        headers: Record<string, string>
        status: number
      }>(cacheKey)
      if (cached) {
        return new Response(JSON.stringify(cached.body), {
          status: cached.status,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey.substring(0, 16) + '...',
          },
        })
      }

      // Execute handler
      const response = await handler(req)

      // Cache successful responses
      if (response.ok) {
        const body = await response.json()
        const cacheData = {
          body,
          headers: Object.fromEntries(response.headers.entries()),
          status: response.status,
        }

        cache.set(cacheKey, cacheData, options.ttl || CACHE_CONFIG.DEFAULT_TTL)

        return new Response(JSON.stringify(body), {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey.substring(0, 16) + '...',
          },
        })
      }

      return response
    }
  }
}

export default cache
