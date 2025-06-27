/**
 * Central Pipeline Orchestrator
 * Manages the complete user journey from input to output across all workspace modes
 */

import { logger } from '@/lib/logger'
import { analyticsService } from '@/lib/analytics-service'
import { createClientComponentClient } from '@/lib/supabase'
import { IntelligentRouter, RouteConfig } from './IntelligentRouter'
import { MultiModalProcessor, ProcessingResult } from './MultiModalProcessor'

export interface PipelineRequest {
  id: string
  userId?: string
  sessionId: string
  mode: 'translation' | 'documents' | 'intelligence' | 'analytics' | 'api' | 'enterprise' | 'settings'
  type: 'text' | 'document' | 'query' | 'command'
  input: {
    content: string | File | object
    metadata?: Record<string, any>
    preferences?: UserPreferences
  }
  options: {
    qualityTier?: 'free' | 'standard' | 'premium' | 'enterprise'
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    async?: boolean
    cacheEnabled?: boolean
  }
  timestamp: Date
}

export interface PipelineResponse {
  id: string
  requestId: string
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cached'
  result?: any
  metadata: {
    processingTime: number
    cacheHit: boolean
    creditsUsed: number
    qualityScore: number
    agentsUsed?: string[]
    optimizations?: string[]
  }
  analytics: {
    userTier: string
    mode: string
    type: string
    timestamp: Date
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

interface UserPreferences {
  language: string
  theme: string
  notifications: boolean
  qualityPreference: string
  autoSave: boolean
}

interface ProcessingContext {
  user?: any
  credits: number
  tier: string
  rateLimit: number
  preferences: UserPreferences
  agentManager?: any
}

export class PipelineOrchestrator {
  private getSupabase = () => createClientComponentClient()
  private processingQueue: Map<string, PipelineRequest> = new Map()
  private activeProcesses: Set<string> = new Set()
  private intelligentRouter: IntelligentRouter
  private multiModalProcessor: MultiModalProcessor
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgProcessingTime: 0,
    cacheHitRate: 0,
  }

  constructor() {
    this.intelligentRouter = new IntelligentRouter()
    this.multiModalProcessor = new MultiModalProcessor()
  }

  /**
   * Main entry point for all user requests
   */
  async processRequest(request: PipelineRequest): Promise<PipelineResponse> {
    const startTime = Date.now()
    
    logger.info('[Pipeline] Starting request processing', {
      requestId: request.id,
      mode: request.mode,
      type: request.type,
      userId: request.userId
    })

    try {
      // Phase 1: Request Ingestion & Authentication
      const context = await this.authenticateAndValidate(request)
      
      // Phase 2: Intelligent Request Routing
      const route = await this.routeRequest(request, context)
      
      // Phase 3: Multi-Modal Processing
      const result = await this.processWithRoute(request, context, route)
      
      // Phase 4: Real-Time Optimization
      const optimizedResult = await this.optimizeOutput(result, context)
      
      // Phase 5: Enhanced Output Delivery
      const response = await this.deliverOutput(request, optimizedResult, context)
      
      // Phase 6: Analytics & Learning
      await this.recordAnalytics(request, response, context)
      
      const processingTime = Date.now() - startTime
      this.updateMetrics('success', processingTime)
      
      logger.info('[Pipeline] Request completed successfully', {
        requestId: request.id,
        processingTime,
        cacheHit: response.metadata.cacheHit
      })
      
      return response
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      this.updateMetrics('error', processingTime)
      
      logger.error('[Pipeline] Request failed', {
        requestId: request.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      })
      
      return this.createErrorResponse(request.id, error, processingTime)
    } finally {
      this.activeProcesses.delete(request.id)
      this.processingQueue.delete(request.id)
    }
  }

  /**
   * Phase 1: Request Ingestion & Authentication
   */
  private async authenticateAndValidate(request: PipelineRequest): Promise<ProcessingContext> {
    // Check authentication if user ID provided
    let user = null
    let credits = 0
    let tier = 'free'
    
    if (request.userId) {
      const { data: userData, error } = await this.getSupabase().auth.getUser()
      if (error) throw new Error(`Authentication failed: ${error.message}`)
      
      user = userData.user
      
      // Get user credits and tier
      const response = await fetch('/api/credits/balance', {
        headers: { 'Authorization': `Bearer ${user?.access_token}` }
      })
      
      if (response.ok) {
        const creditData = await response.json()
        credits = creditData.balance || 0
        tier = creditData.tier || 'free'
      }
    }
    
    // Get user preferences
    const preferences: UserPreferences = {
      language: 'en',
      theme: 'system',
      notifications: true,
      qualityPreference: request.options.qualityTier || tier,
      autoSave: true
    }
    
    // Rate limiting check
    const rateLimit = this.getRateLimitForTier(tier)
    await this.checkRateLimit(request.userId || request.sessionId, rateLimit)
    
    return {
      user,
      credits,
      tier,
      rateLimit,
      preferences
    }
  }

  /**
   * Phase 2: Intelligent Request Routing
   */
  private async routeRequest(request: PipelineRequest, context: ProcessingContext): Promise<RouteConfig> {
    try {
      // Use intelligent router for advanced routing decisions
      const route = await this.intelligentRouter.determineOptimalRoute(request, context)
      
      logger.debug('[Pipeline] Request routed with intelligent routing', {
        requestId: request.id,
        processor: route.processor,
        priority: route.priority,
        agentCount: route.agents.length,
        cacheEnabled: route.cacheStrategy.enabled,
        optimizations: route.optimizations
      })
      
      return route
    } catch (error) {
      logger.warn('[Pipeline] Intelligent routing failed, falling back to basic routing', {
        requestId: request.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Fallback to basic routing
      return {
        processor: this.determineProcessor(request),
        priority: this.calculatePriority(request, context),
        cacheStrategy: this.determineCacheStrategy(request, context),
        agents: await this.selectOptimalAgents(request, context),
        fallbacks: [],
        optimizations: {
          parallelProcessing: false,
          batchingEnabled: false,
          compressionLevel: 0,
          streamingEnabled: false
        }
      }
    }
  }

  /**
   * Phase 3: Multi-Modal Processing Engine
   */
  private async processWithRoute(request: PipelineRequest, context: ProcessingContext, route: RouteConfig) {
    // Check cache first
    if (route.cacheStrategy.enabled) {
      const cached = await this.checkCache(request, route.cacheStrategy.key)
      if (cached) {
        return { ...cached, fromCache: true }
      }
    }
    
    // Apply route optimizations
    if (route.optimizations.streamingEnabled) {
      logger.info('[Pipeline] Streaming enabled for request', { requestId: request.id })
    }
    
    // Use multi-modal processor for advanced processing
    let result: ProcessingResult
    let lastError: Error | null = null
    
    try {
      // Use legacy document processing for now (has proper API integration)
      if (request.mode === 'documents') {
        const documentResult = await this.processDocument(request, context, route)
        result = {
          data: documentResult,
          performance: { totalTime: 1000 },
          quality: { confidence: 0.9 },
          metadata: { processorUsed: route.processor }
        } as ProcessingResult
      } else {
        // Use multi-modal processor for other modes  
        result = await this.multiModalProcessor.process(request, context, route)
      }
      
      // Extract processed data
      const processedData = result.data
      
      // Add processing metadata
      const enhancedResult = {
        ...processedData,
        processingTime: result.performance.totalTime,
        qualityScore: result.quality.confidence,
        creditsUsed: this.calculateCreditsUsed(request, result),
        agentsUsed: route.agents.map(a => a.id)
      }
      
      // Legacy processing for specific modes (will be migrated)
      if (this.requiresLegacyProcessing(request.mode)) {
        const legacyResult = await this.processLegacy(request, context, route)
        Object.assign(enhancedResult, legacyResult)
      }
      
      // Cache the result
      if (route.cacheStrategy.enabled && enhancedResult) {
        await this.cacheResult(route.cacheStrategy.key, enhancedResult, route.cacheStrategy.ttl)
      }
      
      return enhancedResult
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Processing failed')
      
      // Try fallback routes if available
      if (route.fallbacks && route.fallbacks.length > 0) {
        logger.warn('[Pipeline] Primary route failed, trying fallbacks', {
          requestId: request.id,
          error: lastError.message,
          fallbackCount: route.fallbacks.length
        })
        
        for (const fallback of route.fallbacks) {
          try {
            route.processor = fallback.processor
            result = await this.multiModalProcessor.process(request, context, route)
            lastError = null
            return result.data
          } catch (fallbackError) {
            logger.error('[Pipeline] Fallback route failed', {
              requestId: request.id,
              processor: fallback.processor,
              error: fallbackError
            })
          }
        }
      }
      
      if (lastError) {
        throw lastError
      }
    }
  }

  /**
   * Phase 4: Real-Time Optimization
   */
  private async optimizeOutput(result: any, context: ProcessingContext) {
    return {
      ...result,
      optimizations: {
        compression: await this.compressIfNeeded(result),
        formatting: await this.formatForUserTier(result, context.tier),
        enhancement: await this.enhanceWithAI(result, context)
      }
    }
  }

  /**
   * Phase 5: Enhanced Output Delivery
   */
  private async deliverOutput(request: PipelineRequest, result: any, context: ProcessingContext): Promise<PipelineResponse> {
    const response: PipelineResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      status: 'completed',
      result: result.data || result,
      metadata: {
        processingTime: result.processingTime || 0,
        cacheHit: result.fromCache || false,
        creditsUsed: result.creditsUsed || 0,
        qualityScore: result.qualityScore || 0.85,
        agentsUsed: result.agentsUsed || [],
        optimizations: Object.keys(result.optimizations || {})
      },
      analytics: {
        userTier: context.tier,
        mode: request.mode,
        type: request.type,
        timestamp: new Date()
      }
    }
    
    // Deduct credits if applicable
    if (response.metadata.creditsUsed > 0 && context.user) {
      await this.deductCredits(context.user.id, response.metadata.creditsUsed)
    }
    
    return response
  }

  /**
   * Phase 6: Analytics & Learning
   */
  private async recordAnalytics(request: PipelineRequest, response: PipelineResponse, context: ProcessingContext) {
    // Track in analytics service
    await analyticsService.trackEvent('pipeline_request_completed', {
      mode: request.mode,
      type: request.type,
      status: response.status,
      processingTime: response.metadata.processingTime,
      cacheHit: response.metadata.cacheHit,
      creditsUsed: response.metadata.creditsUsed,
      qualityScore: response.metadata.qualityScore,
      userTier: context.tier
    }, context.user?.id)
    
    // Update internal metrics
    this.metrics.totalRequests++
    if (response.status === 'completed') {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
    }
    
    // Update cache hit rate
    this.metrics.cacheHitRate = this.calculateCacheHitRate()
  }

  /**
   * Check if mode requires legacy processing
   */
  private requiresLegacyProcessing(mode: string): boolean {
    // Modes that still need legacy API calls (documents now handled directly)
    return ['api', 'enterprise', 'settings'].includes(mode)
  }

  /**
   * Process with legacy handlers
   */
  private async processLegacy(
    request: PipelineRequest,
    context: ProcessingContext,
    route: RouteConfig
  ) {
    switch (request.mode) {
      case 'api':
        return await this.processApiRequest(request, context, route)
      case 'enterprise':
        return await this.processEnterpriseRequest(request, context, route)
      case 'settings':
        return await this.processSettingsRequest(request, context, route)
      default:
        return {}
    }
  }

  /**
   * Calculate credits used based on processing
   */
  private calculateCreditsUsed(
    request: PipelineRequest,
    result: ProcessingResult
  ): number {
    let credits = 1 // Base credit
    
    // Mode-based credits
    const modeCredits: Record<string, number> = {
      translation: 1,
      documents: 3,
      intelligence: 5,
      analytics: 2,
      api: 1,
      enterprise: 0,
      settings: 0
    }
    
    credits = modeCredits[request.mode] || 1
    
    // Adjust for quality
    if (result.quality.confidence > 0.9) {
      credits *= 1.2
    }
    
    // Adjust for processing time
    if (result.performance.totalTime > 5000) {
      credits *= 1.5
    }
    
    return Math.ceil(credits)
  }

  // Helper methods for processing different modes
  private async processTranslation(request: PipelineRequest, context: ProcessingContext, route: RouteConfig) {
    const endpoint = context.user ? '/api/translate/authenticated' : '/api/translate/public'
    
    // Apply compression if enabled
    const requestBody = {
      text: request.input.content,
      qualityTier: context.preferences.qualityPreference,
      ...request.input.metadata
    }
    
    if (route.optimizations.compressionLevel > 0) {
      // TODO: Implement compression
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    
    return await response.json()
  }

  private async processDocument(request: PipelineRequest, context: ProcessingContext, route: RouteConfig) {
    const formData = new FormData()
    formData.append('file', request.input.content as File)
    formData.append('qualityTier', context.preferences.qualityPreference)
    
    // Add metadata from request
    if (request.input.metadata) {
      if (request.input.metadata.targetLang) {
        formData.append('targetLang', request.input.metadata.targetLang)
      }
      if (request.input.metadata.operation) {
        formData.append('operation', request.input.metadata.operation)
      }
    }
    
    // Get authentication token from Supabase client
    const { data: { session } } = await this.getSupabase().auth.getSession()
    const headers: Record<string, string> = {}
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    try {
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers,
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Transform result to match expected format
      return {
        extractedContent: result.translatedUrl ? 'Document processed and translated' : 'Document processed',
        translatedUrl: result.translatedUrl,
        taskId: result.taskId,
        pageCount: result.pageCount,
        wordCount: result.wordCount,
        creditsUsed: result.creditsUsed,
        insights: [
          `Document processed: ${result.fileName}`,
          `Pages: ${result.pageCount}`,
          `Words: ${result.wordCount}`,
          `Credits used: ${result.creditsUsed}`
        ]
      }
      
    } catch (error) {
      logger.error('[Pipeline] Document processing failed', {
        requestId: request.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Return error in expected format
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async processIntelligenceQuery(request: PipelineRequest, context: ProcessingContext, route: RouteConfig) {
    // Use agent swarm for intelligence queries
    if (route.agents.length > 0) {
      const agentResponse = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: request.input.content,
          agents: route.agents,
          userId: context.user?.id
        })
      })
      
      return await agentResponse.json()
    }
    
    return { message: 'No agents available for processing' }
  }

  private async processAnalyticsRequest(request: PipelineRequest, context: ProcessingContext, route: RouteConfig) {
    return await analyticsService.getUserMetrics(context.user?.id || '', '30d')
  }

  private async processApiRequest(request: PipelineRequest, context: ProcessingContext, route: RouteConfig) {
    // API requests are typically handled by the API endpoints directly
    return { message: 'API request processed', data: request.input }
  }

  private async processEnterpriseRequest(request: PipelineRequest, context: ProcessingContext, route: RouteConfig) {
    // Enterprise requests for team management, billing, etc.
    return { message: 'Enterprise request processed', data: request.input }
  }

  private async processSettingsRequest(request: PipelineRequest, context: ProcessingContext, route: RouteConfig) {
    // Settings updates
    return { message: 'Settings updated', data: request.input }
  }

  // Utility methods
  private determineProcessor(request: PipelineRequest): string {
    return `${request.mode}_${request.type}_processor`
  }

  private calculatePriority(request: PipelineRequest, context: ProcessingContext): number {
    let priority = 1
    if (context.tier === 'enterprise') priority += 3
    else if (context.tier === 'premium') priority += 2
    else if (context.tier === 'standard') priority += 1
    
    if (request.options.priority === 'urgent') priority += 5
    else if (request.options.priority === 'high') priority += 3
    
    return priority
  }

  private determineCacheStrategy(request: PipelineRequest, context: ProcessingContext) {
    const enabled = request.options.cacheEnabled !== false
    const key = `pipeline_${request.mode}_${request.type}_${this.generateCacheKey(request.input)}`
    const ttl = context.tier === 'enterprise' ? 86400 : 3600 // 24h for enterprise, 1h for others
    
    return { enabled, key, ttl }
  }

  private async selectOptimalAgents(request: PipelineRequest, context: ProcessingContext): Promise<string[]> {
    if (request.mode !== 'intelligence' && request.mode !== 'documents') {
      return []
    }
    
    // Select agents based on request type and user tier
    const maxAgents = context.tier === 'enterprise' ? 5 : context.tier === 'premium' ? 3 : 1
    return [`agent_${request.type}_1`].slice(0, maxAgents)
  }

  private generateCacheKey(input: any): string {
    if (typeof input.content === 'string') {
      return require('crypto').createHash('sha256').update(input.content).digest('hex').substring(0, 16)
    }
    return Math.random().toString(36).substr(2, 16)
  }

  private getRateLimitForTier(tier: string): number {
    switch (tier) {
      case 'enterprise': return 10000
      case 'premium': return 1000
      case 'standard': return 100
      case 'free': default: return 10
    }
  }

  private async checkRateLimit(identifier: string, limit: number): Promise<void> {
    // Implement rate limiting logic
    return Promise.resolve()
  }

  private async checkCache(request: PipelineRequest, key: string): Promise<any> {
    // Check Redis cache
    return null
  }

  private async cacheResult(key: string, result: any, ttl: number): Promise<void> {
    // Cache result in Redis
    return Promise.resolve()
  }

  private async compressIfNeeded(result: any): Promise<boolean> {
    return false
  }

  private async formatForUserTier(result: any, tier: string): Promise<any> {
    return result
  }

  private async enhanceWithAI(result: any, context: ProcessingContext): Promise<any> {
    return result
  }

  private async deductCredits(userId: string, amount: number): Promise<void> {
    // Deduct credits from user account
    return Promise.resolve()
  }

  private updateMetrics(type: 'success' | 'error', processingTime: number): void {
    this.metrics.avgProcessingTime = 
      (this.metrics.avgProcessingTime * (this.metrics.totalRequests - 1) + processingTime) / 
      this.metrics.totalRequests
  }

  private calculateCacheHitRate(): number {
    return this.metrics.successfulRequests > 0 ? 
      (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 : 0
  }

  private createErrorResponse(requestId: string, error: any, processingTime: number): PipelineResponse {
    return {
      id: `resp_error_${Date.now()}`,
      requestId,
      status: 'error',
      metadata: {
        processingTime,
        cacheHit: false,
        creditsUsed: 0,
        qualityScore: 0,
        agentsUsed: [],
        optimizations: []
      },
      analytics: {
        userTier: 'unknown',
        mode: 'unknown',
        type: 'unknown',
        timestamp: new Date()
      },
      error: {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      }
    }
  }

  /**
   * Get pipeline metrics for monitoring
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeProcesses: this.activeProcesses.size,
      queueSize: this.processingQueue.size
    }
  }
}