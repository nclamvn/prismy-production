import { PrismyTranslationService, translationService } from '@/lib/translation-service'
import { translationCache } from '@/lib/translation-cache'

// Mock Google Cloud Translate
jest.mock('@google-cloud/translate/build/src/v2', () => {
  return {
    Translate: jest.fn().mockImplementation(() => ({
      translate: jest.fn(),
      detect: jest.fn(),
      getLanguages: jest.fn(),
    })),
  }
})

// Mock translation cache
jest.mock('@/lib/translation-cache', () => ({
  translationCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

describe('PrismyTranslationService', () => {
  let service: PrismyTranslationService
  let mockTranslate: jest.Mocked<any>

  beforeEach(() => {
    service = new PrismyTranslationService()
    mockTranslate = (service as any).translate
    jest.clearAllMocks()
  })

  describe('translateText', () => {
    it('should translate text successfully', async () => {
      const mockTranslation = 'Hola mundo'
      const mockMetadata = { detectedSourceLanguage: 'en' }
      
      mockTranslate.translate.mockResolvedValueOnce([mockTranslation, mockMetadata])
      ;(translationCache.get as jest.Mock).mockReturnValueOnce(null)

      const result = await service.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'es',
        qualityTier: 'standard'
      })

      expect(result).toEqual(expect.objectContaining({
        translatedText: 'Hola mundo',
        sourceLang: 'en',
        targetLang: 'es',
        confidence: expect.any(Number),
        qualityScore: expect.any(Number),
        timestamp: expect.any(String),
      }))

      expect(mockTranslate.translate).toHaveBeenCalledWith('Hello world', {
        from: 'en',
        to: 'es',
        format: 'text',
        model: 'base',
      })
    })

    it('should return cached translation when available', async () => {
      const cachedResult = {
        translatedText: 'Cached translation',
        sourceLang: 'en',
        targetLang: 'es',
        confidence: 0.95,
        qualityScore: 0.90,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      ;(translationCache.get as jest.Mock).mockReturnValueOnce(cachedResult)

      const result = await service.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'es',
      })

      expect(result.translatedText).toBe('Cached translation')
      expect(result.timestamp).not.toBe(cachedResult.timestamp) // Should update timestamp
      expect(mockTranslate.translate).not.toHaveBeenCalled()
    })

    it('should handle auto language detection', async () => {
      const mockTranslation = 'Bonjour le monde'
      const mockMetadata = { detectedSourceLanguage: 'en' }
      
      mockTranslate.translate.mockResolvedValueOnce([mockTranslation, mockMetadata])

      const result = await service.translateText({
        text: 'Hello world',
        sourceLang: 'auto',
        targetLang: 'fr',
      })

      expect(result.sourceLang).toBe('en')
      expect(mockTranslate.translate).toHaveBeenCalledWith('Hello world', {
        from: undefined, // Auto detection
        to: 'fr',
        format: 'text',
        model: 'base',
      })
    })

    it('should use correct model for different quality tiers', async () => {
      const mockTranslation = 'Test'
      const mockMetadata = {}
      
      mockTranslate.translate.mockResolvedValue([mockTranslation, mockMetadata])

      // Test enterprise tier
      await service.translateText({
        text: 'Test',
        sourceLang: 'en',
        targetLang: 'es',
        qualityTier: 'enterprise'
      })

      expect(mockTranslate.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'nmt' })
      )

      // Test free tier
      await service.translateText({
        text: 'Test',
        sourceLang: 'en',
        targetLang: 'es',
        qualityTier: 'free'
      })

      expect(mockTranslate.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'base' })
      )
    })

    it('should handle translation errors gracefully', async () => {
      mockTranslate.translate.mockRejectedValueOnce(new Error('Translation API error'))

      await expect(service.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'es',
      })).rejects.toThrow('Translation failed: Translation API error')
    })

    it('should cache translation results', async () => {
      const mockTranslation = 'Hola mundo'
      const mockMetadata = { detectedSourceLanguage: 'en' }
      
      mockTranslate.translate.mockResolvedValueOnce([mockTranslation, mockMetadata])
      ;(translationCache.get as jest.Mock).mockReturnValueOnce(null)

      await service.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'es',
        qualityTier: 'standard'
      })

      expect(translationCache.set).toHaveBeenCalledWith(
        'Hello world',
        'en',
        'es',
        'standard',
        expect.objectContaining({
          translatedText: 'Hola mundo',
          sourceLang: 'en',
          targetLang: 'es',
        })
      )
    })

    it('should handle array translation results', async () => {
      const mockTranslation = ['Hola mundo', 'Another translation']
      const mockMetadata = {}
      
      mockTranslate.translate.mockResolvedValueOnce([mockTranslation, mockMetadata])
      ;(translationCache.get as jest.Mock).mockReturnValueOnce(null)

      const result = await service.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'es',
      })

      expect(result.translatedText).toBe('Hola mundo') // Should take first result
    })
  })

  describe('detectLanguage', () => {
    it('should detect language successfully', async () => {
      mockTranslate.detect.mockResolvedValueOnce([{ language: 'en', confidence: 0.99 }])

      const result = await service.detectLanguage('Hello world')

      expect(result).toBe('en')
      expect(mockTranslate.detect).toHaveBeenCalledWith('Hello world')
    })

    it('should handle array detection results', async () => {
      mockTranslate.detect.mockResolvedValueOnce([
        [{ language: 'en', confidence: 0.99 }, { language: 'es', confidence: 0.01 }]
      ])

      const result = await service.detectLanguage('Hello world')

      expect(result).toBe('en') // Should take first result
    })

    it('should handle detection errors gracefully', async () => {
      mockTranslate.detect.mockRejectedValueOnce(new Error('Detection error'))

      const result = await service.detectLanguage('Hello world')

      expect(result).toBe('unknown')
    })
  })

  describe('getSupportedLanguages', () => {
    it('should return supported languages', async () => {
      const mockLanguages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
      ]

      mockTranslate.getLanguages.mockResolvedValueOnce([mockLanguages])

      const result = await service.getSupportedLanguages()

      expect(result).toEqual(mockLanguages)
      expect(mockTranslate.getLanguages).toHaveBeenCalled()
    })

    it('should return fallback languages on error', async () => {
      mockTranslate.getLanguages.mockRejectedValueOnce(new Error('API error'))

      const result = await service.getSupportedLanguages()

      expect(result).toHaveLength(13) // Should return fallback languages
      expect(result).toContainEqual({ code: 'en', name: 'English' })
      expect(result).toContainEqual({ code: 'vi', name: 'Vietnamese' })
    })
  })

  describe('private methods', () => {
    it('should calculate confidence correctly', () => {
      const confidence = (service as any).calculateConfidence(
        'Hello world',
        'Hola mundo',
        {}
      )

      expect(confidence).toBeGreaterThan(0)
      expect(confidence).toBeLessThanOrEqual(0.99)
    })

    it('should calculate quality score based on tier', () => {
      const freeScore = (service as any).calculateQualityScore('free', 0.9)
      const enterpriseScore = (service as any).calculateQualityScore('enterprise', 0.9)

      expect(freeScore).toBeLessThan(enterpriseScore)
      expect(freeScore).toBe(0.63) // 0.9 * 0.7
      expect(enterpriseScore).toBe(0.89) // 0.9 * 0.99
    })

    it('should calculate text complexity', () => {
      const simpleComplexity = (service as any).calculateTextComplexity('Hello')
      const complexComplexity = (service as any).calculateTextComplexity(
        'This is a very complex sentence with lots of punctuation, symbols @#$%, and technical terms!'
      )

      expect(complexComplexity).toBeGreaterThan(simpleComplexity)
    })

    it('should return correct model for quality tier', () => {
      expect((service as any).getModelForQuality('free')).toBe('base')
      expect((service as any).getModelForQuality('standard')).toBe('base')
      expect((service as any).getModelForQuality('premium')).toBe('nmt')
      expect((service as any).getModelForQuality('enterprise')).toBe('nmt')
    })
  })
})

describe('translationService singleton', () => {
  it('should export a singleton instance', () => {
    expect(translationService).toBeInstanceOf(PrismyTranslationService)
    expect(translationService).toBe(translationService) // Same instance
  })
})