import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('[debug-db] Starting database debug')
    
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    }
    
    console.log('[debug-db] Environment check:', envCheck)
    
    if (!envCheck.hasUrl || !envCheck.hasServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        environment: envCheck
      }, { status: 500 })
    }

    // Create Supabase client with service role (bypasses RLS)
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    console.log('[debug-db] Created Supabase client')

    // Test 1: Check if translation_jobs table exists
    console.log('[debug-db] Testing translation_jobs table structure')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'translation_jobs' })
      .single()

    console.log('[debug-db] Table info result:', { tableInfo, tableError })

    // Test 2: Try to count rows in translation_jobs
    console.log('[debug-db] Testing translation_jobs select access')
    const { data: countData, error: countError } = await supabase
      .from('translation_jobs')
      .select('count', { count: 'exact', head: true })

    console.log('[debug-db] Count result:', { countData, countError })

    // Test 3: Try a simple insert test (will rollback)
    console.log('[debug-db] Testing translation_jobs insert capability')
    const testData = {
      id: '00000000-0000-0000-0000-000000000000',
      session_id: 'test-session',
      filename: 'test-file',
      original_name: 'test.txt',
      file_size: 100,
      mime_type: 'text/plain',
      storage_path: 'test/path',
      status: 'queued'
    }

    // Try insert with immediate rollback
    const { data: insertData, error: insertError } = await supabase
      .from('translation_jobs')
      .insert(testData)
      .select()

    console.log('[debug-db] Insert test result:', { insertData, insertError })

    // Clean up test data if insert succeeded
    if (!insertError && insertData) {
      await supabase
        .from('translation_jobs')
        .delete()
        .eq('id', testData.id)
      console.log('[debug-db] Cleaned up test data')
    }

    // Test 4: Check user_credits table
    console.log('[debug-db] Testing user_credits table')
    const { data: creditsCount, error: creditsError } = await supabase
      .from('user_credits')
      .select('count', { count: 'exact', head: true })

    console.log('[debug-db] Credits table result:', { creditsCount, creditsError })

    return NextResponse.json({
      success: true,
      environment: envCheck,
      tests: {
        tableInfo: { success: !tableError, error: tableError?.message },
        countAccess: { success: !countError, error: countError?.message },
        insertTest: { 
          success: !insertError, 
          error: insertError?.message,
          details: insertError 
        },
        creditsTable: { success: !creditsError, error: creditsError?.message }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[debug-db] Critical error:', error)
    return NextResponse.json({
      error: 'Database debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}