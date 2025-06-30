const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    // Core UI Components - Master Prompt Architecture
    'components/ui/Button.tsx',
    'components/ui/Input.tsx',
    'components/ui/Textarea.tsx',
    'components/ui/Card.tsx',
    'components/ui/Modal.tsx',

    // Accessibility System
    'components/accessibility/AccessibilityProvider.tsx',
    'components/accessibility/AccessibilityEnhancer.tsx',

    // API Routes - Security & CSP
    'app/api/security/csp-report/route.ts',
    'app/api/health/route.ts',

    // Core Services - Business Logic
    'lib/utils.ts',
    'lib/validation.ts',
    'lib/supabase.ts',
    'lib/translation-service.ts',
    'lib/payments/payment-service.ts',

    // Layout System
    'app/layout.tsx',
    'components/layouts/MarketingLayout.tsx',
    'components/layouts/WorkspaceLayout.tsx',
    'components/layouts/AuthLayout.tsx',

    // Exclusions
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/*.config.{js,jsx,ts,tsx}',
    '!lib/stubs/**',
    '!app/globals.css',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)/)',
  ],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/', // Exclude Playwright tests
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  testTimeout: 30000,
  maxWorkers: process.env.CI ? 2 : '50%',
  collectCoverage: process.env.CI === 'true',
  coverageDirectory: 'coverage',
  bail: false,
  verbose: false,
  clearMocks: true,
  restoreMocks: true,
  errorOnDeprecated: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
