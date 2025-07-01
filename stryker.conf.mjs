/**
 * Minimal Stryker Configuration for Mutation Testing
 * Focused on utils.ts only without complex dependencies
 */

// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: 'jest',
  
  // Only mutate utils.ts - no complex dependencies
  mutate: [
    'lib/utils.ts'
  ],

  // Use simple coverage analysis
  coverageAnalysis: 'off',
  
  // Basic thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 40
  },

  // Performance settings
  timeoutMS: 30000,
  concurrency: 1,
  
  // Jest configuration - use minimal config without MSW
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.mutation.js',
    enableFindRelatedTests: false
  },

  // Simple reporters
  reporters: ['clear-text', 'progress'],

  // Basic logging
  logLevel: 'info',
  
  // Disable complex features
  disableTypeChecks: true,
  allowConsoleColors: true,
  cleanTempDir: true,

  // Focus on specific mutators
  mutator: {
    excludedMutations: [
      'StringLiteral',
      'RegexLiteral'
    ]
  }
}

export default config