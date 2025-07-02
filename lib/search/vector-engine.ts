/**
 * UI/UX Polish Sprint - Phase 4: Smart Global Search with Vector Cache
 * 
 * Advanced semantic search engine with vector embeddings and intelligent caching
 * Provides context-aware search across documents, UI elements, and user actions
 */

export interface SearchDocument {
  id: string
  content: string
  title: string
  type: 'document' | 'ui_element' | 'action' | 'setting' | 'help'
  metadata: {
    path?: string
    locale?: string
    category?: string
    tags?: string[]
    lastModified?: string
    importance?: number
  }
  embedding?: number[]
}

export interface SearchQuery {
  text: string
  locale?: string
  type?: SearchDocument['type'][]
  filters?: {
    category?: string[]
    tags?: string[]
    dateRange?: { start: string; end: string }
  }
  limit?: number
  threshold?: number
}

export interface SearchResult {
  document: SearchDocument
  score: number
  highlights: string[]
  explanation?: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  processingTime: number
  suggestions?: string[]
  facets?: {
    types: Array<{ type: string; count: number }>
    categories: Array<{ category: string; count: number }>
    tags: Array<{ tag: string; count: number }>
  }
}

/**
 * Vector-based semantic search engine
 */
export class VectorSearchEngine {
  private documents: Map<string, SearchDocument> = new Map()
  private vectorCache: Map<string, number[]> = new Map()
  private indexedTerms: Map<string, Set<string>> = new Map()
  private isIndexing = false
  
  // Simulated embedding dimensions (in production, use actual embeddings API)
  private readonly EMBEDDING_DIM = 384
  
  constructor() {
    this.initializeSearchIndex()
  }
  
  /**
   * Add document to search index
   */
  async addDocument(document: SearchDocument): Promise<void> {
    // Generate embedding for document content
    const embedding = await this.generateEmbedding(document.content)
    
    // Store document with embedding
    const documentWithEmbedding: SearchDocument = {
      ...document,
      embedding
    }
    
    this.documents.set(document.id, documentWithEmbedding)
    this.vectorCache.set(document.id, embedding)
    
    // Update inverted index for keyword search
    this.updateInvertedIndex(document)
    
    console.log(`[VectorSearch] Added document: ${document.id}`)
  }
  
  /**
   * Perform semantic search with vector similarity
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = performance.now()
    
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query.text)
    
    // Get candidate documents
    const candidates = this.getCandidateDocuments(query)
    
    // Calculate semantic similarity scores
    const results: SearchResult[] = []
    
    for (const doc of candidates) {
      if (!doc.embedding) continue
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding)
      
      // Apply threshold filter
      if (similarity < (query.threshold || 0.3)) continue
      
      // Generate highlights
      const highlights = this.generateHighlights(query.text, doc.content)
      
      // Calculate final score with boosting
      const score = this.calculateFinalScore(similarity, doc, query)
      
      results.push({
        document: doc,
        score,
        highlights,
        explanation: this.generateExplanation(similarity, doc, query)
      })
    }
    
    // Sort by score and apply limit
    results.sort((a, b) => b.score - a.score)
    const limitedResults = results.slice(0, query.limit || 10)
    
    const processingTime = performance.now() - startTime
    
    return {
      results: limitedResults,
      total: results.length,
      query: query.text,
      processingTime,
      suggestions: await this.generateSuggestions(query.text),
      facets: this.generateFacets(results)
    }
  }
  
  /**
   * Get search suggestions based on query
   */
  async getSuggestions(partialQuery: string): Promise<string[]> {
    const suggestions: string[] = []
    
    // Keyword-based suggestions
    const terms = partialQuery.toLowerCase().split(/\s+/)
    const lastTerm = terms[terms.length - 1]
    
    // Find matching terms in index
    for (const [term, docIds] of this.indexedTerms) {
      if (term.startsWith(lastTerm) && term !== lastTerm) {
        const suggestion = terms.slice(0, -1).concat(term).join(' ')
        suggestions.push(suggestion)
      }
    }
    
    // Add semantic suggestions (simplified)
    const semanticSuggestions = await this.getSemanticSuggestions(partialQuery)
    suggestions.push(...semanticSuggestions)
    
    return suggestions.slice(0, 5)
  }
  
  /**
   * Clear search cache
   */
  clearCache(): void {
    this.vectorCache.clear()
    console.log('[VectorSearch] Cache cleared')
  }
  
  /**
   * Get search statistics
   */
  getStats(): {
    totalDocuments: number
    cacheSize: number
    indexSize: number
  } {
    return {
      totalDocuments: this.documents.size,
      cacheSize: this.vectorCache.size,
      indexSize: this.indexedTerms.size
    }
  }
  
  /**
   * Initialize search index with default content
   */
  private async initializeSearchIndex(): Promise<void> {
    if (this.isIndexing) return
    
    this.isIndexing = true
    
    try {
      // Add UI elements
      await this.addUIElements()
      
      // Add help content
      await this.addHelpContent()
      
      // Add action commands
      await this.addActionCommands()
      
      console.log('[VectorSearch] Search index initialized')
    } catch (error) {
      console.error('[VectorSearch] Failed to initialize index:', error)
    } finally {
      this.isIndexing = false
    }
  }
  
  /**
   * Add UI elements to search index
   */
  private async addUIElements(): Promise<void> {
    const uiElements = [
      {
        id: 'workspace-upload',
        content: 'Upload documents, files, PDFs, Word documents, Excel sheets, PowerPoint presentations',
        title: 'Document Upload',
        type: 'ui_element' as const,
        metadata: {
          path: '/workspace/upload',
          category: 'file_management',
          tags: ['upload', 'documents', 'files'],
          importance: 5
        }
      },
      {
        id: 'workspace-documents',
        content: 'View documents, manage files, download processed documents, document history',
        title: 'Document Library',
        type: 'ui_element' as const,
        metadata: {
          path: '/workspace/documents',
          category: 'file_management',
          tags: ['documents', 'library', 'history'],
          importance: 5
        }
      },
      {
        id: 'workspace-settings',
        content: 'Account settings, preferences, language, theme, notifications, privacy',
        title: 'Settings',
        type: 'ui_element' as const,
        metadata: {
          path: '/workspace/settings',
          category: 'configuration',
          tags: ['settings', 'preferences', 'account'],
          importance: 3
        }
      },
      {
        id: 'job-sidebar',
        content: 'View job progress, processing status, queue, completed jobs, failed jobs',
        title: 'Job Status Panel',
        type: 'ui_element' as const,
        metadata: {
          path: '/workspace',
          category: 'monitoring',
          tags: ['jobs', 'progress', 'status'],
          importance: 4
        }
      },
      {
        id: 'theme-toggle',
        content: 'Switch between light and dark theme, appearance settings',
        title: 'Theme Toggle',
        type: 'ui_element' as const,
        metadata: {
          category: 'appearance',
          tags: ['theme', 'dark', 'light', 'appearance'],
          importance: 2
        }
      }
    ]
    
    for (const element of uiElements) {
      await this.addDocument(element)
    }
  }
  
  /**
   * Add help content to search index
   */
  private async addHelpContent(): Promise<void> {
    const helpContent = [
      {
        id: 'help-upload-documents',
        content: 'To upload documents: Click the Upload button, drag and drop files, or select files from your computer. Supported formats include PDF, Word (DOC/DOCX), Excel (XLS/XLSX), and PowerPoint (PPT/PPTX).',
        title: 'How to Upload Documents',
        type: 'help' as const,
        metadata: {
          category: 'getting_started',
          tags: ['upload', 'documents', 'tutorial'],
          importance: 5
        }
      },
      {
        id: 'help-document-processing',
        content: 'Document processing includes OCR text extraction, language detection, translation, and document reconstruction. Processing time depends on document size and complexity.',
        title: 'Document Processing',
        type: 'help' as const,
        metadata: {
          category: 'features',
          tags: ['processing', 'ocr', 'translation'],
          importance: 4
        }
      },
      {
        id: 'help-translation-languages',
        content: 'Prismy supports translation between English, Vietnamese, Japanese, Arabic, and Chinese. High-quality AI translation with context awareness.',
        title: 'Supported Languages',
        type: 'help' as const,
        metadata: {
          category: 'features',
          tags: ['translation', 'languages', 'multilingual'],
          importance: 4
        }
      },
      {
        id: 'help-troubleshooting',
        content: 'Common issues: Large file uploads may take longer, check internet connection, ensure file formats are supported, contact support for processing errors.',
        title: 'Troubleshooting',
        type: 'help' as const,
        metadata: {
          category: 'support',
          tags: ['troubleshooting', 'issues', 'support'],
          importance: 3
        }
      }
    ]
    
    for (const content of helpContent) {
      await this.addDocument(content)
    }
  }
  
  /**
   * Add action commands to search index
   */
  private async addActionCommands(): Promise<void> {
    const actions = [
      {
        id: 'action-upload-file',
        content: 'Upload a new document or file for processing',
        title: 'Upload File',
        type: 'action' as const,
        metadata: {
          category: 'file_operations',
          tags: ['upload', 'add', 'new'],
          importance: 5
        }
      },
      {
        id: 'action-download-document',
        content: 'Download processed document or original file',
        title: 'Download Document',
        type: 'action' as const,
        metadata: {
          category: 'file_operations',
          tags: ['download', 'export', 'save'],
          importance: 4
        }
      },
      {
        id: 'action-change-language',
        content: 'Change interface language or translation target language',
        title: 'Change Language',
        type: 'action' as const,
        metadata: {
          category: 'settings',
          tags: ['language', 'locale', 'translation'],
          importance: 3
        }
      },
      {
        id: 'action-toggle-theme',
        content: 'Switch between light and dark theme mode',
        title: 'Toggle Theme',
        type: 'action' as const,
        metadata: {
          category: 'appearance',
          tags: ['theme', 'dark', 'light'],
          importance: 2
        }
      }
    ]
    
    for (const action of actions) {
      await this.addDocument(action)
    }
  }
  
  /**
   * Generate embedding for text (simplified implementation)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // In production, use actual embedding API (OpenAI, Cohere, etc.)
    // This is a simplified hash-based approach for demonstration
    
    const words = text.toLowerCase().split(/\s+/)
    const embedding = new Array(this.EMBEDDING_DIM).fill(0)
    
    // Simple word-based embedding generation
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const hash = this.simpleHash(word)
      
      for (let j = 0; j < this.EMBEDDING_DIM; j++) {
        embedding[j] += Math.sin(hash + i + j) * 0.1
      }
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / (magnitude || 1))
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
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
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }
  
  /**
   * Get candidate documents based on filters
   */
  private getCandidateDocuments(query: SearchQuery): SearchDocument[] {
    let candidates = Array.from(this.documents.values())
    
    // Apply type filter
    if (query.type && query.type.length > 0) {
      candidates = candidates.filter(doc => query.type!.includes(doc.type))
    }
    
    // Apply category filter
    if (query.filters?.category && query.filters.category.length > 0) {
      candidates = candidates.filter(doc => 
        query.filters!.category!.includes(doc.metadata.category || '')
      )
    }
    
    // Apply tag filter
    if (query.filters?.tags && query.filters.tags.length > 0) {
      candidates = candidates.filter(doc =>
        query.filters!.tags!.some(tag => 
          doc.metadata.tags?.includes(tag)
        )
      )
    }
    
    // Apply locale filter
    if (query.locale) {
      candidates = candidates.filter(doc => 
        !doc.metadata.locale || doc.metadata.locale === query.locale
      )
    }
    
    return candidates
  }
  
  /**
   * Calculate final score with boosting factors
   */
  private calculateFinalScore(
    similarity: number, 
    document: SearchDocument, 
    query: SearchQuery
  ): number {
    let score = similarity
    
    // Boost by importance
    if (document.metadata.importance) {
      score *= (1 + document.metadata.importance * 0.1)
    }
    
    // Boost exact title matches
    if (document.title.toLowerCase().includes(query.text.toLowerCase())) {
      score *= 1.5
    }
    
    // Boost by type relevance
    const typeBoosts = {
      'action': 1.3,      // Actions are often what users want
      'ui_element': 1.2,  // UI elements are commonly searched
      'help': 1.1,        // Help content is valuable
      'document': 1.0,    // Base score for documents
      'setting': 0.9      // Settings are less frequently needed
    }
    
    score *= typeBoosts[document.type] || 1.0
    
    return Math.min(score, 1.0) // Cap at 1.0
  }
  
  /**
   * Generate highlighted text snippets
   */
  private generateHighlights(query: string, content: string): string[] {
    const queryTerms = query.toLowerCase().split(/\s+/)
    const words = content.split(/\s+/)
    const highlights: string[] = []
    
    let i = 0
    while (i < words.length) {
      // Find matches
      const matchIndex = words.findIndex((word, index) => 
        index >= i && queryTerms.some(term => 
          word.toLowerCase().includes(term)
        )
      )
      
      if (matchIndex === -1) break
      
      // Extract snippet around match
      const start = Math.max(0, matchIndex - 3)
      const end = Math.min(words.length, matchIndex + 4)
      const snippet = words.slice(start, end).join(' ')
      
      highlights.push(snippet)
      i = end
    }
    
    return highlights.slice(0, 3) // Limit to 3 highlights
  }
  
  /**
   * Generate search explanation
   */
  private generateExplanation(
    similarity: number, 
    document: SearchDocument, 
    query: SearchQuery
  ): string {
    const reasons: string[] = []
    
    if (similarity > 0.8) {
      reasons.push('High semantic similarity')
    } else if (similarity > 0.5) {
      reasons.push('Moderate semantic similarity')
    }
    
    if (document.title.toLowerCase().includes(query.text.toLowerCase())) {
      reasons.push('Title match')
    }
    
    if (document.metadata.importance && document.metadata.importance > 3) {
      reasons.push('Important content')
    }
    
    return reasons.join(', ') || 'Content match'
  }
  
  /**
   * Update inverted index for keyword search
   */
  private updateInvertedIndex(document: SearchDocument): void {
    const text = (document.title + ' ' + document.content).toLowerCase()
    const terms = text.split(/[^\w]+/).filter(term => term.length > 2)
    
    for (const term of terms) {
      if (!this.indexedTerms.has(term)) {
        this.indexedTerms.set(term, new Set())
      }
      this.indexedTerms.get(term)!.add(document.id)
    }
  }
  
  /**
   * Generate semantic suggestions
   */
  private async getSemanticSuggestions(query: string): Promise<string[]> {
    // Simplified semantic suggestions
    const suggestions = {
      'upload': ['upload document', 'upload file', 'add document'],
      'download': ['download document', 'export file', 'save document'],
      'translate': ['translate document', 'change language', 'translation'],
      'theme': ['change theme', 'dark mode', 'appearance'],
      'help': ['get help', 'documentation', 'support']
    }
    
    const queryLower = query.toLowerCase()
    for (const [key, values] of Object.entries(suggestions)) {
      if (queryLower.includes(key)) {
        return values.filter(suggestion => 
          suggestion.toLowerCase().includes(queryLower)
        )
      }
    }
    
    return []
  }
  
  /**
   * Generate search facets
   */
  private generateFacets(results: SearchResult[]): SearchResponse['facets'] {
    const types = new Map<string, number>()
    const categories = new Map<string, number>()
    const tags = new Map<string, number>()
    
    for (const result of results) {
      const doc = result.document
      
      // Count types
      types.set(doc.type, (types.get(doc.type) || 0) + 1)
      
      // Count categories
      if (doc.metadata.category) {
        categories.set(doc.metadata.category, (categories.get(doc.metadata.category) || 0) + 1)
      }
      
      // Count tags
      if (doc.metadata.tags) {
        for (const tag of doc.metadata.tags) {
          tags.set(tag, (tags.get(tag) || 0) + 1)
        }
      }
    }
    
    return {
      types: Array.from(types.entries()).map(([type, count]) => ({ type, count })),
      categories: Array.from(categories.entries()).map(([category, count]) => ({ category, count })),
      tags: Array.from(tags.entries()).map(([tag, count]) => ({ tag, count }))
    }
  }
  
  /**
   * Simple hash function for string
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
  
  /**
   * Generate suggestions for partial query
   */
  private async generateSuggestions(query: string): Promise<string[]> {
    return this.getSuggestions(query)
  }
}

// Global search engine instance
export const vectorSearchEngine = new VectorSearchEngine()

// Search utilities
export const searchUtils = {
  /**
   * Debounced search for real-time suggestions
   */
  debouncedSearch: (
    callback: (query: string) => Promise<void>,
    delay = 300
  ) => {
    let timeoutId: NodeJS.Timeout
    
    return (query: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => callback(query), delay)
    }
  },
  
  /**
   * Highlight query terms in text
   */
  highlightTerms: (text: string, query: string): string => {
    const terms = query.toLowerCase().split(/\s+/)
    let highlighted = text
    
    for (const term of terms) {
      const regex = new RegExp(`(${term})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    }
    
    return highlighted
  },
  
  /**
   * Format search result snippet
   */
  formatSnippet: (content: string, maxLength = 150): string => {
    if (content.length <= maxLength) return content
    
    const truncated = content.slice(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    return lastSpace > 0 
      ? truncated.slice(0, lastSpace) + '...'
      : truncated + '...'
  }
}