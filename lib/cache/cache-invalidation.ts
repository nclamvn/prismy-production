import { cacheCoordinator } from './cache-coordinator'
import { createHash } from 'crypto'

// Invalidation Strategy Types
export type InvalidationStrategy = 
  | 'immediate'
  | 'write-behind' 
  | 'scheduled'
  | 'dependency-based'
  | 'event-driven'

// Invalidation Event Types
export type InvalidationEvent = 
  | 'user_update'
  | 'translation_update'
  | 'subscription_change'
  | 'content_change'
  | 'system_maintenance'

// Dependency Tracking
interface CacheDependency {
  key: string
  dependsOn: string[]
  triggers: InvalidationEvent[]
  strategy: InvalidationStrategy
  priority: 'high' | 'medium' | 'low'
  createdAt: number
  lastInvalidated?: number
}

// Invalidation Job
interface InvalidationJob {
  id: string
  keys: string[]
  patterns: string[]
  tags: string[]
  strategy: InvalidationStrategy
  scheduledFor?: number
  priority: 'high' | 'medium' | 'low'
  retryCount: number
  maxRetries: number
  createdAt: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

// Smart Cache Invalidation Manager
export class SmartCacheInvalidator {
  private dependencies = new Map<string, CacheDependency>()
  private invalidationQueue: InvalidationJob[] = []
  private processingQueue = false
  private metrics = {
    totalInvalidations: 0,
    successfulInvalidations: 0,
    failedInvalidations: 0,
    avgInvalidationTime: 0,
    lastInvalidation: 0
  }

  constructor() {
    this.setupDependencyTracking()
    this.startQueueProcessor()
  }

  // Register cache dependencies
  registerDependency(dependency: Omit<CacheDependency, 'createdAt'>): void {
    const fullDependency: CacheDependency = {
      ...dependency,
      createdAt: Date.now()
    }
    
    this.dependencies.set(dependency.key, fullDependency)
    console.log(`📎 Registered cache dependency: ${dependency.key}`)
  }

  // Smart invalidation based on events
  async invalidateByEvent(
    event: InvalidationEvent, 
    context: Record<string, any> = {}
  ): Promise<void> {
    const startTime = Date.now()
    
    // Find all dependencies triggered by this event
    const triggeredDependencies = Array.from(this.dependencies.values())
      .filter(dep => dep.triggers.includes(event))

    if (triggeredDependencies.length === 0) {
      console.log(`📭 No cache dependencies found for event: ${event}`)
      return
    }

    // Group by strategy for batch processing
    const strategyGroups = this.groupByStrategy(triggeredDependencies)

    for (const [strategy, deps] of strategyGroups.entries()) {
      await this.executeInvalidationStrategy(strategy, deps, context)
    }

    this.updateMetrics(Date.now() - startTime, true)
    console.log(`🗑️ Invalidated ${triggeredDependencies.length} dependencies for event: ${event}`)
  }

  // Invalidate specific user's cached data
  async invalidateUserCache(userId: string, selective: boolean = true): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
      `history:${userId}:*`,
      `profile:${userId}`,
      `subscription:${userId}:*`
    ]

    if (!selective) {
      // Nuclear option - clear everything for user
      patterns.push(`*:${userId}:*`)
    }

    const job: InvalidationJob = {
      id: this.generateJobId(),
      keys: [],
      patterns,
      tags: [`user:${userId}`],
      strategy: 'immediate',
      priority: 'high',
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
      status: 'pending'
    }

    await this.queueInvalidation(job)
  }

  // Translation-specific invalidation
  async invalidateTranslationCache(
    sourceLang: string,
    targetLang: string,
    qualityTier?: string
  ): Promise<void> {
    const patterns = [
      `translation:*:${sourceLang}:${targetLang}`,
      `translation:*:${sourceLang}:${targetLang}:${qualityTier || '*'}`
    ]

    const tags = [
      'translations',
      `lang:${sourceLang}`,
      `lang:${targetLang}`,
      ...(qualityTier ? [`quality:${qualityTier}`] : [])
    ]

    const job: InvalidationJob = {
      id: this.generateJobId(),
      keys: [],
      patterns,
      tags,
      strategy: 'immediate',
      priority: 'medium',
      retryCount: 0,
      maxRetries: 2,
      createdAt: Date.now(),
      status: 'pending'
    }

    await this.queueInvalidation(job)
  }

  // Subscription change invalidation
  async invalidateSubscriptionCache(userId: string, oldTier: string, newTier: string): Promise<void> {
    // Invalidate rate limiting caches
    const patterns = [
      `rate_limit:${userId}:*`,
      `user_tier:${userId}`,
      `subscription:${userId}:*`,
      `billing:${userId}:*`
    ]

    const tags = [
      `user:${userId}`,
      'subscriptions',
      `tier:${oldTier}`,
      `tier:${newTier}`
    ]

    const job: InvalidationJob = {
      id: this.generateJobId(),
      keys: [],
      patterns,
      tags,
      strategy: 'immediate',
      priority: 'high',
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
      status: 'pending'
    }

    await this.queueInvalidation(job)
  }

  // System-wide cache invalidation
  async invalidateSystemCache(scope: 'all' | 'translations' | 'users' | 'config'): Promise<void> {
    let patterns: string[] = []
    let tags: string[] = []

    switch (scope) {
      case 'all':
        patterns = ['*']
        tags = ['system']
        break
      case 'translations':
        patterns = ['translation:*', 'languages:*']
        tags = ['translations', 'languages']
        break
      case 'users':
        patterns = ['user:*', 'profile:*', 'history:*']
        tags = ['users', 'profiles']
        break
      case 'config':
        patterns = ['config:*', 'meta:*', 'stats:*']
        tags = ['config', 'metadata']
        break
    }

    const job: InvalidationJob = {
      id: this.generateJobId(),
      keys: [],
      patterns,
      tags,
      strategy: 'scheduled',
      scheduledFor: Date.now() + 5000, // 5 second delay for system ops
      priority: 'low',
      retryCount: 0,
      maxRetries: 1,
      createdAt: Date.now(),
      status: 'pending'
    }

    await this.queueInvalidation(job)
  }

  // Time-based invalidation for scheduled maintenance
  scheduleInvalidation(
    patterns: string[],
    tags: string[],
    delayMs: number,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): string {
    const job: InvalidationJob = {
      id: this.generateJobId(),
      keys: [],
      patterns,
      tags,
      strategy: 'scheduled',
      scheduledFor: Date.now() + delayMs,
      priority,
      retryCount: 0,
      maxRetries: 2,
      createdAt: Date.now(),
      status: 'pending'
    }

    this.invalidationQueue.push(job)
    return job.id
  }

  // Cascade invalidation based on dependencies
  async cascadeInvalidation(rootKey: string): Promise<void> {
    const visited = new Set<string>()
    const toInvalidate = new Set<string>()

    await this.findCascadeDependencies(rootKey, visited, toInvalidate)

    if (toInvalidate.size > 0) {
      const job: InvalidationJob = {
        id: this.generateJobId(),
        keys: Array.from(toInvalidate),
        patterns: [],
        tags: ['cascade'],
        strategy: 'immediate',
        priority: 'high',
        retryCount: 0,
        maxRetries: 3,
        createdAt: Date.now(),
        status: 'pending'
      }

      await this.queueInvalidation(job)
      console.log(`🌊 Cascade invalidation triggered ${toInvalidate.size} keys from root: ${rootKey}`)
    }
  }

  // Get invalidation metrics
  getMetrics(): typeof this.metrics & { queueSize: number; dependencies: number } {
    return {
      ...this.metrics,
      queueSize: this.invalidationQueue.length,
      dependencies: this.dependencies.size
    }
  }

  // Get dependency graph for debugging
  getDependencyGraph(): Map<string, CacheDependency> {
    return new Map(this.dependencies)
  }

  // Private helper methods
  private async queueInvalidation(job: InvalidationJob): Promise<void> {
    this.invalidationQueue.push(job)
    
    // Sort by priority and scheduled time
    this.invalidationQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      
      if (priorityDiff !== 0) return priorityDiff
      
      const aTime = a.scheduledFor || a.createdAt
      const bTime = b.scheduledFor || b.createdAt
      return aTime - bTime
    })

    if (!this.processingQueue) {
      this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.invalidationQueue.length === 0) {
      return
    }

    this.processingQueue = true

    while (this.invalidationQueue.length > 0) {
      const job = this.invalidationQueue[0]
      
      // Check if scheduled job is ready
      if (job.scheduledFor && Date.now() < job.scheduledFor) {
        setTimeout(() => this.processQueue(), job.scheduledFor - Date.now())
        break
      }

      // Remove job from queue
      this.invalidationQueue.shift()
      
      try {
        await this.executeInvalidationJob(job)
      } catch (error) {
        console.error(`Failed to execute invalidation job ${job.id}:`, error)
        
        if (job.retryCount < job.maxRetries) {
          job.retryCount++
          job.status = 'pending'
          job.scheduledFor = Date.now() + (1000 * Math.pow(2, job.retryCount)) // Exponential backoff
          this.invalidationQueue.push(job)
        } else {
          job.status = 'failed'
          this.updateMetrics(0, false)
        }
      }
    }

    this.processingQueue = false
  }

  private async executeInvalidationJob(job: InvalidationJob): Promise<void> {
    const startTime = Date.now()
    job.status = 'processing'

    let totalInvalidated = 0

    // Invalidate specific keys
    if (job.keys.length > 0) {
      for (const key of job.keys) {
        await cacheCoordinator.invalidate(key)
        totalInvalidated++
      }
    }

    // Invalidate by patterns
    if (job.patterns.length > 0) {
      for (const pattern of job.patterns) {
        const count = await cacheCoordinator.invalidate(pattern)
        totalInvalidated += count
      }
    }

    // Invalidate by tags
    if (job.tags.length > 0) {
      const count = await cacheCoordinator.invalidate([], job.tags)
      totalInvalidated += count
    }

    job.status = 'completed'
    this.updateMetrics(Date.now() - startTime, true)

    console.log(`✅ Invalidation job ${job.id} completed - ${totalInvalidated} entries invalidated`)
  }

  private groupByStrategy(dependencies: CacheDependency[]): Map<InvalidationStrategy, CacheDependency[]> {
    const groups = new Map<InvalidationStrategy, CacheDependency[]>()

    for (const dep of dependencies) {
      if (!groups.has(dep.strategy)) {
        groups.set(dep.strategy, [])
      }
      groups.get(dep.strategy)!.push(dep)
    }

    return groups
  }

  private async executeInvalidationStrategy(
    strategy: InvalidationStrategy,
    dependencies: CacheDependency[],
    context: Record<string, any>
  ): Promise<void> {
    switch (strategy) {
      case 'immediate':
        await this.executeImmediateInvalidation(dependencies)
        break
      case 'write-behind':
        await this.executeWriteBehindInvalidation(dependencies)
        break
      case 'scheduled':
        await this.executeScheduledInvalidation(dependencies)
        break
      case 'dependency-based':
        await this.executeDependencyBasedInvalidation(dependencies, context)
        break
      case 'event-driven':
        await this.executeEventDrivenInvalidation(dependencies, context)
        break
    }
  }

  private async executeImmediateInvalidation(dependencies: CacheDependency[]): Promise<void> {
    const keys = dependencies.map(dep => dep.key)
    for (const key of keys) {
      await cacheCoordinator.invalidate(key)
      
      // Update dependency tracking
      const dep = this.dependencies.get(key)
      if (dep) {
        dep.lastInvalidated = Date.now()
      }
    }
  }

  private async executeWriteBehindInvalidation(dependencies: CacheDependency[]): Promise<void> {
    // Queue for background processing
    const delay = 1000 // 1 second delay
    setTimeout(async () => {
      await this.executeImmediateInvalidation(dependencies)
    }, delay)
  }

  private async executeScheduledInvalidation(dependencies: CacheDependency[]): Promise<void> {
    const delay = 5000 // 5 second delay for scheduled invalidation
    setTimeout(async () => {
      await this.executeImmediateInvalidation(dependencies)
    }, delay)
  }

  private async executeDependencyBasedInvalidation(
    dependencies: CacheDependency[],
    context: Record<string, any>
  ): Promise<void> {
    for (const dep of dependencies) {
      // Check if dependencies are still valid
      const dependencyValid = await this.checkDependencyValidity(dep, context)
      if (!dependencyValid) {
        await cacheCoordinator.invalidate(dep.key)
        dep.lastInvalidated = Date.now()
      }
    }
  }

  private async executeEventDrivenInvalidation(
    dependencies: CacheDependency[],
    context: Record<string, any>
  ): Promise<void> {
    // Similar to immediate but with event context consideration
    await this.executeImmediateInvalidation(dependencies)
  }

  private async findCascadeDependencies(
    key: string,
    visited: Set<string>,
    toInvalidate: Set<string>
  ): Promise<void> {
    if (visited.has(key)) return
    visited.add(key)
    toInvalidate.add(key)

    const dependency = this.dependencies.get(key)
    if (dependency) {
      for (const depKey of dependency.dependsOn) {
        await this.findCascadeDependencies(depKey, visited, toInvalidate)
      }
    }
  }

  private async checkDependencyValidity(
    dependency: CacheDependency,
    context: Record<string, any>
  ): Promise<boolean> {
    // Check if any of the dependencies have been modified
    for (const depKey of dependency.dependsOn) {
      const cachedValue = await cacheCoordinator.get(depKey)
      if (!cachedValue) {
        return false // Dependency is missing
      }
    }
    return true
  }

  private generateJobId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private updateMetrics(executionTime: number, success: boolean): void {
    this.metrics.totalInvalidations++
    this.metrics.lastInvalidation = Date.now()
    
    if (success) {
      this.metrics.successfulInvalidations++
    } else {
      this.metrics.failedInvalidations++
    }
    
    this.metrics.avgInvalidationTime = 
      (this.metrics.avgInvalidationTime + executionTime) / 2
  }

  private setupDependencyTracking(): void {
    // Register common cache dependencies
    this.registerCommonDependencies()
  }

  private registerCommonDependencies(): void {
    // User profile dependencies
    this.registerDependency({
      key: 'user:*:profile',
      dependsOn: ['user:*:subscription'],
      triggers: ['user_update', 'subscription_change'],
      strategy: 'immediate',
      priority: 'high'
    })

    // Translation dependencies
    this.registerDependency({
      key: 'translation:*',
      dependsOn: ['languages:*', 'config:quality'],
      triggers: ['content_change', 'system_maintenance'],
      strategy: 'immediate',
      priority: 'medium'
    })

    // Rate limiting dependencies
    this.registerDependency({
      key: 'rate_limit:*',
      dependsOn: ['user:*:subscription'],
      triggers: ['subscription_change'],
      strategy: 'immediate',
      priority: 'high'
    })
  }

  private startQueueProcessor(): void {
    // Process queue every second
    setInterval(() => {
      if (!this.processingQueue && this.invalidationQueue.length > 0) {
        this.processQueue()
      }
    }, 1000)
  }
}

// Global invalidator instance
export const cacheInvalidator = new SmartCacheInvalidator()