/**
 * Credit Manager Test Suite
 * Target: 90% coverage for credit management system
 */

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
}

jest.mock('@/lib/supabase', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabaseClient),
}))

import {
  calculateCreditsNeeded,
  estimateTokensFromText,
  checkCreditsAvailable,
  deductCredits,
  checkAndDeductCredits,
  getUserCreditStatus,
  requireCredits,
} from '../credit-manager'

describe('Credit Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Token Estimation', () => {
    it('should estimate tokens for text', () => {
      expect(estimateTokensFromText('Hello world')).toBeGreaterThan(0)
      expect(estimateTokensFromText('')).toBe(0)
      expect(estimateTokensFromText('A'.repeat(1000))).toBeGreaterThan(200)
    })

    it('should handle invalid input', () => {
      expect(estimateTokensFromText(null as any)).toBe(0)
      expect(estimateTokensFromText(undefined as any)).toBe(0)
    })
  })

  describe('Credit Calculation', () => {
    it('should calculate credits for translation', () => {
      const credits = calculateCreditsNeeded({
        characters: 1000,
        operation_type: 'translate',
        quality_tier: 'standard',
      })
      expect(credits).toBeGreaterThan(0)
    })

    it('should calculate credits for document processing', () => {
      const credits = calculateCreditsNeeded({
        pages: 5,
        operation_type: 'document_process',
        quality_tier: 'premium',
      })
      expect(credits).toBeGreaterThan(0)
    })

    it('should have minimum charge', () => {
      const credits = calculateCreditsNeeded({})
      expect(credits).toBe(1)
    })

    it('should apply operation multipliers', () => {
      const translateCredits = calculateCreditsNeeded({
        tokens: 1000,
        operation_type: 'translate',
      })
      const aiCredits = calculateCreditsNeeded({
        tokens: 1000,
        operation_type: 'ai_analysis',
      })
      expect(aiCredits).toBeGreaterThan(translateCredits)
    })

    it('should apply quality tier multipliers', () => {
      const standardCredits = calculateCreditsNeeded({
        tokens: 1000,
        quality_tier: 'standard',
      })
      const premiumCredits = calculateCreditsNeeded({
        tokens: 1000,
        quality_tier: 'premium',
      })
      expect(premiumCredits).toBeGreaterThan(standardCredits)
    })
  })

  describe('Credit Availability Check', () => {
    it('should check available credits successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true, credits_left: 1000 },
        error: null,
      })

      const result = await checkCreditsAvailable(
        mockSupabaseClient,
        'user-123',
        50
      )

      expect(result.success).toBe(true)
      expect(result.credits_available).toBe(1000)
      expect(result.credits_needed).toBe(50)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_user_credits', {
        _user_id: 'user-123',
      })
    })

    it('should handle insufficient credits', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true, credits_left: 10 },
        error: null,
      })

      const result = await checkCreditsAvailable(
        mockSupabaseClient,
        'user-123',
        50
      )

      expect(result.success).toBe(false)
      expect(result.credits_available).toBe(10)
      expect(result.credits_needed).toBe(50)
      expect(result.error).toBe('INSUFFICIENT_CREDITS')
    })

    it('should handle no credit account', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: false },
        error: null,
      })

      const result = await checkCreditsAvailable(
        mockSupabaseClient,
        'user-123',
        50
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('NO_CREDIT_ACCOUNT')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      const result = await checkCreditsAvailable(
        mockSupabaseClient,
        'user-123',
        50
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('CREDIT_CHECK_FAILED')
    })

    it('should handle system exceptions', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Network error'))

      const result = await checkCreditsAvailable(
        mockSupabaseClient,
        'user-123',
        50
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('SYSTEM_ERROR')
    })
  })

  describe('Credit Deduction', () => {
    it('should deduct credits successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: true,
          credits_before: 1000,
          credits_after: 950,
          credits_used: 50,
        },
        error: null,
      })

      const result = await deductCredits(
        mockSupabaseClient,
        'user-123',
        50,
        'test operation'
      )

      expect(result.success).toBe(true)
      expect(result.credits_before).toBe(1000)
      expect(result.credits_after).toBe(950)
      expect(result.credits_used).toBe(50)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('decrement_credits', {
        _user_id: 'user-123',
        _credits_needed: 50,
        _operation: 'test operation',
        _tokens_processed: undefined,
      })
    })

    it('should handle insufficient credits from RPC', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'INSUFFICIENT_CREDITS',
          message: 'Not enough credits',
          credits_available: 10,
        },
        error: null,
      })

      const result = await deductCredits(
        mockSupabaseClient,
        'user-123',
        50,
        'test operation'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('INSUFFICIENT_CREDITS')
      expect(result.message).toBe('Not enough credits')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      const result = await deductCredits(
        mockSupabaseClient,
        'user-123',
        50,
        'test operation'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('DEDUCTION_FAILED')
    })

    it('should handle system exceptions', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Network error'))

      const result = await deductCredits(
        mockSupabaseClient,
        'user-123',
        50,
        'test operation'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('SYSTEM_ERROR')
    })
  })

  describe('Check and Deduct Credits', () => {
    it('should check and deduct credits in one operation', async () => {
      // Mock check credits call
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({
          data: { success: true, credits_left: 1000 },
          error: null,
        })
        // Mock deduct credits call
        .mockResolvedValueOnce({
          data: {
            success: true,
            credits_before: 1000,
            credits_after: 999,
            credits_used: 1,
          },
          error: null,
        })

      const result = await checkAndDeductCredits(
        mockSupabaseClient,
        'user-123',
        {
          characters: 1000,
          operation_type: 'translate',
        },
        'test operation'
      )

      expect(result.success).toBe(true)
      expect(result.calculation.characters).toBe(1000)
      expect(result.calculation.operation_type).toBe('translate')
    })

    it('should fail if insufficient credits during check', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true, credits_left: 1 },
        error: null,
      })

      const result = await checkAndDeductCredits(
        mockSupabaseClient,
        'user-123',
        {
          tokens: 100000, // This will need 100 credits (100000/1000)
          operation_type: 'translate',
        },
        'test operation'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('INSUFFICIENT_CREDITS')
      expect(result.calculation.tokens).toBe(100000)
    })
  })

  describe('User Credit Status', () => {
    it('should get user credit status for paid user', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: true,
          credits_left: 1000,
          trial_credits: 0,
          purchased_credits: 1000,
          trial_ends_at: null,
          total_earned: 1000,
          total_spent: 0,
        },
        error: null,
      })

      const status = await getUserCreditStatus(mockSupabaseClient, 'user-123')

      expect(status.hasCredits).toBe(true)
      expect(status.creditsLeft).toBe(1000)
      expect(status.accountType).toBe('paid')
      expect(status.needsInvite).toBe(false)
    })

    it('should get user credit status for trial user', async () => {
      const futureDate = new Date(Date.now() + 86400000) // Tomorrow
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: true,
          credits_left: 100,
          trial_credits: 100,
          purchased_credits: 0,
          trial_ends_at: futureDate.toISOString(),
          total_earned: 100,
          total_spent: 0,
        },
        error: null,
      })

      const status = await getUserCreditStatus(mockSupabaseClient, 'user-123')

      expect(status.hasCredits).toBe(true)
      expect(status.creditsLeft).toBe(100)
      expect(status.accountType).toBe('trial')
      expect(status.trialExpired).toBe(false)
    })

    it('should handle expired trial user', async () => {
      const pastDate = new Date(Date.now() - 86400000) // Yesterday
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: true,
          credits_left: 0,
          trial_credits: 100,
          purchased_credits: 0,
          trial_ends_at: pastDate.toISOString(),
          total_earned: 100,
          total_spent: 100,
        },
        error: null,
      })

      const status = await getUserCreditStatus(mockSupabaseClient, 'user-123')

      expect(status.hasCredits).toBe(false)
      expect(status.accountType).toBe('trial_expired')
      expect(status.trialExpired).toBe(true)
    })

    it('should handle new users with no account', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: false },
        error: null,
      })

      const status = await getUserCreditStatus(mockSupabaseClient, 'user-123')

      expect(status.hasCredits).toBe(false)
      expect(status.creditsLeft).toBe(0)
      expect(status.needsInvite).toBe(true)
      expect(status.accountType).toBe('none')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      const status = await getUserCreditStatus(mockSupabaseClient, 'user-123')

      expect(status.hasCredits).toBe(false)
      expect(status.accountType).toBe('none')
    })

    it('should handle system exceptions', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Network error'))

      const status = await getUserCreditStatus(mockSupabaseClient, 'user-123')

      expect(status.hasCredits).toBe(false)
      expect(status.accountType).toBe('error')
    })
  })

  describe('Require Credits Middleware', () => {
    const mockUser = { id: 'user-123' } as any

    it('should pass when credits are sufficient', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: true,
          credits_left: 1000,
          trial_credits: 0,
          purchased_credits: 1000,
          trial_ends_at: null,
        },
        error: null,
      })

      const result = await requireCredits(mockSupabaseClient, mockUser, 50)

      expect(result.allowed).toBe(true)
      expect(result.status).toBe(200)
      expect(result.credits).toBe(1000)
    })

    it('should fail when credits are insufficient', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: true,
          credits_left: 10,
          trial_credits: 0,
          purchased_credits: 10,
          trial_ends_at: null,
        },
        error: null,
      })

      const result = await requireCredits(mockSupabaseClient, mockUser, 50)

      expect(result.allowed).toBe(false)
      expect(result.status).toBe(402)
      expect(result.error).toBe('INSUFFICIENT_CREDITS')
      expect(result.message).toContain('Need 50 credits, but only 10 available')
    })

    it('should fail when user needs invite', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: false },
        error: null,
      })

      const result = await requireCredits(mockSupabaseClient, mockUser, 50)

      expect(result.allowed).toBe(false)
      expect(result.status).toBe(402)
      expect(result.error).toBe('INSUFFICIENT_CREDITS')
      expect(result.message).toContain('Please redeem an invite code')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero credit deduction', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Credits to deduct must be positive',
        },
        error: null,
      })

      const result = await deductCredits(
        mockSupabaseClient,
        'user-123',
        0,
        'test'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_AMOUNT')
    })

    it('should handle negative credit deduction', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Credits to deduct must be positive',
        },
        error: null,
      })

      const result = await deductCredits(
        mockSupabaseClient,
        'user-123',
        -10,
        'test'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_AMOUNT')
    })

    it('should handle empty user ID in checkCreditsAvailable', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'INVALID_USER',
          message: 'User ID is required',
        },
        error: null,
      })

      const result = await checkCreditsAvailable(mockSupabaseClient, '', 50)

      expect(result.success).toBe(false)
      expect(result.error).toBe('NO_CREDIT_ACCOUNT') // This is what actually gets returned when success: false
    })

    it('should handle empty user ID in deductCredits', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'INVALID_USER',
          message: 'User ID is required',
        },
        error: null,
      })

      const result = await deductCredits(mockSupabaseClient, '', 50, 'test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_USER')
    })

    it('should handle very large credit amounts', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          success: true,
          credits_left: 1000000,
        },
        error: null,
      })

      const result = await checkCreditsAvailable(
        mockSupabaseClient,
        'user-123',
        999999
      )

      expect(result.success).toBe(true)
      expect(result.credits_available).toBe(1000000)
    })

    it('should handle network timeout gracefully', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Request timeout'))

      const result = await checkCreditsAvailable(
        mockSupabaseClient,
        'user-123',
        50
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('SYSTEM_ERROR')
    })
  })
})
