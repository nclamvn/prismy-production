import { test, expect } from '@playwright/test'

test.describe('Translation Workbench', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Wait for the workbench section to be visible
    await page.waitForSelector('[data-testid="workbench"]', { timeout: 10000 })
    
    // Scroll to workbench section
    await page.locator('text=Translation Workbench').scrollIntoViewIfNeeded()
  })

  test('should translate text successfully', async ({ page }) => {
    const sourceTextarea = page.locator('textarea[aria-label="Source text input"]')
    const targetTextarea = page.locator('textarea[aria-label="Target text output"]')
    const translateButton = page.locator('button:has-text("Translate")')
    
    // Input text to translate
    const testText = 'Hello, how are you today?'
    await sourceTextarea.fill(testText)
    
    // Click translate button
    await translateButton.click()
    
    // Wait for translation to appear
    await page.waitForTimeout(2000) // Wait for simulated API response
    
    // Check that target textarea is not empty
    const targetValue = await targetTextarea.inputValue()
    expect(targetValue).not.toBe('')
    expect(targetValue).toContain('Translated')
    expect(targetValue).toContain(testText)
  })

  test('should update character count', async ({ page }) => {
    const sourceTextarea = page.locator('textarea[aria-label="Source text input"]')
    const characterCount = page.locator('text=/\\d+ characters/')
    
    // Initially should show 0 characters
    await expect(characterCount).toContainText('0 characters')
    
    // Type some text
    const testText = 'Test message'
    await sourceTextarea.fill(testText)
    
    // Should update character count
    await expect(characterCount).toContainText(`${testText.length} characters`)
  })

  test('should change quality tier', async ({ page }) => {
    const qualitySelect = page.locator('select[aria-label="Select quality tier"]')
    const qualityBanner = page.locator('text=/✨.*Quality/')
    
    // Change to Enterprise quality
    await qualitySelect.selectOption('enterprise')
    await expect(qualityBanner).toContainText('Enterprise Quality')
    
    // Change to Free quality
    await qualitySelect.selectOption('free')
    await expect(qualityBanner).toContainText('Free Quality')
  })

  test('should swap languages', async ({ page }) => {
    const sourceLangSelect = page.locator('select[aria-label="Select source language"]')
    const targetLangSelect = page.locator('select[aria-label="Select target language"]')
    const swapButton = page.locator('button[aria-label="Swap languages"]')
    
    // Set initial languages
    await sourceLangSelect.selectOption('en')
    await targetLangSelect.selectOption('es')
    
    // Add some text
    const sourceTextarea = page.locator('textarea[aria-label="Source text input"]')
    await sourceTextarea.fill('Hello world')
    
    // Click swap button
    await swapButton.click()
    
    // Check that languages are swapped
    expect(await sourceLangSelect.inputValue()).toBe('es')
    expect(await targetLangSelect.inputValue()).toBe('en')
  })

  test('should be keyboard accessible', async ({ page }) => {
    // Tab through the form elements
    await page.keyboard.press('Tab') // Should focus first interactive element
    
    const sourceTextarea = page.locator('textarea[aria-label="Source text input"]')
    await sourceTextarea.focus()
    
    // Type using keyboard
    await page.keyboard.type('Accessibility test')
    
    // Tab to translate button and activate with Enter
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // Navigate to translate button
    await page.keyboard.press('Enter')
    
    // Should trigger translation
    await page.waitForTimeout(2000)
    const targetTextarea = page.locator('textarea[aria-label="Target text output"]')
    const targetValue = await targetTextarea.inputValue()
    expect(targetValue).not.toBe('')
  })

  test('should handle empty input gracefully', async ({ page }) => {
    const translateButton = page.locator('button:has-text("Translate")')
    
    // Button should be disabled when no text
    await expect(translateButton).toBeDisabled()
    
    // Add text
    const sourceTextarea = page.locator('textarea[aria-label="Source text input"]')
    await sourceTextarea.fill('Test')
    
    // Button should be enabled
    await expect(translateButton).toBeEnabled()
    
    // Clear text
    await sourceTextarea.fill('')
    
    // Button should be disabled again
    await expect(translateButton).toBeDisabled()
  })

  test('should show loading state during translation', async ({ page }) => {
    const sourceTextarea = page.locator('textarea[aria-label="Source text input"]')
    const translateButton = page.locator('button:has-text("Translate")')
    
    // Add text and click translate
    await sourceTextarea.fill('Testing loading state')
    await translateButton.click()
    
    // Should show loading state
    await expect(page.locator('text=Translating...')).toBeVisible()
    await expect(translateButton).toBeDisabled()
    
    // Wait for completion
    await page.waitForTimeout(2000)
    
    // Should return to normal state
    await expect(page.locator('text=Translate')).toBeVisible()
    await expect(translateButton).toBeEnabled()
  })
})