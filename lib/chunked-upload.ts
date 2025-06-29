// Enterprise-scale chunked file upload utility
// Handles gigabyte-sized documents by splitting them into manageable chunks

export interface ChunkUploadConfig {
  chunkSize: number // Default: 50MB
  maxConcurrentUploads: number // Default: 3
  retryAttempts: number // Default: 3
  retryDelay: number // Default: 1000ms
}

export interface ChunkUploadProgress {
  documentId: string
  fileName: string
  totalSize: number
  totalChunks: number
  uploadedChunks: number
  processedChunks: number
  currentChunk: number
  percentage: number
  speed: number // bytes per second
  estimatedTimeRemaining: number // milliseconds
  status: 'preparing' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

export interface ChunkUploadResult {
  success: boolean
  documentId: string
  extractedText?: string
  metadata?: any
  error?: string
}

export class ChunkedFileUploader {
  private config: ChunkUploadConfig
  private progressCallback?: (progress: ChunkUploadProgress) => void
  private abortController?: AbortController

  constructor(
    config: Partial<ChunkUploadConfig> = {},
    progressCallback?: (progress: ChunkUploadProgress) => void
  ) {
    this.config = {
      chunkSize: 50 * 1024 * 1024, // 50MB
      maxConcurrentUploads: 3,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    }
    this.progressCallback = progressCallback
  }

  async uploadFile(file: File): Promise<ChunkUploadResult> {
    this.abortController = new AbortController()

    const documentId = `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const totalChunks = Math.ceil(file.size / this.config.chunkSize)

    const progress: ChunkUploadProgress = {
      documentId,
      fileName: file.name,
      totalSize: file.size,
      totalChunks,
      uploadedChunks: 0,
      processedChunks: 0,
      currentChunk: 0,
      percentage: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
      status: 'preparing',
    }

    console.log(
      `🚀 Starting chunked upload: ${file.name} (${totalChunks} chunks, ${(file.size / (1024 * 1024)).toFixed(2)}MB)`
    )

    try {
      // Notify preparation phase
      this.notifyProgress(progress)

      // Create chunks
      const chunks = await this.createChunks(file)
      progress.status = 'uploading'
      this.notifyProgress(progress)

      // Upload chunks with progress tracking
      const startTime = Date.now()
      const uploadPromises: Promise<any>[] = []
      const semaphore = new Semaphore(this.config.maxConcurrentUploads)

      for (let i = 0; i < chunks.length; i++) {
        const uploadPromise = semaphore.acquire().then(async release => {
          try {
            progress.currentChunk = i + 1
            this.notifyProgress(progress)

            const result = await this.uploadChunk(chunks[i], {
              chunkId: `${documentId}_chunk_${i}`,
              chunkIndex: i,
              totalChunks: chunks.length,
              fileName: file.name,
              fileType: file.type,
              originalFileSize: file.size,
              chunkSize: chunks[i].size,
              documentId,
            })

            // Update progress
            progress.uploadedChunks++
            if (result.complete) {
              progress.processedChunks = totalChunks
              progress.status = 'complete'
            } else if (result.progress) {
              progress.processedChunks = result.progress.processedChunks
            }

            const elapsed = Date.now() - startTime
            progress.percentage = Math.round(
              (progress.uploadedChunks / totalChunks) * 100
            )
            progress.speed =
              (progress.uploadedChunks * this.config.chunkSize) /
              (elapsed / 1000)
            progress.estimatedTimeRemaining =
              progress.speed > 0
                ? (((totalChunks - progress.uploadedChunks) *
                    this.config.chunkSize) /
                    progress.speed) *
                  1000
                : 0

            this.notifyProgress(progress)
            return result
          } finally {
            release()
          }
        })

        uploadPromises.push(uploadPromise)
      }

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises)

      // Find the completion result
      const completionResult = results.find(result => result.complete)

      if (completionResult) {
        progress.status = 'complete'
        progress.percentage = 100
        this.notifyProgress(progress)

        return {
          success: true,
          documentId,
          extractedText: completionResult.extractedText,
          metadata: completionResult.metadata,
        }
      } else {
        // If no completion result found, wait for processing to complete
        return await this.waitForProcessingCompletion(documentId, progress)
      }
    } catch (error) {
      console.error('Chunked upload failed:', error)
      progress.status = 'error'
      progress.error = error instanceof Error ? error.message : 'Upload failed'
      this.notifyProgress(progress)

      return {
        success: false,
        documentId,
        error: progress.error,
      }
    }
  }

  private async createChunks(file: File): Promise<Blob[]> {
    const chunks: Blob[] = []
    const chunkSize = this.config.chunkSize

    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size)
      chunks.push(file.slice(start, end))
    }

    return chunks
  }

  private async uploadChunk(chunk: Blob, metadata: any): Promise<any> {
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('metadata', JSON.stringify(metadata))

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch('/api/documents/process-chunked', {
          method: 'POST',
          body: formData,
          signal: this.abortController?.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.warn(`Chunk upload attempt ${attempt + 1} failed:`, error)

        if (attempt === this.config.retryAttempts - 1) {
          throw error
        }

        // Wait before retry
        await new Promise(resolve =>
          setTimeout(resolve, this.config.retryDelay * (attempt + 1))
        )
      }
    }
  }

  private async waitForProcessingCompletion(
    documentId: string,
    progress: ChunkUploadProgress
  ): Promise<ChunkUploadResult> {
    const maxWaitTime = 600000 // 10 minutes
    const pollInterval = 2000 // 2 seconds
    const startTime = Date.now()

    progress.status = 'processing'
    this.notifyProgress(progress)

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(
          `/api/documents/process-chunked?documentId=${documentId}`
        )

        if (response.ok) {
          const status = await response.json()

          if (status.progress) {
            progress.processedChunks = status.progress.processedChunks
            progress.percentage = status.progress.percentage
            this.notifyProgress(progress)
          }

          // Check if processing is complete by trying to get the final result
          // This is a simplified approach - in production, you'd have a proper status endpoint
          if (status.progress?.percentage === 100) {
            progress.status = 'complete'
            this.notifyProgress(progress)

            return {
              success: true,
              documentId,
              extractedText: status.extractedText,
              metadata: status.metadata,
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
      } catch (error) {
        console.warn('Status check failed:', error)
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
    }

    throw new Error('Processing timeout - document processing took too long')
  }

  private notifyProgress(progress: ChunkUploadProgress) {
    if (this.progressCallback) {
      this.progressCallback({ ...progress })
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort()
    }
  }
}

// Simple semaphore implementation for controlling concurrent uploads
class Semaphore {
  private permits: number
  private queue: Array<{ resolve: () => void; reject: (error: any) => void }> =
    []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve, reject) => {
      if (this.permits > 0) {
        this.permits--
        resolve(() => {
          this.permits++
          this.processQueue()
        })
      } else {
        this.queue.push({ resolve, reject })
      }
    })
  }

  private processQueue() {
    if (this.queue.length > 0 && this.permits > 0) {
      const { resolve } = this.queue.shift()!
      this.permits--
      resolve(() => {
        this.permits++
        this.processQueue()
      })
    }
  }
}

// Utility functions for file size detection and routing
export const shouldUseChunkedUpload = (file: File): boolean => {
  const largeFleLimit = 50 * 1024 * 1024 // 50MB
  return file.size > largeFleLimit
}

export const getUploadMethod = (
  file: File
): 'standard' | 'chunked' | 'enterprise' => {
  const smallFileLimit = 50 * 1024 * 1024 // 50MB
  const enterpriseFileLimit = 1024 * 1024 * 1024 // 1GB

  if (file.size <= smallFileLimit) {
    return 'standard'
  } else if (file.size <= enterpriseFileLimit) {
    return 'chunked'
  } else {
    return 'enterprise'
  }
}

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

export const estimateProcessingTime = (
  fileSize: number,
  fileType: string
): number => {
  // Rough estimates based on file type and size
  const baseProcessingTime = {
    'text/plain': 0.1, // 0.1 seconds per MB
    'application/pdf': 2, // 2 seconds per MB
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 1, // 1 second per MB
    'application/msword': 1,
  }

  const fileSizeMB = fileSize / (1024 * 1024)
  const timePerMB =
    baseProcessingTime[fileType as keyof typeof baseProcessingTime] || 1

  return Math.round(fileSizeMB * timePerMB * 1000) // Return in milliseconds
}
