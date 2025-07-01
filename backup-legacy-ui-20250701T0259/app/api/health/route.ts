/**
 * PRISMY HEALTH CHECK API
 * Comprehensive health monitoring for production deployment
 * Used by CI/CD pipeline and monitoring systems
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { checkPgBossHealth } from '@/lib/pg-boss-setup'
import { healthCheck as advancedHealthCheck } from '@/lib/load-balancer/health-check'

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    database: HealthCheck
    redis: HealthCheck
    aiServices: HealthCheck
    storage: HealthCheck
    externalApis: HealthCheck
    jobQueue: HealthCheck
  }
  performance: {
    responseTime: number
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage?: number
  }
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  error?: string
  details?: Record<string, any>
}

// Cache health check results for 30 seconds
let cachedResult: HealthCheckResult | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30 * 1000 // 30 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check if request wants advanced health check
    const url = new URL(request.url)
    const advanced = url.searchParams.get('advanced') === 'true'
    
    if (advanced) {
      // Use the advanced health check system
      return await advancedHealthCheck(request)
    }
    
    // Return cached result if still valid
    if (cachedResult && Date.now() - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json(cachedResult, { 
        status: cachedResult.status === 'healthy' ? 200 : 503 
      })
    }

    // Perform health checks
    const result = await performHealthChecks(startTime)
    
    // Cache the result
    cachedResult = result
    cacheTimestamp = Date.now()

    // Determine HTTP status based on overall health
    const httpStatus = result.status === 'healthy' ? 200 : 
                      result.status === 'degraded' ? 200 : 503

    return NextResponse.json(result, { status: httpStatus })

  } catch (error) {
    logger.error({ error }, 'Health check failed')
    
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        redis: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        aiServices: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        storage: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        externalApis: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        jobQueue: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' }
      },
      performance: {
        responseTime: Date.now() - startTime,
        memoryUsage: process.memoryUsage()
      }
    }

    return NextResponse.json(errorResult, { status: 503 })
  }
}

async function performHealthChecks(startTime: number): Promise<HealthCheckResult> {
  // Run all health checks in parallel
  const [database, redis, aiServices, storage, externalApis, jobQueue] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkAIServices(),
    checkStorage(),
    checkExternalAPIs(),
    checkJobQueue()
  ])

  const checks = {
    database: getCheckResult(database),
    redis: getCheckResult(redis),
    aiServices: getCheckResult(aiServices),
    storage: getCheckResult(storage),
    externalApis: getCheckResult(externalApis),
    jobQueue: getCheckResult(jobQueue)
  }

  // Determine overall status
  const healthyCount = Object.values(checks).filter(check => check.status === 'healthy').length
  const unhealthyCount = Object.values(checks).filter(check => check.status === 'unhealthy').length
  
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded'
  if (unhealthyCount === 0) {
    overallStatus = 'healthy'
  } else if (healthyCount >= 3) { // At least 3 services healthy
    overallStatus = 'degraded'
  } else {
    overallStatus = 'unhealthy'
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks,
    performance: {
      responseTime: Date.now() - startTime,
      memoryUsage: process.memoryUsage()
    }
  }
}

function getCheckResult(result: PromiseSettledResult<HealthCheck>): HealthCheck {
  if (result.status === 'fulfilled') {
    return result.value
  } else {
    return {
      status: 'unhealthy',
      responseTime: 0,
      error: result.reason?.message || 'Unknown error'
    }
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createServiceRoleClient()

    // Simple connectivity test
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error && !error.message.includes('relation "health_check" does not exist')) {
      throw error
    }

    const responseTime = Date.now() - startTime

    return {
      status: 'healthy',
      responseTime,
      details: {
        connected: true,
        responseTime
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Skip Redis check if not configured
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: { skipped: true, reason: 'Redis not configured' }
      }
    }

    // Simple Redis ping test
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
      }
    })

    if (!response.ok) {
      throw new Error(`Redis health check failed: ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      status: 'healthy',
      responseTime,
      details: { connected: true }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Redis connection failed'
    }
  }
}

async function checkAIServices(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const checks = []
    
    // Check OpenAI if configured
    if (process.env.OPENAI_API_KEY) {
      checks.push(checkOpenAI())
    }
    
    // Check Anthropic if configured
    if (process.env.ANTHROPIC_API_KEY) {
      checks.push(checkAnthropic())
    }

    if (checks.length === 0) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: { message: 'No AI services configured' }
      }
    }

    const results = await Promise.allSettled(checks)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    
    const responseTime = Date.now() - startTime
    
    if (successCount === 0) {
      return {
        status: 'unhealthy',
        responseTime,
        error: 'All AI services failed'
      }
    } else if (successCount < checks.length) {
      return {
        status: 'degraded',
        responseTime,
        details: { 
          successful: successCount,
          total: checks.length
        }
      }
    }

    return {
      status: 'healthy',
      responseTime,
      details: { 
        services: checks.length,
        allHealthy: true
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'AI services check failed'
    }
  }
}

async function checkOpenAI(): Promise<void> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`OpenAI API check failed: ${response.status}`)
  }
}

async function checkAnthropic(): Promise<void> {
  // Anthropic doesn't have a simple health check endpoint
  // We'll just validate the API key format
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    throw new Error('Invalid Anthropic API key format')
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Skip if cloud storage not configured
    if (!process.env.CLOUD_STORAGE_BUCKET) {
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: { skipped: true, reason: 'Cloud storage not configured' }
      }
    }

    // For now, just return healthy if configured
    // In a real implementation, you would test actual storage connectivity
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: { configured: true }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Storage check failed'
    }
  }
}

async function checkExternalAPIs(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const checks = []

    // Check Google Translate if configured
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      checks.push(checkGoogleTranslate())
    }

    if (checks.length === 0) {
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: { message: 'No external APIs configured' }
      }
    }

    const results = await Promise.allSettled(checks)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    
    const responseTime = Date.now() - startTime
    
    if (successCount === 0) {
      return {
        status: 'degraded', // External APIs are non-critical
        responseTime,
        error: 'All external APIs failed'
      }
    }

    return {
      status: 'healthy',
      responseTime,
      details: { 
        successful: successCount,
        total: checks.length
      }
    }
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'External APIs check failed'
    }
  }
}

async function checkGoogleTranslate(): Promise<void> {
  // Simple validation - just check if the API key is configured
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('Google Translate API key not configured')
  }
}

async function checkJobQueue(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const queueHealth = await checkPgBossHealth()
    
    return {
      status: queueHealth.isHealthy ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - startTime,
      error: queueHealth.error,
      details: queueHealth.queueStats ? {
        queueSize: queueHealth.queueStats,
        version: queueHealth.version
      } : undefined
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Job queue check failed'
    }
  }
}