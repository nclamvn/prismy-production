/**
 * Enhanced Translation Service with Intelligent Chunking
 * Handles large texts up to 500k characters with progress tracking
 */

import { translationService } from './translation-service'
import {
  intelligentChunker,
  TextChunk,
  ChunkedTranslationProgress,
  ChunkingOptions,
} from './intelligent-chunking'

interface ChunkedTranslationRequest {
  text: string
  sourceLang: string
  targetLang: string
  qualityTier?: 'free' | 'standard' | 'premium' | 'enterprise'
  onProgress?: (progress: ChunkedTranslationProgress) => void
  chunkingOptions?: Partial<ChunkingOptions>
}

interface ChunkedTranslationResponse {
  translatedText: string
  sourceLang: string
  targetLang: string
  confidence: number
  qualityScore: number
  timestamp: string
  chunks: {
    total: number
    processed: number
    averageConfidence: number
  }
  processingTime: number
  cached?: boolean
}

interface ChunkTranslationResult {
  translatedText: string
  confidence: number
  qualityScore: number
  chunkIndex: number
  error?: string
}

export class ChunkedTranslationService {
  private readonly CHUNK_PROCESSING_DELAY = 100 // ms between chunks to prevent rate limiting
  private readonly MAX_CONCURRENT_CHUNKS = 3 // Parallel processing limit

  /**
   * Translate large text using intelligent chunking
   */
  async translateLargeText({
    text,
    sourceLang,
    targetLang,
    qualityTier = 'standard',
    onProgress,
    chunkingOptions = {},
  }: ChunkedTranslationRequest): Promise<ChunkedTranslationResponse> {
    const startTime = Date.now()

    console.log('🚀 Starting chunked translation', {
      textLength: text.length,
      sourceLang,
      targetLang,
      qualityTier,
      requiresChunking: text.length > 4000,
    })

    // For small texts, use direct translation
    if (text.length <= 4000) {
      return this.translateDirectly(
        text,
        sourceLang,
        targetLang,
        qualityTier,
        startTime
      )
    }

    // Chunk the text intelligently
    const chunks = intelligentChunker.chunkText(text, {
      ...chunkingOptions,
      targetLanguage: targetLang,
    })

    // Initialize progress tracking
    const errors: string[] = []
    const completedChunks = 0

    // Report initial progress
    if (onProgress) {
      onProgress(
        intelligentChunker.generateProgressUpdate(
          chunks.length,
          0,
          0,
          startTime,
          errors
        )
      )
    }

    // Process chunks with error handling and retries
    const translatedChunks = await this.processChunksWithProgress(
      chunks,
      sourceLang,
      targetLang,
      qualityTier,
      progress => {
        if (onProgress) {
          onProgress(progress)
        }
      },
      errors
    )

    // Reassemble the translated text
    const finalTranslatedText = intelligentChunker.reassembleChunks(
      translatedChunks.map((result, index) => ({
        text: result.translatedText,
        metadata: chunks[index].metadata,
      }))
    )

    // Calculate final metrics
    const processingTime = Date.now() - startTime
    const averageConfidence = this.calculateAverageConfidence(translatedChunks)
    const averageQualityScore =
      this.calculateAverageQualityScore(translatedChunks)

    console.log('✅ Chunked translation completed', {
      totalChunks: chunks.length,
      processingTime,
      averageConfidence,
      averageQualityScore,
      finalLength: finalTranslatedText.length,
      errors: errors.length,
    })

    return {
      translatedText: finalTranslatedText,
      sourceLang,
      targetLang,
      confidence: averageConfidence,
      qualityScore: averageQualityScore,
      timestamp: new Date().toISOString(),
      chunks: {
        total: chunks.length,
        processed: translatedChunks.length,
        averageConfidence,
      },
      processingTime,
      cached: false,
    }
  }

  /**
   * Process chunks with progress tracking and error handling
   */
  private async processChunksWithProgress(
    chunks: TextChunk[],
    sourceLang: string,
    targetLang: string,
    qualityTier: string,
    onProgress: (progress: ChunkedTranslationProgress) => void,
    errors: string[]
  ): Promise<ChunkTranslationResult[]> {
    const results: ChunkTranslationResult[] = []
    const startTime = Date.now()

    // Process chunks in batches to avoid overwhelming the API
    for (let i = 0; i < chunks.length; i += this.MAX_CONCURRENT_CHUNKS) {
      const batch = chunks.slice(i, i + this.MAX_CONCURRENT_CHUNKS)

      // Process batch in parallel
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        const chunkIndex = i + batchIndex

        try {
          // Add small delay to prevent rate limiting
          if (chunkIndex > 0) {
            await this.delay(this.CHUNK_PROCESSING_DELAY)
          }

          console.log(
            `🔄 Processing chunk ${chunkIndex + 1}/${chunks.length}`,
            {
              chunkLength: chunk.text.length,
              chunkType: chunk.metadata.type,
            }
          )

          const result = await translationService.translateText({
            text: chunk.text,
            sourceLang,
            targetLang,
            qualityTier: qualityTier as any,
          })

          return {
            translatedText: result.translatedText,
            confidence: result.confidence,
            qualityScore: result.qualityScore,
            chunkIndex,
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          console.error(
            `❌ Error processing chunk ${chunkIndex + 1}:`,
            errorMessage
          )

          errors.push(`Chunk ${chunkIndex + 1}: ${errorMessage}`)

          // Return original text as fallback
          return {
            translatedText: chunk.text,
            confidence: 0,
            qualityScore: 0,
            chunkIndex,
            error: errorMessage,
          }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Update progress
      onProgress(
        intelligentChunker.generateProgressUpdate(
          chunks.length,
          results.length,
          i + batch.length,
          startTime,
          errors
        )
      )
    }

    return results
  }

  /**
   * Handle direct translation for small texts
   */
  private async translateDirectly(
    text: string,
    sourceLang: string,
    targetLang: string,
    qualityTier: string,
    startTime: number
  ): Promise<ChunkedTranslationResponse> {
    console.log('📝 Using direct translation (text < 4k chars)')

    const result = await translationService.translateText({
      text,
      sourceLang,
      targetLang,
      qualityTier: qualityTier as any,
    })

    return {
      ...result,
      chunks: {
        total: 1,
        processed: 1,
        averageConfidence: result.confidence,
      },
      processingTime: Date.now() - startTime,
    }
  }

  /**
   * Calculate average confidence across all chunks
   */
  private calculateAverageConfidence(
    results: ChunkTranslationResult[]
  ): number {
    const validResults = results.filter(r => !r.error)
    if (validResults.length === 0) return 0

    const sum = validResults.reduce(
      (total, result) => total + result.confidence,
      0
    )
    return Math.round((sum / validResults.length) * 100) / 100
  }

  /**
   * Calculate average quality score across all chunks
   */
  private calculateAverageQualityScore(
    results: ChunkTranslationResult[]
  ): number {
    const validResults = results.filter(r => !r.error)
    if (validResults.length === 0) return 0

    const sum = validResults.reduce(
      (total, result) => total + result.qualityScore,
      0
    )
    return Math.round((sum / validResults.length) * 100) / 100
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Estimate total translation time for user feedback
   */
  estimateTranslationTime(textLength: number): number {
    if (textLength <= 4000) {
      return 2000 // 2 seconds for direct translation
    }

    // Estimate based on chunking
    const estimatedChunks = Math.ceil(textLength / 3000) // Average chunk size
    const timePerChunk = 2500 // Include processing overhead
    const concurrencyFactor = Math.min(
      this.MAX_CONCURRENT_CHUNKS / estimatedChunks,
      1
    )

    return Math.round(estimatedChunks * timePerChunk * concurrencyFactor)
  }

  /**
   * Get optimal chunking settings based on text characteristics
   */
  getOptimalChunkingSettings(
    text: string,
    targetLang: string
  ): Partial<ChunkingOptions> {
    const settings: Partial<ChunkingOptions> = {
      targetLanguage: targetLang,
    }

    // Adjust chunk size based on text structure
    const paragraphCount = text.split('\n\n').length
    const averageParagraphLength = text.length / paragraphCount

    if (averageParagraphLength > 2000) {
      // Long paragraphs - use smaller chunks with sentence breaks
      settings.maxChunkSize = 3000
      settings.preferredBreakpoints = ['. ', '! ', '? ', '\n\n', '; ', '\n']
    } else if (paragraphCount > 50) {
      // Many short paragraphs - can use larger chunks
      settings.maxChunkSize = 5000
      settings.preferredBreakpoints = ['\n\n', '. ', '! ', '? ', '\n']
    }

    // Language-specific adjustments
    if (['zh', 'ja', 'ko'].includes(targetLang)) {
      // Asian languages - smaller chunks for better context
      settings.maxChunkSize = Math.min(settings.maxChunkSize || 4000, 3000)
    }

    return settings
  }
}

// Export singleton instance
export const chunkedTranslationService = new ChunkedTranslationService()

// Export types
export type {
  ChunkedTranslationRequest,
  ChunkedTranslationResponse,
  ChunkedTranslationProgress,
}
