/**
 * PRISMY UNIFIED DOCUMENT PROCESSOR
 * Consolidates all existing document processing capabilities into one unified system
 * Combines: DocumentProcessor, EnhancedDocumentProcessor, UniversalDocumentParser
 */

import React from 'react'
import { ProcessedDocument, DocumentChunk, DocumentMetadata } from './document-processor'
import { DocumentStructure } from './document-parsers'

export interface UnifiedProcessingOptions {
  // Processing mode
  mode: 'fast' | 'standard' | 'comprehensive'
  
  // Language preferences
  languages: string[]
  autoDetectLanguage: boolean
  
  // OCR options
  useOCR: boolean
  ocrProvider: 'google-vision' | 'tesseract' | 'auto'
  
  // Chunking options
  chunkSize: number
  chunkOverlap: number
  preserveStructure: boolean
  
  // Quality options
  enableStructureAnalysis: boolean
  enableMetadataExtraction: boolean
  enableImageAnalysis: boolean
  
  // Performance options
  enableCaching: boolean
  enableProgressTracking: boolean
  maxConcurrency: number
}

export interface UnifiedProcessingResult {
  // Core result
  document: ProcessedDocument
  
  // Enhanced structure
  structure?: DocumentStructure
  
  // Processing metadata
  processingTime: number
  processingMode: string
  confidence: number
  
  // Advanced features
  images?: Array<{
    id: string
    text?: string
    description?: string
    confidence?: number
  }>
  
  tables?: Array<{
    id: string
    headers: string[]
    rows: string[][]
    pageNumber?: number
  }>
  
  // Quality metrics
  quality: {
    textExtraction: number
    structurePreservation: number
    languageDetection: number
    overall: number
  }
}

export interface ProcessingProgress {
  stage: 'uploading' | 'parsing' | 'ocr' | 'analysis' | 'completion'
  progress: number
  message: string
  estimatedTimeRemaining?: number
}

class UnifiedDocumentProcessor {
  private defaultOptions: UnifiedProcessingOptions = {
    mode: 'standard',
    languages: ['en', 'vi'],
    autoDetectLanguage: true,
    useOCR: true,
    ocrProvider: 'auto',
    chunkSize: 5000,
    chunkOverlap: 200,
    preserveStructure: true,
    enableStructureAnalysis: true,
    enableMetadataExtraction: true,
    enableImageAnalysis: true,
    enableCaching: true,
    enableProgressTracking: true,
    maxConcurrency: 3
  }

  /**
   * Main unified processing method
   */
  async processDocument(
    file: File,
    options: Partial<UnifiedProcessingOptions> = {},
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<UnifiedProcessingResult> {
    const startTime = Date.now()
    const processingOptions = { ...this.defaultOptions, ...options }
    
    try {
      // Stage 1: Upload validation
      this.reportProgress(onProgress, {
        stage: 'uploading',
        progress: 10,
        message: 'Validating file...'
      })

      await this.validateFile(file)

      // Stage 2: Choose processing strategy based on mode
      this.reportProgress(onProgress, {
        stage: 'parsing',
        progress: 20,
        message: 'Analyzing document structure...'
      })

      let result: UnifiedProcessingResult

      switch (processingOptions.mode) {
        case 'fast':
          result = await this.processFast(file, processingOptions, onProgress)
          break
        case 'comprehensive':
          result = await this.processComprehensive(file, processingOptions, onProgress)
          break
        default:
          result = await this.processStandard(file, processingOptions, onProgress)
          break
      }

      // Final processing
      result.processingTime = Date.now() - startTime
      result.processingMode = processingOptions.mode

      this.reportProgress(onProgress, {
        stage: 'completion',
        progress: 100,
        message: 'Processing completed successfully'
      })

      return result

    } catch (error) {
      console.error('[Unified Document Processor] Processing failed:', error)
      throw new Error(`Document processing failed: ${error}`)
    }
  }

  /**
   * Fast processing mode - uses basic DocumentProcessor
   */
  private async processFast(
    file: File,
    options: UnifiedProcessingOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<UnifiedProcessingResult> {
    this.reportProgress(onProgress, {
      stage: 'parsing',
      progress: 40,
      message: 'Fast processing mode...'
    })

    const { DocumentProcessor } = await import('./document-processor')
    const document = await DocumentProcessor.processFile(file)

    return {
      document,
      processingTime: 0, // Will be set in main method
      processingMode: 'fast',
      confidence: 0.8,
      quality: {
        textExtraction: 0.8,
        structurePreservation: 0.6,
        languageDetection: 0.8,
        overall: 0.75
      }
    }
  }

  /**
   * Standard processing mode - combines DocumentProcessor + some enhancements
   */
  private async processStandard(
    file: File,
    options: UnifiedProcessingOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<UnifiedProcessingResult> {
    this.reportProgress(onProgress, {
      stage: 'parsing',
      progress: 30,
      message: 'Standard processing mode...'
    })

    // Use enhanced document processor for better results
    const { EnhancedDocumentProcessor } = await import('./enhanced-document-processor')
    
    const enhancedOptions = {
      preserveFormatting: options.preserveStructure,
      extractImages: options.enableImageAnalysis,
      quality: 'standard' as const,
      chunkSize: options.chunkSize,
      language: options.languages[0] || 'auto'
    }

    this.reportProgress(onProgress, {
      stage: 'analysis',
      progress: 60,
      message: 'Extracting document structure...'
    })

    const enhancedResult = await EnhancedDocumentProcessor.processDocument(file, enhancedOptions)

    // Convert to our unified format
    const document: ProcessedDocument = {
      id: enhancedResult.id,
      fileName: file.name,
      fileType: enhancedResult.fileType,
      originalText: enhancedResult.content.text,
      chunks: this.createChunks(enhancedResult.content.text, options),
      metadata: {
        pageCount: enhancedResult.content.pages?.length,
        wordCount: enhancedResult.content.wordCount,
        characterCount: enhancedResult.content.text.length,
        language: enhancedResult.content.language || 'auto',
        encoding: 'UTF-8'
      },
      createdAt: new Date()
    }

    return {
      document,
      structure: {
        text: enhancedResult.content.text,
        pages: enhancedResult.content.pages?.map(page => ({
          pageNumber: page.number,
          text: page.content,
          paragraphs: page.content.split('\n\n').map(p => ({
            text: p.trim(),
            type: 'paragraph' as const
          }))
        })),
        metadata: {
          wordCount: enhancedResult.content.wordCount,
          pageCount: enhancedResult.content.pages?.length
        }
      },
      images: enhancedResult.content.images?.map((img, index) => ({
        id: `img-${index}`,
        description: img.description,
        text: img.text
      })),
      processingTime: 0,
      processingMode: 'standard',
      confidence: 0.9,
      quality: {
        textExtraction: 0.9,
        structurePreservation: 0.85,
        languageDetection: 0.9,
        overall: 0.88
      }
    }
  }

  /**
   * Comprehensive processing mode - uses all processors + advanced analysis
   */
  private async processComprehensive(
    file: File,
    options: UnifiedProcessingOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<UnifiedProcessingResult> {
    this.reportProgress(onProgress, {
      stage: 'parsing',
      progress: 25,
      message: 'Comprehensive analysis mode...'
    })

    // Use all three processors for maximum accuracy
    const { universalDocumentParser } = await import('./document-parsers')
    const { EnhancedDocumentProcessor } = await import('./enhanced-document-processor')

    this.reportProgress(onProgress, {
      stage: 'analysis',
      progress: 50,
      message: 'Deep structure analysis...'
    })

    // Get detailed structure
    const structure = await universalDocumentParser.parseDocument(file)

    this.reportProgress(onProgress, {
      stage: 'analysis',
      progress: 70,
      message: 'Enhanced content extraction...'
    })

    // Get enhanced processing
    const enhancedResult = await EnhancedDocumentProcessor.processDocument(file, {
      preserveFormatting: true,
      extractImages: true,
      quality: 'high',
      chunkSize: options.chunkSize,
      language: options.languages[0] || 'auto'
    })

    this.reportProgress(onProgress, {
      stage: 'analysis',
      progress: 85,
      message: 'Final quality analysis...'
    })

    // Create unified result
    const document: ProcessedDocument = {
      id: enhancedResult.id,
      fileName: file.name,
      fileType: enhancedResult.fileType,
      originalText: structure.text,
      chunks: this.createChunks(structure.text, options),
      metadata: {
        pageCount: structure.pages?.length || structure.metadata?.pageCount,
        wordCount: structure.metadata?.wordCount || structure.text.split(/\s+/).length,
        characterCount: structure.text.length,
        language: structure.metadata?.language || enhancedResult.content.language || 'auto',
        encoding: 'UTF-8'
      },
      createdAt: new Date()
    }

    return {
      document,
      structure,
      images: enhancedResult.content.images?.map((img, index) => ({
        id: `img-${index}`,
        description: img.description,
        text: img.text,
        confidence: img.confidence
      })),
      tables: structure.tables?.map((table, index) => ({
        id: `table-${index}`,
        headers: table.headers || [],
        rows: table.rows
      })),
      processingTime: 0,
      processingMode: 'comprehensive',
      confidence: 0.95,
      quality: {
        textExtraction: 0.95,
        structurePreservation: 0.95,
        languageDetection: 0.95,
        overall: 0.95
      }
    }
  }

  /**
   * Batch processing for multiple documents
   */
  async processBatch(
    files: File[],
    options: Partial<UnifiedProcessingOptions> = {},
    onProgress?: (fileIndex: number, fileProgress: ProcessingProgress, overallProgress: number) => void
  ): Promise<Array<{ file: File; result?: UnifiedProcessingResult; error?: string }>> {
    const results: Array<{ file: File; result?: UnifiedProcessingResult; error?: string }> = []
    const processingOptions = { ...this.defaultOptions, ...options }
    
    // Limit concurrency
    const maxConcurrency = processingOptions.maxConcurrency
    const batches = this.createBatches(files, maxConcurrency)

    let completedFiles = 0

    for (const batch of batches) {
      const batchPromises = batch.map(async (file, batchIndex) => {
        try {
          const result = await this.processDocument(
            file,
            processingOptions,
            (progress) => {
              if (onProgress) {
                const fileIndex = completedFiles + batchIndex
                const overallProgress = ((fileIndex + progress.progress / 100) / files.length) * 100
                onProgress(fileIndex, progress, overallProgress)
              }
            }
          )
          return { file, result }
        } catch (error) {
          return { 
            file, 
            error: error instanceof Error ? error.message : String(error) 
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      completedFiles += batch.length
    }

    return results
  }

  /**
   * Validate file before processing
   */
  private async validateFile(file: File): Promise<void> {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ]

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
    }

    if (!supportedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
  }

  /**
   * Create document chunks with specified options
   */
  private createChunks(text: string, options: UnifiedProcessingOptions): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const words = text.split(/\s+/)
    const chunkSize = options.chunkSize
    const overlap = options.chunkOverlap

    let currentIndex = 0
    let chunkId = 0

    while (currentIndex < words.length) {
      const chunkWords = words.slice(currentIndex, currentIndex + chunkSize)
      const chunkText = chunkWords.join(' ')

      chunks.push({
        id: `chunk-${chunkId++}`,
        text: chunkText,
        startIndex: currentIndex,
        endIndex: Math.min(currentIndex + chunkSize, words.length),
        wordCount: chunkWords.length
      })

      currentIndex += chunkSize - overlap
    }

    return chunks
  }

  /**
   * Create batches for concurrent processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    onProgress: ((progress: ProcessingProgress) => void) | undefined,
    progress: ProcessingProgress
  ): void {
    if (onProgress) {
      onProgress(progress)
    }
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): string[] {
    return [
      'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt',
      'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'
    ]
  }

  /**
   * Estimate processing time based on file characteristics
   */
  async estimateProcessingTime(file: File, mode: 'fast' | 'standard' | 'comprehensive' = 'standard'): Promise<number> {
    const fileSizeMB = file.size / (1024 * 1024)
    const baseTimePerMB = {
      fast: 2, // 2 seconds per MB
      standard: 5, // 5 seconds per MB
      comprehensive: 10 // 10 seconds per MB
    }

    return Math.ceil(fileSizeMB * baseTimePerMB[mode])
  }
}

// Export singleton instance
export const unifiedDocumentProcessor = new UnifiedDocumentProcessor()

