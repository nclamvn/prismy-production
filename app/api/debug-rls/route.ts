import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    console.log('[debug-rls] Starting RLS and constraint debug test')
    
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    
    if (!envCheck.hasUrl || !envCheck.hasServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        environment: envCheck
      }, { status: 500 })
    }

    // Create Supabase client with service role (should bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('[debug-rls] Created Supabase client with service role')

    // Test 1: Check table schema and constraints
    let schemaInfo = null
    let schemaError = null
    
    try {
      const { data, error } = await supabase
        .from('translation_jobs')
        .select('*')
        .limit(1)
      
      schemaInfo = { hasAccess: !error, rowCount: data?.length || 0 }
      schemaError = error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      } : null
    } catch (err) {
      schemaError = {
        message: err instanceof Error ? err.message : 'Unknown error',
        type: 'exception'
      }
    }

    // Test 2: Try minimal insert (required fields only)
    const jobId = uuidv4()
    const sessionId = 'debug-' + Date.now()
    
    const minimalData = {
      id: jobId,
      session_id: sessionId,
      filename: 'test',
      original_name: 'test.pdf',
      file_size: 100,
      mime_type: 'application/pdf',
      storage_path: 'test/path'
    }
    
    let minimalResult = null
    let minimalError = null
    
    try {
      console.log('[debug-rls] Trying minimal insert...', minimalData)
      const result = await supabase
        .from('translation_jobs')
        .insert(minimalData)
        .select()
        .single()
      
      minimalResult = result.data
      minimalError = result.error ? {
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
        code: result.error.code,
        fullError: JSON.stringify(result.error)
      } : null
      
    } catch (dbErr) {
      console.error('[debug-rls] Exception during minimal insert:', dbErr)
      minimalError = {
        message: dbErr instanceof Error ? dbErr.message : 'Unknown error',
        stack: dbErr instanceof Error ? dbErr.stack : undefined,
        type: 'exception'
      }
    }
    
    // Test 3: Try with RLS disabled explicitly (if possible)
    let rlsDisabledResult = null
    let rlsDisabledError = null
    
    try {
      // Try to set local session to disable RLS
      await supabase.rpc('set_config', {
        setting_name: 'row_security',
        new_value: 'off',
        is_local: true
      })
      
      const testId = uuidv4()
      const result = await supabase
        .from('translation_jobs')
        .insert({
          id: testId,
          session_id: 'rls-test-' + Date.now(),
          filename: 'rls-test',
          original_name: 'rls-test.pdf',
          file_size: 200,
          mime_type: 'application/pdf',
          storage_path: 'rls-test/path'
        })
        .select()
        .single()
      
      rlsDisabledResult = result.data
      rlsDisabledError = result.error
      
      // Clean up if successful
      if (!result.error && result.data) {
        await supabase
          .from('translation_jobs')
          .delete()
          .eq('id', testId)
      }
      
    } catch (rlsErr) {
      rlsDisabledError = {
        message: rlsErr instanceof Error ? rlsErr.message : 'Unknown error',
        type: 'rls_exception'
      }
    }
    
    // Clean up minimal test data if it was inserted
    if (!minimalError && minimalResult) {
      try {
        await supabase
          .from('translation_jobs')
          .delete()
          .eq('id', jobId)
        console.log('[debug-rls] Cleaned up minimal test data')
      } catch (cleanupErr) {
        console.error('[debug-rls] Cleanup failed:', cleanupErr)
      }
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      tests: {
        schema_access: {
          success: !schemaError,
          info: schemaInfo,
          error: schemaError
        },
        minimal_insert: {
          success: !minimalError,
          data: minimalResult,
          error: minimalError,
          test_data: minimalData
        },
        rls_disabled_insert: {
          success: !rlsDisabledError,
          data: rlsDisabledResult,
          error: rlsDisabledError
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[debug-rls] Critical error:', error)
    return NextResponse.json({
      error: 'RLS debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}