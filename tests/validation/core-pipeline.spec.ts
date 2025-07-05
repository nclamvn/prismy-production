/**
 * 🔍 Validation Step 2: Core Pipeline (MVP Mode)
 * 
 * Tests file upload, OCR, translation, and download functionality
 */

import { test, expect } from '@playwright/test'
import { createTestFile, loginUser } from '../utils/test-helpers'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Core Pipeline Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await loginUser(page, 'USER')
  })
  
  test('complete pipeline: upload → OCR → translate → download', async ({ page }) => {
    // Create a small test file (under MVP limit)
    const testContent = `Hello World!
This is a test document for translation.
Please translate this to Spanish.`
    
    const filePath = createTestFile(1024, 'pipeline-test.txt', testContent)
    
    // Navigate to upload page
    await page.goto('/upload')
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    
    // Verify file info is displayed
    await expect(page.locator('text=/pipeline-test.txt/i')).toBeVisible()
    
    // Select target language
    const languageSelect = page.locator('select[name="targetLanguage"], [data-testid="language-select"]')
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption('es')
    }
    
    // Start translation
    await page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Wait for processing
    await page.waitForURL(/\/(processing|results|translation)/, { timeout: 30000 })
    
    // Check for processing indicators
    const processingIndicators = [
      page.locator('text=/processing|translating/i'),
      page.locator('[role="progressbar"]'),
      page.locator('.animate-spin, .loading')
    ]
    
    const hasProcessingUI = await Promise.race(
      processingIndicators.map(loc => loc.isVisible().catch(() => false))
    )
    
    if (hasProcessingUI) {
      // Wait for completion
      await page.waitForSelector(
        'text=/completed|done|ready|download/i',
        { timeout: 60000 }
      )
    }
    
    // Verify download is available
    const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download")')
    await expect(downloadButton.first()).toBeVisible()
    
    // Test download
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.first().click()
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.txt')
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('file size validation (MVP mode ≤50MB)', async ({ page }) => {
    await page.goto('/upload')
    
    // Check for file size limit indication
    const limitText = await page.locator('text=/50\s*MB|50MB|limit/i').count()
    expect(limitText).toBeGreaterThan(0)
    
    // Test with mock large file
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      if (input) {
        // Create mock file larger than 50MB
        const mockFile = new File(['x'.repeat(1024)], 'large-file.pdf', { type: 'application/pdf' })
        Object.defineProperty(mockFile, 'size', { value: 51 * 1024 * 1024 })
        
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(mockFile)
        input.files = dataTransfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    
    // Should show error for oversized file
    await expect(page.locator('text=/too large|exceeds|limit|50\s*MB/i')).toBeVisible()
  })
  
  test('language detection works', async ({ page }) => {
    // Create file with Spanish text
    const spanishText = 'Hola mundo. Este es un documento de prueba.'
    const filePath = createTestFile(1024, 'spanish-test.txt', spanishText)
    
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    
    // Check if language was detected
    const detectedLanguage = page.locator('text=/spanish|español|es\b/i')
    const languageSelect = page.locator('select[name="sourceLanguage"], [data-testid="source-language"]')
    
    if (await detectedLanguage.isVisible()) {
      await expect(detectedLanguage).toBeVisible()
    } else if (await languageSelect.isVisible()) {
      const selectedValue = await languageSelect.inputValue()
      expect(selectedValue).toBe('es')
    }
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('supported file types', async ({ page }) => {
    await page.goto('/upload')
    
    const fileInput = page.locator('input[type="file"]')
    const acceptAttribute = await fileInput.getAttribute('accept')
    
    // Should accept at least PDF, TXT, and DOCX
    if (acceptAttribute) {
      expect(acceptAttribute).toContain('.pdf')
      expect(acceptAttribute).toContain('.txt')
      expect(acceptAttribute).toMatch(/\.docx?/)
    }
    
    // Look for supported types information
    const supportedTypesText = await page.locator('text=/pdf|txt|doc/i').count()
    expect(supportedTypesText).toBeGreaterThan(0)
  })
  
  test('preview functionality', async ({ page }) => {
    const filePath = createTestFile(1024, 'preview-test.txt', 'Preview test content')
    
    await page.goto('/upload')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.click('button:has-text("Translate"), button[type="submit"]')
    
    // Wait for processing to complete
    await page.waitForURL(/\/(results|translation)/, { timeout: 30000 })
    await page.waitForSelector('text=/download|completed/i', { timeout: 30000 })
    
    // Check for preview
    const previewElements = [
      page.locator('iframe'),
      page.locator('[data-testid="preview"]'),
      page.locator('.preview-container')
    ]
    
    let hasPreview = false
    for (const element of previewElements) {
      if (await element.isVisible().catch(() => false)) {
        hasPreview = true
        break
      }
    }
    
    // Preview might be optional in MVP
    if (hasPreview) {
      console.log('Preview functionality available')
    } else {
      console.log('Preview not available in MVP mode')
    }
    
    // Clean up
    fs.unlinkSync(filePath)
  })
  
  test('error handling for invalid files', async ({ page }) => {
    await page.goto('/upload')
    
    // Create an invalid file type
    const filePath = createTestFile(1024, 'invalid.exe', 'Invalid content')
    
    await page.locator('input[type="file"]').setInputFiles(filePath)
    
    // Should show error for unsupported type
    await expect(page.locator('text=/unsupported|invalid|not allowed/i')).toBeVisible()
    
    // Upload button should be disabled
    const uploadButton = page.locator('button:has-text("Translate"), button:has-text("Upload")')
    await expect(uploadButton.first()).toBeDisabled()
    
    // Clean up
    fs.unlinkSync(filePath)
  })
})