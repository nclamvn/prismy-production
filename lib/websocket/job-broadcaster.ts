/**
 * Job Broadcasting Utilities - Phase 3.4-C
 * Integrates WebSocket broadcasting with job queue updates
 * 
 * Features:
 * - Real-time job progress broadcasting
 * - Integration with existing job queue system
 * - Error handling and fallback to polling
 * - Worker integration hooks
 */

interface JobProgress {
  jobId: string
  status: string
  progress: number
  message: string
  currentStep?: string
  totalSteps?: number
  result?: any
  error?: string
}

/**
 * Broadcast job progress update to WebSocket clients
 * This function can be called from anywhere in the application
 */
export async function broadcastJobProgress(progress: JobProgress): Promise<void> {
  try {
    // In development or if WebSocket server is not available, we'll skip broadcasting
    if (process.env.NODE_ENV !== 'production' && !process.env.WS_BROADCAST_ENABLED) {
      console.log('[JOB BROADCAST] WebSocket broadcasting disabled in development')
      return
    }

    // Send broadcast request to WebSocket server
    const wsServerUrl = process.env.WS_SERVER_URL || 'http://localhost:3001'
    
    const response = await fetch(`${wsServerUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WS_BROADCAST_SECRET || 'fallback-secret'}`
      },
      body: JSON.stringify({
        type: 'job_progress',
        roomId: `job:${progress.jobId}`,
        payload: progress
      })
    })

    if (response.ok) {
      console.log('[JOB BROADCAST] Progress broadcasted successfully:', progress.jobId, progress.progress + '%')
    } else {
      console.warn('[JOB BROADCAST] Failed to broadcast progress:', response.status)
    }

  } catch (error) {
    // Fail silently - WebSocket is enhancement, not critical path
    console.warn('[JOB BROADCAST] Broadcasting failed (non-critical):', error)
  }
}

/**
 * Enhanced update_job_progress function with WebSocket broadcasting
 * This can be used as a drop-in replacement for the database RPC function
 */
export async function updateJobProgressWithBroadcast(
  supabase: any,
  params: {
    p_job_id: string
    p_status?: string
    p_progress?: number
    p_message?: string
    p_current_step?: string
    p_total_steps?: number
    p_error_message?: string
    p_result?: string
  }
): Promise<void> {
  try {
    // Update database first
    const { error } = await supabase.rpc('update_job_progress', params)
    
    if (error) {
      console.error('[JOB PROGRESS] Database update failed:', error)
      return
    }

    // Broadcast to WebSocket clients
    const progress: JobProgress = {
      jobId: params.p_job_id,
      status: params.p_status || 'processing',
      progress: params.p_progress || 0,
      message: params.p_message || 'Processing...',
      currentStep: params.p_current_step,
      totalSteps: params.p_total_steps,
      error: params.p_error_message,
      result: params.p_result ? JSON.parse(params.p_result) : undefined
    }

    // Broadcast asynchronously (don't block on WebSocket)
    broadcastJobProgress(progress).catch(error => {
      console.warn('[JOB PROGRESS] Broadcast failed (non-critical):', error)
    })

  } catch (error) {
    console.error('[JOB PROGRESS] Failed to update job progress:', error)
    throw error
  }
}

/**
 * Simple wrapper for worker progress updates
 */
export async function updateWorkerProgress(
  supabase: any,
  jobId: string,
  progress: number,
  message: string,
  status: string = 'processing',
  options?: {
    currentStep?: string
    totalSteps?: number
    result?: any
    error?: string
  }
): Promise<void> {
  return updateJobProgressWithBroadcast(supabase, {
    p_job_id: jobId,
    p_status: status,
    p_progress: progress,
    p_message: message,
    p_current_step: options?.currentStep,
    p_total_steps: options?.totalSteps,
    p_error_message: options?.error,
    p_result: options?.result ? JSON.stringify(options.result) : undefined
  })
}

/**
 * Batch broadcast multiple job updates
 */
export async function broadcastJobUpdates(updates: JobProgress[]): Promise<void> {
  try {
    const promises = updates.map(update => broadcastJobProgress(update))
    await Promise.allSettled(promises)
  } catch (error) {
    console.warn('[JOB BROADCAST] Batch broadcast failed (non-critical):', error)
  }
}