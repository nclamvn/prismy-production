import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

interface UsageTrackingRequest {
  userId: string
  eventType: 'translation' | 'document_processing' | 'api_call'
  quantity: number
  metadata?: {
    textLength?: number
    documentSize?: number
    sourceLanguage?: string
    targetLanguage?: string
    qualityTier?: string
    provider?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: UsageTrackingRequest = await request.json()
    
    // Validate request
    if (!body.userId || !body.eventType || !body.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, eventType, quantity' },
        { status: 400 }
      )
    }

    // Use server supabase instance
    
    // Get user's subscription info
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', body.userId)
      .eq('status', 'active')
      .single()

    if (subError) {
      logger.error('Failed to get user subscription', { userId: body.userId, error: subError })
      return NextResponse.json(
        { error: 'User subscription not found' },
        { status: 404 }
      )
    }

    // Calculate credits consumed based on event type
    const creditsConsumed = calculateCredits(body.eventType, body.quantity, body.metadata)
    
    // Record usage in database
    const { error: usageError } = await supabase
      .from('usage_logs')
      .insert({
        user_id: body.userId,
        subscription_id: subscription.id,
        event_type: body.eventType,
        quantity: body.quantity,
        credits_consumed: creditsConsumed,
        metadata: body.metadata,
        created_at: new Date().toISOString()
      })

    if (usageError) {
      logger.error('Failed to record usage', { userId: body.userId, error: usageError })
      return NextResponse.json(
        { error: 'Failed to record usage' },
        { status: 500 }
      )
    }

    // Update user credits
    const { error: creditError } = await supabase.rpc('deduct_user_credits', {
      p_user_id: body.userId,
      p_credits: creditsConsumed
    })

    if (creditError) {
      logger.error('Failed to deduct credits', { userId: body.userId, error: creditError })
      // Continue - don't fail the request for credit deduction issues
    }

    // Report usage to Stripe for metered billing
    if (subscription.stripe_subscription_id && subscription.usage_based) {
      try {
        await reportUsageToStripe(
          subscription.stripe_subscription_id,
          creditsConsumed,
          body.eventType
        )
      } catch (stripeError) {
        logger.error('Failed to report usage to Stripe', { 
          subscriptionId: subscription.stripe_subscription_id, 
          error: stripeError 
        })
        // Continue - don't fail for Stripe reporting issues
      }
    }

    // Get updated credit balance
    const { data: creditBalance } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', body.userId)
      .single()

    return NextResponse.json({
      success: true,
      creditsConsumed,
      remainingCredits: creditBalance?.balance || 0,
      usage: {
        eventType: body.eventType,
        quantity: body.quantity,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Usage tracking API error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || '30d'

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    // Use server supabase instance

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get usage statistics
    const { data: usage, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to get usage data', { userId, error })
      return NextResponse.json(
        { error: 'Failed to retrieve usage data' },
        { status: 500 }
      )
    }

    // Aggregate usage by event type
    const aggregatedUsage = usage.reduce((acc, log) => {
      const eventType = log.event_type
      if (!acc[eventType]) {
        acc[eventType] = {
          count: 0,
          totalQuantity: 0,
          totalCredits: 0
        }
      }
      acc[eventType].count += 1
      acc[eventType].totalQuantity += log.quantity
      acc[eventType].totalCredits += log.credits_consumed
      return acc
    }, {} as Record<string, any>)

    // Get current credit balance
    const { data: creditBalance } = await supabase
      .from('user_credits')
      .select('balance, updated_at')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      success: true,
      period,
      usage: {
        raw: usage,
        aggregated: aggregatedUsage,
        totalEvents: usage.length,
        totalCreditsConsumed: usage.reduce((sum, log) => sum + log.credits_consumed, 0)
      },
      currentBalance: creditBalance?.balance || 0,
      lastUpdated: creditBalance?.updated_at || null
    })

  } catch (error) {
    logger.error('Usage retrieval API error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate credits based on usage
function calculateCredits(
  eventType: string, 
  quantity: number, 
  metadata?: any
): number {
  switch (eventType) {
    case 'translation':
      // 1 credit per 1000 characters
      const textLength = metadata?.textLength || quantity
      return Math.ceil(textLength / 1000)
      
    case 'document_processing':
      // 10 credits per document + 1 credit per MB
      const sizeInMB = metadata?.documentSize ? metadata.documentSize / (1024 * 1024) : 1
      return 10 + Math.ceil(sizeInMB)
      
    case 'api_call':
      // 1 credit per API call
      return quantity
      
    default:
      return quantity
  }
}

// Helper function to report usage to Stripe
async function reportUsageToStripe(
  stripeSubscriptionId: string,
  quantity: number,
  eventType: string
) {
  try {
    // Get subscription to find usage-based subscription item
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: ['items']
    })

    // Find the usage-based subscription item
    const usageItem = subscription.items.data.find(item => 
      item.price.billing_scheme === 'per_unit'
    )

    if (!usageItem) {
      logger.warn('No usage-based subscription item found', { stripeSubscriptionId })
      return
    }

    // Create usage record
    await stripe.subscriptionItems.createUsageRecord(usageItem.id, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment'
    })

    logger.info('Usage reported to Stripe successfully', {
      subscriptionId: stripeSubscriptionId,
      quantity,
      eventType
    })

  } catch (error) {
    logger.error('Failed to report usage to Stripe', { error })
    throw error
  }
}