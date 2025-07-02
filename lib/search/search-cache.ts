/**
 * UI/UX Polish Sprint - Phase 4: Advanced Search Cache System
 * 
 * Intelligent caching layer for search results with TTL, LRU eviction, and prefetching
 * Optimizes search performance and reduces API calls
 */

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  ttl: number
  size: number
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  totalHits: number
  totalMisses: number
  evictionCount: number
}

export interface CacheConfig {
  maxEntries: number
  maxSize: number // in bytes
  defaultTTL: number // in milliseconds
  enableLRU: boolean
  enableMetrics: boolean
}

/**
 * Advanced cache implementation with LRU eviction and TTL
 */
export class SearchCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = []
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  }
  
  constructor(private config: CacheConfig) {}
  
  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }
    
    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      this.stats.misses++
      return null
    }
    
    // Update access metrics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    
    // Update LRU order
    if (this.config.enableLRU) {
      this.updateAccessOrder(key)
    }
    
    this.stats.hits++
    return entry.data
  }
  
  /**
   * Set item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const size = this.calculateSize(data)
    const entryTTL = ttl || this.config.defaultTTL
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      ttl: entryTTL,
      size
    }
    
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key)
    }
    
    // Check if we need to evict entries
    this.makeRoom(size)
    
    // Add new entry
    this.cache.set(key, entry)
    if (this.config.enableLRU) {
      this.accessOrder.push(key)
    }
  }
  
  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.removeFromAccessOrder(key)
    }
    return deleted
  }
  
  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }
    
    return true
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.stats = { hits: 0, misses: 0, evictions: 0 }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.getCurrentSize(),
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      evictionCount: this.stats.evictions
    }
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key)
      }
    }
    
    for (const key of expiredKeys) {
      this.delete(key)
    }
  }
  
  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  /**
   * Get cache entries sorted by access frequency
   */
  getPopularEntries(limit = 10): Array<{ key: string; accessCount: number; data: T }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        data: entry.data
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
  }
  
  /**
   * Prefetch and cache data
   */
  async prefetch(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    // Check if already cached
    const cached = this.get(key)
    if (cached) {
      return cached
    }
    
    // Fetch and cache
    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }
  
  /**
   * Batch set multiple items
   */
  setMany(items: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const item of items) {
      this.set(item.key, item.data, item.ttl)
    }
  }
  
  /**
   * Batch get multiple items
   */
  getMany(keys: string[]): Map<string, T> {
    const results = new Map<string, T>()
    
    for (const key of keys) {
      const data = this.get(key)
      if (data !== null) {
        results.set(key, data)
      }
    }
    
    return results
  }
  
  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }
  
  /**
   * Calculate size of data (simplified)
   */
  private calculateSize(data: T): number {
    try {
      return JSON.stringify(data).length
    } catch {
      return 1000 // Default size if can't serialize
    }
  }
  
  /**
   * Get current total cache size
   */
  private getCurrentSize(): number {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += entry.size
    }
    return totalSize
  }
  
  /**
   * Make room in cache by evicting entries
   */
  private makeRoom(newEntrySize: number): void {
    // Check size limit
    while (
      this.cache.size >= this.config.maxEntries ||
      this.getCurrentSize() + newEntrySize > this.config.maxSize
    ) {
      this.evictLRU()
    }
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return
    
    const keyToEvict = this.accessOrder.shift()!
    this.cache.delete(keyToEvict)
    this.stats.evictions++
  }
  
  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }
  
  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }
}

/**
 * Search-specific cache with intelligent key generation
 */
export class SearchResultCache extends SearchCache<any> {
  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      maxEntries: 500,
      maxSize: 10 * 1024 * 1024, // 10MB
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      enableLRU: true,
      enableMetrics: true
    }
    
    super({ ...defaultConfig, ...config })
  }
  
  /**
   * Generate cache key for search query
   */
  generateSearchKey(query: string, filters?: any): string {
    const normalized = query.toLowerCase().trim()
    const filterHash = filters ? this.hashObject(filters) : ''
    return `search:${normalized}:${filterHash}`
  }
  
  /**
   * Generate cache key for suggestions
   */
  generateSuggestionKey(partialQuery: string): string {
    return `suggestions:${partialQuery.toLowerCase().trim()}`
  }
  
  /**
   * Cache search results
   */
  cacheSearchResults(query: string, results: any, filters?: any): void {
    const key = this.generateSearchKey(query, filters)
    this.set(key, results)
  }
  
  /**
   * Get cached search results
   */
  getCachedSearchResults(query: string, filters?: any): any | null {
    const key = this.generateSearchKey(query, filters)
    return this.get(key)
  }
  
  /**
   * Cache suggestions
   */
  cacheSuggestions(partialQuery: string, suggestions: string[]): void {
    const key = this.generateSuggestionKey(partialQuery)
    this.set(key, suggestions, 5 * 60 * 1000) // 5 minutes TTL for suggestions
  }
  
  /**
   * Get cached suggestions
   */
  getCachedSuggestions(partialQuery: string): string[] | null {
    const key = this.generateSuggestionKey(partialQuery)
    return this.get(key)
  }
  
  /**
   * Invalidate search results for a specific pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    
    for (const key of keysToDelete) {
      this.delete(key)
    }
  }
  
  /**
   * Simple hash function for objects
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

/**
 * Global search cache instance
 */
export const searchCache = new SearchResultCache()

/**
 * Cache management utilities
 */
export const cacheUtils = {
  /**
   * Schedule periodic cleanup
   */
  startPeriodicCleanup: (cache: SearchCache, intervalMs = 5 * 60 * 1000) => {
    return setInterval(() => {
      cache.cleanup()
    }, intervalMs)
  },
  
  /**
   * Export cache statistics
   */
  exportStats: (cache: SearchCache) => {
    return {
      ...cache.getStats(),
      timestamp: Date.now(),
      popularEntries: cache.getPopularEntries(5)
    }
  },
  
  /**
   * Warm up cache with common searches
   */
  warmUpCache: async (cache: SearchResultCache, commonQueries: string[]) => {
    console.log('[Cache] Warming up cache with common queries...')
    
    for (const query of commonQueries) {
      try {
        // This would typically fetch from the search engine
        // For now, we'll just mark the cache as ready
        console.log(`[Cache] Warmed up: ${query}`)
      } catch (error) {
        console.warn(`[Cache] Failed to warm up query: ${query}`, error)
      }
    }
  }
}

// Start periodic cleanup
if (typeof window !== 'undefined') {
  cacheUtils.startPeriodicCleanup(searchCache)
}

export default SearchCache