// Advanced Search Engine for Documents and Translations
// Implements full-text search, filters, and sophisticated matching

export interface SearchFilters {
  query?: string
  status?: string[]
  languages?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  fileTypes?: string[]
  minSize?: number
  maxSize?: number
  favorites?: boolean
}

export interface SearchResult {
  id: string
  type: 'document' | 'translation'
  title: string
  excerpt: string
  relevanceScore: number
  metadata: {
    status: string
    language?: string
    fileType?: string
    fileSize?: number
    createdAt: Date
    updatedAt?: Date
  }
  highlights: string[]
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  facets: {
    status: Record<string, number>
    languages: Record<string, number>
    fileTypes: Record<string, number>
  }
  searchTime: number
}

export class SearchEngine {
  private static readonly SEARCH_WEIGHTS = {
    exactMatch: 100,
    titleMatch: 80,
    contentMatch: 40,
    metadataMatch: 20
  }

  private static readonly MAX_EXCERPT_LENGTH = 200
  private static readonly MAX_HIGHLIGHTS = 3

  static async searchDocuments(
    userId: string,
    filters: SearchFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<SearchResponse> {
    const startTime = Date.now()
    
    try {
      // Build base query
      const supabase = await import('@/lib/supabase/client').then(m => m.createClient())
      
      let query = supabase
        .from('documents')
        .select(`
          id,
          file_name,
          file_size,
          file_type,
          status,
          created_at,
          updated_at,
          translations!inner(
            id,
            source_language,
            target_language,
            status,
            created_at
          )
        `)
        .eq('user_id', userId)

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.fileTypes && filters.fileTypes.length > 0) {
        query = query.in('file_type', filters.fileTypes)
      }

      if (filters.minSize) {
        query = query.gte('file_size', filters.minSize)
      }

      if (filters.maxSize) {
        query = query.lte('file_size', filters.maxSize)
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString())
      }

      // Execute query
      const { data: documents, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        throw new Error(`Search query failed: ${error.message}`)
      }

      // Process results and calculate relevance scores
      const results = await this.processSearchResults(documents || [], filters)
      
      // Generate facets
      const facets = await this.generateFacets(userId)

      const searchTime = Date.now() - startTime

      return {
        results,
        totalCount: results.length, // In real implementation, this would be total count from DB
        facets,
        searchTime
      }
    } catch (error) {
      console.error('Search error:', error)
      return {
        results: [],
        totalCount: 0,
        facets: { status: {}, languages: {}, fileTypes: {} },
        searchTime: Date.now() - startTime
      }
    }
  }

  private static async processSearchResults(
    documents: Record<string, unknown>[],
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    for (const doc of documents) {
      // Calculate relevance score
      let score = 0
      const highlights: string[] = []

      if (filters.query) {
        const queryLower = filters.query.toLowerCase()
        const fileName = String(doc.file_name || '').toLowerCase()

        // Exact match bonus
        if (fileName === queryLower) {
          score += this.SEARCH_WEIGHTS.exactMatch
        }

        // Title match
        if (fileName.includes(queryLower)) {
          score += this.SEARCH_WEIGHTS.titleMatch
          highlights.push(this.highlightText(String(doc.file_name), filters.query))
        }

        // File type match
        if (String(doc.file_type || '').toLowerCase().includes(queryLower)) {
          score += this.SEARCH_WEIGHTS.metadataMatch
        }
      } else {
        // Base score for non-query searches
        score = 50
      }

      // Status bonus
      if (String(doc.status) === 'uploaded') score += 10
      if (String(doc.status) === 'translated') score += 20

      // Recency bonus (newer files get higher scores)
      const daysSinceCreation = (Date.now() - new Date(String(doc.created_at)).getTime()) / (1000 * 60 * 60 * 24)
      const recencyBonus = Math.max(0, 10 - Math.floor(daysSinceCreation / 7))
      score += recencyBonus

      results.push({
        id: String(doc.id),
        type: 'document',
        title: String(doc.file_name),
        excerpt: this.generateExcerpt(doc),
        relevanceScore: score,
        metadata: {
          status: String(doc.status),
          fileType: String(doc.file_type),
          fileSize: Number(doc.file_size),
          createdAt: new Date(String(doc.created_at)),
          updatedAt: doc.updated_at ? new Date(String(doc.updated_at)) : undefined
        },
        highlights: highlights.slice(0, this.MAX_HIGHLIGHTS)
      })

      // Add translation results
      if (doc.translations && Array.isArray(doc.translations)) {
        for (const translation of doc.translations) {
          const trans = translation as Record<string, unknown>
          let translationScore = score * 0.8 // Translations get slightly lower base score

          if (filters.languages && filters.languages.includes(String(trans.target_language))) {
            translationScore += 30
          }

          results.push({
            id: String(trans.id),
            type: 'translation',
            title: `${String(doc.file_name)} (${String(trans.target_language)})`,
            excerpt: `Translation to ${String(trans.target_language)}`,
            relevanceScore: translationScore,
            metadata: {
              status: String(trans.status),
              language: String(trans.target_language),
              fileType: String(doc.file_type),
              createdAt: new Date(String(trans.created_at))
            },
            highlights: []
          })
        }
      }
    }

    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private static generateExcerpt(doc: Record<string, unknown>): string {
    const parts = [
      `${this.formatFileSize(Number(doc.file_size) || 0)}`,
      `${String(doc.file_type)}`,
      `Status: ${String(doc.status)}`
    ]

    return parts.join(' • ')
  }

  private static highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private static async generateFacets(
    userId: string
  ): Promise<SearchResponse['facets']> {
    try {
      const supabase = await import('@/lib/supabase/client').then(m => m.createClient())

      // Get status counts
      const { data: statusCounts } = await supabase
        .from('documents')
        .select('status')
        .eq('user_id', userId)

      // Get language counts from translations
      const { data: languageCounts } = await supabase
        .from('translations')
        .select('target_language')
        .eq('user_id', userId)

      // Get file type counts
      const { data: fileTypeCounts } = await supabase
        .from('documents')
        .select('file_type')
        .eq('user_id', userId)

      const facets = {
        status: this.countBy(statusCounts || [], 'status'),
        languages: this.countBy(languageCounts || [], 'target_language'),
        fileTypes: this.countBy(fileTypeCounts || [], 'file_type')
      }

      return facets
    } catch (error) {
      console.error('Facets generation error:', error)
      return { status: {}, languages: {}, fileTypes: {} }
    }
  }

  private static countBy(array: Record<string, unknown>[], key: string): Record<string, number> {
    return array.reduce((acc: Record<string, number>, item) => {
      const value = String(item[key] || '')
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }

  static buildSearchQuery(filters: SearchFilters): string {
    const parts: string[] = []

    if (filters.query) {
      parts.push(`q=${encodeURIComponent(filters.query)}`)
    }

    if (filters.status && filters.status.length > 0) {
      parts.push(`status=${filters.status.join(',')}`)
    }

    if (filters.languages && filters.languages.length > 0) {
      parts.push(`lang=${filters.languages.join(',')}`)
    }

    if (filters.fileTypes && filters.fileTypes.length > 0) {
      parts.push(`type=${filters.fileTypes.join(',')}`)
    }

    if (filters.dateRange) {
      parts.push(`from=${filters.dateRange.start.toISOString()}`)
      parts.push(`to=${filters.dateRange.end.toISOString()}`)
    }

    if (filters.favorites) {
      parts.push('fav=true')
    }

    return parts.length > 0 ? `?${parts.join('&')}` : ''
  }

  static parseSearchQuery(searchParams: URLSearchParams): SearchFilters {
    const filters: SearchFilters = {}

    const query = searchParams.get('q')
    if (query) filters.query = query

    const status = searchParams.get('status')
    if (status) filters.status = status.split(',')

    const languages = searchParams.get('lang')
    if (languages) filters.languages = languages.split(',')

    const fileTypes = searchParams.get('type')
    if (fileTypes) filters.fileTypes = fileTypes.split(',')

    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    if (fromDate && toDate) {
      filters.dateRange = {
        start: new Date(fromDate),
        end: new Date(toDate)
      }
    }

    const favorites = searchParams.get('fav')
    if (favorites === 'true') filters.favorites = true

    return filters
  }
}