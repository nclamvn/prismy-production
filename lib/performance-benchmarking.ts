import { translationService } from './translation-service'
import { redisTranslationCache } from './redis-translation-cache'
import { createServiceRoleClient } from './supabase'

export interface BenchmarkConfig {
  testName: string
  iterations: number
  concurrent: boolean
  maxConcurrency?: number
  cacheEnabled: boolean
  textSamples: Array<{
    text: string
    sourceLang: string
    targetLang: string
    qualityTier: 'free' | 'standard' | 'premium' | 'enterprise'
  }>
}

export interface BenchmarkResult {
  testName: string
  config: BenchmarkConfig
  results: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    cacheHits: number
    cacheMisses: number
    totalTime: number
    averageResponseTime: number
    minResponseTime: number
    maxResponseTime: number
    throughput: number // requests per second
    p50ResponseTime: number
    p90ResponseTime: number
    p95ResponseTime: number
    errorRate: number
    cacheHitRate: number
  }
  samples: Array<{
    iteration: number
    responseTime: number
    success: boolean
    cached: boolean
    error?: string
  }>
  timestamp: string
}

export class PerformanceBenchmarking {
  private supabase = createServiceRoleClient()

  /**
   * Run a comprehensive performance benchmark
   */
  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    console.log(`🚀 Starting benchmark: ${config.testName}`)
    console.log(
      `📊 Configuration: ${config.iterations} iterations, cache ${config.cacheEnabled ? 'enabled' : 'disabled'}`
    )

    const startTime = Date.now()
    const samples: BenchmarkResult['samples'] = []

    if (config.concurrent && config.maxConcurrency) {
      await this.runConcurrentBenchmark(config, samples)
    } else {
      await this.runSequentialBenchmark(config, samples)
    }

    const endTime = Date.now()
    const totalTime = endTime - startTime

    // Calculate statistics
    const results = this.calculateStatistics(samples, totalTime)

    const benchmarkResult: BenchmarkResult = {
      testName: config.testName,
      config,
      results,
      samples,
      timestamp: new Date().toISOString(),
    }

    // Store benchmark results in database
    await this.storeBenchmarkResult(benchmarkResult)

    console.log(`✅ Benchmark completed: ${config.testName}`)
    console.log(
      `📈 Results: ${results.averageResponseTime.toFixed(2)}ms avg, ${results.cacheHitRate.toFixed(1)}% hit rate`
    )

    return benchmarkResult
  }

  /**
   * Run sequential benchmark
   */
  private async runSequentialBenchmark(
    config: BenchmarkConfig,
    samples: BenchmarkResult['samples']
  ): Promise<void> {
    for (let i = 0; i < config.iterations; i++) {
      const sample = config.textSamples[i % config.textSamples.length]
      const iteration = i + 1

      try {
        const startTime = Date.now()

        const result = await translationService.translateText({
          text: sample.text,
          sourceLang: sample.sourceLang,
          targetLang: sample.targetLang,
          qualityTier: sample.qualityTier,
          abTestVariant: config.cacheEnabled
            ? 'cache_enabled'
            : 'cache_disabled',
        })

        const endTime = Date.now()
        const responseTime = endTime - startTime

        samples.push({
          iteration,
          responseTime,
          success: true,
          cached: result.cached || false,
        })

        // Progress logging
        if (iteration % 10 === 0) {
          console.log(
            `📊 Progress: ${iteration}/${config.iterations} (${((iteration / config.iterations) * 100).toFixed(1)}%)`
          )
        }
      } catch (error) {
        const endTime = Date.now()
        const responseTime = endTime - Date.now() // fallback timing

        samples.push({
          iteration,
          responseTime,
          success: false,
          cached: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        console.error(`❌ Error in iteration ${iteration}:`, error)
      }
    }
  }

  /**
   * Run concurrent benchmark
   */
  private async runConcurrentBenchmark(
    config: BenchmarkConfig,
    samples: BenchmarkResult['samples']
  ): Promise<void> {
    const concurrency = config.maxConcurrency || 5
    const batches = Math.ceil(config.iterations / concurrency)

    for (let batch = 0; batch < batches; batch++) {
      const batchStart = batch * concurrency
      const batchEnd = Math.min(batchStart + concurrency, config.iterations)

      const promises = []

      for (let i = batchStart; i < batchEnd; i++) {
        const sample = config.textSamples[i % config.textSamples.length]
        const iteration = i + 1

        promises.push(
          this.executeBenchmarkIteration(sample, iteration, config.cacheEnabled)
        )
      }

      const batchResults = await Promise.allSettled(promises)

      batchResults.forEach((result, index) => {
        const iteration = batchStart + index + 1

        if (result.status === 'fulfilled') {
          samples.push({
            iteration,
            ...result.value,
          })
        } else {
          samples.push({
            iteration,
            responseTime: 0,
            success: false,
            cached: false,
            error: result.reason?.message || 'Unknown error',
          })
        }
      })

      console.log(`📊 Batch ${batch + 1}/${batches} completed`)
    }
  }

  /**
   * Execute a single benchmark iteration
   */
  private async executeBenchmarkIteration(
    sample: BenchmarkConfig['textSamples'][0],
    iteration: number,
    cacheEnabled: boolean
  ): Promise<{
    responseTime: number
    success: boolean
    cached: boolean
    error?: string
  }> {
    const startTime = Date.now()

    try {
      const result = await translationService.translateText({
        text: sample.text,
        sourceLang: sample.sourceLang,
        targetLang: sample.targetLang,
        qualityTier: sample.qualityTier,
        abTestVariant: cacheEnabled ? 'cache_enabled' : 'cache_disabled',
      })

      const endTime = Date.now()

      return {
        responseTime: endTime - startTime,
        success: true,
        cached: result.cached || false,
      }
    } catch (error) {
      const endTime = Date.now()

      return {
        responseTime: endTime - startTime,
        success: false,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Calculate benchmark statistics
   */
  private calculateStatistics(
    samples: BenchmarkResult['samples'],
    totalTime: number
  ): BenchmarkResult['results'] {
    const responseTimes = samples.map(s => s.responseTime)
    const successfulSamples = samples.filter(s => s.success)
    const cachedSamples = samples.filter(s => s.cached)

    responseTimes.sort((a, b) => a - b)

    return {
      totalRequests: samples.length,
      successfulRequests: successfulSamples.length,
      failedRequests: samples.length - successfulSamples.length,
      cacheHits: cachedSamples.length,
      cacheMisses: successfulSamples.length - cachedSamples.length,
      totalTime,
      averageResponseTime:
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      throughput: (samples.length / totalTime) * 1000, // requests per second
      p50ResponseTime: this.percentile(responseTimes, 0.5),
      p90ResponseTime: this.percentile(responseTimes, 0.9),
      p95ResponseTime: this.percentile(responseTimes, 0.95),
      errorRate: (samples.length - successfulSamples.length) / samples.length,
      cacheHitRate: cachedSamples.length / successfulSamples.length,
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil(sortedArray.length * p) - 1
    return sortedArray[Math.max(0, index)]
  }

  /**
   * Store benchmark result in database
   */
  private async storeBenchmarkResult(result: BenchmarkResult): Promise<void> {
    try {
      await this.supabase.from('performance_benchmarks').insert({
        test_name: result.testName,
        config: result.config,
        results: result.results,
        sample_count: result.samples.length,
        benchmark_data: {
          samples: result.samples.slice(0, 100), // Store first 100 samples
        },
        created_at: result.timestamp,
      })
    } catch (error) {
      console.error('Error storing benchmark result:', error)
    }
  }

  /**
   * Get standard benchmark configurations
   */
  getStandardBenchmarks(): BenchmarkConfig[] {
    const vietnameseBusinessTexts = [
      {
        text: 'Cảm ơn quý khách hàng đã tin tưởng sử dụng dịch vụ của chúng tôi',
        sourceLang: 'vi',
        targetLang: 'en',
        qualityTier: 'standard' as const,
      },
      {
        text: 'Vui lòng xem xét và phê duyệt hợp đồng trong thời gian sớm nhất',
        sourceLang: 'vi',
        targetLang: 'en',
        qualityTier: 'premium' as const,
      },
      {
        text: 'Thank you for choosing our premium translation service',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'premium' as const,
      },
      {
        text: 'Please review the technical documentation and provide feedback',
        sourceLang: 'en',
        targetLang: 'vi',
        qualityTier: 'enterprise' as const,
      },
      {
        text: 'Hệ thống đang thực hiện bảo trì định kỳ và sẽ hoạt động trở lại trong 30 phút',
        sourceLang: 'vi',
        targetLang: 'en',
        qualityTier: 'standard' as const,
      },
    ]

    return [
      {
        testName: 'Cache Performance - Sequential',
        iterations: 50,
        concurrent: false,
        cacheEnabled: true,
        textSamples: vietnameseBusinessTexts,
      },
      {
        testName: 'No Cache Performance - Sequential',
        iterations: 50,
        concurrent: false,
        cacheEnabled: false,
        textSamples: vietnameseBusinessTexts,
      },
      {
        testName: 'Cache Performance - Concurrent',
        iterations: 50,
        concurrent: true,
        maxConcurrency: 5,
        cacheEnabled: true,
        textSamples: vietnameseBusinessTexts,
      },
      {
        testName: 'Load Test - High Concurrency',
        iterations: 100,
        concurrent: true,
        maxConcurrency: 10,
        cacheEnabled: true,
        textSamples: vietnameseBusinessTexts,
      },
    ]
  }

  /**
   * Compare two benchmark results
   */
  compareBenchmarks(
    baseline: BenchmarkResult,
    comparison: BenchmarkResult
  ): {
    responseTimeImprovement: number
    throughputImprovement: number
    cacheHitRateComparison: number
    errorRateComparison: number
    summary: string
  } {
    const responseTimeImprovement =
      ((baseline.results.averageResponseTime -
        comparison.results.averageResponseTime) /
        baseline.results.averageResponseTime) *
      100
    const throughputImprovement =
      ((comparison.results.throughput - baseline.results.throughput) /
        baseline.results.throughput) *
      100
    const cacheHitRateComparison =
      comparison.results.cacheHitRate - baseline.results.cacheHitRate
    const errorRateComparison =
      comparison.results.errorRate - baseline.results.errorRate

    let summary = `Performance comparison between ${baseline.testName} and ${comparison.testName}:\n`
    summary += `Response time: ${responseTimeImprovement > 0 ? 'improved' : 'degraded'} by ${Math.abs(responseTimeImprovement).toFixed(1)}%\n`
    summary += `Throughput: ${throughputImprovement > 0 ? 'improved' : 'degraded'} by ${Math.abs(throughputImprovement).toFixed(1)}%\n`
    summary += `Cache hit rate: ${cacheHitRateComparison > 0 ? 'increased' : 'decreased'} by ${Math.abs(cacheHitRateComparison * 100).toFixed(1)}%`

    return {
      responseTimeImprovement,
      throughputImprovement,
      cacheHitRateComparison,
      errorRateComparison,
      summary,
    }
  }
}

export const performanceBenchmarking = new PerformanceBenchmarking()
