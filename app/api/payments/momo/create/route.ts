import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createMoMoPayment, generateMoMoOrderId, MOMO_SUBSCRIPTION_PLANS } from '@/lib/payments/momo'
import { checkPaymentRateLimit } from '@/lib/rate-limiter'
import { validateRequest, paymentSchema } from '@/lib/validation'
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

    // Check payment rate limiting
    const rateLimitResult = await checkPaymentRateLimit(session.user.id)
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
    
    // Prepare validation data
    const validationData = {
      planKey: body.planKey,
      amount: MOMO_SUBSCRIPTION_PLANS[body.planKey as keyof typeof MOMO_SUBSCRIPTION_PLANS]?.price || 0,
      currency: 'VND' as const,
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
    if (!planKey || !(planKey in MOMO_SUBSCRIPTION_PLANS)) {
      return NextResponse.json(
        { error: 'Gói dịch vụ không hợp lệ' },
        { status: 400 }
      )
    }

    const plan = MOMO_SUBSCRIPTION_PLANS[planKey as keyof typeof MOMO_SUBSCRIPTION_PLANS]
    const user = session.user
    
    // Generate order ID
    const orderId = generateMoMoOrderId(user.id, planKey)
    
    // Create order info
    const orderInfo = `Prismy ${plan.name} - ${user.email}`
    
    // Create MoMo payment
    const paymentResult = await createMoMoPayment(
      orderId,
      plan.price,
      orderInfo,
      user.id,
      planKey
    )

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Lỗi tạo thanh toán MoMo' },
        { status: 400 }
      )
    }

    // Store pending payment in database
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        order_id: orderId,
        payment_method: 'momo',
        plan_key: planKey,
        amount: plan.price,
        currency: 'VND',
        status: 'pending',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      paymentUrl: paymentResult.payUrl,
      qrCodeUrl: paymentResult.qrCodeUrl,
      deeplink: paymentResult.deeplink,
      orderId 
    })

  } catch (error) {
    console.error('Error creating MoMo payment:', error)
    return NextResponse.json(
      { error: 'Lỗi tạo thanh toán MoMo' },
      { status: 500 }
    )
  }
}