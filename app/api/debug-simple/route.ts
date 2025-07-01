import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    console.log('[debug-simple] Starting simple upload test')
    
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    
    console.log('[debug-simple] Environment check:', envCheck)
    
    if (!envCheck.hasUrl || !envCheck.hasServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        environment: envCheck
      }, { status: 500 })
    }

    // Create simple Supabase client (no cookies, no SSR complexity)
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

    console.log('[debug-simple] Created simple Supabase client')

    // Parse form data like the real upload endpoint
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('[debug-simple] File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Generate test data similar to real upload
    const jobId = uuidv4()
    const sessionId = request.cookies.get('session_id')?.value || uuidv4()
    
    console.log('[debug-simple] Generated IDs:', { jobId, sessionId })

    // Try to insert into translation_jobs with minimal data
    const insertData = {
      id: jobId,
      session_id: sessionId,
      user_id: null,
      filename: jobId,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: `test://${sessionId}/${jobId}`,
      pages: 1,
      status: 'queued' as const,
      progress: 0
    }

    console.log('[debug-simple] Attempting database insert with data:', insertData)

    const { data: jobData, error: jobError } = await supabase
      .from('translation_jobs')
      .insert(insertData)
      .select()
      .single()

    console.log('[debug-simple] Insert result:', { 
      success: !jobError, 
      jobId: jobData?.id,
      error: jobError 
    })

    if (jobError) {
      console.error('[debug-simple] Database error details:', {
        message: jobError.message,
        details: jobError.details,
        hint: jobError.hint,
        code: jobError.code
      })

      return NextResponse.json({
        error: 'Database insertion failed',
        details: {
          message: jobError.message,
          details: jobError.details,
          hint: jobError.hint,
          code: jobError.code
        },
        insertData,
        environment: envCheck
      }, { status: 500 })
    }

    // Success response
    const response = NextResponse.json({
      success: true,
      jobId,
      originalName: file.name,
      size: file.size,
      status: 'queued',
      message: 'Simple upload test successful'
    })

    // Set session cookie
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    })

    return response

  } catch (error) {
    console.error('[debug-simple] Critical error:', error)
    return NextResponse.json({
      error: 'Simple upload test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}