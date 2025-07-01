import { NextRequest } from 'next/server'

// In-memory job progress storage (in production, use Redis or database)
const jobProgress = new Map<string, {
  steps: Array<{
    id: string
    label: string
    description?: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    progress?: number
  }>
  currentStep?: string
  isComplete: boolean
  error?: string
}>()

// Set up default job progress for demo purposes
const setupDemoProgress = (jobId: string) => {
  if (!jobProgress.has(jobId)) {
    jobProgress.set(jobId, {
      steps: [
        {
          id: 'upload',
          label: 'Document Upload',
          description: 'Uploading and validating document',
          status: 'completed',
          progress: 100,
        },
        {
          id: 'extract',
          label: 'Text Extraction',
          description: 'Extracting text from document',
          status: 'processing',
          progress: 65,
        },
        {
          id: 'analyze',
          label: 'Language Analysis',
          description: 'Detecting source language and analyzing content',
          status: 'pending',
        },
        {
          id: 'translate',
          label: 'Translation',
          description: 'Translating content with AI',
          status: 'pending',
        },
        {
          id: 'optimize',
          label: 'Quality Optimization',
          description: 'Optimizing translation quality',
          status: 'pending',
        },
        {
          id: 'complete',
          label: 'Finalization',
          description: 'Finalizing and preparing download',
          status: 'pending',
        },
      ],
      currentStep: 'extract',
      isComplete: false,
    })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId

  // Set up headers for Server-Sent Events
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  })

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Set up demo progress if not exists
      setupDemoProgress(jobId)

      // Send initial progress
      const sendProgress = () => {
        const progress = jobProgress.get(jobId)
        if (progress) {
          const data = {
            type: 'progress',
            steps: progress.steps,
            currentStep: progress.currentStep,
            isComplete: progress.isComplete,
            error: progress.error,
          }
          
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
        }
      }

      // Send initial state
      sendProgress()

      // Simulate progress updates for demo
      let stepIndex = 1 // Start from second step (first is already completed)
      
      const progressInterval = setInterval(() => {
        const progress = jobProgress.get(jobId)
        if (!progress || progress.isComplete) {
          clearInterval(progressInterval)
          return
        }

        const currentStep = progress.steps[stepIndex]
        if (!currentStep) {
          // All steps completed
          progress.isComplete = true
          controller.enqueue(`data: ${JSON.stringify({
            type: 'complete',
            steps: progress.steps,
          })}\n\n`)
          clearInterval(progressInterval)
          return
        }

        // Update current step
        if (currentStep.status === 'pending') {
          currentStep.status = 'processing'
          currentStep.progress = 0
          progress.currentStep = currentStep.id
        } else if (currentStep.status === 'processing') {
          // Increment progress
          currentStep.progress = (currentStep.progress || 0) + 15
          
          // If step is complete, move to next
          if (currentStep.progress >= 100) {
            currentStep.status = 'completed'
            currentStep.progress = 100
            stepIndex++
            
            // Set next step as current
            if (stepIndex < progress.steps.length) {
              progress.currentStep = progress.steps[stepIndex].id
            }
          }
        }

        // Update progress in storage
        jobProgress.set(jobId, progress)
        
        // Send updated progress
        sendProgress()
      }, 1000) // Update every second

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(progressInterval)
        controller.close()
      })

      // Auto-cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(progressInterval)
        controller.close()
      }, 300000)
    },
  })

  return new Response(stream, {
    headers: responseHeaders,
  })
}

// Create or update job progress
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId
    const body = await request.json()

    // Update job progress
    jobProgress.set(jobId, {
      steps: body.steps || [],
      currentStep: body.currentStep,
      isComplete: body.isComplete || false,
      error: body.error,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to update progress:', error)
    return Response.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

// Delete job progress
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId
  jobProgress.delete(jobId)
  
  return Response.json({ success: true })
}