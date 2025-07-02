import { test, expect } from '@playwright/test'

/**
 * Console Error Prevention Tests
 * Ensures production application has zero console errors
 */

test.describe('Console Error Prevention', () => {
  test.beforeEach(async ({ page }) => {
    // Capture all console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console Error: ${msg.text()}`)
      }
    })
  })

  test('Homepage should have zero console errors', async ({ page }) => {
    const errors: string[] = []
    const warnings: string[] = []

    // Capture console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text())
      }
    })

    // Navigate to homepage
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for any async operations to complete
    await page.waitForTimeout(2000)

    // Check for critical errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes('ResizeObserver loop limit exceeded') && // Ignore harmless ResizeObserver warnings
        !error.includes('Non-passive event listener') // Ignore passive listener warnings
    )

    // Log captured errors for debugging
    if (errors.length > 0) {
      console.log('Captured errors:', errors)
    }
    if (warnings.length > 0) {
      console.log('Captured warnings:', warnings)
    }

    // Assert no critical console errors
    expect(criticalErrors).toEqual([])
  })

  test('Vietnamese locale page should have zero console errors', async ({
    page,
  }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/vi', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const criticalErrors = errors.filter(
      error => !error.includes('ResizeObserver loop limit exceeded')
    )

    expect(criticalErrors).toEqual([])
  })

  test('Pricing page should have zero console errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/en/pricing', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const criticalErrors = errors.filter(
      error => !error.includes('ResizeObserver loop limit exceeded')
    )

    expect(criticalErrors).toEqual([])
  })

  test('Dashboard page should have zero console errors after navigation', async ({
    page,
  }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Test navigation sequence that might trigger portal/DOM issues
    await page.goto('/en', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    await page.goto('/en/pricing', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    await page.goto('/vi', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const criticalErrors = errors.filter(
      error => !error.includes('ResizeObserver loop limit exceeded')
    )

    expect(criticalErrors).toEqual([])
  })

  test('No Supabase GoTrueClient multiple instance warnings', async ({
    page,
  }) => {
    const warnings: string[] = []

    page.on('console', msg => {
      if (msg.text().includes('Multiple GoTrueClient instances detected')) {
        warnings.push(msg.text())
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000) // Give time for client initialization

    // Should have zero GoTrueClient warnings
    expect(warnings).toEqual([])
  })

  test('No removeChild DOM errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (
        msg.text().includes('removeChild') ||
        msg.text().includes('NotFoundError')
      ) {
        errors.push(msg.text())
      }
    })

    // Test portal-heavy interactions that might trigger removeChild errors
    await page.goto('/', { waitUntil: 'networkidle' })

    // Simulate rapid navigation that might trigger portal conflicts
    await page.goto('/en/pricing', { waitUntil: 'networkidle' })
    await page.goto('/vi', { waitUntil: 'networkidle' })

    await page.waitForTimeout(2000)

    // Should have zero removeChild errors
    expect(errors).toEqual([])
  })
})
