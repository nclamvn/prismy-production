import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: translationId } = await params

    // Get translation job
    const { data: translation, error: translationError } = await supabase
      .from('translations')
      .select(`
        *,
        documents!inner(
          id,
          file_name,
          file_size,
          file_type
        )
      `)
      .eq('id', translationId)
      .eq('user_id', user.id)
      .single()

    if (translationError || !translation) {
      return NextResponse.json(
        { error: 'Translation job not found' },
        { status: 404 }
      )
    }

    // Calculate progress based on status and time elapsed
    let progress = 0
    let estimatedCompletion = null

    if (translation.status === 'pending') {
      progress = 0
    } else if (translation.status === 'processing') {
      // Simulate progress based on time elapsed
      const startTime = new Date(translation.updated_at || translation.created_at).getTime()
      const currentTime = Date.now()
      const elapsedMs = currentTime - startTime
      const totalExpectedMs = 10000 // 10 seconds
      
      progress = Math.min(95, Math.round((elapsedMs / totalExpectedMs) * 100))
      estimatedCompletion = new Date(startTime + totalExpectedMs).toISOString()
    } else if (translation.status === 'completed') {
      progress = 100
    } else if (translation.status === 'failed') {
      progress = 0
    }

    return NextResponse.json({
      id: translation.id,
      documentId: translation.document_id,
      documentName: translation.documents.file_name,
      sourceLanguage: translation.source_language,
      targetLanguage: translation.target_language,
      status: translation.status,
      progress,
      resultPath: translation.result_path,
      createdAt: translation.created_at,
      updatedAt: translation.updated_at,
      completedAt: translation.completed_at,
      estimatedCompletion
    })
  } catch (error) {
    console.error('Get translation status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}