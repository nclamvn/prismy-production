import { NextRequest, NextResponse } from 'next/server'
import { redisTranslationCache } from '@/lib/redis-translation-cache'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication (admin only)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For now, allow all authenticated users to view cache health
    // In production, you might want to restrict this to admin users
    
    // Get cache health information
    const healthInfo = await redisTranslationCache.getHealthInfo()
    
    // Calculate additional metrics
    const memoryUsageEstimate = healthInfo.fallbackCacheSize * 1024 // Rough estimate in bytes
    
    return NextResponse.json({
      success: true,
      cache: {
        redis: {
          enabled: healthInfo.enabled,
          connected: healthInfo.connected,
          url: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'not_configured'
        },
        stats: healthInfo.stats,
        fallback: {
          inMemoryCacheSize: healthInfo.fallbackCacheSize,
          estimatedMemoryUsage: `${Math.round(memoryUsageEstimate / 1024)}KB`
        },
        performance: {
          hitRate: healthInfo.stats?.hitRate || 0,
          hitRateStatus: healthInfo.stats?.hitRate ? 
            (healthInfo.stats.hitRate >= 0.7 ? 'excellent' : 
             healthInfo.stats.hitRate >= 0.5 ? 'good' : 
             healthInfo.stats.hitRate >= 0.3 ? 'fair' : 'poor') : 'unknown'
        },
        recommendations: generateRecommendations(healthInfo)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cache health check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve cache health information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generateRecommendations(healthInfo: any): string[] {
  const recommendations: string[] = []
  
  if (!healthInfo.enabled) {
    recommendations.push('Configure Redis to enable caching for better performance')
  }
  
  if (healthInfo.enabled && !healthInfo.connected) {
    recommendations.push('Redis connection failed - check configuration and network connectivity')
  }
  
  if (healthInfo.stats) {
    if (healthInfo.stats.hitRate < 0.3) {
      recommendations.push('Low cache hit rate - consider warming cache with popular translations')
    }
    
    if (healthInfo.stats.hitRate >= 0.8) {
      recommendations.push('Excellent cache performance - consider expanding cache coverage')
    }
  }
  
  if (healthInfo.fallbackCacheSize > 1000) {
    recommendations.push('Large in-memory cache detected - Redis connection may be unstable')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Cache is performing well - no action needed')
  }
  
  return recommendations
}