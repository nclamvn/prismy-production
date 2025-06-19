'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { motionSafe } from '@/lib/motion'
import { 
  UNIFIED_SUBSCRIPTION_PLANS, 
  formatPrice, 
  getAvailablePaymentMethods,
  getPaymentMethodName,
  getPaymentMethodIcon,
  type PaymentMethod,
  type Currency
} from '@/lib/payments/payment-service'

interface PricingPageProps {
  language?: 'vi' | 'en'
}

export default function PricingPage({ language = 'en' }: PricingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [currency, setCurrency] = useState<Currency>('VND')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('vnpay')
  const { user } = useAuth()

  const content = {
    vi: {
      title: 'Chọn gói dịch vụ phù hợp',
      subtitle: 'Bắt đầu miễn phí, nâng cấp khi cần',
      monthly: 'Hàng tháng',
      yearly: 'Hàng năm',
      yearlyDiscount: 'Tiết kiệm 20%',
      popular: 'Phổ biến',
      currentPlan: 'Gói hiện tại',
      choosePlan: 'Chọn gói này',
      getStarted: 'Bắt đầu',
      upgradeNow: 'Nâng cấp ngay',
      perMonth: '/tháng',
      perYear: '/năm',
      billed: 'Thanh toán',
      billedMonthly: 'hàng tháng',
      billedYearly: 'hàng năm',
      paymentMethod: 'Phương thức thanh toán',
      currency: 'Tiền tệ',
      vnd: 'Việt Nam Đồng',
      usd: 'Đô la Mỹ',
      features: {
        translations: 'lượt dịch mỗi tháng',
        documents: 'tài liệu',
        unlimited: 'Không giới hạn',
        characters: 'ký tự',
        support: 'Hỗ trợ',
        analytics: 'Phân tích nâng cao',
        collaboration: 'Cộng tác nhóm',
        integrations: 'Tích hợp tùy chỉnh',
        sla: 'Đảm bảo SLA'
      }
    },
    en: {
      title: 'Choose the right plan for you',
      subtitle: 'Start free, upgrade when you need',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlyDiscount: 'Save 20%',
      popular: 'Popular',
      currentPlan: 'Current Plan',
      choosePlan: 'Choose Plan',
      getStarted: 'Get Started',
      upgradeNow: 'Upgrade Now',
      perMonth: '/month',
      perYear: '/year',
      billed: 'Billed',
      billedMonthly: 'monthly',
      billedYearly: 'yearly',
      paymentMethod: 'Payment Method',
      currency: 'Currency',
      vnd: 'Vietnamese Dong',
      usd: 'US Dollar',
      features: {
        translations: 'translations per month',
        documents: 'documents',
        unlimited: 'Unlimited',
        characters: 'characters',
        support: 'support',
        analytics: 'Advanced analytics',
        collaboration: 'Team collaboration',
        integrations: 'Custom integrations',
        sla: 'SLA guarantee'
      }
    }
  }

  const getFeatureText = (feature: string) => {
    // Features are now already localized in UNIFIED_SUBSCRIPTION_PLANS
    return feature
  }

  const handleSubscribe = async (planKey: keyof typeof UNIFIED_SUBSCRIPTION_PLANS) => {
    if (planKey === 'free') {
      return // Free plan doesn't need payment
    }
    
    if (!user) {
      // TODO: Show auth modal or redirect to login
      return
    }
    
    try {
      let response
      let endpoint = ''
      
      // Choose API endpoint based on selected payment method
      switch (selectedPaymentMethod) {
        case 'vnpay':
          endpoint = '/api/payments/vnpay/create'
          break
        case 'momo':
          endpoint = '/api/payments/momo/create'
          break
        case 'stripe':
          endpoint = '/api/stripe/create-checkout'
          break
        default:
          throw new Error('Phương thức thanh toán không được hỗ trợ')
      }

      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tạo phiên thanh toán')
      }

      // Redirect to payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating payment session:', error)
      // TODO: Show error message to user
    }
  }

  const getYearlyPrice = (monthlyPrice: number) => {
    return monthlyPrice * 12 * 0.8 // 20% discount
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            className="heading-1 text-gray-900 mb-4"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
          >
            {content[language].title}
          </motion.h1>
          <motion.p 
            className="heading-4 text-gray-600 mb-8"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6, delay: 0.1 }
            })}
          >
            {content[language].subtitle}
          </motion.p>

          {/* Currency Toggle */}
          <motion.div 
            className="inline-flex items-center bg-gray-100 rounded-xl p-1 mb-6"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6, delay: 0.2 }
            })}
          >
            <button
              onClick={() => setCurrency('VND')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                currency === 'VND'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {content[language].vnd}
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                currency === 'USD'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {content[language].usd}
            </button>
          </motion.div>

          {/* Payment Method Selection */}
          <motion.div 
            className="mb-6"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6, delay: 0.25 }
            })}
          >
            <h3 className="body-base font-medium text-gray-900 mb-3 text-center">
              {content[language].paymentMethod}
            </h3>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-3 bg-gray-100 rounded-xl p-1">
                {getAvailablePaymentMethods().map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                      selectedPaymentMethod === method
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>{getPaymentMethodIcon(method)}</span>
                    <span className="hidden sm:inline">
                      {getPaymentMethodName(method, language)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div 
            className="inline-flex items-center bg-gray-100 rounded-xl p-1"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6, delay: 0.3 }
            })}
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {content[language].monthly}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {content[language].yearly}
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {content[language].yearlyDiscount}
              </span>
            </button>
          </motion.div>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(UNIFIED_SUBSCRIPTION_PLANS).map(([key, plan], index) => {
            const planKey = key as keyof typeof UNIFIED_SUBSCRIPTION_PLANS
            const isPopular = planKey === 'premium'
            const basePrice = currency === 'VND' ? plan.priceVND : plan.priceUSD
            const price = billingPeriod === 'yearly' && basePrice > 0 ? getYearlyPrice(basePrice) : basePrice
            const period = billingPeriod === 'yearly' ? content[language].perYear : content[language].perMonth
            const planName = language === 'vi' ? plan.nameVi : plan.name
            const features = language === 'vi' ? plan.featuresVi : plan.features
            
            return (
              <motion.div
                key={key}
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  isPopular 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-300 hover:shadow-xl`}
                {...motionSafe({
                  initial: { opacity: 0, y: 30 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.6, delay: index * 0.1 }
                })}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {content[language].popular}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="heading-3 text-gray-900 mb-2">{planName}</h3>
                  <div className="mb-4">
                    {basePrice === 0 ? (
                      <span className="heading-2 text-gray-900">
                        {language === 'vi' ? 'Miễn phí' : 'Free'}
                      </span>
                    ) : (
                      <div>
                        <span className="heading-2 text-gray-900">{formatPrice(price, currency)}</span>
                        <span className="body-base text-gray-600">{period}</span>
                      </div>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && basePrice > 0 && (
                    <p className="body-sm text-gray-600">
                      {content[language].billed} {content[language].billedYearly}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="body-sm text-gray-700">
                        {getFeatureText(feature)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(planKey)}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                    isPopular
                      ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                      : planKey === 'free'
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {planKey === 'free' 
                    ? content[language].getStarted
                    : content[language].choosePlan
                  }
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="body-base text-gray-600">
            All plans include our core translation engine and basic support
          </p>
        </div>
      </div>
    </div>
  )
}