import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

interface DeployRequest {
  functionName: string
  action: 'deploy' | 'status' | 'logs' | 'invoke'
  payload?: any
}

// Get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null
    return user.id
  } catch (error) {
    logger.error('Failed to get user from request', { error })
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DeployRequest = await request.json()
    const { functionName, action, payload } = body

    if (!functionName || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: functionName, action' },
        { status: 400 }
      )
    }

    // Verify user authorization (admin only for deployment operations)
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    switch (action) {
      case 'deploy':
        // Deploy the Edge Function
        const deployResponse = await fetch(
          `${supabaseUrl}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deploy: true })
          }
        )

        if (!deployResponse.ok) {
          throw new Error(`Deployment failed: ${deployResponse.statusText}`)
        }

        const deployResult = await deployResponse.json()

        // Log deployment
        await supabase.from('edge_function_deployments').insert({
          function_name: functionName,
          deployed_by: userId,
          status: 'deployed',
          metadata: deployResult
        })

        logger.info('Edge Function deployed', { functionName, userId })

        return NextResponse.json({
          success: true,
          message: `Function ${functionName} deployed successfully`,
          result: deployResult
        })

      case 'status':
        // Get function status
        const statusResponse = await fetch(
          `${supabaseUrl}/functions/v1/${functionName}/status`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`
            }
          }
        )

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.statusText}`)
        }

        const statusResult = await statusResponse.json()

        return NextResponse.json({
          success: true,
          status: statusResult
        })

      case 'logs':
        // Get function logs
        const logsResponse = await fetch(
          `${supabaseUrl}/functions/v1/${functionName}/logs`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`
            }
          }
        )

        if (!logsResponse.ok) {
          throw new Error(`Logs fetch failed: ${logsResponse.statusText}`)
        }

        const logsResult = await logsResponse.json()

        return NextResponse.json({
          success: true,
          logs: logsResult
        })

      case 'invoke':
        // Test function invocation
        const invokeResponse = await fetch(
          `${supabaseUrl}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload || {})
          }
        )

        const invokeResult = await invokeResponse.json()
        const invokeSuccess = invokeResponse.ok

        // Log invocation
        await supabase.from('edge_function_invocations').insert({
          function_name: functionName,
          invoked_by: userId,
          success: invokeSuccess,
          response_status: invokeResponse.status,
          payload,
          result: invokeResult,
          latency_ms: 0 // Would be measured in practice
        })

        return NextResponse.json({
          success: invokeSuccess,
          status: invokeResponse.status,
          result: invokeResult
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Edge Function API error', { error })
    return NextResponse.json(
      { error: 'Failed to process Edge Function request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'list':
        // List all Edge Functions
        const { data: functions, error } = await supabase
          .from('edge_function_deployments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        return NextResponse.json({
          success: true,
          functions
        })

      case 'performance':
        // Get performance metrics
        const functionName = searchParams.get('function')
        if (!functionName) {
          return NextResponse.json(
            { error: 'Function name required' },
            { status: 400 }
          )
        }

        const { data: metrics, error: metricsError } = await supabase
          .from('edge_function_invocations')
          .select('*')
          .eq('function_name', functionName)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })

        if (metricsError) throw metricsError

        // Calculate performance stats
        const totalInvocations = metrics?.length || 0
        const successfulInvocations = metrics?.filter(m => m.success).length || 0
        const avgLatency = metrics?.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / totalInvocations || 0
        const errorRate = ((totalInvocations - successfulInvocations) / totalInvocations) * 100 || 0

        return NextResponse.json({
          success: true,
          performance: {
            totalInvocations,
            successfulInvocations,
            avgLatency,
            errorRate,
            uptime: 100 - errorRate
          },
          recentInvocations: metrics?.slice(0, 10)
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Edge Function GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}