import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Upload individual file chunk
 * Stores chunk data and updates upload progress
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CHUNK UPLOAD] Processing chunk upload')

    // Parse form data
    const formData = await request.formData()
    const uploadId = formData.get('uploadId') as string
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const chunkData = formData.get('chunkData') as File
    const chunkSize = parseInt(formData.get('chunkSize') as string)

    // Validate required fields
    if (!uploadId || isNaN(chunkIndex) || !chunkData || isNaN(chunkSize)) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['uploadId', 'chunkIndex', 'chunkData', 'chunkSize'] },
        { status: 400 }
      )
    }

    // Validate chunk data
    if (chunkData.size !== chunkSize) {
      return NextResponse.json(
        { error: 'Chunk size mismatch', expected: chunkSize, received: chunkData.size },
        { status: 400 }
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

    // Get upload session
    const { data: session, error: sessionError } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('upload_id', uploadId)
      .single()

    if (sessionError || !session) {
      console.error('[CHUNK UPLOAD] Upload session not found:', sessionError)
      return NextResponse.json(
        { error: 'Upload session not found' },
        { status: 404 }
      )
    }

    // Validate chunk index
    if (chunkIndex < 0 || chunkIndex >= session.total_chunks) {
      return NextResponse.json(
        { error: 'Invalid chunk index', index: chunkIndex, totalChunks: session.total_chunks },
        { status: 400 }
      )
    }

    // Check if chunk already uploaded
    const { data: existingChunk } = await supabase
      .from('upload_chunks')
      .select('chunk_index')
      .eq('upload_id', uploadId)
      .eq('chunk_index', chunkIndex)
      .single()

    if (existingChunk) {
      console.log('[CHUNK UPLOAD] Chunk already exists, skipping:', chunkIndex)
      return NextResponse.json({
        success: true,
        chunkIndex,
        status: 'already_uploaded',
      })
    }

    // Convert chunk data to buffer for storage
    const chunkBuffer = Buffer.from(await chunkData.arrayBuffer())

    // Store chunk in temporary storage (in production, use proper cloud storage)
    const chunkStoragePath = `chunks/${uploadId}/${chunkIndex}`

    // For now, store chunk metadata and mark as uploaded
    // In production, you would upload chunkBuffer to cloud storage
    const chunkRecord = {
      upload_id: uploadId,
      chunk_index: chunkIndex,
      chunk_size: chunkSize,
      storage_path: chunkStoragePath,
      uploaded_at: new Date().toISOString(),
      checksum: calculateChecksum(chunkBuffer),
    }

    const { error: chunkError } = await supabase
      .from('upload_chunks')
      .insert(chunkRecord)

    if (chunkError) {
      console.error('[CHUNK UPLOAD] Failed to store chunk record:', chunkError)
      return NextResponse.json(
        { error: 'Failed to store chunk', details: chunkError.message },
        { status: 500 }
      )
    }

    // Update upload session progress
    const uploadedChunks = session.uploaded_chunks + 1
    const progressPercent = Math.round((uploadedChunks / session.total_chunks) * 100)

    const { error: updateError } = await supabase
      .from('upload_sessions')
      .update({
        uploaded_chunks: uploadedChunks,
        progress: progressPercent,
        updated_at: new Date().toISOString(),
        status: uploadedChunks === session.total_chunks ? 'completed' : 'uploading',
      })
      .eq('upload_id', uploadId)

    if (updateError) {
      console.error('[CHUNK UPLOAD] Failed to update progress:', updateError)
      // Don't fail the request, chunk is uploaded successfully
    }

    // Update job progress
    await supabase
      .from('translation_jobs')
      .update({
        progress: progressPercent,
        status: uploadedChunks === session.total_chunks ? 'queued' : 'uploading',
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.job_id)

    console.log('[CHUNK UPLOAD] Chunk uploaded successfully:', {
      uploadId,
      chunkIndex,
      uploadedChunks,
      totalChunks: session.total_chunks,
      progress: progressPercent,
    })

    return NextResponse.json({
      success: true,
      chunkIndex,
      uploadedChunks,
      totalChunks: session.total_chunks,
      progress: progressPercent,
      status: uploadedChunks === session.total_chunks ? 'completed' : 'uploading',
    })

  } catch (error) {
    console.error('[CHUNK UPLOAD] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate checksum
function calculateChecksum(buffer: Buffer): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(buffer).digest('hex')
}