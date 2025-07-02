/**
 * Job Queue Management with pg_boss
 * Handles async processing of documents and translations
 */

import PgBoss from 'pg-boss'
import { logger } from '@/lib/logger'
import {
  RealtimeProgressManager,
  ProgressHelpers,
} from '@/lib/realtime-progress'
import { getPgBossInstance } from '@/lib/pg-boss-setup'

// Job types
export enum JobType {
  DOCUMENT_PROCESSING = 'document-processing',
  TRANSLATION = 'translation',
  BATCH_TRANSLATION = 'batch-translation',
  OCR_PROCESSING = 'ocr-processing',
  EXPORT_GENERATION = 'export-generation',
}

// Job priority levels
export enum JobPriority {
  LOW = 0,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

// Job data interfaces
export interface DocumentProcessingJob {
  jobId: string
  userId: string
  documentId: string
  documentUrl: string
  documentType: string
  options?: {
    extractText?: boolean
    detectLanguage?: boolean
    performOCR?: boolean
  }
}

export interface TranslationJob {
  jobId: string
  userId: string
  text: string
  sourceLang: string
  targetLang: string
  qualityTier: string
  options?: {
    preserveFormatting?: boolean
    glossary?: Record<string, string>
  }
}

// Job queue manager
export class JobQueueManager {
  private static instance: JobQueueManager
  private boss: PgBoss | null = null
  private isConnected = false
  private progressManager = RealtimeProgressManager.getInstance()

  private constructor() {}

  static getInstance(): JobQueueManager {
    if (!JobQueueManager.instance) {
      JobQueueManager.instance = new JobQueueManager()
    }
    return JobQueueManager.instance
  }

  // Initialize the queue
  async initialize(): Promise<void> {
    if (this.isConnected) {
      return
    }

    try {
      // Use shared PG-Boss instance
      this.boss = await getPgBossInstance()
      this.isConnected = true

      // Register job handlers
      await this.registerHandlers()

      logger.info('Job queue initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize job queue', { error })
      throw error
    }
  }

  // Register job handlers
  private async registerHandlers(): Promise<void> {
    if (!this.boss) {
      throw new Error('Job queue not initialized')
    }

    // Import handlers
    const { JobHandlers } = await import('@/lib/job-handlers')

    // Document processing handler
    await this.boss.work(
      JobType.DOCUMENT_PROCESSING,
      { teamSize: 5, teamConcurrency: 2 },
      JobHandlers.handleDocumentProcessing
    )

    // Translation handler
    await this.boss.work(
      JobType.TRANSLATION,
      { teamSize: 10, teamConcurrency: 3 },
      JobHandlers.handleTranslation
    )

    // Batch translation handler
    await this.boss.work(
      JobType.BATCH_TRANSLATION,
      { teamSize: 3, teamConcurrency: 1 },
      JobHandlers.handleBatchTranslation
    )

    // OCR processing handler
    await this.boss.work(
      JobType.OCR_PROCESSING,
      { teamSize: 3, teamConcurrency: 1 },
      JobHandlers.handleOCRProcessing
    )

    // Export generation handler
    await this.boss.work(
      JobType.EXPORT_GENERATION,
      { teamSize: 2, teamConcurrency: 1 },
      JobHandlers.handleExportGeneration
    )

    logger.info('Job handlers registered successfully')
  }

  // Queue a document processing job
  async queueDocumentProcessing(
    data: DocumentProcessingJob,
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<string> {
    if (!this.boss) {
      throw new Error('Job queue not initialized')
    }

    const jobId = await this.boss.send(JobType.DOCUMENT_PROCESSING, data, {
      priority,
      retryLimit: 3,
      retryDelay: 60, // 1 minute
      retryBackoff: true,
      expireInSeconds: 3600, // 1 hour
    })

    // Create initial progress entry
    this.progressManager.updateProgress(
      ProgressHelpers.createJob(
        data.jobId,
        data.userId,
        'Document processing queued'
      )
    )

    logger.info('Document processing job queued', {
      jobId,
      userId: data.userId,
    })
    return jobId || data.jobId
  }

  // Queue a translation job
  async queueTranslation(
    data: TranslationJob,
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<string> {
    if (!this.boss) {
      throw new Error('Job queue not initialized')
    }

    const jobId = await this.boss.send(JobType.TRANSLATION, data, {
      priority,
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
      expireInSeconds: 1800, // 30 minutes
    })

    // Create initial progress entry
    this.progressManager.updateProgress(
      ProgressHelpers.createJob(data.jobId, data.userId, 'Translation queued')
    )

    logger.info('Translation job queued', { jobId, userId: data.userId })
    return jobId || data.jobId
  }

  // Add new job types to existing enums
  async queueExportGeneration(
    data: {
      jobId: string
      userId: string
      dataType: 'translation' | 'document' | 'usage_report'
      format: 'pdf' | 'docx' | 'csv' | 'json'
      filters?: Record<string, any>
      options?: Record<string, any>
    },
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<string> {
    if (!this.boss) {
      throw new Error('Job queue not initialized')
    }

    const jobId = await this.boss.send(JobType.EXPORT_GENERATION, data, {
      priority,
      retryLimit: 2,
      retryDelay: 120, // 2 minutes
      retryBackoff: true,
      expireInSeconds: 1800, // 30 minutes
    })

    // Create initial progress entry
    this.progressManager.updateProgress(
      ProgressHelpers.createJob(
        data.jobId,
        data.userId,
        'Export generation queued'
      )
    )

    logger.info('Export generation job queued', { jobId, userId: data.userId })
    return jobId || data.jobId
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<any> {
    if (!this.boss) {
      throw new Error('Job queue not initialized')
    }

    const job = await this.boss.getJobById(jobId)
    return job
  }

  // Cancel a job
  async cancelJob(jobId: string): Promise<void> {
    if (!this.boss) {
      throw new Error('Job queue not initialized')
    }

    await this.boss.cancel(jobId)
    logger.info('Job cancelled', { jobId })
  }

  // Get queue statistics
  async getQueueStats(): Promise<any> {
    if (!this.boss) {
      throw new Error('Job queue not initialized')
    }

    const stats = await Promise.all([
      this.boss.getQueueSize(JobType.DOCUMENT_PROCESSING),
      this.boss.getQueueSize(JobType.TRANSLATION),
      this.boss.getQueueSize(JobType.BATCH_TRANSLATION),
      this.boss.getQueueSize(JobType.OCR_PROCESSING),
    ])

    return {
      documentProcessing: stats[0],
      translation: stats[1],
      batchTranslation: stats[2],
      ocrProcessing: stats[3],
      total: stats.reduce((sum, count) => sum + count, 0),
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.boss) {
      await this.boss.stop()
      this.isConnected = false
      logger.info('Job queue shut down')
    }
  }
}
