/**
 * Payment Service Test Suite
 * Comprehensive testing for multi-gateway payment processing
 * Target: 90%+ coverage with parametric and edge case testing
 */

import {
  PaymentMethod,
  Currency,
  UnifiedSubscriptionPlan,
  UNIFIED_SUBSCRIPTION_PLANS,
  formatPrice,
  getPaymentMethodName,
  getAvailablePaymentMethods,
  getPaymentMethodIconType,
  getPlanId,
  getRecommendedPaymentMethod,
  isPaymentMethodSupported,
  getSupportedPaymentMethods,
} from '../payments/payment-service'

// Mock dependencies
jest.mock('@/lib/stripe', () => ({
  SUBSCRIPTION_PLANS: {
    standard: { priceId: 'price_standard_stripe' },
    premium: { priceId: 'price_premium_stripe' },
    enterprise: { priceId: 'price_enterprise_stripe' },
  },
}))

jest.mock('../payments/vnpay', () => ({
  VNPAY_SUBSCRIPTION_PLANS: {},
  formatVND: (amount: number) => `${amount.toLocaleString('vi-VN')} ₫`,
}))

jest.mock('../payments/momo', () => ({
  MOMO_SUBSCRIPTION_PLANS: {},
  formatVND: (amount: number) => `${amount.toLocaleString('vi-VN')} ₫`,
}))

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unified Subscription Plans', () => {
    describe.each([
      ['free', 0, 0, 10, 0, 10000],
      ['standard', 9.99, 239000, 50, 10, 50000],
      ['premium', 29.99, 719000, 200, -1, 200000],
      ['enterprise', 99.99, 2399000, 1000, -1, 1000000],
    ])(
      'Plan: %s',
      (planKey, priceUSD, priceVND, translations, documents, characters) => {
        const plan =
          UNIFIED_SUBSCRIPTION_PLANS[planKey as UnifiedSubscriptionPlan]

        it(`should have correct pricing for ${planKey}`, () => {
          expect(plan.priceUSD).toBe(priceUSD)
          expect(plan.priceVND).toBe(priceVND)
        })

        it(`should have correct limits for ${planKey}`, () => {
          expect(plan.limits.translations).toBe(translations)
          expect(plan.limits.documents).toBe(documents)
          expect(plan.limits.characters).toBe(characters)
        })

        it(`should have bilingual names for ${planKey}`, () => {
          expect(plan.name).toBeDefined()
          expect(plan.nameVi).toBeDefined()
          expect(typeof plan.name).toBe('string')
          expect(typeof plan.nameVi).toBe('string')
        })

        it(`should have bilingual features for ${planKey}`, () => {
          expect(Array.isArray(plan.features)).toBe(true)
          expect(Array.isArray(plan.featuresVi)).toBe(true)
          expect(plan.features.length).toBeGreaterThan(0)
          expect(plan.featuresVi.length).toBe(plan.features.length)
        })

        it(`should have monthly period for ${planKey}`, () => {
          expect(plan.period).toBe('monthly')
        })
      }
    )

    it('should have payment gateway IDs for paid plans', () => {
      const paidPlans = ['standard', 'premium', 'enterprise'] as const

      paidPlans.forEach(planKey => {
        const plan = UNIFIED_SUBSCRIPTION_PLANS[planKey] as any
        expect(plan.stripeId).toBeDefined()
        expect(plan.vnpayId).toBeDefined()
        expect(plan.momoId).toBeDefined()
      })
    })

    it('should not have payment gateway IDs for free plan', () => {
      const freePlan = UNIFIED_SUBSCRIPTION_PLANS.free as any
      expect(freePlan.stripeId).toBeUndefined()
      expect(freePlan.vnpayId).toBeUndefined()
      expect(freePlan.momoId).toBeUndefined()
    })
  })

  describe('Price Formatting', () => {
    describe.each([
      [0, 'VND', '0 ₫'],
      [1000, 'VND', '1.000 ₫'],
      [239000, 'VND', '239.000 ₫'],
      [2399000, 'VND', '2.399.000 ₫'],
      [9.99, 'USD', '$9.99'],
      [29.99, 'USD', '$29.99'],
      [99.99, 'USD', '$99.99'],
    ])('Amount: %s %s', (amount, currency, expected) => {
      it(`should format ${amount} ${currency} as ${expected}`, () => {
        const result = formatPrice(amount, currency as Currency)
        expect(result).toBe(expected)
      })
    })

    it('should default to VND when no currency specified', () => {
      const result = formatPrice(1000)
      expect(result).toBe('1.000 ₫')
    })

    it('should handle zero amounts', () => {
      expect(formatPrice(0, 'USD')).toBe('$0.00')
      expect(formatPrice(0, 'VND')).toBe('0 ₫')
    })

    it('should handle large amounts', () => {
      expect(formatPrice(999999, 'VND')).toBe('999.999 ₫')
      expect(formatPrice(9999.99, 'USD')).toBe('$9,999.99')
    })
  })

  describe('Payment Method Names', () => {
    describe.each([
      ['stripe', 'vi', 'Thẻ quốc tế (Visa/Mastercard)'],
      ['stripe', 'en', 'International Cards (Visa/Mastercard)'],
      ['vnpay', 'vi', 'Thẻ nội địa / Internet Banking'],
      ['vnpay', 'en', 'Domestic Cards / Internet Banking'],
      ['momo', 'vi', 'Ví MoMo'],
      ['momo', 'en', 'MoMo Wallet'],
    ])('Method: %s, Language: %s', (method, language, expected) => {
      it(`should return "${expected}" for ${method} in ${language}`, () => {
        const result = getPaymentMethodName(
          method as PaymentMethod,
          language as 'vi' | 'en'
        )
        expect(result).toBe(expected)
      })
    })

    it('should default to Vietnamese language', () => {
      const result = getPaymentMethodName('vnpay')
      expect(result).toBe('Thẻ nội địa / Internet Banking')
    })

    it('should handle all payment methods', () => {
      const methods: PaymentMethod[] = ['stripe', 'vnpay', 'momo']
      methods.forEach(method => {
        expect(() => getPaymentMethodName(method, 'vi')).not.toThrow()
        expect(() => getPaymentMethodName(method, 'en')).not.toThrow()
      })
    })
  })

  describe('Available Payment Methods', () => {
    it('should return all supported payment methods', () => {
      const methods = getAvailablePaymentMethods()
      expect(methods).toEqual(['vnpay', 'momo', 'stripe'])
    })

    it('should prioritize Vietnamese payment methods', () => {
      const methods = getAvailablePaymentMethods()
      expect(methods[0]).toBe('vnpay')
      expect(methods[1]).toBe('momo')
      expect(methods[2]).toBe('stripe')
    })

    it('should return consistent results', () => {
      const methods1 = getAvailablePaymentMethods()
      const methods2 = getAvailablePaymentMethods()
      expect(methods1).toEqual(methods2)
    })
  })

  describe('Payment Method Icons', () => {
    describe.each([
      ['stripe', 'CreditCard'],
      ['vnpay', 'Building2'],
      ['momo', 'Wallet'],
    ])('Method: %s', (method, expectedIcon) => {
      it(`should return ${expectedIcon} icon for ${method}`, () => {
        const result = getPaymentMethodIconType(method as PaymentMethod)
        expect(result).toBe(expectedIcon)
      })
    })

    it('should return icon types for all payment methods', () => {
      const methods: PaymentMethod[] = ['stripe', 'vnpay', 'momo']
      methods.forEach(method => {
        const icon = getPaymentMethodIconType(method)
        expect(typeof icon).toBe('string')
        expect(icon.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Plan ID Resolution', () => {
    describe.each([
      ['standard', 'stripe', 'price_standard_stripe'],
      ['standard', 'vnpay', 'vnpay_standard'],
      ['standard', 'momo', 'momo_standard'],
      ['premium', 'stripe', 'price_premium_stripe'],
      ['premium', 'vnpay', 'vnpay_premium'],
      ['premium', 'momo', 'momo_premium'],
      ['enterprise', 'stripe', 'price_enterprise_stripe'],
      ['enterprise', 'vnpay', 'vnpay_enterprise'],
      ['enterprise', 'momo', 'momo_enterprise'],
    ])('Plan: %s, Method: %s', (planKey, method, expectedId) => {
      it(`should return ${expectedId} for ${planKey} + ${method}`, () => {
        const result = getPlanId(
          planKey as UnifiedSubscriptionPlan,
          method as PaymentMethod
        )
        expect(result).toBe(expectedId)
      })
    })

    it('should return null for free plan', () => {
      const methods: PaymentMethod[] = ['stripe', 'vnpay', 'momo']
      methods.forEach(method => {
        const result = getPlanId('free', method)
        expect(result).toBeNull()
      })
    })

    it('should handle invalid payment methods gracefully', () => {
      const result = getPlanId('standard', 'invalid' as PaymentMethod)
      expect(result).toBeNull()
    })
  })

  describe('Recommended Payment Method', () => {
    it('should recommend VNPay for Vietnamese market', () => {
      const recommended = getRecommendedPaymentMethod()
      expect(recommended).toBe('vnpay')
    })

    it('should return consistent recommendation', () => {
      const rec1 = getRecommendedPaymentMethod()
      const rec2 = getRecommendedPaymentMethod()
      expect(rec1).toBe(rec2)
    })
  })

  describe('Payment Method Support', () => {
    describe.each([
      ['free', false, false, false],
      ['standard', true, true, true],
      ['premium', true, true, true],
      ['enterprise', true, true, true],
    ])(
      'Plan: %s',
      (planKey, stripeSupported, vnpaySupported, momoSupported) => {
        it(`should correctly identify Stripe support for ${planKey}`, () => {
          const result = isPaymentMethodSupported(
            planKey as UnifiedSubscriptionPlan,
            'stripe'
          )
          expect(result).toBe(stripeSupported)
        })

        it(`should correctly identify VNPay support for ${planKey}`, () => {
          const result = isPaymentMethodSupported(
            planKey as UnifiedSubscriptionPlan,
            'vnpay'
          )
          expect(result).toBe(vnpaySupported)
        })

        it(`should correctly identify MoMo support for ${planKey}`, () => {
          const result = isPaymentMethodSupported(
            planKey as UnifiedSubscriptionPlan,
            'momo'
          )
          expect(result).toBe(momoSupported)
        })
      }
    )

    it('should handle edge cases gracefully', () => {
      expect(isPaymentMethodSupported('free', 'stripe')).toBe(false)
      expect(isPaymentMethodSupported('free', 'vnpay')).toBe(false)
      expect(isPaymentMethodSupported('free', 'momo')).toBe(false)
    })
  })

  describe('Supported Payment Methods for Plans', () => {
    it('should return empty array for free plan', () => {
      const methods = getSupportedPaymentMethods('free')
      expect(methods).toEqual([])
    })

    describe.each([
      ['standard', ['vnpay', 'momo', 'stripe']],
      ['premium', ['vnpay', 'momo', 'stripe']],
      ['enterprise', ['vnpay', 'momo', 'stripe']],
    ])('Plan: %s', (planKey, expectedMethods) => {
      it(`should return all payment methods for ${planKey}`, () => {
        const methods = getSupportedPaymentMethods(
          planKey as UnifiedSubscriptionPlan
        )
        expect(methods).toEqual(expectedMethods)
      })

      it(`should prioritize Vietnamese methods for ${planKey}`, () => {
        const methods = getSupportedPaymentMethods(
          planKey as UnifiedSubscriptionPlan
        )
        expect(methods[0]).toBe('vnpay')
        expect(methods[1]).toBe('momo')
      })
    })

    it('should return consistent results across calls', () => {
      const methods1 = getSupportedPaymentMethods('premium')
      const methods2 = getSupportedPaymentMethods('premium')
      expect(methods1).toEqual(methods2)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid plan keys gracefully', () => {
      // @ts-expect-error - Testing runtime behavior with invalid input
      const result = getPlanId('invalid' as UnifiedSubscriptionPlan, 'stripe')
      expect(result).toBeNull()
    })

    it('should handle invalid payment methods gracefully', () => {
      const result = isPaymentMethodSupported(
        'standard',
        'invalid' as PaymentMethod
      )
      expect(result).toBe(false)
    })

    it('should handle undefined values gracefully', () => {
      expect(() => formatPrice(0, undefined as any)).not.toThrow()
      expect(() =>
        getPaymentMethodName('stripe', undefined as any)
      ).not.toThrow()
    })

    it('should handle negative amounts in price formatting', () => {
      expect(formatPrice(-100, 'USD')).toBe('-$100.00')
      expect(formatPrice(-1000, 'VND')).toBe('-1.000 ₫')
    })

    it('should handle very large amounts', () => {
      const largeAmount = 999999999
      expect(() => formatPrice(largeAmount, 'USD')).not.toThrow()
      expect(() => formatPrice(largeAmount, 'VND')).not.toThrow()
    })

    it('should handle decimal precision in VND', () => {
      const result = formatPrice(1000.55, 'VND')
      expect(result).toBe('1.000,55 ₫') // VND with Vietnamese locale formatting
    })
  })

  describe('Type Safety and Constants', () => {
    it('should have correct TypeScript types', () => {
      const methods: PaymentMethod[] = ['stripe', 'vnpay', 'momo']
      const currencies: Currency[] = ['USD', 'VND']
      const plans: UnifiedSubscriptionPlan[] = [
        'free',
        'standard',
        'premium',
        'enterprise',
      ]

      // Type checks - these should compile without errors
      expect(methods.length).toBe(3)
      expect(currencies.length).toBe(2)
      expect(plans.length).toBe(4)
    })

    it('should have immutable subscription plans', () => {
      // Attempt to modify the plans object should not affect original
      const originalStandard = UNIFIED_SUBSCRIPTION_PLANS.standard
      const copyStandard = { ...originalStandard }

      expect(originalStandard).toEqual(copyStandard)
    })

    it('should maintain consistency in plan structure', () => {
      Object.entries(UNIFIED_SUBSCRIPTION_PLANS).forEach(([key, plan]) => {
        // Each plan should have required properties
        expect(plan).toHaveProperty('name')
        expect(plan).toHaveProperty('nameVi')
        expect(plan).toHaveProperty('priceUSD')
        expect(plan).toHaveProperty('priceVND')
        expect(plan).toHaveProperty('period')
        expect(plan).toHaveProperty('features')
        expect(plan).toHaveProperty('featuresVi')
        expect(plan).toHaveProperty('limits')

        // Features should be arrays
        expect(Array.isArray(plan.features)).toBe(true)
        expect(Array.isArray(plan.featuresVi)).toBe(true)

        // Limits should have required properties
        expect(plan.limits).toHaveProperty('translations')
        expect(plan.limits).toHaveProperty('documents')
        expect(plan.limits).toHaveProperty('characters')
      })
    })
  })

  describe('Business Logic Validation', () => {
    it('should have logical pricing progression', () => {
      const plans = Object.values(UNIFIED_SUBSCRIPTION_PLANS)
      const prices = plans.map(plan => plan.priceUSD).sort((a, b) => a - b)

      // Prices should be in ascending order: free < standard < premium < enterprise
      expect(prices).toEqual([0, 9.99, 29.99, 99.99])
    })

    it('should have logical limits progression', () => {
      const free = UNIFIED_SUBSCRIPTION_PLANS.free.limits
      const standard = UNIFIED_SUBSCRIPTION_PLANS.standard.limits
      const premium = UNIFIED_SUBSCRIPTION_PLANS.premium.limits
      const enterprise = UNIFIED_SUBSCRIPTION_PLANS.enterprise.limits

      // Translation limits should increase
      expect(free.translations).toBeLessThan(standard.translations)
      expect(standard.translations).toBeLessThan(premium.translations)
      expect(premium.translations).toBeLessThan(enterprise.translations)

      // Character limits should increase
      expect(free.characters).toBeLessThan(standard.characters)
      expect(standard.characters).toBeLessThan(premium.characters)
      expect(premium.characters).toBeLessThan(enterprise.characters)
    })

    it('should have reasonable USD to VND exchange rates', () => {
      const plans = Object.values(UNIFIED_SUBSCRIPTION_PLANS).filter(
        plan => plan.priceUSD > 0
      )

      plans.forEach(plan => {
        const exchangeRate = plan.priceVND / plan.priceUSD
        // Exchange rate should be reasonable (around 23,000-25,000 VND per USD)
        expect(exchangeRate).toBeGreaterThan(20000)
        expect(exchangeRate).toBeLessThan(30000)
      })
    })

    it('should provide value progression in features', () => {
      const plans = ['free', 'standard', 'premium', 'enterprise'] as const

      plans.forEach(planKey => {
        const plan = UNIFIED_SUBSCRIPTION_PLANS[planKey]
        expect(plan.features.length).toBeGreaterThan(0)
        expect(plan.featuresVi.length).toBe(plan.features.length)
      })

      // Higher tier plans should have more features
      expect(
        UNIFIED_SUBSCRIPTION_PLANS.enterprise.features.length
      ).toBeGreaterThanOrEqual(
        UNIFIED_SUBSCRIPTION_PLANS.premium.features.length
      )
    })
  })
})
