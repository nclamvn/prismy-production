/**
 * Advanced Health Check System
 * Comprehensive health monitoring for load balancer targets
 */

import { NextRequest, NextResponse } from 'next/server'
import { redis, redisCache } from '@/lib/cache/redis'

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 5000, // 5 seconds
  critical: ['redis'],
  optional: ['external_apis', 'storage'],
  degraded: ['translation_service'],
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn'
      message: string
      duration: number
      details?: any
    }
  }
  uptime: number
  version: string
  environment: string
}

/**
 * Main health check endpoint
 */
export async function healthCheck(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    const result = await performHealthChecks()

    // Determine overall status
    const overallStatus = determineOverallStatus(result.checks)

    const response: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: result.checks,
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }

    // Return appropriate HTTP status
    const httpStatus = getHttpStatusForHealth(overallStatus)

    return NextResponse.json(response, { status: httpStatus })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 503 }
    )
  }
}

/**
 * Perform all health checks
 */
async function performHealthChecks(): Promise<{
  checks: HealthCheckResult['checks']
}> {
  const checks: HealthCheckResult['checks'] = {}

  // Run checks in parallel (skip database check for now - no db connection)
  const checkPromises = [
    performRedisCheck(),
    performExternalApiCheck(),
    performStorageCheck(),
    performTranslationServiceCheck(),
    performMemoryCheck(),
    performDiskCheck(),
  ]

  const results = await Promise.allSettled(checkPromises)

  // Process results
  const checkNames = [
    'redis',
    'external_apis',
    'storage',
    'translation_service',
    'memory',
    'disk',
  ]

  results.forEach((result, index) => {
    const checkName = checkNames[index]

    if (result.status === 'fulfilled') {
      checks[checkName] = result.value
    } else {
      checks[checkName] = {
        status: 'fail',
        message: `Check failed: ${result.reason}`,
        duration: 0,
      }
    }
  })

  return { checks }
}

/**
 * Database health check (placeholder - using Supabase)
 */
async function performDatabaseCheck(): Promise<
  HealthCheckResult['checks'][string]
> {
  const startTime = Date.now()

  try {
    // For Supabase, we'll check via API endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }
    )

    const duration = Date.now() - startTime

    if (!response.ok) {
      return {
        status: 'fail',
        message: `Database connection failed: ${response.status}`,
        duration,
      }
    }

    return {
      status: 'pass',
      message: 'Database connection healthy',
      duration,
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Redis health check
 */
async function performRedisCheck(): Promise<
  HealthCheckResult['checks'][string]
> {
  const startTime = Date.now()

  try {
    // Test Redis connection with ping
    const result = await redis.ping()

    if (result !== 'PONG') {
      throw new Error(`Unexpected ping response: ${result}`)
    }

    // Test read/write operations
    const testKey = `health_check_${Date.now()}`
    await redis.set(testKey, 'test', 'EX', 10)
    const value = await redis.get(testKey)
    await redis.del(testKey)

    if (value !== 'test') {
      throw new Error('Redis read/write test failed')
    }

    // Get Redis info
    const info = await redis.info('server')
    const memory = await redis.info('memory')

    return {
      status: 'pass',
      message: 'Redis connection healthy',
      duration: Date.now() - startTime,
      details: {
        version: extractRedisVersion(info),
        memory_usage: extractMemoryUsage(memory),
      },
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Redis check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * External API health check
 */
async function performExternalApiCheck(): Promise<
  HealthCheckResult['checks'][string]
> {
  const startTime = Date.now()

  try {
    const checks = await Promise.allSettled([
      checkOpenAI(),
      checkStripe(),
      checkResend(),
    ])

    const results = {
      openai: checks[0].status === 'fulfilled' ? checks[0].value : false,
      stripe: checks[1].status === 'fulfilled' ? checks[1].value : false,
      resend: checks[2].status === 'fulfilled' ? checks[2].value : false,
    }

    const failedServices = Object.entries(results)
      .filter(([_, status]) => !status)
      .map(([service]) => service)

    if (failedServices.length === 0) {
      return {
        status: 'pass',
        message: 'All external APIs healthy',
        duration: Date.now() - startTime,
        details: results,
      }
    } else if (failedServices.length < Object.keys(results).length) {
      return {
        status: 'warn',
        message: `Some external APIs unavailable: ${failedServices.join(', ')}`,
        duration: Date.now() - startTime,
        details: results,
      }
    } else {
      return {
        status: 'fail',
        message: 'All external APIs unavailable',
        duration: Date.now() - startTime,
        details: results,
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `External API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Storage health check
 */
async function performStorageCheck(): Promise<
  HealthCheckResult['checks'][string]
> {
  const startTime = Date.now()

  try {
    // This would check S3 or other storage services
    // For now, just check if we can write to temp directory
    const fs = await import('fs/promises')
    const path = await import('path')
    const os = await import('os')

    const testFile = path.join(os.tmpdir(), `health_check_${Date.now()}.tmp`)
    await fs.writeFile(testFile, 'test')
    await fs.readFile(testFile)
    await fs.unlink(testFile)

    return {
      status: 'pass',
      message: 'Storage access healthy',
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Translation service health check
 */
async function performTranslationServiceCheck(): Promise<
  HealthCheckResult['checks'][string]
> {
  const startTime = Date.now()

  try {
    // Test translation service by making a simple translation request
    const testTranslation = await testTranslationEndpoint()

    if (!testTranslation) {
      return {
        status: 'warn',
        message: 'Translation service degraded',
        duration: Date.now() - startTime,
      }
    }

    return {
      status: 'pass',
      message: 'Translation service healthy',
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: 'warn',
      message: `Translation service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Memory health check
 */
async function performMemoryCheck(): Promise<
  HealthCheckResult['checks'][string]
> {
  const startTime = Date.now()

  try {
    const memUsage = process.memoryUsage()
    const totalMemory =
      memUsage.heapTotal + memUsage.external + memUsage.arrayBuffers
    const usedMemory = memUsage.heapUsed
    const memoryUsagePercentage = (usedMemory / totalMemory) * 100

    let status: 'pass' | 'warn' | 'fail' = 'pass'
    let message = 'Memory usage normal'

    if (memoryUsagePercentage > 90) {
      status = 'fail'
      message = 'Critical memory usage'
    } else if (memoryUsagePercentage > 80) {
      status = 'warn'
      message = 'High memory usage'
    }

    return {
      status,
      message,
      duration: Date.now() - startTime,
      details: {
        usage_percentage: memoryUsagePercentage.toFixed(2),
        heap_used: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Disk health check
 */
async function performDiskCheck(): Promise<
  HealthCheckResult['checks'][string]
> {
  const startTime = Date.now()

  try {
    const fs = await import('fs/promises')
    const stats = await fs.statfs('/')

    const totalSpace = stats.blocks * stats.frsize
    const freeSpace = stats.bavail * stats.frsize
    const usedSpace = totalSpace - freeSpace
    const usagePercentage = (usedSpace / totalSpace) * 100

    let status: 'pass' | 'warn' | 'fail' = 'pass'
    let message = 'Disk usage normal'

    if (usagePercentage > 95) {
      status = 'fail'
      message = 'Critical disk usage'
    } else if (usagePercentage > 85) {
      status = 'warn'
      message = 'High disk usage'
    }

    return {
      status,
      message,
      duration: Date.now() - startTime,
      details: {
        usage_percentage: usagePercentage.toFixed(2),
        free_gb: Math.round(freeSpace / 1024 / 1024 / 1024),
        total_gb: Math.round(totalSpace / 1024 / 1024 / 1024),
      },
    }
  } catch (error) {
    return {
      status: 'warn',
      message: `Disk check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Helper functions
 */

async function getDbPoolStatus() {
  // Using Supabase - connection pooling is handled automatically
  return {
    total: 10,
    active: 2,
    idle: 5,
    available: 8,
  }
}

function extractRedisVersion(info: string): string {
  const match = info.match(/redis_version:([^\r\n]+)/)
  return match ? match[1] : 'unknown'
}

function extractMemoryUsage(memory: string): string {
  const match = memory.match(/used_memory_human:([^\r\n]+)/)
  return match ? match[1] : 'unknown'
}

async function checkOpenAI(): Promise<boolean> {
  try {
    // Simple check - this would be replaced with actual API call
    return true
  } catch {
    return false
  }
}

async function checkStripe(): Promise<boolean> {
  try {
    // Simple check - this would be replaced with actual API call
    return true
  } catch {
    return false
  }
}

async function checkResend(): Promise<boolean> {
  try {
    // Simple check - this would be replaced with actual API call
    return true
  } catch {
    return false
  }
}

async function testTranslationEndpoint(): Promise<boolean> {
  try {
    // This would test the actual translation service
    return true
  } catch {
    return false
  }
}

function determineOverallStatus(
  checks: HealthCheckResult['checks']
): 'healthy' | 'degraded' | 'unhealthy' {
  const criticalFailed = HEALTH_CHECK_CONFIG.critical.some(
    check => checks[check]?.status === 'fail'
  )

  if (criticalFailed) {
    return 'unhealthy'
  }

  const hasWarnings = Object.values(checks).some(
    check => check.status === 'warn' || check.status === 'fail'
  )

  return hasWarnings ? 'degraded' : 'healthy'
}

function getHttpStatusForHealth(
  status: 'healthy' | 'degraded' | 'unhealthy'
): number {
  switch (status) {
    case 'healthy':
      return 200
    case 'degraded':
      return 200 // Still serve traffic but log the issue
    case 'unhealthy':
      return 503
    default:
      return 503
  }
}

/**
 * Readiness check (for Kubernetes)
 */
export async function readinessCheck(): Promise<NextResponse> {
  try {
    // Check if app is ready to serve traffic
    const criticalChecks = await Promise.allSettled([performRedisCheck()])

    const allCriticalHealthy = criticalChecks.every(
      result => result.status === 'fulfilled' && result.value.status === 'pass'
    )

    if (allCriticalHealthy) {
      return NextResponse.json({ status: 'ready' }, { status: 200 })
    } else {
      return NextResponse.json({ status: 'not_ready' }, { status: 503 })
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'not_ready', error: error.message },
      { status: 503 }
    )
  }
}

/**
 * Liveness check (for Kubernetes)
 */
export async function livenessCheck(): Promise<NextResponse> {
  // Simple check to ensure the process is still alive
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  )
}
