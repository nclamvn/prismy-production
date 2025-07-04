import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

interface CompleteUploadRequest {
  uploadId: string
  fileName: string
  fileSize: number
  fileType: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CompleteUploadRequest = await request.json()
    const { uploadId, fileName, fileSize, fileType } = body

    // Verify upload belongs to user and all chunks are uploaded
    const { data: uploadRecord, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !uploadRecord) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      )
    }

    if (uploadRecord.chunks_uploaded !== uploadRecord.total_chunks) {
      return NextResponse.json(
        { error: 'Not all chunks uploaded' },
        { status: 400 }
      )
    }

    // Reassemble file from chunks
    const chunks: Buffer[] = []
    
    for (let i = 0; i < uploadRecord.total_chunks; i++) {
      const chunkPath = `uploads/${uploadId}/chunk_${i.toString().padStart(4, '0')}`
      
      const { data: chunkData, error: chunkError } = await supabase.storage
        .from('documents')
        .download(chunkPath)

      if (chunkError || !chunkData) {
        console.error(`Failed to download chunk ${i}:`, chunkError)
        return NextResponse.json(
          { error: `Missing chunk ${i}` },
          { status: 500 }
        )
      }

      chunks.push(Buffer.from(await chunkData.arrayBuffer()))
    }

    // Combine chunks into final file
    const finalFile = Buffer.concat(chunks)
    
    // Verify file integrity
    if (finalFile.length !== fileSize) {
      return NextResponse.json(
        { error: 'File size mismatch after reassembly' },
        { status: 500 }
      )
    }

    // Generate final file ID and path
    const fileId = uuidv4()
    const finalPath = `documents/${user.id}/${fileId}_${fileName}`

    // Upload final file
    const { error: finalUploadError } = await supabase.storage
      .from('documents')
      .upload(finalPath, finalFile, {
        contentType: fileType,
        upsert: false
      })

    if (finalUploadError) {
      console.error('Final upload error:', finalUploadError)
      return NextResponse.json(
        { error: 'Failed to store final file' },
        { status: 500 }
      )
    }

    // Create document record
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        id: fileId,
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        storage_path: finalPath,
        upload_id: uploadId,
        status: 'uploaded',
        created_at: new Date().toISOString()
      })

    if (docError) {
      console.error('Document record error:', docError)
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      )
    }

    // Update upload status
    const { error: updateError } = await supabase
      .from('uploads')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', uploadId)

    if (updateError) {
      console.error('Upload update error:', updateError)
    }

    // Clean up chunks (optional, could be done in background)
    try {
      for (let i = 0; i < uploadRecord.total_chunks; i++) {
        const chunkPath = `uploads/${uploadId}/chunk_${i.toString().padStart(4, '0')}`
        await supabase.storage.from('documents').remove([chunkPath])
      }
    } catch (cleanupError) {
      console.warn('Chunk cleanup failed:', cleanupError)
    }

    return NextResponse.json({ 
      fileId,
      message: 'Upload completed successfully' 
    })
  } catch (error) {
    console.error('Complete upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}