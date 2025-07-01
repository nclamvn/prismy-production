/**
 * Enterprise Analytics & Metrics Engine
 * Advanced reporting, insights, and business intelligence
 */

import { createServiceRoleClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Always use service role client for server-side analytics processing
function getSupabaseClient() {
  return createServiceRoleClient()
}

export interface MetricDefinition {
  id: string
  name: string
  type: 'count' | 'sum' | 'avg' | 'rate' | 'ratio' | 'unique'
  category: 'usage' | 'performance' | 'business' | 'quality' | 'security'
  query: string
  dimensions: string[]
  filters?: Record<string, any>
  aggregation: 'daily' | 'weekly' | 'monthly' | 'hourly'
  unit?: string
  description?: string
}

export interface MetricValue {
  metricId: string
  value: number
  dimensions: Record<string, any>
  timestamp: Date
  period: string
}

export interface AnalyticsQuery {
  metrics: string[]
  dimensions?: string[]
  filters?: Record<string, any>
  dateRange: {
    start: Date
    end: Date
  }
  granularity: 'hour' | 'day' | 'week' | 'month'
  limit?: number
  organizationId?: string
  userId?: string
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'heatmap'
  title: string
  query: AnalyticsQuery
  config: Record<string, any>
  position: { x: number; y: number; w: number; h: number }
}

export interface AnalyticsDashboard {
  id: string
  name: string
  description?: string
  widgets: DashboardWidget[]
  isPublic: boolean
  organizationId?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export class MetricsEngine {
  private static instance: MetricsEngine
  private metricDefinitions = new Map<string, MetricDefinition>()

  private constructor() {
    this.initializeDefaultMetrics()
  }

  static getInstance(): MetricsEngine {
    if (!MetricsEngine.instance) {
      MetricsEngine.instance = new MetricsEngine()
    }
    return MetricsEngine.instance
  }

  private initializeDefaultMetrics() {
    const defaultMetrics: MetricDefinition[] = [
      // Usage Metrics
      {
        id: 'documents_uploaded',
        name: 'Documents Uploaded',
        type: 'count',
        category: 'usage',
        query: 'SELECT COUNT(*) FROM documents WHERE created_at BETWEEN $1 AND $2',
        dimensions: ['user_id', 'organization_id', 'document_type'],
        aggregation: 'daily',
        unit: 'documents',
        description: 'Total number of documents uploaded'
      },
      {
        id: 'translations_completed',
        name: 'Translations Completed',
        type: 'count',
        category: 'usage',
        query: 'SELECT COUNT(*) FROM translations WHERE status = \'completed\' AND completed_at BETWEEN $1 AND $2',
        dimensions: ['source_language', 'target_language', 'user_id', 'organization_id'],
        aggregation: 'daily',
        unit: 'translations',
        description: 'Number of completed translations'
      },
      {
        id: 'storage_used',
        name: 'Storage Used',
        type: 'sum',
        category: 'usage',
        query: 'SELECT COALESCE(SUM((metadata->>\'size\')::bigint), 0) FROM documents WHERE created_at BETWEEN $1 AND $2',
        dimensions: ['user_id', 'organization_id'],
        aggregation: 'daily',
        unit: 'bytes',
        description: 'Total storage used by documents'
      },
      {
        id: 'active_users',
        name: 'Active Users',
        type: 'unique',
        category: 'usage',
        query: 'SELECT COUNT(DISTINCT user_id) FROM usage_logs WHERE event_type = \'login\' AND created_at BETWEEN $1 AND $2',
        dimensions: ['organization_id'],
        aggregation: 'daily',
        unit: 'users',
        description: 'Number of unique active users'
      },

      // Performance Metrics
      {
        id: 'translation_speed',
        name: 'Average Translation Speed',
        type: 'avg',
        category: 'performance',
        query: 'SELECT AVG(processing_time_ms) FROM translations WHERE status = \'completed\' AND completed_at BETWEEN $1 AND $2',
        dimensions: ['target_language', 'service_provider'],
        aggregation: 'daily',
        unit: 'milliseconds',
        description: 'Average time to complete translations'
      },
      {
        id: 'document_processing_time',
        name: 'Document Processing Time',
        type: 'avg',
        category: 'performance',
        query: 'SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000) FROM documents WHERE status = \'processed\' AND updated_at BETWEEN $1 AND $2',
        dimensions: ['document_type', 'file_size_category'],
        aggregation: 'daily',
        unit: 'milliseconds',
        description: 'Average document processing time'
      },
      {
        id: 'api_response_time',
        name: 'API Response Time',
        type: 'avg',
        category: 'performance',
        query: 'SELECT AVG(response_time_ms) FROM api_logs WHERE created_at BETWEEN $1 AND $2',
        dimensions: ['endpoint', 'method'],
        aggregation: 'hourly',
        unit: 'milliseconds',
        description: 'Average API response time'
      },

      // Business Metrics
      {
        id: 'revenue',
        name: 'Revenue',
        type: 'sum',
        category: 'business',
        query: 'SELECT COALESCE(SUM(amount), 0) FROM billing_records WHERE status = \'completed\' AND created_at BETWEEN $1 AND $2',
        dimensions: ['subscription_tier', 'organization_id'],
        aggregation: 'daily',
        unit: 'currency',
        description: 'Total revenue generated'
      },
      {
        id: 'subscription_growth',
        name: 'New Subscriptions',
        type: 'count',
        category: 'business',
        query: 'SELECT COUNT(*) FROM user_subscriptions WHERE created_at BETWEEN $1 AND $2',
        dimensions: ['subscription_tier'],
        aggregation: 'daily',
        unit: 'subscriptions',
        description: 'Number of new subscriptions'
      },
      {
        id: 'churn_rate',
        name: 'Churn Rate',
        type: 'ratio',
        category: 'business',
        query: 'SELECT COUNT(*) FROM user_subscriptions WHERE status = \'cancelled\' AND cancelled_at BETWEEN $1 AND $2',
        dimensions: ['subscription_tier'],
        aggregation: 'monthly',
        unit: 'percentage',
        description: 'Subscription cancellation rate'
      },

      // Quality Metrics
      {
        id: 'translation_quality',
        name: 'Translation Quality Score',
        type: 'avg',
        category: 'quality',
        query: 'SELECT AVG(quality_score) FROM translation_reviews WHERE created_at BETWEEN $1 AND $2',
        dimensions: ['target_language', 'service_provider'],
        aggregation: 'daily',
        unit: 'score',
        description: 'Average translation quality rating'
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        type: 'rate',
        category: 'quality',
        query: 'SELECT COUNT(*) FROM error_logs WHERE created_at BETWEEN $1 AND $2',
        dimensions: ['error_type', 'service'],
        aggregation: 'hourly',
        unit: 'percentage',
        description: 'System error rate'
      },

      // Security Metrics
      {
        id: 'failed_login_attempts',
        name: 'Failed Login Attempts',
        type: 'count',
        category: 'security',
        query: 'SELECT COUNT(*) FROM security_audit_logs WHERE operation = \'login_failed\' AND created_at BETWEEN $1 AND $2',
        dimensions: ['ip_address', 'user_agent'],
        aggregation: 'hourly',
        unit: 'attempts',
        description: 'Number of failed login attempts'
      },
      {
        id: 'suspicious_activities',
        name: 'Suspicious Activities',
        type: 'count',
        category: 'security',
        query: 'SELECT COUNT(*) FROM security_audit_logs WHERE metadata->>\'suspicious\' = \'true\' AND created_at BETWEEN $1 AND $2',
        dimensions: ['operation', 'ip_address'],
        aggregation: 'hourly',
        unit: 'events',
        description: 'Number of suspicious security events'
      }
    ]

    defaultMetrics.forEach(metric => {
      this.metricDefinitions.set(metric.id, metric)
    })
  }

  async collectMetrics(
    metricIds: string[],
    dateRange: { start: Date; end: Date },
    dimensions?: Record<string, any>
  ): Promise<MetricValue[]> {
    const results: MetricValue[] = []

    for (const metricId of metricIds) {
      const metric = this.metricDefinitions.get(metricId)
      if (!metric) {
        logger.warn('Unknown metric ID', { metricId })
        continue
      }

      try {
        const values = await this.executeMetricQuery(metric, dateRange, dimensions)
        results.push(...values)
      } catch (error) {
        logger.error('Failed to collect metric', { error, metricId })
      }
    }

    return results
  }

  private async executeMetricQuery(
    metric: MetricDefinition,
    dateRange: { start: Date; end: Date },
    filters?: Record<string, any>
  ): Promise<MetricValue[]> {
    try {
      let query = metric.query
      const queryParams = [dateRange.start.toISOString(), dateRange.end.toISOString()]

      // Add dimension filters
      if (filters && metric.dimensions.length > 0) {
        const whereClauses = []
        let paramIndex = 3

        for (const [key, value] of Object.entries(filters)) {
          if (metric.dimensions.includes(key)) {
            whereClauses.push(`${key} = $${paramIndex}`)
            queryParams.push(value)
            paramIndex++
          }
        }

        if (whereClauses.length > 0) {
          query += ` AND ${whereClauses.join(' AND ')}`
        }
      }

      // Add dimension grouping for aggregation
      if (metric.dimensions.length > 0 && metric.type !== 'unique') {
        const groupByDimensions = metric.dimensions.filter(dim => 
          !filters || !filters.hasOwnProperty(dim)
        )
        
        if (groupByDimensions.length > 0) {
          query = query.replace('SELECT', `SELECT ${groupByDimensions.join(', ')},`)
          query += ` GROUP BY ${groupByDimensions.join(', ')}`
        }
      }

      const { data, error } = await getSupabaseClient().rpc('execute_analytics_query', {
        query_text: query,
        query_params: queryParams
      })

      if (error) throw error

      return this.parseMetricResults(metric, data, dateRange)

    } catch (error) {
      logger.error('Failed to execute metric query', { error, metricId: metric.id })
      throw error
    }
  }

  private parseMetricResults(
    metric: MetricDefinition,
    data: any[],
    dateRange: { start: Date; end: Date }
  ): MetricValue[] {
    const results: MetricValue[] = []

    for (const row of data || []) {
      const dimensions: Record<string, any> = {}
      let value = 0

      // Extract dimensions and value from row
      for (const [key, val] of Object.entries(row)) {
        if (metric.dimensions.includes(key)) {
          dimensions[key] = val
        } else if (typeof val === 'number') {
          value = val
        }
      }

      results.push({
        metricId: metric.id,
        value,
        dimensions,
        timestamp: new Date(),
        period: this.getPeriodKey(dateRange.start, metric.aggregation)
      })
    }

    return results
  }

  private getPeriodKey(date: Date, aggregation: string): string {
    switch (aggregation) {
      case 'hourly':
        return date.toISOString().slice(0, 13) + ':00:00.000Z'
      case 'daily':
        return date.toISOString().slice(0, 10)
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return weekStart.toISOString().slice(0, 10)
      case 'monthly':
        return date.toISOString().slice(0, 7)
      default:
        return date.toISOString().slice(0, 10)
    }
  }

  async executeAnalyticsQuery(query: AnalyticsQuery): Promise<{
    data: any[]
    metadata: {
      metrics: MetricDefinition[]
      dimensions: string[]
      totalRows: number
      executionTime: number
    }
  }> {
    const startTime = Date.now()

    try {
      const metrics = query.metrics.map(id => this.metricDefinitions.get(id)).filter(Boolean) as MetricDefinition[]
      
      if (metrics.length === 0) {
        throw new Error('No valid metrics found')
      }

      // Collect all metrics
      const metricValues = await this.collectMetrics(
        query.metrics,
        query.dateRange,
        query.filters
      )

      // Group and aggregate data
      const groupedData = this.groupMetricsByDimensions(metricValues, query.dimensions || [])
      
      // Apply limits
      const limitedData = query.limit ? groupedData.slice(0, query.limit) : groupedData

      const executionTime = Date.now() - startTime

      return {
        data: limitedData,
        metadata: {
          metrics,
          dimensions: query.dimensions || [],
          totalRows: groupedData.length,
          executionTime
        }
      }

    } catch (error) {
      logger.error('Failed to execute analytics query', { error, query })
      throw error
    }
  }

  private groupMetricsByDimensions(
    metricValues: MetricValue[],
    dimensions: string[]
  ): any[] {
    const groups = new Map<string, any>()

    for (const value of metricValues) {
      const groupKey = dimensions.length > 0 
        ? dimensions.map(dim => value.dimensions[dim] || 'unknown').join('|')
        : 'total'

      if (!groups.has(groupKey)) {
        const group: any = { _groupKey: groupKey }
        
        // Add dimension values
        dimensions.forEach(dim => {
          group[dim] = value.dimensions[dim] || null
        })

        groups.set(groupKey, group)
      }

      const group = groups.get(groupKey)!
      group[value.metricId] = value.value
      group._timestamp = value.timestamp
      group._period = value.period
    }

    return Array.from(groups.values())
  }

  async createDashboard(dashboard: Omit<AnalyticsDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('analytics_dashboards')
        .insert({
          name: dashboard.name,
          description: dashboard.description,
          widgets: dashboard.widgets,
          is_public: dashboard.isPublic,
          organization_id: dashboard.organizationId,
          user_id: dashboard.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error

      logger.info('Analytics dashboard created', { dashboardId: data.id, name: dashboard.name })
      return data.id

    } catch (error) {
      logger.error('Failed to create dashboard', { error })
      throw error
    }
  }

  async getDashboard(dashboardId: string): Promise<AnalyticsDashboard | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('analytics_dashboards')
        .select('*')
        .eq('id', dashboardId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        widgets: data.widgets || [],
        isPublic: data.is_public,
        organizationId: data.organization_id,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

    } catch (error) {
      logger.error('Failed to get dashboard', { error, dashboardId })
      return null
    }
  }

  async generateInsights(
    organizationId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    insights: Array<{
      type: 'trend' | 'anomaly' | 'recommendation'
      title: string
      description: string
      data: any
      severity: 'low' | 'medium' | 'high'
    }>
  }> {
    const insights = []

    try {
      // Usage trend analysis
      const usageMetrics = await this.collectMetrics(
        ['documents_uploaded', 'translations_completed', 'active_users'],
        dateRange,
        { organization_id: organizationId }
      )

      // Analyze growth trends
      const documentTrend = this.analyzeTrend(
        usageMetrics.filter(m => m.metricId === 'documents_uploaded')
      )

      if (documentTrend.growth > 20) {
        insights.push({
          type: 'trend',
          title: 'Document Upload Growth',
          description: `Document uploads have increased by ${documentTrend.growth}% over the selected period`,
          data: documentTrend,
          severity: 'low'
        })
      }

      // Performance anomaly detection
      const performanceMetrics = await this.collectMetrics(
        ['translation_speed', 'api_response_time'],
        dateRange,
        { organization_id: organizationId }
      )

      const slowTranslations = performanceMetrics
        .filter(m => m.metricId === 'translation_speed' && m.value > 5000)

      if (slowTranslations.length > 0) {
        insights.push({
          type: 'anomaly',
          title: 'Slow Translation Performance',
          description: `${slowTranslations.length} translations took longer than expected`,
          data: { slowTranslations: slowTranslations.length },
          severity: 'medium'
        })
      }

      // Cost optimization recommendations
      const costMetrics = await this.collectMetrics(
        ['storage_used', 'revenue'],
        dateRange,
        { organization_id: organizationId }
      )

      const storageUsage = costMetrics.find(m => m.metricId === 'storage_used')
      if (storageUsage && storageUsage.value > 50 * 1024 * 1024 * 1024) { // 50GB
        insights.push({
          type: 'recommendation',
          title: 'High Storage Usage',
          description: 'Consider implementing document archival policies to reduce storage costs',
          data: { storageGB: Math.round(storageUsage.value / (1024 * 1024 * 1024)) },
          severity: 'medium'
        })
      }

      return { insights }

    } catch (error) {
      logger.error('Failed to generate insights', { error, organizationId })
      return { insights: [] }
    }
  }

  private analyzeTrend(values: MetricValue[]): { growth: number; direction: 'up' | 'down' | 'flat' } {
    if (values.length < 2) {
      return { growth: 0, direction: 'flat' }
    }

    const sortedValues = values.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    const first = sortedValues[0].value
    const last = sortedValues[sortedValues.length - 1].value

    const growth = first > 0 ? ((last - first) / first) * 100 : 0
    const direction = growth > 5 ? 'up' : growth < -5 ? 'down' : 'flat'

    return { growth: Math.round(growth), direction }
  }

  getMetricDefinition(metricId: string): MetricDefinition | undefined {
    return this.metricDefinitions.get(metricId)
  }

  getAllMetricDefinitions(): MetricDefinition[] {
    return Array.from(this.metricDefinitions.values())
  }

  registerCustomMetric(metric: MetricDefinition): void {
    this.metricDefinitions.set(metric.id, metric)
    logger.info('Custom metric registered', { metricId: metric.id })
  }
}