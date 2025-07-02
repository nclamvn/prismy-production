/**
 * Global Setup for E2E Tests
 * Prepares test environment and creates necessary test data
 */

import { chromium, FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { getTestConfig } from '../config/test-config'

async function globalSetup(config: FullConfig) {
  const testConfig = getTestConfig()
  
  console.log('🚀 Starting E2E test environment setup...')
  
  // Create necessary directories
  const directories = [
    testConfig.testDataDir,
    testConfig.tempDir,
    testConfig.outputDir,
    'test-results',
  ]
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 Created directory: ${dir}`)
    }
  }
  
  // Set up test user authentication
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('🔐 Setting up test user authentication...')
    
    // Navigate to login page
    await page.goto(`${testConfig.baseUrl}/login`)
    
    // Check if login form exists
    const loginForm = await page.locator('[data-testid="login-form"]').isVisible().catch(() => false)
    
    if (loginForm) {
      // Fill in credentials
      await page.fill('[data-testid="email-input"]', testConfig.testUser.email)
      await page.fill('[data-testid="password-input"]', testConfig.testUser.password)
      await page.click('[data-testid="login-button"]')
      
      // Wait for successful login
      await page.waitForURL('**/workspace', { timeout: 30000 })
      
      // Save authentication state
      await page.context().storageState({ path: 'tests/e2e/auth-state.json' })
      console.log('✅ Test user authentication saved')
    } else {
      console.log('ℹ️ No login form found, proceeding without authentication setup')
    }
    
  } catch (error) {
    console.warn('⚠️ Authentication setup failed:', error)
    // Continue with tests even if auth setup fails
  } finally {
    await browser.close()
  }
  
  // Generate test files if needed
  console.log('📄 Generating test files...')
  generateTestFiles(testConfig.testDataDir)
  
  // Verify API endpoints are accessible
  console.log('🔍 Verifying API endpoints...')
  await verifyApiEndpoints(testConfig)
  
  console.log('✅ E2E test environment setup complete!')
}

function generateTestFiles(testDataDir: string) {
  const testFiles = [
    {
      name: 'sample-small.txt',
      content: 'This is a small test file for quick testing.\n'.repeat(100),
      size: 'small'
    },
    {
      name: 'sample-medium.txt', 
      content: 'This is a medium test file for standard testing.\n'.repeat(10000),
      size: 'medium'
    },
    {
      name: 'multilingual.txt',
      content: `
English: This document contains multiple languages for translation testing.
Vietnamese: Tài liệu này chứa nhiều ngôn ngữ để thử nghiệm dịch thuật.
Japanese: この文書には翻訳テスト用の複数の言語が含まれています。
Chinese: 本文档包含多种语言，用于翻译测试。
French: Ce document contient plusieurs langues pour les tests de traduction.
German: Dieses Dokument enthält mehrere Sprachen zum Testen von Übersetzungen.
Spanish: Este documento contiene varios idiomas para pruebas de traducción.
`,
      size: 'small'
    }
  ]
  
  for (const file of testFiles) {
    const filePath = path.join(testDataDir, file.name)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, file.content)
      console.log(`📝 Generated test file: ${file.name} (${file.size})`)
    }
  }
}

async function verifyApiEndpoints(testConfig: any) {
  const endpoints = [
    '/api/health',
    '/api/upload/init',
    '/api/jobs/queue',
    '/api/batch'
  ]
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${testConfig.apiUrl}${endpoint}`, {
        method: endpoint === '/api/health' ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok || response.status === 401) { // 401 is expected for authenticated endpoints
        console.log(`✅ API endpoint accessible: ${endpoint}`)
      } else {
        console.warn(`⚠️ API endpoint issue: ${endpoint} - Status: ${response.status}`)
      }
    } catch (error) {
      console.warn(`⚠️ API endpoint error: ${endpoint} - ${error}`)
    }
  }
}

export default globalSetup