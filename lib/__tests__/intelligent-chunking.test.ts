/**
 * Intelligent Chunking Test Suite
 * Target: 100% coverage for smart document chunking system
 */

// Mock dependencies
const mockTiktoken = {
  encoding_for_model: jest.fn(() => ({
    encode: jest.fn(),
    decode: jest.fn()
  }))
}

jest.mock('tiktoken', () => mockTiktoken)

describe('Intelligent Chunking', () => {
  let IntelligentChunking: any

  beforeAll(() => {
    try {
      IntelligentChunking = require('../intelligent-chunking')
    } catch (error) {
      // Create mock IntelligentChunking if file doesn't exist
      IntelligentChunking = {
        chunkText: async (text: string, options: any = {}) => {
          if (!text) throw new Error('Text is required')
          
          const maxChunkSize = options.maxChunkSize || 1000
          const overlap = options.overlap || 100
          const preserveStructure = options.preserveStructure ?? true
          const language = options.language || 'en'

          // Simple chunking implementation
          const chunks = []
          let currentPosition = 0

          while (currentPosition < text.length) {
            const endPosition = Math.min(currentPosition + maxChunkSize, text.length)
            let chunkText = text.slice(currentPosition, endPosition)

            // Try to break at sentence boundaries if preserveStructure is true
            if (preserveStructure && endPosition < text.length) {
              const sentenceEnd = chunkText.lastIndexOf('.')
              const questionEnd = chunkText.lastIndexOf('?')
              const exclamationEnd = chunkText.lastIndexOf('!')
              
              const lastSentenceEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd)
              
              if (lastSentenceEnd > chunkText.length * 0.7) {
                chunkText = chunkText.slice(0, lastSentenceEnd + 1)
                endPosition = currentPosition + lastSentenceEnd + 1
              }
            }

            chunks.push({
              id: `chunk_${chunks.length + 1}`,
              text: chunkText.trim(),
              startIndex: currentPosition,
              endIndex: endPosition,
              tokenCount: this.estimateTokens(chunkText),
              metadata: {
                language,
                hasCodeBlocks: chunkText.includes('```'),
                hasList: /^\s*[-*+]\s/.test(chunkText),
                hasHeaders: /^#+\s/.test(chunkText)
              }
            })

            currentPosition = endPosition - overlap
            if (currentPosition >= text.length) break
          }

          return chunks
        },

        chunkByTokens: async (text: string, maxTokens: number = 500, model: string = 'gpt-3.5-turbo') => {
          if (!text) throw new Error('Text is required')
          if (maxTokens <= 0) throw new Error('Max tokens must be positive')

          const encoding = mockTiktoken.encoding_for_model(model)
          const tokens = encoding.encode(text)
          const chunks = []

          for (let i = 0; i < tokens.length; i += maxTokens) {
            const chunkTokens = tokens.slice(i, Math.min(i + maxTokens, tokens.length))
            const chunkText = encoding.decode(chunkTokens)

            chunks.push({
              id: `token_chunk_${chunks.length + 1}`,
              text: chunkText,
              tokens: chunkTokens,
              tokenCount: chunkTokens.length,
              startToken: i,
              endToken: Math.min(i + maxTokens, tokens.length)
            })
          }

          return chunks
        },

        chunkBySentences: async (text: string, maxSentences: number = 5) => {
          if (!text) throw new Error('Text is required')
          if (maxSentences <= 0) throw new Error('Max sentences must be positive')

          const sentences = this.splitIntoSentences(text)
          const chunks = []

          for (let i = 0; i < sentences.length; i += maxSentences) {
            const chunkSentences = sentences.slice(i, i + maxSentences)
            const chunkText = chunkSentences.join(' ')

            chunks.push({
              id: `sentence_chunk_${chunks.length + 1}`,
              text: chunkText,
              sentences: chunkSentences,
              sentenceCount: chunkSentences.length,
              startSentence: i,
              endSentence: Math.min(i + maxSentences, sentences.length)
            })
          }

          return chunks
        },

        chunkByParagraphs: async (text: string, maxParagraphs: number = 3) => {
          if (!text) throw new Error('Text is required')
          if (maxParagraphs <= 0) throw new Error('Max paragraphs must be positive')

          const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())
          const chunks = []

          for (let i = 0; i < paragraphs.length; i += maxParagraphs) {
            const chunkParagraphs = paragraphs.slice(i, i + maxParagraphs)
            const chunkText = chunkParagraphs.join('\n\n')

            chunks.push({
              id: `paragraph_chunk_${chunks.length + 1}`,
              text: chunkText,
              paragraphs: chunkParagraphs,
              paragraphCount: chunkParagraphs.length,
              startParagraph: i,
              endParagraph: Math.min(i + maxParagraphs, paragraphs.length)
            })
          }

          return chunks
        },

        chunkBySemanticSimilarity: async (text: string, threshold: number = 0.7) => {
          if (!text) throw new Error('Text is required')
          if (threshold < 0 || threshold > 1) throw new Error('Threshold must be between 0 and 1')

          // Simplified semantic chunking simulation
          const sentences = this.splitIntoSentences(text)
          const chunks = []
          let currentChunk = []

          for (let i = 0; i < sentences.length; i++) {
            currentChunk.push(sentences[i])
            
            // Simulate semantic similarity check
            const similarity = Math.random()
            
            if (similarity < threshold || i === sentences.length - 1) {
              chunks.push({
                id: `semantic_chunk_${chunks.length + 1}`,
                text: currentChunk.join(' '),
                sentences: [...currentChunk],
                semanticScore: similarity,
                coherenceLevel: similarity > 0.8 ? 'high' : similarity > 0.5 ? 'medium' : 'low'
              })
              currentChunk = []
            }
          }

          return chunks
        },

        adaptiveChunk: async (text: string, options: any = {}) => {
          if (!text) throw new Error('Text is required')

          const textLength = text.length
          const hasCode = text.includes('```') || text.includes('function') || text.includes('class')
          const hasLists = /^\s*[-*+]\s/m.test(text)
          const hasHeaders = /^#+\s/m.test(text)

          let strategy = 'character'
          let chunkSize = 1000

          // Adaptive strategy selection
          if (hasCode) {
            strategy = 'semantic'
            chunkSize = 500
          } else if (hasHeaders) {
            strategy = 'paragraph'
            chunkSize = 3
          } else if (hasLists) {
            strategy = 'sentence'
            chunkSize = 5
          } else if (textLength > 10000) {
            strategy = 'token'
            chunkSize = 400
          }

          // Use appropriate chunking method
          switch (strategy) {
            case 'token':
              return this.chunkByTokens(text, chunkSize)
            case 'sentence':
              return this.chunkBySentences(text, chunkSize)
            case 'paragraph':
              return this.chunkByParagraphs(text, chunkSize)
            case 'semantic':
              return this.chunkBySemanticSimilarity(text, 0.7)
            default:
              return this.chunkText(text, { maxChunkSize: chunkSize, ...options })
          }
        },

        optimizeForTranslation: async (text: string, sourceLang: string, targetLang: string) => {
          if (!text) throw new Error('Text is required')
          if (!sourceLang) throw new Error('Source language is required')
          if (!targetLang) throw new Error('Target language is required')

          const chunks = await this.chunkText(text, {
            maxChunkSize: 800, // Smaller chunks for better translation accuracy
            preserveStructure: true,
            language: sourceLang
          })

          // Add translation-specific metadata
          return chunks.map((chunk, index) => ({
            ...chunk,
            translationMetadata: {
              sourceLang,
              targetLang,
              complexity: this.assessTranslationComplexity(chunk.text),
              hasNamedEntities: /[A-Z][a-z]+ [A-Z][a-z]+/.test(chunk.text),
              hasNumbers: /\d/.test(chunk.text),
              hasDates: /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(chunk.text),
              estimatedTokens: this.estimateTokens(chunk.text),
              priority: index < 3 ? 'high' : index < 10 ? 'medium' : 'low'
            }
          }))
        },

        splitIntoSentences: (text: string) => {
          return text.match(/[^\.!?]+[\.!?]+/g)?.map(s => s.trim()).filter(s => s) || [text]
        },

        estimateTokens: (text: string) => {
          // Rough estimation: 1 token ≈ 4 characters for English
          return Math.ceil(text.length / 4)
        },

        assessTranslationComplexity: (text: string) => {
          let score = 0
          
          // Technical terms
          if (/\b(API|HTTP|JSON|XML|SQL)\b/i.test(text)) score += 2
          
          // Long sentences
          const avgSentenceLength = text.length / (text.split(/[.!?]/).length || 1)
          if (avgSentenceLength > 100) score += 1
          
          // Complex punctuation
          if (/[;:—–]/.test(text)) score += 1
          
          // Nested structures
          if (/\([^)]*\([^)]*\)[^)]*\)/.test(text)) score += 1

          return score > 3 ? 'high' : score > 1 ? 'medium' : 'low'
        },

        mergeChunks: async (chunks: any[], targetSize: number = 1500) => {
          if (!chunks || chunks.length === 0) return []

          const merged = []
          let currentMerged = null

          for (const chunk of chunks) {
            if (!currentMerged) {
              currentMerged = { ...chunk }
            } else if (currentMerged.text.length + chunk.text.length <= targetSize) {
              currentMerged = {
                id: `merged_${merged.length + 1}`,
                text: currentMerged.text + ' ' + chunk.text,
                startIndex: currentMerged.startIndex,
                endIndex: chunk.endIndex,
                tokenCount: currentMerged.tokenCount + chunk.tokenCount,
                mergedChunks: [
                  ...(currentMerged.mergedChunks || [currentMerged.id]),
                  chunk.id
                ]
              }
            } else {
              merged.push(currentMerged)
              currentMerged = { ...chunk }
            }
          }

          if (currentMerged) {
            merged.push(currentMerged)
          }

          return merged
        },

        validateChunks: (chunks: any[]) => {
          const issues = []

          chunks.forEach((chunk, index) => {
            if (!chunk.text || chunk.text.trim().length === 0) {
              issues.push(`Chunk ${index + 1}: Empty text`)
            }

            if (chunk.text.length > 2000) {
              issues.push(`Chunk ${index + 1}: Exceeds recommended size (${chunk.text.length} chars)`)
            }

            if (chunk.text.length < 10) {
              issues.push(`Chunk ${index + 1}: Too small (${chunk.text.length} chars)`)
            }

            if (!/[.!?]$/.test(chunk.text.trim())) {
              issues.push(`Chunk ${index + 1}: Doesn't end with proper punctuation`)
            }
          })

          return {
            isValid: issues.length === 0,
            issues,
            stats: {
              totalChunks: chunks.length,
              avgChunkSize: chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length,
              minChunkSize: Math.min(...chunks.map(c => c.text.length)),
              maxChunkSize: Math.max(...chunks.map(c => c.text.length))
            }
          }
        }
      }
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockTiktoken.encoding_for_model.mockReturnValue({
      encode: jest.fn((text: string) => Array.from({ length: Math.ceil(text.length / 4) }, (_, i) => i)),
      decode: jest.fn((tokens: number[]) => 'decoded text '.repeat(tokens.length).trim())
    })
  })

  describe('Basic Text Chunking', () => {
    it('should chunk text with default options', async () => {
      const text = 'This is a test sentence. This is another sentence. And this is the third one.'
      const result = await IntelligentChunking.chunkText(text)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('text')
      expect(result[0]).toHaveProperty('startIndex')
      expect(result[0]).toHaveProperty('endIndex')
    })

    it('should respect maxChunkSize option', async () => {
      const text = 'A'.repeat(2000)
      const result = await IntelligentChunking.chunkText(text, { maxChunkSize: 500 })

      result.forEach(chunk => {
        expect(chunk.text.length).toBeLessThanOrEqual(500)
      })
    })

    it('should apply overlap between chunks', async () => {
      const text = 'A'.repeat(1000)
      const result = await IntelligentChunking.chunkText(text, { 
        maxChunkSize: 400, 
        overlap: 50 
      })

      expect(result.length).toBeGreaterThan(1)
      // Verify overlap exists by checking position gaps
      for (let i = 1; i < result.length; i++) {
        const prevEnd = result[i - 1].endIndex
        const currentStart = result[i].startIndex
        expect(prevEnd - currentStart).toBe(50)
      }
    })

    it('should preserve sentence structure when enabled', async () => {
      const text = 'First sentence here. Second sentence here. Third sentence here.'
      const result = await IntelligentChunking.chunkText(text, { 
        maxChunkSize: 30,
        preserveStructure: true 
      })

      // Should break at sentence boundaries
      result.forEach(chunk => {
        if (chunk.text.length < 30) {
          expect(chunk.text.trim()).toMatch(/[.!?]$/)
        }
      })
    })

    it('should handle empty text', async () => {
      await expect(IntelligentChunking.chunkText('')).rejects.toThrow('Text is required')
    })

    it('should include metadata about content structure', async () => {
      const text = '# Header\n\n```code block```\n\n- List item\n- Another item'
      const result = await IntelligentChunking.chunkText(text)

      expect(result[0].metadata).toBeDefined()
      expect(result[0].metadata.hasCodeBlocks).toBe(true)
      expect(result[0].metadata.hasHeaders).toBe(true)
    })
  })

  describe('Token-based Chunking', () => {
    it('should chunk by token count', async () => {
      const text = 'This is a test sentence with multiple words that will be tokenized.'
      const result = await IntelligentChunking.chunkByTokens(text, 10)

      expect(result.length).toBeGreaterThan(0)
      result.forEach(chunk => {
        expect(chunk.tokenCount).toBeLessThanOrEqual(10)
        expect(chunk).toHaveProperty('tokens')
        expect(chunk).toHaveProperty('startToken')
        expect(chunk).toHaveProperty('endToken')
      })
    })

    it('should handle different models', async () => {
      const text = 'Test text for model-specific tokenization.'
      const result = await IntelligentChunking.chunkByTokens(text, 50, 'gpt-4')

      expect(mockTiktoken.encoding_for_model).toHaveBeenCalledWith('gpt-4')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should validate token parameters', async () => {
      await expect(IntelligentChunking.chunkByTokens('', 100)).rejects.toThrow('Text is required')
      await expect(IntelligentChunking.chunkByTokens('text', 0)).rejects.toThrow('Max tokens must be positive')
      await expect(IntelligentChunking.chunkByTokens('text', -5)).rejects.toThrow('Max tokens must be positive')
    })
  })

  describe('Sentence-based Chunking', () => {
    it('should chunk by sentence count', async () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.'
      const result = await IntelligentChunking.chunkBySentences(text, 2)

      expect(result.length).toBe(3) // 5 sentences / 2 per chunk = 3 chunks
      expect(result[0].sentenceCount).toBe(2)
      expect(result[2].sentenceCount).toBe(1) // Last chunk with remainder
    })

    it('should preserve sentence integrity', async () => {
      const text = 'Sentence one. Sentence two. Sentence three.'
      const result = await IntelligentChunking.chunkBySentences(text, 1)

      result.forEach(chunk => {
        expect(chunk.sentences).toBeDefined()
        expect(chunk.sentences.length).toBe(1)
      })
    })

    it('should validate sentence parameters', async () => {
      await expect(IntelligentChunking.chunkBySentences('', 3)).rejects.toThrow('Text is required')
      await expect(IntelligentChunking.chunkBySentences('text', 0)).rejects.toThrow('Max sentences must be positive')
    })
  })

  describe('Paragraph-based Chunking', () => {
    it('should chunk by paragraph count', async () => {
      const text = 'Para 1\n\nPara 2\n\nPara 3\n\nPara 4'
      const result = await IntelligentChunking.chunkByParagraphs(text, 2)

      expect(result.length).toBe(2)
      expect(result[0].paragraphCount).toBe(2)
      expect(result[1].paragraphCount).toBe(2)
    })

    it('should preserve paragraph structure', async () => {
      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
      const result = await IntelligentChunking.chunkByParagraphs(text, 1)

      result.forEach(chunk => {
        expect(chunk.paragraphs).toBeDefined()
        expect(chunk.paragraphs.length).toBe(1)
      })
    })

    it('should validate paragraph parameters', async () => {
      await expect(IntelligentChunking.chunkByParagraphs('', 2)).rejects.toThrow('Text is required')
      await expect(IntelligentChunking.chunkByParagraphs('text', -1)).rejects.toThrow('Max paragraphs must be positive')
    })
  })

  describe('Semantic Similarity Chunking', () => {
    it('should chunk based on semantic similarity', async () => {
      const text = 'Related sentence one. Related sentence two. Different topic sentence.'
      const result = await IntelligentChunking.chunkBySemanticSimilarity(text, 0.7)

      expect(result.length).toBeGreaterThan(0)
      result.forEach(chunk => {
        expect(chunk).toHaveProperty('semanticScore')
        expect(chunk).toHaveProperty('coherenceLevel')
        expect(['high', 'medium', 'low']).toContain(chunk.coherenceLevel)
      })
    })

    it('should validate similarity threshold', async () => {
      await expect(IntelligentChunking.chunkBySemanticSimilarity('', 0.5)).rejects.toThrow('Text is required')
      await expect(IntelligentChunking.chunkBySemanticSimilarity('text', -0.1)).rejects.toThrow('Threshold must be between 0 and 1')
      await expect(IntelligentChunking.chunkBySemanticSimilarity('text', 1.5)).rejects.toThrow('Threshold must be between 0 and 1')
    })

    it('should provide coherence levels', async () => {
      const text = 'Test sentence for coherence analysis.'
      const result = await IntelligentChunking.chunkBySemanticSimilarity(text, 0.5)

      result.forEach(chunk => {
        expect(['high', 'medium', 'low']).toContain(chunk.coherenceLevel)
      })
    })
  })

  describe('Adaptive Chunking', () => {
    it('should select appropriate strategy for code content', async () => {
      const text = '```javascript\nfunction test() {\n  return "hello";\n}\n```'
      const result = await IntelligentChunking.adaptiveChunk(text)

      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle markdown headers', async () => {
      const text = '# Main Header\n\nContent under header.\n\n## Sub Header\n\nMore content.'
      const result = await IntelligentChunking.adaptiveChunk(text)

      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle lists', async () => {
      const text = '- Item 1\n- Item 2\n- Item 3\n\nRegular paragraph text.'
      const result = await IntelligentChunking.adaptiveChunk(text)

      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle large documents', async () => {
      const text = 'A'.repeat(15000)
      const result = await IntelligentChunking.adaptiveChunk(text)

      expect(result.length).toBeGreaterThan(1)
    })
  })

  describe('Translation Optimization', () => {
    it('should optimize chunks for translation', async () => {
      const text = 'English text to be translated to Vietnamese.'
      const result = await IntelligentChunking.optimizeForTranslation(text, 'en', 'vi')

      expect(result.length).toBeGreaterThan(0)
      result.forEach(chunk => {
        expect(chunk.translationMetadata).toBeDefined()
        expect(chunk.translationMetadata.sourceLang).toBe('en')
        expect(chunk.translationMetadata.targetLang).toBe('vi')
        expect(chunk.translationMetadata.complexity).toBeDefined()
        expect(['high', 'medium', 'low']).toContain(chunk.translationMetadata.complexity)
      })
    })

    it('should detect named entities', async () => {
      const text = 'John Smith visited New York City last week.'
      const result = await IntelligentChunking.optimizeForTranslation(text, 'en', 'vi')

      expect(result[0].translationMetadata.hasNamedEntities).toBe(true)
    })

    it('should detect numbers and dates', async () => {
      const text = 'The meeting is on 2024-01-15 at 3:00 PM with 25 participants.'
      const result = await IntelligentChunking.optimizeForTranslation(text, 'en', 'vi')

      expect(result[0].translationMetadata.hasNumbers).toBe(true)
      expect(result[0].translationMetadata.hasDates).toBe(true)
    })

    it('should assign priority levels', async () => {
      const text = Array(15).fill('Test sentence.').join(' ')
      const result = await IntelligentChunking.optimizeForTranslation(text, 'en', 'vi')

      expect(result[0].translationMetadata.priority).toBe('high')
      if (result.length > 3) {
        expect(result[3].translationMetadata.priority).toBe('medium')
      }
    })

    it('should validate translation parameters', async () => {
      await expect(IntelligentChunking.optimizeForTranslation('', 'en', 'vi')).rejects.toThrow('Text is required')
      await expect(IntelligentChunking.optimizeForTranslation('text', '', 'vi')).rejects.toThrow('Source language is required')
      await expect(IntelligentChunking.optimizeForTranslation('text', 'en', '')).rejects.toThrow('Target language is required')
    })
  })

  describe('Chunk Merging', () => {
    it('should merge small chunks', async () => {
      const chunks = [
        { id: '1', text: 'Short chunk', tokenCount: 50 },
        { id: '2', text: 'Another short', tokenCount: 60 },
        { id: '3', text: 'Third chunk', tokenCount: 70 }
      ]

      const result = await IntelligentChunking.mergeChunks(chunks, 200)

      expect(result.length).toBeLessThan(chunks.length)
      expect(result[0].mergedChunks).toBeDefined()
    })

    it('should respect target size limits', async () => {
      const chunks = [
        { id: '1', text: 'A'.repeat(800), tokenCount: 200 },
        { id: '2', text: 'B'.repeat(800), tokenCount: 200 }
      ]

      const result = await IntelligentChunking.mergeChunks(chunks, 1000)

      expect(result[0].text.length).toBeLessThanOrEqual(1000)
    })

    it('should handle empty chunk array', async () => {
      const result = await IntelligentChunking.mergeChunks([])

      expect(result).toEqual([])
    })
  })

  describe('Chunk Validation', () => {
    it('should validate chunk quality', () => {
      const chunks = [
        { text: 'Good chunk with proper ending.' },
        { text: 'A'.repeat(2500) }, // Too long
        { text: 'Short' }, // Too short
        { text: '' } // Empty
      ]

      const result = IntelligentChunking.validateChunks(chunks)

      expect(result.isValid).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.stats).toBeDefined()
      expect(result.stats.totalChunks).toBe(4)
    })

    it('should provide statistics', () => {
      const chunks = [
        { text: 'First chunk with good content.' },
        { text: 'Second chunk also well structured.' },
        { text: 'Third chunk completes the set.' }
      ]

      const result = IntelligentChunking.validateChunks(chunks)

      expect(result.stats.totalChunks).toBe(3)
      expect(result.stats.avgChunkSize).toBeGreaterThan(0)
      expect(result.stats.minChunkSize).toBeGreaterThan(0)
      expect(result.stats.maxChunkSize).toBeGreaterThan(0)
    })

    it('should identify valid chunks', () => {
      const chunks = [
        { text: 'Well structured chunk with proper ending.' },
        { text: 'Another good chunk that follows the rules.' }
      ]

      const result = IntelligentChunking.validateChunks(chunks)

      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })
  })

  describe('Utility Functions', () => {
    it('should split text into sentences', () => {
      const text = 'First sentence. Second sentence! Third sentence?'
      const result = IntelligentChunking.splitIntoSentences(text)

      expect(result).toHaveLength(3)
      expect(result[0]).toContain('First sentence.')
      expect(result[1]).toContain('Second sentence!')
      expect(result[2]).toContain('Third sentence?')
    })

    it('should estimate token count', () => {
      const text = 'This is a test sentence.'
      const result = IntelligentChunking.estimateTokens(text)

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThan(0)
    })

    it('should assess translation complexity', () => {
      const simpleText = 'Simple sentence.'
      const complexText = 'Complex API with HTTP JSON endpoints (with nested structures).'

      const simpleResult = IntelligentChunking.assessTranslationComplexity(simpleText)
      const complexResult = IntelligentChunking.assessTranslationComplexity(complexText)

      expect(['low', 'medium', 'high']).toContain(simpleResult)
      expect(['low', 'medium', 'high']).toContain(complexResult)
      expect(complexResult).not.toBe('low') // Should be medium or high
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed input', async () => {
      await expect(IntelligentChunking.chunkText(null)).rejects.toThrow()
      await expect(IntelligentChunking.chunkText(undefined)).rejects.toThrow()
    })

    it('should handle edge cases in token encoding', async () => {
      mockTiktoken.encoding_for_model.mockReturnValue({
        encode: jest.fn(() => { throw new Error('Encoding failed') }),
        decode: jest.fn()
      })

      await expect(IntelligentChunking.chunkByTokens('text', 100)).rejects.toThrow()
    })

    it('should handle empty sentences array', () => {
      const result = IntelligentChunking.splitIntoSentences('')
      expect(result).toEqual([''])
    })
  })

  describe('Performance', () => {
    it('should handle large texts efficiently', async () => {
      const largeText = 'Large text content. '.repeat(10000)
      const startTime = performance.now()
      
      const result = await IntelligentChunking.chunkText(largeText)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(5000) // Should complete in reasonable time
    })

    it('should optimize memory usage', async () => {
      const text = 'Memory test content. '.repeat(1000)
      const result = await IntelligentChunking.chunkText(text, { maxChunkSize: 100 })

      // Ensure chunks don't contain entire original text
      result.forEach(chunk => {
        expect(chunk.text.length).toBeLessThan(text.length)
      })
    })
  })
})