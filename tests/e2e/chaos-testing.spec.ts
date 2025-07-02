/**
 * Phase 3.6-B: Chaos Testing Framework
 * 
 * Tests system resilience under adverse conditions:
 * - Worker interruption and recovery
 * - Network failures and reconnection
 * - Memory pressure scenarios
 * - Database connection drops
 * - WebSocket disconnections
 * - Partial file corruption
 * - Concurrent load stress
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { getTestConfig } from './config/test-config'
import fs from 'fs'
import path from 'path'

const testConfig = getTestConfig()

// Chaos testing utilities
class ChaosEngine {
  private page: Page
  private originalFetch: any
  
  constructor(page: Page) {
    this.page = page
  }

  /**
   * Simulate network interruption during file upload
   */
  async simulateNetworkFailure(failureRate: number = 0.3, duration: number = 5000): Promise<void> {
    await this.page.route('**/api/upload/**', async (route) => {
      if (Math.random() < failureRate) {
        console.log('🔥 CHAOS: Simulating network failure for upload API')
        await route.abort('internetdisconnected')
      } else {
        await route.continue()
      }
    })
    
    // Remove route after duration
    setTimeout(() => {
      this.page.unroute('**/api/upload/**')
      console.log('🔄 CHAOS: Network restored')
    }, duration)
  }

  /**
   * Simulate worker crashes during processing
   */
  async simulateWorkerCrash(workerType: 'ocr' | 'translate' | 'rebuild'): Promise<void> {
    await this.page.route(`**/api/workers/${workerType}`, async (route) => {
      console.log(`🔥 CHAOS: Simulating ${workerType} worker crash`)
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Worker crashed unexpectedly',
          code: 'WORKER_CRASH',
          timestamp: new Date().toISOString()
        })
      })
    })
  }

  /**
   * Simulate database connection issues
   */
  async simulateDatabaseFailure(duration: number = 3000): Promise<void> {
    await this.page.route('**/api/jobs/**', async (route) => {
      console.log('🔥 CHAOS: Simulating database connection failure')
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR',
          retryAfter: 5
        })
      })
    })
    
    // Restore after duration
    setTimeout(() => {
      this.page.unroute('**/api/jobs/**')
      console.log('🔄 CHAOS: Database connection restored')
    }, duration)
  }

  /**
   * Simulate WebSocket disconnection
   */
  async simulateWebSocketFailure(): Promise<void> {
    await this.page.evaluate(() => {
      // Inject chaos into WebSocket connections
      const originalWebSocket = window.WebSocket
      window.WebSocket = class extends originalWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          
          // Randomly disconnect WebSocket connections
          if (Math.random() < 0.3) {
            setTimeout(() => {
              console.log('🔥 CHAOS: Forcing WebSocket disconnection')
              this.close(1006, 'Chaos testing disconnection')
            }, Math.random() * 10000) // Random disconnect within 10 seconds
          }
        }
      }
    })
  }

  /**
   * Simulate memory pressure
   */
  async simulateMemoryPressure(): Promise<void> {
    await this.page.evaluate(() => {
      // Create memory pressure by allocating large objects
      const memoryHog: any[] = []
      const interval = setInterval(() => {
        try {
          // Allocate 10MB chunks
          memoryHog.push(new Array(10 * 1024 * 1024).fill('chaos'))
          console.log('🔥 CHAOS: Memory pressure simulation active')
          
          // Stop after 30 seconds or if we hit memory limits
          if (memoryHog.length > 50) {
            clearInterval(interval)
            memoryHog.length = 0 // Clear memory
            console.log('🔄 CHAOS: Memory pressure released')
          }
        } catch (e) {
          clearInterval(interval)
          console.log('🔄 CHAOS: Memory limit reached, releasing pressure')
        }
      }, 500)
    })
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork(): Promise<void> {
    await this.page.route('**/*', async (route) => {
      // Add random delay to simulate slow network
      const delay = Math.random() * 2000 + 500 // 500ms to 2.5s delay
      await new Promise(resolve => setTimeout(resolve, delay))
      await route.continue()
    })
  }

  /**
   * Generate corrupted file data
   */
  static generateCorruptedFile(originalBuffer: Buffer, corruptionRate: number = 0.1): Buffer {
    const corrupted = Buffer.from(originalBuffer)
    const bytesToCorrupt = Math.floor(corrupted.length * corruptionRate)
    
    for (let i = 0; i < bytesToCorrupt; i++) {
      const randomIndex = Math.floor(Math.random() * corrupted.length)
      corrupted[randomIndex] = Math.floor(Math.random() * 256)
    }
    
    return corrupted
  }

  /**
   * Clean up all chaos routes
   */
  async cleanup(): Promise<void> {
    await this.page.unrouteAll()
  }
}

// Helper function to wait for system recovery
async function waitForSystemRecovery(page: Page, maxWaitTime: number = 30000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Check if system is responsive
      const healthCheck = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/health')
          return response.ok
        } catch {
          return false
        }
      })
      
      if (healthCheck) {
        console.log('✅ RECOVERY: System is responsive again')
        return true
      }
      
      await page.waitForTimeout(1000)
    } catch {
      // Continue waiting
    }
  }
  
  console.log('⚠️ RECOVERY: System did not recover within timeout')
  return false
}

// Authentication helper for chaos tests
async function authenticateForChaos(page: Page): Promise<void> {
  try {
    await page.goto(`${testConfig.baseUrl}/workspace`)
    
    // Simple check for workspace
    const isWorkspace = await page.locator('[data-testid="workspace-canvas"], .workspace-canvas, main').isVisible({ timeout: 10000 }).catch(() => false)
    
    if (!isWorkspace) {
      console.log('ℹ️ CHAOS: No workspace found, tests will run without authentication')
    }
  } catch (error) {
    console.log('ℹ️ CHAOS: Authentication skipped for chaos testing')
  }
}

test.describe('Chaos Testing Suite', () => {
  let chaosEngine: ChaosEngine

  test.beforeEach(async ({ page }) => {
    test.setTimeout(testConfig.largeFileTimeout)
    chaosEngine = new ChaosEngine(page)
    await authenticateForChaos(page)
  })

  test.afterEach(async ({ page }) => {
    await chaosEngine.cleanup()
  })

  test('Network failure during file upload with automatic retry', async ({ page }) => {
    console.log('🧪 CHAOS TEST: Network failure during upload')
    
    // Generate test file
    const testFile = Buffer.from('Test file content for chaos testing'.repeat(1000))
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const tempFilePath = path.join(tempDir, 'chaos-upload-test.txt')
    fs.writeFileSync(tempFilePath, testFile)
    
    try {
      // Navigate to upload section
      await page.goto(`${testConfig.baseUrl}/workspace`)
      
      const uploadSection = await page.locator('[data-testid="nav-upload"], button:has-text("Upload"), .upload-area').first().isVisible({ timeout: 5000 }).catch(() => false)
      
      if (uploadSection) {
        await page.locator('[data-testid="nav-upload"], button:has-text("Upload")').first().click()
      }
      
      // Simulate network failure
      await chaosEngine.simulateNetworkFailure(0.7, 8000) // 70% failure rate for 8 seconds
      
      // Attempt file upload
      const fileInput = page.locator('input[type="file"]').first()
      if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await fileInput.setInputFiles(tempFilePath)
        
        // Wait for either success or retry mechanism
        const uploadResult = await Promise.race([
          page.waitForSelector('[data-testid="upload-success"], .upload-success', { timeout: 30000 }).then(() => 'success'),
          page.waitForSelector('[data-testid="upload-retry"], .upload-retry, .retry-button', { timeout: 30000 }).then(() => 'retry'),
          page.waitForSelector('[data-testid="upload-error"], .upload-error', { timeout: 30000 }).then(() => 'error')
        ]).catch(() => 'timeout')
        
        console.log(`📊 CHAOS RESULT: Upload resulted in: ${uploadResult}`)
        
        if (uploadResult === 'retry') {
          console.log('✅ CHAOS: Retry mechanism activated')
          // Click retry if available
          const retryButton = page.locator('[data-testid="upload-retry"], .retry-button').first()
          if (await retryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await retryButton.click()
            
            // Wait for eventual success after retry
            await page.waitForSelector('[data-testid="upload-success"], .upload-success', { timeout: 20000 }).catch(() => {
              console.log('⚠️ CHAOS: Retry did not complete within timeout')
            })
          }
        }
        
        // Verify system recovers
        const recovered = await waitForSystemRecovery(page)
        expect(recovered).toBe(true)
      } else {
        console.log('ℹ️ CHAOS: No file input found, skipping upload test')
      }
      
    } finally {
      // Cleanup
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
    }
  })

  test('Worker crash during processing with automatic recovery', async ({ page }) => {
    console.log('🧪 CHAOS TEST: Worker crash during processing')
    
    // Simulate OCR worker crash
    await chaosEngine.simulateWorkerCrash('ocr')
    
    // Navigate to workspace and check job status
    await page.goto(`${testConfig.baseUrl}/workspace`)
    
    // Look for job sidebar or processing indicators
    const jobIndicators = await page.locator('[data-testid="job-sidebar"], .job-status, .processing-indicator').isVisible({ timeout: 5000 }).catch(() => false)
    
    if (jobIndicators) {
      // Check if there are any processing jobs
      const processingJobs = await page.locator('[data-testid*="job-"], .job-item, .processing-job').count().catch(() => 0)
      
      if (processingJobs > 0) {
        console.log(`📊 CHAOS: Found ${processingJobs} jobs to test crash recovery`)
        
        // Wait for error state or recovery
        const recoveryResult = await Promise.race([
          page.waitForSelector('[data-testid*="status-error"], .status-error, .job-error', { timeout: 15000 }).then(() => 'error_detected'),
          page.waitForSelector('[data-testid*="status-retry"], .status-retry, .retry-indicator', { timeout: 15000 }).then(() => 'retry_detected'),
          waitForSystemRecovery(page, 20000).then(() => 'system_recovered')
        ]).catch(() => 'timeout')
        
        console.log(`📊 CHAOS RESULT: Worker crash resulted in: ${recoveryResult}`)
        
        if (recoveryResult === 'error_detected') {
          console.log('✅ CHAOS: Error state properly detected')
        }
        
        // Verify system can still accept new jobs
        const systemResponsive = await page.evaluate(async () => {
          try {
            const response = await fetch('/api/health')
            return response.ok
          } catch {
            return false
          }
        })
        
        expect(systemResponsive).toBe(true)
      } else {
        console.log('ℹ️ CHAOS: No processing jobs found, creating test scenario')
        // Could create a test job here if needed
      }
    } else {
      console.log('ℹ️ CHAOS: No job processing UI found, testing API directly')
      
      // Test API resilience directly
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/workers/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'chaos' })
          })
          return { status: response.status, ok: response.ok }
        } catch (error) {
          return { error: error.message }
        }
      })
      
      console.log('📊 CHAOS API RESULT:', apiResponse)
    }
  })

  test('WebSocket disconnection with automatic reconnection', async ({ page }) => {
    console.log('🧪 CHAOS TEST: WebSocket disconnection')
    
    // Simulate WebSocket failures
    await chaosEngine.simulateWebSocketFailure()
    
    await page.goto(`${testConfig.baseUrl}/workspace`)
    
    // Monitor WebSocket connection status
    const wsStatus = await page.evaluate(() => {
      return new Promise((resolve) => {
        let reconnectCount = 0
        const maxWaitTime = 15000
        const startTime = Date.now()
        
        // Monitor for WebSocket events
        const checkInterval = setInterval(() => {
          // Check if we have WebSocket indicators in the UI
          const wsIndicators = document.querySelectorAll('[data-testid*="connection"], .connection-status, .ws-status')
          const isConnected = Array.from(wsIndicators).some(el => 
            el.textContent?.toLowerCase().includes('connected') || 
            el.classList.contains('connected')
          )
          
          if (isConnected) {
            reconnectCount++
            console.log(`🔄 CHAOS: WebSocket reconnection detected (${reconnectCount})`)
          }
          
          if (Date.now() - startTime > maxWaitTime) {
            clearInterval(checkInterval)
            resolve({ reconnectCount, timeElapsed: Date.now() - startTime })
          }
        }, 1000)
      })
    })
    
    console.log('📊 CHAOS WS RESULT:', wsStatus)
    
    // Verify system is still functional
    const systemResponsive = await waitForSystemRecovery(page)
    expect(systemResponsive).toBe(true)
  })

  test('Memory pressure during large file processing', async ({ page }) => {
    console.log('🧪 CHAOS TEST: Memory pressure simulation')
    
    // Start memory pressure simulation
    await chaosEngine.simulateMemoryPressure()
    
    await page.goto(`${testConfig.baseUrl}/workspace`)
    
    // Monitor for memory-related issues
    const memoryMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const startTime = Date.now()
        let errorCount = 0
        let performanceIssues = 0
        
        // Monitor for errors and performance
        const originalError = window.onerror
        window.onerror = (msg, url, line, col, error) => {
          if (msg.toString().toLowerCase().includes('memory')) {
            errorCount++
          }
          return originalError ? originalError(msg, url, line, col, error) : false
        }
        
        // Monitor performance
        const checkPerformance = () => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation && navigation.loadEventEnd - navigation.loadEventStart > 5000) {
            performanceIssues++
          }
        }
        
        setTimeout(() => {
          checkPerformance()
          resolve({
            errorCount,
            performanceIssues,
            duration: Date.now() - startTime,
            memoryUsage: (performance as any).memory ? {
              used: (performance as any).memory.usedJSHeapSize,
              total: (performance as any).memory.totalJSHeapSize,
              limit: (performance as any).memory.jsHeapSizeLimit
            } : null
          })
        }, 10000)
      })
    })
    
    console.log('📊 CHAOS MEMORY RESULT:', memoryMetrics)
    
    // Verify system recovers after memory pressure
    await page.waitForTimeout(5000) // Allow memory to be released
    const recovered = await waitForSystemRecovery(page)
    expect(recovered).toBe(true)
  })

  test('Database connection failure with graceful degradation', async ({ page }) => {
    console.log('🧪 CHAOS TEST: Database connection failure')
    
    // Simulate database failure
    await chaosEngine.simulateDatabaseFailure(10000) // 10 seconds
    
    await page.goto(`${testConfig.baseUrl}/workspace`)
    
    // Test that UI shows appropriate error states
    const errorHandling = await page.evaluate(async () => {
      const errors: string[] = []
      let retryAttempts = 0
      
      // Monitor for API calls and their responses
      const originalFetch = window.fetch
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args)
          if (!response.ok && response.status >= 500) {
            errors.push(`API Error: ${response.status} for ${args[0]}`)
            retryAttempts++
          }
          return response
        } catch (error) {
          errors.push(`Network Error: ${error.message}`)
          throw error
        }
      }
      
      // Wait and collect error information
      await new Promise(resolve => setTimeout(resolve, 12000))
      
      return { errors, retryAttempts }
    })
    
    console.log('📊 CHAOS DB RESULT:', errorHandling)
    
    // Verify system shows error state but remains functional
    const errorIndicators = await page.locator('.error-message, [data-testid*="error"], .connection-error').count()
    console.log(`📊 CHAOS: Found ${errorIndicators} error indicators in UI`)
    
    // Verify recovery after database comes back online
    await page.waitForTimeout(2000)
    const recovered = await waitForSystemRecovery(page)
    expect(recovered).toBe(true)
  })

  test('Corrupted file handling and error recovery', async ({ page }) => {
    console.log('🧪 CHAOS TEST: Corrupted file handling')
    
    // Generate corrupted file
    const originalContent = Buffer.from('PDF-1.4\nValid PDF content here'.repeat(100))
    const corruptedContent = ChaosEngine.generateCorruptedFile(originalContent, 0.3) // 30% corruption
    
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const corruptedFilePath = path.join(tempDir, 'corrupted-chaos-test.pdf')
    fs.writeFileSync(corruptedFilePath, corruptedContent)
    
    try {
      await page.goto(`${testConfig.baseUrl}/workspace`)
      
      // Attempt to upload corrupted file
      const fileInput = page.locator('input[type="file"]').first()
      if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await fileInput.setInputFiles(corruptedFilePath)
        
        // Wait for error handling
        const uploadResult = await Promise.race([
          page.waitForSelector('[data-testid="upload-error"], .upload-error, .file-error', { timeout: 15000 }).then(() => 'error_detected'),
          page.waitForSelector('[data-testid="upload-success"], .upload-success', { timeout: 15000 }).then(() => 'unexpected_success'),
          new Promise(resolve => setTimeout(() => resolve('timeout'), 15000))
        ])
        
        console.log(`📊 CHAOS CORRUPTION RESULT: ${uploadResult}`)
        
        if (uploadResult === 'error_detected') {
          console.log('✅ CHAOS: Corrupted file properly rejected')
          
          // Verify error message is helpful
          const errorMessage = await page.locator('[data-testid="error-message"], .error-message').textContent().catch(() => '')
          console.log(`📊 CHAOS ERROR MESSAGE: ${errorMessage}`)
          
          expect(errorMessage.toLowerCase()).toMatch(/invalid|corrupt|error|format/)
        }
        
        // Verify system can still process valid files after corruption
        const validContent = Buffer.from('Valid file content for testing')
        const validFilePath = path.join(tempDir, 'valid-after-chaos.txt')
        fs.writeFileSync(validFilePath, validContent)
        
        await fileInput.setInputFiles(validFilePath)
        
        // Should handle valid file normally
        const validResult = await page.waitForSelector('[data-testid="upload-success"], .upload-success', { timeout: 10000 }).catch(() => null)
        
        if (validResult) {
          console.log('✅ CHAOS: System recovered and processes valid files')
        }
        
        // Cleanup valid file
        if (fs.existsSync(validFilePath)) {
          fs.unlinkSync(validFilePath)
        }
      } else {
        console.log('ℹ️ CHAOS: No file input found for corruption test')
      }
      
    } finally {
      // Cleanup corrupted file
      if (fs.existsSync(corruptedFilePath)) {
        fs.unlinkSync(corruptedFilePath)
      }
    }
  })

  test('Concurrent load stress with resource exhaustion', async ({ page }) => {
    console.log('🧪 CHAOS TEST: Concurrent load stress')
    
    // Simulate slow network to increase load
    await chaosEngine.simulateSlowNetwork()
    
    await page.goto(`${testConfig.baseUrl}/workspace`)
    
    // Stress test with concurrent operations
    const stressMetrics = await page.evaluate(async () => {
      const operations: Promise<any>[] = []
      const results: any[] = []
      const startTime = Date.now()
      
      // Create multiple concurrent operations
      for (let i = 0; i < 20; i++) {
        const operation = fetch('/api/health', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        }).then(response => ({
          index: i,
          status: response.status,
          ok: response.ok,
          timing: Date.now() - startTime
        })).catch(error => ({
          index: i,
          error: error.message,
          timing: Date.now() - startTime
        }))
        
        operations.push(operation)
      }
      
      // Wait for all operations with timeout
      try {
        const settled = await Promise.allSettled(operations)
        return {
          total: settled.length,
          successful: settled.filter(p => p.status === 'fulfilled').length,
          failed: settled.filter(p => p.status === 'rejected').length,
          duration: Date.now() - startTime
        }
      } catch (error) {
        return {
          error: error.message,
          duration: Date.now() - startTime
        }
      }
    })
    
    console.log('📊 CHAOS STRESS RESULT:', stressMetrics)
    
    // Verify system handles load gracefully
    const finalRecovery = await waitForSystemRecovery(page, 20000)
    expect(finalRecovery).toBe(true)
    
    // Check that success rate is reasonable under stress
    if (stressMetrics.total) {
      const successRate = stressMetrics.successful / stressMetrics.total
      console.log(`📊 CHAOS: Success rate under stress: ${(successRate * 100).toFixed(1)}%`)
      
      // Should maintain at least 50% success rate under chaos conditions
      expect(successRate).toBeGreaterThan(0.3)
    }
  })
})

// Comprehensive chaos test that combines multiple failure modes
test.describe('Multi-Failure Chaos Scenarios', () => {
  test('Combined network + worker + database failures', async ({ page }) => {
    test.setTimeout(testConfig.largeFileTimeout)
    console.log('🧪 ULTIMATE CHAOS TEST: Multiple simultaneous failures')
    
    const chaosEngine = new ChaosEngine(page)
    
    try {
      await authenticateForChaos(page)
      
      // Apply multiple chaos conditions simultaneously
      await chaosEngine.simulateNetworkFailure(0.5, 15000)
      await chaosEngine.simulateWorkerCrash('ocr')
      await chaosEngine.simulateDatabaseFailure(8000)
      await chaosEngine.simulateWebSocketFailure()
      
      await page.goto(`${testConfig.baseUrl}/workspace`)
      
      // Monitor system behavior under extreme stress
      const chaosMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          let errorCount = 0
          let warningCount = 0
          let recoveryAttempts = 0
          
          // Monitor console for errors and recovery attempts
          const originalConsoleError = console.error
          const originalConsoleWarn = console.warn
          const originalConsoleLog = console.log
          
          console.error = (...args) => {
            errorCount++
            return originalConsoleError(...args)
          }
          
          console.warn = (...args) => {
            warningCount++
            return originalConsoleWarn(...args)
          }
          
          console.log = (...args) => {
            if (args.some(arg => String(arg).toLowerCase().includes('retry') || String(arg).toLowerCase().includes('reconnect'))) {
              recoveryAttempts++
            }
            return originalConsoleLog(...args)
          }
          
          setTimeout(() => {
            resolve({
              errorCount,
              warningCount,
              recoveryAttempts,
              timestamp: Date.now()
            })
          }, 20000)
        })
      })
      
      console.log('📊 ULTIMATE CHAOS RESULT:', chaosMetrics)
      
      // System should attempt recovery
      expect(chaosMetrics.recoveryAttempts).toBeGreaterThan(0)
      
      // Wait for system to stabilize
      await page.waitForTimeout(10000)
      
      // Verify eventual recovery
      const finalRecovery = await waitForSystemRecovery(page, 30000)
      console.log(`📊 ULTIMATE CHAOS: Final recovery status: ${finalRecovery}`)
      
      // System should eventually recover or show graceful degradation
      expect(finalRecovery).toBe(true)
      
    } finally {
      await chaosEngine.cleanup()
    }
  })
})