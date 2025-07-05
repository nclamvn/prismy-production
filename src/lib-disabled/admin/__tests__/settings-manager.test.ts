/**
 * Unit tests for Admin Settings Manager
 */

import { vi } from 'vitest'
import { 
  AdminSettingsManager, 
  getSystemSettings,
  getUploadSettings,
  validateFileUpload,
  DEFAULT_SETTINGS
} from '../settings-manager'

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin', permissions: ['admin_settings'] },
              error: null
            })
          }))
        }))
      }
    }
    if (table === 'admin_settings') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { settings: DEFAULT_SETTINGS },
              error: null
            })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        })),
        insert: vi.fn().mockResolvedValue({ error: null })
      }
    }
    if (table === 'admin_settings_history') {
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          }))
        })),
        insert: vi.fn().mockResolvedValue({ error: null })
      }
    }
    return {
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
      insert: vi.fn(),
      update: vi.fn(() => ({ eq: vi.fn() }))
    }
  })
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

describe('AdminSettingsManager', () => {
  let manager: AdminSettingsManager

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton instance
    ;(AdminSettingsManager as any).instance = undefined
    manager = AdminSettingsManager.getInstance()
  })

  describe('singleton pattern', () => {
    test('should return same instance', () => {
      const instance1 = AdminSettingsManager.getInstance()
      const instance2 = AdminSettingsManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('getSettings', () => {
    test('should return default settings initially', async () => {
      const settings = await manager.getSettings()
      
      expect(settings).toBeDefined()
      expect(settings.upload.maxFileSize).toBe(DEFAULT_SETTINGS.upload.maxFileSize)
      expect(settings.ocr.queueThreshold).toBe(DEFAULT_SETTINGS.ocr.queueThreshold)
    })

    test('should return cached settings on subsequent calls', async () => {
      await manager.getSettings()
      await manager.getSettings()
      
      // Should only call database once due to caching
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('admin_settings')
    })
  })

  describe('getUploadSettings', () => {
    test('should return upload settings section', async () => {
      const uploadSettings = await manager.getUploadSettings()
      
      expect(uploadSettings).toBeDefined()
      expect(uploadSettings.maxFileSize).toBe(DEFAULT_SETTINGS.upload.maxFileSize)
      expect(uploadSettings.allowedFileTypes).toEqual(DEFAULT_SETTINGS.upload.allowedFileTypes)
    })
  })

  describe('updateSettings', () => {
    test('should update settings for admin user', async () => {
      const updates = {
        upload: {
          maxFileSize: 2 * 1024 * 1024 * 1024 // 2GB
        }
      }
      
      const result = await manager.updateSettings(updates, 'admin-user-id')
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should reject updates from non-admin user', async () => {
      // Mock non-admin user
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'user', permissions: [] },
              error: null
            })
          }))
        }))
      }))

      const updates = {
        upload: {
          maxFileSize: 2 * 1024 * 1024 * 1024
        }
      }
      
      const result = await manager.updateSettings(updates, 'user-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Access denied')
    })

    test('should validate settings before saving', async () => {
      const invalidUpdates = {
        upload: {
          maxFileSize: 500 * 1024 // 500KB - too small
        }
      }
      
      const result = await manager.updateSettings(invalidUpdates, 'admin-user-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('at least 1MB')
    })

    test('should validate OCR settings', async () => {
      const invalidUpdates = {
        ocr: {
          maxProcessingTime: 30 // Too short
        }
      }
      
      const result = await manager.updateSettings(invalidUpdates, 'admin-user-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('at least 60 seconds')
    })

    test('should validate edge vs queue limits', async () => {
      const invalidUpdates = {
        upload: {
          maxFileSizeEdge: 100 * 1024 * 1024, // 100MB
          maxFileSizeQueue: 50 * 1024 * 1024   // 50MB - smaller than edge
        }
      }
      
      const result = await manager.updateSettings(invalidUpdates, 'admin-user-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('cannot exceed queue limit')
    })
  })

  describe('resetToDefaults', () => {
    test('should reset settings for admin user', async () => {
      const result = await manager.resetToDefaults('admin-user-id')
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should reject reset from non-admin user', async () => {
      // Mock non-admin user
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'user', permissions: [] },
              error: null
            })
          }))
        }))
      }))
      
      const result = await manager.resetToDefaults('user-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Access denied')
    })
  })

  describe('validateFileUpload', () => {
    test('should validate file size against settings', async () => {
      const largeFile = {
        size: 2 * 1024 * 1024 * 1024, // 2GB
        type: 'application/pdf'
      }
      
      const result = await manager.validateFileUpload(largeFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum limit')
    })

    test('should validate file type against settings', async () => {
      const invalidFile = {
        size: 10 * 1024 * 1024, // 10MB
        type: 'application/x-executable'
      }
      
      const result = await manager.validateFileUpload(invalidFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not supported')
    })

    test('should determine upload strategy for valid files', async () => {
      const mediumFile = {
        size: 75 * 1024 * 1024, // 75MB
        type: 'application/pdf'
      }
      
      const result = await manager.validateFileUpload(mediumFile)
      
      expect(result.valid).toBe(true)
      expect(result.shouldUseChunked).toBe(true) // > 50MB threshold
      expect(result.shouldUseQueue).toBe(true) // > edge limit
    })

    test('should handle small files correctly', async () => {
      const smallFile = {
        size: 5 * 1024 * 1024, // 5MB
        type: 'application/pdf'
      }
      
      const result = await manager.validateFileUpload(smallFile)
      
      expect(result.valid).toBe(true)
      expect(result.shouldUseChunked).toBe(false) // < 50MB threshold
      expect(result.shouldUseQueue).toBe(false) // < edge limit
    })
  })

  describe('convenience functions', () => {
    test('getSystemSettings should work', async () => {
      const settings = await getSystemSettings()
      
      expect(settings).toBeDefined()
      expect(settings.upload).toBeDefined()
      expect(settings.ocr).toBeDefined()
    })

    test('getUploadSettings should work', async () => {
      const uploadSettings = await getUploadSettings()
      
      expect(uploadSettings).toBeDefined()
      expect(uploadSettings.maxFileSize).toBeDefined()
      expect(uploadSettings.allowedFileTypes).toBeDefined()
    })

    test('validateFileUpload should work', async () => {
      const file = {
        size: 10 * 1024 * 1024,
        type: 'application/pdf'
      }
      
      const result = await validateFileUpload(file)
      
      expect(result.valid).toBe(true)
    })
  })

  describe('settings merging', () => {
    test('should merge settings correctly', async () => {
      const updates = {
        upload: {
          maxFileSize: 2 * 1024 * 1024 * 1024
        },
        ocr: {
          concurrentJobs: 5
        }
      }
      
      await manager.updateSettings(updates, 'admin-user-id')
      const settings = await manager.getSettings()
      
      // Should have updated values
      expect(settings.upload.maxFileSize).toBe(2 * 1024 * 1024 * 1024)
      expect(settings.ocr.concurrentJobs).toBe(5)
      
      // Should preserve other values
      expect(settings.upload.allowedFileTypes).toEqual(DEFAULT_SETTINGS.upload.allowedFileTypes)
      expect(settings.ocr.queueThreshold).toBe(DEFAULT_SETTINGS.ocr.queueThreshold)
    })

    test('should handle nested object updates', async () => {
      const updates = {
        ocr: {
          engines: {
            tesseract: { enabled: false, priority: 1 }
          }
        }
      }
      
      await manager.updateSettings(updates, 'admin-user-id')
      const settings = await manager.getSettings()
      
      // Should update specific engine
      expect(settings.ocr.engines.tesseract.enabled).toBe(false)
      
      // Should preserve other engines
      expect(settings.ocr.engines.googleVision).toEqual(DEFAULT_SETTINGS.ocr.engines.googleVision)
    })
  })

  describe('error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from = vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Database connection failed' }
        })
      }))
      
      const updates = {
        upload: {
          maxFileSize: 2 * 1024 * 1024 * 1024
        }
      }
      
      const result = await manager.updateSettings(updates, 'admin-user-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
    })

    test('should handle missing user gracefully', async () => {
      // Mock user not found
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' }
            })
          }))
        }))
      }))
      
      const updates = {
        upload: {
          maxFileSize: 2 * 1024 * 1024 * 1024
        }
      }
      
      const result = await manager.updateSettings(updates, 'nonexistent-user')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Access denied')
    })
  })

  describe('default settings validation', () => {
    test('DEFAULT_SETTINGS should be valid', () => {
      expect(DEFAULT_SETTINGS.upload.maxFileSize).toBeGreaterThan(0)
      expect(DEFAULT_SETTINGS.upload.allowedFileTypes.length).toBeGreaterThan(0)
      expect(DEFAULT_SETTINGS.ocr.queueThreshold).toBeGreaterThan(0)
      expect(DEFAULT_SETTINGS.ocr.maxProcessingTime).toBeGreaterThanOrEqual(60)
      expect(DEFAULT_SETTINGS.ocr.concurrentJobs).toBeGreaterThanOrEqual(1)
      expect(DEFAULT_SETTINGS.translation.maxTextLength).toBeGreaterThan(0)
      expect(DEFAULT_SETTINGS.storage.maxStoragePerUser).toBeGreaterThan(0)
    })

    test('should have consistent file size hierarchy', () => {
      expect(DEFAULT_SETTINGS.upload.maxFileSizeEdge).toBeLessThanOrEqual(DEFAULT_SETTINGS.upload.maxFileSizeQueue)
      expect(DEFAULT_SETTINGS.upload.maxFileSizeQueue).toBeLessThanOrEqual(DEFAULT_SETTINGS.upload.maxFileSize)
    })

    test('should have reasonable default values', () => {
      // File sizes should be in reasonable ranges
      expect(DEFAULT_SETTINGS.upload.maxFileSize).toBe(1024 * 1024 * 1024) // 1GB
      expect(DEFAULT_SETTINGS.upload.maxFileSizeEdge).toBe(50 * 1024 * 1024) // 50MB
      
      // OCR settings should be reasonable
      expect(DEFAULT_SETTINGS.ocr.maxProcessingTime).toBe(30 * 60) // 30 minutes
      expect(DEFAULT_SETTINGS.ocr.concurrentJobs).toBe(3) // 3 concurrent jobs
      
      // At least one OCR engine should be enabled
      const enabledEngines = Object.values(DEFAULT_SETTINGS.ocr.engines).filter(engine => engine.enabled)
      expect(enabledEngines.length).toBeGreaterThan(0)
    })
  })
})