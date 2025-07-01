import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    console.log('[debug-insert] Starting direct insert test')
    
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

    console.log('[debug-insert] Created Supabase client')

    // Replicate exact insert operation from upload route
    const jobId = uuidv4()
    const sessionId = 'test-session-debug-' + Date.now()
    const storagePath = `uploads/${sessionId}/${jobId}.pdf`
    
    const insertData = {
      id: jobId,
      user_id: null, // Anonymous upload - no user_id
      session_id: sessionId, // Use session_id for anonymous users
      filename: jobId,
      original_name: 'test-file.pdf',
      file_size: 12345,
      mime_type: 'application/pdf',
      storage_path: `mock://${storagePath}`, // Mock path for debugging
      pages: 1,
      status: 'queued' as const,
      progress: 0
    }
    
    console.log('[debug-insert] Insert data prepared:', insertData)
    
    let insertResult = null
    let insertError = null
    
    try {
      console.log('[debug-insert] Executing database insert...')
      const result = await supabase
        .from('translation_jobs')
        .insert(insertData)
        .select()
        .single()
      
      insertResult = result.data
      insertError = result.error
      
      console.log('[debug-insert] Insert completed:', { 
        success: !insertError, 
        jobId: insertResult?.id,
        hasData: !!insertResult 
      })
      
      if (insertError) {
        console.error('[debug-insert] Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          fullError: JSON.stringify(insertError, null, 2)
        })
      }
    } catch (dbErr) {
      console.error('[debug-insert] Database operation exception:', dbErr)
      insertError = dbErr
      insertResult = null
    }
    
    // Clean up test data if insert succeeded
    if (!insertError && insertResult) {
      try {
        await supabase
          .from('translation_jobs')
          .delete()
          .eq('id', jobId)
        console.log('[debug-insert] Cleaned up test data')
      } catch (cleanupErr) {
        console.error('[debug-insert] Cleanup failed:', cleanupErr)
      }
    }

    return NextResponse.json({
      success: !insertError,
      environment: envCheck,
      test_data: insertData,
      insert_result: {
        success: !insertError,
        data: insertResult,
        error: insertError ? {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        } : null
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[debug-insert] Critical error:', error)
    return NextResponse.json({
      error: 'Insert debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}