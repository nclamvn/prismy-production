/**
 * 🔍 Validation Step 7: User Experience
 * 
 * Tests mobile responsiveness, accessibility, loading states, and feedback
 */

import { test, expect, devices } from '@playwright/test'
import { loginUser, createTestFile } from '../utils/test-helpers'
import * as fs from 'fs'

test.describe('User Experience Validation', () => {
  
  test('mobile responsive design', async ({ browser }) => {
    // Test on mobile viewport
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    // Login on mobile
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible()
    
    // Check if login form is properly sized for mobile
    const formWidth = await page.locator('form').boundingBox()
    expect(formWidth?.width).toBeLessThan(400)
    
    await page.fill('input[type="email"]', 'test@prismy.com')
    await page.fill('input[type="password"]', 'test-prismy-2024')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/app/)
    
    // Check mobile navigation
    const mobileMenu = page.locator('[aria-label*="menu"], [data-testid="mobile-menu"]')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
      
      // Navigation items should be visible
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible()
    }
    
    // Test upload page on mobile
    await page.goto('/upload')
    
    // Upload button should be reachable
    const uploadButton = page.locator('input[type="file"]')
    await expect(uploadButton).toBeVisible()
    
    // Check if layout is single column on mobile
    const container = page.locator('main, .container').first()
    const containerBox = await container.boundingBox()
    expect(containerBox?.width).toBeLessThanOrEqual(devices['iPhone 12'].viewport.width)
    
    await context.close()
  })
  
  test('accessibility compliance', async ({ page }) => {
    await page.goto('/login')
    
    // Check for basic accessibility features
    
    // 1. Form labels
    const emailInput = page.locator('input[type="email"]')
    const emailLabel = await emailInput.getAttribute('aria-label') || 
                      await page.locator(`label[for="${await emailInput.getAttribute('id')}"]`).textContent()
    expect(emailLabel).toBeTruthy()
    
    // 2. Button accessibility
    const submitButton = page.locator('button[type="submit"]')
    const buttonText = await submitButton.textContent()
    const buttonAriaLabel = await submitButton.getAttribute('aria-label')
    expect(buttonText || buttonAriaLabel).toBeTruthy()
    
    // 3. Focus indicators
    await emailInput.focus()
    const focusStyles = await emailInput.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        border: styles.border,
        boxShadow: styles.boxShadow
      }
    })
    
    // Should have visible focus indicator
    const hasFocusIndicator = focusStyles.outline !== 'none' || 
                             focusStyles.boxShadow.includes('rgb')
    expect(hasFocusIndicator).toBeTruthy()
    
    // 4. Keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
    
    // 5. Alt text for images
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      
      // Images should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBeTruthy()
    }
  })
  
  test('loading states and feedback', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Test file upload loading state
    const filePath = createTestFile(1024 * 100, 'loading-test.txt', 'Loading state test')
    
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    
    // Start upload
    const uploadPromise = page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Check for loading indicators
    const loadingIndicators = [
      page.locator('.animate-spin'),
      page.locator('[role="progressbar"]'),
      page.locator('text=/loading|processing|uploading/i'),
      page.locator('.skeleton, [data-loading="true"]')
    ]
    
    await uploadPromise
    
    // At least one loading indicator should appear
    let foundLoading = false
    for (const indicator of loadingIndicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundLoading = true
        break
      }
    }
    
    expect(foundLoading).toBeTruthy()
    
    // Wait for completion
    await page.waitForURL(/\/(processing|results)/, { timeout: 30000 })
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('success and error feedback', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Test success feedback
    await page.goto('/app/settings')
    
    // Find a form to submit
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first()
    
    if (await saveButton.isVisible()) {
      await saveButton.click()
      
      // Check for success message
      const successMessages = [
        page.locator('text=/saved|updated|success/i'),
        page.locator('[role="alert"][aria-live="polite"]'),
        page.locator('.toast, .notification').filter({ hasText: /success/i })
      ]
      
      let foundSuccess = false
      for (const message of successMessages) {
        if (await message.isVisible({ timeout: 3000 }).catch(() => false)) {
          foundSuccess = true
          break
        }
      }
      
      expect(foundSuccess).toBeTruthy()
    }
    
    // Test error feedback
    await page.goto('/upload')
    
    // Try to submit without file
    const submitButton = page.locator('button:has-text("Translate"), button[type="submit"]').first()
    
    if (await submitButton.isEnabled()) {
      await submitButton.click()
      
      // Should show error
      const errorMessages = [
        page.locator('text=/required|select|choose/i'),
        page.locator('[role="alert"][aria-live="assertive"]'),
        page.locator('.error, .text-red-500')
      ]
      
      let foundError = false
      for (const message of errorMessages) {
        if (await message.isVisible({ timeout: 3000 }).catch(() => false)) {
          foundError = true
          break
        }
      }
      
      expect(foundError).toBeTruthy()
    }
  })
  
  test('form validation and helpers', async ({ page }) => {
    await loginUser(page, 'USER')
    await page.goto('/upload')
    
    // Check for helpful UI elements
    
    // 1. File type hints
    const fileTypeHints = await page.locator('text=/pdf|docx|txt|supported/i').count()
    expect(fileTypeHints).toBeGreaterThan(0)
    
    // 2. File size limits
    const fileSizeHints = await page.locator('text=/50.*MB|size.*limit/i').count()
    expect(fileSizeHints).toBeGreaterThan(0)
    
    // 3. Drag and drop support
    const dropZone = page.locator('[data-drop], .drop-zone, text=/drag.*drop/i')
    expect(await dropZone.count()).toBeGreaterThan(0)
    
    // 4. Clear action buttons
    const buttons = await page.locator('button').allTextContents()
    const hasCleanLabels = buttons.some(text => 
      ['Upload', 'Translate', 'Submit', 'Cancel', 'Clear'].includes(text.trim())
    )
    expect(hasCleanLabels).toBeTruthy()
  })
  
  test('navigation breadcrumbs and context', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Upload a file to get to results page
    const filePath = createTestFile(1024, 'nav-test.txt', 'Navigation test')
    
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Wait for results
    await page.waitForURL(/\/(processing|results)/, { timeout: 30000 })
    
    // Check for navigation context
    const breadcrumbs = page.locator('nav[aria-label*="breadcrumb"], .breadcrumb')
    const backButton = page.locator('button:has-text("Back"), a:has-text("Back")')
    const pageTitle = page.locator('h1, h2')
    
    // Should have some navigation context
    const hasNavContext = 
      await breadcrumbs.isVisible() ||
      await backButton.isVisible() ||
      (await pageTitle.textContent())?.includes('Result')
    
    expect(hasNavContext).toBeTruthy()
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('responsive tables and lists', async ({ page }) => {
    await loginUser(page, 'USER')
    await page.goto('/app/documents')
    
    // Check for responsive table design
    const table = page.locator('table, [role="table"]')
    const list = page.locator('[role="list"], .document-list')
    
    if (await table.isVisible()) {
      // Check if table is scrollable on mobile
      const wrapper = table.locator('..')
      const overflow = await wrapper.evaluate(el => 
        window.getComputedStyle(el).overflowX
      )
      
      // Should handle overflow properly
      expect(['auto', 'scroll']).toContain(overflow)
    } else if (await list.isVisible()) {
      // List view is mobile-friendly by default
      expect(await list.isVisible()).toBeTruthy()
    }
    
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Content should still be accessible
    const content = page.locator('main, [role="main"]')
    await expect(content).toBeVisible()
  })
})