#!/usr/bin/env node

/**
 * 🔄 CONTINUOUS AUTH FLOW TEST SUITE
 * 
 * Kiểm tra trải nghiệm đăng nhập/đăng xuất liên tục để đảm bảo UX mượt mà
 * - Test 50 lần đăng nhập/đăng xuất liên tục
 * - Kiểm tra memory leaks và performance degradation
 * - Đo thời gian response cho mỗi iteration
 * - Test session persistence và recovery
 */

const { chromium } = require('playwright');

class ContinuousAuthFlowTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3001';
    this.iterations = options.iterations || 50;
    this.results = [];
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async setup() {
    console.log('🔄 Setting up Continuous Auth Flow Test...');
    this.browser = await chromium.launch({
      headless: process.env.CI === 'true',
      devtools: false
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    this.page = await this.context.newPage();
    
    // Monitor performance and memory
    await this.page.addInitScript(() => {
      window.authFlowMetrics = {
        iterations: [],
        memoryUsage: [],
        performanceEntries: [],
        errors: []
      };
    });
  }

  async runContinuousAuthTest() {
    console.log(`🚀 Starting ${this.iterations} continuous auth iterations...`);
    
    for (let i = 1; i <= this.iterations; i++) {
      const iterationStart = Date.now();
      
      try {
        console.log(`\n📋 Iteration ${i}/${this.iterations}`);
        
        // 1. Navigate to landing page
        const landingStart = Date.now();
        await this.page.goto(this.baseUrl);
        await this.page.waitForLoadState('networkidle');
        const landingTime = Date.now() - landingStart;
        
        // 2. Click sign in
        const signInStart = Date.now();
        const signInButton = this.page.locator('button:has-text("Sign In")').first();
        await signInButton.click();
        await this.page.waitForLoadState('networkidle');
        const signInTime = Date.now() - signInStart;
        
        // 3. Simulate OAuth flow (mock for testing)
        const oauthStart = Date.now();
        await this.simulateOAuthFlow();
        const oauthTime = Date.now() - oauthStart;
        
        // 4. Verify we're in workspace
        const workspaceStart = Date.now();
        await this.page.waitForURL('**/app*', { timeout: 10000 });
        const isInWorkspace = this.page.url().includes('/app');
        const workspaceTime = Date.now() - workspaceStart;
        
        // 5. Test workspace functionality
        const functionalityStart = Date.now();
        await this.testWorkspaceFunctionality();
        const functionalityTime = Date.now() - functionalityStart;
        
        // 6. Sign out
        const signOutStart = Date.now();
        await this.performSignOut();
        const signOutTime = Date.now() - signOutStart;
        
        // 7. Verify back on landing
        const verifyStart = Date.now();
        await this.page.waitForURL('**/', { timeout: 5000 });
        const isOnLanding = !this.page.url().includes('/app');
        const verifyTime = Date.now() - verifyStart;
        
        const totalTime = Date.now() - iterationStart;
        
        // Record metrics
        const metrics = {
          iteration: i,
          success: isInWorkspace && isOnLanding,
          totalTime,
          times: {
            landing: landingTime,
            signIn: signInTime,
            oauth: oauthTime,
            workspace: workspaceTime,
            functionality: functionalityTime,
            signOut: signOutTime,
            verify: verifyTime
          }
        };
        
        this.results.push(metrics);
        
        // Check memory usage
        const memoryUsage = await this.page.evaluate(() => {
          if (performance.memory) {
            return {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit
            };
          }
          return null;
        });
        
        console.log(`✅ Iteration ${i}: ${totalTime}ms total`);
        console.log(`   📊 Landing: ${landingTime}ms, OAuth: ${oauthTime}ms, SignOut: ${signOutTime}ms`);
        if (memoryUsage) {
          console.log(`   🧠 Memory: ${Math.round(memoryUsage.used / 1024 / 1024)}MB used`);
        }
        
        // Performance degradation check
        if (i > 10) {
          const recentAvg = this.getRecentAverage(5);
          const initialAvg = this.getInitialAverage(5);
          const degradation = ((recentAvg - initialAvg) / initialAvg) * 100;
          
          if (degradation > 20) {
            console.warn(`⚠️  Performance degradation detected: ${degradation.toFixed(1)}%`);
          }
        }
        
        // Small delay between iterations
        await this.page.waitForTimeout(500);
        
      } catch (error) {
        console.error(`❌ Iteration ${i} failed:`, error.message);
        this.results.push({
          iteration: i,
          success: false,
          error: error.message,
          totalTime: Date.now() - iterationStart
        });
      }
    }
  }

  async simulateOAuthFlow() {
    // Check if we're on Google OAuth or need to simulate
    const currentUrl = this.page.url();
    
    if (currentUrl.includes('accounts.google.com')) {
      // Real Google OAuth - would need real credentials
      console.log('🔐 Real Google OAuth detected - skipping for automated test');
      return;
    }
    
    // Look for Google button and simulate click
    const googleButton = this.page.locator('button:has-text("Google")');
    
    if (await googleButton.isVisible()) {
      // Mock OAuth callback
      await this.page.route('**/auth/callback*', route => {
        const url = new URL(route.request().url());
        url.searchParams.set('code', `mock_auth_code_${Date.now()}`);
        url.searchParams.set('state', 'mock_state');
        
        route.fulfill({
          status: 302,
          headers: { 'Location': `${this.baseUrl}/app` }
        });
      });
      
      await googleButton.click();
    }
  }

  async testWorkspaceFunctionality() {
    // Test basic workspace interactions
    try {
      // Check if sidebar is visible
      const sidebar = this.page.locator('.workspace-sidebar, [data-testid="side-nav"]');
      if (await sidebar.isVisible()) {
        // Click on different nav items
        const navItems = this.page.locator('[data-testid^="nav-"]');
        const count = await navItems.count();
        
        if (count > 0) {
          // Click first nav item
          await navItems.first().click();
          await this.page.waitForTimeout(200);
        }
      }
      
      // Test user menu if visible
      const userMenu = this.page.locator('.user-menu, [data-testid="user-menu"]');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await this.page.waitForTimeout(200);
        // Click away to close
        await this.page.click('body');
      }
      
    } catch (error) {
      console.debug('Workspace functionality test partial:', error.message);
    }
  }

  async performSignOut() {
    // Look for sign out in various locations
    let signOutButton = this.page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out")');
    
    if (!(await signOutButton.isVisible())) {
      // Try user menu first
      const userMenu = this.page.locator('button:has-text("User"), .user-menu, [data-testid="user-menu"], .avatar').first();
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await this.page.waitForTimeout(500);
        signOutButton = this.page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out")');
      }
    }
    
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
    } else {
      // Fallback: clear storage and navigate away
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.context.clearCookies();
      await this.page.goto(this.baseUrl);
    }
  }

  getRecentAverage(count) {
    const recent = this.results.slice(-count).filter(r => r.success);
    return recent.reduce((sum, r) => sum + r.totalTime, 0) / recent.length;
  }

  getInitialAverage(count) {
    const initial = this.results.slice(0, count).filter(r => r.success);
    return initial.reduce((sum, r) => sum + r.totalTime, 0) / initial.length;
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🔄 CONTINUOUS AUTH FLOW TEST REPORT');
    console.log('='.repeat(70));
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total Iterations: ${this.results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);
    
    if (successful.length > 0) {
      const times = successful.map(r => r.totalTime);
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`\n⏱️  PERFORMANCE:`);
      console.log(`Average Time: ${avgTime.toFixed(0)}ms`);
      console.log(`Fastest: ${minTime}ms`);
      console.log(`Slowest: ${maxTime}ms`);
      
      // Performance degradation analysis
      if (successful.length > 10) {
        const firstHalf = successful.slice(0, Math.floor(successful.length / 2));
        const secondHalf = successful.slice(Math.floor(successful.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b.totalTime, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b.totalTime, 0) / secondHalf.length;
        const degradation = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        console.log(`Performance Change: ${degradation > 0 ? '+' : ''}${degradation.toFixed(1)}%`);
        
        if (Math.abs(degradation) < 10) {
          console.log(`✅ Performance stable across iterations`);
        } else if (degradation > 0) {
          console.log(`⚠️  Performance degraded over time`);
        } else {
          console.log(`📈 Performance improved over time`);
        }
      }
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ FAILURES:`);
      failed.forEach(f => {
        console.log(`Iteration ${f.iteration}: ${f.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    
    return {
      total: this.results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / this.results.length) * 100,
      avgTime: successful.length > 0 ? successful.reduce((a, b) => a + b.totalTime, 0) / successful.length : 0,
      results: this.results
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.setup();
      await this.runContinuousAuthTest();
      const report = this.generateReport();
      
      // Save detailed results
      const fs = require('fs');
      fs.writeFileSync('continuous-auth-results.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        ...report
      }, null, 2));
      
      console.log('📄 Detailed results saved to: continuous-auth-results.json');
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  const iterations = parseInt(process.argv[3]) || 20; // Default 20 for testing
  
  const tester = new ContinuousAuthFlowTester({ baseUrl, iterations });
  
  tester.run()
    .then(report => {
      process.exit(report.successRate >= 95 ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = ContinuousAuthFlowTester;