import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const startTime = Date.now()
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    region: process.env.VERCEL_REGION || 'unknown',
    requestId: Math.random().toString(36).substring(7),
    checks: {
      api: 'operational',
      database: 'unknown',
      auth: 'unknown'
    }
  }

  try {
    // Check Supabase connection using server client
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )
      
      // Simple database check
      const { error } = await supabase.from('user_credits').select('count').limit(1)
      health.checks.database = error ? 'degraded' : 'operational'
      health.checks.auth = 'operational'
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