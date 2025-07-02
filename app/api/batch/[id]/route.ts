/**
 * Individual Batch Management API - Phase 3.5-A
 * Handles specific batch operations (get, update, delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id
    console.log('[BATCH API] Getting batch details:', batchId)
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const sessionId = request.cookies.get('session_id')?.value
    
    // Get batch with associated jobs
    const { data: batch, error: batchError } = await supabase
      .from('batch_jobs')
      .select(`
        *,
        job_queue (
          id,
          type,
          status,
          progress,
          progress_message,
          current_step,
          total_steps,
          created_at,
          completed_at,
          result,
          error_message
        )
      `)
      .eq('id', batchId)
      .eq('session_id', sessionId)
      .single()
    
    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Batch not found', details: batchError?.message },
        { status: 404 }
      )
    }
    
    // Calculate batch statistics
    const jobs = batch.job_queue || []
    const stats = {
      total: jobs.length,
      pending: jobs.filter((j: any) => j.status === 'queued').length,
      processing: jobs.filter((j: any) => j.status === 'processing').length,
      completed: jobs.filter((j: any) => j.status === 'completed').length,
      failed: jobs.filter((j: any) => j.status === 'failed').length,
      averageProgress: jobs.length > 0 
        ? jobs.reduce((sum: number, j: any) => sum + (j.progress || 0), 0) / jobs.length
        : 0
    }
    
    return NextResponse.json({
      success: true,
      batch: {
        ...batch,
        stats
      }
    })
    
  } catch (error) {
    console.error('[BATCH API] Error getting batch:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id
    const body = await request.json()
    
    console.log('[BATCH API] Updating batch:', batchId, body)
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const sessionId = request.cookies.get('session_id')?.value
    
    // Update batch
    const { data: batch, error: updateError } = await supabase
      .from('batch_jobs')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .eq('session_id', sessionId)
      .select()
      .single()
    
    if (updateError || !batch) {
      return NextResponse.json(
        { error: 'Failed to update batch', details: updateError?.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      batch
    })
    
  } catch (error) {
    console.error('[BATCH API] Error updating batch:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id
    console.log('[BATCH API] Deleting batch:', batchId)
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const sessionId = request.cookies.get('session_id')?.value
    
    // Cancel all associated jobs first
    const { error: cancelError } = await supabase
      .from('job_queue')
      .update({ status: 'cancelled' })
      .eq('batch_id', batchId)
      .eq('session_id', sessionId)
    
    if (cancelError) {
      console.warn('[BATCH API] Failed to cancel batch jobs:', cancelError)
    }
    
    // Delete batch
    const { error: deleteError } = await supabase
      .from('batch_jobs')
      .delete()
      .eq('id', batchId)
      .eq('session_id', sessionId)
    
    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete batch', details: deleteError.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully'
    })
    
  } catch (error) {
    console.error('[BATCH API] Error deleting batch:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}