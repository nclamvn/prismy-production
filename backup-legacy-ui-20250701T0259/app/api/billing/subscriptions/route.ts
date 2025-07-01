import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionManager, SUBSCRIPTION_TIERS } from '@/lib/billing/subscription-manager'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Helper function to get user ID from request
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

    const subscriptionManager = SubscriptionManager.getInstance()

    switch (action) {
      case 'current':
        // Get current subscription
        const { data: subscription, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            organizations(name, domain)
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        return NextResponse.json({
          success: true,
          subscription: subscription || null
        })

      case 'usage':
        // Get usage metrics
        const organizationId = searchParams.get('organizationId')
        const usage = await subscriptionManager.getUsageMetrics(
          userId,
          organizationId || undefined
        )

        return NextResponse.json({
          success: true,
          usage
        })

      case 'overage':
        // Calculate overage charges
        const orgId = searchParams.get('organizationId')
        const overage = await subscriptionManager.calculateOverageCharges(
          userId,
          orgId || undefined
        )

        return NextResponse.json({
          success: true,
          overage
        })

      case 'tiers':
        // Get available subscription tiers
        return NextResponse.json({
          success: true,
          tiers: Object.values(SUBSCRIPTION_TIERS)
        })

      case 'history':
        // Get billing history
        const limit = parseInt(searchParams.get('limit') || '50')
        const { data: billingHistory, error: historyError } = await supabase
          .from('billing_records')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (historyError) throw historyError

        return NextResponse.json({
          success: true,
          history: billingHistory
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Billing subscriptions GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process billing request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tierId, organizationId, paymentMethodId } = body

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscriptionManager = SubscriptionManager.getInstance()

    switch (action) {
      case 'create':
        // Create new subscription
        if (!tierId) {
          return NextResponse.json(
            { error: 'Missing required field: tierId' },
            { status: 400 }
          )
        }

        // Validate tier exists
        if (!SUBSCRIPTION_TIERS[tierId]) {
          return NextResponse.json(
            { error: 'Invalid subscription tier' },
            { status: 400 }
          )
        }

        // Check if user already has active subscription
        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()

        if (existingSubscription) {
          return NextResponse.json(
            { error: 'User already has an active subscription' },
            { status: 409 }
          )
        }

        // Validate organization access if provided
        if (organizationId) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

          if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json(
              { error: 'Insufficient permissions to manage organization billing' },
              { status: 403 }
            )
          }
        }

        const result = await subscriptionManager.createSubscription(
          userId,
          organizationId || null,
          tierId,
          paymentMethodId
        )

        return NextResponse.json({
          success: true,
          subscriptionId: result.subscriptionId,
          clientSecret: result.clientSecret
        })

      case 'process_overage':
        // Process overage billing
        const overageOrgId = organizationId || undefined
        await subscriptionManager.processOverageBilling(userId, overageOrgId)

        return NextResponse.json({
          success: true,
          message: 'Overage billing processed'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Billing subscriptions POST API error', { error })
    return NextResponse.json(
      { error: 'Failed to process billing request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, tierId } = body

    if (!subscriptionId || !tierId) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, tierId' },
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

    // Validate user owns the subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id, organization_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to modify subscription
    let hasPermission = subscription.user_id === userId

    if (subscription.organization_id && !hasPermission) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', subscription.organization_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      hasPermission = membership && ['owner', 'admin'].includes(membership.role)
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify subscription' },
        { status: 403 }
      )
    }

    // Validate new tier
    if (!SUBSCRIPTION_TIERS[tierId]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    const subscriptionManager = SubscriptionManager.getInstance()
    await subscriptionManager.updateSubscription(subscriptionId, tierId)

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully'
    })

  } catch (error) {
    logger.error('Billing subscriptions PUT API error', { error })
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')
    const immediately = searchParams.get('immediately') === 'true'

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscriptionId parameter' },
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

    // Validate user owns the subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id, organization_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to cancel subscription
    let hasPermission = subscription.user_id === userId

    if (subscription.organization_id && !hasPermission) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', subscription.organization_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      hasPermission = membership && ['owner', 'admin'].includes(membership.role)
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel subscription' },
        { status: 403 }
      )
    }

    const subscriptionManager = SubscriptionManager.getInstance()
    await subscriptionManager.cancelSubscription(subscriptionId, immediately)

    return NextResponse.json({
      success: true,
      message: immediately 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will be cancelled at the end of the current period'
    })

  } catch (error) {
    logger.error('Billing subscriptions DELETE API error', { error })
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}