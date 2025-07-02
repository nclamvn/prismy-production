import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...')

  const { baseURL } = config.projects[0].use

  // Skip teardown in CI to preserve data for debugging
  if (process.env.CI && process.env.PRESERVE_TEST_DATA === 'true') {
    console.log('ℹ️ Skipping teardown in CI mode')
    return
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Load the authenticated state
    const storageStatePath = 'tests/e2e/.auth/user.json'
    await page.context().addInitScript(() => {
      // Load storage state
    })

    await page.goto(baseURL || 'http://localhost:3000')

    // Clean up test data
    await cleanupTestData(page)
  } catch (error) {
    console.warn('⚠️ Teardown failed (continuing anyway):', error)
  } finally {
    await browser.close()
  }

  console.log('✅ Global teardown completed')
}

async function cleanupTestData(page: any) {
  console.log('🗑️ Cleaning up test data...')

  try {
    // Navigate to dashboard
    await page.goto('/dashboard')

    // Clean up test projects
    await cleanupTestProjects(page)

    // Clean up test translations
    await cleanupTestTranslations(page)

    // Clean up test files
    await cleanupTestFiles(page)
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error)
  }
}

async function cleanupTestProjects(page: any) {
  try {
    await page.goto('/dashboard/projects')

    // Find and delete test projects
    const testProjects = await page
      .locator('[data-testid="project-item"]')
      .filter({
        hasText: /E2E Test|Test Project/i,
      })

    const count = await testProjects.count()

    for (let i = 0; i < count; i++) {
      const project = testProjects.nth(i)

      // Click project options menu
      await project.locator('[data-testid="project-options"]').click()

      // Click delete option
      await page.locator('[data-testid="delete-project"]').click()

      // Confirm deletion
      await page.locator('[data-testid="confirm-delete"]').click()

      // Wait for deletion to complete
      await page.waitForTimeout(1000)
    }

    if (count > 0) {
      console.log(`✅ Cleaned up ${count} test projects`)
    }
  } catch (error) {
    console.warn('⚠️ Project cleanup failed:', error)
  }
}

async function cleanupTestTranslations(page: any) {
  try {
    await page.goto('/dashboard/translate')

    // Find and delete test translations
    const testTranslations = await page
      .locator('[data-testid="translation-item"]')
      .filter({
        hasText: /test translation|hello.*world/i,
      })

    const count = await testTranslations.count()

    for (let i = 0; i < count; i++) {
      const translation = testTranslations.nth(i)

      // Select translation
      await translation.locator('[data-testid="translation-checkbox"]').check()
    }

    if (count > 0) {
      // Bulk delete selected translations
      await page.locator('[data-testid="bulk-delete-button"]').click()
      await page.locator('[data-testid="confirm-bulk-delete"]').click()

      console.log(`✅ Cleaned up ${count} test translations`)
    }
  } catch (error) {
    console.warn('⚠️ Translation cleanup failed:', error)
  }
}

async function cleanupTestFiles(page: any) {
  try {
    await page.goto('/dashboard/files')

    // Find and delete test files
    const testFiles = await page.locator('[data-testid="file-item"]').filter({
      hasText: /test.*file|e2e.*test/i,
    })

    const count = await testFiles.count()

    for (let i = 0; i < count; i++) {
      const file = testFiles.nth(i)

      // Click file options
      await file.locator('[data-testid="file-options"]').click()

      // Delete file
      await page.locator('[data-testid="delete-file"]').click()
      await page.locator('[data-testid="confirm-delete-file"]').click()

      await page.waitForTimeout(500)
    }

    if (count > 0) {
      console.log(`✅ Cleaned up ${count} test files`)
    }
  } catch (error) {
    console.warn('⚠️ File cleanup failed:', error)
  }
}

export default globalTeardown
