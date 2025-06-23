import { redisTranslationCache } from './redis-translation-cache'
import { createServiceRoleClient } from './supabase'

export interface ABTestResult {
  testId: string
  variant: 'cache_enabled' | 'cache_disabled'
  startTime: number
  endTime: number
  responseTime: number
  cacheHit: boolean
  success: boolean
  errorMessage?: string
  metadata: {
    textLength: number
    sourceLang: string
    targetLang: string
    qualityTier: string
    userId?: string
  }
}

export interface ABTestMetrics {
  testId: string
  totalRequests: number
  cacheEnabledRequests: number
  cacheDisabledRequests: number
  averageResponseTime: {
    cacheEnabled: number
    cacheDisabled: number
    improvement: number
    improvementPercent: number
  }
  hitRate: number
  errorRate: {
    cacheEnabled: number
    cacheDisabled: number
  }
  costSavings: {
    estimatedSavings: number
    cacheHits: number
    totalApiCalls: number
  }
}

export class ABTestingFramework {
  private supabase = createServiceRoleClient()
  private activeTests = new Map<string, boolean>()

  /**
   * Start a new A/B test for cache performance
   */
  async startCachePerformanceTest(
    testId: string,
    trafficSplit: number = 0.5
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Check if test already exists
      if (this.activeTests.has(testId)) {
        return {
          success: false,
          message: 'Test with this ID is already running',
        }
      }

      // Create test configuration in database
      const { error } = await this.supabase.from('ab_test_configs').insert({
        test_id: testId,
        test_type: 'cache_performance',
        traffic_split: trafficSplit,
        status: 'active',
        config: {
          description: 'A/B test to measure Redis cache performance impact',
          variants: ['cache_enabled', 'cache_disabled'],
          metrics: ['response_time', 'hit_rate', 'error_rate', 'cost_savings'],
        },
        started_at: new Date().toISOString(),
      })

      if (error) throw error

      this.activeTests.set(testId, true)

      return {
        success: true,
        message: `A/B test ${testId} started successfully with ${trafficSplit * 100}% traffic split`,
      }
    } catch (error) {
      console.error('Error starting A/B test:', error)
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to start A/B test',
      }
    }
  }

  /**
   * Determine if a user should be in the cache-enabled or cache-disabled group
   */
  getTestVariant(
    testId: string,
    userId: string,
    trafficSplit: number = 0.5
  ): 'cache_enabled' | 'cache_disabled' {
    // Use consistent hashing to ensure same user always gets same variant
    const hash = this.hashString(`${testId}:${userId}`)
    const normalized = (hash % 1000) / 1000 // Convert to 0-1 range

    return normalized < trafficSplit ? 'cache_enabled' : 'cache_disabled'
  }

  /**
   * Record an A/B test result
   */
  async recordTestResult(result: ABTestResult): Promise<void> {
    try {
      await this.supabase.from('ab_test_results').insert({
        test_id: result.testId,
        variant: result.variant,
        response_time: result.responseTime,
        cache_hit: result.cacheHit,
        success: result.success,
        error_message: result.errorMessage,
        metadata: result.metadata,
        recorded_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error recording A/B test result:', error)
      // Don't throw - this shouldn't break the main translation flow
    }
  }

  /**
   * Get comprehensive A/B test metrics
   */
  async getTestMetrics(testId: string): Promise<ABTestMetrics | null> {
    try {
      const { data: results, error } = await this.supabase
        .from('ab_test_results')
        .select('*')
        .eq('test_id', testId)

      if (error) throw error
      if (!results || results.length === 0) return null

      const cacheEnabledResults = results.filter(
        r => r.variant === 'cache_enabled'
      )
      const cacheDisabledResults = results.filter(
        r => r.variant === 'cache_disabled'
      )

      // Calculate response time metrics
      const cacheEnabledAvgTime = this.calculateAverage(
        cacheEnabledResults.map(r => r.response_time)
      )
      const cacheDisabledAvgTime = this.calculateAverage(
        cacheDisabledResults.map(r => r.response_time)
      )
      const improvement = cacheDisabledAvgTime - cacheEnabledAvgTime
      const improvementPercent = (improvement / cacheDisabledAvgTime) * 100

      // Calculate hit rate
      const cacheHits = cacheEnabledResults.filter(r => r.cache_hit).length
      const hitRate =
        cacheEnabledResults.length > 0
          ? cacheHits / cacheEnabledResults.length
          : 0

      // Calculate error rates
      const cacheEnabledErrors = cacheEnabledResults.filter(
        r => !r.success
      ).length
      const cacheDisabledErrors = cacheDisabledResults.filter(
        r => !r.success
      ).length

      // Estimate cost savings (assuming $0.02 per 1K characters)
      const estimatedSavings =
        cacheHits *
        0.02 *
        (cacheEnabledResults
          .filter(r => r.cache_hit)
          .reduce((sum, r) => sum + (r.metadata?.textLength || 0), 0) /
          1000)

      return {
        testId,
        totalRequests: results.length,
        cacheEnabledRequests: cacheEnabledResults.length,
        cacheDisabledRequests: cacheDisabledResults.length,
        averageResponseTime: {
          cacheEnabled: cacheEnabledAvgTime,
          cacheDisabled: cacheDisabledAvgTime,
          improvement,
          improvementPercent,
        },
        hitRate,
        errorRate: {
          cacheEnabled:
            cacheEnabledResults.length > 0
              ? cacheEnabledErrors / cacheEnabledResults.length
              : 0,
          cacheDisabled:
            cacheDisabledResults.length > 0
              ? cacheDisabledErrors / cacheDisabledResults.length
              : 0,
        },
        costSavings: {
          estimatedSavings,
          cacheHits,
          totalApiCalls:
            cacheDisabledResults.length +
            (cacheEnabledResults.length - cacheHits),
        },
      }
    } catch (error) {
      console.error('Error getting A/B test metrics:', error)
      return null
    }
  }

  /**
   * Stop an A/B test
   */
  async stopTest(testId: string): Promise<{
    success: boolean
    metrics?: ABTestMetrics
  }> {
    try {
      // Update test status in database
      await this.supabase
        .from('ab_test_configs')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('test_id', testId)

      // Remove from active tests
      this.activeTests.delete(testId)

      // Get final metrics
      const metrics = await this.getTestMetrics(testId)

      return {
        success: true,
        metrics: metrics || undefined,
      }
    } catch (error) {
      console.error('Error stopping A/B test:', error)
      return {
        success: false,
      }
    }
  }

  /**
   * Check if a test is currently active
   */
  isTestActive(testId: string): boolean {
    return this.activeTests.has(testId)
  }

  /**
   * Get summary of all active tests
   */
  async getActiveTests(): Promise<
    Array<{
      testId: string
      startedAt: string
      trafficSplit: number
      requestCount: number
    }>
  > {
    try {
      const { data: configs, error } = await this.supabase
        .from('ab_test_configs')
        .select(
          `
          test_id,
          started_at,
          traffic_split,
          ab_test_results(count)
        `
        )
        .eq('status', 'active')

      if (error) throw error

      return (configs || []).map(config => ({
        testId: config.test_id,
        startedAt: config.started_at,
        trafficSplit: config.traffic_split,
        requestCount: config.ab_test_results?.[0]?.count || 0,
      }))
    } catch (error) {
      console.error('Error getting active tests:', error)
      return []
    }
  }

  // Helper methods
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }
}

export const abTestingFramework = new ABTestingFramework()
