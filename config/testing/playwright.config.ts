import { defineConfig, devices } from '@playwright/test'

/**
 * Prismy E2E Testing Configuration
 * Optimized for Vietnamese translation platform testing
 * Supports multi-browser, mobile, and localization testing
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  
  // Enhanced reporting for Vietnamese market testing
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ...(process.env.CI ? [['github']] : [['list']]),
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Vietnamese locale support
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    // Enhanced debugging
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    // Desktop browsers for comprehensive Vietnamese UI testing
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: '**/critical-flows.spec.ts',
    },
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: '**/payment-flows.spec.ts',
    },
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: '**/translation-flows.spec.ts',
    },
    
    // Mobile testing for Vietnamese mobile users
    {
      name: 'mobile-android',
      use: { 
        ...devices['Pixel 5'],
        locale: 'vi-VN',
      },
      testMatch: '**/mobile-flows.spec.ts',
    },
    {
      name: 'mobile-ios',
      use: { 
        ...devices['iPhone 12'],
        locale: 'vi-VN',
      },
      testMatch: '**/mobile-flows.spec.ts',
    },
    
    // Vietnamese language specific testing
    {
      name: 'vietnamese-locale',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'vi-VN',
        timezoneId: 'Asia/Ho_Chi_Minh',
        viewport: { width: 1440, height: 900 },
      },
      testMatch: '**/localization.spec.ts',
    },
    
    // Performance testing on slower connections (Vietnamese mobile networks)
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox'],
        },
        // Simulate slower Vietnamese mobile network
        contextOptions: {
          offline: false,
        },
      },
      testMatch: '**/performance.spec.ts',
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for dev server startup
    stderr: 'pipe',
    stdout: 'pipe',
  },
  
  // Global test configuration
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
})