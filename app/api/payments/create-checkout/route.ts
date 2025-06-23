import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createVNPayPaymentUrl, generateOrderId } from '@/lib/payments/vnpay'
import { createMoMoPayment, generateMoMoOrderId } from '@/lib/payments/momo'
import {
  UNIFIED_SUBSCRIPTION_PLANS,
  type PaymentMethod,
  type UnifiedSubscriptionPlan,
} from '@/lib/payments/payment-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, billingPeriod, paymentMethod, currency } = body

    // Validate required fields
    if (!planId || !billingPeriod || !paymentMethod) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: planId, billingPeriod, paymentMethod',
        },
        { status: 400 }
      )
    }

    // Validate plan exists
    if (!(planId in UNIFIED_SUBSCRIPTION_PLANS)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // Free plan doesn't need payment
    if (planId === 'free') {
      return NextResponse.json(
        { error: 'Free plan does not require payment' },
        { status: 400 }
      )
    }

    const plan = UNIFIED_SUBSCRIPTION_PLANS[planId as UnifiedSubscriptionPlan]
    let amount = plan.priceVND

    // Apply yearly discount
    if (billingPeriod === 'yearly') {
      amount = amount * 12 * 0.8 // 20% discount for yearly
    }

    // Get user IP for payment providers
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded
      ? forwarded.split(',')[0]
      : request.headers.get('x-real-ip') || '127.0.0.1'

    // Get user info from auth header (simplified for demo)
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    try {
      let paymentUrl: string
      let orderId: string

      switch (paymentMethod as PaymentMethod) {
        case 'vnpay':
          orderId = generateOrderId(user.id, planId)
          const orderInfo = `Prismy ${plan.nameVi} - ${billingPeriod === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}`
          paymentUrl = createVNPayPaymentUrl(
            orderId,
            amount,
            orderInfo,
            ip,
            user.id,
            planId
          )
          break

        case 'momo':
          orderId = generateMoMoOrderId(user.id, planId)
          const momoOrderInfo = `Prismy ${plan.nameVi} - ${billingPeriod === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}`
          const momoResult = await createMoMoPayment(
            orderId,
            amount,
            momoOrderInfo,
            user.id,
            planId
          )

          if (!momoResult.success || !momoResult.payUrl) {
            return NextResponse.json(
              { error: momoResult.error || 'Failed to create MoMo payment' },
              { status: 500 }
            )
          }

          paymentUrl = momoResult.payUrl
          break

        case 'stripe':
          // Stripe integration temporarily disabled
          return NextResponse.json(
            { error: 'Stripe payment temporarily unavailable' },
            { status: 503 }
          )

        default:
          return NextResponse.json(
            { error: 'Unsupported payment method' },
            { status: 400 }
          )
      }

      // Store payment intent in database for tracking
      const { error: dbError } = await supabase.from('payment_intents').insert({
        user_id: user.id,
        order_id: orderId,
        plan_id: planId,
        billing_period: billingPeriod,
        payment_method: paymentMethod,
        amount: amount,
        currency: 'VND',
        status: 'pending',
        created_at: new Date().toISOString(),
      })

      if (dbError) {
        console.error('Failed to store payment intent:', dbError)
        // Continue anyway, don't fail the payment
      }

      return NextResponse.json({
        url: paymentUrl,
        orderId: orderId,
      })
    } catch (error) {
      console.error('Payment creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Request processing error:', error)
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
  }
}
