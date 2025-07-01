#!/usr/bin/env tsx

/**
 * Performance Testing Script for Edge Functions
 * Tests load, latency, error rates, and memory usage
 */

import { performance } from 'perf_hooks'
import { Worker } from 'worker_threads'
import fs from 'fs/promises'
import path from 'path'

interface TestConfig {
  edgeFunctionUrl: string
  concurrentUsers: number
  totalRequests: number
  testDuration: number // seconds
  requestDelay: number // ms between requests
  timeout: number // ms
}

interface TestResult {
  requestId: string
  startTime: number
  endTime: number
  responseTime: number
  statusCode: number
  success: boolean
  error?: string
  responseSize?: number
  memoryUsage?: number
}

interface TestReport {
  config: TestConfig
  summary: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    successRate: number
    averageResponseTime: number
    medianResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    minResponseTime: number
    maxResponseTime: number
    requestsPerSecond: number
    totalDuration: number
    errorTypes: Record<string, number>
  }
  results: TestResult[]
  timestamp: string
}

class EdgeFunctionTester {
  private results: TestResult[] = []
  private startTime: number = 0
  private config: TestConfig

  constructor(config: TestConfig) {
    this.config = config
  }

  async runTest(): Promise<TestReport> {
    console.log('🚀 Starting Edge Function Performance Test')
    console.log(`Configuration:`)
    console.log(`  - Function URL: ${this.config.edgeFunctionUrl}`)
    console.log(`  - Concurrent Users: ${this.config.concurrentUsers}`)
    console.log(`  - Total Requests: ${this.config.totalRequests}`)
    console.log(`  - Test Duration: ${this.config.testDuration}s`)
    console.log(`  - Request Delay: ${this.config.requestDelay}ms`)

    this.startTime = performance.now()
    this.results = []

    // Create workers for concurrent testing
    const workers: Promise<TestResult[]>[] = []
    const requestsPerWorker = Math.floor(this.config.totalRequests / this.config.concurrentUsers)
    
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      const workerPromise = this.createWorker(i, requestsPerWorker)
      workers.push(workerPromise)
    }

    // Wait for all workers to complete
    const workerResults = await Promise.all(workers)
    this.results = workerResults.flat()

    const endTime = performance.now()
    const totalDuration = (endTime - this.startTime) / 1000

    console.log(`\n✅ Test completed in ${totalDuration.toFixed(2)}s`)

    return this.generateReport(totalDuration)
  }

  private async createWorker(workerId: number, requestCount: number): Promise<TestResult[]> {
    const workerResults: TestResult[] = []
    
    console.log(`👤 Worker ${workerId + 1} starting ${requestCount} requests...`)

    for (let i = 0; i < requestCount; i++) {
      try {
        const result = await this.makeTestRequest(`${workerId}-${i}`)
        workerResults.push(result)

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          process.stdout.write('.')
        }

        // Delay between requests
        if (this.config.requestDelay > 0) {
          await this.sleep(this.config.requestDelay)
        }

      } catch (error) {
        workerResults.push({
          requestId: `${workerId}-${i}`,
          startTime: performance.now(),
          endTime: performance.now(),
          responseTime: 0,
          statusCode: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`\n✅ Worker ${workerId + 1} completed`)
    return workerResults
  }

  private async makeTestRequest(requestId: string): Promise<TestResult> {
    const startTime = performance.now()
    
    // Sample test payload for document processing
    const testPayload = {
      jobId: `test-${requestId}`,
      userId: 'test-user-123',
      documentUrl: 'https://example.com/test-document.pdf',
      documentType: 'pdf',
      processingOptions: {
        extractText: true,
        detectLanguage: true,
        generateSummary: false
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(this.config.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime

      let responseSize = 0
      let responseData: any = null

      try {
        responseData = await response.text()
        responseSize = new Blob([responseData]).size
      } catch (e) {
        // Response body might be empty or invalid
      }

      return {
        requestId,
        startTime,
        endTime,
        responseTime,
        statusCode: response.status,
        success: response.ok,
        error: !response.ok ? `HTTP ${response.status}` : undefined,
        responseSize
      }

    } catch (error) {
      const endTime = performance.now()
      const responseTime = endTime - startTime

      return {
        requestId,
        startTime,
        endTime,
        responseTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  private generateReport(totalDuration: number): TestReport {
    const successfulRequests = this.results.filter(r => r.success)
    const failedRequests = this.results.filter(r => !r.success)
    
    const responseTimes = successfulRequests.map(r => r.responseTime).sort((a, b) => a - b)
    
    const errorTypes: Record<string, number> = {}
    failedRequests.forEach(r => {
      const errorType = r.error || 'Unknown'
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1
    })

    const summary = {
      totalRequests: this.results.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate: (successfulRequests.length / this.results.length) * 100,
      averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      medianResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)] : 0,
      p95ResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
      p99ResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      requestsPerSecond: this.results.length / totalDuration,
      totalDuration,
      errorTypes
    }

    return {
      config: this.config,
      summary,
      results: this.results,
      timestamp: new Date().toISOString()
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

class TestReportGenerator {
  static async generateReport(report: TestReport): Promise<void> {
    console.log('\n📊 PERFORMANCE TEST REPORT')
    console.log('=' .repeat(50))
    
    console.log('\n📋 TEST CONFIGURATION')
    console.log(`Function URL: ${report.config.edgeFunctionUrl}`)
    console.log(`Concurrent Users: ${report.config.concurrentUsers}`)
    console.log(`Total Requests: ${report.config.totalRequests}`)
    console.log(`Test Duration: ${report.config.testDuration}s`)
    
    console.log('\n📈 PERFORMANCE METRICS')
    console.log(`Total Requests: ${report.summary.totalRequests}`)
    console.log(`Successful Requests: ${report.summary.successfulRequests}`)
    console.log(`Failed Requests: ${report.summary.failedRequests}`)
    console.log(`Success Rate: ${report.summary.successRate.toFixed(2)}%`)
    console.log(`Requests/Second: ${report.summary.requestsPerSecond.toFixed(2)}`)
    console.log(`Total Duration: ${report.summary.totalDuration.toFixed(2)}s`)
    
    console.log('\n⏱️ RESPONSE TIME METRICS')
    console.log(`Average: ${report.summary.averageResponseTime.toFixed(2)}ms`)
    console.log(`Median: ${report.summary.medianResponseTime.toFixed(2)}ms`)
    console.log(`95th Percentile: ${report.summary.p95ResponseTime.toFixed(2)}ms`)
    console.log(`99th Percentile: ${report.summary.p99ResponseTime.toFixed(2)}ms`)
    console.log(`Min: ${report.summary.minResponseTime.toFixed(2)}ms`)
    console.log(`Max: ${report.summary.maxResponseTime.toFixed(2)}ms`)
    
    if (Object.keys(report.summary.errorTypes).length > 0) {
      console.log('\n❌ ERROR BREAKDOWN')
      Object.entries(report.summary.errorTypes).forEach(([error, count]) => {
        console.log(`${error}: ${count} occurrences`)
      })
    }
    
    console.log('\n📊 PERFORMANCE ANALYSIS')
    this.analyzePerformance(report)
    
    // Save detailed report to file
    await this.saveReport(report)
  }

  private static analyzePerformance(report: TestReport): void {
    const { summary } = report
    
    // Success rate analysis
    if (summary.successRate >= 99) {
      console.log('✅ Excellent reliability (99%+ success rate)')
    } else if (summary.successRate >= 95) {
      console.log('🟡 Good reliability (95%+ success rate)')
    } else {
      console.log('❌ Poor reliability (<95% success rate)')
    }
    
    // Response time analysis
    if (summary.p95ResponseTime < 1000) {
      console.log('🚀 Excellent response times (P95 < 1s)')
    } else if (summary.p95ResponseTime < 3000) {
      console.log('🟡 Acceptable response times (P95 < 3s)')
    } else {
      console.log('🐌 Slow response times (P95 > 3s)')
    }
    
    // Throughput analysis
    if (summary.requestsPerSecond > 10) {
      console.log('🚀 High throughput (>10 req/s)')
    } else if (summary.requestsPerSecond > 5) {
      console.log('🟡 Moderate throughput (5-10 req/s)')
    } else {
      console.log('🐌 Low throughput (<5 req/s)')
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS')
    if (summary.successRate < 95) {
      console.log('- Investigate error patterns and improve error handling')
    }
    if (summary.p95ResponseTime > 3000) {
      console.log('- Optimize function performance or increase resources')
    }
    if (summary.requestsPerSecond < 5) {
      console.log('- Consider scaling strategy for production load')
    }
    if (summary.p99ResponseTime > summary.p95ResponseTime * 2) {
      console.log('- High response time variance detected - investigate performance outliers')
    }
  }

  private static async saveReport(report: TestReport): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `edge-function-test-report-${timestamp}.json`
    const filepath = path.join(process.cwd(), 'test-reports', filename)
    
    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true })
      await fs.writeFile(filepath, JSON.stringify(report, null, 2))
      console.log(`\n💾 Detailed report saved to: ${filepath}`)
    } catch (error) {
      console.error('Failed to save report:', error)
    }
  }
}

// Test configurations for different scenarios
const TEST_SCENARIOS: Record<string, TestConfig> = {
  light: {
    edgeFunctionUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/document-processor`,
    concurrentUsers: 2,
    totalRequests: 20,
    testDuration: 60,
    requestDelay: 1000,
    timeout: 30000
  },
  moderate: {
    edgeFunctionUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/document-processor`,
    concurrentUsers: 5,
    totalRequests: 100,
    testDuration: 300,
    requestDelay: 500,
    timeout: 30000
  },
  heavy: {
    edgeFunctionUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/document-processor`,
    concurrentUsers: 10,
    totalRequests: 500,
    testDuration: 600,
    requestDelay: 100,
    timeout: 30000
  },
  stress: {
    edgeFunctionUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/document-processor`,
    concurrentUsers: 20,
    totalRequests: 1000,
    testDuration: 1200,
    requestDelay: 50,
    timeout: 30000
  }
}

async function main() {
  const scenario = process.argv[2] || 'light'
  
  if (!TEST_SCENARIOS[scenario]) {
    console.error(`❌ Unknown test scenario: ${scenario}`)
    console.log('Available scenarios:', Object.keys(TEST_SCENARIOS).join(', '))
    process.exit(1)
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  console.log(`🧪 Running ${scenario} test scenario`)
  
  const tester = new EdgeFunctionTester(TEST_SCENARIOS[scenario])
  
  try {
    const report = await tester.runTest()
    await TestReportGenerator.generateReport(report)
    
    // Exit with error code if test failed significantly
    if (report.summary.successRate < 90) {
      console.log('\n❌ Test failed due to low success rate')
      process.exit(1)
    }
    
    console.log('\n✅ Performance test completed successfully')
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { EdgeFunctionTester, TestReportGenerator, TEST_SCENARIOS }