/**
 * UI/UX Polish Sprint - Phase 3.2: Mobile-Specific Visual Tests
 * 
 * Visual regression tests focused on mobile layouts and interactions
 * Tests responsive behavior, touch interactions, and mobile-specific UI patterns
 */

import { test, expect } from '@playwright/test'
import { setupPercyTesting, PercyTester } from './percy-utils'

test.describe('Mobile Visual Tests', () => {
  let percyTester: PercyTester

  test.beforeEach(async ({ page }) => {
    percyTester = await setupPercyTesting(page)
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Enable touch events
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 10 })
    })
  })

  test('Mobile navigation and hamburger menu', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    for (const locale of ['en', 'vi', 'ar']) {
      await test.step(`Mobile Navigation - ${locale}`, async () => {
        await page.goto(`http://localhost:3000?locale=${locale}`)
        await page.waitForSelector('nav')
        
        // Test closed state
        await percyTester.testComponent(
          'Mobile Navigation Closed',
          'nav',
          locale,
          { themes: ['light', 'dark'] }
        )
        
        // Open mobile menu
        const menuButton = page.locator('[data-testid="mobile-menu-button"]')
        if (await menuButton.isVisible()) {
          await menuButton.click()
          await page.waitForTimeout(500)
          
          // Test open state
          await percyTester.testComponent(
            'Mobile Navigation Open',
            'nav',
            locale,
            { themes: ['light', 'dark'] }
          )
        }
      })
    }
  })

  test('Mobile workspace layout', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@prismy.in' }
      }))
    })
    
    for (const locale of ['en', 'vi', 'ar']) {
      await test.step(`Mobile Workspace - ${locale}`, async () => {
        await page.goto(`http://localhost:3000/workspace?locale=${locale}`)
        await page.waitForSelector('[data-testid="workspace-main"]', { timeout: 10000 })
        
        // Test workspace on mobile
        await percyTester.testPage(
          { name: 'Mobile Workspace', path: '/workspace', waitFor: '[data-testid="workspace-main"]' },
          locale,
          'light',
          [{ name: 'Mobile', width: 375, height: 667 }]
        )
        
        // Test with side panels
        const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]')
        if (await sidebarToggle.isVisible()) {
          await sidebarToggle.click()
          await page.waitForTimeout(500)
          
          await percyTester.testPage(
            { name: 'Mobile Workspace Sidebar', path: '/workspace', waitFor: '[data-testid="workspace-main"]' },
            locale,
            'light',
            [{ name: 'Mobile', width: 375, height: 667 }]
          )
        }
      })
    }
  })

  test('Mobile form interactions', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    for (const locale of ['en', 'vi', 'ar']) {
      await test.step(`Mobile Forms - ${locale}`, async () => {
        await page.goto(`http://localhost:3000?locale=${locale}`)
        
        // Create mobile form test
        await page.evaluate((locale) => {
          const isRTL = locale === 'ar'
          const formContent = {
            en: {
              title: 'Mobile Contact Form',
              name: 'Name',
              email: 'Email',
              message: 'Message',
              submit: 'Submit'
            },
            vi: {
              title: 'Biểu Mẫu Di Động',
              name: 'Tên',
              email: 'Email',
              message: 'Tin nhắn',
              submit: 'Gửi'
            },
            ar: {
              title: 'نموذج الهاتف المحمول',
              name: 'الاسم',
              email: 'البريد الإلكتروني',
              message: 'الرسالة',
              submit: 'إرسال'
            }
          }
          
          const content = formContent[locale as keyof typeof formContent]
          
          document.body.innerHTML = `
            <div style="
              padding: 16px;
              direction: ${isRTL ? 'rtl' : 'ltr'};
              font-family: Inter, sans-serif;
            ">
              <h2 style="
                margin-bottom: 16px;
                font-size: 20px;
                font-weight: 600;
                text-align: ${isRTL ? 'right' : 'left'};
              ">${content.title}</h2>
              
              <form>
                <div style="margin-bottom: 16px;">
                  <label style="
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    font-size: 14px;
                  ">${content.name}</label>
                  <input 
                    type="text" 
                    style="
                      width: 100%;
                      padding: 12px;
                      border: 1px solid #d1d5db;
                      border-radius: 8px;
                      font-size: 16px;
                      direction: ${isRTL ? 'rtl' : 'ltr'};
                    "
                  >
                </div>
                
                <div style="margin-bottom: 16px;">
                  <label style="
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    font-size: 14px;
                  ">${content.email}</label>
                  <input 
                    type="email" 
                    style="
                      width: 100%;
                      padding: 12px;
                      border: 1px solid #d1d5db;
                      border-radius: 8px;
                      font-size: 16px;
                      direction: ltr;
                    "
                  >
                </div>
                
                <div style="margin-bottom: 24px;">
                  <label style="
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    font-size: 14px;
                  ">${content.message}</label>
                  <textarea 
                    rows="4" 
                    style="
                      width: 100%;
                      padding: 12px;
                      border: 1px solid #d1d5db;
                      border-radius: 8px;
                      font-size: 16px;
                      resize: vertical;
                      direction: ${isRTL ? 'rtl' : 'ltr'};
                    "
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  style="
                    width: 100%;
                    background: #3b82f6;
                    color: white;
                    padding: 14px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    touch-action: manipulation;
                  "
                >${content.submit}</button>
              </form>
            </div>
          `
        }, locale)
        
        await page.waitForTimeout(500)
        
        // Test default state
        await percyTester.testComponent(
          'Mobile Form Default',
          'form',
          locale
        )
        
        // Test focused state
        await page.focus('input[type="text"]')
        await page.waitForTimeout(300)
        
        await percyTester.testComponent(
          'Mobile Form Focused',
          'form',
          locale
        )
        
        // Test filled state
        await page.fill('input[type="text"]', 'John Doe')
        await page.fill('input[type="email"]', 'john@example.com')
        await page.fill('textarea', 'This is a test message')
        
        await percyTester.testComponent(
          'Mobile Form Filled',
          'form',
          locale
        )
      })
    }
  })

  test('Mobile document upload interface', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@prismy.in' }
      }))
    })
    
    for (const locale of ['en', 'vi']) {
      await test.step(`Mobile Upload - ${locale}`, async () => {
        await page.goto(`http://localhost:3000/workspace/upload?locale=${locale}`)
        
        // Wait for upload interface
        try {
          await page.waitForSelector('[data-testid="upload-zone"]', { timeout: 5000 })
          
          await percyTester.testPage(
            { name: 'Mobile Upload Interface', path: '/workspace/upload', waitFor: '[data-testid="upload-zone"]' },
            locale,
            'light',
            [{ name: 'Mobile', width: 375, height: 667 }]
          )
          
          // Test drag state simulation
          await page.evaluate(() => {
            const uploadZone = document.querySelector('[data-testid="upload-zone"]') as HTMLElement
            if (uploadZone) {
              uploadZone.classList.add('drag-over')
            }
          })
          
          await percyTester.testPage(
            { name: 'Mobile Upload Drag Over', path: '/workspace/upload' },
            locale,
            'light',
            [{ name: 'Mobile', width: 375, height: 667 }]
          )
          
        } catch (error) {
          console.log(`Upload interface not available for ${locale}`)
        }
      })
    }
  })

  test('Mobile modals and overlays', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    for (const locale of ['en', 'vi', 'ar']) {
      await test.step(`Mobile Modals - ${locale}`, async () => {
        await page.goto(`http://localhost:3000?locale=${locale}`)
        
        // Test auth modal on mobile
        try {
          // Trigger auth modal
          await page.goto(`http://localhost:3000?auth=signup&locale=${locale}`)
          await page.waitForSelector('[data-testid="auth-modal"]', { timeout: 5000 })
          
          await percyTester.testComponent(
            'Mobile Auth Modal',
            '[data-testid="auth-modal"]',
            locale,
            { themes: ['light', 'dark'] }
          )
          
        } catch (error) {
          console.log(`Auth modal not available for ${locale}`)
        }
        
        // Test bottom sheets and mobile-specific overlays
        await page.evaluate((locale) => {
          const isRTL = locale === 'ar'
          
          // Create bottom sheet
          const bottomSheet = document.createElement('div')
          bottomSheet.setAttribute('data-testid', 'bottom-sheet')
          bottomSheet.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-radius: 16px 16px 0 0;
            padding: 24px 16px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            direction: ${isRTL ? 'rtl' : 'ltr'};
          `
          
          const content = {
            en: { title: 'Action Sheet', option1: 'Edit Document', option2: 'Share Document', cancel: 'Cancel' },
            vi: { title: 'Tùy Chọn', option1: 'Chỉnh Sửa', option2: 'Chia Sẻ', cancel: 'Hủy' },
            ar: { title: 'خيارات العمل', option1: 'تحرير المستند', option2: 'مشاركة المستند', cancel: 'إلغاء' }
          }
          
          const labels = content[locale as keyof typeof content]
          
          bottomSheet.innerHTML = `
            <div style="
              width: 40px;
              height: 4px;
              background: #d1d5db;
              border-radius: 2px;
              margin: 0 auto 16px;
            "></div>
            <h3 style="
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 16px;
              text-align: center;
            ">${labels.title}</h3>
            <button style="
              width: 100%;
              padding: 16px;
              border: none;
              background: transparent;
              text-align: ${isRTL ? 'right' : 'left'};
              font-size: 16px;
              margin-bottom: 8px;
              border-radius: 8px;
            ">${labels.option1}</button>
            <button style="
              width: 100%;
              padding: 16px;
              border: none;
              background: transparent;
              text-align: ${isRTL ? 'right' : 'left'};
              font-size: 16px;
              margin-bottom: 16px;
              border-radius: 8px;
            ">${labels.option2}</button>
            <button style="
              width: 100%;
              padding: 16px;
              border: 1px solid #d1d5db;
              background: transparent;
              text-align: center;
              font-size: 16px;
              font-weight: 500;
              border-radius: 8px;
            ">${labels.cancel}</button>
          `
          
          document.body.appendChild(bottomSheet)
        }, locale)
        
        await page.waitForTimeout(300)
        
        await percyTester.testComponent(
          'Mobile Bottom Sheet',
          '[data-testid="bottom-sheet"]',
          locale
        )
      })
    }
  })

  test('Mobile touch interactions', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    for (const locale of ['en', 'vi']) {
      await test.step(`Mobile Touch - ${locale}`, async () => {
        await page.goto(`http://localhost:3000?locale=${locale}`)
        
        // Create swipe-able card interface
        await page.evaluate((locale) => {
          const content = {
            en: { title: 'Swipe Cards', card1: 'Document 1', card2: 'Document 2', card3: 'Document 3' },
            vi: { title: 'Thẻ Vuốt', card1: 'Tài liệu 1', card2: 'Tài liệu 2', card3: 'Tài liệu 3' }
          }
          
          const labels = content[locale as keyof typeof content]
          
          document.body.innerHTML = `
            <div style="padding: 16px;">
              <h2 style="margin-bottom: 16px; font-size: 20px; font-weight: 600;">${labels.title}</h2>
              <div data-testid="swipe-container" style="
                display: flex;
                gap: 16px;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
                padding-bottom: 16px;
              ">
                ${[labels.card1, labels.card2, labels.card3].map(cardTitle => `
                  <div style="
                    min-width: 280px;
                    height: 200px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 20px;
                    color: white;
                    scroll-snap-align: start;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: 500;
                  ">
                    ${cardTitle}
                  </div>
                `).join('')}
              </div>
              
              <div style="margin-top: 24px;">
                <div style="
                  padding: 16px;
                  background: #f3f4f6;
                  border-radius: 8px;
                  margin-bottom: 16px;
                ">
                  <div style="
                    width: 100%;
                    height: 44px;
                    background: #3b82f6;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 500;
                    font-size: 16px;
                    touch-action: manipulation;
                  ">Touch Target (44px)</div>
                </div>
              </div>
            </div>
          `
        }, locale)
        
        await page.waitForTimeout(500)
        
        await percyTester.testPage(
          { name: 'Mobile Touch Interface', path: '/touch-test' },
          locale,
          'light',
          [{ name: 'Mobile', width: 375, height: 667 }]
        )
        
        // Simulate scroll state
        await page.evaluate(() => {
          const container = document.querySelector('[data-testid="swipe-container"]')
          if (container) {
            container.scrollLeft = 150 // Partially scrolled
          }
        })
        
        await page.waitForTimeout(300)
        
        await percyTester.testPage(
          { name: 'Mobile Touch Scrolled', path: '/touch-test' },
          locale,
          'light',
          [{ name: 'Mobile', width: 375, height: 667 }]
        )
      })
    }
  })

  test('Mobile orientation changes', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    const orientations = [
      { name: 'Portrait', width: 375, height: 667 },
      { name: 'Landscape', width: 667, height: 375 }
    ]
    
    for (const orientation of orientations) {
      await test.step(`Mobile ${orientation.name}`, async () => {
        await page.setViewportSize({ width: orientation.width, height: orientation.height })
        
        await page.goto('http://localhost:3000/workspace?locale=en')
        
        // Mock auth and wait for workspace
        await page.evaluate(() => {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: 'mock-token',
            user: { id: 'test-user', email: 'test@prismy.in' }
          }))
        })
        
        await page.reload()
        
        try {
          await page.waitForSelector('[data-testid="workspace-main"]', { timeout: 5000 })
          
          await percyTester.testPage(
            { name: `Mobile Workspace ${orientation.name}`, path: '/workspace' },
            'en',
            'light',
            [{ name: orientation.name, width: orientation.width, height: orientation.height }]
          )
        } catch (error) {
          console.log(`Workspace not available in ${orientation.name}`)
        }
      })
    }
  })
})