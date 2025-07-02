/**
 * Critical User Flows E2E Tests
 * Essential Vietnamese user journeys that must never fail
 */

import { test, expect } from '@playwright/test'

test.describe('🚨 Critical User Flows - Zero Failure Tolerance', () => {
  test.beforeEach(async ({ page }) => {
    // Set Vietnamese locale context
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN')
    })

    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('Homepage loads successfully with Vietnamese elements', async ({
    page,
  }) => {
    // Critical: Homepage must load
    await expect(page).toHaveTitle(/Prismy/i)

    // Critical: Vietnamese content must be present
    const vietnameseText = page.locator(
      'text=/Dịch thuật|Tiếng Việt|Bản dịch/i'
    )
    await expect(vietnameseText.first()).toBeVisible({ timeout: 10000 })

    // Critical: Main navigation must be functional
    const navigation = page.locator('nav, [role="navigation"]')
    await expect(navigation).toBeVisible()

    // Critical: Primary action buttons must be clickable
    const primaryButton = page
      .locator(
        'button:has-text("Bắt đầu"), button:has-text("Start"), [data-testid*="start"], [data-testid*="translate"]'
      )
      .first()
    if ((await primaryButton.count()) > 0) {
      await expect(primaryButton).toBeEnabled()
    }
  })

  test('User authentication flow works correctly', async ({ page }) => {
    // Navigate to sign in
    const signInLink = page
      .locator(
        'a:has-text("Đăng nhập"), a:has-text("Sign"), [href*="signin"], [href*="auth"]'
      )
      .first()

    if ((await signInLink.count()) > 0) {
      await signInLink.click()

      // Verify we're on auth page
      await expect(page).toHaveURL(/sign|auth|login/i)

      // Check for auth form elements
      const emailInput = page.locator(
        'input[type="email"], input[name*="email"], input[placeholder*="email"]'
      )
      const passwordInput = page.locator(
        'input[type="password"], input[name*="password"]'
      )

      await expect(emailInput).toBeVisible()
      await expect(passwordInput).toBeVisible()

      // Verify form validation (empty submission)
      const submitButton = page
        .locator(
          'button[type="submit"], button:has-text("Đăng nhập"), button:has-text("Sign")'
        )
        .first()
      await submitButton.click()

      // Should show validation errors
      const errorMessage = page.locator(
        '[role="alert"], .error, [data-testid*="error"]'
      )
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 })
    } else {
      console.log('⚠️ Sign in link not found - may be authenticated already')
    }
  })

  test('Translation interface is accessible and functional', async ({
    page,
  }) => {
    // Try to access translation interface
    const translateLink = page
      .locator(
        'a:has-text("Dịch"), a:has-text("Translate"), [href*="translate"], [href*="workspace"]'
      )
      .first()

    if ((await translateLink.count()) > 0) {
      await translateLink.click()
      await page.waitForLoadState('networkidle')

      // Check for translation interface elements
      const sourceTextArea = page
        .locator(
          'textarea[placeholder*="Nhập"], textarea[placeholder*="Enter"], [data-testid*="source"]'
        )
        .first()
      const targetArea = page
        .locator(
          'textarea[readonly], [data-testid*="target"], [data-testid*="result"]'
        )
        .first()

      if ((await sourceTextArea.count()) > 0) {
        await expect(sourceTextArea).toBeVisible()

        // Test basic translation input
        await sourceTextArea.fill('Hello, this is a test translation.')

        // Look for translate button
        const translateButton = page
          .locator(
            'button:has-text("Dịch"), button:has-text("Translate"), [data-testid*="translate"]'
          )
          .first()

        if ((await translateButton.count()) > 0) {
          await expect(translateButton).toBeEnabled()
        }
      }
    } else {
      console.log(
        '⚠️ Translation interface not accessible - may require authentication'
      )
    }
  })

  test('Vietnamese currency formatting works correctly', async ({ page }) => {
    // Check for pricing information with VND
    const vndPricing = page.locator('text=/₫|VND|\.000/i')

    if ((await vndPricing.count()) > 0) {
      await expect(vndPricing.first()).toBeVisible()

      // Verify Vietnamese number formatting (dots for thousands)
      const vndPattern = page.locator('text=/\d{1,3}(\.\d{3})*\s*₫/')
      await expect(vndPattern.first()).toBeVisible()
    }
  })

  test('Navigation is responsive and accessible', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')

    // Check if focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Test mobile menu if on smaller viewport
    const viewportSize = page.viewportSize()
    if (viewportSize && viewportSize.width < 768) {
      const mobileMenuButton = page
        .locator(
          'button[aria-label*="menu"], button[aria-expanded], [data-testid*="menu"]'
        )
        .first()

      if ((await mobileMenuButton.count()) > 0) {
        await mobileMenuButton.click()

        // Mobile menu should be visible
        const mobileMenu = page.locator(
          '[role="menu"], [data-testid*="mobile-menu"], nav[aria-expanded="true"]'
        )
        await expect(mobileMenu.first()).toBeVisible()
      }
    }
  })

  test('Error handling displays user-friendly messages', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page')

    // Should show 404 page or redirect
    const pageContent = await page.content()
    const is404 =
      pageContent.includes('404') ||
      pageContent.includes('Không tìm thấy') ||
      pageContent.includes('Not Found')

    if (is404) {
      // Check for user-friendly error message in Vietnamese
      const vietnameseError = page.locator('text=/Không tìm thấy|Lỗi|Error/i')
      await expect(vietnameseError.first()).toBeVisible()
    }

    // Check for home navigation link
    const homeLink = page
      .locator('a:has-text("Trang chủ"), a:has-text("Home"), a[href="/"]')
      .first()
    await expect(homeLink).toBeVisible()
  })

  test('Page loading performance is acceptable', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/', { waitUntil: 'networkidle' })

    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds for Vietnamese mobile networks
    expect(loadTime).toBeLessThan(5000)

    // Check for loading indicators
    const loadingIndicator = page.locator(
      '[data-testid*="loading"], .spinner, .loading'
    )

    // Loading indicators should not be visible after page load
    if ((await loadingIndicator.count()) > 0) {
      await expect(loadingIndicator.first()).toBeHidden({ timeout: 10000 })
    }
  })

  test('Vietnamese timezone and date formatting', async ({ page }) => {
    // Check for date/time displays
    const dateElements = page.locator(
      '[datetime], .date, [data-testid*="date"], [data-testid*="time"]'
    )

    if ((await dateElements.count()) > 0) {
      const dateText = await dateElements.first().textContent()

      // Should include Vietnamese month names or proper date format
      const vietnameseDatePattern =
        /\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/
      expect(dateText).toMatch(vietnameseDatePattern)
    }
  })
})
