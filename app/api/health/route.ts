import { NextResponse } from 'next/server'
import { getBrowserClient } from '@/lib/supabase-browser'

export async function GET() {
  const startTime = Date.now()
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    region: process.env.VERCEL_REGION || 'unknown',
    checks: {
      api: 'operational',
      database: 'unknown',
      auth: 'unknown'
    }
  }

  try {
    // Check Supabase connection
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = getBrowserClient()
      const { error } = await supabase.auth.getSession()
      health.checks.auth = error ? 'degraded' : 'operational'
      health.checks.database = 'operational'
    }
  } catch (error) {
    health.checks.database = 'degraded'
    health.checks.auth = 'degraded'
  }

  // Calculate response time
  const responseTime = Date.now() - startTime
  health.responseTime = `${responseTime}ms`

  // Overall health status
  const hasIssues = Object.values(health.checks).some(status => status !== 'operational')
  health.status = hasIssues ? 'degraded' : 'healthy'

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}