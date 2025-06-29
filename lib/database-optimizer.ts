/* ============================================================================ */
/* PRISMY DATABASE OPTIMIZATION ENGINE - PHASE 1.2 */
/* Enterprise-grade query optimization and performance monitoring */
/* ============================================================================ */

import {
  createServiceRoleClient,
  batchQueries,
  withQueryOptimization,
} from './supabase'
import { redisTranslationCache } from './redis-translation-cache'
import { createHash } from 'crypto'

export interface DatabaseMetrics {
  queryCount: number
  averageResponseTime: number
  slowQueries: Array<{
    query: string
    duration: number
    timestamp: string
  }>
  connectionPoolStatus: {
    active: number
    idle: number
    waiting: number
  }
  indexUsage: Record<string, number>
}

export interface OptimizationSuggestion {
  type: 'index' | 'query' | 'caching' | 'connection'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  implementation: string
  estimatedImpact: string
}

/* ============================================================================ */
/* INTELLIGENT QUERY OPTIMIZER */
/* ============================================================================ */

export class DatabaseOptimizer {
  private supabase = createServiceRoleClient()
  private queryMetrics = new Map<
    string,
    Array<{ duration: number; timestamp: number }>
  >()
  private slowQueryThreshold = 1000 // 1 second

  /**
   * Optimized user profile lookup with intelligent caching
   */
  async getUserProfileOptimized(userId: string) {
    const cacheKey = `user_profile:${userId}`

    // Try cache first
    const cached = await this.getCachedQuery(cacheKey)
    if (cached) {
      return cached
    }

    const startTime = Date.now()

    // Optimized query with minimal fields
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select(
        `
        id,
        subscription_tier,
        usage_limit,
        usage_count,
        usage_reset_date
      `
      )
      .eq('user_id', userId)
      .single()

    const duration = Date.now() - startTime
    this.recordQueryMetrics('getUserProfile', duration)

    if (error) throw error

    // Cache for 10 minutes
    await this.setCachedQuery(cacheKey, profile, 600)

    return profile
  }

  /**
   * Optimized translation history with pagination and caching
   */
  async getTranslationHistoryOptimized(
    userId: string,
    options: {
      page?: number
      limit?: number
      sourceLang?: string
      targetLang?: string
      search?: string
    } = {}
  ) {
    const { page = 1, limit = 20, sourceLang, targetLang, search } = options

    // Generate cache key
    const cacheKey = this.generateQueryCacheKey('translation_history', {
      userId,
      ...options,
    })

    // Try cache first
    const cached = await this.getCachedQuery(cacheKey)
    if (cached) {
      return cached
    }

    const startTime = Date.now()

    // Build optimized query
    let query = this.supabase
      .from('translation_history')
      .select(
        `
        id,
        source_text,
        translated_text,
        source_language,
        target_language,
        quality_tier,
        quality_score,
        character_count,
        created_at,
        cached
      `
      )
      .eq('user_id', userId)

    // Apply filters efficiently
    if (sourceLang) query = query.eq('source_language', sourceLang)
    if (targetLang) query = query.eq('target_language', targetLang)
    if (search) {
      // Optimize search with indexed text search
      query = query.textSearch('source_text', search)
    }

    // Optimized pagination
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: history, error } = await query

    const duration = Date.now() - startTime
    this.recordQueryMetrics('getTranslationHistory', duration)

    if (error) throw error

    const result = {
      history: history || [],
      pagination: {
        page,
        limit,
        hasMore: (history?.length || 0) === limit,
      },
    }

    // Cache for 5 minutes
    await this.setCachedQuery(cacheKey, result, 300)

    return result
  }

  /**
   * Batch user analytics with optimized aggregation
   */
  async getUserAnalyticsOptimized(
    userId: string,
    timeRange: '24h' | '7d' | '30d' = '24h'
  ) {
    const cacheKey = `user_analytics:${userId}:${timeRange}`

    // Try cache first
    const cached = await this.getCachedQuery(cacheKey)
    if (cached) {
      return cached
    }

    const startTime = Date.now()
    const hoursBack = this.parseTimeRange(timeRange)
    const sinceTime = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000
    ).toISOString()

    // Execute multiple queries in parallel for better performance
    const queries = [
      // Total translations count
      () =>
        this.supabase
          .from('translation_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', sinceTime),

      // Character count sum
      () =>
        this.supabase
          .from('translation_history')
          .select('character_count')
          .eq('user_id', userId)
          .gte('created_at', sinceTime),

      // Language pairs distribution
      () =>
        this.supabase
          .from('translation_history')
          .select('source_language, target_language')
          .eq('user_id', userId)
          .gte('created_at', sinceTime)
          .limit(1000),

      // Quality distribution
      () =>
        this.supabase
          .from('translation_history')
          .select('quality_tier, quality_score')
          .eq('user_id', userId)
          .gte('created_at', sinceTime)
          .limit(1000),
    ]

    const [countResult, charactersResult, languagesResult, qualityResult] =
      await batchQueries(queries, 4)

    const duration = Date.now() - startTime
    this.recordQueryMetrics('getUserAnalytics', duration)

    const analytics = {
      totalTranslations: countResult.count || 0,
      totalCharacters:
        charactersResult.data?.reduce(
          (sum: number, row: any) => sum + (row.character_count || 0),
          0
        ) || 0,
      languagePairs: this.aggregateLanguagePairs(languagesResult.data || []),
      qualityDistribution: this.aggregateQualityData(qualityResult.data || []),
      cacheStats: await redisTranslationCache.getStats(),
      timeRange,
    }

    // Cache for 15 minutes (analytics don't need real-time accuracy)
    await this.setCachedQuery(cacheKey, analytics, 900)

    return analytics
  }

  /**
   * Database health monitoring and optimization suggestions
   */
  async getDatabaseHealth(): Promise<{
    metrics: DatabaseMetrics
    suggestions: OptimizationSuggestion[]
  }> {
    const startTime = Date.now()

    // Analyze query performance
    const slowQueries = this.getSlowQueries()
    const averageResponseTime = this.getAverageResponseTime()
    const queryCount = this.getTotalQueryCount()

    // Check for missing indexes (simulate - in real app, query pg_stat_user_tables)
    const indexSuggestions = await this.analyzeIndexUsage()

    const metrics: DatabaseMetrics = {
      queryCount,
      averageResponseTime,
      slowQueries,
      connectionPoolStatus: {
        active: 5, // Would come from actual pool metrics
        idle: 10,
        waiting: 0,
      },
      indexUsage: {},
    }

    const suggestions = await this.generateOptimizationSuggestions(metrics)

    return { metrics, suggestions }
  }

  /**
   * Warm critical caches with popular data
   */
  async warmDatabaseCaches(): Promise<{
    warmedQueries: number
    cacheSize: number
  }> {
    console.log('🔥 Warming database caches...')

    // Get most active users for cache warming
    const { data: activeUsers } = await this.supabase
      .from('translation_history')
      .select('user_id')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .limit(100)

    if (!activeUsers) return { warmedQueries: 0, cacheSize: 0 }

    const uniqueUsers = [...new Set(activeUsers.map(u => u.user_id))]
    let warmedQueries = 0

    // Warm user profiles cache
    for (const userId of uniqueUsers.slice(0, 50)) {
      try {
        await this.getUserProfileOptimized(userId)
        warmedQueries++
      } catch (error) {
        console.warn(`Failed to warm cache for user ${userId}:`, error)
      }
    }

    console.log(
      `✅ Database cache warming completed: ${warmedQueries} queries warmed`
    )

    return {
      warmedQueries,
      cacheSize: this.getCacheSize(),
    }
  }

  /* ============================================================================ */
  /* PRIVATE HELPER METHODS */
  /* ============================================================================ */

  private async getCachedQuery(key: string): Promise<any | null> {
    try {
      // Use Redis for database query caching
      return (
        (await redisTranslationCache['redis']?.get(`db_cache:${key}`)) || null
      )
    } catch (error) {
      return null
    }
  }

  private async setCachedQuery(
    key: string,
    data: any,
    ttlSeconds: number
  ): Promise<void> {
    try {
      await redisTranslationCache['redis']?.setex(
        `db_cache:${key}`,
        ttlSeconds,
        JSON.stringify(data)
      )
    } catch (error) {
      console.warn('Failed to cache database query:', error)
    }
  }

  private generateQueryCacheKey(
    table: string,
    params: Record<string, any>
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key]
          return result
        },
        {} as Record<string, any>
      )

    const hash = createHash('md5')
      .update(JSON.stringify(sortedParams))
      .digest('hex')
    return `${table}:${hash}`
  }

  private recordQueryMetrics(queryName: string, duration: number): void {
    if (!this.queryMetrics.has(queryName)) {
      this.queryMetrics.set(queryName, [])
    }

    const metrics = this.queryMetrics.get(queryName)!
    metrics.push({ duration, timestamp: Date.now() })

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100)
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`)
    }
  }

  private getSlowQueries(): Array<{
    query: string
    duration: number
    timestamp: string
  }> {
    const slowQueries: Array<{
      query: string
      duration: number
      timestamp: string
    }> = []

    for (const [queryName, metrics] of this.queryMetrics.entries()) {
      const recentSlow = metrics
        .filter(m => m.duration > this.slowQueryThreshold)
        .slice(-5) // Last 5 slow queries per type
        .map(m => ({
          query: queryName,
          duration: m.duration,
          timestamp: new Date(m.timestamp).toISOString(),
        }))

      slowQueries.push(...recentSlow)
    }

    return slowQueries.sort((a, b) => b.duration - a.duration).slice(0, 10)
  }

  private getAverageResponseTime(): number {
    let totalDuration = 0
    let totalQueries = 0

    for (const metrics of this.queryMetrics.values()) {
      const recentMetrics = metrics.slice(-50) // Last 50 queries
      totalDuration += recentMetrics.reduce((sum, m) => sum + m.duration, 0)
      totalQueries += recentMetrics.length
    }

    return totalQueries > 0 ? totalDuration / totalQueries : 0
  }

  private getTotalQueryCount(): number {
    return Array.from(this.queryMetrics.values()).reduce(
      (sum, metrics) => sum + metrics.length,
      0
    )
  }

  private async analyzeIndexUsage(): Promise<OptimizationSuggestion[]> {
    // In a real implementation, this would query PostgreSQL system tables
    // For now, return common optimization suggestions
    return [
      {
        type: 'index',
        priority: 'high',
        title: 'Add compound index on translation_history',
        description:
          'Queries filtering by user_id and created_at would benefit from a compound index',
        implementation:
          'CREATE INDEX CONCURRENTLY idx_translation_history_user_created ON translation_history(user_id, created_at DESC);',
        estimatedImpact: '50-70% faster pagination queries',
      },
      {
        type: 'index',
        priority: 'medium',
        title: 'Add text search index for translation content',
        description:
          'Full-text search on source_text and translated_text would be faster with GIN index',
        implementation:
          "CREATE INDEX CONCURRENTLY idx_translation_fulltext ON translation_history USING GIN(to_tsvector('english', source_text || ' ' || translated_text));",
        estimatedImpact: '80-90% faster text search queries',
      },
    ]
  }

  private async generateOptimizationSuggestions(
    metrics: DatabaseMetrics
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = []

    // Slow query suggestions
    if (metrics.averageResponseTime > 500) {
      suggestions.push({
        type: 'query',
        priority: 'critical',
        title: 'High Average Response Time',
        description: `Average query response time is ${metrics.averageResponseTime.toFixed(0)}ms`,
        implementation: 'Enable query caching and optimize slow queries',
        estimatedImpact: '60-80% faster response times',
      })
    }

    // Connection pool suggestions
    if (metrics.connectionPoolStatus.waiting > 0) {
      suggestions.push({
        type: 'connection',
        priority: 'high',
        title: 'Connection Pool Saturation',
        description: `${metrics.connectionPoolStatus.waiting} queries waiting for connections`,
        implementation:
          'Increase connection pool size or optimize long-running queries',
        estimatedImpact: 'Eliminate connection bottlenecks',
      })
    }

    // Caching suggestions
    const cacheStats = await redisTranslationCache.getStats()
    if (cacheStats && cacheStats.hitRate < 0.4) {
      suggestions.push({
        type: 'caching',
        priority: 'medium',
        title: 'Low Database Cache Hit Rate',
        description: `Database query cache hit rate is ${(cacheStats.hitRate * 100).toFixed(1)}%`,
        implementation:
          'Warm caches with popular queries and increase cache TTL for stable data',
        estimatedImpact: '30-50% reduction in database load',
      })
    }

    return suggestions
  }

  private parseTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '24h':
        return 24
      case '7d':
        return 24 * 7
      case '30d':
        return 24 * 30
      default:
        return 24
    }
  }

  private aggregateLanguagePairs(
    data: Array<{ source_language: string; target_language: string }>
  ): Record<string, number> {
    const pairs: Record<string, number> = {}
    data.forEach(item => {
      const pair = `${item.source_language}-${item.target_language}`
      pairs[pair] = (pairs[pair] || 0) + 1
    })
    return pairs
  }

  private aggregateQualityData(
    data: Array<{ quality_tier: string; quality_score: number }>
  ): Record<string, number> {
    const distribution: Record<string, number> = {}
    data.forEach(item => {
      const tier = item.quality_tier || 'standard'
      distribution[tier] = (distribution[tier] || 0) + 1
    })
    return distribution
  }

  private getCacheSize(): number {
    // Would return actual cache size in bytes
    return 0
  }
}

/* ============================================================================ */
/* BACKGROUND JOB PROCESSOR FOR LARGE OPERATIONS */
/* ============================================================================ */

export class BackgroundJobProcessor {
  private jobs = new Map<
    string,
    {
      id: string
      type: string
      status: 'pending' | 'running' | 'completed' | 'failed'
      progress: number
      result?: any
      error?: string
      createdAt: number
    }
  >()

  /**
   * Queue background job for processing large files
   */
  async queueJob(type: string, payload: any): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    this.jobs.set(jobId, {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
    })

    // Process job asynchronously
    this.processJobAsync(jobId, type, payload)

    return jobId
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string) {
    return this.jobs.get(jobId) || null
  }

  /**
   * Process job asynchronously
   */
  private async processJobAsync(
    jobId: string,
    type: string,
    payload: any
  ): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) return

    try {
      job.status = 'running'

      switch (type) {
        case 'large_document_processing':
          await this.processLargeDocument(jobId, payload)
          break
        case 'cache_warming':
          await this.processCacheWarming(jobId, payload)
          break
        case 'analytics_generation':
          await this.processAnalyticsGeneration(jobId, payload)
          break
        default:
          throw new Error(`Unknown job type: ${type}`)
      }

      job.status = 'completed'
      job.progress = 100
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Background job ${jobId} failed:`, error)
    }
  }

  private async processLargeDocument(
    jobId: string,
    payload: any
  ): Promise<void> {
    const job = this.jobs.get(jobId)!

    // Simulate large document processing with progress updates
    for (let i = 0; i <= 100; i += 10) {
      job.progress = i
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate work
    }

    job.result = { processedSize: payload.size, chunks: payload.chunks }
  }

  private async processCacheWarming(
    jobId: string,
    payload: any
  ): Promise<void> {
    const job = this.jobs.get(jobId)!
    const optimizer = new DatabaseOptimizer()

    job.progress = 50
    const result = await optimizer.warmDatabaseCaches()
    job.progress = 100
    job.result = result
  }

  private async processAnalyticsGeneration(
    jobId: string,
    payload: any
  ): Promise<void> {
    const job = this.jobs.get(jobId)!
    const optimizer = new DatabaseOptimizer()

    job.progress = 30
    const analytics = await optimizer.getUserAnalyticsOptimized(
      payload.userId,
      payload.timeRange
    )
    job.progress = 70

    // Generate additional insights
    const insights = {
      ...analytics,
      insights: this.generateAnalyticsInsights(analytics),
    }

    job.progress = 100
    job.result = insights
  }

  private generateAnalyticsInsights(analytics: any): string[] {
    const insights: string[] = []

    if (analytics.totalTranslations > 1000) {
      insights.push('High-volume user - consider premium features')
    }

    if (analytics.cacheStats?.hitRate > 0.7) {
      insights.push('Excellent cache utilization - patterns detected')
    }

    return insights
  }
}

/* ============================================================================ */
/* EXPORTS */
/* ============================================================================ */

export const databaseOptimizer = new DatabaseOptimizer()
export const backgroundJobProcessor = new BackgroundJobProcessor()

// Auto-warm caches on server start (in production)
if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    databaseOptimizer.warmDatabaseCaches().catch(console.error)
  }, 30000) // Wait 30 seconds after server start
}
