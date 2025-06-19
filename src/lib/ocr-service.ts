import { createWorker, PSM, Worker } from 'tesseract.js'
import { logger, performanceLogger } from './logger'

export interface OCROptions {
  languages?: string | string[]
  psm?: PSM
  oem?: number
  whitelist?: string
  blacklist?: string
  preserveInterword?: boolean
  tessjs_create_hocr?: string
  tessjs_create_tsv?: string
  tessjs_create_box?: string
  tessjs_create_unlv?: string
  tessjs_create_osd?: string
}

export interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
  lines: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
    words: Array<{
      text: string
      confidence: number
      bbox: {
        x0: number
        y0: number
        x1: number
        y1: number
      }
    }>
  }>
  paragraphs: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
  hocr?: string
  tsv?: string
}

export interface ProcessingProgress {
  status: string
  progress: number
  userJobId: string
}

class OCRService {
  private workers: Map<string, Worker> = new Map()
  private workerPool: Worker[] = []
  private maxWorkers = 2
  private defaultOptions: OCROptions = {
    languages: 'vie+eng',
    psm: PSM.AUTO,
    oem: 1,
    preserveInterword: true
  }

  // Initialize worker pool
  async initializeWorkerPool() {
    try {
      logger.info('Initializing OCR worker pool...')
      
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = await this.createWorker()
        this.workerPool.push(worker)
      }
      
      logger.info(`OCR worker pool initialized with ${this.maxWorkers} workers`)
    } catch (error) {
      logger.error({ error }, 'Failed to initialize OCR worker pool')
      throw error
    }
  }

  // Create a new worker
  private async createWorker(options: Partial<OCROptions> = {}): Promise<Worker> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      const worker = await createWorker(opts.languages, 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            // Emit progress events for UI updates
            this.emitProgress({
              status: m.status,
              progress: m.progress,
              userJobId: m.userJobId
            })
          }
        }
      })

      // Set additional options
      if (opts.psm) {
        await worker.setParameters({ tessedit_pageseg_mode: opts.psm })
      }
      if (opts.oem) {
        await worker.setParameters({ tessedit_ocr_engine_mode: opts.oem })
      }
      if (opts.whitelist) {
        await worker.setParameters({ tessedit_char_whitelist: opts.whitelist })
      }
      if (opts.blacklist) {
        await worker.setParameters({ tessedit_char_blacklist: opts.blacklist })
      }
      if (opts.preserveInterword) {
        await worker.setParameters({ preserve_interword_spaces: '1' })
      }

      const duration = Date.now() - startTime
      performanceLogger.info({
        duration,
        languages: opts.languages,
        psm: opts.psm
      }, 'OCR worker created successfully')

      return worker
    } catch (error) {
      logger.error({ error, options: opts }, 'Failed to create OCR worker')
      throw error
    }
  }

  // Get available worker from pool
  private getAvailableWorker(): Worker | null {
    return this.workerPool.pop() || null
  }

  // Return worker to pool
  private returnWorkerToPool(worker: Worker) {
    if (this.workerPool.length < this.maxWorkers) {
      this.workerPool.push(worker)
    } else {
      // Pool is full, terminate excess worker
      worker.terminate()
    }
  }

  // Process image with OCR
  async processImage(
    imageData: string | ImageData | Buffer | File,
    options: Partial<OCROptions> = {}
  ): Promise<OCRResult> {
    const startTime = Date.now()
    const jobId = `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    logger.info({
      jobId,
      imageType: typeof imageData,
      options
    }, 'Starting OCR processing')

    let worker = this.getAvailableWorker()
    let shouldReturnToPool = true

    // If no worker available, create a new one
    if (!worker) {
      worker = await this.createWorker(options)
      shouldReturnToPool = false
    }

    try {
      // Configure output formats
      const outputOptions: any = {}
      if (options.tessjs_create_hocr) {
        outputOptions.tessjs_create_hocr = options.tessjs_create_hocr
      }
      if (options.tessjs_create_tsv) {
        outputOptions.tessjs_create_tsv = options.tessjs_create_tsv
      }

      // Recognize text
      const { data } = await worker.recognize(imageData, outputOptions)

      // Build comprehensive result
      const result: OCRResult = {
        text: data.text,
        confidence: data.confidence,
        words: data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })),
        lines: data.lines.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox,
          words: line.words.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          }))
        })),
        paragraphs: data.paragraphs.map(para => ({
          text: para.text,
          confidence: para.confidence,
          bbox: para.bbox
        }))
      }

      // Add optional output formats
      if (data.hocr) result.hocr = data.hocr
      if (data.tsv) result.tsv = data.tsv

      const duration = Date.now() - startTime
      performanceLogger.info({
        jobId,
        duration,
        textLength: result.text.length,
        confidence: result.confidence,
        wordsCount: result.words.length,
        linesCount: result.lines.length
      }, 'OCR processing completed')

      return result

    } catch (error) {
      logger.error({ error, jobId }, 'OCR processing failed')
      throw error
    } finally {
      if (shouldReturnToPool) {
        this.returnWorkerToPool(worker)
      } else {
        await worker.terminate()
      }
    }
  }

  // Process multiple images in batch
  async processBatch(
    images: Array<{ data: string | ImageData | Buffer | File; filename?: string }>,
    options: Partial<OCROptions> = {},
    onProgress?: (completed: number, total: number, current?: string) => void
  ): Promise<Array<{ filename?: string; result: OCRResult; error?: string }>> {
    logger.info({ count: images.length }, 'Starting batch OCR processing')
    
    const results: Array<{ filename?: string; result: OCRResult; error?: string }> = []
    
    for (let i = 0; i < images.length; i++) {
      const { data, filename } = images[i]
      
      try {
        const result = await this.processImage(data, options)
        results.push({ filename, result })
        
        if (onProgress) {
          onProgress(i + 1, images.length, filename)
        }
      } catch (error) {
        logger.error({ error, filename }, 'Failed to process image in batch')
        results.push({ 
          filename, 
          result: { 
            text: '', 
            confidence: 0, 
            words: [], 
            lines: [], 
            paragraphs: [] 
          },
          error: error.message 
        })
      }
    }
    
    return results
  }

  // Extract text from PDF pages as images
  async processPDFPages(
    pdfPages: ImageData[],
    options: Partial<OCROptions> = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<Array<{ page: number; result: OCRResult }>> {
    logger.info({ pages: pdfPages.length }, 'Processing PDF pages with OCR')
    
    const results: Array<{ page: number; result: OCRResult }> = []
    
    for (let i = 0; i < pdfPages.length; i++) {
      try {
        const result = await this.processImage(pdfPages[i], options)
        results.push({ page: i + 1, result })
        
        if (onProgress) {
          onProgress(i + 1, pdfPages.length)
        }
      } catch (error) {
        logger.error({ error, page: i + 1 }, 'Failed to process PDF page')
        results.push({
          page: i + 1,
          result: {
            text: '',
            confidence: 0,
            words: [],
            lines: [],
            paragraphs: []
          }
        })
      }
    }
    
    return results
  }

  // Detect language in image
  async detectLanguage(imageData: string | ImageData | Buffer | File): Promise<string[]> {
    let worker: Worker | null = null
    
    try {
      worker = await createWorker('eng', 1)
      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO_OSD })
      
      const { data } = await worker.recognize(imageData)
      
      // Extract language detection from OCR metadata
      // This is a simplified approach - in practice you might want more sophisticated language detection
      const detectedLanguages: string[] = []
      
      // Check for Vietnamese characters
      if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(data.text)) {
        detectedLanguages.push('vie')
      }
      
      // Check for English (default assumption if ASCII)
      if (/[a-zA-Z]/.test(data.text)) {
        detectedLanguages.push('eng')
      }
      
      return detectedLanguages.length > 0 ? detectedLanguages : ['eng']
      
    } catch (error) {
      logger.error({ error }, 'Language detection failed')
      return ['eng'] // Default fallback
    } finally {
      if (worker) {
        await worker.terminate()
      }
    }
  }

  // Get supported languages
  getSupportedLanguages(): string[] {
    return [
      'afr', 'amh', 'ara', 'asm', 'aze', 'aze_cyrl', 'bel', 'ben', 'bod', 'bos',
      'bre', 'bul', 'cat', 'ceb', 'ces', 'chi_sim', 'chi_tra', 'chr', 'cym',
      'dan', 'deu', 'dzo', 'ell', 'eng', 'enm', 'epo', 'est', 'eus', 'fao',
      'fas', 'fin', 'fra', 'frk', 'frm', 'gle', 'glg', 'grc', 'guj', 'hat',
      'heb', 'hin', 'hrv', 'hun', 'hye', 'iku', 'ind', 'isl', 'ita', 'ita_old',
      'jav', 'jpn', 'kan', 'kat', 'kat_old', 'kaz', 'khm', 'kir', 'kor',
      'kur', 'lao', 'lat', 'lav', 'lit', 'ltz', 'mal', 'mar', 'mkd', 'mlt',
      'mon', 'mri', 'msa', 'mya', 'nep', 'nld', 'nor', 'oci', 'ori', 'pan',
      'pol', 'por', 'pus', 'que', 'ron', 'rus', 'san', 'sin', 'slk', 'slv',
      'snd', 'spa', 'spa_old', 'sqi', 'srp', 'srp_latn', 'sun', 'swa', 'swe',
      'syr', 'tam', 'tat', 'tel', 'tgk', 'tgl', 'tha', 'tir', 'ton', 'tur',
      'uig', 'ukr', 'urd', 'uzb', 'uzb_cyrl', 'vie', 'yid', 'yor'
    ]
  }

  // Clean up resources
  async cleanup() {
    logger.info('Cleaning up OCR service...')
    
    // Terminate all workers in pool
    await Promise.all(this.workerPool.map(worker => worker.terminate()))
    this.workerPool = []
    
    // Clear worker registry
    for (const [id, worker] of this.workers) {
      await worker.terminate()
      this.workers.delete(id)
    }
    
    logger.info('OCR service cleanup completed')
  }

  // Private method to emit progress events
  private emitProgress(progress: ProcessingProgress) {
    // In a real implementation, you might use an event emitter
    // or callback system to notify the UI of progress updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ocr-progress', { 
        detail: progress 
      }))
    }
  }

  // Quality assessment
  async assessQuality(imageData: string | ImageData | Buffer | File): Promise<{
    confidence: number
    recommendations: string[]
    suitableForOCR: boolean
  }> {
    try {
      // Quick OCR run to assess quality
      const result = await this.processImage(imageData, {
        languages: 'eng',
        psm: PSM.AUTO
      })

      const confidence = result.confidence
      const recommendations: string[] = []
      
      if (confidence < 30) {
        recommendations.push('Image quality is very low - consider rescanning')
        recommendations.push('Ensure good lighting and focus')
      } else if (confidence < 60) {
        recommendations.push('Image quality could be improved')
        recommendations.push('Try increasing resolution or contrast')
      } else if (confidence < 80) {
        recommendations.push('Good quality - minor improvements possible')
      }

      // Check text density
      const wordCount = result.words.length
      if (wordCount < 10) {
        recommendations.push('Very little text detected - verify image contains readable text')
      }

      return {
        confidence,
        recommendations,
        suitableForOCR: confidence > 30 && wordCount > 5
      }
    } catch (error) {
      logger.error({ error }, 'Quality assessment failed')
      return {
        confidence: 0,
        recommendations: ['Failed to assess image quality'],
        suitableForOCR: false
      }
    }
  }
}

// Singleton instance
export const ocrService = new OCRService()

// Initialize on first import (if in browser environment)
if (typeof window !== 'undefined') {
  ocrService.initializeWorkerPool().catch(error => {
    logger.error({ error }, 'Failed to initialize OCR worker pool')
  })
}

// Export types
export type { OCROptions, OCRResult, ProcessingProgress }