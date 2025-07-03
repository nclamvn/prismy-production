#!/usr/bin/env node

/**
 * 💪 OAUTH STRESS TEST SUITE
 * 
 * Test các trường hợp căng thẳng và edge cases cho OAuth pipeline:
 * - Concurrent login sessions
 * - Network interruption during OAuth
 * - Browser refresh during OAuth flow
 * - Multiple tabs authentication
 * - Session timeout scenarios
 * - Memory pressure testing
 */

const { chromium } = require('playwright');

class OAuthStressTestSuite {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3001';
    this.concurrentSessions = options.concurrentSessions || 5;
    this.results = [];
    this.browsers = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    console.log(`[${timestamp}] ${icons[type]} ${message}`);
  }

  async recordResult(testName, passed, duration, details = '', error = null) {
    const result = {
      test: testName,
      passed,
      duration,
      details,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    await this.log(`${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms) ${details}`, passed ? 'success' : 'error');
    
    if (error) {
      await this.log(`   Error: ${error.message}`, 'error');
    }
  }

  // Test 1: Concurrent Login Sessions
  async testConcurrentLogins() {
    const testName = 'Concurrent Login Sessions';
    const startTime = Date.now();
    
    try {
      await this.log('Testing concurrent login sessions...');
      
      const promises = [];
      
      for (let i = 0; i < this.concurrentSessions; i++) {
        promises.push(this.createConcurrentSession(i));
      }
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      const duration = Date.now() - startTime;
      const success = successful >= Math.floor(this.concurrentSessions * 0.8); // 80% success rate acceptable
      
      await this.recordResult(
        testName,
        success,
        duration,
        `${successful}/${this.concurrentSessions} sessions successful`
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Concurrent login test failed', error);
    }
  }

  async createConcurrentSession(sessionId) {
    const browser = await chromium.launch({ headless: true });
    this.browsers.push(browser);
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
      // Navigate and attempt login
      await page.goto(this.baseUrl);
      await page.waitForLoadState('networkidle');
      
      // Click sign in
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await page.waitForLoadState('networkidle');
      }
      
      // Simulate OAuth success
      await this.simulateOAuthSuccess(page);
      
      // Verify session
      await page.waitForTimeout(2000);
      const isAuthenticated = page.url().includes('/app') || await page.locator('[data-testid="workspace"]').isVisible();
      
      if (!isAuthenticated) {
        throw new Error(`Session ${sessionId} failed to authenticate`);
      }
      
      await this.log(`Session ${sessionId} successful`);
      return { sessionId, success: true };
      
    } catch (error) {
      await this.log(`Session ${sessionId} failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 2: Network Interruption During OAuth
  async testNetworkInterruption() {
    const testName = 'Network Interruption Recovery';
    const startTime = Date.now();
    
    try {
      await this.log('Testing network interruption during OAuth...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Start OAuth flow
      await page.goto(this.baseUrl);
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
      }
      
      // Simulate network interruption
      await page.route('**/*', route => {
        // Block requests for 3 seconds then allow
        setTimeout(() => {
          route.continue();
        }, 3000);
      });
      
      // Try to continue OAuth flow
      const googleButton = page.locator('button:has-text("Google")');
      if (await googleButton.isVisible()) {
        await googleButton.click();
      }
      
      // Remove network block
      await page.unroute('**/*');
      
      // Simulate successful OAuth after recovery
      await this.simulateOAuthSuccess(page);
      
      // Check recovery
      await page.waitForTimeout(5000);
      const recovered = page.url().includes('/app') || await page.locator('[data-testid="workspace"]').isVisible();
      
      const duration = Date.now() - startTime;
      await this.recordResult(
        testName,
        recovered,
        duration,
        recovered ? 'Successfully recovered from network interruption' : 'Failed to recover'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Network interruption test failed', error);
    }
  }

  // Test 3: Browser Refresh During OAuth
  async testBrowserRefreshDuringOAuth() {
    const testName = 'Browser Refresh During OAuth';
    const startTime = Date.now();
    
    try {
      await this.log('Testing browser refresh during OAuth flow...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Start OAuth flow
      await page.goto(this.baseUrl);
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await page.waitForLoadState('networkidle');
      }
      
      // Refresh browser during OAuth
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if we can recover and continue
      const canContinue = page.url().includes('/login') || await page.locator('button:has-text("Sign")').isVisible();
      
      if (canContinue) {
        // Try to complete OAuth flow after refresh
        await this.simulateOAuthSuccess(page);
        await page.waitForTimeout(3000);
      }
      
      const isAuthenticated = page.url().includes('/app');
      
      const duration = Date.now() - startTime;
      await this.recordResult(
        testName,
        isAuthenticated,
        duration,
        isAuthenticated ? 'Successfully handled browser refresh' : 'Failed to recover after refresh'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Browser refresh test failed', error);
    }
  }

  // Test 4: Multiple Tabs Authentication
  async testMultipleTabsAuth() {
    const testName = 'Multiple Tabs Authentication';
    const startTime = Date.now();
    
    try {
      await this.log('Testing multiple tabs authentication...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      
      // Create multiple tabs
      const pages = [];
      for (let i = 0; i < 3; i++) {
        const page = await context.newPage();
        pages.push(page);
        await page.goto(this.baseUrl);
      }
      
      // Authenticate in first tab
      const mainPage = pages[0];
      const signInButton = mainPage.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await this.simulateOAuthSuccess(mainPage);
      }
      
      // Wait for authentication
      await mainPage.waitForTimeout(3000);
      
      // Check if other tabs automatically get authenticated
      const results = [];
      for (let i = 1; i < pages.length; i++) {
        await pages[i].reload();
        await pages[i].waitForLoadState('networkidle');
        await pages[i].waitForTimeout(2000);
        
        const isAuth = pages[i].url().includes('/app') || await pages[i].locator('[data-testid="workspace"]').isVisible();
        results.push(isAuth);
      }
      
      const allTabsAuthenticated = results.every(r => r);
      
      const duration = Date.now() - startTime;
      await this.recordResult(
        testName,
        allTabsAuthenticated,
        duration,
        `${results.filter(r => r).length}/${results.length} tabs successfully authenticated`
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Multiple tabs test failed', error);
    }
  }

  // Test 5: Session Timeout Scenarios
  async testSessionTimeout() {
    const testName = 'Session Timeout Handling';
    const startTime = Date.now();
    
    try {
      await this.log('Testing session timeout scenarios...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Authenticate
      await page.goto(this.baseUrl);
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await this.simulateOAuthSuccess(page);
      }
      
      await page.waitForTimeout(3000);
      
      // Simulate session expiry by clearing tokens
      await page.evaluate(() => {
        // Clear all auth-related storage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      });
      
      // Clear auth cookies
      await context.clearCookies();
      
      // Try to access protected route
      await page.goto(`${this.baseUrl}/app`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Should be redirected to login
      const redirectedToLogin = page.url().includes('/login') || await page.locator('button:has-text("Sign")').isVisible();
      
      const duration = Date.now() - startTime;
      await this.recordResult(
        testName,
        redirectedToLogin,
        duration,
        redirectedToLogin ? 'Correctly handled session timeout' : 'Failed to handle session timeout'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Session timeout test failed', error);
    }
  }

  // Test 6: Memory Pressure Testing
  async testMemoryPressure() {
    const testName = 'Memory Pressure Resistance';
    const startTime = Date.now();
    
    try {
      await this.log('Testing memory pressure scenarios...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Navigate to app
      await page.goto(this.baseUrl);
      
      // Create memory pressure
      await page.evaluate(() => {
        // Create large objects to simulate memory pressure
        window.memoryPressureTest = [];
        for (let i = 0; i < 1000; i++) {
          window.memoryPressureTest.push(new Array(10000).fill('memory-test-data'));
        }
      });
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        } : null;
      });
      
      // Try OAuth flow under memory pressure
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await this.simulateOAuthSuccess(page);
      }
      
      await page.waitForTimeout(3000);
      
      // Check if authentication still works
      const isAuthenticated = page.url().includes('/app') || await page.locator('[data-testid="workspace"]').isVisible();
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        } : null;
      });
      
      let memoryDetails = '';
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        memoryDetails = ` Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`;
      }
      
      const duration = Date.now() - startTime;
      await this.recordResult(
        testName,
        isAuthenticated,
        duration,
        (isAuthenticated ? 'OAuth works under memory pressure' : 'OAuth failed under memory pressure') + memoryDetails
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Memory pressure test failed', error);
    }
  }

  async simulateOAuthSuccess(page) {
    // Mock successful OAuth callback
    await page.route('**/auth/callback*', route => {
      const url = new URL(route.request().url());
      url.searchParams.set('code', `mock_stress_test_${Date.now()}`);
      url.searchParams.set('state', 'mock_state');
      
      route.fulfill({
        status: 302,
        headers: { 'Location': `${this.baseUrl}/app` }
      });
    });
    
    // Click Google button if available
    const googleButton = page.locator('button:has-text("Google")');
    if (await googleButton.isVisible()) {
      await googleButton.click();
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('💪 OAUTH STRESS TEST SUITE REPORT');
    console.log('='.repeat(70));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    
    console.log(`\nTests Run: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Duration: ${Math.round(averageDuration)}ms`);
    
    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test} (${result.duration}ms)`);
      console.log(`   ${result.details}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const overallHealth = passedTests === totalTests ? 'EXCELLENT' :
                         passedTests >= totalTests * 0.8 ? 'ROBUST' :
                         passedTests >= totalTests * 0.6 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT';
    
    console.log(`\n🎯 Stress Resistance: ${overallHealth}`);
    console.log('\n' + '='.repeat(70));
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests/totalTests) * 100,
      averageDuration,
      overallHealth,
      results: this.results
    };
  }

  async cleanup() {
    await Promise.all(this.browsers.map(browser => browser.close()));
  }

  async run() {
    try {
      await this.log('💪 Starting OAuth Stress Test Suite...');
      
      // Run all stress tests
      await this.testConcurrentLogins();
      await this.testNetworkInterruption();
      await this.testBrowserRefreshDuringOAuth();
      await this.testMultipleTabsAuth();
      await this.testSessionTimeout();
      await this.testMemoryPressure();
      
      const report = this.generateReport();
      
      // Save results
      const fs = require('fs');
      fs.writeFileSync('stress-test-results.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        ...report
      }, null, 2));
      
      console.log('📄 Stress test results saved to: stress-test-results.json');
      
      return report;
      
    } catch (error) {
      await this.log(`Stress test suite failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  const concurrentSessions = parseInt(process.argv[3]) || 3;
  
  const tester = new OAuthStressTestSuite({ baseUrl, concurrentSessions });
  
  tester.run()
    .then(report => {
      process.exit(report.successRate >= 80 ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = OAuthStressTestSuite;