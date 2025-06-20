import OpenAI from 'openai'
import { BaseAIProvider, AIProviderConfig, AIRequest, AIResponse, EmbeddingRequest, EmbeddingResponse } from './base-provider'

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI

  constructor(config: AIProviderConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
    })
  }

  getName(): string {
    return 'OpenAI'
  }

  getModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini', 
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'text-embedding-3-large',
      'text-embedding-3-small',
      'text-embedding-ada-002'
    ]
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request)

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
      
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt
        })
      }

      messages.push({
        role: 'user',
        content: request.prompt
      })

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective default
        messages,
        max_tokens: request.maxTokens || this.config.maxTokens || 2048,
        temperature: request.temperature || this.config.temperature || 0.7,
        stream: false,
        tools: request.tools
      })

      const choice = completion.choices[0]
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI')
      }

      return {
        content: choice.message.content || '',
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        model: completion.model,
        finishReason: choice.finish_reason || undefined,
        metadata: {
          id: completion.id,
          created: completion.created
        }
      }
    } catch (error) {
      this.handleError(error, 'completion')
    }
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const texts = Array.isArray(request.text) ? request.text : [request.text]
      
      const embedding = await this.client.embeddings.create({
        model: request.model || 'text-embedding-3-small', // Cost-effective default
        input: texts,
        encoding_format: 'float'
      })

      return {
        embeddings: embedding.data.map(item => item.embedding),
        usage: embedding.usage ? {
          totalTokens: embedding.usage.total_tokens
        } : undefined,
        model: embedding.model
      }
    } catch (error) {
      this.handleError(error, 'embeddings')
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Health check' }],
        max_tokens: 5
      })
      return !!response.choices[0]?.message
    } catch (error) {
      return false
    }
  }

  getCostPerToken(): number {
    // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
    return 0.00000015 // Average input cost
  }

  getLatency(): number {
    return 1500 // Average response time in ms
  }
}