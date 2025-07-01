import { NextRequest, NextResponse } from 'next/server'
import { JobQueueManager, JobType, JobPriority } from '@/lib/job-queue'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { nanoid } from 'nanoid'

interface QueueJobRequest {
  type: JobType
  priority?: JobPriority
  data: any
}

// Initialize job queue on first use
let jobQueue: JobQueueManager | null = null

async function getJobQueue() {
  if (!jobQueue) {
    jobQueue = JobQueueManager.getInstance()
    await jobQueue.initialize()
  }
  return jobQueue
}

export async function POST(request: NextRequest) {
  try {
    const body: QueueJobRequest = await request.json()
    
    // Validate request
    if (!body.type || !body.data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data' },
        { status: 400 }
      )
    }

    // Get user from auth
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate job ID
    const jobId = `job_${nanoid()}`
    
    // Get job queue
    const queue = await getJobQueue()
    
    // Queue job based on type
    let queuedJobId: string
    
    switch (body.type) {
      case JobType.DOCUMENT_PROCESSING:
        queuedJobId = await queue.queueDocumentProcessing({
          jobId,
          userId,
          ...body.data
        }, body.priority || JobPriority.NORMAL)
        break
        
      case JobType.TRANSLATION:
        queuedJobId = await queue.queueTranslation({
          jobId,
          userId,
          ...body.data
        }, body.priority || JobPriority.NORMAL)
        break
        
      case JobType.BATCH_TRANSLATION:
        queuedJobId = await queue.queueTranslation({
          jobId,
          userId,
          ...body.data
        }, body.priority || JobPriority.HIGH)
        break
        
      default:
        return NextResponse.json(
          { error: `Unsupported job type: ${body.type}` },
          { status: 400 }
        )
    }

    // Create job record in database
    const { error: dbError } = await supabase
      .from('translation_jobs')
      .insert({
        id: jobId,
        user_id: userId,
        type: body.type,
        status: 'queued',
        data: body.data,
        priority: body.priority || JobPriority.NORMAL,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      logger.error('Failed to create job record', { error: dbError, jobId })
    }

    return NextResponse.json({
      success: true,
      jobId,
      queuedJobId,
      status: 'queued',
      progressUrl: `/api/progress/${jobId}?stream=true`
    })

  } catch (error) {
    logger.error('Job queue API error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const stats = searchParams.get('stats')

    // Get job queue
    const queue = await getJobQueue()

    // Return queue statistics
    if (stats === 'true') {
      const queueStats = await queue.getQueueStats()
      
      return NextResponse.json({
        success: true,
        stats: queueStats,
        timestamp: new Date().toISOString()
      })
    }

    // Return specific job status
    if (jobId) {
      const jobStatus = await queue.getJobStatus(jobId)
      
      if (!jobStatus) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        job: jobStatus
      })
    }

    // Return user's jobs
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: jobs, error } = await supabase
      .from('translation_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      logger.error('Failed to get user jobs', { error, userId })
      return NextResponse.json(
        { error: 'Failed to retrieve jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      jobs
    })

  } catch (error) {
    logger.error('Job queue GET API error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get user from auth
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('translation_jobs')
      .select('user_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job || job.user_id !== userId) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Cancel job in queue
    const queue = await getJobQueue()
    await queue.cancelJob(jobId)

    // Update job status in database
    const { error: updateError } = await supabase
      .from('translation_jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) {
      logger.error('Failed to update job status', { error: updateError, jobId })
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully'
    })

  } catch (error) {
    logger.error('Job cancellation API error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return null
    }

    const token = authorization.replace('Bearer ', '')
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user.id
  } catch (error) {
    logger.error('Failed to get user from request', { error })
    return null
  }
}