import { TranslationCache, translationCache } from '@/lib/translation-cache'

describe('TranslationCache', () => {
  let cache: TranslationCache

  beforeEach(() => {
    cache = new TranslationCache()
  })

  afterEach(() => {
    cache.clear()
  })

  describe('generateKey', () => {
    it('should generate consistent keys for same input', () => {
      const key1 = cache.generateKey('Hello', 'en', 'es', 'standard')
      const key2 = cache.generateKey('Hello', 'en', 'es', 'standard')
      
      expect(key1).toBe(key2)
      expect(key1.length).toBeGreaterThan(0)
      expect(key1).toMatch(/^[a-zA-Z0-9]+$/)
    })

    it('should generate different keys for different inputs', () => {
      const key1 = cache.generateKey('Hello', 'en', 'es', 'standard')
      const key2 = cache.generateKey('Hello', 'en', 'fr', 'standard')
      const key3 = cache.generateKey('Hello', 'en', 'es', 'premium')
      
      expect(key1).not.toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key2).not.toBe(key3)
    })
  })

  describe('set and get', () => {
    it('should store and retrieve cache entries', () => {
      const result = {
        translatedText: 'Hola',
        sourceLang: 'en',
        targetLang: 'es',
        confidence: 0.95,
        qualityScore: 0.90,
        timestamp: '2024-01-01T00:00:00.000Z'
      }

      cache.set('Hello', 'en', 'es', 'standard', result)
      const retrieved = cache.get('Hello', 'en', 'es', 'standard')

      expect(retrieved).toEqual(result)
    })

    it('should return null for non-existent entries', () => {
      const result = cache.get('NonExistent', 'en', 'es', 'standard')
      expect(result).toBeNull()
    })

    it('should respect custom TTL', () => {
      const result = { translatedText: 'Test' }
      const shortTTL = 100 // 100ms

      cache.set('Hello', 'en', 'es', 'standard', result, shortTTL)
      
      // Should exist immediately
      expect(cache.get('Hello', 'en', 'es', 'standard')).toEqual(result)

      // Should expire after TTL
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(cache.get('Hello', 'en', 'es', 'standard')).toBeNull()
          resolve(undefined)
        }, 150)
      })
    })

    it('should handle expired entries', () => {
      const result = { translatedText: 'Test' }
      const shortTTL = 50 // 50ms

      cache.set('Hello', 'en', 'es', 'standard', result, shortTTL)

      return new Promise((resolve) => {
        setTimeout(() => {
          const retrieved = cache.get('Hello', 'en', 'es', 'standard')
          expect(retrieved).toBeNull()
          resolve(undefined)
        }, 100)
      })
    })
  })

  describe('has', () => {
    it('should return true for existing entries', () => {
      const result = { translatedText: 'Test' }
      cache.set('Hello', 'en', 'es', 'standard', result)

      expect(cache.has('Hello', 'en', 'es', 'standard')).toBe(true)
    })

    it('should return false for non-existent entries', () => {
      expect(cache.has('NonExistent', 'en', 'es', 'standard')).toBe(false)
    })

    it('should return false for expired entries', () => {
      const result = { translatedText: 'Test' }
      const shortTTL = 50 // 50ms

      cache.set('Hello', 'en', 'es', 'standard', result, shortTTL)

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(cache.has('Hello', 'en', 'es', 'standard')).toBe(false)
          resolve(undefined)
        }, 100)
      })
    })
  })

  describe('delete', () => {
    it('should delete existing entries', () => {
      const result = { translatedText: 'Test' }
      cache.set('Hello', 'en', 'es', 'standard', result)

      expect(cache.has('Hello', 'en', 'es', 'standard')).toBe(true)
      
      const deleted = cache.delete('Hello', 'en', 'es', 'standard')
      expect(deleted).toBe(true)
      expect(cache.has('Hello', 'en', 'es', 'standard')).toBe(false)
    })

    it('should return false for non-existent entries', () => {
      const deleted = cache.delete('NonExistent', 'en', 'es', 'standard')
      expect(deleted).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      const result1 = { translatedText: 'Test1' }
      const result2 = { translatedText: 'Test2' }

      cache.set('Hello1', 'en', 'es', 'standard', result1)
      cache.set('Hello2', 'en', 'fr', 'standard', result2)

      expect(cache.size()).toBe(2)

      cache.clear()

      expect(cache.size()).toBe(0)
      expect(cache.has('Hello1', 'en', 'es', 'standard')).toBe(false)
      expect(cache.has('Hello2', 'en', 'fr', 'standard')).toBe(false)
    })
  })

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cache.size()).toBe(0)

      cache.set('Hello1', 'en', 'es', 'standard', { translatedText: 'Test1' })
      expect(cache.size()).toBe(1)

      cache.set('Hello2', 'en', 'fr', 'standard', { translatedText: 'Test2' })
      expect(cache.size()).toBe(2)

      cache.delete('Hello1', 'en', 'es', 'standard')
      expect(cache.size()).toBe(1)
    })
  })

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const result = { translatedText: 'Test' }
      cache.set('Hello', 'en', 'es', 'standard', result)

      const stats = cache.getStats()

      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('expired')
      expect(stats).toHaveProperty('memory')
      expect(stats.size).toBe(1)
      expect(stats.expired).toBe(0)
      expect(stats.memory).toBeGreaterThan(0)
    })

    it('should count expired entries correctly', () => {
      const result = { translatedText: 'Test' }
      const shortTTL = 50 // 50ms

      cache.set('Hello', 'en', 'es', 'standard', result, shortTTL)

      return new Promise((resolve) => {
        setTimeout(() => {
          const stats = cache.getStats()
          expect(stats.expired).toBe(1)
          resolve(undefined)
        }, 100)
      })
    })
  })

  describe('cleanup functionality', () => {
    it('should automatically clean up expired entries', () => {
      const result = { translatedText: 'Test' }
      const shortTTL = 50 // 50ms

      cache.set('Hello1', 'en', 'es', 'standard', result, shortTTL)
      cache.set('Hello2', 'en', 'fr', 'standard', result) // Long TTL

      expect(cache.size()).toBe(2)

      return new Promise((resolve) => {
        setTimeout(() => {
          // Trigger cleanup by setting another item
          cache.set('Hello3', 'en', 'de', 'standard', result)
          
          // Expired item should be cleaned up
          expect(cache.size()).toBe(2) // Hello2 and Hello3
          expect(cache.has('Hello1', 'en', 'es', 'standard')).toBe(false)
          expect(cache.has('Hello2', 'en', 'fr', 'standard')).toBe(true)
          expect(cache.has('Hello3', 'en', 'de', 'standard')).toBe(true)
          resolve(undefined)
        }, 100)
      })
    })
  })

  describe('memory estimation', () => {
    it('should estimate memory usage', () => {
      const result = { translatedText: 'Test translation result' }
      
      const initialMemory = cache.getStats().memory
      cache.set('Hello', 'en', 'es', 'standard', result)
      const afterMemory = cache.getStats().memory

      expect(afterMemory).toBeGreaterThan(initialMemory)
    })
  })
})

describe('translationCache singleton', () => {
  it('should export a singleton instance', () => {
    expect(translationCache).toBeInstanceOf(TranslationCache)
    
    // Test that it works
    const result = { translatedText: 'Test' }
    translationCache.set('Test', 'en', 'es', 'standard', result)
    expect(translationCache.get('Test', 'en', 'es', 'standard')).toEqual(result)
    
    // Clean up
    translationCache.clear()
  })
})