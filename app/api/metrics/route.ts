/**
 * PRISMY METRICS API
 * Endpoint for collecting and serving performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface MetricsBatch {
  webVitals: any[]
  apiMetrics: any[]
  timestamp: string
  userAgent?: string
  userId?: string
}

// In-memory storage for metrics (in production, use Redis or database)
const metricsStore = {
  webVitals: [] as any[],
  apiMetrics: [] as any[],
  customMetrics: [] as any[]
}

export async function POST(request: NextRequest) {
  try {
    const batch: MetricsBatch = await request.json()
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown'

    // Validate batch structure
    if (!batch.timestamp) {
      return NextResponse.json(
        { error: 'Missing timestamp in metrics batch' },
        { status: 400 }
      )
    }

    // Process Web Vitals
    if (batch.webVitals && Array.isArray(batch.webVitals)) {
      for (const metric of batch.webVitals) {
        const enhancedMetric = {
          ...metric,
          userAgent,
          ip,
          receivedAt: new Date().toISOString()
        }
        
        metricsStore.webVitals.push(enhancedMetric)
        
        // Log poor metrics
        if (metric.rating === 'poor') {
          logger.warn(`Poor ${metric.name} metric`, {
            value: metric.value,
            url: metric.url,
            userAgent,
            ip
          })
        }
      }
    }

    // Process API Metrics
    if (batch.apiMetrics && Array.isArray(batch.apiMetrics)) {
      for (const metric of batch.apiMetrics) {
        const enhancedMetric = {
          ...metric,
          userAgent,
          ip,
          receivedAt: new Date().toISOString()
        }
        
        metricsStore.apiMetrics.push(enhancedMetric)
        
        // Log slow API calls
        if (metric.responseTime > 5000) {
          logger.warn('Slow API response recorded', {
            endpoint: metric.endpoint,
            responseTime: metric.responseTime,
            statusCode: metric.statusCode
          })
        }
      }
    }

    // Cleanup old metrics (keep last 1000 of each type)
    const maxMetrics = 1000
    if (metricsStore.webVitals.length > maxMetrics) {
      metricsStore.webVitals = metricsStore.webVitals.slice(-maxMetrics)
    }
    if (metricsStore.apiMetrics.length > maxMetrics) {
      metricsStore.apiMetrics = metricsStore.apiMetrics.slice(-maxMetrics)
    }

    logger.info('Metrics batch processed', {
      webVitalsCount: batch.webVitals?.length || 0,
      apiMetricsCount: batch.apiMetrics?.length || 0,
      userAgent: userAgent.substring(0, 100), // Truncate for logging
      ip
    })

    return NextResponse.json({
      success: true,
      processed: {
        webVitals: batch.webVitals?.length || 0,
        apiMetrics: batch.apiMetrics?.length || 0
      }
    })

  } catch (error) {
    logger.error('Failed to process metrics batch', { error })
    return NextResponse.json(
      { error: 'Failed to process metrics batch' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'webvitals' | 'api' | 'summary'
    const limit = parseInt(searchParams.get('limit') || '100')
    const since = searchParams.get('since') // ISO timestamp

    let sinceDate: Date | undefined
    if (since) {
      sinceDate = new Date(since)
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid since parameter' },
          { status: 400 }
        )
      }
    }

    const filterBySince = (metrics: any[]) => {
      if (!sinceDate) return metrics
      return metrics.filter(m => new Date(m.receivedAt || m.timestamp) >= sinceDate)
    }

    if (type === 'webvitals') {
      const filtered = filterBySince(metricsStore.webVitals).slice(-limit)
      return NextResponse.json({
        metrics: filtered,
        count: filtered.length,
        type: 'webvitals'
      })
    }

    if (type === 'api') {
      const filtered = filterBySince(metricsStore.apiMetrics).slice(-limit)
      return NextResponse.json({
        metrics: filtered,
        count: filtered.length,
        type: 'api'
      })
    }

    // Default: return summary
    const webVitals = filterBySince(metricsStore.webVitals)
    const apiMetrics = filterBySince(metricsStore.apiMetrics)

    // Calculate Web Vitals summary
    const webVitalsSummary = calculateWebVitalsSummary(webVitals)
    
    // Calculate API summary
    const apiSummary = calculateAPISummary(apiMetrics)

    return NextResponse.json({
      summary: {
        webVitals: webVitalsSummary,
        api: apiSummary,
        counts: {
          webVitals: webVitals.length,
          apiMetrics: apiMetrics.length
        },
        period: {
          since: since || 'all-time',
          until: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    logger.error('Failed to fetch metrics', { error })
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

function calculateWebVitalsSummary(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      CLS: { average: 0, p75: 0, p95: 0, poor: 0, total: 0 },
      FCP: { average: 0, p75: 0, p95: 0, poor: 0, total: 0 },
      FID: { average: 0, p75: 0, p95: 0, poor: 0, total: 0 },
      LCP: { average: 0, p75: 0, p95: 0, poor: 0, total: 0 },
      TTFB: { average: 0, p75: 0, p95: 0, poor: 0, total: 0 },
      INP: { average: 0, p75: 0, p95: 0, poor: 0, total: 0 }
    }
  }

  const vitals = ['CLS', 'FCP', 'FID', 'LCP', 'TTFB', 'INP']
  const summary: any = {}

  vitals.forEach(vital => {
    const vitalMetrics = metrics.filter(m => m.name === vital)
    if (vitalMetrics.length === 0) {
      summary[vital] = { average: 0, p75: 0, p95: 0, poor: 0, total: 0 }
      return
    }

    const values = vitalMetrics.map(m => m.value).sort((a, b) => a - b)
    const poor = vitalMetrics.filter(m => m.rating === 'poor').length
    
    summary[vital] = {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      p75: getPercentile(values, 75),
      p95: getPercentile(values, 95),
      poor,
      total: vitalMetrics.length
    }
  })

  return summary
}

function calculateAPISummary(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      errorRate: 0,
      totalRequests: 0,
      slowRequests: 0,
      byEndpoint: {}
    }
  }

  const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b)
  const errors = metrics.filter(m => m.statusCode >= 400).length
  const slowRequests = metrics.filter(m => m.responseTime > 5000).length

  // Group by endpoint
  const byEndpoint: any = {}
  metrics.forEach(metric => {
    const endpoint = metric.endpoint
    if (!byEndpoint[endpoint]) {
      byEndpoint[endpoint] = {
        count: 0,
        averageResponseTime: 0,
        errors: 0,
        responseTimes: []
      }
    }
    
    byEndpoint[endpoint].count++
    byEndpoint[endpoint].responseTimes.push(metric.responseTime)
    if (metric.statusCode >= 400) {
      byEndpoint[endpoint].errors++
    }
  })

  // Calculate averages for each endpoint
  Object.keys(byEndpoint).forEach(endpoint => {
    const endpointData = byEndpoint[endpoint]
    endpointData.averageResponseTime = endpointData.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / endpointData.responseTimes.length
    endpointData.errorRate = endpointData.errors / endpointData.count
    delete endpointData.responseTimes // Remove raw data
  })

  return {
    averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
    p95ResponseTime: getPercentile(responseTimes, 95),
    errorRate: errors / metrics.length,
    totalRequests: metrics.length,
    slowRequests,
    byEndpoint
  }
}

function getPercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  
  const index = Math.ceil((percentile / 100) * values.length) - 1
  return values[Math.max(0, Math.min(index, values.length - 1))]
}

// Health check for metrics system
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Metrics-Status': 'healthy',
      'X-Metrics-Count': metricsStore.webVitals.length.toString()
    }
  })
}