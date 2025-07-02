import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    const { jobId } = params

    // Get job status with credits info using the stored function
    const { data, error } = await supabase.rpc('get_job_with_credits', {
      p_job_id: jobId,
      p_user_id: session?.user?.id || null,
      p_session_id: session?.user?.id ? null : sessionId,
    })

    if (error) {
      console.error('Failed to get job:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const job = data[0]

    // Generate download link if translation is complete
    let downloadUrl = null
    if (job.status === 'translated' && job.output_path) {
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(job.output_path, 3600) // 1 hour expiry

      downloadUrl = urlData?.signedUrl || null
    }

    // Return job status with credits
    return NextResponse.json({
      id: job.id,
      filename: job.original_name,
      pages: job.pages,
      fileSize: job.file_size,
      status: job.status,
      progress: job.progress,
      downloadUrl,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      credits: {
        left: job.credits_left,
        used: job.credits_used,
        tier: job.tier,
      },
    })
  } catch (error) {
    console.error('Job status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
