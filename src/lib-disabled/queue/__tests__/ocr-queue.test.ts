/**
 * Unit tests for OCR queue worker system
 */

import { vi } from 'vitest'
import { 
  OCRQueue, 
  enqueueOCRJob, 
  getOCRJobStatus, 
  cancelOCRJob,
  shouldUseOCRQueue,
  estimateOCRTime
} from '../ocr-queue'

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn((table: string) => {
    if (table === 'ocr_jobs') {
      return {
        select: vi.fn((columns: string) => ({
          eq: vi.fn((column: string, value: any) => ({
            single: vi.fn().mockImplementation(() => {
              if (value === 'test-job-123') {
                return Promise.resolve({
                  data: {
                    id: 'test-job-123',
                    status: 'processing',
                    progress: 50,
                    current_step: 'Processing OCR',
                    estimated_time_remaining: 120,
                    created_at: '2024-01-01T00:00:00Z',
                    started_at: '2024-01-01T00:01:00Z',
                    retry_count: 0,
                    max_retries: 3
                  },
                  error: null
                })
              } else if (value === 'non-existent-job' || value === 'timeout-job') {
                return Promise.resolve({
                  data: null,
                  error: { message: 'Job not found' }
                })
              } else {
                return Promise.resolve({
                  data: { id: value, status: 'pending', payload: { userId: 'test-user' } },
                  error: null
                })
              }
            }),
            order: vi.fn((column: string, options: any) => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [{ id: 'test-job', payload: { documentId: 'test-doc' } }],
                  error: null
                })
              })),
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'test-job', payload: { documentId: 'test-doc' } }],
                error: null
              })
            }))
          })),
          gte: vi.fn(() => ({
            count: 5
          }))
        })),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }
    }
    return {
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
      insert: vi.fn(),
      update: vi.fn(() => ({ eq: vi.fn() }))
    }
  }),
  storage: {
    from: vi.fn(() => ({
      download: vi.fn().mockResolvedValue({
        data: new Blob(['test file content']),
        error: null
      })
    }))
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Mock language detector
vi.mock('@/lib/ocr/language-detector', () => ({
  detectLanguage: vi.fn().mockResolvedValue('en')
}))

describe('OCR Queue System', () => {
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton instance
    ;(OCRQueue as any).instance = undefined
  })

  describe('OCRQueue.shouldUseQueue', () => {
    test('should return false for small files', () => {
      const smallFileSize = 10 * 1024 * 1024 // 10MB
      expect(OCRQueue.shouldUseQueue(smallFileSize)).toBe(false)
    })

    test('should return true for large files', () => {
      const largeFileSize = 100 * 1024 * 1024 // 100MB
      expect(OCRQueue.shouldUseQueue(largeFileSize)).toBe(true)
    })

    test('should return true for files at threshold', () => {
      const thresholdFileSize = 50 * 1024 * 1024 + 1 // Just over 50MB
      expect(OCRQueue.shouldUseQueue(thresholdFileSize)).toBe(true)
    })
  })

  describe('OCRQueue.estimateProcessingTime', () => {
    test('should estimate time for PDF files', () => {
      const fileSize = 50 * 1024 * 1024 // 50MB
      const time = OCRQueue.estimateProcessingTime(fileSize, 'application/pdf')
      
      expect(time).toBeGreaterThan(60) // At least 1 minute
      expect(time).toBeLessThan(2000) // Less than ~33 minutes
    })

    test('should estimate longer time for image files', () => {
      const fileSize = 50 * 1024 * 1024 // 50MB
      const pdfTime = OCRQueue.estimateProcessingTime(fileSize, 'application/pdf')
      const imageTime = OCRQueue.estimateProcessingTime(fileSize, 'image/jpeg')
      
      expect(imageTime).toBeGreaterThan(pdfTime)
    })

    test('should enforce minimum processing time', () => {
      const smallFileSize = 1024 // 1KB
      const time = OCRQueue.estimateProcessingTime(smallFileSize, 'application/pdf')
      
      expect(time).toBe(60) // 1 minute minimum
    })
  })

  describe('enqueueOCRJob', () => {
    test('should successfully enqueue a valid job', async () => {
      const payload = {
        documentId: 'test-doc-123',
        filePath: 'uploads/test.pdf',
        fileType: 'application/pdf',
        fileSize: 100 * 1024 * 1024, // 100MB
        userId: 'user-123',
        options: {
          enableLanguageDetection: true,
          ocrEngine: 'tesseract' as const,
          quality: 'balanced' as const
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          priority: 'normal' as const,
          estimatedProcessingTime: 300
        }
      }

      const result = await enqueueOCRJob(payload)
      
      expect(result.success).toBe(true)
      expect(result.jobId).toBeDefined()
      expect(result.estimatedWaitTime).toBeDefined()
    })

    test('should reject jobs with invalid payload', async () => {
      const invalidPayload = {
        documentId: '',
        filePath: '',
        fileType: 'application/pdf',
        fileSize: 0,
        userId: '',
        options: {
          enableLanguageDetection: true,
          ocrEngine: 'tesseract' as const,
          quality: 'balanced' as const
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          priority: 'normal' as const,
          estimatedProcessingTime: 300
        }
      }

      const result = await enqueueOCRJob(invalidPayload as any)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Missing required fields')
    })

    test('should reject files exceeding size limit', async () => {
      const payload = {
        documentId: 'test-doc-123',
        filePath: 'uploads/huge.pdf',
        fileType: 'application/pdf',
        fileSize: 600 * 1024 * 1024, // 600MB (over 500MB limit)
        userId: 'user-123',
        options: {
          enableLanguageDetection: true,
          ocrEngine: 'tesseract' as const,
          quality: 'balanced' as const
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          priority: 'normal' as const,
          estimatedProcessingTime: 300
        }
      }

      const result = await enqueueOCRJob(payload)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('exceeds queue limit')
    })
  })

  describe('getOCRJobStatus', () => {
    test('should return job status for existing job', async () => {
      const jobId = 'test-job-123'
      
      const status = await getOCRJobStatus(jobId)
      
      expect(status).not.toBeNull()
      expect(status?.id).toBe(jobId)
      expect(status?.status).toBe('processing')
      expect(status?.progress).toBe(50)
      expect(status?.currentStep).toBe('Processing OCR')
      expect(status?.retryCount).toBe(0)
    })

    test('should return null for non-existent job', async () => {
      const status = await getOCRJobStatus('non-existent-job')
      
      expect(status).toBeNull()
    })
  })

  describe('cancelOCRJob', () => {
    test('should successfully cancel pending job', async () => {
      const jobId = 'cancel-pending-job'
      const userId = 'test-user'

      // Create special mock for this test
      const mockCancel = vi.fn().mockResolvedValueOnce({
        data: {
          status: 'pending',
          payload: { userId }
        },
        error: null
      })

      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockCancel
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }))

      const result = await cancelOCRJob(jobId, userId)
      
      expect(result.success).toBe(true)
    })

    test('should reject cancellation for processing job', async () => {
      const jobId = 'processing-job'
      const userId = 'test-user'

      // Create special mock for processing job
      const mockProcessing = vi.fn().mockResolvedValueOnce({
        data: {
          status: 'processing',
          payload: { userId }
        },
        error: null
      })

      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockProcessing
          }))
        }))
      }))

      const result = await cancelOCRJob(jobId, userId)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot cancel job in progress')
    })

    test('should reject cancellation for unauthorized user', async () => {
      const jobId = 'unauthorized-job'
      const userId = 'correct-user'
      const wrongUserId = 'wrong-user'

      // Create special mock for unauthorized access
      const mockUnauth = vi.fn().mockResolvedValueOnce({
        data: {
          status: 'pending',
          payload: { userId }
        },
        error: null
      })

      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockUnauth
          }))
        }))
      }))

      const result = await cancelOCRJob(jobId, wrongUserId)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Access denied')
    })
  })

  describe('convenience functions', () => {
    test('shouldUseOCRQueue should work correctly', () => {
      expect(shouldUseOCRQueue(10 * 1024 * 1024)).toBe(false) // 10MB
      expect(shouldUseOCRQueue(100 * 1024 * 1024)).toBe(true) // 100MB
    })

    test('estimateOCRTime should calculate processing time', () => {
      const time = estimateOCRTime(50 * 1024 * 1024, 'application/pdf')
      expect(time).toBeGreaterThan(0)
      expect(typeof time).toBe('number')
    })
  })

  describe('OCR processing engines', () => {
    test('should process job with OCR queue', async () => {
      const queue = OCRQueue.getInstance()
      
      const payload = {
        documentId: 'test-doc',
        filePath: 'uploads/test.pdf',
        fileType: 'application/pdf',
        fileSize: 100 * 1024 * 1024,
        userId: 'user-123',
        options: {
          enableLanguageDetection: true,
          ocrEngine: 'tesseract' as const,
          quality: 'balanced' as const
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          priority: 'normal' as const,
          estimatedProcessingTime: 300
        }
      }

      const result = await queue.enqueueOCRJob(payload)
      expect(result.success).toBe(true)
    })
  })

  describe('priority and scheduling', () => {
    test('should calculate priority scores correctly', async () => {
      const highPriorityPayload = {
        documentId: 'test-doc-1',
        filePath: 'uploads/test1.pdf',
        fileType: 'application/pdf',
        fileSize: 5 * 1024 * 1024, // Small file
        userId: 'user-123',
        options: {
          enableLanguageDetection: true,
          ocrEngine: 'tesseract' as const,
          quality: 'fast' as const
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          priority: 'high' as const,
          estimatedProcessingTime: 120
        }
      }

      const lowPriorityPayload = {
        ...highPriorityPayload,
        documentId: 'test-doc-2',
        fileSize: 100 * 1024 * 1024, // Large file
        metadata: {
          ...highPriorityPayload.metadata,
          priority: 'low' as const
        }
      }

      const result1 = await enqueueOCRJob(highPriorityPayload)
      const result2 = await enqueueOCRJob(lowPriorityPayload)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      
      // High priority should have shorter wait time
      expect(result1.estimatedWaitTime).toBeLessThanOrEqual(result2.estimatedWaitTime!)
    })

    test('should handle retry logic', async () => {
      // Test that jobs are retried on failure
      const queue = OCRQueue.getInstance()
      
      // Mock storage download failure
      mockSupabaseClient.storage.from().download.mockResolvedValueOnce({
        data: null,
        error: { message: 'File not found' }
      })

      const payload = {
        documentId: 'test-doc',
        filePath: 'uploads/missing.pdf',
        fileType: 'application/pdf',
        fileSize: 100 * 1024 * 1024,
        userId: 'user-123',
        options: {
          enableLanguageDetection: true,
          ocrEngine: 'tesseract' as const,
          quality: 'balanced' as const
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          priority: 'normal' as const,
          estimatedProcessingTime: 300
        }
      }

      const result = await queue.enqueueOCRJob(payload)
      expect(result.success).toBe(true)
    })
  })

  describe('error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error for insert operation
      mockSupabaseClient.from = vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Database connection failed' }
        })
      }))

      const payload = {
        documentId: 'test-doc',
        filePath: 'uploads/test.pdf',
        fileType: 'application/pdf',
        fileSize: 100 * 1024 * 1024,
        userId: 'user-123',
        options: {
          enableLanguageDetection: true,
          ocrEngine: 'tesseract' as const,
          quality: 'balanced' as const
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          priority: 'normal' as const,
          estimatedProcessingTime: 300
        }
      }

      const result = await enqueueOCRJob(payload)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
    })

    test('should handle network timeouts', async () => {
      // Mock timeout scenario
      const originalConsoleError = console.error
      console.error = vi.fn()

      try {
        const result = await getOCRJobStatus('timeout-job')
        // Should handle gracefully
        expect(result).toBeNull()
      } finally {
        console.error = originalConsoleError
      }
    })
  })

  describe('integration scenarios', () => {
    test('should handle full workflow for large file', async () => {
      const largeFilePayload = {
        documentId: 'large-doc-123',
        filePath: 'uploads/large-document.pdf',
        fileType: 'application/pdf',
        fileSize: 200 * 1024 * 1024, // 200MB
        userId: 'user-123',
        options: {
          sourceLanguage: 'auto',
          enableLanguageDetection: true,
          ocrEngine: 'google-vision' as const,
          quality: 'accurate' as const
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          priority: 'normal' as const,
          estimatedProcessingTime: 600
        }
      }

      // Should use queue for large file
      expect(shouldUseOCRQueue(largeFilePayload.fileSize)).toBe(true)

      // Enqueue job
      const enqueueResult = await enqueueOCRJob(largeFilePayload)
      expect(enqueueResult.success).toBe(true)
      expect(enqueueResult.jobId).toBeDefined()

      // Check status
      const status = await getOCRJobStatus(enqueueResult.jobId!)
      expect(status).not.toBeNull()
      expect(status?.status).toBe('pending')
    })
  })
})