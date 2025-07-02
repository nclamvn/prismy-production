interface CacheEntry {
  result: any
  timestamp: number
  expiresAt: number
}

export class TranslationCache {
  private cache = new Map<string, CacheEntry>()
  private readonly defaultTTL = 60 * 60 * 1000 // 1 hour in milliseconds

  generateKey(
    text: string,
    sourceLang: string,
    targetLang: string,
    qualityTier: string
  ): string {
    // Create a hash-like key for the translation
    const content = `${text}|${sourceLang}|${targetLang}|${qualityTier}`
    return btoa(content)
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 32)
  }

  get(
    text: string,
    sourceLang: string,
    targetLang: string,
    qualityTier: string
  ): any | null {
    const key = this.generateKey(text, sourceLang, targetLang, qualityTier)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  set(
    text: string,
    sourceLang: string,
    targetLang: string,
    qualityTier: string,
    result: any,
    ttl?: number
  ): void {
    const key = this.generateKey(text, sourceLang, targetLang, qualityTier)
    const now = Date.now()
    const expiresAt = now + (ttl || this.defaultTTL)

    this.cache.set(key, {
      result,
      timestamp: now,
      expiresAt,
    })

    // Clean up expired entries periodically
    this.cleanup()
  }

  has(
    text: string,
    sourceLang: string,
    targetLang: string,
    qualityTier: string
  ): boolean {
    return this.get(text, sourceLang, targetLang, qualityTier) !== null
  }

  delete(
    text: string,
    sourceLang: string,
    targetLang: string,
    qualityTier: string
  ): boolean {
    const key = this.generateKey(text, sourceLang, targetLang, qualityTier)
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; expired: number; memory: number } {
    const now = Date.now()
    let expired = 0

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++
      }
    }

    return {
      size: this.cache.size,
      expired,
      memory: this.estimateMemoryUsage(),
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0

    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2 // UTF-16 encoding
      totalSize += JSON.stringify(entry).length * 2
    }

    return totalSize
  }
}

// Export singleton instance
export const translationCache = new TranslationCache()
