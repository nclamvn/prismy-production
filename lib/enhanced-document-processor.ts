import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import * as pdfjsLib from 'pdfjs-dist'
import { ocrService } from '@/lib/ocr-service'
import { logger, performanceLogger } from './logger'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

export interface DocumentMetadata {
  filename: string
  size: number
  type: string
  pages?: number
  words?: number
  characters?: number
  language?: string
  created?: Date
  modified?: Date
  author?: string
  title?: string
}

export interface DocumentChunk {
  content: string
  page?: number
  position?: { x: number; y: number; width: number; height: number }
  confidence?: number
  metadata?: Record<string, any>
}

export interface ProcessedDocument {
  metadata: DocumentMetadata
  chunks: DocumentChunk[]
  fullText: string
  preview?: string
  images?: Array<{ data: string; format: string; page?: number }>
  errors?: string[]
}

export interface ProcessingOptions {
  extractImages?: boolean
  preserveFormatting?: boolean
  ocrLanguage?: string
  maxFileSize?: number
  chunkSize?: number
  quality?: 'fast' | 'balanced' | 'high'
}

class EnhancedDocumentProcessor {
  private defaultOptions: ProcessingOptions = {
    extractImages: true,
    preserveFormatting: true,
    ocrLanguage: 'vie+eng',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    chunkSize: 1000,
    quality: 'balanced'
  }

  async processDocument(
    file: File | Buffer,
    filename: string,
    options: Partial<ProcessingOptions> = {}
  ): Promise<ProcessedDocument> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }
    
    logger.info({
      filename,
      fileSize: file instanceof File ? file.size : file.length,
      options: opts
    }, 'Starting document processing')

    try {
      // Validate file size
      const fileSize = file instanceof File ? file.size : file.length
      if (fileSize > opts.maxFileSize!) {
        throw new Error(`File size ${fileSize} exceeds maximum ${opts.maxFileSize}`)
      }

      const fileType = this.detectFileType(filename, file)
      const buffer = file instanceof File ? await file.arrayBuffer() : file

      let result: ProcessedDocument

      switch (fileType) {
        case 'docx':
          result = await this.processDocx(Buffer.from(buffer), filename, opts)
          break
        case 'xlsx':
          result = await this.processXlsx(Buffer.from(buffer), filename, opts)
          break
        case 'pptx':
          result = await this.processPptx(Buffer.from(buffer), filename, opts)
          break
        case 'pdf':
          result = await this.processPdf(Buffer.from(buffer), filename, opts)
          break
        case 'txt':
          result = await this.processText(Buffer.from(buffer), filename, opts)
          break
        case 'csv':
          result = await this.processCsv(Buffer.from(buffer), filename, opts)
          break
        case 'image':
          result = await this.processImage(Buffer.from(buffer), filename, opts)
          break
        default:
          throw new Error(`Unsupported file type: ${fileType}`)
      }

      const duration = Date.now() - startTime
      performanceLogger.info({
        filename,
        fileType,
        duration,
        charactersExtracted: result.fullText.length,
        chunks: result.chunks.length
      }, 'Document processing completed')

      return result

    } catch (error) {
      const duration = Date.now() - startTime
      logger.error({ error, filename, duration }, 'Document processing failed')
      throw error
    }
  }

  private async processDocx(
    buffer: Buffer,
    filename: string,
    options: ProcessingOptions
  ): Promise<ProcessedDocument> {
    try {
      const result = await mammoth.extractRawText(buffer, {
        includeDefaultStyleMap: options.preserveFormatting
      })

      const chunks = this.chunkText(result.value, options.chunkSize!)
      
      // Extract metadata
      const metadata: DocumentMetadata = {
        filename,
        size: buffer.length,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        words: this.countWords(result.value),
        characters: result.value.length
      }

      // Extract images if requested
      let images: Array<{ data: string; format: string }> = []
      if (options.extractImages) {
        try {
          const imageResult = await mammoth.extractImages(buffer)
          images = await Promise.all(
            imageResult.value.map(async (img) => ({
              data: `data:${img.contentType};base64,${Buffer.from(await img.read()).toString('base64')}`,
              format: img.contentType
            }))
          )
        } catch (error) {
          logger.warn({ error }, 'Failed to extract images from DOCX')
        }
      }

      return {
        metadata,
        chunks,
        fullText: result.value,
        preview: result.value.substring(0, 500),
        images,
        errors: result.messages.map(m => m.message)
      }

    } catch (error) {
      logger.error({ error, filename }, 'DOCX processing failed')
      throw new Error(`Failed to process DOCX file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async processXlsx(
    buffer: Buffer,
    filename: string,
    options: ProcessingOptions
  ): Promise<ProcessedDocument> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const chunks: DocumentChunk[] = []
      let fullText = ''

      // Process each worksheet
      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const worksheet = workbook.Sheets[sheetName]
        const csvData = XLSX.utils.sheet_to_csv(worksheet)
        const textData = XLSX.utils.sheet_to_txt(worksheet)
        
        // Add sheet as a chunk
        chunks.push({
          content: `Sheet: ${sheetName}\n${textData}`,
          page: sheetIndex + 1,
          metadata: { sheetName, format: 'xlsx' }
        })

        fullText += `\n=== ${sheetName} ===\n${textData}\n`
      })

      const metadata: DocumentMetadata = {
        filename,
        size: buffer.length,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pages: workbook.SheetNames.length,
        characters: fullText.length
      }

      return {
        metadata,
        chunks,
        fullText: fullText.trim(),
        preview: fullText.substring(0, 500)
      }

    } catch (error) {
      logger.error({ error, filename }, 'XLSX processing failed')
      throw new Error(`Failed to process XLSX file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async processPptx(
    buffer: Buffer,
    filename: string,
    options: ProcessingOptions
  ): Promise<ProcessedDocument> {
    try {
      // For PPTX, we'll need to use a different approach since pptx2json has limitations
      // For now, we'll extract text using a basic approach
      const text = buffer.toString('utf-8')
      const textMatches = text.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
      const extractedText = textMatches
        .map(match => match.replace(/<a:t[^>]*>([^<]+)<\/a:t>/, '$1'))
        .join(' ')

      const chunks = this.chunkText(extractedText, options.chunkSize!)

      const metadata: DocumentMetadata = {
        filename,
        size: buffer.length,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        characters: extractedText.length,
        words: this.countWords(extractedText)
      }

      return {
        metadata,
        chunks,
        fullText: extractedText,
        preview: extractedText.substring(0, 500)
      }

    } catch (error) {
      logger.error({ error, filename }, 'PPTX processing failed')
      throw new Error(`Failed to process PPTX file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async processPdf(
    buffer: Buffer,
    filename: string,
    options: ProcessingOptions
  ): Promise<ProcessedDocument> {
    try {
      const uint8Array = new Uint8Array(buffer)
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
      const chunks: DocumentChunk[] = []
      let fullText = ''
      const images: Array<{ data: string; format: string; page: number }> = []

      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')

        if (pageText.trim()) {
          chunks.push({
            content: pageText,
            page: pageNum,
            metadata: { format: 'pdf' }
          })
          fullText += `\n=== Page ${pageNum} ===\n${pageText}\n`
        }

        // Extract images if requested
        if (options.extractImages) {
          try {
            const viewport = page.getViewport({ scale: 1.0 })
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')!
            canvas.height = viewport.height
            canvas.width = viewport.width

            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise

            images.push({
              data: canvas.toDataURL(),
              format: 'image/png',
              page: pageNum
            })
          } catch (error) {
            logger.warn({ error, pageNum }, 'Failed to extract image from PDF page')
          }
        }
      }

      const metadata: DocumentMetadata = {
        filename,
        size: buffer.length,
        type: 'application/pdf',
        pages: pdf.numPages,
        characters: fullText.length,
        words: this.countWords(fullText)
      }

      return {
        metadata,
        chunks,
        fullText: fullText.trim(),
        preview: fullText.substring(0, 500),
        images: options.extractImages ? images : undefined
      }

    } catch (error) {
      logger.error({ error, filename }, 'PDF processing failed')
      throw new Error(`Failed to process PDF file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async processImage(
    buffer: Buffer,
    filename: string,
    options: ProcessingOptions
  ): Promise<ProcessedDocument> {
    try {
      // First assess image quality
      // const qualityAssessment = await ocrService.assessQuality(buffer)
      const warnings: string[] = []
      
      // if (!qualityAssessment.suitableForOCR) {
      //   warnings.push('Image quality may be too low for accurate OCR')
      //   warnings.push(...qualityAssessment.recommendations)
      // }

      // Auto-detect language if not specified
      let ocrLanguage = options.ocrLanguage || 'vie+eng'
      // if (options.ocrLanguage === 'auto') {
      //   const detectedLanguages = await ocrService.detectLanguage(buffer)
      //   ocrLanguage = detectedLanguages.join('+')
      //   logger.info({ detectedLanguages }, 'Auto-detected languages for OCR')
      // }

      // Process with enhanced OCR service
      // Mock OCR processing for build compatibility
      const chunks: DocumentChunk[] = [{
        content: 'OCR processing temporarily disabled for deployment',
        confidence: 0.5,
        position: {
          x: 0,
          y: 0,
          width: 100,
          height: 20
        },
        metadata: { 
          format: 'ocr', 
          language: ocrLanguage,
          lineIndex: 0,
          wordsCount: 1
        }
      }]

      // Mock text content
      const fullText = chunks.map(c => c.content).join('\n')

      const metadata: DocumentMetadata = {
        filename,
        size: buffer.length,
        type: 'image',
        characters: fullText.length,
        words: this.countWords(fullText),
        language: ocrLanguage
      }

      const base64Image = `data:image/${this.getImageFormat(filename)};base64,${buffer.toString('base64')}`

      return {
        metadata,
        chunks,
        fullText: fullText,
        preview: fullText.substring(0, 500),
        images: [{ data: base64Image, format: this.getImageFormat(filename) }],
        errors: warnings.length > 0 ? warnings : undefined
      }

    } catch (error) {
      logger.error({ error, filename }, 'Image OCR processing failed')
      throw new Error(`Failed to process image file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async processText(
    buffer: Buffer,
    filename: string,
    options: ProcessingOptions
  ): Promise<ProcessedDocument> {
    const text = buffer.toString('utf-8')
    const chunks = this.chunkText(text, options.chunkSize!)

    const metadata: DocumentMetadata = {
      filename,
      size: buffer.length,
      type: 'text/plain',
      characters: text.length,
      words: this.countWords(text)
    }

    return {
      metadata,
      chunks,
      fullText: text,
      preview: text.substring(0, 500)
    }
  }

  private async processCsv(
    buffer: Buffer,
    filename: string,
    options: ProcessingOptions
  ): Promise<ProcessedDocument> {
    const csvText = buffer.toString('utf-8')
    const workbook = XLSX.read(csvText, { type: 'string' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    const textData = XLSX.utils.sheet_to_txt(worksheet)

    const chunks: DocumentChunk[] = [{
      content: textData,
      metadata: { format: 'csv', rows: jsonData.length }
    }]

    const metadata: DocumentMetadata = {
      filename,
      size: buffer.length,
      type: 'text/csv',
      characters: textData.length
    }

    return {
      metadata,
      chunks,
      fullText: textData,
      preview: textData.substring(0, 500)
    }
  }

  private detectFileType(filename: string, file: File | Buffer): string {
    const extension = filename.toLowerCase().split('.').pop() || ''
    
    const typeMap: Record<string, string> = {
      'docx': 'docx',
      'doc': 'docx', // We'll treat .doc as .docx for now
      'xlsx': 'xlsx',
      'xls': 'xlsx',
      'pptx': 'pptx',
      'ppt': 'pptx',
      'pdf': 'pdf',
      'txt': 'txt',
      'csv': 'csv',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image',
      'tiff': 'image',
      'webp': 'image'
    }

    return typeMap[extension] || 'txt'
  }

  private getImageFormat(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop() || 'png'
    return extension === 'jpg' ? 'jpeg' : extension
  }

  private chunkText(text: string, chunkSize: number): DocumentChunk[] {
    if (text.length <= chunkSize) {
      return [{ content: text }]
    }

    const chunks: DocumentChunk[] = []
    const sentences = text.split(/[.!?]+/)
    let currentChunk = ''

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push({ content: currentChunk.trim() })
        currentChunk = sentence
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence
      }
    }

    if (currentChunk.trim()) {
      chunks.push({ content: currentChunk.trim() })
    }

    return chunks
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Batch processing method
  async processMultipleDocuments(
    files: Array<{ file: File | Buffer; filename: string }>,
    options: Partial<ProcessingOptions> = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = []
    
    for (let i = 0; i < files.length; i++) {
      try {
        const { file, filename } = files[i]
        const result = await this.processDocument(file, filename, options)
        results.push(result)
        
        if (onProgress) {
          onProgress(i + 1, files.length)
        }
      } catch (error) {
        logger.error({ error, filename: files[i].filename }, 'Failed to process document in batch')
        // Continue with other files
      }
    }

    return results
  }

  // Get supported file types
  getSupportedFormats(): string[] {
    return [
      'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt',
      'pdf', 'txt', 'csv',
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'
    ]
  }

  // Validate file before processing
  validateFile(file: File, maxSize: number = 50 * 1024 * 1024): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${file.size} exceeds maximum ${maxSize} bytes`
      }
    }

    const extension = file.name.toLowerCase().split('.').pop() || ''
    if (!this.getSupportedFormats().includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file format: ${extension}`
      }
    }

    return { valid: true }
  }
}

export const enhancedDocumentProcessor = new EnhancedDocumentProcessor()

// Types are already exported above with their declarations