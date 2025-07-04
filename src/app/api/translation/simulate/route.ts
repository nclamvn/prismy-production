import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface SimulateTranslationRequest {
  translationId: string
}

// This endpoint simulates the actual translation processing
// In production, this would be handled by a background worker/queue
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SimulateTranslationRequest = await request.json()
    const { translationId } = body

    if (!translationId) {
      return NextResponse.json(
        { error: 'Translation ID is required' },
        { status: 400 }
      )
    }

    // Get translation job
    const { data: translation, error: fetchError } = await supabase
      .from('translations')
      .select('*')
      .eq('id', translationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !translation) {
      return NextResponse.json(
        { error: 'Translation job not found' },
        { status: 404 }
      )
    }

    // Update status to processing
    await supabase
      .from('translations')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', translationId)

    // Simulate 10-second processing time
    setTimeout(async () => {
      try {
        // Generate mock result path
        const resultPath = `translations/${translation.document_id}_${translation.target_language}_${Date.now()}.txt`
        
        // Update to completed
        await supabase
          .from('translations')
          .update({
            status: 'completed',
            result_path: resultPath,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', translationId)

        console.log(`Translation ${translationId} completed: ${resultPath}`)
      } catch (error) {
        console.error('Error completing translation:', error)
        
        // Update to failed on error
        await supabase
          .from('translations')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', translationId)
      }
    }, 10000) // 10 seconds

    return NextResponse.json({
      message: 'Translation processing started',
      estimatedCompletion: new Date(Date.now() + 10000).toISOString()
    })
  } catch (error) {
    console.error('Simulate translation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}