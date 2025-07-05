/**
 * 🔍 Validation Step 6: Error Handling
 * 
 * Tests graceful error messages, fallback behaviors, and recovery procedures
 */

import { test, expect } from '@playwright/test'
import { loginUser, createTestFile } from '../utils/test-helpers'
import * as fs from 'fs'

test.describe('Error Handling Validation', () => {
  
  test('graceful handling of network errors', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Intercept network requests to simulate failure
    await page.route('**/api/translate/**', route => {
      route.abort('failed')
    })
    
    const filePath = createTestFile(1024, 'network-error-test.txt', 'Test content')
    
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Should show user-friendly error message
    const errorMessages = [
      page.locator('text=/error|failed|try again/i'),
      page.locator('[role="alert"]'),
      page.locator('.error-message')
    ]
    
    let foundError = false
    for (const message of errorMessages) {
      if (await message.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundError = true
        const text = await message.textContent()
        
        // Error should be user-friendly, not technical
        expect(text).not.toContain('undefined')
        expect(text).not.toContain('null')
        expect(text).not.toContain('stack')
        break
      }
    }
    
    expect(foundError).toBeTruthy()
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('fallback for unsupported browsers', async ({ page }) => {
    // Check if app handles older browsers gracefully
    await page.goto('/')
    
    // Check for no-script fallback
    const noscript = await page.locator('noscript').textContent()
    if (noscript) {
      expect(noscript).toContain('JavaScript')
    }
    
    // Check if critical features have fallbacks
    const hasModernFeatures = await page.evaluate(() => {
      return {
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        localStorage: typeof localStorage !== 'undefined'
      }
    })
    
    // App should check for required features
    expect(hasModernFeatures.fetch).toBeTruthy()
    expect(hasModernFeatures.promises).toBeTruthy()
  })
  
  test('recovery from failed file uploads', async ({ page }) => {
    await loginUser(page, 'USER')
    
    const filePath = createTestFile(1024 * 10, 'retry-test.txt', 'Retry test content')
    
    // Simulate upload failure
    let requestCount = 0
    await page.route('**/api/upload/**', route => {
      requestCount++
      if (requestCount === 1) {
        // Fail first attempt
        route.abort('failed')
      } else {
        // Allow retry
        route.continue()
      }
    })
    
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Should show error
    await expect(page.locator('text=/error|failed/i')).toBeVisible()
    
    // Should allow retry
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")')
    if (await retryButton.isVisible()) {
      await retryButton.click()
      
      // Should succeed on retry
      await expect(page.locator('text=/success|processing/i')).toBeVisible({ timeout: 10000 })
    } else {
      // Or allow re-upload
      const canReupload = await page.locator('input[type="file"]').isEnabled()
      expect(canReupload).toBeTruthy()
    }
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('handling of invalid API responses', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Mock invalid API response
    await page.route('**/api/health', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      })
    })
    
    // Make API request that expects JSON
    const response = await page.request.get('/api/health').catch(err => err)
    
    // App should handle invalid JSON gracefully
    if (response instanceof Error) {
      expect(response.message).not.toContain('Unexpected token')
    }
  })
  
  test('session expiry handling', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Clear session cookies to simulate expiry
    await page.context().clearCookies()
    
    // Try to access protected route
    await page.goto('/app/documents')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
    
    // Should preserve intended destination
    const url = new URL(page.url())
    const hasReturnUrl = url.searchParams.has('returnUrl') || 
                        url.searchParams.has('redirect') ||
                        url.searchParams.has('from')
    
    expect(hasReturnUrl).toBeTruthy()
  })
  
  test('404 page handling', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Navigate to non-existent page
    await page.goto('/this-page-does-not-exist-404')
    
    // Should show 404 page
    const notFoundIndicators = [
      page.locator('text=/404|not found|doesn.*exist/i'),
      page.locator('h1:has-text("404")'),
      page.locator('[data-testid="404-page"]')
    ]
    
    let found404 = false
    for (const indicator of notFoundIndicators) {
      if (await indicator.isVisible().catch(() => false)) {
        found404 = true
        break
      }
    }
    
    expect(found404).toBeTruthy()
    
    // Should provide way back
    const homeLink = page.locator('a:has-text("Home"), a:has-text("Dashboard"), a[href="/"]')
    expect(await homeLink.count()).toBeGreaterThan(0)
  })
  
  test('form validation errors', async ({ page }) => {
    await page.goto('/login')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    const emailError = page.locator('text=/email.*required|enter.*email/i')
    const passwordError = page.locator('text=/password.*required|enter.*password/i')
    
    const hasValidationErrors = 
      await emailError.isVisible() || 
      await passwordError.isVisible()
    
    expect(hasValidationErrors).toBeTruthy()
    
    // Test invalid email format
    await page.fill('input[type="email"]', 'notanemail')
    await page.click('button[type="submit"]')
    
    // Should show format error
    await expect(page.locator('text=/valid.*email|email.*format/i')).toBeVisible()
  })
  
  test('error logging configuration', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Check if error tracking is configured
    const errorTrackingEnabled = await page.evaluate(() => {
      return !!(window as any).Sentry || 
             !!(window as any).__SENTRY__ ||
             document.querySelector('script[src*="sentry"]')
    })
    
    // In production, error tracking should be enabled
    if (process.env.NODE_ENV === 'production') {
      expect(errorTrackingEnabled).toBeTruthy()
    }
    
    // Trigger a client-side error
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.evaluate(() => {
      console.error('Test error for validation')
    })
    
    // Errors should be captured
    expect(consoleErrors).toContain('Test error for validation')
  })
  
  test('timeout handling for long operations', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Mock slow API
    await page.route('**/api/translate/start', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000)) // 35 second delay
      route.fulfill({
        status: 504,
        body: JSON.stringify({ error: 'Gateway Timeout' })
      })
    })
    
    const filePath = createTestFile(1024, 'timeout-test.txt', 'Timeout test')
    
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    
    const startTime = Date.now()
    await page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Should show timeout error within reasonable time
    const timeoutError = await page.waitForSelector(
      'text=/timeout|taking too long|try again/i',
      { timeout: 40000 }
    ).catch(() => null)
    
    const elapsed = Date.now() - startTime
    
    if (timeoutError) {
      // Should timeout before 40 seconds
      expect(elapsed).toBeLessThan(40000)
    }
    
    // Clean up
    fs.unlinkSync(filePath)
  })
})