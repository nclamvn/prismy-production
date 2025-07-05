/**
 * Unit tests for chunked translation service
 */

import { splitTextIntoChunks, estimateTranslation } from '../chunked-translator'

describe('Chunked Translation Service', () => {
  
  describe('splitTextIntoChunks', () => {
    test('should return single chunk for short text', () => {
      const shortText = 'Hello world. This is a short text.'
      const chunks = splitTextIntoChunks(shortText, 1000)
      
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toBe(shortText)
    })

    test('should split long text into multiple chunks', () => {
      const longText = Array(100).fill('This is a sentence that will be repeated many times to create a long text. ').join('')
      const chunks = splitTextIntoChunks(longText, 500)
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.every(chunk => chunk.length > 0)).toBe(true)
    })

    test('should respect sentence boundaries when splitting', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.'
      const chunks = splitTextIntoChunks(text, 50) // Force splitting
      
      // Each chunk should end with a complete sentence (ending with period)
      chunks.forEach(chunk => {
        if (chunk !== chunks[chunks.length - 1]) { // except possibly the last chunk
          expect(chunk.trim()).toMatch(/\.$/)
        }
      })
    })

    test('should handle text with no sentence boundaries', () => {
      const text = Array(50).fill('word').join(' ') // Create very long text without sentence boundaries
      const chunks = splitTextIntoChunks(text, 50) // Force splitting by words
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.join(' ')).toContain('word')
    })

    test('should handle empty text', () => {
      const chunks = splitTextIntoChunks('', 1000)
      expect(chunks).toHaveLength(0)
    })

    test('should handle text with only whitespace', () => {
      const chunks = splitTextIntoChunks('   \n\t  ', 1000)
      expect(chunks).toHaveLength(0)
    })
  })

  describe('estimateTranslation', () => {
    test('should estimate tokens for English text', () => {
      const text = 'Hello world, this is a test text for token estimation.'
      const estimate = estimateTranslation(text)
      
      expect(estimate.estimatedTokens).toBeGreaterThan(0)
      expect(estimate.estimatedChunks).toBe(1) // Short text = 1 chunk
      expect(estimate.estimatedCostUSD).toBeGreaterThan(0)
      expect(estimate.estimatedTimeMinutes).toBeGreaterThan(0)
    })

    test('should estimate multiple chunks for long text', () => {
      const longText = Array(200).fill('This is a long sentence that will create a text requiring multiple chunks. ').join('')
      const estimate = estimateTranslation(longText, { maxTokensPerChunk: 500 })
      
      expect(estimate.estimatedChunks).toBeGreaterThan(1)
      expect(estimate.estimatedTimeMinutes).toBeGreaterThan(0.1)
    })

    test('should estimate different costs for different models', () => {
      const text = Array(200).fill('Test text for cost estimation with more content to exceed minimum cost. ').join('')
      
      const gptEstimate = estimateTranslation(text, { model: 'gpt-4o' })
      const claudeEstimate = estimateTranslation(text, { model: 'claude-3-haiku-20240307' })
      
      expect(gptEstimate.estimatedCostUSD).toBeGreaterThan(claudeEstimate.estimatedCostUSD)
    })

    test('should handle Vietnamese text correctly', () => {
      const vietnameseText = 'Xin chào, đây là văn bản tiếng Việt để kiểm tra việc ước lượng token.'
      const estimate = estimateTranslation(vietnameseText)
      
      expect(estimate.estimatedTokens).toBeGreaterThan(0)
      expect(estimate.estimatedChunks).toBe(1)
    })
  })

  describe('edge cases', () => {
    test('should handle special characters and emojis', () => {
      const text = 'Hello 🌍! This text has émojis and speçial çharäcters. 中文 日本語 한국어'
      const chunks = splitTextIntoChunks(text, 1000)
      
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toContain('🌍')
      expect(chunks[0]).toContain('中文')
    })

    test('should handle text with various punctuation', () => {
      const text = 'Question? Answer! Statement. Ellipsis... Colon: semicolon; dash-hyphen, comma.'
      const chunks = splitTextIntoChunks(text, 1000)
      
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toBe(text)
    })

    test('should handle very small token limits', () => {
      const text = 'This is a test.'
      const chunks = splitTextIntoChunks(text, 1) // Extremely small limit
      
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.join(' ')).toContain('This')
    })
  })

  describe('MVP requirement tests', () => {
    test('should handle typical document translation scenario', () => {
      const documentText = `
        Document Title
        
        This is the first paragraph of a typical document that needs to be translated.
        It contains multiple sentences and should be handled properly by the chunking algorithm.
        
        This is the second paragraph. It also contains multiple sentences.
        The algorithm should maintain paragraph structure when possible.
        
        Conclusion paragraph with final thoughts.
      `.trim()
      
      const estimate = estimateTranslation(documentText)
      expect(estimate.estimatedTokens).toBeGreaterThan(50)
      expect(estimate.estimatedChunks).toBeGreaterThanOrEqual(1)
      
      const chunks = splitTextIntoChunks(documentText, 2000)
      expect(chunks.length).toBeGreaterThanOrEqual(1)
      expect(chunks.join(' ')).toContain('Document Title')
      expect(chunks.join(' ')).toContain('Conclusion paragraph')
    })

    test('should provide reasonable cost estimates', () => {
      const text = Array(100).fill('This is a sentence. ').join('')
      const estimate = estimateTranslation(text, { model: 'gpt-4o' })
      
      // Cost should be reasonable (not zero, not extremely high)
      expect(estimate.estimatedCostUSD).toBeGreaterThan(0)
      expect(estimate.estimatedCostUSD).toBeLessThan(1) // Should be less than $1 for test text
    })
  })
})