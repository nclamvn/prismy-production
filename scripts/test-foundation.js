#!/usr/bin/env node

/**
 * PRISMY FOUNDATION TEST SCRIPT
 * Tests critical foundation components to ensure they're working
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

function success(message) {
  log(colors.green + colors.bold, `✅ ${message}`)
}

function error(message) {
  log(colors.red + colors.bold, `❌ ${message}`)
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`)
}

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`)
}

async function testSupabaseConnection() {
  try {
    info('Testing Supabase connection...')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      error('Supabase URL is missing or contains placeholder')
      return false
    }

    if (!supabaseKey || supabaseKey.includes('placeholder')) {
      error('Supabase anon key is missing or contains placeholder')
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection with a simple query
    const { data, error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (
      dbError &&
      !dbError.message.includes('relation "user_profiles" does not exist')
    ) {
      error(`Supabase connection failed: ${dbError.message}`)
      return false
    }

    success('Supabase connection successful')
    return true
  } catch (err) {
    error(`Supabase connection failed: ${err.message}`)
    return false
  }
}

async function testGoogleTranslateAPI() {
  try {
    info('Testing Google Translate API configuration...')

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY

    if (!projectId || projectId === 'your-project-id') {
      warning('Google Cloud Project ID is missing or contains placeholder')
      return false
    }

    if (!apiKey || apiKey.length < 30) {
      warning('Google Translate API key appears to be missing or invalid')
      return false
    }

    // Test API with a simple request
    const testText = 'Hello world'
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: testText,
          target: 'vi',
          format: 'text',
        }),
      }
    )

    if (!response.ok) {
      if (response.status === 403) {
        warning(
          'Google Translate API key appears to be invalid or not authorized'
        )
      } else {
        warning(
          `Google Translate API test failed with status: ${response.status}`
        )
      }
      return false
    }

    const result = await response.json()
    if (result.data && result.data.translations) {
      success('Google Translate API is working correctly')
      return true
    } else {
      warning('Google Translate API returned unexpected response')
      return false
    }
  } catch (err) {
    warning(`Google Translate API test failed: ${err.message}`)
    return false
  }
}

async function testEnvironmentVariables() {
  info('Testing environment variables...')

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const optionalVars = [
    'GOOGLE_TRANSLATE_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ]

  let allRequiredPresent = true

  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value || value.includes('placeholder') || value.includes('your-')) {
      error(
        `Required environment variable ${varName} is missing or contains placeholder`
      )
      allRequiredPresent = false
    } else {
      success(`${varName} is configured`)
    }
  }

  for (const varName of optionalVars) {
    const value = process.env[varName]
    if (!value || value.includes('placeholder') || value.includes('your-')) {
      warning(
        `Optional environment variable ${varName} is missing or contains placeholder`
      )
    } else {
      success(`${varName} is configured`)
    }
  }

  return allRequiredPresent
}

async function testNextJsConfiguration() {
  try {
    info('Testing Next.js configuration...')

    // Check if we can access the Next.js config
    const fs = require('fs')
    const path = require('path')

    const configPath = path.join(process.cwd(), 'next.config.js')
    if (!fs.existsSync(configPath)) {
      warning('next.config.js not found')
      return false
    }

    // Check if package.json has required dependencies
    const packagePath = path.join(process.cwd(), 'package.json')
    if (!fs.existsSync(packagePath)) {
      error('package.json not found')
      return false
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    const requiredDeps = [
      'next',
      'react',
      '@supabase/supabase-js',
      'tailwindcss',
    ]

    for (const dep of requiredDeps) {
      if (!dependencies[dep]) {
        error(`Required dependency ${dep} is missing`)
        return false
      }
    }

    success('Next.js configuration looks good')
    return true
  } catch (err) {
    error(`Next.js configuration test failed: ${err.message}`)
    return false
  }
}

async function testDirectoryStructure() {
  try {
    info('Testing directory structure...')

    const fs = require('fs')
    const path = require('path')

    const requiredDirs = ['app', 'components', 'lib', 'public']

    const requiredFiles = [
      'app/layout.tsx',
      'app/page.tsx',
      'lib/supabase.ts',
      'components/ui',
      'tailwind.config.js',
    ]

    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir)
      if (!fs.existsSync(dirPath)) {
        error(`Required directory ${dir} is missing`)
        return false
      }
    }

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file)
      if (!fs.existsSync(filePath)) {
        warning(`Expected file/directory ${file} is missing`)
      }
    }

    success('Directory structure looks good')
    return true
  } catch (err) {
    error(`Directory structure test failed: ${err.message}`)
    return false
  }
}

async function runFoundationTests() {
  console.log('')
  log(colors.blue + colors.bold, '🔧 PRISMY FOUNDATION TEST SUITE')
  log(colors.blue + colors.bold, '================================')
  console.log('')

  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Directory Structure', fn: testDirectoryStructure },
    { name: 'Next.js Configuration', fn: testNextJsConfiguration },
    { name: 'Supabase Connection', fn: testSupabaseConnection },
    { name: 'Google Translate API', fn: testGoogleTranslateAPI },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    console.log('')
    log(colors.blue, `Running test: ${test.name}`)
    console.log('─'.repeat(50))

    try {
      const result = await test.fn()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (err) {
      error(`Test ${test.name} threw an error: ${err.message}`)
      failed++
    }
  }

  console.log('')
  console.log('='.repeat(50))
  log(colors.bold, `Foundation Test Results:`)
  success(`${passed} tests passed`)
  if (failed > 0) {
    error(`${failed} tests failed`)
  }

  if (failed === 0) {
    console.log('')
    success(
      '🎉 All foundation tests passed! Your Prismy installation is ready.'
    )
  } else {
    console.log('')
    warning(
      '⚠️  Some tests failed. Check the issues above and fix them before proceeding.'
    )
  }

  console.log('')

  return failed === 0
}

// Run tests if this script is executed directly
if (require.main === module) {
  runFoundationTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(err => {
      error(`Test suite failed: ${err.message}`)
      process.exit(1)
    })
}

module.exports = { runFoundationTests }
