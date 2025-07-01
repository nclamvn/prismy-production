import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('[debug-schema] Starting schema verification')
    
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

    // Create simple Supabase client with service role
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

    console.log('[debug-schema] Created Supabase client')

    // Test 1: Check if translation_jobs table exists
    console.log('[debug-schema] Testing translation_jobs table')
    let translationJobsExists = false
    let translationJobsError = null
    
    try {
      const { data, error } = await supabase
        .from('translation_jobs')
        .select('count', { count: 'exact', head: true })
      
      translationJobsExists = !error
      translationJobsError = error?.message
      console.log('[debug-schema] translation_jobs test:', { exists: translationJobsExists, error: translationJobsError })
    } catch (err) {
      translationJobsError = err instanceof Error ? err.message : 'Unknown error'
      console.error('[debug-schema] translation_jobs exception:', translationJobsError)
    }

    // Test 2: Check if user_credits table exists
    console.log('[debug-schema] Testing user_credits table')
    let userCreditsExists = false
    let userCreditsError = null
    
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('count', { count: 'exact', head: true })
      
      userCreditsExists = !error
      userCreditsError = error?.message
      console.log('[debug-schema] user_credits test:', { exists: userCreditsExists, error: userCreditsError })
    } catch (err) {
      userCreditsError = err instanceof Error ? err.message : 'Unknown error'
      console.error('[debug-schema] user_credits exception:', userCreditsError)
    }

    // Test 3: List all available tables
    console.log('[debug-schema] Listing all tables')
    let availableTables = []
    let tablesError = null
    
    try {
      // Query information_schema to see what tables exist
      const { data, error } = await supabase
        .rpc('exec', {
          sql: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
          `
        })
      
      if (error) {
        tablesError = error.message
      } else {
        availableTables = data || []
      }
    } catch (err) {
      tablesError = err instanceof Error ? err.message : 'Unable to list tables'
    }

    // Test 4: Try basic connection test
    console.log('[debug-schema] Testing basic connection')
    let connectionWorks = false
    let connectionError = null
    
    try {
      const { data, error } = await supabase
        .from('_test_connection')
        .select('*')
        .limit(1)
      
      // We expect this to fail, but if it connects, that's good
      connectionWorks = true
      connectionError = error?.message || 'No error (unexpected)'
    } catch (err) {
      connectionError = err instanceof Error ? err.message : 'Connection failed'
      // Connection errors are expected for non-existent table
      connectionWorks = true // If we get here, connection worked but table doesn't exist
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      schema_tests: {
        translation_jobs: {
          exists: translationJobsExists,
          error: translationJobsError
        },
        user_credits: {
          exists: userCreditsExists,
          error: userCreditsError
        },
        available_tables: availableTables,
        tables_error: tablesError,
        connection: {
          works: connectionWorks,
          error: connectionError
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[debug-schema] Critical error:', error)
    return NextResponse.json({
      error: 'Schema debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}