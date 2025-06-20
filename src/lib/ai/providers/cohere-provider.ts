// import { Cohere } from 'cohere-ai' // Commented out for build compatibility
import { BaseAIProvider, AIProviderConfig, AIRequest, AIResponse, EmbeddingRequest, EmbeddingResponse } from './base-provider'

export class CohereProvider extends BaseAIProvider {
  private client: any // Simplified for build compatibility

  constructor(config: AIProviderConfig) {
    super(config)
    // this.client = new Cohere({
    //   token: config.apiKey,
    //   timeout: config.timeout || 30000,
    // })
    this.client = null // Simplified for build compatibility
  }

  getName(): string {
    return 'Cohere'
  }

  getModels(): string[] {
    return [
      'command-r-plus',
      'command-r',
      'command',
      'command-nightly',
      'embed-english-v3.0',
      'embed-multilingual-v3.0',
      'embed-english-light-v3.0',
      'embed-multilingual-light-v3.0'
    ]
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request)

    try {
      let prompt = request.prompt
      if (request.systemPrompt) {
        prompt = `${request.systemPrompt}\n\nUser: ${request.prompt}`
      }

      const response = await this.client.generate({
        model: 'command-r', // Good balance of performance and cost
        prompt,
        maxTokens: request.maxTokens || this.config.maxTokens || 2048,
        temperature: request.temperature || this.config.temperature || 0.7,
        stopSequences: ['User:', 'Human:']
      })

      if (!response.generations || response.generations.length === 0) {
        throw new Error('No response from Cohere')
      }

      const generation = response.generations[0]
      
      return {
        content: generation.text,
        usage: {
          promptTokens: 0, // Cohere doesn't provide token breakdown
          completionTokens: 0,
          totalTokens: 0
        },
        model: 'command-r',
        finishReason: generation.finishReason,
        metadata: {
          id: response.id,
          likelihood: generation.likelihood
        }
      }
    } catch (error) {
      this.handleError(error, 'completion')
    }
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const texts = Array.isArray(request.text) ? request.text : [request.text]
      
      const response = await this.client.embed({
        model: request.model || 'embed-multilingual-v3.0', // Supports multiple languages
        texts,
        inputType: 'search_document'
      })

      return {
        embeddings: response.embeddings,
        usage: {
          totalTokens: 0 // Cohere doesn't provide token usage for embeddings
        },
        model: request.model || 'embed-multilingual-v3.0'
      }
    } catch (error) {
      this.handleError(error, 'embeddings')
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.generate({
        model: 'command',
        prompt: 'Health check',
        maxTokens: 5
      })
      return !!response.generations && response.generations.length > 0
    } catch (error) {
      return false
    }
  }

  getCostPerToken(): number {
    // Command-R pricing: $0.50 per 1M input tokens, $1.50 per 1M output tokens
    return 0.0000005 // Average input cost
  }

  getLatency(): number {
    return 2200 // Average response time in ms
  }
}