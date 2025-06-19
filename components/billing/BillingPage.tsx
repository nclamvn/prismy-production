'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SUBSCRIPTION_PLANS, formatPrice, getPlanByPriceId } from '@/lib/stripe'
import { motionSafe } from '@/lib/motion'
import type { UserProfile } from '@/lib/supabase'

interface BillingPageProps {
  profile: UserProfile | null
  language?: 'vi' | 'en'
}

export default function BillingPage({ profile, language = 'en' }: BillingPageProps) {
  const [loading, setLoading] = useState(false)

  const content = {
    vi: {
      title: 'Quản lý thanh toán',
      subtitle: 'Quản lý gói đăng ký và thông tin thanh toán của bạn',
      currentPlan: 'Gói hiện tại',
      status: 'Trạng thái',
      nextBilling: 'Thanh toán tiếp theo',
      manageBilling: 'Quản lý thanh toán',
      upgradePlan: 'Nâng cấp gói',
      cancelSubscription: 'Hủy đăng ký',
      freePlan: 'Gói miễn phí',
      active: 'Đang hoạt động',
      canceled: 'Đã hủy',
      pastDue: 'Quá hạn thanh toán',
      loading: 'Đang tải...',
      noSubscription: 'Bạn hiện đang sử dụng gói miễn phí',
      usage: {
        title: 'Sử dụng trong tháng',
        translations: 'Lượt dịch',
        documents: 'Tài liệu',
        characters: 'Ký tự',
        unlimited: 'Không giới hạn'
      }
    },
    en: {
      title: 'Billing Management',
      subtitle: 'Manage your subscription and billing information',
      currentPlan: 'Current Plan',
      status: 'Status',
      nextBilling: 'Next billing',
      manageBilling: 'Manage Billing',
      upgradePlan: 'Upgrade Plan',
      cancelSubscription: 'Cancel Subscription',
      freePlan: 'Free Plan',
      active: 'Active',
      canceled: 'Canceled',
      pastDue: 'Past Due',
      loading: 'Loading...',
      noSubscription: 'You are currently on the free plan',
      usage: {
        title: 'This Month\'s Usage',
        translations: 'Translations',
        documents: 'Documents',
        characters: 'Characters',
        unlimited: 'Unlimited'
      }
    }
  }

  const currentPlan = profile?.subscription_plan 
    ? getPlanByPriceId(profile.subscription_plan) 
    : 'free'

  const planData = currentPlan ? SUBSCRIPTION_PLANS[currentPlan] : SUBSCRIPTION_PLANS.free

  const handleManageBilling = async () => {
    if (!profile?.stripe_customer_id) return

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create billing portal')
      }

      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating billing portal:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'canceled':
        return 'text-red-600 bg-red-100'
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.h1 
          className="heading-2 text-gray-900 mb-2"
          {...motionSafe({
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6 }
          })}
        >
          {content[language].title}
        </motion.h1>
        <motion.p 
          className="body-base text-gray-600"
          {...motionSafe({
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.1 }
          })}
        >
          {content[language].subtitle}
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Current Plan */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.2 }
          })}
        >
          <h2 className="heading-3 text-gray-900 mb-6">{content[language].currentPlan}</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="heading-4 text-gray-900">{planData.name}</span>
                {planData.price > 0 && (
                  <span className="heading-4 text-gray-900">{formatPrice(planData.price)}/month</span>
                )}
              </div>
              {profile?.subscription_status && (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profile.subscription_status)}`}>
                  {(content[language] as any)[profile.subscription_status] || profile.subscription_status}
                </span>
              )}
            </div>

            {profile?.subscription_current_period_end && (
              <div>
                <span className="body-sm text-gray-600">{content[language].nextBilling}: </span>
                <span className="body-sm font-medium text-gray-900">
                  {formatDate(profile.subscription_current_period_end)}
                </span>
              </div>
            )}

            <div className="pt-4 space-y-3">
              {profile?.stripe_customer_id ? (
                <button
                  onClick={handleManageBilling}
                  disabled={loading}
                  className="w-full btn-primary"
                >
                  {loading ? content[language].loading : content[language].manageBilling}
                </button>
              ) : (
                <div className="text-center py-4">
                  <p className="body-sm text-gray-600 mb-4">{content[language].noSubscription}</p>
                  <a href="/pricing" className="btn-primary inline-block">
                    {content[language].upgradePlan}
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Usage Stats */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.3 }
          })}
        >
          <h2 className="heading-3 text-gray-900 mb-6">{content[language].usage.title}</h2>
          
          <div className="space-y-6">
            {/* Translations */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="body-base text-gray-700">{content[language].usage.translations}</span>
                <span className="body-base font-medium text-gray-900">
                  0 / {(planData.limits.translations as number) === -1 ? content[language].usage.unlimited : planData.limits.translations.toLocaleString()}
                </span>
              </div>
              {(planData.limits.translations as number) !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="body-base text-gray-700">{content[language].usage.documents}</span>
                <span className="body-base font-medium text-gray-900">
                  0 / {(planData.limits.documents as number) === -1 ? content[language].usage.unlimited : planData.limits.documents.toLocaleString()}
                </span>
              </div>
              {(planData.limits.documents as number) !== -1 && planData.limits.documents > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              )}
            </div>

            {/* Characters */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="body-base text-gray-700">{content[language].usage.characters}</span>
                <span className="body-base font-medium text-gray-900">
                  0 / {(planData.limits.characters as number) === -1 ? content[language].usage.unlimited : planData.limits.characters.toLocaleString()}
                </span>
              </div>
              {(planData.limits.characters as number) !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Plan Features */}
      <motion.div 
        className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        {...motionSafe({
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay: 0.4 }
        })}
      >
        <h2 className="heading-3 text-gray-900 mb-6">Plan Features</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {planData.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="body-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}