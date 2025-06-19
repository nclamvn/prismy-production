import { NextRequest, NextResponse } from 'next/server'
import { abTestingFramework } from '@/lib/ab-testing'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET /api/admin/ab-test - List all active tests
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication (admin only)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get active tests
    const activeTests = await abTestingFramework.getActiveTests()
    
    return NextResponse.json({
      success: true,
      activeTests,
      totalActiveTests: activeTests.length
    })

  } catch (error) {
    console.error('Error fetching A/B tests:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch A/B tests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/ab-test - Start a new A/B test
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication (admin only)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { testId, trafficSplit = 0.5 } = body

    if (!testId) {
      return NextResponse.json(
        { error: 'testId is required' },
        { status: 400 }
      )
    }

    if (trafficSplit < 0 || trafficSplit > 1) {
      return NextResponse.json(
        { error: 'trafficSplit must be between 0 and 1' },
        { status: 400 }
      )
    }

    const result = await abTestingFramework.startCachePerformanceTest(testId, trafficSplit)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      testId,
      trafficSplit,
      startedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error starting A/B test:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start A/B test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}