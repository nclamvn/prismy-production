#!/usr/bin/env node
/**
 * ===============================================
 * PRISMY SMOKE TEST (Playwright tối giản)
 * Chạy: node play-smoke.ts
 * ===============================================
 */

import { chromium, firefox, webkit } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 30000; // 30 giây

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class SmokeTest {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    console.log(`🧪 Running: ${name}`);

    try {
      await testFn();
      const duration = Date.now() - start;
      this.results.push({ name, passed: true, duration });
      console.log(`✅ ${name} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - start;
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error),
        duration 
      });
      console.log(`❌ ${name} - ${duration}ms`);
      console.log(`   Error: ${error}`);
    }
  }

  async run() {
    console.log('🚀 Starting Prismy Smoke Tests');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log('⏱️  Timeout: 30s per test\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: './test-videos/' }
    });
    const page = await context.newPage();

    try {
      // ==========================================
      // TEST 1: Landing Page Load
      // ==========================================
      await this.runTest('Landing Page Load', async () => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await page.waitForSelector('h1', { timeout: 5000 });
        
        const title = await page.title();
        if (!title.includes('Prismy')) {
          throw new Error(`Expected title to contain 'Prismy', got: ${title}`);
        }
      });

      // ==========================================
      // TEST 2: Navigation to App (Auth Check)
      // ==========================================
      await this.runTest('Navigation to App', async () => {
        await page.click('a[href="/app"], button:has-text("Workspace")', { timeout: 5000 });
        
        // Có thể redirect về login hoặc vào workspace
        await page.waitForURL(/\/(app|login|auth)/, { timeout: 10000 });
        
        const currentUrl = page.url();
        console.log(`   → Redirected to: ${currentUrl}`);
      });

      // ==========================================
      // TEST 3: OAuth Modal (if on login page)
      // ==========================================
      await this.runTest('OAuth Modal Interaction', async () => {
        const currentUrl = page.url();
        
        if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
          // Tìm nút Google OAuth
          const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
          await googleButton.waitFor({ timeout: 5000 });
          
          console.log('   → Found Google OAuth button');
          // Không click thật (tránh redirect sang Google), chỉ check tồn tại
        } else {
          console.log('   → Already authenticated, skipping OAuth test');
        }
      });

      // ==========================================
      // TEST 4: Workspace Layout (if authenticated)
      // ==========================================
      await this.runTest('Workspace Layout Check', async () => {
        // Nếu đã authenticated, check workspace components
        if (page.url().includes('/app')) {
          await page.waitForSelector('[data-testid="side-nav"], .workspace-sidebar', { timeout: 5000 });
          await page.waitForSelector('[data-testid="workspace-canvas"], .workspace-canvas', { timeout: 5000 });
          
          // Check sidebar footer exists
          const sidebarFooter = page.locator('.h-14:has-text("✨"), .sidebar-footer');
          if (await sidebarFooter.count() > 0) {
            console.log('   → Sidebar footer found');
          }
          
          console.log('   → Workspace layout verified');
        } else {
          console.log('   → Not in workspace, skipping layout test');
        }
      });

      // ==========================================
      // TEST 5: Search Functionality
      // ==========================================
      await this.runTest('Search Functionality', async () => {
        if (page.url().includes('/app')) {
          // Tìm search input hoặc trigger
          const searchTrigger = page.locator('input[placeholder*="Search"], button:has-text("Search")').first();
          
          if (await searchTrigger.count() > 0) {
            await searchTrigger.click({ timeout: 5000 });
            console.log('   → Search component is interactive');
          } else {
            console.log('   → Search component not found (may be in different state)');
          }
        } else {
          console.log('   → Not in workspace, skipping search test');
        }
      });

      // ==========================================
      // TEST 6: Responsive Layout (Mobile)
      // ==========================================
      await this.runTest('Mobile Responsive Check', async () => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
        await page.waitForTimeout(1000); // Wait for responsive changes
        
        // Check if layout adapts
        const body = await page.locator('body').first();
        await body.waitFor({ timeout: 3000 });
        
        console.log('   → Mobile layout rendered');
        
        // Reset to desktop
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.waitForTimeout(1000);
      });

      // ==========================================
      // TEST 7: Performance Check
      // ==========================================
      await this.runTest('Performance Check', async () => {
        const startTime = Date.now();
        await page.reload({ waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;
        
        if (loadTime > 5000) {
          throw new Error(`Page load took ${loadTime}ms (> 5s threshold)`);
        }
        
        console.log(`   → Page load time: ${loadTime}ms`);
      });

    } catch (error) {
      console.error('❌ Test runner error:', error);
    } finally {
      await browser.close();
      this.printResults();
    }
  }

  private printResults() {
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.name.padEnd(30)} ${duration}`);
      
      if (!result.passed && result.error) {
        console.log(`   ${result.error}`);
      }
    });
    
    console.log(`\n📈 Summary: ${passed}/${total} passed (${failed} failed)`);
    
    if (failed > 0) {
      console.log('❌ Some tests failed - check your local setup');
      process.exit(1);
    } else {
      console.log('✅ All tests passed - Ready for development!');
      process.exit(0);
    }
  }
}

// ==========================================
// RUN TESTS
// ==========================================
async function main() {
  const smokeTest = new SmokeTest();
  await smokeTest.run();
}

// Check if script is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}