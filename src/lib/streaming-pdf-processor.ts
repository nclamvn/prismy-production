// Conditional import for serverless compatibility
let pdfjsLib: any = null

// Only import PDF.js in non-production environments
const initPDFjs = async () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    try {
      pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      return true
    } catch (error) {
      console.warn('[PDF] PDF.js not available in this environment:', error)
      return false
    }
  }
  return false
}

import { ocrService } from './ocr-service'

export interface PDFProcessingOptions {
  batchSize?: number // Pages to process in each batch
  maxConcurrentBatches?: number // Maximum concurrent processing batches
  ocrLanguage?: string
  extractImages?: boolean
  qualityMode?: 'fast' | 'balanced' | 'high'
  enableOCR?: boolean
  skipEmptyPages?: boolean
}

export interface PDFPageResult {
  pageNumber: number
  text: string
  images?: Array<{ data: string; format: string }>
  confidence?: number
  processingTime: number
  ocrUsed: boolean
  wordCount: number
  isEmpty: boolean
}

export interface PDFProcessingProgress {
  currentPage: number
  totalPages: number
  percentage: number
  estimatedTimeRemaining: number
  processingSpeed: number // pages per minute
  status: 'initializing' | 'processing' | 'completing' | 'completed' | 'error'
  message?: string
}

export interface PDFProcessingResult {
  totalPages: number
  pages: PDFPageResult[]
  fullText: string
  totalProcessingTime: number
  averageConfidence: number
  imagesExtracted: number
  ocrPagesCount: number
  wordCount: number
  metadata: {
    filename: string
    fileSize: number
    processingOptions: PDFProcessingOptions
    startTime: Date
    endTime: Date
  }
}

export type ProgressCallback = (progress: PDFProcessingProgress) => void

export class StreamingPDFProcessor {
  private defaultOptions: PDFProcessingOptions = {
    batchSize: 5,
    maxConcurrentBatches: 2,
    ocrLanguage: 'vie+eng',
    extractImages: false,
    qualityMode: 'balanced',
    enableOCR: true,
    skipEmptyPages: true
  }

  async processLargePDF(
    buffer: Buffer,
    filename: string,
    options: Partial<PDFProcessingOptions> = {},
    onProgress?: ProgressCallback
  ): Promise<PDFProcessingResult> {
    // Check if PDF.js is available (disabled in production)
    const pdfAvailable = await initPDFjs()
    if (!pdfAvailable) {
      throw new Error('PDF processing not available in serverless environment')
    }

    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }
    
    console.info({
      filename,
      fileSize: buffer.length,
      options: opts
    }, 'Starting large PDF processing')

    try {
      // Load PDF document
      onProgress?.({
        currentPage: 0,
        totalPages: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        processingSpeed: 0,
        status: 'initializing',
        message: 'Loading PDF document...'
      })

      const uint8Array = new Uint8Array(buffer)
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
      const totalPages = pdf.numPages

      console.info({ totalPages, filename }, 'PDF loaded successfully')

      // Initialize processing state
      const pages: PDFPageResult[] = []
      let processedPages = 0
      const processingTimes: number[] = []

      // Process pages in batches
      for (let startPage = 1; startPage <= totalPages; startPage += opts.batchSize!) {
        const endPage = Math.min(startPage + opts.batchSize! - 1, totalPages)
        const batchStartTime = Date.now()

        // Create batch of pages to process
        const pagePromises: Promise<PDFPageResult>[] = []
        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          pagePromises.push(this.processPage(pdf, pageNum, opts))
        }

        // Process batch (with concurrency limit)
        const batchResults = await this.processBatchWithConcurrency(
          pagePromises,
          opts.maxConcurrentBatches!
        )

        pages.push(...batchResults)
        processedPages += batchResults.length

        // Calculate progress metrics
        const batchTime = Date.now() - batchStartTime
        processingTimes.push(batchTime)
        
        const averageTimePerBatch = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        const remainingBatches = Math.ceil((totalPages - processedPages) / opts.batchSize!)
        const estimatedTimeRemaining = Math.round((remainingBatches * averageTimePerBatch) / 1000)
        
        const processingSpeed = (processedPages / ((Date.now() - startTime) / 1000)) * 60 // pages per minute

        // Report progress
        onProgress?.({
          currentPage: processedPages,
          totalPages,
          percentage: Math.round((processedPages / totalPages) * 100),
          estimatedTimeRemaining,
          processingSpeed,
          status: 'processing',
          message: `Processing pages ${startPage}-${endPage}...`
        })

        console.debug({
          batchPages: `${startPage}-${endPage}`,
          batchTime,
          processedPages,
          totalPages,
          processingSpeed
        }, 'Batch completed')
      }

      // Finalize processing
      onProgress?.({
        currentPage: totalPages,
        totalPages,
        percentage: 95,
        estimatedTimeRemaining: 0,
        processingSpeed: 0,
        status: 'completing',
        message: 'Finalizing results...'
      })

      // Compile final results
      const result = this.compileResults(pages, buffer, filename, opts, startTime)

      onProgress?.({
        currentPage: totalPages,
        totalPages,
        percentage: 100,
        estimatedTimeRemaining: 0,
        processingSpeed: 0,
        status: 'completed',
        message: 'Processing completed successfully!'
      })

      const totalProcessingTime = Date.now() - startTime
      console.info({
        filename,
        totalPages,
        totalProcessingTime,
        averageTimePerPage: totalProcessingTime / totalPages,
        ocrPages: result.ocrPagesCount,
        wordCount: result.wordCount
      }, 'Large PDF processing completed')

      return result

    } catch (error) {
      onProgress?.({
        currentPage: 0,
        totalPages: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        processingSpeed: 0,
        status: 'error',
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })

      console.error({ error, filename }, 'Large PDF processing failed')
      throw error
    }
  }

  private async processPage(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    options: PDFProcessingOptions
  ): Promise<PDFPageResult> {
    const pageStartTime = Date.now()

    try {
      const page = await pdf.getPage(pageNumber)
      
      // Extract text using PDF.js text layer
      const textContent = await page.getTextContent()
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim()

      let finalText = text
      let confidence = 1.0
      let ocrUsed = false
      let images: Array<{ data: string; format: string }> = []

      // Check if page is empty and needs OCR
      const isEmpty = text.length < 10
      if (isEmpty && options.enableOCR) {
        try {
          // Render page to canvas for OCR
          const canvas = await this.renderPageToCanvas(page, options.qualityMode!)
          const dataUrl = canvas.toDataURL('image/png')
          const ocrResult = await ocrService.processImage(dataUrl, {
            languages: options.ocrLanguage,
            preserveInterword: true
          })
          
          finalText = ocrResult.text
          confidence = ocrResult.confidence
          ocrUsed = true
        } catch (ocrError) {
          console.warn({ pageNumber, error: ocrError }, 'OCR failed for page')
        }
      }

      // Extract images if requested
      if (options.extractImages && !isEmpty) {
        try {
          const canvas = await this.renderPageToCanvas(page, options.qualityMode!)
          images.push({
            data: canvas.toDataURL('image/png'),
            format: 'png'
          })
        } catch (imageError) {
          console.warn({ pageNumber, error: imageError }, 'Image extraction failed for page')
        }
      }

      // Skip empty pages if option is enabled
      if (options.skipEmptyPages && isEmpty && !ocrUsed) {
        return {
          pageNumber,
          text: '',
          images: [],
          confidence: 1.0,
          processingTime: Date.now() - pageStartTime,
          ocrUsed: false,
          wordCount: 0,
          isEmpty: true
        }
      }

      const processingTime = Date.now() - pageStartTime
      const wordCount = finalText.split(/\s+/).filter(word => word.length > 0).length

      return {
        pageNumber,
        text: finalText,
        images,
        confidence,
        processingTime,
        ocrUsed,
        wordCount,
        isEmpty
      }

    } catch (error) {
      console.error({ pageNumber, error }, 'Page processing failed')
      
      return {
        pageNumber,
        text: '',
        images: [],
        confidence: 0,
        processingTime: Date.now() - pageStartTime,
        ocrUsed: false,
        wordCount: 0,
        isEmpty: true
      }
    }
  }

  private async renderPageToCanvas(
    page: pdfjsLib.PDFPageProxy,
    qualityMode: 'fast' | 'balanced' | 'high'
  ): Promise<HTMLCanvasElement> {
    const scale = {
      fast: 1.0,
      balanced: 1.5,
      high: 2.0
    }[qualityMode]

    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    
    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    return canvas
  }

  private async processBatchWithConcurrency<T>(
    promises: Promise<T>[],
    maxConcurrency: number
  ): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < promises.length; i += maxConcurrency) {
      const batch = promises.slice(i, i + maxConcurrency)
      const batchResults = await Promise.all(batch)
      results.push(...batchResults)
    }
    
    return results
  }

  private compileResults(
    pages: PDFPageResult[],
    buffer: Buffer,
    filename: string,
    options: PDFProcessingOptions,
    startTime: number
  ): PDFProcessingResult {
    // Sort pages by page number
    pages.sort((a, b) => a.pageNumber - b.pageNumber)

    // Filter out empty pages if skip option is enabled
    const validPages = options.skipEmptyPages 
      ? pages.filter(page => !page.isEmpty)
      : pages

    // Compile full text
    const fullText = validPages
      .map(page => page.text)
      .join('\n\n')

    // Calculate statistics
    const totalProcessingTime = Date.now() - startTime
    const averageConfidence = validPages.length > 0
      ? validPages.reduce((sum, page) => sum + (page.confidence || 0), 0) / validPages.length
      : 0
    const imagesExtracted = validPages.reduce((sum, page) => sum + (page.images?.length || 0), 0)
    const ocrPagesCount = validPages.filter(page => page.ocrUsed).length
    const wordCount = validPages.reduce((sum, page) => sum + page.wordCount, 0)

    return {
      totalPages: pages.length,
      pages: validPages,
      fullText,
      totalProcessingTime,
      averageConfidence,
      imagesExtracted,
      ocrPagesCount,
      wordCount,
      metadata: {
        filename,
        fileSize: buffer.length,
        processingOptions: options,
        startTime: new Date(startTime),
        endTime: new Date()
      }
    }
  }

  // Get processing time estimate for a PDF
  async estimateProcessingTime(
    buffer: Buffer,
    options: Partial<PDFProcessingOptions> = {}
  ): Promise<{
    estimatedMinutes: number
    estimatedPages: number
    recommendations: string[]
  }> {
    try {
      const uint8Array = new Uint8Array(buffer)
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
      const totalPages = pdf.numPages

      const opts = { ...this.defaultOptions, ...options }
      
      // Base processing time estimates (in seconds per page)
      const baseTimePerPage = {
        fast: 2,
        balanced: 4,
        high: 8
      }[opts.qualityMode!]

      // OCR adds significant time
      const ocrMultiplier = opts.enableOCR ? 2.5 : 1
      
      // Image extraction adds time
      const imageMultiplier = opts.extractImages ? 1.5 : 1
      
      const estimatedSeconds = totalPages * baseTimePerPage * ocrMultiplier * imageMultiplier
      const estimatedMinutes = Math.ceil(estimatedSeconds / 60)

      // Generate recommendations
      const recommendations: string[] = []
      
      if (totalPages > 100) {
        recommendations.push('Consider processing in batches for very large documents')
      }
      
      if (opts.enableOCR && totalPages > 50) {
        recommendations.push('Disable OCR for faster processing if text extraction is sufficient')
      }
      
      if (opts.extractImages && totalPages > 200) {
        recommendations.push('Disable image extraction to reduce processing time')
      }
      
      if (estimatedMinutes > 30) {
        recommendations.push('Use background processing for documents requiring >30 minutes')
      }

      return {
        estimatedMinutes,
        estimatedPages: totalPages,
        recommendations
      }

    } catch (error) {
      console.error({ error }, 'Failed to estimate processing time')
      return {
        estimatedMinutes: 0,
        estimatedPages: 0,
        recommendations: ['Unable to estimate processing time']
      }
    }
  }
}

// Singleton instance
export const streamingPDFProcessor = new StreamingPDFProcessor()

// Types are already exported above with their declarations