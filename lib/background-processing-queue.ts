import { logger, performanceLogger } from '@/lib/logger'
import { analytics } from './analytics'

export interface ProcessingJob {
  id: string
  type: 'pdf_processing' | 'document_translation' | 'batch_translation' | 'ocr_processing' | 'document_intelligence'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  userId?: string
  data: any
  result?: any
  error?: string
  progress?: number
  estimatedDuration?: number
  actualDuration?: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  retryCount: number
  maxRetries: number
  metadata: {
    filename?: string
    fileSize?: number
    totalPages?: number
    processingOptions?: any
    analysisDepth?: string
  }
}

export interface QueueStats {
  totalJobs: number
  pendingJobs: number
  processingJobs: number
  completedJobs: number
  failedJobs: number
  averageProcessingTime: number
  queueWaitTime: number
}

export interface WorkerConfig {
  maxConcurrentJobs: number
  retryDelay: number
  healthCheckInterval: number
  cleanupInterval: number
  maxJobAge: number // in milliseconds
}

export type JobEventHandler = (job: ProcessingJob) => void
export type ProgressHandler = (jobId: string, progress: number, message?: string) => void

class BackgroundProcessingQueue {
  private jobs: Map<string, ProcessingJob> = new Map()
  private processingJobs: Set<string> = new Set()
  private eventHandlers: Map<string, JobEventHandler[]> = new Map()
  private progressHandlers: Map<string, ProgressHandler[]> = new Map()
  private workers: Map<string, any> = new Map() // Serverless compatible - no Worker type
  private config: WorkerConfig
  private isRunning: boolean = false
  private cleanupTimer?: NodeJS.Timeout
  private healthCheckTimer?: NodeJS.Timeout

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      maxConcurrentJobs: 3,
      retryDelay: 5000,
      healthCheckInterval: 30000,
      cleanupInterval: 60000,
      maxJobAge: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    }

    this.setupEventHandlers()
  }

  // Initialize the queue system
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    
    // Start processing loop
    this.processQueue()
    
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)

    // Start health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)

    logger.info('Background processing queue started', {
      maxConcurrentJobs: this.config.maxConcurrentJobs,
      retryDelay: this.config.retryDelay
    })
  }

  // Stop the queue system
  stop(): void {
    this.isRunning = false

    // Cancel all pending jobs
    for (const [jobId, job] of this.jobs) {
      if (job.status === 'pending' || job.status === 'processing') {
        job.status = 'cancelled'
        this.notifyJobUpdate(job)
      }
    }

    // Clear timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    logger.info('Background processing queue stopped')
  }

  // Add a job to the queue
  addJob(jobData: Omit<ProcessingJob, 'id' | 'status' | 'createdAt' | 'retryCount'>): string {
    const jobId = this.generateJobId()
    const job: ProcessingJob = {
      id: jobId,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      ...jobData
    }

    this.jobs.set(jobId, job)
    
    logger.info(`Job added to queue: ${jobId}`, {
      type: job.type,
      priority: job.priority,
      userId: job.userId,
      metadata: job.metadata
    })

    // Track job creation
    analytics.track('background_job_created', {
      jobId,
      jobType: job.type,
      priority: job.priority,
      estimatedDuration: job.estimatedDuration
    })

    this.notifyJobUpdate(job)
    this.processQueue()

    return jobId
  }

  // Get job status
  getJob(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId)
  }

  // Get jobs for a user
  getUserJobs(userId: string): ProcessingJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Cancel a job
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (!job) return false

    if (job.status === 'pending') {
      job.status = 'cancelled'
      this.notifyJobUpdate(job)
      logger.info(`Job cancelled: ${jobId}`)
      return true
    }

    if (job.status === 'processing') {
      // Mark for cancellation - worker should check this
      job.status = 'cancelled'
      this.notifyJobUpdate(job)
      logger.info(`Job marked for cancellation: ${jobId}`)
      return true
    }

    return false
  }

  // Retry a failed job
  retryJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== 'failed') return false

    if (job.retryCount >= job.maxRetries) {
      logger.warn(`Job retry limit exceeded: ${jobId}`)
      return false
    }

    job.status = 'pending'
    job.retryCount++
    job.error = undefined
    job.startedAt = undefined
    job.completedAt = undefined

    this.notifyJobUpdate(job)
    this.processQueue()

    logger.info(`Job retried: ${jobId} (attempt ${job.retryCount + 1}/${job.maxRetries + 1})`)
    return true
  }

  // Get queue statistics
  getStats(): QueueStats {
    const jobs = Array.from(this.jobs.values())
    const completedJobs = jobs.filter(job => job.status === 'completed')
    
    const averageProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => sum + (job.actualDuration || 0), 0) / completedJobs.length
      : 0

    const pendingJobs = jobs.filter(job => job.status === 'pending')
    const queueWaitTime = pendingJobs.length > 0
      ? Math.max(...pendingJobs.map(job => Date.now() - job.createdAt.getTime()))
      : 0

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(job => job.status === 'pending').length,
      processingJobs: jobs.filter(job => job.status === 'processing').length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length,
      averageProcessingTime,
      queueWaitTime
    }
  }

  // Event subscription
  onJobUpdate(event: 'created' | 'started' | 'progress' | 'completed' | 'failed' | 'cancelled', handler: JobEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  // Progress subscription
  onProgress(jobId: string, handler: ProgressHandler): void {
    if (!this.progressHandlers.has(jobId)) {
      this.progressHandlers.set(jobId, [])
    }
    this.progressHandlers.get(jobId)!.push(handler)
  }

  // Update job progress
  updateProgress(jobId: string, progress: number, message?: string): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.progress = Math.min(100, Math.max(0, progress))
    
    // Notify progress handlers
    const handlers = this.progressHandlers.get(jobId) || []
    handlers.forEach(handler => {
      try {
        handler(jobId, progress, message)
      } catch (error) {
        logger.error({ error, jobId }, 'Progress handler error')
      }
    })

    this.notifyJobUpdate(job)
  }

  // Main processing loop
  private async processQueue(): Promise<void> {
    if (!this.isRunning) return

    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => {
        // Sort by priority, then by creation time
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

    const availableSlots = this.config.maxConcurrentJobs - this.processingJobs.size

    for (let i = 0; i < Math.min(availableSlots, pendingJobs.length); i++) {
      const job = pendingJobs[i]
      this.startJobProcessing(job)
    }

    // Schedule next processing cycle
    if (this.isRunning && (pendingJobs.length > 0 || this.processingJobs.size > 0)) {
      setTimeout(() => this.processQueue(), 1000)
    }
  }

  // Start processing a specific job
  private async startJobProcessing(job: ProcessingJob): Promise<void> {
    job.status = 'processing'
    job.startedAt = new Date()
    job.progress = 0
    this.processingJobs.add(job.id)

    this.notifyJobUpdate(job)

    logger.info(`Starting job processing: ${job.id}`, {
      type: job.type,
      priority: job.priority,
      retryCount: job.retryCount
    })

    try {
      const result = await this.executeJob(job)
      
      // Check if job was cancelled during processing
      const currentJob = this.getJob(job.id)
      if (currentJob?.status === 'cancelled') {
        this.processingJobs.delete(job.id)
        return
      }

      job.status = 'completed'
      job.result = result
      job.completedAt = new Date()
      job.actualDuration = job.completedAt.getTime() - job.startedAt!.getTime()
      job.progress = 100

      this.processingJobs.delete(job.id)
      this.notifyJobUpdate(job)

      logger.info(`Job completed: ${job.id}`, {
        duration: job.actualDuration,
        type: job.type
      })

      // Track successful completion
      analytics.track('background_job_completed', {
        jobId: job.id,
        jobType: job.type,
        duration: job.actualDuration,
        retryCount: job.retryCount
      })

    } catch (error) {
      this.processingJobs.delete(job.id)
      
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.completedAt = new Date()
      job.actualDuration = job.completedAt.getTime() - job.startedAt!.getTime()

      this.notifyJobUpdate(job)

      logger.error({ error, jobId: job.id }, `Job failed: ${job.id}`)

      // Auto-retry if retries available
      if (job.retryCount < job.maxRetries) {
        setTimeout(() => {
          this.retryJob(job.id)
        }, this.config.retryDelay)
      }

      // Track failure
      analytics.track('background_job_failed', {
        jobId: job.id,
        jobType: job.type,
        error: job.error,
        retryCount: job.retryCount
      })
    }
  }

  // Execute job based on type
  private async executeJob(job: ProcessingJob): Promise<any> {
    switch (job.type) {
      case 'pdf_processing':
        return await this.executePDFProcessing(job)
      case 'document_translation':
        return await this.executeDocumentTranslation(job)
      case 'batch_translation':
        return await this.executeBatchTranslation(job)
      case 'ocr_processing':
        return await this.executeOCRProcessing(job)
      case 'document_intelligence':
        return await this.executeDocumentIntelligence(job)
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  }

  // PDF processing executor
  private async executePDFProcessing(job: ProcessingJob): Promise<any> {
    const { streamingPDFProcessor } = await import('./streaming-pdf-processor')
    
    return await streamingPDFProcessor.processLargePDF(
      job.data.buffer,
      job.data.filename,
      job.data.options,
      (progress) => {
        this.updateProgress(job.id, progress.percentage, progress.message)
      }
    )
  }

  // Document translation executor
  private async executeDocumentTranslation(job: ProcessingJob): Promise<any> {
    const { hybridTranslationEngine } = await import('./hybrid-translation-engine')
    
    return await hybridTranslationEngine.translate({
      text: job.data.text,
      sourceLang: job.data.sourceLang,
      targetLang: job.data.targetLang,
      useFreeTier: job.data.useFreeTier,
      userId: job.userId
    })
  }

  // Batch translation executor
  private async executeBatchTranslation(job: ProcessingJob): Promise<any> {
    const { hybridTranslationEngine } = await import('./hybrid-translation-engine')
    const results = []
    
    for (let i = 0; i < job.data.texts.length; i++) {
      const text = job.data.texts[i]
      const result = await hybridTranslationEngine.translate({
        text,
        sourceLang: job.data.sourceLang,
        targetLang: job.data.targetLang,
        useFreeTier: job.data.useFreeTier,
        userId: job.userId
      })
      
      results.push(result)
      this.updateProgress(job.id, ((i + 1) / job.data.texts.length) * 100)
    }
    
    return results
  }

  // OCR processing executor
  private async executeOCRProcessing(job: ProcessingJob): Promise<any> {
    const { ocrService } = await import('./ocr-service')
    
    return await ocrService.processImage(
      job.data.imageData,
      job.data.options
    )
  }

  // Document intelligence executor
  private async executeDocumentIntelligence(job: ProcessingJob): Promise<any> {
    const { intelligenceJobProcessor } = await import('./ai/intelligence-job-processor')
    
    // Update progress callback
    const progressCallback = (progress: number, message?: string) => {
      this.updateProgress(job.id, progress, message)
    }

    // Create a temporary progress updater for the intelligence processor
    const originalUpdateProgress = this.updateProgress.bind(this)
    
    // Override the processor's update method to use our progress system
    const processorUpdateProgress = (jobId: string, progress: number, message?: string) => {
      if (jobId === job.id) {
        originalUpdateProgress(jobId, progress, message)
      }
    }

    // Execute the intelligence processing
    try {
      const result = await intelligenceJobProcessor.processIntelligenceJob(job)
      
      return result
    } catch (error) {
      logger.error({ error, jobId: job.id }, 'Document intelligence processing failed')
      throw error
    }
  }

  // Utility methods
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private notifyJobUpdate(job: ProcessingJob): void {
    const eventType = job.status
    const handlers = this.eventHandlers.get(eventType) || []
    
    handlers.forEach(handler => {
      try {
        handler(job)
      } catch (error) {
        logger.error({ error, jobId: job.id }, 'Event handler error')
      }
    })
  }

  private setupEventHandlers(): void {
    // Initialize event handler maps
    const events = ['created', 'started', 'progress', 'completed', 'failed', 'cancelled']
    events.forEach(event => {
      this.eventHandlers.set(event, [])
    })
  }

  // Cleanup old jobs
  private cleanup(): void {
    const cutoffTime = Date.now() - this.config.maxJobAge
    let cleanedCount = 0

    for (const [jobId, job] of this.jobs) {
      if (job.createdAt.getTime() < cutoffTime && 
          (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled')) {
        this.jobs.delete(jobId)
        this.progressHandlers.delete(jobId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} old jobs`)
    }
  }

  // Health check
  private performHealthCheck(): void {
    const stats = this.getStats()
    
    performanceLogger.info({
      ...stats,
      isRunning: this.isRunning,
      processingJobsCount: this.processingJobs.size
    }, 'Queue health check')

    // Alert if queue is backing up
    if (stats.pendingJobs > 10) {
      logger.warn(`Queue backup detected: ${stats.pendingJobs} pending jobs`)
    }

    // Alert if processing is taking too long
    if (stats.queueWaitTime > 5 * 60 * 1000) { // 5 minutes
      logger.warn(`Long queue wait time: ${Math.round(stats.queueWaitTime / 1000)}s`)
    }
  }
}

// Singleton instance
export const backgroundQueue = new BackgroundProcessingQueue()

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  backgroundQueue.start()
}

// Types are already exported above with their declarations