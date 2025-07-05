interface UploadChunk {
  index: number
  data: Blob
  size: number
  start: number
  end: number
  etag?: string
  uploadId?: string
  attempts: number
  lastError?: string
}

interface UploadProgress {
  uploadedBytes: number
  totalBytes: number
  percentage: number
  chunksUploaded: number
  totalChunks: number
  currentChunk?: number
  speed: number // bytes per second
  estimatedTimeRemaining: number // seconds
  failedChunks: number
}

interface UploadResult {
  success: boolean
  fileId?: string
  filePath?: string
  uploadTime?: number
  error?: string
  metadata?: {
    originalSize: number
    chunksUploaded: number
    retries: number
    averageSpeed: number
  }
}

interface ChunkUploadOptions {
  chunkSize?: number
  maxRetries?: number
  maxConcurrentUploads?: number
  retryDelay?: number
  onProgress?: (progress: UploadProgress) => void
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void
  onError?: (error: Error, chunk?: UploadChunk) => void
}

export class ChunkedUploader {
  private static readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
  private static readonly MIN_CHUNK_SIZE = 1024 * 1024 // 1MB minimum
  private static readonly MAX_CHUNK_SIZE = 100 * 1024 * 1024 // 100MB maximum
  private static readonly MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB max
  private static readonly DEFAULT_MAX_CONCURRENT_UPLOADS = 3
  private static readonly DEFAULT_MAX_RETRIES = 3
  private static readonly DEFAULT_RETRY_DELAY = 1000 // 1 second base delay

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' }
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty' }
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (1GB)`
      }
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png'
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not supported. Please upload PDF, DOCX, DOC, TXT, MD, JPG, or PNG files.`
      }
    }

    return { valid: true }
  }

  static createChunks(file: File, chunkSize?: number): UploadChunk[] {
    const chunks: UploadChunk[] = []
    const effectiveChunkSize = chunkSize || this.DEFAULT_CHUNK_SIZE
    const totalChunks = Math.ceil(file.size / effectiveChunkSize)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * effectiveChunkSize
      const end = Math.min(start + effectiveChunkSize, file.size)
      const chunk = file.slice(start, end)

      chunks.push({
        index: i,
        data: chunk,
        size: chunk.size,
        start,
        end,
        attempts: 0
      })
    }

    return chunks
  }

  static calculateOptimalChunkSize(fileSize: number): number {
    if (fileSize < 100 * 1024 * 1024) return 5 * 1024 * 1024 // 5MB for < 100MB
    if (fileSize < 500 * 1024 * 1024) return 10 * 1024 * 1024 // 10MB for < 500MB
    return 25 * 1024 * 1024 // 25MB for >= 500MB
  }

  static requiresChunkedUpload(file: File): boolean {
    const CHUNKED_UPLOAD_THRESHOLD = 50 * 1024 * 1024 // 50MB
    return file.size > CHUNKED_UPLOAD_THRESHOLD
  }

  static async uploadFile(
    file: File,
    options: ChunkUploadOptions = {}
  ): Promise<UploadResult> {
    const {
      chunkSize = this.calculateOptimalChunkSize(file.size),
      maxRetries = this.DEFAULT_MAX_RETRIES,
      maxConcurrentUploads = this.DEFAULT_MAX_CONCURRENT_UPLOADS,
      retryDelay = this.DEFAULT_RETRY_DELAY,
      onProgress,
      onChunkComplete,
      onError
    } = options

    const startTime = Date.now()
    try {
      // Validate file first
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Create chunks with optimal size
      const chunks = this.createChunks(file, chunkSize)
      const totalChunks = chunks.length
      const totalBytes = file.size

      // Initialize upload session
      const uploadId = await this.initializeUpload(file, chunkSize)
      if (!uploadId) {
        return { success: false, error: 'Failed to initialize upload' }
      }

      let uploadedBytes = 0
      let chunksUploaded = 0
      let totalRetries = 0
      const failedChunks: Set<number> = new Set()

      // Progress tracking with speed calculation
      const updateProgress = (currentChunk?: number) => {
        const elapsedTime = (Date.now() - startTime) / 1000
        const speed = elapsedTime > 0 ? uploadedBytes / elapsedTime : 0
        const remainingBytes = totalBytes - uploadedBytes
        const estimatedTimeRemaining = speed > 0 ? remainingBytes / speed : 0

        const progress: UploadProgress = {
          uploadedBytes,
          totalBytes,
          percentage: Math.round((uploadedBytes / totalBytes) * 100),
          chunksUploaded,
          totalChunks,
          currentChunk,
          speed,
          estimatedTimeRemaining,
          failedChunks: failedChunks.size
        }
        onProgress?.(progress)
      }

      // Upload chunks with retry logic
      const uploadChunk = async (chunk: UploadChunk): Promise<boolean> => {
        while (chunk.attempts < maxRetries) {
          try {
            updateProgress(chunk.index)
            
            const success = await this.uploadChunkToStorage(uploadId, chunk, file.name)
            
            if (success) {
              uploadedBytes += chunk.size
              chunksUploaded += 1
              failedChunks.delete(chunk.index)
              onChunkComplete?.(chunk.index, totalChunks)
              updateProgress()
              return true
            } else {
              throw new Error(`Chunk upload failed`)
            }
          } catch (error) {
            chunk.attempts++
            totalRetries++
            chunk.lastError = error instanceof Error ? error.message : 'Unknown error'
            
            console.error(`Failed to upload chunk ${chunk.index} (attempt ${chunk.attempts}):`, error)
            
            if (chunk.attempts >= maxRetries) {
              failedChunks.add(chunk.index)
              onError?.(error instanceof Error ? error : new Error('Chunk upload failed'), chunk)
              return false
            }
            
            // Exponential backoff
            const delay = retryDelay * Math.pow(2, chunk.attempts - 1)
            await this.sleep(delay)
          }
        }
        return false
      }

      // Process chunks with controlled concurrency using semaphore
      const semaphore = new Semaphore(maxConcurrentUploads)
      const uploadPromises = chunks.map(async (chunk) => {
        const release = await semaphore.acquire()
        try {
          return await uploadChunk(chunk)
        } finally {
          release()
        }
      })

      const results = await Promise.all(uploadPromises)
      
      // Check if all chunks uploaded successfully
      if (failedChunks.size > 0) {
        return { 
          success: false, 
          error: `Failed to upload ${failedChunks.size} chunks after ${maxRetries} retries`,
          metadata: {
            originalSize: file.size,
            chunksUploaded: chunksUploaded,
            retries: totalRetries,
            averageSpeed: uploadedBytes / ((Date.now() - startTime) / 1000)
          }
        }
      }

      // Complete the upload
      const completeResult = await this.completeUpload(uploadId, file)
      if (!completeResult.success) {
        return { success: false, error: completeResult.error }
      }

      const uploadTime = Date.now() - startTime
      const averageSpeed = uploadedBytes / (uploadTime / 1000)

      return { 
        success: true, 
        fileId: completeResult.fileId,
        filePath: completeResult.filePath,
        uploadTime,
        metadata: {
          originalSize: file.size,
          chunksUploaded: chunksUploaded,
          retries: totalRetries,
          averageSpeed
        }
      }

    } catch (error) {
      console.error('Upload error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  private static async initializeUpload(file: File, chunkSize: number): Promise<string | null> {
    try {
      const response = await fetch('/api/upload/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          chunkSize,
          totalChunks: Math.ceil(file.size / chunkSize),
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.uploadId
    } catch (error) {
      console.error('Failed to initialize upload:', error)
      return null
    }
  }

  private static async uploadChunkToStorage(
    uploadId: string, 
    chunk: UploadChunk, 
    fileName: string
  ): Promise<boolean> {
    try {
      const formData = new FormData()
      formData.append('uploadId', uploadId)
      formData.append('chunkIndex', chunk.index.toString())
      formData.append('chunkSize', chunk.size.toString())
      formData.append('chunkStart', chunk.start.toString())
      formData.append('chunkEnd', chunk.end.toString())
      formData.append('attempt', chunk.attempts.toString())
      formData.append('chunk', chunk.data, `${fileName}.chunk.${chunk.index}`)

      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      chunk.etag = result.etag
      chunk.uploadId = result.uploadId

      return true
    } catch (error) {
      console.error(`Failed to upload chunk ${chunk.index}:`, error)
      return false
    }
  }

  private static async completeUpload(uploadId: string, file: File): Promise<{
    success: boolean
    fileId?: string
    filePath?: string
    error?: string
  }> {
    try {
      const response = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        fileId: data.fileId,
        filePath: data.filePath
      }
    } catch (error) {
      console.error('Failed to complete upload:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Complete upload failed'
      }
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number
  private queue: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<() => void> {
    return new Promise(resolve => {
      if (this.permits > 0) {
        this.permits--
        resolve(() => this.release())
      } else {
        this.queue.push(() => {
          this.permits--
          resolve(() => this.release())
        })
      }
    })
  }

  private release(): void {
    this.permits++
    if (this.queue.length > 0) {
      const next = this.queue.shift()!
      next()
    }
  }
}

/**
 * Convenience functions for large file uploads
 */
export function uploadLargeFile(
  file: File,
  options: ChunkUploadOptions = {}
): Promise<UploadResult> {
  return ChunkedUploader.uploadFile(file, options)
}

export function estimateUploadTime(
  fileSize: number,
  connectionSpeed: number = 1024 * 1024 // 1MB/s default
): number {
  // Add overhead for chunking and retries
  const overhead = 1.3
  return (fileSize * overhead) / connectionSpeed
}