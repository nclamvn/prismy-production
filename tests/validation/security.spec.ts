/**
 * 🔍 Validation Step 4: Security
 * 
 * Tests RLS policies, file access restrictions, rate limiting, and error tracking
 */

import { test, expect } from '@playwright/test'
import { loginUser, createTestFile } from '../utils/test-helpers'
import * as fs from 'fs'

test.describe('Security Validation', () => {
  
  test('RLS policies - users cannot access other users files', async ({ browser }) => {
    // Create two browser contexts for different users
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    
    // Login as first user
    await page1.goto('/login')
    await page1.fill('input[type="email"]', 'test@prismy.com')
    await page1.fill('input[type="password"]', 'test-prismy-2024')
    await page1.click('button[type="submit"]')
    await page1.waitForURL(/\/app/)
    
    // Upload a file as first user
    const filePath = createTestFile(1024, 'user1-private.txt', 'Private content')
    await page1.goto('/upload')
    await page1.locator('input[type="file"]').setInputFiles(filePath)
    await page1.click('button:has-text("Translate"), button[type="submit"]')
    
    // Get the document ID from URL
    await page1.waitForURL(/\/(processing|results|translation)\/(.+)/, { timeout: 30000 })
    const docUrl = page1.url()
    const docId = docUrl.match(/([a-f0-9-]{36})/)?.[0]
    
    // Login as second user
    await page2.goto('/login')
    await page2.fill('input[type="email"]', 'demo@prismy.com')
    await page2.fill('input[type="password"]', 'demo-prismy-2024')
    await page2.click('button[type="submit"]')
    await page2.waitForURL(/\/app/)
    
    // Try to access first user's document
    if (docId) {
      await page2.goto(docUrl)
      
      // Should be denied access
      const accessDenied = await page2.locator('text=/not found|unauthorized|forbidden|access denied/i').isVisible()
      const redirected = !page2.url().includes(docId)
      
      expect(accessDenied || redirected).toBeTruthy()
    }
    
    // Clean up
    await context1.close()
    await context2.close()
    fs.unlinkSync(filePath)
  })
  
  test('rate limiting on API endpoints', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Make multiple rapid requests to trigger rate limit
    const responses = []
    
    for (let i = 0; i < 15; i++) {
      const response = await page.request.post('/api/search', {
        data: { query: `test search ${i}` }
      })
      responses.push(response)
      
      // If we hit rate limit, stop
      if (response.status() === 429) {
        break
      }
    }
    
    // Should have hit rate limit
    const rateLimited = responses.some(r => r.status() === 429)
    expect(rateLimited).toBeTruthy()
    
    // Check rate limit headers
    const lastResponse = responses[responses.length - 1]
    const headers = lastResponse.headers()
    
    expect(headers['x-ratelimit-limit']).toBeDefined()
    expect(headers['x-ratelimit-remaining']).toBeDefined()
    expect(headers['retry-after']).toBeDefined()
  })
  
  test('secure file download with signed URLs', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Upload and process a file
    const filePath = createTestFile(1024, 'secure-test.txt', 'Secure content')
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Wait for processing
    await page.waitForURL(/\/(results|translation)/, { timeout: 30000 })
    await page.waitForSelector('text=/download|completed/i', { timeout: 30000 })
    
    // Get download link
    const downloadLink = page.locator('a[href*="download"], button:has-text("Download")')
    
    if (await downloadLink.count() > 0) {
      const href = await downloadLink.first().getAttribute('href')
      
      if (href && href.startsWith('http')) {
        // Check if URL contains signed parameters
        const url = new URL(href)
        const hasSignature = url.searchParams.has('token') || 
                           url.searchParams.has('signature') ||
                           url.searchParams.has('expires') ||
                           href.includes('X-Amz-Signature')
        
        expect(hasSignature).toBeTruthy()
        
        // Try to access without valid session (should fail)
        const unauthorizedResponse = await page.request.get(href, {
          headers: { 'Cookie': '' } // Remove auth cookies
        })
        
        // Should be denied without proper auth
        expect(unauthorizedResponse.status()).toBeGreaterThanOrEqual(400)
      }
    }
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('security headers are present', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers() || {}
    
    // Check security headers
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
    expect(headers['referrer-policy']).toContain('strict-origin')
    
    // Check CSP in production
    if (process.env.NODE_ENV === 'production') {
      expect(headers['content-security-policy']).toBeDefined()
    }
  })
  
  test('error tracking integration', async ({ page }) => {
    // This test verifies error tracking is configured
    // In production, errors should be sent to Sentry
    
    await loginUser(page, 'USER')
    
    // Check if Sentry is loaded
    const sentryLoaded = await page.evaluate(() => {
      return typeof (window as any).Sentry !== 'undefined' ||
             typeof (window as any).__SENTRY__ !== 'undefined'
    })
    
    if (process.env.NODE_ENV === 'production') {
      expect(sentryLoaded).toBeTruthy()
    }
    
    // Trigger a handled error
    await page.goto('/app/documents')
    
    // Try to access non-existent document
    await page.goto('/app/documents/00000000-0000-0000-0000-000000000000')
    
    // Should show error page
    await expect(page.locator('text=/not found|error|404/i')).toBeVisible()
  })
  
  test('admin endpoints require admin role', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Try to access admin API endpoints
    const adminEndpoints = [
      '/api/admin/settings',
      '/api/admin/users',
      '/api/admin/metrics'
    ]
    
    for (const endpoint of adminEndpoints) {
      const response = await page.request.get(endpoint)
      
      // Should be forbidden for non-admin
      expect(response.status()).toBe(403)
      
      const body = await response.json()
      expect(body.error).toMatch(/unauthorized|forbidden|admin/i)
    }
  })
  
  test('input validation and XSS protection', async ({ page }) => {
    await loginUser(page, 'USER')
    await page.goto('/upload')
    
    // Try to inject script in filename
    const maliciousFile = createTestFile(
      1024, 
      '<script>alert("xss")</script>.txt',
      'Test content'
    )
    
    await page.locator('input[type="file"]').setInputFiles(maliciousFile)
    
    // Check that script tags are sanitized in display
    const displayedFilename = await page.locator('text=/<script>/').count()
    expect(displayedFilename).toBe(0)
    
    // Should show sanitized filename
    const sanitizedName = await page.locator('text=/script|txt/').count()
    expect(sanitizedName).toBeGreaterThan(0)
    
    // Clean up
    fs.unlinkSync(maliciousFile)
  })
})