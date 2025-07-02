/**
 * E2E Test Configuration
 * Centralized configuration for all end-to-end tests
 */

export interface TestConfig {
  // Environment
  baseUrl: string
  apiUrl: string
  wsUrl: string
  
  // Timeouts (in milliseconds)
  defaultTimeout: number
  largeFileTimeout: number
  batchProcessingTimeout: number
  networkTimeout: number
  
  // File processing
  maxFileSize: number
  chunkSize: number
  supportedFormats: string[]
  
  // Performance thresholds
  maxUploadTime: number
  maxProcessingTime: number
  maxConcurrentJobs: number
  
  // Test data
  testDataDir: string
  tempDir: string
  outputDir: string
  
  // Database
  testDatabaseUrl?: string
  
  // Authentication
  testUser: {
    email: string
    password: string
  }
  
  // Feature flags
  enableWebSocketTests: boolean
  enableBatchTests: boolean
  enablePerformanceTests: boolean
  enableChaosTests: boolean
}

// Default configuration
export const defaultConfig: TestConfig = {
  // Environment
  baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000/api',
  wsUrl: process.env.PLAYWRIGHT_WS_URL || 'ws://localhost:3000/api/ws',
  
  // Timeouts
  defaultTimeout: 30000, // 30 seconds
  largeFileTimeout: 600000, // 10 minutes
  batchProcessingTimeout: 1200000, // 20 minutes
  networkTimeout: 10000, // 10 seconds
  
  // File processing
  maxFileSize: 1024 * 1024 * 1024, // 1GB
  chunkSize: 1024 * 1024, // 1MB
  supportedFormats: ['.pdf', '.docx', '.txt', '.md', '.rtf'],
  
  // Performance thresholds
  maxUploadTime: 120000, // 2 minutes for 100MB file
  maxProcessingTime: 300000, // 5 minutes for complex processing
  maxConcurrentJobs: 10,
  
  // Test data
  testDataDir: './tests/e2e/data',
  tempDir: './tests/temp',
  outputDir: './tests/output',
  
  // Database
  testDatabaseUrl: process.env.TEST_DATABASE_URL,
  
  // Authentication
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@prismy.ai',
    password: process.env.TEST_USER_PASSWORD || 'testpassword123'
  },
  
  // Feature flags
  enableWebSocketTests: process.env.ENABLE_WEBSOCKET_TESTS !== 'false',
  enableBatchTests: process.env.ENABLE_BATCH_TESTS !== 'false',
  enablePerformanceTests: process.env.ENABLE_PERFORMANCE_TESTS === 'true',
  enableChaosTests: process.env.ENABLE_CHAOS_TESTS === 'true'
}

// Environment-specific configurations
export const configs: Record<string, Partial<TestConfig>> = {
  development: {
    baseUrl: 'http://localhost:3000',
    defaultTimeout: 60000,
    largeFileTimeout: 900000, // 15 minutes for dev
  },
  
  staging: {
    baseUrl: 'https://staging.prismy.ai',
    defaultTimeout: 45000,
    largeFileTimeout: 600000,
    enablePerformanceTests: true,
  },
  
  production: {
    baseUrl: 'https://prismy.ai',
    defaultTimeout: 30000,
    largeFileTimeout: 300000, // 5 minutes for prod
    enableChaosTests: false, // Never run chaos tests in production
    maxConcurrentJobs: 5, // Reduced load for production
  },
  
  ci: {
    defaultTimeout: 120000, // Longer timeouts for CI
    largeFileTimeout: 1800000, // 30 minutes
    enablePerformanceTests: false,
    enableChaosTests: false,
  }
}

// Get configuration for current environment
export function getTestConfig(): TestConfig {
  const environment = process.env.NODE_ENV || 'development'
  const envConfig = configs[environment] || {}
  
  return {
    ...defaultConfig,
    ...envConfig
  }
}

// File size helpers
export const FILE_SIZES = {
  SMALL: 1024 * 1024, // 1MB
  MEDIUM: 10 * 1024 * 1024, // 10MB
  LARGE: 100 * 1024 * 1024, // 100MB
  XLARGE: 500 * 1024 * 1024, // 500MB
  XXLARGE: 1024 * 1024 * 1024, // 1GB
} as const

// Test file templates
export const TEST_FILE_TEMPLATES = {
  PDF_HEADER: '%PDF-1.4\n',
  DOCX_CONTENT: 'This is a test document for Prismy processing.',
  TEXT_CONTENT: 'Sample text content for translation testing.',
  MULTILINGUAL_CONTENT: {
    english: 'This is an English document that needs translation.',
    vietnamese: 'Đây là một tài liệu tiếng Việt cần được dịch.',
    japanese: 'これは翻訳が必要な日本語の文書です。',
    chinese: '这是一个需要翻译的中文文档。'
  }
} as const

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  // Upload speed (MB/s)
  MIN_UPLOAD_SPEED: 1,
  TARGET_UPLOAD_SPEED: 5,
  
  // Processing time per MB (seconds)
  MAX_OCR_TIME_PER_MB: 30,
  MAX_TRANSLATION_TIME_PER_MB: 60,
  MAX_REBUILD_TIME_PER_MB: 15,
  
  // Memory usage (MB)
  MAX_MEMORY_USAGE: 2048,
  
  // Concurrent processing
  TARGET_CONCURRENT_JOBS: 5,
  MAX_QUEUE_SIZE: 100,
} as const