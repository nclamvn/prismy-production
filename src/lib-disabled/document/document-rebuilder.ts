/**
 * Universal Document Rebuilder
 * 
 * Main interface for rebuilding documents with translated content
 * Supports PDF, DOCX, and text formats
 */

import { rebuildPDF, validatePDFBuffer, estimatePDFRebuild, createPDFPreview } from './pdf-rebuilder'
import { rebuildDOCX, validateDOCXBuffer, estimateDOCXRebuild, createDOCXPreview, extractDOCXText } from './docx-rebuilder'

export type DocumentFormat = 'pdf' | 'docx' | 'txt' | 'md'

interface RebuildOptions {
  format?: DocumentFormat
  preserveFormatting?: boolean
  preserveImages?: boolean
  fontSize?: number
  fontFamily?: string
  outputPath?: string
}

interface RebuildResult {
  success: boolean
  outputBuffer: Buffer
  outputFormat: DocumentFormat
  metadata: {
    originalSize: number
    outputSize: number
    processingTimeMs: number
    pageCount?: number
    wordCount?: number
  }
  preview?: string
  error?: string
}

interface RebuildEstimate {
  estimatedTimeMinutes: number
  estimatedOutputSize: number
  estimatedComplexity: 'simple' | 'medium' | 'complex'
  supportedFeatures: string[]
  limitations: string[]
}

const DEFAULT_OPTIONS: RebuildOptions = {
  preserveFormatting: true,
  preserveImages: false, // MVP limitation
  fontSize: 12,
  fontFamily: 'default'
}

/**
 * Detects document format from buffer
 */
export function detectDocumentFormat(buffer: Buffer, filename?: string): DocumentFormat {
  // Check by file extension first
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop()
    if (ext === 'pdf') return 'pdf'
    if (ext === 'docx') return 'docx'
    if (ext === 'txt') return 'txt'
    if (ext === 'md') return 'md'
  }
  
  // Check by buffer content
  if (validatePDFBuffer(buffer)) return 'pdf'
  if (validateDOCXBuffer(buffer)) return 'docx'
  
  // Default to text
  return 'txt'
}

/**
 * Estimates rebuild requirements for a document
 */
export function estimateDocumentRebuild(
  buffer: Buffer,
  translatedText: string,
  format: DocumentFormat
): RebuildEstimate {
  const originalSize = buffer.length
  const translatedLength = translatedText.length
  
  switch (format) {
    case 'pdf': {
      const estimate = estimatePDFRebuild(originalSize, translatedLength)
      return {
        estimatedTimeMinutes: estimate.estimatedTimeMinutes,
        estimatedOutputSize: estimate.estimatedOutputSize,
        estimatedComplexity: estimate.estimatedComplexity,
        supportedFeatures: [
          'Text replacement',
          'Basic formatting',
          'Page layout preservation',
          'Font sizing'
        ],
        limitations: [
          'Complex layouts may be simplified',
          'Images are not preserved in MVP',
          'Advanced formatting may be lost'
        ]
      }
    }
    
    case 'docx': {
      const estimate = estimateDOCXRebuild(originalSize, translatedLength)
      return {
        estimatedTimeMinutes: estimate.estimatedTimeMinutes,
        estimatedOutputSize: estimate.estimatedOutputSize,
        estimatedComplexity: estimate.estimatedComplexity,
        supportedFeatures: [
          'Text replacement',
          'Paragraph structure',
          'Basic text formatting',
          'Heading styles'
        ],
        limitations: [
          'Tables not preserved in MVP',
          'Images not preserved in MVP',
          'Complex formatting may be simplified'
        ]
      }
    }
    
    case 'txt':
    case 'md': {
      return {
        estimatedTimeMinutes: 0.1,
        estimatedOutputSize: translatedLength,
        estimatedComplexity: 'simple',
        supportedFeatures: [
          'Full text replacement',
          'Fast processing',
          'Reliable output'
        ],
        limitations: []
      }
    }
    
    default:
      throw new Error(`Unsupported document format: ${format}`)
  }
}

/**
 * Rebuilds a document with translated content
 */
export async function rebuildDocument(
  originalBuffer: Buffer,
  translatedText: string,
  options: RebuildOptions = {}
): Promise<RebuildResult> {
  const startTime = Date.now()
  const finalOptions = { ...DEFAULT_OPTIONS, ...options }
  
  // Detect format if not provided
  const format = finalOptions.format || detectDocumentFormat(originalBuffer)
  
  try {
    let outputBuffer: Buffer
    let preview: string | undefined
    
    switch (format) {
      case 'pdf': {
        outputBuffer = await rebuildPDF(originalBuffer, translatedText, {
          fontSize: finalOptions.fontSize,
          fontFamily: finalOptions.fontFamily,
          preserveImages: finalOptions.preserveImages,
          preserveFormatting: finalOptions.preserveFormatting
        })
        
        // Create preview using the PDF rebuilder
        const { analyzePDFLayout } = await import('./pdf-rebuilder')
        const originalPages = await analyzePDFLayout(originalBuffer)
        preview = createPDFPreview(translatedText, originalPages)
        break
      }
      
      case 'docx': {
        outputBuffer = await rebuildDOCX(originalBuffer, translatedText, {
          fontSize: finalOptions.fontSize,
          fontFamily: finalOptions.fontFamily,
          preserveImages: finalOptions.preserveImages,
          preserveStyles: finalOptions.preserveFormatting
        })
        
        // Create preview using the DOCX rebuilder
        const { analyzeDOCXStructure } = await import('./docx-rebuilder')
        const originalStructure = await analyzeDOCXStructure(originalBuffer)
        preview = createDOCXPreview(translatedText, originalStructure)
        break
      }
      
      case 'txt': {
        outputBuffer = Buffer.from(translatedText, 'utf-8')
        preview = translatedText.substring(0, 500) + (translatedText.length > 500 ? '...' : '')
        break
      }
      
      case 'md': {
        // For markdown, preserve basic structure
        const markdownContent = `# Translated Document

${translatedText}

---
*Translated using Prismy v2*`
        
        outputBuffer = Buffer.from(markdownContent, 'utf-8')
        preview = markdownContent.substring(0, 500) + (markdownContent.length > 500 ? '...' : '')
        break
      }
      
      default:
        throw new Error(`Unsupported document format: ${format}`)
    }
    
    const processingTime = Date.now() - startTime
    
    return {
      success: true,
      outputBuffer,
      outputFormat: format,
      metadata: {
        originalSize: originalBuffer.length,
        outputSize: outputBuffer.length,
        processingTimeMs: processingTime,
        pageCount: format === 'pdf' ? Math.ceil(translatedText.length / 2000) : undefined,
        wordCount: translatedText.split(/\s+/).length
      },
      preview
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    return {
      success: false,
      outputBuffer: Buffer.from(''),
      outputFormat: format,
      metadata: {
        originalSize: originalBuffer.length,
        outputSize: 0,
        processingTimeMs: processingTime
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Creates a preview of the rebuilt document
 */
export async function createDocumentPreview(
  originalBuffer: Buffer,
  translatedText: string,
  format?: DocumentFormat
): Promise<string> {
  const detectedFormat = format || detectDocumentFormat(originalBuffer)
  
  try {
    switch (detectedFormat) {
      case 'pdf': {
        const { analyzePDFLayout } = await import('./pdf-rebuilder')
        const originalPages = await analyzePDFLayout(originalBuffer)
        return createPDFPreview(translatedText, originalPages)
      }
      
      case 'docx': {
        const { analyzeDOCXStructure } = await import('./docx-rebuilder')
        const originalStructure = await analyzeDOCXStructure(originalBuffer)
        return createDOCXPreview(translatedText, originalStructure)
      }
      
      case 'txt':
      case 'md': {
        const preview = translatedText.substring(0, 1000)
        return preview + (translatedText.length > 1000 ? '\n\n... (truncated)' : '')
      }
      
      default:
        return 'Preview not available for this format'
    }
  } catch (error) {
    return `Preview error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Validates if a document can be rebuilt
 */
export function canRebuildDocument(buffer: Buffer, format?: DocumentFormat): {
  canRebuild: boolean
  reason?: string
  suggestedFormat?: DocumentFormat
} {
  const detectedFormat = format || detectDocumentFormat(buffer)
  
  // Check file size limits
  const maxSize = 10 * 1024 * 1024 // 10MB limit for MVP
  if (buffer.length > maxSize) {
    return {
      canRebuild: false,
      reason: `File too large (${Math.round(buffer.length / 1024 / 1024)}MB). Maximum size is ${maxSize / 1024 / 1024}MB.`
    }
  }
  
  // Check minimum size
  if (buffer.length < 10) {
    return {
      canRebuild: false,
      reason: 'File too small or corrupted'
    }
  }
  
  // Format-specific validation (only if format is explicitly specified)
  if (format) {
    switch (format) {
      case 'pdf':
        if (!validatePDFBuffer(buffer)) {
          return {
            canRebuild: false,
            reason: 'Invalid PDF format',
            suggestedFormat: 'txt'
          }
        }
        break
        
      case 'docx':
        if (!validateDOCXBuffer(buffer)) {
          return {
            canRebuild: false,
            reason: 'Invalid DOCX format',
            suggestedFormat: 'txt'
          }
        }
        break
    }
  }
  
  return { canRebuild: true }
}

/**
 * Gets supported formats and their capabilities
 */
export function getSupportedFormats(): Record<DocumentFormat, {
  name: string
  extensions: string[]
  capabilities: string[]
  limitations: string[]
}> {
  return {
    pdf: {
      name: 'PDF Document',
      extensions: ['.pdf'],
      capabilities: ['Text replacement', 'Basic layout preservation', 'Page structure'],
      limitations: ['No image preservation (MVP)', 'Complex layouts simplified']
    },
    docx: {
      name: 'Word Document',
      extensions: ['.docx'],
      capabilities: ['Text replacement', 'Style preservation', 'Paragraph structure'],
      limitations: ['No table preservation (MVP)', 'No image preservation (MVP)']
    },
    txt: {
      name: 'Plain Text',
      extensions: ['.txt'],
      capabilities: ['Full text replacement', 'Fast processing', 'Reliable'],
      limitations: ['No formatting']
    },
    md: {
      name: 'Markdown',
      extensions: ['.md'],
      capabilities: ['Text replacement', 'Basic markdown structure'],
      limitations: ['Advanced markdown features not preserved']
    }
  }
}