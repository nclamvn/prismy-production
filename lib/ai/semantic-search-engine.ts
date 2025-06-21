// Semantic Search Engine for document intelligence
import { logger } from '@/lib/logger'

export interface SearchIndex {
  id: string
  documentId: string
  content: string
  embedding: number[]
  metadata: Record<string, any>
  createdAt: Date
}

export interface SearchQuery {
  query: string
  filters?: Record<string, any>
  limit?: number
  threshold?: number
}

export interface SearchResult {
  id: string
  documentId: string
  content: string
  score: number
  metadata: Record<string, any>
}

class SemanticSearchEngine {
  private indexes: Map<string, SearchIndex> = new Map()
  private documentIndexes: Map<string, string[]> = new Map()

  constructor() {
    logger.info('Semantic Search Engine initialized')
  }

  async indexDocument(
    documentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Simulate chunking the document
      const chunks = this.chunkContent(content)
      const indexIds: string[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const indexId = `${documentId}_chunk_${i}`

        // Mock embedding generation
        const embedding = await this.generateEmbedding(chunk)

        const searchIndex: SearchIndex = {
          id: indexId,
          documentId,
          content: chunk,
          embedding,
          metadata: {
            ...metadata,
            chunkIndex: i,
            totalChunks: chunks.length,
          },
          createdAt: new Date(),
        }

        this.indexes.set(indexId, searchIndex)
        indexIds.push(indexId)
      }

      this.documentIndexes.set(documentId, indexIds)
      logger.info(`Indexed document ${documentId} with ${chunks.length} chunks`)
    } catch (error) {
      logger.error('Failed to index document', error)
      throw error
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query.query)
      const results: SearchResult[] = []

      for (const [indexId, searchIndex] of this.indexes) {
        // Apply filters if provided
        if (query.filters && !this.matchesFilters(searchIndex, query.filters)) {
          continue
        }

        // Calculate similarity score
        const score = this.calculateCosineSimilarity(
          queryEmbedding,
          searchIndex.embedding
        )

        if (score >= (query.threshold || 0.7)) {
          results.push({
            id: searchIndex.id,
            documentId: searchIndex.documentId,
            content: searchIndex.content,
            score,
            metadata: searchIndex.metadata,
          })
        }
      }

      // Sort by score descending and limit results
      results.sort((a, b) => b.score - a.score)
      return results.slice(0, query.limit || 10)
    } catch (error) {
      logger.error('Search failed', error)
      throw error
    }
  }

  async removeDocumentIndex(documentId: string): Promise<void> {
    try {
      const indexIds = this.documentIndexes.get(documentId)
      if (indexIds) {
        indexIds.forEach(indexId => this.indexes.delete(indexId))
        this.documentIndexes.delete(documentId)
        logger.info(`Removed indexes for document ${documentId}`)
      }
    } catch (error) {
      logger.error('Failed to remove document index', error)
      throw error
    }
  }

  private chunkContent(content: string, chunkSize: number = 500): string[] {
    const words = content.split(' ')
    const chunks: string[] = []

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '))
    }

    return chunks
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation - replace with actual embedding service
    const hash = this.simpleHash(text)
    const embedding: number[] = []

    for (let i = 0; i < 384; i++) {
      embedding.push(Math.sin(hash + i) * Math.cos(hash - i))
    }

    return embedding
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  private matchesFilters(
    searchIndex: SearchIndex,
    filters: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (searchIndex.metadata[key] !== value) {
        return false
      }
    }
    return true
  }

  getStats() {
    const totalIndexes = this.indexes.size
    const totalDocuments = this.documentIndexes.size
    const averageChunksPerDocument =
      totalDocuments > 0 ? totalIndexes / totalDocuments : 0

    return {
      totalIndexes,
      totalDocuments,
      averageChunksPerDocument,
      timestamp: new Date(),
    }
  }
}

export const semanticSearchEngine = new SemanticSearchEngine()
