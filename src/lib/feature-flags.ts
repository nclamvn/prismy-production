export interface FeatureFlags {
  MVP_MODE: boolean
  ENABLE_TRANSLATION_API: boolean
  ENABLE_OCR_API: boolean
  ENABLE_AUTH: boolean
  ENABLE_FILE_STORAGE: boolean
  ENABLE_LARGE_UPLOADS: boolean
  DEBUG_MODE: boolean
}

export function getFeatureFlags(): FeatureFlags {
  return {
    MVP_MODE: process.env.MVP_MODE === 'true',
    ENABLE_TRANSLATION_API: process.env.ENABLE_TRANSLATION_API === 'true',
    ENABLE_OCR_API: process.env.ENABLE_OCR_API === 'true',
    ENABLE_AUTH: process.env.ENABLE_AUTH === 'true',
    ENABLE_FILE_STORAGE: process.env.ENABLE_FILE_STORAGE === 'true',
    ENABLE_LARGE_UPLOADS: process.env.ENABLE_LARGE_UPLOADS === 'true',
    DEBUG_MODE: process.env.DEBUG_MODE === 'true'
  }
}