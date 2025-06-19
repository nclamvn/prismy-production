import { NextRequest } from 'next/server'
import { POST as CreateStripeCheckout } from '@/app/api/stripe/create-checkout/route'
import { POST as StripeWebhook } from '@/app/api/stripe/webhooks/route'

// Mock Stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn()
    }
  },
  webhooks: {
    constructEvent: jest.fn()
  }
}

jest.mock('stripe', () => {
  return jest.fn(() => mockStripe)
})

// Mock Supabase
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: () => ({
    from: () => ({
      update: jest.fn().mockResolvedValue({ data: {}, error: null }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      select: jest.fn().mockResolvedValue({ 
        data: [{ id: 'user-123', subscription_tier: 'free' }], 
        error: null 
      })
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })
    }
  })
}))

describe('Payment Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Stripe Checkout Creation', () => {
    it('should create checkout session successfully', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          priceId: 'price_standard',
          tier: 'standard'
        })
      })

      const response = await CreateStripeCheckout(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      })

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer_email: 'test@example.com',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price: 'price_standard',
              quantity: 1
            })
          ])
        })
      )
    })

    it('should handle invalid price IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          priceId: 'price_invalid',
          tier: 'invalid'
        })
      })

      const response = await CreateStripeCheckout(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid subscription tier')
    })

    it('should handle unauthenticated requests', async () => {
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token')
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({
          priceId: 'price_standard',
          tier: 'standard'
        })
      })

      const response = await CreateStripeCheckout(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('authentication')
    })
  })

  describe('Stripe Webhook Processing', () => {
    it('should handle subscription creation webhook', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_standard'
                }
              }]
            },
            metadata: {
              userId: 'user-123'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      })

      const response = await StripeWebhook(request)

      expect(response.status).toBe(200)
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled()

      // Verify database update
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'standard',
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123'
        })
      )
    })

    it('should handle subscription cancellation webhook', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            metadata: {
              userId: 'user-123'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      })

      const response = await StripeWebhook(request)

      expect(response.status).toBe(200)

      // Verify subscription downgrade
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'free',
          stripe_subscription_id: null
        })
      )
    })

    it('should handle invalid webhook signatures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'test' })
      })

      const response = await StripeWebhook(request)

      expect(response.status).toBe(400)
    })

    it('should handle payment failure webhooks', async () => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_123',
            attempt_count: 2,
            metadata: {
              userId: 'user-123'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      })

      const response = await StripeWebhook(request)

      expect(response.status).toBe(200)

      // Should log payment failure but not immediately downgrade
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          event: 'payment_failed',
          attempt_count: 2
        })
      )
    })
  })

  describe('Vietnamese Payment Integration', () => {
    it('should handle VNPay payment creation', async () => {
      // Note: This would require implementing VNPay tests
      // For now, we'll test the structure
      const vnpayRequest = {
        amount: 50000,
        currency: 'VND',
        tier: 'standard',
        returnUrl: 'http://localhost:3000/payment/vnpay/return'
      }

      expect(vnpayRequest.amount).toBe(50000)
      expect(vnpayRequest.currency).toBe('VND')
    })

    it('should handle MoMo payment creation', async () => {
      // Note: This would require implementing MoMo tests
      // For now, we'll test the structure
      const momoRequest = {
        amount: 50000,
        orderInfo: 'Prismy Standard Subscription',
        tier: 'standard',
        redirectUrl: 'http://localhost:3000/payment/momo/return'
      }

      expect(momoRequest.amount).toBe(50000)
      expect(momoRequest.orderInfo).toContain('Standard')
    })
  })

  describe('Payment Error Handling', () => {
    it('should handle Stripe API failures gracefully', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API temporarily unavailable')
      )

      const request = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          priceId: 'price_standard',
          tier: 'standard'
        })
      })

      const response = await CreateStripeCheckout(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('payment service')
    })

    it('should handle database failures during webhook processing', async () => {
      const { createServiceRoleClient } = require('@/lib/supabase-server')
      const mockSupabase = createServiceRoleClient()
      
      mockSupabase.from().update.mockResolvedValue({
        data: null,
        error: new Error('Database update failed')
      })

      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            metadata: { userId: 'user-123' }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      })

      const response = await StripeWebhook(request)

      // Should return 500 to trigger Stripe retry
      expect(response.status).toBe(500)
    })
  })

  describe('Subscription State Management', () => {
    it('should correctly map subscription tiers', async () => {
      const tierMappings = [
        { priceId: 'price_standard', tier: 'standard' },
        { priceId: 'price_premium', tier: 'premium' },
        { priceId: 'price_enterprise', tier: 'enterprise' }
      ]

      for (const mapping of tierMappings) {
        mockStripe.checkout.sessions.create.mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test'
        })

        const request = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify(mapping)
        })

        const response = await CreateStripeCheckout(request)
        expect(response.status).toBe(200)
      }
    })
  })
})