/**
 * Chunked Translation Service Test Suite
 * Target: 90% coverage for chunked translation
 */

// Mock environment variables
const originalEnv = process.env
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    GOOGLE_TRANSLATE_API_KEY: 'test-api-key',
  }
})

afterAll(() => {
  process.env = originalEnv
})

// Mock translation service
jest.mock('../translation-service', () => ({
  translationService: {
    translateText: jest.fn(),
  },
}))

describe('Chunked Translation Service', () => {
  let chunkedTranslationService: any
  let mockTranslationService: any

  beforeAll(() => {
    const translationModule = require('../translation-service')
    mockTranslationService = translationModule.translationService

    const chunkedModule = require('../chunked-translation-service')
    chunkedTranslationService = chunkedModule.chunkedTranslationService
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Text Chunking', () => {
    it('should split text into appropriate chunks', () => {
      const text = 'A'.repeat(5000)
      const chunks = chunkedTranslationService.chunkText(text, 1000, 100)

      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks[0].length).toBeLessThanOrEqual(1000)
    })

    it('should handle overlap between chunks', () => {
      const text =
        'Word1 Word2 Word3 Word4 Word5 Word6 Word7 Word8 Word9 Word10'
      const chunks = chunkedTranslationService.chunkText(text, 30, 10)

      expect(chunks.length).toBeGreaterThan(1)
      // Should have some overlap between consecutive chunks
      expect(chunks[1]).toContain('Word')
    })

    it('should respect sentence boundaries', () => {
      const text =
        'First sentence. Second sentence. Third sentence. Fourth sentence.'
      const chunks = chunkedTranslationService.chunkText(text, 30, 0)

      // Should try to break at sentence boundaries
      chunks.forEach(chunk => {
        if (chunk.includes('.') && chunk.length > 20) {
          expect(chunk.trim().endsWith('.')).toBe(true)
        }
      })
    })

    it('should handle text shorter than chunk size', () => {
      const text = 'Short text'
      const chunks = chunkedTranslationService.chunkText(text, 1000, 100)

      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toBe(text)
    })

    it('should handle empty text', () => {
      const chunks = chunkedTranslationService.chunkText('', 1000, 100)

      expect(chunks).toHaveLength(0)
    })
  })

  describe('Optimal Chunking Settings', () => {
    it('should return appropriate settings for short text', () => {
      const settings = chunkedTranslationService.getOptimalChunkingSettings(
        'Short text',
        'vi'
      )

      expect(settings.chunkSize).toBeGreaterThan(0)
      expect(settings.overlap).toBeGreaterThanOrEqual(0)
      expect(settings.preserveFormatting).toBeDefined()
    })

    it('should return appropriate settings for long text', () => {
      const longText = 'A'.repeat(10000)
      const settings = chunkedTranslationService.getOptimalChunkingSettings(
        longText,
        'vi'
      )

      expect(settings.chunkSize).toBeGreaterThan(0)
      expect(settings.overlap).toBeGreaterThan(0)
    })

    it('should consider target language characteristics', () => {
      const text = 'Test text for language-specific chunking'

      const enSettings = chunkedTranslationService.getOptimalChunkingSettings(
        text,
        'en'
      )
      const zhSettings = chunkedTranslationService.getOptimalChunkingSettings(
        text,
        'zh'
      )
      const viSettings = chunkedTranslationService.getOptimalChunkingSettings(
        text,
        'vi'
      )

      expect(enSettings).toBeDefined()
      expect(zhSettings).toBeDefined()
      expect(viSettings).toBeDefined()
    })

    it('should handle HTML content', () => {
      const htmlText = '<p>Paragraph 1</p><p>Paragraph 2</p><div>Content</div>'
      const settings = chunkedTranslationService.getOptimalChunkingSettings(
        htmlText,
        'vi'
      )

      expect(settings.preserveFormatting).toBe(true)
      expect(settings.chunkSize).toBeGreaterThan(0)
    })

    it('should handle code content', () => {
      const codeText = 'function test() { return "code"; }'
      const settings = chunkedTranslationService.getOptimalChunkingSettings(
        codeText,
        'vi'
      )

      expect(settings.preserveFormatting).toBe(true)
    })
  })

  describe('Large Text Translation', () => {
    it('should translate large text successfully', async () => {
      const largeText =
        'Paragraph 1. '.repeat(100) + 'Paragraph 2. '.repeat(100)

      mockTranslationService.translateText
        .mockResolvedValueOnce({
          translatedText: 'Đoạn 1. '.repeat(100),
          detectedSourceLanguage: 'en',
          confidence: 0.95,
          qualityScore: 0.9,
        })
        .mockResolvedValueOnce({
          translatedText: 'Đoạn 2. '.repeat(100),
          detectedSourceLanguage: 'en',
          confidence: 0.95,
          qualityScore: 0.9,
        })

      const result = await chunkedTranslationService.translateLargeText({
        text: largeText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 1000,
          overlap: 100,
          preserveFormatting: false,
        },
      })

      expect(result.translatedText).toContain('Đoạn')
      expect(result.detectedSourceLanguage).toBe('en')
      expect(mockTranslationService.translateText).toHaveBeenCalledTimes(2)
    })

    it('should handle progress tracking', async () => {
      const largeText = 'Text chunk. '.repeat(200)
      const progressCallback = jest.fn()

      mockTranslationService.translateText
        .mockResolvedValueOnce({
          translatedText: 'Translated chunk 1',
          detectedSourceLanguage: 'en',
        })
        .mockResolvedValueOnce({
          translatedText: 'Translated chunk 2',
          detectedSourceLanguage: 'en',
        })

      await chunkedTranslationService.translateLargeText({
        text: largeText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 500,
          overlap: 50,
          preserveFormatting: false,
        },
        onProgress: progressCallback,
      })

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          completedChunks: expect.any(Number),
          totalChunks: expect.any(Number),
          percentage: expect.any(Number),
          estimatedTimeRemaining: expect.any(Number),
        })
      )
    })

    it('should handle chunk translation failures', async () => {
      const largeText = 'Text chunk. '.repeat(100)

      mockTranslationService.translateText
        .mockResolvedValueOnce({
          translatedText: 'Translated chunk 1',
          detectedSourceLanguage: 'en',
        })
        .mockRejectedValueOnce(new Error('Translation failed'))

      await expect(
        chunkedTranslationService.translateLargeText({
          text: largeText,
          sourceLang: 'en',
          targetLang: 'vi',
          qualityTier: 'standard',
          chunkingOptions: {
            chunkSize: 500,
            overlap: 50,
            preserveFormatting: false,
          },
        })
      ).rejects.toThrow('Chunked translation failed')
    })

    it('should preserve formatting when requested', async () => {
      const htmlText = '<p>Paragraph 1</p><p>Paragraph 2</p>'

      mockTranslationService.translateText.mockResolvedValue({
        translatedText: '<p>Đoạn văn đã dịch</p>',
        detectedSourceLanguage: 'en',
      })

      const result = await chunkedTranslationService.translateLargeText({
        text: htmlText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 1000,
          overlap: 100,
          preserveFormatting: true,
        },
      })

      expect(result.translatedText).toContain('<p>')
      expect(result.translatedText).toContain('</p>')
    })

    it('should handle empty chunks gracefully', async () => {
      const result = await chunkedTranslationService.translateLargeText({
        text: '',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 1000,
          overlap: 100,
          preserveFormatting: false,
        },
      })

      expect(result.translatedText).toBe('')
      expect(mockTranslationService.translateText).not.toHaveBeenCalled()
    })
  })

  describe('Chunk Merging', () => {
    it('should merge translated chunks correctly', () => {
      const chunks = [
        { translatedText: 'First chunk', metadata: { index: 0 } },
        { translatedText: 'Second chunk', metadata: { index: 1 } },
        { translatedText: 'Third chunk', metadata: { index: 2 } },
      ]

      const merged = chunkedTranslationService.mergeTranslatedChunks(chunks, {
        chunkSize: 1000,
        overlap: 100,
        preserveFormatting: false,
      })

      expect(merged).toContain('First chunk')
      expect(merged).toContain('Second chunk')
      expect(merged).toContain('Third chunk')
    })

    it('should handle overlap removal when merging', () => {
      const chunks = [
        { translatedText: 'First part shared', metadata: { index: 0 } },
        { translatedText: 'shared Second part', metadata: { index: 1 } },
      ]

      const merged = chunkedTranslationService.mergeTranslatedChunks(chunks, {
        chunkSize: 1000,
        overlap: 6, // 'shared' is 6 characters
        preserveFormatting: false,
      })

      // Should not duplicate 'shared'
      const sharedOccurrences = (merged.match(/shared/g) || []).length
      expect(sharedOccurrences).toBeLessThanOrEqual(1)
    })

    it('should preserve formatting during merge', () => {
      const chunks = [
        { translatedText: '<p>First paragraph</p>', metadata: { index: 0 } },
        { translatedText: '<p>Second paragraph</p>', metadata: { index: 1 } },
      ]

      const merged = chunkedTranslationService.mergeTranslatedChunks(chunks, {
        chunkSize: 1000,
        overlap: 0,
        preserveFormatting: true,
      })

      expect(merged).toContain('<p>First paragraph</p>')
      expect(merged).toContain('<p>Second paragraph</p>')
    })

    it('should handle empty chunks in merge', () => {
      const chunks = [
        { translatedText: 'First chunk', metadata: { index: 0 } },
        { translatedText: '', metadata: { index: 1 } },
        { translatedText: 'Third chunk', metadata: { index: 2 } },
      ]

      const merged = chunkedTranslationService.mergeTranslatedChunks(chunks, {
        chunkSize: 1000,
        overlap: 0,
        preserveFormatting: false,
      })

      expect(merged).toContain('First chunk')
      expect(merged).toContain('Third chunk')
      expect(merged).not.toMatch(/\s{2,}/) // No double spaces
    })
  })

  describe('Quality Assessment', () => {
    it('should calculate overall quality score', () => {
      const chunkResults = [
        { qualityScore: 0.9, confidence: 0.95 },
        { qualityScore: 0.85, confidence: 0.9 },
        { qualityScore: 0.88, confidence: 0.92 },
      ]

      const overallScore =
        chunkedTranslationService.calculateOverallQuality(chunkResults)

      expect(overallScore).toBeGreaterThan(0.8)
      expect(overallScore).toBeLessThanOrEqual(1.0)
    })

    it('should handle single chunk quality', () => {
      const chunkResults = [{ qualityScore: 0.9, confidence: 0.95 }]

      const overallScore =
        chunkedTranslationService.calculateOverallQuality(chunkResults)

      expect(overallScore).toBeCloseTo(0.9, 2)
    })

    it('should handle empty results', () => {
      const overallScore = chunkedTranslationService.calculateOverallQuality([])

      expect(overallScore).toBe(0)
    })

    it('should weight quality by chunk size', () => {
      const chunkResults = [
        { qualityScore: 0.9, confidence: 0.95, chunkSize: 1000 },
        { qualityScore: 0.5, confidence: 0.6, chunkSize: 100 },
      ]

      const overallScore =
        chunkedTranslationService.calculateOverallQuality(chunkResults)

      // Should be closer to 0.9 since that chunk is much larger
      expect(overallScore).toBeGreaterThan(0.8)
    })
  })

  describe('Error Recovery', () => {
    it('should retry failed chunks', async () => {
      const largeText = 'Test chunk. '.repeat(50)

      mockTranslationService.translateText
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          translatedText: 'Translated after retry',
          detectedSourceLanguage: 'en',
        })

      const result = await chunkedTranslationService.translateLargeText({
        text: largeText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 1000,
          overlap: 100,
          preserveFormatting: false,
        },
        maxRetries: 1,
      })

      expect(result.translatedText).toBe('Translated after retry')
      expect(mockTranslationService.translateText).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      const largeText = 'Test chunk. '.repeat(50)

      mockTranslationService.translateText.mockRejectedValue(
        new Error('Persistent failure')
      )

      await expect(
        chunkedTranslationService.translateLargeText({
          text: largeText,
          sourceLang: 'en',
          targetLang: 'vi',
          qualityTier: 'standard',
          chunkingOptions: {
            chunkSize: 1000,
            overlap: 100,
            preserveFormatting: false,
          },
          maxRetries: 2,
        })
      ).rejects.toThrow('Chunked translation failed')

      expect(mockTranslationService.translateText).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })

  describe('Performance Optimization', () => {
    it('should process chunks in parallel when safe', async () => {
      const largeText =
        'Independent chunk 1. Independent chunk 2. Independent chunk 3.'

      mockTranslationService.translateText.mockImplementation(
        async ({ text }) => ({
          translatedText: `Translated: ${text}`,
          detectedSourceLanguage: 'en',
        })
      )

      const startTime = Date.now()

      await chunkedTranslationService.translateLargeText({
        text: largeText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 20,
          overlap: 0,
          preserveFormatting: false,
        },
        parallelProcessing: true,
      })

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Parallel processing should be faster than sequential
      expect(processingTime).toBeLessThan(1000)
    })

    it('should process chunks sequentially when overlap exists', async () => {
      const largeText = 'Chunk with overlap. Overlap continues here.'

      mockTranslationService.translateText.mockImplementation(
        async ({ text }) => ({
          translatedText: `Translated: ${text}`,
          detectedSourceLanguage: 'en',
        })
      )

      await chunkedTranslationService.translateLargeText({
        text: largeText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 20,
          overlap: 5,
          preserveFormatting: false,
        },
        parallelProcessing: true,
      })

      // Should still work correctly even with overlap
      expect(mockTranslationService.translateText).toHaveBeenCalled()
    })
  })

  describe('Memory Management', () => {
    it('should handle very large texts without memory issues', async () => {
      const veryLargeText = 'Large text chunk. '.repeat(10000) // ~180KB

      mockTranslationService.translateText.mockImplementation(
        async ({ text }) => ({
          translatedText: text.replace(/Large/g, 'Lớn'),
          detectedSourceLanguage: 'en',
        })
      )

      const result = await chunkedTranslationService.translateLargeText({
        text: veryLargeText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 2000,
          overlap: 100,
          preserveFormatting: false,
        },
      })

      expect(result.translatedText).toContain('Lớn')
      expect(result.translatedText.length).toBeGreaterThan(100000)
    })

    it('should clean up resources after processing', async () => {
      const largeText = 'Test cleanup. '.repeat(100)

      mockTranslationService.translateText.mockResolvedValue({
        translatedText: 'Cleaned up translation',
        detectedSourceLanguage: 'en',
      })

      await chunkedTranslationService.translateLargeText({
        text: largeText,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
        chunkingOptions: {
          chunkSize: 1000,
          overlap: 100,
          preserveFormatting: false,
        },
      })

      // After processing, internal state should be clean
      expect(chunkedTranslationService.getActiveChunks()).toHaveLength(0)
    })
  })
})
