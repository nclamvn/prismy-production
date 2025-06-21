// Premium Hybrid OCR Service - Client + Cloud Integration
import { logger } from '@/lib/logger'

// OCR Provider Types
export type OCRProvider = 'tesseract' | 'google-vision' | 'azure-cv' | 'aws-textract'

export interface OCRConfig {
  preferredProvider: OCRProvider
  fallbackProviders: OCRProvider[]
  quality: 'fast' | 'balanced' | 'accurate'
  language: string | string[]
  enablePreprocessing: boolean
  enablePostProcessing: boolean
}

export interface OCRResult {
  text: string
  confidence: number
  provider: OCRProvider
  processingTime: number
  words: Array<{
    text: string
    confidence: number
    bbox: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  lines: Array<{
    text: string
    confidence: number
    bbox: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  metadata: {
    imageWidth: number
    imageHeight: number
    detectedLanguages: string[]
    processingSteps: string[]
  }
}

export interface ProgressCallback {
  (progress: {
    step: string
    percentage: number
    message: string
    provider?: OCRProvider
  }): void
}

class HybridOCRService {
  private isClientSide: boolean
  private tesseractWorker: any = null
  private defaultConfig: OCRConfig = {
    preferredProvider: 'tesseract',
    fallbackProviders: ['google-vision'],
    quality: 'balanced',
    language: ['vie', 'eng'],
    enablePreprocessing: true,
    enablePostProcessing: true
  }

  constructor() {
    this.isClientSide = typeof window !== 'undefined'
  }

  /**
   * Premium OCR Processing with Multiple Provider Fallback
   */
  async processImage(
    imageData: string | File | Buffer,
    config: Partial<OCRConfig> = {},
    onProgress?: ProgressCallback
  ): Promise<OCRResult> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const startTime = Date.now()

    onProgress?.({ 
      step: 'initializing', 
      percentage: 0, 
      message: 'Khởi tạo hệ thống OCR...' 
    })

    try {
      // Try client-side first if available
      if (this.isClientSide && finalConfig.preferredProvider === 'tesseract') {
        try {
          const result = await this.processWithTesseract(imageData, finalConfig, onProgress)
          if (result.confidence > 70) {
            logger.info({ provider: 'tesseract', confidence: result.confidence }, 'OCR completed successfully')
            return result
          }
        } catch (error) {
          logger.warn({ error }, 'Client-side OCR failed, falling back to cloud')
        }
      }

      // Fallback to cloud providers
      for (const provider of finalConfig.fallbackProviders) {
        try {
          onProgress?.({ 
            step: 'cloud-processing', 
            percentage: 50, 
            message: `Xử lý với ${provider}...`,
            provider 
          })

          const result = await this.processWithCloudProvider(imageData, provider, finalConfig)
          
          if (result.confidence > 60) {
            logger.info({ provider, confidence: result.confidence }, 'Cloud OCR completed successfully')
            return result
          }
        } catch (error) {
          logger.warn({ error, provider }, `${provider} OCR failed`)
        }
      }

      throw new Error('Tất cả nhà cung cấp OCR đều thất bại')

    } catch (error) {
      logger.error({ error }, 'Hybrid OCR processing failed')
      throw error
    }
  }

  /**
   * Client-side Tesseract.js Processing (Premium Quality)
   */
  private async processWithTesseract(
    imageData: string | File | Buffer,
    config: OCRConfig,
    onProgress?: ProgressCallback
  ): Promise<OCRResult> {
    if (!this.isClientSide) {
      throw new Error('Tesseract chỉ hoạt động trong browser')
    }

    // Dynamic import Tesseract.js only in browser
    const { createWorker } = await import('tesseract.js')
    
    if (!this.tesseractWorker) {
      onProgress?.({ 
        step: 'worker-init', 
        percentage: 10, 
        message: 'Khởi tạo Tesseract worker...' 
      })

      this.tesseractWorker = await createWorker({
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            onProgress?.({
              step: 'recognition',
              percentage: 20 + (m.progress * 60),
              message: `Nhận dạng văn bản: ${Math.round(m.progress * 100)}%`,
              provider: 'tesseract'
            })
          }
        }
      })

      // Vietnamese + English optimization
      const languages = Array.isArray(config.language) ? config.language.join('+') : config.language
      await this.tesseractWorker.loadLanguage(languages)
      await this.tesseractWorker.initialize(languages)
      
      // Premium settings for Vietnamese text
      await this.tesseractWorker.setParameters({
        tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
        tessedit_ocr_engine_mode: '2', // LSTM only
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: (Array.isArray(config.language) ? config.language : [config.language]).includes('vie') 
          ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰự 0123456789'
          : undefined
      })
    }

    onProgress?.({ 
      step: 'recognition', 
      percentage: 20, 
      message: 'Bắt đầu nhận dạng...' 
    })

    const startTime = Date.now()
    const { data } = await this.tesseractWorker.recognize(imageData)
    const processingTime = Date.now() - startTime

    // Post-processing for Vietnamese text
    const processedText = this.postProcessVietnameseText(data.text)
    
    return {
      text: processedText,
      confidence: data.confidence,
      provider: 'tesseract',
      processingTime,
      words: data.words.map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0
        }
      })),
      lines: data.lines.map((line: any) => ({
        text: line.text,
        confidence: line.confidence,
        bbox: {
          x: line.bbox.x0,
          y: line.bbox.y0,
          width: line.bbox.x1 - line.bbox.x0,
          height: line.bbox.y1 - line.bbox.y0
        }
      })),
      metadata: {
        imageWidth: 0, // Will be filled by preprocessing
        imageHeight: 0,
        detectedLanguages: Array.isArray(config.language) ? config.language : [config.language],
        processingSteps: ['tesseract-recognition', 'vietnamese-postprocessing']
      }
    }
  }

  /**
   * Cloud Provider Processing (Enterprise Backup)
   */
  private async processWithCloudProvider(
    imageData: string | File | Buffer,
    provider: OCRProvider,
    config: OCRConfig
  ): Promise<OCRResult> {
    const response = await fetch('/api/ocr/cloud', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        config,
        imageData: await this.convertToBase64(imageData)
      })
    })

    if (!response.ok) {
      throw new Error(`Cloud OCR ${provider} failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Vietnamese Text Post-Processing (Premium Feature)
   */
  private postProcessVietnameseText(text: string): string {
    if (!text) return ''

    // Common Vietnamese OCR corrections
    let processed = text
      // Fix common character misrecognitions
      .replace(/đ/g, 'đ') // Normalize đ character
      .replace(/Đ/g, 'Đ') // Normalize Đ character
      // Fix spacing issues
      .replace(/\s+/g, ' ')
      .trim()
      // Fix punctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/([,.!?;:])\s*/g, '$1 ')

    return processed
  }

  /**
   * Convert various input types to base64
   */
  private async convertToBase64(imageData: string | File | Buffer): Promise<string> {
    if (typeof imageData === 'string') {
      return imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
    }
    
    if (imageData instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(imageData)
      })
    }
    
    if (Buffer.isBuffer(imageData)) {
      return `data:image/jpeg;base64,${imageData.toString('base64')}`
    }
    
    throw new Error('Unsupported image data type')
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate()
      this.tesseractWorker = null
    }
  }

  /**
   * Health check for OCR services
   */
  async healthCheck(): Promise<{
    clientSide: boolean
    cloudProviders: Record<OCRProvider, boolean>
  }> {
    const result = {
      clientSide: false,
      cloudProviders: {} as Record<OCRProvider, boolean>
    }

    // Check client-side availability
    if (this.isClientSide) {
      try {
        await import('tesseract.js')
        result.clientSide = true
      } catch {
        result.clientSide = false
      }
    }

    // Check cloud providers
    for (const provider of ['google-vision', 'azure-cv', 'aws-textract'] as OCRProvider[]) {
      try {
        const response = await fetch(`/api/ocr/health/${provider}`)
        result.cloudProviders[provider] = response.ok
      } catch {
        result.cloudProviders[provider] = false
      }
    }

    return result
  }
}

// Singleton instance
export const hybridOCRService = new HybridOCRService()

// Export for convenience
export default hybridOCRService