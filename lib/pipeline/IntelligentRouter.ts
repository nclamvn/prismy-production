/**
 * Intelligent Request Router for Pipeline System
 * Phase 2: Advanced routing logic with ML-based optimization
 */

import { PipelineRequest } from './PipelineOrchestrator'
import { logger } from '@/lib/logger'

export interface RouteConfig {
  processor: string
  priority: number
  cacheStrategy: CacheStrategy
  agents: AgentConfig[]
  loadBalancer?: LoadBalancerConfig
  fallbacks: FallbackRoute[]
  optimizations: OptimizationConfig
}

interface CacheStrategy {
  enabled: boolean
  key: string
  ttl: number
  compression?: boolean
  distributed?: boolean
}

interface AgentConfig {
  id: string
  specialty: string
  capability: string[]
  load: number
  reliability: number
}

interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-loaded' | 'priority' | 'adaptive'
  maxRetries: number
  timeout: number
}

interface FallbackRoute {
  condition: string
  processor: string
  priority: number
}

interface OptimizationConfig {
  parallelProcessing: boolean
  batchingEnabled: boolean
  compressionLevel: number
  streamingEnabled: boolean
}

interface ProcessingNode {
  id: string
  type: string
  capacity: number
  currentLoad: number
  specialties: string[]
  performance: NodePerformance
}

interface NodePerformance {
  avgResponseTime: number
  successRate: number
  throughput: number
  lastUpdated: Date
}

interface RouteMetrics {
  routeId: string
  requestCount: number
  avgProcessingTime: number
  successRate: number
  cacheHitRate: number
}

export class IntelligentRouter {
  private nodes: Map<string, ProcessingNode> = new Map()
  private routeMetrics: Map<string, RouteMetrics> = new Map()
  private routingRules: Map<string, RoutingRule[]> = new Map()
  private loadPatterns: LoadPattern[] = []

  constructor() {
    this.initializeNodes()
    this.loadRoutingRules()
  }

  /**
   * Main routing decision engine
   */
  async determineOptimalRoute(
    request: PipelineRequest,
    context: any
  ): Promise<RouteConfig> {
    const startTime = Date.now()

    // Analyze request characteristics
    const requestProfile = this.analyzeRequest(request)

    // Get available nodes for this request type
    const availableNodes = this.getAvailableNodes(request.mode, request.type)

    // Calculate route score for each available path
    const routeScores = await this.calculateRouteScores(
      requestProfile,
      availableNodes,
      context
    )

    // Select optimal route
    const optimalRoute = this.selectOptimalRoute(routeScores, context)

    // Apply optimizations based on context
    const optimizedRoute = this.applyOptimizations(
      optimalRoute,
      requestProfile,
      context
    )

    // Update metrics
    this.updateRouteMetrics(optimizedRoute.processor, Date.now() - startTime)

    logger.info('[IntelligentRouter] Route determined', {
      requestId: request.id,
      mode: request.mode,
      type: request.type,
      processor: optimizedRoute.processor,
      priority: optimizedRoute.priority,
      processingTime: Date.now() - startTime,
    })

    return optimizedRoute
  }

  /**
   * Analyze request to create a profile for routing decisions
   */
  private analyzeRequest(request: PipelineRequest): RequestProfile {
    const contentSize = this.calculateContentSize(request.input.content)
    const complexity = this.estimateComplexity(request)
    const urgency = this.calculateUrgency(request)

    return {
      size: contentSize,
      complexity,
      urgency,
      mode: request.mode,
      type: request.type,
      hasMetadata: !!request.input.metadata,
      requiresAgents: ['intelligence', 'documents'].includes(request.mode),
      estimatedProcessingTime: this.estimateProcessingTime(
        contentSize,
        complexity
      ),
    }
  }

  /**
   * Get available processing nodes for request type
   */
  private getAvailableNodes(mode: string, type: string): ProcessingNode[] {
    const nodes = Array.from(this.nodes.values()).filter(node => {
      // Check if node can handle this request type
      const canHandle =
        node.specialties.includes(mode) ||
        node.specialties.includes(`${mode}_${type}`)

      // Check if node has capacity
      const hasCapacity = node.currentLoad < node.capacity * 0.9

      // Check node health
      const isHealthy = node.performance.successRate > 0.95

      return canHandle && hasCapacity && isHealthy
    })

    // Sort by performance and load
    return nodes.sort((a, b) => {
      const scoreA = this.calculateNodeScore(a)
      const scoreB = this.calculateNodeScore(b)
      return scoreB - scoreA
    })
  }

  /**
   * Calculate route scores for each available path
   */
  private async calculateRouteScores(
    profile: RequestProfile,
    nodes: ProcessingNode[],
    context: any
  ): Promise<RouteScore[]> {
    const scores: RouteScore[] = []

    for (const node of nodes) {
      // Base score from node performance
      let score = this.calculateNodeScore(node)

      // Adjust for request-node affinity
      score *= this.calculateAffinity(profile, node)

      // Consider user tier priority
      score *= this.getTierMultiplier(context.tier)

      // Factor in current system load
      score *= this.getLoadMultiplier(node.currentLoad, node.capacity)

      // Check cache potential
      const cachePotential = await this.evaluateCachePotential(profile, context)
      score *= 1 + cachePotential * 0.5

      scores.push({
        nodeId: node.id,
        processor: `${node.type}_processor`,
        score,
        estimatedTime: this.estimateNodeProcessingTime(profile, node),
        reliability: node.performance.successRate,
      })
    }

    return scores.sort((a, b) => b.score - a.score)
  }

  /**
   * Select the optimal route from scored options
   */
  private selectOptimalRoute(scores: RouteScore[], context: any): RouteConfig {
    if (scores.length === 0) {
      throw new Error('No available routes for request')
    }

    // Get top route
    const topRoute = scores[0]

    // Determine caching strategy
    const cacheStrategy = this.determineCacheStrategy(topRoute, context)

    // Select agents if needed
    const agents = this.selectAgents(topRoute, context)

    // Configure load balancer
    const loadBalancer = this.configureLoadBalancer(scores, context)

    // Define fallback routes
    const fallbacks = this.defineFallbacks(scores.slice(1, 4))

    return {
      processor: topRoute.processor,
      priority: this.calculatePriority(topRoute, context),
      cacheStrategy,
      agents,
      loadBalancer,
      fallbacks,
      optimizations: {
        parallelProcessing: topRoute.score > 0.8,
        batchingEnabled: context.tier !== 'free',
        compressionLevel: this.getCompressionLevel(context.tier),
        streamingEnabled: topRoute.estimatedTime > 5000,
      },
    }
  }

  /**
   * Apply context-specific optimizations to route
   */
  private applyOptimizations(
    route: RouteConfig,
    profile: RequestProfile,
    context: any
  ): RouteConfig {
    // Enable aggressive caching for repeated requests
    if (this.isRepeatRequest(profile, context)) {
      route.cacheStrategy.ttl *= 2
      route.cacheStrategy.distributed = true
    }

    // Enable batching for high-volume users
    if (context.user && this.isHighVolumeUser(context.user.id)) {
      route.optimizations.batchingEnabled = true
    }

    // Adjust compression based on content size
    if (profile.size > 1024 * 1024) {
      // 1MB
      route.optimizations.compressionLevel = Math.min(
        route.optimizations.compressionLevel + 2,
        9
      )
    }

    // Enable streaming for large or complex requests
    if (profile.complexity > 0.7 || profile.size > 512 * 1024) {
      route.optimizations.streamingEnabled = true
    }

    return route
  }

  /**
   * Smart cache strategy determination
   */
  private determineCacheStrategy(
    route: RouteScore,
    context: any
  ): CacheStrategy {
    const baseKey = `route_${route.processor}_${Date.now()}`

    // Longer TTL for premium users
    const baseTTL =
      context.tier === 'enterprise'
        ? 86400
        : context.tier === 'premium'
          ? 43200
          : context.tier === 'standard'
            ? 7200
            : 3600

    return {
      enabled: route.reliability > 0.98, // Only cache highly reliable routes
      key: baseKey,
      ttl: baseTTL,
      compression: context.tier !== 'free',
      distributed: context.tier === 'enterprise',
    }
  }

  /**
   * Intelligent agent selection based on request needs
   */
  private selectAgents(route: RouteScore, context: any): AgentConfig[] {
    const maxAgents = this.getMaxAgentsForTier(context.tier)
    const agents: AgentConfig[] = []

    // Get available agents sorted by capability match
    const availableAgents = this.getAvailableAgents()
      .filter(agent => agent.load < 0.8)
      .sort((a, b) => b.reliability - a.reliability)

    // Select best agents up to tier limit
    for (let i = 0; i < Math.min(maxAgents, availableAgents.length); i++) {
      agents.push(availableAgents[i])
    }

    return agents
  }

  /**
   * Configure load balancer based on route options
   */
  private configureLoadBalancer(
    scores: RouteScore[],
    context: any
  ): LoadBalancerConfig {
    const hasMultipleOptions = scores.length > 1
    const isHighPriority =
      context.tier === 'enterprise' || context.tier === 'premium'

    return {
      strategy: isHighPriority ? 'adaptive' : 'least-loaded',
      maxRetries: isHighPriority ? 3 : 1,
      timeout: isHighPriority ? 30000 : 15000,
    }
  }

  /**
   * Define fallback routes for resilience
   */
  private defineFallbacks(alternativeScores: RouteScore[]): FallbackRoute[] {
    return alternativeScores.map((score, index) => ({
      condition: `primary_failure_${index + 1}`,
      processor: score.processor,
      priority: Math.max(1, 5 - index),
    }))
  }

  // Helper methods
  private calculateContentSize(content: any): number {
    if (typeof content === 'string') {
      return content.length
    } else if (content instanceof File) {
      return content.size
    } else if (typeof content === 'object') {
      return JSON.stringify(content).length
    }
    return 0
  }

  private estimateComplexity(request: PipelineRequest): number {
    let complexity = 0.3 // base complexity

    // Mode-based complexity
    const modeComplexity: Record<string, number> = {
      translation: 0.3,
      documents: 0.5,
      intelligence: 0.8,
      analytics: 0.6,
      api: 0.2,
      enterprise: 0.7,
      settings: 0.1,
    }

    complexity += modeComplexity[request.mode] || 0.5

    // Adjust for metadata
    if (request.input.metadata) {
      complexity += 0.1
    }

    return Math.min(complexity, 1)
  }

  private calculateUrgency(request: PipelineRequest): number {
    const priorityScores: Record<string, number> = {
      urgent: 1.0,
      high: 0.7,
      normal: 0.4,
      low: 0.1,
    }

    return priorityScores[request.options.priority || 'normal'] || 0.4
  }

  private estimateProcessingTime(size: number, complexity: number): number {
    // Base time in ms
    const baseTime = 100

    // Size factor (logarithmic)
    const sizeFactor = Math.log10(size + 1) * 50

    // Complexity factor (exponential)
    const complexityFactor = Math.pow(complexity, 2) * 1000

    return baseTime + sizeFactor + complexityFactor
  }

  private calculateNodeScore(node: ProcessingNode): number {
    const loadScore = 1 - node.currentLoad / node.capacity
    const performanceScore = node.performance.successRate
    const responseTimeScore = 1 / (1 + node.performance.avgResponseTime / 1000)

    return loadScore * 0.3 + performanceScore * 0.5 + responseTimeScore * 0.2
  }

  private calculateAffinity(
    profile: RequestProfile,
    node: ProcessingNode
  ): number {
    let affinity = 1.0

    // Check specialty match
    if (node.specialties.includes(profile.mode)) {
      affinity *= 1.2
    }

    // Size affinity (some nodes better for large/small requests)
    if (profile.size > 1024 * 1024 && node.type.includes('large')) {
      affinity *= 1.3
    } else if (profile.size < 1024 && node.type.includes('micro')) {
      affinity *= 1.2
    }

    return affinity
  }

  private getTierMultiplier(tier: string): number {
    const multipliers: Record<string, number> = {
      enterprise: 2.0,
      premium: 1.5,
      standard: 1.2,
      free: 1.0,
    }

    return multipliers[tier] || 1.0
  }

  private getLoadMultiplier(currentLoad: number, capacity: number): number {
    const loadRatio = currentLoad / capacity

    if (loadRatio < 0.5) return 1.2
    if (loadRatio < 0.7) return 1.0
    if (loadRatio < 0.9) return 0.8
    return 0.5
  }

  private async evaluateCachePotential(
    profile: RequestProfile,
    context: any
  ): Promise<number> {
    // Simple cache potential calculation
    let potential = 0.5

    // Text content has higher cache potential
    if (profile.mode === 'translation') {
      potential += 0.3
    }

    // Smaller content more cacheable
    if (profile.size < 10240) {
      // 10KB
      potential += 0.2
    }

    return Math.min(potential, 1)
  }

  private calculatePriority(route: RouteScore, context: any): number {
    let priority = 5 // base priority

    // Tier boost
    if (context.tier === 'enterprise') priority += 4
    else if (context.tier === 'premium') priority += 3
    else if (context.tier === 'standard') priority += 1

    // Performance boost
    priority += Math.floor(route.score * 3)

    return Math.min(priority, 10)
  }

  private getCompressionLevel(tier: string): number {
    const levels: Record<string, number> = {
      enterprise: 6,
      premium: 4,
      standard: 2,
      free: 0,
    }

    return levels[tier] || 0
  }

  private isRepeatRequest(profile: RequestProfile, context: any): boolean {
    // Simplified repeat detection
    return false // TODO: Implement request history tracking
  }

  private isHighVolumeUser(userId: string): boolean {
    // Simplified high volume detection
    return false // TODO: Implement user volume tracking
  }

  private getMaxAgentsForTier(tier: string): number {
    const limits: Record<string, number> = {
      enterprise: 5,
      premium: 3,
      standard: 2,
      free: 1,
    }

    return limits[tier] || 1
  }

  private getAvailableAgents(): AgentConfig[] {
    // Simplified agent list
    return [
      {
        id: 'agent_1',
        specialty: 'translation',
        capability: ['text', 'document'],
        load: 0.3,
        reliability: 0.98,
      },
      {
        id: 'agent_2',
        specialty: 'analysis',
        capability: ['intelligence', 'analytics'],
        load: 0.5,
        reliability: 0.95,
      },
      {
        id: 'agent_3',
        specialty: 'document',
        capability: ['ocr', 'extraction'],
        load: 0.2,
        reliability: 0.99,
      },
    ]
  }

  private updateRouteMetrics(processor: string, processingTime: number): void {
    const metrics = this.routeMetrics.get(processor) || {
      routeId: processor,
      requestCount: 0,
      avgProcessingTime: 0,
      successRate: 1,
      cacheHitRate: 0,
    }

    metrics.requestCount++
    metrics.avgProcessingTime =
      (metrics.avgProcessingTime * (metrics.requestCount - 1) +
        processingTime) /
      metrics.requestCount

    this.routeMetrics.set(processor, metrics)
  }

  private initializeNodes(): void {
    // Initialize processing nodes
    const nodeConfigs = [
      {
        id: 'node_translation_1',
        type: 'translation',
        capacity: 100,
        specialties: ['translation', 'translation_text'],
      },
      {
        id: 'node_document_1',
        type: 'document',
        capacity: 50,
        specialties: ['documents', 'documents_document'],
      },
      {
        id: 'node_intelligence_1',
        type: 'intelligence',
        capacity: 30,
        specialties: ['intelligence', 'intelligence_query'],
      },
      {
        id: 'node_analytics_1',
        type: 'analytics',
        capacity: 80,
        specialties: ['analytics', 'analytics_query'],
      },
    ]

    nodeConfigs.forEach(config => {
      this.nodes.set(config.id, {
        ...config,
        currentLoad: 0,
        performance: {
          avgResponseTime: 100,
          successRate: 0.99,
          throughput: 1000,
          lastUpdated: new Date(),
        },
      })
    })
  }

  private loadRoutingRules(): void {
    // Load routing rules
    // TODO: Load from configuration
  }
}

// Type definitions
interface RequestProfile {
  size: number
  complexity: number
  urgency: number
  mode: string
  type: string
  hasMetadata: boolean
  requiresAgents: boolean
  estimatedProcessingTime: number
}

interface RouteScore {
  nodeId: string
  processor: string
  score: number
  estimatedTime: number
  reliability: number
}

interface RoutingRule {
  condition: string
  action: string
  priority: number
}

interface LoadPattern {
  timeRange: string
  avgLoad: number
  peakLoad: number
}
