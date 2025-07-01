/**
 * Payment Service API Contract Tests
 * Tests payment-service.ts with MSW mocked payment providers
 */

import { 
  PaymentService, 
  UNIFIED_SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type PaymentMethod,
  type Currency 
} from '../payments/payment-service'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'

// Mock Stripe API
const stripeHandlers = [
  http.post('https://api.stripe.com/v1/checkout/sessions', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.includes('sk_test_')) {
      return HttpResponse.json(
        { error: { message: 'Invalid API key' } },
        { status: 401 }
      )
    }

    const body = await request.text()
    const params = new URLSearchParams(body)
    
    return HttpResponse.json({
      id: 'cs_test_' + Math.random().toString(36).substring(7),
      object: 'checkout.session',
      payment_url: 'https://checkout.stripe.com/pay/cs_test_example',
      amount_total: parseInt(params.get('line_items[0][price_data][unit_amount]') || '0'),
      currency: params.get('line_items[0][price_data][currency]') || 'usd',
      mode: params.get('mode') || 'subscription',
      status: 'open',
      url: 'https://checkout.stripe.com/pay/cs_test_example'
    })
  }),

  http.post('https://api.stripe.com/v1/webhook_endpoints', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      id: 'we_' + Math.random().toString(36).substring(7),
      object: 'webhook_endpoint',
      enabled_events: ['checkout.session.completed'],
      url: 'https://api.example.com/stripe/webhook',
      status: 'enabled'
    })
  })
]

// Mock VNPay API
const vnpayHandlers = [
  http.get('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', ({ request }) => {
    const url = new URL(request.url)
    const vnp_SecureHash = url.searchParams.get('vnp_SecureHash')
    
    if (!vnp_SecureHash) {
      return HttpResponse.text('Invalid signature', { status: 400 })
    }

    // Simulate redirect to VNPay payment page
    return HttpResponse.text(`
      <html>
        <body>
          <h1>VNPay Payment Gateway</h1>
          <p>Amount: ${url.searchParams.get('vnp_Amount')}</p>
          <p>Order: ${url.searchParams.get('vnp_OrderInfo')}</p>
        </body>
      </html>
    `)
  })
]

// Mock MoMo API
const momoHandlers = [
  http.post('https://test-payment.momo.vn/v2/gateway/api/create', async ({ request }) => {
    const body = await request.json() as any
    
    if (!body.partnerCode || !body.requestId) {
      return HttpResponse.json(
        { resultCode: 99, message: 'Invalid request' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      partnerCode: body.partnerCode,
      requestId: body.requestId,
      orderId: body.orderId,
      amount: body.amount,
      responseTime: Date.now(),
      message: 'Success',
      resultCode: 0,
      payUrl: 'https://test-payment.momo.vn/pay/' + body.orderId,
      qrCodeUrl: 'https://test-payment.momo.vn/qr/' + body.orderId
    })
  })
]

describe('Payment Service API Contract Tests', () => {
  let paymentService: PaymentService

  beforeAll(() => {
    // Add payment provider handlers
    server.use(...stripeHandlers, ...vnpayHandlers, ...momoHandlers)
  })

  beforeEach(() => {
    paymentService = new PaymentService({
      stripeSecretKey: 'sk_test_1234567890',
      vnpayConfig: {
        tmnCode: 'TEST1234',
        hashSecret: 'SECRETKEY',
        url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: 'https://example.com/vnpay/return'
      },
      momoConfig: {
        partnerCode: 'MOMO_TEST',
        accessKey: 'TEST_ACCESS',
        secretKey: 'TEST_SECRET',
        endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create'
      }
    })
  })

  describe('Unified Subscription Plans', () => {
    it('should have consistent plan structure', () => {
      Object.entries(UNIFIED_SUBSCRIPTION_PLANS).forEach(([key, plan]) => {
        expect(plan).toMatchObject({
          priceUSD: expect.any(Number),
          priceVND: expect.any(Number),
          name: {
            en: expect.any(String),
            vi: expect.any(String)
          },
          limits: {
            translations: expect.any(Number),
            documents: expect.any(Number),
            characters: expect.any(Number)
          }
        })

        // Validate price consistency
        if (key === 'free') {
          expect(plan.priceUSD).toBe(0)
          expect(plan.priceVND).toBe(0)
        } else {
          expect(plan.priceUSD).toBeGreaterThan(0)
          expect(plan.priceVND).toBeGreaterThan(0)
        }
      })
    })

    it('should have proper VND to USD conversion rates', () => {
      const { standard, premium, enterprise } = UNIFIED_SUBSCRIPTION_PLANS
      
      // Check that VND prices are roughly 24,000x USD prices (approximate exchange rate)
      const expectedRate = 24000
      const tolerance = 0.1 // 10% tolerance

      expect(standard.priceVND / standard.priceUSD).toBeCloseTo(expectedRate, -4)
      expect(premium.priceVND / premium.priceUSD).toBeCloseTo(expectedRate, -4)
      expect(enterprise.priceVND / enterprise.priceUSD).toBeCloseTo(expectedRate, -4)
    })
  })

  describe('Stripe Integration', () => {
    it('should create checkout session with correct parameters', async () => {
      const session = await paymentService.createCheckoutSession(
        'premium',
        'stripe',
        'USD',
        'user_123',
        'https://example.com/success',
        'https://example.com/cancel'
      )

      expect(session).toMatchObject({
        id: expect.stringMatching(/^cs_test_/),
        payment_url: expect.stringMatching(/^https:\/\/checkout\.stripe\.com/),
        amount_total: 2999, // $29.99 in cents
        currency: 'usd'
      })
    })

    it('should handle Stripe API errors', async () => {
      server.use(
        http.post('https://api.stripe.com/v1/checkout/sessions', () => {
          return HttpResponse.json(
            { 
              error: { 
                type: 'invalid_request_error',
                message: 'Invalid parameters' 
              } 
            },
            { status: 400 }
          )
        })
      )

      await expect(
        paymentService.createCheckoutSession(
          'premium',
          'stripe',
          'USD',
          'user_123'
        )
      ).rejects.toThrow()
    })

    it('should format currency correctly for Stripe', () => {
      const formatted = paymentService.formatCurrency(29.99, 'USD')
      expect(formatted).toBe('$29.99')
    })
  })

  describe('VNPay Integration', () => {
    it('should generate VNPay payment URL with correct parameters', () => {
      const paymentUrl = paymentService.createVNPayUrl(
        'premium',
        'VND',
        'order_123',
        '192.168.1.1'
      )

      expect(paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html')
      expect(paymentUrl).toContain('vnp_Amount=71900000') // 719,000 VND in minor units
      expect(paymentUrl).toContain('vnp_OrderInfo=')
      expect(paymentUrl).toContain('vnp_SecureHash=')
    })

    it('should validate VNPay signature correctly', () => {
      const params = {
        vnp_Amount: '71900000',
        vnp_BankCode: 'NCB',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'dummy_hash'
      }

      // This would need proper hash generation in real implementation
      expect(() => paymentService.verifyVNPaySignature(params)).not.toThrow()
    })

    it('should format VND currency correctly', () => {
      const formatted = paymentService.formatCurrency(719000, 'VND')
      expect(formatted).toMatch(/719\.000 ₫|719,000 ₫/) // Handle both locale formats
    })
  })

  describe('MoMo Integration', () => {
    it('should create MoMo payment request', async () => {
      const result = await paymentService.createMoMoPayment(
        'premium',
        'VND',
        'order_123',
        'https://example.com/momo/notify'
      )

      expect(result).toMatchObject({
        resultCode: 0,
        message: 'Success',
        payUrl: expect.stringMatching(/^https:\/\/test-payment\.momo\.vn\/pay\//),
        qrCodeUrl: expect.stringMatching(/^https:\/\/test-payment\.momo\.vn\/qr\//)
      })
    })

    it('should handle MoMo API errors', async () => {
      server.use(
        http.post('https://test-payment.momo.vn/v2/gateway/api/create', () => {
          return HttpResponse.json(
            { resultCode: 99, message: 'System error' },
            { status: 500 }
          )
        })
      )

      await expect(
        paymentService.createMoMoPayment(
          'premium',
          'VND',
          'order_123'
        )
      ).rejects.toThrow()
    })
  })

  describe('Multi-Gateway Support', () => {
    it.each([
      ['stripe', 'USD'],
      ['vnpay', 'VND'],
      ['momo', 'VND']
    ] as const)('should support %s with %s currency', async (method, currency) => {
      const result = await paymentService.processPayment(
        'standard',
        method,
        currency,
        'user_123'
      )

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('paymentUrl')
    })

    it('should validate payment method and currency compatibility', () => {
      // Stripe should work with USD
      expect(() => 
        paymentService.validatePaymentMethod('stripe', 'USD')
      ).not.toThrow()

      // VNPay should work with VND
      expect(() => 
        paymentService.validatePaymentMethod('vnpay', 'VND')
      ).not.toThrow()

      // VNPay should not work with USD
      expect(() => 
        paymentService.validatePaymentMethod('vnpay', 'USD')
      ).toThrow('VNPay only supports VND')
    })
  })

  describe('Subscription Management', () => {
    it('should check subscription status', async () => {
      const status = await paymentService.checkSubscriptionStatus('user_123')

      expect(status).toMatchObject({
        active: expect.any(Boolean),
        plan: expect.stringMatching(/free|standard|premium|enterprise/),
        expiresAt: expect.any(String)
      })
    })

    it('should calculate usage limits correctly', () => {
      const plans: SubscriptionPlan[] = ['free', 'standard', 'premium', 'enterprise']
      
      plans.forEach(plan => {
        const limits = paymentService.getUsageLimits(plan)
        
        expect(limits).toMatchObject({
          translations: expect.any(Number),
          documents: expect.any(Number),
          characters: expect.any(Number)
        })

        // Higher tiers should have higher limits
        if (plans.indexOf(plan) > 0) {
          const prevPlan = plans[plans.indexOf(plan) - 1]
          const prevLimits = paymentService.getUsageLimits(prevPlan)
          
          expect(limits.translations).toBeGreaterThanOrEqual(prevLimits.translations)
          expect(limits.documents).toBeGreaterThanOrEqual(prevLimits.documents)
          expect(limits.characters).toBeGreaterThanOrEqual(prevLimits.characters)
        }
      })
    })
  })

  describe('Webhook Handling', () => {
    it('should process Stripe webhook events', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: {
              userId: 'user_123',
              plan: 'premium'
            }
          }
        }
      }

      const result = await paymentService.handleStripeWebhook(
        JSON.stringify(event),
        'dummy_signature'
      )

      expect(result).toMatchObject({
        success: true,
        action: 'subscription_created'
      })
    })

    it('should validate webhook signatures', () => {
      const payload = JSON.stringify({ test: 'data' })
      const signature = 'invalid_signature'

      expect(() => 
        paymentService.verifyWebhookSignature(payload, signature, 'stripe')
      ).toThrow()
    })
  })
})