import { NextRequest, NextResponse } from 'next/server'
import { verifyMoMoCallback } from '@/lib/payments/momo'
import { createServiceRoleClient } from '@/lib/supabase'
import { validateWebhookSecurity, verifyMoMoWebhook, logWebhookAttempt, checkWebhookRateLimit } from '@/lib/webhook-security'
import { validateRequest, momoCallbackSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    // Rate limiting for webhooks
    const rateLimitOk = await checkWebhookRateLimit('momo')
    if (!rateLimitOk) {
      logWebhookAttempt('momo', false, 'Rate limit exceeded', { ip: clientIp })
      return NextResponse.json({ resultCode: 99, message: 'Rate limit exceeded' })
    }

    const body = await request.json()
    
    // Validate input data
    const validation = await validateRequest(momoCallbackSchema)(body)
    if (!validation.success) {
      logWebhookAttempt('momo', false, `Validation failed: ${validation.errors.join(', ')}`, { ip: clientIp })
      return NextResponse.json({ resultCode: 97, message: 'Invalid parameters' })
    }

    const validatedBody = validation.data

    // Enhanced webhook security validation
    const securityValidation = await validateWebhookSecurity(
      JSON.stringify(validatedBody),
      { 'x-momo-signature': validatedBody.signature },
      (payload, headers) => verifyMoMoWebhook(JSON.parse(payload), process.env.MOMO_SECRET_KEY!)
    )

    if (!securityValidation.valid) {
      logWebhookAttempt('momo', false, securityValidation.error, { ip: clientIp })
      return NextResponse.json({ resultCode: 97, message: 'Invalid signature' })
    }
    
    // Legacy verification for compatibility
    const verification = verifyMoMoCallback(validatedBody)
    
    if (!verification.isValid) {
      logWebhookAttempt('momo', false, 'Legacy verification failed', { ip: clientIp })
      return NextResponse.json({ resultCode: 97, message: 'Invalid signature' })
    }

    const supabase = createServiceRoleClient()

    // Get payment transaction
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', verification.orderId)
      .single()

    if (!transaction) {
      console.error('Payment transaction not found:', verification.orderId)
      return NextResponse.json({ resultCode: 1, message: 'Order not found' })
    }

    // Check if payment was successful
    if (verification.resultCode === 0) {
      // Payment successful
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          transaction_id: verification.transId,
          completed_at: new Date().toISOString()
        })
        .eq('order_id', verification.orderId)

      // Update user subscription
      await supabase
        .from('user_profiles')
        .update({
          subscription_tier: transaction.plan_key,
          subscription_status: 'active',
          subscription_plan: `momo_${transaction.plan_key}`,
          subscription_current_period_start: new Date().toISOString(),
          subscription_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id)

      const processingTime = Date.now() - startTime
      logWebhookAttempt('momo', true, undefined, { 
        ip: clientIp, 
        orderId: verification.orderId,
        processingTime: `${processingTime}ms`
      })

      console.log('MoMo payment successful:', verification.orderId)
      return NextResponse.json({ resultCode: 0, message: 'Success' })
    } else {
      // Payment failed
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          transaction_id: verification.transId,
          completed_at: new Date().toISOString()
        })
        .eq('order_id', verification.orderId)

      const processingTime = Date.now() - startTime
      logWebhookAttempt('momo', true, `Payment failed: ${verification.resultCode}`, { 
        ip: clientIp,
        orderId: verification.orderId,
        processingTime: `${processingTime}ms`
      })

      console.log('MoMo payment failed:', verification.orderId, verification.resultCode)
      return NextResponse.json({ resultCode: 0, message: 'Confirmed' })
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logWebhookAttempt('momo', false, `Processing failed: ${errorMessage}`, { 
      ip: clientIp,
      processingTime: `${processingTime}ms`
    })
    
    console.error('Error processing MoMo callback:', error)
    return NextResponse.json({ resultCode: 99, message: 'System error' })
  }
}