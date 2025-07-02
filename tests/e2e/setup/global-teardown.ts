/**
 * Global Teardown for E2E Tests
 * Cleans up test environment and removes temporary data
 */

import fs from 'fs'
import path from 'path'
import { getTestConfig } from '../config/test-config'

async function globalTeardown() {
  const testConfig = getTestConfig()
  
  console.log('🧹 Starting E2E test environment cleanup...')
  
  // Clean up temporary files
  if (fs.existsSync(testConfig.tempDir)) {
    try {
      fs.rmSync(testConfig.tempDir, { recursive: true, force: true })
      console.log(`🗑️ Cleaned up temp directory: ${testConfig.tempDir}`)
    } catch (error) {
      console.warn(`⚠️ Failed to clean temp directory: ${error}`)
    }
  }
  
  // Clean up auth state
  const authStatePath = 'tests/e2e/auth-state.json'
  if (fs.existsSync(authStatePath)) {
    try {
      fs.unlinkSync(authStatePath)
      console.log('🔐 Cleaned up authentication state')
    } catch (error) {
      console.warn(`⚠️ Failed to clean auth state: ${error}`)
    }
  }
  
  // Archive test results if in CI
  if (process.env.CI) {
    try {
      const resultsDir = 'test-results'
      const archiveDir = `test-results-${Date.now()}`
      
      if (fs.existsSync(resultsDir)) {
        fs.renameSync(resultsDir, archiveDir)
        console.log(`📦 Archived test results to: ${archiveDir}`)
      }
    } catch (error) {
      console.warn(`⚠️ Failed to archive test results: ${error}`)
    }
  }
  
  // Generate test summary
  generateTestSummary()
  
  console.log('✅ E2E test environment cleanup complete!')
}

function generateTestSummary() {
  try {
    const resultsFile = 'test-results/results.json'
    
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'))
      
      const summary = {
        timestamp: new Date().toISOString(),
        total: results.suites?.reduce((total: number, suite: any) => total + suite.specs?.length || 0, 0) || 0,
        passed: results.suites?.reduce((total: number, suite: any) => 
          total + (suite.specs?.filter((spec: any) => spec.tests?.[0]?.results?.[0]?.status === 'passed').length || 0), 0) || 0,
        failed: results.suites?.reduce((total: number, suite: any) => 
          total + (suite.specs?.filter((spec: any) => spec.tests?.[0]?.results?.[0]?.status === 'failed').length || 0), 0) || 0,
        duration: results.stats?.duration || 0,
        environment: process.env.NODE_ENV || 'development',
        baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
      }
      
      fs.writeFileSync('test-results/summary.json', JSON.stringify(summary, null, 2))
      
      console.log('📊 Test Summary:')
      console.log(`   Total: ${summary.total}`)
      console.log(`   Passed: ${summary.passed}`)
      console.log(`   Failed: ${summary.failed}`)
      console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`)
    }
  } catch (error) {
    console.warn('⚠️ Failed to generate test summary:', error)
  }
}

export default globalTeardown