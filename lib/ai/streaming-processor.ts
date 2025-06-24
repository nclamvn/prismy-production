/**
 * STREAMING DOCUMENT PROCESSOR
 * Handles large files efficiently with chunked processing and real-time progress updates
 */

import { logger } from '@/lib/logger'
import { documentIntelligenceOrchestrator, DocumentAnalysisRequest, DocumentAnalysisResult } from './document-intelligence-orchestrator'
import { Readable } from 'stream'

export interface StreamingProcessorOptions {
  chunkSize?: number
  maxConcurrentChunks?: number
  userTier?: 'free' | 'standard' | 'premium' | 'enterprise'
  progressCallback?: (progress: StreamingProgress) => void
  cancellationToken?: AbortController
}

export interface StreamingProgress {
  totalChunks: number
  processedChunks: number
  currentChunk: number
  percentage: number
  estimatedTimeRemaining: number
  processingRate: number
  status: 'initializing' | 'processing' | 'completed' | 'cancelled' | 'error'
  error?: string
}

export interface ChunkResult {
  chunkId: string
  startOffset: number
  endOffset: number
  content: string
  analysis: Partial<DocumentAnalysisResult>
  processingTime: number
}

export interface StreamingResult {
  success: boolean
  processedChunks: ChunkResult[]
  aggregatedResult: DocumentAnalysisResult
  totalProcessingTime: number
  memoryUsage: {
    peak: number
    final: number
  }
  performance: {
    chunksPerSecond: number
    bytesPerSecond: number
    concurrencyUtilization: number
  }
  error?: string
}

class StreamingProcessor {
  private readonly defaultChunkSize = 50000 // 50KB chunks
  private readonly maxConcurrentChunks = {
    free: 2,
    standard: 4,
    premium: 8,
    enterprise: 16
  }

  constructor() {
    logger.info('Streaming Processor initialized')
  }

  async processLargeDocument(
    content: string | Buffer,
    analysisRequest: DocumentAnalysisRequest,
    options: StreamingProcessorOptions = {}
  ): Promise<StreamingResult> {
    const startTime = Date.now()
    const initialMemory = process.memoryUsage().heapUsed

    try {
      // Configure processing parameters
      const chunkSize = options.chunkSize || this.defaultChunkSize
      const userTier = options.userTier || 'free'
      const maxConcurrent = options.maxConcurrentChunks || this.maxConcurrentChunks[userTier]

      // Convert content to string if needed
      const textContent = typeof content === 'string' ? content : content.toString('utf8')
      
      if (textContent.length <= chunkSize) {
        // Small document - process directly
        return this.processSingleDocument(textContent, analysisRequest, startTime, initialMemory)
      }

      logger.info('Starting streaming processing for large document', {
        contentLength: textContent.length,
        chunkSize,
        maxConcurrent,
        userTier
      })

      // Create chunks with overlap for context preservation
      const chunks = this.createOverlappingChunks(textContent, chunkSize)
      
      // Initialize progress tracking
      const progress: StreamingProgress = {
        totalChunks: chunks.length,
        processedChunks: 0,
        currentChunk: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        processingRate: 0,
        status: 'initializing'
      }

      // Report initial progress
      if (options.progressCallback) {
        options.progressCallback(progress)
      }

      // Process chunks in parallel with concurrency control
      const chunkResults = await this.processChunksWithConcurrency(
        chunks,
        analysisRequest,
        maxConcurrent,
        options,
        progress
      )

      // Check for cancellation
      if (options.cancellationToken?.signal.aborted) {
        progress.status = 'cancelled'
        if (options.progressCallback) {
          options.progressCallback(progress)
        }
        return {
          success: false,
          processedChunks: chunkResults,
          aggregatedResult: this.createEmptyResult(),
          totalProcessingTime: Date.now() - startTime,
          memoryUsage: this.getMemoryUsage(initialMemory),
          performance: this.calculatePerformanceMetrics(chunkResults, Date.now() - startTime),
          error: 'Processing cancelled by user'
        }
      }

      // Aggregate results from all chunks
      const aggregatedResult = await this.aggregateChunkResults(
        chunkResults,
        textContent,
        analysisRequest
      )

      progress.status = 'completed'
      progress.percentage = 100
      if (options.progressCallback) {
        options.progressCallback(progress)
      }

      const totalProcessingTime = Date.now() - startTime

      logger.info('Streaming processing completed successfully', {
        chunksProcessed: chunkResults.length,
        totalTime: totalProcessingTime,
        contentLength: textContent.length
      })

      return {
        success: true,
        processedChunks: chunkResults,
        aggregatedResult,
        totalProcessingTime,
        memoryUsage: this.getMemoryUsage(initialMemory),
        performance: this.calculatePerformanceMetrics(chunkResults, totalProcessingTime)
      }

    } catch (error) {
      logger.error('Streaming processing failed:', error)
      
      return {
        success: false,
        processedChunks: [],
        aggregatedResult: this.createEmptyResult(),
        totalProcessingTime: Date.now() - startTime,
        memoryUsage: this.getMemoryUsage(initialMemory),
        performance: { chunksPerSecond: 0, bytesPerSecond: 0, concurrencyUtilization: 0 },
        error: error instanceof Error ? error.message : 'Streaming processing failed'
      }
    }
  }

  private async processSingleDocument(
    content: string,
    analysisRequest: DocumentAnalysisRequest,
    startTime: number,
    initialMemory: number
  ): Promise<StreamingResult> {
    const result = await documentIntelligenceOrchestrator.analyzeDocument({
      ...analysisRequest,
      content
    })

    const chunkResult: ChunkResult = {
      chunkId: 'single_chunk',
      startOffset: 0,
      endOffset: content.length,
      content,
      analysis: result,
      processingTime: Date.now() - startTime
    }

    return {
      success: result.success,
      processedChunks: [chunkResult],
      aggregatedResult: result,
      totalProcessingTime: Date.now() - startTime,
      memoryUsage: this.getMemoryUsage(initialMemory),
      performance: {
        chunksPerSecond: 1000 / (Date.now() - startTime),
        bytesPerSecond: content.length / ((Date.now() - startTime) / 1000),
        concurrencyUtilization: 1.0
      }
    }
  }

  private createOverlappingChunks(content: string, chunkSize: number): Array<{
    id: string
    content: string
    startOffset: number
    endOffset: number
  }> {
    const chunks = []
    const overlapSize = Math.floor(chunkSize * 0.1) // 10% overlap
    let offset = 0

    while (offset < content.length) {
      const endOffset = Math.min(offset + chunkSize, content.length)
      const chunkContent = content.slice(offset, endOffset)
      
      chunks.push({
        id: `chunk_${chunks.length + 1}`,
        content: chunkContent,
        startOffset: offset,
        endOffset
      })

      // Move to next chunk with overlap
      offset = endOffset - overlapSize
      if (offset >= content.length - overlapSize) {
        break
      }
    }

    return chunks
  }

  private async processChunksWithConcurrency(
    chunks: Array<{ id: string; content: string; startOffset: number; endOffset: number }>,
    analysisRequest: DocumentAnalysisRequest,
    maxConcurrent: number,
    options: StreamingProcessorOptions,
    progress: StreamingProgress
  ): Promise<ChunkResult[]> {
    const results: ChunkResult[] = []
    const processing: Promise<ChunkResult>[] = []
    let chunkIndex = 0
    const startTime = Date.now()

    progress.status = 'processing'

    while (chunkIndex < chunks.length || processing.length > 0) {
      // Check for cancellation
      if (options.cancellationToken?.signal.aborted) {
        // Cancel all pending operations
        break
      }

      // Start new chunks if we have capacity and chunks remaining
      while (processing.length < maxConcurrent && chunkIndex < chunks.length) {
        const chunk = chunks[chunkIndex]
        const chunkProcessingPromise = this.processChunk(chunk, analysisRequest)
        processing.push(chunkProcessingPromise)
        chunkIndex++
      }

      // Wait for at least one chunk to complete
      if (processing.length > 0) {
        const completedResult = await Promise.race(processing)
        results.push(completedResult)
        
        // Remove the completed promise from processing array
        const completedIndex = processing.findIndex(p => p === Promise.resolve(completedResult))
        if (completedIndex >= 0) {
          processing.splice(completedIndex, 1)
        }

        // Update progress
        progress.processedChunks = results.length
        progress.currentChunk = chunkIndex
        progress.percentage = Math.round((results.length / chunks.length) * 100)
        
        // Calculate processing rate and estimate remaining time
        const elapsedTime = Date.now() - startTime
        progress.processingRate = results.length / (elapsedTime / 1000)
        const remainingChunks = chunks.length - results.length
        progress.estimatedTimeRemaining = remainingChunks / Math.max(progress.processingRate, 0.1)

        // Report progress
        if (options.progressCallback) {
          options.progressCallback(progress)
        }
      }
    }

    // Wait for any remaining chunks to complete
    const remainingResults = await Promise.all(processing)
    results.push(...remainingResults)

    return results
  }

  private async processChunk(
    chunk: { id: string; content: string; startOffset: number; endOffset: number },
    analysisRequest: DocumentAnalysisRequest
  ): Promise<ChunkResult> {
    const chunkStartTime = Date.now()

    try {
      const analysis = await documentIntelligenceOrchestrator.analyzeDocument({
        ...analysisRequest,
        content: chunk.content,
        // Use quick analysis for chunks to optimize performance
        analysisDepth: analysisRequest.analysisDepth === 'comprehensive' ? 'standard' : 'quick'
      })

      return {
        chunkId: chunk.id,
        startOffset: chunk.startOffset,
        endOffset: chunk.endOffset,
        content: chunk.content,
        analysis,
        processingTime: Date.now() - chunkStartTime
      }
    } catch (error) {
      logger.warn(`Chunk ${chunk.id} processing failed:`, error)
      
      return {
        chunkId: chunk.id,
        startOffset: chunk.startOffset,
        endOffset: chunk.endOffset,
        content: chunk.content,
        analysis: {
          success: false,
          analysisId: `failed_${chunk.id}`,
          error: error instanceof Error ? error.message : 'Chunk processing failed',
          performance: {
            processingTime: Date.now() - chunkStartTime,
            provider: 'unknown',
            cacheHit: false,
            tokensUsed: 0,
            cost: 0
          }
        },
        processingTime: Date.now() - chunkStartTime
      }
    }
  }

  private async aggregateChunkResults(
    chunkResults: ChunkResult[],
    originalContent: string,
    analysisRequest: DocumentAnalysisRequest
  ): Promise<DocumentAnalysisResult> {
    const startTime = Date.now()
    const aggregationId = `aggregated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Collect all successful analyses
      const successfulResults = chunkResults
        .map(chunk => chunk.analysis)
        .filter(analysis => analysis.success)

      if (successfulResults.length === 0) {
        throw new Error('No successful chunk analyses to aggregate')
      }

      // Aggregate document info (use info from largest successful chunk)
      const largestChunk = chunkResults
        .filter(chunk => chunk.analysis.success)
        .sort((a, b) => b.content.length - a.content.length)[0]

      const documentInfo = largestChunk?.analysis.documentInfo || {
        type: 'document',
        language: 'unknown',
        confidence: 0.5,
        wordCount: originalContent.split(/\s+/).length,
        complexity: 'medium' as const,
        readabilityScore: 50
      }

      // Aggregate summaries
      const summaries = successfulResults
        .map(result => result.summary)
        .filter(Boolean)
      const aggregatedSummary = summaries.length > 0 
        ? summaries.join(' ') 
        : undefined

      // Aggregate key terms
      const allKeyTerms = successfulResults
        .flatMap(result => result.keyTerms || [])
      const keyTermsMap = new Map<string, { importance: number; category: string; count: number }>()
      
      allKeyTerms.forEach(term => {
        const existing = keyTermsMap.get(term.term)
        if (existing) {
          existing.importance = Math.max(existing.importance, term.importance)
          existing.count++
        } else {
          keyTermsMap.set(term.term, {
            importance: term.importance,
            category: term.category,
            count: 1
          })
        }
      })

      const aggregatedKeyTerms = Array.from(keyTermsMap.entries())
        .map(([term, data]) => ({
          term,
          importance: data.importance * (1 + Math.log(data.count)), // Boost frequently mentioned terms
          category: data.category
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 20)

      // Aggregate topics
      const allTopics = successfulResults
        .flatMap(result => result.topics || [])
      const topicsMap = new Map<string, { confidence: number; keywords: Set<string>; count: number }>()
      
      allTopics.forEach(topic => {
        const existing = topicsMap.get(topic.topic)
        if (existing) {
          existing.confidence = Math.max(existing.confidence, topic.confidence)
          topic.keywords.forEach(keyword => existing.keywords.add(keyword))
          existing.count++
        } else {
          topicsMap.set(topic.topic, {
            confidence: topic.confidence,
            keywords: new Set(topic.keywords),
            count: 1
          })
        }
      })

      const aggregatedTopics = Array.from(topicsMap.entries())
        .map(([topic, data]) => ({
          topic,
          confidence: data.confidence * (1 + Math.log(data.count)), // Boost frequently mentioned topics
          keywords: Array.from(data.keywords)
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)

      // Aggregate entities
      const allEntities = successfulResults
        .flatMap(result => result.entities || [])
      const uniqueEntities = this.deduplicateEntities(allEntities)

      // Calculate performance metrics
      const totalProcessingTime = chunkResults.reduce((sum, chunk) => sum + chunk.processingTime, 0)
      const totalTokens = successfulResults.reduce((sum, result) => sum + (result.performance?.tokensUsed || 0), 0)
      const totalCost = successfulResults.reduce((sum, result) => sum + (result.performance?.cost || 0), 0)

      return {
        success: true,
        analysisId: aggregationId,
        documentInfo,
        summary: aggregatedSummary,
        keyTerms: aggregatedKeyTerms,
        topics: aggregatedTopics,
        entities: uniqueEntities,
        performance: {
          processingTime: Date.now() - startTime,
          provider: 'streaming_aggregation',
          cacheHit: false,
          tokensUsed: totalTokens,
          cost: totalCost
        }
      }

    } catch (error) {
      logger.error('Failed to aggregate chunk results:', error)
      
      return {
        success: false,
        analysisId: aggregationId,
        error: error instanceof Error ? error.message : 'Aggregation failed',
        performance: {
          processingTime: Date.now() - startTime,
          provider: 'streaming_aggregation',
          cacheHit: false,
          tokensUsed: 0,
          cost: 0
        }
      }
    }
  }

  private deduplicateEntities(entities: any[]): any[] {
    const entityMap = new Map<string, any>()
    
    entities.forEach(entity => {
      const key = `${entity.text.toLowerCase()}_${entity.label}`
      const existing = entityMap.get(key)
      
      if (!existing || entity.confidence > existing.confidence) {
        entityMap.set(key, entity)
      }
    })
    
    return Array.from(entityMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 50) // Limit to top 50 entities
  }

  private getMemoryUsage(initialMemory: number) {
    const currentMemory = process.memoryUsage().heapUsed
    return {
      peak: currentMemory,
      final: currentMemory - initialMemory
    }
  }

  private calculatePerformanceMetrics(chunkResults: ChunkResult[], totalTime: number) {
    const totalBytes = chunkResults.reduce((sum, chunk) => sum + chunk.content.length, 0)
    const timeInSeconds = totalTime / 1000
    
    return {
      chunksPerSecond: chunkResults.length / timeInSeconds,
      bytesPerSecond: totalBytes / timeInSeconds,
      concurrencyUtilization: chunkResults.length > 0 ? 1.0 : 0
    }
  }

  private createEmptyResult(): DocumentAnalysisResult {
    return {
      success: false,
      analysisId: 'empty_result',
      error: 'No analysis performed',
      performance: {
        processingTime: 0,
        provider: 'none',
        cacheHit: false,
        tokensUsed: 0,
        cost: 0
      }
    }
  }

  // Cancel long-running operations
  async cancelProcessing(processId: string): Promise<boolean> {
    // Implementation would track active processes and cancel them
    logger.info(`Cancelling streaming process: ${processId}`)
    return true
  }

  // Get processing statistics
  getProcessingStats() {
    return {
      activeProcesses: 0, // Would track active processes
      totalProcessed: 0, // Would track total documents processed
      averageChunkSize: this.defaultChunkSize,
      supportedConcurrency: this.maxConcurrentChunks
    }
  }
}

// Export singleton instance
export const streamingProcessor = new StreamingProcessor()

// Export types
export type {
  StreamingProcessorOptions,
  StreamingProgress,
  ChunkResult,
  StreamingResult
}