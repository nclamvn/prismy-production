import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    console.log('[debug-comprehensive] Starting comprehensive database debug')
    
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...',
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    }
    
    if (!envCheck.hasUrl || !envCheck.hasServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        environment: envCheck
      }, { status: 500 })
    }

    // Create multiple Supabase clients with different configurations
    const clients = {
      serviceRole: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      ),
      
      serviceRoleWithBypass: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          db: {
            schema: 'public'
          }
        }
      )
    }

    console.log('[debug-comprehensive] Created Supabase clients')

    const results = {}

    // Test 1: List all tables in the database
    console.log('[debug-comprehensive] Test 1: Listing all tables')
    try {
      const { data: tables, error: tablesError } = await clients.serviceRole
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')
      
      results.tables_list = {
        success: !tablesError,
        tables: tables?.map(t => t.table_name) || [],
        error: tablesError ? {
          message: tablesError.message,
          details: tablesError.details,
          hint: tablesError.hint,
          code: tablesError.code
        } : null
      }
    } catch (err) {
      results.tables_list = {
        success: false,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          type: 'exception'
        }
      }
    }

    // Test 2: Check specific table existence with different approaches
    const tableTests = {}
    
    for (const tableName of ['translation_jobs', 'user_credits', 'chat_messages']) {
      console.log(`[debug-comprehensive] Testing table: ${tableName}`)
      
      // Approach 1: SELECT count
      try {
        const { data, error } = await clients.serviceRole
          .from(tableName)
          .select('count', { count: 'exact', head: true })
        
        tableTests[`${tableName}_count`] = {
          success: !error,
          error: error ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          } : null
        }
      } catch (err) {
        tableTests[`${tableName}_count`] = {
          success: false,
          error: {
            message: err instanceof Error ? err.message : 'Unknown error',
            type: 'exception'
          }
        }
      }

      // Approach 2: SELECT with limit
      try {
        const { data, error } = await clients.serviceRole
          .from(tableName)
          .select('*')
          .limit(1)
        
        tableTests[`${tableName}_select`] = {
          success: !error,
          rowCount: data?.length || 0,
          error: error ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          } : null
        }
      } catch (err) {
        tableTests[`${tableName}_select`] = {
          success: false,
          error: {
            message: err instanceof Error ? err.message : 'Unknown error',
            type: 'exception'
          }
        }
      }
    }

    results.table_tests = tableTests

    // Test 3: Try insert with detailed error capture
    console.log('[debug-comprehensive] Test 3: Insert operation test')
    const jobId = uuidv4()
    const sessionId = 'debug-comprehensive-' + Date.now()
    
    const insertData = {
      id: jobId,
      user_id: null,
      session_id: sessionId,
      filename: 'debug-test',
      original_name: 'debug-test.pdf',
      file_size: 12345,
      mime_type: 'application/pdf',
      storage_path: 'debug://test/path',
      pages: 1,
      status: 'queued',
      progress: 0
    }

    let insertResult = null
    let insertError = null
    let insertErrorDetails = {}

    try {
      console.log('[debug-comprehensive] Executing insert with full error capture...')
      const result = await clients.serviceRole
        .from('translation_jobs')
        .insert(insertData)
        .select()
        .single()
      
      insertResult = result.data
      insertError = result.error
      
      if (result.error) {
        insertErrorDetails = {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code,
          full: JSON.stringify(result.error, null, 2)
        }
      }

      console.log('[debug-comprehensive] Insert result:', { 
        success: !insertError, 
        hasData: !!insertResult,
        errorCode: insertError?.code
      })

    } catch (insertException) {
      console.error('[debug-comprehensive] Insert exception:', insertException)
      insertError = insertException
      insertErrorDetails = {
        message: insertException instanceof Error ? insertException.message : 'Unknown error',
        stack: insertException instanceof Error ? insertException.stack : undefined,
        type: 'exception'
      }
    }

    results.insert_test = {
      success: !insertError,
      data: insertResult,
      error: insertErrorDetails,
      insert_data: insertData
    }

    // Test 4: Check RLS policies
    console.log('[debug-comprehensive] Test 4: RLS policy check')
    try {
      const { data: policies, error: policiesError } = await clients.serviceRole
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'translation_jobs')
      
      results.rls_policies = {
        success: !policiesError,
        policies: policies || [],
        error: policiesError ? {
          message: policiesError.message,
          code: policiesError.code
        } : null
      }
    } catch (rlsErr) {
      results.rls_policies = {
        success: false,
        error: {
          message: rlsErr instanceof Error ? rlsErr.message : 'Unknown error',
          type: 'exception'
        }
      }
    }

    // Clean up test data if insert succeeded
    if (!insertError && insertResult) {
      try {
        await clients.serviceRole
          .from('translation_jobs')
          .delete()
          .eq('id', jobId)
        console.log('[debug-comprehensive] Cleaned up test data')
      } catch (cleanupErr) {
        console.error('[debug-comprehensive] Cleanup failed:', cleanupErr)
      }
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      database_tests: results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[debug-comprehensive] Critical error:', error)
    return NextResponse.json({
      error: 'Comprehensive debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}