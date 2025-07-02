import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Finalize chunked upload
 * Combines chunks and marks upload as complete
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD FINALIZE] Starting upload finalization')

    // Parse request body
    const body = await request.json()
    const { uploadId, totalChunks } = body

    // Validate required fields
    if (!uploadId || !totalChunks) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['uploadId', 'totalChunks'] },
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
      console.error('[UPLOAD FINALIZE] Upload session not found:', sessionError)
      return NextResponse.json(
        { error: 'Upload session not found' },
        { status: 404 }
      )
    }

    // Verify all chunks are uploaded
    const { data: chunks, error: chunksError } = await supabase
      .from('upload_chunks')
      .select('chunk_index, chunk_size, checksum')
      .eq('upload_id', uploadId)
      .order('chunk_index')

    if (chunksError) {
      console.error('[UPLOAD FINALIZE] Failed to get chunks:', chunksError)
      return NextResponse.json(
        { error: 'Failed to retrieve chunks', details: chunksError.message },
        { status: 500 }
      )
    }

    // Validate chunk completeness
    if (!chunks || chunks.length !== totalChunks) {
      return NextResponse.json(
        { error: 'Incomplete upload', expected: totalChunks, found: chunks?.length || 0 },
        { status: 400 }
      )
    }

    // Validate chunk sequence
    for (let i = 0; i < totalChunks; i++) {
      if (!chunks.find(c => c.chunk_index === i)) {
        return NextResponse.json(
          { error: 'Missing chunk', chunkIndex: i },
          { status: 400 }
        )
      }
    }

    // Calculate total size and file integrity
    const totalUploadedSize = chunks.reduce((sum, chunk) => sum + chunk.chunk_size, 0)
    
    if (totalUploadedSize !== session.file_size) {
      return NextResponse.json(
        { error: 'File size mismatch', expected: session.file_size, uploaded: totalUploadedSize },
        { status: 400 }
      )
    }

    // In production, here you would:
    // 1. Combine all chunks into final file
    // 2. Upload to permanent storage (S3, Google Cloud, etc.)
    // 3. Calculate final file checksum
    // 4. Clean up temporary chunks

    // For now, we'll simulate this process
    const finalStoragePath = session.storage_path
    const fileChecksum = chunks.map(c => c.checksum).join('') // Simplified checksum

    // Update upload session to completed
    const { error: sessionUpdateError } = await supabase
      .from('upload_sessions')
      .update({
        status: 'completed',
        final_storage_path: finalStoragePath,
        file_checksum: fileChecksum,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('upload_id', uploadId)

    if (sessionUpdateError) {
      console.error('[UPLOAD FINALIZE] Failed to update session:', sessionUpdateError)
      return NextResponse.json(
        { error: 'Failed to finalize session', details: sessionUpdateError.message },
        { status: 500 }
      )
    }

    // Update job status to queued for processing
    const { error: jobUpdateError } = await supabase
      .from('translation_jobs')
      .update({
        status: 'queued',
        progress: 100,
        storage_path: finalStoragePath,
        file_checksum: fileChecksum,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.job_id)

    if (jobUpdateError) {
      console.error('[UPLOAD FINALIZE] Failed to update job:', jobUpdateError)
      // Don't fail the request, upload is complete
    }

    // Queue background job for processing
    try {
      const jobQueueResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session_id=${session.session_id}`,
        },
        body: JSON.stringify({
          type: 'file-processing',
          payload: {
            jobId: session.job_id,
            fileName: session.file_name,
            fileSize: session.file_size,
            mimeType: session.mime_type,
            storagePath: finalStoragePath,
            uploadId: uploadId,
          },
          priority: 5, // Normal priority
        }),
      })

      if (jobQueueResponse.ok) {
        console.log('[UPLOAD FINALIZE] Background job queued successfully')
      } else {
        console.error('[UPLOAD FINALIZE] Failed to queue background job:', await jobQueueResponse.text())
      }
    } catch (queueError) {
      console.error('[UPLOAD FINALIZE] Error queueing background job:', queueError)
      // Don't fail the request, upload is complete
    }

    // Schedule cleanup of chunks (in production, use background job)
    scheduleChunkCleanup(uploadId).catch(err => {
      console.error('[UPLOAD FINALIZE] Chunk cleanup failed:', err)
    })

    console.log('[UPLOAD FINALIZE] Upload finalized successfully:', {
      uploadId,
      jobId: session.job_id,
      fileName: session.file_name,
      fileSize: session.file_size,
      totalChunks,
    })

    return NextResponse.json({
      success: true,
      uploadId,
      jobId: session.job_id,
      fileName: session.file_name,
      fileSize: session.file_size,
      storagePath: finalStoragePath,
      status: 'completed',
      completedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[UPLOAD FINALIZE] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to schedule chunk cleanup
async function scheduleChunkCleanup(uploadId: string): Promise<void> {
  // In production, you would use a background job queue
  // For now, we'll do immediate cleanup after a delay
  setTimeout(async () => {
    try {
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

      // Delete chunk records
      const { error } = await supabase
        .from('upload_chunks')
        .delete()
        .eq('upload_id', uploadId)

      if (error) {
        console.error('[CLEANUP] Failed to delete chunks:', error)
      } else {
        console.log('[CLEANUP] Chunks cleaned up for upload:', uploadId)
      }
    } catch (error) {
      console.error('[CLEANUP] Error during cleanup:', error)
    }
  }, 5000) // 5 second delay
}