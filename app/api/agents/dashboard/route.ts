// Agent Dashboard API - Interface for managing autonomous document agents

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getAgentManager } from '@/lib/agents/agent-manager'
import { logger } from '@/lib/logger'
import { analytics } from '@/lib/analytics'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const agentManager = getAgentManager(session.user.id)
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const agentId = url.searchParams.get('agentId')

    switch (action) {
      case 'swarm_status':
        const swarmIntelligence = await agentManager.getSwarmIntelligence()
        return NextResponse.json({
          success: true,
          swarm: swarmIntelligence,
        })

      case 'agent_status':
        if (!agentId) {
          return NextResponse.json(
            { error: 'Agent ID required for status query' },
            { status: 400 }
          )
        }

        const agent = agentManager.getAgentByDocument(agentId)
        if (!agent) {
          return NextResponse.json(
            { error: 'Agent not found' },
            { status: 404 }
          )
        }

        const status = await agent.getAgentStatus()
        return NextResponse.json({
          success: true,
          agent: status,
        })

      case 'notifications':
        const unreadOnly = url.searchParams.get('unread') === 'true'
        const notifications = agentManager.getNotifications(unreadOnly)
        return NextResponse.json({
          success: true,
          notifications,
        })

      case 'list_agents':
        const agents = await Promise.all(
          Array.from(agentManager['agents'].values()).map(async agent => {
            return {
              agentId: agent.agentId,
              documentId: agent.documentId,
              personality: agent.personality,
              state: agent.state,
              status: await agent.getAgentStatus(),
            }
          })
        )

        return NextResponse.json({
          success: true,
          agents,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error({ error }, 'Agent dashboard GET request failed')
    return NextResponse.json(
      { error: 'Failed to process agent dashboard request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, agentId, payload } = body
    const agentManager = getAgentManager(session.user.id)

    switch (action) {
      case 'send_instruction':
        if (!agentId || !payload?.instruction) {
          return NextResponse.json(
            { error: 'Agent ID and instruction required' },
            { status: 400 }
          )
        }

        const agent = agentManager['agents'].get(agentId)
        if (!agent) {
          return NextResponse.json(
            { error: 'Agent not found' },
            { status: 404 }
          )
        }

        const response = await agent.sendInstruction(
          payload.instruction,
          session.user.id
        )

        analytics.track('agent_instruction_sent', {
          agentId,
          userId: session.user.id,
          instructionLength: payload.instruction.length,
        })

        return NextResponse.json({
          success: true,
          response,
        })

      case 'query_swarm':
        if (!payload?.query) {
          return NextResponse.json({ error: 'Query required' }, { status: 400 })
        }

        const swarmResponse = await agentManager.querySwarm(payload.query)

        analytics.track('swarm_query_executed', {
          userId: session.user.id,
          queryLength: payload.query.length,
          agentResponses: swarmResponse.agentResponses,
        })

        return NextResponse.json({
          success: true,
          swarmResponse,
        })

      case 'mark_notification_read':
        if (!payload?.notificationId) {
          return NextResponse.json(
            { error: 'Notification ID required' },
            { status: 400 }
          )
        }

        agentManager.markNotificationAsRead(payload.notificationId)

        return NextResponse.json({
          success: true,
          message: 'Notification marked as read',
        })

      case 'initiate_collaboration':
        if (!payload?.initiatorAgentId || !payload?.task) {
          return NextResponse.json(
            { error: 'Initiator agent ID and task required' },
            { status: 400 }
          )
        }

        const collaborationId = await agentManager.facilitateCollaboration(
          payload.initiatorAgentId,
          payload.task,
          payload.targetPersonalities
        )

        return NextResponse.json({
          success: true,
          collaborationId,
          message: 'Collaboration initiated',
        })

      case 'configure_agent':
        if (!agentId || !payload?.config) {
          return NextResponse.json(
            { error: 'Agent ID and configuration required' },
            { status: 400 }
          )
        }

        // TODO: Implement agent configuration
        // This would allow users to adjust agent autonomy, notification preferences, etc.

        return NextResponse.json({
          success: true,
          message: 'Agent configuration updated',
        })

      case 'remove_agent':
        if (!agentId) {
          return NextResponse.json(
            { error: 'Agent ID required' },
            { status: 400 }
          )
        }

        await agentManager.removeAgent(agentId)

        analytics.track('agent_removed', {
          agentId,
          userId: session.user.id,
        })

        return NextResponse.json({
          success: true,
          message: 'Agent removed successfully',
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error({ error }, 'Agent dashboard POST request failed')
    return NextResponse.json(
      { error: 'Failed to process agent dashboard request' },
      { status: 500 }
    )
  }
}

// WebSocket-like endpoint for real-time agent updates
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, payload } = body
    const agentManager = getAgentManager(session.user.id)

    switch (action) {
      case 'subscribe_to_updates':
        // In a real implementation, this would establish a WebSocket connection
        // For now, we return the current state and let the client poll
        const currentState = {
          swarm: await agentManager.getSwarmIntelligence(),
          notifications: agentManager.getNotifications(true), // Unread only
          timestamp: new Date(),
        }

        return NextResponse.json({
          success: true,
          currentState,
          pollInterval: 5000, // Suggest 5-second polling
        })

      case 'trigger_swarm_learning':
        await agentManager.processSwarmLearning()

        return NextResponse.json({
          success: true,
          message: 'Swarm learning process triggered',
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error({ error }, 'Agent dashboard PUT request failed')
    return NextResponse.json(
      { error: 'Failed to process agent dashboard request' },
      { status: 500 }
    )
  }
}
