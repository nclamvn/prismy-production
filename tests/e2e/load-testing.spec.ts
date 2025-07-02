/**
 * Phase 3.6-C: Load Testing Framework
 * 
 * Tests system performance under high load conditions:
 * - 100+ concurrent file uploads
 * - Massive batch processing scenarios
 * - WebSocket connection scaling
 * - Database connection pooling under load
 * - Memory usage under sustained load
 * - API rate limiting and throttling
 */

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test'
import { getTestConfig, PERFORMANCE_BENCHMARKS, FILE_SIZES } from './config/test-config'
import fs from 'fs'
import path from 'path'

const testConfig = getTestConfig()

// Load testing utilities
class LoadTestEngine {
  private browsers: Browser[] = []
  private contexts: BrowserContext[] = []
  private pages: Page[] = []
  
  /**
   * Create multiple browser instances for concurrent testing
   */
  async createConcurrentSessions(count: number, browserType: any): Promise<Page[]> {
    console.log(`🚀 LOAD: Creating ${count} concurrent browser sessions`)
    
    for (let i = 0; i < count; i++) {
      const browser = await browserType.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      })
      
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: `LoadTest-Session-${i}/1.0`
      })
      
      const page = await context.newPage()
      
      this.browsers.push(browser)
      this.contexts.push(context)
      this.pages.push(page)
    }
    
    console.log(`✅ LOAD: Created ${this.pages.length} browser sessions`)
    return this.pages
  }
  
  /**
   * Generate test files of various sizes
   */
  static generateTestFiles(count: number, sizeCategory: keyof typeof FILE_SIZES): Buffer[] {
    const files: Buffer[] = []
    const targetSize = FILE_SIZES[sizeCategory]
    
    for (let i = 0; i < count; i++) {
      const content = `Load test file ${i}\n${'Lorem ipsum dolor sit amet. '.repeat(Math.ceil(targetSize / 100))}`
      const buffer = Buffer.from(content.slice(0, targetSize))
      files.push(buffer)
    }
    
    return files
  }
  
  /**
   * Monitor system metrics during load test
   */
  async monitorMetrics(page: Page, duration: number): Promise<any> {
    return page.evaluate((testDuration) => {
      return new Promise((resolve) => {
        const metrics = {
          startTime: Date.now(),
          memoryUsage: [],
          networkActivity: [],
          errorCount: 0,
          performanceEntries: [],
          domContentLoaded: 0,
          loadComplete: 0
        }
        
        // Monitor memory usage
        const memoryInterval = setInterval(() => {
          if ((performance as any).memory) {
            metrics.memoryUsage.push({
              timestamp: Date.now(),
              used: (performance as any).memory.usedJSHeapSize,
              total: (performance as any).memory.totalJSHeapSize,
              limit: (performance as any).memory.jsHeapSizeLimit
            })
          }
        }, 1000)
        
        // Monitor network activity
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              metrics.networkActivity.push({
                name: entry.name,
                duration: entry.duration,
                transferSize: (entry as any).transferSize || 0,
                timestamp: entry.startTime
              })
            }
          }
        })
        observer.observe({ entryTypes: ['resource'] })
        
        // Monitor page load events
        document.addEventListener('DOMContentLoaded', () => {
          metrics.domContentLoaded = Date.now()
        })
        
        window.addEventListener('load', () => {
          metrics.loadComplete = Date.now()
        })
        
        // Monitor errors
        window.addEventListener('error', (event) => {
          metrics.errorCount++
        })
        
        // Collect final metrics after duration
        setTimeout(() => {
          clearInterval(memoryInterval)
          observer.disconnect()
          
          metrics.performanceEntries = performance.getEntriesByType('navigation')
          
          resolve(metrics)
        }, testDuration)
      })
    }, duration)
  }
  
  /**
   * Cleanup all browser instances
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 LOAD: Cleaning up ${this.browsers.length} browser sessions`)
    
    for (const context of this.contexts) {
      await context.close().catch(() => {})
    }
    
    for (const browser of this.browsers) {
      await browser.close().catch(() => {})
    }
    
    this.browsers = []
    this.contexts = []
    this.pages = []
  }
}

// Performance measurement utilities
class PerformanceCollector {
  static async measureUploadPerformance(page: Page, fileSize: number): Promise<any> {
    const startTime = Date.now()
    
    return page.evaluate((start, size) => {
      return new Promise((resolve) => {
        const metrics = {
          startTime: start,
          fileSize: size,
          uploadTime: 0,
          throughput: 0,
          networkEvents: []
        }
        
        // Monitor network requests
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('/api/upload')) {
              metrics.networkEvents.push({
                url: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                transferSize: (entry as any).transferSize || 0
              })
            }
          }
        })
        observer.observe({ entryTypes: ['resource'] })
        
        // Wait for upload completion or timeout
        const checkCompletion = () => {
          const uploadIndicator = document.querySelector('[data-testid="upload-success"], .upload-complete')
          if (uploadIndicator) {
            metrics.uploadTime = Date.now() - start
            metrics.throughput = size / (metrics.uploadTime / 1000) // bytes per second
            observer.disconnect()
            resolve(metrics)
          } else {
            setTimeout(checkCompletion, 500)
          }
        }
        
        checkCompletion()
        
        // Timeout after 2 minutes
        setTimeout(() => {
          observer.disconnect()
          metrics.uploadTime = Date.now() - start
          resolve(metrics)
        }, 120000)
      })
    }, startTime, fileSize)
  }
  
  static calculateStatistics(values: number[]): any {
    if (values.length === 0) return null
    
    const sorted = values.slice().sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }
}

// Authentication for load testing
async function setupLoadTestAuth(page: Page): Promise<void> {
  try {
    await page.goto(`${testConfig.baseUrl}/workspace`, { timeout: 30000 })
    
    const isWorkspace = await page.locator('[data-testid="workspace-canvas"], main, .workspace').isVisible({ timeout: 5000 }).catch(() => false)
    
    if (!isWorkspace) {
      console.log('ℹ️ LOAD: No authenticated workspace found, running without auth')
    }
  } catch (error) {
    console.log('ℹ️ LOAD: Auth setup skipped for load testing')
  }
}

test.describe('Load Testing Suite', () => {
  let loadEngine: LoadTestEngine

  test.beforeAll(async () => {
    loadEngine = new LoadTestEngine()
  })

  test.afterAll(async () => {
    await loadEngine.cleanup()
  })

  test('Concurrent file uploads - 50 users', async ({ browser }) => {
    test.setTimeout(testConfig.largeFileTimeout * 2) // Extended timeout for load testing
    console.log('🧪 LOAD TEST: 50 concurrent file uploads')
    
    const concurrentUsers = 50
    const fileSize = FILE_SIZES.MEDIUM // 10MB files
    
    // Create test files
    const testFiles = LoadTestEngine.generateTestFiles(concurrentUsers, 'MEDIUM')
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const filePaths: string[] = []
    testFiles.forEach((fileBuffer, index) => {
      const filePath = path.join(tempDir, `load-test-${index}.txt`)
      fs.writeFileSync(filePath, fileBuffer)
      filePaths.push(filePath)
    })
    
    try {
      // Create concurrent browser sessions
      const pages = await loadEngine.createConcurrentSessions(concurrentUsers, browser.browserType())
      
      // Setup authentication for all sessions
      await Promise.all(pages.map(page => setupLoadTestAuth(page)))
      
      console.log(`📊 LOAD: Starting ${concurrentUsers} concurrent uploads`)
      const uploadStartTime = Date.now()
      
      // Start concurrent uploads
      const uploadPromises = pages.map(async (page, index) => {
        try {
          const filePath = filePaths[index]
          
          // Navigate to upload area
          await page.goto(`${testConfig.baseUrl}/workspace`)
          
          // Find and use file input
          const fileInput = page.locator('input[type="file"]').first()
          const inputVisible = await fileInput.isVisible({ timeout: 10000 }).catch(() => false)
          
          if (inputVisible) {
            await fileInput.setInputFiles(filePath)
            
            // Measure upload performance
            const metrics = await PerformanceCollector.measureUploadPerformance(page, fileSize)
            
            return {
              sessionId: index,
              success: true,
              metrics,
              duration: Date.now() - uploadStartTime
            }
          } else {
            return {
              sessionId: index,
              success: false,
              error: 'File input not found',
              duration: Date.now() - uploadStartTime
            }
          }
        } catch (error) {
          return {
            sessionId: index,
            success: false,
            error: error.message,
            duration: Date.now() - uploadStartTime
          }
        }
      })
      
      // Wait for all uploads with timeout
      const uploadResults = await Promise.allSettled(uploadPromises)
      const totalDuration = Date.now() - uploadStartTime
      
      // Analyze results
      const successful = uploadResults.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length
      
      const failed = uploadResults.length - successful
      const successRate = successful / uploadResults.length
      
      console.log(`📊 LOAD RESULTS:`)
      console.log(`   Concurrent Users: ${concurrentUsers}`)
      console.log(`   Successful Uploads: ${successful}`)
      console.log(`   Failed Uploads: ${failed}`)
      console.log(`   Success Rate: ${(successRate * 100).toFixed(1)}%`)
      console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
      console.log(`   Throughput: ${(successful / (totalDuration / 1000)).toFixed(2)} uploads/sec`)
      
      // Performance assertions
      expect(successRate).toBeGreaterThan(0.7) // At least 70% success rate
      expect(totalDuration).toBeLessThan(300000) // Complete within 5 minutes
      
      // Collect performance metrics
      const uploadTimes = uploadResults
        .filter(result => result.status === 'fulfilled' && result.value.success && result.value.metrics)
        .map(result => (result as any).value.metrics.uploadTime)
      
      if (uploadTimes.length > 0) {
        const stats = PerformanceCollector.calculateStatistics(uploadTimes)
        console.log(`📊 UPLOAD TIME STATS:`, stats)
        
        // Average upload time should be reasonable
        expect(stats.mean).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_UPLOAD_TIME)
      }
      
    } finally {
      // Cleanup test files
      filePaths.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      })
    }
  })

  test('Batch processing load - 10 batches with 20 files each', async ({ browser }) => {
    test.setTimeout(testConfig.batchProcessingTimeout)
    console.log('🧪 LOAD TEST: Batch processing under load')
    
    const batchCount = 10
    const filesPerBatch = 20
    const fileSize = FILE_SIZES.SMALL // 1MB files for faster processing
    
    // Create test files for batches
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const batchFiles: string[][] = []
    
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const testFiles = LoadTestEngine.generateTestFiles(filesPerBatch, 'SMALL')
      const batchFilePaths: string[] = []
      
      testFiles.forEach((fileBuffer, fileIndex) => {
        const filePath = path.join(tempDir, `batch-${batchIndex}-file-${fileIndex}.txt`)
        fs.writeFileSync(filePath, fileBuffer)
        batchFilePaths.push(filePath)
      })
      
      batchFiles.push(batchFilePaths)
    }
    
    try {
      // Create browser sessions for batch uploads
      const pages = await loadEngine.createConcurrentSessions(batchCount, browser.browserType())
      
      // Setup authentication
      await Promise.all(pages.map(page => setupLoadTestAuth(page)))
      
      console.log(`📊 LOAD: Starting ${batchCount} concurrent batch uploads`)
      const batchStartTime = Date.now()
      
      // Start concurrent batch uploads
      const batchPromises = pages.map(async (page, batchIndex) => {
        try {
          const filePaths = batchFiles[batchIndex]
          
          await page.goto(`${testConfig.baseUrl}/workspace`)
          
          // Navigate to batch section
          const batchNav = page.locator('[data-testid="nav-batches"], button:has-text("Batch")').first()
          const navVisible = await batchNav.isVisible({ timeout: 5000 }).catch(() => false)
          
          if (navVisible) {
            await batchNav.click()
            await page.waitForTimeout(1000)
          }
          
          // Create batch with multiple files
          const fileInput = page.locator('input[type="file"]').first()
          const inputVisible = await fileInput.isVisible({ timeout: 10000 }).catch(() => false)
          
          if (inputVisible) {
            await fileInput.setInputFiles(filePaths)
            
            // Wait for batch creation
            const batchCreated = await page.waitForSelector('[data-testid="batch-created"], .batch-created, .batch-item', { timeout: 30000 }).catch(() => null)
            
            if (batchCreated) {
              // Monitor batch progress
              const progressMetrics = await page.evaluate(() => {
                return new Promise((resolve) => {
                  let completedFiles = 0
                  const totalFiles = 20 // filesPerBatch
                  const checkInterval = setInterval(() => {
                    const completedElements = document.querySelectorAll('[data-testid*="completed"], .status-completed, .file-completed')
                    completedFiles = completedElements.length
                    
                    if (completedFiles >= totalFiles || Date.now() > Date.now() + 120000) {
                      clearInterval(checkInterval)
                      resolve({
                        completedFiles,
                        totalFiles,
                        completionRate: completedFiles / totalFiles
                      })
                    }
                  }, 2000)
                })
              })
              
              return {
                batchId: batchIndex,
                success: true,
                filesUploaded: filePaths.length,
                progressMetrics,
                duration: Date.now() - batchStartTime
              }
            } else {
              return {
                batchId: batchIndex,
                success: false,
                error: 'Batch creation timeout',
                duration: Date.now() - batchStartTime
              }
            }
          } else {
            return {
              batchId: batchIndex,
              success: false,
              error: 'File input not found',
              duration: Date.now() - batchStartTime
            }
          }
        } catch (error) {
          return {
            batchId: batchIndex,
            success: false,
            error: error.message,
            duration: Date.now() - batchStartTime
          }
        }
      })
      
      // Wait for all batch operations
      const batchResults = await Promise.allSettled(batchPromises)
      const totalDuration = Date.now() - batchStartTime
      
      // Analyze batch results
      const successfulBatches = batchResults.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length
      
      const totalFilesProcessed = batchResults
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .reduce((total, result) => total + (result as any).value.filesUploaded, 0)
      
      console.log(`📊 BATCH LOAD RESULTS:`)
      console.log(`   Successful Batches: ${successfulBatches}/${batchCount}`)
      console.log(`   Total Files Processed: ${totalFilesProcessed}`)
      console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
      console.log(`   Batch Throughput: ${(successfulBatches / (totalDuration / 1000)).toFixed(2)} batches/sec`)
      console.log(`   File Throughput: ${(totalFilesProcessed / (totalDuration / 1000)).toFixed(2)} files/sec`)
      
      // Performance assertions
      expect(successfulBatches).toBeGreaterThan(batchCount * 0.6) // At least 60% success
      expect(totalDuration).toBeLessThan(testConfig.batchProcessingTimeout * 0.8) // Within 80% of timeout
      
    } finally {
      // Cleanup all batch files
      batchFiles.forEach(filePaths => {
        filePaths.forEach(filePath => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        })
      })
    }
  })

  test('WebSocket connection scaling - 100 concurrent connections', async ({ browser }) => {
    test.setTimeout(120000) // 2 minutes
    console.log('🧪 LOAD TEST: WebSocket connection scaling')
    
    const connectionCount = 100
    
    // Create browser sessions for WebSocket connections
    const pages = await loadEngine.createConcurrentSessions(connectionCount, browser.browserType())
    
    try {
      console.log(`📊 LOAD: Establishing ${connectionCount} WebSocket connections`)
      
      // Setup WebSocket connections concurrently
      const wsPromises = pages.map(async (page, index) => {
        try {
          await page.goto(`${testConfig.baseUrl}/workspace`)
          
          // Monitor WebSocket connection
          const wsMetrics = await page.evaluate((sessionId) => {
            return new Promise((resolve) => {
              let connectionEstablished = false
              let messageCount = 0
              let errorCount = 0
              const startTime = Date.now()
              
              // Try to establish WebSocket connection
              try {
                const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`
                const ws = new WebSocket(wsUrl)
                
                ws.onopen = () => {
                  connectionEstablished = true
                  console.log(`WS ${sessionId}: Connected`)
                }
                
                ws.onmessage = (event) => {
                  messageCount++
                }
                
                ws.onerror = (error) => {
                  errorCount++
                  console.log(`WS ${sessionId}: Error`)
                }
                
                ws.onclose = () => {
                  console.log(`WS ${sessionId}: Closed`)
                }
                
                // Send test message
                setTimeout(() => {
                  if (connectionEstablished) {
                    ws.send(JSON.stringify({ type: 'ping', sessionId }))
                  }
                }, 2000)
                
                // Collect metrics after 30 seconds
                setTimeout(() => {
                  ws.close()
                  resolve({
                    sessionId,
                    connectionEstablished,
                    messageCount,
                    errorCount,
                    duration: Date.now() - startTime
                  })
                }, 30000)
                
              } catch (error) {
                resolve({
                  sessionId,
                  connectionEstablished: false,
                  error: error.message,
                  duration: Date.now() - startTime
                })
              }
            })
          }, index)
          
          return wsMetrics
        } catch (error) {
          return {
            sessionId: index,
            connectionEstablished: false,
            error: error.message
          }
        }
      })
      
      // Wait for all WebSocket tests
      const wsResults = await Promise.allSettled(wsPromises)
      
      // Analyze WebSocket performance
      const establishedConnections = wsResults.filter(result => 
        result.status === 'fulfilled' && result.value.connectionEstablished
      ).length
      
      const totalMessages = wsResults
        .filter(result => result.status === 'fulfilled' && result.value.messageCount)
        .reduce((total, result) => total + (result as any).value.messageCount, 0)
      
      const errorConnections = wsResults.filter(result => 
        result.status === 'fulfilled' && (result.value.errorCount > 0 || result.value.error)
      ).length
      
      console.log(`📊 WEBSOCKET LOAD RESULTS:`)
      console.log(`   Established Connections: ${establishedConnections}/${connectionCount}`)
      console.log(`   Connection Success Rate: ${(establishedConnections / connectionCount * 100).toFixed(1)}%`)
      console.log(`   Total Messages Exchanged: ${totalMessages}`)
      console.log(`   Connections with Errors: ${errorConnections}`)
      
      // Performance assertions
      expect(establishedConnections).toBeGreaterThan(connectionCount * 0.8) // At least 80% success
      expect(errorConnections).toBeLessThan(connectionCount * 0.2) // Less than 20% errors
      
    } finally {
      // Connections are cleaned up by loadEngine.cleanup()
    }
  })

  test('API rate limiting and throttling under load', async ({ browser }) => {
    test.setTimeout(180000) // 3 minutes
    console.log('🧪 LOAD TEST: API rate limiting behavior')
    
    const requestCount = 200
    const concurrentSessions = 20
    
    // Create sessions for API load testing
    const pages = await loadEngine.createConcurrentSessions(concurrentSessions, browser.browserType())
    
    try {
      // Setup authentication
      await Promise.all(pages.map(page => setupLoadTestAuth(page)))
      
      console.log(`📊 LOAD: Sending ${requestCount} API requests across ${concurrentSessions} sessions`)
      
      // Generate high-frequency API requests
      const apiPromises = pages.map(async (page, sessionIndex) => {
        const requestsPerSession = Math.floor(requestCount / concurrentSessions)
        const sessionResults: any[] = []
        
        for (let i = 0; i < requestsPerSession; i++) {
          try {
            const requestStart = Date.now()
            
            const response = await page.evaluate(async (requestId) => {
              try {
                const response = await fetch('/api/health', {
                  method: 'GET',
                  headers: {
                    'Cache-Control': 'no-cache',
                    'X-Request-ID': `load-test-${requestId}`
                  }
                })
                
                return {
                  status: response.status,
                  ok: response.ok,
                  headers: Object.fromEntries(response.headers.entries()),
                  timestamp: Date.now()
                }
              } catch (error) {
                return {
                  error: error.message,
                  timestamp: Date.now()
                }
              }
            }, `${sessionIndex}-${i}`)
            
            sessionResults.push({
              requestId: `${sessionIndex}-${i}`,
              duration: Date.now() - requestStart,
              ...response
            })
            
            // Small delay between requests
            await page.waitForTimeout(50)
            
          } catch (error) {
            sessionResults.push({
              requestId: `${sessionIndex}-${i}`,
              error: error.message
            })
          }
        }
        
        return {
          sessionId: sessionIndex,
          requests: sessionResults
        }
      })
      
      // Execute all API requests
      const apiResults = await Promise.allSettled(apiPromises)
      
      // Analyze API performance and rate limiting
      const allRequests = apiResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as any).value.requests)
      
      const successfulRequests = allRequests.filter(req => req.ok === true)
      const rateLimitedRequests = allRequests.filter(req => req.status === 429)
      const errorRequests = allRequests.filter(req => req.error || (req.status && req.status >= 500))
      
      const responseTimes = successfulRequests.map(req => req.duration)
      const responseStats = PerformanceCollector.calculateStatistics(responseTimes)
      
      console.log(`📊 API LOAD RESULTS:`)
      console.log(`   Total Requests: ${allRequests.length}`)
      console.log(`   Successful Requests: ${successfulRequests.length}`)
      console.log(`   Rate Limited (429): ${rateLimitedRequests.length}`)
      console.log(`   Error Requests (5xx): ${errorRequests.length}`)
      console.log(`   Success Rate: ${(successfulRequests.length / allRequests.length * 100).toFixed(1)}%`)
      
      if (responseStats) {
        console.log(`📊 RESPONSE TIME STATS:`, responseStats)
      }
      
      // Performance assertions
      const successRate = successfulRequests.length / allRequests.length
      expect(successRate).toBeGreaterThan(0.7) // At least 70% success rate
      
      // Rate limiting should be working (some 429s expected under load)
      expect(rateLimitedRequests.length).toBeGreaterThan(0)
      
      // Response times should be reasonable for successful requests
      if (responseStats) {
        expect(responseStats.mean).toBeLessThan(5000) // Average under 5 seconds
        expect(responseStats.p95).toBeLessThan(10000) // 95th percentile under 10 seconds
      }
      
    } finally {
      // Sessions cleaned up by loadEngine
    }
  })

  test('Memory usage under sustained load', async ({ browser }) => {
    test.setTimeout(300000) // 5 minutes
    console.log('🧪 LOAD TEST: Memory usage under sustained load')
    
    const testDuration = 120000 // 2 minutes of sustained load
    const sessionCount = 10
    
    // Create sessions for memory testing
    const pages = await loadEngine.createConcurrentSessions(sessionCount, browser.browserType())
    
    try {
      // Setup and start memory monitoring
      await Promise.all(pages.map(page => setupLoadTestAuth(page)))
      
      console.log(`📊 LOAD: Starting ${testDuration / 1000}s sustained load test`)
      
      // Start sustained operations on all sessions
      const memoryPromises = pages.map(async (page, sessionIndex) => {
        try {
          await page.goto(`${testConfig.baseUrl}/workspace`)
          
          // Start monitoring memory usage
          const memoryMetrics = await loadEngine.monitorMetrics(page, testDuration)
          
          // Perform sustained operations during monitoring
          const operationInterval = setInterval(async () => {
            try {
              // Simulate various operations
              await page.evaluate(() => {
                // Create some DOM elements
                const div = document.createElement('div')
                div.innerHTML = 'Load test content '.repeat(1000)
                document.body.appendChild(div)
                
                // Remove them after a short time
                setTimeout(() => {
                  if (div.parentNode) {
                    div.parentNode.removeChild(div)
                  }
                }, 5000)
                
                // Trigger some API calls
                fetch('/api/health').catch(() => {})
              })
            } catch (error) {
              // Continue operations even if some fail
            }
          }, 2000)
          
          // Wait for test duration
          await page.waitForTimeout(testDuration)
          clearInterval(operationInterval)
          
          return {
            sessionId: sessionIndex,
            memoryMetrics,
            success: true
          }
          
        } catch (error) {
          return {
            sessionId: sessionIndex,
            error: error.message,
            success: false
          }
        }
      })
      
      // Wait for all memory tests
      const memoryResults = await Promise.allSettled(memoryPromises)
      
      // Analyze memory usage patterns
      const successfulSessions = memoryResults
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => (result as any).value)
      
      if (successfulSessions.length > 0) {
        // Calculate memory statistics across all sessions
        const allMemoryReadings = successfulSessions
          .flatMap(session => session.memoryMetrics.memoryUsage || [])
        
        if (allMemoryReadings.length > 0) {
          const memoryUsed = allMemoryReadings.map(reading => reading.used)
          const memoryTotal = allMemoryReadings.map(reading => reading.total)
          
          const usedStats = PerformanceCollector.calculateStatistics(memoryUsed)
          const totalStats = PerformanceCollector.calculateStatistics(memoryTotal)
          
          console.log(`📊 MEMORY USAGE RESULTS:`)
          console.log(`   Sessions Monitored: ${successfulSessions.length}`)
          console.log(`   Memory Readings: ${allMemoryReadings.length}`)
          console.log(`   Used Memory Stats (MB):`, {
            ...usedStats,
            min: Math.round(usedStats.min / 1024 / 1024),
            max: Math.round(usedStats.max / 1024 / 1024),
            mean: Math.round(usedStats.mean / 1024 / 1024),
            p95: Math.round(usedStats.p95 / 1024 / 1024)
          })
          
          // Memory usage assertions
          const maxMemoryMB = usedStats.max / 1024 / 1024
          expect(maxMemoryMB).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_MEMORY_USAGE) // Should stay under limit
          
          // Memory should not grow excessively during test
          const memoryGrowth = (usedStats.max - usedStats.min) / 1024 / 1024
          console.log(`   Memory Growth During Test: ${Math.round(memoryGrowth)}MB`)
          expect(memoryGrowth).toBeLessThan(500) // Less than 500MB growth
        }
        
        // Check for error patterns
        const totalErrors = successfulSessions.reduce((total, session) => 
          total + (session.memoryMetrics.errorCount || 0), 0
        )
        
        console.log(`   Total Errors During Test: ${totalErrors}`)
        expect(totalErrors).toBeLessThan(successfulSessions.length * 10) // Less than 10 errors per session
      }
      
    } finally {
      // Sessions cleaned up by loadEngine
    }
  })
})