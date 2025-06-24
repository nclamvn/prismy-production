/**
 * UNIFIED CACHE SYSTEM
 * Consolidates all caching functionality into a single, comprehensive system
 */

export interface CacheEntry<T = any> {
  key: string
  value: T
  createdAt: Date
  expiresAt: Date | null
  accessCount: number
  lastAccessedAt: Date
  size: number
  metadata: Record<string, any>
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size in bytes
  maxEntries?: number // Maximum number of entries
  enableLRU?: boolean // Enable LRU eviction
  enableStatistics?: boolean // Enable cache statistics
  namespace?: string // Cache namespace
}

export interface CacheStatistics {
  hits: number
  misses: number
  hitRate: number
  totalOperations: number
  totalSize: number
  entryCount: number
  averageResponseTime: number
  evictions: number
}

export interface CacheKeyOptions {
  prefix?: string
  separator?: string
  includeTimestamp?: boolean
  includeHash?: boolean
  maxLength?: number
}

export class CacheKeyGenerator {
  private readonly separator: string
  private readonly maxLength: number

  constructor(
    private readonly options: CacheKeyOptions = {}
  ) {
    this.separator = options.separator || ':'
    this.maxLength = options.maxLength || 250
  }

  generateKey(components: (string | number | object)[]): string {
    const prefix = this.options.prefix ? `${this.options.prefix}${this.separator}` : ''
    
    const processedComponents = components.map(component => {
      if (typeof component === 'object') {
        return this.hashObject(component)
      }
      return String(component)
    })

    let key = prefix + processedComponents.join(this.separator)

    // Add timestamp if requested
    if (this.options.includeTimestamp) {
      key += `${this.separator}${Date.now()}`
    }

    // Add hash if requested or if key is too long
    if (this.options.includeHash || key.length > this.maxLength) {
      key = prefix + this.hashString(key)
    }

    return key
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private hashObject(obj: object): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    return this.hashString(str)
  }
}

export interface CacheInterface<T = any> {
  get(key: string): Promise<T | null>
  set(key: string, value: T, options?: Partial<CacheOptions>): Promise<boolean>
  delete(key: string): Promise<boolean>
  clear(namespace?: string): Promise<void>
  has(key: string): Promise<boolean>
  getSize(): Promise<number>
  getKeys(pattern?: string): Promise<string[]>
  getStatistics(): Promise<CacheStatistics>
}

export class UnifiedCache<T = any> implements CacheInterface<T> {
  private readonly entries = new Map<string, CacheEntry<T>>()
  private readonly keyGenerator: CacheKeyGenerator
  private readonly statistics: CacheStatistics
  private readonly options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 60000, // 1 minute default
      maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB default
      maxEntries: options.maxEntries || 10000,
      enableLRU: options.enableLRU !== false,
      enableStatistics: options.enableStatistics !== false,
      namespace: options.namespace || 'default'
    }

    this.keyGenerator = new CacheKeyGenerator({
      prefix: this.options.namespace
    })

    this.statistics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalOperations: 0,
      totalSize: 0,
      entryCount: 0,
      averageResponseTime: 0,
      evictions: 0
    }

    // Setup cleanup interval
    setInterval(() => this.cleanup(), 60000) // Cleanup every minute
  }

  async get(key: string): Promise<T | null> {
    const startTime = Date.now()
    
    try {
      const fullKey = this.keyGenerator.generateKey([key])
      const entry = this.entries.get(fullKey)

      if (!entry) {
        this.recordMiss()
        return null
      }

      // Check expiration
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        this.entries.delete(fullKey)
        this.recordMiss()
        return null
      }

      // Update access tracking
      entry.accessCount++
      entry.lastAccessedAt = new Date()

      this.recordHit()
      return entry.value
    } finally {
      this.updateResponseTime(Date.now() - startTime)
    }
  }

  async set(key: string, value: T, options: Partial<CacheOptions> = {}): Promise<boolean> {
    const startTime = Date.now()
    
    try {
      const fullKey = this.keyGenerator.generateKey([key])
      const ttl = options.ttl || this.options.ttl
      const expiresAt = ttl > 0 ? new Date(Date.now() + ttl) : null

      // Calculate size
      const size = this.calculateSize(value)

      // Check if we need to evict entries
      await this.ensureCapacity(size)

      const entry: CacheEntry<T> = {
        key: fullKey,
        value,
        createdAt: new Date(),
        expiresAt,
        accessCount: 0,
        lastAccessedAt: new Date(),
        size,
        metadata: {}
      }

      this.entries.set(fullKey, entry)
      this.updateStatistics()

      return true
    } finally {
      this.updateResponseTime(Date.now() - startTime)
    }
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.keyGenerator.generateKey([key])
    const result = this.entries.delete(fullKey)
    this.updateStatistics()
    return result
  }

  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      const prefix = `${namespace}:`
      for (const key of this.entries.keys()) {
        if (key.startsWith(prefix)) {
          this.entries.delete(key)
        }
      }
    } else {
      this.entries.clear()
    }
    this.updateStatistics()
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.keyGenerator.generateKey([key])
    const entry = this.entries.get(fullKey)
    
    if (!entry) return false
    
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.entries.delete(fullKey)
      return false
    }
    
    return true
  }

  async getSize(): Promise<number> {
    return this.statistics.totalSize
  }

  async getKeys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.entries.keys())
    
    if (!pattern) return keys
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return keys.filter(key => regex.test(key))
  }

  async getStatistics(): Promise<CacheStatistics> {
    return { ...this.statistics }
  }

  // Private methods
  private calculateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size
    } catch {
      return JSON.stringify(value).length * 2 // Rough estimate
    }
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    // Check entry count limit
    if (this.entries.size >= this.options.maxEntries) {
      await this.evictLRU()
    }

    // Check size limit
    if (this.statistics.totalSize + newEntrySize > this.options.maxSize) {
      await this.evictBySize(newEntrySize)
    }
  }

  private async evictLRU(): Promise<void> {
    if (!this.options.enableLRU || this.entries.size === 0) return

    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.entries) {
      if (entry.lastAccessedAt.getTime() < oldestTime) {
        oldestTime = entry.lastAccessedAt.getTime()
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.entries.delete(oldestKey)
      this.statistics.evictions++
    }
  }

  private async evictBySize(requiredSpace: number): Promise<void> {
    const sortedEntries = Array.from(this.entries.entries())
      .sort(([, a], [, b]) => a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime())

    let freedSpace = 0
    for (const [key, entry] of sortedEntries) {
      this.entries.delete(key)
      freedSpace += entry.size
      this.statistics.evictions++

      if (freedSpace >= requiredSpace) break
    }
  }

  private cleanup(): void {
    const now = new Date()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.entries) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.entries.delete(key)
    }

    this.updateStatistics()
  }

  private recordHit(): void {
    if (this.options.enableStatistics) {
      this.statistics.hits++
      this.statistics.totalOperations++
      this.updateHitRate()
    }
  }

  private recordMiss(): void {
    if (this.options.enableStatistics) {
      this.statistics.misses++
      this.statistics.totalOperations++
      this.updateHitRate()
    }
  }

  private updateHitRate(): void {
    this.statistics.hitRate = this.statistics.totalOperations > 0
      ? (this.statistics.hits / this.statistics.totalOperations) * 100
      : 0
  }

  private updateResponseTime(responseTime: number): void {
    if (this.options.enableStatistics) {
      const total = this.statistics.averageResponseTime * (this.statistics.totalOperations - 1)
      this.statistics.averageResponseTime = (total + responseTime) / this.statistics.totalOperations
    }
  }

  private updateStatistics(): void {
    if (this.options.enableStatistics) {
      this.statistics.entryCount = this.entries.size
      this.statistics.totalSize = Array.from(this.entries.values())
        .reduce((total, entry) => total + entry.size, 0)
    }
  }
}

// Export singleton instances for common use cases
export const defaultCache = new UnifiedCache()
export const translationCache = new UnifiedCache({ namespace: 'translation', ttl: 300000 }) // 5 minutes
export const documentCache = new UnifiedCache({ namespace: 'document', ttl: 600000 }) // 10 minutes
export const userCache = new UnifiedCache({ namespace: 'user', ttl: 900000 }) // 15 minutes