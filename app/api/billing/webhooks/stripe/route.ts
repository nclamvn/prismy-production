import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { SubscriptionManager } from '@/lib/billing/subscription-manager'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      logger.error('Invalid Stripe webhook signature', { error })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    logger.info('Processing Stripe webhook', { 
      type: event.type, 
      id: event.id 
    })

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      case 'invoice.upcoming':
        await handleUpcomingInvoice(event.data.object as Stripe.Invoice)
        break

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      default:
        logger.info('Unhandled Stripe webhook event', { type: event.type })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    logger.error('Stripe webhook processing failed', { error })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata.userId
    const organizationId = subscription.metadata.organizationId || null
    const tier = subscription.metadata.tier

    if (!userId || !tier) {
      logger.error('Missing metadata in subscription created webhook', { 
        subscriptionId: subscription.id 
      })
      return
    }

    // Update subscription status in database
    await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    // Log billing event
    await supabase.from('billing_records').insert({
      user_id: userId,
      organization_id: organizationId,
      subscription_id: subscription.id,
      event_type: 'subscription_created',
      amount: 0,
      currency: 'USD',
      status: 'completed',
      metadata: {
        stripe_subscription_id: subscription.id,
        tier
      }
    })

    logger.info('Subscription created webhook processed', { 
      subscriptionId: subscription.id,
      userId,
      tier
    })

  } catch (error) {
    logger.error('Failed to handle subscription created', { error, subscriptionId: subscription.id })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Update subscription in database
    await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    // Get subscription details for logging
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('user_id, organization_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (subData) {
      await supabase.from('billing_records').insert({
        user_id: subData.user_id,
        organization_id: subData.organization_id,
        subscription_id: subscription.id,
        event_type: 'subscription_updated',
        amount: 0,
        currency: 'USD',
        status: 'completed',
        metadata: {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end
        }
      })
    }

    logger.info('Subscription updated webhook processed', { 
      subscriptionId: subscription.id,
      status: subscription.status
    })

  } catch (error) {
    logger.error('Failed to handle subscription updated', { error, subscriptionId: subscription.id })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Update subscription status to cancelled
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    // Get subscription details for logging
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('user_id, organization_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (subData) {
      await supabase.from('billing_records').insert({
        user_id: subData.user_id,
        organization_id: subData.organization_id,
        subscription_id: subscription.id,
        event_type: 'subscription_cancelled',
        amount: 0,
        currency: 'USD',
        status: 'completed',
        metadata: {
          cancelled_at: new Date().toISOString()
        }
      })

      // Send cancellation notification (implement as needed)
      await sendCancellationNotification(subData.user_id, subscription.id)
    }

    logger.info('Subscription deleted webhook processed', { 
      subscriptionId: subscription.id 
    })

  } catch (error) {
    logger.error('Failed to handle subscription deleted', { error, subscriptionId: subscription.id })
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string
    const amount = invoice.amount_paid / 100 // Convert from cents

    // Get subscription details
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('user_id, organization_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subData) {
      // Log successful payment
      await supabase.from('billing_records').insert({
        user_id: subData.user_id,
        organization_id: subData.organization_id,
        subscription_id: subscriptionId,
        event_type: 'payment_succeeded',
        amount,
        currency: invoice.currency.toUpperCase(),
        status: 'paid',
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.number,
          paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString()
        }
      })

      // Update subscription status if needed
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)

      // Send payment confirmation (implement as needed)
      await sendPaymentConfirmation(subData.user_id, amount, invoice.currency)
    }

    logger.info('Payment succeeded webhook processed', { 
      invoiceId: invoice.id,
      subscriptionId,
      amount
    })

  } catch (error) {
    logger.error('Failed to handle payment succeeded', { error, invoiceId: invoice.id })
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string
    const amount = invoice.amount_due / 100 // Convert from cents

    // Get subscription details
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('user_id, organization_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subData) {
      // Log failed payment
      await supabase.from('billing_records').insert({
        user_id: subData.user_id,
        organization_id: subData.organization_id,
        subscription_id: subscriptionId,
        event_type: 'payment_failed',
        amount,
        currency: invoice.currency.toUpperCase(),
        status: 'failed',
        metadata: {
          invoice_id: invoice.id,
          failure_reason: invoice.last_finalization_error?.message || 'Payment failed'
        }
      })

      // Send payment failure notification (implement as needed)
      await sendPaymentFailureNotification(subData.user_id, amount, invoice.currency)
    }

    logger.info('Payment failed webhook processed', { 
      invoiceId: invoice.id,
      subscriptionId,
      amount
    })

  } catch (error) {
    logger.error('Failed to handle payment failed', { error, invoiceId: invoice.id })
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('user_id, organization_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (subData) {
      // Send trial ending notification (implement as needed)
      await sendTrialEndingNotification(subData.user_id, subscription.trial_end!)
    }

    logger.info('Trial will end webhook processed', { 
      subscriptionId: subscription.id 
    })

  } catch (error) {
    logger.error('Failed to handle trial will end', { error, subscriptionId: subscription.id })
  }
}

async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string
    
    // Process any usage-based charges
    const subscriptionManager = SubscriptionManager.getInstance()
    
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('user_id, organization_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subData) {
      // Calculate and add overage charges
      await subscriptionManager.processOverageBilling(
        subData.user_id,
        subData.organization_id
      )

      // Send upcoming invoice notification (implement as needed)
      await sendUpcomingInvoiceNotification(subData.user_id, invoice.amount_due / 100)
    }

    logger.info('Upcoming invoice webhook processed', { 
      invoiceId: invoice.id,
      subscriptionId
    })

  } catch (error) {
    logger.error('Failed to handle upcoming invoice', { error, invoiceId: invoice.id })
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    logger.info('Customer created webhook processed', { 
      customerId: customer.id,
      email: customer.email
    })

    // Additional customer setup logic can be added here

  } catch (error) {
    logger.error('Failed to handle customer created', { error, customerId: customer.id })
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  try {
    logger.info('Customer updated webhook processed', { 
      customerId: customer.id,
      email: customer.email
    })

    // Update customer information if needed

  } catch (error) {
    logger.error('Failed to handle customer updated', { error, customerId: customer.id })
  }
}

// Notification functions (implement based on your notification system)
async function sendCancellationNotification(userId: string, subscriptionId: string) {
  // Implement cancellation notification logic
  logger.info('Cancellation notification sent', { userId, subscriptionId })
}

async function sendPaymentConfirmation(userId: string, amount: number, currency: string) {
  // Implement payment confirmation logic
  logger.info('Payment confirmation sent', { userId, amount, currency })
}

async function sendPaymentFailureNotification(userId: string, amount: number, currency: string) {
  // Implement payment failure notification logic
  logger.info('Payment failure notification sent', { userId, amount, currency })
}

async function sendTrialEndingNotification(userId: string, trialEnd: number) {
  // Implement trial ending notification logic
  logger.info('Trial ending notification sent', { userId, trialEnd })
}

async function sendUpcomingInvoiceNotification(userId: string, amount: number) {
  // Implement upcoming invoice notification logic
  logger.info('Upcoming invoice notification sent', { userId, amount })
}