import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'

// Redis Configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

const useRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

// Cache key prefixes for organization
const CACHE_PREFIXES = {
  TRANSLATION: 'translation:',
  LANGUAGE_LIST: 'languages:',
  USER_HISTORY: 'history:',
  METADATA: 'meta:',
  STATS: 'stats:',
} as const

// TTL configurations (in seconds)
const TTL_CONFIG = {
  TRANSLATION: {
    // Intelligent TTL based on text characteristics
    SHORT_TEXT: 24 * 60 * 60, // 24 hours for short, common phrases
    MEDIUM_TEXT: 12 * 60 * 60, // 12 hours for medium text
    LONG_TEXT: 6 * 60 * 60, // 6 hours for long text
    TECHNICAL: 48 * 60 * 60, // 48 hours for technical content (more stable)
    BUSINESS: 36 * 60 * 60, // 36 hours for business documents
  },
  LANGUAGE_LIST: 7 * 24 * 60 * 60, // 7 days (rarely changes)
  USER_HISTORY: 60 * 60, // 1 hour for user history queries
  METADATA: 4 * 60 * 60, // 4 hours for API metadata
} as const

// Translation cache entry structure
interface CachedTranslation {
  translatedText: string
  sourceLang: string
  targetLang: string
  confidence: number
  qualityScore: number
  timestamp: string
  hitCount: number
  qualityTier: string
  textCategory?: string
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  lastUpdated: string
}

// In-memory fallback for when Redis is unavailable
const fallbackCache = new Map<string, { data: any; expiresAt: number }>()

export class RedisTranslationCache {
  private enabled = useRedis

  /**
   * Generate intelligent cache key based on translation parameters
   */
  private generateCacheKey(
    text: string,
    sourceLang: string,
    targetLang: string,
    qualityTier: string = 'standard'
  ): string {
    const content = `${text}|${sourceLang}|${targetLang}|${qualityTier}`
    const hash = createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16)
    return `${CACHE_PREFIXES.TRANSLATION}${hash}`
  }

  /**
   * Determine text category for intelligent TTL
   */
  private categorizeText(text: string): { category: string; ttl: number } {
    const length = text.length
    const hasNumbers = /\d/.test(text)
    const hasTechnicalTerms =
      /\b(API|JSON|HTTP|SQL|database|server|application|system|protocol|algorithm|framework|library|function|variable|parameter|configuration|deployment|authentication|authorization|encryption|security|performance|optimization|integration|architecture|infrastructure|microservice|container|kubernetes|docker|cloud|AWS|Azure|GCP)\b/i.test(
        text
      )
    const hasBusinessTerms =
      /\b(contract|agreement|policy|terms|conditions|invoice|payment|transaction|revenue|profit|budget|cost|expense|finance|accounting|legal|compliance|regulation|audit|report|analysis|strategy|management|operation|business|company|corporation|enterprise|organization|department|team|project|meeting|presentation|proposal|requirement|specification|documentation|procedure|process|workflow|timeline|deadline|milestone|deliverable|stakeholder|client|customer|vendor|supplier|partner)\b/i.test(
        text
      )

    if (hasTechnicalTerms) {
      return { category: 'technical', ttl: TTL_CONFIG.TRANSLATION.TECHNICAL }
    }

    if (hasBusinessTerms) {
      return { category: 'business', ttl: TTL_CONFIG.TRANSLATION.BUSINESS }
    }

    if (length < 100) {
      return { category: 'short', ttl: TTL_CONFIG.TRANSLATION.SHORT_TEXT }
    } else if (length < 500) {
      return { category: 'medium', ttl: TTL_CONFIG.TRANSLATION.MEDIUM_TEXT }
    } else {
      return { category: 'long', ttl: TTL_CONFIG.TRANSLATION.LONG_TEXT }
    }
  }

  /**
   * Get cached translation
   */
  async get(
    text: string,
    sourceLang: string,
    targetLang: string,
    qualityTier: string = 'standard'
  ): Promise<CachedTranslation | null> {
    try {
      const key = this.generateCacheKey(
        text,
        sourceLang,
        targetLang,
        qualityTier
      )

      if (this.enabled) {
        // Try Redis first
        const cached = await redis.get(key)
        if (cached) {
          const translation = cached as CachedTranslation

          // Increment hit count
          await this.incrementHitCount(key, translation)
          await this.updateStats('hit')

          return translation
        }
      } else {
        // Fallback to in-memory cache
        const cached = fallbackCache.get(key)
        if (cached && Date.now() < cached.expiresAt) {
          await this.updateStats('hit')
          return cached.data
        }
        if (cached && Date.now() >= cached.expiresAt) {
          fallbackCache.delete(key)
        }
      }

      await this.updateStats('miss')
      return null
    } catch (error) {
      console.error('Redis cache get error:', error)
      await this.updateStats('miss')
      return null
    }
  }

  /**
   * Set cached translation with intelligent TTL
   */
  async set(
    text: string,
    sourceLang: string,
    targetLang: string,
    translation: Omit<CachedTranslation, 'hitCount' | 'textCategory'>,
    qualityTier: string = 'standard'
  ): Promise<void> {
    try {
      const key = this.generateCacheKey(
        text,
        sourceLang,
        targetLang,
        qualityTier
      )
      const { category, ttl } = this.categorizeText(text)

      const cacheEntry: CachedTranslation = {
        ...translation,
        hitCount: 0,
        textCategory: category,
        qualityTier,
      }

      if (this.enabled) {
        // Store in Redis with TTL
        await redis.setex(key, ttl, JSON.stringify(cacheEntry))
      } else {
        // Fallback to in-memory cache
        fallbackCache.set(key, {
          data: cacheEntry,
          expiresAt: Date.now() + ttl * 1000,
        })
      }

      console.log(`Translation cached: ${category} text, TTL: ${ttl}s`)
    } catch (error) {
      console.error('Redis cache set error:', error)
      // Fail silently - caching is not critical
    }
  }

  /**
   * Increment hit count for popular translations
   */
  private async incrementHitCount(
    key: string,
    translation: CachedTranslation
  ): Promise<void> {
    try {
      if (this.enabled) {
        translation.hitCount += 1

        // Extend TTL for frequently accessed translations
        if (translation.hitCount >= 5) {
          const extendedTTL =
            translation.hitCount >= 10
              ? TTL_CONFIG.TRANSLATION.BUSINESS
              : TTL_CONFIG.TRANSLATION.MEDIUM_TEXT

          await redis.setex(key, extendedTTL, JSON.stringify(translation))
        } else {
          await redis.set(key, JSON.stringify(translation))
        }
      }
    } catch (error) {
      console.error('Error incrementing hit count:', error)
    }
  }

  /**
   * Cache language list
   */
  async cacheLanguages(
    languages: Array<{ code: string; name: string }>
  ): Promise<void> {
    try {
      const key = `${CACHE_PREFIXES.LANGUAGE_LIST}supported`

      if (this.enabled) {
        await redis.setex(
          key,
          TTL_CONFIG.LANGUAGE_LIST,
          JSON.stringify(languages)
        )
      } else {
        fallbackCache.set(key, {
          data: languages,
          expiresAt: Date.now() + TTL_CONFIG.LANGUAGE_LIST * 1000,
        })
      }
    } catch (error) {
      console.error('Error caching languages:', error)
    }
  }

  /**
   * Get cached language list
   */
  async getCachedLanguages(): Promise<Array<{
    code: string
    name: string
  }> | null> {
    try {
      const key = `${CACHE_PREFIXES.LANGUAGE_LIST}supported`

      if (this.enabled) {
        const cached = await redis.get(key)
        return cached ? (cached as Array<{ code: string; name: string }>) : null
      } else {
        const cached = fallbackCache.get(key)
        if (cached && Date.now() < cached.expiresAt) {
          return cached.data
        }
        if (cached && Date.now() >= cached.expiresAt) {
          fallbackCache.delete(key)
        }
      }

      return null
    } catch (error) {
      console.error('Error getting cached languages:', error)
      return null
    }
  }

  /**
   * Cache user translation history query
   */
  async cacheUserHistory(
    userId: string,
    queryHash: string,
    results: any[]
  ): Promise<void> {
    try {
      const key = `${CACHE_PREFIXES.USER_HISTORY}${userId}:${queryHash}`

      if (this.enabled) {
        await redis.setex(key, TTL_CONFIG.USER_HISTORY, JSON.stringify(results))
      } else {
        fallbackCache.set(key, {
          data: results,
          expiresAt: Date.now() + TTL_CONFIG.USER_HISTORY * 1000,
        })
      }
    } catch (error) {
      console.error('Error caching user history:', error)
    }
  }

  /**
   * Get cached user history
   */
  async getCachedUserHistory(
    userId: string,
    queryHash: string
  ): Promise<any[] | null> {
    try {
      const key = `${CACHE_PREFIXES.USER_HISTORY}${userId}:${queryHash}`

      if (this.enabled) {
        const cached = await redis.get(key)
        return cached ? (cached as any[]) : null
      } else {
        const cached = fallbackCache.get(key)
        if (cached && Date.now() < cached.expiresAt) {
          return cached.data
        }
        if (cached && Date.now() >= cached.expiresAt) {
          fallbackCache.delete(key)
        }
      }

      return null
    } catch (error) {
      console.error('Error getting cached user history:', error)
      return null
    }
  }

  /**
   * Invalidate user history cache when new translation is added
   */
  async invalidateUserHistory(userId: string): Promise<void> {
    try {
      if (this.enabled) {
        const pattern = `${CACHE_PREFIXES.USER_HISTORY}${userId}:*`
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } else {
        // Clear in-memory cache for this user
        for (const key of fallbackCache.keys()) {
          if (key.startsWith(`${CACHE_PREFIXES.USER_HISTORY}${userId}:`)) {
            fallbackCache.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Error invalidating user history cache:', error)
    }
  }

  /**
   * Warm cache with popular translations
   */
  async warmCache(
    popularTranslations: Array<{
      text: string
      sourceLang: string
      targetLang: string
      translation: Omit<CachedTranslation, 'hitCount' | 'textCategory'>
    }>
  ): Promise<void> {
    try {
      console.log(
        `Warming cache with ${popularTranslations.length} popular translations...`
      )

      for (const item of popularTranslations) {
        await this.set(
          item.text,
          item.sourceLang,
          item.targetLang,
          item.translation
        )
      }

      console.log('Cache warming completed')
    } catch (error) {
      console.error('Error warming cache:', error)
    }
  }

  /**
   * Update cache statistics
   */
  private async updateStats(type: 'hit' | 'miss'): Promise<void> {
    try {
      if (this.enabled) {
        const statsKey = `${CACHE_PREFIXES.STATS}translation`
        const current = (await redis.get(statsKey)) as CacheStats | null

        const stats: CacheStats = current || {
          hits: 0,
          misses: 0,
          hitRate: 0,
          lastUpdated: new Date().toISOString(),
        }

        if (type === 'hit') {
          stats.hits += 1
        } else {
          stats.misses += 1
        }

        stats.hitRate = stats.hits / (stats.hits + stats.misses)
        stats.lastUpdated = new Date().toISOString()

        await redis.setex(statsKey, TTL_CONFIG.METADATA, JSON.stringify(stats))
      }
    } catch (error) {
      console.error('Error updating cache stats:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats | null> {
    try {
      if (this.enabled) {
        const statsKey = `${CACHE_PREFIXES.STATS}translation`
        const stats = await redis.get(statsKey)
        return stats as CacheStats | null
      }
      return null
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return null
    }
  }

  /**
   * Clear all translation cache (for maintenance)
   */
  async clearTranslationCache(): Promise<void> {
    try {
      if (this.enabled) {
        const keys = await redis.keys(`${CACHE_PREFIXES.TRANSLATION}*`)
        if (keys.length > 0) {
          await redis.del(...keys)
          console.log(`Cleared ${keys.length} translation cache entries`)
        }
      } else {
        // Clear in-memory cache
        for (const key of fallbackCache.keys()) {
          if (key.startsWith(CACHE_PREFIXES.TRANSLATION)) {
            fallbackCache.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Error clearing translation cache:', error)
    }
  }

  /**
   * Get cache health information
   */
  async getHealthInfo(): Promise<{
    enabled: boolean
    connected: boolean
    stats: CacheStats | null
    fallbackCacheSize: number
  }> {
    let connected = false

    try {
      if (this.enabled) {
        await redis.ping()
        connected = true
      }
    } catch (error) {
      connected = false
    }

    const stats = await this.getStats()

    return {
      enabled: this.enabled,
      connected,
      stats,
      fallbackCacheSize: fallbackCache.size,
    }
  }
}

// Export singleton instance
export const redisTranslationCache = new RedisTranslationCache()
