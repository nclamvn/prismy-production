import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { validateCSRFMiddleware } from '@/lib/csrf'

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET!

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
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

  // Update user profile with subscription info
  await supabase
    .from('user_profiles')
    .update({
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_plan: subscription.items.data[0]?.price.id,
      subscription_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  // Update subscription status and billing period
  await supabase
    .from('user_profiles')
    .update({
      subscription_status: subscription.status,
      subscription_plan: subscription.items.data[0]?.price.id,
      subscription_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  // Reset to free plan
  await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'canceled',
      subscription_plan: null,
      subscription_current_period_start: null,
      subscription_current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  // Log successful payment
  console.log('Payment succeeded for invoice:', invoice.id)
  
  // Could update payment history table here
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  // Handle failed payment
  console.log('Payment failed for invoice:', invoice.id)
  
  // Could send notification to user or update subscription status
}