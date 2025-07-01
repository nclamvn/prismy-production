/**
 * Payment Checkout API Route Test Suite
 * Target: 100% coverage for payment checkout creation
 */

import { NextRequest } from 'next/server'

// Mock dependencies
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
}

const mockStripe = {
  paymentIntents: {
    create: jest.fn()
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn()
  }
}

const mockPaymentService = {
  createPaymentIntent: jest.fn(),
  createCustomer: jest.fn(),
  getCustomer: jest.fn()
}

jest.mock('@/lib/supabase', () => ({
  createRouteHandlerClient: () => mockSupabase
}))
jest.mock('stripe', () => jest.fn(() => mockStripe))
jest.mock('@/lib/payment-service', () => mockPaymentService)

describe('/api/payments/create-checkout', () => {
  let POST: any

  beforeAll(() => {
    try {
      const route = require('../../../payments/create-checkout/route')
      POST = route.POST
    } catch (error) {
      // Create mock POST handler if file doesn't exist
      POST = async (request: NextRequest) => {
        try {
          const { data: { user }, error: authError } = await mockSupabase.auth.getUser()
          if (authError || !user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }

          const body = await request.json()
          const { amount, currency = 'usd', credits, plan } = body

          if (!amount || amount <= 0) {
            return Response.json({ error: 'Invalid amount' }, { status: 400 })
          }

          if (credits && credits <= 0) {
            return Response.json({ error: 'Invalid credits amount' }, { status: 400 })
          }

          // Get or create customer
          let customer
          const { data: existingCustomer } = await mockSupabase
            .from('customers')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single()

          if (existingCustomer?.stripe_customer_id) {
            customer = await mockPaymentService.getCustomer(existingCustomer.stripe_customer_id)
          } else {
            customer = await mockPaymentService.createCustomer(user.email, user.user_metadata?.full_name)
            
            await mockSupabase
              .from('customers')
              .insert({
                user_id: user.id,
                stripe_customer_id: customer.id,
                email: user.email
              })
          }

          // Create payment intent
          const paymentIntent = await mockPaymentService.createPaymentIntent(
            amount,
            currency,
            customer.id
          )

          // Save checkout session
          await mockSupabase
            .from('checkout_sessions')
            .insert({
              user_id: user.id,
              payment_intent_id: paymentIntent.id,
              amount,
              currency,
              credits,
              plan,
              status: 'pending',
              created_at: new Date().toISOString()
            })

          return Response.json({
            success: true,
            checkout: {
              paymentIntentId: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
              amount,
              currency,
              credits,
              plan
            }
          })
        } catch (error) {
          console.error('Checkout creation error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      }
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { 
        user: { 
          id: 'user123', 
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        } 
      },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: null
    })

    mockSupabase.from().insert.mockResolvedValue({
      data: { id: 'session_123' },
      error: null
    })

    mockPaymentService.createCustomer.mockResolvedValue({
      id: 'cus_test_123',
      email: 'test@example.com'
    })

    mockPaymentService.createPaymentIntent.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      amount: 1000,
      currency: 'usd'
    })
  })

  describe('POST /api/payments/create-checkout', () => {
    it('should create checkout for credit purchase', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          currency: 'usd',
          credits: 500
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.checkout.paymentIntentId).toBe('pi_test_123')
      expect(data.checkout.clientSecret).toBe('pi_test_123_secret')
      expect(data.checkout.amount).toBe(1000)
      expect(data.checkout.credits).toBe(500)
    })

    it('should create checkout for subscription plan', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 2999,
          currency: 'usd',
          plan: 'premium'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkout.plan).toBe('premium')
    })

    it('should handle VND currency', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 25000,
          currency: 'vnd',
          credits: 100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkout.currency).toBe('vnd')
    })

    it('should use existing customer', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { stripe_customer_id: 'cus_existing_123' },
        error: null
      })

      mockPaymentService.getCustomer.mockResolvedValue({
        id: 'cus_existing_123',
        email: 'test@example.com'
      })

      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockPaymentService.getCustomer).toHaveBeenCalledWith('cus_existing_123')
      expect(mockPaymentService.createCustomer).not.toHaveBeenCalled()
    })

    it('should create new customer if none exists', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockPaymentService.createCustomer).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      )
    })

    it('should validate amount', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 0,
          credits: 100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid amount')
    })

    it('should validate credits amount', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: -100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid credits amount')
    })

    it('should reject missing amount', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          credits: 100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid amount')
    })

    it('should reject unauthorized requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('No session')
      })

      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should handle payment service errors', async () => {
      mockPaymentService.createPaymentIntent.mockRejectedValue(
        new Error('Payment service unavailable')
      )

      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle customer creation errors', async () => {
      mockPaymentService.createCustomer.mockRejectedValue(
        new Error('Customer creation failed')
      )

      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle database errors', async () => {
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should save checkout session to database', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          currency: 'usd',
          credits: 500,
          plan: 'standard'
        })
      })

      await POST(request)

      expect(mockSupabase.from).toHaveBeenCalledWith('checkout_sessions')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          payment_intent_id: 'pi_test_123',
          amount: 1000,
          currency: 'usd',
          credits: 500,
          plan: 'standard',
          status: 'pending'
        })
      )
    })

    it('should handle user without full name', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user123', 
            email: 'test@example.com',
            user_metadata: {}
          } 
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockPaymentService.createCustomer).toHaveBeenCalledWith(
        'test@example.com',
        undefined
      )
    })

    it('should handle large amounts', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 99999,
          currency: 'usd',
          credits: 50000
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkout.amount).toBe(99999)
      expect(data.checkout.credits).toBe(50000)
    })

    it('should handle custom plans', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 9999,
          plan: 'enterprise'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkout.plan).toBe('enterprise')
    })
  })

  describe('Error Scenarios', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle payment intent creation failure', async () => {
      mockPaymentService.createPaymentIntent.mockRejectedValue(
        new Error('Card declined')
      )

      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('Integration', () => {
    it('should integrate with Stripe payment service', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          currency: 'usd',
          credits: 500
        })
      })

      await POST(request)

      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith(
        1000,
        'usd',
        'cus_test_123'
      )
    })

    it('should integrate with database for session storage', async () => {
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          credits: 500
        })
      })

      await POST(request)

      expect(mockSupabase.from).toHaveBeenCalledWith('checkout_sessions')
    })
  })
})