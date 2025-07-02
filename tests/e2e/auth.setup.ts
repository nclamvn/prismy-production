/**
 * Authentication Setup for E2E Tests
 * Sets up authenticated state for test sessions
 */

import { test as setup, expect } from '@playwright/test'
import { getTestConfig } from './config/test-config'

const testConfig = getTestConfig()
const authFile = 'tests/e2e/auth-state.json'

setup('authenticate', async ({ page }) => {
  console.log('🔐 Setting up authentication for E2E tests...')
  
  // Navigate to login page
  await page.goto(`${testConfig.baseUrl}/login`)
  
  // Check if we're already logged in (redirect to workspace)
  if (page.url().includes('/workspace')) {
    console.log('✅ Already authenticated, saving state...')
    await page.context().storageState({ path: authFile })
    return
  }
  
  // Look for login form
  const loginForm = await page.locator('form, [data-testid="login-form"]').isVisible({ timeout: 10000 }).catch(() => false)
  
  if (!loginForm) {
    console.log('ℹ️ No login form found, checking for other auth methods...')
    
    // Check for direct authentication button or auto-login
    const authButton = await page.locator('button:has-text("Continue"), button:has-text("Sign In"), [data-testid="auth-button"]').first().isVisible({ timeout: 5000 }).catch(() => false)
    
    if (authButton) {
      await page.locator('button:has-text("Continue"), button:has-text("Sign In"), [data-testid="auth-button"]').first().click()
      await page.waitForURL('**/workspace', { timeout: 30000 })
    } else {
      console.log('⚠️ No authentication method found, proceeding without auth')
      return
    }
  } else {
    // Fill login form
    console.log('📝 Filling login form...')
    
    // Try different possible selectors for email/username field
    const emailSelectors = [
      '[data-testid="email-input"]',
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="username" i]'
    ]
    
    let emailFilled = false
    for (const selector of emailSelectors) {
      try {
        const emailField = page.locator(selector).first()
        if (await emailField.isVisible({ timeout: 2000 })) {
          await emailField.fill(testConfig.testUser.email)
          emailFilled = true
          console.log(`✅ Email filled using selector: ${selector}`)
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!emailFilled) {
      throw new Error('Could not find email input field')
    }
    
    // Try different possible selectors for password field
    const passwordSelectors = [
      '[data-testid="password-input"]',
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]'
    ]
    
    let passwordFilled = false
    for (const selector of passwordSelectors) {
      try {
        const passwordField = page.locator(selector).first()
        if (await passwordField.isVisible({ timeout: 2000 })) {
          await passwordField.fill(testConfig.testUser.password)
          passwordFilled = true
          console.log(`✅ Password filled using selector: ${selector}`)
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!passwordFilled) {
      throw new Error('Could not find password input field')
    }
    
    // Submit form
    const submitSelectors = [
      '[data-testid="login-button"]',
      'button[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'button:has-text("Submit")'
    ]
    
    let submitted = false
    for (const selector of submitSelectors) {
      try {
        const submitButton = page.locator(selector).first()
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click()
          submitted = true
          console.log(`✅ Form submitted using selector: ${selector}`)
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!submitted) {
      // Try pressing Enter as fallback
      await page.keyboard.press('Enter')
      console.log('✅ Form submitted using Enter key')
    }
    
    // Wait for navigation to workspace
    try {
      await page.waitForURL('**/workspace', { timeout: 30000 })
    } catch (e) {
      // Check if we're on a different success page
      const currentUrl = page.url()
      if (currentUrl.includes('/app') || currentUrl.includes('/dashboard') || currentUrl.includes('/workspace')) {
        console.log(`✅ Authentication successful, redirected to: ${currentUrl}`)
      } else {
        throw new Error(`Authentication failed, current URL: ${currentUrl}`)
      }
    }
  }
  
  // Verify we're logged in by checking for workspace elements
  const workspaceIndicators = [
    '[data-testid="workspace-canvas"]',
    '[data-testid="side-nav"]',
    '[data-testid="top-bar"]',
    '.workspace-layout',
    '.workspace-canvas'
  ]
  
  let workspaceFound = false
  for (const selector of workspaceIndicators) {
    if (await page.locator(selector).isVisible({ timeout: 5000 }).catch(() => false)) {
      workspaceFound = true
      console.log(`✅ Workspace verified using: ${selector}`)
      break
    }
  }
  
  if (!workspaceFound) {
    console.warn('⚠️ Could not verify workspace UI, but proceeding with authentication save')
  }
  
  // Save authentication state
  await page.context().storageState({ path: authFile })
  console.log('💾 Authentication state saved successfully')
})