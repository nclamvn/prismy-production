/**
 * Centralized Job Handlers
 * All job processing logic organized by type
 */

import PgBoss from 'pg-boss'
import { logger } from '@/lib/logger'
import { RealtimeProgressManager, ProgressHelpers } from '@/lib/realtime-progress'
import { createServiceRoleClient } from '@/lib/supabase'

// Always use service role client for server-side job processing
function getSupabaseClient() {
  return createServiceRoleClient()
}

// Import services
import { translationService } from '@/lib/translation-service'

export interface BaseJobData {
  jobId: string
  userId: string
  priority?: number
  metadata?: Record<string, any>
}

export interface DocumentProcessingJobData extends BaseJobData {
  documentId: string
  documentUrl: string
  documentType: 'pdf' | 'docx' | 'txt' | 'xlsx'
  options?: {
    extractText?: boolean
    detectLanguage?: boolean
    performOCR?: boolean
    generateSummary?: boolean
  }
}

export interface TranslationJobData extends BaseJobData {
  text: string
  sourceLang: string
  targetLang: string
  qualityTier: string
  options?: {
    preserveFormatting?: boolean
    glossary?: Record<string, string>
    maxLength?: number
  }
}

export interface BatchTranslationJobData extends BaseJobData {
  documents: TranslationJobData[]
  batchOptions?: {
    parallelProcessing?: boolean
    stopOnError?: boolean
  }
}

export interface OCRJobData extends BaseJobData {
  imageUrl: string
  imageType: string
  options?: {
    language?: string
    extractTables?: boolean
    preprocessImage?: boolean
  }
}

export interface ExportJobData extends BaseJobData {
  dataType: 'translation' | 'document' | 'usage_report'
  format: 'pdf' | 'docx' | 'csv' | 'json'
  filters?: Record<string, any>
  options?: {
    includeMetadata?: boolean
    compression?: boolean
  }
}

const progressManager = RealtimeProgressManager.getInstance()

export class JobHandlers {
  
  // Document Processing Handler
  static async handleDocumentProcessing(job: PgBoss.Job<DocumentProcessingJobData>) {
    const { data } = job
    const { jobId, userId, documentUrl, documentType, options } = data

    try {
      logger.info('Starting document processing', { jobId, userId, documentType })

      // Update progress: starting
      progressManager.updateProgress(
        ProgressHelpers.documentUploaded(jobId, userId, documentUrl)
      )

      // Call Edge Function for processing
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/document-processor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jobId,
            userId,
            documentUrl,
            documentType,
            processingOptions: options
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Edge function failed: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()

      // Update progress: completed
      progressManager.updateProgress(
        ProgressHelpers.completed(jobId, userId, result.resultUrl)
      )

      // Track usage for billing
      await JobHandlers.trackUsage(userId, 'document_processing', 1, {
        documentType,
        documentSize: result.metadata?.size || 0,
        pages: result.pages || 0,
        processingTime: Date.now() - new Date(job.createdon).getTime()
      })

      logger.info('Document processing completed', { jobId, userId })
      return result

    } catch (error: any) {
      logger.error('Document processing failed', { jobId, userId, error: error.message })
      
      // Update progress: failed
      progressManager.updateProgress(
        ProgressHelpers.failed(jobId, userId, error.message)
      )

      throw error
    }
  }

  // Translation Handler
  static async handleTranslation(job: PgBoss.Job<TranslationJobData>) {
    const { data } = job
    const { jobId, userId, text, sourceLang, targetLang, qualityTier, options } = data

    try {
      logger.info('Starting translation', { jobId, userId, sourceLang, targetLang })

      // Update progress: starting
      progressManager.updateProgress(
        ProgressHelpers.translationStarted(jobId, userId, text.length)
      )

      // Validate text length
      const maxLength = options?.maxLength || 50000
      if (text.length > maxLength) {
        throw new Error(`Text exceeds maximum length of ${maxLength} characters`)
      }

      // Perform translation
      const startTime = Date.now()
      const result = await translationService.translateText({
        text,
        sourceLang,
        targetLang,
        qualityTier,
        preserveFormatting: options?.preserveFormatting,
        glossary: options?.glossary
      })

      const processingTime = Date.now() - startTime

      // Update progress: completed
      progressManager.updateProgress(
        ProgressHelpers.completed(jobId, userId)
      )

      // Track usage for billing
      await JobHandlers.trackUsage(userId, 'translation', text.length, {
        sourceLang,
        targetLang,
        qualityTier,
        charactersProcessed: text.length,
        processingTime,
        provider: result.metadata?.provider,
        model: result.metadata?.model,
        cost: result.metadata?.cost
      })

      logger.info('Translation completed', { jobId, userId, processingTime })
      return result

    } catch (error: any) {
      logger.error('Translation failed', { jobId, userId, error: error.message })
      
      // Update progress: failed
      progressManager.updateProgress(
        ProgressHelpers.failed(jobId, userId, error.message)
      )

      throw error
    }
  }

  // Batch Translation Handler
  static async handleBatchTranslation(job: PgBoss.Job<BatchTranslationJobData>) {
    const { data } = job
    const { jobId, userId, documents, batchOptions } = data

    try {
      logger.info('Starting batch translation', { jobId, userId, documentCount: documents.length })

      const results = []
      const totalDocuments = documents.length
      const errors = []

      for (let i = 0; i < totalDocuments; i++) {
        const doc = documents[i]
        
        try {
          // Update progress for each document
          progressManager.updateProgress({
            jobId,
            userId,
            status: 'processing',
            progress: Math.floor((i / totalDocuments) * 100),
            message: `Processing document ${i + 1} of ${totalDocuments}`,
            timestamp: new Date().toISOString()
          })

          // Process individual translation
          const translationResult = await translationService.translateText({
            text: doc.text,
            sourceLang: doc.sourceLang,
            targetLang: doc.targetLang,
            qualityTier: doc.qualityTier,
            preserveFormatting: doc.options?.preserveFormatting,
            glossary: doc.options?.glossary
          })

          results.push({
            originalJobId: doc.jobId,
            success: true,
            result: translationResult
          })

        } catch (docError: any) {
          const errorInfo = {
            originalJobId: doc.jobId,
            success: false,
            error: docError.message
          }
          
          errors.push(errorInfo)
          results.push(errorInfo)

          // Stop on error if configured
          if (batchOptions?.stopOnError) {
            throw new Error(`Batch stopped due to error in document ${i + 1}: ${docError.message}`)
          }
        }
      }

      // Update progress: completed
      progressManager.updateProgress(
        ProgressHelpers.completed(jobId, userId)
      )

      // Track batch usage
      await JobHandlers.trackUsage(userId, 'batch_translation', documents.length, {
        totalDocuments: documents.length,
        successfulDocuments: results.filter(r => r.success).length,
        failedDocuments: errors.length,
        processingTime: Date.now() - new Date(job.createdon).getTime()
      })

      logger.info('Batch translation completed', { 
        jobId, 
        userId, 
        successful: results.filter(r => r.success).length,
        failed: errors.length
      })

      return {
        results,
        summary: {
          total: totalDocuments,
          successful: results.filter(r => r.success).length,
          failed: errors.length,
          errors: errors.slice(0, 10) // Limit error details
        }
      }

    } catch (error: any) {
      logger.error('Batch translation failed', { jobId, userId, error: error.message })
      
      progressManager.updateProgress(
        ProgressHelpers.failed(jobId, userId, error.message)
      )

      throw error
    }
  }

  // OCR Processing Handler
  static async handleOCRProcessing(job: PgBoss.Job<OCRJobData>) {
    const { data } = job
    const { jobId, userId, imageUrl, imageType, options } = data

    try {
      logger.info('Starting OCR processing', { jobId, userId, imageType })

      // Update progress: starting
      progressManager.updateProgress({
        jobId,
        userId,
        status: 'processing',
        progress: 20,
        message: 'Starting OCR processing...',
        timestamp: new Date().toISOString()
      })

      // For now, simulate OCR processing
      // In production, integrate with Google Vision API, AWS Textract, etc.
      const mockResult = {
        text: 'OCR extracted text content...',
        confidence: 0.95,
        language: options?.language || 'en',
        blocks: [],
        tables: options?.extractTables ? [] : undefined
      }

      // Update progress: completed
      progressManager.updateProgress(
        ProgressHelpers.completed(jobId, userId)
      )

      // Track usage
      await JobHandlers.trackUsage(userId, 'ocr_processing', 1, {
        imageType,
        language: options?.language,
        extractTables: options?.extractTables,
        processingTime: Date.now() - new Date(job.createdon).getTime()
      })

      logger.info('OCR processing completed', { jobId, userId })
      return mockResult

    } catch (error: any) {
      logger.error('OCR processing failed', { jobId, userId, error: error.message })
      
      progressManager.updateProgress(
        ProgressHelpers.failed(jobId, userId, error.message)
      )

      throw error
    }
  }

  // Export Generation Handler
  static async handleExportGeneration(job: PgBoss.Job<ExportJobData>) {
    const { data } = job
    const { jobId, userId, dataType, format, filters, options } = data

    try {
      logger.info('Starting export generation', { jobId, userId, dataType, format })

      // Update progress: starting
      progressManager.updateProgress({
        jobId,
        userId,
        status: 'processing',
        progress: 10,
        message: 'Preparing export data...',
        timestamp: new Date().toISOString()
      })

      // Fetch data based on type and filters
      let exportData: any[] = []
      
      switch (dataType) {
        case 'translation':
          const { data: translations } = await getSupabaseClient()
            .from('translations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(filters?.limit || 1000)
          
          exportData = translations || []
          break

        case 'document':
          const { data: documents } = await getSupabaseClient()
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(filters?.limit || 1000)
          
          exportData = documents || []
          break

        case 'usage_report':
          const { data: usage } = await getSupabaseClient()
            .from('usage_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
          
          exportData = usage || []
          break
      }

      // Generate export file
      progressManager.updateProgress({
        jobId,
        userId,
        status: 'processing',
        progress: 70,
        message: `Generating ${format.toUpperCase()} file...`,
        timestamp: new Date().toISOString()
      })

      // For now, simulate file generation
      // In production, implement actual file generation logic
      const exportResult = {
        filename: `export_${dataType}_${Date.now()}.${format}`,
        url: `/api/exports/${jobId}/download`,
        format,
        recordCount: exportData.length,
        fileSize: Math.floor(exportData.length * 0.5), // Simulate file size
        generatedAt: new Date().toISOString()
      }

      // Update progress: completed
      progressManager.updateProgress(
        ProgressHelpers.completed(jobId, userId, exportResult.url)
      )

      // Track usage
      await JobHandlers.trackUsage(userId, 'export_generation', 1, {
        dataType,
        format,
        recordCount: exportData.length,
        fileSize: exportResult.fileSize,
        processingTime: Date.now() - new Date(job.createdon).getTime()
      })

      logger.info('Export generation completed', { jobId, userId, recordCount: exportData.length })
      return exportResult

    } catch (error: any) {
      logger.error('Export generation failed', { jobId, userId, error: error.message })
      
      progressManager.updateProgress(
        ProgressHelpers.failed(jobId, userId, error.message)
      )

      throw error
    }
  }

  // Utility function to track usage
  private static async trackUsage(
    userId: string,
    eventType: string,
    quantity: number,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await getSupabaseClient()
        .from('usage_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          quantity,
          metadata,
          created_at: new Date().toISOString()
        })

      if (error) {
        logger.error('Failed to track usage', { error, userId, eventType })
      }
    } catch (error) {
      logger.error('Usage tracking error', { error, userId, eventType })
    }
  }
}