/**
 * 🔍 Validation Step 5: Performance
 * 
 * Tests page load times, API response times, and system stability
 */

import { test, expect } from '@playwright/test'
import { loginUser, createTestFile } from '../utils/test-helpers'
import * as fs from 'fs'

test.describe('Performance Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginUser(page, 'USER')
  })
  
  test('page load times under 3 seconds', async ({ page }) => {
    const pages = [
      { name: 'Dashboard', url: '/app' },
      { name: 'Upload', url: '/upload' },
      { name: 'Documents', url: '/app/documents' },
      { name: 'Settings', url: '/app/settings' }
    ]
    
    for (const { name, url } of pages) {
      const startTime = Date.now()
      await page.goto(url, { waitUntil: 'networkidle' })
      const loadTime = Date.now() - startTime
      
      console.log(`${name} page load time: ${loadTime}ms`)
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
      
      // Check if page has loaded properly
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible()
    }
  })
  
  test('API response times under 2 seconds', async ({ page }) => {
    // Test health check API
    const healthStart = Date.now()
    const healthResponse = await page.request.get('/api/health')
    const healthTime = Date.now() - healthStart
    
    expect(healthResponse.ok()).toBeTruthy()
    expect(healthTime).toBeLessThan(2000)
    console.log(`Health API response time: ${healthTime}ms`)
    
    // Test search API
    const searchStart = Date.now()
    const searchResponse = await page.request.post('/api/search', {
      data: { query: 'test' }
    })
    const searchTime = Date.now() - searchStart
    
    expect(searchTime).toBeLessThan(2000)
    console.log(`Search API response time: ${searchTime}ms`)
  })
  
  test('file processing within reasonable time', async ({ page }) => {
    // Create small test file
    const filePath = createTestFile(1024 * 10, 'perf-test.txt', 'Performance test content')
    
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    
    const processingStart = Date.now()
    await page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Wait for processing to complete
    await page.waitForURL(/\/(processing|results|translation)/, { timeout: 30000 })
    
    // Wait for completion indicator
    await page.waitForSelector('text=/completed|done|download/i', { timeout: 60000 })
    
    const processingTime = Date.now() - processingStart
    console.log(`File processing time: ${processingTime}ms`)
    
    // Should complete within 60 seconds for small files
    expect(processingTime).toBeLessThan(60000)
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('memory usage remains stable', async ({ page }) => {
    // Navigate through multiple pages to check for memory leaks
    const routes = ['/app', '/upload', '/app/documents', '/app/settings']
    
    // Get initial memory if available
    const initialMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return null
    })
    
    // Navigate through pages multiple times
    for (let i = 0; i < 3; i++) {
      for (const route of routes) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Get final memory
    const finalMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return null
    })
    
    if (initialMetrics && finalMetrics) {
      const memoryIncrease = finalMetrics - initialMetrics
      const percentIncrease = (memoryIncrease / initialMetrics) * 100
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${percentIncrease.toFixed(1)}%)`)
      
      // Memory increase should be reasonable (less than 50%)
      expect(percentIncrease).toBeLessThan(50)
    }
  })
  
  test('concurrent request handling', async ({ page }) => {
    // Make multiple concurrent requests
    const requests = []
    
    for (let i = 0; i < 5; i++) {
      requests.push(
        page.request.get('/api/health').then(r => ({
          status: r.status(),
          time: Date.now()
        }))
      )
    }
    
    const startTime = Date.now()
    const results = await Promise.all(requests)
    const totalTime = Date.now() - startTime
    
    // All requests should succeed
    results.forEach(result => {
      expect(result.status).toBe(200)
    })
    
    // Concurrent requests should complete reasonably fast
    console.log(`5 concurrent requests completed in: ${totalTime}ms`)
    expect(totalTime).toBeLessThan(5000)
  })
  
  test('large list rendering performance', async ({ page }) => {
    await page.goto('/app/documents')
    
    // Check if pagination or virtualization is implemented
    const pagination = await page.locator('[role="navigation"], .pagination, text=/page|next|previous/i').count()
    const hasVirtualization = await page.locator('[data-virtual], .virtual-list').count()
    
    if (pagination > 0 || hasVirtualization > 0) {
      console.log('List optimization detected (pagination or virtualization)')
    }
    
    // Measure initial render time
    const renderStart = Date.now()
    await page.waitForSelector('[role="list"], table, .document-list', { timeout: 5000 })
    const renderTime = Date.now() - renderStart
    
    console.log(`Document list render time: ${renderTime}ms`)
    expect(renderTime).toBeLessThan(2000)
  })
  
  test('resource optimization', async ({ page }) => {
    // Check if resources are optimized
    const responses: any[] = []
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      })
    })
    
    await page.goto('/app')
    await page.waitForLoadState('networkidle')
    
    // Check for compression
    const compressedResources = responses.filter(r => 
      r.headers['content-encoding'] === 'gzip' || 
      r.headers['content-encoding'] === 'br'
    )
    
    // Check for caching headers
    const cachedResources = responses.filter(r => 
      r.headers['cache-control'] && 
      !r.headers['cache-control'].includes('no-cache')
    )
    
    console.log(`Compressed resources: ${compressedResources.length}/${responses.length}`)
    console.log(`Cached resources: ${cachedResources.length}/${responses.length}`)
    
    // At least some resources should be optimized
    expect(compressedResources.length).toBeGreaterThan(0)
  })
})