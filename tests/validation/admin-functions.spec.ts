/**
 * 🔍 Validation Step 3: Admin Functions
 * 
 * Tests admin panel access, settings management, and system metrics
 */

import { test, expect } from '@playwright/test'
import { loginUser } from '../utils/test-helpers'

test.describe('Admin Functions Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@prismy.com')
    await page.fill('input[type="password"]', 'admin-prismy-2024')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/app/, { timeout: 10000 })
  })
  
  test('admin panel access and navigation', async ({ page }) => {
    // Navigate to admin panel
    await page.goto('/admin/settings')
    
    // Verify admin panel loaded
    await expect(page.locator('h1, h2')).toContainText(/admin|settings/i)
    
    // Check for admin navigation menu
    const adminNav = page.locator('nav:has-text("Admin"), [data-testid="admin-nav"]')
    if (await adminNav.isVisible()) {
      // Check for key admin sections
      const sections = ['Settings', 'Users', 'System', 'Metrics']
      for (const section of sections) {
        const sectionLink = adminNav.locator(`text=/${section}/i`)
        if (await sectionLink.count() > 0) {
          console.log(`Found admin section: ${section}`)
        }
      }
    }
  })
  
  test('settings management interface', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // Look for settings categories
    const settingTabs = [
      'Upload',
      'Translation',
      'OCR',
      'Features',
      'System'
    ]
    
    for (const tab of settingTabs) {
      const tabElement = page.locator(`[role="tab"]:has-text("${tab}"), button:has-text("${tab}")`)
      if (await tabElement.count() > 0) {
        await tabElement.first().click()
        await page.waitForTimeout(500) // Wait for tab content
        
        // Verify settings controls are visible
        const controls = await page.locator('input, select, [role="switch"]').count()
        expect(controls).toBeGreaterThan(0)
      }
    }
    
    // Test save functionality
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")')
    if (await saveButton.isVisible()) {
      // Make a harmless change
      const firstSwitch = page.locator('[role="switch"]').first()
      if (await firstSwitch.isVisible()) {
        await firstSwitch.click()
        await saveButton.click()
        
        // Check for success message
        await expect(page.locator('text=/saved|updated|success/i')).toBeVisible()
      }
    }
  })
  
  test('user management capabilities', async ({ page }) => {
    // Try to navigate to users section
    const usersLink = page.locator('a:has-text("Users"), nav >> text=Users')
    
    if (await usersLink.count() > 0) {
      await usersLink.first().click()
    } else {
      await page.goto('/admin/users')
    }
    
    // Check if we can see users list
    const usersTable = page.locator('table, [role="table"], .users-list')
    const usersList = page.locator('[data-testid="users-list"], .user-item')
    
    if (await usersTable.isVisible() || await usersList.isVisible()) {
      // Should see at least admin and test users
      await expect(page.locator('text=admin@prismy.com')).toBeVisible()
      
      // Check for user management actions
      const actions = ['Edit', 'Delete', 'Disable', 'Role']
      for (const action of actions) {
        const actionElements = await page.locator(`button:has-text("${action}")`).count()
        if (actionElements > 0) {
          console.log(`User management action available: ${action}`)
        }
      }
    } else {
      console.log('User management UI not found - may be limited in MVP')
    }
  })
  
  test('system metrics view', async ({ page }) => {
    // Navigate to metrics/dashboard
    const metricsLink = page.locator('a:has-text("Metrics"), a:has-text("Dashboard"), nav >> text=/metrics|dashboard/i')
    
    if (await metricsLink.count() > 0) {
      await metricsLink.first().click()
    } else {
      await page.goto('/admin/dashboard')
    }
    
    // Look for metric displays
    const metricLabels = [
      'Total Users',
      'Documents',
      'Translations',
      'Storage',
      'Active',
      'Queue',
      'Usage'
    ]
    
    let foundMetrics = 0
    for (const label of metricLabels) {
      const metric = page.locator(`text=/${label}/i`)
      if (await metric.count() > 0) {
        foundMetrics++
        
        // Check if there's a value associated
        const parent = metric.first().locator('..')
        const value = await parent.locator('[class*="text-2xl"], [class*="text-3xl"], .metric-value').textContent()
        if (value) {
          console.log(`${label}: ${value}`)
        }
      }
    }
    
    expect(foundMetrics).toBeGreaterThan(0)
  })
  
  test('feature flags management', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // Look for features tab
    const featuresTab = page.locator('[role="tab"]:has-text("Features"), button:has-text("Features")')
    if (await featuresTab.isVisible()) {
      await featuresTab.click()
      
      // Check for MVP mode toggle
      const mvpToggle = page.locator('text=/MVP Mode/i').locator('..')
        .locator('[role="switch"], input[type="checkbox"]')
      
      if (await mvpToggle.isVisible()) {
        const isEnabled = await mvpToggle.isChecked()
        console.log(`MVP Mode: ${isEnabled ? 'Enabled' : 'Disabled'}`)
        expect(isEnabled).toBeTruthy() // Should be enabled in production
      }
      
      // Check for other feature flags
      const features = [
        'Large Uploads',
        'OCR Queue',
        'Real Translation',
        'Error Tracking'
      ]
      
      for (const feature of features) {
        const toggle = page.locator(`text=/${feature}/i`).locator('..')
          .locator('[role="switch"], input[type="checkbox"]')
        
        if (await toggle.count() > 0) {
          const isEnabled = await toggle.first().isChecked()
          console.log(`${feature}: ${isEnabled ? 'Enabled' : 'Disabled'}`)
        }
      }
    }
  })
  
  test('admin activity logging', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // Make a change
    const firstToggle = page.locator('[role="switch"]').first()
    if (await firstToggle.isVisible()) {
      const initialState = await firstToggle.getAttribute('aria-checked')
      await firstToggle.click()
      
      // Save the change
      const saveButton = page.locator('button:has-text("Save")')
      if (await saveButton.isVisible()) {
        await saveButton.click()
        await page.waitForSelector('text=/saved|success/i')
      }
      
      // Check if there's an activity log or audit trail
      const activityLink = page.locator('a:has-text("Activity"), a:has-text("Logs"), text=/activity|audit/i')
      if (await activityLink.count() > 0) {
        await activityLink.first().click()
        
        // Should see recent activity
        await expect(page.locator('text=/settings.*updated|changed/i')).toBeVisible()
      }
    }
  })
})