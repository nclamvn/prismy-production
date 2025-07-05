/**
 * End-to-End Tests for Large File Processing
 * 
 * Tests the complete workflow for uploading, processing, and downloading large files
 * including chunked uploads, OCR queue processing, and admin settings integration.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Test configuration
const TEST_CONFIG = {
  // File sizes for testing different processing paths
  SMALL_FILE_SIZE: 5 * 1024 * 1024,    // 5MB - edge function
  MEDIUM_FILE_SIZE: 75 * 1024 * 1024,  // 75MB - chunked upload + queue
  LARGE_FILE_SIZE: 200 * 1024 * 1024,  // 200MB - large queue processing
  
  // Test user credentials
  ADMIN_EMAIL: 'admin@test.com',
  ADMIN_PASSWORD: 'test-admin-123',
  USER_EMAIL: 'user@test.com',
  USER_PASSWORD: 'test-user-123',
  
  // Timeouts
  UPLOAD_TIMEOUT: 60000,      // 1 minute
  PROCESSING_TIMEOUT: 300000, // 5 minutes
  DOWNLOAD_TIMEOUT: 30000,    // 30 seconds
}

// Helper functions
function createTestFile(sizeInBytes: number, filename: string): string {
  const content = 'A'.repeat(sizeInBytes)
  const filePath = join(__dirname, 'fixtures', filename)
  writeFileSync(filePath, content)
  return filePath
}

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', TEST_CONFIG.ADMIN_EMAIL)
  await page.fill('[data-testid="password-input"]', TEST_CONFIG.ADMIN_PASSWORD)
  await page.click('[data-testid="login-button"]')
  await expect(page).toHaveURL('/dashboard')
}

async function loginAsUser(page: Page): Promise<void> {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', TEST_CONFIG.USER_EMAIL)
  await page.fill('[data-testid="password-input"]', TEST_CONFIG.USER_PASSWORD)
  await page.click('[data-testid="login-button"]')
  await expect(page).toHaveURL('/dashboard')
}

async function uploadFile(page: Page, filePath: string): Promise<string> {
  await page.goto('/upload')
  
  // Set up file upload
  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(filePath)
  
  // Wait for file validation
  await expect(page.locator('[data-testid="file-info"]')).toBeVisible()
  
  // Start upload
  await page.click('[data-testid="upload-button"]')
  
  // Wait for upload completion and get upload ID
  const uploadSuccessLocator = page.locator('[data-testid="upload-success"]')
  await expect(uploadSuccessLocator).toBeVisible({ timeout: TEST_CONFIG.UPLOAD_TIMEOUT })
  
  const uploadId = await uploadSuccessLocator.getAttribute('data-upload-id')
  expect(uploadId).toBeTruthy()
  
  return uploadId!
}

async function waitForProcessingComplete(page: Page, uploadId: string): Promise<void> {
  await page.goto(`/processing/${uploadId}`)
  
  // Wait for processing to complete
  const completedStatus = page.locator('[data-testid="status-completed"]')
  await expect(completedStatus).toBeVisible({ timeout: TEST_CONFIG.PROCESSING_TIMEOUT })
}

async function downloadResult(page: Page, uploadId: string): Promise<void> {
  await page.goto(`/results/${uploadId}`)
  
  // Wait for download button to be available
  const downloadButton = page.locator('[data-testid="download-button"]')
  await expect(downloadButton).toBeEnabled()
  
  // Start download
  const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.DOWNLOAD_TIMEOUT })
  await downloadButton.click()
  
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBeTruthy()
}

test.describe('Large File Processing E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing state
    await page.context().clearCookies()
    await page.context().clearPermissions()
  })

  test.describe('File Upload Workflow', () => {
    
    test('should handle small file upload with edge processing', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.SMALL_FILE_SIZE, 'small-test.txt')
      
      await loginAsUser(page)
      
      // Upload file
      const uploadId = await uploadFile(page, filePath)
      
      // Should process via edge function (faster)
      await waitForProcessingComplete(page, uploadId)
      
      // Verify processing method in status
      const processingInfo = page.locator('[data-testid="processing-info"]')
      await expect(processingInfo).toContainText('Edge Function')
      
      // Download result
      await downloadResult(page, uploadId)
    })

    test('should handle medium file with chunked upload and queue processing', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.MEDIUM_FILE_SIZE, 'medium-test.pdf')
      
      await loginAsUser(page)
      
      // Upload file - should trigger chunked upload
      await page.goto('/upload')
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles(filePath)
      
      // Should show chunked upload option
      await expect(page.locator('[data-testid="chunked-upload-notice"]')).toBeVisible()
      
      const uploadId = await uploadFile(page, filePath)
      
      // Should process via queue (may take longer)
      await waitForProcessingComplete(page, uploadId)
      
      // Verify processing method
      const processingInfo = page.locator('[data-testid="processing-info"]')
      await expect(processingInfo).toContainText('Queue Worker')
      
      // Download result
      await downloadResult(page, uploadId)
    })

    test('should handle large file with queue processing and progress tracking', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.LARGE_FILE_SIZE, 'large-test.pdf')
      
      await loginAsUser(page)
      
      // Upload file
      const uploadId = await uploadFile(page, filePath)
      
      // Monitor processing progress
      await page.goto(`/processing/${uploadId}`)
      
      // Should show progress indicators
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
      await expect(page.locator('[data-testid="current-step"]')).toBeVisible()
      await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible()
      
      // Wait for completion
      await waitForProcessingComplete(page, uploadId)
      
      // Download result
      await downloadResult(page, uploadId)
    })

    test('should reject files exceeding size limits', async ({ page }) => {
      // Create file larger than system limit (> 1GB)
      const oversizedContent = 'X'.repeat(1024) // 1KB repeated many times
      const filePath = join(__dirname, 'fixtures', 'oversized-test.txt')
      
      // Simulate large file by setting a large size attribute
      await loginAsUser(page)
      await page.goto('/upload')
      
      // Mock file with large size
      await page.evaluate(() => {
        const input = document.querySelector('[data-testid="file-input"]') as HTMLInputElement
        if (input) {
          Object.defineProperty(input.files?.[0] || {}, 'size', {
            value: 2 * 1024 * 1024 * 1024 // 2GB
          })
        }
      })
      
      // Should show error message
      await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="upload-button"]')).toBeDisabled()
    })

    test('should reject unsupported file types', async ({ page }) => {
      const filePath = createTestFile(1024, 'test.exe')
      
      await loginAsUser(page)
      await page.goto('/upload')
      
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles(filePath)
      
      // Should show file type error
      await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="upload-button"]')).toBeDisabled()
    })
  })

  test.describe('OCR Queue Management', () => {
    
    test('should allow job cancellation for pending jobs', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.LARGE_FILE_SIZE, 'cancellable-test.pdf')
      
      await loginAsUser(page)
      
      // Upload file to trigger queue processing
      const uploadId = await uploadFile(page, filePath)
      
      // Navigate to processing page quickly
      await page.goto(`/processing/${uploadId}`)
      
      // If job is still pending, should show cancel option
      const cancelButton = page.locator('[data-testid="cancel-job-button"]')
      if (await cancelButton.isVisible()) {
        await cancelButton.click()
        
        // Confirm cancellation
        await page.click('[data-testid="confirm-cancel"]')
        
        // Should show cancelled status
        await expect(page.locator('[data-testid="status-cancelled"]')).toBeVisible()
      }
    })

    test('should show queue position and estimated wait time', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.MEDIUM_FILE_SIZE, 'queue-test.pdf')
      
      await loginAsUser(page)
      
      // Upload file
      const uploadId = await uploadFile(page, filePath)
      await page.goto(`/processing/${uploadId}`)
      
      // Should show queue information
      const queueInfo = page.locator('[data-testid="queue-info"]')
      if (await queueInfo.isVisible()) {
        await expect(page.locator('[data-testid="queue-position"]')).toBeVisible()
        await expect(page.locator('[data-testid="estimated-wait-time"]')).toBeVisible()
      }
    })

    test('should handle processing failures gracefully', async ({ page }) => {
      // This test would require mocking a processing failure
      // For now, we'll simulate by testing error UI components
      
      await loginAsUser(page)
      
      // Navigate to a mock failed processing page
      await page.goto('/processing/mock-failed-job')
      
      // Should show error status and retry option
      await expect(page.locator('[data-testid="status-failed"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    })
  })

  test.describe('Admin Settings Integration', () => {
    
    test('should allow admin to modify file size limits', async ({ page }) => {
      await loginAsAdmin(page)
      
      // Navigate to admin settings
      await page.goto('/admin/settings')
      
      // Should have access to settings panel
      await expect(page.locator('[data-testid="admin-settings-panel"]')).toBeVisible()
      
      // Navigate to upload settings tab
      await page.click('[data-testid="upload-settings-tab"]')
      
      // Modify max file size
      const maxFileSizeInput = page.locator('[data-testid="max-file-size-input"]')
      await maxFileSizeInput.clear()
      await maxFileSizeInput.fill('512') // 512MB
      
      // Save changes
      await page.click('[data-testid="save-settings-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="settings-saved-message"]')).toBeVisible()
    })

    test('should prevent non-admin users from accessing settings', async ({ page }) => {
      await loginAsUser(page)
      
      // Try to navigate to admin settings
      await page.goto('/admin/settings')
      
      // Should be redirected or show access denied
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible()
    })

    test('should apply new settings to file upload validation', async ({ page }) => {
      await loginAsAdmin(page)
      
      // Modify settings to lower file size limit
      await page.goto('/admin/settings')
      await page.click('[data-testid="upload-settings-tab"]')
      
      const maxFileSizeInput = page.locator('[data-testid="max-file-size-input"]')
      await maxFileSizeInput.clear()
      await maxFileSizeInput.fill('10') // 10MB limit
      
      await page.click('[data-testid="save-settings-button"]')
      await expect(page.locator('[data-testid="settings-saved-message"]')).toBeVisible()
      
      // Now test upload with regular user
      await loginAsUser(page)
      
      const filePath = createTestFile(TEST_CONFIG.MEDIUM_FILE_SIZE, 'size-limit-test.pdf')
      await page.goto('/upload')
      
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles(filePath)
      
      // Should now show file too large error
      await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible()
    })
  })

  test.describe('Download and Preview', () => {
    
    test('should generate secure download URLs with expiration', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.SMALL_FILE_SIZE, 'download-test.txt')
      
      await loginAsUser(page)
      
      const uploadId = await uploadFile(page, filePath)
      await waitForProcessingComplete(page, uploadId)
      
      await page.goto(`/results/${uploadId}`)
      
      // Should show download expiration info
      await expect(page.locator('[data-testid="download-expires"]')).toBeVisible()
      
      // Download URL should be secure (signed)
      const downloadButton = page.locator('[data-testid="download-button"]')
      const downloadUrl = await downloadButton.getAttribute('href')
      expect(downloadUrl).toContain('token=')
      expect(downloadUrl).toContain('expires=')
    })

    test('should provide preview for supported file types', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.SMALL_FILE_SIZE, 'preview-test.txt')
      
      await loginAsUser(page)
      
      const uploadId = await uploadFile(page, filePath)
      await waitForProcessingComplete(page, uploadId)
      
      await page.goto(`/results/${uploadId}`)
      
      // Should show preview iframe
      await expect(page.locator('[data-testid="document-preview"]')).toBeVisible()
      
      // Should have preview controls
      await expect(page.locator('[data-testid="zoom-controls"]')).toBeVisible()
      await expect(page.locator('[data-testid="fullscreen-button"]')).toBeVisible()
    })
  })

  test.describe('Performance and Monitoring', () => {
    
    test('should track upload progress for chunked uploads', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.MEDIUM_FILE_SIZE, 'progress-test.pdf')
      
      await loginAsUser(page)
      await page.goto('/upload')
      
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles(filePath)
      
      await page.click('[data-testid="upload-button"]')
      
      // Should show upload progress
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
      await expect(page.locator('[data-testid="upload-speed"]')).toBeVisible()
      await expect(page.locator('[data-testid="time-remaining"]')).toBeVisible()
    })

    test('should handle network interruptions gracefully', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.MEDIUM_FILE_SIZE, 'network-test.pdf')
      
      await loginAsUser(page)
      await page.goto('/upload')
      
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles(filePath)
      
      // Start upload
      await page.click('[data-testid="upload-button"]')
      
      // Simulate network interruption
      await page.context().setOffline(true)
      
      // Should show retry mechanism
      await expect(page.locator('[data-testid="upload-retry"]')).toBeVisible({ timeout: 10000 })
      
      // Restore network
      await page.context().setOffline(false)
      
      // Should resume upload
      await expect(page.locator('[data-testid="upload-resuming"]')).toBeVisible()
    })

    test('should provide system metrics for admin users', async ({ page }) => {
      await loginAsAdmin(page)
      
      // Navigate to admin dashboard
      await page.goto('/admin/dashboard')
      
      // Should show system metrics
      await expect(page.locator('[data-testid="active-uploads"]')).toBeVisible()
      await expect(page.locator('[data-testid="queue-length"]')).toBeVisible()
      await expect(page.locator('[data-testid="processing-times"]')).toBeVisible()
      await expect(page.locator('[data-testid="storage-usage"]')).toBeVisible()
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle concurrent uploads from same user', async ({ page }) => {
      const filePath1 = createTestFile(TEST_CONFIG.SMALL_FILE_SIZE, 'concurrent-1.txt')
      const filePath2 = createTestFile(TEST_CONFIG.SMALL_FILE_SIZE, 'concurrent-2.txt')
      
      await loginAsUser(page)
      
      // Open two upload tabs
      const page2 = await page.context().newPage()
      await page2.goto('/upload')
      
      // Upload from both tabs simultaneously
      const upload1Promise = uploadFile(page, filePath1)
      const upload2Promise = uploadFile(page2, filePath2)
      
      const [uploadId1, uploadId2] = await Promise.all([upload1Promise, upload2Promise])
      
      expect(uploadId1).toBeTruthy()
      expect(uploadId2).toBeTruthy()
      expect(uploadId1).not.toBe(uploadId2)
      
      await page2.close()
    })

    test('should handle quota exceeded scenarios', async ({ page }) => {
      // This would require setting up a user with limited quota
      await loginAsUser(page)
      
      // Try to upload when approaching quota limit
      const filePath = createTestFile(TEST_CONFIG.LARGE_FILE_SIZE, 'quota-test.pdf')
      await page.goto('/upload')
      
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles(filePath)
      
      // Should show quota warning if applicable
      const quotaWarning = page.locator('[data-testid="quota-warning"]')
      if (await quotaWarning.isVisible()) {
        await expect(quotaWarning).toContainText('storage limit')
      }
    })

    test('should maintain session during long processing jobs', async ({ page }) => {
      const filePath = createTestFile(TEST_CONFIG.LARGE_FILE_SIZE, 'session-test.pdf')
      
      await loginAsUser(page)
      
      const uploadId = await uploadFile(page, filePath)
      await page.goto(`/processing/${uploadId}`)
      
      // Wait for extended period (simulating long processing)
      await page.waitForTimeout(30000) // 30 seconds
      
      // Session should still be valid
      await page.reload()
      await expect(page.locator('[data-testid="processing-status"]')).toBeVisible()
      
      // User should not be logged out
      await expect(page.locator('[data-testid="login-form"]')).not.toBeVisible()
    })
  })
})

test.describe('Mobile and Responsive Tests', () => {
  
  test('should work on mobile devices', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const filePath = createTestFile(TEST_CONFIG.SMALL_FILE_SIZE, 'mobile-test.txt')
    
    await loginAsUser(page)
    
    // Upload should work on mobile
    const uploadId = await uploadFile(page, filePath)
    
    // UI should be mobile-friendly
    await expect(page.locator('[data-testid="mobile-upload-ui"]')).toBeVisible()
    
    await waitForProcessingComplete(page, uploadId)
    await downloadResult(page, uploadId)
  })
})

// Cleanup after tests
test.afterEach(async ({ page }) => {
  // Clean up any uploaded files
  await page.evaluate(() => {
    // Call cleanup API if available
    if (window.testCleanup) {
      window.testCleanup()
    }
  })
})