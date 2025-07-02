const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Simplified Jest config for mutation testing - without MSW
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/config/testing/jest.setup.minimal.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: ['lib/utils.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/lib/__tests__/utils.test.ts',
    '<rootDir>/lib/__tests__/mutation-utils-focus.test.ts',
    '<rootDir>/lib/__tests__/mutation-resistant.test.ts',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/', // Exclude Playwright tests
    '<rootDir>/config/testing/playwright.config.ts',
    '<rootDir>/stryker-tmp/', // Exclude Stryker temp files
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  maxWorkers: '50%',
  collectCoverage: false, // Disable for faster mutation testing
  bail: false,
  verbose: false,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
