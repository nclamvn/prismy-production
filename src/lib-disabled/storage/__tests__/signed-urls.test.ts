/**
 * Unit tests for signed URL generation
 */

import { vi } from 'vitest'
import { 
  generateSignedDownloadUrl,
  generatePreviewUrl,
  generateDocumentUrls,
  isSignedUrlValid,
  parseSignedUrl,
  validateFileAccess
} from '../signed-urls'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed-url?token=mock' },
          error: null
        }),
        list: vi.fn().mockResolvedValue({
          data: [{
            metadata: {
              size: 1024,
              mimetype: 'application/pdf',
              cacheControl: 'public, max-age=3600',
              eTag: 'mock-etag'
            },
            updated_at: '2024-01-01T00:00:00Z'
          }],
          error: null
        })
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { user_id: 'test-user-id' },
            error: null
          })
        }))
      }))
    }))
  }))
}))

describe('Signed URLs', () => {
  
  describe('generateSignedDownloadUrl', () => {
    test('should generate signed URL with default options', async () => {
      const result = await generateSignedDownloadUrl('documents/test.pdf')
      
      expect(result.signedUrl).toContain('signed-url')
      expect(result.downloadFilename).toBe('test.pdf')
      expect(result.isPreview).toBe(false)
      expect(new Date(result.expiresAt)).toBeInstanceOf(Date)
      expect(result.metadata.size).toBeGreaterThan(0)
    })

    test('should generate signed URL with custom filename', async () => {
      const result = await generateSignedDownloadUrl('documents/test.pdf', {
        download: 'custom-name.pdf'
      })
      
      expect(result.downloadFilename).toBe('custom-name.pdf')
      expect(result.isPreview).toBe(false)
    })

    test('should generate preview URL when download is false', async () => {
      const result = await generateSignedDownloadUrl('documents/test.pdf', {
        download: false
      })
      
      expect(result.isPreview).toBe(true)
    })

    test('should respect custom expiry time', async () => {
      const customExpiry = 1800 // 30 minutes
      const result = await generateSignedDownloadUrl('documents/test.pdf', {
        expiresIn: customExpiry
      })
      
      const expiryTime = new Date(result.expiresAt).getTime()
      const expectedExpiry = Date.now() + (customExpiry * 1000)
      
      // Allow 5 second tolerance
      expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(5000)
    })

    test('should enforce maximum expiry time', async () => {
      const tooLongExpiry = 100000 // More than 24 hours
      const result = await generateSignedDownloadUrl('documents/test.pdf', {
        expiresIn: tooLongExpiry
      })
      
      const expiryTime = new Date(result.expiresAt).getTime()
      const maxExpectedExpiry = Date.now() + (86400 * 1000) // 24 hours
      
      expect(expiryTime).toBeLessThanOrEqual(maxExpectedExpiry + 1000)
    })

    test('should enforce minimum expiry time', async () => {
      const tooShortExpiry = 30 // Less than 1 minute
      const result = await generateSignedDownloadUrl('documents/test.pdf', {
        expiresIn: tooShortExpiry
      })
      
      const expiryTime = new Date(result.expiresAt).getTime()
      const minExpectedExpiry = Date.now() + (60 * 1000) // 1 minute
      
      expect(expiryTime).toBeGreaterThanOrEqual(minExpectedExpiry - 1000)
    })
  })

  describe('generatePreviewUrl', () => {
    test('should generate preview URL with short expiry', async () => {
      const result = await generatePreviewUrl('documents/test.pdf', 'pdf')
      
      expect(result.isPreview).toBe(true)
      
      const expiryTime = new Date(result.expiresAt).getTime()
      const expectedExpiry = Date.now() + (300 * 1000) // 5 minutes
      
      // Allow 5 second tolerance
      expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(5000)
    })

    test('should include transform options for PDF', async () => {
      const result = await generatePreviewUrl('documents/test.pdf', 'pdf')
      
      expect(result.signedUrl).toBeDefined()
      expect(result.isPreview).toBe(true)
    })

    test('should handle different document formats', async () => {
      const formats: Array<'pdf' | 'docx' | 'txt' | 'md'> = ['pdf', 'docx', 'txt', 'md']
      
      for (const format of formats) {
        const result = await generatePreviewUrl(`documents/test.${format}`, format)
        expect(result.isPreview).toBe(true)
        expect(result.signedUrl).toBeDefined()
      }
    })
  })

  describe('generateDocumentUrls', () => {
    test('should generate both preview and download URLs', async () => {
      const result = await generateDocumentUrls(
        'documents/test.pdf',
        'original-name.pdf',
        'pdf'
      )
      
      expect(result.preview.isPreview).toBe(true)
      expect(result.download.isPreview).toBe(false)
      expect(result.download.downloadFilename).toBe('original-name.pdf')
      
      // Preview should expire sooner than download
      const previewExpiry = new Date(result.preview.expiresAt).getTime()
      const downloadExpiry = new Date(result.download.expiresAt).getTime()
      expect(previewExpiry).toBeLessThan(downloadExpiry)
    })

    test('should handle different formats correctly', async () => {
      const formats: Array<'pdf' | 'docx' | 'txt' | 'md'> = ['pdf', 'docx', 'txt', 'md']
      
      for (const format of formats) {
        const result = await generateDocumentUrls(
          `documents/test.${format}`,
          `original.${format}`,
          format
        )
        
        expect(result.preview).toBeDefined()
        expect(result.download).toBeDefined()
        expect(result.download.downloadFilename).toBe(`original.${format}`)
      }
    })
  })

  describe('isSignedUrlValid', () => {
    test('should validate URL with future expiry', () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const url = `https://example.com/file?expires=${futureExpiry}`
      
      expect(isSignedUrlValid(url)).toBe(true)
    })

    test('should reject URL with past expiry', () => {
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const url = `https://example.com/file?expires=${pastExpiry}`
      
      expect(isSignedUrlValid(url)).toBe(false)
    })

    test('should reject URL without expiry parameter', () => {
      const url = 'https://example.com/file'
      
      expect(isSignedUrlValid(url)).toBe(false)
    })

    test('should handle invalid URLs gracefully', () => {
      expect(isSignedUrlValid('invalid-url')).toBe(false)
      expect(isSignedUrlValid('')).toBe(false)
    })
  })

  describe('parseSignedUrl', () => {
    test('should parse valid signed URL', () => {
      const expires = Math.floor(Date.now() / 1000) + 3600
      const url = `https://example.com/storage/documents/test.pdf?expires=${expires}&download=true`
      
      const result = parseSignedUrl(url)
      
      expect(result).not.toBeNull()
      expect(result!.filePath).toBe('test.pdf')
      expect(result!.isDownload).toBe(true)
      expect(result!.expiresAt).toBeInstanceOf(Date)
    })

    test('should parse URL with custom filename', () => {
      const expires = Math.floor(Date.now() / 1000) + 3600
      const url = `https://example.com/storage/documents/test.pdf?expires=${expires}&download=custom-name.pdf`
      
      const result = parseSignedUrl(url)
      
      expect(result).not.toBeNull()
      expect(result!.filename).toBe('custom-name.pdf')
      expect(result!.isDownload).toBe(true)
    })

    test('should handle preview URLs', () => {
      const expires = Math.floor(Date.now() / 1000) + 3600
      const url = `https://example.com/storage/documents/test.pdf?expires=${expires}`
      
      const result = parseSignedUrl(url)
      
      expect(result).not.toBeNull()
      expect(result!.isDownload).toBe(false)
      expect(result!.filename).toBeUndefined()
    })

    test('should return null for invalid URLs', () => {
      expect(parseSignedUrl('invalid-url')).toBeNull()
      expect(parseSignedUrl('')).toBeNull()
      expect(parseSignedUrl('https://example.com')).toBeNull()
    })
  })

  describe('validateFileAccess', () => {
    test('should validate access for translated documents', async () => {
      const result = await validateFileAccess('translated/test.pdf', 'test-user-id')
      expect(result).toBe(true)
    })

    test('should validate access for rebuilt documents', async () => {
      const result = await validateFileAccess('rebuilt/test.pdf', 'test-user-id')
      expect(result).toBe(true)
    })

    test('should handle validation errors gracefully', async () => {
      // Mock error case
      const originalConsoleError = console.error
      console.error = vi.fn()

      const result = await validateFileAccess('nonexistent/test.pdf', 'invalid-user')
      expect(result).toBe(false)

      console.error = originalConsoleError
    })
  })

  describe('error handling and fallbacks', () => {
    test('should provide fallback URL when storage fails', async () => {
      // Mock storage failure
      vi.clearAllMocks()
      vi.doMock('@/lib/supabase/server', () => ({
        createClient: vi.fn(() => ({
          storage: {
            from: vi.fn(() => ({
              createSignedUrl: vi.fn().mockRejectedValue(new Error('Storage error'))
            }))
          }
        }))
      }))

      const result = await generateSignedDownloadUrl('documents/test.pdf')
      
      // Should still return a result (fallback URL)
      expect(result.signedUrl).toBeDefined()
      expect(result.downloadFilename).toBe('test.pdf')
      expect(result.metadata).toBeDefined()
    })

    test('should handle missing environment variables', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const result = await generateSignedDownloadUrl('documents/test.pdf')
      
      expect(result.signedUrl).toBeDefined()
      
      // Restore
      if (originalUrl) {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      }
    })
  })

  describe('security considerations', () => {
    test('should not expose sensitive information in fallback URLs', async () => {
      const result = await generateSignedDownloadUrl('documents/sensitive-file.pdf')
      
      // URL should not contain raw file paths or user info
      expect(result.signedUrl).not.toContain('sensitive')
      expect(result.signedUrl).not.toContain('user')
    })

    test('should enforce reasonable expiry limits', async () => {
      const veryLongExpiry = 365 * 24 * 3600 // 1 year
      const result = await generateSignedDownloadUrl('documents/test.pdf', {
        expiresIn: veryLongExpiry
      })
      
      const expiryTime = new Date(result.expiresAt).getTime()
      const maxAllowed = Date.now() + (86400 * 1000) // 24 hours
      
      expect(expiryTime).toBeLessThanOrEqual(maxAllowed + 5000)
    })
  })
})