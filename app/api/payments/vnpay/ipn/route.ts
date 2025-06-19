import { NextRequest, NextResponse } from 'next/server'
import { verifyVNPayCallback } from '@/lib/payments/vnpay'
import { createServiceRoleClient } from '@/lib/supabase'
import { validateWebhookSecurity, verifyVNPayWebhook, logWebhookAttempt, checkWebhookRateLimit } from '@/lib/webhook-security'
import { validateRequest, vnpayCallbackSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  return handleVNPayCallback(request)
}

export async function POST(request: NextRequest) {
  return handleVNPayCallback(request)
}

async function handleVNPayCallback(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    // Rate limiting for webhooks
    const rateLimitOk = await checkWebhookRateLimit('vnpay')
    if (!rateLimitOk) {
      logWebhookAttempt('vnpay', false, 'Rate limit exceeded', { ip: clientIp })
      return NextResponse.json({ RspCode: '99', Message: 'Rate limit exceeded' })
    }

    const url = new URL(request.url)
    const params: Record<string, any> = {}
    
    // Extract all query parameters
    url.searchParams.forEach((value, key) => {
      params[key] = value
    })

    // Validate input data
    const validation = await validateRequest(vnpayCallbackSchema)(params)
    if (!validation.success) {
      logWebhookAttempt('vnpay', false, `Validation failed: ${validation.errors.join(', ')}`, { ip: clientIp })
      return NextResponse.json({ RspCode: '97', Message: 'Invalid parameters' })
    }

    const validatedParams = validation.data

    // Enhanced webhook security validation
    const securityValidation = await validateWebhookSecurity(
      JSON.stringify(validatedParams),
      { 'x-vnpay-signature': validatedParams.vnp_SecureHash },
      (payload, headers) => verifyVNPayWebhook(JSON.parse(payload), process.env.VNPAY_HASH_SECRET!)
    )

    if (!securityValidation.valid) {
      logWebhookAttempt('vnpay', false, securityValidation.error, { ip: clientIp })
      return NextResponse.json({ RspCode: '97', Message: 'Invalid signature' })
    }

    // Legacy verification for compatibility
    const verification = verifyVNPayCallback(validatedParams)
    
    if (!verification.isValid) {
      logWebhookAttempt('vnpay', false, 'Legacy verification failed', { ip: clientIp })
      return NextResponse.json({ RspCode: '97', Message: 'Invalid signature' })
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
      return NextResponse.json({ RspCode: '01', Message: 'Order not found' })
    }

    // Check if payment was successful
    if (verification.responseCode === '00') {
      // Payment successful
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          transaction_id: verification.transactionId,
          completed_at: new Date().toISOString()
        })
        .eq('order_id', verification.orderId)

      // Update user subscription
      await supabase
        .from('user_profiles')
        .update({
          subscription_tier: transaction.plan_key,
          subscription_status: 'active',
          subscription_plan: `vnpay_${transaction.plan_key}`,
          subscription_current_period_start: new Date().toISOString(),
          subscription_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id)

      const processingTime = Date.now() - startTime
      logWebhookAttempt('vnpay', true, undefined, { 
        ip: clientIp, 
        orderId: verification.orderId,
        processingTime: `${processingTime}ms`
      })
      
      console.log('VNPay payment successful:', verification.orderId)
      return NextResponse.json({ RspCode: '00', Message: 'Success' })
    } else {
      // Payment failed
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          transaction_id: verification.transactionId,
          completed_at: new Date().toISOString()
        })
        .eq('order_id', verification.orderId)

      const processingTime = Date.now() - startTime
      logWebhookAttempt('vnpay', true, `Payment failed: ${verification.responseCode}`, { 
        ip: clientIp,
        orderId: verification.orderId,
        processingTime: `${processingTime}ms`
      })

      console.log('VNPay payment failed:', verification.orderId, verification.responseCode)
      return NextResponse.json({ RspCode: '00', Message: 'Confirmed' })
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logWebhookAttempt('vnpay', false, `Processing failed: ${errorMessage}`, { 
      ip: clientIp,
      processingTime: `${processingTime}ms`
    })
    
    console.error('Error processing VNPay callback:', error)
    return NextResponse.json({ RspCode: '99', Message: 'System error' })
  }
}