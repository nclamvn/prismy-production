/**
 * PRISMY GOOGLE CLOUD VISION OCR SERVICE
 * Modern OCR service using Google Cloud Vision API
 * Replaces disabled Tesseract.js with cloud-based solution
 */

import { OCROptions, OCRResult, OCRServiceInterface, BoundingBox, OCRWord, OCRLine, OCRBlock } from './ocr/types'

export interface GoogleVisionOptions {
  languages?: string[]
  features?: ('TEXT_DETECTION' | 'DOCUMENT_TEXT_DETECTION')[]
  imageContext?: {
    languageHints?: string[]
    cropHintsParams?: any
    webDetectionParams?: any
  }
}

export interface GoogleVisionWord {
  text: string
  confidence: number
  boundingBox: {
    vertices: Array<{ x: number; y: number }>
  }
}

export interface GoogleVisionTextAnnotation {
  text: string
  confidence: number
  boundingPoly: {
    vertices: Array<{ x: number; y: number }>
  }
  words?: GoogleVisionWord[]
}

class GoogleVisionOCR implements OCRServiceInterface {
  private apiKey: string
  private projectId: string
  private defaultOptions: GoogleVisionOptions = {
    features: ['DOCUMENT_TEXT_DETECTION'],
    imageContext: {
      languageHints: ['vi', 'en']
    }
  }

  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || ''
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || ''
    
    if (!this.apiKey) {
      console.warn('[Google Vision OCR] API key not configured')
    }
  }

  /**
   * Convert image to base64 for Google Vision API
   */
  private async imageToBase64(imageInput: string | File | Buffer): Promise<string> {
    if (typeof imageInput === 'string') {
      // If it's already a base64 string or URL
      if (imageInput.startsWith('data:')) {
        return imageInput.split(',')[1]
      }
      if (imageInput.startsWith('http')) {
        // Fetch image from URL
        const response = await fetch(imageInput)
        const buffer = await response.arrayBuffer()
        return Buffer.from(buffer).toString('base64')
      }
      return imageInput // Assume it's already base64
    }
    
    if (imageInput instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(imageInput)
      })
    }
    
    if (Buffer.isBuffer(imageInput)) {
      return imageInput.toString('base64')
    }
    
    throw new Error('Unsupported image input type')
  }

  /**
   * Convert Google Vision response to OCRResult format
   */
  private convertToOCRResult(visionResponse: any): OCRResult {
    const fullTextAnnotation = visionResponse.fullTextAnnotation
    const textAnnotations = visionResponse.textAnnotations || []
    
    if (!fullTextAnnotation) {
      return {
        text: '',
        confidence: 0,
        words: [],
        lines: [],
        paragraphs: []
      }
    }

    const text = fullTextAnnotation.text || ''
    
    // Extract words with bounding boxes
    const words = []
    const lines = []
    const paragraphs = []
    
    if (fullTextAnnotation.pages) {
      for (const page of fullTextAnnotation.pages) {
        for (const block of page.blocks || []) {
          const paragraphText = []
          const paragraphWords = []
          
          for (const paragraph of block.paragraphs || []) {
            const lineTexts = []
            const lineWords = []
            
            for (const word of paragraph.words || []) {
              const wordText = word.symbols?.map((s: any) => s.text).join('') || ''
              const confidence = word.confidence || 0.8
              
              const bbox = this.convertBoundingPoly(word.boundingBox)
              
              const wordObj = {
                text: wordText,
                confidence,
                bbox
              }
              
              words.push(wordObj)
              lineWords.push(wordObj)
              paragraphWords.push(wordObj)
              lineTexts.push(wordText)
            }
            
            if (lineWords.length > 0) {
              lines.push({
                text: lineTexts.join(' '),
                confidence: lineWords.reduce((sum, w) => sum + w.confidence, 0) / lineWords.length,
                bbox: this.calculateCombinedBbox(lineWords.map(w => w.bbox)),
                words: lineWords
              })
            }
          }
          
          if (paragraphWords.length > 0) {
            paragraphs.push({
              text: paragraphWords.map(w => w.text).join(' '),
              confidence: paragraphWords.reduce((sum, w) => sum + w.confidence, 0) / paragraphWords.length,
              bbox: this.calculateCombinedBbox(paragraphWords.map(w => w.bbox))
            })
          }
        }
      }
    }

    // Fallback: extract from textAnnotations if fullTextAnnotation parsing fails
    if (words.length === 0 && textAnnotations.length > 1) {
      for (let i = 1; i < textAnnotations.length; i++) {
        const annotation = textAnnotations[i]
        words.push({
          text: annotation.description || '',
          confidence: 0.8,
          bbox: this.convertBoundingPoly(annotation.boundingPoly)
        })
      }
    }

    const overallConfidence = words.length > 0 
      ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length 
      : 0

    return {
      text,
      confidence: overallConfidence,
      words,
      lines,
      paragraphs
    }
  }

  /**
   * Convert Google Vision boundingPoly to our bbox format
   */
  private convertBoundingPoly(boundingPoly: any) {
    if (!boundingPoly?.vertices || boundingPoly.vertices.length === 0) {
      return { x0: 0, y0: 0, x1: 0, y1: 0 }
    }

    const vertices = boundingPoly.vertices
    const xs = vertices.map((v: any) => v.x || 0)
    const ys = vertices.map((v: any) => v.y || 0)

    return {
      x0: Math.min(...xs),
      y0: Math.min(...ys),
      x1: Math.max(...xs),
      y1: Math.max(...ys)
    }
  }

  /**
   * Calculate combined bounding box for multiple elements
   */
  private calculateCombinedBbox(bboxes: Array<{ x0: number; y0: number; x1: number; y1: number }>) {
    if (bboxes.length === 0) {
      return { x0: 0, y0: 0, x1: 0, y1: 0 }
    }

    return {
      x0: Math.min(...bboxes.map(b => b.x0)),
      y0: Math.min(...bboxes.map(b => b.y0)),
      x1: Math.max(...bboxes.map(b => b.x1)),
      y1: Math.max(...bboxes.map(b => b.y1))
    }
  }

  /**
   * Main OCR processing method
   */
  async processImage(
    imageInput: string | File | Buffer,
    options: Partial<GoogleVisionOptions> = {}
  ): Promise<OCRResult> {
    if (!this.apiKey) {
      throw new Error('[Google Vision OCR] API key not configured')
    }

    const startTime = Date.now()
    const jobId = `vision-ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.info('[Google Vision OCR] Starting OCR processing', {
      jobId,
      imageType: typeof imageInput,
      options
    })

    try {
      // Convert image to base64
      const base64Image = await this.imageToBase64(imageInput)
      
      // Prepare request
      const requestOptions = { ...this.defaultOptions, ...options }
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: requestOptions.features?.map(feature => ({ type: feature })) || [
              { type: 'DOCUMENT_TEXT_DETECTION' }
            ],
            imageContext: requestOptions.imageContext
          }
        ]
      }

      // Call Google Vision API
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Google Vision API error: ${response.status} ${errorText}`)
      }

      const responseData = await response.json()
      const visionResult = responseData.responses?.[0]

      if (visionResult?.error) {
        throw new Error(`Google Vision API error: ${visionResult.error.message}`)
      }

      // Convert to OCRResult format
      const result = this.convertToOCRResult(visionResult)

      const duration = Date.now() - startTime
      console.info('[Google Vision OCR] Processing completed', {
        jobId,
        duration,
        textLength: result.text.length,
        confidence: result.confidence,
        wordsCount: result.words.length,
        linesCount: result.lines.length
      })

      return result

    } catch (error) {
      console.error('[Google Vision OCR] Processing failed', { error, jobId })
      throw error
    }
  }

  /**
   * Process multiple images in batch
   */
  async processBatch(
    images: Array<{
      data: string | File | Buffer
      filename?: string
    }>,
    options: Partial<GoogleVisionOptions> = {},
    onProgress?: (completed: number, total: number, current?: string) => void
  ): Promise<Array<{ filename?: string; result: OCRResult; error?: string }>> {
    console.info('[Google Vision OCR] Starting batch processing', { count: images.length })

    const results: Array<{
      filename?: string
      result: OCRResult
      error?: string
    }> = []

    for (let i = 0; i < images.length; i++) {
      const { data, filename } = images[i]

      try {
        const result = await this.processImage(data, options)
        results.push({ filename, result })

        if (onProgress) {
          onProgress(i + 1, images.length, filename)
        }
      } catch (error) {
        console.error('[Google Vision OCR] Failed to process image in batch', { error, filename })
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

  /**
   * Detect language in image text
   */
  async detectLanguage(imageInput: string | File | Buffer): Promise<string[]> {
    try {
      const result = await this.processImage(imageInput, {
        features: ['TEXT_DETECTION'],
        imageContext: {
          languageHints: [] // Don't bias towards any language
        }
      })

      const detectedLanguages: string[] = []
      const text = result.text

      // Simple language detection based on character patterns
      if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
        detectedLanguages.push('vi')
      }

      if (/[a-zA-Z]/.test(text)) {
        detectedLanguages.push('en')
      }

      if (/[\u4e00-\u9fff]/.test(text)) {
        detectedLanguages.push('zh')
      }

      if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
        detectedLanguages.push('ja')
      }

      if (/[\uac00-\ud7af]/.test(text)) {
        detectedLanguages.push('ko')
      }

      return detectedLanguages.length > 0 ? detectedLanguages : ['en']

    } catch (error) {
      console.error('[Google Vision OCR] Language detection failed', { error })
      return ['en'] // Default fallback
    }
  }

  /**
   * Check if service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false
      }

      // Create a minimal test image (1x1 pixel)
      const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      
      const result = await this.processImage(testImage)
      return true
    } catch (error) {
      console.error('[Google Vision OCR] Health check failed', { error })
      return false
    }
  }

  // OCRServiceInterface implementation
  async recognizeFromFile(
    file: File | Buffer,
    options?: OCROptions
  ): Promise<OCRResult> {
    return this.processImage(file, options)
  }

  isSupported(): boolean {
    return !!(this.apiKey && this.projectId)
  }

  getAvailableLanguages(): string[] {
    return [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
      'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no'
    ]
  }
}

// Singleton instance
export const googleVisionOCR = new GoogleVisionOCR()

// Compatibility wrapper for existing OCR interface
export class ModernOCRService implements OCRServiceInterface {
  async processImage(
    imageData: string | File | Buffer,
    options: Partial<OCROptions> = {}
  ): Promise<OCRResult> {
    // Convert OCROptions to GoogleVisionOptions
    const visionOptions: Partial<GoogleVisionOptions> = {
      features: ['DOCUMENT_TEXT_DETECTION']
    }

    if (options.languages) {
      const languages = Array.isArray(options.languages) 
        ? options.languages 
        : options.languages.split('+')
      
      visionOptions.imageContext = {
        languageHints: languages
      }
    }

    return googleVisionOCR.processImage(imageData, visionOptions)
  }

  async processBatch(
    images: Array<{
      data: string | File | Buffer
      filename?: string
    }>,
    options: Partial<OCROptions> = {},
    onProgress?: (completed: number, total: number, current?: string) => void
  ): Promise<Array<{ filename?: string; result: OCRResult; error?: string }>> {
    const visionOptions: Partial<GoogleVisionOptions> = {}
    
    if (options.languages) {
      const languages = Array.isArray(options.languages) 
        ? options.languages 
        : options.languages.split('+')
      
      visionOptions.imageContext = {
        languageHints: languages
      }
    }

    return googleVisionOCR.processBatch(images, visionOptions, onProgress)
  }

  async detectLanguage(imageData: string | File | Buffer): Promise<string[]> {
    return googleVisionOCR.detectLanguage(imageData)
  }

  async initializeWorkerPool(): Promise<boolean> {
    return googleVisionOCR.healthCheck()
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for stateless API service
    console.info('[Modern OCR Service] Cleanup completed')
  }

  // OCRServiceInterface implementation
  async recognizeFromFile(
    file: File | Buffer,
    options?: OCROptions
  ): Promise<OCRResult> {
    return this.processImage(file, options)
  }

  isSupported(): boolean {
    return googleVisionOCR.isSupported()
  }

  getAvailableLanguages(): string[] {
    return googleVisionOCR.getAvailableLanguages()
  }
}

// Export the modernized OCR service
export const modernOCRService = new ModernOCRService()