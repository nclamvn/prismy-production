import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB for chunked uploads
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

/**
 * Initialize chunked upload
 * Creates upload session and prepares for chunk uploads
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD INIT] Starting upload initialization')

    // Parse request body
    const body = await request.json()
    const { uploadId, fileName, fileSize, mimeType, totalChunks } = body

    // Validate required fields
    if (!uploadId || !fileName || !fileSize || !mimeType || !totalChunks) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['uploadId', 'fileName', 'fileSize', 'mimeType', 'totalChunks'] },
        { status: 400 }
      )
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Unsupported file type', allowedTypes: ALLOWED_TYPES },
        { status: 422 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Generate session and job IDs
    const sessionId = request.cookies.get('session_id')?.value || uuidv4()
    const jobId = uuidv4()
    const fileExtension = fileName.split('.').pop()
    const storagePath = `uploads/${sessionId}/${jobId}.${fileExtension}`

    // Create upload session record
    const uploadSession = {
      upload_id: uploadId,
      job_id: jobId,
      session_id: sessionId,
      file_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
      storage_path: storagePath,
      total_chunks: totalChunks,
      uploaded_chunks: 0,
      status: 'initialized',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Store upload session
    const { data: sessionData, error: sessionError } = await supabase
      .from('upload_sessions')
      .insert(uploadSession)
      .select()
      .single()

    if (sessionError) {
      console.error('[UPLOAD INIT] Failed to create upload session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to initialize upload session', details: sessionError.message },
        { status: 500 }
      )
    }

    // Create job record
    const estimatedPages = Math.max(1, Math.ceil(fileSize / (1024 * 2)))
    const jobData = {
      id: jobId,
      session_id: sessionId,
      filename: jobId,
      original_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
      storage_path: storagePath,
      pages: estimatedPages,
      status: 'uploading',
      progress: 0,
      upload_id: uploadId,
    }

    const { data: job, error: jobError } = await supabase
      .from('translation_jobs')
      .insert(jobData)
      .select()
      .single()

    if (jobError) {
      console.error('[UPLOAD INIT] Failed to create job record:', jobError)
      // Clean up upload session
      await supabase.from('upload_sessions').delete().eq('upload_id', uploadId)
      
      return NextResponse.json(
        { error: 'Failed to create job record', details: jobError.message },
        { status: 500 }
      )
    }

    console.log('[UPLOAD INIT] Upload session initialized:', {
      uploadId,
      jobId,
      fileName,
      fileSize,
      totalChunks,
    })

    const response = NextResponse.json({
      success: true,
      uploadId,
      jobId,
      sessionId,
      totalChunks,
      status: 'initialized',
    })

    // Set session cookie if not exists
    if (!request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    }

    return response

  } catch (error) {
    console.error('[UPLOAD INIT] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}