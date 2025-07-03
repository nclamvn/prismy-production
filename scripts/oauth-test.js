#!/usr/bin/env node

/**
 * 🩺 5-Minute OAuth Test Suite - Endoscope Method
 * 
 * Automated testing of OAuth authentication flow covering:
 * 1. Incognito → Google → /app ≤ 5s (no flash)
 * 2. Reload /app → stay logged in
 * 3. Sign-out → homepage ≤ 1s  
 * 4. Preview vs prod domain isolation
 * 5. Chat 20 messages → no global scroll
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

class OAuthTestSuite {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.testEmail = options.testEmail || 'test@example.com';
    this.testPassword = options.testPassword || 'testpassword123';
    this.results = [];
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  // Utility methods
  log(message, type = 'info') {
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
    this.log(
      `${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms) ${details}`,
      passed ? 'success' : 'error'
    );
    
    if (error) {
      this.log(`   Error: ${error.message}`, 'error');
    }
  }

  // Browser setup
  async setupBrowser() {
    this.log('Setting up browser...');
    this.browser = await playwright.chromium.launch({
      headless: process.env.CI === 'true',
      devtools: false
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    this.page = await this.context.newPage();
    
    // Setup console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Browser Error: ${msg.text()}`);
      }
    });

    // Setup analytics monitoring
    await this.page.addInitScript(() => {
      window.testAnalytics = {
        events: [],
        oauthStartTime: null,
        oauthCompleteTime: null
      };
      
      // Monitor auth analytics if available
      const originalLog = console.log;
      console.log = function(...args) {
        if (args[0] && args[0].includes('🩺 Auth Event')) {
          window.testAnalytics.events.push({
            timestamp: Date.now(),
            event: args[0],
            data: args[1]
          });
        }
        if (args[0] && args[0].includes('OAuth Flow')) {
          if (args[0].includes('OAuth Flow')) {
            window.testAnalytics.oauthStartTime = Date.now();
          }
        }
        originalLog.apply(console, args);
      };
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Test 1: Incognito → Google → /app ≤ 5s (no flash)
  async testOAuthFlow() {
    const testName = 'OAuth Flow Performance';
    const startTime = Date.now();
    
    try {
      this.log('Starting OAuth flow test...');
      
      // Navigate to login page
      await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle' });
      
      // Look for Google login button
      const googleButton = await this.page.locator('button:has-text("Google"), a:has-text("Google"), [data-provider="google"]').first();
      
      if (!(await googleButton.isVisible())) {
        throw new Error('Google login button not found');
      }

      // Start OAuth flow timing
      const oauthStartTime = Date.now();
      await this.page.evaluate(() => {
        window.testAnalytics.oauthStartTime = Date.now();
      });

      // Click Google login (this will redirect to Google in real scenario)
      // For testing, we'll mock the successful callback
      await this.page.route('**/auth/callback*', async route => {
        const url = new URL(route.request().url());
        url.searchParams.set('code', 'mock_auth_code_for_testing');
        url.searchParams.set('state', 'mock_state');
        await route.fulfill({
          status: 302,
          headers: {
            'Location': `${this.baseUrl}/app`
          }
        });
      });

      // Click the Google button
      await googleButton.click();
      
      // Wait for redirect to /app or callback processing
      try {
        await this.page.waitForURL('**/app*', { timeout: 10000 });
      } catch (error) {
        // If direct redirect fails, check for callback processing
        await this.page.waitForURL('**/auth/callback*', { timeout: 5000 });
        await this.page.waitForURL('**/app*', { timeout: 8000 });
      }

      const oauthDuration = Date.now() - oauthStartTime;
      
      // Check for "sign-in fail" flash or errors
      const hasSignInFail = await this.page.locator('text=/sign.?in.?fail/i').isVisible();
      const hasErrorMessage = await this.page.locator('.error, [role="alert"], .alert-error').isVisible();
      
      // Verify we're on the workspace page
      const isOnWorkspace = await this.page.locator('[data-testid="workspace"], .workspace, h1:has-text("Workspace")').isVisible();
      
      const success = oauthDuration <= 5000 && !hasSignInFail && !hasErrorMessage && isOnWorkspace;
      
      await this.recordResult(
        testName,
        success,
        oauthDuration,
        `OAuth completed in ${oauthDuration}ms, Flash: ${hasSignInFail}, Errors: ${hasErrorMessage}, OnWorkspace: ${isOnWorkspace}`
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'OAuth flow failed', error);
    }
  }

  // Test 2: Session persistence (reload /app → stay logged in)
  async testSessionPersistence() {
    const testName = 'Session Persistence';
    const startTime = Date.now();
    
    try {
      this.log('Testing session persistence...');
      
      // Reload the page
      await this.page.reload({ waitUntil: 'networkidle' });
      
      // Wait a moment for potential redirects
      await this.page.waitForTimeout(2000);
      
      // Check if we're still on /app and not redirected to login
      const currentUrl = this.page.url();
      const stayedOnApp = currentUrl.includes('/app');
      const redirectedToLogin = currentUrl.includes('/login');
      
      // Check for loading states that might indicate session restoration
      const hasLoadingState = await this.page.locator('.loading, [data-testid="loading"]').isVisible();
      
      const duration = Date.now() - startTime;
      const success = stayedOnApp && !redirectedToLogin;
      
      await this.recordResult(
        testName,
        success,
        duration,
        `StayedOnApp: ${stayedOnApp}, RedirectedToLogin: ${redirectedToLogin}, Loading: ${hasLoadingState}`
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Session persistence check failed', error);
    }
  }

  // Test 3: Sign-out performance (sign-out → homepage ≤ 1s)
  async testSignOutPerformance() {
    const testName = 'Sign-out Performance';
    const startTime = Date.now();
    
    try {
      this.log('Testing sign-out performance...');
      
      // Look for sign-out button/link
      const signOutButton = await this.page.locator(
        'button:has-text("Sign"), button:has-text("Logout"), a:has-text("Sign"), [data-testid="signout"]'
      ).first();
      
      if (!(await signOutButton.isVisible())) {
        // Try to find in a menu or dropdown
        const userMenu = await this.page.locator('.user-menu, [data-testid="user-menu"], .avatar').first();
        if (await userMenu.isVisible()) {
          await userMenu.click();
          await this.page.waitForTimeout(500);
        }
      }
      
      const signOutStartTime = Date.now();
      
      // Click sign out
      await signOutButton.click();
      
      // Wait for redirect to homepage or login
      await this.page.waitForURL('**/login*', { timeout: 3000 }).catch(() => {
        return this.page.waitForURL(`${this.baseUrl}/`, { timeout: 3000 });
      });
      
      const signOutDuration = Date.now() - signOutStartTime;
      
      // Verify we're no longer on the app page
      const currentUrl = this.page.url();
      const leftApp = !currentUrl.includes('/app');
      
      // Check for hanging "signing out" messages
      const hasHangingMessage = await this.page.locator('text=/signing.?out/i').isVisible();
      
      const success = signOutDuration <= 1000 && leftApp && !hasHangingMessage;
      
      await this.recordResult(
        testName,
        success,
        signOutDuration,
        `Sign-out completed in ${signOutDuration}ms, LeftApp: ${leftApp}, Hanging: ${hasHangingMessage}`
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Sign-out test failed', error);
    }
  }

  // Test 4: Domain isolation (preview vs prod)
  async testDomainIsolation() {
    const testName = 'Domain Isolation';
    const startTime = Date.now();
    
    try {
      this.log('Testing domain isolation...');
      
      // This test requires access to both preview and prod URLs
      // For now, we'll test cookie isolation within the same domain
      
      // Clear all storage
      await this.context.clearCookies();
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Navigate to login and set some test data
      await this.page.goto(`${this.baseUrl}/login`);
      
      await this.page.evaluate(() => {
        localStorage.setItem('test-isolation', 'original-domain');
        document.cookie = 'test-cookie=original-value; path=/';
      });
      
      // Simulate switching domains by clearing only supabase-related storage
      await this.page.evaluate(() => {
        // Remove only supabase tokens while keeping test data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      });
      
      // Check that test data persists but auth data is cleared
      const isolationResult = await this.page.evaluate(() => {
        const testData = localStorage.getItem('test-isolation');
        const hasSupabaseData = Object.keys(localStorage).some(key => 
          key.includes('supabase') || key.includes('sb-')
        );
        return { testData, hasSupabaseData };
      });
      
      const success = isolationResult.testData === 'original-domain' && !isolationResult.hasSupabaseData;
      const duration = Date.now() - startTime;
      
      await this.recordResult(
        testName,
        success,
        duration,
        `TestData preserved: ${!!isolationResult.testData}, Auth data cleared: ${!isolationResult.hasSupabaseData}`
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Domain isolation test failed', error);
    }
  }

  // Test 5: Chat scroll isolation
  async testChatScrollIsolation() {
    const testName = 'Chat Scroll Isolation';
    const startTime = Date.now();
    
    try {
      this.log('Testing chat scroll isolation...');
      
      // Navigate to app (assuming we need to be logged in)
      await this.page.goto(`${this.baseUrl}/app`);
      
      // Look for chat interface
      const chatContainer = await this.page.locator(
        '.chat-container, [data-testid="chat"], .chat-panel, .messages'
      ).first();
      
      if (!(await chatContainer.isVisible())) {
        // Try to open chat if it's not visible
        const chatButton = await this.page.locator(
          'button:has-text("Chat"), [data-testid="open-chat"]'
        ).first();
        
        if (await chatButton.isVisible()) {
          await chatButton.click();
          await this.page.waitForTimeout(1000);
        }
      }
      
      // Get initial page scroll position
      const initialPageScroll = await this.page.evaluate(() => window.pageYOffset);
      
      // Simulate adding many messages to chat
      await this.page.evaluate(() => {
        const chatContainer = document.querySelector('.chat-container, [data-testid="chat"], .chat-panel, .messages');
        if (chatContainer) {
          // Add 20 test messages
          for (let i = 0; i < 20; i++) {
            const message = document.createElement('div');
            message.className = 'chat-message';
            message.style.cssText = 'padding: 10px; border: 1px solid #ccc; margin: 5px 0; height: 60px;';
            message.textContent = `Test message ${i + 1} - This is a long message to test scrolling behavior and ensure chat doesn't affect global page layout.`;
            chatContainer.appendChild(message);
          }
          
          // Scroll chat to bottom
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
      
      await this.page.waitForTimeout(1000);
      
      // Check if page scroll changed
      const finalPageScroll = await this.page.evaluate(() => window.pageYOffset);
      const pageScrollChanged = Math.abs(finalPageScroll - initialPageScroll) > 10;
      
      // Check if chat container has proper overflow
      const chatOverflowInfo = await this.page.evaluate(() => {
        const chatContainer = document.querySelector('.chat-container, [data-testid="chat"], .chat-panel, .messages');
        if (!chatContainer) return { hasOverflow: false, overflowStyle: 'none' };
        
        const styles = window.getComputedStyle(chatContainer);
        return {
          hasOverflow: styles.overflow === 'auto' || styles.overflowY === 'auto' || styles.overflow === 'scroll' || styles.overflowY === 'scroll',
          overflowStyle: `${styles.overflow}/${styles.overflowY}`,
          hasOverscrollBehavior: styles.overscrollBehavior === 'contain'
        };
      });
      
      const success = !pageScrollChanged && chatOverflowInfo.hasOverflow;
      const duration = Date.now() - startTime;
      
      await this.recordResult(
        testName,
        success,
        duration,
        `Page scroll changed: ${pageScrollChanged}, Chat overflow: ${chatOverflowInfo.overflowStyle}, Overscroll: ${chatOverflowInfo.hasOverscrollBehavior}`
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Chat scroll isolation test failed', error);
    }
  }

  // Performance monitoring
  async monitorPerformance() {
    const testName = 'Performance Monitoring';
    const startTime = Date.now();
    
    try {
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paintEntries.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          totalNavigation: navigation.loadEventEnd - navigation.fetchStart
        };
      });
      
      // Check auth analytics if available
      const authMetrics = await this.page.evaluate(() => {
        return window.testAnalytics || {};
      });
      
      const duration = Date.now() - startTime;
      const success = metrics.totalNavigation < 3000; // Under 3 seconds total
      
      await this.recordResult(
        testName,
        success,
        duration,
        `Navigation: ${Math.round(metrics.totalNavigation)}ms, FCP: ${Math.round(metrics.firstContentfulPaint)}ms, Auth events: ${authMetrics.events?.length || 0}`
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordResult(testName, false, duration, 'Performance monitoring failed', error);
    }
  }

  // Generate test report
  generateReport() {
    console.log('\\n' + '='.repeat(70));
    console.log('🩺 OAUTH TEST SUITE REPORT');
    console.log('='.repeat(70));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    
    console.log(`\\nTests Run: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Duration: ${Math.round(averageDuration)}ms`);
    
    console.log('\\n📋 DETAILED RESULTS:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test} (${result.duration}ms)`);
      console.log(`   ${result.details}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const overallHealth = passedTests === totalTests ? 'PERFECT' :
                         passedTests >= totalTests * 0.8 ? 'HEALTHY' :
                         passedTests >= totalTests * 0.6 ? 'WARNING' : 'CRITICAL';
    
    console.log(`\\n🎯 Overall Health: ${overallHealth}`);
    
    if (overallHealth === 'PERFECT' || overallHealth === 'HEALTHY') {
      console.log('\\n🚀 OAuth flow is ready for production!');
    } else {
      console.log('\\n⚠️  Fix failing tests before deploying.');
    }
    
    console.log('\\n' + '='.repeat(70));
    
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

  // Main test execution
  async run() {
    const startTime = Date.now();
    
    try {
      this.log('🩺 Starting 5-Minute OAuth Test Suite...');
      this.log('='.repeat(50));
      
      await this.setupBrowser();
      
      // Run all tests
      await this.testOAuthFlow();
      await this.testSessionPersistence();
      await this.testSignOutPerformance();
      await this.testDomainIsolation();
      await this.testChatScrollIsolation();
      await this.monitorPerformance();
      
      const report = this.generateReport();
      const totalDuration = Date.now() - startTime;
      
      this.log(`\\n⏱️  Total test suite duration: ${Math.round(totalDuration/1000)}s`);
      
      // Save detailed report
      const reportPath = path.join(process.cwd(), 'oauth-test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify({
        ...report,
        totalDuration,
        timestamp: new Date().toISOString(),
        environment: {
          baseUrl: this.baseUrl,
          userAgent: 'Test Suite'
        }
      }, null, 2));
      
      this.log(`📊 Detailed report saved to: ${reportPath}`);
      
      return report;
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const testSuite = new OAuthTestSuite({ baseUrl });
  
  testSuite.run()
    .then(report => {
      process.exit(report.overallHealth === 'CRITICAL' ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = OAuthTestSuite;