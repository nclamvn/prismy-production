/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  // Package manager for dependency resolution
  packageManager: 'npm',
  
  // Test runner configuration
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },

  // TypeScript configuration
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',

  // Mutation coverage configuration
  mutate: [
    // Core application code
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,ts}',
    'utils/**/*.{js,ts}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    
    // Exclude certain files
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.spec.{js,jsx,ts,tsx}',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/*.config.{js,ts}',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/types/**',
    '!**/*.d.ts',
    
    // Exclude specific patterns from mutation
    '!app/api/disable-rls/**',  // Security sensitive
    '!app/auth/direct/**',      // Test-only routes
    '!**/globals.css',
    '!**/layout.tsx',           // Layout files are tested via integration
    '!**/loading.tsx',          // Simple loading components
    '!**/not-found.tsx',        // Error pages
    '!**/error.tsx',            // Error pages
  ],

  // Coverage thresholds
  thresholds: {
    high: 90,    // Excellent mutation coverage
    low: 75,     // Minimum acceptable coverage
    break: 70,   // Build breaks below this threshold
  },

  // Reporter configuration
  reporters: [
    'progress',      // Console progress
    'clear-text',    // Detailed text output
    'html',          // HTML report
    'json',          // JSON for CI integration
  ],

  // HTML report configuration
  htmlReporter: {
    baseDir: 'reports/mutation',
    fileName: 'mutation-report.html',
  },

  // JSON report configuration
  jsonReporter: {
    fileName: 'reports/mutation/mutation-report.json',
  },

  // Performance configuration
  concurrency: 4,              // Parallel mutation testing
  timeout: 300000,             // 5 minutes per test
  disableTypeChecks: false,    // Keep TypeScript checks
  
  // Test selection configuration
  coverageAnalysis: 'perTest',  // Faster feedback
  
  // Mutation configuration
  mutator: {
    // Enable specific mutators
    plugins: [
      '@stryker-mutator/core',
      '@stryker-mutator/jest-runner',
      '@stryker-mutator/typescript-checker'
    ],
    
    // Exclude certain types of mutations for stability
    excludedMutations: [
      'StringLiteral',     // Avoid mutating UI text
      'RegexLiteral',      // Regex mutations can be unstable
    ],
  },

  // File patterns for different priorities
  incremental: true,           // Only test changed files
  incrementalFile: '.stryker-tmp/incremental.json',

  // Logging configuration
  logLevel: 'info',
  fileLogLevel: 'trace',
  allowConsoleColors: true,

  // Cache configuration for faster subsequent runs
  tempDirName: '.stryker-tmp',
  cleanTempDir: false,         // Keep temp files for debugging

  // Plugin configuration
  plugins: [
    '@stryker-mutator/jest-runner',
    '@stryker-mutator/typescript-checker'
  ],

  // Warning configuration
  warnings: {
    slow: true,                // Warn about slow tests
    unknown: true,             // Warn about unknown config
    deprecated: true,          // Warn about deprecated features
  },

  // Dashboard configuration (for Stryker Dashboard if used)
  dashboard: {
    project: 'github.com/prismy/prismy-production',
    version: 'main',
    module: 'main',
  },

  // Dry run configuration for CI
  dryRunOnly: false,

  // Test framework specific settings
  jest: {
    projectType: 'custom',
    config: {
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/lib/**/*.test.{js,ts}',
        '<rootDir>/utils/**/*.test.{js,ts}',
      ],
      collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,ts}',
        'utils/**/*.{js,ts}',
        '!**/*.test.{js,jsx,ts,tsx}',
        '!**/*.spec.{js,jsx,ts,tsx}',
        '!**/*.stories.{js,jsx,ts,tsx}',
        '!**/*.config.{js,ts}',
        '!**/*.d.ts',
      ],
    },
  },

  // Build command (if needed)
  buildCommand: 'npm run build',

  // Environment variables for testing
  envVars: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
  },
}