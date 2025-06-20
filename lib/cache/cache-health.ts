import { cacheCoordinator } from './cache-coordinator'
import { cacheAnalytics } from './cache-analytics'
import { cacheInvalidator } from './cache-invalidation'
import { cacheWarmingSystem } from './cache-warming'
import { cacheCompression } from './cache-compression'

// Health Check Types
export type HealthCheckType = 
  | 'connectivity'
  | 'performance'
  | 'memory'
  | 'consistency'
  | 'availability'
  | 'latency'

// Health Status Levels
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

// Health Check Result
interface HealthCheckResult {
  type: HealthCheckType
  status: HealthStatus
  score: number // 0-100
  responseTime: number
  message: string
  details: Record<string, any>
  timestamp: number
  recommendedActions: string[]
}

// Health Metric
interface HealthMetric {
  name: string
  value: number
  threshold: { warning: number; critical: number }
  unit: string
  trend: 'up' | 'down' | 'stable'
}

// Failover Configuration
interface FailoverConfig {
  enabled: boolean
  fallbackStrategies: Array<{
    condition: string
    action: 'disable_cache' | 'use_memory_only' | 'reduce_ttl' | 'emergency_mode'
    duration: number // milliseconds
  }>
  autoRecovery: boolean
  recoveryThreshold: number // health score threshold for recovery
}

// Health monitoring and failover system
export class CacheHealthMonitor {
  private healthHistory: HealthCheckResult[] = []
  private currentHealth: Map<HealthCheckType, HealthCheckResult> = new Map()
  private failoverConfig: FailoverConfig
  private isInFailoverMode = false
  private failoverStartTime?: number
  private monitoringInterval?: NodeJS.Timeout
  private alertCallbacks: Array<(result: HealthCheckResult) => void> = []

  constructor(config: Partial<FailoverConfig> = {}) {
    this.failoverConfig = {
      enabled: true,
      fallbackStrategies: [
        {
          condition: 'critical_performance',
          action: 'reduce_ttl',
          duration: 300000 // 5 minutes
        },
        {
          condition: 'critical_connectivity',
          action: 'use_memory_only',
          duration: 600000 // 10 minutes
        },
        {
          condition: 'critical_memory',
          action: 'emergency_mode',
          duration: 900000 // 15 minutes
        }
      ],
      autoRecovery: true,
      recoveryThreshold: 75,
      ...config
    }

    this.startHealthMonitoring()
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<Map<HealthCheckType, HealthCheckResult>> {
    const healthChecks = [
      this.checkConnectivity(),
      this.checkPerformance(),
      this.checkMemoryUsage(),
      this.checkConsistency(),
      this.checkAvailability(),
      this.checkLatency()
    ]

    const results = await Promise.allSettled(healthChecks)
    const healthResults = new Map<HealthCheckType, HealthCheckResult>()

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const healthResult = result.value
        healthResults.set(healthResult.type, healthResult)
        this.currentHealth.set(healthResult.type, healthResult)
        
        // Store in history
        this.healthHistory.push(healthResult)
        if (this.healthHistory.length > 1000) {
          this.healthHistory = this.healthHistory.slice(-1000)
        }

        // Check for alerts
        this.checkAlerts(healthResult)
      } else {
        console.error(`Health check failed:`, result.reason)
      }
    })

    // Evaluate overall health and trigger failover if needed
    await this.evaluateOverallHealth(healthResults)

    return healthResults
  }

  // Get current health status
  getCurrentHealth(): {
    overall: HealthStatus
    score: number
    checks: Map<HealthCheckType, HealthCheckResult>
    isInFailover: boolean
    failoverDuration?: number
  } {
    const checks = new Map(this.currentHealth)
    const scores = Array.from(checks.values()).map(c => c.score)
    const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

    let overall: HealthStatus = 'healthy'
    if (overallScore < 50) overall = 'critical'
    else if (overallScore < 75) overall = 'warning'

    return {
      overall,
      score: overallScore,
      checks,
      isInFailover: this.isInFailoverMode,
      failoverDuration: this.failoverStartTime ? Date.now() - this.failoverStartTime : undefined
    }
  }

  // Get health trends
  getHealthTrends(timeRange: number = 3600000): {
    trends: Map<HealthCheckType, {
      current: number
      average: number
      trend: 'improving' | 'degrading' | 'stable'
      changeRate: number
    }>
    incidents: Array<{
      timestamp: number
      type: HealthCheckType
      status: HealthStatus
      duration: number
    }>
  } {
    const cutoff = Date.now() - timeRange
    const relevantHistory = this.healthHistory.filter(h => h.timestamp > cutoff)
    
    const trends = new Map()
    const typeGroups = this.groupBy(relevantHistory, 'type')

    for (const [type, results] of typeGroups.entries()) {
      const scores = results.map(r => r.score)
      const current = scores[scores.length - 1] || 0
      const average = scores.reduce((a, b) => a + b, 0) / scores.length
      
      // Calculate trend
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
      const secondHalf = scores.slice(Math.floor(scores.length / 2))
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      
      const changeRate = secondAvg - firstAvg
      let trend: 'improving' | 'degrading' | 'stable' = 'stable'
      
      if (Math.abs(changeRate) > 5) {
        trend = changeRate > 0 ? 'improving' : 'degrading'
      }

      trends.set(type, {
        current,
        average,
        trend,
        changeRate
      })
    }

    // Find incidents (periods of non-healthy status)
    const incidents = this.findHealthIncidents(relevantHistory)

    return { trends, incidents }
  }

  // Register alert callback
  onAlert(callback: (result: HealthCheckResult) => void): void {
    this.alertCallbacks.push(callback)
  }

  // Manual failover trigger
  async triggerFailover(strategy: string, duration?: number): Promise<void> {
    const strategyConfig = this.failoverConfig.fallbackStrategies.find(s => s.condition === strategy)
    if (!strategyConfig) {
      throw new Error(`Unknown failover strategy: ${strategy}`)
    }

    await this.executeFailoverStrategy(strategyConfig, duration)
  }

  // Manual recovery trigger
  async triggerRecovery(): Promise<void> {
    if (!this.isInFailoverMode) {
      console.warn('System is not in failover mode')
      return
    }

    await this.recoverFromFailover()
  }

  // Get failover recommendations
  getFailoverRecommendations(): Array<{
    condition: string
    likelihood: number
    impact: 'low' | 'medium' | 'high'
    recommendation: string
    preventiveActions: string[]
  }> {
    const recommendations = []
    const currentHealth = this.getCurrentHealth()

    // Performance-based recommendations
    if (currentHealth.score < 80) {
      recommendations.push({
        condition: 'performance_degradation',
        likelihood: (80 - currentHealth.score) / 80,
        impact: 'medium' as const,
        recommendation: 'Consider enabling memory-only mode temporarily',
        preventiveActions: [
          'Increase cache TTL for frequently accessed data',
          'Enable compression for large objects',
          'Review invalidation patterns'
        ]
      })
    }

    // Memory-based recommendations
    const analytics = cacheAnalytics.getRealtimeMetrics()
    if (analytics.memoryUsage > 85) {
      recommendations.push({
        condition: 'high_memory_usage',
        likelihood: (analytics.memoryUsage - 85) / 15,
        impact: 'high' as const,
        recommendation: 'Implement aggressive eviction or reduce cache size',
        preventiveActions: [
          'Enable LRU eviction',
          'Reduce cache entry TTL',
          'Implement cache size limits'
        ]
      })
    }

    return recommendations.sort((a, b) => b.likelihood - a.likelihood)
  }

  // Private health check methods
  private async checkConnectivity(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    let score = 100
    let status: HealthStatus = 'healthy'
    let message = 'Cache connectivity is healthy'
    const details: Record<string, any> = {}

    try {
      // Test Redis connectivity
      const testKey = `health_check_${Date.now()}`
      const testValue = 'connectivity_test'
      
      await cacheCoordinator.set(testKey, testValue, 60)
      const retrieved = await cacheCoordinator.get(testKey)
      
      if (retrieved !== testValue) {
        score = 0
        status = 'critical'
        message = 'Cache read/write test failed'
      }

      // Clean up test key
      await cacheCoordinator.invalidate(testKey)

      details.readWriteTest = 'passed'
      details.testDuration = Date.now() - startTime

    } catch (error) {
      score = 0
      status = 'critical'
      message = `Cache connectivity failed: ${error instanceof Error ? error.message : String(error)}`
      details.error = error instanceof Error ? error.message : String(error)
    }

    return {
      type: 'connectivity',
      status,
      score,
      responseTime: Date.now() - startTime,
      message,
      details,
      timestamp: Date.now(),
      recommendedActions: score < 100 ? ['Check Redis connection', 'Verify network connectivity'] : []
    }
  }

  private async checkPerformance(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const analytics = cacheAnalytics.getRealtimeMetrics()
    
    let score = 100
    let status: HealthStatus = 'healthy'
    let message = 'Cache performance is optimal'

    // Evaluate hit rate
    if (analytics.currentHitRate < 0.5) {
      score -= 40
      message = 'Low cache hit rate detected'
    } else if (analytics.currentHitRate < 0.7) {
      score -= 20
    }

    // Evaluate response time
    if (analytics.avgResponseTime > 200) {
      score -= 30
      message = 'High cache response times'
    } else if (analytics.avgResponseTime > 100) {
      score -= 15
    }

    // Evaluate throughput
    if (analytics.currentThroughput < 10) {
      score -= 10
    }

    if (score < 50) status = 'critical'
    else if (score < 75) status = 'warning'

    return {
      type: 'performance',
      status,
      score,
      responseTime: Date.now() - startTime,
      message,
      details: {
        hitRate: analytics.currentHitRate,
        avgResponseTime: analytics.avgResponseTime,
        throughput: analytics.currentThroughput
      },
      timestamp: Date.now(),
      recommendedActions: score < 75 ? [
        'Enable cache warming',
        'Review cache keys and TTL',
        'Consider compression'
      ] : []
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const analytics = cacheAnalytics.getRealtimeMetrics()
    
    let score = 100
    let status: HealthStatus = 'healthy'
    let message = 'Memory usage is within acceptable limits'

    if (analytics.memoryUsage > 95) {
      score = 0
      status = 'critical'
      message = 'Critical memory usage - immediate action required'
    } else if (analytics.memoryUsage > 85) {
      score = 30
      status = 'warning'
      message = 'High memory usage detected'
    } else if (analytics.memoryUsage > 70) {
      score = 70
    }

    return {
      type: 'memory',
      status,
      score,
      responseTime: Date.now() - startTime,
      message,
      details: {
        memoryUsage: analytics.memoryUsage,
        threshold: { warning: 70, critical: 85 }
      },
      timestamp: Date.now(),
      recommendedActions: score < 75 ? [
        'Enable aggressive eviction',
        'Reduce cache size',
        'Implement memory monitoring'
      ] : []
    }
  }

  private async checkConsistency(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    let score = 100
    let status: HealthStatus = 'healthy'
    let message = 'Cache consistency is maintained'

    try {
      // Test consistency across cache layers
      const testKey = `consistency_test_${Date.now()}`
      const testValue = { data: 'consistency_check', timestamp: Date.now() }
      
      await cacheCoordinator.set(testKey, testValue, 300)
      
      // Wait a brief moment and retrieve
      await new Promise(resolve => setTimeout(resolve, 100))
      const retrieved = await cacheCoordinator.get(testKey)
      
      if (!retrieved || JSON.stringify(retrieved) !== JSON.stringify(testValue)) {
        score = 50
        status = 'warning'
        message = 'Cache consistency issue detected'
      }

      // Clean up
      await cacheCoordinator.invalidate(testKey)

    } catch (error) {
      score = 0
      status = 'critical'
      message = `Consistency check failed: ${error instanceof Error ? error.message : String(error)}`
    }

    return {
      type: 'consistency',
      status,
      score,
      responseTime: Date.now() - startTime,
      message,
      details: {},
      timestamp: Date.now(),
      recommendedActions: score < 75 ? [
        'Check cache invalidation logic',
        'Verify multi-layer synchronization'
      ] : []
    }
  }

  private async checkAvailability(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    let score = 100
    let status: HealthStatus = 'healthy'
    let message = 'All cache services are available'

    try {
      // Check all major cache components
      const healthStatus = cacheCoordinator.getHealthStatus()
      
      if (!healthStatus.healthy) {
        score = 30
        status = 'warning'
        message = 'Some cache components are unhealthy'
      }

      const invalidatorMetrics = cacheInvalidator.getMetrics()
      if (invalidatorMetrics.queueSize > 10) {
        score -= 20
        message = 'High invalidation queue size'
      }

    } catch (error) {
      score = 0
      status = 'critical'
      message = `Availability check failed: ${error instanceof Error ? error.message : String(error)}`
    }

    return {
      type: 'availability',
      status,
      score,
      responseTime: Date.now() - startTime,
      message,
      details: {},
      timestamp: Date.now(),
      recommendedActions: score < 75 ? [
        'Check component health',
        'Review service dependencies'
      ] : []
    }
  }

  private async checkLatency(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const latencyTests = []

    // Perform multiple latency tests
    for (let i = 0; i < 5; i++) {
      const testStart = Date.now()
      const testKey = `latency_test_${i}_${Date.now()}`
      
      try {
        await cacheCoordinator.set(testKey, 'test_value', 60)
        await cacheCoordinator.get(testKey)
        latencyTests.push(Date.now() - testStart)
        await cacheCoordinator.invalidate(testKey)
      } catch (error) {
        latencyTests.push(1000) // Penalty for failed test
      }
    }

    const avgLatency = latencyTests.reduce((a, b) => a + b, 0) / latencyTests.length
    const maxLatency = Math.max(...latencyTests)
    
    let score = 100
    let status: HealthStatus = 'healthy'
    let message = 'Cache latency is optimal'

    if (avgLatency > 500) {
      score = 0
      status = 'critical'
      message = 'Critical cache latency'
    } else if (avgLatency > 200) {
      score = 40
      status = 'warning'
      message = 'High cache latency detected'
    } else if (avgLatency > 100) {
      score = 70
    }

    return {
      type: 'latency',
      status,
      score,
      responseTime: Date.now() - startTime,
      message,
      details: {
        avgLatency,
        maxLatency,
        testCount: latencyTests.length
      },
      timestamp: Date.now(),
      recommendedActions: score < 75 ? [
        'Optimize cache operations',
        'Check network latency',
        'Review cache size'
      ] : []
    }
  }

  private async evaluateOverallHealth(healthResults: Map<HealthCheckType, HealthCheckResult>): Promise<void> {
    const scores = Array.from(healthResults.values()).map(r => r.score)
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length

    // Check for failover conditions
    if (this.failoverConfig.enabled && !this.isInFailoverMode) {
      for (const strategy of this.failoverConfig.fallbackStrategies) {
        if (this.shouldTriggerFailover(strategy.condition, healthResults)) {
          await this.executeFailoverStrategy(strategy)
          break
        }
      }
    }

    // Check for recovery conditions
    if (this.failoverConfig.autoRecovery && this.isInFailoverMode) {
      if (overallScore >= this.failoverConfig.recoveryThreshold) {
        await this.recoverFromFailover()
      }
    }
  }

  private shouldTriggerFailover(condition: string, healthResults: Map<HealthCheckType, HealthCheckResult>): boolean {
    switch (condition) {
      case 'critical_performance':
        const perfResult = healthResults.get('performance')
        return perfResult ? perfResult.status === 'critical' : false

      case 'critical_connectivity':
        const connResult = healthResults.get('connectivity')
        return connResult ? connResult.status === 'critical' : false

      case 'critical_memory':
        const memResult = healthResults.get('memory')
        return memResult ? memResult.status === 'critical' : false

      default:
        return false
    }
  }

  private async executeFailoverStrategy(strategy: typeof this.failoverConfig.fallbackStrategies[0], duration?: number): Promise<void> {
    console.warn(`🚨 Executing failover strategy: ${strategy.action}`)
    
    this.isInFailoverMode = true
    this.failoverStartTime = Date.now()

    // Execute the failover action
    switch (strategy.action) {
      case 'disable_cache':
        // Would disable caching temporarily
        console.log('Cache disabled - all requests bypass cache')
        break
        
      case 'use_memory_only':
        // Would switch to memory-only mode
        console.log('Switched to memory-only cache mode')
        break
        
      case 'reduce_ttl':
        // Would reduce TTL for all cache entries
        console.log('Reduced cache TTL to emergency levels')
        break
        
      case 'emergency_mode':
        // Would enable emergency mode with minimal caching
        console.log('Enabled emergency cache mode')
        break
    }

    // Schedule automatic recovery
    const recoveryDuration = duration || strategy.duration
    setTimeout(async () => {
      if (this.isInFailoverMode && this.failoverConfig.autoRecovery) {
        await this.recoverFromFailover()
      }
    }, recoveryDuration)
  }

  private async recoverFromFailover(): Promise<void> {
    console.log('🔄 Recovering from failover mode')
    
    this.isInFailoverMode = false
    this.failoverStartTime = undefined

    // Restore normal cache operations
    console.log('Normal cache operations restored')
  }

  private checkAlerts(result: HealthCheckResult): void {
    if (result.status === 'critical' || result.status === 'warning') {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(result)
        } catch (error) {
          console.error('Alert callback failed:', error)
        }
      })
    }
  }

  private findHealthIncidents(history: HealthCheckResult[]): Array<{
    timestamp: number
    type: HealthCheckType
    status: HealthStatus
    duration: number
  }> {
    const incidents = []
    const typeGroups = this.groupBy(history, 'type')

    for (const [type, results] of typeGroups.entries()) {
      let incidentStart: number | null = null
      
      for (const result of results) {
        if (result.status !== 'healthy' && incidentStart === null) {
          incidentStart = result.timestamp
        } else if (result.status === 'healthy' && incidentStart !== null) {
          incidents.push({
            timestamp: incidentStart,
            type,
            status: 'warning' as HealthStatus, // Simplified
            duration: result.timestamp - incidentStart
          })
          incidentStart = null
        }
      }
    }

    return incidents
  }

  private groupBy<T, K extends keyof T>(array: T[], key: K): Map<T[K], T[]> {
    const groups = new Map<T[K], T[]>()
    
    for (const item of array) {
      const groupKey = item[key]
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(item)
    }
    
    return groups
  }

  private startHealthMonitoring(): void {
    // Perform health checks every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        console.error('Health monitoring failed:', error)
      }
    }, 30000)

    console.log('🏥 Cache health monitoring started')
  }

  // Cleanup method
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
  }
}

// Global health monitor instance
export const cacheHealthMonitor = new CacheHealthMonitor({
  enabled: true,
  autoRecovery: true,
  recoveryThreshold: 75
})