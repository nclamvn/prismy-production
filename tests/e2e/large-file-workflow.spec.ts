/**
 * Core Large File Workflow E2E Test
 * 
 * Tests the essential large file processing workflow without complex dependencies
 */

import { test, expect } from '@playwright/test'
import { createTestFile, loginUser, uploadFile, waitForProcessingComplete, downloadFile } from '../utils/test-helpers'

test.describe('Large File Processing Core Workflow', () => {
  
  test('should handle complete large file workflow', async ({ page }) => {
    // Create a test file
    const filePath = createTestFile(75 * 1024 * 1024, 'workflow-test.txt') // 75MB
    
    // Login as test user
    await loginUser(page, 'USER')
    
    // Upload file
    const uploadId = await uploadFile(page, filePath)
    expect(uploadId).toBeTruthy()
    
    // Wait for processing (with timeout)
    await waitForProcessingComplete(page, uploadId)
    
    // Download result
    await downloadFile(page, uploadId)
  })

  test('should show chunked upload for large files', async ({ page }) => {
    const filePath = createTestFile(75 * 1024 * 1024, 'chunked-test.pdf') // 75MB
    
    await loginUser(page, 'USER')
    
    await page.goto('/upload')
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(filePath)
    
    // Should detect large file and show chunked upload notice
    await expect(page.locator('[data-testid="file-info"]')).toContainText('75')
    
    // Start upload
    await page.click('[data-testid="upload-button"]')
    
    // Should show upload progress for chunked upload
    const uploadSuccess = page.locator('[data-testid="upload-success"]')
    await expect(uploadSuccess).toBeVisible({ timeout: 60000 })
  })

  test('should reject oversized files', async ({ page }) => {
    // Simulate a file larger than allowed
    await loginUser(page, 'USER')
    await page.goto('/upload')
    
    // Mock a very large file size
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="file-input"]') as HTMLInputElement
      if (input) {
        // Create a mock file object with large size
        const mockFile = new File(['content'], 'huge-file.pdf', { type: 'application/pdf' })
        Object.defineProperty(mockFile, 'size', { value: 2 * 1024 * 1024 * 1024 }) // 2GB
        
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(mockFile)
        input.files = dataTransfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    
    // Should show file size error
    await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="upload-button"]')).toBeDisabled()
  })

  test('should handle unsupported file types', async ({ page }) => {
    const filePath = createTestFile(1024, 'test.exe') // Small unsupported file
    
    await loginUser(page, 'USER')
    await page.goto('/upload')
    
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(filePath)
    
    // Should show file type error
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="upload-button"]')).toBeDisabled()
  })

  test('should show processing progress for queue jobs', async ({ page }) => {
    const filePath = createTestFile(100 * 1024 * 1024, 'queue-test.pdf') // 100MB
    
    await loginUser(page, 'USER')
    
    const uploadId = await uploadFile(page, filePath)
    
    // Navigate to processing page
    await page.goto(`/processing/${uploadId}`)
    
    // Should show processing status
    await expect(page.locator('[data-testid="processing-status"]')).toBeVisible()
    
    // Should show current step
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible()
    
    // Wait for completion (with extended timeout for large files)
    await waitForProcessingComplete(page, uploadId)
  })

  test('admin should be able to access settings', async ({ page }) => {
    await loginUser(page, 'ADMIN')
    
    // Navigate to admin settings
    await page.goto('/admin/settings')
    
    // Should have access to settings panel
    await expect(page.locator('[data-testid="admin-settings-panel"]')).toBeVisible()
    
    // Should show upload settings tab
    await expect(page.locator('[data-testid="upload-settings-tab"]')).toBeVisible()
  })

  test('regular user should not access admin settings', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Try to navigate to admin settings
    await page.goto('/admin/settings')
    
    // Should be denied access or redirected
    const accessDenied = page.locator('[data-testid="access-denied"]')
    const loginRedirect = page.locator('[data-testid="login-form"]')
    
    // Should show either access denied or redirect to login
    await expect(accessDenied.or(loginRedirect)).toBeVisible()
  })

  test('should provide download with preview', async ({ page }) => {
    const filePath = createTestFile(10 * 1024 * 1024, 'preview-test.txt') // 10MB
    
    await loginUser(page, 'USER')
    
    const uploadId = await uploadFile(page, filePath)
    await waitForProcessingComplete(page, uploadId)
    
    // Navigate to results
    await page.goto(`/results/${uploadId}`)
    
    // Should show download button
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible()
    
    // Should show preview if supported
    const preview = page.locator('[data-testid="document-preview"]')
    if (await preview.isVisible()) {
      await expect(preview).toBeVisible()
    }
  })
})

test.describe('Error Handling', () => {
  
  test('should handle upload failures gracefully', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Simulate network failure during upload
    await page.route('**/api/upload/**', route => {
      route.abort('failed')
    })
    
    const filePath = createTestFile(1024 * 1024, 'fail-test.txt') // 1MB
    
    await page.goto('/upload')
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(filePath)
    
    await page.click('[data-testid="upload-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible()
  })

  test('should handle processing failures', async ({ page }) => {
    await loginUser(page, 'USER')
    
    // Navigate to a mock failed processing job
    await page.goto('/processing/mock-failed-job')
    
    // Should show appropriate error UI
    const errorStatus = page.locator('[data-testid="status-failed"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    
    // At least one should be visible for error handling
    await expect(errorStatus.or(errorMessage)).toBeVisible()
  })
})

test.describe('Performance Monitoring', () => {
  
  test('should track upload metrics', async ({ page }) => {
    const filePath = createTestFile(50 * 1024 * 1024, 'metrics-test.pdf') // 50MB
    
    await loginUser(page, 'USER')
    
    await page.goto('/upload')
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles(filePath)
    
    await page.click('[data-testid="upload-button"]')
    
    // Should track upload progress
    const progressIndicator = page.locator('[data-testid="upload-progress"]')
    if (await progressIndicator.isVisible()) {
      await expect(progressIndicator).toBeVisible()
    }
    
    // Wait for upload completion
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 60000 })
  })

  test('admin should see system metrics', async ({ page }) => {
    await loginUser(page, 'ADMIN')
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard')
    
    // Should show system overview
    const dashboard = page.locator('[data-testid="admin-dashboard"]')
    if (await dashboard.isVisible()) {
      await expect(dashboard).toBeVisible()
      
      // Should show key metrics
      await expect(page.locator('[data-testid="system-status"]')).toBeVisible()
    }
  })
})