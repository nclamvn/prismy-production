import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Get job progress and status
 * GET /api/jobs/progress?jobId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      )
    }

    console.log('[JOB PROGRESS] Getting progress for job:', jobId)

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get session info for authorization
    const sessionId = request.cookies.get('session_id')?.value

    // Get job progress
    const { data: job, error: jobError } = await supabase
      .from('job_queue')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.log('[JOB PROGRESS] Job not found:', jobId)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check authorization (user can only access their own jobs)
    if (job.session_id !== sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Calculate additional metrics
    const now = new Date()
    const createdAt = new Date(job.created_at)
    const startedAt = job.started_at ? new Date(job.started_at) : null
    const completedAt = job.completed_at ? new Date(job.completed_at) : null

    let estimatedTimeRemaining = null
    let processingTime = null

    if (startedAt && job.status === 'processing' && job.progress > 0) {
      const elapsedMs = now.getTime() - startedAt.getTime()
      const progressRatio = job.progress / 100
      const totalEstimatedMs = elapsedMs / progressRatio
      estimatedTimeRemaining = Math.round((totalEstimatedMs - elapsedMs) / 1000) // seconds
    }

    if (startedAt && completedAt) {
      processingTime = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000) // seconds
    }

    // Get job dependencies if any
    const { data: dependencies } = await supabase
      .from('job_dependencies')
      .select(`
        depends_on_job_id,
        job_queue!job_dependencies_depends_on_job_id_fkey(id, type, status, progress)
      `)
      .eq('job_id', jobId)

    // Format response
    const response = {
      jobId: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress || 0,
      message: job.progress_message,
      currentStep: job.current_step,
      totalSteps: job.total_steps,
      priority: job.priority,
      retryCount: job.retry_count,
      retryLimit: job.retry_limit,
      error: job.error_message,
      result: job.result,
      
      // Timing information
      queuedAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      estimatedCompletion: job.estimated_completion,
      processingTime,
      estimatedTimeRemaining,
      
      // Dependencies
      dependencies: dependencies?.map(dep => ({
        jobId: dep.depends_on_job_id,
        type: dep.job_queue?.type,
        status: dep.job_queue?.status,
        progress: dep.job_queue?.progress,
      })) || [],
      
      // Payload (for debugging)
      payload: job.payload,
    }

    console.log('[JOB PROGRESS] Job progress retrieved:', {
      jobId,
      status: job.status,
      progress: job.progress,
    })

    return NextResponse.json({
      success: true,
      job: response,
    })

  } catch (error) {
    console.error('[JOB PROGRESS] Error getting job progress:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Update job progress (for worker processes)
 * PATCH /api/jobs/progress
 */
export async function PATCH(request: NextRequest) {
  try {
    console.log('[JOB PROGRESS] Processing progress update')

    // Parse request body
    const body = await request.json()
    const { 
      jobId,
      status,
      progress,
      message,
      currentStep,
      totalSteps,
      error,
      result,
      estimatedCompletion
    } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Update job progress using database function
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_job_progress', {
        p_job_id: jobId,
        p_status: status,
        p_progress: progress,
        p_message: message,
        p_current_step: currentStep,
        p_total_steps: totalSteps,
        p_error_message: error,
        p_result: result ? JSON.stringify(result) : null,
        p_estimated_completion: estimatedCompletion ? new Date(estimatedCompletion).toISOString() : null,
      })

    if (updateError || !updateResult) {
      console.error('[JOB PROGRESS] Failed to update job progress:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job progress', details: updateError?.message },
        { status: 500 }
      )
    }

    console.log('[JOB PROGRESS] Job progress updated:', {
      jobId,
      status,
      progress,
      message,
    })

    return NextResponse.json({
      success: true,
      updated: updateResult,
    })

  } catch (error) {
    console.error('[JOB PROGRESS] Error updating job progress:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}