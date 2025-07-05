interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[]
}

export class CacheManager {
  private static instance: CacheManager
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map()
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  }

  private constructor() {
    // Start cleanup interval
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000) // Run cleanup every minute
    }
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry) {
      if (this.isExpired(memoryEntry)) {
        this.memoryCache.delete(key)
        this.cacheStats.evictions++
        this.cacheStats.misses++
        return null
      }
      this.cacheStats.hits++
      return memoryEntry.data as T
    }

    // Check localStorage for persistent cache
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(`cache:${key}`)
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored)
          if (!this.isExpired(entry)) {
            // Promote to memory cache
            this.memoryCache.set(key, entry)
            this.cacheStats.hits++
            return entry.data
          } else {
            localStorage.removeItem(`cache:${key}`)
            this.cacheStats.evictions++
          }
        }
      } catch (e) {
        console.warn('Failed to read from localStorage cache:', e)
      }
    }

    this.cacheStats.misses++
    return null
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300000 // Default 5 minutes
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags: options.tags
    }

    // Store in memory cache
    this.memoryCache.set(key, entry)
    this.cacheStats.sets++

    // Store in localStorage for persistence (if data is small enough)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const serialized = JSON.stringify(entry)
        if (serialized.length < 1024 * 1024) { // Less than 1MB
          localStorage.setItem(`cache:${key}`, serialized)
        }
      } catch (e) {
        console.warn('Failed to store in localStorage cache:', e)
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)
    this.cacheStats.deletes++

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`cache:${key}`)
    }
  }

  async invalidate(pattern?: string | RegExp): Promise<void> {
    const keysToDelete: string[] = []

    // Find matching keys
    for (const key of this.memoryCache.keys()) {
      if (!pattern || this.matchesPattern(key, pattern)) {
        keysToDelete.push(key)
      }
    }

    // Delete from memory cache
    for (const key of keysToDelete) {
      this.memoryCache.delete(key)
      this.cacheStats.deletes++
    }

    // Delete from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const localKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('cache:')) {
          const cacheKey = key.substring(6)
          if (!pattern || this.matchesPattern(cacheKey, pattern)) {
            localKeys.push(key)
          }
        }
      }

      for (const key of localKeys) {
        localStorage.removeItem(key)
      }
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = []

    // Find entries with matching tags
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && tags.some(tag => entry.tags?.includes(tag))) {
        keysToDelete.push(key)
      }
    }

    // Delete matching entries
    for (const key of keysToDelete) {
      await this.delete(key)
    }
  }

  // Cache-aside pattern helper
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await factory()
    await this.set(key, data, options)
    return data
  }

  // Memoization helper for functions
  memoize<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options: {
      keyGenerator?: (...args: TArgs) => string
      ttl?: number
      tags?: string[]
    } = {}
  ): (...args: TArgs) => Promise<TResult> {
    const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args))

    return async (...args: TArgs): Promise<TResult> => {
      const key = `memoize:${fn.name}:${keyGenerator(...args)}`
      return this.getOrSet(key, () => fn(...args), {
        ttl: options.ttl,
        tags: options.tags
      })
    }
  }

  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100
      : 0

    return {
      ...this.cacheStats,
      hitRate: hitRate.toFixed(2) + '%',
      size: this.memoryCache.size,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private matchesPattern(key: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return key.includes(pattern)
    }
    return pattern.test(key)
  }

  private cleanup(): void {
    let evicted = 0
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key)
        evicted++
      }
    }
    this.cacheStats.evictions += evicted
  }

  private estimateMemoryUsage(): string {
    // Rough estimation of memory usage
    let bytes = 0
    for (const [key, entry] of this.memoryCache.entries()) {
      bytes += key.length * 2 // Unicode chars
      bytes += JSON.stringify(entry).length * 2
    }
    
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  clear(): void {
    this.memoryCache.clear()
    
    // Clear localStorage cache
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('cache:')) {
          keysToRemove.push(key)
        }
      }
      
      for (const key of keysToRemove) {
        localStorage.removeItem(key)
      }
    }
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance()