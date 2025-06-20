import { NextRequest, NextResponse } from 'next/server'

// Temporarily disabled all Stripe imports for deployment

export async function POST(request: NextRequest) {
  // Temporarily disabled for deployment
  return NextResponse.json({ error: 'Stripe temporarily disabled' }, { status: 503 })
}

/*
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    // Rate limiting for webhooks
    const rateLimitOk = await checkWebhookRateLimit('stripe')
    if (!rateLimitOk) {
      logWebhookAttempt('stripe', false, 'Rate limit exceeded', { ip: clientIp })
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      logWebhookAttempt('stripe', false, 'Missing signature', { ip: clientIp })
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    // Enhanced webhook security validation
    const securityValidation = await validateWebhookSecurity(
      body,
      { 'stripe-signature': sig },
      (payload, headers) => verifyStripeWebhook(payload, headers['stripe-signature'], endpointSecret)
    )

    if (!securityValidation.valid) {
      logWebhookAttempt('stripe', false, securityValidation.error, { ip: clientIp })
      return NextResponse.json(
        { error: securityValidation.error },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      const error = err as Error
      logWebhookAttempt('stripe', false, `Webhook signature verification failed: ${error.message}`, { ip: clientIp })
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
    logWebhookAttempt('stripe', true, undefined, { 
      ip: clientIp, 
      eventType: event.type,
      processingTime: `${processingTime}ms`
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logWebhookAttempt('stripe', false, `Processing failed: ${errorMessage}`, { 
      ip: clientIp,
      processingTime: `${processingTime}ms`
    })
    
    console.error('Error processing webhook:', error)
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
*/