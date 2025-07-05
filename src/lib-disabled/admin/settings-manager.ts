/**
 * Admin Settings Manager for File Size Limits and Processing Configuration
 * 
 * Manages system-wide settings for file upload limits, OCR queue thresholds,
 * and processing parameters that can be adjusted by administrators.
 */

interface FileUploadSettings {
  maxFileSize: number // bytes
  maxFileSizeEdge: number // bytes - edge function limit
  maxFileSizeQueue: number // bytes - queue worker limit
  allowedFileTypes: string[]
  chunkedUploadThreshold: number // bytes
  defaultChunkSize: number // bytes
}

interface OCRSettings {
  queueThreshold: number // bytes - when to use queue vs edge
  maxProcessingTime: number // seconds
  defaultRetries: number
  concurrentJobs: number
  engines: {
    tesseract: { enabled: boolean; priority: number }
    googleVision: { enabled: boolean; priority: number; apiKey?: string }
    azureCv: { enabled: boolean; priority: number; endpoint?: string; apiKey?: string }
  }
  qualitySettings: {
    fast: { timeout: number; accuracy: number }
    balanced: { timeout: number; accuracy: number }
    accurate: { timeout: number; accuracy: number }
  }
}

interface TranslationSettings {
  maxTextLength: number // characters
  maxChunks: number
  defaultChunkSize: number // characters
  concurrentTranslations: number
  providers: {
    openai: { enabled: boolean; model: string; apiKey?: string }
    anthropic: { enabled: boolean; model: string; apiKey?: string }
    google: { enabled: boolean; model: string; apiKey?: string }
  }
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
}

interface StorageSettings {
  maxStoragePerUser: number // bytes
  retentionPeriod: number // days
  backupEnabled: boolean
  compressionEnabled: boolean
  encryptionEnabled: boolean
  signedUrlExpiry: number // seconds
}

interface SystemSettings {
  upload: FileUploadSettings
  ocr: OCRSettings
  translation: TranslationSettings
  storage: StorageSettings
  maintenance: {
    enabled: boolean
    message: string
    allowedUsers: string[]
  }
  monitoring: {
    metricsEnabled: boolean
    loggingLevel: 'error' | 'warn' | 'info' | 'debug'
    alertsEnabled: boolean
    webhookUrl?: string
  }
}

// Default settings
const DEFAULT_SETTINGS: SystemSettings = {
  upload: {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    maxFileSizeEdge: 50 * 1024 * 1024, // 50MB
    maxFileSizeQueue: 500 * 1024 * 1024, // 500MB
    allowedFileTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png'
    ],
    chunkedUploadThreshold: 50 * 1024 * 1024, // 50MB
    defaultChunkSize: 5 * 1024 * 1024 // 5MB
  },
  ocr: {
    queueThreshold: 50 * 1024 * 1024, // 50MB
    maxProcessingTime: 30 * 60, // 30 minutes
    defaultRetries: 3,
    concurrentJobs: 3,
    engines: {
      tesseract: { enabled: true, priority: 1 },
      googleVision: { enabled: false, priority: 2 },
      azureCv: { enabled: false, priority: 3 }
    },
    qualitySettings: {
      fast: { timeout: 300, accuracy: 0.8 }, // 5 minutes
      balanced: { timeout: 900, accuracy: 0.9 }, // 15 minutes
      accurate: { timeout: 1800, accuracy: 0.95 } // 30 minutes
    }
  },
  translation: {
    maxTextLength: 1000000, // 1M characters
    maxChunks: 100,
    defaultChunkSize: 2000, // characters
    concurrentTranslations: 5,
    providers: {
      openai: { enabled: true, model: 'gpt-4o' },
      anthropic: { enabled: false, model: 'claude-3-sonnet-20240229' },
      google: { enabled: false, model: 'gemini-pro' }
    },
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    }
  },
  storage: {
    maxStoragePerUser: 10 * 1024 * 1024 * 1024, // 10GB
    retentionPeriod: 90, // 90 days
    backupEnabled: true,
    compressionEnabled: true,
    encryptionEnabled: true,
    signedUrlExpiry: 3600 // 1 hour
  },
  maintenance: {
    enabled: false,
    message: '',
    allowedUsers: []
  },
  monitoring: {
    metricsEnabled: true,
    loggingLevel: 'info',
    alertsEnabled: true
  }
}

export class AdminSettingsManager {
  private static instance: AdminSettingsManager
  private settings: SystemSettings
  private lastUpdated: Date
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {
    this.settings = { ...DEFAULT_SETTINGS }
    this.lastUpdated = new Date()
  }

  static getInstance(): AdminSettingsManager {
    if (!AdminSettingsManager.instance) {
      AdminSettingsManager.instance = new AdminSettingsManager()
    }
    return AdminSettingsManager.instance
  }

  /**
   * Gets current system settings with caching
   */
  async getSettings(): Promise<SystemSettings> {
    // Check if cache is still valid
    if (Date.now() - this.lastUpdated.getTime() > this.CACHE_TTL) {
      await this.refreshFromDatabase()
    }
    
    return { ...this.settings }
  }

  /**
   * Gets specific setting category
   */
  async getUploadSettings(): Promise<FileUploadSettings> {
    const settings = await this.getSettings()
    return settings.upload
  }

  async getOCRSettings(): Promise<OCRSettings> {
    const settings = await this.getSettings()
    return settings.ocr
  }

  async getTranslationSettings(): Promise<TranslationSettings> {
    const settings = await this.getSettings()
    return settings.translation
  }

  async getStorageSettings(): Promise<StorageSettings> {
    const settings = await this.getSettings()
    return settings.storage
  }

  /**
   * Updates system settings (admin only)
   */
  async updateSettings(
    updates: Partial<SystemSettings>,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate admin permissions
      const isAdmin = await this.validateAdminAccess(adminUserId)
      if (!isAdmin) {
        return { success: false, error: 'Access denied: Admin privileges required' }
      }

      // Validate settings updates
      const validation = this.validateSettings(updates)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Merge with current settings
      const newSettings = this.mergeSettings(this.settings, updates)

      // Save to database
      const saveResult = await this.saveToDatabase(newSettings, adminUserId)
      if (!saveResult.success) {
        return { success: false, error: saveResult.error }
      }

      // Update cache
      this.settings = newSettings
      this.lastUpdated = new Date()

      // Log the change
      await this.logSettingsChange(adminUserId, updates)

      return { success: true }

    } catch (error) {
      console.error('Failed to update settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Resets settings to defaults (admin only)
   */
  async resetToDefaults(adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isAdmin = await this.validateAdminAccess(adminUserId)
      if (!isAdmin) {
        return { success: false, error: 'Access denied: Admin privileges required' }
      }

      const resetSettings = { ...DEFAULT_SETTINGS }
      
      const saveResult = await this.saveToDatabase(resetSettings, adminUserId)
      if (!saveResult.success) {
        return { success: false, error: saveResult.error }
      }

      this.settings = resetSettings
      this.lastUpdated = new Date()

      await this.logSettingsChange(adminUserId, { reset: true })

      return { success: true }

    } catch (error) {
      console.error('Failed to reset settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Gets settings change history (admin only)
   */
  async getSettingsHistory(
    adminUserId: string,
    limit = 50
  ): Promise<{ success: boolean; history?: any[]; error?: string }> {
    try {
      const isAdmin = await this.validateAdminAccess(adminUserId)
      if (!isAdmin) {
        return { success: false, error: 'Access denied: Admin privileges required' }
      }

      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: history, error } = await supabase
        .from('admin_settings_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return { success: true, history: history || [] }

    } catch (error) {
      console.error('Failed to get settings history:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validates file upload against current settings
   */
  async validateFileUpload(file: { size: number; type: string }): Promise<{
    valid: boolean
    error?: string
    shouldUseChunked?: boolean
    shouldUseQueue?: boolean
  }> {
    const settings = await this.getUploadSettings()

    // Check file size
    if (file.size > settings.maxFileSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit (${(settings.maxFileSize / 1024 / 1024).toFixed(1)}MB)`
      }
    }

    // Check file type
    if (!settings.allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not supported. Allowed types: ${settings.allowedFileTypes.join(', ')}`
      }
    }

    // Determine upload strategy
    const shouldUseChunked = file.size > settings.chunkedUploadThreshold
    const shouldUseQueue = file.size > settings.maxFileSizeEdge

    return {
      valid: true,
      shouldUseChunked,
      shouldUseQueue
    }
  }

  /**
   * Private methods
   */
  private async validateAdminAccess(userId: string): Promise<boolean> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: user, error } = await supabase
        .from('users')
        .select('role, permissions')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return false
      }

      return user.role === 'admin' || user.permissions?.includes('admin_settings')

    } catch (error) {
      console.error('Failed to validate admin access:', error)
      return false
    }
  }

  private validateSettings(updates: Partial<SystemSettings>): { valid: boolean; error?: string } {
    try {
      // Validate file size limits
      if (updates.upload) {
        const upload = updates.upload
        if (upload.maxFileSize && upload.maxFileSize < 1024 * 1024) {
          return { valid: false, error: 'Maximum file size must be at least 1MB' }
        }
        if (upload.maxFileSizeEdge && upload.maxFileSizeQueue && 
            upload.maxFileSizeEdge > upload.maxFileSizeQueue) {
          return { valid: false, error: 'Edge function limit cannot exceed queue limit' }
        }
      }

      // Validate OCR settings
      if (updates.ocr) {
        const ocr = updates.ocr
        if (ocr.maxProcessingTime && ocr.maxProcessingTime < 60) {
          return { valid: false, error: 'Maximum processing time must be at least 60 seconds' }
        }
        if (ocr.concurrentJobs && ocr.concurrentJobs < 1) {
          return { valid: false, error: 'Concurrent jobs must be at least 1' }
        }
      }

      // Validate translation settings
      if (updates.translation) {
        const translation = updates.translation
        if (translation.maxTextLength && translation.maxTextLength < 1000) {
          return { valid: false, error: 'Maximum text length must be at least 1000 characters' }
        }
        if (translation.concurrentTranslations && translation.concurrentTranslations < 1) {
          return { valid: false, error: 'Concurrent translations must be at least 1' }
        }
      }

      return { valid: true }

    } catch (error) {
      return { valid: false, error: 'Invalid settings format' }
    }
  }

  private mergeSettings(current: SystemSettings, updates: Partial<SystemSettings>): SystemSettings {
    const merged = { ...current }

    // Deep merge each section
    if (updates.upload) {
      merged.upload = { ...merged.upload, ...updates.upload }
    }
    if (updates.ocr) {
      merged.ocr = { 
        ...merged.ocr, 
        ...updates.ocr,
        engines: updates.ocr.engines ? { ...merged.ocr.engines, ...updates.ocr.engines } : merged.ocr.engines,
        qualitySettings: updates.ocr.qualitySettings ? { ...merged.ocr.qualitySettings, ...updates.ocr.qualitySettings } : merged.ocr.qualitySettings
      }
    }
    if (updates.translation) {
      merged.translation = {
        ...merged.translation,
        ...updates.translation,
        providers: updates.translation.providers ? { ...merged.translation.providers, ...updates.translation.providers } : merged.translation.providers,
        rateLimits: updates.translation.rateLimits ? { ...merged.translation.rateLimits, ...updates.translation.rateLimits } : merged.translation.rateLimits
      }
    }
    if (updates.storage) {
      merged.storage = { ...merged.storage, ...updates.storage }
    }
    if (updates.maintenance) {
      merged.maintenance = { ...merged.maintenance, ...updates.maintenance }
    }
    if (updates.monitoring) {
      merged.monitoring = { ...merged.monitoring, ...updates.monitoring }
    }

    return merged
  }

  private async refreshFromDatabase(): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: settingsData, error } = await supabase
        .from('admin_settings')
        .select('settings')
        .eq('active', true)
        .single()

      if (error) {
        console.error('Failed to load settings from database:', error)
        return
      }

      if (settingsData?.settings) {
        this.settings = this.mergeSettings(DEFAULT_SETTINGS, settingsData.settings)
        this.lastUpdated = new Date()
      }

    } catch (error) {
      console.error('Failed to refresh settings from database:', error)
    }
  }

  private async saveToDatabase(settings: SystemSettings, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Deactivate current settings
      await supabase
        .from('admin_settings')
        .update({ active: false })
        .eq('active', true)

      // Insert new settings
      const { error } = await supabase
        .from('admin_settings')
        .insert({
          settings,
          updated_by: adminUserId,
          active: true,
          created_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      return { success: true }

    } catch (error) {
      console.error('Failed to save settings to database:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database error'
      }
    }
  }

  private async logSettingsChange(adminUserId: string, changes: any): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      await supabase
        .from('admin_settings_history')
        .insert({
          admin_user_id: adminUserId,
          changes,
          timestamp: new Date().toISOString()
        })

    } catch (error) {
      console.error('Failed to log settings change:', error)
    }
  }
}

/**
 * Convenience functions for accessing settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const manager = AdminSettingsManager.getInstance()
  return manager.getSettings()
}

export async function getUploadSettings(): Promise<FileUploadSettings> {
  const manager = AdminSettingsManager.getInstance()
  return manager.getUploadSettings()
}

export async function getOCRSettings(): Promise<OCRSettings> {
  const manager = AdminSettingsManager.getInstance()
  return manager.getOCRSettings()
}

export async function getTranslationSettings(): Promise<TranslationSettings> {
  const manager = AdminSettingsManager.getInstance()
  return manager.getTranslationSettings()
}

export async function getStorageSettings(): Promise<StorageSettings> {
  const manager = AdminSettingsManager.getInstance()
  return manager.getStorageSettings()
}

export async function validateFileUpload(file: { size: number; type: string }) {
  const manager = AdminSettingsManager.getInstance()
  return manager.validateFileUpload(file)
}

export async function updateSystemSettings(updates: Partial<SystemSettings>, adminUserId: string) {
  const manager = AdminSettingsManager.getInstance()
  return manager.updateSettings(updates, adminUserId)
}

export { DEFAULT_SETTINGS }
export type { SystemSettings, FileUploadSettings, OCRSettings, TranslationSettings, StorageSettings }