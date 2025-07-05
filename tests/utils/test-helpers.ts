/**
 * Test Helper Utilities for E2E Tests
 * 
 * Common functions and utilities for Playwright tests
 */

import { Page, expect } from '@playwright/test'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

// Test data constants
export const TEST_USERS = {
  ADMIN: {
    email: 'admin@test.com',
    password: 'test-admin-123'
  },
  USER: {
    email: 'user@test.com', 
    password: 'test-user-123'
  }
} as const

export const FILE_SIZES = {
  SMALL: 5 * 1024 * 1024,    // 5MB
  MEDIUM: 75 * 1024 * 1024,  // 75MB  
  LARGE: 200 * 1024 * 1024,  // 200MB
  EXTRA_LARGE: 500 * 1024 * 1024 // 500MB
} as const

export const TIMEOUTS = {
  UPLOAD: 60000,      // 1 minute
  PROCESSING: 300000, // 5 minutes
  DOWNLOAD: 30000,    // 30 seconds
  NAVIGATION: 10000   // 10 seconds
} as const

/**
 * Creates a test file with specified size and content
 */
export function createTestFile(sizeInBytes: number, filename: string, content?: string): string {
  const fixturesDir = join(__dirname, '..', 'e2e', 'fixtures')
  
  if (!existsSync(fixturesDir)) {
    mkdirSync(fixturesDir, { recursive: true })
  }
  
  const filePath = join(fixturesDir, filename)
  
  // Ensure directory exists
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  
  // Generate content based on file type
  let fileContent: string
  
  if (content) {
    fileContent = content
  } else if (filename.endsWith('.pdf')) {
    // Simple PDF-like content
    fileContent = '%PDF-1.4\n' + 'A'.repeat(Math.max(0, sizeInBytes - 10)) + '\n%%EOF'
  } else if (filename.endsWith('.txt')) {
    // Plain text content
    const baseText = 'This is a test document for large file processing. '
    const repeatCount = Math.ceil(sizeInBytes / baseText.length)
    fileContent = baseText.repeat(repeatCount).substring(0, sizeInBytes)
  } else if (filename.endsWith('.md')) {
    // Markdown content
    const baseMarkdown = '# Test Document\n\nThis is a **test** document for large file processing.\n\n'
    const repeatCount = Math.ceil(sizeInBytes / baseMarkdown.length)
    fileContent = baseMarkdown.repeat(repeatCount).substring(0, sizeInBytes)
  } else {
    // Default content
    fileContent = 'X'.repeat(sizeInBytes)
  }
  
  writeFileSync(filePath, fileContent)
  return filePath
}

/**
 * Logs in a user with the specified credentials
 */
export async function loginUser(page: Page, userType: 'ADMIN' | 'USER'): Promise<void> {
  const user = TEST_USERS[userType]
  
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', user.email)
  await page.fill('[data-testid="password-input"]', user.password)
  await page.click('[data-testid="login-button"]')
  
  // Wait for successful login
  await expect(page).toHaveURL('/dashboard', { timeout: TIMEOUTS.NAVIGATION })
  
  // Verify user is logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
}

/**
 * Uploads a file and returns the upload ID
 */
export async function uploadFile(page: Page, filePath: string): Promise<string> {
  await page.goto('/upload')
  
  // Wait for upload page to load
  await expect(page.locator('[data-testid="upload-form"]')).toBeVisible()
  
  // Select file
  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(filePath)
  
  // Wait for file validation
  await expect(page.locator('[data-testid="file-info"]')).toBeVisible()
  
  // Start upload
  await page.click('[data-testid="upload-button"]')
  
  // Wait for upload completion
  const uploadSuccess = page.locator('[data-testid="upload-success"]')
  await expect(uploadSuccess).toBeVisible({ timeout: TIMEOUTS.UPLOAD })
  
  // Extract upload ID
  const uploadId = await uploadSuccess.getAttribute('data-upload-id')
  if (!uploadId) {
    throw new Error('Upload ID not found')
  }
  
  return uploadId
}

/**
 * Waits for processing to complete
 */
export async function waitForProcessingComplete(page: Page, uploadId: string): Promise<void> {
  await page.goto(`/processing/${uploadId}`)
  
  // Wait for processing status to load
  await expect(page.locator('[data-testid="processing-status"]')).toBeVisible()
  
  // Wait for completion
  const completedStatus = page.locator('[data-testid="status-completed"]')
  await expect(completedStatus).toBeVisible({ timeout: TIMEOUTS.PROCESSING })
}

/**
 * Downloads the processed file
 */
export async function downloadFile(page: Page, uploadId: string): Promise<void> {
  await page.goto(`/results/${uploadId}`)
  
  // Wait for results page to load
  await expect(page.locator('[data-testid="results-container"]')).toBeVisible()
  
  // Wait for download button
  const downloadButton = page.locator('[data-testid="download-button"]')
  await expect(downloadButton).toBeEnabled()
  
  // Start download
  const downloadPromise = page.waitForDownload({ timeout: TIMEOUTS.DOWNLOAD })
  await downloadButton.click()
  
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBeTruthy()
}

/**
 * Monitors upload progress for chunked uploads
 */
export async function monitorUploadProgress(page: Page): Promise<void> {
  // Check if progress indicators are shown
  const progressBar = page.locator('[data-testid="upload-progress"]')
  
  if (await progressBar.isVisible()) {
    // Monitor progress until completion
    await expect(progressBar).toHaveAttribute('value', '100', { timeout: TIMEOUTS.UPLOAD })
    
    // Verify speed and time estimates are shown
    await expect(page.locator('[data-testid="upload-speed"]')).toBeVisible()
    await expect(page.locator('[data-testid="time-remaining"]')).toBeVisible()
  }
}

/**
 * Checks if OCR queue processing is being used
 */
export async function verifyQueueProcessing(page: Page, uploadId: string): Promise<void> {
  await page.goto(`/processing/${uploadId}`)
  
  // Should show queue-specific UI elements
  const queueInfo = page.locator('[data-testid="queue-info"]')
  
  if (await queueInfo.isVisible()) {
    await expect(page.locator('[data-testid="queue-position"]')).toBeVisible()
    await expect(page.locator('[data-testid="estimated-wait-time"]')).toBeVisible()
  }
  
  // Should eventually show processing method
  await expect(page.locator('[data-testid="processing-method"]')).toContainText('Queue Worker')
}

/**
 * Cancels a processing job if possible
 */
export async function cancelJob(page: Page, uploadId: string): Promise<boolean> {
  await page.goto(`/processing/${uploadId}`)
  
  const cancelButton = page.locator('[data-testid="cancel-job-button"]')
  
  if (await cancelButton.isVisible()) {
    await cancelButton.click()
    
    // Confirm cancellation
    await page.click('[data-testid="confirm-cancel"]')
    
    // Verify cancellation
    await expect(page.locator('[data-testid="status-cancelled"]')).toBeVisible()
    
    return true
  }
  
  return false
}

/**
 * Updates admin settings
 */
export async function updateAdminSettings(page: Page, settings: any): Promise<void> {
  await page.goto('/admin/settings')
  
  // Wait for settings panel to load
  await expect(page.locator('[data-testid="admin-settings-panel"]')).toBeVisible()
  
  // Apply settings based on the provided configuration
  if (settings.upload?.maxFileSize) {
    await page.click('[data-testid="upload-settings-tab"]')
    const maxFileSizeInput = page.locator('[data-testid="max-file-size-input"]')
    await maxFileSizeInput.clear()
    await maxFileSizeInput.fill(settings.upload.maxFileSize.toString())
  }
  
  if (settings.ocr?.queueThreshold) {
    await page.click('[data-testid="ocr-settings-tab"]')
    const queueThresholdInput = page.locator('[data-testid="queue-threshold-input"]')
    await queueThresholdInput.clear()
    await queueThresholdInput.fill(settings.ocr.queueThreshold.toString())
  }
  
  // Save settings
  await page.click('[data-testid="save-settings-button"]')
  
  // Wait for save confirmation
  await expect(page.locator('[data-testid="settings-saved-message"]')).toBeVisible()
}

/**
 * Verifies file size validation error
 */
export async function verifyFileSizeError(page: Page, filePath: string): Promise<void> {
  await page.goto('/upload')
  
  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(filePath)
  
  // Should show file size error
  await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible()
  await expect(page.locator('[data-testid="upload-button"]')).toBeDisabled()
}

/**
 * Verifies file type validation error
 */
export async function verifyFileTypeError(page: Page, filePath: string): Promise<void> {
  await page.goto('/upload')
  
  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(filePath)
  
  // Should show file type error
  await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
  await expect(page.locator('[data-testid="upload-button"]')).toBeDisabled()
}

/**
 * Simulates network interruption
 */
export async function simulateNetworkInterruption(page: Page, duration: number = 5000): Promise<void> {
  await page.context().setOffline(true)
  await page.waitForTimeout(duration)
  await page.context().setOffline(false)
}

/**
 * Checks admin dashboard metrics
 */
export async function verifyAdminMetrics(page: Page): Promise<void> {
  await page.goto('/admin/dashboard')
  
  // Wait for dashboard to load
  await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()
  
  // Verify key metrics are displayed
  await expect(page.locator('[data-testid="active-uploads"]')).toBeVisible()
  await expect(page.locator('[data-testid="queue-length"]')).toBeVisible()
  await expect(page.locator('[data-testid="processing-times"]')).toBeVisible()
  await expect(page.locator('[data-testid="storage-usage"]')).toBeVisible()
}

/**
 * Waits for a specific processing step
 */
export async function waitForProcessingStep(page: Page, stepName: string): Promise<void> {
  const currentStep = page.locator('[data-testid="current-step"]')
  await expect(currentStep).toContainText(stepName, { timeout: TIMEOUTS.PROCESSING })
}

/**
 * Verifies document preview functionality
 */
export async function verifyDocumentPreview(page: Page, uploadId: string): Promise<void> {
  await page.goto(`/results/${uploadId}`)
  
  // Should show preview iframe
  await expect(page.locator('[data-testid="document-preview"]')).toBeVisible()
  
  // Should have preview controls
  await expect(page.locator('[data-testid="zoom-controls"]')).toBeVisible()
  await expect(page.locator('[data-testid="fullscreen-button"]')).toBeVisible()
  
  // Test zoom functionality
  await page.click('[data-testid="zoom-in-button"]')
  const zoomLevel = page.locator('[data-testid="zoom-level"]')
  await expect(zoomLevel).not.toContainText('100%')
}

/**
 * Cleans up test files after test completion
 */
export async function cleanupTestFiles(page: Page, uploadIds: string[]): Promise<void> {
  for (const uploadId of uploadIds) {
    try {
      // Call cleanup API endpoint
      await page.request.delete(`/api/test/cleanup/${uploadId}`)
    } catch (error) {
      console.warn(`Failed to cleanup upload ${uploadId}:`, error)
    }
  }
}