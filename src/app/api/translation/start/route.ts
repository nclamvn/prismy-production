import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

interface StartTranslationRequest {
  documentId: string
  sourceLanguage: string
  targetLanguage: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: StartTranslationRequest = await request.json()
    const { documentId, sourceLanguage, targetLanguage } = body

    // Validate input
    if (!documentId || !targetLanguage) {
      return NextResponse.json(
        { error: 'Document ID and target language are required' },
        { status: 400 }
      )
    }

    // Verify document belongs to user
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if translation already exists
    const { data: existingTranslation } = await supabase
      .from('translations')
      .select('id')
      .eq('document_id', documentId)
      .eq('target_language', targetLanguage)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingTranslation) {
      return NextResponse.json(
        { error: 'Translation already exists for this language' },
        { status: 409 }
      )
    }

    // Create translation job
    const translationId = uuidv4()
    
    const { error: insertError } = await supabase
      .from('translations')
      .insert({
        id: translationId,
        document_id: documentId,
        user_id: user.id,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Translation insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create translation job' },
        { status: 500 }
      )
    }

    // In a real implementation, this would trigger a background job
    // For now, we'll return the job ID and let the client poll for updates
    
    return NextResponse.json({
      translationId,
      status: 'pending',
      message: 'Translation job created successfully'
    })
  } catch (error) {
    console.error('Start translation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}