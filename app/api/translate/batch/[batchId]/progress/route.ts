/**
 * PRISMY BATCH TRANSLATION PROGRESS API
 * Real-time progress tracking for batch translation jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { progressTracker } from '../../route'

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentication check
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { batchId } = params

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    // Get progress from tracker
    const progress = progressTracker.get(batchId)
    
    if (!progress) {
      return NextResponse.json(
        { error: 'Batch not found or expired' },
        { status: 404 }
      )
    }

    return NextResponse.json(progress)

  } catch (error) {
    console.error('[Batch Progress API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}