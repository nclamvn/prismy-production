import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

interface RealTimeMetrics {
  totalCost: number
  costChange24h: number
  activeJobs: number
  completedToday: number
  errorRate: number
  avgResponseTime: number
  topProviders: {
    name: string
    cost: number
    requests: number
    errorRate: number
  }[]
  costTrend: {
    time: string
    cost: number
    requests: number
  }[]
  userActivity: {
    userId: string
    email: string
    cost: number
    requests: number
    lastActive: string
  }[]
  insights: {
    id: string
    type: 'cost_spike' | 'error_increase' | 'efficiency_drop' | 'recommendation'
    title: string
    description: string
    severity: 'low' | 'medium' | 'high'
    actionRequired: boolean
    createdAt: string
  }[]
}

// Cache for real-time data (30 second TTL)
let cachedMetrics: RealTimeMetrics | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30 * 1000

function getPeriodDates(period: string) {
  const end = new Date()
  const start = new Date()
  
  switch (period) {
    case '1h':
      start.setHours(end.getHours() - 1)
      break
    case '24h':
      start.setHours(end.getHours() - 24)
      break
    case '7d':
      start.setDate(end.getDate() - 7)
      break
    default:
      start.setHours(end.getHours() - 24)
  }
  
  return { start, end }
}

function calculateCost(inputTokens: number, outputTokens: number, provider: string, model: string): number {
  const rates: any = {
    openai: {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    },
    anthropic: {
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 }
    },
    google: {
      'gemini-pro': { input: 0.00025, output: 0.0005 }
    }
  }

  const providerRates = rates[provider]
  if (!providerRates) return 0.001 // Fallback rate

  const modelRates = providerRates[model] || Object.values(providerRates)[0]
  const inputCost = (inputTokens / 1000) * modelRates.input
  const outputCost = (outputTokens / 1000) * modelRates.output
  
  return inputCost + outputCost
}

function generateTimePoints(start: Date, end: Date, period: string): string[] {
  const points: string[] = []
  const current = new Date(start)
  
  let intervalMs: number
  switch (period) {
    case '1h':
      intervalMs = 5 * 60 * 1000 // 5 minutes
      break
    case '24h':
      intervalMs = 60 * 60 * 1000 // 1 hour  
      break
    case '7d':
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
    default:
      intervalMs = 60 * 60 * 1000
  }
  
  while (current <= end) {
    points.push(current.toISOString())
    current.setTime(current.getTime() + intervalMs)
  }
  
  return points
}

async function generateInsights(
  currentMetrics: any,
  previousMetrics: any,
  errorRate: number,
  avgResponseTime: number
): Promise<RealTimeMetrics['insights']> {
  const insights: RealTimeMetrics['insights'] = []
  
  // Cost spike detection
  if (currentMetrics.totalCost > previousMetrics.totalCost * 1.5) {
    insights.push({
      id: `cost_spike_${Date.now()}`,
      type: 'cost_spike',
      title: 'Unusual Cost Increase Detected',
      description: `Current period cost is ${((currentMetrics.totalCost / previousMetrics.totalCost - 1) * 100).toFixed(1)}% higher than previous period. Review high-cost operations.`,
      severity: 'high',
      actionRequired: true,
      createdAt: new Date().toISOString()
    })
  }
  
  // Error rate monitoring
  if (errorRate > 5) {
    insights.push({
      id: `error_spike_${Date.now()}`,
      type: 'error_increase',
      title: 'High Error Rate Detected',
      description: `Current error rate of ${errorRate.toFixed(1)}% exceeds normal thresholds. Check provider status and retry logic.`,
      severity: errorRate > 10 ? 'high' : 'medium',
      actionRequired: errorRate > 10,
      createdAt: new Date().toISOString()
    })
  }
  
  // Response time monitoring
  if (avgResponseTime > 5000) {
    insights.push({
      id: `latency_spike_${Date.now()}`,
      type: 'efficiency_drop',
      title: 'High Response Times Detected',
      description: `Average response time of ${avgResponseTime}ms is unusually high. Consider load balancing or provider optimization.`,
      severity: avgResponseTime > 10000 ? 'high' : 'medium',
      actionRequired: avgResponseTime > 10000,
      createdAt: new Date().toISOString()
    })
  }
  
  // Cost optimization recommendations
  if (currentMetrics.totalCost > 10) {
    const { data: expensiveRequests } = await supabase
      .from('usage_logs')
      .select('metadata')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('metadata->cost', 'is', null)
      .order('metadata->cost', { ascending: false })
      .limit(5)
    
    const hasCostlyRequests = expensiveRequests?.some(req => (req.metadata?.cost || 0) > 0.1)
    
    if (hasCostlyRequests) {
      insights.push({
        id: `optimization_${Date.now()}`,
        type: 'recommendation',
        title: 'Cost Optimization Opportunity',
        description: 'Consider using cheaper models for routine tasks. Switch to Claude-3-Haiku or GPT-3.5-Turbo for basic translations.',
        severity: 'low',
        actionRequired: false,
        createdAt: new Date().toISOString()
      })
    }
  }
  
  return insights
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '24h'
    
    // Return cached data if still fresh
    if (cachedMetrics && Date.now() - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        metrics: cachedMetrics,
        cached: true,
        timestamp: new Date().toISOString()
      })
    }
    
    const { start, end } = getPeriodDates(period)
    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
    
    // Get current period usage logs
    const { data: currentLogs, error: currentError } = await supabase
      .from('usage_logs')
      .select(`
        *,
        users!inner(id, email)
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true })
    
    if (currentError) throw currentError
    
    // Get previous period for comparison
    const { data: previousLogs } = await supabase
      .from('usage_logs')
      .select('*')
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', start.toISOString())
    
    // Get active jobs
    const { data: activeJobs } = await supabase
      .from('translation_jobs')
      .select('count')
      .in('status', ['queued', 'processing'])
    
    // Get completed jobs today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { data: completedJobs } = await supabase
      .from('translation_jobs')
      .select('count')
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString())
    
    // Process current metrics
    const currentMetrics = {
      totalCost: 0,
      totalRequests: currentLogs?.length || 0,
      errors: 0,
      totalResponseTime: 0,
      providers: new Map<string, any>(),
      users: new Map<string, any>()
    }
    
    currentLogs?.forEach(log => {
      const cost = calculateCost(
        log.metadata?.input_tokens || 0,
        log.metadata?.output_tokens || 0,
        log.metadata?.provider || 'unknown',
        log.metadata?.model || 'unknown'
      )
      
      currentMetrics.totalCost += cost
      
      if (log.metadata?.error) {
        currentMetrics.errors++
      }
      
      if (log.metadata?.latency) {
        currentMetrics.totalResponseTime += log.metadata.latency
      }
      
      // Provider stats
      const provider = log.metadata?.provider || 'unknown'
      if (!currentMetrics.providers.has(provider)) {
        currentMetrics.providers.set(provider, {
          name: provider,
          cost: 0,
          requests: 0,
          errors: 0
        })
      }
      const providerStats = currentMetrics.providers.get(provider)
      providerStats.cost += cost
      providerStats.requests++
      if (log.metadata?.error) providerStats.errors++
      
      // User stats
      const userId = log.user_id
      if (!currentMetrics.users.has(userId)) {
        currentMetrics.users.set(userId, {
          userId,
          email: log.users?.email || 'Unknown',
          cost: 0,
          requests: 0,
          lastActive: log.created_at
        })
      }
      const userStats = currentMetrics.users.get(userId)
      userStats.cost += cost
      userStats.requests++
      if (new Date(log.created_at) > new Date(userStats.lastActive)) {
        userStats.lastActive = log.created_at
      }
    })
    
    // Process previous metrics for comparison
    const previousMetrics = {
      totalCost: 0
    }
    
    previousLogs?.forEach(log => {
      const cost = calculateCost(
        log.metadata?.input_tokens || 0,
        log.metadata?.output_tokens || 0,
        log.metadata?.provider || 'unknown',
        log.metadata?.model || 'unknown'
      )
      previousMetrics.totalCost += cost
    })
    
    // Calculate derived metrics
    const errorRate = currentMetrics.totalRequests > 0 
      ? (currentMetrics.errors / currentMetrics.totalRequests) * 100 
      : 0
    
    const avgResponseTime = currentMetrics.totalRequests > 0
      ? currentMetrics.totalResponseTime / currentMetrics.totalRequests
      : 0
    
    const costChange24h = previousMetrics.totalCost > 0
      ? ((currentMetrics.totalCost - previousMetrics.totalCost) / previousMetrics.totalCost) * 100
      : 0
    
    // Generate time series data
    const timePoints = generateTimePoints(start, end, period)
    const costTrend = timePoints.map(timePoint => {
      const pointEnd = new Date(timePoint)
      const pointStart = new Date(pointEnd.getTime() - (period === '1h' ? 5 * 60 * 1000 : period === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
      
      const pointLogs = currentLogs?.filter(log => {
        const logTime = new Date(log.created_at)
        return logTime >= pointStart && logTime < pointEnd
      }) || []
      
      const pointCost = pointLogs.reduce((sum, log) => {
        return sum + calculateCost(
          log.metadata?.input_tokens || 0,
          log.metadata?.output_tokens || 0,
          log.metadata?.provider || 'unknown',
          log.metadata?.model || 'unknown'
        )
      }, 0)
      
      return {
        time: timePoint,
        cost: pointCost,
        requests: pointLogs.length
      }
    })
    
    // Top providers
    const topProviders = Array.from(currentMetrics.providers.values())
      .map(provider => ({
        ...provider,
        errorRate: provider.requests > 0 ? (provider.errors / provider.requests) * 100 : 0
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
    
    // Top users
    const userActivity = Array.from(currentMetrics.users.values())
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
    
    // Generate insights
    const insights = await generateInsights(
      currentMetrics,
      previousMetrics,
      errorRate,
      avgResponseTime
    )
    
    const metrics: RealTimeMetrics = {
      totalCost: currentMetrics.totalCost,
      costChange24h,
      activeJobs: activeJobs?.[0]?.count || 0,
      completedToday: completedJobs?.[0]?.count || 0,
      errorRate,
      avgResponseTime,
      topProviders,
      costTrend,
      userActivity,
      insights
    }
    
    // Cache the result
    cachedMetrics = metrics
    cacheTimestamp = Date.now()
    
    return NextResponse.json({
      success: true,
      metrics,
      period,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    logger.error('Real-time cost API error', { error })
    return NextResponse.json(
      { error: 'Failed to fetch real-time metrics' },
      { status: 500 }
    )
  }
}