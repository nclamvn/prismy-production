import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    // Get user session and session ID
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const sessionId = request.cookies.get('session_id')?.value

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const {
      jobId,
      sourceLang = 'auto',
      targetLang = 'en',
    } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    // Get job and verify ownership
    const { data: job, error: jobError } = await supabase
      .from('translation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq(
        session?.user?.id ? 'user_id' : 'session_id',
        session?.user?.id || sessionId
      )
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if job is in a state that can be translated
    if (job.status === 'translating') {
      return NextResponse.json(
        { error: 'Translation already in progress' },
        { status: 409 }
      )
    }

    if (job.status === 'translated') {
      return NextResponse.json(
        { error: 'Job already translated' },
        { status: 409 }
      )
    }

    // Update job status to translating
    const { error: updateError } = await supabase
      .from('translation_jobs')
      .update({
        status: 'translating',
        progress: 0,
        source_lang: sourceLang,
        target_lang: targetLang,
        translation_service: 'google', // Free tier uses Google Translate
      })
      .eq('id', jobId)

    if (updateError) {
      console.error('Failed to update job status:', updateError)
      return NextResponse.json(
        { error: 'Failed to start translation' },
        { status: 500 }
      )
    }

    // Trigger translation worker (async)
    try {
      // Call translation worker endpoint
      const workerUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api/workers/translate`
        : 'http://localhost:3000/api/workers/translate'

      fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, sourceLang, targetLang }),
      }).catch(error => {
        console.error('Worker trigger failed:', error)
        // Update job status to failed
        supabase
          .from('translation_jobs')
          .update({
            status: 'failed',
            error_message: 'Failed to start translation worker',
          })
          .eq('id', jobId)
          .then()
      })
    } catch (error) {
      console.error('Translation trigger error:', error)
      return NextResponse.json(
        { error: 'Failed to trigger translation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Translate endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
