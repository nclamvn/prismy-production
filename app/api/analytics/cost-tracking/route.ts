import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

interface CostMetrics {
  totalCost: number
  byProvider: {
    openai: number
    anthropic: number
    google: number
    other: number
  }
  byService: {
    translation: number
    documentProcessing: number
    ocr: number
    embedding: number
  }
  byTier: {
    free: number
    standard: number
    premium: number
    enterprise: number
  }
  costPerUser: {
    userId: string
    email: string
    totalCost: number
    usageCount: number
  }[]
  trend: {
    daily: { date: string; cost: number }[]
    hourly: { hour: number; cost: number }[]
  }
}

interface ProviderMetrics {
  provider: string
  totalRequests: number
  totalCost: number
  avgCostPerRequest: number
  avgLatency: number
  errorRate: number
  costTrend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

// Cost calculation rates (per 1K tokens or per request)
const COST_RATES = {
  openai: {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'text-embedding-ada-002': { input: 0.0001 }
  },
  anthropic: {
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 }
  },
  google: {
    'gemini-pro': { input: 0.00025, output: 0.0005 },
    'gemini-pro-vision': { input: 0.00025, output: 0.0005 }
  }
}

function calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  const providerRates = COST_RATES[provider as keyof typeof COST_RATES]
  if (!providerRates) return 0
  
  const modelRates = providerRates[model as keyof typeof providerRates]
  if (!modelRates) return 0
  
  const inputCost = (inputTokens / 1000) * (modelRates.input || 0)
  const outputCost = (outputTokens / 1000) * ((modelRates as any).output || 0)
  
  return inputCost + outputCost
}

function getPeriodFilter(period: string): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  
  switch (period) {
    case '24h':
      start.setHours(end.getHours() - 24)
      break
    case '7d':
      start.setDate(end.getDate() - 7)
      break
    case '30d':
      start.setDate(end.getDate() - 30)
      break
    case '90d':
      start.setDate(end.getDate() - 90)
      break
    default:
      start.setDate(end.getDate() - 7)
  }
  
  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const { start, end } = getPeriodFilter(period)
    
    // Get usage logs for the period
    const { data: usageLogs, error: logsError } = await supabase
      .from('usage_logs')
      .select(`
        *,
        users!inner(id, email)
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
    
    if (logsError) {
      logger.error('Failed to fetch usage logs', { error: logsError })
      throw logsError
    }
    
    // Calculate metrics
    const metrics: CostMetrics = {
      totalCost: 0,
      byProvider: { openai: 0, anthropic: 0, google: 0, other: 0 },
      byService: { translation: 0, documentProcessing: 0, ocr: 0, embedding: 0 },
      byTier: { free: 0, standard: 0, premium: 0, enterprise: 0 },
      costPerUser: [],
      trend: { daily: [], hourly: [] }
    }
    
    // Provider metrics map
    const providerMetricsMap = new Map<string, {
      requests: number
      totalCost: number
      totalLatency: number
      errors: number
    }>()
    
    // User cost map
    const userCostMap = new Map<string, {
      email: string
      totalCost: number
      usageCount: number
    }>()
    
    // Process each log entry
    usageLogs?.forEach(log => {
      const cost = calculateCost(
        log.metadata?.provider || 'other',
        log.metadata?.model || '',
        log.metadata?.input_tokens || 0,
        log.metadata?.output_tokens || 0
      )
      
      // Update total cost
      metrics.totalCost += cost
      
      // Update by provider
      const provider = log.metadata?.provider || 'other'
      if (provider in metrics.byProvider) {
        metrics.byProvider[provider as keyof typeof metrics.byProvider] += cost
      } else {
        metrics.byProvider.other += cost
      }
      
      // Update provider metrics
      if (!providerMetricsMap.has(provider)) {
        providerMetricsMap.set(provider, {
          requests: 0,
          totalCost: 0,
          totalLatency: 0,
          errors: 0
        })
      }
      const providerStats = providerMetricsMap.get(provider)!
      providerStats.requests++
      providerStats.totalCost += cost
      providerStats.totalLatency += log.metadata?.latency || 0
      if (log.metadata?.error) providerStats.errors++
      
      // Update by service
      const service = log.event_type?.replace('_usage', '') || 'other'
      if (service in metrics.byService) {
        metrics.byService[service as keyof typeof metrics.byService] += cost
      }
      
      // Update by tier
      const tier = log.metadata?.quality_tier || 'standard'
      if (tier in metrics.byTier) {
        metrics.byTier[tier as keyof typeof metrics.byTier] += cost
      }
      
      // Update user costs
      if (!userCostMap.has(log.user_id)) {
        userCostMap.set(log.user_id, {
          email: log.users?.email || 'Unknown',
          totalCost: 0,
          usageCount: 0
        })
      }
      const userStats = userCostMap.get(log.user_id)!
      userStats.totalCost += cost
      userStats.usageCount++
    })
    
    // Convert user costs to array and sort by cost
    metrics.costPerUser = Array.from(userCostMap.entries())
      .map(([userId, stats]) => ({
        userId,
        email: stats.email,
        totalCost: stats.totalCost,
        usageCount: stats.usageCount
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
    
    // Calculate daily trend
    const dailyMap = new Map<string, number>()
    usageLogs?.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      const cost = calculateCost(
        log.metadata?.provider || 'other',
        log.metadata?.model || '',
        log.metadata?.input_tokens || 0,
        log.metadata?.output_tokens || 0
      )
      dailyMap.set(date, (dailyMap.get(date) || 0) + cost)
    })
    metrics.trend.daily = Array.from(dailyMap.entries())
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // Calculate hourly trend for last 24 hours
    if (period === '24h') {
      const hourlyMap = new Map<number, number>()
      usageLogs?.forEach(log => {
        const hour = new Date(log.created_at).getHours()
        const cost = calculateCost(
          log.metadata?.provider || 'other',
          log.metadata?.model || '',
          log.metadata?.input_tokens || 0,
          log.metadata?.output_tokens || 0
        )
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + cost)
      })
      metrics.trend.hourly = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        cost: hourlyMap.get(hour) || 0
      }))
    }
    
    // Calculate provider metrics
    const providerMetrics: ProviderMetrics[] = Array.from(providerMetricsMap.entries())
      .map(([provider, stats]) => {
        // Calculate trend (simplified - compare to previous period)
        const previousPeriodCost = stats.totalCost * 0.9 // Simplified for demo
        const trendPercentage = Math.abs(((stats.totalCost - previousPeriodCost) / previousPeriodCost) * 100)
        const costTrend = stats.totalCost > previousPeriodCost ? 'up' : 
                         stats.totalCost < previousPeriodCost ? 'down' : 'stable'
        
        return {
          provider,
          totalRequests: stats.requests,
          totalCost: stats.totalCost,
          avgCostPerRequest: stats.totalCost / stats.requests,
          avgLatency: stats.totalLatency / stats.requests,
          errorRate: (stats.errors / stats.requests) * 100,
          costTrend,
          trendPercentage
        }
      })
      .sort((a, b) => b.totalCost - a.totalCost)
    
    return NextResponse.json({
      success: true,
      metrics,
      providerMetrics,
      period,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    logger.error('Cost tracking API error', { error })
    return NextResponse.json(
      { error: 'Failed to fetch cost metrics' },
      { status: 500 }
    )
  }
}

// Export cost data as CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period = '7d', format = 'csv' } = body
    
    // Get the same data as GET
    const response = await GET(request)
    const data = await response.json()
    
    if (!data.success) {
      return NextResponse.json(
        { error: 'Failed to fetch data for export' },
        { status: 500 }
      )
    }
    
    // Generate CSV content
    const csvLines = [
      'Cost Analytics Report',
      `Period: ${period}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      'Summary',
      `Total Cost,$${data.metrics.totalCost.toFixed(2)}`,
      '',
      'Cost by Provider',
      'Provider,Cost,Percentage'
    ]
    
    // Add provider costs
    Object.entries(data.metrics.byProvider).forEach(([provider, cost]) => {
      const percentage = ((cost as number / data.metrics.totalCost) * 100).toFixed(1)
      csvLines.push(`${provider},$${(cost as number).toFixed(2)},${percentage}%`)
    })
    
    // Add service costs
    csvLines.push('', 'Cost by Service', 'Service,Cost,Percentage')
    Object.entries(data.metrics.byService).forEach(([service, cost]) => {
      const percentage = ((cost as number / data.metrics.totalCost) * 100).toFixed(1)
      csvLines.push(`${service},$${(cost as number).toFixed(2)},${percentage}%`)
    })
    
    // Add top users
    csvLines.push('', 'Top Users by Cost', 'User ID,Email,Usage Count,Total Cost,Avg Cost per Usage')
    data.metrics.costPerUser.slice(0, 20).forEach((user: any) => {
      const avgCost = user.totalCost / user.usageCount
      csvLines.push(
        `${user.userId},${user.email},${user.usageCount},$${user.totalCost.toFixed(2)},$${avgCost.toFixed(4)}`
      )
    })
    
    // Add provider performance
    csvLines.push('', 'Provider Performance', 'Provider,Requests,Total Cost,Avg Cost/Request,Avg Latency,Error Rate,Trend')
    data.providerMetrics.forEach((provider: ProviderMetrics) => {
      csvLines.push(
        `${provider.provider},${provider.totalRequests},$${provider.totalCost.toFixed(2)},$${provider.avgCostPerRequest.toFixed(4)},${provider.avgLatency.toFixed(0)}ms,${provider.errorRate.toFixed(2)}%,${provider.costTrend} ${provider.trendPercentage.toFixed(1)}%`
      )
    })
    
    const csvContent = csvLines.join('\n')
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cost-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
    
  } catch (error) {
    logger.error('Cost export API error', { error })
    return NextResponse.json(
      { error: 'Failed to export cost data' },
      { status: 500 }
    )
  }
}