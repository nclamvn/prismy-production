import { cacheCoordinator } from './cache-coordinator'
import { cacheInvalidator } from './cache-invalidation'
import { performance } from 'perf_hooks'

// Analytics Metric Types
interface CacheMetric {
  timestamp: number
  layer: string
  operation: 'hit' | 'miss' | 'set' | 'delete' | 'eviction'
  key?: string
  size?: number
  responseTime?: number
  tags?: string[]
}

interface PerformanceTrend {
  period: 'hour' | 'day' | 'week' | 'month'
  hitRate: number[]
  responseTime: number[]
  throughput: number[]
  timestamps: number[]
}

interface CacheHotspot {
  pattern: string
  hitCount: number
  missCount: number
  hitRate: number
  avgResponseTime: number
  totalSize: number
  lastAccessed: number
}

interface CacheReport {
  summary: {
    totalHits: number
    totalMisses: number
    hitRate: number
    avgResponseTime: number
    totalSize: number
    entryCount: number
    topKeys: string[]
  }
  trends: PerformanceTrend[]
  hotspots: CacheHotspot[]
  inefficiencies: {
    lowHitRate: string[]
    highResponseTime: string[]
    oversizedEntries: string[]
    frequentEvictions: string[]
  }
  recommendations: string[]
}

// Cache Analytics and Monitoring System
export class CacheAnalytics {
  private metrics: CacheMetric[] = []
  private maxMetrics = 10000 // Keep last 10k metrics
  private aggregationIntervals = new Map<string, NodeJS.Timeout>()
  private hotspots = new Map<string, CacheHotspot>()
  
  constructor() {
    this.setupMetricCollection()
    this.setupAggregation()
    this.setupAlerts()
  }

  // Record cache operation metrics
  recordMetric(metric: CacheMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    })

    // Maintain metrics buffer size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Update hotspots
    this.updateHotspots(metric)

    // Check for alerts
    this.checkAlerts(metric)
  }

  // Generate comprehensive cache report
  generateReport(timeRange?: { start: number; end: number }): CacheReport {
    const relevantMetrics = this.filterMetricsByTime(timeRange)
    
    const summary = this.calculateSummary(relevantMetrics)
    const trends = this.calculateTrends(relevantMetrics)
    const hotspots = this.getTopHotspots(10)
    const inefficiencies = this.identifyInefficiencies(relevantMetrics)
    const recommendations = this.generateRecommendations(summary, inefficiencies)

    return {
      summary,
      trends,
      hotspots,
      inefficiencies,
      recommendations
    }
  }

  // Real-time performance monitoring
  getRealtimeMetrics(): {
    currentHitRate: number
    currentThroughput: number
    avgResponseTime: number
    memoryUsage: number
    queueSize: number
    activeConnections: number
  } {
    const recentMetrics = this.metrics.slice(-100) // Last 100 operations
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    
    const recentOps = recentMetrics.filter(m => m.timestamp > fiveMinutesAgo)
    
    const hits = recentOps.filter(m => m.operation === 'hit').length
    const misses = recentOps.filter(m => m.operation === 'miss').length
    const total = hits + misses
    
    const hitRate = total > 0 ? hits / total : 0
    const throughput = recentOps.length / 5 // ops per minute
    
    const responseTimes = recentOps
      .filter(m => m.responseTime !== undefined)
      .map(m => m.responseTime!)
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    return {
      currentHitRate: hitRate,
      currentThroughput: throughput,
      avgResponseTime,
      memoryUsage: this.getMemoryUsage(),
      queueSize: cacheInvalidator.getMetrics().queueSize,
      activeConnections: 0 // Would be populated from actual connection pool
    }
  }

  // Cache optimization suggestions
  getOptimizationSuggestions(): {
    priority: 'high' | 'medium' | 'low'
    category: 'performance' | 'memory' | 'configuration'
    suggestion: string
    impact: string
    implementation: string
  }[] {
    const suggestions = []
    const realtimeMetrics = this.getRealtimeMetrics()
    const hotspots = Array.from(this.hotspots.values())

    // Hit rate optimization
    if (realtimeMetrics.currentHitRate < 0.7) {
      suggestions.push({
        priority: 'high' as const,
        category: 'performance' as const,
        suggestion: 'Implement cache warming for frequently accessed data',
        impact: 'Increase hit rate by 15-25%',
        implementation: 'Use cache warming API during off-peak hours'
      })
    }

    // Response time optimization
    if (realtimeMetrics.avgResponseTime > 100) {
      suggestions.push({
        priority: 'medium' as const,
        category: 'performance' as const,
        suggestion: 'Enable compression for large cache entries',
        impact: 'Reduce response time by 20-40%',
        implementation: 'Enable compression in cache coordinator config'
      })
    }

    // Memory optimization
    if (realtimeMetrics.memoryUsage > 80) {
      suggestions.push({
        priority: 'high' as const,
        category: 'memory' as const,
        suggestion: 'Implement more aggressive LRU eviction',
        impact: 'Reduce memory usage by 30%',
        implementation: 'Decrease maxMemorySize or implement smarter eviction'
      })
    }

    // Hotspot optimization
    const lowHitRateHotspots = hotspots.filter(h => h.hitRate < 0.5)
    if (lowHitRateHotspots.length > 0) {
      suggestions.push({
        priority: 'medium' as const,
        category: 'configuration' as const,
        suggestion: 'Review caching strategy for low-hit-rate patterns',
        impact: 'Improve overall cache efficiency',
        implementation: 'Analyze patterns and adjust TTL or caching logic'
      })
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Cache health monitoring
  getHealthScore(): {
    score: number // 0-100
    status: 'excellent' | 'good' | 'warning' | 'critical'
    issues: string[]
    recommendations: string[]
  } {
    const metrics = this.getRealtimeMetrics()
    let score = 100
    const issues: string[] = []
    const recommendations: string[] = []

    // Hit rate assessment (40% of score)
    const hitRateScore = metrics.currentHitRate * 40
    score = Math.min(score, hitRateScore + 60)
    if (metrics.currentHitRate < 0.6) {
      issues.push('Low cache hit rate')
      recommendations.push('Implement cache warming strategy')
    }

    // Response time assessment (30% of score)
    const responseTimeScore = Math.max(0, 30 - (metrics.avgResponseTime / 10))
    score = Math.min(score, score - (30 - responseTimeScore))
    if (metrics.avgResponseTime > 200) {
      issues.push('High response times')
      recommendations.push('Enable compression and optimize cache keys')
    }

    // Memory usage assessment (20% of score)
    const memoryScore = Math.max(0, 20 - (metrics.memoryUsage - 80) * 2)
    score = Math.min(score, score - (20 - memoryScore))
    if (metrics.memoryUsage > 90) {
      issues.push('High memory usage')
      recommendations.push('Increase eviction frequency')
    }

    // Queue health assessment (10% of score)
    const queueScore = Math.max(0, 10 - metrics.queueSize * 2)
    score = Math.min(score, score - (10 - queueScore))
    if (metrics.queueSize > 5) {
      issues.push('Large invalidation queue')
      recommendations.push('Optimize invalidation patterns')
    }

    let status: 'excellent' | 'good' | 'warning' | 'critical'
    if (score >= 90) status = 'excellent'
    else if (score >= 75) status = 'good'
    else if (score >= 60) status = 'warning'
    else status = 'critical'

    return { score: Math.round(score), status, issues, recommendations }
  }

  // Cache pattern analysis
  analyzePatterns(days: number = 7): {
    patterns: {
      pattern: string
      frequency: number
      avgSize: number
      peakHours: number[]
      seasonality: 'high' | 'medium' | 'low'
    }[]
    insights: string[]
  } {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    const relevantMetrics = this.metrics.filter(m => m.timestamp > cutoff)
    
    // Extract patterns from cache keys
    const patternMap = new Map<string, {
      count: number
      sizes: number[]
      hours: number[]
    }>()

    relevantMetrics.forEach(metric => {
      if (metric.key) {
        const pattern = this.extractPattern(metric.key)
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, { count: 0, sizes: [], hours: [] })
        }
        
        const data = patternMap.get(pattern)!
        data.count++
        if (metric.size) data.sizes.push(metric.size)
        data.hours.push(new Date(metric.timestamp).getHours())
      }
    })

    const patterns = Array.from(patternMap.entries()).map(([pattern, data]) => {
      const avgSize = data.sizes.length > 0 
        ? data.sizes.reduce((a, b) => a + b, 0) / data.sizes.length 
        : 0
      
      // Find peak hours
      const hourCounts = new Array(24).fill(0)
      data.hours.forEach(hour => hourCounts[hour]++)
      const maxCount = Math.max(...hourCounts)
      const peakHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .filter(({ count }) => count > maxCount * 0.8)
        .map(({ hour }) => hour)

      // Determine seasonality based on hour distribution variance
      const hourVariance = this.calculateVariance(hourCounts)
      const seasonality: 'high' | 'medium' | 'low' = 
        hourVariance > 100 ? 'high' : hourVariance > 50 ? 'medium' : 'low'

      return {
        pattern,
        frequency: data.count,
        avgSize,
        peakHours,
        seasonality
      }
    }).sort((a, b) => b.frequency - a.frequency)

    const insights = this.generatePatternInsights(patterns)

    return { patterns: patterns.slice(0, 20), insights }
  }

  // Export analytics data
  exportData(format: 'json' | 'csv' = 'json'): string {
    const report = this.generateReport()
    
    if (format === 'csv') {
      return this.convertToCSV(report)
    }
    
    return JSON.stringify(report, null, 2)
  }

  // Private helper methods
  private filterMetricsByTime(timeRange?: { start: number; end: number }): CacheMetric[] {
    if (!timeRange) return this.metrics
    
    return this.metrics.filter(m => 
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    )
  }

  private calculateSummary(metrics: CacheMetric[]): CacheReport['summary'] {
    const hits = metrics.filter(m => m.operation === 'hit').length
    const misses = metrics.filter(m => m.operation === 'miss').length
    const total = hits + misses

    const responseTimes = metrics
      .filter(m => m.responseTime !== undefined)
      .map(m => m.responseTime!)
    
    const sizes = metrics
      .filter(m => m.size !== undefined)
      .map(m => m.size!)

    const keyFrequency = new Map<string, number>()
    metrics.forEach(m => {
      if (m.key) {
        keyFrequency.set(m.key, (keyFrequency.get(m.key) || 0) + 1)
      }
    })

    const topKeys = Array.from(keyFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => key)

    return {
      totalHits: hits,
      totalMisses: misses,
      hitRate: total > 0 ? hits / total : 0,
      avgResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0,
      totalSize: sizes.reduce((a, b) => a + b, 0),
      entryCount: new Set(metrics.map(m => m.key)).size,
      topKeys
    }
  }

  private calculateTrends(metrics: CacheMetric[]): PerformanceTrend[] {
    const trends: PerformanceTrend[] = []
    const periods = ['hour', 'day'] as const

    periods.forEach(period => {
      const buckets = this.groupMetricsByPeriod(metrics, period)
      const trend: PerformanceTrend = {
        period,
        hitRate: [],
        responseTime: [],
        throughput: [],
        timestamps: []
      }

      buckets.forEach(({ timestamp, bucketMetrics }) => {
        const hits = bucketMetrics.filter(m => m.operation === 'hit').length
        const misses = bucketMetrics.filter(m => m.operation === 'miss').length
        const total = hits + misses

        const responseTimes = bucketMetrics
          .filter(m => m.responseTime !== undefined)
          .map(m => m.responseTime!)

        trend.timestamps.push(timestamp)
        trend.hitRate.push(total > 0 ? hits / total : 0)
        trend.responseTime.push(
          responseTimes.length > 0 
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
            : 0
        )
        trend.throughput.push(bucketMetrics.length)
      })

      trends.push(trend)
    })

    return trends
  }

  private updateHotspots(metric: CacheMetric): void {
    if (!metric.key) return

    const pattern = this.extractPattern(metric.key)
    
    if (!this.hotspots.has(pattern)) {
      this.hotspots.set(pattern, {
        pattern,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        avgResponseTime: 0,
        totalSize: 0,
        lastAccessed: Date.now()
      })
    }

    const hotspot = this.hotspots.get(pattern)!
    
    if (metric.operation === 'hit') {
      hotspot.hitCount++
    } else if (metric.operation === 'miss') {
      hotspot.missCount++
    }

    if (metric.responseTime) {
      hotspot.avgResponseTime = 
        (hotspot.avgResponseTime + metric.responseTime) / 2
    }

    if (metric.size) {
      hotspot.totalSize += metric.size
    }

    hotspot.hitRate = hotspot.hitCount / (hotspot.hitCount + hotspot.missCount)
    hotspot.lastAccessed = Date.now()
  }

  private extractPattern(key: string): string {
    // Extract pattern by replacing variable parts with wildcards
    return key
      .replace(/:\d+/g, ':*') // Replace numbers
      .replace(/:[a-f0-9-]{36}/g, ':*') // Replace UUIDs
      .replace(/:[a-zA-Z0-9]{20,}/g, ':*') // Replace long strings
  }

  private getTopHotspots(limit: number): CacheHotspot[] {
    return Array.from(this.hotspots.values())
      .sort((a, b) => (b.hitCount + b.missCount) - (a.hitCount + a.missCount))
      .slice(0, limit)
  }

  private identifyInefficiencies(metrics: CacheMetric[]): CacheReport['inefficiencies'] {
    const hotspots = Array.from(this.hotspots.values())
    
    return {
      lowHitRate: hotspots
        .filter(h => h.hitRate < 0.5 && (h.hitCount + h.missCount) > 10)
        .map(h => h.pattern),
      
      highResponseTime: hotspots
        .filter(h => h.avgResponseTime > 200)
        .map(h => h.pattern),
      
      oversizedEntries: hotspots
        .filter(h => h.totalSize > 100000) // > 100KB
        .map(h => h.pattern),
      
      frequentEvictions: [] // Would need eviction tracking
    }
  }

  private generateRecommendations(
    summary: CacheReport['summary'], 
    inefficiencies: CacheReport['inefficiencies']
  ): string[] {
    const recommendations: string[] = []

    if (summary.hitRate < 0.7) {
      recommendations.push('Consider implementing cache warming for frequently accessed data')
    }

    if (summary.avgResponseTime > 100) {
      recommendations.push('Enable compression for cache entries larger than 1KB')
    }

    if (inefficiencies.lowHitRate.length > 0) {
      recommendations.push(`Review caching strategy for patterns: ${inefficiencies.lowHitRate.join(', ')}`)
    }

    if (inefficiencies.oversizedEntries.length > 0) {
      recommendations.push('Consider splitting large cache entries or implementing pagination')
    }

    return recommendations
  }

  private groupMetricsByPeriod(metrics: CacheMetric[], period: 'hour' | 'day'): Array<{
    timestamp: number
    bucketMetrics: CacheMetric[]
  }> {
    const bucketSize = period === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    const buckets = new Map<number, CacheMetric[]>()

    metrics.forEach(metric => {
      const bucketKey = Math.floor(metric.timestamp / bucketSize) * bucketSize
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, [])
      }
      buckets.get(bucketKey)!.push(metric)
    })

    return Array.from(buckets.entries())
      .map(([timestamp, bucketMetrics]) => ({ timestamp, bucketMetrics }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  private generatePatternInsights(patterns: any[]): string[] {
    const insights: string[] = []

    if (patterns.length > 0) {
      const topPattern = patterns[0]
      insights.push(`Most frequent pattern: ${topPattern.pattern} (${topPattern.frequency} accesses)`)
      
      const highSeasonality = patterns.filter(p => p.seasonality === 'high')
      if (highSeasonality.length > 0) {
        insights.push(`${highSeasonality.length} patterns show high seasonality - consider time-based cache warming`)
      }

      const largeSizePatterns = patterns.filter(p => p.avgSize > 50000)
      if (largeSizePatterns.length > 0) {
        insights.push(`${largeSizePatterns.length} patterns have large average size - enable compression`)
      }
    }

    return insights
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
  }

  private convertToCSV(report: CacheReport): string {
    // Simple CSV export for summary data
    const lines = [
      'Metric,Value',
      `Total Hits,${report.summary.totalHits}`,
      `Total Misses,${report.summary.totalMisses}`,
      `Hit Rate,${(report.summary.hitRate * 100).toFixed(2)}%`,
      `Avg Response Time,${report.summary.avgResponseTime.toFixed(2)}ms`,
      `Total Size,${report.summary.totalSize}`,
      `Entry Count,${report.summary.entryCount}`
    ]
    return lines.join('\n')
  }

  private getMemoryUsage(): number {
    // Simulate memory usage percentage
    return Math.random() * 100
  }

  private setupMetricCollection(): void {
    // Would integrate with cache coordinator to automatically collect metrics
    console.log('📊 Cache analytics system initialized')
  }

  private setupAggregation(): void {
    // Aggregate metrics every minute
    this.aggregationIntervals.set('minute', setInterval(() => {
      this.aggregateMetrics()
    }, 60 * 1000))
  }

  private setupAlerts(): void {
    // Setup alerting for critical conditions
    setInterval(() => {
      this.checkCriticalConditions()
    }, 30 * 1000) // Check every 30 seconds
  }

  private aggregateMetrics(): void {
    // Aggregate recent metrics for performance
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
    
    // Store aggregated data (implementation would depend on storage system)
    console.log(`📈 Aggregated ${recentMetrics.length} metrics from the last hour`)
  }

  private checkAlerts(metric: CacheMetric): void {
    // Check for immediate alert conditions
    if (metric.responseTime && metric.responseTime > 1000) {
      console.warn(`🚨 High response time detected: ${metric.responseTime}ms for key: ${metric.key}`)
    }
  }

  private checkCriticalConditions(): void {
    const health = this.getHealthScore()
    if (health.status === 'critical') {
      console.error(`🚨 Cache system critical: Score ${health.score}, Issues: ${health.issues.join(', ')}`)
    }
  }
}

// Global analytics instance
export const cacheAnalytics = new CacheAnalytics()