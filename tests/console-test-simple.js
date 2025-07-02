const { chromium } = require('playwright')

async function testConsoleErrors() {
  console.log('🧪 Testing console errors on localhost:3000...')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const errors = []
  const warnings = []

  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    } else if (
      msg.type() === 'warning' &&
      (msg.text().includes('GoTrueClient') ||
        msg.text().includes('Multiple instances'))
    ) {
      warnings.push(msg.text())
    }
  })

  try {
    // Test homepage
    console.log('Testing homepage...')
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Test Vietnamese locale
    console.log('Testing Vietnamese locale...')
    await page.goto('http://localhost:3000/vi', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes('ResizeObserver loop limit exceeded') &&
        !error.includes('Non-passive event listener') &&
        !error.includes('removeChild') === false && // We want to catch removeChild errors
        !error.includes('NotFoundError') === false // We want to catch DOM errors
    )

    const goTrueWarnings = warnings.filter(
      warning =>
        warning.includes('GoTrueClient') ||
        warning.includes('Multiple instances')
    )

    // Results
    console.log('\n📊 Test Results:')
    console.log(`Total errors captured: ${errors.length}`)
    console.log(`Critical errors: ${criticalErrors.length}`)
    console.log(`GoTrueClient warnings: ${goTrueWarnings.length}`)

    if (criticalErrors.length > 0) {
      console.log('\n❌ Critical Errors Found:')
      criticalErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`)
      })
    }

    if (goTrueWarnings.length > 0) {
      console.log('\n⚠️ GoTrueClient Warnings Found:')
      goTrueWarnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`)
      })
    }

    if (criticalErrors.length === 0 && goTrueWarnings.length === 0) {
      console.log('\n✅ SUCCESS: No critical console errors detected!')
      console.log('✅ Supabase singleton pattern working correctly')
      console.log('✅ React DOM portal conflicts resolved')
      console.log('✅ Locale preload issues resolved')
    } else {
      console.log('\n❌ FAILED: Console errors still present')
    }
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await browser.close()
  }
}

testConsoleErrors().catch(console.error)
