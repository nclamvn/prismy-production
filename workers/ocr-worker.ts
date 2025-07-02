/**
 * OCR Worker - Phase 3.3-A
 * Extracts text and layout from document pages using Tesseract
 * 
 * Pipeline Flow:
 * 1. Receive job from queue with PDF/image file path
 * 2. Convert PDF pages to PNG images
 * 3. Run OCR on each page with Tesseract
 * 4. Store results in ocr_pages table
 * 5. Update job progress 0% → 30%
 * 6. Emit progress events to Redis stream
 */

import { createClient } from '@supabase/supabase-js'
import Tesseract from 'tesseract.js'
import { createWorker } from 'tesseract.js'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

// Environment configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
const TESSDATA_PREFIX = process.env.TESSDATA_PREFIX || './tessdata'
const MAX_CONCURRENT_OCR = parseInt(process.env.MAX_CONCURRENT_OCR || '3')
const OCR_TIMEOUT = parseInt(process.env.OCR_TIMEOUT || '30000')

interface OCRJob {
  id: string
  type: 'file-processing' | 'document-ocr'
  payload: {
    jobId: string
    fileName: string
    storagePath: string
    mimeType: string
    fileSize: number
  }
}

interface OCRPage {
  job_id: string
  page_number: number
  text: string
  confidence: number
  layout: {
    words: Array<{
      text: string
      bbox: [number, number, number, number]
      confidence: number
    }>
    lines: Array<{
      text: string
      bbox: [number, number, number, number]
      words: number[]
    }>
    paragraphs: Array<{
      text: string
      bbox: [number, number, number, number]
      lines: number[]
    }>
  }
  processing_time_ms: number
  created_at: string
}

export class OCRWorker {
  private supabase: ReturnType<typeof createClient>
  private tesseractWorkers: Tesseract.Worker[] = []
  private isInitialized = false

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }

  /**
   * Initialize Tesseract workers for parallel processing
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log(`[OCR WORKER] Initializing ${MAX_CONCURRENT_OCR} Tesseract workers...`)
    
    for (let i = 0; i < MAX_CONCURRENT_OCR; i++) {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR ${i}] Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      })

      // Configure Tesseract for better accuracy
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_char_whitelist: '', // Allow all characters
        preserve_interword_spaces: '1',
      })

      this.tesseractWorkers.push(worker)
    }

    this.isInitialized = true
    console.log('[OCR WORKER] Initialization complete')
  }

  /**
   * Process OCR job from queue
   */
  async processJob(job: OCRJob): Promise<void> {
    const startTime = Date.now()
    console.log(`[OCR WORKER] Processing job ${job.id}:`, {
      fileName: job.payload.fileName,
      fileSize: job.payload.fileSize,
      mimeType: job.payload.mimeType
    })

    try {
      // Update job status to processing
      await this.updateJobProgress(job.id, {
        status: 'processing',
        progress: 0,
        message: 'Starting OCR processing...',
        currentStep: 'ocr-init',
        totalSteps: 4
      })

      // Step 1: Convert document to images (0-10%)
      const pageImages = await this.convertToImages(job)
      await this.updateJobProgress(job.id, {
        progress: 10,
        message: `Converted ${pageImages.length} pages to images`,
        currentStep: 'convert-images'
      })

      // Step 2: Process OCR on all pages (10-25%)
      const ocrResults = await this.processPages(job, pageImages)
      await this.updateJobProgress(job.id, {
        progress: 25,
        message: `OCR completed on ${ocrResults.length} pages`,
        currentStep: 'ocr-processing'
      })

      // Step 3: Store results in database (25-30%)
      await this.storeOCRResults(job.id, ocrResults)
      await this.updateJobProgress(job.id, {
        progress: 30,
        message: 'OCR results stored successfully',
        currentStep: 'store-results'
      })

      // Cleanup temporary files
      await this.cleanupTempFiles(pageImages.map(p => p.filePath))

      const processingTime = Date.now() - startTime
      console.log(`[OCR WORKER] Job ${job.id} completed in ${processingTime}ms`)

      // Job is ready for next pipeline step (language detection)
      await this.updateJobProgress(job.id, {
        progress: 30,
        message: 'OCR processing complete - ready for language detection',
        currentStep: 'ocr-complete'
      })

    } catch (error) {
      console.error(`[OCR WORKER] Job ${job.id} failed:`, error)
      
      await this.updateJobProgress(job.id, {
        status: 'failed',
        message: `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorMessage: error instanceof Error ? error.stack : String(error)
      })

      throw error
    }
  }

  /**
   * Convert PDF or image to page images
   */
  private async convertToImages(job: OCRJob): Promise<Array<{ pageNumber: number; filePath: string; width: number; height: number }>> {
    const { storagePath, mimeType } = job.payload
    
    if (mimeType === 'application/pdf') {
      return await this.convertPDFToImages(storagePath, job.id)
    } else if (mimeType.startsWith('image/')) {
      return await this.processImageFile(storagePath, job.id)
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`)
    }
  }

  /**
   * Convert PDF to individual page images
   */
  private async convertPDFToImages(pdfPath: string, jobId: string): Promise<Array<{ pageNumber: number; filePath: string; width: number; height: number }>> {
    // In production, use pdf2pic or pdf-poppler for better performance
    // For now, we'll simulate the conversion process
    
    console.log(`[OCR WORKER] Converting PDF to images: ${pdfPath}`)
    
    // Simulate PDF page extraction
    const simulatedPages = [
      { pageNumber: 1, filePath: `/tmp/ocr-${jobId}-page-1.png`, width: 2480, height: 3508 },
      { pageNumber: 2, filePath: `/tmp/ocr-${jobId}-page-2.png`, width: 2480, height: 3508 },
    ]

    // In production implementation:
    /*
    const pdf2pic = require('pdf2pic')
    const convert = pdf2pic.fromPath(pdfPath, {
      density: 300,           // DPI
      saveFilename: `ocr-${jobId}-page`,
      savePath: '/tmp',
      format: 'png',
      width: 2480,
      height: 3508
    })
    
    const results = await convert.bulk(-1) // Convert all pages
    return results.map((result, index) => ({
      pageNumber: index + 1,
      filePath: result.path,
      width: result.width,
      height: result.height
    }))
    */

    return simulatedPages
  }

  /**
   * Process single image file
   */
  private async processImageFile(imagePath: string, jobId: string): Promise<Array<{ pageNumber: number; filePath: string; width: number; height: number }>> {
    console.log(`[OCR WORKER] Processing image file: ${imagePath}`)
    
    // Use Sharp to get image dimensions and prepare for OCR
    const metadata = await sharp(imagePath).metadata()
    
    return [{
      pageNumber: 1,
      filePath: imagePath,
      width: metadata.width || 0,
      height: metadata.height || 0
    }]
  }

  /**
   * Process OCR on all page images in parallel
   */
  private async processPages(job: OCRJob, pageImages: Array<{ pageNumber: number; filePath: string; width: number; height: number }>): Promise<OCRPage[]> {
    console.log(`[OCR WORKER] Processing ${pageImages.length} pages with OCR`)
    
    const results: OCRPage[] = []
    const semaphore = new Array(MAX_CONCURRENT_OCR).fill(0).map((_, i) => i)
    
    // Process pages in batches using available workers
    const pagePromises = pageImages.map(async (pageImage, index) => {
      // Wait for available worker
      const workerIndex = await new Promise<number>((resolve) => {
        const checkWorker = () => {
          const available = semaphore.find(w => w >= 0)
          if (available !== undefined) {
            semaphore[available] = -1 // Mark as busy
            resolve(available)
          } else {
            setTimeout(checkWorker, 100)
          }
        }
        checkWorker()
      })

      try {
        const pageStartTime = Date.now()
        console.log(`[OCR WORKER] Processing page ${pageImage.pageNumber} with worker ${workerIndex}`)
        
        // Simulate OCR processing for now
        const mockOCRResult = await this.simulateOCR(pageImage, job.id)
        
        /* Production OCR code:
        const worker = this.tesseractWorkers[workerIndex]
        const { data } = await worker.recognize(pageImage.filePath, {
          rectangle: { top: 0, left: 0, width: pageImage.width, height: pageImage.height }
        })
        
        const ocrResult: OCRPage = {
          job_id: job.id,
          page_number: pageImage.pageNumber,
          text: data.text,
          confidence: data.confidence,
          layout: {
            words: data.words.map(word => ({
              text: word.text,
              bbox: [word.bbox.x0, word.bbox.y0, word.bbox.x1, word.bbox.y1],
              confidence: word.confidence
            })),
            lines: data.lines.map((line, lineIdx) => ({
              text: line.text,
              bbox: [line.bbox.x0, line.bbox.y0, line.bbox.x1, line.bbox.y1],
              words: line.words.map((_, wordIdx) => lineIdx * 100 + wordIdx)
            })),
            paragraphs: data.paragraphs.map((para, paraIdx) => ({
              text: para.text,
              bbox: [para.bbox.x0, para.bbox.y0, para.bbox.x1, para.bbox.y1],
              lines: para.lines.map((_, lineIdx) => paraIdx * 100 + lineIdx)
            }))
          },
          processing_time_ms: Date.now() - pageStartTime,
          created_at: new Date().toISOString()
        }
        */

        const processingTime = Date.now() - pageStartTime
        console.log(`[OCR WORKER] Page ${pageImage.pageNumber} completed in ${processingTime}ms`)
        
        return mockOCRResult

      } finally {
        // Release worker
        semaphore[workerIndex] = workerIndex
      }
    })

    const ocrResults = await Promise.all(pagePromises)
    
    return ocrResults.sort((a, b) => a.page_number - b.page_number)
  }

  /**
   * Simulate OCR processing (remove in production)
   */
  private async simulateOCR(pageImage: { pageNumber: number; filePath: string }, jobId: string): Promise<OCRPage> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const mockText = `This is page ${pageImage.pageNumber} of the document.
    
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Page ${pageImage.pageNumber} Content - Document ID: ${jobId}`

    return {
      job_id: jobId,
      page_number: pageImage.pageNumber,
      text: mockText,
      confidence: 85 + Math.random() * 10,
      layout: {
        words: mockText.split(' ').map((word, idx) => ({
          text: word,
          bbox: [50 + (idx % 10) * 60, 100 + Math.floor(idx / 10) * 25, 50 + (idx % 10) * 60 + word.length * 8, 120 + Math.floor(idx / 10) * 25],
          confidence: 80 + Math.random() * 15
        })),
        lines: Array(5).fill(0).map((_, lineIdx) => ({
          text: `Line ${lineIdx + 1} of page ${pageImage.pageNumber}`,
          bbox: [50, 100 + lineIdx * 25, 500, 120 + lineIdx * 25],
          words: Array(8).fill(0).map((_, wordIdx) => lineIdx * 8 + wordIdx)
        })),
        paragraphs: Array(2).fill(0).map((_, paraIdx) => ({
          text: `Paragraph ${paraIdx + 1} content`,
          bbox: [50, 100 + paraIdx * 125, 500, 220 + paraIdx * 125],
          lines: [paraIdx * 2, paraIdx * 2 + 1]
        }))
      },
      processing_time_ms: 1500 + Math.random() * 1000,
      created_at: new Date().toISOString()
    }
  }

  /**
   * Store OCR results in database
   */
  private async storeOCRResults(jobId: string, ocrResults: OCRPage[]): Promise<void> {
    console.log(`[OCR WORKER] Storing ${ocrResults.length} OCR results`)
    
    const { error } = await this.supabase
      .from('ocr_pages')
      .insert(ocrResults)

    if (error) {
      throw new Error(`Failed to store OCR results: ${error.message}`)
    }

    console.log(`[OCR WORKER] Successfully stored OCR results for job ${jobId}`)
  }

  /**
   * Update job progress in queue
   */
  private async updateJobProgress(jobId: string, update: {
    status?: string
    progress?: number
    message?: string
    currentStep?: string
    totalSteps?: number
    errorMessage?: string
  }): Promise<void> {
    const { error } = await this.supabase.rpc('update_job_progress', {
      p_job_id: jobId,
      p_status: update.status,
      p_progress: update.progress,
      p_message: update.message,
      p_current_step: update.currentStep,
      p_total_steps: update.totalSteps,
      p_error_message: update.errorMessage
    })

    if (error) {
      console.error(`[OCR WORKER] Failed to update job progress:`, error)
    }

    // TODO: Emit to Redis stream for WebSocket updates
    // await this.emitProgressEvent(jobId, update)
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath)
        console.log(`[OCR WORKER] Cleaned up temp file: ${filePath}`)
      } catch (error) {
        console.warn(`[OCR WORKER] Failed to cleanup temp file ${filePath}:`, error)
      }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('[OCR WORKER] Cleaning up Tesseract workers...')
    
    await Promise.all(
      this.tesseractWorkers.map(worker => worker.terminate())
    )
    
    this.tesseractWorkers = []
    this.isInitialized = false
  }
}

// CLI interface for running as standalone worker
if (require.main === module) {
  const worker = new OCRWorker()
  
  async function processJob() {
    await worker.initialize()
    
    // Example job for testing
    const testJob: OCRJob = {
      id: 'test-ocr-job-' + Date.now(),
      type: 'document-ocr',
      payload: {
        jobId: 'test-job-123',
        fileName: 'sample-document.pdf',
        storagePath: '/uploads/sample-document.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000
      }
    }
    
    try {
      await worker.processJob(testJob)
      console.log('✅ OCR Worker test completed successfully')
    } catch (error) {
      console.error('❌ OCR Worker test failed:', error)
    } finally {
      await worker.cleanup()
    }
  }
  
  processJob().catch(console.error)
}

export default OCRWorker