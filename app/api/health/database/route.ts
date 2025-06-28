/**
 * DATABASE HEALTH CHECK API
 * Detailed database connectivity and performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export interface DatabaseHealthResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  connection: {
    status: 'connected' | 'disconnected'
    responseTime: number
    error?: string
  }
  performance: {
    queryTime: number
    connectionPool?: {
      active: number
      idle: number
      waiting: number
    }
  }
  version?: string
  tables?: {
    accessible: number
    total: number
    errors: string[]
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const result = await checkDatabaseHealth()
    
    const httpStatus = result.status === 'healthy' ? 200 : 
                      result.status === 'degraded' ? 200 : 503

    return NextResponse.json(result, { status: httpStatus })

  } catch (error) {
    logger.error({ error }, 'Database health check failed')
    
    const errorResult: DatabaseHealthResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      connection: {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error'
      },
      performance: {
        queryTime: 0
      }
    }

    return NextResponse.json(errorResult, { status: 503 })
  }
}

async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const startTime = Date.now()
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Database credentials not configured')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Test basic connectivity
  const connectionStart = Date.now()
  
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)

    const connectionTime = Date.now() - connectionStart
    
    if (error) {
      // Try alternative connectivity test
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError && !authError.message.includes('session')) {
        throw error
      }
    }

    // Test query performance
    const queryStart = Date.now()
    await testQueryPerformance(supabase)
    const queryTime = Date.now() - queryStart

    // Test table accessibility
    const tableResults = await checkTableAccessibility(supabase)

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded'
    if (connectionTime > 5000) { // 5 seconds
      status = 'degraded'
    } else if (queryTime > 2000) { // 2 seconds
      status = 'degraded'
    } else if (tableResults.errors.length > 0) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      connection: {
        status: 'connected',
        responseTime: connectionTime
      },
      performance: {
        queryTime,
        // Note: Supabase doesn't expose connection pool metrics directly
      },
      tables: tableResults
    }

  } catch (error) {
    const connectionTime = Date.now() - connectionStart
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      connection: {
        status: 'disconnected',
        responseTime: connectionTime,
        error: error instanceof Error ? error.message : 'Connection failed'
      },
      performance: {
        queryTime: 0
      }
    }
  }
}

async function testQueryPerformance(supabase: any): Promise<void> {
  try {
    // Test a simple query that should always work
    const { data, error } = await supabase
      .rpc('version') // PostgreSQL version function
      .single()

    if (error && !error.message.includes('function "version" does not exist')) {
      throw error
    }
  } catch (error) {
    // If version() doesn't work, try a simple select
    const { data, error: selectError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .limit(1)

    if (selectError) {
      throw selectError
    }
  }
}

async function checkTableAccessibility(supabase: any): Promise<{
  accessible: number
  total: number
  errors: string[]
}> {
  const errors: string[] = []
  let accessible = 0
  let total = 0

  try {
    // Get list of tables in public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')

    if (error) {
      errors.push(`Failed to list tables: ${error.message}`)
      return { accessible: 0, total: 0, errors }
    }

    total = tables?.length || 0

    // Test access to a few key tables
    const testTables = ['users', 'documents', 'translations', 'subscriptions']
    
    for (const tableName of testTables) {
      try {
        const { data, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (!tableError) {
          accessible++
        } else if (!tableError.message.includes('does not exist')) {
          errors.push(`Table ${tableName}: ${tableError.message}`)
        }
      } catch (error) {
        errors.push(`Table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { accessible, total, errors }

  } catch (error) {
    errors.push(`Table accessibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { accessible: 0, total: 0, errors }
  }
}