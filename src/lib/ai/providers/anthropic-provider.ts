import Anthropic from '@anthropic-ai/sdk'
import { BaseAIProvider, AIProviderConfig, AIRequest, AIResponse, EmbeddingRequest, EmbeddingResponse } from './base-provider'

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic

  constructor(config: AIProviderConfig) {
    super(config)
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
    })
  }

  getName(): string {
    return 'Anthropic'
  }

  getModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022', 
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request)

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022', // Fast and cost-effective default
        max_tokens: request.maxTokens || this.config.maxTokens || 2048,
        temperature: request.temperature || this.config.temperature || 0.7,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        tools: request.tools
      })

      const textContent = message.content.find(block => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response')
      }

      return {
        content: textContent.text,
        usage: message.usage ? {
          promptTokens: message.usage.input_tokens,
          completionTokens: message.usage.output_tokens,
          totalTokens: message.usage.input_tokens + message.usage.output_tokens
        } : undefined,
        model: message.model,
        finishReason: message.stop_reason || undefined,
        metadata: {
          id: message.id,
          role: message.role
        }
      }
    } catch (error) {
      this.handleError(error, 'completion')
    }
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Anthropic doesn't provide embedding models, use OpenAI or Cohere as fallback
    throw new Error('Anthropic does not provide embedding models. Use OpenAI or Cohere for embeddings.')
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Health check' }]
      })
      return !!response.content[0]
    } catch (error) {
      return false
    }
  }

  getCostPerToken(): number {
    // Claude 3.5 Haiku pricing: $0.25 per 1M input tokens, $1.25 per 1M output tokens
    return 0.00000025 // Average input cost
  }

  getLatency(): number {
    return 1800 // Average response time in ms
  }
}