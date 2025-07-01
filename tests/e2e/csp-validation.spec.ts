/**
 * CSP Violation Testing Suite
 * Validates all CSP fixes and ensures no violations occur
 */

import { test, expect, Page } from '@playwright/test'

// CSP Violation Monitor
let cspViolations: Array<{ directive: string, blockedURI: string, violatedDirective: string }> = []

const setupCSPMonitor = async (page: Page) => {
  // Reset violations array
  cspViolations = []
  
  // Monitor CSP violations
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as any).__CSP_VIOLATIONS__ = (window as any).__CSP_VIOLATIONS__ || []
      ;(window as any).__CSP_VIOLATIONS__.push({
        directive: e.effectiveDirective,
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
        lineNumber: e.lineNumber,
        columnNumber: e.columnNumber,
        sourceFile: e.sourceFile,
        sample: e.sample
      })
    })
  })
  
  // Monitor console errors for CSP
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
      console.error('CSP Console Error:', msg.text())
    }
  })
}

const getCSPViolations = async (page: Page) => {
  return await page.evaluate(() => {
    return (window as any).__CSP_VIOLATIONS__ || []
  })
}

test.describe('CSP Violation Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await setupCSPMonitor(page)
  })

  test('Homepage loads without CSP violations', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Allow time for dynamic content
    
    const violations = await getCSPViolations(page)
    expect(violations).toEqual([])
  })

  test('Workspace page loads without CSP violations', async ({ page }) => {
    await page.goto('/workspace')
    
    // Wait for dynamic imports and theme providers
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    const violations = await getCSPViolations(page)
    expect(violations).toEqual([])
  })

  test('Vietnamese theme switching works without CSP violations', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page load
    await page.waitForLoadState('networkidle')
    
    // Clear any initial violations
    await page.evaluate(() => {
      (window as any).__CSP_VIOLATIONS__ = []
    })
    
    // Trigger theme changes
    await page.evaluate(() => {
      const root = document.documentElement
      root.classList.add('theme-tet')
      root.classList.remove('theme-default')
      root.classList.add('theme-traditional')
    })
    
    await page.waitForTimeout(1000)
    
    const violations = await getCSPViolations(page)
    expect(violations).toEqual([])
  })

  test('Style tags have proper nonce attributes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check that all style tags have nonce
    const styleTagsWithoutNonce = await page.evaluate(() => {
      const styleTags = document.querySelectorAll('style')
      const withoutNonce = Array.from(styleTags).filter(tag => !tag.getAttribute('nonce'))
      return withoutNonce.length
    })
    
    expect(styleTagsWithoutNonce).toBe(0)
  })

  test('Styled-components integration works', async ({ page }) => {
    await page.goto('/workspace')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Check for styled-components specific tags
    const styledComponentsTags = await page.evaluate(() => {
      const styledTags = document.querySelectorAll('style[data-styled]')
      const withoutNonce = Array.from(styledTags).filter(tag => !tag.getAttribute('nonce'))
      return {
        total: styledTags.length,
        withoutNonce: withoutNonce.length
      }
    })
    
    if (styledComponentsTags.total > 0) {
      expect(styledComponentsTags.withoutNonce).toBe(0)
    }
  })

  test('No multiple Supabase client instances', async ({ page }) => {
    await page.goto('/workspace')
    await page.waitForLoadState('networkidle')
    
    // Check for singleton enforcement
    const supabaseDebug = await page.evaluate(() => {
      if (typeof (window as any).debugNuclearSupabase === 'function') {
        (window as any).debugNuclearSupabase()
      }
      return {
        hasWindow: typeof window !== 'undefined',
        hasClient: !!(window as any).__PRISMY_SUPABASE_CLIENT__,
        hasCreated: !!(window as any).__PRISMY_SUPABASE_CREATED__
      }
    })
    
    expect(supabaseDebug.hasClient).toBe(true)
    expect(supabaseDebug.hasCreated).toBe(true)
  })

  test('Accessibility features work without CSP violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Clear initial violations
    await page.evaluate(() => {
      (window as any).__CSP_VIOLATIONS__ = []
    })
    
    // Trigger accessibility features
    await page.evaluate(() => {
      // Simulate accessibility settings changes
      if (typeof (window as any).triggerAccessibilityFeatures === 'function') {
        (window as any).triggerAccessibilityFeatures()
      }
    })
    
    await page.waitForTimeout(1000)
    
    const violations = await getCSPViolations(page)
    expect(violations).toEqual([])
  })

  test('Dynamic content loading preserves CSP compliance', async ({ page }) => {
    await page.goto('/workspace')
    await page.waitForLoadState('networkidle')
    
    // Clear violations
    await page.evaluate(() => {
      (window as any).__CSP_VIOLATIONS__ = []
    })
    
    // Simulate dynamic content loading
    await page.evaluate(() => {
      // Create dynamic style element
      const style = document.createElement('style')
      style.textContent = '.test-dynamic { color: red; }'
      document.head.appendChild(style)
    })
    
    await page.waitForTimeout(1000)
    
    // Check that dynamic style got nonce
    const dynamicStyleHasNonce = await page.evaluate(() => {
      const dynamicStyles = document.querySelectorAll('style')
      const lastStyle = dynamicStyles[dynamicStyles.length - 1]
      return !!lastStyle?.getAttribute('nonce')
    })
    
    expect(dynamicStyleHasNonce).toBe(true)
    
    const violations = await getCSPViolations(page)
    expect(violations).toEqual([])
  })
})

test.describe('CSP Policy Validation', () => {
  test('CSP header is correctly set', async ({ page }) => {
    const response = await page.goto('/')
    const cspHeader = response?.headers()['content-security-policy']
    
    expect(cspHeader).toBeDefined()
    expect(cspHeader).toContain("default-src 'self'")
    expect(cspHeader).toContain("style-src 'self' 'nonce-")
    expect(cspHeader).toContain("script-src 'self' 'nonce-")
    
    // Check for fallback hashes
    expect(cspHeader).toContain("'sha256-fmrAi/Sk2PEewIwSMQeP06lkuW9P4P+oXzvxtdiJLss='")
  })

  test('Nonce is properly generated and set', async ({ page }) => {
    await page.goto('/')
    
    const nonce = await page.evaluate(() => {
      const metaTag = document.querySelector('meta[name="csp-nonce"]')
      return metaTag?.getAttribute('content')
    })
    
    expect(nonce).toBeDefined()
    expect(nonce).toMatch(/^[a-f0-9]{32}$/) // UUID without dashes
  })
})

test.describe('Performance Impact Assessment', () => {
  test('CSP fixes do not significantly impact performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Performance should not be significantly impacted (< 5 seconds)
    expect(loadTime).toBeLessThan(5000)
    
    // Check for excessive console logs from CSP monitoring
    const consoleLogs = await page.evaluate(() => {
      return (window as any).__CSP_DEBUG_LOGS__?.length || 0
    })
    
    // Should not have excessive debug logs in production
    if (process.env.NODE_ENV === 'production') {
      expect(consoleLogs).toBeLessThan(10)
    }
  })
})