import { aiProviderManager } from '@/lib/ai/providers/provider-manager'

describe('AI Providers Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    // Initialize the providers for testing
    await aiProviderManager.initialize()
  })

  describe('Provider Manager', () => {
    it('should be initialized correctly', () => {
      expect(aiProviderManager).toBeDefined()
      expect(aiProviderManager.getAvailableProviders).toBeDefined()
      expect(aiProviderManager.generateCompletion).toBeDefined()
      expect(aiProviderManager.generateEmbeddings).toBeDefined()
    })

    it('should handle completion requests', async () => {
      const request = {
        prompt: 'Test prompt',
        systemPrompt: 'You are a helpful assistant',
        maxTokens: 100,
        temperature: 0.7,
      }

      const response = await aiProviderManager.generateCompletion(request)

      expect(response).toHaveProperty('content')
      expect(response).toHaveProperty('usage')
      expect(response.content).toBe('Test response')
    })

    it('should handle embedding requests', async () => {
      const request = {
        text: 'Test text for embedding',
        model: 'text-embedding-3-small',
      }

      const response = await aiProviderManager.generateEmbeddings(request)

      expect(response).toHaveProperty('embeddings')
      expect(response.embeddings).toBeInstanceOf(Array)
      expect(response.embeddings[0]).toBeInstanceOf(Array)
      expect(response.embeddings[0]).toHaveLength(384)
    })

    it('should handle provider failures gracefully', async () => {
      // Mock a provider failure
      const mockProvider = require('openai')
      mockProvider.OpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('Provider error')),
          },
        },
      }))

      const request = {
        prompt: 'Test prompt',
        systemPrompt: 'You are a helpful assistant',
        maxTokens: 100,
        temperature: 0.7,
      }

      // Should still work due to fallback providers
      const response = await aiProviderManager.generateCompletion(request)
      expect(response).toHaveProperty('content')
    })
  })

  describe('Provider Selection', () => {
    it('should select optimal provider based on criteria', () => {
      const qualityProvider = aiProviderManager.getOptimalProvider('quality')
      const speedProvider = aiProviderManager.getOptimalProvider('speed')
      const costProvider = aiProviderManager.getOptimalProvider('cost')

      expect(['openai', 'anthropic', 'cohere']).toContain(qualityProvider)
      expect(['openai', 'anthropic', 'cohere']).toContain(speedProvider)
      expect(['openai', 'anthropic', 'cohere']).toContain(costProvider)
    })

    it('should track provider metrics', () => {
      const metrics = aiProviderManager.getProviderMetrics()
      expect(metrics).toBeInstanceOf(Array)

      if (metrics.length > 0) {
        const metric = metrics[0]
        expect(metric).toHaveProperty('provider')
        expect(metric).toHaveProperty('totalRequests')
        expect(metric).toHaveProperty('successfulRequests')
        expect(metric).toHaveProperty('averageLatency')
        expect(metric).toHaveProperty('totalCost')
      }
    })
  })
})
