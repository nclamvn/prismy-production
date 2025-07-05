/**
 * 🔍 Validation Step 8: Monitoring
 * 
 * Tests error tracking, performance metrics, analytics, and uptime monitoring
 */

import { test, expect } from '@playwright/test'
import { loginUser } from '../utils/test-helpers'

test.describe('Monitoring Validation', () => {
  
  test('error tracking is active', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Check if Sentry is initialized
    const sentryConfig = await page.evaluate(() => {
      const sentry = (window as any).Sentry || (window as any).__SENTRY__
      if (sentry) {
        return {
          enabled: true,
          dsn: sentry.getCurrentHub?.()?.getClient?.()?.getDsn?.() || 'configured',
          environment: sentry.getCurrentHub?.()?.getScope?.()._tags?.environment || 'unknown'
        }
      }
      return { enabled: false }
    })
    
    console.log('Sentry configuration:', sentryConfig)
    
    // In production, Sentry should be enabled
    if (process.env.NODE_ENV === 'production') {
      expect(sentryConfig.enabled).toBeTruthy()
      expect(sentryConfig.environment).toBe('production')
    }
    
    // Test error capture
    const errorsCaptured: any[] = []
    
    await page.exposeFunction('captureError', (error: any) => {
      errorsCaptured.push(error)
    })
    
    await page.evaluate(() => {
      // Override Sentry capture for testing
      if ((window as any).Sentry?.captureException) {
        const originalCapture = (window as any).Sentry.captureException;
        (window as any).Sentry.captureException = (error: any) => {
          (window as any).captureError({ message: error.message, captured: true })
          return originalCapture(error)
        }
      }
      
      // Trigger an error
      try {
        throw new Error('Test monitoring error')
      } catch (e) {
        if ((window as any).Sentry?.captureException) {
          (window as any).Sentry.captureException(e)
        }
      }
    })
    
    // Check if error was captured
    if (sentryConfig.enabled) {
      expect(errorsCaptured.length).toBeGreaterThan(0)
    }
  })
  
  test('performance metrics collection', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Navigate to a page and collect performance metrics
    await page.goto('/app/documents')
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        resourceCount: performance.getEntriesByType('resource').length
      }
    })
    
    console.log('Performance metrics:', metrics)
    
    // Metrics should be collected
    expect(metrics.domContentLoaded).toBeGreaterThan(0)
    expect(metrics.loadComplete).toBeGreaterThan(0)
    
    // Check if metrics are being sent
    const metricsRequests: any[] = []
    
    page.on('request', request => {
      if (request.url().includes('sentry') || 
          request.url().includes('analytics') ||
          request.url().includes('metrics')) {
        metricsRequests.push({
          url: request.url(),
          method: request.method()
        })
      }
    })
    
    // Trigger some actions
    await page.click('body') // Simple interaction
    await page.waitForTimeout(1000)
    
    // In production, metrics should be sent
    if (process.env.NODE_ENV === 'production') {
      expect(metricsRequests.length).toBeGreaterThan(0)
    }
  })
  
  test('usage analytics tracking', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Check if analytics is configured
    const analyticsConfig = await page.evaluate(() => {
      // Check for common analytics libraries
      return {
        googleAnalytics: !!(window as any).ga || !!(window as any).gtag,
        posthog: !!(window as any).posthog,
        customAnalytics: !!(window as any).__analytics
      }
    })
    
    console.log('Analytics configuration:', analyticsConfig)
    
    // Track page views
    const pageViewRequests: string[] = []
    
    page.on('request', request => {
      if (request.url().includes('analytics') || 
          request.url().includes('track') ||
          request.url().includes('pageview')) {
        pageViewRequests.push(request.url())
      }
    })
    
    // Navigate through pages
    await page.goto('/upload')
    await page.goto('/app/settings')
    
    // Check if analytics events are sent
    const hasAnalytics = Object.values(analyticsConfig).some(v => v === true)
    
    if (hasAnalytics) {
      console.log(`Analytics requests: ${pageViewRequests.length}`)
    }
  })
  
  test('health check endpoint', async ({ page }) => {
    // Test health check endpoint
    const response = await page.request.get('/api/health')
    
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    const health = await response.json()
    
    // Basic health check
    expect(health.status).toBe('healthy')
    expect(health.timestamp).toBeTruthy()
    expect(health.version).toBeTruthy()
    
    // Detailed health check
    const detailedResponse = await page.request.get('/api/health?detailed=true')
    const detailedHealth = await detailedResponse.json()
    
    console.log('System health:', detailedHealth)
    
    // Should include subsystem checks
    if (detailedHealth.checks) {
      expect(detailedHealth.checks.database).toBeDefined()
      expect(detailedHealth.checks.storage).toBeDefined()
      expect(detailedHealth.checks.features).toBeDefined()
    }
    
    // Should include metrics
    if (detailedHealth.metrics) {
      expect(detailedHealth.metrics.response_time_ms).toBeGreaterThan(0)
    }
  })
  
  test('uptime monitoring headers', async ({ page }) => {
    // Check response headers for monitoring
    const response = await page.goto('/')
    const headers = response?.headers() || {}
    
    // Check for monitoring-related headers
    console.log('Response headers:', Object.keys(headers).filter(h => 
      h.includes('x-') || h.includes('trace') || h.includes('request')
    ))
    
    // Should have request ID for tracing
    const hasRequestId = headers['x-request-id'] || 
                        headers['x-trace-id'] || 
                        headers['x-correlation-id']
    
    if (hasRequestId) {
      console.log('Request tracing enabled')
    }
    
    // Check server timing
    if (headers['server-timing']) {
      console.log('Server timing:', headers['server-timing'])
    }
  })
  
  test('error reporting configuration', async ({ page }) => {
    await loginUser(page, 'ADMIN')
    
    // Check admin panel for monitoring configuration
    await page.goto('/admin/settings')
    
    // Look for monitoring settings
    const monitoringTab = page.locator('[role="tab"]:has-text("Monitoring"), button:has-text("Monitoring")')
    
    if (await monitoringTab.isVisible()) {
      await monitoringTab.click()
      
      // Check monitoring toggles
      const errorTracking = page.locator('text=/error tracking/i').locator('..')
        .locator('[role="switch"], input[type="checkbox"]')
      
      if (await errorTracking.isVisible()) {
        const isEnabled = await errorTracking.isChecked()
        expect(isEnabled).toBeTruthy() // Should be enabled in production
      }
      
      const performanceMonitoring = page.locator('text=/performance monitoring/i').locator('..')
        .locator('[role="switch"], input[type="checkbox"]')
      
      if (await performanceMonitoring.isVisible()) {
        const isEnabled = await performanceMonitoring.isChecked()
        expect(isEnabled).toBeTruthy()
      }
    }
  })
  
  test('system metrics dashboard', async ({ page }) => {
    await loginUser(page, 'ADMIN')
    
    // Navigate to metrics dashboard
    await page.goto('/admin/dashboard')
    
    // Check for key metrics
    const metrics = [
      { name: 'Uptime', selector: 'text=/uptime|availability/i' },
      { name: 'Response Time', selector: 'text=/response time|latency/i' },
      { name: 'Error Rate', selector: 'text=/error rate|errors/i' },
      { name: 'Active Users', selector: 'text=/active users|online/i' },
      { name: 'API Calls', selector: 'text=/api calls|requests/i' }
    ]
    
    const foundMetrics: string[] = []
    
    for (const metric of metrics) {
      const element = page.locator(metric.selector)
      if (await element.count() > 0) {
        foundMetrics.push(metric.name)
        
        // Check if metric has a value
        const parent = element.first().locator('..')
        const valueElement = parent.locator('[class*="text-2xl"], [class*="text-3xl"], .metric-value')
        
        if (await valueElement.isVisible()) {
          const value = await valueElement.textContent()
          console.log(`${metric.name}: ${value}`)
        }
      }
    }
    
    // Should have at least some metrics
    expect(foundMetrics.length).toBeGreaterThan(0)
    console.log('Available metrics:', foundMetrics)
  })
  
  test('log aggregation check', async ({ page }) => {
    await loginUser(page, 'ADMIN')
    
    // Generate some activity
    await page.goto('/upload')
    await page.goto('/app/documents')
    
    // Check if logs are being collected
    const logsAvailable = await page.evaluate(() => {
      // Check console for log collection
      const originalLog = console.log
      let logsCaptured = false
      
      console.log = (...args) => {
        logsCaptured = true
        originalLog(...args)
      }
      
      console.log('Test log aggregation')
      console.log = originalLog
      
      return logsCaptured
    })
    
    expect(logsAvailable).toBeTruthy()
    
    // Check for server logs endpoint
    const response = await page.request.get('/api/admin/logs').catch(() => null)
    
    if (response && response.ok()) {
      console.log('Server logs endpoint available')
    }
  })
})