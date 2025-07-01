import { SUBSCRIPTION_PLANS } from '@/lib/stripe'
import { VNPAY_SUBSCRIPTION_PLANS, formatVND as formatVNPayVND } from './vnpay'
import { MOMO_SUBSCRIPTION_PLANS, formatVND as formatMoMoVND } from './momo'

export type PaymentMethod = 'stripe' | 'vnpay' | 'momo'
export type Currency = 'USD' | 'VND'

// Unified subscription plans interface
export interface UnifiedPlan {
  name: string
  nameVi: string
  priceUSD: number
  priceVND: number
  period: string
  features: string[]
  featuresVi: string[]
  limits: {
    translations: number
    documents: number
    characters: number
  }
  stripeId?: string
  vnpayId?: string
  momoId?: string
}

// Unified subscription plans combining all payment methods
export const UNIFIED_SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    nameVi: 'Miễn phí',
    priceUSD: 0,
    priceVND: 0,
    period: 'monthly',
    features: [
      '10 translations per month',
      'Basic translation quality',
      'Text translation only',
      'Community support'
    ],
    featuresVi: [
      '10 lượt dịch mỗi tháng',
      'Chất lượng dịch thuật cơ bản',
      'Chỉ dịch văn bản',
      'Hỗ trợ cộng đồng'
    ],
    limits: {
      translations: 10,
      documents: 0,
      characters: 10000
    }
  },
  standard: {
    name: 'Standard',
    nameVi: 'Tiêu chuẩn',
    priceUSD: 9.99,
    priceVND: 239000,
    period: 'monthly',
    features: [
      '50 translations per month',
      'Enhanced accuracy',
      'Document translation',
      'Email support',
      'Translation history'
    ],
    featuresVi: [
      '50 lượt dịch mỗi tháng',
      'Chất lượng dịch thuật nâng cao',
      'Dịch tài liệu',
      'Hỗ trợ qua email',
      'Lịch sử dịch thuật'
    ],
    limits: {
      translations: 50,
      documents: 10,
      characters: 50000
    },
    stripeId: SUBSCRIPTION_PLANS.standard.priceId,
    vnpayId: 'vnpay_standard',
    momoId: 'momo_standard'
  },
  premium: {
    name: 'Premium',
    nameVi: 'Cao cấp',
    priceUSD: 29.99,
    priceVND: 719000,
    period: 'monthly',
    features: [
      '200 translations per month',
      'Professional quality',
      'Unlimited documents',
      'Priority support',
      'Advanced analytics',
      'Team collaboration'
    ],
    featuresVi: [
      '200 lượt dịch mỗi tháng',
      'Chất lượng chuyên nghiệp',
      'Không giới hạn tài liệu',
      'Hỗ trợ ưu tiên',
      'Phân tích nâng cao',
      'Cộng tác nhóm'
    ],
    limits: {
      translations: 200,
      documents: -1,
      characters: 200000
    },
    stripeId: SUBSCRIPTION_PLANS.premium.priceId,
    vnpayId: 'vnpay_premium',
    momoId: 'momo_premium'
  },
  enterprise: {
    name: 'Enterprise',
    nameVi: 'Doanh nghiệp',
    priceUSD: 99.99,
    priceVND: 2399000,
    period: 'monthly',
    features: [
      '1000 translations per month',
      'Maximum precision',
      'Unlimited everything',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ],
    featuresVi: [
      '1000 lượt dịch mỗi tháng',
      'Độ chính xác tối đa',
      'Không giới hạn mọi thứ',
      'Hỗ trợ chuyên biệt',
      'Tích hợp tùy chỉnh',
      'Đảm bảo SLA'
    ],
    limits: {
      translations: 1000,
      documents: -1,
      characters: 1000000
    },
    stripeId: SUBSCRIPTION_PLANS.enterprise.priceId,
    vnpayId: 'vnpay_enterprise',
    momoId: 'momo_enterprise'
  }
} as const

export type UnifiedSubscriptionPlan = keyof typeof UNIFIED_SUBSCRIPTION_PLANS

// Helper function to format price based on currency
export const formatPrice = (amount: number, currency: Currency = 'VND'): string => {
  if (currency === 'VND') {
    return formatVNPayVND(amount)
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }
}

// Get payment method display names
export const getPaymentMethodName = (method: PaymentMethod, language: 'vi' | 'en' = 'vi'): string => {
  const names = {
    stripe: {
      vi: 'Thẻ quốc tế (Visa/Mastercard)',
      en: 'International Cards (Visa/Mastercard)'
    },
    vnpay: {
      vi: 'Thẻ nội địa / Internet Banking',
      en: 'Domestic Cards / Internet Banking'
    },
    momo: {
      vi: 'Ví MoMo',
      en: 'MoMo Wallet'
    }
  }
  
  return names[method][language]
}

// Get available payment methods for Vietnamese market
export const getAvailablePaymentMethods = (): PaymentMethod[] => {
  return ['vnpay', 'momo', 'stripe']
}

// Get payment method icon type for rendering
export const getPaymentMethodIconType = (method: PaymentMethod): string => {
  const icons = {
    stripe: 'CreditCard',
    vnpay: 'Building2',
    momo: 'Wallet'
  }
  
  return icons[method]
}

// Convert plan key to payment-specific plan ID
export const getPlanId = (planKey: UnifiedSubscriptionPlan, method: PaymentMethod): string | null => {
  const plan = UNIFIED_SUBSCRIPTION_PLANS[planKey]
  
  if (!plan) {
    return null
  }
  
  switch (method) {
    case 'stripe':
      return (plan as any).stripeId || null
    case 'vnpay':
      return (plan as any).vnpayId || null
    case 'momo':
      return (plan as any).momoId || null
    default:
      return null
  }
}

// Get recommended payment method for Vietnamese users
export const getRecommendedPaymentMethod = (): PaymentMethod => {
  return 'vnpay' // VNPay is most widely accepted for domestic cards
}

// Check if payment method supports the plan
export const isPaymentMethodSupported = (planKey: UnifiedSubscriptionPlan, method: PaymentMethod): boolean => {
  if (planKey === 'free') return false // Free plan doesn't need payment
  
  const planId = getPlanId(planKey, method)
  return planId !== null
}

// Get all supported payment methods for a plan
export const getSupportedPaymentMethods = (planKey: UnifiedSubscriptionPlan): PaymentMethod[] => {
  if (planKey === 'free') return []
  
  return getAvailablePaymentMethods().filter(method => 
    isPaymentMethodSupported(planKey, method)
  )
}