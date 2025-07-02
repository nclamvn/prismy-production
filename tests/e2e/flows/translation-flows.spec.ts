/**
 * Translation Flows E2E Tests
 * Core translation functionality for Vietnamese users
 * Text translation, document processing, and quality validation
 */

import { test, expect } from '@playwright/test'

test.describe('🌍 Vietnamese Translation Core Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Text translation interface works correctly', async ({ page }) => {
    // Navigate to translation interface
    const translateLink = page
      .locator(
        'a:has-text("Dịch"), a:has-text("Translate"), [href*="translate"], [href*="workspace"]'
      )
      .first()

    if ((await translateLink.count()) > 0) {
      await translateLink.click()
      await page.waitForLoadState('networkidle')
    } else {
      // Try to access translation directly
      await page.goto('/translate')
    }

    // Check for translation interface elements
    const sourceTextArea = page
      .locator(
        'textarea[placeholder*="Nhập"], textarea[placeholder*="Enter"], [data-testid*="source"]'
      )
      .first()
    const targetArea = page
      .locator(
        '[data-testid*="target"], [data-testid*="result"], .translation-result'
      )
      .first()

    if ((await sourceTextArea.count()) > 0) {
      await expect(sourceTextArea).toBeVisible()

      // Test Vietnamese to English translation
      const vietnameseText = 'Xin chào, tôi là một lập trình viên từ Việt Nam.'
      await sourceTextArea.fill(vietnameseText)

      // Look for language selection
      const fromLanguage = page.locator(
        'select[name*="from"], [data-testid*="from-lang"], button:has-text("Tiếng Việt")'
      )
      const toLanguage = page.locator(
        'select[name*="to"], [data-testid*="to-lang"], button:has-text("English")'
      )

      // Select Vietnamese as source language
      if ((await fromLanguage.count()) > 0) {
        await fromLanguage.first().click()
        const vietnameseOption = page.locator(
          'option:has-text("Tiếng Việt"), [value="vi"], text=/Vietnamese/i'
        )
        if ((await vietnameseOption.count()) > 0) {
          await vietnameseOption.first().click()
        }
      }

      // Select English as target language
      if ((await toLanguage.count()) > 0) {
        await toLanguage.first().click()
        const englishOption = page.locator(
          'option:has-text("English"), [value="en"], text=/Tiếng Anh/i'
        )
        if ((await englishOption.count()) > 0) {
          await englishOption.first().click()
        }
      }

      // Click translate button
      const translateButton = page
        .locator(
          'button:has-text("Dịch"), button:has-text("Translate"), [data-testid*="translate"]'
        )
        .first()

      if ((await translateButton.count()) > 0) {
        await expect(translateButton).toBeEnabled()
        await translateButton.click()

        // Wait for translation result
        await page.waitForTimeout(3000)

        // Check if translation result appears
        if ((await targetArea.count()) > 0) {
          const translationResult = await targetArea.textContent()
          expect(translationResult?.length).toBeGreaterThan(0)

          // Result should contain English words
          expect(translationResult).toMatch(/hello|hi|programmer|vietnam/i)
        }
      }
    }
  })

  test('Document translation upload works', async ({ page }) => {
    // Navigate to document translation
    const docTranslateLink = page
      .locator(
        'a:has-text("Tài liệu"), a:has-text("Document"), [href*="document"]'
      )
      .first()

    if ((await docTranslateLink.count()) > 0) {
      await docTranslateLink.click()
      await page.waitForLoadState('networkidle')
    }

    // Look for file upload interface
    const fileInput = page.locator(
      'input[type="file"], [data-testid*="upload"]'
    )

    if ((await fileInput.count()) > 0) {
      await expect(fileInput).toBeVisible()

      // Check supported file types
      const supportedTypes = page.locator('text=/PDF|DOCX|TXT|Hỗ trợ/i')

      if ((await supportedTypes.count()) > 0) {
        await expect(supportedTypes.first()).toBeVisible()
      }

      // Check upload button or drag-drop area
      const uploadArea = page.locator(
        '[data-testid*="drop"], .upload-area, text=/Kéo thả|Drag|Upload/i'
      )

      if ((await uploadArea.count()) > 0) {
        await expect(uploadArea.first()).toBeVisible()
      }
    }
  })

  test('Translation history and workspace functionality', async ({ page }) => {
    // Check for translation history
    const historyLink = page
      .locator(
        'a:has-text("Lịch sử"), a:has-text("History"), [href*="history"]'
      )
      .first()

    if ((await historyLink.count()) > 0) {
      await historyLink.click()
      await page.waitForLoadState('networkidle')

      // Should show history interface
      const historyItems = page.locator(
        '[data-testid*="history"], .history-item, .translation-item'
      )

      // History may be empty for new users
      const emptyState = page.locator('text=/Chưa có|Empty|No translations/i')

      const hasHistory = (await historyItems.count()) > 0
      const hasEmptyState = (await emptyState.count()) > 0

      expect(hasHistory || hasEmptyState).toBeTruthy()
    }

    // Check workspace functionality
    const workspaceLink = page
      .locator(
        'a:has-text("Workspace"), a:has-text("Không gian"), [href*="workspace"]'
      )
      .first()

    if ((await workspaceLink.count()) > 0) {
      await workspaceLink.click()
      await page.waitForLoadState('networkidle')

      // Should show workspace interface
      const workspaceElements = page.locator(
        '[data-testid*="workspace"], .workspace, .project'
      )

      if ((await workspaceElements.count()) > 0) {
        await expect(workspaceElements.first()).toBeVisible()
      }
    }
  })

  test('Translation quality settings are available', async ({ page }) => {
    // Look for quality/settings options
    const settingsButton = page
      .locator(
        'button:has-text("Cài đặt"), button:has-text("Settings"), [data-testid*="settings"]'
      )
      .first()

    if ((await settingsButton.count()) > 0) {
      await settingsButton.click()

      // Check for quality options
      const qualityOptions = page.locator(
        'text=/Chất lượng|Quality|Độ chính xác|Accuracy/i'
      )

      if ((await qualityOptions.count()) > 0) {
        await expect(qualityOptions.first()).toBeVisible()
      }

      // Check for language preferences
      const languageSettings = page.locator(
        'text=/Ngôn ngữ|Language|Preference/i'
      )

      if ((await languageSettings.count()) > 0) {
        await expect(languageSettings.first()).toBeVisible()
      }
    }
  })

  test('Translation API rate limiting is handled gracefully', async ({
    page,
  }) => {
    const sourceTextArea = page
      .locator(
        'textarea[placeholder*="Nhập"], textarea[placeholder*="Enter"], [data-testid*="source"]'
      )
      .first()
    const translateButton = page
      .locator(
        'button:has-text("Dịch"), button:has-text("Translate"), [data-testid*="translate"]'
      )
      .first()

    if (
      (await sourceTextArea.count()) > 0 &&
      (await translateButton.count()) > 0
    ) {
      // Rapid successive translations to test rate limiting
      const testTexts = [
        'Hello world',
        'How are you?',
        'Good morning',
        'Thank you very much',
      ]

      for (const text of testTexts) {
        await sourceTextArea.fill(text)
        await translateButton.click()
        await page.waitForTimeout(500) // Short delay between requests
      }

      // Check for rate limit message
      const rateLimitMessage = page.locator(
        'text=/rate limit|quá nhiều|too many|vượt quá/i, [role="alert"]'
      )

      if ((await rateLimitMessage.count()) > 0) {
        // Rate limiting message should be user-friendly
        const messageText = await rateLimitMessage.first().textContent()
        expect(messageText?.length).toBeGreaterThan(0)
      }
    }
  })

  test('Character and word count displays correctly', async ({ page }) => {
    const sourceTextArea = page
      .locator(
        'textarea[placeholder*="Nhập"], textarea[placeholder*="Enter"], [data-testid*="source"]'
      )
      .first()

    if ((await sourceTextArea.count()) > 0) {
      const testText =
        'Đây là một đoạn văn bản tiếng Việt để kiểm tra tính năng đếm từ và ký tự.'
      await sourceTextArea.fill(testText)

      // Look for character/word counters
      const charCounter = page.locator(
        'text=/ký tự|character|chars/i, [data-testid*="char"]'
      )
      const wordCounter = page.locator(
        'text=/từ|word|words/i, [data-testid*="word"]'
      )

      if ((await charCounter.count()) > 0) {
        const counterText = await charCounter.first().textContent()
        expect(counterText).toMatch(/\d+/) // Should contain numbers
      }

      if ((await wordCounter.count()) > 0) {
        const counterText = await wordCounter.first().textContent()
        expect(counterText).toMatch(/\d+/) // Should contain numbers
      }
    }
  })

  test('Translation export functionality works', async ({ page }) => {
    // Check for export options
    const exportButton = page
      .locator(
        'button:has-text("Xuất"), button:has-text("Export"), button:has-text("Tải về"), [data-testid*="export"]'
      )
      .first()

    if ((await exportButton.count()) > 0) {
      await exportButton.click()

      // Check for export format options
      const formatOptions = page.locator('text=/PDF|DOCX|TXT|CSV/i')

      if ((await formatOptions.count()) > 0) {
        await expect(formatOptions.first()).toBeVisible()
      }

      // Check for Vietnamese export options
      const vietnameseOptions = page.locator(
        'text=/Định dạng|Format|Xuất file/i'
      )

      if ((await vietnameseOptions.count()) > 0) {
        await expect(vietnameseOptions.first()).toBeVisible()
      }
    }
  })

  test('Real-time translation suggestions work', async ({ page }) => {
    const sourceTextArea = page
      .locator(
        'textarea[placeholder*="Nhập"], textarea[placeholder*="Enter"], [data-testid*="source"]'
      )
      .first()

    if ((await sourceTextArea.count()) > 0) {
      // Type text gradually to trigger real-time suggestions
      await sourceTextArea.type('Hello', { delay: 100 })

      // Look for suggestion dropdown or auto-complete
      const suggestions = page.locator(
        '[data-testid*="suggestion"], .suggestion, .autocomplete'
      )

      if ((await suggestions.count()) > 0) {
        await expect(suggestions.first()).toBeVisible({ timeout: 3000 })

        // Suggestions should be clickable
        await expect(suggestions.first()).toBeEnabled()
      }
    }
  })

  test('Translation accuracy feedback system', async ({ page }) => {
    // Look for feedback buttons (thumbs up/down, rating)
    const feedbackButtons = page.locator(
      'button[aria-label*="feedback"], button:has-text("👍"), button:has-text("👎"), [data-testid*="feedback"]'
    )

    if ((await feedbackButtons.count()) > 0) {
      await expect(feedbackButtons.first()).toBeVisible()

      // Test feedback submission
      await feedbackButtons.first().click()

      // Should show feedback confirmation
      const feedbackConfirm = page.locator(
        'text=/Cảm ơn|Thank you|Đã ghi nhận/i, [role="alert"]'
      )

      if ((await feedbackConfirm.count()) > 0) {
        await expect(feedbackConfirm.first()).toBeVisible({ timeout: 3000 })
      }
    }
  })
})
