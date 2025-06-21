/**
 * Enhanced AI Orchestrator with Smart Routing
 * Integrates smart routing for optimal provider selection and load balancing
 */

import { logger } from '@/lib/logger'
import { smartRouter, RoutingRequest, RoutingResult } from './smart-routing'

export interface EnhancedAIRequest {
  type: 'translation' | 'generation' | 'analysis' | 'embedding'
  content: string
  sourceLanguage?: string
  targetLanguage?: string
  options?: {
    priority?: 'low' | 'medium' | 'high' | 'critical'
    qualityTier?: 'basic' | 'standard' | 'premium'
    userTier?: 'free' | 'pro' | 'enterprise'
    maxLatency?: number
    maxCost?: number
    requiresStreaming?: boolean
    temperature?: number
    maxTokens?: number
    topP?: number
    topK?: number
    presencePenalty?: number
    frequencyPenalty?: number
  }
  metadata?: {
    userId?: string
    sessionId?: string
    requestId?: string
    context?: Record<string, any>
  }
}

export interface EnhancedAIResponse {
  success: boolean
  data?: any
  error?: string
  provider: {
    id: string
    name: string
    confidence: number
  }
  performance: {
    latency: number
    cost: number
    tokensUsed: number
    cacheHit: boolean
  }
  routing: {
    reasoning: string[]
    fallbacksAvailable: number
    routingTime: number
  }
  metadata: {
    requestId: string
    timestamp: number
    version: string
  }
}

export interface StreamChunk {
  delta: string
  provider: string
  tokens: number
  latency: number
}

export class EnhancedAIOrchestrator {
  private requestCache = new Map<string, EnhancedAIResponse>()
  private activeRequests = new Map<string, AbortController>()
  private circuitBreaker = new Map<string, { failures: number; lastFailure: number; isOpen: boolean }>()
  
  constructor() {
    this.startCacheCleanup()
    this.startCircuitBreakerReset()
  }

  async processRequest(request: EnhancedAIRequest): Promise<EnhancedAIResponse> {
    const startTime = Date.now()
    const requestId = request.metadata?.requestId || this.generateRequestId()
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request)
      const cached = this.requestCache.get(cacheKey)
      if (cached && this.isCacheValid(cached)) {
        return {
          ...cached,
          performance: {
            ...cached.performance,
            cacheHit: true,
            latency: Date.now() - startTime
          },
          metadata: {
            ...cached.metadata,
            requestId
          }
        }
      }

      // Create routing request
      const routingRequest: RoutingRequest = {
        type: request.type,
        content: request.content,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        priority: request.options?.priority || 'medium',
        qualityTier: request.options?.qualityTier || 'standard',
        userTier: request.options?.userTier || 'free',
        maxLatency: request.options?.maxLatency,
        maxCost: request.options?.maxCost,
        requiresStreaming: request.options?.requiresStreaming
      }

      // Get routing decision
      const routingStart = Date.now()
      const routing = await smartRouter.selectProvider(routingRequest)
      const routingTime = Date.now() - routingStart

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(routing.selectedProvider.id)) {
        throw new Error(`Circuit breaker open for provider: ${routing.selectedProvider.id}`)
      }

      // Execute request with selected provider
      const response = await this.executeWithProvider(request, routing)
      
      // Record success metrics
      const totalLatency = Date.now() - startTime
      this.recordSuccess(routing.selectedProvider.id, totalLatency, response.performance.cost, response.performance.tokensUsed)
      
      // Build final response
      const finalResponse: EnhancedAIResponse = {
        ...response,
        routing: {
          reasoning: routing.reasoning,
          fallbacksAvailable: routing.fallbackProviders.length,
          routingTime
        },
        metadata: {
          requestId,
          timestamp: Date.now(),
          version: '2.0.0'
        }
      }

      // Cache successful responses
      if (response.success) {
        this.requestCache.set(cacheKey, finalResponse)
      }

      return finalResponse

    } catch (error) {
      logger.error('Enhanced AI orchestrator error', { 
        error: error instanceof Error ? error.message : error,
        requestId,
        type: request.type
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: {
          id: 'unknown',
          name: 'Unknown',
          confidence: 0
        },
        performance: {
          latency: Date.now() - startTime,
          cost: 0,
          tokensUsed: 0,
          cacheHit: false
        },
        routing: {
          reasoning: ['Error occurred during routing'],
          fallbacksAvailable: 0,
          routingTime: 0
        },
        metadata: {
          requestId,
          timestamp: Date.now(),
          version: '2.0.0'
        }
      }
    }
  }

  async processStreamingRequest(
    request: EnhancedAIRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<EnhancedAIResponse> {
    const startTime = Date.now()
    const requestId = request.metadata?.requestId || this.generateRequestId()

    try {
      // Ensure streaming is enabled
      request.options = { ...request.options, requiresStreaming: true }

      const routingRequest: RoutingRequest = {
        type: request.type,
        content: request.content,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        priority: request.options.priority || 'medium',
        qualityTier: request.options.qualityTier || 'standard',
        userTier: request.options.userTier || 'free',
        requiresStreaming: true
      }

      const routing = await smartRouter.selectProvider(routingRequest)

      if (!routing.selectedProvider.capabilities.supportsStreaming) {
        throw new Error('Selected provider does not support streaming')
      }

      const response = await this.executeStreamingWithProvider(request, routing, onChunk)
      
      const totalLatency = Date.now() - startTime
      this.recordSuccess(routing.selectedProvider.id, totalLatency, response.performance.cost, response.performance.tokensUsed)

      return {
        ...response,
        routing: {
          reasoning: routing.reasoning,
          fallbacksAvailable: routing.fallbackProviders.length,
          routingTime: 0
        },
        metadata: {
          requestId,
          timestamp: Date.now(),
          version: '2.0.0'
        }
      }

    } catch (error) {
      logger.error('Streaming request error', {
        error: error instanceof Error ? error.message : error,
        requestId
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Streaming error',
        provider: { id: 'unknown', name: 'Unknown', confidence: 0 },
        performance: { latency: Date.now() - startTime, cost: 0, tokensUsed: 0, cacheHit: false },
        routing: { reasoning: ['Streaming error'], fallbacksAvailable: 0, routingTime: 0 },
        metadata: { requestId, timestamp: Date.now(), version: '2.0.0' }
      }
    }
  }

  private async executeWithProvider(
    request: EnhancedAIRequest,
    routing: RoutingResult
  ): Promise<EnhancedAIResponse> {
    const provider = routing.selectedProvider
    const startTime = Date.now()
    let attempt = 0
    const maxAttempts = 1 + routing.fallbackProviders.length

    while (attempt < maxAttempts) {
      const currentProvider = attempt === 0 ? provider : routing.fallbackProviders[attempt - 1]
      
      try {
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 30000) // 30s timeout

        let result: any

        switch (request.type) {
          case 'translation':
            result = await this.executeTranslation(request, currentProvider, abortController.signal)
            break
          case 'generation':
            result = await this.executeGeneration(request, currentProvider, abortController.signal)
            break
          case 'analysis':
            result = await this.executeAnalysis(request, currentProvider, abortController.signal)
            break
          case 'embedding':
            result = await this.executeEmbedding(request, currentProvider, abortController.signal)
            break
          default:
            throw new Error(`Unsupported request type: ${request.type}`)
        }

        clearTimeout(timeoutId)

        const latency = Date.now() - startTime
        const estimatedCost = routing.estimatedCost
        const tokensUsed = this.estimateTokensUsed(request.content, result)

        return {
          success: true,
          data: result,
          provider: {
            id: currentProvider.id,
            name: currentProvider.name,
            confidence: routing.confidence
          },
          performance: {
            latency,
            cost: estimatedCost,
            tokensUsed,
            cacheHit: false
          },
          routing: {
            reasoning: routing.reasoning,
            fallbacksAvailable: routing.fallbackProviders.length,
            routingTime: 0
          },
          metadata: {
            requestId: request.metadata?.requestId || this.generateRequestId(),
            timestamp: Date.now(),
            version: '2.0.0'
          }
        }

      } catch (error) {
        logger.warn('Provider execution failed, trying fallback', {
          providerId: currentProvider.id,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : error
        })

        // Record failure
        this.recordFailure(currentProvider.id)
        
        attempt++
        
        if (attempt >= maxAttempts) {
          throw error
        }
      }
    }

    throw new Error('All providers failed')
  }

  private async executeStreamingWithProvider(
    request: EnhancedAIRequest,
    routing: RoutingResult,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<EnhancedAIResponse> {
    const provider = routing.selectedProvider
    
    // This is a simplified implementation - in production you'd implement
    // the actual streaming logic for each provider
    return new Promise((resolve, reject) => {
      // Simulate streaming chunks
      const text = "This is a simulated streaming response"
      const chunks = text.split(' ')
      let tokenCount = 0
      
      const streamInterval = setInterval(() => {
        if (tokenCount >= chunks.length) {
          clearInterval(streamInterval)
          resolve({
            success: true,
            data: { text, streaming: true },
            provider: {
              id: provider.id,
              name: provider.name,
              confidence: routing.confidence
            },
            performance: {
              latency: Date.now(),
              cost: routing.estimatedCost,
              tokensUsed: chunks.length,
              cacheHit: false
            },
            routing: {
              reasoning: routing.reasoning,
              fallbacksAvailable: routing.fallbackProviders.length,
              routingTime: 0
            },
            metadata: {
              requestId: request.metadata?.requestId || this.generateRequestId(),
              timestamp: Date.now(),
              version: '2.0.0'
            }
          })
          return
        }

        onChunk({
          delta: chunks[tokenCount] + ' ',
          provider: provider.id,
          tokens: 1,
          latency: Math.random() * 100 + 50
        })
        
        tokenCount++
      }, 100)
    })
  }

  private async executeTranslation(
    request: EnhancedAIRequest,
    provider: any,
    signal: AbortSignal
  ): Promise<any> {
    // Implementation would depend on the specific provider
    // This is a simplified mock
    return {
      translatedText: `[Translated by ${provider.name}] ${request.content}`,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      confidence: 0.95
    }
  }

  private async executeGeneration(
    request: EnhancedAIRequest,
    provider: any,
    signal: AbortSignal
  ): Promise<any> {
    // Mock implementation
    return {
      text: `[Generated by ${provider.name}] Response to: ${request.content.substring(0, 50)}...`,
      model: provider.id,
      usage: {
        promptTokens: Math.ceil(request.content.length / 4),
        completionTokens: 50,
        totalTokens: Math.ceil(request.content.length / 4) + 50
      }
    }
  }

  private async executeAnalysis(
    request: EnhancedAIRequest,
    provider: any,
    signal: AbortSignal
  ): Promise<any> {
    // Mock implementation
    return {
      analysis: `[Analyzed by ${provider.name}] Content analysis results`,
      sentiment: 'neutral',
      topics: ['technology', 'communication'],
      confidence: 0.87
    }
  }

  private async executeEmbedding(
    request: EnhancedAIRequest,
    provider: any,
    signal: AbortSignal
  ): Promise<any> {
    // Mock implementation
    const dimensions = 1536 // Common embedding dimension
    const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1)
    
    return {
      embedding,
      model: provider.id,
      usage: {
        promptTokens: Math.ceil(request.content.length / 4),
        totalTokens: Math.ceil(request.content.length / 4)
      }
    }
  }

  // Helper methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCacheKey(request: EnhancedAIRequest): string {
    const key = `${request.type}-${request.sourceLanguage}-${request.targetLanguage}-${request.options?.qualityTier}-${request.content}`
    return Buffer.from(key).toString('base64').substr(0, 32)
  }

  private isCacheValid(response: EnhancedAIResponse): boolean {
    const maxAge = 10 * 60 * 1000 // 10 minutes
    return Date.now() - response.metadata.timestamp < maxAge
  }

  private estimateTokensUsed(input: string, output: any): number {
    const inputTokens = Math.ceil(input.length / 4)
    const outputText = typeof output === 'string' ? output : JSON.stringify(output)
    const outputTokens = Math.ceil(outputText.length / 4)
    return inputTokens + outputTokens
  }

  // Circuit breaker implementation
  private isCircuitBreakerOpen(providerId: string): boolean {
    const breaker = this.circuitBreaker.get(providerId)
    if (!breaker) return false

    // Reset circuit breaker after 5 minutes
    if (Date.now() - breaker.lastFailure > 5 * 60 * 1000) {
      this.circuitBreaker.delete(providerId)
      return false
    }

    return breaker.isOpen
  }

  private recordSuccess(providerId: string, latency: number, cost: number, tokens: number): void {
    // Reset circuit breaker on success
    this.circuitBreaker.delete(providerId)
    
    // Record metrics in smart router
    smartRouter.recordMetrics(providerId, true, latency, cost, tokens)
  }

  private recordFailure(providerId: string): void {
    const breaker = this.circuitBreaker.get(providerId) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false
    }

    breaker.failures++
    breaker.lastFailure = Date.now()
    
    // Open circuit breaker after 5 failures
    if (breaker.failures >= 5) {
      breaker.isOpen = true
      logger.warn('Circuit breaker opened for provider', { providerId })
    }

    this.circuitBreaker.set(providerId, breaker)
    
    // Record metrics in smart router
    smartRouter.recordMetrics(providerId, false, 0, 0, 0)
  }

  // Cleanup and maintenance
  private startCacheCleanup(): void {
    setInterval(() => {
      const cutoff = Date.now() - (30 * 60 * 1000) // 30 minutes
      
      for (const [key, response] of this.requestCache.entries()) {
        if (response.metadata.timestamp < cutoff) {
          this.requestCache.delete(key)
        }
      }
    }, 5 * 60 * 1000) // Clean every 5 minutes
  }

  private startCircuitBreakerReset(): void {
    setInterval(() => {
      const cutoff = Date.now() - (5 * 60 * 1000) // 5 minutes
      
      for (const [providerId, breaker] of this.circuitBreaker.entries()) {
        if (breaker.lastFailure < cutoff) {
          this.circuitBreaker.delete(providerId)
          logger.info('Circuit breaker reset for provider', { providerId })
        }
      }
    }, 60 * 1000) // Check every minute
  }

  // Public methods for monitoring and control
  getStats(): {
    cacheSize: number
    activeRequests: number
    circuitBreakers: number
    routingStats: any
  } {
    return {
      cacheSize: this.requestCache.size,
      activeRequests: this.activeRequests.size,
      circuitBreakers: this.circuitBreaker.size,
      routingStats: smartRouter.getRoutingStats()
    }
  }

  clearCache(): void {
    this.requestCache.clear()
    smartRouter.clearCache()
  }

  cancelRequest(requestId: string): boolean {
    const controller = this.activeRequests.get(requestId)
    if (controller) {
      controller.abort()
      this.activeRequests.delete(requestId)
      return true
    }
    return false
  }

  getProviderStatus(): Array<{
    id: string
    name: string
    isActive: boolean
    circuitBreakerOpen: boolean
    currentLoad: number
    recentMetrics: any[]
  }> {
    const providers = smartRouter.getProviders()
    const blacklisted = smartRouter.getBlacklistedProviders()
    const currentLoad = smartRouter.getCurrentLoad()

    return providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      isActive: !blacklisted.includes(provider.id),
      circuitBreakerOpen: this.isCircuitBreakerOpen(provider.id),
      currentLoad: currentLoad.get(provider.id) || 0,
      recentMetrics: smartRouter.getProviderMetrics(provider.id).slice(-10)
    }))
  }
}

// Singleton instance
export const enhancedOrchestrator = new EnhancedAIOrchestrator()