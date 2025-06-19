import { cacheCoordinator } from './cache-coordinator'
import { cacheAnalytics } from './cache-analytics'
import { translationService } from '@/lib/translation-service'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Warming Strategy Types
export type WarmingStrategy = 
  | 'predictive'      // Based on usage patterns
  | 'scheduled'       // Time-based warming
  | 'reactive'        // After cache misses
  | 'preemptive'      // Before expiration
  | 'seasonal'        // Based on time patterns

// Warming Priority Levels
export type WarmingPriority = 'critical' | 'high' | 'medium' | 'low'

// Warming Job Definition
interface WarmingJob {
  id: string
  strategy: WarmingStrategy
  priority: WarmingPriority
  keys: string[]
  patterns: string[]
  dataGenerator: () => Promise<any>
  scheduledFor: number
  estimatedDuration: number
  retryCount: number
  maxRetries: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: number
  completedAt?: number
  error?: string
}

// Warming Pattern Definition
interface WarmingPattern {
  pattern: string
  frequency: number
  lastAccessed: number
  avgResponseTime: number
  dataSize: number
  importance: number
  timeSlots: number[] // Hours when this pattern is most accessed
}

// Cache Warming System
export class CacheWarmingSystem {
  private warmingQueue: WarmingJob[] = []
  private isWarming = false
  private patterns = new Map<string, WarmingPattern>()
  private warmingHistory: Array<{ timestamp: number; pattern: string; success: boolean }> = []
  private maxHistorySize = 1000

  constructor() {
    this.initializePatterns()
    this.setupScheduledWarming()
    this.startWarmingProcessor()
  }

  // Predictive cache warming based on usage patterns
  async warmPredictively(lookAheadHours: number = 2): Promise<void> {
    console.log(`🔮 Starting predictive warming for next ${lookAheadHours} hours`)
    
    const currentHour = new Date().getHours()
    const targetHours = Array.from({ length: lookAheadHours }, (_, i) => 
      (currentHour + i + 1) % 24
    )

    const patternsToWarm = Array.from(this.patterns.values())
      .filter(pattern => 
        pattern.timeSlots.some(slot => targetHours.includes(slot)) &&
        pattern.importance > 0.7
      )
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20) // Top 20 patterns

    for (const pattern of patternsToWarm) {
      await this.warmPattern(pattern, 'predictive')
    }
  }

  // Warm frequently accessed translation patterns
  async warmTranslationPatterns(): Promise<void> {
    console.log('🌡️ Warming popular translation patterns')

    const popularPatterns = [
      // Common language pairs
      { source: 'en', target: 'vi', text: 'Hello, how are you?' },
      { source: 'vi', target: 'en', text: 'Xin chào, bạn khỏe không?' },
      { source: 'en', target: 'vi', text: 'Thank you very much' },
      { source: 'vi', target: 'en', text: 'Cảm ơn bạn rất nhiều' },
      
      // Business translations
      { source: 'en', target: 'vi', text: 'Please review this document' },
      { source: 'en', target: 'vi', text: 'Meeting scheduled for tomorrow' },
      { source: 'vi', target: 'en', text: 'Tôi cần giúp đỡ về dự án này' },
      
      // Technical terms
      { source: 'en', target: 'vi', text: 'API integration documentation' },
      { source: 'en', target: 'vi', text: 'Database connection error' },
      { source: 'vi', target: 'en', text: 'Hệ thống đang bảo trì' }
    ]

    const warmingPromises = popularPatterns.map(async (pattern) => {
      try {
        const result = await translationService.translateText({
          text: pattern.text,
          sourceLang: pattern.source,
          targetLang: pattern.target,
          qualityTier: 'standard',
          abTestVariant: 'cache_enabled'
        })

        // Store in cache with extended TTL for warmed content
        const key = `translation:${pattern.text}:${pattern.source}:${pattern.target}:standard`
        await cacheCoordinator.set(key, result, 7200, ['warmed', 'translations']) // 2 hour TTL

        console.log(`✅ Warmed translation: ${pattern.source} → ${pattern.target}`)
      } catch (error) {
        console.error(`❌ Failed to warm translation pattern:`, error)
      }
    })

    await Promise.allSettled(warmingPromises)
  }

  // Warm user-specific data based on recent activity
  async warmUserData(userId: string): Promise<void> {
    console.log(`👤 Warming cache for user: ${userId}`)

    try {
      // Get user's recent translation history
      const supabase = createRouteHandlerClient({ cookies })
      const { data: recentTranslations } = await supabase
        .from('translation_history')
        .select('source_language, target_language, quality_tier')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentTranslations) {
        // Extract unique language pairs
        const languagePairs = new Set(
          recentTranslations.map(t => `${t.source_language}:${t.target_language}:${t.quality_tier}`)
        )

        // Warm supported languages cache
        await this.warmSupportedLanguages()

        // Warm user profile
        await this.warmUserProfile(userId)

        // Warm rate limiting data
        await this.warmRateLimitData(userId)

        console.log(`✅ Warmed ${languagePairs.size} language pairs for user ${userId}`)
      }
    } catch (error) {
      console.error(`❌ Failed to warm user data for ${userId}:`, error)
    }
  }

  // Reactive warming after cache misses
  async warmAfterMiss(key: string, dataGenerator: () => Promise<any>): Promise<void> {
    const pattern = this.extractPattern(key)
    
    // Update pattern importance
    this.updatePatternImportance(pattern, 'miss')

    // Schedule warming job
    const job: WarmingJob = {
      id: this.generateJobId(),
      strategy: 'reactive',
      priority: 'high',
      keys: [key],
      patterns: [pattern],
      dataGenerator,
      scheduledFor: Date.now() + 1000, // 1 second delay
      estimatedDuration: 5000,
      retryCount: 0,
      maxRetries: 2,
      status: 'pending',
      createdAt: Date.now()
    }

    this.queueWarmingJob(job)
  }

  // Preemptive warming before cache expiration
  async warmBeforeExpiration(keys: string[], ttlThreshold: number = 300): Promise<void> {
    console.log(`⏰ Checking ${keys.length} keys for preemptive warming`)

    const keysToWarm: string[] = []

    for (const key of keys) {
      // Check if key exists and is close to expiration
      const cached = await cacheCoordinator.get(key)
      if (cached) {
        // Simulate TTL checking (in real implementation, would check actual TTL)
        const shouldWarm = Math.random() < 0.3 // 30% chance for simulation
        if (shouldWarm) {
          keysToWarm.push(key)
        }
      }
    }

    if (keysToWarm.length > 0) {
      const job: WarmingJob = {
        id: this.generateJobId(),
        strategy: 'preemptive',
        priority: 'medium',
        keys: keysToWarm,
        patterns: keysToWarm.map(k => this.extractPattern(k)),
        dataGenerator: async () => {
          // Would regenerate data for expiring keys
          return {}
        },
        scheduledFor: Date.now(),
        estimatedDuration: keysToWarm.length * 1000,
        retryCount: 0,
        maxRetries: 1,
        status: 'pending',
        createdAt: Date.now()
      }

      this.queueWarmingJob(job)
    }
  }

  // Seasonal warming based on time patterns
  async warmSeasonally(): Promise<void> {
    const currentHour = new Date().getHours()
    const currentDay = new Date().getDay()

    console.log(`🗓️ Seasonal warming for hour ${currentHour}, day ${currentDay}`)

    // Peak hours warming (9 AM - 5 PM weekdays)
    if (currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour <= 17) {
      await this.warmBusinessHoursContent()
    }

    // Evening warming (6 PM - 10 PM)
    if (currentHour >= 18 && currentHour <= 22) {
      await this.warmEveningContent()
    }

    // Weekend warming
    if (currentDay === 0 || currentDay === 6) {
      await this.warmWeekendContent()
    }
  }

  // Bulk warming for maintenance periods
  async bulkWarm(patterns: string[], priority: WarmingPriority = 'low'): Promise<void> {
    console.log(`📦 Bulk warming ${patterns.length} patterns`)

    const job: WarmingJob = {
      id: this.generateJobId(),
      strategy: 'scheduled',
      priority,
      keys: [],
      patterns,
      dataGenerator: async () => {
        // Bulk data generation logic
        return {}
      },
      scheduledFor: Date.now(),
      estimatedDuration: patterns.length * 2000,
      retryCount: 0,
      maxRetries: 1,
      status: 'pending',
      createdAt: Date.now()
    }

    this.queueWarmingJob(job)
  }

  // Get warming statistics
  getWarmingStats(): {
    queueSize: number
    isWarming: boolean
    patternsTracked: number
    successRate: number
    avgWarmingTime: number
    recentActivity: Array<{ pattern: string; timestamp: number; success: boolean }>
  } {
    const recentHistory = this.warmingHistory.slice(-100)
    const successCount = recentHistory.filter(h => h.success).length
    const successRate = recentHistory.length > 0 ? successCount / recentHistory.length : 0

    return {
      queueSize: this.warmingQueue.length,
      isWarming: this.isWarming,
      patternsTracked: this.patterns.size,
      successRate,
      avgWarmingTime: 0, // Would calculate from completed jobs
      recentActivity: this.warmingHistory.slice(-10)
    }
  }

  // Get warming recommendations
  getWarmingRecommendations(): Array<{
    pattern: string
    reason: string
    priority: WarmingPriority
    estimatedImpact: string
  }> {
    const recommendations = []
    const analytics = cacheAnalytics.getRealtimeMetrics()

    // Low hit rate patterns
    if (analytics.currentHitRate < 0.7) {
      recommendations.push({
        pattern: 'translation:*',
        reason: 'Low cache hit rate detected',
        priority: 'high' as const,
        estimatedImpact: 'Increase hit rate by 20-30%'
      })
    }

    // High response time patterns
    if (analytics.avgResponseTime > 200) {
      recommendations.push({
        pattern: 'user:*:profile',
        reason: 'High response times for user data',
        priority: 'medium' as const,
        estimatedImpact: 'Reduce response time by 40%'
      })
    }

    // Patterns with high importance but low cache presence
    const highImportancePatterns = Array.from(this.patterns.values())
      .filter(p => p.importance > 0.8)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)

    highImportancePatterns.forEach(pattern => {
      recommendations.push({
        pattern: pattern.pattern,
        reason: 'High importance pattern with potential for warming',
        priority: 'medium' as const,
        estimatedImpact: 'Improve user experience for common operations'
      })
    })

    return recommendations
  }

  // Private helper methods
  private async warmPattern(pattern: WarmingPattern, strategy: WarmingStrategy): Promise<void> {
    const job: WarmingJob = {
      id: this.generateJobId(),
      strategy,
      priority: this.calculatePriority(pattern.importance),
      keys: [],
      patterns: [pattern.pattern],
      dataGenerator: async () => this.generateDataForPattern(pattern),
      scheduledFor: Date.now(),
      estimatedDuration: pattern.avgResponseTime * 2,
      retryCount: 0,
      maxRetries: 2,
      status: 'pending',
      createdAt: Date.now()
    }

    this.queueWarmingJob(job)
  }

  private async warmSupportedLanguages(): Promise<void> {
    try {
      const languages = await translationService.getSupportedLanguages()
      await cacheCoordinator.set('languages:supported', languages, 86400, ['languages', 'config']) // 24 hour TTL
    } catch (error) {
      console.error('Failed to warm supported languages:', error)
    }
  }

  private async warmUserProfile(userId: string): Promise<void> {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profile) {
        await cacheCoordinator.set(`user:${userId}:profile`, profile, 3600, [`user:${userId}`])
      }
    } catch (error) {
      console.error(`Failed to warm user profile for ${userId}:`, error)
    }
  }

  private async warmRateLimitData(userId: string): Promise<void> {
    // Pre-populate rate limiting cache
    const key = `rate_limit:${userId}:translation`
    await cacheCoordinator.set(key, { count: 0, resetTime: Date.now() + 3600000 }, 3600, [`user:${userId}`])
  }

  private async warmBusinessHoursContent(): Promise<void> {
    const businessPatterns = [
      'translation:*:business:*',
      'user:*:subscription',
      'config:business_hours'
    ]

    await this.bulkWarm(businessPatterns, 'high')
  }

  private async warmEveningContent(): Promise<void> {
    const eveningPatterns = [
      'translation:*:casual:*',
      'user:*:history',
      'stats:daily'
    ]

    await this.bulkWarm(eveningPatterns, 'medium')
  }

  private async warmWeekendContent(): Promise<void> {
    const weekendPatterns = [
      'translation:*:personal:*',
      'config:weekend_offers'
    ]

    await this.bulkWarm(weekendPatterns, 'low')
  }

  private queueWarmingJob(job: WarmingJob): void {
    this.warmingQueue.push(job)
    
    // Sort by priority and scheduled time
    this.warmingQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      
      if (priorityDiff !== 0) return priorityDiff
      return a.scheduledFor - b.scheduledFor
    })

    if (!this.isWarming) {
      this.processWarmingQueue()
    }
  }

  private async processWarmingQueue(): Promise<void> {
    if (this.isWarming || this.warmingQueue.length === 0) return

    this.isWarming = true

    while (this.warmingQueue.length > 0) {
      const job = this.warmingQueue[0]

      // Check if job is ready to run
      if (job.scheduledFor > Date.now()) {
        setTimeout(() => this.processWarmingQueue(), job.scheduledFor - Date.now())
        break
      }

      // Remove job from queue
      this.warmingQueue.shift()

      try {
        await this.executeWarmingJob(job)
      } catch (error) {
        console.error(`Warming job ${job.id} failed:`, error)
        
        if (job.retryCount < job.maxRetries) {
          job.retryCount++
          job.scheduledFor = Date.now() + (1000 * Math.pow(2, job.retryCount))
          job.status = 'pending'
          job.error = error instanceof Error ? error.message : 'Unknown error'
          this.warmingQueue.push(job)
        } else {
          job.status = 'failed'
          this.recordWarmingResult(job.patterns[0] || 'unknown', false)
        }
      }
    }

    this.isWarming = false
  }

  private async executeWarmingJob(job: WarmingJob): Promise<void> {
    job.status = 'running'
    const startTime = Date.now()

    try {
      const data = await job.dataGenerator()
      
      // Store data in cache
      for (const pattern of job.patterns) {
        const key = this.generateKeyFromPattern(pattern)
        await cacheCoordinator.set(key, data, 7200, ['warmed']) // 2 hour TTL for warmed data
      }

      job.status = 'completed'
      job.completedAt = Date.now()
      
      this.recordWarmingResult(job.patterns[0] || 'unknown', true)
      
      console.log(`🔥 Warming job ${job.id} completed in ${Date.now() - startTime}ms`)
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  private generateDataForPattern(pattern: WarmingPattern): Promise<any> {
    // Generate appropriate data based on pattern
    if (pattern.pattern.includes('translation')) {
      return Promise.resolve({
        translatedText: 'Sample translation',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityScore: 0.95,
        cached: false
      })
    }

    return Promise.resolve({ data: 'sample data', warmed: true })
  }

  private extractPattern(key: string): string {
    return key
      .replace(/:\d+/g, ':*')
      .replace(/:[a-f0-9-]{36}/g, ':*')
      .replace(/:[a-zA-Z0-9]{20,}/g, ':*')
  }

  private generateKeyFromPattern(pattern: string): string {
    return pattern.replace(/\*/g, 'sample')
  }

  private calculatePriority(importance: number): WarmingPriority {
    if (importance >= 0.9) return 'critical'
    if (importance >= 0.7) return 'high'
    if (importance >= 0.5) return 'medium'
    return 'low'
  }

  private updatePatternImportance(pattern: string, event: 'hit' | 'miss'): void {
    if (!this.patterns.has(pattern)) {
      this.patterns.set(pattern, {
        pattern,
        frequency: 0,
        lastAccessed: Date.now(),
        avgResponseTime: 100,
        dataSize: 1000,
        importance: 0.5,
        timeSlots: []
      })
    }

    const patternData = this.patterns.get(pattern)!
    patternData.frequency++
    patternData.lastAccessed = Date.now()
    
    if (event === 'miss') {
      patternData.importance = Math.min(1.0, patternData.importance + 0.1)
    }

    // Update time slot tracking
    const currentHour = new Date().getHours()
    if (!patternData.timeSlots.includes(currentHour)) {
      patternData.timeSlots.push(currentHour)
    }
  }

  private recordWarmingResult(pattern: string, success: boolean): void {
    this.warmingHistory.push({
      timestamp: Date.now(),
      pattern,
      success
    })

    // Maintain history size
    if (this.warmingHistory.length > this.maxHistorySize) {
      this.warmingHistory = this.warmingHistory.slice(-this.maxHistorySize)
    }
  }

  private generateJobId(): string {
    return `warm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializePatterns(): void {
    // Initialize with common patterns
    const commonPatterns = [
      'translation:*:en:vi:*',
      'translation:*:vi:en:*',
      'user:*:profile',
      'user:*:subscription',
      'languages:supported',
      'config:*'
    ]

    commonPatterns.forEach(pattern => {
      this.patterns.set(pattern, {
        pattern,
        frequency: 0,
        lastAccessed: Date.now(),
        avgResponseTime: 100,
        dataSize: 1000,
        importance: 0.6,
        timeSlots: []
      })
    })
  }

  private setupScheduledWarming(): void {
    // Predictive warming every 30 minutes
    setInterval(() => {
      this.warmPredictively(1)
    }, 30 * 60 * 1000)

    // Seasonal warming every hour
    setInterval(() => {
      this.warmSeasonally()
    }, 60 * 60 * 1000)

    // Popular translations warming every 2 hours
    setInterval(() => {
      this.warmTranslationPatterns()
    }, 2 * 60 * 60 * 1000)
  }

  private startWarmingProcessor(): void {
    // Process warming queue every 5 seconds
    setInterval(() => {
      if (!this.isWarming && this.warmingQueue.length > 0) {
        this.processWarmingQueue()
      }
    }, 5000)
  }
}

// Global warming system instance
export const cacheWarmingSystem = new CacheWarmingSystem()