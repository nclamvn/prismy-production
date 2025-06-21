'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { motionSafe } from '@/lib/motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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
  // Premium pricing with full context support
}

export default function PricingPage({}: PricingPageProps) {
  // Fixed context hooks
  const { 
    user,
    loading: authLoading
  } = useAuth()
  
  const { 
    language,
    setLanguage
  } = useLanguage()

  // Simple currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Simple translation function
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      vi: {
        'pricing.title': 'Bảng Giá Premium',
        'pricing.subtitle': 'Chọn gói phù hợp với nhu cầu dịch thuật của bạn',
        'pricing.welcome': 'Chào mừng',
        'pricing.currentTier': 'Gói hiện tại',
        'pricing.usage': 'Đã sử dụng',
        'pricing.free': 'Miễn phí',
        'pricing.standard': 'Chuẩn',
        'pricing.premium': 'Premium',
        'pricing.enterprise': 'Doanh nghiệp',
        'pricing.monthly': 'Hàng tháng',
        'pricing.yearly': 'Hàng năm',
        'pricing.save20': 'Tiết kiệm 20%',
        'pricing.paymentMethod': 'Phương thức thanh toán',
        'pricing.popular': 'Phổ biến',
        'pricing.currentPlan': 'Gói hiện tại',
        'pricing.getStarted': 'Bắt đầu ngay',
        'pricing.choosePlan': 'Chọn gói này',
        'common.loading': 'Đang tải...',
        'pricing.features.basicTranslation': 'Dịch thuật cơ bản',
        'pricing.features.fiveDocuments': '5 tài liệu/tháng',
        'pricing.features.communitySupport': 'Hỗ trợ cộng đồng',
        'pricing.features.unlimitedTranslation': 'Dịch thuật không giới hạn',
        'pricing.features.ocrSupport': 'Hỗ trợ OCR',
        'pricing.features.priorityProcessing': 'Xử lý ưu tiên',
        'pricing.features.emailSupport': 'Hỗ trợ qua email',
        'pricing.features.advancedOcr': 'OCR nâng cao',
        'pricing.features.batchProcessing': 'Xử lý hàng loạt',
        'pricing.features.apiAccess': 'Truy cập API',
        'pricing.features.premiumSupport': 'Hỗ trợ cao cấp',
        'pricing.features.customModels': 'Mô hình tùy chỉnh',
        'pricing.features.unlimitedEverything': 'Không giới hạn mọi thứ',
        'pricing.features.dedicatedSupport': 'Hỗ trợ chuyên biệt',
        'pricing.features.slaGuarantee': 'Đảm bảo SLA',
        'pricing.features.customIntegration': 'Tích hợp tùy chỉnh',
        'pricing.features.onPremise': 'Triển khai riêng'
      },
      en: {
        'pricing.title': 'Premium Pricing',
        'pricing.subtitle': 'Choose the perfect plan for your translation needs',
        'pricing.welcome': 'Welcome',
        'pricing.currentTier': 'Current plan',
        'pricing.usage': 'Usage',
        'pricing.free': 'Free',
        'pricing.standard': 'Standard',
        'pricing.premium': 'Premium',
        'pricing.enterprise': 'Enterprise',
        'pricing.monthly': 'Monthly',
        'pricing.yearly': 'Yearly',
        'pricing.save20': 'Save 20%',
        'pricing.paymentMethod': 'Payment Method',
        'pricing.popular': 'Popular',
        'pricing.currentPlan': 'Current Plan',
        'pricing.getStarted': 'Get Started',
        'pricing.choosePlan': 'Choose Plan',
        'common.loading': 'Loading...',
        'pricing.features.basicTranslation': 'Basic translation',
        'pricing.features.fiveDocuments': '5 documents/month',
        'pricing.features.communitySupport': 'Community support',
        'pricing.features.unlimitedTranslation': 'Unlimited translation',
        'pricing.features.ocrSupport': 'OCR support',
        'pricing.features.priorityProcessing': 'Priority processing',
        'pricing.features.emailSupport': 'Email support',
        'pricing.features.advancedOcr': 'Advanced OCR',
        'pricing.features.batchProcessing': 'Batch processing',
        'pricing.features.apiAccess': 'API access',
        'pricing.features.premiumSupport': 'Premium support',
        'pricing.features.customModels': 'Custom models',
        'pricing.features.unlimitedEverything': 'Unlimited everything',
        'pricing.features.dedicatedSupport': 'Dedicated support',
        'pricing.features.slaGuarantee': 'SLA guarantee',
        'pricing.features.customIntegration': 'Custom integration',
        'pricing.features.onPremise': 'On-premise'
      }
    }
    return translations[language]?.[key] || key
  }

  // Premium state management
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [currency, setCurrency] = useState<Currency>('VND')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('vnpay')
  const [quotaInfo, setQuotaInfo] = useState<{ canProceed: boolean; usage: number; limit: number } | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Load user quota information
  useEffect(() => {
    if (user && !authLoading) {
      // Quota check logic can be implemented later
      setQuotaInfo({ canProceed: true, usage: 0, limit: 1000 })
    }
  }, [user, authLoading])

  // Premium upgrade handler
  const handleUpgrade = async (planId: string) => {
    if (!user) {
      // Redirect to sign up with selected plan
      window.location.href = `/auth/signup?plan=${planId}&period=${billingPeriod}`
      return
    }

    setIsUpgrading(true)
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingPeriod,
          paymentMethod: selectedPaymentMethod,
          currency
        })
      })

      const { url, error } = await response.json()
      if (error) throw new Error(error)
      
      window.location.href = url
    } catch (error) {
      console.error('Upgrade failed:', error)
      // Show error toast
    } finally {
      setIsUpgrading(false)
    }
  }

  // Show loading state during SSR
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  // Premium content with translations
  const getPlanDisplayName = (planId: string) => {
    const translations = {
      free: t('pricing.free'),
      standard: t('pricing.standard'), 
      premium: t('pricing.premium'),
      enterprise: t('pricing.enterprise')
    }
    return translations[planId as keyof typeof translations] || planId
  }

  const getFeaturesByPlan = (planId: string) => {
    const features = {
      free: [
        t('pricing.features.basicTranslation'),
        t('pricing.features.fiveDocuments'),
        t('pricing.features.communitySupport')
      ],
      standard: [
        t('pricing.features.unlimitedTranslation'),
        t('pricing.features.ocrSupport'),
        t('pricing.features.priorityProcessing'),
        t('pricing.features.emailSupport')
      ],
      premium: [
        t('pricing.features.advancedOcr'),
        t('pricing.features.batchProcessing'),
        t('pricing.features.apiAccess'),
        t('pricing.features.premiumSupport'),
        t('pricing.features.customModels')
      ],
      enterprise: [
        t('pricing.features.unlimitedEverything'),
        t('pricing.features.dedicatedSupport'),
        t('pricing.features.slaGuarantee'),
        t('pricing.features.customIntegration'),
        t('pricing.features.onPremise')
      ]
    }
    return features[planId as keyof typeof features] || []
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section with Premium Typography */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <motion.h1 
            className="heading-hero text-center mb-6"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
          >
            {t('pricing.title')}
          </motion.h1>
          <motion.p 
            className="subheadline text-center max-w-4xl mx-auto"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
          >
            {t('pricing.subtitle')}
          </motion.p>
        </div>

        {/* User Status Banner (Premium Feature) */}
        {user && (
          <motion.div 
            className="card-base p-6 mb-12"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="heading-4 mb-2">
                  {t('pricing.welcome')} {user.email}
                </h3>
                <p className="body-base">
                  {t('pricing.currentTier')}: <span className="badge-accent ml-2">
                    {getPlanDisplayName('free')}
                  </span>
                </p>
              </div>
              {quotaInfo && (
                <div className="text-right">
                  <div className="body-sm text-gray-500 mb-2">
                    {t('pricing.usage')}: {quotaInfo.usage.toLocaleString()} / {quotaInfo.limit.toLocaleString()}
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((quotaInfo.usage / quotaInfo.limit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Billing Period Toggle */}
        <motion.div 
          className="flex justify-center mb-12"
          {...motionSafe({
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6 }
          })}
        >
          <div className="bg-gray-100 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`btn-pill-md ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`btn-pill-md relative ml-1 ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.yearly')}
              <span className="badge-base bg-green-500 text-white absolute -top-2 -right-2">
                {t('pricing.save20')}
              </span>
            </button>
          </div>
        </motion.div>
        {/* Payment Method Selection */}
        <motion.div 
          className="flex justify-center mb-8"
          {...motionSafe({
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6 }
          })}
        >
          <div className="card-base p-6 max-w-lg">
            <h3 className="heading-5 text-center mb-4">
              {t('pricing.paymentMethod')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {getAvailablePaymentMethods().map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedPaymentMethod(method)}
                  className={`template-chip ${
                    selectedPaymentMethod === method
                      ? 'template-chip-active'
                      : ''
                  }`}
                >
                  <span className="text-lg">{getPaymentMethodIcon(method)}</span>
                  <span className="hidden sm:inline body-sm">
                    {getPaymentMethodName(method, language)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pricing Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          {...motionSafe({
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6 }
          })}
        >
          {Object.entries(UNIFIED_SUBSCRIPTION_PLANS).map(([planId, plan], index) => {
            const isPopular = planId === 'premium'
            const currentPlan = false // user?.subscription?.tier === planId
            const price = billingPeriod === 'yearly' && (plan as any).priceVND > 0 
              ? (plan as any).priceVND * 12 * 0.8 // 20% yearly discount
              : (plan as any).priceVND
            
            return (
              <motion.div
                key={planId}
                className={`card-base card-hover relative p-8 ${
                  isPopular 
                    ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' 
                    : currentPlan
                    ? 'ring-2 ring-green-500 ring-offset-2'
                    : ''
                }`}
                {...motionSafe({
                  initial: { opacity: 0, y: 30 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.6, delay: index * 0.1 }
                })}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="badge-accent">
                      {t('pricing.popular')}
                    </span>
                  </div>
                )}
                
                {/* Current Plan Badge */}
                {currentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="badge-base bg-green-500 text-white">
                      {t('pricing.currentPlan')}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="heading-3 mb-4">
                    {getPlanDisplayName(planId)}
                  </h3>
                  <div className="mb-4">
                    {price === 0 ? (
                      <div className="heading-1">
                        {t('pricing.free')}
                      </div>
                    ) : (
                      <div>
                        <span className="heading-1">
                          {formatCurrency(price)}
                        </span>
                        <span className="body-base text-gray-500 ml-2">
                          {billingPeriod === 'yearly' ? t('pricing.yearly') : t('pricing.monthly')}
                        </span>
                      </div>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && price > 0 && (
                    <span className="tag-success">
                      {t('pricing.save20')}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {getFeaturesByPlan(planId).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="body-base">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={isUpgrading || currentPlan}
                  className={`w-full ${
                    currentPlan
                      ? 'btn-secondary opacity-50 cursor-not-allowed'
                      : isPopular
                      ? 'btn-accent btn-pill-lg'
                      : planId === 'free'
                      ? 'btn-secondary btn-pill-lg'
                      : 'btn-primary btn-pill-lg'
                  }`}
                >
                  {isUpgrading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                      {t('common.loading')}
                    </div>
                  ) : currentPlan ? (
                    t('pricing.currentPlan')
                  ) : planId === 'free' ? (
                    t('pricing.getStarted')
                  ) : (
                    t('pricing.choosePlan')
                  )}
                </button>
              </motion.div>
            )
          })}
        </motion.div>

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
                      {language === 'vi' ? (plan as any).nameVi : (plan as any).name}
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

        {/* Bottom Note */}
        <div className="text-center mt-16 mb-12">
          <p className="body-base text-gray-600">
            {language === 'vi' 
              ? 'Tất cả gói dịch vụ đều bao gồm công cụ dịch thuật cốt lõi và hỗ trợ cơ bản'
              : 'All plans include our core translation engine and basic support'
            }
          </p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}