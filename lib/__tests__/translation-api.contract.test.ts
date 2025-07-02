/**
 * Translation Service API Contract Tests
 * Tests actual translation-service.ts with MSW mocked Google Translate API
 */

import { translationService } from '../translation-service'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'

// Mock Google Translate API responses
const googleTranslateHandlers = [
  http.post(
    'https://translation.googleapis.com/language/translate/v2',
    async ({ request }) => {
      const url = new URL(request.url)
      const body = await request.text()

      // Parse the form data (Google Translate uses form encoding)
      const params = new URLSearchParams(body)
      const q = params.get('q')
      const target = params.get('target')
      const source = params.get('source')

      if (!q || !target) {
        return HttpResponse.json(
          { error: { message: 'Missing required parameters' } },
          { status: 400 }
        )
      }

      // Mock translation response
      return HttpResponse.json({
        data: {
          translations: [
            {
              translatedText: `[${target}] ${q}`,
              detectedSourceLanguage: source || 'en',
            },
          ],
        },
      })
    }
  ),

  http.post(
    'https://translation.googleapis.com/language/translate/v2/detect',
    async ({ request }) => {
      const body = await request.text()
      const params = new URLSearchParams(body)
      const q = params.get('q')

      if (!q) {
        return HttpResponse.json(
          { error: { message: 'Missing text parameter' } },
          { status: 400 }
        )
      }

      return HttpResponse.json({
        data: {
          detections: [
            [
              {
                language: 'en',
                confidence: 0.98,
                isReliable: true,
              },
            ],
          ],
        },
      })
    }
  ),

  http.get(
    'https://translation.googleapis.com/language/translate/v2/languages',
    () => {
      return HttpResponse.json({
        data: {
          languages: [
            { language: 'en', name: 'English' },
            { language: 'vi', name: 'Vietnamese' },
            { language: 'fr', name: 'French' },
            { language: 'es', name: 'Spanish' },
            { language: 'de', name: 'German' },
            { language: 'ja', name: 'Japanese' },
            { language: 'ko', name: 'Korean' },
            { language: 'zh', name: 'Chinese' },
          ],
        },
      })
    }
  ),
]

describe('Translation Service API Contract Tests', () => {
  beforeAll(() => {
    // Add Google Translate API handlers
    server.use(...googleTranslateHandlers)
  })

  describe('translateText', () => {
    it('should return translation with expected contract', async () => {
      const result = await translationService.translateText({
        text: 'Hello world',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      // Validate response contract
      expect(result).toMatchObject({
        translatedText: expect.any(String),
        sourceLang: 'en',
        targetLang: 'vi',
        confidence: expect.any(Number),
        qualityScore: expect.any(Number),
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        ),
        cached: expect.any(Boolean),
      })

      // Validate value ranges
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.qualityScore).toBeGreaterThan(0)
      expect(result.qualityScore).toBeLessThanOrEqual(1)
    })

    it('should handle auto language detection', async () => {
      const result = await translationService.translateText({
        text: 'Bonjour le monde',
        sourceLang: 'auto',
        targetLang: 'en',
        qualityTier: 'standard',
      })

      expect(result).toHaveProperty('detectedSourceLanguage')
      expect(result.sourceLang).toBe('en') // Mocked to always detect 'en'
    })

    it('should use correct quality tier models', async () => {
      const premiumResult = await translationService.translateText({
        text: 'Test',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'premium',
      })

      const freeResult = await translationService.translateText({
        text: 'Test',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'free',
      })

      // Premium should have higher quality score
      expect(premiumResult.qualityScore).toBeGreaterThan(
        freeResult.qualityScore
      )
    })

    it('should handle translation API errors gracefully', async () => {
      server.use(
        http.post(
          'https://translation.googleapis.com/language/translate/v2',
          () => {
            return HttpResponse.json(
              { error: { message: 'API quota exceeded' } },
              { status: 403 }
            )
          }
        )
      )

      await expect(
        translationService.translateText({
          text: 'Hello',
          sourceLang: 'en',
          targetLang: 'vi',
        })
      ).rejects.toThrow('Translation failed')
    })

    it('should respect A/B test cache variants', async () => {
      // Test with cache disabled
      const noCacheResult = await translationService.translateText({
        text: 'Cache test',
        sourceLang: 'en',
        targetLang: 'vi',
        abTestVariant: 'cache_disabled',
      })

      expect(noCacheResult.cached).toBe(false)

      // Same request with cache enabled should still not be cached (first request)
      const cacheEnabledResult = await translationService.translateText({
        text: 'Cache test',
        sourceLang: 'en',
        targetLang: 'vi',
        abTestVariant: 'cache_enabled',
      })

      expect(cacheEnabledResult.cached).toBe(false)
    })
  })

  describe('detectLanguage', () => {
    it('should detect language with confidence', async () => {
      const result = await translationService.detectLanguage('Hello world')

      expect(result).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
    })

    it('should handle detection errors', async () => {
      server.use(
        http.post(
          'https://translation.googleapis.com/language/translate/v2/detect',
          () => {
            return HttpResponse.json(
              { error: { message: 'Invalid request' } },
              { status: 400 }
            )
          }
        )
      )

      const result = await translationService.detectLanguage('Test')
      expect(result).toBe('unknown')
    })
  })

  describe('getSupportedLanguages', () => {
    it('should return formatted language list', async () => {
      const languages = await translationService.getSupportedLanguages()

      expect(Array.isArray(languages)).toBe(true)
      expect(languages.length).toBeGreaterThan(0)

      // Validate each language object
      languages.forEach(lang => {
        expect(lang).toMatchObject({
          code: expect.stringMatching(/^[a-z]{2}(-[A-Z]{2})?$/),
          name: expect.any(String),
        })
      })

      // Check for expected languages
      const codes = languages.map(l => l.code)
      expect(codes).toContain('en')
      expect(codes).toContain('vi')
    })

    it('should return fallback languages on API error', async () => {
      server.use(
        http.get(
          'https://translation.googleapis.com/language/translate/v2/languages',
          () => {
            return HttpResponse.json(
              { error: { message: 'Service unavailable' } },
              { status: 503 }
            )
          }
        )
      )

      const languages = await translationService.getSupportedLanguages()

      // Should return fallback languages
      expect(languages.length).toBe(13)
      expect(languages[0].code).toBe('en')
      expect(languages.find(l => l.code === 'vi')).toBeDefined()
    })
  })

  describe('Quality and Confidence Calculations', () => {
    it('should calculate appropriate confidence for text complexity', async () => {
      const simpleResult = await translationService.translateText({
        text: 'Hello',
        sourceLang: 'en',
        targetLang: 'vi',
      })

      const complexResult = await translationService.translateText({
        text: 'The quick brown fox jumps over the lazy dog while contemplating quantum physics.',
        sourceLang: 'en',
        targetLang: 'vi',
      })

      // Simple text should have higher confidence
      expect(simpleResult.confidence).toBeGreaterThan(0.8)
      expect(complexResult.confidence).toBeLessThan(simpleResult.confidence)
    })

    it('should apply quality tier multipliers correctly', async () => {
      const tiers = ['free', 'standard', 'premium', 'enterprise'] as const
      const results = await Promise.all(
        tiers.map(tier =>
          translationService.translateText({
            text: 'Test',
            sourceLang: 'en',
            targetLang: 'vi',
            qualityTier: tier,
          })
        )
      )

      // Quality scores should increase with tier
      for (let i = 1; i < results.length; i++) {
        expect(results[i].qualityScore).toBeGreaterThanOrEqual(
          results[i - 1].qualityScore
        )
      }
    })
  })

  describe('Rate Limiting and Error Recovery', () => {
    it('should handle rate limit errors', async () => {
      server.use(
        http.post(
          'https://translation.googleapis.com/language/translate/v2',
          () => {
            return HttpResponse.json(
              {
                error: {
                  message: 'Rate limit exceeded',
                  code: 429,
                },
              },
              { status: 429 }
            )
          }
        )
      )

      await expect(
        translationService.translateText({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'vi',
        })
      ).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      server.use(
        http.post(
          'https://translation.googleapis.com/language/translate/v2',
          () => {
            return HttpResponse.error()
          }
        )
      )

      await expect(
        translationService.translateText({
          text: 'Test',
          sourceLang: 'en',
          targetLang: 'vi',
        })
      ).rejects.toThrow()
    })
  })
})
