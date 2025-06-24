'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { motionSafe } from '@/lib/motion'

interface SubscriptionEvent {
  id: string
  event_type: string
  metadata: Record<string, any>
  created_at: string
}

interface PaymentMetrics {
  totalRevenue: number
  activeSubscriptions: number
  churnRate: number
  averageRevenuePerUser: number
  subscriptionsByPlan: Record<string, number>
  recentEvents: SubscriptionEvent[]
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

interface PaymentAnalyticsDashboardProps {
  language?: 'vi' | 'en'
}

export default function PaymentAnalyticsDashboard({ language = 'en' }: PaymentAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const content = {
    vi: {
      title: 'Phân tích thanh toán',
      subtitle: 'Theo dõi hiệu suất đăng ký và doanh thu',
      totalRevenue: 'Tổng doanh thu',
      activeSubscriptions: 'Đăng ký đang hoạt động',
      churnRate: 'Tỷ lệ hủy',
      arpu: 'Doanh thu trung bình/người dùng',
      subscriptionsByPlan: 'Đăng ký theo gói',
      recentEvents: 'Sự kiện gần đây',
      monthlyRevenue: 'Doanh thu hàng tháng',
      loading: 'Đang tải...',
      error: 'Lỗi tải dữ liệu',
      noData: 'Không có dữ liệu',
      eventTypes: {
        subscription_created: 'Tạo đăng ký',
        subscription_updated: 'Cập nhật đăng ký',
        subscription_canceled: 'Hủy đăng ký',
        payment_succeeded: 'Thanh toán thành công',
        payment_failed: 'Thanh toán thất bại',
        trial_ending: 'Sắp hết thử nghiệm',
        invoice_upcoming: 'Hóa đơn sắp tới',
        customer_created: 'Tạo khách hàng',
        customer_updated: 'Cập nhật khách hàng'
      }
    },
    en: {
      title: 'Payment Analytics',
      subtitle: 'Monitor subscription performance and revenue',
      totalRevenue: 'Total Revenue',
      activeSubscriptions: 'Active Subscriptions',
      churnRate: 'Churn Rate',
      arpu: 'Average Revenue Per User',
      subscriptionsByPlan: 'Subscriptions by Plan',
      recentEvents: 'Recent Events',
      monthlyRevenue: 'Monthly Revenue',
      loading: 'Loading...',
      error: 'Error loading data',
      noData: 'No data available',
      eventTypes: {
        subscription_created: 'Subscription Created',
        subscription_updated: 'Subscription Updated',
        subscription_canceled: 'Subscription Canceled',
        payment_succeeded: 'Payment Succeeded',
        payment_failed: 'Payment Failed',
        trial_ending: 'Trial Ending',
        invoice_upcoming: 'Invoice Upcoming',
        customer_created: 'Customer Created',
        customer_updated: 'Customer Updated'
      }
    }
  }

  useEffect(() => {
    fetchPaymentMetrics()
  }, [])

  const fetchPaymentMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/payment-metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch payment metrics')
      }
      const data = await response.json()
      setMetrics(data.metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      subscription_created: 'bg-green-100 text-green-800',
      subscription_updated: 'bg-blue-100 text-blue-800',
      subscription_canceled: 'bg-red-100 text-red-800',
      payment_succeeded: 'bg-green-100 text-green-800',
      payment_failed: 'bg-red-100 text-red-800',
      trial_ending: 'bg-yellow-100 text-yellow-800',
      invoice_upcoming: 'bg-blue-100 text-blue-800',
      customer_created: 'bg-gray-100 text-gray-800',
      customer_updated: 'bg-gray-100 text-gray-800'
    }
    return colors[eventType] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{content[language].error}: {error}</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">{content[language].noData}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.2 }
          })}
        >
          <h3 className="body-sm font-medium text-gray-600 mb-2">{content[language].totalRevenue}</h3>
          <p className="heading-3 text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.3 }
          })}
        >
          <h3 className="body-sm font-medium text-gray-600 mb-2">{content[language].activeSubscriptions}</h3>
          <p className="heading-3 text-gray-900">{metrics.activeSubscriptions.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.4 }
          })}
        >
          <h3 className="body-sm font-medium text-gray-600 mb-2">{content[language].churnRate}</h3>
          <p className="heading-3 text-gray-900">{(metrics.churnRate * 100).toFixed(1)}%</p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.5 }
          })}
        >
          <h3 className="body-sm font-medium text-gray-600 mb-2">{content[language].arpu}</h3>
          <p className="heading-3 text-gray-900">{formatCurrency(metrics.averageRevenuePerUser)}</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Subscriptions by Plan */}
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.6 }
          })}
        >
          <h2 className="heading-3 text-gray-900 mb-6">{content[language].subscriptionsByPlan}</h2>
          <div className="space-y-4">
            {Object.entries(metrics.subscriptionsByPlan).map(([plan, count]) => (
              <div key={plan} className="flex justify-between items-center">
                <span className="body-base text-gray-700 capitalize">{plan}</span>
                <span className="body-base font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Events */}
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.7 }
          })}
        >
          <h2 className="heading-3 text-gray-900 mb-6">{content[language].recentEvents}</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {metrics.recentEvents.length === 0 ? (
              <p className="body-sm text-gray-500">{content[language].noData}</p>
            ) : (
              metrics.recentEvents.map((event) => (
                <div key={event.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEventColor(event.event_type)}`}>
                      {(content[language].eventTypes as any)[event.event_type] || event.event_type}
                    </span>
                    <span className="body-xs text-gray-500">{formatDate(event.created_at)}</span>
                  </div>
                  {event.metadata.amount && (
                    <p className="body-xs text-gray-600">
                      Amount: {formatCurrency(event.metadata.amount / 100)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Monthly Revenue Chart */}
      {metrics.monthlyRevenue.length > 0 && (
        <motion.div 
          className="mt-8 bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          {...motionSafe({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.8 }
          })}
        >
          <h2 className="heading-3 text-gray-900 mb-6">{content[language].monthlyRevenue}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {metrics.monthlyRevenue.map((item, index) => (
              <div key={index} className="text-center">
                <div className="body-xs text-gray-500 mb-1">{item.month}</div>
                <div className="body-sm font-medium text-gray-900">{formatCurrency(item.revenue)}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}