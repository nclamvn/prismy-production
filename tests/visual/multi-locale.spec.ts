/**
 * UI/UX Polish Sprint - Phase 3.2: Multi-Locale Visual Tests
 * 
 * Comprehensive visual regression testing across all supported locales
 * Tests UI consistency, layout, typography, and RTL support
 */

import { test, expect } from '@playwright/test'
import { setupPercyTesting, PercyTester, DEFAULT_VISUAL_CONFIG, VISUAL_TEST_SCENARIOS } from './percy-utils'

// Skip Percy tests if not in CI or Percy not configured
const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI

test.describe('Multi-Locale Visual Testing', () => {
  let percyTester: PercyTester

  test.beforeEach(async ({ page }) => {
    percyTester = await setupPercyTesting(page)
    
    // Navigate to base URL
    await page.goto('http://localhost:3000')
    
    // Wait for initial load
    await page.waitForLoadState('networkidle')
  })

  test('Homepage across all locales', async ({ page }) => {
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    for (const locale of DEFAULT_VISUAL_CONFIG.locales) {
      await test.step(`Homepage - ${locale}`, async () => {
        await page.goto(`http://localhost:3000?locale=${locale}`)
        await page.waitForSelector('[data-testid="hero-section"]', { timeout: 10000 })
        
        // Test both themes
        for (const theme of ['light', 'dark']) {
          await page.evaluate((theme) => {
            localStorage.setItem('pry-theme-preference', theme)
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(theme)
          }, theme)
          
          await page.waitForTimeout(500)
          
          // Take Percy snapshot
          await percyTester.testPage(
            { name: 'Homepage', path: '/', waitFor: '[data-testid="hero-section"]' },
            locale,
            theme,
            DEFAULT_VISUAL_CONFIG.viewports
          )
        }
      })
    }
  })

  test('Workspace layout across locales', async ({ page }) => {
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@prismy.in' }
      }))
    })
    
    for (const locale of DEFAULT_VISUAL_CONFIG.locales) {
      await test.step(`Workspace - ${locale}`, async () => {
        await page.goto(`http://localhost:3000/workspace?locale=${locale}`)
        await page.waitForSelector('[data-testid="workspace-main"]', { timeout: 10000 })
        
        await percyTester.testPage(
          { name: 'Workspace', path: '/workspace', waitFor: '[data-testid="workspace-main"]' },
          locale,
          'light',
          DEFAULT_VISUAL_CONFIG.viewports
        )
      })
    }
  })

  test('RTL layout support (Arabic)', async ({ page }) => {
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    await test.step('Arabic RTL Layout', async () => {
      await page.goto('http://localhost:3000?locale=ar')
      await page.waitForSelector('[data-testid="hero-section"]')
      
      // Verify RTL direction is applied
      const direction = await page.evaluate(() => 
        getComputedStyle(document.documentElement).direction
      )
      expect(direction).toBe('rtl')
      
      // Test key pages in RTL
      const rtlPages = [
        { name: 'Homepage RTL', path: '/', waitFor: '[data-testid="hero-section"]' },
        { name: 'Workspace RTL', path: '/workspace', waitFor: '[data-testid="workspace-main"]' }
      ]
      
      for (const pageConfig of rtlPages) {
        await percyTester.testPage(pageConfig, 'ar', 'light', [
          { name: 'Desktop', width: 1440, height: 900 },
          { name: 'Mobile', width: 375, height: 667 }
        ])
      }
    })
  })

  test('Typography rendering across locales', async ({ page }) => {
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    // Create a test page with typography samples
    await page.goto('http://localhost:3000')
    
    for (const locale of DEFAULT_VISUAL_CONFIG.locales) {
      await test.step(`Typography - ${locale}`, async () => {
        await page.evaluate((locale) => {
          localStorage.setItem('prismy-locale', locale)
          localStorage.setItem('i18nextLng', locale)
        }, locale)
        
        // Insert typography test content
        await page.evaluate((locale) => {
          const testContent = {
            en: {
              title: 'Typography Test - English',
              body: 'The quick brown fox jumps over the lazy dog. ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890',
              long: 'This is a longer text sample to test how the typography renders with extended content in English.'
            },
            vi: {
              title: 'Kiểm tra Typography - Tiếng Việt',
              body: 'Chữ Việt Nam đẹp lắm. AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVWXY ₫123456789',
              long: 'Đây là một đoạn văn bản dài hơn để kiểm tra cách hiển thị typography với nội dung mở rộng bằng tiếng Việt.'
            },
            ja: {
              title: 'タイポグラフィテスト - 日本語',
              body: 'いろはにほへと ちりぬるを わかよたれそ つねならむ ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
              long: 'これは日本語での拡張コンテンツでタイポグラフィのレンダリングをテストするためのより長いテキストサンプルです。'
            },
            ar: {
              title: 'اختبار الطباعة - العربية',
              body: 'أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ ١٢٣٤٥٦٧٨٩٠',
              long: 'هذا نموذج نص أطول لاختبار كيفية عرض الطباعة مع المحتوى الموسع باللغة العربية من اليمين إلى اليسار.'
            },
            zh: {
              title: '字体测试 - 中文',
              body: '中文测试文本样本 ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890 ，。？！',
              long: '这是一个更长的文本样本，用于测试中文扩展内容下字体的呈现效果和排版质量。'
            }
          }
          
          const content = testContent[locale as keyof typeof testContent]
          
          document.body.innerHTML = `
            <div style="padding: 40px; max-width: 800px; margin: 0 auto; font-family: Inter, sans-serif;">
              <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; color: #1a1a1a;">
                ${content.title}
              </h1>
              <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: #374151;">
                Character Set Test
              </h2>
              <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 1.5rem; color: #4b5563;">
                ${content.body}
              </p>
              <h3 style="font-size: 1.25rem; font-weight: 500; margin-bottom: 1rem; color: #374151;">
                Paragraph Test
              </h3>
              <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 1rem; color: #4b5563;">
                ${content.long}
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem;">
                <div style="font-size: 0.875rem; color: #6b7280;">Small text (14px)</div>
                <div style="font-size: 1rem; color: #374151;">Regular text (16px)</div>
                <div style="font-size: 1.125rem; color: #1f2937;">Large text (18px)</div>
              </div>
            </div>
          `
        }, locale)
        
        await page.waitForTimeout(1000)
        
        await percyTester.testPage(
          { name: 'Typography Test', path: '/typography-test' },
          locale,
          'light',
          [
            { name: 'Desktop', width: 1440, height: 900 },
            { name: 'Mobile', width: 375, height: 667 }
          ]
        )
      })
    }
  })

  test('Navigation and menu consistency', async ({ page }) => {
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    for (const locale of DEFAULT_VISUAL_CONFIG.locales) {
      await test.step(`Navigation - ${locale}`, async () => {
        await page.goto(`http://localhost:3000?locale=${locale}`)
        await page.waitForSelector('nav', { timeout: 10000 })
        
        // Test navigation states
        const navStates = [
          { name: 'Closed', action: null },
          { name: 'Open', action: () => page.click('[data-testid="mobile-menu-button"]') }
        ]
        
        for (const state of navStates) {
          if (state.action) {
            await state.action()
            await page.waitForTimeout(500)
          }
          
          await percyTester.testComponent(
            `Navigation ${state.name}`,
            'nav',
            locale,
            { themes: ['light', 'dark'] }
          )
        }
      })
    }
  })

  test('Form elements across locales', async ({ page }) => {
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    // Create form test page
    await page.goto('http://localhost:3000')
    
    for (const locale of DEFAULT_VISUAL_CONFIG.locales) {
      await test.step(`Forms - ${locale}`, async () => {
        await page.evaluate((locale) => {
          localStorage.setItem('prismy-locale', locale)
          
          const formLabels = {
            en: {
              title: 'Contact Form',
              name: 'Full Name',
              email: 'Email Address',
              message: 'Message',
              submit: 'Send Message',
              error: 'This field is required'
            },
            vi: {
              title: 'Biểu Mẫu Liên Hệ',
              name: 'Họ và Tên',
              email: 'Địa Chỉ Email',
              message: 'Tin Nhắn',
              submit: 'Gửi Tin Nhắn',
              error: 'Trường này là bắt buộc'
            },
            ja: {
              title: 'お問い合わせフォーム',
              name: 'お名前',
              email: 'メールアドレス',
              message: 'メッセージ',
              submit: 'メッセージを送信',
              error: 'この項目は必須です'
            },
            ar: {
              title: 'نموذج الاتصال',
              name: 'الاسم الكامل',
              email: 'عنوان البريد الإلكتروني',
              message: 'الرسالة',
              submit: 'إرسال الرسالة',
              error: 'هذا الحقل مطلوب'
            },
            zh: {
              title: '联系表单',
              name: '姓名',
              email: '电子邮箱',
              message: '留言',
              submit: '发送消息',
              error: '此字段为必填项'
            }
          }
          
          const labels = formLabels[locale as keyof typeof formLabels]
          
          document.body.innerHTML = `
            <div style="padding: 40px; max-width: 600px; margin: 0 auto; direction: ${locale === 'ar' ? 'rtl' : 'ltr'};">
              <h2 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 600;">${labels.title}</h2>
              <form style="space-y: 1rem;">
                <div style="margin-bottom: 1rem;">
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">${labels.name}</label>
                  <input type="text" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">${labels.email}</label>
                  <input type="email" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;">
                  <div style="color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;">${labels.error}</div>
                </div>
                <div style="margin-bottom: 1.5rem;">
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">${labels.message}</label>
                  <textarea rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; resize: vertical;"></textarea>
                </div>
                <button type="submit" style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-size: 1rem; font-weight: 500; cursor: pointer;">
                  ${labels.submit}
                </button>
              </form>
            </div>
          `
        }, locale)
        
        await page.waitForTimeout(500)
        
        await percyTester.testFormStates(
          'form',
          locale,
          VISUAL_TEST_SCENARIOS.forms.scenarios
        )
      })
    }
  })

  test('Component states across locales', async ({ page }) => {
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    const components = [
      { name: 'Button', selector: '[data-testid="test-button"]' },
      { name: 'Card', selector: '[data-testid="test-card"]' },
      { name: 'Modal', selector: '[data-testid="test-modal"]' }
    ]
    
    for (const component of components) {
      for (const locale of DEFAULT_VISUAL_CONFIG.locales) {
        await test.step(`${component.name} - ${locale}`, async () => {
          await page.goto(`http://localhost:3000/storybook?component=${component.name}&locale=${locale}`)
          
          await percyTester.testComponent(
            component.name,
            component.selector,
            locale,
            {
              variants: ['primary', 'secondary', 'danger'],
              states: ['default', 'hover', 'focus', 'disabled'],
              themes: ['light', 'dark']
            }
          )
        })
      }
    }
  })

  test('Error states and loading across locales', async ({ page }) => {
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    const errorStates = [
      { name: '404 Error', path: '/404' },
      { name: 'Network Error', path: '/workspace?error=network' },
      { name: 'Loading State', path: '/workspace?loading=true' },
      { name: 'Empty State', path: '/workspace/documents?empty=true' }
    ]
    
    for (const errorState of errorStates) {
      for (const locale of DEFAULT_VISUAL_CONFIG.locales) {
        await test.step(`${errorState.name} - ${locale}`, async () => {
          await page.goto(`http://localhost:3000${errorState.path}?locale=${locale}`)
          await page.waitForTimeout(1000)
          
          await percyTester.testPage(
            { name: errorState.name, path: errorState.path },
            locale,
            'light',
            [
              { name: 'Desktop', width: 1440, height: 900 },
              { name: 'Mobile', width: 375, height: 667 }
            ]
          )
        })
      }
    }
  })
})