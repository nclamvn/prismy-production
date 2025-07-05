/**
 * OCR Queue Worker for Large Files
 * 
 * Handles OCR processing asynchronously using a queue system for large files
 * that would timeout in edge functions. Integrates with Redis/Supabase for job management.
 */

interface OCRJobPayload {
  documentId: string
  filePath: string
  fileType: string
  fileSize: number
  userId: string
  options: {
    sourceLanguage?: string
    enableLanguageDetection: boolean
    ocrEngine: 'tesseract' | 'google-vision' | 'azure-cv'
    quality: 'fast' | 'balanced' | 'accurate'
  }
  metadata: {
    uploadedAt: string
    priority: 'low' | 'normal' | 'high'
    estimatedProcessingTime: number
  }
}

interface OCRJobResult {
  success: boolean
  documentId: string
  extractedText?: string
  detectedLanguage?: string
  confidence?: number
  processingTime: number
  error?: string
  metadata: {
    totalPages?: number
    imageCount?: number
    textBlocks?: number
    ocrEngine: string
    modelVersion?: string
  }
}

interface OCRJobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  currentStep: string
  estimatedTimeRemaining: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  error?: string
  retryCount: number
  maxRetries: number
}

// Configuration constants
const MAX_FILE_SIZE_EDGE = 50 * 1024 * 1024 // 50MB - use edge function
const MAX_FILE_SIZE_QUEUE = 500 * 1024 * 1024 // 500MB - use queue worker
const DEFAULT_MAX_RETRIES = 3
const RETRY_DELAY_BASE = 30000 // 30 seconds base delay
const JOB_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const PRIORITY_WEIGHTS = { low: 1, normal: 2, high: 3 }

/**
 * OCR Queue Manager
 */
export class OCRQueue {
  private static instance: OCRQueue
  private isProcessing = false
  private activeJobs = new Set<string>()

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): OCRQueue {
    if (!OCRQueue.instance) {
      OCRQueue.instance = new OCRQueue()
    }
    return OCRQueue.instance
  }

  /**
   * Determines if a file should use queue processing
   */
  static shouldUseQueue(fileSize: number): boolean {
    return fileSize > MAX_FILE_SIZE_EDGE
  }

  /**
   * Estimates OCR processing time based on file characteristics
   */
  static estimateProcessingTime(fileSize: number, fileType: string): number {
    const baseTimePerMB = fileType.includes('pdf') ? 15 : 45 // seconds
    const fileSizeMB = fileSize / (1024 * 1024)
    
    // Add overhead for queue processing and language detection
    const processingTime = fileSizeMB * baseTimePerMB
    const overhead = 1.5
    
    return Math.max(60, processingTime * overhead) // Minimum 1 minute
  }

  /**
   * Adds a new OCR job to the queue
   */
  async enqueueOCRJob(payload: OCRJobPayload): Promise<{ 
    success: boolean
    jobId?: string 
    estimatedWaitTime?: number
    error?: string 
  }> {
    try {
      // Validate payload
      const validation = this.validateJobPayload(payload)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Check file size limits
      if (payload.fileSize > MAX_FILE_SIZE_QUEUE) {
        return { 
          success: false, 
          error: `File size (${(payload.fileSize / 1024 / 1024).toFixed(1)}MB) exceeds queue limit (500MB)` 
        }
      }

      // Generate unique job ID
      const jobId = this.generateJobId(payload.documentId)
      
      // Calculate priority score
      const priorityScore = this.calculatePriorityScore(payload)
      
      // Create job record
      const jobRecord = {
        id: jobId,
        status: 'pending' as const,
        payload,
        priorityScore,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: DEFAULT_MAX_RETRIES,
        progress: 0,
        currentStep: 'Queued for processing',
        estimatedTimeRemaining: payload.metadata.estimatedProcessingTime
      }

      // Save to database
      const result = await this.saveJobToDatabase(jobRecord)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Estimate wait time based on queue position
      const estimatedWaitTime = await this.estimateWaitTime(priorityScore)

      // Start processing if not already running
      this.startProcessingIfIdle()

      return {
        success: true,
        jobId,
        estimatedWaitTime
      }

    } catch (error) {
      console.error('Failed to enqueue OCR job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enqueue job'
      }
    }
  }

  /**
   * Gets the status of an OCR job
   */
  async getJobStatus(jobId: string): Promise<OCRJobStatus | null> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: job, error } = await supabase
        .from('ocr_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error || !job) {
        return null
      }

      return {
        id: job.id,
        status: job.status,
        progress: job.progress || 0,
        currentStep: job.current_step || 'Unknown',
        estimatedTimeRemaining: job.estimated_time_remaining || 0,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        error: job.error,
        retryCount: job.retry_count || 0,
        maxRetries: job.max_retries || DEFAULT_MAX_RETRIES
      }

    } catch (error) {
      console.error('Failed to get job status:', error)
      return null
    }
  }

  /**
   * Cancels a pending OCR job
   */
  async cancelJob(jobId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Verify job ownership
      const { data: job, error: fetchError } = await supabase
        .from('ocr_jobs')
        .select('status, payload')
        .eq('id', jobId)
        .single()

      if (fetchError || !job) {
        return { success: false, error: 'Job not found' }
      }

      const payload = job.payload as OCRJobPayload
      if (payload.userId !== userId) {
        return { success: false, error: 'Access denied' }
      }

      if (job.status === 'processing') {
        return { success: false, error: 'Cannot cancel job in progress' }
      }

      if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        return { success: false, error: 'Job already finished' }
      }

      // Update job status
      const { error: updateError } = await supabase
        .from('ocr_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          current_step: 'Cancelled by user'
        })
        .eq('id', jobId)

      if (updateError) {
        throw updateError
      }

      return { success: true }

    } catch (error) {
      console.error('Failed to cancel job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel job'
      }
    }
  }

  /**
   * Processes pending OCR jobs
   */
  private async startProcessingIfIdle(): Promise<void> {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true
    
    try {
      while (true) {
        const nextJob = await this.getNextJob()
        if (!nextJob) {
          break // No more jobs to process
        }

        await this.processJob(nextJob)
      }
    } catch (error) {
      console.error('Error in job processing loop:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Gets the next highest priority job from the queue
   */
  private async getNextJob(): Promise<any | null> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: jobs, error } = await supabase
        .from('ocr_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)

      if (error || !jobs || jobs.length === 0) {
        return null
      }

      return jobs[0]

    } catch (error) {
      console.error('Failed to get next job:', error)
      return null
    }
  }

  /**
   * Processes a single OCR job
   */
  private async processJob(job: any): Promise<void> {
    const jobId = job.id
    const payload = job.payload as OCRJobPayload

    try {
      // Mark job as processing
      await this.updateJobStatus(jobId, {
        status: 'processing',
        startedAt: new Date().toISOString(),
        currentStep: 'Initializing OCR processing',
        progress: 0
      })

      this.activeJobs.add(jobId)

      // Process OCR with timeout
      const result = await Promise.race([
        this.performOCR(payload, jobId),
        this.createTimeoutPromise(JOB_TIMEOUT)
      ])

      if (result.success) {
        // Update document with OCR results
        await this.updateDocumentWithOCR(payload.documentId, result)

        // Mark job as completed
        await this.updateJobStatus(jobId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          currentStep: 'OCR processing completed',
          progress: 100,
          estimatedTimeRemaining: 0
        })

      } else {
        throw new Error(result.error || 'OCR processing failed')
      }

    } catch (error) {
      console.error(`OCR job ${jobId} failed:`, error)
      
      const retryCount = job.retry_count || 0
      const maxRetries = job.max_retries || DEFAULT_MAX_RETRIES

      if (retryCount < maxRetries) {
        // Schedule retry
        await this.scheduleRetry(jobId, retryCount + 1, error.message)
      } else {
        // Mark as failed
        await this.updateJobStatus(jobId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          currentStep: 'OCR processing failed',
          error: error.message,
          progress: 0
        })
      }

    } finally {
      this.activeJobs.delete(jobId)
    }
  }

  /**
   * Performs the actual OCR processing
   */
  private async performOCR(payload: OCRJobPayload, jobId: string): Promise<OCRJobResult> {
    const startTime = Date.now()

    try {
      // Update progress: Downloading file
      await this.updateJobProgress(jobId, 10, 'Downloading file from storage')

      // Download file from storage
      const fileBuffer = await this.downloadFile(payload.filePath)
      
      // Update progress: Preparing OCR
      await this.updateJobProgress(jobId, 25, 'Preparing OCR processing')

      // Choose OCR engine based on file type and size
      const ocrEngine = this.selectOCREngine(payload.fileSize, payload.fileType, payload.options.quality)
      
      // Update progress: Processing OCR
      await this.updateJobProgress(jobId, 50, `Processing with ${ocrEngine} engine`)

      // Perform OCR based on engine
      let ocrResult: { text: string; confidence?: number; metadata?: any }
      
      switch (ocrEngine) {
        case 'tesseract':
          ocrResult = await this.performTesseractOCR(fileBuffer, payload)
          break
        case 'google-vision':
          ocrResult = await this.performGoogleVisionOCR(fileBuffer, payload)
          break
        case 'azure-cv':
          ocrResult = await this.performAzureOCR(fileBuffer, payload)
          break
        default:
          throw new Error(`Unsupported OCR engine: ${ocrEngine}`)
      }

      // Update progress: Language detection
      await this.updateJobProgress(jobId, 80, 'Detecting language')

      // Detect language if enabled
      let detectedLanguage = payload.options.sourceLanguage
      if (payload.options.enableLanguageDetection && ocrResult.text) {
        const { detectLanguage } = await import('@/lib/ocr/language-detector')
        detectedLanguage = await detectLanguage(ocrResult.text)
      }

      // Update progress: Finalizing
      await this.updateJobProgress(jobId, 95, 'Finalizing results')

      const processingTime = Date.now() - startTime

      return {
        success: true,
        documentId: payload.documentId,
        extractedText: ocrResult.text,
        detectedLanguage,
        confidence: ocrResult.confidence,
        processingTime,
        metadata: {
          totalPages: ocrResult.metadata?.pageCount,
          imageCount: ocrResult.metadata?.imageCount,
          textBlocks: ocrResult.metadata?.textBlocks,
          ocrEngine,
          modelVersion: ocrResult.metadata?.modelVersion
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      return {
        success: false,
        documentId: payload.documentId,
        processingTime,
        error: error instanceof Error ? error.message : 'OCR processing failed',
        metadata: {
          ocrEngine: payload.options.ocrEngine
        }
      }
    }
  }

  /**
   * Downloads file from storage
   */
  private async downloadFile(filePath: string): Promise<Buffer> {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`)
    }

    return Buffer.from(await data.arrayBuffer())
  }

  /**
   * Selects optimal OCR engine based on file characteristics
   */
  private selectOCREngine(fileSize: number, fileType: string, quality: string): string {
    // For large files or high quality, use Google Vision
    if (fileSize > 100 * 1024 * 1024 || quality === 'accurate') {
      return 'google-vision'
    }

    // For PDFs, use Azure for better text extraction
    if (fileType.includes('pdf')) {
      return 'azure-cv'
    }

    // Default to Tesseract for balanced performance
    return 'tesseract'
  }

  /**
   * OCR implementations for different engines
   */
  private async performTesseractOCR(buffer: Buffer, payload: OCRJobPayload): Promise<{
    text: string
    confidence?: number
    metadata?: any
  }> {
    // For MVP, simulate Tesseract processing
    await this.sleep(2000) // Simulate processing time
    
    return {
      text: `[Tesseract OCR Result]\nProcessed file: ${payload.filePath}\nFile size: ${payload.fileSize} bytes\nDetected content from document...`,
      confidence: 0.85,
      metadata: {
        pageCount: 1,
        textBlocks: 5,
        modelVersion: 'tesseract-5.0'
      }
    }
  }

  private async performGoogleVisionOCR(buffer: Buffer, payload: OCRJobPayload): Promise<{
    text: string
    confidence?: number
    metadata?: any
  }> {
    // For MVP, simulate Google Vision API
    await this.sleep(3000) // Simulate processing time
    
    return {
      text: `[Google Vision OCR Result]\nHigh-accuracy text extraction from: ${payload.filePath}\nAdvanced document analysis completed.\nText confidence: 95%`,
      confidence: 0.95,
      metadata: {
        pageCount: 1,
        imageCount: 2,
        textBlocks: 8,
        modelVersion: 'google-vision-v1'
      }
    }
  }

  private async performAzureOCR(buffer: Buffer, payload: OCRJobPayload): Promise<{
    text: string
    confidence?: number
    metadata?: any
  }> {
    // For MVP, simulate Azure Computer Vision
    await this.sleep(2500) // Simulate processing time
    
    return {
      text: `[Azure Computer Vision OCR Result]\nDocument analysis from: ${payload.filePath}\nExtracted text with layout preservation.\nOptimized for PDF documents.`,
      confidence: 0.92,
      metadata: {
        pageCount: 1,
        textBlocks: 6,
        modelVersion: 'azure-cv-3.2'
      }
    }
  }

  /**
   * Utility methods
   */
  private validateJobPayload(payload: OCRJobPayload): { valid: boolean; error?: string } {
    if (!payload.documentId || !payload.filePath || !payload.userId) {
      return { valid: false, error: 'Missing required fields' }
    }

    if (payload.fileSize <= 0) {
      return { valid: false, error: 'Invalid file size' }
    }

    return { valid: true }
  }

  private generateJobId(documentId: string): string {
    return `ocr_${documentId}_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  private calculatePriorityScore(payload: OCRJobPayload): number {
    const priorityWeight = PRIORITY_WEIGHTS[payload.metadata.priority] || 2
    const sizeBonus = payload.fileSize < 10 * 1024 * 1024 ? 1.2 : 1.0 // Boost small files
    const timeBonus = Date.now() / 1000 // Newer jobs get slight priority
    
    return priorityWeight * sizeBonus + (timeBonus / 10000)
  }

  private async estimateWaitTime(priorityScore: number): Promise<number> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { count } = await supabase
        .from('ocr_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('priority_score', priorityScore)

      const avgProcessingTime = 300 // 5 minutes average
      return (count || 0) * avgProcessingTime

    } catch {
      return 300 // Default 5 minutes
    }
  }

  private async saveJobToDatabase(job: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { error } = await supabase
        .from('ocr_jobs')
        .insert({
          id: job.id,
          status: job.status,
          payload: job.payload,
          priority_score: job.priorityScore,
          created_at: job.createdAt,
          retry_count: job.retryCount,
          max_retries: job.maxRetries,
          progress: job.progress,
          current_step: job.currentStep,
          estimated_time_remaining: job.estimatedTimeRemaining
        })

      if (error) {
        throw error
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database error'
      }
    }
  }

  private async updateJobStatus(jobId: string, updates: Partial<OCRJobStatus>): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const updateData: any = {}
      if (updates.status) updateData.status = updates.status
      if (updates.progress !== undefined) updateData.progress = updates.progress
      if (updates.currentStep) updateData.current_step = updates.currentStep
      if (updates.estimatedTimeRemaining !== undefined) updateData.estimated_time_remaining = updates.estimatedTimeRemaining
      if (updates.startedAt) updateData.started_at = updates.startedAt
      if (updates.completedAt) updateData.completed_at = updates.completedAt
      if (updates.error) updateData.error = updates.error

      await supabase
        .from('ocr_jobs')
        .update(updateData)
        .eq('id', jobId)

    } catch (error) {
      console.error('Failed to update job status:', error)
    }
  }

  private async updateJobProgress(jobId: string, progress: number, step: string): Promise<void> {
    await this.updateJobStatus(jobId, {
      progress,
      currentStep: step
    })
  }

  private async scheduleRetry(jobId: string, retryCount: number, error: string): Promise<void> {
    const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount - 1)
    
    setTimeout(async () => {
      await this.updateJobStatus(jobId, {
        status: 'pending',
        retryCount,
        currentStep: `Retry ${retryCount} scheduled`,
        error: `Previous attempt failed: ${error}`
      })
      
      this.startProcessingIfIdle()
    }, delay)
  }

  private async updateDocumentWithOCR(documentId: string, result: OCRJobResult): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      await supabase
        .from('documents')
        .update({
          source_text: result.extractedText,
          detected_language: result.detectedLanguage,
          ocr_confidence: result.confidence,
          ocr_metadata: result.metadata,
          ocr_completed_at: new Date().toISOString()
        })
        .eq('id', documentId)

    } catch (error) {
      console.error('Failed to update document with OCR results:', error)
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OCR processing timeout')), timeout)
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Convenience functions for OCR queue operations
 */
export async function enqueueOCRJob(payload: OCRJobPayload) {
  const queue = OCRQueue.getInstance()
  return queue.enqueueOCRJob(payload)
}

export async function getOCRJobStatus(jobId: string) {
  const queue = OCRQueue.getInstance()
  return queue.getJobStatus(jobId)
}

export async function cancelOCRJob(jobId: string, userId: string) {
  const queue = OCRQueue.getInstance()
  return queue.cancelJob(jobId, userId)
}

export function shouldUseOCRQueue(fileSize: number): boolean {
  return OCRQueue.shouldUseQueue(fileSize)
}

export function estimateOCRTime(fileSize: number, fileType: string): number {
  return OCRQueue.estimateProcessingTime(fileSize, fileType)
}