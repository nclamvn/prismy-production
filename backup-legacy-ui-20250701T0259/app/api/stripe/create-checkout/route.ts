import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase'
import { validateCSRFMiddleware } from '@/lib/csrf'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { validateRequest, paymentSchema } from '@/lib/validation'
import { stripe, SUBSCRIPTION_PLANS, createCheckoutSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate CSRF token
    const csrfValidation = await validateCSRFMiddleware(request, session.user.id)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: csrfValidation.error || 'CSRF validation failed' },
        { status: 403 }
      )
    }

    // Check payment rate limiting
    const rateLimitResult = await getRateLimitForTier(request, 'premium')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many payment attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Prepare validation data for Stripe (USD amounts)
    const validationData = {
      planKey: body.planKey,
      amount: SUBSCRIPTION_PLANS[body.planKey as keyof typeof SUBSCRIPTION_PLANS]?.price || 0,
      currency: 'USD' as const,
      csrf_token: body.csrf_token || request.headers.get('x-csrf-token')
    }

    // Validate input
    const validation = await validateRequest(paymentSchema)(validationData)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { planKey } = validation.data
    
    // Validate plan
    if (!planKey || !(planKey in SUBSCRIPTION_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS]

    if (!plan.priceId) {
      return NextResponse.json(
        { error: 'Plan price ID not configured' },
        { status: 400 }
      )
    }

    const user = session.user
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Create Stripe checkout session
    const { sessionId, url } = await createCheckoutSession(
      plan.priceId,
      user.id,
      user.email!,
      `${origin}/dashboard?success=true`,
      `${origin}/pricing?canceled=true`
    )

    return NextResponse.json({ 
      sessionId,
      url 
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}