// Conditional import for serverless compatibility
let createWorker: any
let Worker: any

// ULTRATHINK: Completely disable tesseract import for serverless
const initTesseract = async () => {
  // Never import tesseract in any production/serverless environment
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
    return false
  }
  
  if (typeof window !== 'undefined') {
    try {
      const tesseract = await import('tesseract.js')
      createWorker = tesseract.createWorker || tesseract.default?.createWorker
      return true
    } catch (error) {
      console.warn('[OCR] Tesseract.js not available in this environment:', error)
      return false
    }
  }
  return false
}

export interface OCROptions {
  languages?: string | string[]
  psm?: number
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
  private workers: Map<string, any> = new Map()
  private workerPool: any[] = []
  private maxWorkers = 2
  private isInitialized = false
  private defaultOptions: OCROptions = {
    languages: 'vie+eng',
    psm: 3, // PSM.AUTO equivalent
    oem: 1,
    preserveInterword: true
  }

  // Initialize worker pool
  async initializeWorkerPool() {
    try {
      // Don't initialize in production Vercel environment
      if (process.env.VERCEL_ENV === 'production') {
        console.warn('OCR service disabled in production environment')
        this.isInitialized = false
        return false
      }

      const tesseractAvailable = await initTesseract()
      if (!tesseractAvailable) {
        console.warn('Tesseract.js not available, OCR service disabled')
        this.isInitialized = false
        return false
      }

      console.info('Initializing OCR worker pool...')
      
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = await this.createWorker()
        this.workerPool.push(worker)
      }
      
      console.info(`OCR worker pool initialized with ${this.maxWorkers} workers`)
      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize OCR worker pool', { error })
      this.isInitialized = false
      return false
    }
  }

  // Create a new worker
  private async createWorker(options: Partial<OCROptions> = {}): Promise<any> {
    // Completely disable OCR in production/serverless environments
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
      throw new Error('OCR not available in serverless environment')
    }

    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      // ULTRATHINK: Completely disable OCR worker creation in serverless
      throw new Error('OCR processing not available in serverless environment')
    } catch (error) {
      console.error('Failed to create OCR worker', { error, options: opts })
      throw error
    }
  }

  // Get available worker from pool
  private getAvailableWorker(): any | null {
    return this.workerPool.pop() || null
  }

  // Return worker to pool
  private returnWorkerToPool(worker: any) {
    if (this.workerPool.length < this.maxWorkers) {
      this.workerPool.push(worker)
    } else {
      // Pool is full, terminate excess worker
      if (worker && worker.terminate) {
        worker.terminate()
      }
    }
  }

  // Process image with OCR
  async processImage(
    imageData: string | ImageData | Buffer | File,
    options: Partial<OCROptions> = {}
  ): Promise<OCRResult> {
    // Return fallback result if OCR is not initialized
    if (!this.isInitialized) {
      console.warn('OCR service not initialized, returning empty result')
      return {
        text: '',
        confidence: 0,
        words: [],
        lines: [],
        paragraphs: []
      }
    }

    const startTime = Date.now()
    const jobId = `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.info('Starting OCR processing', {
      jobId,
      imageType: typeof imageData,
      options
    })

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
        words: data.words.map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })),
        lines: data.lines.map((line: any) => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox,
          words: line.words.map((word: any) => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          }))
        })),
        paragraphs: data.paragraphs.map((para: any) => ({
          text: para.text,
          confidence: para.confidence,
          bbox: para.bbox
        }))
      }

      // Add optional output formats
      if (data.hocr) result.hocr = data.hocr
      if (data.tsv) result.tsv = data.tsv

      const duration = Date.now() - startTime
      console.info('OCR processing completed', {
        jobId,
        duration,
        textLength: result.text.length,
        confidence: result.confidence,
        wordsCount: result.words.length,
        linesCount: result.lines.length
      })

      return result

    } catch (error) {
      console.error('OCR processing failed', { error, jobId })
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
    console.info('Starting batch OCR processing', { count: images.length })
    
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
        console.error('Failed to process image in batch', { error, filename })
        results.push({ 
          filename, 
          result: { 
            text: '', 
            confidence: 0, 
            words: [], 
            lines: [], 
            paragraphs: [] 
          },
          error: error instanceof Error ? error.message : String(error) 
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
    console.info('Processing PDF pages with OCR', { pages: pdfPages.length })
    
    const results: Array<{ page: number; result: OCRResult }> = []
    
    for (let i = 0; i < pdfPages.length; i++) {
      try {
        const result = await this.processImage(pdfPages[i], options)
        results.push({ page: i + 1, result })
        
        if (onProgress) {
          onProgress(i + 1, pdfPages.length)
        }
      } catch (error) {
        console.error('Failed to process PDF page', { error, page: i + 1 })
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
    let worker: any = null
    
    try {
      // ULTRATHINK: Disable createWorker in serverless
      throw new Error('OCR worker creation disabled in serverless environment')
      if (!worker) throw new Error('Failed to create worker')
      
      await worker.loadLanguage('eng')
      await worker.initialize('eng')
      await worker.setParameters({ tessedit_pageseg_mode: 0 }) // PSM.AUTO_OSD equivalent
      
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
      console.error('Language detection failed', { error })
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
    console.info('Cleaning up OCR service...')
    
    // Terminate all workers in pool
    await Promise.all(this.workerPool.map(worker => {
      if (worker && worker.terminate) {
        return worker.terminate()
      }
      return Promise.resolve()
    }))
    this.workerPool = []
    
    // Clear worker registry
    for (const [id, worker] of this.workers) {
      if (worker && worker.terminate) {
        await worker.terminate()
      }
      this.workers.delete(id)
    }
    
    this.isInitialized = false
    console.info('OCR service cleanup completed')
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
        psm: 3 // PSM.AUTO equivalent
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
      console.error('Quality assessment failed', { error })
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

// Initialize on first import (only if in browser environment and not in production)
if (typeof window !== 'undefined' && process.env.VERCEL_ENV !== 'production') {
  ocrService.initializeWorkerPool().catch(error => {
    console.error('Failed to initialize OCR worker pool', { error })
  })
}

// Types are already exported above with their declarations