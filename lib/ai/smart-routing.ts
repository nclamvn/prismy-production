/**
 * Smart AI Routing Engine
 * Intelligent provider selection and load balancing for optimal performance
 */

import { logger } from '@/lib/logger'

export interface AIProvider {
  id: string
  name: string
  type: 'translation' | 'generation' | 'analysis' | 'embedding'
  endpoint: string
  apiKey: string
  maxTokens: number
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
  cost: {
    inputTokenCost: number  // per 1K tokens
    outputTokenCost: number // per 1K tokens
  }
  latency: {
    p50: number // median response time in ms
    p95: number // 95th percentile response time
    p99: number // 99th percentile response time
  }
  reliability: {
    uptime: number      // percentage
    errorRate: number   // percentage
    successRate: number // percentage
  }
  capabilities: {
    languages: string[]
    maxContextLength: number
    supportsStreaming: boolean
    supportsBatch: boolean
  }
}

export interface RoutingRequest {
  type: 'translation' | 'generation' | 'analysis' | 'embedding'
  content: string
  sourceLanguage?: string
  targetLanguage?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  qualityTier: 'basic' | 'standard' | 'premium'
  userTier: 'free' | 'pro' | 'enterprise'
  maxLatency?: number // ms
  maxCost?: number    // USD
  requiresStreaming?: boolean
  batchSize?: number
}

export interface RoutingResult {
  selectedProvider: AIProvider
  estimatedCost: number
  estimatedLatency: number
  confidence: number
  fallbackProviders: AIProvider[]
  reasoning: string[]
}

export interface ProviderMetrics {
  providerId: string
  timestamp: number
  requestCount: number
  successCount: number
  errorCount: number
  totalLatency: number
  totalCost: number
  averageLatency: number
  errorRate: number
  tokensProcessed: number
}

export class SmartRoutingEngine {
  private providers: Map<string, AIProvider> = new Map()
  private metrics: Map<string, ProviderMetrics[]> = new Map()
  private currentLoad: Map<string, number> = new Map()
  private blacklistedProviders: Set<string> = new Set()
  private routingCache: Map<string, RoutingResult> = new Map()

  constructor() {
    this.initializeProviders()
    this.startMetricsCollection()
    this.startHealthMonitoring()
  }

  private initializeProviders(): void {
    // Configure available AI providers
    const providers: AIProvider[] = [
      {
        id: 'anthropic-claude',
        name: 'Anthropic Claude',
        type: 'generation',
        endpoint: 'https://api.anthropic.com/v1/messages',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        maxTokens: 200000,
        rateLimit: {
          requestsPerMinute: 50,
          tokensPerMinute: 40000
        },
        cost: {
          inputTokenCost: 0.008,
          outputTokenCost: 0.024
        },
        latency: {
          p50: 1200,
          p95: 3000,
          p99: 5000
        },
        reliability: {
          uptime: 99.9,
          errorRate: 0.5,
          successRate: 99.5
        },
        capabilities: {
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'vi'],
          maxContextLength: 200000,
          supportsStreaming: true,
          supportsBatch: false
        }
      },
      {
        id: 'openai-gpt4',
        name: 'OpenAI GPT-4',
        type: 'generation',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY || '',
        maxTokens: 128000,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 150000
        },
        cost: {
          inputTokenCost: 0.01,
          outputTokenCost: 0.03
        },
        latency: {
          p50: 800,
          p95: 2000,
          p99: 4000
        },
        reliability: {
          uptime: 99.8,
          errorRate: 0.8,
          successRate: 99.2
        },
        capabilities: {
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'vi'],
          maxContextLength: 128000,
          supportsStreaming: true,
          supportsBatch: true
        }
      },
      {
        id: 'google-translate',
        name: 'Google Translate API',
        type: 'translation',
        endpoint: 'https://translation.googleapis.com/language/translate/v2',
        apiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
        maxTokens: 30000,
        rateLimit: {
          requestsPerMinute: 1000,
          tokensPerMinute: 100000
        },
        cost: {
          inputTokenCost: 0.02,
          outputTokenCost: 0.02
        },
        latency: {
          p50: 300,
          p95: 800,
          p99: 1500
        },
        reliability: {
          uptime: 99.95,
          errorRate: 0.1,
          successRate: 99.9
        },
        capabilities: {
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'vi', 'ar', 'hi', 'th'],
          maxContextLength: 30000,
          supportsStreaming: false,
          supportsBatch: true
        }
      },
      {
        id: 'cohere-embed',
        name: 'Cohere Embeddings',
        type: 'embedding',
        endpoint: 'https://api.cohere.ai/v1/embed',
        apiKey: process.env.COHERE_API_KEY || '',
        maxTokens: 2048,
        rateLimit: {
          requestsPerMinute: 100,
          tokensPerMinute: 50000
        },
        cost: {
          inputTokenCost: 0.0001,
          outputTokenCost: 0.0001
        },
        latency: {
          p50: 500,
          p95: 1200,
          p99: 2000
        },
        reliability: {
          uptime: 99.7,
          errorRate: 1.0,
          successRate: 99.0
        },
        capabilities: {
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
          maxContextLength: 2048,
          supportsStreaming: false,
          supportsBatch: true
        }
      }
    ]

    providers.forEach(provider => {
      this.providers.set(provider.id, provider)
      this.metrics.set(provider.id, [])
      this.currentLoad.set(provider.id, 0)
    })

    logger.info('Smart routing engine initialized', { 
      providerCount: providers.length 
    })
  }

  async selectProvider(request: RoutingRequest): Promise<RoutingResult> {
    const cacheKey = this.generateCacheKey(request)
    const cached = this.routingCache.get(cacheKey)
    
    if (cached && this.isCacheValid(cached)) {
      return cached
    }

    const candidates = this.filterCandidates(request)
    if (candidates.length === 0) {
      throw new Error('No suitable providers available for request')
    }

    const scoredProviders = await this.scoreProviders(candidates, request)
    const sorted = scoredProviders.sort((a, b) => b.score - a.score)
    
    const selected = sorted[0].provider
    const fallbacks = sorted.slice(1, 4).map(sp => sp.provider)

    const result: RoutingResult = {
      selectedProvider: selected,
      estimatedCost: this.estimateCost(selected, request),
      estimatedLatency: this.estimateLatency(selected, request),
      confidence: sorted[0].score,
      fallbackProviders: fallbacks,
      reasoning: sorted[0].reasoning
    }

    // Cache the result
    this.routingCache.set(cacheKey, result)
    
    logger.info('Provider selected', {
      providerId: selected.id,
      confidence: result.confidence,
      estimatedCost: result.estimatedCost,
      estimatedLatency: result.estimatedLatency
    })

    return result
  }

  private filterCandidates(request: RoutingRequest): AIProvider[] {
    const candidates: AIProvider[] = []

    for (const provider of this.providers.values()) {
      // Skip blacklisted providers
      if (this.blacklistedProviders.has(provider.id)) {
        continue
      }

      // Check type compatibility
      if (provider.type !== request.type) {
        continue
      }

      // Check language support
      if (request.sourceLanguage && !provider.capabilities.languages.includes(request.sourceLanguage)) {
        continue
      }
      if (request.targetLanguage && !provider.capabilities.languages.includes(request.targetLanguage)) {
        continue
      }

      // Check streaming requirements
      if (request.requiresStreaming && !provider.capabilities.supportsStreaming) {
        continue
      }

      // Check batch requirements
      if (request.batchSize && request.batchSize > 1 && !provider.capabilities.supportsBatch) {
        continue
      }

      // Check rate limits
      const currentLoad = this.currentLoad.get(provider.id) || 0
      if (currentLoad >= provider.rateLimit.requestsPerMinute * 0.8) { // 80% threshold
        continue
      }

      // Check content length
      const contentLength = request.content.length
      if (contentLength > provider.capabilities.maxContextLength) {
        continue
      }

      candidates.push(provider)
    }

    return candidates
  }

  private async scoreProviders(
    candidates: AIProvider[], 
    request: RoutingRequest
  ): Promise<Array<{ provider: AIProvider; score: number; reasoning: string[] }>> {
    const scored = []

    for (const provider of candidates) {
      const score = await this.calculateProviderScore(provider, request)
      scored.push(score)
    }

    return scored
  }

  private async calculateProviderScore(
    provider: AIProvider, 
    request: RoutingRequest
  ): Promise<{ provider: AIProvider; score: number; reasoning: string[] }> {
    const reasoning: string[] = []
    let score = 0

    // Base reliability score (40% weight)
    const reliabilityScore = (provider.reliability.successRate / 100) * 0.4
    score += reliabilityScore
    reasoning.push(`Reliability: ${provider.reliability.successRate}% success rate`)

    // Cost efficiency score (25% weight)
    const estimatedCost = this.estimateCost(provider, request)
    const costScore = this.calculateCostScore(estimatedCost, request) * 0.25
    score += costScore
    reasoning.push(`Cost: $${estimatedCost.toFixed(4)} estimated`)

    // Latency score (20% weight)
    const estimatedLatency = this.estimateLatency(provider, request)
    const latencyScore = this.calculateLatencyScore(estimatedLatency, request) * 0.2
    score += latencyScore
    reasoning.push(`Latency: ${estimatedLatency}ms estimated`)

    // Current load score (10% weight)
    const currentLoad = this.currentLoad.get(provider.id) || 0
    const loadScore = Math.max(0, 1 - (currentLoad / provider.rateLimit.requestsPerMinute)) * 0.1
    score += loadScore
    reasoning.push(`Load: ${currentLoad}/${provider.rateLimit.requestsPerMinute} requests/min`)

    // Quality tier preference (5% weight)
    const qualityScore = this.calculateQualityScore(provider, request) * 0.05
    score += qualityScore
    reasoning.push(`Quality tier: ${request.qualityTier}`)

    // Recent performance metrics
    const recentMetrics = this.getRecentMetrics(provider.id)
    if (recentMetrics.length > 0) {
      const avgLatency = recentMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / recentMetrics.length
      const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length
      
      // Adjust score based on recent performance
      const performanceAdjustment = (1 - avgErrorRate) * Math.min(1, 1000 / avgLatency) * 0.1
      score += performanceAdjustment
      reasoning.push(`Recent performance: ${avgLatency.toFixed(0)}ms avg latency, ${(avgErrorRate * 100).toFixed(1)}% error rate`)
    }

    return {
      provider,
      score: Math.min(1, Math.max(0, score)), // Clamp between 0 and 1
      reasoning
    }
  }

  private estimateCost(provider: AIProvider, request: RoutingRequest): number {
    const inputTokens = Math.ceil(request.content.length / 4) // Rough estimate: 4 chars per token
    const outputTokens = Math.ceil(inputTokens * 0.5) // Estimate output length
    
    return (inputTokens * provider.cost.inputTokenCost / 1000) + 
           (outputTokens * provider.cost.outputTokenCost / 1000)
  }

  private estimateLatency(provider: AIProvider, request: RoutingRequest): number {
    const baseLatency = provider.latency.p50
    const contentLength = request.content.length
    
    // Adjust for content length (longer content = higher latency)
    const lengthMultiplier = 1 + (contentLength / 10000) * 0.1
    
    // Adjust for current load
    const currentLoad = this.currentLoad.get(provider.id) || 0
    const loadMultiplier = 1 + (currentLoad / provider.rateLimit.requestsPerMinute) * 0.3
    
    return Math.ceil(baseLatency * lengthMultiplier * loadMultiplier)
  }

  private calculateCostScore(cost: number, request: RoutingRequest): number {
    if (request.maxCost && cost > request.maxCost) {
      return 0
    }
    
    // Higher score for lower cost
    const maxAcceptableCost = request.maxCost || 0.1 // Default max $0.10
    return Math.max(0, 1 - (cost / maxAcceptableCost))
  }

  private calculateLatencyScore(latency: number, request: RoutingRequest): number {
    if (request.maxLatency && latency > request.maxLatency) {
      return 0
    }
    
    // Higher score for lower latency
    const maxAcceptableLatency = request.maxLatency || 5000 // Default max 5s
    return Math.max(0, 1 - (latency / maxAcceptableLatency))
  }

  private calculateQualityScore(provider: AIProvider, request: RoutingRequest): number {
    // Premium tier prefers higher-quality providers
    if (request.qualityTier === 'premium') {
      return provider.name.includes('Claude') || provider.name.includes('GPT-4') ? 1 : 0.7
    }
    
    // Standard tier balances quality and cost
    if (request.qualityTier === 'standard') {
      return 0.8
    }
    
    // Basic tier prioritizes cost over quality
    return provider.name.includes('Google') ? 1 : 0.6
  }

  // Metrics and monitoring
  recordMetrics(
    providerId: string, 
    success: boolean, 
    latency: number, 
    cost: number, 
    tokensProcessed: number
  ): void {
    const metrics = this.metrics.get(providerId) || []
    const now = Date.now()
    
    // Find or create current minute bucket
    let currentMetric = metrics.find(m => 
      Math.floor(m.timestamp / 60000) === Math.floor(now / 60000)
    )
    
    if (!currentMetric) {
      currentMetric = {
        providerId,
        timestamp: now,
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        totalLatency: 0,
        totalCost: 0,
        averageLatency: 0,
        errorRate: 0,
        tokensProcessed: 0
      }
      metrics.push(currentMetric)
    }
    
    // Update metrics
    currentMetric.requestCount++
    currentMetric.totalLatency += latency
    currentMetric.totalCost += cost
    currentMetric.tokensProcessed += tokensProcessed
    
    if (success) {
      currentMetric.successCount++
    } else {
      currentMetric.errorCount++
    }
    
    currentMetric.averageLatency = currentMetric.totalLatency / currentMetric.requestCount
    currentMetric.errorRate = currentMetric.errorCount / currentMetric.requestCount
    
    // Keep only last 60 minutes of metrics
    const cutoff = now - (60 * 60 * 1000)
    const filtered = metrics.filter(m => m.timestamp > cutoff)
    this.metrics.set(providerId, filtered)
    
    // Update current load
    const recentRequests = filtered.reduce((sum, m) => sum + m.requestCount, 0)
    this.currentLoad.set(providerId, recentRequests)
  }

  private getRecentMetrics(providerId: string): ProviderMetrics[] {
    const metrics = this.metrics.get(providerId) || []
    const cutoff = Date.now() - (10 * 60 * 1000) // Last 10 minutes
    return metrics.filter(m => m.timestamp > cutoff)
  }

  private startMetricsCollection(): void {
    // Clean up old metrics every 5 minutes
    setInterval(() => {
      const cutoff = Date.now() - (60 * 60 * 1000) // 1 hour
      
      for (const [providerId, metrics] of this.metrics.entries()) {
        const filtered = metrics.filter(m => m.timestamp > cutoff)
        this.metrics.set(providerId, filtered)
      }
    }, 5 * 60 * 1000)
  }

  private startHealthMonitoring(): void {
    // Check provider health every 2 minutes
    setInterval(async () => {
      await this.checkProviderHealth()
    }, 2 * 60 * 1000)
  }

  private async checkProviderHealth(): Promise<void> {
    for (const [providerId, provider] of this.providers.entries()) {
      const recentMetrics = this.getRecentMetrics(providerId)
      
      if (recentMetrics.length === 0) continue
      
      const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length
      const avgLatency = recentMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / recentMetrics.length
      
      // Blacklist provider if error rate > 20% or latency > 10s
      if (avgErrorRate > 0.2 || avgLatency > 10000) {
        this.blacklistedProviders.add(providerId)
        logger.warn('Provider blacklisted due to poor performance', {
          providerId,
          errorRate: avgErrorRate,
          latency: avgLatency
        })
        
        // Remove from blacklist after 10 minutes
        setTimeout(() => {
          this.blacklistedProviders.delete(providerId)
          logger.info('Provider removed from blacklist', { providerId })
        }, 10 * 60 * 1000)
      }
    }
  }

  // Cache management
  private generateCacheKey(request: RoutingRequest): string {
    return `${request.type}-${request.qualityTier}-${request.priority}-${request.sourceLanguage}-${request.targetLanguage}`
  }

  private isCacheValid(result: RoutingResult): boolean {
    // Cache is valid for 5 minutes
    return Date.now() - (result as any).timestamp < 5 * 60 * 1000
  }

  // Public getters for monitoring
  getProviders(): AIProvider[] {
    return Array.from(this.providers.values())
  }

  getProviderMetrics(providerId: string): ProviderMetrics[] {
    return this.metrics.get(providerId) || []
  }

  getCurrentLoad(): Map<string, number> {
    return new Map(this.currentLoad)
  }

  getBlacklistedProviders(): string[] {
    return Array.from(this.blacklistedProviders)
  }

  clearCache(): void {
    this.routingCache.clear()
  }

  // Manual provider management
  updateProviderConfig(providerId: string, updates: Partial<AIProvider>): void {
    const provider = this.providers.get(providerId)
    if (provider) {
      Object.assign(provider, updates)
      logger.info('Provider configuration updated', { providerId, updates })
    }
  }

  blacklistProvider(providerId: string, duration: number = 10 * 60 * 1000): void {
    this.blacklistedProviders.add(providerId)
    setTimeout(() => {
      this.blacklistedProviders.delete(providerId)
    }, duration)
    logger.info('Provider manually blacklisted', { providerId, duration })
  }

  getRoutingStats(): {
    totalProviders: number
    activeProviders: number
    blacklistedProviders: number
    cacheSize: number
    totalRequests: number
  } {
    const totalRequests = Array.from(this.metrics.values())
      .flat()
      .reduce((sum, m) => sum + m.requestCount, 0)

    return {
      totalProviders: this.providers.size,
      activeProviders: this.providers.size - this.blacklistedProviders.size,
      blacklistedProviders: this.blacklistedProviders.size,
      cacheSize: this.routingCache.size,
      totalRequests
    }
  }
}

// Singleton instance
export const smartRouter = new SmartRoutingEngine()