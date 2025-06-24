/**
 * PRISMY BATCH TRANSLATION RESULTS API
 * Retrieves final results for completed batch translation jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// In-memory results storage (in production, use database)
const resultsStorage = new Map<string, any>()

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

    // Get results from storage (in production, from database)
    const results = resultsStorage.get(batchId)
    
    if (!results) {
      return NextResponse.json(
        { error: 'Batch results not found or not yet available' },
        { status: 404 }
      )
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('[Batch Results API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to store results (called from the batch processing)
export async function storeBatchResults(batchId: string, results: any): Promise<void> {
  resultsStorage.set(batchId, results)
  
  // In production, store in database
  console.log('[Batch Results] Stored results for batch:', batchId)
}

// Export storage for use in batch processing
export { resultsStorage }