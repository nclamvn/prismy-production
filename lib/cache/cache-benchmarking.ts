import { performance } from 'perf_hooks'
import { cacheCoordinator } from './cache-coordinator'
import { cacheAnalytics } from './cache-analytics'
import { cacheWarmingSystem } from './cache-warming'
import { cacheCompression, CompressionUtils } from './cache-compression'
import { distributedCache } from './cache-distributed'

// Benchmark Types
export type BenchmarkType = 
  | 'latency'
  | 'throughput'
  | 'memory'
  | 'compression'
  | 'consistency'
  | 'failover'
  | 'scaling'

// Benchmark Configuration
interface BenchmarkConfig {
  type: BenchmarkType
  duration: number // milliseconds
  concurrency: number
  dataSize: 'small' | 'medium' | 'large' | 'mixed'
  operations: Array<'get' | 'set' | 'delete' | 'mget' | 'mset'>
  consistency?: 'strong' | 'eventual' | 'weak'
  warmupDuration?: number
  cooldownDuration?: number
}

// Benchmark Result
interface BenchmarkResult {
  config: BenchmarkConfig
  summary: {
    totalOperations: number
    successfulOperations: number
    failedOperations: number
    duration: number
    throughput: number // ops/sec
    avgLatency: number // ms
    p50Latency: number
    p95Latency: number
    p99Latency: number
    errorRate: number
  }
  metrics: {
    memoryUsage: number[]
    cpuUsage: number[]
    hitRates: number[]
    latencies: number[]
    timestamps: number[]
  }
  insights: {
    bottlenecks: string[]
    recommendations: string[]
    optimalConfig?: Partial<BenchmarkConfig>
  }
}

// Load Pattern
interface LoadPattern {
  name: string
  description: string
  generator: (index: number, total: number) => {
    operation: 'get' | 'set' | 'delete'
    key: string
    data?: any
    delay?: number
  }
}

// Performance Benchmark Suite
export class CachePerformanceBenchmark {
  private loadPatterns = new Map<string, LoadPattern>()
  private benchmarkHistory: BenchmarkResult[] = []

  constructor() {
    this.initializeLoadPatterns()
  }

  // Run comprehensive benchmark suite
  async runBenchmarkSuite(configs?: BenchmarkConfig[]): Promise<Map<BenchmarkType, BenchmarkResult>> {
    console.log('🚀 Starting comprehensive cache benchmark suite')
    
    const defaultConfigs: BenchmarkConfig[] = [
      {
        type: 'latency',
        duration: 30000, // 30 seconds
        concurrency: 1,
        dataSize: 'small',
        operations: ['get', 'set'],
        warmupDuration: 5000
      },
      {
        type: 'throughput',
        duration: 60000, // 1 minute
        concurrency: 50,
        dataSize: 'mixed',
        operations: ['get', 'set', 'mget', 'mset'],
        warmupDuration: 10000
      },
      {
        type: 'memory',
        duration: 45000,
        concurrency: 10,
        dataSize: 'large',
        operations: ['set'],
        warmupDuration: 5000
      },
      {
        type: 'compression',
        duration: 30000,
        concurrency: 5,
        dataSize: 'large',
        operations: ['set', 'get']
      },
      {
        type: 'consistency',
        duration: 20000,
        concurrency: 20,
        dataSize: 'medium',
        operations: ['set', 'get'],
        consistency: 'strong'
      }
    ]

    const benchmarkConfigs = configs || defaultConfigs
    const results = new Map<BenchmarkType, BenchmarkResult>()

    for (const config of benchmarkConfigs) {
      try {
        console.log(`📊 Running ${config.type} benchmark...`)
        const result = await this.runBenchmark(config)
        results.set(config.type, result)
        
        // Store in history
        this.benchmarkHistory.push(result)
        
        // Cool down between benchmarks
        if (config.cooldownDuration) {
          await this.sleep(config.cooldownDuration)
        } else {
          await this.sleep(2000) // Default 2 second cooldown
        }
      } catch (error) {
        console.error(`❌ ${config.type} benchmark failed:`, error)
      }
    }

    console.log('✅ Benchmark suite completed')
    return results
  }

  // Run individual benchmark
  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    const startTime = Date.now()
    
    // Warmup phase
    if (config.warmupDuration) {
      await this.runWarmup(config)
    }

    // Initialize metrics collection
    const metrics = {
      memoryUsage: [] as number[],
      cpuUsage: [] as number[],
      hitRates: [] as number[],
      latencies: [] as number[],
      timestamps: [] as number[]
    }

    // Start metrics collection
    const metricsInterval = setInterval(() => {
      this.collectMetrics(metrics)
    }, 1000)

    let totalOperations = 0
    let successfulOperations = 0
    let failedOperations = 0
    const operationLatencies: number[] = []

    try {
      // Generate workload
      const operations = await this.generateWorkload(config)
      totalOperations = operations.length

      // Execute benchmark based on type
      switch (config.type) {
        case 'latency':
          const latencyResults = await this.runLatencyBenchmark(operations, config)
          successfulOperations = latencyResults.successful
          failedOperations = latencyResults.failed
          operationLatencies.push(...latencyResults.latencies)
          break

        case 'throughput':
          const throughputResults = await this.runThroughputBenchmark(operations, config)
          successfulOperations = throughputResults.successful
          failedOperations = throughputResults.failed
          operationLatencies.push(...throughputResults.latencies)
          break

        case 'memory':
          const memoryResults = await this.runMemoryBenchmark(operations, config)
          successfulOperations = memoryResults.successful
          failedOperations = memoryResults.failed
          break

        case 'compression':
          const compressionResults = await this.runCompressionBenchmark(operations, config)
          successfulOperations = compressionResults.successful
          failedOperations = compressionResults.failed
          operationLatencies.push(...compressionResults.latencies)
          break

        case 'consistency':
          const consistencyResults = await this.runConsistencyBenchmark(operations, config)
          successfulOperations = consistencyResults.successful
          failedOperations = consistencyResults.failed
          break

        default:
          throw new Error(`Unsupported benchmark type: ${config.type}`)
      }

    } finally {
      clearInterval(metricsInterval)
    }

    const duration = Date.now() - startTime
    const throughput = successfulOperations / (duration / 1000)
    const errorRate = totalOperations > 0 ? failedOperations / totalOperations : 0

    // Calculate latency percentiles
    const sortedLatencies = operationLatencies.sort((a, b) => a - b)
    const p50 = this.percentile(sortedLatencies, 50)
    const p95 = this.percentile(sortedLatencies, 95)
    const p99 = this.percentile(sortedLatencies, 99)
    const avgLatency = sortedLatencies.length > 0 
      ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length 
      : 0

    // Generate insights
    const insights = this.generateInsights(config, {
      throughput,
      avgLatency,
      errorRate,
      metrics
    })

    const result: BenchmarkResult = {
      config,
      summary: {
        totalOperations,
        successfulOperations,
        failedOperations,
        duration,
        throughput,
        avgLatency,
        p50Latency: p50,
        p95Latency: p95,
        p99Latency: p99,
        errorRate
      },
      metrics,
      insights
    }

    return result
  }

  // Stress testing with increasing load
  async runStressTest(maxConcurrency: number = 200, stepSize: number = 20): Promise<{
    breakingPoint: number
    results: Array<{ concurrency: number; throughput: number; errorRate: number }>
  }> {
    console.log('🔥 Starting stress test')
    
    const results = []
    let breakingPoint = maxConcurrency

    for (let concurrency = stepSize; concurrency <= maxConcurrency; concurrency += stepSize) {
      console.log(`📈 Testing concurrency level: ${concurrency}`)

      const config: BenchmarkConfig = {
        type: 'throughput',
        duration: 30000,
        concurrency,
        dataSize: 'medium',
        operations: ['get', 'set'],
        warmupDuration: 5000
      }

      try {
        const result = await this.runBenchmark(config)
        
        results.push({
          concurrency,
          throughput: result.summary.throughput,
          errorRate: result.summary.errorRate
        })

        // Check if we've hit the breaking point
        if (result.summary.errorRate > 0.05 || result.summary.avgLatency > 1000) {
          breakingPoint = concurrency
          console.log(`🚨 Breaking point reached at concurrency: ${concurrency}`)
          break
        }

        // Cool down between tests
        await this.sleep(5000)

      } catch (error) {
        console.error(`Stress test failed at concurrency ${concurrency}:`, error)
        breakingPoint = concurrency - stepSize
        break
      }
    }

    return { breakingPoint, results }
  }

  // Compare different cache configurations
  async compareConfigurations(configurations: Array<{
    name: string
    setup: () => Promise<void>
    cleanup?: () => Promise<void>
  }>): Promise<Map<string, BenchmarkResult>> {
    console.log('🔬 Starting configuration comparison')
    
    const results = new Map<string, BenchmarkResult>()
    
    const baselineConfig: BenchmarkConfig = {
      type: 'throughput',
      duration: 45000,
      concurrency: 25,
      dataSize: 'mixed',
      operations: ['get', 'set', 'mget'],
      warmupDuration: 10000
    }

    for (const config of configurations) {
      console.log(`⚙️  Testing configuration: ${config.name}`)

      try {
        // Setup configuration
        await config.setup()
        
        // Run benchmark
        const result = await this.runBenchmark(baselineConfig)
        results.set(config.name, result)
        
        // Cleanup if specified
        if (config.cleanup) {
          await config.cleanup()
        }

        // Cool down
        await this.sleep(3000)

      } catch (error) {
        console.error(`Configuration test failed for ${config.name}:`, error)
      }
    }

    return results
  }

  // Cache warming effectiveness test
  async testCacheWarmingEffectiveness(): Promise<{
    coldStart: BenchmarkResult
    warmedUp: BenchmarkResult
    improvement: {
      hitRateImprovement: number
      latencyImprovement: number
      throughputImprovement: number
    }
  }> {
    console.log('🌡️ Testing cache warming effectiveness')

    const benchmarkConfig: BenchmarkConfig = {
      type: 'latency',
      duration: 30000,
      concurrency: 10,
      dataSize: 'medium',
      operations: ['get'],
      warmupDuration: 0 // No warmup for cold start
    }

    // Test cold start performance
    await this.clearAllCaches()
    const coldStart = await this.runBenchmark(benchmarkConfig)

    // Warm up the cache
    console.log('🔥 Warming up cache...')
    await cacheWarmingSystem.warmTranslationPatterns()
    await cacheWarmingSystem.warmPredictively(1)

    // Test warmed performance
    const warmedUp = await this.runBenchmark(benchmarkConfig)

    // Calculate improvements
    const hitRateImprovement = warmedUp.metrics.hitRates[warmedUp.metrics.hitRates.length - 1] - 
                              coldStart.metrics.hitRates[coldStart.metrics.hitRates.length - 1]
    
    const latencyImprovement = (coldStart.summary.avgLatency - warmedUp.summary.avgLatency) / 
                              coldStart.summary.avgLatency * 100

    const throughputImprovement = (warmedUp.summary.throughput - coldStart.summary.throughput) / 
                                 coldStart.summary.throughput * 100

    return {
      coldStart,
      warmedUp,
      improvement: {
        hitRateImprovement,
        latencyImprovement,
        throughputImprovement
      }
    }
  }

  // Get benchmark history and trends
  getBenchmarkHistory(): {
    history: BenchmarkResult[]
    trends: Map<BenchmarkType, {
      throughputTrend: 'improving' | 'stable' | 'degrading'
      latencyTrend: 'improving' | 'stable' | 'degrading'
      changeRate: number
    }>
  } {
    const trends = new Map()
    
    // Group by benchmark type
    const typeGroups = new Map<BenchmarkType, BenchmarkResult[]>()
    this.benchmarkHistory.forEach(result => {
      if (!typeGroups.has(result.config.type)) {
        typeGroups.set(result.config.type, [])
      }
      typeGroups.get(result.config.type)!.push(result)
    })

    // Calculate trends for each type
    typeGroups.forEach((results, type) => {
      if (results.length < 2) return

      const sortedResults = results.sort((a, b) => a.summary.duration - b.summary.duration)
      const recent = sortedResults.slice(-3) // Last 3 runs
      const older = sortedResults.slice(-6, -3) // Previous 3 runs

      if (recent.length === 0 || older.length === 0) return

      const recentAvgThroughput = recent.reduce((sum, r) => sum + r.summary.throughput, 0) / recent.length
      const olderAvgThroughput = older.reduce((sum, r) => sum + r.summary.throughput, 0) / older.length
      
      const recentAvgLatency = recent.reduce((sum, r) => sum + r.summary.avgLatency, 0) / recent.length
      const olderAvgLatency = older.reduce((sum, r) => sum + r.summary.avgLatency, 0) / older.length

      const throughputChange = (recentAvgThroughput - olderAvgThroughput) / olderAvgThroughput
      const latencyChange = (recentAvgLatency - olderAvgLatency) / olderAvgLatency

      trends.set(type, {
        throughputTrend: throughputChange > 0.05 ? 'improving' : throughputChange < -0.05 ? 'degrading' : 'stable',
        latencyTrend: latencyChange < -0.05 ? 'improving' : latencyChange > 0.05 ? 'degrading' : 'stable',
        changeRate: throughputChange
      })
    })

    return {
      history: [...this.benchmarkHistory],
      trends
    }
  }

  // Private helper methods
  private async generateWorkload(config: BenchmarkConfig): Promise<Array<{
    operation: 'get' | 'set' | 'delete' | 'mget' | 'mset'
    key: string
    data?: any
    keys?: string[]
    entries?: Array<{ key: string; data: any }>
  }>> {
    const operations = []
    const operationCount = Math.floor(config.duration / 100 * config.concurrency) // Estimate based on timing

    for (let i = 0; i < operationCount; i++) {
      const operation = config.operations[Math.floor(Math.random() * config.operations.length)]
      
      switch (operation) {
        case 'get':
        case 'set':
        case 'delete':
          operations.push({
            operation,
            key: this.generateTestKey(i),
            data: operation === 'set' ? this.generateTestData(config.dataSize) : undefined
          })
          break

        case 'mget':
          const getKeys = Array.from({ length: 5 }, (_, j) => this.generateTestKey(i * 5 + j))
          operations.push({
            operation,
            key: '', // Not used for mget
            keys: getKeys
          })
          break

        case 'mset':
          const setEntries = Array.from({ length: 5 }, (_, j) => ({
            key: this.generateTestKey(i * 5 + j),
            data: this.generateTestData(config.dataSize)
          }))
          operations.push({
            operation,
            key: '', // Not used for mset
            entries: setEntries
          })
          break
      }
    }

    return operations
  }

  private async runLatencyBenchmark(operations: any[], config: BenchmarkConfig): Promise<{
    successful: number
    failed: number
    latencies: number[]
  }> {
    let successful = 0
    let failed = 0
    const latencies: number[] = []

    // Run operations sequentially for accurate latency measurement
    for (const op of operations) {
      const startTime = performance.now()
      
      try {
        switch (op.operation) {
          case 'get':
            await cacheCoordinator.get(op.key)
            break
          case 'set':
            await cacheCoordinator.set(op.key, op.data, 3600)
            break
          case 'delete':
            await cacheCoordinator.invalidate(op.key)
            break
          case 'mget':
            await cacheCoordinator.mget(op.keys)
            break
          case 'mset':
            await cacheCoordinator.mset(op.entries)
            break
        }
        
        successful++
        latencies.push(performance.now() - startTime)
        
      } catch (error) {
        failed++
      }

      // Check if duration exceeded
      if (performance.now() - startTime > config.duration) {
        break
      }
    }

    return { successful, failed, latencies }
  }

  private async runThroughputBenchmark(operations: any[], config: BenchmarkConfig): Promise<{
    successful: number
    failed: number
    latencies: number[]
  }> {
    let successful = 0
    let failed = 0
    const latencies: number[] = []

    // Create worker function for concurrent execution
    const worker = async (workerOps: any[]) => {
      for (const op of workerOps) {
        const startTime = performance.now()
        
        try {
          switch (op.operation) {
            case 'get':
              await cacheCoordinator.get(op.key)
              break
            case 'set':
              await cacheCoordinator.set(op.key, op.data, 3600)
              break
            case 'mget':
              await cacheCoordinator.mget(op.keys)
              break
            case 'mset':
              await cacheCoordinator.mset(op.entries)
              break
          }
          
          successful++
          latencies.push(performance.now() - startTime)
          
        } catch (error) {
          failed++
        }
      }
    }

    // Split operations among workers
    const chunkSize = Math.ceil(operations.length / config.concurrency)
    const workers = []

    for (let i = 0; i < config.concurrency; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, operations.length)
      const workerOps = operations.slice(start, end)
      
      if (workerOps.length > 0) {
        workers.push(worker(workerOps))
      }
    }

    await Promise.all(workers)
    return { successful, failed, latencies }
  }

  private async runMemoryBenchmark(operations: any[], config: BenchmarkConfig): Promise<{
    successful: number
    failed: number
  }> {
    let successful = 0
    let failed = 0

    // Focus on memory-intensive operations
    for (const op of operations) {
      try {
        if (op.operation === 'set') {
          await cacheCoordinator.set(op.key, op.data, 3600)
          successful++
        }
      } catch (error) {
        failed++
      }
    }

    return { successful, failed }
  }

  private async runCompressionBenchmark(operations: any[], config: BenchmarkConfig): Promise<{
    successful: number
    failed: number
    latencies: number[]
  }> {
    let successful = 0
    let failed = 0
    const latencies: number[] = []

    for (const op of operations) {
      const startTime = performance.now()
      
      try {
        if (op.operation === 'set') {
          // Test with compression
          const compressed = await cacheCompression.compress(op.data)
          await cacheCoordinator.set(op.key, compressed, 3600, ['compressed'])
        } else if (op.operation === 'get') {
          const result = await cacheCoordinator.get(op.key)
          if (result) {
            await cacheCompression.decompress(result as any)
          }
        }
        
        successful++
        latencies.push(performance.now() - startTime)
        
      } catch (error) {
        failed++
      }
    }

    return { successful, failed, latencies }
  }

  private async runConsistencyBenchmark(operations: any[], config: BenchmarkConfig): Promise<{
    successful: number
    failed: number
  }> {
    let successful = 0
    let failed = 0

    // Test distributed consistency
    for (const op of operations) {
      try {
        if (op.operation === 'set') {
          await distributedCache.distributedSet(op.key, op.data, 3600, config.consistency)
        } else if (op.operation === 'get') {
          await distributedCache.distributedGet(op.key, config.consistency)
        }
        
        successful++
      } catch (error) {
        failed++
      }
    }

    return { successful, failed }
  }

  private async runWarmup(config: BenchmarkConfig): Promise<void> {
    const warmupDuration = config.warmupDuration || 0
    console.log(`🔥 Warming up for ${warmupDuration}ms...`)
    
    const warmupOps = Math.floor(warmupDuration / 100)
    
    for (let i = 0; i < warmupOps; i++) {
      try {
        const key = this.generateTestKey(i)
        const data = this.generateTestData('small')
        
        await cacheCoordinator.set(key, data, 3600)
        await cacheCoordinator.get(key)
        
      } catch (error) {
        // Ignore warmup errors
      }
    }
  }

  private collectMetrics(metrics: BenchmarkResult['metrics']): void {
    const analytics = cacheAnalytics.getRealtimeMetrics()
    
    metrics.memoryUsage.push(analytics.memoryUsage)
    metrics.cpuUsage.push(Math.random() * 100) // Simulated
    metrics.hitRates.push(analytics.currentHitRate)
    metrics.latencies.push(analytics.avgResponseTime)
    metrics.timestamps.push(Date.now())
  }

  private generateInsights(config: BenchmarkConfig, results: any): BenchmarkResult['insights'] {
    const bottlenecks: string[] = []
    const recommendations: string[] = []

    // Analyze bottlenecks
    if (results.avgLatency > 200) {
      bottlenecks.push('High latency detected')
      recommendations.push('Enable compression for large objects')
      recommendations.push('Consider cache warming')
    }

    if (results.errorRate > 0.01) {
      bottlenecks.push('High error rate')
      recommendations.push('Review error handling and retry logic')
    }

    if (results.throughput < 100) {
      bottlenecks.push('Low throughput')
      recommendations.push('Increase concurrency or optimize operations')
    }

    // Memory-specific insights
    if (config.type === 'memory') {
      const avgMemory = results.metrics.memoryUsage.reduce((a: number, b: number) => a + b, 0) / results.metrics.memoryUsage.length
      if (avgMemory > 80) {
        bottlenecks.push('High memory usage')
        recommendations.push('Enable aggressive eviction')
        recommendations.push('Reduce cache entry size')
      }
    }

    return {
      bottlenecks,
      recommendations,
      optimalConfig: this.suggestOptimalConfig(config, results)
    }
  }

  private suggestOptimalConfig(config: BenchmarkConfig, results: any): Partial<BenchmarkConfig> {
    const optimal: Partial<BenchmarkConfig> = {}

    // Suggest concurrency adjustments
    if (results.errorRate > 0.05) {
      optimal.concurrency = Math.max(1, Math.floor(config.concurrency * 0.7))
    } else if (results.errorRate < 0.01 && results.avgLatency < 100) {
      optimal.concurrency = Math.floor(config.concurrency * 1.3)
    }

    // Suggest data size adjustments
    if (results.avgLatency > 500 && config.dataSize === 'large') {
      optimal.dataSize = 'medium'
    }

    return optimal
  }

  private generateTestKey(index: number): string {
    return `bench_key_${index}_${Date.now()}`
  }

  private generateTestData(size: 'small' | 'medium' | 'large' | 'mixed'): any {
    const sizes = {
      small: 100,    // 100 bytes
      medium: 1000,  // 1KB
      large: 10000,  // 10KB
      mixed: [100, 1000, 10000][Math.floor(Math.random() * 3)]
    }

    const targetSize = typeof sizes[size] === 'number' ? sizes[size] : sizes[size]
    const data = {
      id: Math.random().toString(36),
      timestamp: Date.now(),
      data: 'x'.repeat(targetSize - 100), // Account for other fields
      metadata: {
        type: 'benchmark',
        size: targetSize
      }
    }

    return data
  }

  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0
    
    const index = Math.ceil(sortedArray.length * percentile / 100) - 1
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))]
  }

  private async clearAllCaches(): Promise<void> {
    // Clear all cache layers
    await cacheCoordinator.invalidate('*')
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private initializeLoadPatterns(): void {
    // User activity pattern
    this.loadPatterns.set('user_activity', {
      name: 'User Activity',
      description: 'Simulates typical user translation requests',
      generator: (index, total) => {
        const operations = ['get', 'set'] as const
        const operation = operations[Math.floor(Math.random() * operations.length)]
        
        return {
          operation,
          key: `user_${index % 100}_translation_${Math.floor(Math.random() * 1000)}`,
          data: operation === 'set' ? {
            text: 'Sample translation text for benchmarking',
            sourceLang: 'en',
            targetLang: 'vi',
            timestamp: Date.now()
          } : undefined
        }
      }
    })

    // Burst pattern
    this.loadPatterns.set('burst', {
      name: 'Burst Load',
      description: 'Simulates sudden traffic spikes',
      generator: (index, total) => {
        const burstSize = 100
        const isBurst = Math.floor(index / burstSize) % 2 === 0
        
        return {
          operation: 'get',
          key: `burst_${index % 50}`,
          delay: isBurst ? 0 : 1000 // No delay during burst, 1s delay otherwise
        }
      }
    })

    // Cache warming pattern
    this.loadPatterns.set('warming', {
      name: 'Cache Warming',
      description: 'Loads frequently accessed data',
      generator: (index, total) => {
        const popularKeys = ['popular_1', 'popular_2', 'popular_3']
        
        return {
          operation: 'set',
          key: popularKeys[index % popularKeys.length],
          data: {
            content: `Popular content ${index}`,
            accessCount: Math.floor(Math.random() * 1000)
          }
        }
      }
    })
  }
}

// Global benchmark instance
export const cacheBenchmark = new CachePerformanceBenchmark()