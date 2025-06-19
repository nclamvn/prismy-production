import { NextRequest, NextResponse } from 'next/server'
import { abTestingFramework } from '@/lib/ab-testing'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET /api/admin/ab-test/[testId] - Get metrics for specific test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
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

    const resolvedParams = await params
    const testId = resolvedParams.testId

    if (!testId) {
      return NextResponse.json(
        { error: 'testId is required' },
        { status: 400 }
      )
    }

    const metrics = await abTestingFramework.getTestMetrics(testId)

    if (!metrics) {
      return NextResponse.json(
        { error: 'Test not found or no data available' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      testId,
      metrics,
      isActive: abTestingFramework.isTestActive(testId),
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching A/B test metrics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch A/B test metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ab-test/[testId] - Stop a test
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
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

    const resolvedParams = await params
    const testId = resolvedParams.testId

    if (!testId) {
      return NextResponse.json(
        { error: 'testId is required' },
        { status: 400 }
      )
    }

    const result = await abTestingFramework.stopTest(testId)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to stop test' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `A/B test ${testId} stopped successfully`,
      testId,
      finalMetrics: result.metrics,
      stoppedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error stopping A/B test:', error)
    return NextResponse.json(
      { 
        error: 'Failed to stop A/B test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}