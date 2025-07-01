/**
 * Database Query Optimization System
 * Query analysis, optimization suggestions, and automatic improvements
 */

import { createClientComponentClient, createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { performanceMonitor } from './performance-monitor'
import { cacheManager } from '../cache/cache-manager'
import { logger } from '@/lib/logger'

// Helper function to get appropriate Supabase client based on context
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    // Client-side - use singleton browser client
    return createClientComponentClient()
  } else {
    // Server-side - return null to prevent SSR issues
    // This utility should primarily be used client-side
    console.warn('query-optimizer getSupabaseClient called on server-side')
    return null
  }
}

export interface QueryAnalysis {
  query: string
  executionTime: number
  rowsReturned: number
  rowsExamined: number
  efficiency: number // percentage
  issues: QueryIssue[]
  suggestions: OptimizationSuggestion[]
}

export interface QueryIssue {
  type: 'missing_index' | 'full_table_scan' | 'n_plus_one' | 'large_result_set' | 'inefficient_join' | 'suboptimal_where'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: number // 1-10 scale
  affected_tables: string[]
}

export interface OptimizationSuggestion {
  type: 'add_index' | 'rewrite_query' | 'add_cache' | 'partition_table' | 'denormalize' | 'use_materialized_view'
  priority: number // 1-10 scale
  description: string
  estimated_improvement: number // percentage
  implementation: string
  cost: 'low' | 'medium' | 'high'
}

export interface IndexSuggestion {
  table: string
  columns: string[]
  type: 'btree' | 'gin' | 'gist' | 'hash'
  reasoning: string
  estimated_improvement: number
}

export class QueryOptimizer {
  private static instance: QueryOptimizer
  private queryStats = new Map<string, Array<{ time: number; timestamp: Date }>>()
  private slowQueries = new Map<string, QueryAnalysis>()

  private constructor() {
    this.startQueryMonitoring()
  }

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer()
    }
    return QueryOptimizer.instance
  }

  /**
   * Analyze and optimize a query
   */
  async optimizeQuery(query: string, params?: any[]): Promise<{
    optimizedQuery: string
    analysis: QueryAnalysis
    useCache: boolean
    cacheKey?: string
  }> {
    try {
      // Generate cache key for this query
      const cacheKey = this.generateCacheKey(query, params)

      // Check if we have cached results
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        return {
          optimizedQuery: query,
          analysis: cached.analysis,
          useCache: true,
          cacheKey
        }
      }

      // Analyze the original query
      const analysis = await this.analyzeQuery(query, params)

      // Generate optimized version
      const optimizedQuery = this.generateOptimizedQuery(query, analysis)

      // Determine if this query should be cached
      const shouldCache = this.shouldCacheQuery(analysis)

      return {
        optimizedQuery,
        analysis,
        useCache: shouldCache,
        cacheKey: shouldCache ? cacheKey : undefined
      }

    } catch (error) {
      logger.error('Query optimization failed', { error, query })
      return {
        optimizedQuery: query,
        analysis: this.createBasicAnalysis(query),
        useCache: false
      }
    }
  }

  /**
   * Execute optimized query with monitoring
   */
  async executeOptimizedQuery<T>(
    query: string,
    params?: any[],
    options: {
      cacheTTL?: number
      tags?: string[]
      maxCacheSize?: number
    } = {}
  ): Promise<{ data: T; fromCache: boolean; executionTime: number }> {
    const startTime = performance.now()

    try {
      // Optimize the query
      const optimization = await this.optimizeQuery(query, params)

      // Check cache first if recommended
      if (optimization.useCache && optimization.cacheKey) {
        const cached = await cacheManager.get<T>(optimization.cacheKey)
        if (cached) {
          const executionTime = performance.now() - startTime
          
          performanceMonitor.recordMetric({
            name: 'database_query_time',
            value: executionTime,
            unit: 'milliseconds',
            tags: { cached: 'true', optimized: 'true' },
            dimensions: { query: query.substring(0, 100) }
          })

          return { data: cached, fromCache: true, executionTime }
        }
      }

      // Execute the optimized query
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('execute_optimized_query', {
        query_text: optimization.optimizedQuery,
        query_params: params || []
      })

      if (error) throw error

      const executionTime = performance.now() - startTime

      // Record performance metrics
      performanceMonitor.recordMetric({
        name: 'database_query_time',
        value: executionTime,
        unit: 'milliseconds',
        tags: { 
          cached: 'false', 
          optimized: optimization.optimizedQuery !== query ? 'true' : 'false',
          efficiency: optimization.analysis.efficiency.toString()
        },
        dimensions: { 
          query: query.substring(0, 100),
          issues_count: optimization.analysis.issues.length,
          suggestions_count: optimization.analysis.suggestions.length
        }
      })

      // Cache result if recommended
      if (optimization.useCache && optimization.cacheKey) {
        await cacheManager.set(optimization.cacheKey, data, {
          ttl: options.cacheTTL || 3600,
          tags: options.tags || ['database'],
          maxSize: options.maxCacheSize
        })
      }

      // Track query statistics
      this.trackQueryStats(query, executionTime)

      // Check for slow query
      if (executionTime > 1000) {
        this.slowQueries.set(query, optimization.analysis)
      }

      return { data, fromCache: false, executionTime }

    } catch (error) {
      const executionTime = performance.now() - startTime

      performanceMonitor.recordMetric({
        name: 'database_query_time',
        value: executionTime,
        unit: 'milliseconds',
        tags: { cached: 'false', optimized: 'false', status: 'error' },
        dimensions: { query: query.substring(0, 100), error: error.message }
      })

      logger.error('Optimized query execution failed', { error, query, executionTime })
      throw error
    }
  }

  /**
   * Get index suggestions for improving performance
   */
  async getIndexSuggestions(organizationId?: string): Promise<IndexSuggestion[]> {
    try {
      // Analyze slow queries to suggest indexes
      const suggestions: IndexSuggestion[] = []

      for (const [query, analysis] of this.slowQueries.entries()) {
        const indexSuggestions = this.analyzeForIndexes(query, analysis)
        suggestions.push(...indexSuggestions)
      }

      // Get database-specific index suggestions
      const dbSuggestions = await this.getDatabaseIndexSuggestions(organizationId)
      suggestions.push(...dbSuggestions)

      // Deduplicate and prioritize
      return this.prioritizeIndexSuggestions(suggestions)

    } catch (error) {
      logger.error('Failed to get index suggestions', { error })
      return []
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): {
    totalQueries: number
    averageExecutionTime: number
    slowQueries: number
    cachedQueries: number
    optimizedQueries: number
  } {
    let totalQueries = 0
    let totalTime = 0
    let slowQueries = 0

    for (const stats of this.queryStats.values()) {
      totalQueries += stats.length
      totalTime += stats.reduce((sum, stat) => sum + stat.time, 0)
      slowQueries += stats.filter(stat => stat.time > 1000).length
    }

    return {
      totalQueries,
      averageExecutionTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      slowQueries,
      cachedQueries: 0, // Would be tracked by cache manager
      optimizedQueries: 0 // Would be tracked separately
    }
  }

  /**
   * Generate automatic optimization report
   */
  async generateOptimizationReport(): Promise<{
    summary: {
      totalSlowQueries: number
      averageImprovement: number
      suggestedIndexes: number
      estimatedCostSavings: number
    }
    topIssues: QueryIssue[]
    topSuggestions: OptimizationSuggestion[]
    indexSuggestions: IndexSuggestion[]
  }> {
    try {
      const allIssues: QueryIssue[] = []
      const allSuggestions: OptimizationSuggestion[] = []

      // Collect all issues and suggestions from slow queries
      for (const analysis of this.slowQueries.values()) {
        allIssues.push(...analysis.issues)
        allSuggestions.push(...analysis.suggestions)
      }

      // Get index suggestions
      const indexSuggestions = await this.getIndexSuggestions()

      // Calculate metrics
      const totalSlowQueries = this.slowQueries.size
      const averageImprovement = allSuggestions.length > 0 
        ? allSuggestions.reduce((sum, s) => sum + s.estimated_improvement, 0) / allSuggestions.length 
        : 0
      const suggestedIndexes = indexSuggestions.length
      const estimatedCostSavings = this.calculateCostSavings(allSuggestions)

      // Sort and limit results
      const topIssues = allIssues
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 10)

      const topSuggestions = allSuggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10)

      return {
        summary: {
          totalSlowQueries,
          averageImprovement,
          suggestedIndexes,
          estimatedCostSavings
        },
        topIssues,
        topSuggestions,
        indexSuggestions: indexSuggestions.slice(0, 5)
      }

    } catch (error) {
      logger.error('Failed to generate optimization report', { error })
      throw error
    }
  }

  /**
   * Analyze a query for performance issues
   */
  private async analyzeQuery(query: string, params?: any[]): Promise<QueryAnalysis> {
    try {
      // This would typically use EXPLAIN ANALYZE or similar
      // For now, we'll use heuristic analysis

      const issues: QueryIssue[] = []
      const suggestions: OptimizationSuggestion[] = []

      // Check for common issues
      if (query.toLowerCase().includes('select *')) {
        issues.push({
          type: 'large_result_set',
          severity: 'medium',
          description: 'Query selects all columns which may return unnecessary data',
          impact: 6,
          affected_tables: this.extractTables(query)
        })

        suggestions.push({
          type: 'rewrite_query',
          priority: 7,
          description: 'Select only required columns instead of using SELECT *',
          estimated_improvement: 20,
          implementation: 'Replace SELECT * with specific column names',
          cost: 'low'
        })
      }

      if (!query.toLowerCase().includes('limit') && query.toLowerCase().includes('select')) {
        issues.push({
          type: 'large_result_set',
          severity: 'medium',
          description: 'Query has no LIMIT clause and may return excessive rows',
          impact: 5,
          affected_tables: this.extractTables(query)
        })

        suggestions.push({
          type: 'rewrite_query',
          priority: 6,
          description: 'Add LIMIT clause to restrict result set size',
          estimated_improvement: 30,
          implementation: 'Add LIMIT clause with appropriate value',
          cost: 'low'
        })
      }

      if (query.toLowerCase().includes('where') && query.toLowerCase().includes('like')) {
        const likePattern = /'%[^%]*%'/g
        if (likePattern.test(query)) {
          issues.push({
            type: 'inefficient_join',
            severity: 'high',
            description: 'LIKE query with leading wildcard prevents index usage',
            impact: 8,
            affected_tables: this.extractTables(query)
          })

          suggestions.push({
            type: 'add_index',
            priority: 8,
            description: 'Consider full-text search or trigram indexes for text search',
            estimated_improvement: 50,
            implementation: 'CREATE INDEX USING gin(column gin_trgm_ops)',
            cost: 'medium'
          })
        }
      }

      // Calculate efficiency score
      const efficiency = Math.max(0, 100 - (issues.reduce((sum, issue) => sum + issue.impact, 0) * 5))

      return {
        query,
        executionTime: 0, // Would be measured during execution
        rowsReturned: 0, // Would be measured during execution
        rowsExamined: 0, // Would be measured during execution
        efficiency,
        issues,
        suggestions
      }

    } catch (error) {
      logger.error('Query analysis failed', { error, query })
      return this.createBasicAnalysis(query)
    }
  }

  /**
   * Generate optimized version of query
   */
  private generateOptimizedQuery(query: string, analysis: QueryAnalysis): string {
    let optimizedQuery = query

    // Apply simple optimizations based on suggestions
    for (const suggestion of analysis.suggestions) {
      if (suggestion.type === 'rewrite_query') {
        if (suggestion.description.includes('SELECT *')) {
          // This would need more sophisticated parsing in production
          // For now, just flag that optimization is possible
        }
        
        if (suggestion.description.includes('LIMIT')) {
          if (!optimizedQuery.toLowerCase().includes('limit')) {
            optimizedQuery += ' LIMIT 1000' // Default limit
          }
        }
      }
    }

    return optimizedQuery
  }

  /**
   * Determine if query results should be cached
   */
  private shouldCacheQuery(analysis: QueryAnalysis): boolean {
    // Cache if query is expensive and likely to be repeated
    if (analysis.executionTime > 500) return true
    
    // Cache if query has high efficiency (stable results)
    if (analysis.efficiency > 80) return true
    
    // Cache read-only queries
    if (analysis.query.toLowerCase().trim().startsWith('select')) return true

    return false
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(query: string, params?: any[]): string {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase()
    const paramsStr = params ? JSON.stringify(params) : ''
    return `query:${Buffer.from(normalizedQuery + paramsStr).toString('base64').slice(0, 50)}`
  }

  /**
   * Extract table names from query
   */
  private extractTables(query: string): string[] {
    const fromMatch = query.match(/from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi)
    const joinMatch = query.match(/join\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi)
    
    const tables = [
      ...(fromMatch || []).map(m => m.split(/\s+/)[1]),
      ...(joinMatch || []).map(m => m.split(/\s+/)[1])
    ]

    return [...new Set(tables.filter(Boolean))]
  }

  /**
   * Analyze query for potential indexes
   */
  private analyzeForIndexes(query: string, analysis: QueryAnalysis): IndexSuggestion[] {
    const suggestions: IndexSuggestion[] = []

    // Look for WHERE clauses that could benefit from indexes
    const whereMatch = query.match(/where\s+([^;]+)/i)
    if (whereMatch) {
      const whereClause = whereMatch[1]
      const columnMatches = whereClause.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*[=<>]/g)
      
      if (columnMatches) {
        const columns = columnMatches.map(m => m.split(/\s*[=<>]/)[0])
        const tables = this.extractTables(query)
        
        if (tables.length > 0 && columns.length > 0) {
          suggestions.push({
            table: tables[0], // Simplified - would need better parsing
            columns,
            type: 'btree',
            reasoning: 'WHERE clause filtering could benefit from index',
            estimated_improvement: 40
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Get database-specific index suggestions
   */
  private async getDatabaseIndexSuggestions(organizationId?: string): Promise<IndexSuggestion[]> {
    try {
      // This would query database statistics to suggest indexes
      // For now, return common suggestions
      return [
        {
          table: 'documents',
          columns: ['created_at'],
          type: 'btree',
          reasoning: 'Frequently queried by date range',
          estimated_improvement: 30
        },
        {
          table: 'translations',
          columns: ['status', 'created_at'],
          type: 'btree',
          reasoning: 'Composite index for status filtering with date ordering',
          estimated_improvement: 45
        }
      ]
    } catch (error) {
      logger.error('Failed to get database index suggestions', { error })
      return []
    }
  }

  /**
   * Prioritize index suggestions
   */
  private prioritizeIndexSuggestions(suggestions: IndexSuggestion[]): IndexSuggestion[] {
    // Remove duplicates and sort by estimated improvement
    const unique = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => 
        s.table === suggestion.table && 
        JSON.stringify(s.columns) === JSON.stringify(suggestion.columns)
      )
    )

    return unique.sort((a, b) => b.estimated_improvement - a.estimated_improvement)
  }

  /**
   * Calculate estimated cost savings
   */
  private calculateCostSavings(suggestions: OptimizationSuggestion[]): number {
    // Simplified calculation - would be more sophisticated in production
    return suggestions.reduce((total, suggestion) => {
      const savings = suggestion.estimated_improvement * suggestion.priority * 0.1
      return total + savings
    }, 0)
  }

  /**
   * Track query execution statistics
   */
  private trackQueryStats(query: string, executionTime: number): void {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim().slice(0, 100)
    
    if (!this.queryStats.has(normalizedQuery)) {
      this.queryStats.set(normalizedQuery, [])
    }

    const stats = this.queryStats.get(normalizedQuery)!
    stats.push({ time: executionTime, timestamp: new Date() })

    // Keep only last 100 executions per query
    if (stats.length > 100) {
      stats.shift()
    }
  }

  /**
   * Create basic analysis for fallback
   */
  private createBasicAnalysis(query: string): QueryAnalysis {
    return {
      query,
      executionTime: 0,
      rowsReturned: 0,
      rowsExamined: 0,
      efficiency: 50,
      issues: [],
      suggestions: []
    }
  }

  /**
   * Start query monitoring
   */
  private startQueryMonitoring(): void {
    // Clean up old statistics every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      for (const [query, stats] of this.queryStats.entries()) {
        const recentStats = stats.filter(stat => stat.timestamp > oneHourAgo)
        if (recentStats.length === 0) {
          this.queryStats.delete(query)
        } else {
          this.queryStats.set(query, recentStats)
        }
      }

      logger.debug('Cleaned up old query statistics')
    }, 60 * 60 * 1000)
  }
}

// Singleton instance
export const queryOptimizer = QueryOptimizer.getInstance()