/**
 * STREAMING PROGRESS API
 * Real-time progress updates for document intelligence processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
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

    // Get job ID from query parameters
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Check if this is a Server-Sent Events request
    const acceptHeader = request.headers.get('accept')
    const isSSE = acceptHeader?.includes('text/event-stream')

    if (isSSE) {
      // Return Server-Sent Events stream for real-time updates
      return handleSSERequest(jobId, session.user.id)
    } else {
      // Return current streaming progress as JSON
      const job = await intelligenceJobProcessor.getJob(jobId)

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: job.status,
        streamingProgress: job.progress || null,
        lastUpdated: new Date().toISOString()
      })
    }

  } catch (error) {
    logger.error('Streaming progress check failed:', error)
    return NextResponse.json(
      { error: 'Failed to get streaming progress' },
      { status: 500 }
    )
  }
}

async function handleSSERequest(jobId: string, userId: string): Promise<Response> {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectionMessage = `data: ${JSON.stringify({
        type: 'connection',
        jobId,
        timestamp: new Date().toISOString(),
        message: 'Connected to streaming progress'
      })}\n\n`
      controller.enqueue(encoder.encode(connectionMessage))

      // Set up periodic progress checks
      const intervalId = setInterval(async () => {
        try {
          const job = await intelligenceJobProcessor.getJob(jobId)
          
          if (!job) {
            // Job not found - send error and close
            const errorMessage = `data: ${JSON.stringify({
              type: 'error',
              jobId,
              timestamp: new Date().toISOString(),
              error: 'Job not found'
            })}\n\n`
            controller.enqueue(encoder.encode(errorMessage))
            controller.close()
            clearInterval(intervalId)
            return
          }

          // Send progress update
          const progressData = {
            type: 'progress',
            jobId: job.id,
            status: job.status,
            streamingProgress: job.progress,
            timestamp: new Date().toISOString()
          }

          const progressMessage = `data: ${JSON.stringify(progressData)}\n\n`
          controller.enqueue(encoder.encode(progressMessage))

          // Close stream if job is completed or failed
          if (job.status === 'completed' || job.status === 'failed') {
            const finalMessage = `data: ${JSON.stringify({
              type: 'complete',
              jobId: job.id,
              status: job.status,
              result: job.result,
              error: job.error,
              timestamp: new Date().toISOString()
            })}\n\n`
            controller.enqueue(encoder.encode(finalMessage))
            controller.close()
            clearInterval(intervalId)
          }

        } catch (error) {
          logger.error('Error in SSE progress stream:', error)
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            jobId,
            timestamp: new Date().toISOString(),
            error: 'Internal server error'
          })}\n\n`
          controller.enqueue(encoder.encode(errorMessage))
          controller.close()
          clearInterval(intervalId)
        }
      }, 1000) // Update every second

      // Clean up on stream close
      const cleanup = () => {
        clearInterval(intervalId)
        logger.info(`SSE stream closed for job ${jobId}`)
      }

      // Handle client disconnect
      return cleanup
    },

    cancel() {
      logger.info(`SSE stream cancelled for job ${jobId}`)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// POST endpoint to cancel streaming processing
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

    if (!jobId || action !== 'cancel') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    logger.info(`Cancelling streaming job: ${jobId}`, { userId: session.user.id })

    // Get the job and cancel it if it's still processing
    const job = await intelligenceJobProcessor.getJob(jobId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status === 'processing') {
      // Mark job as failed with cancellation message
      job.status = 'failed'
      job.error = 'Cancelled by user'
      job.completedAt = new Date()
      
      return NextResponse.json({
        success: true,
        message: 'Streaming job cancelled successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Job cannot be cancelled in current status' },
        { status: 400 }
      )
    }

  } catch (error) {
    logger.error('Streaming job cancellation failed:', error)
    return NextResponse.json(
      { error: 'Failed to cancel streaming job' },
      { status: 500 }
    )
  }
}