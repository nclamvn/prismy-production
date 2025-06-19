import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createBillingPortalSession } from '@/lib/stripe'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { validateCSRFMiddleware } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  try {
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

    // Apply rate limiting for billing portal access
    const rateLimitResult = await getRateLimitForTier(request, 'premium')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many billing portal requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    // Get user profile to find Stripe customer ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Create Stripe billing portal session
    const { url } = await createBillingPortalSession(
      profile.stripe_customer_id,
      `${origin}/dashboard/billing`
    )

    return NextResponse.json({ url })

  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}