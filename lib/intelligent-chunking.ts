/**
 * Intelligent Text Chunking System for Large Translations
 * Handles 500k+ character texts with context preservation
 */

interface ChunkMetadata {
  index: number
  originalLength: number
  contextBefore?: string
  contextAfter?: string
  type: 'paragraph' | 'sentence' | 'forced'
}

interface TextChunk {
  text: string
  metadata: ChunkMetadata
}

interface ChunkedTranslationProgress {
  totalChunks: number
  completedChunks: number
  currentChunk?: number
  estimatedTimeRemaining?: number
  errors?: string[]
}

interface ChunkingOptions {
  maxChunkSize: number
  contextWindowSize: number
  preferredBreakpoints: string[]
  preserveFormatting: boolean
  targetLanguage: string
}

export class IntelligentTextChunker {
  private readonly defaultOptions: ChunkingOptions = {
    maxChunkSize: 6000, // Increased for better efficiency with ultra-long documents
    contextWindowSize: 300, // Increased context for better translation quality
    preferredBreakpoints: ['\n\n', '. ', '! ', '? ', '\n', '; ', ', '],
    preserveFormatting: true,
    targetLanguage: 'en',
  }

  /**
   * Split large text into intelligent chunks while preserving context
   */
  public chunkText(
    text: string,
    options: Partial<ChunkingOptions> = {}
  ): TextChunk[] {
    // Use adaptive chunk sizing for ultra-long documents
    const adaptiveOptions = this.getAdaptiveChunkingOptions(text, options)
    const opts = { ...this.defaultOptions, ...adaptiveOptions }

    // If text is small enough, return as single chunk
    if (text.length <= opts.maxChunkSize) {
      return [
        {
          text,
          metadata: {
            index: 0,
            originalLength: text.length,
            type: 'paragraph',
          },
        },
      ]
    }

    console.log('🔄 Chunking large text with adaptive sizing', {
      originalLength: text.length,
      maxChunkSize: opts.maxChunkSize,
      estimatedChunks: Math.ceil(text.length / opts.maxChunkSize),
      isUltraLong: text.length > 100000,
    })

    return this.performIntelligentChunking(text, opts)
  }

  /**
   * Get adaptive chunking options based on document characteristics
   */
  private getAdaptiveChunkingOptions(
    text: string,
    userOptions: Partial<ChunkingOptions>
  ): Partial<ChunkingOptions> {
    const adaptiveOptions: Partial<ChunkingOptions> = { ...userOptions }

    // For ultra-long documents (>100k chars), use larger chunks
    if (text.length > 100000) {
      adaptiveOptions.maxChunkSize = Math.min(
        userOptions.maxChunkSize || 8000,
        8000
      )
      adaptiveOptions.contextWindowSize = 400
      console.log('📏 Using ultra-long document settings', {
        maxChunkSize: adaptiveOptions.maxChunkSize,
        contextWindowSize: adaptiveOptions.contextWindowSize,
      })
    }
    // For very long documents (>50k chars), optimize chunk size
    else if (text.length > 50000) {
      adaptiveOptions.maxChunkSize = Math.min(
        userOptions.maxChunkSize || 7000,
        7000
      )
      adaptiveOptions.contextWindowSize = 350
    }

    return adaptiveOptions
  }

  /**
   * Perform the intelligent chunking with context preservation
   */
  private performIntelligentChunking(
    text: string,
    options: ChunkingOptions
  ): TextChunk[] {
    const chunks: TextChunk[] = []
    let currentPosition = 0
    let chunkIndex = 0

    while (currentPosition < text.length) {
      const remainingText = text.substring(currentPosition)

      if (remainingText.length <= options.maxChunkSize) {
        // Last chunk - take everything remaining
        chunks.push({
          text: remainingText,
          metadata: {
            index: chunkIndex,
            originalLength: remainingText.length,
            contextBefore: this.getContextBefore(
              text,
              currentPosition,
              options.contextWindowSize
            ),
            type: 'paragraph',
          },
        })
        break
      }

      // Find optimal break point
      const chunkResult = this.findOptimalChunk(
        text,
        currentPosition,
        options.maxChunkSize,
        options.preferredBreakpoints
      )

      chunks.push({
        text: chunkResult.text,
        metadata: {
          index: chunkIndex,
          originalLength: chunkResult.text.length,
          contextBefore: this.getContextBefore(
            text,
            currentPosition,
            options.contextWindowSize
          ),
          contextAfter: this.getContextAfter(
            text,
            currentPosition + chunkResult.length,
            options.contextWindowSize
          ),
          type: chunkResult.breakType,
        },
      })

      currentPosition += chunkResult.length
      chunkIndex++
    }

    console.log('✅ Text chunking completed', {
      totalChunks: chunks.length,
      averageChunkSize: Math.round(
        chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) /
          chunks.length
      ),
      chunkSizes: chunks.map(chunk => chunk.text.length),
    })

    return chunks
  }

  /**
   * Find the optimal breaking point for a chunk
   */
  private findOptimalChunk(
    text: string,
    startPos: number,
    maxSize: number,
    breakpoints: string[]
  ): {
    text: string
    length: number
    breakType: 'paragraph' | 'sentence' | 'forced'
  } {
    const searchText = text.substring(startPos, startPos + maxSize)

    // Try to find natural breakpoints in order of preference
    for (const breakpoint of breakpoints) {
      const lastBreakIndex = searchText.lastIndexOf(breakpoint)

      if (lastBreakIndex > maxSize * 0.7) {
        // Don't break too early (at least 70% of max size)
        const breakLength = lastBreakIndex + breakpoint.length
        return {
          text: text.substring(startPos, startPos + breakLength),
          length: breakLength,
          breakType: this.getBreakType(breakpoint),
        }
      }
    }

    // If no good breakpoint found, force break at word boundary
    const wordBoundary = this.findWordBoundary(searchText, maxSize)
    return {
      text: text.substring(startPos, startPos + wordBoundary),
      length: wordBoundary,
      breakType: 'forced',
    }
  }

  /**
   * Get context before the current position
   */
  private getContextBefore(
    text: string,
    position: number,
    windowSize: number
  ): string | undefined {
    if (position === 0) return undefined

    const start = Math.max(0, position - windowSize)
    return text.substring(start, position).trim()
  }

  /**
   * Get context after the current position
   */
  private getContextAfter(
    text: string,
    position: number,
    windowSize: number
  ): string | undefined {
    if (position >= text.length) return undefined

    const end = Math.min(text.length, position + windowSize)
    return text.substring(position, end).trim()
  }

  /**
   * Determine the type of break based on breakpoint
   */
  private getBreakType(
    breakpoint: string
  ): 'paragraph' | 'sentence' | 'forced' {
    if (breakpoint === '\n\n') return 'paragraph'
    if (['. ', '! ', '? '].includes(breakpoint)) return 'sentence'
    return 'forced'
  }

  /**
   * Find word boundary near the target position
   */
  private findWordBoundary(text: string, targetPos: number): number {
    // Work backwards from target position to find space
    for (
      let i = Math.min(targetPos, text.length - 1);
      i > targetPos * 0.8;
      i--
    ) {
      if (text[i] === ' ' || text[i] === '\t' || text[i] === '\n') {
        return i + 1
      }
    }

    // If no word boundary found, return target position
    return Math.min(targetPos, text.length)
  }

  /**
   * Reassemble translated chunks back into complete text
   */
  public reassembleChunks(
    translatedChunks: { text: string; metadata: ChunkMetadata }[]
  ): string {
    // Sort chunks by index to ensure correct order
    const sortedChunks = translatedChunks.sort(
      (a, b) => a.metadata.index - b.metadata.index
    )

    let result = ''
    for (let i = 0; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i]

      // Add the translated text
      result += chunk.text

      // Add appropriate spacing between chunks if needed
      if (i < sortedChunks.length - 1) {
        const nextChunk = sortedChunks[i + 1]

        // Add spacing based on break type
        if (
          chunk.metadata.type === 'paragraph' &&
          !chunk.text.endsWith('\n\n')
        ) {
          result += '\n\n'
        } else if (
          chunk.metadata.type === 'sentence' &&
          !chunk.text.endsWith(' ')
        ) {
          result += ' '
        }
      }
    }

    return result.trim()
  }

  /**
   * Estimate translation time for chunked processing
   */
  public estimateTranslationTime(
    chunks: TextChunk[],
    avgTimePerChunk: number = 2000
  ): number {
    // Base time per chunk + additional time for larger chunks
    const totalTime = chunks.reduce((total, chunk) => {
      const sizeMultiplier = Math.min(chunk.text.length / 2000, 2) // Cap at 2x for very large chunks
      return total + avgTimePerChunk * sizeMultiplier
    }, 0)

    return Math.round(totalTime)
  }

  /**
   * Generate progress update for chunked translation
   */
  public generateProgressUpdate(
    totalChunks: number,
    completedChunks: number,
    currentChunk: number,
    startTime: number,
    errors: string[] = []
  ): ChunkedTranslationProgress {
    const progress = completedChunks / totalChunks
    const elapsedTime = Date.now() - startTime
    const estimatedTotal = elapsedTime / progress
    const estimatedTimeRemaining = Math.round(estimatedTotal - elapsedTime)

    return {
      totalChunks,
      completedChunks,
      currentChunk,
      estimatedTimeRemaining:
        progress > 0.1 ? estimatedTimeRemaining : undefined,
      errors: errors.length > 0 ? errors : undefined,
    }
  }
}

// Export singleton instance
export const intelligentChunker = new IntelligentTextChunker()

// Export types for use in other modules
export type { TextChunk, ChunkedTranslationProgress, ChunkingOptions }
