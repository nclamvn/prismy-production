import { logger } from '@/lib/logger'

export interface AIProviderConfig {
  name: string
  apiKey: string
  baseUrl?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export interface AIRequest {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
  tools?: any[]
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  finishReason?: string
  metadata?: Record<string, any>
}

export interface EmbeddingRequest {
  text: string | string[]
  model?: string
}

export interface EmbeddingResponse {
  embeddings: number[][]
  usage?: {
    totalTokens: number
  }
  model?: string
  metadata?: Record<string, any>
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig
  protected isAvailable: boolean = false

  constructor(config: AIProviderConfig) {
    this.config = config
    this.validateConfig()
  }

  abstract getName(): string
  abstract getModels(): string[]
  abstract generateCompletion(request: AIRequest): Promise<AIResponse>
  abstract generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>
  abstract checkHealth(): Promise<boolean>

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.config.name}`)
    }
  }

  async initialize(): Promise<void> {
    try {
      this.isAvailable = await this.checkHealth()
      if (this.isAvailable) {
        logger.info(`AI Provider ${this.getName()} initialized successfully`)
      } else {
        logger.warn(`AI Provider ${this.getName()} is not available`)
      }
    } catch (error) {
      logger.error({ error, provider: this.getName() }, 'Failed to initialize AI provider')
      this.isAvailable = false
    }
  }

  getAvailability(): boolean {
    return this.isAvailable
  }

  getCostPerToken(): number {
    // Override in subclasses with actual pricing
    return 0.001
  }

  getLatency(): number {
    // Override in subclasses with measured latency
    return 2000
  }

  protected handleError(error: any, operation: string): never {
    logger.error({ 
      error: error.message, 
      provider: this.getName(), 
      operation 
    }, 'AI provider operation failed')
    
    throw new Error(`${this.getName()} ${operation} failed: ${error.message}`)
  }

  protected validateRequest(request: AIRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required and cannot be empty')
    }

    if (request.maxTokens && request.maxTokens > (this.config.maxTokens || 4096)) {
      throw new Error(`Max tokens exceeds provider limit: ${this.config.maxTokens}`)
    }
  }
}