import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/server'
import { processDocument } from '@/lib/processing/document-processor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fromLang = formData.get('fromLang') as string
    const toLang = formData.get('toLang') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Check file size (max 10MB for now)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)
    
    // Initialize Supabase client
    const supabase = createSupabaseClient()
    
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
    
    // Create document record
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        filename: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        source_language: fromLang === 'auto' ? null : fromLang,
        target_language: toLang,
        status: 'uploaded'
      })
      .select()
      .single()
    
    if (docError) {
      console.error('Database error:', docError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    // Start processing in background
    processDocument(docData.id).catch(error => {
      console.error('Processing error:', error)
    })
    
    return NextResponse.json({
      success: true,
      documentId: docData.id,
      message: 'File uploaded and processing started'
    })
    
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}