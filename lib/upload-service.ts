'use client'

/**
 * Enterprise File Upload Service
 * Supports chunked uploads, resumable uploads, and real-time progress tracking
 */

export interface UploadOptions {
  chunkSize?: number // Default 1MB chunks
  maxRetries?: number // Default 3 retries per chunk
  onProgress?: (progress: UploadProgress) => void
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void
  onError?: (error: UploadError) => void
  onComplete?: (result: UploadResult) => void
}

export interface UploadProgress {
  uploadId: string
  fileName: string
  totalSize: number
  uploadedBytes: number
  progress: number // 0-100
  speed: number // bytes per second
  timeRemaining: number // seconds
  currentChunk: number
  totalChunks: number
  status: 'preparing' | 'uploading' | 'paused' | 'completed' | 'error'
}

export interface UploadError {
  code: string
  message: string
  retryable: boolean
  chunkIndex?: number
}

export interface UploadResult {
  uploadId: string
  jobId: string
  fileName: string
  fileSize: number
  status: 'completed'
  uploadTime: number
}

export interface ChunkInfo {
  index: number
  start: number
  end: number
  size: number
  hash?: string
  uploaded: boolean
  retries: number
}

export class EnterpriseUploadService {
  private readonly DEFAULT_CHUNK_SIZE = 1024 * 1024 // 1MB
  private readonly DEFAULT_MAX_RETRIES = 3
  private readonly MAX_CONCURRENT_CHUNKS = 3

  private activeUploads = new Map<string, UploadSession>()

  /**
   * Start a new file upload with chunking and resumable support
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<string> {
    const uploadId = this.generateUploadId()
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE
    const maxRetries = options.maxRetries || this.DEFAULT_MAX_RETRIES

    // Create upload session
    const session: UploadSession = {
      uploadId,
      file,
      options,
      chunks: this.createChunks(file, chunkSize),
      startTime: Date.now(),
      uploadedBytes: 0,
      status: 'preparing',
      retryCount: 0,
      maxRetries,
    }

    this.activeUploads.set(uploadId, session)

    try {
      // Initialize upload on server
      await this.initializeUpload(session)

      // Start chunked upload
      await this.uploadChunks(session)

      // Finalize upload
      const result = await this.finalizeUpload(session)

      this.activeUploads.delete(uploadId)
      return result.jobId

    } catch (error) {
      this.handleUploadError(session, error as Error)
      throw error
    }
  }

  /**
   * Resume a paused upload
   */
  async resumeUpload(uploadId: string): Promise<void> {
    const session = this.activeUploads.get(uploadId)
    if (!session) {
      throw new Error('Upload session not found')
    }

    if (session.status !== 'paused') {
      throw new Error('Upload is not paused')
    }

    session.status = 'uploading'
    await this.uploadChunks(session)
  }

  /**
   * Pause an active upload
   */
  pauseUpload(uploadId: string): void {
    const session = this.activeUploads.get(uploadId)
    if (session && session.status === 'uploading') {
      session.status = 'paused'
    }
  }

  /**
   * Cancel an upload
   */
  cancelUpload(uploadId: string): void {
    const session = this.activeUploads.get(uploadId)
    if (session) {
      session.status = 'error'
      this.activeUploads.delete(uploadId)
    }
  }

  /**
   * Get upload progress
   */
  getUploadProgress(uploadId: string): UploadProgress | null {
    const session = this.activeUploads.get(uploadId)
    if (!session) return null

    const uploadedChunks = session.chunks.filter(c => c.uploaded).length
    const progress = (session.uploadedBytes / session.file.size) * 100
    const elapsed = Date.now() - session.startTime
    const speed = elapsed > 0 ? session.uploadedBytes / (elapsed / 1000) : 0
    const remaining = speed > 0 ? (session.file.size - session.uploadedBytes) / speed : 0

    return {
      uploadId: session.uploadId,
      fileName: session.file.name,
      totalSize: session.file.size,
      uploadedBytes: session.uploadedBytes,
      progress: Math.round(progress),
      speed: Math.round(speed),
      timeRemaining: Math.round(remaining),
      currentChunk: uploadedChunks,
      totalChunks: session.chunks.length,
      status: session.status,
    }
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createChunks(file: File, chunkSize: number): ChunkInfo[] {
    const chunks: ChunkInfo[] = []
    let start = 0

    for (let i = 0; start < file.size; i++) {
      const end = Math.min(start + chunkSize, file.size)
      chunks.push({
        index: i,
        start,
        end,
        size: end - start,
        uploaded: false,
        retries: 0,
      })
      start = end
    }

    return chunks
  }

  private async initializeUpload(session: UploadSession): Promise<void> {
    const response = await fetch('/api/upload/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId: session.uploadId,
        fileName: session.file.name,
        fileSize: session.file.size,
        mimeType: session.file.type,
        totalChunks: session.chunks.length,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to initialize upload')
    }

    session.status = 'uploading'
    this.updateProgress(session)
  }

  private async uploadChunks(session: UploadSession): Promise<void> {
    const pendingChunks = session.chunks.filter(c => !c.uploaded)
    const concurrentUploads: Promise<void>[] = []

    for (const chunk of pendingChunks) {
      if (session.status !== 'uploading') break

      // Limit concurrent uploads
      if (concurrentUploads.length >= this.MAX_CONCURRENT_CHUNKS) {
        await Promise.race(concurrentUploads)
      }

      const uploadPromise = this.uploadChunk(session, chunk)
        .then(() => {
          const index = concurrentUploads.indexOf(uploadPromise)
          if (index > -1) concurrentUploads.splice(index, 1)
        })
        .catch((error) => {
          const index = concurrentUploads.indexOf(uploadPromise)
          if (index > -1) concurrentUploads.splice(index, 1)
          throw error
        })

      concurrentUploads.push(uploadPromise)
    }

    // Wait for all remaining uploads
    await Promise.all(concurrentUploads)
  }

  private async uploadChunk(session: UploadSession, chunk: ChunkInfo): Promise<void> {
    const maxRetries = session.maxRetries
    
    while (chunk.retries < maxRetries) {
      try {
        const chunkData = session.file.slice(chunk.start, chunk.end)
        const formData = new FormData()
        
        formData.append('uploadId', session.uploadId)
        formData.append('chunkIndex', chunk.index.toString())
        formData.append('chunkData', chunkData)
        formData.append('chunkSize', chunk.size.toString())

        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Chunk upload failed')
        }

        // Mark chunk as uploaded
        chunk.uploaded = true
        session.uploadedBytes += chunk.size

        // Update progress
        this.updateProgress(session)

        // Notify chunk completion
        session.options.onChunkComplete?.(chunk.index, session.chunks.length)

        return

      } catch (error) {
        chunk.retries++
        
        if (chunk.retries >= maxRetries) {
          throw new Error(`Chunk ${chunk.index} failed after ${maxRetries} retries: ${error}`)
        }

        // Wait before retry with exponential backoff
        await this.delay(Math.pow(2, chunk.retries) * 1000)
      }
    }
  }

  private async finalizeUpload(session: UploadSession): Promise<UploadResult> {
    const response = await fetch('/api/upload/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId: session.uploadId,
        totalChunks: session.chunks.length,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to finalize upload')
    }

    const result = await response.json()
    const uploadTime = Date.now() - session.startTime

    session.status = 'completed'
    this.updateProgress(session)

    const uploadResult: UploadResult = {
      uploadId: session.uploadId,
      jobId: result.jobId,
      fileName: session.file.name,
      fileSize: session.file.size,
      status: 'completed',
      uploadTime,
    }

    session.options.onComplete?.(uploadResult)
    return uploadResult
  }

  private updateProgress(session: UploadSession): void {
    const progress = this.getUploadProgress(session.uploadId)
    if (progress) {
      session.options.onProgress?.(progress)
    }
  }

  private handleUploadError(session: UploadSession, error: Error): void {
    session.status = 'error'
    
    const uploadError: UploadError = {
      code: 'UPLOAD_ERROR',
      message: error.message,
      retryable: true,
    }

    session.options.onError?.(uploadError)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

interface UploadSession {
  uploadId: string
  file: File
  options: UploadOptions
  chunks: ChunkInfo[]
  startTime: number
  uploadedBytes: number
  status: 'preparing' | 'uploading' | 'paused' | 'completed' | 'error'
  retryCount: number
  maxRetries: number
}

// Singleton instance
export const uploadService = new EnterpriseUploadService()