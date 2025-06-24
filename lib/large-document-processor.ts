/**
 * PRISMY LARGE DOCUMENT PROCESSOR
 * Specialized processor for documents over 100 pages with intelligent chunking
 * Optimized for translation, memory efficiency, and parallel processing
 */

import { DocumentProcessor } from './document-processor'
// Translation service moved to API calls to avoid client-side Google Cloud dependencies

export interface LargeDocumentProcessingOptions {
  // Document processing
  maxChunkSize?: number
  overlapSize?: number
  preserveStructure?: boolean
  
  // Translation options
  enableTranslation?: boolean
  targetLanguage?: string
  translationQuality?: 'free' | 'standard' | 'premium' | 'enterprise'
  
  // Performance options
  parallelChunks?: number
  useBackgroundProcessing?: boolean
  
  // Progress tracking
  onProgress?: (progress: LargeDocumentProgress) => void
}

export interface LargeDocumentProgress {
  stage: 'parsing' | 'chunking' | 'processing' | 'translating' | 'assembling' | 'completed'
  overallProgress: number
  
  // Detailed progress
  chunksTotal: number
  chunksProcessed: number
  currentChunk?: string
  
  // Performance metrics
  processingSpeed: number // chunks per second
  estimatedTimeRemaining: number // seconds
  memoryUsage?: number // MB
  
  // Translation specific
  translationProgress?: {
    chunksTranslated: number
    averageQuality: number
    currentLanguagePair: string
  }
}

export interface LargeDocumentResult {
  // Basic info
  documentId: string
  pageCount: number
  wordCount: number
  processingTime: number
  
  // Content
  originalContent: string
  chunks: DocumentChunk[]
  
  // Translation results
  translation?: {
    translatedContent: string
    translatedChunks: TranslationChunk[]
    targetLanguage: string
    averageQuality: number
    translationTime: number
  }
  
  // Performance metrics
  performanceMetrics: {
    chunksPerSecond: number
    memoryPeakUsage: number
    parallelEfficiency: number
  }
}

export interface DocumentChunk {
  id: string
  content: string
  pageRange: { start: number; end: number }
  wordCount: number
  type: 'paragraph' | 'section' | 'table' | 'header' | 'footer'
  semanticBoundary: boolean
  dependencies?: string[] // IDs of related chunks
}

export interface TranslationChunk {
  chunkId: string
  originalText: string
  translatedText: string
  confidence: number
  qualityScore: number
  fromCache: boolean
  processingTime: number
}

export class LargeDocumentProcessor {
  private static readonly DEFAULT_CHUNK_SIZE = 2000 // characters
  private static readonly DEFAULT_OVERLAP = 200 // characters
  private static readonly MAX_PARALLEL_CHUNKS = 5
  private static readonly MEMORY_THRESHOLD = 500 // MB

  async processLargeDocument(
    file: File,
    options: LargeDocumentProcessingOptions = {}
  ): Promise<LargeDocumentResult> {
    const startTime = Date.now()
    const documentId = this.generateDocumentId()
    
    // Set defaults
    const config = {
      maxChunkSize: options.maxChunkSize || LargeDocumentProcessor.DEFAULT_CHUNK_SIZE,
      overlapSize: options.overlapSize || LargeDocumentProcessor.DEFAULT_OVERLAP,
      parallelChunks: options.parallelChunks || LargeDocumentProcessor.MAX_PARALLEL_CHUNKS,
      preserveStructure: options.preserveStructure ?? true,
      ...options
    }

    try {
      // Stage 1: Parse document
      this.updateProgress(options.onProgress, {
        stage: 'parsing',
        overallProgress: 10,
        chunksTotal: 0,
        chunksProcessed: 0,
        processingSpeed: 0,
        estimatedTimeRemaining: 0
      })

      const documentData = await DocumentProcessor.processFile(file)
      
      // Stage 2: Intelligent chunking for large documents
      this.updateProgress(options.onProgress, {
        stage: 'chunking',
        overallProgress: 20,
        chunksTotal: 0,
        chunksProcessed: 0,
        processingSpeed: 0,
        estimatedTimeRemaining: 0
      })

      const chunks = await this.createIntelligentChunks(
        documentData.originalText,
        config.maxChunkSize,
        config.overlapSize,
        config.preserveStructure
      )

      // Stage 3: Process chunks in parallel
      this.updateProgress(options.onProgress, {
        stage: 'processing',
        overallProgress: 30,
        chunksTotal: chunks.length,
        chunksProcessed: 0,
        processingSpeed: 0,
        estimatedTimeRemaining: this.estimateProcessingTime(chunks.length)
      })

      const processedChunks = await this.processChunksInParallel(
        chunks,
        config.parallelChunks,
        options.onProgress
      )

      // Stage 4: Translation if enabled
      let translationResult: LargeDocumentResult['translation'] | undefined
      if (config.enableTranslation && config.targetLanguage) {
        this.updateProgress(options.onProgress, {
          stage: 'translating',
          overallProgress: 60,
          chunksTotal: chunks.length,
          chunksProcessed: 0,
          processingSpeed: 0,
          estimatedTimeRemaining: this.estimateTranslationTime(chunks.length)
        })

        translationResult = await this.translateChunksInParallel(
          processedChunks,
          documentData.metadata.language || 'auto',
          config.targetLanguage,
          config.translationQuality || 'standard',
          config.parallelChunks,
          options.onProgress
        )
      }

      // Stage 5: Assemble final result
      this.updateProgress(options.onProgress, {
        stage: 'assembling',
        overallProgress: 90,
        chunksTotal: chunks.length,
        chunksProcessed: chunks.length,
        processingSpeed: 0,
        estimatedTimeRemaining: 0
      })

      const originalContent = this.assembleContent(processedChunks)
      const processingTime = Date.now() - startTime

      const result: LargeDocumentResult = {
        documentId,
        pageCount: documentData.metadata.pageCount || 0,
        wordCount: documentData.metadata.wordCount,
        processingTime,
        originalContent,
        chunks: processedChunks,
        translation: translationResult,
        performanceMetrics: {
          chunksPerSecond: chunks.length / (processingTime / 1000),
          memoryPeakUsage: this.getMemoryUsage(),
          parallelEfficiency: this.calculateParallelEfficiency(chunks.length, config.parallelChunks, processingTime)
        }
      }

      // Final progress
      this.updateProgress(options.onProgress, {
        stage: 'completed',
        overallProgress: 100,
        chunksTotal: chunks.length,
        chunksProcessed: chunks.length,
        processingSpeed: result.performanceMetrics.chunksPerSecond,
        estimatedTimeRemaining: 0
      })

      return result

    } catch (error) {
      console.error('Large document processing failed:', error)
      throw new Error(`Large document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create intelligent chunks that respect semantic boundaries
   */
  private async createIntelligentChunks(
    text: string,
    maxChunkSize: number,
    overlapSize: number,
    preserveStructure: boolean
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = []
    
    if (preserveStructure) {
      // Split by semantic boundaries (paragraphs, sections, etc.)
      const semanticSections = this.identifySemanticSections(text)
      
      let chunkIndex = 0
      for (const section of semanticSections) {
        if (section.content.length <= maxChunkSize) {
          // Small section, keep as single chunk
          chunks.push({
            id: `chunk_${chunkIndex++}`,
            content: section.content,
            pageRange: section.pageRange,
            wordCount: section.content.split(/\s+/).length,
            type: section.type,
            semanticBoundary: true
          })
        } else {
          // Large section, split with overlap while preserving structure
          const subChunks = this.splitLargeSectionWithOverlap(
            section,
            maxChunkSize,
            overlapSize,
            chunkIndex
          )
          chunks.push(...subChunks)
          chunkIndex += subChunks.length
        }
      }
    } else {
      // Simple character-based chunking with overlap
      chunks.push(...this.createSimpleChunks(text, maxChunkSize, overlapSize))
    }

    return chunks
  }

  /**
   * Identify semantic sections in document
   */
  private identifySemanticSections(text: string): Array<{
    content: string
    type: DocumentChunk['type']
    pageRange: { start: number; end: number }
  }> {
    const sections: Array<{
      content: string
      type: DocumentChunk['type']
      pageRange: { start: number; end: number }
    }> = []
    
    // Split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    
    paragraphs.forEach((paragraph, index) => {
      let type: DocumentChunk['type'] = 'paragraph'
      
      // Detect headers (simple heuristic)
      if (paragraph.length < 100 && /^[A-Z\s]+$/.test(paragraph.trim())) {
        type = 'header'
      } else if (paragraph.includes('|') && paragraph.split('\n').length > 2) {
        type = 'table'
      } else if (paragraph.match(/^(Chapter|Section|\d+\.)/i)) {
        type = 'section'
      }
      
      sections.push({
        content: paragraph.trim(),
        type,
        pageRange: { start: Math.floor(index / 2), end: Math.floor(index / 2) + 1 }
      })
    })
    
    return sections
  }

  /**
   * Split large sections with overlap while preserving structure
   */
  private splitLargeSectionWithOverlap(
    section: { content: string; type: DocumentChunk['type']; pageRange: { start: number; end: number } },
    maxChunkSize: number,
    overlapSize: number,
    startIndex: number
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const sentences = section.content.match(/[^\.!?]+[\.!?]+/g) || [section.content]
    
    let currentChunk = ''
    let chunkIndex = startIndex
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim()
      
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + sentence
      } else {
        if (currentChunk) {
          chunks.push({
            id: `chunk_${chunkIndex++}`,
            content: currentChunk,
            pageRange: section.pageRange,
            wordCount: currentChunk.split(/\s+/).length,
            type: section.type,
            semanticBoundary: i === sentences.length - 1
          })
        }
        
        // Start new chunk with overlap
        const overlap = this.getOverlapText(currentChunk, overlapSize)
        currentChunk = overlap + (overlap ? ' ' : '') + sentence
      }
    }
    
    // Add final chunk
    if (currentChunk) {
      chunks.push({
        id: `chunk_${chunkIndex}`,
        content: currentChunk,
        pageRange: section.pageRange,
        wordCount: currentChunk.split(/\s+/).length,
        type: section.type,
        semanticBoundary: true
      })
    }
    
    return chunks
  }

  /**
   * Create simple character-based chunks
   */
  private createSimpleChunks(
    text: string,
    maxChunkSize: number,
    overlapSize: number
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let currentIndex = 0
    let chunkIndex = 0
    
    while (currentIndex < text.length) {
      const endIndex = Math.min(currentIndex + maxChunkSize, text.length)
      const chunkText = text.substring(currentIndex, endIndex)
      
      chunks.push({
        id: `chunk_${chunkIndex++}`,
        content: chunkText,
        pageRange: { 
          start: Math.floor(currentIndex / 2000), 
          end: Math.floor(endIndex / 2000) + 1 
        },
        wordCount: chunkText.split(/\s+/).length,
        type: 'paragraph',
        semanticBoundary: endIndex === text.length
      })
      
      currentIndex = endIndex - overlapSize
    }
    
    return chunks
  }

  /**
   * Process chunks in parallel with memory management
   */
  private async processChunksInParallel(
    chunks: DocumentChunk[],
    parallelLimit: number,
    onProgress?: (progress: LargeDocumentProgress) => void
  ): Promise<DocumentChunk[]> {
    const processedChunks: DocumentChunk[] = []
    const startTime = Date.now()
    
    // Process in batches to manage memory
    for (let i = 0; i < chunks.length; i += parallelLimit) {
      const batch = chunks.slice(i, i + parallelLimit)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (chunk) => {
        // Simulate processing time (in real implementation, add NLP analysis)
        await new Promise(resolve => setTimeout(resolve, 100))
        return chunk
      })
      
      const processedBatch = await Promise.all(batchPromises)
      processedChunks.push(...processedBatch)
      
      // Update progress
      const elapsed = Date.now() - startTime
      const processed = i + batch.length
      const speed = processed / (elapsed / 1000)
      const remaining = (chunks.length - processed) / speed
      
      this.updateProgress(onProgress, {
        stage: 'processing',
        overallProgress: 30 + (processed / chunks.length) * 30,
        chunksTotal: chunks.length,
        chunksProcessed: processed,
        processingSpeed: speed,
        estimatedTimeRemaining: remaining,
        currentChunk: batch[0]?.content.substring(0, 100)
      })
      
      // Memory check
      if (this.getMemoryUsage() > LargeDocumentProcessor.MEMORY_THRESHOLD) {
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }
    }
    
    return processedChunks
  }

  /**
   * Translate chunks in parallel with quality optimization
   */
  private async translateChunksInParallel(
    chunks: DocumentChunk[],
    sourceLang: string,
    targetLang: string,
    quality: 'free' | 'standard' | 'premium' | 'enterprise',
    parallelLimit: number,
    onProgress?: (progress: LargeDocumentProgress) => void
  ): Promise<LargeDocumentResult['translation']> {
    const translationChunks: TranslationChunk[] = []
    const startTime = Date.now()
    let totalQuality = 0
    
    // Process in smaller batches for translation to respect API limits
    const translationBatchSize = Math.min(parallelLimit, 3)
    
    for (let i = 0; i < chunks.length; i += translationBatchSize) {
      const batch = chunks.slice(i, i + translationBatchSize)
      
      // Translate batch with delay between requests
      const batchPromises = batch.map(async (chunk, index) => {
        // Stagger requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 200))
        
        // Translate via API
        const response = await fetch('/api/translate/public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: chunk.content,
            sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
            targetLang: targetLang,
            qualityTier: quality
          })
        })

        if (!response.ok) {
          throw new Error(`Translation API error: ${response.status} ${response.statusText}`)
        }

        const translation = await response.json()
        
        return {
          chunkId: chunk.id,
          originalText: chunk.content,
          translatedText: translation.translatedText,
          confidence: translation.confidence,
          qualityScore: translation.qualityScore,
          fromCache: translation.cached || false,
          processingTime: Date.now() - startTime
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      translationChunks.push(...batchResults)
      
      // Update quality tracking
      batchResults.forEach(result => {
        totalQuality += result.qualityScore
      })
      
      // Update progress
      const processed = i + batch.length
      const elapsed = Date.now() - startTime
      const speed = processed / (elapsed / 1000)
      const remaining = (chunks.length - processed) / speed
      const avgQuality = totalQuality / processed
      
      this.updateProgress(onProgress, {
        stage: 'translating',
        overallProgress: 60 + (processed / chunks.length) * 30,
        chunksTotal: chunks.length,
        chunksProcessed: processed,
        processingSpeed: speed,
        estimatedTimeRemaining: remaining,
        currentChunk: batch[0]?.content.substring(0, 100),
        translationProgress: {
          chunksTranslated: processed,
          averageQuality: avgQuality,
          currentLanguagePair: `${sourceLang} → ${targetLang}`
        }
      })
    }
    
    // Assemble translated content
    const translatedContent = translationChunks
      .map(chunk => chunk.translatedText)
      .join('\n\n')
    
    return {
      translatedContent,
      translatedChunks: translationChunks,
      targetLanguage: targetLang,
      averageQuality: totalQuality / translationChunks.length,
      translationTime: Date.now() - startTime
    }
  }

  // Helper methods
  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text
    
    const overlap = text.substring(text.length - overlapSize)
    // Try to break at word boundary
    const lastSpace = overlap.lastIndexOf(' ')
    return lastSpace > 0 ? overlap.substring(lastSpace + 1) : overlap
  }

  private assembleContent(chunks: DocumentChunk[]): string {
    return chunks.map(chunk => chunk.content).join('\n\n')
  }

  private estimateProcessingTime(chunkCount: number): number {
    return Math.round(chunkCount * 0.1) // 100ms per chunk estimate
  }

  private estimateTranslationTime(chunkCount: number): number {
    return Math.round(chunkCount * 1.5) // 1.5s per chunk for translation
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    }
    return 0
  }

  private calculateParallelEfficiency(
    chunkCount: number,
    parallelLimit: number,
    processingTime: number
  ): number {
    const idealTime = chunkCount * 100 // 100ms per chunk sequentially
    const actualTime = processingTime
    const theoreticalParallelTime = idealTime / parallelLimit
    
    return Math.round((theoreticalParallelTime / actualTime) * 100)
  }

  private generateDocumentId(): string {
    return `large_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private updateProgress(
    onProgress: ((progress: LargeDocumentProgress) => void) | undefined,
    progress: LargeDocumentProgress
  ): void {
    if (onProgress) {
      onProgress(progress)
    }
  }
}

// Export singleton instance
export const largeDocumentProcessor = new LargeDocumentProcessor()