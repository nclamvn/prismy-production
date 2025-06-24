/**
 * UNIFIED OCR TYPES
 * Shared types for all OCR services
 */

export interface OCROptions {
  languages?: string | string[]
  psm?: number
  oem?: number
  outputFormats?: ('txt' | 'hocr' | 'pdf' | 'searchablePdf' | 'data')[]
  userPatterns?: string[]
  userWords?: string[]
  confidence?: number
}

export interface OCRResult {
  text: string
  confidence: number
  blocks?: OCRBlock[]
  words?: OCRWord[]
  lines?: OCRLine[]
  bbox?: BoundingBox
  metadata?: Record<string, any>
}

export interface OCRBlock {
  text: string
  confidence: number
  bbox: BoundingBox
  lines: OCRLine[]
  baseline?: Baseline
}

export interface OCRLine {
  text: string
  confidence: number
  bbox: BoundingBox
  words: OCRWord[]
  baseline?: Baseline
}

export interface OCRWord {
  text: string
  confidence: number
  bbox: BoundingBox
  baseline?: Baseline
  font_name?: string
  font_size?: number
  is_bold?: boolean
  is_italic?: boolean
}

export interface BoundingBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface Baseline {
  x0: number
  y0: number
  x1: number
  y1: number
  has_baseline: boolean
}

export interface OCRServiceInterface {
  processImage(
    imageData: string | Uint8Array | Buffer,
    options?: OCROptions
  ): Promise<OCRResult>
  
  recognizeFromFile(
    file: File | Buffer,
    options?: OCROptions
  ): Promise<OCRResult>
  
  isSupported(): boolean
  
  getAvailableLanguages(): string[]
}

export interface OCRServiceFactory {
  createService(provider: 'google-vision' | 'fallback'): OCRServiceInterface
}