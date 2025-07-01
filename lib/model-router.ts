/**
 * Model Router for Cost Optimization
 * Intelligently routes requests to the most cost-effective AI provider
 * based on task complexity, user tier, and real-time cost analysis
 */

import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

// Provider models and their costs per 1K tokens
export const MODEL_COSTS = {
  openai: {
    'gpt-4-turbo': { input: 0.01, output: 0.03, contextWindow: 128000, quality: 95 },
    'gpt-4': { input: 0.03, output: 0.06, contextWindow: 8192, quality: 98 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, contextWindow: 16385, quality: 85 }
  },
  anthropic: {
    'claude-3-opus': { input: 0.015, output: 0.075, contextWindow: 200000, quality: 98 },
    'claude-3-sonnet': { input: 0.003, output: 0.015, contextWindow: 200000, quality: 92 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125, contextWindow: 200000, quality: 88 }
  },
  google: {
    'gemini-pro': { input: 0.00025, output: 0.0005, contextWindow: 32768, quality: 87 },
    'gemini-pro-vision': { input: 0.00025, output: 0.0005, contextWindow: 16384, quality: 90 }
  }
}

// Task complexity scoring
export enum TaskComplexity {
  SIMPLE = 1,      // Basic translation, simple Q&A
  MODERATE = 2,    // Document analysis, structured translation
  COMPLEX = 3,     // Technical translation, code generation
  EXPERT = 4       // Complex reasoning, specialized domains
}

// User tier configurations
export enum UserTier {
  FREE = 'free',
  STANDARD = 'standard', 
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

interface ModelRoutingRequest {
  taskType: 'translation' | 'document_processing' | 'ocr' | 'embedding' | 'chat'
  complexity: TaskComplexity
  userTier: UserTier
  userId: string
  estimatedTokens: number
  requiresVision?: boolean
  languagePair?: string
  qualityRequirement?: number // 1-100 scale
  budgetConstraint?: number   // max cost in USD
}

interface ModelRecommendation {
  provider: string
  model: string
  estimatedCost: number
  qualityScore: number
  reasonCode: string
  fallbackOptions: {
    provider: string
    model: string
    estimatedCost: number
  }[]
}

interface ProviderStats {
  provider: string
  avgLatency: number
  errorRate: number
  costEfficiency: number // quality/cost ratio
  availability: number   // uptime percentage
}

export class ModelRouter {
  private static instance: ModelRouter
  private providerStats: Map<string, ProviderStats> = new Map()
  private lastStatsUpdate = 0
  private statsCache: ProviderStats[] = []

  private constructor() {}

  static getInstance(): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter()
    }
    return ModelRouter.instance
  }

  async getOptimalModel(request: ModelRoutingRequest): Promise<ModelRecommendation> {
    try {
      // Update provider stats if needed
      await this.updateProviderStats()

      // Get user's spending history
      const userSpending = await this.getUserSpending(request.userId)
      
      // Calculate available models based on user tier
      const availableModels = this.getAvailableModels(request.userTier, request.requiresVision)
      
      // Score each model option
      const scoredModels = availableModels.map(model => {
        const cost = this.calculateCost(model, request.estimatedTokens)
        const quality = this.getQualityScore(model, request)
        const performance = this.getPerformanceScore(model.provider)
        const tierBonus = this.getTierBonus(request.userTier, model.provider)
        
        const overallScore = (
          quality * 0.4 +           // 40% quality weight
          performance * 0.3 +       // 30% performance weight  
          (100 - cost * 100) * 0.2 + // 20% cost efficiency (inverted)
          tierBonus * 0.1           // 10% tier bonus
        )

        return {
          ...model,
          cost,
          quality,
          performance,
          overallScore,
          meetsRequirements: this.checkRequirements(model, request)
        }
      })

      // Filter by requirements and budget
      const validModels = scoredModels.filter(model => 
        model.meetsRequirements && 
        (!request.budgetConstraint || model.cost <= request.budgetConstraint)
      )

      if (validModels.length === 0) {
        throw new Error('No suitable models found for the given requirements')
      }

      // Sort by overall score
      const rankedModels = validModels.sort((a, b) => b.overallScore - a.overallScore)
      const bestModel = rankedModels[0]

      // Create fallback options
      const fallbackOptions = rankedModels.slice(1, 4).map(model => ({
        provider: model.provider,
        model: model.model,
        estimatedCost: model.cost
      }))

      // Generate reason code
      const reasonCode = this.generateReasonCode(bestModel, request, userSpending)

      // Log the routing decision
      await this.logRoutingDecision(request, bestModel, reasonCode)

      return {
        provider: bestModel.provider,
        model: bestModel.model,
        estimatedCost: bestModel.cost,
        qualityScore: bestModel.quality,
        reasonCode,
        fallbackOptions
      }

    } catch (error) {
      logger.error('Model routing failed', { error, request })
      
      // Return safe fallback
      return this.getFallbackRecommendation(request)
    }
  }

  private async updateProviderStats(): Promise<void> {
    // Update stats every 5 minutes
    if (Date.now() - this.lastStatsUpdate < 5 * 60 * 1000) {
      return
    }

    try {
      const { data: recentLogs } = await supabase
        .from('usage_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .not('metadata->provider', 'is', null)

      const providerStatsMap = new Map<string, {
        totalRequests: number
        totalLatency: number
        errors: number
        totalCost: number
        totalQuality: number
      }>()

      recentLogs?.forEach(log => {
        const provider = log.metadata?.provider
        if (!provider) return

        if (!providerStatsMap.has(provider)) {
          providerStatsMap.set(provider, {
            totalRequests: 0,
            totalLatency: 0,
            errors: 0,
            totalCost: 0,
            totalQuality: 0
          })
        }

        const stats = providerStatsMap.get(provider)!
        stats.totalRequests++
        stats.totalLatency += log.metadata?.latency || 0
        stats.totalCost += log.metadata?.cost || 0
        
        if (log.metadata?.error) {
          stats.errors++
        }
        
        if (log.metadata?.quality_score) {
          stats.totalQuality += log.metadata.quality_score
        }
      })

      // Calculate final stats
      this.providerStats.clear()
      for (const [provider, stats] of providerStatsMap) {
        if (stats.totalRequests > 0) {
          this.providerStats.set(provider, {
            provider,
            avgLatency: stats.totalLatency / stats.totalRequests,
            errorRate: (stats.errors / stats.totalRequests) * 100,
            costEfficiency: stats.totalQuality / Math.max(stats.totalCost, 0.001),
            availability: 100 - ((stats.errors / stats.totalRequests) * 100)
          })
        }
      }

      this.lastStatsUpdate = Date.now()
      logger.info('Provider stats updated', { 
        providers: Array.from(this.providerStats.keys()) 
      })

    } catch (error) {
      logger.error('Failed to update provider stats', { error })
    }
  }

  private async getUserSpending(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const { data } = await supabase
        .from('usage_logs')
        .select('metadata')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      return data?.reduce((total, log) => total + (log.metadata?.cost || 0), 0) || 0
    } catch (error) {
      logger.error('Failed to get user spending', { error, userId })
      return 0
    }
  }

  private getAvailableModels(userTier: UserTier, requiresVision = false) {
    const allModels = []
    
    for (const [provider, models] of Object.entries(MODEL_COSTS)) {
      for (const [modelName, specs] of Object.entries(models)) {
        // Skip vision models if not required
        if (requiresVision && !modelName.includes('vision')) continue
        if (!requiresVision && modelName.includes('vision')) continue
        
        // Filter by user tier
        if (this.isModelAvailableForTier(provider, modelName, userTier)) {
          allModels.push({
            provider,
            model: modelName,
            specs
          })
        }
      }
    }
    
    return allModels
  }

  private isModelAvailableForTier(provider: string, model: string, tier: UserTier): boolean {
    // Free tier: only basic models
    if (tier === UserTier.FREE) {
      return model.includes('3.5') || model.includes('haiku') || model.includes('gemini-pro')
    }
    
    // Standard tier: mid-tier models
    if (tier === UserTier.STANDARD) {
      return !model.includes('opus') && !model.includes('gpt-4')
    }
    
    // Premium and Enterprise: all models
    return true
  }

  private calculateCost(model: any, estimatedTokens: number): number {
    const inputCost = (estimatedTokens * 0.7 / 1000) * model.specs.input
    const outputCost = (estimatedTokens * 0.3 / 1000) * model.specs.output
    return inputCost + outputCost
  }

  private getQualityScore(model: any, request: ModelRoutingRequest): number {
    let baseQuality = model.specs.quality
    
    // Adjust for task complexity
    if (request.complexity === TaskComplexity.EXPERT) {
      baseQuality = model.model.includes('opus') || model.model.includes('gpt-4') ? 
        baseQuality : baseQuality * 0.8
    }
    
    // Adjust for language pair difficulty
    if (request.languagePair) {
      const [source, target] = request.languagePair.split('-')
      if (['zh', 'ja', 'ar', 'hi'].includes(source) || ['zh', 'ja', 'ar', 'hi'].includes(target)) {
        baseQuality *= 0.95 // Slightly lower for complex languages
      }
    }
    
    return Math.min(baseQuality, 100)
  }

  private getPerformanceScore(provider: string): number {
    const stats = this.providerStats.get(provider)
    if (!stats) return 50 // Default if no stats available
    
    // Combine latency and availability into performance score
    const latencyScore = Math.max(0, 100 - (stats.avgLatency / 50)) // 50ms = 0 points
    const availabilityScore = stats.availability
    
    return (latencyScore + availabilityScore) / 2
  }

  private getTierBonus(tier: UserTier, provider: string): number {
    // Enterprise users get priority on premium providers
    if (tier === UserTier.ENTERPRISE) {
      return provider === 'anthropic' ? 15 : 10
    }
    
    if (tier === UserTier.PREMIUM) {
      return provider === 'openai' ? 10 : 5
    }
    
    return 0
  }

  private checkRequirements(model: any, request: ModelRoutingRequest): boolean {
    // Check context window requirement
    if (request.estimatedTokens > model.specs.contextWindow) {
      return false
    }
    
    // Check quality requirement
    if (request.qualityRequirement && 
        this.getQualityScore(model, request) < request.qualityRequirement) {
      return false
    }
    
    return true
  }

  private generateReasonCode(
    selectedModel: any, 
    request: ModelRoutingRequest, 
    userSpending: number
  ): string {
    const reasons = []
    
    if (selectedModel.cost < 0.001) {
      reasons.push('COST_OPTIMIZED')
    } else if (selectedModel.quality > 95) {
      reasons.push('QUALITY_PRIORITIZED')
    }
    
    if (request.userTier === UserTier.ENTERPRISE) {
      reasons.push('ENTERPRISE_TIER')
    }
    
    if (userSpending > 100) {
      reasons.push('HIGH_USAGE_USER')
    }
    
    if (request.complexity >= TaskComplexity.COMPLEX) {
      reasons.push('COMPLEX_TASK')
    }
    
    return reasons.length > 0 ? reasons.join('|') : 'BALANCED_SELECTION'
  }

  private async logRoutingDecision(
    request: ModelRoutingRequest,
    selectedModel: any,
    reasonCode: string
  ): Promise<void> {
    try {
      await supabase.from('model_routing_logs').insert({
        user_id: request.userId,
        task_type: request.taskType,
        complexity: request.complexity,
        user_tier: request.userTier,
        selected_provider: selectedModel.provider,
        selected_model: selectedModel.model,
        estimated_cost: selectedModel.cost,
        quality_score: selectedModel.quality,
        reason_code: reasonCode,
        request_metadata: {
          estimated_tokens: request.estimatedTokens,
          requires_vision: request.requiresVision,
          language_pair: request.languagePair,
          quality_requirement: request.qualityRequirement,
          budget_constraint: request.budgetConstraint
        }
      })
    } catch (error) {
      logger.error('Failed to log routing decision', { error })
    }
  }

  private getFallbackRecommendation(request: ModelRoutingRequest): ModelRecommendation {
    // Safe fallback to most reliable, cost-effective option
    const fallbackModel = request.userTier === UserTier.FREE ? 
      { provider: 'google', model: 'gemini-pro' } :
      { provider: 'anthropic', model: 'claude-3-haiku' }
    
    return {
      provider: fallbackModel.provider,
      model: fallbackModel.model,
      estimatedCost: 0.002,
      qualityScore: 85,
      reasonCode: 'FALLBACK_SAFE_OPTION',
      fallbackOptions: []
    }
  }

  // Public method to get cost estimates for planning
  async getCostEstimates(
    taskType: string,
    estimatedTokens: number,
    userTier: UserTier
  ): Promise<{ provider: string; model: string; cost: number }[]> {
    const models = this.getAvailableModels(userTier)
    
    return models.map(model => ({
      provider: model.provider,
      model: model.model,
      cost: this.calculateCost(model, estimatedTokens)
    })).sort((a, b) => a.cost - b.cost)
  }

  // Public method to get provider performance stats
  getProviderStats(): ProviderStats[] {
    return Array.from(this.providerStats.values())
  }
}