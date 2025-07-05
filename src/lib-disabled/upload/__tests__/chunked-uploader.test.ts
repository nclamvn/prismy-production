/**
 * Unit tests for chunked file uploader
 */

import { vi } from 'vitest'
import { ChunkedUploader, uploadLargeFile, estimateUploadTime } from '../chunked-uploader'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ChunkedUploader', () => {
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateFile', () => {
    test('should validate supported file types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const result = ChunkedUploader.validateFile(file)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should reject unsupported file types', () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-executable' })
      const result = ChunkedUploader.validateFile(file)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not supported')
    })

    test('should reject files larger than 1GB', () => {
      const largeSize = 1.5 * 1024 * 1024 * 1024 // 1.5GB
      const file = new File(['x'.repeat(1000)], 'large.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: largeSize })
      
      const result = ChunkedUploader.validateFile(file)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum')
    })

    test('should reject empty files', () => {
      const file = new File([], 'empty.pdf', { type: 'application/pdf' })
      const result = ChunkedUploader.validateFile(file)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    test('should handle null file', () => {
      const result = ChunkedUploader.validateFile(null as any)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('No file provided')
    })
  })

  describe('createChunks', () => {
    test('should create chunks with default size', () => {
      const content = 'x'.repeat(10 * 1024 * 1024) // 10MB
      const file = new File([content], 'test.pdf', { type: 'application/pdf' })
      
      const chunks = ChunkedUploader.createChunks(file)
      
      expect(chunks).toHaveLength(2) // 10MB file with 5MB chunks = 2 chunks
      expect(chunks[0].size).toBe(5 * 1024 * 1024)
      expect(chunks[1].size).toBe(5 * 1024 * 1024)
      expect(chunks[0].start).toBe(0)
      expect(chunks[1].start).toBe(5 * 1024 * 1024)
    })

    test('should create chunks with custom size', () => {
      const content = 'x'.repeat(10 * 1024 * 1024) // 10MB
      const file = new File([content], 'test.pdf', { type: 'application/pdf' })
      const customChunkSize = 2 * 1024 * 1024 // 2MB
      
      const chunks = ChunkedUploader.createChunks(file, customChunkSize)
      
      expect(chunks).toHaveLength(5) // 10MB file with 2MB chunks = 5 chunks
      expect(chunks[0].size).toBe(customChunkSize)
    })

    test('should handle single chunk files', () => {
      const content = 'x'.repeat(1024 * 1024) // 1MB
      const file = new File([content], 'test.pdf', { type: 'application/pdf' })
      
      const chunks = ChunkedUploader.createChunks(file)
      
      expect(chunks).toHaveLength(1)
      expect(chunks[0].size).toBe(1024 * 1024)
      expect(chunks[0].attempts).toBe(0)
    })
  })

  describe('calculateOptimalChunkSize', () => {
    test('should return 5MB for files under 100MB', () => {
      const chunkSize = ChunkedUploader.calculateOptimalChunkSize(50 * 1024 * 1024)
      expect(chunkSize).toBe(5 * 1024 * 1024)
    })

    test('should return 10MB for files under 500MB', () => {
      const chunkSize = ChunkedUploader.calculateOptimalChunkSize(300 * 1024 * 1024)
      expect(chunkSize).toBe(10 * 1024 * 1024)
    })

    test('should return 25MB for files over 500MB', () => {
      const chunkSize = ChunkedUploader.calculateOptimalChunkSize(800 * 1024 * 1024)
      expect(chunkSize).toBe(25 * 1024 * 1024)
    })
  })

  describe('requiresChunkedUpload', () => {
    test('should return false for small files', () => {
      const file = new File(['small'], 'small.pdf', { type: 'application/pdf' })
      expect(ChunkedUploader.requiresChunkedUpload(file)).toBe(false)
    })

    test('should return true for large files', () => {
      const content = 'x'.repeat(60 * 1024 * 1024) // 60MB
      const file = new File([content], 'large.pdf', { type: 'application/pdf' })
      expect(ChunkedUploader.requiresChunkedUpload(file)).toBe(true)
    })
  })

  describe('uploadFile', () => {
    test('should upload file successfully with progress tracking', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ uploadId: 'test-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ etag: 'chunk-etag', uploadId: 'chunk-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ fileId: 'test-file-id', filePath: '/uploads/test.pdf' })
        })

      const progressUpdates: any[] = []
      const chunkCompletes: number[] = []

      const result = await ChunkedUploader.uploadFile(file, {
        onProgress: (progress) => progressUpdates.push(progress),
        onChunkComplete: (chunkIndex) => chunkCompletes.push(chunkIndex)
      })

      expect(result.success).toBe(true)
      expect(result.fileId).toBe('test-file-id')
      expect(result.filePath).toBe('/uploads/test.pdf')
      expect(result.metadata).toBeDefined()
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(chunkCompletes).toContain(0)
    })

    test('should handle upload initialization failure', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const result = await ChunkedUploader.uploadFile(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to initialize upload')
    })

    test('should retry failed chunks', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      // Mock initialization success, chunk failure, then success
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ uploadId: 'test-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Chunk upload failed'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ etag: 'chunk-etag', uploadId: 'chunk-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ fileId: 'test-file-id', filePath: '/uploads/test.pdf' })
        })

      const errorCallback = vi.fn()

      const result = await ChunkedUploader.uploadFile(file, {
        maxRetries: 2,
        onError: errorCallback
      })

      expect(result.success).toBe(true)
      expect(result.metadata?.retries).toBeGreaterThan(0)
    })

    test('should fail after max retries exceeded', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ uploadId: 'test-upload-id' })
        })
        .mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Persistent failure'
        })

      const result = await ChunkedUploader.uploadFile(file, {
        maxRetries: 2
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to upload')
    })

    test('should handle completion failure', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ uploadId: 'test-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ etag: 'chunk-etag', uploadId: 'chunk-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Completion failed'
        })

      const result = await ChunkedUploader.uploadFile(file)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Completion failed')
    })

    test('should handle concurrent uploads correctly', async () => {
      const content = 'x'.repeat(15 * 1024 * 1024) // 15MB file = 3 chunks
      const file = new File([content], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ uploadId: 'test-upload-id' })
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ etag: 'chunk-etag', uploadId: 'chunk-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ fileId: 'test-file-id', filePath: '/uploads/test.pdf' })
        })

      const result = await ChunkedUploader.uploadFile(file, {
        maxConcurrentUploads: 2
      })

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(5) // 1 init + 3 chunks + 1 complete
    })

    test('should validate file before upload', async () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-executable' })
      
      const result = await ChunkedUploader.uploadFile(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('not supported')
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('convenience functions', () => {
    test('uploadLargeFile should work', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ uploadId: 'test-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ etag: 'chunk-etag', uploadId: 'chunk-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ fileId: 'test-file-id', filePath: '/uploads/test.pdf' })
        })

      const result = await uploadLargeFile(file)
      expect(result.success).toBe(true)
    })

    test('estimateUploadTime should calculate correctly', () => {
      const fileSize = 100 * 1024 * 1024 // 100MB
      const speed = 10 * 1024 * 1024 // 10MB/s
      
      const time = estimateUploadTime(fileSize, speed)
      
      expect(time).toBeCloseTo(13, 0) // ~13 seconds with overhead
    })
  })

  describe('error handling', () => {
    test('should handle network errors gracefully', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await ChunkedUploader.uploadFile(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to initialize upload')
    })

    test('should handle malformed responses', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      })

      const result = await ChunkedUploader.uploadFile(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('progress and metrics', () => {
    test('should track upload speed and time remaining', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ uploadId: 'test-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ etag: 'chunk-etag', uploadId: 'chunk-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ fileId: 'test-file-id', filePath: '/uploads/test.pdf' })
        })

      const progressUpdates: any[] = []

      await ChunkedUploader.uploadFile(file, {
        onProgress: (progress) => progressUpdates.push(progress)
      })

      const lastProgress = progressUpdates[progressUpdates.length - 1]
      expect(lastProgress.speed).toBeGreaterThanOrEqual(0)
      expect(lastProgress.estimatedTimeRemaining).toBeGreaterThanOrEqual(0)
      expect(lastProgress.percentage).toBe(100)
    })

    test('should include metadata in successful results', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ uploadId: 'test-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ etag: 'chunk-etag', uploadId: 'chunk-upload-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ fileId: 'test-file-id', filePath: '/uploads/test.pdf' })
        })

      const result = await ChunkedUploader.uploadFile(file)

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.originalSize).toBe(file.size)
      expect(result.metadata?.chunksUploaded).toBe(1)
      expect(result.metadata?.retries).toBe(0)
      expect(result.metadata?.averageSpeed).toBeGreaterThan(0)
    })
  })
})