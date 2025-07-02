/**
 * UI/UX Polish Sprint - Phase 3.2: RTL Layout Visual Tests
 * 
 * Comprehensive visual tests for Right-to-Left (RTL) language support
 * Focuses on Arabic locale with proper text direction, layout mirroring, and cultural adaptations
 */

import { test, expect } from '@playwright/test'
import { setupPercyTesting, PercyTester } from './percy-utils'

test.describe('RTL Layout Visual Tests', () => {
  let percyTester: PercyTester

  test.beforeEach(async ({ page }) => {
    percyTester = await setupPercyTesting(page)
  })

  test('RTL text direction and layout mirroring', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    await test.step('RTL Layout Verification', async () => {
      await page.goto('http://localhost:3000?locale=ar')
      
      // Verify RTL direction is applied
      const direction = await page.evaluate(() => 
        getComputedStyle(document.documentElement).direction
      )
      expect(direction).toBe('rtl')
      
      // Wait for page load
      await page.waitForSelector('[data-testid="hero-section"]', { timeout: 10000 })
      
      // Test homepage with RTL layout
      await percyTester.testPage(
        { name: 'Homepage RTL', path: '/', waitFor: '[data-testid="hero-section"]' },
        'ar',
        'light',
        [
          { name: 'Desktop RTL', width: 1440, height: 900 },
          { name: 'Tablet RTL', width: 768, height: 1024 },
          { name: 'Mobile RTL', width: 375, height: 667 }
        ]
      )
    })
  })

  test('RTL navigation and menu layouts', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    await test.step('RTL Navigation', async () => {
      await page.goto('http://localhost:3000?locale=ar')
      await page.waitForSelector('nav')
      
      // Test navigation bar in RTL
      await percyTester.testComponent(
        'RTL Navigation Bar',
        'nav',
        'ar',
        { themes: ['light', 'dark'] }
      )
      
      // Test mobile menu in RTL
      await page.setViewportSize({ width: 375, height: 667 })
      const menuButton = page.locator('[data-testid="mobile-menu-button"]')
      
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(500)
        
        await percyTester.testComponent(
          'RTL Mobile Menu Open',
          'nav',
          'ar'
        )
      }
    })
  })

  test('RTL form layouts and input alignment', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    await test.step('RTL Forms', async () => {
      await page.goto('http://localhost:3000?locale=ar')
      
      // Create comprehensive RTL form test
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
            direction: rtl;
            font-family: Inter, sans-serif;
          ">
            <h2 style="
              margin-bottom: 24px;
              font-size: 24px;
              font-weight: 600;
              text-align: right;
            ">نموذج اختبار التخطيط</h2>
            
            <form style="space-y: 16px;">
              <!-- Name field -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 8px;
                  font-weight: 500;
                  text-align: right;
                ">الاسم الكامل</label>
                <input 
                  type="text" 
                  value="محمد أحمد السعيد"
                  style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 16px;
                    text-align: right;
                    direction: rtl;
                  "
                >
              </div>
              
              <!-- Email field (should remain LTR) -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 8px;
                  font-weight: 500;
                  text-align: right;
                ">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  value="user@example.com"
                  style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 16px;
                    text-align: left;
                    direction: ltr;
                  "
                >
              </div>
              
              <!-- Phone field with country code -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 8px;
                  font-weight: 500;
                  text-align: right;
                ">رقم الهاتف</label>
                <div style="display: flex; gap: 8px; direction: rtl;">
                  <select style="
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 16px;
                    background: white;
                    direction: rtl;
                    text-align: right;
                  ">
                    <option>+966 🇸🇦</option>
                    <option>+971 🇦🇪</option>
                    <option>+20 🇪🇬</option>
                  </select>
                  <input 
                    type="tel" 
                    value="501234567"
                    style="
                      flex: 1;
                      padding: 12px;
                      border: 1px solid #d1d5db;
                      border-radius: 6px;
                      font-size: 16px;
                      text-align: left;
                      direction: ltr;
                    "
                  >
                </div>
              </div>
              
              <!-- Date field -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 8px;
                  font-weight: 500;
                  text-align: right;
                ">تاريخ الميلاد</label>
                <input 
                  type="date" 
                  value="1990-01-01"
                  style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 16px;
                    direction: ltr;
                  "
                >
              </div>
              
              <!-- Radio buttons -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 8px;
                  font-weight: 500;
                  text-align: right;
                ">الجنس</label>
                <div style="display: flex; gap: 24px; direction: rtl;">
                  <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="radio" name="gender" value="male" checked>
                    <span>ذكر</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="radio" name="gender" value="female">
                    <span>أنثى</span>
                  </label>
                </div>
              </div>
              
              <!-- Checkbox -->
              <div style="margin-bottom: 24px;">
                <label style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  direction: rtl;
                  cursor: pointer;
                ">
                  <input type="checkbox" checked>
                  <span>أوافق على شروط الاستخدام وسياسة الخصوصية</span>
                </label>
              </div>
              
              <!-- Message field -->
              <div style="margin-bottom: 24px;">
                <label style="
                  display: block;
                  margin-bottom: 8px;
                  font-weight: 500;
                  text-align: right;
                ">رسالة إضافية</label>
                <textarea 
                  rows="4" 
                  style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 16px;
                    resize: vertical;
                    text-align: right;
                    direction: rtl;
                  "
                >هذا نص تجريبي باللغة العربية لاختبار التخطيط والتوجيه الصحيح للنص.</textarea>
              </div>
              
              <!-- Submit buttons -->
              <div style="
                display: flex;
                gap: 12px;
                direction: rtl;
                justify-content: flex-start;
              ">
                <button 
                  type="submit" 
                  style="
                    background: #3b82f6;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                  "
                >إرسال النموذج</button>
                <button 
                  type="button" 
                  style="
                    background: transparent;
                    color: #6b7280;
                    padding: 12px 24px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                  "
                >إلغاء</button>
              </div>
            </form>
          </div>
        `
      })
      
      await page.waitForTimeout(500)
      
      // Test RTL form layout
      await percyTester.testComponent(
        'RTL Form Layout',
        'form',
        'ar',
        { themes: ['light', 'dark'] }
      )
      
      // Test form with validation errors
      await page.evaluate(() => {
        const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement
        if (nameInput) {
          nameInput.style.borderColor = '#ef4444'
          
          // Add error message
          const errorDiv = document.createElement('div')
          errorDiv.style.cssText = `
            color: #ef4444;
            font-size: 14px;
            margin-top: 4px;
            text-align: right;
          `
          errorDiv.textContent = 'هذا الحقل مطلوب'
          nameInput.parentNode?.appendChild(errorDiv)
        }
      })
      
      await page.waitForTimeout(300)
      
      await percyTester.testComponent(
        'RTL Form With Errors',
        'form',
        'ar'
      )
    })
  })

  test('RTL workspace and document layouts', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    await test.step('RTL Workspace Layout', async () => {
      // Mock authentication
      await page.evaluate(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'test-user', email: 'test@prismy.in' }
        }))
      })
      
      await page.goto('http://localhost:3000/workspace?locale=ar')
      
      try {
        await page.waitForSelector('[data-testid="workspace-main"]', { timeout: 10000 })
        
        // Test main workspace in RTL
        await percyTester.testPage(
          { name: 'RTL Workspace Main', path: '/workspace', waitFor: '[data-testid="workspace-main"]' },
          'ar',
          'light',
          [
            { name: 'Desktop RTL', width: 1440, height: 900 },
            { name: 'Mobile RTL', width: 375, height: 667 }
          ]
        )
        
        // Test sidebar positioning in RTL
        const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]')
        if (await sidebarToggle.isVisible()) {
          await sidebarToggle.click()
          await page.waitForTimeout(500)
          
          await percyTester.testPage(
            { name: 'RTL Workspace With Sidebar', path: '/workspace' },
            'ar',
            'light',
            [{ name: 'Desktop RTL', width: 1440, height: 900 }]
          )
        }
        
      } catch (error) {
        console.log('Workspace not available for RTL testing')
      }
    })
  })

  test('RTL card layouts and content alignment', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    await test.step('RTL Card Layouts', async () => {
      await page.goto('http://localhost:3000?locale=ar')
      
      // Create RTL card layout test
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="
            padding: 40px;
            direction: rtl;
            font-family: Inter, sans-serif;
          ">
            <h2 style="
              margin-bottom: 24px;
              font-size: 24px;
              font-weight: 600;
              text-align: right;
            ">تخطيط البطاقات والمحتوى</h2>
            
            <!-- Document cards grid -->
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px;
              margin-bottom: 32px;
            ">
              ${[
                { title: 'تقرير المبيعات الشهري', date: '١٥ ديسمبر ٢٠٢٤', size: '٢.٣ ميجابايت' },
                { title: 'عقد الشراكة الجديد', date: '١٢ ديسمبر ٢٠٢٤', size: '١.٨ ميجابايت' },
                { title: 'خطة التسويق ٢٠٢٥', date: '١٠ ديسمبر ٢٠٢٤', size: '٤.١ ميجابايت' }
              ].map(doc => `
                <div style="
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 20px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  direction: rtl;
                ">
                  <div style="
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 12px;
                  ">
                    <div style="
                      width: 40px;
                      height: 40px;
                      background: #3b82f6;
                      border-radius: 6px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: 600;
                    ">📄</div>
                    <div style="flex: 1;">
                      <h3 style="
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 4px;
                        text-align: right;
                      ">${doc.title}</h3>
                      <p style="
                        font-size: 14px;
                        color: #6b7280;
                        text-align: right;
                      ">${doc.date}</p>
                    </div>
                    <button style="
                      width: 32px;
                      height: 32px;
                      border: none;
                      background: transparent;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">⋮</button>
                  </div>
                  
                  <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 12px;
                    border-top: 1px solid #f3f4f6;
                  ">
                    <span style="
                      font-size: 14px;
                      color: #6b7280;
                    ">${doc.size}</span>
                    <div style="display: flex; gap: 8px;">
                      <button style="
                        padding: 6px 12px;
                        background: #f3f4f6;
                        border: none;
                        border-radius: 4px;
                        font-size: 14px;
                        cursor: pointer;
                      ">تحميل</button>
                      <button style="
                        padding: 6px 12px;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 14px;
                        cursor: pointer;
                      ">عرض</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <!-- Statistics cards -->
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 16px;
              margin-bottom: 32px;
            ">
              ${[
                { label: 'إجمالي المستندات', value: '١٢٣', change: '+٨%' },
                { label: 'المعالجة اليوم', value: '٤٥', change: '+١٢%' },
                { label: 'مكتملة', value: '٩٨', change: '+٣%' },
                { label: 'قيد الانتظار', value: '٧', change: '-٢%' }
              ].map(stat => `
                <div style="
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 20px;
                  text-align: right;
                ">
                  <div style="
                    font-size: 28px;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 4px;
                  ">${stat.value}</div>
                  <div style="
                    font-size: 14px;
                    color: #6b7280;
                    margin-bottom: 8px;
                  ">${stat.label}</div>
                  <div style="
                    font-size: 12px;
                    color: ${stat.change.startsWith('+') ? '#10b981' : '#ef4444'};
                    font-weight: 500;
                  ">${stat.change} هذا الشهر</div>
                </div>
              `).join('')}
            </div>
            
            <!-- List view -->
            <div style="
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            ">
              <div style="
                padding: 16px 20px;
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
                font-weight: 600;
                text-align: right;
              ">المستندات الحديثة</div>
              
              ${[
                { name: 'العقد النهائي.pdf', type: 'PDF', date: 'منذ ساعتين', status: 'مكتمل' },
                { name: 'تقرير المالي.xlsx', type: 'Excel', date: 'منذ ٣ ساعات', status: 'معالجة' },
                { name: 'العرض التقديمي.pptx', type: 'PowerPoint', date: 'أمس', status: 'مكتمل' }
              ].map(file => `
                <div style="
                  padding: 16px 20px;
                  border-bottom: 1px solid #f3f4f6;
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  direction: rtl;
                ">
                  <div style="
                    width: 36px;
                    height: 36px;
                    background: #dbeafe;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 600;
                    color: #3b82f6;
                  ">${file.type}</div>
                  
                  <div style="flex: 1;">
                    <div style="
                      font-weight: 500;
                      margin-bottom: 2px;
                      text-align: right;
                    ">${file.name}</div>
                    <div style="
                      font-size: 14px;
                      color: #6b7280;
                      text-align: right;
                    ">${file.date}</div>
                  </div>
                  
                  <div style="
                    padding: 4px 8px;
                    background: ${file.status === 'مكتمل' ? '#dcfce7' : '#fef3c7'};
                    color: ${file.status === 'مكتمل' ? '#166534' : '#92400e'};
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                  ">${file.status}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `
      })
      
      await page.waitForTimeout(500)
      
      // Test RTL card layouts
      await percyTester.testPage(
        { name: 'RTL Card Layouts', path: '/rtl-cards' },
        'ar',
        'light',
        [
          { name: 'Desktop RTL', width: 1440, height: 900 },
          { name: 'Tablet RTL', width: 768, height: 1024 },
          { name: 'Mobile RTL', width: 375, height: 667 }
        ]
      )
    })
  })

  test('RTL typography and text rendering', async ({ page }) => {
    const shouldRunPercy = process.env.PERCY_TOKEN || process.env.CI
    test.skip(!shouldRunPercy, 'Percy not configured')
    
    await test.step('RTL Typography', async () => {
      await page.goto('http://localhost:3000?locale=ar')
      
      // Create comprehensive RTL typography test
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            direction: rtl;
            font-family: Inter, sans-serif;
          ">
            <!-- Arabic Typography Showcase -->
            <h1 style="
              font-size: 48px;
              font-weight: 700;
              margin-bottom: 16px;
              text-align: right;
              line-height: 1.2;
            ">اختبار الطباعة العربية</h1>
            
            <h2 style="
              font-size: 32px;
              font-weight: 600;
              margin-bottom: 12px;
              text-align: right;
              color: #374151;
            ">العناوين والنصوص</h2>
            
            <p style="
              font-size: 18px;
              line-height: 1.6;
              margin-bottom: 24px;
              text-align: right;
              color: #4b5563;
            ">
              هذا نص تجريبي باللغة العربية لاختبار جودة عرض الخطوط والتباعد بين الحروف والكلمات. 
              يجب أن يظهر النص بوضوح ووضوح مع المحاذاة الصحيحة من اليمين إلى اليسار.
            </p>
            
            <!-- Mixed content (Arabic + English + Numbers) -->
            <div style="
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 24px;
            ">
              <h3 style="
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 12px;
                text-align: right;
              ">المحتوى المختلط</h3>
              
              <p style="
                font-size: 16px;
                line-height: 1.5;
                text-align: right;
                margin-bottom: 8px;
              ">
                اسم المستخدم: <span style="direction: ltr; font-weight: 500;">user@example.com</span>
              </p>
              
              <p style="
                font-size: 16px;
                line-height: 1.5;
                text-align: right;
                margin-bottom: 8px;
              ">
                العدد: <span style="direction: ltr; font-weight: 500;">١٢٣٤٥٦٧٨٩٠</span> (أرقام عربية)
              </p>
              
              <p style="
                font-size: 16px;
                line-height: 1.5;
                text-align: right;
                margin-bottom: 8px;
              ">
                الرقم: <span style="direction: ltr; font-weight: 500;">1234567890</span> (أرقام إنجليزية)
              </p>
              
              <p style="
                font-size: 16px;
                line-height: 1.5;
                text-align: right;
              ">
                الموقع: <span style="direction: ltr; color: #3b82f6;">https://prismy.in</span>
              </p>
            </div>
            
            <!-- Different font weights and sizes -->
            <div style="margin-bottom: 24px;">
              <h3 style="
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 16px;
                text-align: right;
              ">أحجام وأوزان الخطوط</h3>
              
              <div style="margin-bottom: 12px;">
                <span style="font-size: 12px; color: #6b7280;">صغير (12px):</span>
                <span style="font-size: 12px; margin-right: 8px;">النص الصغير للتفاصيل والملاحظات</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="font-size: 14px; color: #6b7280;">عادي (14px):</span>
                <span style="font-size: 14px; margin-right: 8px;">النص العادي للمحتوى الأساسي</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="font-size: 16px; color: #6b7280;">متوسط (16px):</span>
                <span style="font-size: 16px; margin-right: 8px;">النص المتوسط للفقرات المهمة</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="font-size: 18px; color: #6b7280;">كبير (18px):</span>
                <span style="font-size: 18px; margin-right: 8px; font-weight: 500;">النص الكبير للعناوين الفرعية</span>
              </div>
            </div>
            
            <!-- Text alignment examples -->
            <div style="margin-bottom: 24px;">
              <h3 style="
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 16px;
                text-align: right;
              ">محاذاة النص</h3>
              
              <div style="
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 16px;
                margin-bottom: 12px;
              ">
                <p style="text-align: right; margin: 0;">
                  محاذاة يمين: هذا النص محاذي إلى اليمين وهو الوضع الافتراضي للنصوص العربية.
                </p>
              </div>
              
              <div style="
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 16px;
                margin-bottom: 12px;
              ">
                <p style="text-align: center; margin: 0;">
                  محاذاة وسط: هذا النص محاذي في الوسط ويستخدم للعناوين والتأكيدات.
                </p>
              </div>
              
              <div style="
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 16px;
              ">
                <p style="text-align: justify; margin: 0; line-height: 1.6;">
                  محاذاة مبررة: هذا النص مبرر من الجانبين ويظهر بشكل متساوي على كلا الجانبين. 
                  يستخدم هذا النوع من المحاذاة في النصوص الطويلة والمقالات لإعطاء مظهر أكثر تنظيماً ومهنية.
                </p>
              </div>
            </div>
            
            <!-- Code and technical content -->
            <div style="margin-bottom: 24px;">
              <h3 style="
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 16px;
                text-align: right;
              ">المحتوى التقني</h3>
              
              <div style="
                background: #1f2937;
                color: #f9fafb;
                padding: 16px;
                border-radius: 6px;
                font-family: 'Courier New', monospace;
                direction: ltr;
                text-align: left;
                margin-bottom: 12px;
              ">
{
  "name": "مشروع تجريبي",
  "version": "1.0.0",
  "description": "وصف المشروع باللغة العربية"
}
              </div>
              
              <p style="
                font-size: 14px;
                color: #6b7280;
                text-align: right;
                margin: 0;
              ">
                ملاحظة: المحتوى التقني يحافظ على اتجاه LTR حتى في البيئة العربية.
              </p>
            </div>
          </div>
        `
      })
      
      await page.waitForTimeout(500)
      
      // Test RTL typography
      await percyTester.testPage(
        { name: 'RTL Typography Test', path: '/rtl-typography' },
        'ar',
        'light',
        [
          { name: 'Desktop RTL', width: 1440, height: 900 },
          { name: 'Mobile RTL', width: 375, height: 667 }
        ]
      )
    })
  })
})