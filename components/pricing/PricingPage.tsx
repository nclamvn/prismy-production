'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
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
  // Language now managed globally
}

export default function PricingPage({}: PricingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [currency, setCurrency] = useState<Currency>('VND')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('vnpay')
  const { user } = useAuth()
  const { language } = useLanguage()

  const content = {
    vi: {
      title: 'Chuyển ngữ không phải gánh nặng chi phí',
      subtitle: 'Prismy tối ưu hoá ngân sách, tối đa hoá giá trị tài liệu cho doanh nghiệp',
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
      title: 'Translation shouldn\'t be a cost burden',
      subtitle: 'Prismy optimizes budget, maximizes document value for enterprises',
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
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-12 px-4 md:px-8 lg:px-12">
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
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 zen-card-hover-pricing ${
                  isPopular 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-gray-200'
                }`}
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

        {/* Feature Comparison Table */}
        <div className="mt-24 px-4 md:px-8 lg:px-12">
          <motion.div 
            className="text-center mb-12"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
          >
            <h2 className="heading-2 text-gray-900 mb-4">
              {language === 'vi' ? 'So sánh chi tiết các gói' : 'Detailed Plan Comparison'}
            </h2>
            <p className="body-lg text-gray-600">
              {language === 'vi' 
                ? 'Tìm hiểu chi tiết về tính năng của từng gói để chọn lựa phù hợp nhất'
                : 'Explore detailed features of each plan to make the best choice for your needs'
              }
            </p>
          </motion.div>

          <motion.div 
            className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-gray-200"
            {...motionSafe({
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6, delay: 0.2 }
            })}
          >
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    {language === 'vi' ? 'Tính năng' : 'Features'}
                  </th>
                  {Object.entries(UNIFIED_SUBSCRIPTION_PLANS).map(([key, plan]) => (
                    <th key={key} className="text-center py-4 px-6 font-semibold text-gray-900">
                      {language === 'vi' ? plan.nameVi : plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: language === 'vi' ? 'Số lượt dịch/tháng' : 'Translations per month',
                    values: ['10', '50', '200', '1,000']
                  },
                  {
                    feature: language === 'vi' ? 'Dịch tài liệu' : 'Document translation',
                    values: ['✗', '✓ (10 files)', '✓ Unlimited', '✓ Unlimited']
                  },
                  {
                    feature: language === 'vi' ? 'Số ký tự tối đa' : 'Character limit',
                    values: ['10K', '50K', '200K', '1M']
                  },
                  {
                    feature: language === 'vi' ? 'Phân tích nâng cao' : 'Advanced analytics',
                    values: ['✗', '✗', '✓', '✓']
                  },
                  {
                    feature: language === 'vi' ? 'Cộng tác nhóm' : 'Team collaboration',
                    values: ['✗', '✗', '✓', '✓']
                  },
                  {
                    feature: language === 'vi' ? 'Tích hợp API' : 'API integration',
                    values: ['✗', 'Basic', 'Advanced', 'Custom']
                  },
                  {
                    feature: language === 'vi' ? 'Hỗ trợ' : 'Support',
                    values: ['Community', 'Email', 'Priority', 'Dedicated']
                  }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                    {row.values.map((value, valueIndex) => (
                      <td key={valueIndex} className="py-4 px-6 text-center">
                        {value.includes('✓') ? (
                          <span className="text-green-600 font-semibold">{value}</span>
                        ) : value.includes('✗') ? (
                          <span className="text-gray-400">{value}</span>
                        ) : (
                          <span className="text-gray-700">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Enterprise Contact Section */}
        <div className="mt-24 px-4 md:px-8 lg:px-12">
          <motion.div 
            className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center text-white"
            {...motionSafe({
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
          >
            <h2 className="heading-2 mb-4">
              {language === 'vi' ? 'Cần giải pháp doanh nghiệp?' : 'Need an Enterprise Solution?'}
            </h2>
            <p className="body-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              {language === 'vi' 
                ? 'Liên hệ với đội ngũ chuyên gia để được tư vấn giải pháp dịch thuật tùy chỉnh, tích hợp hệ thống và hỗ trợ 24/7.'
                : 'Contact our experts for custom translation solutions, system integrations, and 24/7 dedicated support.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                {language === 'vi' ? 'Liên hệ tư vấn' : 'Contact Sales'}
              </button>
              <button className="border border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-colors">
                {language === 'vi' ? 'Đặt lịch demo' : 'Schedule Demo'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 px-4 md:px-8 lg:px-12">
          <motion.div 
            className="text-center mb-12"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
          >
            <h2 className="heading-2 text-gray-900 mb-4">
              {language === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently Asked Questions'}
            </h2>
            <p className="body-lg text-gray-600">
              {language === 'vi' 
                ? 'Tìm câu trả lời cho những thắc mắc phổ biến về gói dịch vụ'
                : 'Find answers to common questions about our pricing plans'
              }
            </p>
          </motion.div>

          <motion.div 
            className="max-w-3xl mx-auto space-y-6"
            {...motionSafe({
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6, delay: 0.2 }
            })}
          >
            {(language === 'vi' ? [
              {
                q: 'Tôi có thể thay đổi gói dịch vụ bất cứ lúc nào không?',
                a: 'Có, bạn có thể nâng cấp hoặc hạ cấp gói dịch vụ bất cứ lúc nào. Việc thay đổi sẽ có hiệu lực ngay lập tức và bạn sẽ được tính phí theo tỷ lệ.'
              },
              {
                q: 'Có được hoàn tiền không nếu tôi không hài lòng?',
                a: 'Chúng tôi cung cấp chính sách hoàn tiền trong 30 ngày đầu cho tất cả các gói trả phí nếu bạn không hoàn toàn hài lòng.'
              },
              {
                q: 'Dữ liệu của tôi có được bảo mật không?',
                a: 'Tuyệt đối. Chúng tôi sử dụng mã hóa end-to-end và tuân thủ các tiêu chuẩn bảo mật quốc tế như ISO 27001 và GDPR.'
              },
              {
                q: 'Có hỗ trợ nhiều ngôn ngữ không?',
                a: 'Chúng tôi hỗ trợ hơn 100 ngôn ngữ khác nhau, bao gồm các ngôn ngữ phổ biến ở Việt Nam và khu vực Đông Nam Á.'
              }
            ] : [
              {
                q: 'Can I change my plan at any time?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and you\'ll be charged pro-rata.'
              },
              {
                q: 'Do you offer refunds if I\'m not satisfied?',
                a: 'We offer a 30-day money-back guarantee for all paid plans if you\'re not completely satisfied with our service.'
              },
              {
                q: 'Is my data secure?',
                a: 'Absolutely. We use end-to-end encryption and comply with international security standards including ISO 27001 and GDPR.'
              },
              {
                q: 'How many languages do you support?',
                a: 'We support over 100 different languages, including all major languages in Vietnam and Southeast Asia.'
              }
            ]).map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-24 px-4 md:px-8 lg:px-12">
          <motion.div 
            className="text-center"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
          >
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1L5.5 4.5 1 5l2.5 7L10 19l6.5-7L19 5l-4.5-.5L10 1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-600">ISO 27001</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-600">GDPR {language === 'vi' ? 'Tuân thủ' : 'Compliant'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-600">99.9% {language === 'vi' ? 'Thời gian hoạt động' : 'Uptime'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="body-base text-gray-600">
            {language === 'vi' 
              ? 'Tất cả gói dịch vụ đều bao gồm công cụ dịch thuật cốt lõi và hỗ trợ cơ bản'
              : 'All plans include our core translation engine and basic support'
            }
          </p>
        </div>
      </div>
    </div>
  )
}