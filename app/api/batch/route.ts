/**
 * Batch Management API - Phase 3.5-A
 * Handles batch job creation, monitoring, and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('[BATCH API] Creating new batch')
    
    const body = await request.json()
    const {
      name,
      fileCount,
      targetLanguage = 'en',
      options = {}
    } = body
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Get session info
    const sessionId = request.cookies.get('session_id')?.value
    
    // Create batch record
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    const { data: batch, error: batchError } = await supabase
      .from('batch_jobs')
      .insert({
        id: batchId,
        name: name || `Batch ${Date.now()}`,
        session_id: sessionId,
        file_count: fileCount,
        target_language: targetLanguage,
        options: options,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (batchError) {
      console.error('[BATCH API] Failed to create batch:', batchError)
      return NextResponse.json(
        { error: 'Failed to create batch', details: batchError.message },
        { status: 500 }
      )
    }
    
    console.log('[BATCH API] Batch created successfully:', batchId)
    
    return NextResponse.json({
      success: true,
      batchId,
      batch
    })
    
  } catch (error) {
    console.error('[BATCH API] Error creating batch:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[BATCH API] Getting batches')
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const sessionId = request.cookies.get('session_id')?.value
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    let query = supabase
      .from('batch_jobs')
      .select(`
        *,
        job_queue (
          id,
          status,
          progress,
          progress_message,
          created_at,
          completed_at
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: batches, error: batchError } = await query
    
    if (batchError) {
      console.error('[BATCH API] Failed to get batches:', batchError)
      return NextResponse.json(
        { error: 'Failed to get batches', details: batchError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      batches: batches || []
    })
    
  } catch (error) {
    console.error('[BATCH API] Error getting batches:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}