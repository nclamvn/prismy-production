import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { usageTracker } from '@/lib/usage-tracker'

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET!

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      )
    }

    // Basic rate limiting
    const rateLimitResult = await getRateLimitForTier(request, 'free')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      const error = err as Error
      console.error('Error verifying webhook signature:', error.message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(supabase, subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(supabase, subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(supabase, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(supabase, invoice)
        break
      }

      case 'invoice.upcoming': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoiceUpcoming(supabase, invoice)
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerCreated(supabase, customer)
        break
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerUpdated(supabase, customer)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    const processingTime = Date.now() - startTime
    console.log('Stripe webhook processed successfully', { 
      eventType: event.type,
      processingTime: `${processingTime}ms`
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('Error processing webhook:', error, {
      processingTime: `${processingTime}ms`
    })
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(supabase: any, subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  console.log(`Creating subscription for user ${userId}:`, {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id
  })

  // Update user profile with subscription info
  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_plan: subscription.items.data[0]?.price.id,
      subscription_tier: getPlanTierFromPriceId(subscription.items.data[0]?.price.id),
      subscription_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      usage_reset_date: new Date().toISOString(), // Reset usage when new subscription starts
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user profile for subscription created:', error)
    return
  }

  // Clear usage cache for the user
  usageTracker.clearUserCache(userId)

  // Log subscription event
  await logSubscriptionEvent(supabase, userId, 'subscription_created', {
    subscriptionId: subscription.id,
    status: subscription.status,
    plan: subscription.items.data[0]?.price.id
  })
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  console.log(`Updating subscription ${subscription.id}:`, {
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id
  })

  // Get user info first to log events
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_id, subscription_plan')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!userProfile) {
    console.error('User profile not found for subscription:', subscription.id)
    return
  }

  const oldPlan = userProfile.subscription_plan
  const newPlan = subscription.items.data[0]?.price.id
  const planChanged = oldPlan !== newPlan

  // Update subscription status and billing period
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: subscription.status,
      subscription_plan: newPlan,
      subscription_tier: getPlanTierFromPriceId(newPlan),
      subscription_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
    return
  }

  // Clear usage cache when plan changes
  if (planChanged) {
    usageTracker.clearUserCache(userProfile.user_id)
  }

  // Log subscription event
  await logSubscriptionEvent(supabase, userProfile.user_id, 'subscription_updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
    oldPlan,
    newPlan,
    planChanged
  })
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log(`Deleting subscription ${subscription.id}`)

  // Get user info first
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_id, subscription_plan')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!userProfile) {
    console.error('User profile not found for subscription:', subscription.id)
    return
  }

  // Reset to free plan
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'canceled',
      subscription_plan: null,
      subscription_tier: 'free',
      subscription_current_period_start: null,
      subscription_current_period_end: null,
      usage_reset_date: new Date().toISOString(), // Reset usage when downgrading
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error deleting subscription:', error)
    return
  }

  // Clear usage cache
  usageTracker.clearUserCache(userProfile.user_id)

  // Log subscription event
  await logSubscriptionEvent(supabase, userProfile.user_id, 'subscription_canceled', {
    subscriptionId: subscription.id,
    previousPlan: userProfile.subscription_plan
  })
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id)
  
  if (!invoice.subscription) return

  // Get user info
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()

  if (!userProfile) {
    console.error('User profile not found for subscription:', invoice.subscription)
    return
  }

  // Reset usage for the new billing period
  await supabase
    .from('user_profiles')
    .update({
      usage_reset_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userProfile.user_id)

  // Clear usage cache
  usageTracker.clearUserCache(userProfile.user_id)

  // Log payment event
  await logSubscriptionEvent(supabase, userProfile.user_id, 'payment_succeeded', {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency
  })
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id)
  
  if (!invoice.subscription) return

  // Get user info
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()

  if (!userProfile) {
    console.error('User profile not found for subscription:', invoice.subscription)
    return
  }

  // Log payment failure
  await logSubscriptionEvent(supabase, userProfile.user_id, 'payment_failed', {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    attemptCount: invoice.attempt_count
  })

  // Could add logic here to:
  // - Send notification email to user
  // - Implement grace period before downgrading
  // - Retry payment logic
}

async function handleTrialWillEnd(supabase: any, subscription: Stripe.Subscription) {
  console.log(`Trial ending soon for subscription ${subscription.id}`)

  // Get user info
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!userProfile) {
    console.error('User profile not found for subscription:', subscription.id)
    return
  }

  // Log trial ending event
  await logSubscriptionEvent(supabase, userProfile.user_id, 'trial_ending', {
    subscriptionId: subscription.id,
    trialEnd: new Date((subscription as any).trial_end * 1000).toISOString()
  })

  // Could add logic here to:
  // - Send trial ending notification email
  // - Show in-app notification
  // - Offer discount for conversion
}

async function handleInvoiceUpcoming(supabase: any, invoice: Stripe.Invoice) {
  console.log(`Upcoming invoice for subscription ${invoice.subscription}`)

  if (!invoice.subscription) return

  // Get user info
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()

  if (!userProfile) {
    console.error('User profile not found for subscription:', invoice.subscription)
    return
  }

  // Log upcoming invoice event
  await logSubscriptionEvent(supabase, userProfile.user_id, 'invoice_upcoming', {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    dueDate: new Date(invoice.due_date * 1000).toISOString()
  })

  // Could add logic here to:
  // - Send payment reminder email
  // - Update payment method if needed
  // - Show in-app billing reminder
}

async function handleCustomerCreated(supabase: any, customer: Stripe.Customer) {
  console.log(`Customer created: ${customer.id}`)

  // Log customer creation
  if (customer.metadata?.userId) {
    await logSubscriptionEvent(supabase, customer.metadata.userId, 'customer_created', {
      customerId: customer.id,
      email: customer.email
    })
  }
}

async function handleCustomerUpdated(supabase: any, customer: Stripe.Customer) {
  console.log(`Customer updated: ${customer.id}`)

  // Update customer info if needed
  if (customer.metadata?.userId) {
    await logSubscriptionEvent(supabase, customer.metadata.userId, 'customer_updated', {
      customerId: customer.id,
      email: customer.email
    })
  }
}

// Helper functions
function getPlanTierFromPriceId(priceId: string | null): string {
  if (!priceId) return 'free'
  
  // Map Stripe price IDs to plan tiers
  const priceToTier: Record<string, string> = {
    [process.env.STRIPE_STANDARD_PRICE_ID || '']: 'standard',
    [process.env.STRIPE_PREMIUM_PRICE_ID || '']: 'premium',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'enterprise',
  }
  
  return priceToTier[priceId] || 'free'
}

async function logSubscriptionEvent(
  supabase: any, 
  userId: string, 
  eventType: string, 
  metadata: Record<string, any>
) {
  try {
    await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging subscription event:', error)
  }
}