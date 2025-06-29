import { createClientComponentClient } from '@/lib/supabase'

export interface BatchJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  files: File[]
  progress: {
    current: number
    total: number
    percentage: number
  }
  results: any[]
  errors: Error[]
  createdAt: Date
  completedAt?: Date
}

export interface BatchProcessingOptions {
  maxConcurrency?: number
  retryAttempts?: number
  onProgress?: (job: BatchJob) => void
  onFileComplete?: (file: File, result: any) => void
  onFileError?: (file: File, error: Error) => void
}

export interface ProcessedFile {
  id: string
  fileName: string
  fileSize: number
  status: 'success' | 'error'
  result?: {
    translatedUrl?: string
    pageCount?: number
    wordCount?: number
    creditsUsed?: number
  }
  error?: string
}

class BatchProcessor {
  private jobs: Map<string, BatchJob> = new Map()
  // 💣 PHASE 1.5: Use nuclear singleton to prevent multiple GoTrueClient instances
  private supabase = createClientComponentClient()

  async createBatch(
    files: File[],
    options: BatchProcessingOptions = {}
  ): Promise<BatchJob> {
    const jobId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const job: BatchJob = {
      id: jobId,
      status: 'pending',
      files,
      progress: {
        current: 0,
        total: files.length,
        percentage: 0,
      },
      results: [],
      errors: [],
      createdAt: new Date(),
    }

    this.jobs.set(jobId, job)

    // Start processing asynchronously
    this.processBatch(job, options)

    return job
  }

  private async processBatch(job: BatchJob, options: BatchProcessingOptions) {
    const {
      maxConcurrency = 3,
      retryAttempts = 2,
      onProgress,
      onFileComplete,
      onFileError,
    } = options

    job.status = 'processing'

    try {
      // Process files in batches based on concurrency limit
      const results: ProcessedFile[] = []

      for (let i = 0; i < job.files.length; i += maxConcurrency) {
        const batch = job.files.slice(i, i + maxConcurrency)

        const batchResults = await Promise.all(
          batch.map(file => this.processFile(file, retryAttempts))
        )

        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j]
          const file = batch[j]

          if (result.status === 'success') {
            job.results.push(result)
            onFileComplete?.(file, result)
          } else {
            job.errors.push(new Error(result.error || 'Unknown error'))
            onFileError?.(file, new Error(result.error || 'Unknown error'))
          }

          job.progress.current++
          job.progress.percentage = Math.round(
            (job.progress.current / job.progress.total) * 100
          )

          onProgress?.(job)
        }

        results.push(...batchResults)
      }

      job.status = 'completed'
      job.completedAt = new Date()
    } catch (error) {
      job.status = 'failed'
      job.errors.push(error as Error)
    }

    onProgress?.(job)
  }

  private async processFile(
    file: File,
    retryAttempts: number
  ): Promise<ProcessedFile> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // First, upload the file to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`
        const filePath = `documents/${fileName}`

        const { data: uploadData, error: uploadError } =
          await this.supabase.storage
            .from('user-documents')
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false,
            })

        if (uploadError) throw uploadError

        // Get the public URL
        const {
          data: { publicUrl },
        } = this.supabase.storage.from('user-documents').getPublicUrl(filePath)

        // Create a task for document processing
        const formData = new FormData()
        formData.append('file', file)
        formData.append('targetLang', 'en') // Default to English, should be configurable
        formData.append('serviceType', 'google_translate')

        const response = await fetch('/api/documents/process', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Document processing failed')
        }

        const result = await response.json()

        return {
          id: fileName,
          fileName: file.name,
          fileSize: file.size,
          status: 'success',
          result: {
            translatedUrl: result.translatedUrl || publicUrl,
            pageCount: result.pageCount,
            wordCount: result.wordCount,
            creditsUsed: result.creditsUsed,
          },
        }
      } catch (error) {
        lastError = error as Error

        if (attempt < retryAttempts) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          )
        }
      }
    }

    return {
      id: file.name,
      fileName: file.name,
      fileSize: file.size,
      status: 'error',
      error: lastError?.message || 'Unknown error',
    }
  }

  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId)
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (job && job.status === 'processing') {
      job.status = 'failed'
      job.errors.push(new Error('Job cancelled by user'))
      return true
    }
    return false
  }

  clearJob(jobId: string): boolean {
    return this.jobs.delete(jobId)
  }
}

export const batchProcessor = new BatchProcessor()
