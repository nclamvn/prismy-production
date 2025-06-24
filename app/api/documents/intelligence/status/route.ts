/**
 * DOCUMENT INTELLIGENCE JOB STATUS API
 * Check the status of background intelligence processing jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { intelligenceJobProcessor } from '@/lib/ai/intelligence-job-processor'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user tier for rate limiting
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', session.user.id)
      .single()

    const userTier = profile?.subscription_tier || 'free'

    // Apply rate limiting
    const rateLimitResult = await getRateLimitForTier(request, userTier as any)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get job ID from query parameters
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    logger.info(`Checking intelligence job status: ${jobId}`, { userId: session.user.id })

    // Get job status from intelligence processor
    const job = await intelligenceJobProcessor.getJob(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Calculate progress percentage
    const progress = calculateJobProgress(job)

    // Format response
    const response = {
      success: true,
      jobId: job.id,
      status: job.status,
      type: job.type,
      progress,
      streamingProgress: job.progress || null, // Include streaming progress if available
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.status === 'completed' ? job.result : null,
      error: job.error,
      estimatedCompletion: job.status === 'processing' ? 
        estimateCompletionTime(job) : null
    }

    // Add performance metrics for completed jobs
    if (job.status === 'completed' && job.startedAt && job.completedAt) {
      response.performance = {
        processingTime: job.completedAt.getTime() - job.startedAt.getTime(),
        queueTime: job.startedAt.getTime() - job.createdAt.getTime(),
        totalTime: job.completedAt.getTime() - job.createdAt.getTime()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Intelligence job status check failed:', error)
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, jobId } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    logger.info(`Intelligence job action: ${action} for ${jobId}`, { userId: session.user.id })

    switch (action) {
      case 'cancel':
        // Cancel job if it's still pending
        const job = await intelligenceJobProcessor.getJob(jobId)
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          )
        }

        if (job.status === 'pending') {
          // Mark job as failed with cancellation message
          job.status = 'failed'
          job.error = 'Cancelled by user'
          job.completedAt = new Date()
          
          return NextResponse.json({
            success: true,
            message: 'Job cancelled successfully'
          })
        } else {
          return NextResponse.json(
            { error: 'Job cannot be cancelled in current status' },
            { status: 400 }
          )
        }

      case 'retry':
        // Retry failed job
        const failedJob = await intelligenceJobProcessor.getJob(jobId)
        if (!failedJob) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          )
        }

        if (failedJob.status === 'failed') {
          // Create new job with same data
          const newJobId = await intelligenceJobProcessor.addJob({
            type: failedJob.type,
            priority: failedJob.priority,
            data: failedJob.data
          })
          
          return NextResponse.json({
            success: true,
            newJobId,
            message: 'Job retried successfully'
          })
        } else {
          return NextResponse.json(
            { error: 'Only failed jobs can be retried' },
            { status: 400 }
          )
        }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Intelligence job action failed:', error)
    return NextResponse.json(
      { error: 'Failed to perform job action' },
      { status: 500 }
    )
  }
}

// Helper function to calculate job progress
function calculateJobProgress(job: any): number {
  switch (job.status) {
    case 'pending':
      return 0
    case 'processing':
      // Estimate progress based on time elapsed
      if (job.startedAt) {
        const elapsed = Date.now() - job.startedAt.getTime()
        const estimated = estimateJobDuration(job)
        return Math.min(90, Math.round((elapsed / estimated) * 100))
      }
      return 10
    case 'completed':
      return 100
    case 'failed':
      return 0
    default:
      return 0
  }
}

// Helper function to estimate job duration
function estimateJobDuration(job: any): number {
  const baseTime = 30000 // 30 seconds base
  
  const typeMultiplier = {
    document_analysis: 1.5,
    text_extraction: 1.0,
    translation: 0.8,
    summarization: 1.2
  }[job.type] || 1.0
  
  const priorityMultiplier = {
    high: 0.8,
    medium: 1.0,
    low: 1.5
  }[job.priority] || 1.0
  
  return baseTime * typeMultiplier * priorityMultiplier
}

// Helper function to estimate completion time
function estimateCompletionTime(job: any): Date {
  const duration = estimateJobDuration(job)
  const elapsed = job.startedAt ? Date.now() - job.startedAt.getTime() : 0
  const remaining = Math.max(0, duration - elapsed)
  
  return new Date(Date.now() + remaining)
}