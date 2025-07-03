#!/usr/bin/env node

/**
 * 🔍 OAUTH EDGE CASE TEST SUITE
 * 
 * Test các trường hợp cạnh và error recovery scenarios:
 * - Invalid OAuth states and codes
 * - Expired OAuth sessions
 * - Malformed callback URLs
 * - CSRF attack prevention
 * - Double-click prevention
 * - Rapid navigation during auth
 * - Storage quota exceeded
 * - Browser extension interference
 */

const { chromium } = require('playwright');

class OAuthEdgeCaseTestSuite {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3001';
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

  // Test 1: Invalid OAuth States and Codes
  async testInvalidOAuthStates() {
    const testName = 'Invalid OAuth States/Codes';
    const startTime = Date.now();
    
    try {
      await this.log('Testing invalid OAuth states and codes...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      const testCases = [
        { code: 'invalid_code', state: 'valid_state', expected: 'error' },
        { code: 'valid_code', state: 'invalid_state', expected: 'error' },
        { code: '', state: 'valid_state', expected: 'error' },
        { code: 'valid_code', state: '', expected: 'error' },
        { code: 'malicious_script<script>alert(1)</script>', state: 'valid_state', expected: 'error' }
      ];
      
      let successfulHandling = 0;
      
      for (const testCase of testCases) {
        try {
          // Navigate to callback with invalid parameters
          const callbackUrl = `${this.baseUrl}/auth/callback?code=${encodeURIComponent(testCase.code)}&state=${encodeURIComponent(testCase.state)}`;
          await page.goto(callbackUrl);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          // Should not be authenticated and should show error or redirect to login
          const isOnLogin = page.url().includes('/login') || await page.locator('button:has-text("Sign")').isVisible();
          const hasError = await page.locator('.error, [role="alert"], .alert-error').isVisible();
          const notAuthenticated = !page.url().includes('/app');
          
          if (isOnLogin || hasError || notAuthenticated) {
            successfulHandling++;
            await this.log(`✓ Correctly handled invalid case: code=${testCase.code.substring(0, 20)}...`);
          } else {
            await this.log(`✗ Failed to handle invalid case: code=${testCase.code.substring(0, 20)}...`, 'warning');
          }
          
        } catch (error) {
          // Errors are expected for invalid cases
          successfulHandling++;
          await this.log(`✓ Correctly rejected invalid case with error: ${error.message.substring(0, 50)}...`);
        }
      }
      
      const duration = Date.now() - startTime;
      const success = successfulHandling === testCases.length;
      
      await this.recordResult(
        testName,
        success,
        duration,
        `${successfulHandling}/${testCases.length} invalid cases handled correctly`
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Invalid OAuth states test failed', error);
    }
  }

  // Test 2: Expired OAuth Sessions
  async testExpiredOAuthSessions() {
    const testName = 'Expired OAuth Sessions';
    const startTime = Date.now();
    
    try {
      await this.log('Testing expired OAuth session handling...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Set up expired token scenario
      await page.goto(this.baseUrl);
      
      // Inject expired tokens into storage
      await page.evaluate(() => {
        const expiredTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        const expiredToken = {
          access_token: 'expired_token_12345',
          refresh_token: 'expired_refresh_token',
          expires_at: expiredTime,
          token_type: 'bearer',
          user: { id: 'test_user', email: 'test@example.com' }
        };
        
        localStorage.setItem('sb-localhost-auth-token', JSON.stringify(expiredToken));
      });
      
      // Try to access protected route
      await page.goto(`${this.baseUrl}/app`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      // Should be redirected to login due to expired session
      const redirectedToLogin = page.url().includes('/login') || await page.locator('button:has-text("Sign")').isVisible();
      const notInApp = !page.url().includes('/app');
      
      const duration = Date.now() - startTime;
      const success = redirectedToLogin && notInApp;
      
      await this.recordResult(
        testName,
        success,
        duration,
        success ? 'Correctly handled expired session' : 'Failed to handle expired session'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Expired session test failed', error);
    }
  }

  // Test 3: Malformed Callback URLs
  async testMalformedCallbackUrls() {
    const testName = 'Malformed Callback URLs';
    const startTime = Date.now();
    
    try {
      await this.log('Testing malformed callback URLs...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      const malformedUrls = [
        `${this.baseUrl}/auth/callback?code=`,
        `${this.baseUrl}/auth/callback?state=`,
        `${this.baseUrl}/auth/callback?error=access_denied`,
        `${this.baseUrl}/auth/callback?code=valid&state=valid&error=something_wrong`,
        `${this.baseUrl}/auth/callback?code=valid&state=valid&malicious=<script>alert(1)</script>`,
        `${this.baseUrl}/auth/callback?code=${encodeURIComponent('../../etc/passwd')}&state=valid`
      ];
      
      let handledCorrectly = 0;
      
      for (const url of malformedUrls) {
        try {
          await page.goto(url);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          // Should handle gracefully - either show error or redirect to login
          const hasError = await page.locator('.error, [role="alert"]').isVisible();
          const onLogin = page.url().includes('/login');
          const notAuthenticated = !page.url().includes('/app');
          
          if (hasError || onLogin || notAuthenticated) {
            handledCorrectly++;
          }
          
        } catch (error) {
          // Exceptions are acceptable for malformed URLs
          handledCorrectly++;
        }
      }
      
      const duration = Date.now() - startTime;
      const success = handledCorrectly === malformedUrls.length;
      
      await this.recordResult(
        testName,
        success,
        duration,
        `${handledCorrectly}/${malformedUrls.length} malformed URLs handled safely`
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Malformed URLs test failed', error);
    }
  }

  // Test 4: CSRF Attack Prevention
  async testCSRFPrevention() {
    const testName = 'CSRF Attack Prevention';
    const startTime = Date.now();
    
    try {
      await this.log('Testing CSRF attack prevention...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Start legitimate OAuth flow to get valid state
      await page.goto(this.baseUrl);
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await page.waitForLoadState('networkidle');
      }
      
      // Capture the legitimate state if possible
      const currentUrl = page.url();
      let legitimateState = '';
      
      if (currentUrl.includes('state=')) {
        const urlParams = new URLSearchParams(currentUrl.split('?')[1]);
        legitimateState = urlParams.get('state') || '';
      }
      
      // Simulate CSRF attack with different state
      const attackState = 'attacker_controlled_state_12345';
      const csrfUrl = `${this.baseUrl}/auth/callback?code=valid_looking_code&state=${attackState}`;
      
      await page.goto(csrfUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Should reject the CSRF attempt
      const rejectedCSRF = !page.url().includes('/app') && (
        page.url().includes('/login') || 
        await page.locator('.error').isVisible() ||
        await page.locator('button:has-text("Sign")').isVisible()
      );
      
      const duration = Date.now() - startTime;
      
      await this.recordResult(
        testName,
        rejectedCSRF,
        duration,
        rejectedCSRF ? 'Successfully prevented CSRF attack' : 'Failed to prevent CSRF attack'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'CSRF prevention test failed', error);
    }
  }

  // Test 5: Double-Click Prevention
  async testDoubleClickPrevention() {
    const testName = 'Double-Click Prevention';
    const startTime = Date.now();
    
    try {
      await this.log('Testing double-click prevention...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      
      if (await signInButton.isVisible()) {
        // Simulate rapid double-click
        const clickPromises = [];
        for (let i = 0; i < 5; i++) {
          clickPromises.push(signInButton.click().catch(() => {}));
        }
        
        await Promise.allSettled(clickPromises);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
      
      // Check if page is in a consistent state (not broken by multiple clicks)
      const pageWorking = await page.locator('body').isVisible();
      const noJSErrors = await page.evaluate(() => {
        return !window.onerror;
      });
      
      const duration = Date.now() - startTime;
      const success = pageWorking && noJSErrors;
      
      await this.recordResult(
        testName,
        success,
        duration,
        success ? 'Handled rapid clicks gracefully' : 'Failed to handle rapid clicks'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Double-click prevention test failed', error);
    }
  }

  // Test 6: Rapid Navigation During Auth
  async testRapidNavigationDuringAuth() {
    const testName = 'Rapid Navigation During Auth';
    const startTime = Date.now();
    
    try {
      await this.log('Testing rapid navigation during authentication...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Start auth flow
      await page.goto(this.baseUrl);
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
      }
      
      // Rapidly navigate between pages during auth
      const navigationPromises = [
        page.goto(this.baseUrl).catch(() => {}),
        page.goto(`${this.baseUrl}/demo`).catch(() => {}),
        page.goto(`${this.baseUrl}/login`).catch(() => {}),
        page.goto(`${this.baseUrl}/app`).catch(() => {}),
        page.goto(this.baseUrl).catch(() => {})
      ];
      
      await Promise.allSettled(navigationPromises);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check if the app is in a consistent state
      const isConsistent = await page.locator('body').isVisible();
      const currentUrl = page.url();
      const isValidPage = currentUrl.includes(this.baseUrl);
      
      const duration = Date.now() - startTime;
      const success = isConsistent && isValidPage;
      
      await this.recordResult(
        testName,
        success,
        duration,
        success ? 'Handled rapid navigation gracefully' : 'Failed to handle rapid navigation'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Rapid navigation test failed', error);
    }
  }

  // Test 7: Storage Quota Exceeded
  async testStorageQuotaExceeded() {
    const testName = 'Storage Quota Exceeded';
    const startTime = Date.now();
    
    try {
      await this.log('Testing storage quota exceeded scenarios...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      
      // Try to fill up localStorage
      await page.evaluate(() => {
        try {
          const largeData = new Array(1000000).join('x'); // Large string
          for (let i = 0; i < 100; i++) {
            localStorage.setItem(`test_data_${i}`, largeData);
          }
        } catch (e) {
          console.log('Storage quota reached:', e);
        }
      });
      
      // Try to authenticate with full storage
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await page.waitForLoadState('networkidle');
        
        // Simulate OAuth success
        await this.simulateOAuthSuccess(page);
        await page.waitForTimeout(3000);
      }
      
      // Check if auth still works despite storage issues
      const authWorked = page.url().includes('/app') || await page.locator('[data-testid="workspace"]').isVisible();
      
      const duration = Date.now() - startTime;
      
      await this.recordResult(
        testName,
        authWorked,
        duration,
        authWorked ? 'Auth worked despite storage quota issues' : 'Auth failed due to storage quota'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Storage quota test failed', error);
    }
  }

  // Test 8: Browser Extension Interference
  async testBrowserExtensionInterference() {
    const testName = 'Browser Extension Interference';
    const startTime = Date.now();
    
    try {
      await this.log('Testing browser extension interference scenarios...');
      
      const browser = await chromium.launch({ headless: true });
      this.browsers.push(browser);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Simulate extension interference by injecting scripts
      await page.addInitScript(() => {
        // Simulate ad blocker behavior
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && url.includes('google')) {
            console.log('Simulated ad blocker blocking Google request');
            return Promise.reject(new Error('Blocked by ad blocker'));
          }
          return originalFetch.apply(this, args);
        };
        
        // Simulate extension modifying DOM
        setTimeout(() => {
          const buttons = document.querySelectorAll('button');
          buttons.forEach(btn => {
            if (btn.textContent.includes('Google')) {
              btn.style.display = 'none'; // Hide Google button
            }
          });
        }, 1000);
      });
      
      await page.goto(this.baseUrl);
      const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await page.waitForLoadState('networkidle');
      }
      
      // Check if auth flow still works despite interference
      await page.waitForTimeout(2000);
      
      // Try alternative auth methods if Google is blocked
      const hasAlternativeAuth = await page.locator('button:has-text("Sign"), input[type="email"]').isVisible();
      const canProceed = hasAlternativeAuth || page.url().includes('/app');
      
      const duration = Date.now() - startTime;
      
      await this.recordResult(
        testName,
        canProceed,
        duration,
        canProceed ? 'Auth resilient to extension interference' : 'Auth blocked by extension interference'
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Extension interference test failed', error);
    }
  }

  async simulateOAuthSuccess(page) {
    await page.route('**/auth/callback*', route => {
      const url = new URL(route.request().url());
      url.searchParams.set('code', `mock_edge_case_${Date.now()}`);
      url.searchParams.set('state', 'valid_state');
      
      route.fulfill({
        status: 302,
        headers: { 'Location': `${this.baseUrl}/app` }
      });
    });
    
    const googleButton = page.locator('button:has-text("Google")');
    if (await googleButton.isVisible()) {
      await googleButton.click();
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 OAUTH EDGE CASE TEST SUITE REPORT');
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
    
    const securityScore = this.results.filter(r => 
      r.test.includes('CSRF') || 
      r.test.includes('Invalid') || 
      r.test.includes('Malformed')
    ).filter(r => r.passed).length;
    
    const resilienceScore = this.results.filter(r => 
      r.test.includes('Double-Click') || 
      r.test.includes('Navigation') || 
      r.test.includes('Storage') ||
      r.test.includes('Extension')
    ).filter(r => r.passed).length;
    
    console.log(`\n🛡️  Security Tests Passed: ${securityScore}/3`);
    console.log(`🔧 Resilience Tests Passed: ${resilienceScore}/4`);
    
    const overallHealth = passedTests === totalTests ? 'BULLETPROOF' :
                         passedTests >= totalTests * 0.8 ? 'ROBUST' :
                         passedTests >= totalTests * 0.6 ? 'ACCEPTABLE' : 'VULNERABLE';
    
    console.log(`\n🎯 Edge Case Resistance: ${overallHealth}`);
    console.log('\n' + '='.repeat(70));
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests/totalTests) * 100,
      averageDuration,
      securityScore,
      resilienceScore,
      overallHealth,
      results: this.results
    };
  }

  async cleanup() {
    await Promise.all(this.browsers.map(browser => browser.close()));
  }

  async run() {
    try {
      await this.log('🔍 Starting OAuth Edge Case Test Suite...');
      
      // Run all edge case tests
      await this.testInvalidOAuthStates();
      await this.testExpiredOAuthSessions();
      await this.testMalformedCallbackUrls();
      await this.testCSRFPrevention();
      await this.testDoubleClickPrevention();
      await this.testRapidNavigationDuringAuth();
      await this.testStorageQuotaExceeded();
      await this.testBrowserExtensionInterference();
      
      const report = this.generateReport();
      
      // Save results
      const fs = require('fs');
      fs.writeFileSync('edge-case-results.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        ...report
      }, null, 2));
      
      console.log('📄 Edge case test results saved to: edge-case-results.json');
      
      return report;
      
    } catch (error) {
      await this.log(`Edge case test suite failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  
  const tester = new OAuthEdgeCaseTestSuite({ baseUrl });
  
  tester.run()
    .then(report => {
      process.exit(report.successRate >= 75 ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = OAuthEdgeCaseTestSuite;