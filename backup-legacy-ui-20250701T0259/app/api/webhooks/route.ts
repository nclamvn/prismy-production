import { NextRequest, NextResponse } from 'next/server'
import { WebhookManager } from '@/lib/webhooks/webhook-manager'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const supabase = createRouteHandlerClient({ cookies })
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null
    return user.id
  } catch (error) {
    logger.error('Failed to get user from request', { error })
    return null
  }
}

// Helper function to check organization access
async function hasOrgAccess(userId: string, organizationId: string, requiredRoles: string[] = ['owner', 'admin']): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return membership && requiredRoles.includes(membership.role)
  } catch (error) {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const webhookManager = WebhookManager.getInstance()

    switch (action) {
      case 'list':
        // List webhooks for user or organization
        const organizationId = searchParams.get('organizationId')
        const includeInactive = searchParams.get('includeInactive') === 'true'

        // Verify organization access if specified
        if (organizationId) {
          const hasAccess = await hasOrgAccess(userId, organizationId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const webhooks = await webhookManager.listWebhooks(userId, organizationId, includeInactive)

        return NextResponse.json({
          success: true,
          webhooks: webhooks.map(webhook => ({
            ...webhook,
            secret: undefined // Never expose the secret
          }))
        })

      case 'events':
        // Get webhook events for a specific webhook
        const webhookId = searchParams.get('webhookId')
        const limit = parseInt(searchParams.get('limit') || '50')
        const status = searchParams.get('status')

        if (!webhookId) {
          return NextResponse.json(
            { error: 'Webhook ID is required' },
            { status: 400 }
          )
        }

        // Verify user has access to this webhook
        const userWebhooks = await webhookManager.listWebhooks(userId)
        const webhook = userWebhooks.find(w => w.id === webhookId)

        if (!webhook) {
          return NextResponse.json(
            { error: 'Webhook not found or access denied' },
            { status: 404 }
          )
        }

        // Get webhook events
        let eventsQuery = supabase
          .from('webhook_events')
          .select('*')
          .eq('webhook_id', webhookId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (status) {
          eventsQuery = eventsQuery.eq('status', status)
        }

        const { data: events, error: eventsError } = await eventsQuery

        if (eventsError) throw eventsError

        return NextResponse.json({
          success: true,
          events: events || []
        })

      case 'stats':
        // Get webhook statistics
        const statsOrgId = searchParams.get('organizationId')
        const days = parseInt(searchParams.get('days') || '30')

        // Verify organization access if specified
        if (statsOrgId) {
          const hasAccess = await hasOrgAccess(userId, statsOrgId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const { data: stats, error: statsError } = await supabase.rpc('get_webhook_statistics', {
          p_organization_id: statsOrgId || null,
          p_days: days
        })

        if (statsError) throw statsError

        return NextResponse.json({
          success: true,
          statistics: stats[0] || {}
        })

      case 'available-events':
        // Get list of available webhook events
        const availableEvents = [
          // User events
          'user.created',
          'user.updated',
          'user.deleted',
          'user.login',
          'user.logout',
          
          // Document events
          'document.uploaded',
          'document.processed',
          'document.deleted',
          'document.shared',
          
          // Translation events
          'translation.started',
          'translation.completed',
          'translation.failed',
          'translation.reviewed',
          
          // Organization events
          'organization.created',
          'organization.updated',
          'organization.member_added',
          'organization.member_removed',
          'organization.member_role_changed',
          
          // Billing events
          'billing.payment_succeeded',
          'billing.payment_failed',
          'billing.subscription_created',
          'billing.subscription_updated',
          'billing.subscription_cancelled',
          'billing.invoice_created',
          
          // Security events
          'security.login_failed',
          'security.password_changed',
          'security.two_factor_enabled',
          'security.two_factor_disabled',
          'security.suspicious_activity',
          
          // API events
          'api.key_created',
          'api.key_revoked',
          'api.rate_limit_exceeded',
          
          // Workflow events
          'workflow.created',
          'workflow.updated',
          'workflow.executed',
          'workflow.failed'
        ]

        return NextResponse.json({
          success: true,
          events: availableEvents.map(event => ({
            name: event,
            description: event.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }))
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Webhooks GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const webhookManager = WebhookManager.getInstance()

    switch (action) {
      case 'create':
        // Create a new webhook
        const {
          name,
          url,
          events,
          organizationId,
          headers = {},
          retryConfig
        } = data

        if (!name || !url || !events || !events.length) {
          return NextResponse.json(
            { error: 'Name, URL, and events are required' },
            { status: 400 }
          )
        }

        // Validate URL format
        try {
          new URL(url)
        } catch {
          return NextResponse.json(
            { error: 'Invalid URL format' },
            { status: 400 }
          )
        }

        // Verify organization access if specified
        if (organizationId) {
          const hasAccess = await hasOrgAccess(userId, organizationId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions to create organization webhook' },
              { status: 403 }
            )
          }
        }

        const webhook = await webhookManager.createWebhook({
          userId,
          organizationId,
          name,
          url,
          events,
          headers,
          retryConfig
        })

        return NextResponse.json({
          success: true,
          webhook: {
            ...webhook,
            secret: undefined // Don't expose secret
          },
          message: 'Webhook created successfully'
        })

      case 'trigger':
        // Manually trigger a webhook (for testing)
        const {
          webhookId,
          eventType,
          payload = {}
        } = data

        if (!webhookId || !eventType) {
          return NextResponse.json(
            { error: 'Webhook ID and event type are required' },
            { status: 400 }
          )
        }

        // Verify user has access to this webhook
        const userWebhooks = await webhookManager.listWebhooks(userId)
        const targetWebhook = userWebhooks.find(w => w.id === webhookId)

        if (!targetWebhook) {
          return NextResponse.json(
            { error: 'Webhook not found or access denied' },
            { status: 404 }
          )
        }

        // Check if webhook supports this event type
        if (!targetWebhook.events.includes(eventType)) {
          return NextResponse.json(
            { error: 'Webhook does not support this event type' },
            { status: 400 }
          )
        }

        // Trigger the webhook
        await webhookManager.triggerWebhook(
          eventType,
          {
            ...payload,
            test: true,
            triggeredBy: userId
          },
          targetWebhook.organizationId,
          targetWebhook.userId,
          { retryImmediately: true }
        )

        return NextResponse.json({
          success: true,
          message: 'Test webhook triggered successfully'
        })

      case 'verify-signature':
        // Verify webhook signature (for webhook endpoint testing)
        const {
          payload: rawPayload,
          signature,
          secret,
          timestamp
        } = data

        if (!rawPayload || !signature || !secret) {
          return NextResponse.json(
            { error: 'Payload, signature, and secret are required' },
            { status: 400 }
          )
        }

        const isValid = webhookManager.verifyWebhookSignature(
          typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload),
          signature,
          secret,
          timestamp
        )

        return NextResponse.json({
          success: true,
          valid: isValid,
          message: isValid ? 'Signature is valid' : 'Signature is invalid'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Webhooks POST API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookId, ...updates } = body

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this webhook
    const webhookManager = WebhookManager.getInstance()
    const userWebhooks = await webhookManager.listWebhooks(userId)
    const webhook = userWebhooks.find(w => w.id === webhookId)

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found or access denied' },
        { status: 404 }
      )
    }

    // Validate URL if being updated
    if (updates.url) {
      try {
        new URL(updates.url)
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }
    }

    // Update the webhook
    const success = await webhookManager.updateWebhook(webhookId, updates, userId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook updated successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to update webhook' },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Webhooks PUT API error', { error })
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('webhookId')

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this webhook
    const webhookManager = WebhookManager.getInstance()
    const userWebhooks = await webhookManager.listWebhooks(userId)
    const webhook = userWebhooks.find(w => w.id === webhookId)

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the webhook
    const success = await webhookManager.deleteWebhook(webhookId, userId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook deleted successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to delete webhook' },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Webhooks DELETE API error', { error })
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}