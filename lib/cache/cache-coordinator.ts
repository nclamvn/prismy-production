import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'
import { performance } from 'perf_hooks'

// Cache Layer Types
export type CacheLayer = 'memory' | 'redis' | 'edge' | 'database'
export type CacheStrategy = 'write-through' | 'write-behind' | 'cache-aside' | 'refresh-ahead'

// Cache Configuration
interface CacheConfig {
  enableCompression: boolean
  maxMemorySize: number // MB
  defaultTTL: number // seconds
  strategy: CacheStrategy
  layers: CacheLayer[]
  replicationFactor: number
}

// Cache Entry Metadata
interface CacheEntry<T = any> {
  data: T
  metadata: {
    key: string
    size: number
    ttl: number
    createdAt: number
    lastAccessed: number
    hitCount: number
    layer: CacheLayer
    compressed: boolean
    version: string
    tags: string[]
  }
}

// Cache Statistics
interface CacheStats {
  layer: CacheLayer
  hits: number
  misses: number
  hitRate: number
  totalSize: number
  entryCount: number
  evictions: number
  avgResponseTime: number
  lastUpdated: number
}

// Distributed Cache Coordinator
export class DistributedCacheCoordinator {
  private redis: Redis
  private memoryCache = new Map<string, CacheEntry>()
  private config: CacheConfig
  private stats = new Map<CacheLayer, CacheStats>()
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
    
    this.config = {
      enableCompression: true,
      maxMemorySize: 100, // 100MB
      defaultTTL: 3600,
      strategy: 'cache-aside',
      layers: ['memory', 'redis'],
      replicationFactor: 2,
      ...config
    }
    
    this.initializeStats()
    this.setupCleanupSchedule()
  }

  private initializeStats() {
    this.config.layers.forEach(layer => {
      this.stats.set(layer, {
        layer,
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0,
        evictions: 0,
        avgResponseTime: 0,
        lastUpdated: Date.now()
      })
    })
  }

  // Multi-layer cache retrieval with fallback
  async get<T>(key: string, tags: string[] = []): Promise<T | null> {
    const startTime = performance.now()
    
    // Try each layer in order
    for (const layer of this.config.layers) {
      try {
        const result = await this.getFromLayer<T>(key, layer)
        if (result !== null) {
          this.recordHit(layer, performance.now() - startTime)
          
          // Promote to higher layers (cache warming)
          await this.promoteToHigherLayers(key, result, layer, tags)
          
          return result.data
        }
      } catch (error) {
        console.warn(`Cache layer ${layer} failed for key ${key}:`, error)
        continue
      }
    }
    
    this.recordMiss('memory')
    return null
  }

  // Multi-layer cache storage with replication
  async set<T>(
    key: string, 
    data: T, 
    ttl: number = this.config.defaultTTL,
    tags: string[] = []
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      metadata: {
        key,
        size: this.calculateSize(data),
        ttl,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        hitCount: 0,
        layer: 'memory',
        compressed: false,
        version: this.generateVersion(),
        tags
      }
    }

    // Compress if enabled and data is large enough
    if (this.config.enableCompression && entry.metadata.size > 1024) {
      entry.data = await this.compress(data) as T
      entry.metadata.compressed = true
    }

    // Store in all configured layers
    const promises = this.config.layers.map(async layer => {
      try {
        await this.setInLayer(key, entry, layer, ttl)
        this.updateStats(layer, 'set', entry.metadata.size)
      } catch (error) {
        console.error(`Failed to set in ${layer} layer:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  // Intelligent cache invalidation
  async invalidate(pattern: string | string[], tags?: string[]): Promise<number> {
    let invalidatedCount = 0

    if (tags && tags.length > 0) {
      // Tag-based invalidation
      invalidatedCount = await this.invalidateByTags(tags)
    } else {
      // Pattern-based invalidation
      const patterns = Array.isArray(pattern) ? pattern : [pattern]
      for (const pat of patterns) {
        invalidatedCount += await this.invalidateByPattern(pat)
      }
    }

    return invalidatedCount
  }

  // Bulk operations for performance
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()
    
    // Batch requests by layer for efficiency
    const chunks = this.chunkArray(keys, 50) // Process in chunks of 50
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async key => {
          const value = await this.get<T>(key)
          return { key, value }
        })
      )
      
      chunkResults.forEach(({ key, value }) => {
        results.set(key, value)
      })
    }

    return results
  }

  async mset<T>(entries: Array<{ key: string; data: T; ttl?: number; tags?: string[] }>): Promise<void> {
    const chunks = this.chunkArray(entries, 20)
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(({ key, data, ttl, tags }) => 
          this.set(key, data, ttl, tags)
        )
      )
    }
  }

  // Cache warming for predictive loading
  async warmCache(patterns: string[], data: any[]): Promise<void> {
    if (patterns.length !== data.length) {
      throw new Error('Patterns and data arrays must have the same length')
    }

    const warmingPromises = patterns.map(async (pattern, index) => {
      const key = this.generateWarmingKey(pattern)
      await this.set(key, data[index], this.config.defaultTTL * 2, ['warmed'])
    })

    await Promise.allSettled(warmingPromises)
    console.log(`🔥 Cache warmed with ${patterns.length} entries`)
  }

  // Health monitoring and diagnostics
  getHealthStatus(): { healthy: boolean; details: any } {
    const layerHealth = this.config.layers.map(layer => {
      const stats = this.stats.get(layer)!
      return {
        layer,
        healthy: stats.hitRate > 0.5 || stats.entryCount === 0,
        hitRate: stats.hitRate,
        avgResponseTime: stats.avgResponseTime,
        entryCount: stats.entryCount
      }
    })

    const overallHealthy = layerHealth.every(l => l.healthy)

    return {
      healthy: overallHealthy,
      details: {
        layers: layerHealth,
        memoryUsage: this.getMemoryUsage(),
        config: this.config,
        uptime: Date.now() - (this.stats.get('memory')?.lastUpdated || Date.now())
      }
    }
  }

  // Performance analytics
  getAnalytics(): Map<CacheLayer, CacheStats> {
    // Update hit rates
    this.stats.forEach(stats => {
      const total = stats.hits + stats.misses
      stats.hitRate = total > 0 ? stats.hits / total : 0
      stats.lastUpdated = Date.now()
    })

    return new Map(this.stats)
  }

  // Private helper methods
  private async getFromLayer<T>(key: string, layer: CacheLayer): Promise<CacheEntry<T> | null> {
    switch (layer) {
      case 'memory':
        const memEntry = this.memoryCache.get(key)
        if (memEntry && !this.isExpired(memEntry)) {
          memEntry.metadata.lastAccessed = Date.now()
          memEntry.metadata.hitCount++
          return memEntry as CacheEntry<T>
        }
        return null

      case 'redis':
        try {
          const redisData = await this.redis.get(key)
          if (redisData) {
            const entry = JSON.parse(redisData as string) as CacheEntry<T>
            if (!this.isExpired(entry)) {
              // Decompress if needed
              if (entry.metadata.compressed) {
                entry.data = await this.decompress(entry.data) as T
                entry.metadata.compressed = false
              }
              return entry
            }
          }
        } catch (error) {
          console.error('Redis get error:', error)
        }
        return null

      default:
        return null
    }
  }

  private async setInLayer<T>(key: string, entry: CacheEntry<T>, layer: CacheLayer, ttl: number): Promise<void> {
    switch (layer) {
      case 'memory':
        // Check memory limits
        if (this.getMemoryUsage() + entry.metadata.size > this.config.maxMemorySize * 1024 * 1024) {
          await this.evictMemoryCache()
        }
        this.memoryCache.set(key, entry)
        break

      case 'redis':
        await this.redis.setex(key, ttl, JSON.stringify(entry))
        break
    }
  }

  private async promoteToHigherLayers<T>(
    key: string, 
    entry: CacheEntry<T>, 
    currentLayer: CacheLayer,
    tags: string[]
  ): Promise<void> {
    const currentIndex = this.config.layers.indexOf(currentLayer)
    const higherLayers = this.config.layers.slice(0, currentIndex)

    for (const layer of higherLayers) {
      try {
        await this.setInLayer(key, entry, layer, entry.metadata.ttl)
      } catch (error) {
        console.warn(`Failed to promote to ${layer}:`, error)
      }
    }
  }

  private async invalidateByTags(tags: string[]): Promise<number> {
    let count = 0

    // Memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (tags.some(tag => entry.metadata.tags.includes(tag))) {
        this.memoryCache.delete(key)
        count++
      }
    }

    // Redis cache - would need a more sophisticated approach in production
    // This is a simplified version
    try {
      const keys = await this.redis.keys('*')
      for (const key of keys) {
        const data = await this.redis.get(key)
        if (data) {
          const entry = JSON.parse(data as string)
          if (tags.some(tag => entry.metadata?.tags?.includes(tag))) {
            await this.redis.del(key)
            count++
          }
        }
      }
    } catch (error) {
      console.error('Redis tag invalidation error:', error)
    }

    return count
  }

  private async invalidateByPattern(pattern: string): Promise<number> {
    let count = 0

    // Convert pattern to regex
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))

    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
        count++
      }
    }

    // Redis cache
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        count += keys.length
      }
    } catch (error) {
      console.error('Redis pattern invalidation error:', error)
    }

    return count
  }

  private async evictMemoryCache(): Promise<void> {
    // LRU eviction strategy
    const entries = Array.from(this.memoryCache.entries())
    entries.sort((a, b) => a[1].metadata.lastAccessed - b[1].metadata.lastAccessed)

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25)
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0])
      this.updateStats('memory', 'eviction', 0)
    }
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length
  }

  private async compress(data: any): Promise<any> {
    // Simple compression simulation - in production use actual compression
    return JSON.stringify(data)
  }

  private async decompress(data: any): Promise<any> {
    // Simple decompression simulation
    return typeof data === 'string' ? JSON.parse(data) : data
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.metadata.createdAt + (entry.metadata.ttl * 1000)
  }

  private generateVersion(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private generateWarmingKey(pattern: string): string {
    return `warm:${createHash('md5').update(pattern).digest('hex')}`
  }

  private getMemoryUsage(): number {
    let totalSize = 0
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.metadata.size
    }
    return totalSize
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private recordHit(layer: CacheLayer, responseTime: number): void {
    const stats = this.stats.get(layer)!
    stats.hits++
    stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2
    this.updateStats(layer, 'hit', 0)
  }

  private recordMiss(layer: CacheLayer): void {
    const stats = this.stats.get(layer)!
    stats.misses++
    this.updateStats(layer, 'miss', 0)
  }

  private updateStats(layer: CacheLayer, operation: string, size: number): void {
    const stats = this.stats.get(layer)!
    
    switch (operation) {
      case 'set':
        stats.entryCount++
        stats.totalSize += size
        break
      case 'eviction':
        stats.evictions++
        break
    }
    
    stats.lastUpdated = Date.now()
  }

  private setupCleanupSchedule(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private async cleanup(): Promise<void> {
    // Remove expired entries from memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key)
      }
    }

    console.log(`🧹 Cache cleanup completed - ${this.memoryCache.size} entries remaining`)
  }
}

// Global instance
export const cacheCoordinator = new DistributedCacheCoordinator({
  enableCompression: true,
  maxMemorySize: 100, // 100MB
  defaultTTL: 3600, // 1 hour
  strategy: 'cache-aside',
  layers: ['memory', 'redis'],
  replicationFactor: 2
})