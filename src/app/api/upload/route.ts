import { NextRequest, NextResponse } from 'next/server'
import { getFeatureFlags } from '@/lib/feature-flags'
import { detectLanguage } from '@/lib/ocr/language-detector'
import { translateText } from '@/lib/translation/translation-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
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
    
    // Read file content
    const fileText = await file.text()
    
    // Detect language
    const detectedLang = fromLang === 'auto' ? detectLanguage(fileText) : fromLang
    
    // Store file in Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (fileError) {
      console.error('File upload error:', fileError)
      return NextResponse.json({ error: 'Failed to store file' }, { status: 500 })
    }
    
    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        file_path: fileData.path,
        extracted_text: fileText,
        detected_language: detectedLang,
        target_language: toLang,
        status: 'processing',
        user_id: user.id
      })
      .select()
      .single()
    
    if (docError) {
      console.error('Document creation error:', docError)
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }
    
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        document_id: document.id,
        title: `Chat about ${file.name}`,
        status: 'active'
      })
      .select()
      .single()
    
    if (convError) {
      console.error('Conversation creation error:', convError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }
    
    // Start translation process (async)
    const flags = getFeatureFlags()
    if (flags.MVP_MODE) {
      // Simple translation for MVP
      const translatedText = await translateText(fileText, detectedLang, toLang)
      
      // Update document with translation
      await supabase
        .from('documents')
        .update({
          translated_text: translatedText,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', document.id)
    }
    
    return NextResponse.json({
      success: true,
      documentId: document.id,
      conversationId: conversation.id,
      filename: file.name,
      detectedLanguage: detectedLang,
      status: 'processing',
      message: 'File uploaded and processing started'
    })
    
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}