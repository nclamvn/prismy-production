/**
 * Real-time Progress Tracking for Document Processing
 * Uses Server-Sent Events (SSE) for browser compatibility
 */

import { getBrowserClient } from '@/lib/supabase-browser'
import { logger } from '@/lib/logger'

export interface ProgressUpdate {
  jobId: string
  userId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  message: string
  metadata?: {
    totalPages?: number
    processedPages?: number
    currentStep?: string
    estimatedTimeRemaining?: number
    errorDetails?: string
  }
  timestamp: string
}

export class RealtimeProgressManager {
  private static instance: RealtimeProgressManager
  private progressUpdates = new Map<string, ProgressUpdate>()
  private subscribers = new Map<string, Set<(update: ProgressUpdate) => void>>()

  private constructor() {}

  static getInstance(): RealtimeProgressManager {
    if (!RealtimeProgressManager.instance) {
      RealtimeProgressManager.instance = new RealtimeProgressManager()
    }
    return RealtimeProgressManager.instance
  }

  // Subscribe to progress updates for a specific job
  subscribe(jobId: string, callback: (update: ProgressUpdate) => void): () => void {
    if (!this.subscribers.has(jobId)) {
      this.subscribers.set(jobId, new Set())
    }
    
    this.subscribers.get(jobId)!.add(callback)

    // Send current progress if available
    const currentProgress = this.progressUpdates.get(jobId)
    if (currentProgress) {
      callback(currentProgress)
    }

    // Return unsubscribe function
    return () => {
      const jobSubscribers = this.subscribers.get(jobId)
      if (jobSubscribers) {
        jobSubscribers.delete(callback)
        if (jobSubscribers.size === 0) {
          this.subscribers.delete(jobId)
        }
      }
    }
  }

  // Update progress for a job
  updateProgress(update: ProgressUpdate): void {
    this.progressUpdates.set(update.jobId, update)

    // Notify all subscribers for this job
    const jobSubscribers = this.subscribers.get(update.jobId)
    if (jobSubscribers) {
      jobSubscribers.forEach(callback => {
        try {
          callback(update)
        } catch (error) {
          logger.error('Error in progress callback', { error, jobId: update.jobId })
        }
      })
    }

    // Store in database for persistence
    this.persistProgress(update).catch(error => {
      logger.error('Failed to persist progress', { error, jobId: update.jobId })
    })

    // Clean up completed/failed jobs after delay
    if (update.status === 'completed' || update.status === 'failed') {
      setTimeout(() => {
        this.cleanup(update.jobId)
      }, 30000) // Clean up after 30 seconds
    }
  }

  // Get current progress for a job
  getProgress(jobId: string): ProgressUpdate | null {
    return this.progressUpdates.get(jobId) || null
  }

  // Clean up job data
  private cleanup(jobId: string): void {
    this.progressUpdates.delete(jobId)
    this.subscribers.delete(jobId)
  }

  // Persist progress to database
  private async persistProgress(update: ProgressUpdate): Promise<void> {
    try {
      // Use singleton browser client (client-side only)
      if (typeof window === 'undefined') {
        throw new Error('persistProgress should only be called on client-side')
      }
      const supabase = getBrowserClient()
      
      await supabase
        .from('job_progress')
        .upsert({
          job_id: update.jobId,
          user_id: update.userId,
          status: update.status,
          progress: update.progress,
          message: update.message,
          metadata: update.metadata,
          updated_at: update.timestamp
        })
    } catch (error) {
      logger.error('Failed to persist progress to database', { error })
    }
  }

  // Load progress from database (for recovery)
  async loadProgress(jobId: string): Promise<ProgressUpdate | null> {
    try {
      // Use singleton browser client (client-side only)
      if (typeof window === 'undefined') {
        throw new Error('loadProgress should only be called on client-side')
      }
      const supabase = getBrowserClient()
      
      const { data, error } = await supabase
        .from('job_progress')
        .select('*')
        .eq('job_id', jobId)
        .single()

      if (error || !data) {
        return null
      }

      const progress: ProgressUpdate = {
        jobId: data.job_id,
        userId: data.user_id,
        status: data.status,
        progress: data.progress,
        message: data.message,
        metadata: data.metadata,
        timestamp: data.updated_at
      }

      this.progressUpdates.set(jobId, progress)
      return progress
    } catch (error) {
      logger.error('Failed to load progress from database', { error, jobId })
      return null
    }
  }
}

// Helper functions for common progress updates
export const ProgressHelpers = {
  // Create initial progress entry
  createJob(jobId: string, userId: string, message: string = 'Job queued'): ProgressUpdate {
    return {
      jobId,
      userId,
      status: 'queued',
      progress: 0,
      message,
      timestamp: new Date().toISOString()
    }
  },

  // Update for document upload
  documentUploaded(jobId: string, userId: string, fileName: string): ProgressUpdate {
    return {
      jobId,
      userId,
      status: 'processing',
      progress: 10,
      message: `Document uploaded: ${fileName}`,
      timestamp: new Date().toISOString()
    }
  },

  // Update for parsing start
  parsingStarted(jobId: string, userId: string, totalPages?: number): ProgressUpdate {
    return {
      jobId,
      userId,
      status: 'processing',
      progress: 20,
      message: 'Parsing document content...',
      metadata: {
        totalPages,
        currentStep: 'parsing'
      },
      timestamp: new Date().toISOString()
    }
  },

  // Update for parsing progress
  parsingProgress(
    jobId: string, 
    userId: string, 
    processedPages: number, 
    totalPages: number
  ): ProgressUpdate {
    const progress = 20 + Math.floor((processedPages / totalPages) * 30) // 20-50%
    return {
      jobId,
      userId,
      status: 'processing',
      progress,
      message: `Parsing page ${processedPages} of ${totalPages}`,
      metadata: {
        totalPages,
        processedPages,
        currentStep: 'parsing'
      },
      timestamp: new Date().toISOString()
    }
  },

  // Update for translation start
  translationStarted(jobId: string, userId: string, textLength: number): ProgressUpdate {
    return {
      jobId,
      userId,
      status: 'processing',
      progress: 50,
      message: 'Starting translation...',
      metadata: {
        currentStep: 'translation',
        estimatedTimeRemaining: Math.ceil(textLength / 1000) * 2 // Rough estimate
      },
      timestamp: new Date().toISOString()
    }
  },

  // Update for translation progress
  translationProgress(
    jobId: string, 
    userId: string, 
    completedChunks: number, 
    totalChunks: number
  ): ProgressUpdate {
    const progress = 50 + Math.floor((completedChunks / totalChunks) * 40) // 50-90%
    return {
      jobId,
      userId,
      status: 'processing',
      progress,
      message: `Translating chunk ${completedChunks} of ${totalChunks}`,
      metadata: {
        currentStep: 'translation'
      },
      timestamp: new Date().toISOString()
    }
  },

  // Update for completion
  completed(jobId: string, userId: string, resultUrl?: string): ProgressUpdate {
    return {
      jobId,
      userId,
      status: 'completed',
      progress: 100,
      message: 'Translation completed successfully!',
      metadata: {
        currentStep: 'completed',
        resultUrl
      },
      timestamp: new Date().toISOString()
    }
  },

  // Update for failure
  failed(jobId: string, userId: string, error: string): ProgressUpdate {
    return {
      jobId,
      userId,
      status: 'failed',
      progress: 0,
      message: 'Translation failed',
      metadata: {
        currentStep: 'failed',
        errorDetails: error
      },
      timestamp: new Date().toISOString()
    }
  }
}

// Server-Sent Events handler
export function createSSEHandler(jobId: string, userId: string) {
  return (request: Request) => {
    // Verify user has access to this job
    // This should be implemented based on your auth system
    
    const progressManager = RealtimeProgressManager.getInstance()
    
    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connected',
          jobId,
          timestamp: new Date().toISOString()
        })}\n\n`
        
        controller.enqueue(new TextEncoder().encode(initialMessage))

        // Subscribe to progress updates
        const unsubscribe = progressManager.subscribe(jobId, (update) => {
          const message = `data: ${JSON.stringify({
            type: 'progress',
            ...update
          })}\n\n`
          
          try {
            controller.enqueue(new TextEncoder().encode(message))
          } catch (error) {
            logger.error('Failed to send SSE message', { error, jobId })
          }
        })

        // Send current progress if available
        const currentProgress = progressManager.getProgress(jobId)
        if (currentProgress) {
          const message = `data: ${JSON.stringify({
            type: 'progress',
            ...currentProgress
          })}\n\n`
          
          controller.enqueue(new TextEncoder().encode(message))
        }

        // Clean up on close
        request.signal?.addEventListener('abort', () => {
          unsubscribe()
          controller.close()
        })

        // Send keep-alive messages
        const keepAlive = setInterval(() => {
          try {
            const message = `data: ${JSON.stringify({
              type: 'keepalive',
              timestamp: new Date().toISOString()
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(message))
          } catch (error) {
            clearInterval(keepAlive)
            unsubscribe()
          }
        }, 30000) // Every 30 seconds

        // Clean up interval on close
        request.signal?.addEventListener('abort', () => {
          clearInterval(keepAlive)
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  }
}