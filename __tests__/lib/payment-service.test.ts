import {
  UNIFIED_SUBSCRIPTION_PLANS,
  formatPrice,
  getPaymentMethodName,
  getAvailablePaymentMethods,
  getPaymentMethodIcon,
  getPlanId,
  getRecommendedPaymentMethod,
  isPaymentMethodSupported,
  getSupportedPaymentMethods,
  type PaymentMethod,
  type UnifiedSubscriptionPlan,
} from '@/lib/payments/payment-service'

// Mock the imported modules
jest.mock('@/lib/stripe', () => ({
  SUBSCRIPTION_PLANS: {
    standard: { priceId: 'price_standard_stripe' },
    premium: { priceId: 'price_premium_stripe' },
    enterprise: { priceId: 'price_enterprise_stripe' },
  }
}))

jest.mock('@/lib/payments/vnpay', () => ({
  VNPAY_SUBSCRIPTION_PLANS: {},
  formatVND: jest.fn((amount: number) => `${amount.toLocaleString('vi-VN')} ₫`),
}))

jest.mock('@/lib/payments/momo', () => ({
  MOMO_SUBSCRIPTION_PLANS: {},
  formatVND: jest.fn((amount: number) => `${amount.toLocaleString('vi-VN')} ₫`),
}))

describe('Payment Service', () => {
  describe('UNIFIED_SUBSCRIPTION_PLANS', () => {
    it('should contain all required plans', () => {
      expect(UNIFIED_SUBSCRIPTION_PLANS).toHaveProperty('free')
      expect(UNIFIED_SUBSCRIPTION_PLANS).toHaveProperty('standard')
      expect(UNIFIED_SUBSCRIPTION_PLANS).toHaveProperty('premium')
      expect(UNIFIED_SUBSCRIPTION_PLANS).toHaveProperty('enterprise')
    })

    it('should have consistent plan structure', () => {
      Object.values(UNIFIED_SUBSCRIPTION_PLANS).forEach(plan => {
        expect(plan).toHaveProperty('name')
        expect(plan).toHaveProperty('nameVi')
        expect(plan).toHaveProperty('priceUSD')
        expect(plan).toHaveProperty('priceVND')
        expect(plan).toHaveProperty('period')
        expect(plan).toHaveProperty('features')
        expect(plan).toHaveProperty('featuresVi')
        expect(plan).toHaveProperty('limits')
        
        expect(plan.features).toBeInstanceOf(Array)
        expect(plan.featuresVi).toBeInstanceOf(Array)
        expect(plan.limits).toHaveProperty('translations')
        expect(plan.limits).toHaveProperty('documents')
        expect(plan.limits).toHaveProperty('characters')
      })
    })

    it('should have increasing prices for higher tiers', () => {
      const { free, standard, premium, enterprise } = UNIFIED_SUBSCRIPTION_PLANS
      
      expect(free.priceUSD).toBeLessThan(standard.priceUSD)
      expect(standard.priceUSD).toBeLessThan(premium.priceUSD)
      expect(premium.priceUSD).toBeLessThan(enterprise.priceUSD)
      
      expect(free.priceVND).toBeLessThan(standard.priceVND)
      expect(standard.priceVND).toBeLessThan(premium.priceVND)
      expect(premium.priceVND).toBeLessThan(enterprise.priceVND)
    })

    it('should have increasing limits for higher tiers', () => {
      const { free, standard, premium, enterprise } = UNIFIED_SUBSCRIPTION_PLANS
      
      expect(free.limits.translations).toBeLessThan(standard.limits.translations)
      expect(standard.limits.translations).toBeLessThan(premium.limits.translations)
      expect(premium.limits.translations).toBeLessThan(enterprise.limits.translations)
    })

    it('should have payment method IDs for paid plans', () => {
      const paidPlans = ['standard', 'premium', 'enterprise'] as const
      
      paidPlans.forEach(planKey => {
        const plan = UNIFIED_SUBSCRIPTION_PLANS[planKey]
        expect(plan.stripeId).toBeDefined()
        expect(plan.vnpayId).toBeDefined()
        expect(plan.momoId).toBeDefined()
      })
    })
  })

  describe('formatPrice', () => {
    it('should format VND prices correctly', () => {
      const result = formatPrice(239000, 'VND')
      expect(result).toBe('239,000 ₫')
    })

    it('should format USD prices correctly', () => {
      const result = formatPrice(9.99, 'USD')
      expect(result).toBe('$9.99')
    })

    it('should default to VND formatting', () => {
      const result = formatPrice(100000)
      expect(result).toBe('100,000 ₫')
    })
  })

  describe('getPaymentMethodName', () => {
    it('should return Vietnamese names by default', () => {
      expect(getPaymentMethodName('stripe')).toBe('Thẻ quốc tế (Visa/Mastercard)')
      expect(getPaymentMethodName('vnpay')).toBe('Thẻ nội địa / Internet Banking')
      expect(getPaymentMethodName('momo')).toBe('Ví MoMo')
    })

    it('should return English names when specified', () => {
      expect(getPaymentMethodName('stripe', 'en')).toBe('International Cards (Visa/Mastercard)')
      expect(getPaymentMethodName('vnpay', 'en')).toBe('Domestic Cards / Internet Banking')
      expect(getPaymentMethodName('momo', 'en')).toBe('MoMo Wallet')
    })
  })

  describe('getAvailablePaymentMethods', () => {
    it('should return all available payment methods', () => {
      const methods = getAvailablePaymentMethods()
      expect(methods).toContain('stripe')
      expect(methods).toContain('vnpay')
      expect(methods).toContain('momo')
      expect(methods).toHaveLength(3)
    })
  })

  describe('getPaymentMethodIcon', () => {
    it('should return icons for all payment methods', () => {
      expect(getPaymentMethodIcon('stripe')).toBe('💳')
      expect(getPaymentMethodIcon('vnpay')).toBe('🏦')
      expect(getPaymentMethodIcon('momo')).toBe('🟣')
    })
  })

  describe('getPlanId', () => {
    it('should return Stripe plan IDs', () => {
      expect(getPlanId('standard', 'stripe')).toBe('price_standard_stripe')
      expect(getPlanId('premium', 'stripe')).toBe('price_premium_stripe')
      expect(getPlanId('enterprise', 'stripe')).toBe('price_enterprise_stripe')
    })

    it('should return VNPay plan IDs', () => {
      expect(getPlanId('standard', 'vnpay')).toBe('vnpay_standard')
      expect(getPlanId('premium', 'vnpay')).toBe('vnpay_premium')
      expect(getPlanId('enterprise', 'vnpay')).toBe('vnpay_enterprise')
    })

    it('should return MoMo plan IDs', () => {
      expect(getPlanId('standard', 'momo')).toBe('momo_standard')
      expect(getPlanId('premium', 'momo')).toBe('momo_premium')
      expect(getPlanId('enterprise', 'momo')).toBe('momo_enterprise')
    })

    it('should return null for free plan', () => {
      expect(getPlanId('free', 'stripe')).toBeNull()
      expect(getPlanId('free', 'vnpay')).toBeNull()
      expect(getPlanId('free', 'momo')).toBeNull()
    })

    it('should return null for invalid payment method', () => {
      expect(getPlanId('standard', 'invalid' as PaymentMethod)).toBeNull()
    })
  })

  describe('getRecommendedPaymentMethod', () => {
    it('should recommend VNPay for Vietnamese market', () => {
      expect(getRecommendedPaymentMethod()).toBe('vnpay')
    })
  })

  describe('isPaymentMethodSupported', () => {
    it('should return false for free plan', () => {
      expect(isPaymentMethodSupported('free', 'stripe')).toBe(false)
      expect(isPaymentMethodSupported('free', 'vnpay')).toBe(false)
      expect(isPaymentMethodSupported('free', 'momo')).toBe(false)
    })

    it('should return true for paid plans with valid payment methods', () => {
      const paidPlans: UnifiedSubscriptionPlan[] = ['standard', 'premium', 'enterprise']
      const methods: PaymentMethod[] = ['stripe', 'vnpay', 'momo']

      paidPlans.forEach(plan => {
        methods.forEach(method => {
          expect(isPaymentMethodSupported(plan, method)).toBe(true)
        })
      })
    })

    it('should return false for invalid payment method', () => {
      expect(isPaymentMethodSupported('standard', 'invalid' as PaymentMethod)).toBe(false)
    })
  })

  describe('getSupportedPaymentMethods', () => {
    it('should return empty array for free plan', () => {
      expect(getSupportedPaymentMethods('free')).toEqual([])
    })

    it('should return all payment methods for paid plans', () => {
      const paidPlans: UnifiedSubscriptionPlan[] = ['standard', 'premium', 'enterprise']

      paidPlans.forEach(plan => {
        const supportedMethods = getSupportedPaymentMethods(plan)
        expect(supportedMethods).toContain('stripe')
        expect(supportedMethods).toContain('vnpay')
        expect(supportedMethods).toContain('momo')
        expect(supportedMethods).toHaveLength(3)
      })
    })
  })

  describe('plan consistency', () => {
    it('should have matching English and Vietnamese feature counts', () => {
      Object.values(UNIFIED_SUBSCRIPTION_PLANS).forEach(plan => {
        expect(plan.features).toHaveLength(plan.featuresVi.length)
      })
    })

    it('should have realistic VND to USD conversion rates', () => {
      const paidPlans = ['standard', 'premium', 'enterprise'] as const
      
      paidPlans.forEach(planKey => {
        const plan = UNIFIED_SUBSCRIPTION_PLANS[planKey]
        const exchangeRate = plan.priceVND / plan.priceUSD
        
        // Expect exchange rate to be roughly 23,000-25,000 VND per USD
        expect(exchangeRate).toBeGreaterThan(20000)
        expect(exchangeRate).toBeLessThan(30000)
      })
    })

    it('should have logical document limits', () => {
      const { free, standard, premium, enterprise } = UNIFIED_SUBSCRIPTION_PLANS
      
      expect(free.limits.documents).toBe(0) // Free plan has no document support
      expect(standard.limits.documents).toBeGreaterThan(0)
      expect(premium.limits.documents).toBe(-1) // Unlimited
      expect(enterprise.limits.documents).toBe(-1) // Unlimited
    })
  })

  describe('edge cases', () => {
    it('should handle zero amounts in formatPrice', () => {
      expect(formatPrice(0, 'USD')).toBe('$0.00')
      expect(formatPrice(0, 'VND')).toBe('0 ₫')
    })

    it('should handle large amounts in formatPrice', () => {
      const result = formatPrice(1000000, 'VND')
      expect(result).toBe('1,000,000 ₫')
    })

    it('should handle all plan keys in getPlanId', () => {
      const plans: UnifiedSubscriptionPlan[] = ['free', 'standard', 'premium', 'enterprise']
      const methods: PaymentMethod[] = ['stripe', 'vnpay', 'momo']

      plans.forEach(plan => {
        methods.forEach(method => {
          const result = getPlanId(plan, method)
          if (plan === 'free') {
            expect(result).toBeNull()
          } else {
            expect(typeof result).toBe('string')
            expect(result).toBeTruthy()
          }
        })
      })
    })
  })
})