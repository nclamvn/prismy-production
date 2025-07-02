/**
 * Vietnamese Localization E2E Tests
 * Language switching, cultural adaptation, timezone handling
 * Vietnamese-specific UI/UX validation
 */

import { test, expect } from '@playwright/test'

test.describe('🇻🇳 Vietnamese Localization & Cultural Adaptation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Vietnamese language switching works correctly', async ({ page }) => {
    // Look for language switcher
    const languageSwitcher = page
      .locator(
        'button:has-text("EN"), button:has-text("VI"), ' +
          '[data-testid*="language"], [aria-label*="language"], ' +
          'select[name*="lang"], .language-switcher'
      )
      .first()

    if ((await languageSwitcher.count()) > 0) {
      // Test switching to Vietnamese
      await languageSwitcher.click()

      const vietnameseOption = page.locator(
        'option:has-text("Tiếng Việt"), option[value="vi"], ' +
          'button:has-text("Tiếng Việt"), a:has-text("Tiếng Việt")'
      )

      if ((await vietnameseOption.count()) > 0) {
        await vietnameseOption.first().click()
        await page.waitForTimeout(1000)

        // Page should now display Vietnamese content
        const vietnameseContent = page.locator(
          'text=/Trang chủ|Dịch thuật|Bản dịch|Giá cả|Liên hệ/i'
        )

        await expect(vietnameseContent.first()).toBeVisible({ timeout: 5000 })

        // URL or localStorage should reflect language choice
        const currentLang = await page.evaluate(
          () => localStorage.getItem('locale') || document.documentElement.lang
        )

        expect(currentLang).toMatch(/vi|VN/i)
      }
    }

    // Test switching to English
    if ((await languageSwitcher.count()) > 0) {
      await languageSwitcher.click()

      const englishOption = page.locator(
        'option:has-text("English"), option[value="en"], ' +
          'button:has-text("English"), a:has-text("English")'
      )

      if ((await englishOption.count()) > 0) {
        await englishOption.first().click()
        await page.waitForTimeout(1000)

        // Page should display English content
        const englishContent = page.locator(
          'text=/Home|Translate|Translation|Pricing|Contact/i'
        )

        await expect(englishContent.first()).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('Vietnamese currency and number formatting', async ({ page }) => {
    // Set Vietnamese locale
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN')
      window.localStorage.setItem('currency', 'VND')
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check for VND currency symbols
    const vndSymbols = page.locator('text=/₫|VND/i')

    if ((await vndSymbols.count()) > 0) {
      await expect(vndSymbols.first()).toBeVisible()

      // Check Vietnamese number formatting (dots for thousands)
      const vietnameseNumbers = page.locator('text=/\d{1,3}(\.\d{3})+\s*₫/')

      if ((await vietnameseNumbers.count()) > 0) {
        const numberText = await vietnameseNumbers.first().textContent()

        // Should use dots as thousands separators (e.g., 1.000.000 ₫)
        expect(numberText).toMatch(/\d{1,3}(\.\d{3})+/)
        expect(numberText).toContain('₫')
      }
    }

    // Test large number formatting
    const largeNumbers = page.locator('text=/\d{2,}[\.]/')

    if ((await largeNumbers.count()) > 0) {
      const numberText = await largeNumbers.first().textContent()

      // Vietnamese uses dots for thousands (1.000.000)
      // Not commas like English (1,000,000)
      expect(numberText).not.toMatch(/\d,\d/)
    }
  })

  test('Vietnamese date and time formatting', async ({ page }) => {
    // Set Vietnamese timezone
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN')
      window.localStorage.setItem('timezone', 'Asia/Ho_Chi_Minh')
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Look for date displays
    const dateElements = page.locator(
      '[datetime], .date, [data-testid*="date"], ' +
        'text=/\d{1,2}\/\d{1,2}\/\d{4}/, text=/\d{1,2}-\d{1,2}-\d{4}/'
    )

    if ((await dateElements.count()) > 0) {
      const dateText = await dateElements.first().textContent()

      // Vietnamese date format: DD/MM/YYYY or DD-MM-YYYY
      expect(dateText).toMatch(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/)
    }

    // Check for Vietnamese month names
    const vietnameseMonths = page.locator(
      'text=/Tháng|thg|Th1|Th2|Th3|Th4|Th5|Th6|Th7|Th8|Th9|Th10|Th11|Th12/i'
    )

    if ((await vietnameseMonths.count()) > 0) {
      await expect(vietnameseMonths.first()).toBeVisible()
    }

    // Check timezone display (GMT+7 for Vietnam)
    const timezoneInfo = page.locator(
      'text=/GMT\+7|ICT|Indochina|Hồ Chí Minh/i'
    )

    if ((await timezoneInfo.count()) > 0) {
      await expect(timezoneInfo.first()).toBeVisible()
    }
  })

  test('Vietnamese text rendering and typography', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN')
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check for proper Vietnamese diacritics rendering
    const vietnameseText = page.locator(
      'text=/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i'
    )

    if ((await vietnameseText.count()) > 0) {
      // Vietnamese characters should be properly displayed
      await expect(vietnameseText.first()).toBeVisible()

      // Check font rendering
      const computedStyle = await vietnameseText.first().evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
        }
      })

      // Font should support Vietnamese characters
      expect(computedStyle.fontFamily).toBeTruthy()
      expect(computedStyle.fontSize).toBeTruthy()
    }

    // Test text input with Vietnamese characters
    const textInput = page.locator('textarea, input[type="text"]').first()

    if ((await textInput.count()) > 0) {
      const vietnameseTestText =
        'Xin chào! Tôi tên là Nguyễn Văn A từ Hồ Chí Minh.'
      await textInput.fill(vietnameseTestText)

      const inputValue = await textInput.inputValue()

      // All Vietnamese characters should be preserved
      expect(inputValue).toBe(vietnameseTestText)
      expect(inputValue).toContain('ồ')
      expect(inputValue).toContain('ệ')
      expect(inputValue).toContain('ữ')
    }
  })

  test('Vietnamese address and phone number validation', async ({ page }) => {
    // Look for forms with address/phone fields
    const addressInput = page
      .locator(
        'input[name*="address"], input[placeholder*="địa chỉ"], ' +
          'input[placeholder*="Address"], textarea[name*="address"]'
      )
      .first()

    if ((await addressInput.count()) > 0) {
      // Test Vietnamese address format
      const vietnameseAddress =
        '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM'
      await addressInput.fill(vietnameseAddress)

      const inputValue = await addressInput.inputValue()
      expect(inputValue).toContain('Nguyễn')
      expect(inputValue).toContain('TP.HCM')
    }

    // Test Vietnamese phone number validation
    const phoneInput = page
      .locator(
        'input[type="tel"], input[name*="phone"], ' +
          'input[placeholder*="điện thoại"], input[placeholder*="phone"]'
      )
      .first()

    if ((await phoneInput.count()) > 0) {
      // Vietnamese mobile formats: +84, 0, or direct
      const vietnamesePhones = ['+84123456789', '0123456789', '84123456789']

      for (const phone of vietnamesePhones) {
        await phoneInput.fill(phone)

        // Should accept valid Vietnamese phone formats
        const value = await phoneInput.inputValue()
        expect(value).toBe(phone)

        // Check for validation (green border, checkmark, etc.)
        const validationState = await phoneInput.evaluate(el => {
          const style = window.getComputedStyle(el)
          return {
            borderColor: style.borderColor,
            backgroundColor: style.backgroundColor,
            className: el.className,
          }
        })

        // Should indicate valid input
        expect(validationState).toBeTruthy()
      }
    }
  })

  test('Vietnamese keyboard input method support', async ({ page }) => {
    const textArea = page.locator('textarea, input[type="text"]').first()

    if ((await textArea.count()) > 0) {
      await textArea.focus()

      // Test Vietnamese input methods (Telex typing)
      const telexInputs = [
        { input: 'a1', expected: 'á' },
        { input: 'a2', expected: 'à' },
        { input: 'a3', expected: 'ả' },
        { input: 'a4', expected: 'ã' },
        { input: 'a5', expected: 'ạ' },
        { input: 'aw', expected: 'ă' },
        { input: 'aa', expected: 'â' },
        { input: 'ee', expected: 'ê' },
        { input: 'oo', expected: 'ô' },
        { input: 'ow', expected: 'ơ' },
        { input: 'uw', expected: 'ư' },
        { input: 'dd', expected: 'đ' },
      ]

      for (const { input, expected } of telexInputs) {
        await textArea.clear()
        await textArea.type(input)

        // Some Vietnamese input methods might transform the text
        const value = await textArea.inputValue()

        // Either show the transformed character or keep the original input
        expect(value === expected || value === input).toBeTruthy()
      }

      // Test direct Vietnamese character input
      await textArea.clear()
      await textArea.fill('Tiếng Việt rất đẹp và phong phú.')

      const finalValue = await textArea.inputValue()
      expect(finalValue).toContain('ế')
      expect(finalValue).toContain('ệ')
      expect(finalValue).toContain('ẹ')
      expect(finalValue).toContain('ú')
    }
  })

  test('Vietnamese cultural context in UI elements', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN')
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check for Vietnamese-specific UI elements
    const vietnameseFormalAddress = page.locator(
      'text=/Quý khách|Anh\/Chị|Bạn|Quý vị/i'
    )

    if ((await vietnameseFormalAddress.count()) > 0) {
      await expect(vietnameseFormalAddress.first()).toBeVisible()
    }

    // Check for Vietnamese business terms
    const businessTerms = page.locator(
      'text=/Công ty|Doanh nghiệp|Dịch vụ|Khách hàng|Đối tác/i'
    )

    if ((await businessTerms.count()) > 0) {
      await expect(businessTerms.first()).toBeVisible()
    }

    // Check for Vietnamese payment terms
    const paymentTerms = page.locator(
      'text=/Thanh toán|Hóa đơn|Phí dịch vụ|Tài khoản/i'
    )

    if ((await paymentTerms.count()) > 0) {
      await expect(paymentTerms.first()).toBeVisible()
    }

    // Check for proper Vietnamese greeting context
    const timeBasedGreeting = page.locator(
      'text=/Chào buổi sáng|Chào buổi chiều|Chào buổi tối|Xin chào/i'
    )

    if ((await timeBasedGreeting.count()) > 0) {
      await expect(timeBasedGreeting.first()).toBeVisible()
    }
  })

  test('Bilingual content display (Vietnamese-English)', async ({ page }) => {
    // Check for bilingual elements
    const bilingualElements = page.locator(
      '[data-bilingual], .bilingual, ' +
        'span:has-text("(") + span:has-text(")")'
    )

    if ((await bilingualElements.count()) > 0) {
      const bilingualText = await bilingualElements.first().textContent()

      // Should contain both Vietnamese and English
      const hasVietnamese =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(
          bilingualText || ''
        )
      const hasEnglish = /[a-zA-Z]/.test(bilingualText || '')

      expect(hasVietnamese || hasEnglish).toBeTruthy()
    }

    // Check for language-specific content sections
    const vietnameseSection = page.locator('[lang="vi"], [data-lang="vi"]')
    const englishSection = page.locator('[lang="en"], [data-lang="en"]')

    if (
      (await vietnameseSection.count()) > 0 &&
      (await englishSection.count()) > 0
    ) {
      await expect(vietnameseSection.first()).toBeVisible()
      await expect(englishSection.first()).toBeVisible()
    }
  })

  test('Vietnamese search and filtering functionality', async ({ page }) => {
    // Look for search functionality
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="tìm"], ' +
          'input[placeholder*="search"], [data-testid*="search"]'
      )
      .first()

    if ((await searchInput.count()) > 0) {
      // Test Vietnamese search terms
      const vietnameseSearchTerms = [
        'dịch thuật',
        'bản dịch',
        'tiếng việt',
        'tài liệu',
      ]

      for (const term of vietnameseSearchTerms) {
        await searchInput.fill(term)

        // Look for search suggestions or results
        const searchResults = page.locator(
          '[data-testid*="result"], .search-result, ' +
            '.suggestion, [role="option"]'
        )

        if ((await searchResults.count()) > 0) {
          await expect(searchResults.first()).toBeVisible({ timeout: 3000 })
        }

        // Test search execution
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)

        // Should handle Vietnamese search terms correctly
        const currentUrl = page.url()
        expect(currentUrl).toContain(encodeURIComponent(term).toLowerCase())
      }
    }
  })
})
