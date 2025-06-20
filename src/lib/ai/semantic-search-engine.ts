import { logger, performanceLogger } from '@/lib/logger'
import { analytics } from '@/src/lib/analytics'
import { aiProviderManager } from './providers/provider-manager'

export interface SearchIndex {
  id: string
  documentId: string
  content: string
  metadata: SearchMetadata
  embeddings: number[]
  keywords: string[]
  entities: string[]
  concepts: string[]
  language: string
  domain?: string
  createdAt: Date
  lastUpdated: Date
}

export interface SearchMetadata {
  title?: string
  section?: string
  pageNumber?: number
  elementType: 'text' | 'table' | 'image' | 'chart' | 'header' | 'list'
  wordCount: number
  confidence: number
  importance: number
  position?: { start: number, end: number }
  structure?: {
    level: number
    parent?: string
    children: string[]
  }
}

export interface SearchQuery {
  text: string
  language?: string
  targetLanguage?: string
  filters?: SearchFilters
  options?: SearchOptions
}

export interface SearchFilters {
  documentIds?: string[]
  domains?: string[]
  languages?: string[]
  elementTypes?: string[]
  dateRange?: { start: Date, end: Date }
  authors?: string[]
  keywords?: string[]
  entities?: string[]
  minConfidence?: number
  pageRange?: { start: number, end: number }
}

export interface SearchOptions {
  maxResults?: number
  threshold?: number
  includeContext?: boolean
  crossLanguage?: boolean
  semanticExpansion?: boolean
  fuzzyMatch?: boolean
  rankBy?: 'relevance' | 'recency' | 'importance' | 'confidence'
  groupBy?: 'document' | 'section' | 'type' | 'domain'
  includeSnippets?: boolean
  snippetLength?: number
  highlightTerms?: boolean
}

export interface SearchResult {
  id: string
  documentId: string
  content: string
  metadata: SearchMetadata
  relevanceScore: number
  semanticScore: number
  snippet?: string
  highlights?: Highlight[]
  context?: SearchContext
  crossLanguageMatch?: boolean
  expandedTerms?: string[]
}

export interface SearchResponse {
  query: SearchQuery
  results: SearchResult[]
  totalResults: number
  processingTime: number
  searchStats: SearchStats
  suggestions?: string[]
  relatedQueries?: string[]
  facets?: SearchFacet[]
}

export interface SearchStats {
  documentsSearched: number
  indexesUsed: string[]
  queryExpansion: boolean
  crossLanguageSearch: boolean
  averageRelevance: number
  topDomains: string[]
  topLanguages: string[]
}

export interface SearchFacet {
  field: string
  values: { value: string, count: number }[]
}

export interface Highlight {
  field: string
  fragments: string[]
  matchedTerms: string[]
}

export interface SearchContext {
  before: string
  after: string
  relatedResults: SearchResult[]
  documentContext: {
    title: string
    section: string
    summary: string
  }
}

export interface QueryExpansion {
  originalTerms: string[]
  expandedTerms: string[]
  synonyms: Record<string, string[]>
  translations: Record<string, string[]>
  conceptRelated: Record<string, string[]>
}

export interface CrossLanguageMapping {
  originalLanguage: string
  targetLanguage: string
  translations: Record<string, string>
  confidence: number
}

export class SemanticSearchEngine {
  private indexes: Map<string, SearchIndex> = new Map()
  private documentIndexes: Map<string, Set<string>> = new Map()
  private embeddingModel: any
  private translationModel: any
  private queryExpander: any
  private isInitialized: boolean = false

  constructor() {
    this.initializeModels()
  }

  private async initializeModels(): Promise<void> {
    logger.info('Initializing semantic search engine models')

    try {
      // Mock model initialization - replace with actual model loading
      this.embeddingModel = {
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        dimensions: 384,
        maxTokens: 512,
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'vi', 'ar']
      }

      this.translationModel = {
        model: 'opus-mt-multilingual',
        supportedPairs: 100,
        accuracy: 0.89
      }

      this.queryExpander = {
        model: 'wordnet-expansion',
        synonymDatabase: 'wordnet',
        conceptGraph: 'conceptnet'
      }

      this.isInitialized = true
      logger.info('Semantic search engine initialized successfully')

    } catch (error) {
      logger.error({ error }, 'Failed to initialize semantic search engine')
      throw error
    }
  }

  async indexDocument(
    documentId: string,
    content: string,
    structure: any,
    options: {
      language?: string
      domain?: string
      extractKeywords?: boolean
      extractEntities?: boolean
      extractConcepts?: boolean
    } = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeModels()
    }

    logger.info('Indexing document for semantic search', {
      documentId,
      contentLength: content.length,
      options
    })

    const startTime = Date.now()

    try {
      // Split content into searchable chunks
      const chunks = await this.createSearchableChunks(content, structure, options)

      // Process each chunk
      for (const chunk of chunks) {
        const searchIndex = await this.createSearchIndex(
          documentId,
          chunk,
          options
        )
        
        this.indexes.set(searchIndex.id, searchIndex)
        
        // Update document index mapping
        const docIndexes = this.documentIndexes.get(documentId) || new Set()
        docIndexes.add(searchIndex.id)
        this.documentIndexes.set(documentId, docIndexes)
      }

      const processingTime = Date.now() - startTime

      performanceLogger.info({
        documentId,
        chunksCreated: chunks.length,
        indexesCreated: chunks.length,
        processingTime
      }, 'Document indexing completed')

      analytics.track('document_indexed_for_search', {
        documentId,
        chunksCount: chunks.length,
        processingTime,
        language: options.language,
        domain: options.domain
      })

    } catch (error) {
      logger.error({ error, documentId }, 'Document indexing failed')
      throw error
    }
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    if (!this.isInitialized) {
      await this.initializeModels()
    }

    const startTime = Date.now()
    
    logger.info('Executing semantic search', {
      query: query.text.substring(0, 100),
      language: query.language,
      filters: query.filters
    })

    try {
      // Expand query if enabled
      const expandedQuery = query.options?.semanticExpansion 
        ? await this.expandQuery(query.text, query.language)
        : { originalTerms: [query.text], expandedTerms: [], synonyms: {}, translations: {}, conceptRelated: {} }

      // Handle cross-language search
      const crossLanguageMappings: CrossLanguageMapping[] = []
      if (query.options?.crossLanguage && query.targetLanguage && query.language !== query.targetLanguage) {
        const mapping = await this.createCrossLanguageMapping(query.text, query.language!, query.targetLanguage)
        crossLanguageMappings.push(mapping)
      }

      // Generate embeddings for search
      const queryEmbeddings = await this.generateEmbeddings(query.text, query.language)

      // Find relevant indexes
      const candidateIndexes = this.filterIndexesByQuery(query)

      // Calculate semantic similarity
      const scoredResults = await this.calculateSimilarityScores(
        queryEmbeddings,
        candidateIndexes,
        expandedQuery,
        crossLanguageMappings
      )

      // Rank and filter results
      const rankedResults = this.rankResults(scoredResults, query.options)
      const filteredResults = this.applyFilters(rankedResults, query.filters)
      const finalResults = this.limitResults(filteredResults, query.options?.maxResults || 20)

      // Enhance results with snippets and highlights
      const enhancedResults = await this.enhanceResults(finalResults, query, expandedQuery)

      // Generate suggestions and related queries
      const suggestions = await this.generateSuggestions(query.text, enhancedResults)
      const relatedQueries = await this.generateRelatedQueries(query.text, enhancedResults)

      // Create facets
      const facets = this.createFacets(candidateIndexes, query.filters)

      const processingTime = Date.now() - startTime

      const response: SearchResponse = {
        query,
        results: enhancedResults,
        totalResults: rankedResults.length,
        processingTime,
        searchStats: {
          documentsSearched: new Set(candidateIndexes.map(idx => idx.documentId)).size,
          indexesUsed: [this.embeddingModel.model],
          queryExpansion: query.options?.semanticExpansion || false,
          crossLanguageSearch: crossLanguageMappings.length > 0,
          averageRelevance: enhancedResults.length > 0 
            ? enhancedResults.reduce((sum, r) => sum + r.relevanceScore, 0) / enhancedResults.length
            : 0,
          topDomains: this.getTopDomains(enhancedResults),
          topLanguages: this.getTopLanguages(enhancedResults)
        },
        suggestions,
        relatedQueries,
        facets
      }

      analytics.track('semantic_search_executed', {
        queryLength: query.text.length,
        resultCount: enhancedResults.length,
        processingTime,
        language: query.language,
        crossLanguage: crossLanguageMappings.length > 0,
        queryExpansion: query.options?.semanticExpansion || false
      })

      return response

    } catch (error) {
      logger.error({ error, query }, 'Semantic search execution failed')
      throw error
    }
  }

  async findSimilarContent(
    documentId: string,
    indexId: string,
    options: {
      maxResults?: number
      threshold?: number
      excludeSameDocument?: boolean
      sameLanguageOnly?: boolean
    } = {}
  ): Promise<SearchResult[]> {
    const sourceIndex = this.indexes.get(indexId)
    if (!sourceIndex) {
      throw new Error(`Index ${indexId} not found`)
    }

    logger.info('Finding similar content', {
      sourceDocument: documentId,
      sourceIndex: indexId,
      options
    })

    try {
      const candidateIndexes = Array.from(this.indexes.values()).filter(idx => {
        if (options.excludeSameDocument && idx.documentId === documentId) return false
        if (options.sameLanguageOnly && idx.language !== sourceIndex.language) return false
        return true
      })

      const similarities = await this.calculateSimilarityScores(
        sourceIndex.embeddings,
        candidateIndexes,
        { originalTerms: [], expandedTerms: [], synonyms: {}, translations: {}, conceptRelated: {} },
        []
      )

      const filteredResults = similarities.filter(result => 
        result.semanticScore >= (options.threshold || 0.5)
      )

      const rankedResults = filteredResults
        .sort((a, b) => b.semanticScore - a.semanticScore)
        .slice(0, options.maxResults || 10)

      return rankedResults

    } catch (error) {
      logger.error({ error, documentId, indexId }, 'Similar content search failed')
      throw error
    }
  }

  async getSuggestions(
    partialQuery: string,
    language?: string,
    maxSuggestions: number = 5
  ): Promise<string[]> {
    // Mock suggestion generation - replace with actual suggestion logic
    const suggestions = [
      `${partialQuery} analysis`,
      `${partialQuery} report`,
      `${partialQuery} summary`,
      `${partialQuery} overview`,
      `${partialQuery} details`
    ]

    return suggestions.slice(0, maxSuggestions)
  }

  // Private helper methods
  private async createSearchableChunks(
    content: string,
    structure: any,
    options: any
  ): Promise<{ content: string, metadata: SearchMetadata }[]> {
    const chunks: { content: string, metadata: SearchMetadata }[] = []

    // Create chunks based on document structure
    if (structure?.sections) {
      for (const section of structure.sections) {
        chunks.push({
          content: section.content,
          metadata: {
            title: section.title,
            section: section.title,
            pageNumber: section.pageNumber,
            elementType: 'text',
            wordCount: section.content.split(/\s+/).length,
            confidence: 0.9,
            importance: 0.7,
            structure: {
              level: section.level,
              children: []
            }
          }
        })
      }
    } else {
      // Fallback: create chunks by paragraph
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
      
      paragraphs.forEach((paragraph, index) => {
        chunks.push({
          content: paragraph.trim(),
          metadata: {
            section: `Paragraph ${index + 1}`,
            elementType: 'text',
            wordCount: paragraph.split(/\s+/).length,
            confidence: 0.8,
            importance: 0.5
          }
        })
      })
    }

    return chunks
  }

  private async createSearchIndex(
    documentId: string,
    chunk: { content: string, metadata: SearchMetadata },
    options: any
  ): Promise<SearchIndex> {
    const indexId = `idx_${documentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Generate embeddings
    const embeddings = await this.generateEmbeddings(chunk.content, options.language)

    // Extract keywords, entities, concepts
    const keywords = options.extractKeywords ? await this.extractKeywords(chunk.content) : []
    const entities = options.extractEntities ? await this.extractEntities(chunk.content) : []
    const concepts = options.extractConcepts ? await this.extractConcepts(chunk.content) : []

    return {
      id: indexId,
      documentId,
      content: chunk.content,
      metadata: chunk.metadata,
      embeddings,
      keywords,
      entities,
      concepts,
      language: options.language || 'en',
      domain: options.domain,
      createdAt: new Date(),
      lastUpdated: new Date()
    }
  }

  private async generateEmbeddings(text: string, language?: string): Promise<number[]> {
    try {
      // Use the AI provider manager for real embeddings
      const response = await aiProviderManager.generateEmbeddings({
        text,
        model: 'text-embedding-3-small' // Cost-effective and high-quality
      })

      // Return the first embedding (assuming single text input)
      return response.embeddings[0] || []
    } catch (error) {
      logger.warn({ 
        error: error instanceof Error ? error.message : String(error), 
        text: text.substring(0, 100) 
      }, 'Failed to generate embeddings, using fallback')
      
      // Fallback to deterministic mock embeddings for consistency
      const hash = this.simpleHash(text)
      return Array(384).fill(0).map((_, i) => {
        return (Math.sin(hash + i) + Math.cos(hash * 2 + i)) / 2
      })
    }
  }

  // Simple hash function for consistent fallback embeddings
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / 1000000 // Normalize
  }

  private async extractKeywords(text: string): Promise<string[]> {
    // Mock keyword extraction - replace with actual keyword extraction
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    const uniqueWords = [...new Set(words)]
    return uniqueWords.slice(0, 10) // Return top 10 keywords
  }

  private async extractEntities(text: string): Promise<string[]> {
    // Mock entity extraction - replace with actual NER
    const mockEntities = ['John Smith', 'New York', 'Microsoft', 'January 2024']
    return mockEntities.filter(entity => text.includes(entity))
  }

  private async extractConcepts(text: string): Promise<string[]> {
    // Mock concept extraction - replace with actual concept extraction
    const mockConcepts = ['artificial intelligence', 'machine learning', 'data analysis', 'technology']
    return mockConcepts.filter(concept => text.toLowerCase().includes(concept.toLowerCase()))
  }

  private async expandQuery(query: string, language?: string): Promise<QueryExpansion> {
    // Mock query expansion - replace with actual query expansion
    const terms = query.toLowerCase().split(/\s+/)
    
    return {
      originalTerms: terms,
      expandedTerms: [...terms, 'related', 'similar'],
      synonyms: {
        [terms[0]]: ['equivalent', 'alike']
      },
      translations: {},
      conceptRelated: {}
    }
  }

  private async createCrossLanguageMapping(
    query: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<CrossLanguageMapping> {
    // Mock translation - replace with actual translation service
    return {
      originalLanguage: fromLanguage,
      targetLanguage: toLanguage,
      translations: {
        [query]: `translated_${query}_to_${toLanguage}`
      },
      confidence: 0.85
    }
  }

  private filterIndexesByQuery(query: SearchQuery): SearchIndex[] {
    let candidateIndexes = Array.from(this.indexes.values())

    // Apply filters
    if (query.filters?.documentIds) {
      candidateIndexes = candidateIndexes.filter(idx => 
        query.filters!.documentIds!.includes(idx.documentId)
      )
    }

    if (query.filters?.domains) {
      candidateIndexes = candidateIndexes.filter(idx => 
        idx.domain && query.filters!.domains!.includes(idx.domain)
      )
    }

    if (query.filters?.languages) {
      candidateIndexes = candidateIndexes.filter(idx => 
        query.filters!.languages!.includes(idx.language)
      )
    }

    if (query.filters?.elementTypes) {
      candidateIndexes = candidateIndexes.filter(idx => 
        query.filters!.elementTypes!.includes(idx.metadata.elementType)
      )
    }

    if (query.filters?.minConfidence) {
      candidateIndexes = candidateIndexes.filter(idx => 
        idx.metadata.confidence >= query.filters!.minConfidence!
      )
    }

    return candidateIndexes
  }

  private async calculateSimilarityScores(
    queryEmbeddings: number[],
    candidates: SearchIndex[],
    expandedQuery: QueryExpansion,
    crossLanguageMappings: CrossLanguageMapping[]
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    for (const candidate of candidates) {
      // Calculate semantic similarity using cosine similarity
      const semanticScore = this.cosineSimilarity(queryEmbeddings, candidate.embeddings)
      
      // Calculate text relevance score
      const relevanceScore = this.calculateTextRelevance(
        expandedQuery.originalTerms.join(' '),
        candidate.content,
        expandedQuery
      )

      // Combine scores
      const finalScore = (semanticScore * 0.7) + (relevanceScore * 0.3)

      results.push({
        id: candidate.id,
        documentId: candidate.documentId,
        content: candidate.content,
        metadata: candidate.metadata,
        relevanceScore: finalScore,
        semanticScore,
        crossLanguageMatch: crossLanguageMappings.length > 0
      })
    }

    return results
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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

  private calculateTextRelevance(
    query: string,
    content: string,
    expandedQuery: QueryExpansion
  ): number {
    const queryLower = query.toLowerCase()
    const contentLower = content.toLowerCase()
    
    // Simple term frequency scoring
    const queryTerms = [...expandedQuery.originalTerms, ...expandedQuery.expandedTerms]
    let score = 0

    for (const term of queryTerms) {
      const matches = (contentLower.match(new RegExp(term.toLowerCase(), 'g')) || []).length
      score += matches
    }

    // Normalize by content length
    return Math.min(1.0, score / content.split(/\s+/).length)
  }

  private rankResults(results: SearchResult[], options?: SearchOptions): SearchResult[] {
    const rankBy = options?.rankBy || 'relevance'

    return results.sort((a, b) => {
      switch (rankBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore
        case 'recency':
          return new Date(b.metadata.title || '').getTime() - new Date(a.metadata.title || '').getTime()
        case 'importance':
          return b.metadata.importance - a.metadata.importance
        case 'confidence':
          return b.metadata.confidence - a.metadata.confidence
        default:
          return b.relevanceScore - a.relevanceScore
      }
    })
  }

  private applyFilters(results: SearchResult[], filters?: SearchFilters): SearchResult[] {
    if (!filters) return results

    return results.filter(result => {
      if (filters.minConfidence && result.metadata.confidence < filters.minConfidence) {
        return false
      }

      if (filters.pageRange) {
        const pageNum = result.metadata.pageNumber
        if (pageNum && (pageNum < filters.pageRange.start || pageNum > filters.pageRange.end)) {
          return false
        }
      }

      return true
    })
  }

  private limitResults(results: SearchResult[], maxResults: number): SearchResult[] {
    return results.slice(0, maxResults)
  }

  private async enhanceResults(
    results: SearchResult[],
    query: SearchQuery,
    expandedQuery: QueryExpansion
  ): Promise<SearchResult[]> {
    return results.map(result => {
      // Add snippet
      if (query.options?.includeSnippets) {
        result.snippet = this.generateSnippet(
          result.content,
          query.text,
          query.options?.snippetLength || 150
        )
      }

      // Add highlights
      if (query.options?.highlightTerms) {
        result.highlights = this.generateHighlights(
          result.content,
          [...expandedQuery.originalTerms, ...expandedQuery.expandedTerms]
        )
      }

      // Add context if requested
      if (query.options?.includeContext) {
        result.context = this.generateContext(result)
      }

      return result
    })
  }

  private generateSnippet(content: string, query: string, maxLength: number): string {
    const queryLower = query.toLowerCase()
    const contentLower = content.toLowerCase()
    
    // Find the best position to start the snippet
    const queryIndex = contentLower.indexOf(queryLower)
    
    if (queryIndex === -1) {
      return content.substring(0, maxLength) + '...'
    }

    const start = Math.max(0, queryIndex - 50)
    const end = Math.min(content.length, start + maxLength)
    
    let snippet = content.substring(start, end)
    
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'
    
    return snippet
  }

  private generateHighlights(content: string, terms: string[]): Highlight[] {
    const highlights: Highlight[] = []
    
    for (const term of terms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      const matches = content.match(regex)
      
      if (matches) {
        highlights.push({
          field: 'content',
          fragments: matches,
          matchedTerms: [term]
        })
      }
    }

    return highlights
  }

  private generateContext(result: SearchResult): SearchContext {
    return {
      before: 'Previous context...',
      after: 'Following context...',
      relatedResults: [],
      documentContext: {
        title: result.metadata.title || 'Untitled',
        section: result.metadata.section || 'Unknown section',
        summary: 'Document summary...'
      }
    }
  }

  private async generateSuggestions(query: string, results: SearchResult[]): Promise<string[]> {
    // Mock suggestion generation based on results
    const suggestions = [
      `${query} summary`,
      `${query} analysis`,
      `${query} details`,
      `${query} examples`
    ]

    return suggestions.slice(0, 3)
  }

  private async generateRelatedQueries(query: string, results: SearchResult[]): Promise<string[]> {
    // Mock related query generation
    const related = [
      `What is ${query}?`,
      `How does ${query} work?`,
      `${query} benefits`,
      `${query} implementation`
    ]

    return related.slice(0, 3)
  }

  private createFacets(indexes: SearchIndex[], filters?: SearchFilters): SearchFacet[] {
    const facets: SearchFacet[] = []

    // Domain facet
    const domainCounts = new Map<string, number>()
    indexes.forEach(idx => {
      if (idx.domain) {
        domainCounts.set(idx.domain, (domainCounts.get(idx.domain) || 0) + 1)
      }
    })

    if (domainCounts.size > 0) {
      facets.push({
        field: 'domain',
        values: Array.from(domainCounts.entries()).map(([value, count]) => ({ value, count }))
      })
    }

    // Element type facet
    const typeCounts = new Map<string, number>()
    indexes.forEach(idx => {
      const type = idx.metadata.elementType
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
    })

    facets.push({
      field: 'elementType',
      values: Array.from(typeCounts.entries()).map(([value, count]) => ({ value, count }))
    })

    return facets
  }

  private getTopDomains(results: SearchResult[]): string[] {
    const domainCounts = new Map<string, number>()
    
    results.forEach(result => {
      const index = this.indexes.get(result.id)
      if (index?.domain) {
        domainCounts.set(index.domain, (domainCounts.get(index.domain) || 0) + 1)
      }
    })

    return Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain]) => domain)
  }

  private getTopLanguages(results: SearchResult[]): string[] {
    const languageCounts = new Map<string, number>()
    
    results.forEach(result => {
      const index = this.indexes.get(result.id)
      if (index?.language) {
        languageCounts.set(index.language, (languageCounts.get(index.language) || 0) + 1)
      }
    })

    return Array.from(languageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([language]) => language)
  }

  // Public utility methods
  getIndexStatistics(): {
    totalIndexes: number
    totalDocuments: number
    averageIndexesPerDocument: number
    languages: string[]
    domains: string[]
  } {
    const indexes = Array.from(this.indexes.values())
    const languages = [...new Set(indexes.map(idx => idx.language))]
    const domains = [...new Set(indexes.map(idx => idx.domain).filter(Boolean))]

    return {
      totalIndexes: indexes.length,
      totalDocuments: this.documentIndexes.size,
      averageIndexesPerDocument: this.documentIndexes.size > 0 
        ? indexes.length / this.documentIndexes.size 
        : 0,
      languages,
      domains: domains as string[]
    }
  }

  removeDocumentIndexes(documentId: string): void {
    const indexIds = this.documentIndexes.get(documentId)
    if (indexIds) {
      indexIds.forEach(indexId => {
        this.indexes.delete(indexId)
      })
      this.documentIndexes.delete(documentId)
    }

    logger.info('Document indexes removed', { documentId, indexesRemoved: indexIds?.size || 0 })
  }

  clearAllIndexes(): void {
    this.indexes.clear()
    this.documentIndexes.clear()
    logger.info('All search indexes cleared')
  }
}

// Singleton instance
export const semanticSearchEngine = new SemanticSearchEngine()

// Types are already exported above with their declarations