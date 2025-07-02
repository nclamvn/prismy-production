/**
 * Playwright Global Setup
 * Configures Vietnamese test environment and authentication
 */

import { chromium, FullConfig } from '@playwright/test'
import path from 'path'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up Prismy E2E test environment...')

  // Create test results directory
  const testResultsDir = path.join(process.cwd(), 'test-results')
  const { mkdir } = await import('fs/promises')

  try {
    await mkdir(testResultsDir, { recursive: true })
    await mkdir(path.join(testResultsDir, 'screenshots'), { recursive: true })
    await mkdir(path.join(testResultsDir, 'videos'), { recursive: true })
    await mkdir(path.join(testResultsDir, 'traces'), { recursive: true })
  } catch (error) {
    // Directory might already exist
  }

  const { baseURL } = config.projects[0].use

  if (!baseURL) {
    throw new Error('Base URL not configured')
  }

  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the application to be ready
    console.log(`📡 Waiting for application at ${baseURL}...`)

    let retries = 10
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL, {
          waitUntil: 'networkidle',
          timeout: 10000,
        })

        if (response && response.status() === 200) {
          console.log('✅ Application is ready')
          break
        }
      } catch (error) {
        retries--
        if (retries === 0) {
          throw new Error(`Application not ready after 10 attempts: ${error}`)
        }
        console.log(`⏳ Retrying... (${retries} attempts left)`)
        await page.waitForTimeout(3000)
      }
    }

    // Verify Vietnamese localization is available
    console.log('🇻🇳 Checking Vietnamese localization...')

    // Check for Vietnamese elements on homepage
    try {
      await page.waitForSelector(
        'html[lang*="vi"], [lang="vi-VN"], [data-locale="vi"]',
        {
          timeout: 5000,
        }
      )
      console.log('✅ Vietnamese localization detected')
    } catch (error) {
      console.log('⚠️ Vietnamese localization not detected on homepage')
    }

    // Pre-warm critical API endpoints
    console.log('🔥 Pre-warming API endpoints...')

    const criticalEndpoints = [
      '/api/health',
      '/api/auth/csrf',
      '/api/translation/health',
    ]

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await page.request.get(`${baseURL}${endpoint}`)
        if (response.ok()) {
          console.log(`✅ ${endpoint} - OK`)
        } else {
          console.log(`⚠️ ${endpoint} - ${response.status()}`)
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Failed: ${error}`)
      }
    }

    // Setup test user authentication state (if needed)
    console.log('👤 Setting up test authentication...')

    // Store authentication state for tests
    const storageStatePath = path.join(testResultsDir, 'auth-state.json')

    // Note: In a real scenario, you would authenticate with test credentials here
    // For now, we'll create a basic state file
    await page.context().storageState({ path: storageStatePath })

    console.log(`💾 Authentication state saved to ${storageStatePath}`)
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }

  console.log('✅ Global setup completed successfully')
}

export default globalSetup
