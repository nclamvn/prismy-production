import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

interface InitializeUploadRequest {
  fileName: string
  fileSize: number
  fileType: string
  totalChunks: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: InitializeUploadRequest = await request.json()
    const { fileName, fileSize, fileType, totalChunks } = body

    // Validate file size (1GB limit)
    const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 1GB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown'
    ]

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Generate unique upload ID
    const uploadId = uuidv4()
    
    // Create upload record in database
    const { error: dbError } = await supabase
      .from('uploads')
      .insert({
        id: uploadId,
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        total_chunks: totalChunks,
        chunks_uploaded: 0,
        status: 'initializing',
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to initialize upload' },
        { status: 500 }
      )
    }

    return NextResponse.json({ uploadId })
  } catch (error) {
    console.error('Initialize upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}