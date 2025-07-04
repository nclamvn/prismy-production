interface UploadChunk {
  index: number
  data: Blob
  size: number
}

interface UploadProgress {
  uploadedBytes: number
  totalBytes: number
  percentage: number
  chunksUploaded: number
  totalChunks: number
  currentChunk?: number
}

interface UploadResult {
  success: boolean
  fileId?: string
  error?: string
}

export class ChunkedUploader {
  private static readonly CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
  private static readonly MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB max
  private static readonly MAX_CONCURRENT_UPLOADS = 3

  static validateFile(file: File): { valid: boolean; error?: string } {
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
      'text/markdown'
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not supported. Please upload PDF, DOCX, DOC, TXT, or MD files.`
      }
    }

    return { valid: true }
  }

  static createChunks(file: File): UploadChunk[] {
    const chunks: UploadChunk[] = []
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.CHUNK_SIZE
      const end = Math.min(start + this.CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      chunks.push({
        index: i,
        data: chunk,
        size: chunk.size
      })
    }

    return chunks
  }

  static async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    onChunkComplete?: (chunkIndex: number) => void
  ): Promise<UploadResult> {
    try {
      // Validate file first
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Create chunks
      const chunks = this.createChunks(file)
      const totalChunks = chunks.length
      const totalBytes = file.size

      // Initialize upload session
      const uploadId = await this.initializeUpload(file)
      if (!uploadId) {
        return { success: false, error: 'Failed to initialize upload' }
      }

      let uploadedBytes = 0
      let chunksUploaded = 0
      const failedChunks: number[] = []

      // Progress tracking
      const updateProgress = (currentChunk?: number) => {
        const progress: UploadProgress = {
          uploadedBytes,
          totalBytes,
          percentage: Math.round((uploadedBytes / totalBytes) * 100),
          chunksUploaded,
          totalChunks,
          currentChunk
        }
        onProgress?.(progress)
      }

      // Upload chunks with concurrency control
      const uploadChunk = async (chunk: UploadChunk): Promise<boolean> => {
        try {
          updateProgress(chunk.index)
          
          const success = await this.uploadChunkToStorage(uploadId, chunk, file.name)
          
          if (success) {
            uploadedBytes += chunk.size
            chunksUploaded += 1
            onChunkComplete?.(chunk.index)
            updateProgress()
            return true
          }
          
          return false
        } catch (error) {
          console.error(`Failed to upload chunk ${chunk.index}:`, error)
          return false
        }
      }

      // Process chunks with controlled concurrency
      for (let i = 0; i < chunks.length; i += this.MAX_CONCURRENT_UPLOADS) {
        const batch = chunks.slice(i, i + this.MAX_CONCURRENT_UPLOADS)
        const results = await Promise.all(batch.map(uploadChunk))
        
        results.forEach((success, index) => {
          if (!success) {
            failedChunks.push(i + index)
          }
        })
      }

      // Retry failed chunks once
      if (failedChunks.length > 0) {
        console.log(`Retrying ${failedChunks.length} failed chunks...`)
        
        for (const chunkIndex of failedChunks) {
          const chunk = chunks[chunkIndex]
          const success = await uploadChunk(chunk)
          
          if (!success) {
            return { 
              success: false, 
              error: `Failed to upload chunk ${chunkIndex} after retry` 
            }
          }
        }
      }

      // Complete the upload
      const fileId = await this.completeUpload(uploadId, file)
      if (!fileId) {
        return { success: false, error: 'Failed to complete upload' }
      }

      return { success: true, fileId }

    } catch (error) {
      console.error('Upload error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  private static async initializeUpload(file: File): Promise<string | null> {
    try {
      const response = await fetch('/api/upload/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          totalChunks: Math.ceil(file.size / this.CHUNK_SIZE)
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
      formData.append('chunk', chunk.data, `${fileName}.chunk.${chunk.index}`)

      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData
      })

      return response.ok
    } catch (error) {
      console.error(`Failed to upload chunk ${chunk.index}:`, error)
      return false
    }
  }

  private static async completeUpload(uploadId: string, file: File): Promise<string | null> {
    try {
      const response = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.fileId
    } catch (error) {
      console.error('Failed to complete upload:', error)
      return null
    }
  }
}