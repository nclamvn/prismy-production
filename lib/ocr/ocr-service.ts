/**
 * PRISMY OCR SERVICE
 * Comprehensive OCR solution with Google Vision primary and Tesseract.js fallback
 * Supports Vietnamese and English text recognition with high accuracy
 */

export interface OCROptions {
  languages?: string[]
  confidence?: number
  enableTextDetection?: boolean
  enableDocumentTextDetection?: boolean
  enableHandwritingDetection?: boolean
  preprocessImage?: boolean
}

export interface OCRResult {
  text: string
  confidence: number
  language: string
  blocks?: TextBlock[]
  processingTime: number
  method: 'google-vision' | 'tesseract' | 'fallback'
}

export interface TextBlock {
  text: string
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  language?: string
}

export interface OCRError {
  code: string
  message: string
  method: 'google-vision' | 'tesseract' | 'system'
  recoverable: boolean
}

class OCRService {
  private readonly defaultOptions: OCROptions = {
    languages: ['en', 'vi'],
    confidence: 0.7,
    enableTextDetection: true,
    enableDocumentTextDetection: true,
    enableHandwritingDetection: false,
    preprocessImage: true
  }

  /**
   * Main OCR processing method with fallback strategy
   */
  async processImage(file: File, options?: OCROptions): Promise<OCRResult> {
    const startTime = Date.now()
    const mergedOptions = { ...this.defaultOptions, ...options }

    try {
      // Primary: Try Google Vision API if available
      if (this.isGoogleVisionAvailable()) {
        console.log('[OCR Service] Attempting Google Vision API processing...')
        const result = await this.processWithGoogleVision(file, mergedOptions)
        if (result.confidence >= mergedOptions.confidence!) {
          return {
            ...result,
            processingTime: Date.now() - startTime,
            method: 'google-vision'
          }
        }
        console.log(`[OCR Service] Google Vision confidence too low (${result.confidence})`)
      }
    } catch (error) {
      console.warn('[OCR Service] Google Vision failed:', error)
    }

    try {
      // Fallback: Try Tesseract.js
      console.log('[OCR Service] Attempting Tesseract.js processing...')
      const result = await this.processWithTesseract(file, mergedOptions)
      return {
        ...result,
        processingTime: Date.now() - startTime,
        method: 'tesseract'
      }
    } catch (error) {
      console.error('[OCR Service] Tesseract.js failed:', error)
    }

    // Final fallback: Basic text detection
    return this.fallbackProcessing(file, startTime)
  }

  /**
   * Google Vision API processing
   */
  private async processWithGoogleVision(file: File, options: OCROptions): Promise<OCRResult> {
    // Convert file to base64
    const base64Data = await this.fileToBase64(file)
    
    const requestBody = {
      requests: [{
        image: {
          content: base64Data.split(',')[1] // Remove data:image/... prefix
        },
        features: [
          ...(options.enableTextDetection ? [{ type: 'TEXT_DETECTION' }] : []),
          ...(options.enableDocumentTextDetection ? [{ type: 'DOCUMENT_TEXT_DETECTION' }] : []),
          ...(options.enableHandwritingDetection ? [{ type: 'HANDWRITING_OCR' }] : [])
        ],
        imageContext: {
          languageHints: options.languages || ['en', 'vi']
        }
      }]
    }

    const response = await fetch('/api/ocr/google-vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.responses?.[0]?.fullTextAnnotation?.text) {
      throw new Error('No text detected by Google Vision')
    }

    const textAnnotation = data.responses[0].fullTextAnnotation
    const blocks = this.parseGoogleVisionBlocks(data.responses[0].textAnnotations)

    return {
      text: textAnnotation.text,
      confidence: this.calculateGoogleVisionConfidence(textAnnotation),
      language: this.detectLanguage(textAnnotation.text),
      blocks,
      processingTime: 0, // Will be set by caller
      method: 'google-vision' as const
    }
  }

  /**
   * Tesseract.js processing
   */
  private async processWithTesseract(file: File, options: OCROptions): Promise<OCRResult> {
    try {
      // Import Tesseract.js dynamically to avoid SSR issues
      const Tesseract = await import('tesseract.js')
      
      const worker = await Tesseract.createWorker(options.languages?.join('+') || 'eng+vie')
      
      try {
        // Preprocess image if enabled
        const processedFile = options.preprocessImage ? 
          await this.preprocessImage(file) : file

        const result = await worker.recognize(processedFile)
        
        return {
          text: result.data.text,
          confidence: result.data.confidence / 100, // Convert to 0-1 scale
          language: this.detectLanguage(result.data.text),
          blocks: this.parseTesseractBlocks(result.data.blocks),
          processingTime: 0, // Will be set by caller
          method: 'tesseract' as const
        }
      } finally {
        await worker.terminate()
      }
    } catch (error) {
      // If Tesseract.js is not available, throw a descriptive error
      throw new Error(`Tesseract.js not available: ${error}`)
    }
  }

  /**
   * Fallback processing when all OCR methods fail
   */
  private async fallbackProcessing(file: File, startTime: number): Promise<OCRResult> {
    console.warn('[OCR Service] All OCR methods failed, using fallback')
    
    return {
      text: `[OCR processing failed for ${file.name}. Please try with a clearer image or different format.]`,
      confidence: 0,
      language: 'unknown',
      processingTime: Date.now() - startTime,
      method: 'fallback'
    }
  }

  /**
   * Check if Google Vision API is available
   */
  private isGoogleVisionAvailable(): boolean {
    return !!(
      process.env.GOOGLE_CLOUD_PROJECT_ID && 
      (process.env.GOOGLE_CLOUD_KEY_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS)
    )
  }

  /**
   * Convert file to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Parse Google Vision text blocks
   */
  private parseGoogleVisionBlocks(textAnnotations: any[]): TextBlock[] {
    if (!textAnnotations || textAnnotations.length < 2) return []
    
    // Skip first annotation (full text) and process individual blocks
    return textAnnotations.slice(1).map(annotation => ({
      text: annotation.description,
      confidence: annotation.confidence || 0.8,
      boundingBox: this.parseGoogleVisionBoundingBox(annotation.boundingPoly),
      language: this.detectLanguage(annotation.description)
    }))
  }

  /**
   * Parse Google Vision bounding box
   */
  private parseGoogleVisionBoundingBox(boundingPoly: any) {
    if (!boundingPoly?.vertices) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    const vertices = boundingPoly.vertices
    const minX = Math.min(...vertices.map((v: any) => v.x || 0))
    const minY = Math.min(...vertices.map((v: any) => v.y || 0))
    const maxX = Math.max(...vertices.map((v: any) => v.x || 0))
    const maxY = Math.max(...vertices.map((v: any) => v.y || 0))

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * Parse Tesseract.js blocks
   */
  private parseTesseractBlocks(blocks: any[]): TextBlock[] {
    if (!blocks) return []
    
    return blocks.flatMap(block => 
      block.paragraphs?.flatMap((para: any) =>
        para.words?.map((word: any) => ({
          text: word.text,
          confidence: word.confidence / 100,
          boundingBox: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0
          },
          language: this.detectLanguage(word.text)
        }))
      ) || []
    )
  }

  /**
   * Calculate confidence score for Google Vision results
   */
  private calculateGoogleVisionConfidence(textAnnotation: any): number {
    if (!textAnnotation.pages) return 0.8
    
    let totalConfidence = 0
    let blockCount = 0
    
    textAnnotation.pages.forEach((page: any) => {
      page.blocks?.forEach((block: any) => {
        if (block.confidence !== undefined) {
          totalConfidence += block.confidence
          blockCount++
        }
      })
    })
    
    return blockCount > 0 ? totalConfidence / blockCount : 0.8
  }

  /**
   * Simple language detection
   */
  private detectLanguage(text: string): string {
    if (!text) return 'unknown'
    
    // Vietnamese diacritics pattern
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
    
    if (vietnamesePattern.test(text)) {
      return 'vi'
    }
    
    // Simple heuristic for English vs other languages
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const words = text.toLowerCase().split(/\s+/)
    const englishWordCount = words.filter(word => englishWords.includes(word)).length
    
    if (englishWordCount > words.length * 0.1) {
      return 'en'
    }
    
    return 'unknown'
  }

  /**
   * Basic image preprocessing
   */
  private async preprocessImage(file: File): Promise<File> {
    // For now, return the original file
    // In a full implementation, this would apply filters, contrast adjustment, etc.
    return file
  }

  /**
   * Validate OCR result quality
   */
  validateResult(result: OCRResult): boolean {
    return (
      result.confidence >= 0.5 &&
      result.text.length > 0 &&
      result.text.trim() !== '[OCR processing failed'
    )
  }

  /**
   * Get OCR statistics for analytics
   */
  getOCRStats(results: OCRResult[]): {
    averageConfidence: number
    methodDistribution: Record<string, number>
    languageDistribution: Record<string, number>
    averageProcessingTime: number
  } {
    if (results.length === 0) {
      return {
        averageConfidence: 0,
        methodDistribution: {},
        languageDistribution: {},
        averageProcessingTime: 0
      }
    }

    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0)
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0)
    
    const methodDist: Record<string, number> = {}
    const langDist: Record<string, number> = {}
    
    results.forEach(result => {
      methodDist[result.method] = (methodDist[result.method] || 0) + 1
      langDist[result.language] = (langDist[result.language] || 0) + 1
    })

    return {
      averageConfidence: totalConfidence / results.length,
      methodDistribution: methodDist,
      languageDistribution: langDist,
      averageProcessingTime: totalTime / results.length
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService()
export default ocrService