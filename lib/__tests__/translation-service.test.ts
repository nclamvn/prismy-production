/**
 * Translation Service Test Suite
 * Comprehensive testing for translation-service.ts core functionality
 * Target: 90%+ coverage with real API simulation
 */

// Mock Google Translate before imports
const mockTranslateInstance = {
  translate: jest.fn(),
  detect: jest.fn(),
  getLanguages: jest.fn(),
}

jest.mock('@google-cloud/translate/build/src/v2', () => ({
  Translate: jest.fn(() => mockTranslateInstance),
}))

// Mock translation cache modules
jest.mock('../translation-cache', () => ({
  translationCache: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  },
}))

jest.mock('../redis-translation-cache', () => ({
  redisTranslationCache: {
    get: jest.fn(),
    set: jest.fn(),
    getCachedLanguages: jest.fn(),
    cacheLanguages: jest.fn(),
  },
}))

// Mock fs for file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

describe('Translation Service', () => {
  let PrismyTranslationService: any
  let translationService: any
  const mockCache = require('../translation-cache').translationCache
  const mockRedisCache =
    require('../redis-translation-cache').redisTranslationCache
  const mockFs = require('fs')

  beforeAll(() => {
    // Set up environment variables
    process.env.GOOGLE_TRANSLATE_API_KEY = 'test-api-key'
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project'

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()

    // Import after setting up mocks
    const translationModule = require('../translation-service')
    PrismyTranslationService = translationModule.PrismyTranslationService
    translationService = translationModule.translationService
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockCache.get.mockReturnValue(null)
    mockRedisCache.get.mockResolvedValue(null)
    mockFs.existsSync.mockReturnValue(false)
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with API key authentication', () => {
      const service = new PrismyTranslationService()
      expect(service).toBeDefined()
      expect(mockTranslateInstance).toBeDefined()
    })

    it('should handle service account file authentication', () => {
      process.env.GOOGLE_CLOUD_KEY_FILE = '/path/to/service-account.json'
      mockFs.existsSync.mockReturnValue(true)

      const service = new PrismyTranslationService()
      expect(service).toBeDefined()

      delete process.env.GOOGLE_CLOUD_KEY_FILE
    })

    it('should throw error when no credentials provided', () => {
      const originalApiKey = process.env.GOOGLE_TRANSLATE_API_KEY
      const originalProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID

      delete process.env.GOOGLE_TRANSLATE_API_KEY
      delete process.env.GOOGLE_CLOUD_PROJECT_ID

      expect(() => new PrismyTranslationService()).toThrow(
        'Google Cloud Translation API credentials not configured'
      )

      process.env.GOOGLE_TRANSLATE_API_KEY = originalApiKey
      process.env.GOOGLE_CLOUD_PROJECT_ID = originalProjectId
    })

    it('should handle invalid service account file path', () => {
      process.env.GOOGLE_CLOUD_KEY_FILE = '/invalid/path/service-account.json'
      mockFs.existsSync.mockReturnValue(false)

      const service = new PrismyTranslationService()
      expect(service).toBeDefined()

      delete process.env.GOOGLE_CLOUD_KEY_FILE
    })
  })

  describe('Translation Core Functionality', () => {
    it('should translate text successfully', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Xin chào thế giới',
        {
          detectedSourceLanguage: 'en',
        },
      ])

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      expect(result.translatedText).toBe('Xin chào thế giới')
      expect(result.sourceLang).toBe('en')
      expect(result.targetLang).toBe('vi')
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.qualityScore).toBeGreaterThan(0.7)
      expect(result.cached).toBe(false)
    })

    it('should handle auto language detection', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Xin chào thế giới',
        {
          detectedSourceLanguage: 'en',
        },
      ])

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'auto',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      expect(result.detectedSourceLanguage).toBe('en')
      expect(result.sourceLang).toBe('en')
      expect(mockTranslateInstance.translate).toHaveBeenCalledWith(
        'Hello world',
        {
          from: undefined,
          to: 'vi',
          format: 'text',
          model: 'base',
        }
      )
    })

    it('should handle array response from Google Translate', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        ['Xin chào thế giới'],
        {
          detectedSourceLanguage: 'en',
        },
      ])

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      expect(result.translatedText).toBe('Xin chào thế giới')
    })

    it('should use Redis cache when available', async () => {
      const cachedResult = {
        translatedText: 'Cached translation',
        sourceLang: 'en',
        targetLang: 'vi',
        confidence: 0.95,
        qualityScore: 0.9,
      }

      mockRedisCache.get.mockResolvedValue(cachedResult)

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        abTestVariant: 'cache_enabled',
      })

      expect(result.translatedText).toBe('Cached translation')
      expect(result.cached).toBe(true)
      expect(mockTranslateInstance.translate).not.toHaveBeenCalled()
    })

    it('should fallback to memory cache when Redis fails', async () => {
      const cachedResult = {
        translatedText: 'Memory cached translation',
        sourceLang: 'en',
        targetLang: 'vi',
        confidence: 0.95,
        qualityScore: 0.9,
      }

      mockRedisCache.get.mockResolvedValue(null)
      mockCache.get.mockReturnValue(cachedResult)

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        abTestVariant: 'cache_enabled',
      })

      expect(result.translatedText).toBe('Memory cached translation')
      expect(result.cached).toBe(true)
      expect(mockTranslateInstance.translate).not.toHaveBeenCalled()
    })

    it('should cache new translations', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Fresh translation',
        {
          detectedSourceLanguage: 'en',
        },
      ])

      await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        abTestVariant: 'cache_enabled',
      })

      expect(mockRedisCache.set).toHaveBeenCalledWith(
        'Hello world',
        'en',
        'vi',
        expect.objectContaining({
          translatedText: 'Fresh translation',
        }),
        'standard'
      )

      expect(mockCache.set).toHaveBeenCalledWith(
        'Hello world',
        'en',
        'vi',
        'standard',
        expect.objectContaining({
          translatedText: 'Fresh translation',
        })
      )
    })

    it('should skip cache when A/B test variant is cache_disabled', async () => {
      mockRedisCache.get.mockResolvedValue({
        translatedText: 'Cached translation',
      })

      mockTranslateInstance.translate.mockResolvedValue([
        'Fresh translation',
        { detectedSourceLanguage: 'en' },
      ])

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        abTestVariant: 'cache_disabled',
      })

      expect(result.translatedText).toBe('Fresh translation')
      expect(mockRedisCache.get).not.toHaveBeenCalled()
      expect(mockRedisCache.set).not.toHaveBeenCalled()
    })

    it('should skip cache for auto language detection', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Translation without cache',
        { detectedSourceLanguage: 'en' },
      ])

      await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'auto',
        targetLang: 'vi',
        qualityTier: 'standard',
        abTestVariant: 'cache_enabled',
      })

      expect(mockRedisCache.get).not.toHaveBeenCalled()
    })
  })

  describe('Quality Tiers and Models', () => {
    it('should use correct model for premium quality', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Premium translation',
        { detectedSourceLanguage: 'en' },
      ])

      await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'premium',
      })

      expect(mockTranslateInstance.translate).toHaveBeenCalledWith(
        'Hello world',
        {
          from: 'en',
          to: 'vi',
          format: 'text',
          model: 'nmt',
        }
      )
    })

    it('should use correct model for enterprise quality', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Enterprise translation',
        { detectedSourceLanguage: 'en' },
      ])

      await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'enterprise',
      })

      expect(mockTranslateInstance.translate).toHaveBeenCalledWith(
        'Hello world',
        {
          from: 'en',
          to: 'vi',
          format: 'text',
          model: 'nmt',
        }
      )
    })

    it('should use base model for free quality', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Free translation',
        { detectedSourceLanguage: 'en' },
      ])

      await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'free',
      })

      expect(mockTranslateInstance.translate).toHaveBeenCalledWith(
        'Hello world',
        {
          from: 'en',
          to: 'vi',
          format: 'text',
          model: 'base',
        }
      )
    })

    it('should calculate quality scores based on tier', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Test translation',
        { detectedSourceLanguage: 'en' },
      ])

      const freeResult = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'free',
      })

      const enterpriseResult = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'enterprise',
      })

      expect(enterpriseResult.qualityScore).toBeGreaterThan(
        freeResult.qualityScore
      )
    })
  })

  describe('Language Detection', () => {
    it('should detect language successfully', async () => {
      mockTranslateInstance.detect.mockResolvedValue([
        {
          language: 'en',
          confidence: 0.95,
        },
      ])

      const result = await translationService.detectLanguage('Hello world')

      expect(result).toBe('en')
      expect(mockTranslateInstance.detect).toHaveBeenCalledWith('Hello world')
    })

    it('should handle array response from detect', async () => {
      mockTranslateInstance.detect.mockResolvedValue([
        { language: 'en', confidence: 0.95 },
        { language: 'fr', confidence: 0.05 },
      ])

      const result = await translationService.detectLanguage('Hello world')

      expect(result).toBe('en')
    })

    it('should return unknown on detection error', async () => {
      mockTranslateInstance.detect.mockRejectedValue(
        new Error('Detection failed')
      )

      const result = await translationService.detectLanguage('Hello world')

      expect(result).toBe('unknown')
    })
  })

  describe('Supported Languages', () => {
    it('should get supported languages from API', async () => {
      const languages = [
        { code: 'en', name: 'English' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'fr', name: 'French' },
      ]

      mockTranslateInstance.getLanguages.mockResolvedValue([languages])
      mockRedisCache.getCachedLanguages.mockResolvedValue(null)

      const result = await translationService.getSupportedLanguages()

      expect(result).toEqual(languages)
      expect(mockRedisCache.cacheLanguages).toHaveBeenCalledWith(languages)
    })

    it('should use cached languages when available', async () => {
      const cachedLanguages = [
        { code: 'en', name: 'English' },
        { code: 'vi', name: 'Vietnamese' },
      ]

      mockRedisCache.getCachedLanguages.mockResolvedValue(cachedLanguages)

      const result = await translationService.getSupportedLanguages()

      expect(result).toEqual(cachedLanguages)
      expect(mockTranslateInstance.getLanguages).not.toHaveBeenCalled()
    })

    it('should return fallback languages on API error', async () => {
      mockRedisCache.getCachedLanguages.mockResolvedValue(null)
      mockTranslateInstance.getLanguages.mockRejectedValue(
        new Error('API Error')
      )

      const result = await translationService.getSupportedLanguages()

      expect(result).toHaveLength(13) // Fallback languages count
      expect(result[0]).toEqual({ code: 'en', name: 'English' })
      expect(result.find(lang => lang.code === 'vi')).toEqual({
        code: 'vi',
        name: 'Vietnamese',
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle translation API errors', async () => {
      mockTranslateInstance.translate.mockRejectedValue(new Error('API Error'))

      await expect(
        translationService.translateText({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi',
          qualityTier: 'standard',
        })
      ).rejects.toThrow('Translation failed: API Error')
    })

    it('should handle cache errors gracefully during read', async () => {
      mockRedisCache.get.mockRejectedValue(new Error('Cache read error'))
      mockCache.get.mockImplementation(() => {
        throw new Error('Memory cache error')
      })
      // Reset cache errors for the operation itself
      mockRedisCache.set.mockResolvedValue(undefined)
      mockCache.set.mockImplementation(() => {})

      mockTranslateInstance.translate.mockResolvedValue([
        'Translation after cache error',
        { detectedSourceLanguage: 'en' },
      ])

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        abTestVariant: 'cache_enabled',
      })

      expect(result.translatedText).toBe('Translation after cache error')
    })

    it('should handle cache errors gracefully during write', async () => {
      // Reset read cache operations first
      mockRedisCache.get.mockResolvedValue(null)
      mockCache.get.mockReturnValue(null)

      // Set up write errors
      mockRedisCache.set.mockRejectedValue(new Error('Cache write error'))
      mockCache.set.mockImplementation(() => {
        throw new Error('Memory cache write error')
      })

      mockTranslateInstance.translate.mockResolvedValue([
        'Translation with cache write error',
        { detectedSourceLanguage: 'en' },
      ])

      // Should not throw error, just continue without caching
      const result = await translationService.translateText({
        text: 'Hello world for cache write test',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        abTestVariant: 'cache_enabled',
      })

      expect(result.translatedText).toBe('Translation with cache write error')
    })
  })

  describe('Text Complexity and Confidence Calculation', () => {
    it('should calculate higher confidence for simple text', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Simple translation',
        { detectedSourceLanguage: 'en' },
      ])

      const result = await translationService.translateText({
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should calculate lower confidence for complex text with special characters', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Complex translation',
        { detectedSourceLanguage: 'en' },
      ])

      const complexText =
        'Hello! @user: check this URL: https://example.com/path?param=value&other=123. How are you?'
      const result = await translationService.translateText({
        text: complexText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      expect(result.confidence).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should handle very long text in confidence calculation', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Long translation',
        { detectedSourceLanguage: 'en' },
      ])

      const longText = 'This is a very long text. '.repeat(100)
      const result = await translationService.translateText({
        text: longText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      expect(result.confidence).toBeDefined()
      expect(result.confidence).toBeLessThan(0.99)
    })
  })

  describe('Service Validation', () => {
    it('should validate connection on initialization', async () => {
      mockTranslateInstance.translate.mockResolvedValueOnce([
        'Xin chào',
        { detectedSourceLanguage: 'en' },
      ])

      const service = new PrismyTranslationService()

      // Validation is called asynchronously, so we need to wait
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(mockTranslateInstance.translate).toHaveBeenCalledWith('Hello', {
        to: 'vi',
        from: 'en',
      })
    })

    it('should handle validation errors gracefully', async () => {
      mockTranslateInstance.translate.mockRejectedValueOnce(
        new Error('Validation failed')
      )

      const service = new PrismyTranslationService()

      // Should not throw, just log error
      expect(service).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined metadata gracefully', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Translation without metadata',
        null,
      ])

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      expect(result.translatedText).toBe('Translation without metadata')
      expect(result.sourceLang).toBe('en')
      expect(result.detectedSourceLanguage).toBeUndefined()
    })

    it('should handle empty string translation', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        '',
        { detectedSourceLanguage: 'en' },
      ])

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      expect(result.translatedText).toBe('')
    })

    it('should handle undefined quality tier gracefully', async () => {
      mockTranslateInstance.translate.mockResolvedValue([
        'Default quality translation',
        { detectedSourceLanguage: 'en' },
      ])

      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        // qualityTier is undefined, should default to 'standard'
      })

      expect(result.translatedText).toBe('Default quality translation')
      expect(mockTranslateInstance.translate).toHaveBeenCalledWith(
        'Hello world',
        {
          from: 'en',
          to: 'vi',
          format: 'text',
          model: 'base', // Should use 'base' for 'standard' tier
        }
      )
    })
  })
})
