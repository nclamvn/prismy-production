import { DocumentProcessor, ProcessedDocument } from './document-processor'
import { logger } from './logger'

export interface BatchJob {
  id: string
  files: File[]
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: {
    current: number
    total: number
    percentage: number
  }
  results: Map<string, ProcessedDocument | Error>
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  options: BatchProcessingOptions
}

export interface BatchProcessingOptions {
  sourceLang?: string
  targetLang?: string
  maxConcurrency?: number
  retryAttempts?: number
  onProgress?: (job: BatchJob) => void
  onFileComplete?: (file: File, result: ProcessedDocument | Error) => void
  onBatchComplete?: (job: BatchJob) => void
  onError?: (error: Error, file?: File) => void
}

export interface BatchStats {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
  totalFilesProcessed: number
  averageProcessingTime: number
  successRate: number
}

class BatchProcessor {
  private activeJobs = new Map<string, BatchJob>()
  private jobHistory: BatchJob[] = []
  private maxConcurrentJobs = 3
  private maxFilesPerJob = 50
  private maxFileSizeMB = 100

  /**
   * Create a new batch processing job
   */
  async createBatchJob(
    files: File[], 
    options: BatchProcessingOptions = {}
  ): Promise<BatchJob> {
    // Validate inputs
    this.validateBatchInput(files, options)

    const jobId = this.generateJobId()
    const job: BatchJob = {
      id: jobId,
      files: [...files],
      status: 'pending',
      progress: {
        current: 0,
        total: files.length,
        percentage: 0
      },
      results: new Map(),
      createdAt: new Date(),
      options: {
        maxConcurrency: 2,
        retryAttempts: 3,
        ...options
      }
    }

    this.activeJobs.set(jobId, job)
    logger.info({ jobId, fileCount: files.length }, 'Batch job created')

    // Start processing if we haven't reached the concurrent job limit
    if (this.activeJobs.size <= this.maxConcurrentJobs) {
      this.processBatchJob(job)
    }

    return job
  }

  /**
   * Process a batch job
   */
  private async processBatchJob(job: BatchJob): Promise<void> {
    try {
      job.status = 'processing'
      job.startedAt = new Date()
      
      logger.info({ jobId: job.id }, 'Starting batch job processing')

      const { maxConcurrency = 2 } = job.options
      const semaphore = new Semaphore(maxConcurrency)

      // Process files with controlled concurrency
      const processingPromises = job.files.map(async (file, index) => {
        return semaphore.acquire(async () => {
          try {
            const result = await this.processFileWithRetry(file, job.options)
            job.results.set(file.name, result)
            
            // Update progress
            job.progress.current++
            job.progress.percentage = Math.round((job.progress.current / job.progress.total) * 100)
            
            logger.debug({ 
              jobId: job.id, 
              fileName: file.name, 
              progress: job.progress.percentage 
            }, 'File processed in batch')

            // Call progress callback
            job.options.onProgress?.(job)
            job.options.onFileComplete?.(file, result)

          } catch (error) {
            const processingError = error as Error
            job.results.set(file.name, processingError)
            job.progress.current++
            job.progress.percentage = Math.round((job.progress.current / job.progress.total) * 100)

            logger.error({ 
              jobId: job.id, 
              fileName: file.name, 
              error: processingError.message 
            }, 'File processing failed in batch')

            job.options.onError?.(processingError, file)
            job.options.onFileComplete?.(file, processingError)
          }
        })
      })

      await Promise.all(processingPromises)

      // Complete the job
      job.status = 'completed'
      job.completedAt = new Date()
      
      logger.info({ 
        jobId: job.id, 
        duration: job.completedAt.getTime() - job.startedAt!.getTime(),
        successCount: this.getSuccessCount(job),
        errorCount: this.getErrorCount(job)
      }, 'Batch job completed')

      job.options.onBatchComplete?.(job)

    } catch (error) {
      job.status = 'failed'
      job.completedAt = new Date()
      
      logger.error({ jobId: job.id, error }, 'Batch job failed')
      job.options.onError?.(error as Error)

    } finally {
      // Move job to history
      this.activeJobs.delete(job.id)
      this.jobHistory.push(job)
      
      // Keep only last 100 jobs in history
      if (this.jobHistory.length > 100) {
        this.jobHistory = this.jobHistory.slice(-100)
      }

      // Start next pending job if any
      this.processNextPendingJob()
    }
  }

  /**
   * Process a single file with retry logic
   */
  private async processFileWithRetry(
    file: File, 
    options: BatchProcessingOptions
  ): Promise<ProcessedDocument> {
    const { retryAttempts = 3 } = options
    let lastError: Error

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await DocumentProcessor.processFile(file)
      } catch (error) {
        lastError = error as Error
        logger.warn({ 
          fileName: file.name, 
          attempt, 
          maxAttempts: retryAttempts,
          error: lastError.message 
        }, 'File processing attempt failed')

        if (attempt < retryAttempts) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw lastError!
  }

  /**
   * Cancel a batch job
   */
  async cancelBatchJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job) {
      return false
    }

    job.status = 'cancelled'
    job.completedAt = new Date()
    
    logger.info({ jobId }, 'Batch job cancelled')
    
    this.activeJobs.delete(jobId)
    this.jobHistory.push(job)

    return true
  }

  /**
   * Get batch job status
   */
  getBatchJob(jobId: string): BatchJob | undefined {
    return this.activeJobs.get(jobId) || 
           this.jobHistory.find(job => job.id === jobId)
  }

  /**
   * Get all active batch jobs
   */
  getActiveBatchJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values())
  }

  /**
   * Get batch processing statistics
   */
  getBatchStats(): BatchStats {
    const allJobs = [...this.activeJobs.values(), ...this.jobHistory]
    const completedJobs = allJobs.filter(job => job.status === 'completed')
    const failedJobs = allJobs.filter(job => job.status === 'failed')
    
    const totalFilesProcessed = allJobs.reduce((sum, job) => sum + job.progress.current, 0)
    
    const processingTimes = completedJobs
      .filter(job => job.startedAt && job.completedAt)
      .map(job => job.completedAt!.getTime() - job.startedAt!.getTime())
    
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    const successfulFiles = allJobs.reduce((sum, job) => sum + this.getSuccessCount(job), 0)
    const successRate = totalFilesProcessed > 0 ? (successfulFiles / totalFilesProcessed) * 100 : 0

    return {
      totalJobs: allJobs.length,
      activeJobs: this.activeJobs.size,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      totalFilesProcessed,
      averageProcessingTime,
      successRate
    }
  }

  /**
   * Export batch results
   */
  exportBatchResults(jobId: string, format: 'json' | 'csv' = 'json'): string {
    const job = this.getBatchJob(jobId)
    if (!job) {
      throw new Error(`Batch job ${jobId} not found`)
    }

    const results = Array.from(job.results.entries()).map(([fileName, result]) => ({
      fileName,
      status: result instanceof Error ? 'error' : 'success',
      error: result instanceof Error ? result.message : null,
      wordCount: result instanceof Error ? 0 : result.metadata.wordCount,
      characterCount: result instanceof Error ? 0 : result.metadata.characterCount,
      language: result instanceof Error ? null : result.metadata.language
    }))

    if (format === 'csv') {
      const headers = 'fileName,status,error,wordCount,characterCount,language\n'
      const rows = results.map(result => 
        `"${result.fileName}","${result.status}","${result.error || ''}",${result.wordCount},${result.characterCount},"${result.language || ''}"`
      ).join('\n')
      return headers + rows
    }

    return JSON.stringify({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      results
    }, null, 2)
  }

  // Private helper methods
  private validateBatchInput(files: File[], options: BatchProcessingOptions): void {
    if (!files || files.length === 0) {
      throw new Error('No files provided for batch processing')
    }

    if (files.length > this.maxFilesPerJob) {
      throw new Error(`Too many files. Maximum ${this.maxFilesPerJob} files per batch`)
    }

    for (const file of files) {
      if (file.size > this.maxFileSizeMB * 1024 * 1024) {
        throw new Error(`File ${file.name} is too large. Maximum size is ${this.maxFileSizeMB}MB`)
      }
    }
  }

  private generateJobId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getSuccessCount(job: BatchJob): number {
    return Array.from(job.results.values()).filter(result => !(result instanceof Error)).length
  }

  private getErrorCount(job: BatchJob): number {
    return Array.from(job.results.values()).filter(result => result instanceof Error).length
  }

  private processNextPendingJob(): void {
    // This would be used if we had a queue of pending jobs
    // For now, jobs start immediately when created
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private counter: number
  private waiting: Array<() => void> = []

  constructor(private max: number) {
    this.counter = max
  }

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const executeTask = async () => {
        try {
          this.counter--
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.counter++
          if (this.waiting.length > 0) {
            const next = this.waiting.shift()!
            next()
          }
        }
      }

      if (this.counter > 0) {
        executeTask()
      } else {
        this.waiting.push(executeTask)
      }
    })
  }
}

// Export singleton instance
export const batchProcessor = new BatchProcessor()

// Export utility functions
export const createBatch = (files: File[], options?: BatchProcessingOptions) => 
  batchProcessor.createBatchJob(files, options)

export const getBatchStatus = (jobId: string) => 
  batchProcessor.getBatchJob(jobId)

export const cancelBatch = (jobId: string) => 
  batchProcessor.cancelBatchJob(jobId)

export const getBatchStats = () => 
  batchProcessor.getBatchStats()