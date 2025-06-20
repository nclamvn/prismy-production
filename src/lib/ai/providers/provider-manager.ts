import { BaseAIProvider, AIRequest, AIResponse, EmbeddingRequest, EmbeddingResponse } from './base-provider'
import { OpenAIProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import { CohereProvider } from './cohere-provider'
import { logger } from '@/lib/logger'

export type ProviderType = 'openai' | 'anthropic' | 'cohere'

export interface ProviderSelection {
  primary: ProviderType
  fallbacks: ProviderType[]
  criteria: 'cost' | 'speed' | 'quality' | 'availability'
}

export interface ProviderMetrics {
  provider: ProviderType
  totalRequests: number
  successfulRequests: number
  averageLatency: number
  totalCost: number
  lastUsed: Date
}

export class AIProviderManager {
  private providers: Map<ProviderType, BaseAIProvider> = new Map()
  private metrics: Map<ProviderType, ProviderMetrics> = new Map()
  private defaultSelection: ProviderSelection = {
    primary: 'openai',
    fallbacks: ['anthropic', 'cohere'],
    criteria: 'quality'
  }

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAIProvider({
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY,
        maxTokens: 4096,
        temperature: 0.7
      })
      this.providers.set('openai', openai)
      this.initializeMetrics('openai')
    }

    // Initialize Anthropic if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new AnthropicProvider({
        name: 'Anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        maxTokens: 4096,
        temperature: 0.7
      })
      this.providers.set('anthropic', anthropic)
      this.initializeMetrics('anthropic')
    }

    // Initialize Cohere if API key is available
    if (process.env.COHERE_API_KEY) {
      const cohere = new CohereProvider({
        name: 'Cohere',
        apiKey: process.env.COHERE_API_KEY,
        maxTokens: 4096,
        temperature: 0.7
      })
      this.providers.set('cohere', cohere)
      this.initializeMetrics('cohere')
    }

    logger.info(`Initialized ${this.providers.size} AI providers: ${Array.from(this.providers.keys()).join(', ')}`)
  }

  private initializeMetrics(provider: ProviderType): void {
    this.metrics.set(provider, {
      provider,
      totalRequests: 0,
      successfulRequests: 0,
      averageLatency: 0,
      totalCost: 0,
      lastUsed: new Date()
    })
  }

  async initialize(): Promise<void> {
    const initPromises = Array.from(this.providers.values()).map(provider => provider.initialize())
    await Promise.allSettled(initPromises)
    
    const availableProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.getAvailability())
      .map(([name, _]) => name)
    
    logger.info(`Available AI providers: ${availableProviders.join(', ')}`)
  }

  async generateCompletion(
    request: AIRequest, 
    selection?: ProviderSelection
  ): Promise<AIResponse> {
    const providerSelection = selection || this.defaultSelection
    const providers = [providerSelection.primary, ...providerSelection.fallbacks]

    for (const providerType of providers) {
      const provider = this.providers.get(providerType)
      if (!provider || !provider.getAvailability()) {
        continue
      }

      try {
        const startTime = Date.now()
        const response = await provider.generateCompletion(request)
        const latency = Date.now() - startTime

        this.updateMetrics(providerType, latency, response.usage?.totalTokens || 0, true)
        
        logger.debug({
          provider: providerType,
          latency,
          tokens: response.usage?.totalTokens
        }, 'AI completion successful')

        return {
          ...response,
          metadata: {
            ...response.metadata,
            provider: providerType,
            latency
          }
        }
      } catch (error) {
        this.updateMetrics(providerType, 0, 0, false)
        logger.warn({
          provider: providerType,
          error: error instanceof Error ? error.message : String(error)
        }, 'AI provider failed, trying next fallback')
        
        // Continue to next provider
      }
    }

    throw new Error('All AI providers failed')
  }

  async generateEmbeddings(
    request: EmbeddingRequest,
    providerType?: ProviderType
  ): Promise<EmbeddingResponse> {
    // For embeddings, prefer providers that support them well
    const embeddingProviders: ProviderType[] = providerType 
      ? [providerType] 
      : ['openai', 'cohere'] // Anthropic doesn't provide embeddings

    for (const provider of embeddingProviders) {
      const providerInstance = this.providers.get(provider)
      if (!providerInstance || !providerInstance.getAvailability()) {
        continue
      }

      try {
        const startTime = Date.now()
        const response = await providerInstance.generateEmbeddings(request)
        const latency = Date.now() - startTime

        this.updateMetrics(provider, latency, response.usage?.totalTokens || 0, true)

        return {
          ...response,
          metadata: {
            ...response.metadata,
            provider,
            latency
          }
        }
      } catch (error) {
        this.updateMetrics(provider, 0, 0, false)
        logger.warn({
          provider,
          error: error instanceof Error ? error.message : String(error)
        }, 'Embedding provider failed, trying next')
      }
    }

    throw new Error('All embedding providers failed')
  }

  getOptimalProvider(criteria: 'cost' | 'speed' | 'quality' | 'availability'): ProviderType {
    const availableProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.getAvailability())
      .map(([name, provider]) => ({ name, provider }))

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available')
    }

    switch (criteria) {
      case 'cost':
        return availableProviders
          .sort((a, b) => a.provider.getCostPerToken() - b.provider.getCostPerToken())[0].name
      
      case 'speed':
        return availableProviders
          .sort((a, b) => a.provider.getLatency() - b.provider.getLatency())[0].name
      
      case 'quality':
        // Anthropic Claude is generally considered highest quality for reasoning
        if (availableProviders.find(p => p.name === 'anthropic')) return 'anthropic'
        if (availableProviders.find(p => p.name === 'openai')) return 'openai'
        return availableProviders[0].name
      
      case 'availability':
        // Return provider with best availability metrics
        const metricsArray = Array.from(this.metrics.values())
          .filter(m => availableProviders.find(p => p.name === m.provider))
          .sort((a, b) => (b.successfulRequests / Math.max(b.totalRequests, 1)) - 
                          (a.successfulRequests / Math.max(a.totalRequests, 1)))
        return metricsArray[0]?.provider || availableProviders[0].name
      
      default:
        return availableProviders[0].name
    }
  }

  getProviderMetrics(): ProviderMetrics[] {
    return Array.from(this.metrics.values())
  }

  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.getAvailability())
      .map(([name, _]) => name)
  }

  private updateMetrics(
    provider: ProviderType, 
    latency: number, 
    tokens: number, 
    success: boolean
  ): void {
    const metrics = this.metrics.get(provider)
    if (!metrics) return

    metrics.totalRequests++
    if (success) {
      metrics.successfulRequests++
      // Update average latency
      metrics.averageLatency = (metrics.averageLatency * (metrics.successfulRequests - 1) + latency) / metrics.successfulRequests
      // Update cost (rough estimate)
      const providerInstance = this.providers.get(provider)
      if (providerInstance) {
        metrics.totalCost += tokens * providerInstance.getCostPerToken()
      }
    }
    metrics.lastUsed = new Date()
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    logger.info('Shutting down AI provider manager')
    // Add any cleanup logic here if needed
  }
}

// Singleton instance
export const aiProviderManager = new AIProviderManager()