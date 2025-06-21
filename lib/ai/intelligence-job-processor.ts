// Intelligence Job Processor for document analysis tasks
import { logger } from '@/lib/logger'

export interface IntelligenceJob {
  id: string
  type:
    | 'document_analysis'
    | 'text_extraction'
    | 'translation'
    | 'summarization'
  data: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  result?: any
  error?: string
}

export interface ProcessingResult {
  success: boolean
  result?: any
  error?: string
  processingTime: number
}

class IntelligenceJobProcessor {
  private jobs: Map<string, IntelligenceJob> = new Map()
  private isProcessing = false

  constructor() {
    logger.info('Intelligence Job Processor initialized')
  }

  async addJob(
    job: Omit<IntelligenceJob, 'id' | 'status' | 'createdAt'>
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullJob: IntelligenceJob = {
      ...job,
      id: jobId,
      status: 'pending',
      createdAt: new Date(),
    }

    this.jobs.set(jobId, fullJob)
    logger.info(`Added intelligence job ${jobId} of type ${job.type}`)

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processJobs()
    }

    return jobId
  }

  async getJob(jobId: string): Promise<IntelligenceJob | undefined> {
    return this.jobs.get(jobId)
  }

  async getJobsByStatus(
    status: IntelligenceJob['status']
  ): Promise<IntelligenceJob[]> {
    return Array.from(this.jobs.values()).filter(job => job.status === status)
  }

  private async processJobs(): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true
    logger.info('Starting intelligence job processing')

    while (true) {
      const pendingJobs = await this.getJobsByStatus('pending')

      if (pendingJobs.length === 0) {
        break
      }

      // Sort by priority and creation time
      const sortedJobs = pendingJobs.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      const job = sortedJobs[0]
      await this.processJob(job)
    }

    this.isProcessing = false
    logger.info('Intelligence job processing completed')
  }

  private async processJob(job: IntelligenceJob): Promise<void> {
    try {
      // Update job status
      job.status = 'processing'
      job.startedAt = new Date()
      this.jobs.set(job.id, job)

      logger.info(`Processing intelligence job ${job.id} of type ${job.type}`)

      // Process based on job type
      const result = await this.executeJobByType(job)

      // Update job with result
      job.status = 'completed'
      job.completedAt = new Date()
      job.result = result
      this.jobs.set(job.id, job)

      logger.info(`Intelligence job ${job.id} completed successfully`)
    } catch (error) {
      // Update job with error
      job.status = 'failed'
      job.completedAt = new Date()
      job.error = error instanceof Error ? error.message : 'Unknown error'
      this.jobs.set(job.id, job)

      logger.error(`Intelligence job ${job.id} failed`, error)
    }
  }

  private async executeJobByType(job: IntelligenceJob): Promise<any> {
    switch (job.type) {
      case 'document_analysis':
        return this.processDocumentAnalysis(job.data)
      case 'text_extraction':
        return this.processTextExtraction(job.data)
      case 'translation':
        return this.processTranslation(job.data)
      case 'summarization':
        return this.processSummarization(job.data)
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  }

  private async processDocumentAnalysis(data: any): Promise<any> {
    // Mock document analysis
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      documentType: 'article',
      language: 'en',
      wordCount: 1500,
      readingTime: 6,
      topics: ['technology', 'AI', 'automation'],
      sentiment: 'positive',
      confidence: 0.92,
    }
  }

  private async processTextExtraction(data: any): Promise<any> {
    // Mock text extraction
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      extractedText: 'Extracted text from document',
      confidence: 0.95,
      pageCount: 5,
      formatPreserved: true,
    }
  }

  private async processTranslation(data: any): Promise<any> {
    // Mock translation
    await new Promise(resolve => setTimeout(resolve, 150))
    return {
      translatedText: `Translated: ${data.text}`,
      sourceLanguage: data.sourceLanguage || 'auto',
      targetLanguage: data.targetLanguage || 'en',
      confidence: 0.96,
    }
  }

  private async processSummarization(data: any): Promise<any> {
    // Mock summarization
    await new Promise(resolve => setTimeout(resolve, 250))
    return {
      summary: 'This is a concise summary of the document content.',
      keyPoints: ['Point 1', 'Point 2', 'Point 3'],
      originalLength: data.text?.length || 0,
      summaryLength: 100,
      compressionRatio: 0.1,
    }
  }

  getProcessorStats() {
    const jobs = Array.from(this.jobs.values())
    const stats = {
      totalJobs: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      isProcessing: this.isProcessing,
      averageProcessingTime: this.calculateAverageProcessingTime(jobs),
      jobsByType: this.getJobsByType(jobs),
    }

    return stats
  }

  private calculateAverageProcessingTime(jobs: IntelligenceJob[]): number {
    const completedJobs = jobs.filter(
      j => j.status === 'completed' && j.startedAt && j.completedAt
    )
    if (completedJobs.length === 0) return 0

    const totalTime = completedJobs.reduce((sum, job) => {
      const processingTime =
        job.completedAt!.getTime() - job.startedAt!.getTime()
      return sum + processingTime
    }, 0)

    return totalTime / completedJobs.length
  }

  private getJobsByType(jobs: IntelligenceJob[]): Record<string, number> {
    return jobs.reduce(
      (acc, job) => {
        acc[job.type] = (acc[job.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }
}

export const intelligenceJobProcessor = new IntelligenceJobProcessor()
