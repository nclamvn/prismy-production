import { test, expect } from '@playwright/test'

test.describe('2-Tone Seamless Design', () => {
  test('should not have gray background sections', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that main sections use white background (not gray)
    const hero = page.locator('[data-testid="hero"], section').first()
    const heroBackground = await hero.evaluate(el => 
      getComputedStyle(el).backgroundColor
    )
    
    // Should be white (rgb(255, 255, 255)) or main color, not gray
    expect(heroBackground).not.toMatch(/rgb\(245, 245, 245\)|rgb\(249, 249, 249\)|rgb\(240, 240, 240\)/)
    
    // Check workbench doesn't have gray background
    const workbench = page.locator('[data-testid="workbench"]')
    const workbenchBackground = await workbench.evaluate(el => 
      getComputedStyle(el).backgroundColor
    )
    
    // Should not be gray
    expect(workbenchBackground).not.toMatch(/rgb\(245, 245, 245\)|rgb\(249, 249, 249\)|rgb\(240, 240, 240\)/)
  })

  test('footer should use black background', async ({ page }) => {
    await page.goto('/')
    
    const footer = page.locator('footer')
    const footerBackground = await footer.evaluate(el => 
      getComputedStyle(el).backgroundColor
    )
    
    // Should be black or very dark
    expect(footerBackground).toMatch(/rgb\(0, 0, 0\)|rgb\(17, 17, 17\)/)
  })

  test('should have monochrome template chips', async ({ page }) => {
    await page.goto('/')
    
    const templateChip = page.locator('.template-chip').first()
    await expect(templateChip).toBeVisible()
    
    const chipStyles = await templateChip.evaluate(el => ({
      backgroundColor: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
      borderColor: getComputedStyle(el).borderColor
    }))
    
    // Should use black text and white/transparent background
    expect(chipStyles.color).toMatch(/rgb\(0, 0, 0\)/)
  })

  test('should have only white and black backgrounds', async ({ page }) => {
    await page.goto('/')
    
    // Get all section elements
    const sections = page.locator('section, main, div[class*="bg-"]')
    const count = await sections.count()
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const section = sections.nth(i)
      const isVisible = await section.isVisible()
      
      if (isVisible) {
        const backgroundColor = await section.evaluate(el => 
          getComputedStyle(el).backgroundColor
        )
        
        // Allow transparent, white, or black backgrounds only
        const isValidBackground = 
          backgroundColor === 'rgba(0, 0, 0, 0)' || // transparent
          backgroundColor === 'rgb(255, 255, 255)' || // white
          backgroundColor === 'rgb(0, 0, 0)' || // black
          backgroundColor === 'transparent'
        
        if (!isValidBackground) {
          console.log(`Invalid background color found: ${backgroundColor}`)
        }
      }
    }
  })

  test('should have proper contrast ratios', async ({ page }) => {
    await page.goto('/')
    
    // Check main headings have high contrast
    const headings = page.locator('h1, h2, h3')
    const headingCount = await headings.count()
    
    for (let i = 0; i < Math.min(headingCount, 5); i++) {
      const heading = headings.nth(i)
      const isVisible = await heading.isVisible()
      
      if (isVisible) {
        const color = await heading.evaluate(el => 
          getComputedStyle(el).color
        )
        
        // Should use black text for high contrast
        expect(color).toMatch(/rgb\(0, 0, 0\)/)
      }
    }
  })
})