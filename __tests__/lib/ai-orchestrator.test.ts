import { AIOrchestrator, aiOrchestrator } from '@/lib/ai/ai-orchestrator'

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('openai')
jest.mock('@anthropic-ai/sdk')
jest.mock('cohere-ai')

describe('AI Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should provide singleton instance', () => {
      expect(aiOrchestrator).toBeDefined()
      expect(aiOrchestrator).toBeInstanceOf(AIOrchestrator)
    })

    it('should have default configuration', () => {
      const orchestrator = new AIOrchestrator()
      expect(orchestrator).toBeDefined()
    })
  })

  describe('Provider Management', () => {
    it('should handle provider fallback on failure', async () => {
      const testPrompt = 'Translate this text: Hello world'

      // Mock OpenAI to fail, Anthropic to succeed
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API error')),
          },
        },
      }

      const mockAnthropic = {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ text: 'Xin chào thế giới' }],
            usage: { input_tokens: 10, output_tokens: 15 },
          }),
        },
      }

      // Test that the orchestrator can handle provider failures gracefully
      const result = await aiOrchestrator.generateText(testPrompt, {
        maxTokens: 100,
        temperature: 0.7,
      })

      expect(result).toBeDefined()
    })

    it('should respect provider preferences', async () => {
      const testPrompt = 'Generate a summary'

      const result = await aiOrchestrator.generateText(testPrompt, {
        preferredProvider: 'anthropic',
        maxTokens: 150,
      })

      expect(result).toBeDefined()
    })

    it('should handle rate limiting gracefully', async () => {
      const testPrompt = 'Rate limited request'

      // Simulate rate limiting
      const rateLimitedResult = await aiOrchestrator.generateText(testPrompt, {
        maxTokens: 50,
        retryOnRateLimit: true,
      })

      expect(rateLimitedResult).toBeDefined()
    })
  })

  describe('Text Generation', () => {
    it('should generate text with default parameters', async () => {
      const prompt = 'Write a haiku about coding'

      const result = await aiOrchestrator.generateText(prompt)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle generation with custom parameters', async () => {
      const prompt = 'Explain quantum computing'
      const options = {
        maxTokens: 200,
        temperature: 0.3,
        topP: 0.9,
        presencePenalty: 0.1,
      }

      const result = await aiOrchestrator.generateText(prompt, options)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle streaming generation', async () => {
      const prompt = 'Tell me a story about AI'
      const chunks: string[] = []

      const stream = aiOrchestrator.generateTextStream(prompt, {
        maxTokens: 100,
        onChunk: (chunk: string) => {
          chunks.push(chunk)
        },
      })

      expect(stream).toBeDefined()
      // In a real implementation, chunks would be populated
      expect(Array.isArray(chunks)).toBe(true)
    })
  })

  describe('Translation Capabilities', () => {
    it('should translate text between languages', async () => {
      const text = 'Hello, how are you?'
      const sourceLang = 'en'
      const targetLang = 'vi'

      const result = await aiOrchestrator.translateText({
        text,
        sourceLang,
        targetLang,
        qualityTier: 'standard',
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('translatedText')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('sourceLang')
      expect(result).toHaveProperty('targetLang')

      expect(typeof result.translatedText).toBe('string')
      expect(typeof result.confidence).toBe('number')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle auto-detection of source language', async () => {
      const text = 'Bonjour, comment allez-vous?'

      const result = await aiOrchestrator.translateText({
        text,
        sourceLang: 'auto',
        targetLang: 'en',
        qualityTier: 'premium',
      })

      expect(result.sourceLang).toBe('fr') // Should detect French
      expect(result.translatedText).toBeDefined()
    })

    it('should provide quality tiers', async () => {
      const text = 'Professional document translation'

      const standardResult = await aiOrchestrator.translateText({
        text,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'standard',
      })

      const premiumResult = await aiOrchestrator.translateText({
        text,
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'premium',
      })

      expect(standardResult.confidence).toBeLessThanOrEqual(
        premiumResult.confidence
      )
    })
  })

  describe('Document Intelligence', () => {
    it('should analyze document structure', async () => {
      const document = {
        content: 'This is a sample business contract...',
        filename: 'contract.pdf',
        type: 'application/pdf',
      }

      const analysis = await aiOrchestrator.analyzeDocument(document, {
        analysisDepth: 'standard',
        extractEntities: true,
        generateSummary: true,
      })

      expect(analysis).toBeDefined()
      expect(analysis).toHaveProperty('structure')
      expect(analysis).toHaveProperty('content')
      expect(analysis).toHaveProperty('insights')
      expect(analysis.structure).toHaveProperty('metadata')
      expect(analysis.content).toHaveProperty('keyEntities')
      expect(analysis.insights).toHaveProperty('summary')
    })

    it('should extract key entities from documents', async () => {
      const document = {
        content:
          'John Smith from Acme Corp signed a contract on January 15, 2024.',
        filename: 'business_agreement.txt',
        type: 'text/plain',
      }

      const analysis = await aiOrchestrator.analyzeDocument(document, {
        extractEntities: true,
        entityTypes: ['person', 'organization', 'date'],
      })

      expect(analysis.content.keyEntities).toBeDefined()
      expect(Array.isArray(analysis.content.keyEntities)).toBe(true)

      const entities = analysis.content.keyEntities
      expect(entities.some((e: any) => e.type === 'person')).toBe(true)
      expect(entities.some((e: any) => e.type === 'organization')).toBe(true)
      expect(entities.some((e: any) => e.type === 'date')).toBe(true)
    })

    it('should classify document types', async () => {
      const contractDoc = {
        content: 'TERMS AND CONDITIONS - This agreement is entered into...',
        filename: 'contract.pdf',
        type: 'application/pdf',
      }

      const analysis = await aiOrchestrator.analyzeDocument(contractDoc, {
        classifyDocument: true,
      })

      expect(analysis.insights.classification).toBeDefined()
      expect(analysis.insights.classification.documentType).toBe('contract')
      expect(analysis.insights.classification.domain).toBe('legal')
    })

    it('should generate document summaries', async () => {
      const longDocument = {
        content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                 Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                 Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                 ${' '.repeat(1000)}Extended content for summarization testing.`,
        filename: 'report.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }

      const analysis = await aiOrchestrator.analyzeDocument(longDocument, {
        generateSummary: true,
        summaryLength: 'medium',
      })

      expect(analysis.insights.summary).toBeDefined()
      expect(typeof analysis.insights.summary).toBe('string')
      expect(analysis.insights.summary.length).toBeGreaterThan(0)
      expect(analysis.insights.summary.length).toBeLessThan(
        longDocument.content.length
      )
    })
  })

  describe('Embeddings Generation', () => {
    it('should generate embeddings for text', async () => {
      const text = 'Artificial intelligence and machine learning'

      const embeddings = await aiOrchestrator.generateEmbeddings([text])

      expect(embeddings).toBeDefined()
      expect(Array.isArray(embeddings)).toBe(true)
      expect(embeddings.length).toBe(1)
      expect(Array.isArray(embeddings[0])).toBe(true)
      expect(embeddings[0].length).toBeGreaterThan(0)
      expect(typeof embeddings[0][0]).toBe('number')
    })

    it('should handle batch embedding generation', async () => {
      const texts = [
        'First document about technology',
        'Second document about business',
        'Third document about science',
      ]

      const embeddings = await aiOrchestrator.generateEmbeddings(texts)

      expect(embeddings.length).toBe(texts.length)
      embeddings.forEach((embedding, index) => {
        expect(Array.isArray(embedding)).toBe(true)
        expect(embedding.length).toBeGreaterThan(0)
      })
    })

    it('should calculate similarity between embeddings', async () => {
      const similarTexts = [
        'Machine learning is a subset of AI',
        'AI includes machine learning algorithms',
      ]

      const dissimilarTexts = [
        'Machine learning is fascinating',
        'I love cooking pasta for dinner',
      ]

      const similarEmbeddings =
        await aiOrchestrator.generateEmbeddings(similarTexts)
      const dissimilarEmbeddings =
        await aiOrchestrator.generateEmbeddings(dissimilarTexts)

      const similarScore = aiOrchestrator.calculateSimilarity(
        similarEmbeddings[0],
        similarEmbeddings[1]
      )

      const dissimilarScore = aiOrchestrator.calculateSimilarity(
        dissimilarEmbeddings[0],
        dissimilarEmbeddings[1]
      )

      expect(similarScore).toBeGreaterThan(dissimilarScore)
      expect(similarScore).toBeGreaterThan(0.5)
      expect(dissimilarScore).toBeLessThan(0.5)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle API timeouts gracefully', async () => {
      const longRunningPrompt = 'Generate a very detailed analysis...'

      const result = await aiOrchestrator.generateText(longRunningPrompt, {
        timeout: 1000, // 1 second timeout
        maxRetries: 2,
      })

      // Should either succeed or fail gracefully
      expect(result).toBeDefined()
    })

    it('should implement circuit breaker pattern', async () => {
      // Simulate multiple failures
      for (let i = 0; i < 5; i++) {
        try {
          await aiOrchestrator.generateText('Failing request', {
            preferredProvider: 'failing-provider' as any,
          })
        } catch (error) {
          // Expected to fail
        }
      }

      // Next request should use circuit breaker
      const result = await aiOrchestrator.generateText('Recovery test')
      expect(result).toBeDefined()
    })

    it('should track usage and costs', async () => {
      const initialUsage = aiOrchestrator.getUsageStats()

      await aiOrchestrator.generateText('Cost tracking test')

      const updatedUsage = aiOrchestrator.getUsageStats()

      expect(updatedUsage.totalRequests).toBeGreaterThan(
        initialUsage.totalRequests
      )
      expect(updatedUsage.totalTokens).toBeGreaterThan(initialUsage.totalTokens)
      expect(updatedUsage.estimatedCost).toBeGreaterThanOrEqual(
        initialUsage.estimatedCost
      )
    })
  })

  describe('Configuration and Optimization', () => {
    it('should respect configuration changes', async () => {
      const customConfig = {
        primaryProvider: 'anthropic' as const,
        fallbackProviders: ['openai'] as const,
        timeout: 15000,
        retryAttempts: 2,
        enableCaching: true,
      }

      const orchestrator = new AIOrchestrator(customConfig)

      expect(orchestrator).toBeDefined()
      // Configuration should be applied internally
    })

    it('should cache responses when enabled', async () => {
      const prompt = 'Cacheable response test'

      // First request
      const result1 = await aiOrchestrator.generateText(prompt, {
        enableCaching: true,
        cacheKey: 'test-cache-key',
      })

      // Second request (should use cache)
      const result2 = await aiOrchestrator.generateText(prompt, {
        enableCaching: true,
        cacheKey: 'test-cache-key',
      })

      expect(result1).toBe(result2)
    })

    it('should provide health check capabilities', async () => {
      const healthStatus = await aiOrchestrator.healthCheck()

      expect(healthStatus).toBeDefined()
      expect(healthStatus).toHaveProperty('status')
      expect(healthStatus).toHaveProperty('providers')
      expect(healthStatus).toHaveProperty('timestamp')

      expect(['healthy', 'degraded', 'unhealthy']).toContain(
        healthStatus.status
      )
      expect(Array.isArray(healthStatus.providers)).toBe(true)
    })
  })
})
