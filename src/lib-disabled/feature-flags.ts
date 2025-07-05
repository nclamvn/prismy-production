/**
 * Feature Flags System for Production Rollout
 * 
 * Enables/disables features without code deployment
 * Critical for safe production rollout and gradual feature enablement
 */

export interface FeatureFlags {
  // Core MVP features
  MVP_MODE: boolean
  NEXT_PUBLIC_PIPELINE_V2: boolean
  
  // Large file processing
  ENABLE_LARGE_UPLOADS: boolean
  ENABLE_CHUNKED_UPLOAD: boolean
  ENABLE_OCR_QUEUE: boolean
  
  // Translation features
  ENABLE_CHAT_INTERFACE: boolean
  ENABLE_SUMMARY_GENERATION: boolean
  ENABLE_REAL_TRANSLATION: boolean
  
  // Admin and monitoring
  ENABLE_ADMIN_PANEL: boolean
  ENABLE_ANALYTICS: boolean
  ENABLE_ERROR_TRACKING: boolean
  
  // UI/UX features
  ENABLE_DARK_MODE: boolean
  ENABLE_STORYBOOK: boolean
  ENABLE_PREVIEW_IFRAME: boolean
  
  // Performance and limits
  ENABLE_RATE_LIMITING: boolean
  ENABLE_PERFORMANCE_MONITORING: boolean
}

// Default feature flags for different environments
const DEFAULT_FLAGS: Record<string, FeatureFlags> = {
  development: {
    MVP_MODE: false,
    NEXT_PUBLIC_PIPELINE_V2: true,
    ENABLE_LARGE_UPLOADS: true,
    ENABLE_CHUNKED_UPLOAD: true,
    ENABLE_OCR_QUEUE: true,
    ENABLE_CHAT_INTERFACE: true,
    ENABLE_SUMMARY_GENERATION: true,
    ENABLE_REAL_TRANSLATION: true,
    ENABLE_ADMIN_PANEL: true,
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_TRACKING: false,
    ENABLE_DARK_MODE: true,
    ENABLE_STORYBOOK: true,
    ENABLE_PREVIEW_IFRAME: true,
    ENABLE_RATE_LIMITING: false,
    ENABLE_PERFORMANCE_MONITORING: false,
  },
  
  staging: {
    MVP_MODE: true,
    NEXT_PUBLIC_PIPELINE_V2: true,
    ENABLE_LARGE_UPLOADS: true,
    ENABLE_CHUNKED_UPLOAD: true,
    ENABLE_OCR_QUEUE: true,
    ENABLE_CHAT_INTERFACE: true,
    ENABLE_SUMMARY_GENERATION: false, // Stub responses
    ENABLE_REAL_TRANSLATION: true,
    ENABLE_ADMIN_PANEL: true,
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_TRACKING: true,
    ENABLE_DARK_MODE: true,
    ENABLE_STORYBOOK: false,
    ENABLE_PREVIEW_IFRAME: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
  },
  
  production: {
    MVP_MODE: true,
    NEXT_PUBLIC_PIPELINE_V2: true,
    ENABLE_LARGE_UPLOADS: false, // Start disabled, enable after 48h
    ENABLE_CHUNKED_UPLOAD: false,
    ENABLE_OCR_QUEUE: false,
    ENABLE_CHAT_INTERFACE: true,
    ENABLE_SUMMARY_GENERATION: false, // Stub responses initially
    ENABLE_REAL_TRANSLATION: true,
    ENABLE_ADMIN_PANEL: true,
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_TRACKING: true,
    ENABLE_DARK_MODE: false, // Keep simple initially
    ENABLE_STORYBOOK: false,
    ENABLE_PREVIEW_IFRAME: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
  }
}

/**
 * Gets current environment
 */
function getCurrentEnvironment(): string {
  // Check Vercel environment
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production'
  }
  
  if (process.env.NODE_ENV === 'test') {
    return 'development'
  }
  
  return 'development'
}

/**
 * Converts environment variable string to boolean
 */
function envToBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

/**
 * Gets feature flags with environment variable overrides
 */
export function getFeatureFlags(): FeatureFlags {
  const environment = getCurrentEnvironment()
  const defaults = DEFAULT_FLAGS[environment] || DEFAULT_FLAGS.development
  
  // Allow environment variable overrides
  return {
    MVP_MODE: envToBoolean(process.env.MVP_MODE, defaults.MVP_MODE),
    NEXT_PUBLIC_PIPELINE_V2: envToBoolean(process.env.NEXT_PUBLIC_PIPELINE_V2, defaults.NEXT_PUBLIC_PIPELINE_V2),
    
    ENABLE_LARGE_UPLOADS: envToBoolean(process.env.ENABLE_LARGE_UPLOADS, defaults.ENABLE_LARGE_UPLOADS),
    ENABLE_CHUNKED_UPLOAD: envToBoolean(process.env.ENABLE_CHUNKED_UPLOAD, defaults.ENABLE_CHUNKED_UPLOAD),
    ENABLE_OCR_QUEUE: envToBoolean(process.env.ENABLE_OCR_QUEUE, defaults.ENABLE_OCR_QUEUE),
    
    ENABLE_CHAT_INTERFACE: envToBoolean(process.env.ENABLE_CHAT_INTERFACE, defaults.ENABLE_CHAT_INTERFACE),
    ENABLE_SUMMARY_GENERATION: envToBoolean(process.env.ENABLE_SUMMARY_GENERATION, defaults.ENABLE_SUMMARY_GENERATION),
    ENABLE_REAL_TRANSLATION: envToBoolean(process.env.ENABLE_REAL_TRANSLATION, defaults.ENABLE_REAL_TRANSLATION),
    
    ENABLE_ADMIN_PANEL: envToBoolean(process.env.ENABLE_ADMIN_PANEL, defaults.ENABLE_ADMIN_PANEL),
    ENABLE_ANALYTICS: envToBoolean(process.env.ENABLE_ANALYTICS, defaults.ENABLE_ANALYTICS),
    ENABLE_ERROR_TRACKING: envToBoolean(process.env.ENABLE_ERROR_TRACKING, defaults.ENABLE_ERROR_TRACKING),
    
    ENABLE_DARK_MODE: envToBoolean(process.env.ENABLE_DARK_MODE, defaults.ENABLE_DARK_MODE),
    ENABLE_STORYBOOK: envToBoolean(process.env.ENABLE_STORYBOOK, defaults.ENABLE_STORYBOOK),
    ENABLE_PREVIEW_IFRAME: envToBoolean(process.env.ENABLE_PREVIEW_IFRAME, defaults.ENABLE_PREVIEW_IFRAME),
    
    ENABLE_RATE_LIMITING: envToBoolean(process.env.ENABLE_RATE_LIMITING, defaults.ENABLE_RATE_LIMITING),
    ENABLE_PERFORMANCE_MONITORING: envToBoolean(process.env.ENABLE_PERFORMANCE_MONITORING, defaults.ENABLE_PERFORMANCE_MONITORING),
  }
}

/**
 * Server-side feature flag access
 */
export const featureFlags = getFeatureFlags()

/**
 * Checks if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature]
}

/**
 * Gets file upload configuration based on feature flags
 */
export function getUploadConfig() {
  const flags = getFeatureFlags()
  
  if (flags.MVP_MODE) {
    return {
      maxFileSize: 50 * 1024 * 1024, // 50MB max in MVP mode
      allowChunkedUpload: false,
      useOCRQueue: false,
      supportedTypes: [
        'application/pdf',
        'text/plain',
        'text/markdown'
      ]
    }
  }
  
  return {
    maxFileSize: flags.ENABLE_LARGE_UPLOADS ? 1024 * 1024 * 1024 : 50 * 1024 * 1024, // 1GB or 50MB
    allowChunkedUpload: flags.ENABLE_CHUNKED_UPLOAD,
    useOCRQueue: flags.ENABLE_OCR_QUEUE,
    supportedTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png'
    ]
  }
}

/**
 * Gets translation configuration based on feature flags
 */
export function getTranslationConfig() {
  const flags = getFeatureFlags()
  
  return {
    enableRealTranslation: flags.ENABLE_REAL_TRANSLATION,
    enableSummaryGeneration: flags.ENABLE_SUMMARY_GENERATION,
    enableChatInterface: flags.ENABLE_CHAT_INTERFACE,
    maxTextLength: flags.MVP_MODE ? 100000 : 1000000, // 100K or 1M characters
    stubResponses: !flags.ENABLE_REAL_TRANSLATION
  }
}

/**
 * Environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    environment: getCurrentEnvironment(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    flags: getFeatureFlags()
  }
}