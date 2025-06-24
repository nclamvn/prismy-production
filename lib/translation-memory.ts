/**
 * PRISMY TRANSLATION MEMORY SYSTEM
 * Advanced translation memory for consistency and efficiency
 * Stores, retrieves, and manages translation pairs with fuzzy matching
 */

export interface TranslationMemoryEntry {
  id: string
  sourceText: string
  targetText: string
  sourceLang: string
  targetLang: string
  
  // Context and metadata
  context?: string
  domain?: string
  category?: string
  
  // Quality metrics
  confidence: number
  qualityScore: number
  
  // Usage statistics
  usageCount: number
  lastUsed: Date
  createdAt: Date
  
  // User and source info
  userId?: string
  source: 'human' | 'ai' | 'imported' | 'auto'
  
  // Document context
  documentId?: string
  documentType?: string
  
  // Approval status
  approved: boolean
  reviewedBy?: string
  reviewedAt?: Date
}

export interface TranslationMatch {
  entry: TranslationMemoryEntry
  matchScore: number
  matchType: 'exact' | 'fuzzy' | 'context' | 'similar'
  sourceAlignment?: number
  targetAlignment?: number
}

export interface FuzzyMatchOptions {
  minScore: number
  maxResults: number
  enableContextMatching: boolean
  enableDomainFiltering: boolean
  preferApproved: boolean
  weightByUsage: boolean
}

export interface TranslationMemoryStats {
  totalEntries: number
  approvedEntries: number
  languagePairs: Array<{
    source: string
    target: string
    count: number
  }>
  domains: Array<{
    name: string
    count: number
  }>
  qualityDistribution: {
    excellent: number // 90-100%
    good: number      // 70-89%
    fair: number      // 50-69%
    poor: number      // 0-49%
  }
  usageStats: {
    totalHits: number
    exactMatches: number
    fuzzyMatches: number
    averageConfidence: number
  }
}

class TranslationMemoryService {
  private cache = new Map<string, TranslationMemoryEntry[]>()
  private indexCache = new Map<string, Map<string, TranslationMemoryEntry[]>>()
  
  private defaultFuzzyOptions: FuzzyMatchOptions = {
    minScore: 0.7,
    maxResults: 10,
    enableContextMatching: true,
    enableDomainFiltering: true,
    preferApproved: true,
    weightByUsage: true
  }

  /**
   * Add a new translation memory entry
   */
  async addEntry(entry: Omit<TranslationMemoryEntry, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>): Promise<string> {
    try {
      const tmEntry: TranslationMemoryEntry = {
        ...entry,
        id: this.generateId(),
        usageCount: 0,
        lastUsed: new Date(),
        createdAt: new Date()
      }

      // Store in database (would be implemented with actual DB)
      await this.storeEntry(tmEntry)
      
      // Update cache
      this.updateCache(tmEntry)
      
      console.info('[Translation Memory] Added new entry:', {
        id: tmEntry.id,
        sourceLength: tmEntry.sourceText.length,
        targetLength: tmEntry.targetText.length,
        confidence: tmEntry.confidence
      })

      return tmEntry.id

    } catch (error) {
      console.error('[Translation Memory] Failed to add entry:', error)
      throw new Error(`Failed to add translation memory entry: ${error}`)
    }
  }

  /**
   * Find translation matches for given source text
   */
  async findMatches(
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    context?: string,
    options: Partial<FuzzyMatchOptions> = {}
  ): Promise<TranslationMatch[]> {
    const searchOptions = { ...this.defaultFuzzyOptions, ...options }
    
    try {
      // 1. Try exact match first
      const exactMatches = await this.findExactMatches(sourceText, sourceLang, targetLang)
      
      if (exactMatches.length > 0) {
        const matches = exactMatches.map(entry => ({
          entry,
          matchScore: 1.0,
          matchType: 'exact' as const,
          sourceAlignment: 1.0,
          targetAlignment: 1.0
        }))
        
        // Update usage statistics
        await this.updateUsageStats(exactMatches)
        return matches
      }

      // 2. Fuzzy matching
      const fuzzyMatches = await this.findFuzzyMatches(
        sourceText, 
        sourceLang, 
        targetLang, 
        context,
        searchOptions
      )

      // 3. Context-based matching
      if (searchOptions.enableContextMatching && context) {
        const contextMatches = await this.findContextMatches(
          sourceText,
          sourceLang,
          targetLang,
          context,
          searchOptions
        )
        fuzzyMatches.push(...contextMatches)
      }

      // 4. Sort and filter results
      const sortedMatches = this.sortAndFilterMatches(fuzzyMatches, searchOptions)
      
      // Update usage stats for used entries
      const usedEntries = sortedMatches.map(m => m.entry)
      await this.updateUsageStats(usedEntries)
      
      return sortedMatches

    } catch (error) {
      console.error('[Translation Memory] Failed to find matches:', error)
      return []
    }
  }

  /**
   * Batch import translation memories from various sources
   */
  async importBatch(
    translations: Array<{
      sourceText: string
      targetText: string
      sourceLang: string
      targetLang: string
      context?: string
      domain?: string
      confidence?: number
      source?: 'human' | 'ai' | 'imported'
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ imported: number; failed: number; duplicates: number }> {
    const results = {
      imported: 0,
      failed: 0,
      duplicates: 0
    }

    for (let i = 0; i < translations.length; i++) {
      try {
        const translation = translations[i]
        
        // Check for duplicates
        const existing = await this.findExactMatches(
          translation.sourceText,
          translation.sourceLang,
          translation.targetLang
        )

        if (existing.length > 0) {
          results.duplicates++
        } else {
          await this.addEntry({
            sourceText: translation.sourceText,
            targetText: translation.targetText,
            sourceLang: translation.sourceLang,
            targetLang: translation.targetLang,
            context: translation.context,
            domain: translation.domain,
            confidence: translation.confidence || 0.8,
            qualityScore: translation.confidence || 0.8,
            source: translation.source || 'imported',
            approved: translation.source === 'human'
          })
          results.imported++
        }

        if (onProgress) {
          onProgress(i + 1, translations.length)
        }

      } catch (error) {
        console.error('[Translation Memory] Failed to import entry:', error)
        results.failed++
      }
    }

    return results
  }

  /**
   * Get translation memory statistics
   */
  async getStats(sourceLang?: string, targetLang?: string): Promise<TranslationMemoryStats> {
    try {
      // This would query the actual database
      const entries = await this.getAllEntries(sourceLang, targetLang)
      
      const stats: TranslationMemoryStats = {
        totalEntries: entries.length,
        approvedEntries: entries.filter(e => e.approved).length,
        languagePairs: this.calculateLanguagePairs(entries),
        domains: this.calculateDomains(entries),
        qualityDistribution: this.calculateQualityDistribution(entries),
        usageStats: this.calculateUsageStats(entries)
      }

      return stats

    } catch (error) {
      console.error('[Translation Memory] Failed to get stats:', error)
      throw new Error(`Failed to get translation memory stats: ${error}`)
    }
  }

  /**
   * Update an existing translation memory entry
   */
  async updateEntry(
    id: string,
    updates: Partial<Pick<TranslationMemoryEntry, 'targetText' | 'confidence' | 'qualityScore' | 'approved' | 'context' | 'domain'>>
  ): Promise<void> {
    try {
      const entry = await this.getEntryById(id)
      if (!entry) {
        throw new Error(`Translation memory entry not found: ${id}`)
      }

      const updatedEntry = {
        ...entry,
        ...updates,
        lastUsed: new Date()
      }

      await this.storeEntry(updatedEntry)
      this.updateCache(updatedEntry)

      console.info('[Translation Memory] Updated entry:', { id, updates })

    } catch (error) {
      console.error('[Translation Memory] Failed to update entry:', error)
      throw new Error(`Failed to update translation memory entry: ${error}`)
    }
  }

  /**
   * Delete translation memory entry
   */
  async deleteEntry(id: string): Promise<void> {
    try {
      await this.removeEntryFromStorage(id)
      this.removeFromCache(id)
      
      console.info('[Translation Memory] Deleted entry:', { id })

    } catch (error) {
      console.error('[Translation Memory] Failed to delete entry:', error)
      throw new Error(`Failed to delete translation memory entry: ${error}`)
    }
  }

  /**
   * Clean up low-quality or unused entries
   */
  async cleanup(options: {
    minQuality?: number
    minUsage?: number
    olderThanDays?: number
    keepApproved?: boolean
  } = {}): Promise<{ removed: number; kept: number }> {
    const {
      minQuality = 0.3,
      minUsage = 1,
      olderThanDays = 365,
      keepApproved = true
    } = options

    try {
      const allEntries = await this.getAllEntries()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      let removed = 0
      let kept = 0

      for (const entry of allEntries) {
        const shouldRemove = (
          entry.qualityScore < minQuality ||
          entry.usageCount < minUsage ||
          (entry.createdAt < cutoffDate && !entry.approved)
        ) && !(keepApproved && entry.approved)

        if (shouldRemove) {
          await this.deleteEntry(entry.id)
          removed++
        } else {
          kept++
        }
      }

      console.info('[Translation Memory] Cleanup completed:', { removed, kept })
      return { removed, kept }

    } catch (error) {
      console.error('[Translation Memory] Cleanup failed:', error)
      throw new Error(`Translation memory cleanup failed: ${error}`)
    }
  }

  // Private helper methods

  private async findExactMatches(
    sourceText: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationMemoryEntry[]> {
    // In a real implementation, this would query the database
    const cacheKey = `${sourceLang}-${targetLang}`
    const entries = this.cache.get(cacheKey) || []
    
    return entries.filter(entry => 
      entry.sourceText.toLowerCase().trim() === sourceText.toLowerCase().trim()
    )
  }

  private async findFuzzyMatches(
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    context?: string,
    options: FuzzyMatchOptions = this.defaultFuzzyOptions
  ): Promise<TranslationMatch[]> {
    const cacheKey = `${sourceLang}-${targetLang}`
    const entries = this.cache.get(cacheKey) || []
    
    const matches: TranslationMatch[] = []

    for (const entry of entries) {
      const score = this.calculateSimilarity(sourceText, entry.sourceText)
      
      if (score >= options.minScore) {
        matches.push({
          entry,
          matchScore: score,
          matchType: score > 0.95 ? 'exact' : 'fuzzy',
          sourceAlignment: score,
          targetAlignment: score * 0.9 // Approximate target alignment
        })
      }
    }

    return matches
  }

  private async findContextMatches(
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    context: string,
    options: FuzzyMatchOptions
  ): Promise<TranslationMatch[]> {
    const cacheKey = `${sourceLang}-${targetLang}`
    const entries = this.cache.get(cacheKey) || []
    
    const matches: TranslationMatch[] = []

    for (const entry of entries) {
      if (entry.context) {
        const contextScore = this.calculateSimilarity(context, entry.context)
        const textScore = this.calculateSimilarity(sourceText, entry.sourceText)
        
        // Combined score with context weighting
        const combinedScore = (textScore * 0.7) + (contextScore * 0.3)
        
        if (combinedScore >= options.minScore) {
          matches.push({
            entry,
            matchScore: combinedScore,
            matchType: 'context',
            sourceAlignment: textScore,
            targetAlignment: combinedScore
          })
        }
      }
    }

    return matches
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Levenshtein distance-based similarity
    const a = text1.toLowerCase().trim()
    const b = text2.toLowerCase().trim()
    
    if (a === b) return 1.0
    if (a.length === 0 || b.length === 0) return 0.0
    
    const matrix = []
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    const maxLength = Math.max(a.length, b.length)
    const distance = matrix[b.length][a.length]
    return (maxLength - distance) / maxLength
  }

  private sortAndFilterMatches(
    matches: TranslationMatch[],
    options: FuzzyMatchOptions
  ): TranslationMatch[] {
    // Remove duplicates
    const seen = new Set<string>()
    const uniqueMatches = matches.filter(match => {
      const key = `${match.entry.sourceText}-${match.entry.targetText}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort by match score, approval status, and usage
    uniqueMatches.sort((a, b) => {
      // Prefer approved entries
      if (options.preferApproved) {
        if (a.entry.approved && !b.entry.approved) return -1
        if (!a.entry.approved && b.entry.approved) return 1
      }
      
      // Then by match score
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore
      }
      
      // Then by usage count
      if (options.weightByUsage) {
        return b.entry.usageCount - a.entry.usageCount
      }
      
      // Finally by quality score
      return b.entry.qualityScore - a.entry.qualityScore
    })

    return uniqueMatches.slice(0, options.maxResults)
  }

  private async updateUsageStats(entries: TranslationMemoryEntry[]): Promise<void> {
    for (const entry of entries) {
      entry.usageCount++
      entry.lastUsed = new Date()
      await this.storeEntry(entry)
    }
  }

  private generateId(): string {
    return `tm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Database operations (would be implemented with actual DB)
  private async storeEntry(entry: TranslationMemoryEntry): Promise<void> {
    // In a real implementation, this would store in Supabase or similar
    console.log('[Translation Memory] Would store entry in database:', entry.id)
  }

  private async getEntryById(id: string): Promise<TranslationMemoryEntry | null> {
    // Would query database
    return null
  }

  private async getAllEntries(sourceLang?: string, targetLang?: string): Promise<TranslationMemoryEntry[]> {
    // Would query database with filters
    return []
  }

  private async removeEntryFromStorage(id: string): Promise<void> {
    // Would delete from database
    console.log('[Translation Memory] Would delete from database:', id)
  }

  private updateCache(entry: TranslationMemoryEntry): void {
    const cacheKey = `${entry.sourceLang}-${entry.targetLang}`
    const entries = this.cache.get(cacheKey) || []
    
    // Remove existing entry with same ID
    const filtered = entries.filter(e => e.id !== entry.id)
    filtered.push(entry)
    
    this.cache.set(cacheKey, filtered)
  }

  private removeFromCache(id: string): void {
    for (const [key, entries] of this.cache.entries()) {
      const filtered = entries.filter(e => e.id !== id)
      this.cache.set(key, filtered)
    }
  }

  private calculateLanguagePairs(entries: TranslationMemoryEntry[]) {
    const pairs = new Map<string, number>()
    
    for (const entry of entries) {
      const key = `${entry.sourceLang}-${entry.targetLang}`
      pairs.set(key, (pairs.get(key) || 0) + 1)
    }
    
    return Array.from(pairs.entries()).map(([pair, count]) => {
      const [source, target] = pair.split('-')
      return { source, target, count }
    })
  }

  private calculateDomains(entries: TranslationMemoryEntry[]) {
    const domains = new Map<string, number>()
    
    for (const entry of entries) {
      if (entry.domain) {
        domains.set(entry.domain, (domains.get(entry.domain) || 0) + 1)
      }
    }
    
    return Array.from(domains.entries()).map(([name, count]) => ({ name, count }))
  }

  private calculateQualityDistribution(entries: TranslationMemoryEntry[]) {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 }
    
    for (const entry of entries) {
      const score = entry.qualityScore * 100
      if (score >= 90) distribution.excellent++
      else if (score >= 70) distribution.good++
      else if (score >= 50) distribution.fair++
      else distribution.poor++
    }
    
    return distribution
  }

  private calculateUsageStats(entries: TranslationMemoryEntry[]) {
    const totalHits = entries.reduce((sum, e) => sum + e.usageCount, 0)
    const exactMatches = entries.filter(e => e.confidence >= 0.95).length
    const fuzzyMatches = entries.filter(e => e.confidence < 0.95 && e.confidence >= 0.7).length
    const averageConfidence = entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length || 0
    
    return {
      totalHits,
      exactMatches,
      fuzzyMatches,
      averageConfidence
    }
  }
}

// Export singleton instance
export const translationMemory = new TranslationMemoryService()

