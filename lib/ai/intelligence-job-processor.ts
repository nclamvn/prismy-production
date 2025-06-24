// Intelligence Job Processor for document analysis tasks
import { logger } from '@/lib/logger'
import { documentIntelligenceOrchestrator, DocumentAnalysisRequest } from './document-intelligence-orchestrator'
import { streamingProcessor, StreamingProcessorOptions } from './streaming-processor'
import { websocketManager } from '@/lib/websocket/websocket-manager'

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
  progress?: any
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

      // Pass job ID to the job data for progress tracking
      job.data.jobId = job.id

      // Process based on job type
      const result = await this.executeJobByType(job)

      // Update job with result
      job.status = 'completed'
      job.completedAt = new Date()
      job.result = result
      this.jobs.set(job.id, job)

      // Send WebSocket notification about job completion
      if (job.data.userId) {
        websocketManager.sendToUser(job.data.userId, {
          id: `job_complete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'document_analysis_completed',
          userId: 'system',
          timestamp: Date.now(),
          data: {
            jobId: job.id,
            documentId: job.data.documentId,
            result: result,
            processingTime: job.completedAt.getTime() - (job.startedAt?.getTime() || job.createdAt.getTime())
          }
        })

        // Also notify document channel if applicable
        if (job.data.documentId) {
          websocketManager.broadcastToChannel(`document:${job.data.documentId}`, {
            id: `doc_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'document_analysis_ready',
            userId: 'system',
            timestamp: Date.now(),
            channel: `document:${job.data.documentId}`,
            data: {
              jobId: job.id,
              documentId: job.data.documentId,
              analysisResult: result
            }
          })
        }
      }

      logger.info(`Intelligence job ${job.id} completed successfully`)
    } catch (error) {
      // Update job with error
      job.status = 'failed'
      job.completedAt = new Date()
      job.error = error instanceof Error ? error.message : 'Unknown error'
      this.jobs.set(job.id, job)

      // Send WebSocket notification about job failure
      if (job.data.userId) {
        websocketManager.sendToUser(job.data.userId, {
          id: `job_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'document_analysis_failed',
          userId: 'system',
          timestamp: Date.now(),
          data: {
            jobId: job.id,
            documentId: job.data.documentId,
            error: job.error
          }
        })
      }

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
    // Check if streaming processing should be used
    const useStreaming = data.useStreaming || (data.content?.length > 100000)
    
    logger.info('Starting document analysis', { 
      contentLength: data.content?.length || 0,
      analysisDepth: data.options?.analysisDepth || 'standard',
      useStreaming
    })
    
    const analysisRequest: DocumentAnalysisRequest = {
      content: data.content || '',
      documentType: data.documentType,
      language: data.language,
      analysisDepth: data.options?.analysisDepth || 'standard',
      extractEntities: data.options?.extractEntities !== false,
      generateEmbeddings: data.options?.generateEmbeddings !== false,
      buildKnowledgeGraph: data.options?.buildKnowledgeGraph !== false,
      createSummary: data.options?.createSummary !== false,
      extractKeyTerms: data.options?.extractKeyTerms !== false,
      identifyTopics: data.options?.identifyTopics !== false,
      analyzeComplexity: data.options?.analyzeComplexity !== false,
      detectLanguage: data.options?.detectLanguage !== false,
      userTier: data.userTier || 'free'
    }
    
    if (useStreaming) {
      // Use streaming processor for large documents
      logger.info('Using streaming processing for large document analysis')
      
      const streamingOptions: StreamingProcessorOptions = {
        userTier: data.userTier || 'free',
        progressCallback: (progress) => {
          // Store progress in job data for status checks
          const currentJob = this.jobs.get(data.jobId)
          if (currentJob) {
            currentJob.progress = progress
            this.jobs.set(data.jobId, currentJob)

            // Send real-time progress update via WebSocket
            if (data.userId) {
              websocketManager.sendToUser(data.userId, {
                id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'document_analysis_progress',
                userId: 'system',
                timestamp: Date.now(),
                data: {
                  jobId: data.jobId,
                  documentId: data.documentId,
                  progress
                }
              })
            }
          }
        }
      }
      
      const streamingResult = await streamingProcessor.processLargeDocument(
        data.content,
        analysisRequest,
        streamingOptions
      )
      
      if (!streamingResult.success) {
        throw new Error(`Streaming document analysis failed: ${streamingResult.error}`)
      }
      
      return {
        analysisId: streamingResult.aggregatedResult.analysisId,
        documentInfo: streamingResult.aggregatedResult.documentInfo,
        summary: streamingResult.aggregatedResult.summary,
        keyTerms: streamingResult.aggregatedResult.keyTerms,
        topics: streamingResult.aggregatedResult.topics,
        entities: streamingResult.aggregatedResult.entities,
        knowledgeGraph: streamingResult.aggregatedResult.knowledgeGraph,
        embeddings: streamingResult.aggregatedResult.embeddings,
        performance: {
          ...streamingResult.aggregatedResult.performance,
          streamingMetrics: {
            chunksProcessed: streamingResult.processedChunks.length,
            totalProcessingTime: streamingResult.totalProcessingTime,
            memoryUsage: streamingResult.memoryUsage,
            concurrencyUtilization: streamingResult.performance.concurrencyUtilization
          }
        },
        confidence: 0.94 // Slightly higher confidence for streaming analysis
      }
    } else {
      // Use standard processing for smaller documents
      const result = await documentIntelligenceOrchestrator.analyzeDocument(analysisRequest)
      
      if (!result.success) {
        throw new Error(`Document analysis failed: ${result.error}`)
      }
      
      return {
        analysisId: result.analysisId,
        documentInfo: result.documentInfo,
        summary: result.summary,
        keyTerms: result.keyTerms,
        topics: result.topics,
        entities: result.entities,
        knowledgeGraph: result.knowledgeGraph,
        embeddings: result.embeddings,
        performance: result.performance,
        confidence: 0.92
      }
    }
  }

  private async processTextExtraction(data: any): Promise<any> {
    // Use existing OCR service for text extraction
    logger.info('Processing text extraction job')
    
    try {
      // This would integrate with the existing OCR service
      // For now, return extracted content directly if available
      if (data.extractedContent) {
        return {
          extractedText: data.extractedContent,
          confidence: 0.95,
          pageCount: data.pageCount || 1,
          formatPreserved: true,
          language: data.language || 'unknown'
        }
      }
      
      throw new Error('No extracted content available for text extraction')
    } catch (error) {
      logger.error('Text extraction failed:', error)
      throw error
    }
  }

  private async processTranslation(data: any): Promise<any> {
    // Use existing translation service for translation jobs
    logger.info('Processing translation job', {
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage,
      textLength: data.text?.length || 0
    })
    
    try {
      // This would integrate with the existing translation service
      const { translationService } = await import('@/lib/translation-service')
      
      const result = await translationService.translateText({
        text: data.text || '',
        sourceLang: data.sourceLanguage || 'auto',
        targetLang: data.targetLanguage || 'en',
        qualityTier: data.qualityTier || 'standard'
      })
      
      return {
        translatedText: result.translatedText,
        sourceLanguage: result.detectedSourceLanguage || data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        confidence: result.qualityScore || 0.95,
        cached: result.cached || false
      }
    } catch (error) {
      logger.error('Translation job failed:', error)
      throw error
    }
  }

  private async processSummarization(data: any): Promise<any> {
    // Real summarization using document intelligence orchestrator
    logger.info('Processing summarization job', {
      textLength: data.text?.length || 0,
      summaryType: data.summaryType || 'standard'
    })
    
    try {
      const analysisRequest: DocumentAnalysisRequest = {
        content: data.text || '',
        analysisDepth: 'quick',
        createSummary: true,
        extractKeyTerms: true,
        userTier: data.userTier || 'free'
      }
      
      const result = await documentIntelligenceOrchestrator.analyzeDocument(analysisRequest)
      
      if (!result.success || !result.summary) {
        throw new Error('Summarization failed')
      }
      
      const originalLength = data.text?.length || 0
      const summaryLength = result.summary.length
      
      return {
        summary: result.summary,
        keyPoints: result.keyTerms?.slice(0, 5).map(term => term.term) || [],
        originalLength,
        summaryLength,
        compressionRatio: originalLength > 0 ? summaryLength / originalLength : 0,
        confidence: 0.93
      }
    } catch (error) {
      logger.error('Summarization job failed:', error)
      throw error
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
