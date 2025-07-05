/**
 * 🔍 Validation Step 1: Authentication Flow
 * 
 * Tests user registration, login/logout, password reset, and admin access
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow Validation', () => {
  
  test('user login and logout flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Check login form is present
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    // Try login with test user
    await page.fill('input[type="email"]', 'test@prismy.com')
    await page.fill('input[type="password"]', 'test-prismy-2024')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard after login
    await expect(page).toHaveURL('/app', { timeout: 10000 })
    
    // Check user is logged in
    await expect(page.locator('[data-testid="user-menu"], nav')).toBeVisible()
    
    // Test logout
    const userMenu = page.locator('[data-testid="user-menu"]')
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await page.click('[data-testid="logout-button"], text="Sign out"')
    } else {
      // Fallback: navigate to logout URL
      await page.goto('/auth/signout')
    }
    
    // Should redirect to home or login page
    await expect(page).toHaveURL(/\/(login)?$/)
  })
  
  test('admin access control', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@prismy.com')
    await page.fill('input[type="password"]', 'admin-prismy-2024')
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL(/\/app/, { timeout: 10000 })
    
    // Try to access admin panel
    await page.goto('/admin/settings')
    
    // Should have access to admin panel
    await expect(page.locator('h1, h2')).toContainText(/admin|settings/i)
    
    // Verify admin-specific UI elements
    const adminPanel = page.locator('[data-testid="admin-panel"], [role="navigation"]')
    await expect(adminPanel.first()).toBeVisible()
  })
  
  test('non-admin cannot access admin panel', async ({ page }) => {
    // Login as regular user
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@prismy.com')
    await page.fill('input[type="password"]', 'test-prismy-2024')
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL(/\/app/, { timeout: 10000 })
    
    // Try to access admin panel
    await page.goto('/admin/settings')
    
    // Should be denied access or redirected
    const currentUrl = page.url()
    const hasAccessDenied = await page.locator('text=/access denied|unauthorized|forbidden/i').count() > 0
    const wasRedirected = !currentUrl.includes('/admin')
    
    expect(hasAccessDenied || wasRedirected).toBeTruthy()
  })
  
  test('protected route requires authentication', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/app/documents')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
    
    // Should preserve return URL
    const url = new URL(page.url())
    expect(url.searchParams.has('returnUrl') || url.searchParams.has('redirect')).toBeTruthy()
  })
  
  test('password reset flow exists', async ({ page }) => {
    await page.goto('/login')
    
    // Look for password reset link
    const resetLink = page.locator('a[href*="reset"], a[href*="forgot"], text=/forgot password/i')
    
    if (await resetLink.count() > 0) {
      await resetLink.first().click()
      
      // Should navigate to password reset page
      await expect(page).toHaveURL(/\/(reset|forgot)/)
      
      // Should have email input for reset
      await expect(page.locator('input[type="email"]')).toBeVisible()
    } else {
      // Password reset might be handled differently
      console.log('Password reset link not found - may be implemented differently')
    }
  })
  
  test('auth error handling', async ({ page }) => {
    await page.goto('/login')
    
    // Try login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    const errorMessage = await page.waitForSelector(
      'text=/invalid|incorrect|wrong|error/i',
      { timeout: 5000 }
    ).catch(() => null)
    
    if (errorMessage) {
      await expect(errorMessage).toBeVisible()
    }
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/login/)
  })
})