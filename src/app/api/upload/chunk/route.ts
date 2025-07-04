import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const uploadId = formData.get('uploadId') as string
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const chunkFile = formData.get('chunk') as File

    if (!uploadId || isNaN(chunkIndex) || !chunkFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify upload belongs to user
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

    // Convert chunk to buffer for storage
    const chunkBuffer = Buffer.from(await chunkFile.arrayBuffer())
    
    // Store chunk in Supabase storage
    const chunkPath = `uploads/${uploadId}/chunk_${chunkIndex.toString().padStart(4, '0')}`
    
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(chunkPath, chunkBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json(
        { error: 'Failed to store chunk' },
        { status: 500 }
      )
    }

    // Update upload progress
    const { error: updateError } = await supabase
      .from('uploads')
      .update({
        chunks_uploaded: uploadRecord.chunks_uploaded + 1,
        status: 'uploading',
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chunk upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}