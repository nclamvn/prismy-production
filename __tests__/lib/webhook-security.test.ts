import {
  validateWebhookTimestamp,
  generateWebhookId,
  preventReplayAttack,
  verifyStripeWebhook,
  verifyVNPayWebhook,
  verifyMoMoWebhook,
  validateWebhookSecurity,
  checkWebhookRateLimit,
  logWebhookAttempt,
} from '@/lib/webhook-security'

// Mock Redis
jest.mock('@upstash/redis', () => {
  const mockRedis = {
    exists: jest.fn(),
    setex: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  }
  return {
    Redis: jest.fn(() => mockRedis),
  }
})

// Mock crypto
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-hash'),
  })),
}))

describe('Webhook Security', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables for testing
    process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
  })

  afterEach(() => {
    // Clean up any in-memory state
    jest.clearAllMocks()
  })

  describe('validateWebhookTimestamp', () => {
    it('should accept current timestamps', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(validateWebhookTimestamp(now)).toBe(true)
    })

    it('should accept timestamps within tolerance', () => {
      const now = Math.floor(Date.now() / 1000)
      const withinTolerance = now - 100 // 100 seconds ago
      expect(validateWebhookTimestamp(withinTolerance)).toBe(true)
    })

    it('should reject timestamps outside tolerance', () => {
      const now = Math.floor(Date.now() / 1000)
      const outsideTolerance = now - 400 // 400 seconds ago (>5 minutes)
      expect(validateWebhookTimestamp(outsideTolerance)).toBe(false)
    })

    it('should reject future timestamps outside tolerance', () => {
      const now = Math.floor(Date.now() / 1000)
      const futureTime = now + 400 // 400 seconds in future
      expect(validateWebhookTimestamp(futureTime)).toBe(false)
    })

    it('should respect custom tolerance', () => {
      const now = Math.floor(Date.now() / 1000)
      const oldTime = now - 100
      
      expect(validateWebhookTimestamp(oldTime, 50)).toBe(false) // 50s tolerance
      expect(validateWebhookTimestamp(oldTime, 150)).toBe(true) // 150s tolerance
    })
  })

  describe('generateWebhookId', () => {
    it('should generate consistent IDs for same input', () => {
      const payload = 'test-payload'
      const headers = { 'stripe-signature': 'test-sig', 'x-timestamp': '1234567890' }
      
      const id1 = generateWebhookId(payload, headers)
      const id2 = generateWebhookId(payload, headers)
      
      expect(id1).toBe(id2)
      expect(id1).toBe('mocked-hash')
    })

    it('should use different headers for ID generation', () => {
      const payload = 'test-payload'
      const headers1 = { 'stripe-signature': 'sig1' }
      const headers2 = { 'x-signature': 'sig2' }
      
      // Both should generate IDs (may be same due to mock, but function should work)
      expect(generateWebhookId(payload, headers1)).toBe('mocked-hash')
      expect(generateWebhookId(payload, headers2)).toBe('mocked-hash')
    })

    it('should handle missing signatures', () => {
      const payload = 'test-payload'
      const headers = { 'other-header': 'value' }
      
      expect(generateWebhookId(payload, headers)).toBe('mocked-hash')
    })
  })

  describe('preventReplayAttack', () => {
    const mockRedis = require('@upstash/redis').Redis()

    it('should allow new webhooks', async () => {
      mockRedis.exists.mockResolvedValueOnce(0) // Not exists
      mockRedis.setex.mockResolvedValueOnce('OK')
      
      const result = await preventReplayAttack('test-webhook-id')
      
      expect(result).toBe(true)
      expect(mockRedis.exists).toHaveBeenCalledWith('webhook:test-webhook-id')
      expect(mockRedis.setex).toHaveBeenCalledWith('webhook:test-webhook-id', 600, 'processed')
    })

    it('should reject duplicate webhooks', async () => {
      mockRedis.exists.mockResolvedValueOnce(1) // Exists
      
      const result = await preventReplayAttack('test-webhook-id')
      
      expect(result).toBe(false)
      expect(mockRedis.exists).toHaveBeenCalledWith('webhook:test-webhook-id')
      expect(mockRedis.setex).not.toHaveBeenCalled()
    })

    it('should handle Redis errors gracefully', async () => {
      mockRedis.exists.mockRejectedValueOnce(new Error('Redis error'))
      
      const result = await preventReplayAttack('test-webhook-id')
      
      // Should fail securely by allowing the webhook
      expect(result).toBe(true)
    })

    it('should use in-memory fallback when Redis unavailable', async () => {
      // Temporarily disable Redis
      process.env.UPSTASH_REDIS_REST_URL = ''
      process.env.UPSTASH_REDIS_REST_TOKEN = ''
      
      const result1 = await preventReplayAttack('test-webhook-id')
      const result2 = await preventReplayAttack('test-webhook-id')
      
      expect(result1).toBe(true) // First time should succeed
      expect(result2).toBe(false) // Second time should fail (replay)
      
      // Restore Redis config
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    })
  })

  describe('verifyStripeWebhook', () => {
    it('should verify valid Stripe webhooks', () => {
      const payload = 'test-payload'
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = `t=${timestamp},v1=mocked-hash`
      const secret = 'test-secret'
      
      const result = verifyStripeWebhook(payload, signature, secret)
      expect(result).toBe(true)
    })

    it('should reject webhooks with invalid signature format', () => {
      const payload = 'test-payload'
      const signature = 'invalid-format'
      const secret = 'test-secret'
      
      const result = verifyStripeWebhook(payload, signature, secret)
      expect(result).toBe(false)
    })

    it('should reject webhooks missing timestamp', () => {
      const payload = 'test-payload'
      const signature = 'v1=some-hash'
      const secret = 'test-secret'
      
      const result = verifyStripeWebhook(payload, signature, secret)
      expect(result).toBe(false)
    })

    it('should reject webhooks with old timestamps', () => {
      const payload = 'test-payload'
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400 // 400 seconds ago
      const signature = `t=${oldTimestamp},v1=mocked-hash`
      const secret = 'test-secret'
      
      const result = verifyStripeWebhook(payload, signature, secret)
      expect(result).toBe(false)
    })

    it('should handle verification errors', () => {
      const mockCreateHash = require('crypto').createHash
      mockCreateHash.mockImplementationOnce(() => {
        throw new Error('Hash error')
      })
      
      const result = verifyStripeWebhook('payload', 't=123,v1=hash', 'secret')
      expect(result).toBe(false)
    })
  })

  describe('verifyVNPayWebhook', () => {
    it('should verify valid VNPay webhooks', () => {
      const params = {
        vnp_Amount: '1000000',
        vnp_OrderInfo: 'Test order',
        vnp_SecureHash: 'mocked-hash'
      }
      const secret = 'test-secret'
      
      const result = verifyVNPayWebhook(params, secret)
      expect(result).toBe(true)
    })

    it('should reject webhooks without secure hash', () => {
      const params = {
        vnp_Amount: '1000000',
        vnp_OrderInfo: 'Test order'
      }
      const secret = 'test-secret'
      
      const result = verifyVNPayWebhook(params, secret)
      expect(result).toBe(false)
    })

    it('should handle verification errors', () => {
      const mockCreateHash = require('crypto').createHash
      mockCreateHash.mockImplementationOnce(() => {
        throw new Error('Hash error')
      })
      
      const params = { vnp_SecureHash: 'hash' }
      const result = verifyVNPayWebhook(params, 'secret')
      expect(result).toBe(false)
    })
  })

  describe('verifyMoMoWebhook', () => {
    it('should verify valid MoMo webhooks', () => {
      const body = {
        partnerCode: 'MOMO',
        orderId: 'ORDER123',
        requestId: 'REQ123',
        amount: 100000,
        orderInfo: 'Test order',
        orderType: 'momo_wallet',
        transId: 123456789,
        resultCode: 0,
        message: 'Success',
        payType: 'napas',
        responseTime: 1234567890,
        extraData: '',
        signature: 'mocked-hash'
      }
      const secret = 'test-secret'
      
      // Mock environment variable
      process.env.MOMO_ACCESS_KEY = 'test-access-key'
      
      const result = verifyMoMoWebhook(body, secret)
      expect(result).toBe(true)
    })

    it('should reject webhooks without signature', () => {
      const body = {
        partnerCode: 'MOMO',
        orderId: 'ORDER123'
      }
      const secret = 'test-secret'
      
      const result = verifyMoMoWebhook(body, secret)
      expect(result).toBe(false)
    })

    it('should handle verification errors', () => {
      const mockCreateHash = require('crypto').createHash
      mockCreateHash.mockImplementationOnce(() => {
        throw new Error('Hash error')
      })
      
      const body = { signature: 'hash' }
      const result = verifyMoMoWebhook(body, 'secret')
      expect(result).toBe(false)
    })
  })

  describe('validateWebhookSecurity', () => {
    it('should validate secure webhooks', async () => {
      const mockRedis = require('@upstash/redis').Redis()
      mockRedis.exists.mockResolvedValueOnce(0) // Not exists
      mockRedis.setex.mockResolvedValueOnce('OK')
      
      const mockVerifyFn = jest.fn().mockReturnValue(true)
      
      const result = await validateWebhookSecurity(
        'test-payload',
        { 'signature': 'test-sig' },
        mockVerifyFn
      )
      
      expect(result.valid).toBe(true)
      expect(mockVerifyFn).toHaveBeenCalledWith('test-payload', { 'signature': 'test-sig' })
    })

    it('should reject replayed webhooks', async () => {
      const mockRedis = require('@upstash/redis').Redis()
      mockRedis.exists.mockResolvedValueOnce(1) // Exists (replay)
      
      const mockVerifyFn = jest.fn()
      
      const result = await validateWebhookSecurity(
        'test-payload',
        { 'signature': 'test-sig' },
        mockVerifyFn
      )
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Webhook replay detected')
      expect(mockVerifyFn).not.toHaveBeenCalled()
    })

    it('should reject webhooks with invalid signatures', async () => {
      const mockRedis = require('@upstash/redis').Redis()
      mockRedis.exists.mockResolvedValueOnce(0) // Not exists
      mockRedis.setex.mockResolvedValueOnce('OK')
      
      const mockVerifyFn = jest.fn().mockReturnValue(false)
      
      const result = await validateWebhookSecurity(
        'test-payload',
        { 'signature': 'invalid-sig' },
        mockVerifyFn
      )
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid webhook signature')
    })

    it('should handle validation errors', async () => {
      const mockVerifyFn = jest.fn(() => {
        throw new Error('Verification error')
      })
      
      const result = await validateWebhookSecurity(
        'test-payload',
        { 'signature': 'test-sig' },
        mockVerifyFn
      )
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Webhook security validation failed')
    })
  })

  describe('checkWebhookRateLimit', () => {
    const mockRedis = require('@upstash/redis').Redis()

    it('should allow webhooks within rate limit', async () => {
      mockRedis.incr.mockResolvedValueOnce(1)
      mockRedis.expire.mockResolvedValueOnce(true)
      
      const result = await checkWebhookRateLimit('stripe')
      
      expect(result).toBe(true)
      expect(mockRedis.incr).toHaveBeenCalledWith('webhook_rate_limit:stripe')
      expect(mockRedis.expire).toHaveBeenCalled()
    })

    it('should reject webhooks exceeding rate limit', async () => {
      mockRedis.incr.mockResolvedValueOnce(101) // Exceeds limit of 100
      
      const result = await checkWebhookRateLimit('stripe')
      
      expect(result).toBe(false)
    })

    it('should handle Redis errors gracefully', async () => {
      mockRedis.incr.mockRejectedValueOnce(new Error('Redis error'))
      
      const result = await checkWebhookRateLimit('stripe')
      
      // Should fail open for webhooks
      expect(result).toBe(true)
    })

    it('should allow all webhooks when Redis unavailable', async () => {
      // Temporarily disable Redis
      process.env.UPSTASH_REDIS_REST_URL = ''
      
      const result = await checkWebhookRateLimit('stripe')
      
      expect(result).toBe(true)
      
      // Restore Redis config
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
    })
  })

  describe('logWebhookAttempt', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      jest.spyOn(console, 'warn').mockImplementation()
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should log successful webhook attempts', () => {
      logWebhookAttempt('stripe', true, undefined, { ip: '127.0.0.1' })
      
      expect(console.log).toHaveBeenCalledWith(
        'Webhook processed successfully:',
        expect.objectContaining({
          source: 'stripe',
          success: true,
          ip: '127.0.0.1',
          timestamp: expect.any(String),
        })
      )
    })

    it('should log failed webhook attempts', () => {
      logWebhookAttempt('stripe', false, 'Invalid signature', { ip: '127.0.0.1' })
      
      expect(console.warn).toHaveBeenCalledWith(
        'Webhook processing failed:',
        expect.objectContaining({
          source: 'stripe',
          success: false,
          error: 'Invalid signature',
          ip: '127.0.0.1',
          timestamp: expect.any(String),
        })
      )
    })

    it('should include metadata in logs', () => {
      const metadata = { orderId: 'ORDER123', processingTime: '150ms' }
      logWebhookAttempt('vnpay', true, undefined, metadata)
      
      expect(console.log).toHaveBeenCalledWith(
        'Webhook processed successfully:',
        expect.objectContaining({
          source: 'vnpay',
          metadata,
        })
      )
    })

    it('should handle missing metadata gracefully', () => {
      logWebhookAttempt('momo', true)
      
      expect(console.log).toHaveBeenCalledWith(
        'Webhook processed successfully:',
        expect.objectContaining({
          source: 'momo',
          success: true,
          ip: 'unknown',
        })
      )
    })
  })
})