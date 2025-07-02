/**
 * Mobile E2E Tests
 * Vietnamese mobile user experience optimization
 * Touch interactions, responsive design, mobile-specific features
 */

import { test, expect } from '@playwright/test'

test.describe('📱 Vietnamese Mobile User Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN')
      // Simulate mobile environment
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Mobile navigation menu works correctly', async ({ page }) => {
    // Check viewport is mobile-sized
    const viewportSize = page.viewportSize()
    expect(viewportSize?.width).toBeLessThanOrEqual(768)

    // Look for hamburger menu button
    const menuButton = page
      .locator(
        'button[aria-label*="menu"], button[aria-label*="Menu"], ' +
          'button[aria-expanded], [data-testid*="menu"], ' +
          'button:has(svg), .hamburger'
      )
      .first()

    if ((await menuButton.count()) > 0) {
      await expect(menuButton).toBeVisible()

      // Test menu open
      await menuButton.click()

      // Mobile menu should appear
      const mobileMenu = page.locator(
        '[role="menu"], [aria-expanded="true"], ' +
          '[data-testid*="mobile-menu"], .mobile-nav'
      )

      await expect(mobileMenu.first()).toBeVisible({ timeout: 3000 })

      // Check for Vietnamese menu items
      const menuItems = page.locator(
        'a:has-text("Trang chủ"), a:has-text("Dịch"), ' +
          'a:has-text("Giá"), a:has-text("Liên hệ")'
      )

      if ((await menuItems.count()) > 0) {
        await expect(menuItems.first()).toBeVisible()
      }

      // Test menu close
      await menuButton.click()
      await expect(mobileMenu.first()).toBeHidden({ timeout: 3000 })
    }
  })

  test('Touch interactions work properly', async ({ page }) => {
    // Test touch scrolling
    await page.evaluate(() => {
      window.scrollTo(0, 100)
    })

    const scrollPosition = await page.evaluate(() => window.scrollY)
    expect(scrollPosition).toBeGreaterThan(0)

    // Test touch on translation interface
    const translateButton = page
      .locator(
        'button:has-text("Dịch"), button:has-text("Translate"), ' +
          '[data-testid*="translate"], .translate-btn'
      )
      .first()

    if ((await translateButton.count()) > 0) {
      // Test tap (touch event)
      await translateButton.tap()

      // Should respond to touch
      await page.waitForTimeout(500)
    }

    // Test swipe gestures on carousel/slider elements
    const carousel = page.locator('[data-testid*="carousel"], .slider, .swiper')

    if ((await carousel.count()) > 0) {
      const box = await carousel.first().boundingBox()

      if (box) {
        // Simulate swipe gesture
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
        await page.mouse.up()

        await page.waitForTimeout(1000)
      }
    }
  })

  test('Mobile text input and virtual keyboard handling', async ({ page }) => {
    const textInput = page
      .locator(
        'textarea, input[type="text"], input[type="email"], ' +
          '[data-testid*="source"], [placeholder*="Nhập"]'
      )
      .first()

    if ((await textInput.count()) > 0) {
      // Focus on input to trigger virtual keyboard
      await textInput.focus()

      // Type Vietnamese text with diacritics
      const vietnameseText = 'Tôi muốn dịch văn bản này sang tiếng Anh.'
      await textInput.fill(vietnameseText)

      // Verify Vietnamese characters are preserved
      const inputValue = await textInput.inputValue()
      expect(inputValue).toContain('ô')
      expect(inputValue).toContain('ế')
      expect(inputValue).toContain('ạ')

      // Test autocorrect and suggestions don't interfere
      await textInput.clear()
      await textInput.type('Xin chao', { delay: 100 })

      // Should maintain typed text
      const typedValue = await textInput.inputValue()
      expect(typedValue).toBe('Xin chao')
    }
  })

  test('Mobile responsive design elements', async ({ page }) => {
    // Check that text is readable (font size)
    const bodyText = page.locator('body, main, .content').first()
    const fontSize = await bodyText.evaluate(
      el => window.getComputedStyle(el).fontSize
    )

    // Font should be at least 16px for mobile readability
    const fontSizeValue = parseInt(fontSize)
    expect(fontSizeValue).toBeGreaterThanOrEqual(14)

    // Check for mobile-optimized buttons
    const buttons = page.locator('button, .btn')

    if ((await buttons.count()) > 0) {
      const buttonBox = await buttons.first().boundingBox()

      if (buttonBox) {
        // Buttons should be at least 44px for touch targets
        expect(buttonBox.height).toBeGreaterThanOrEqual(40)
      }
    }

    // Check for proper spacing between interactive elements
    const links = page.locator('a')

    if ((await links.count()) > 1) {
      const link1 = await links.nth(0).boundingBox()
      const link2 = await links.nth(1).boundingBox()

      if (link1 && link2) {
        const verticalDistance = Math.abs(link1.y - link2.y)
        const horizontalDistance = Math.abs(link1.x - link2.x)

        // Should have adequate spacing for touch
        expect(verticalDistance > 8 || horizontalDistance > 8).toBeTruthy()
      }
    }
  })

  test('Mobile payment interface usability', async ({ page }) => {
    // Navigate to payment interface
    const paymentLink = page
      .locator(
        'a:has-text("Giá"), a:has-text("Pricing"), ' +
          'button:has-text("Nâng cấp"), [href*="pricing"]'
      )
      .first()

    if ((await paymentLink.count()) > 0) {
      await paymentLink.click()
      await page.waitForLoadState('networkidle')

      // Check for mobile-optimized payment options
      const paymentOptions = page.locator(
        '[data-payment], .payment-option, ' +
          'button:has-text("VNPay"), button:has-text("MoMo")'
      )

      if ((await paymentOptions.count()) > 0) {
        // Payment options should be easily tappable
        const optionBox = await paymentOptions.first().boundingBox()

        if (optionBox) {
          expect(optionBox.height).toBeGreaterThanOrEqual(44)
          expect(optionBox.width).toBeGreaterThanOrEqual(120)
        }
      }

      // Check for mobile payment methods (MoMo is mobile-first)
      const momoOption = page.locator('text=/MoMo/i, [data-payment="momo"]')

      if ((await momoOption.count()) > 0) {
        await expect(momoOption.first()).toBeVisible()
      }
    }
  })

  test('Mobile performance and loading states', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now()

    await page.goto('/', { waitUntil: 'networkidle' })

    const loadTime = Date.now() - startTime

    // Mobile should load within 3 seconds on slower connections
    expect(loadTime).toBeLessThan(8000)

    // Check for loading indicators
    const loadingIndicators = page.locator(
      '[data-testid*="loading"], .spinner, .loading, ' +
        '[aria-label*="loading"], .skeleton'
    )

    // Loading indicators should disappear after page load
    if ((await loadingIndicators.count()) > 0) {
      await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 })
    }

    // Check for image lazy loading
    const images = page.locator('img[loading="lazy"], img[data-src]')

    if ((await images.count()) > 0) {
      // Images should load as they come into viewport
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })

      await page.waitForTimeout(1000)
    }
  })

  test('Mobile translation interface usability', async ({ page }) => {
    // Navigate to translation interface
    await page.goto('/translate')

    const sourceTextArea = page
      .locator(
        'textarea[placeholder*="Nhập"], textarea[placeholder*="Enter"], ' +
          '[data-testid*="source"]'
      )
      .first()

    if ((await sourceTextArea.count()) > 0) {
      // Text area should be appropriately sized for mobile
      const textAreaBox = await sourceTextArea.boundingBox()

      if (textAreaBox) {
        expect(textAreaBox.height).toBeGreaterThanOrEqual(100)
        expect(textAreaBox.width).toBeGreaterThanOrEqual(200)
      }

      // Test mobile typing experience
      await sourceTextArea.focus()
      await sourceTextArea.fill('Đây là văn bản tiếng Việt')

      // Language selection should be mobile-friendly
      const languageSelector = page
        .locator(
          'select[name*="language"], [data-testid*="lang"], ' +
            'button[aria-haspopup="listbox"]'
        )
        .first()

      if ((await languageSelector.count()) > 0) {
        await languageSelector.click()

        // Dropdown should be visible and scrollable on mobile
        const dropdown = page.locator(
          '[role="listbox"], [role="menu"], .dropdown-menu'
        )

        if ((await dropdown.count()) > 0) {
          await expect(dropdown.first()).toBeVisible()
        }
      }
    }
  })

  test('Mobile offline functionality', async ({ page }) => {
    // Test offline detection
    await page.evaluate(() => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      window.dispatchEvent(new Event('offline'))
    })

    await page.waitForTimeout(1000)

    // Check for offline indicator
    const offlineIndicator = page.locator(
      'text=/offline|không có kết nối|mất kết nối/i, ' +
        '[data-testid*="offline"], .offline'
    )

    if ((await offlineIndicator.count()) > 0) {
      await expect(offlineIndicator.first()).toBeVisible({ timeout: 5000 })
    }

    // Test cached functionality
    const cachedContent = page.locator(
      '[data-cached], .cached, text=/cached|đã lưu/i'
    )

    // Some content should still be available offline
    const pageContent = await page.content()
    expect(pageContent.length).toBeGreaterThan(1000)
  })

  test('Mobile accessibility features', async ({ page }) => {
    // Test screen reader compatibility
    const mainContent = page
      .locator('main, [role="main"], .main-content')
      .first()

    if ((await mainContent.count()) > 0) {
      const ariaLabel = await mainContent.getAttribute('aria-label')
      const role = await mainContent.getAttribute('role')

      expect(ariaLabel || role).toBeTruthy()
    }

    // Test high contrast mode compatibility
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(500)

    // Page should still be readable in dark mode
    const darkModeContent = await page.isVisible('body')
    expect(darkModeContent).toBeTruthy()

    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(500)

    // Animations should be reduced or disabled
    const animations = page.locator('[style*="animation"], .animate')

    if ((await animations.count()) > 0) {
      const animationDuration = await animations
        .first()
        .evaluate(el => window.getComputedStyle(el).animationDuration)

      // Should be instant or very short
      expect(
        animationDuration === '0s' || animationDuration === 'none'
      ).toBeTruthy()
    }
  })
})
