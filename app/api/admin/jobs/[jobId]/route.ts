import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { backgroundJobProcessor } from '@/lib/database-optimizer'

/**
 * BACKGROUND JOB STATUS API - PHASE 1.2
 * Monitor background job progress and results
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { jobId } = params

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const job = backgroundJobProcessor.getJobStatus(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Calculate job duration
    const duration = Date.now() - job.createdAt
    const durationSeconds = Math.floor(duration / 1000)

    // Estimate completion time for running jobs
    let estimatedCompletion = null
    if (job.status === 'running' && job.progress > 0) {
      const estimatedTotal = (duration / job.progress) * 100
      const remaining = estimatedTotal - duration
      estimatedCompletion = Math.max(0, Math.floor(remaining / 1000))
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error,
        duration: {
          seconds: durationSeconds,
          formatted: this.formatDuration(durationSeconds),
        },
        estimatedCompletion: estimatedCompletion
          ? {
              seconds: estimatedCompletion,
              formatted: this.formatDuration(estimatedCompletion),
            }
          : null,
        createdAt: new Date(job.createdAt).toISOString(),
      },
      metadata: {
        jobAge: durationSeconds,
        isComplete: job.status === 'completed' || job.status === 'failed',
        hasResult: !!job.result,
        hasError: !!job.error,
      },
    })
  } catch (error) {
    console.error('Job status API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve job status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}
