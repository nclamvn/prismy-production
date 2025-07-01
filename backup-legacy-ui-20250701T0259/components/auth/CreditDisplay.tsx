'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  AlertTriangle,
  Plus,
  Loader2,
  Clock,
  TrendingDown,
  Gift,
  Info,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'

interface CreditDisplayProps {
  userId?: string
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'badge' | 'card' | 'inline'
  onInviteClick?: () => void
  onTopUpClick?: () => void
  className?: string
}

interface CreditData {
  credits: {
    current: number
    total_earned: number
    total_spent: number
    trial_credits: number
    purchased_credits: number
    estimated_days_remaining?: number
  }
  status: {
    needsInvite: boolean
    hasActiveCredits: boolean
    trialExpired: boolean
    accountType: 'none' | 'trial' | 'trial_expired' | 'paid'
  }
  usage: {
    today: number
    week: number
    month: number
  }
}

export default function CreditDisplay({
  userId,
  showDetails = false,
  size = 'md',
  variant = 'badge',
  onInviteClick,
  onTopUpClick,
  className = '',
}: CreditDisplayProps) {
  const { language } = useSSRSafeLanguage()
  const [creditData, setCreditData] = useState<CreditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const content = {
    vi: {
      credits: 'Credits',
      noCredits: 'Không có credits',
      needsInvite: 'Cần mã mời',
      trialExpired: 'Hết thời gian dùng thử',
      loading: 'Đang tải...',
      error: 'Lỗi tải dữ liệu',
      estimatedDays: 'ngày còn lại',
      today: 'Hôm nay',
      thisWeek: 'Tuần này',
      thisMonth: 'Tháng này',
      earned: 'Đã nhận',
      spent: 'Đã dùng',
      trial: 'Dùng thử',
      purchased: 'Đã mua',
      getInvite: 'Nhận mã mời',
      buyCredits: 'Mua credits',
      refresh: 'Làm mới',
      accountTypes: {
        none: 'Chưa kích hoạt',
        trial: 'Dùng thử',
        trial_expired: 'Hết hạn dùng thử',
        paid: 'Tài khoản trả phí',
      },
      tooltips: {
        badge: 'Số credits hiện có của bạn',
        needsInvite: 'Bạn cần mã mời để bắt đầu sử dụng',
        lowCredits: 'Credits sắp hết, hãy nạp thêm',
        trialExpired: 'Thời gian dùng thử đã hết, hãy mua credits',
      },
    },
    en: {
      credits: 'Credits',
      noCredits: 'No credits',
      needsInvite: 'Needs invite',
      trialExpired: 'Trial expired',
      loading: 'Loading...',
      error: 'Error loading data',
      estimatedDays: 'days remaining',
      today: 'Today',
      thisWeek: 'This week',
      thisMonth: 'This month',
      earned: 'Earned',
      spent: 'Spent',
      trial: 'Trial',
      purchased: 'Purchased',
      getInvite: 'Get invite',
      buyCredits: 'Buy credits',
      refresh: 'Refresh',
      accountTypes: {
        none: 'Not activated',
        trial: 'Trial',
        trial_expired: 'Trial expired',
        paid: 'Paid account',
      },
      tooltips: {
        badge: 'Your current credit balance',
        needsInvite: 'You need an invite code to get started',
        lowCredits: 'Running low on credits, consider topping up',
        trialExpired: 'Your trial has expired, please purchase credits',
      },
    },
  }

  const t = content[language]

  // Fetch credit data
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/credits/balance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch credits')
        }

        setCreditData(data)
      } catch (error) {
        console.error('Credit fetch error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()

    // Refresh every 5 minutes
    const interval = setInterval(fetchCredits, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [userId])

  // Get display color based on credit status
  const getStatusColor = (): string => {
    if (loading || error) return 'gray'
    if (!creditData || !creditData.status || !creditData.credits) return 'gray'

    if (creditData.status.needsInvite) return 'yellow'
    if (creditData.status.trialExpired) return 'red'

    const credits = creditData.credits.current || 0
    if (credits === 0) return 'red'
    if (credits < 10) return 'yellow'
    if (credits < 50) return 'orange'
    return 'green'
  }

  const statusColor = getStatusColor()

  // Size configurations
  const sizeConfig = {
    sm: {
      text: 'text-xs',
      padding: 'px-2 py-1',
      icon: 'w-3 h-3',
      badge: 'h-6',
    },
    md: {
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      icon: 'w-4 h-4',
      badge: 'h-8',
    },
    lg: {
      text: 'text-base',
      padding: 'px-4 py-2',
      icon: 'w-5 h-5',
      badge: 'h-10',
    },
  }

  const config = sizeConfig[size]

  // Color configurations
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    green: 'bg-green-100 text-green-800 border-green-200',
  }

  // Render loading state
  if (loading) {
    return (
      <div
        className={`inline-flex items-center ${config.padding} ${config.badge} bg-gray-100 rounded-full border ${className}`}
      >
        <Loader2 className={`${config.icon} animate-spin text-gray-500 mr-2`} />
        <span className={`${config.text} text-gray-600`}>{t.loading}</span>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div
        className={`inline-flex items-center ${config.padding} ${config.badge} bg-red-100 rounded-full border border-red-200 ${className}`}
      >
        <AlertTriangle className={`${config.icon} text-red-500 mr-2`} />
        <span className={`${config.text} text-red-700`}>{t.error}</span>
      </div>
    )
  }

  // No data
  if (!creditData) {
    return null
  }

  // Get display text
  const getDisplayText = (): string => {
    if (!creditData || !creditData.status || !creditData.credits) {
      return t.error || 'Error'
    }

    if (creditData.status.needsInvite) {
      return t.needsInvite
    }
    if (creditData.status.trialExpired) {
      return t.trialExpired
    }

    const currentCredits = creditData.credits.current || 0
    if (currentCredits === 0) {
      return t.noCredits
    }
    return currentCredits.toLocaleString()
  }

  // Get tooltip text
  const getTooltipText = (): string => {
    if (
      !creditData ||
      !creditData.status ||
      !creditData.credits ||
      !t.tooltips
    ) {
      return 'Credit information'
    }

    if (creditData.status.needsInvite)
      return t.tooltips.needsInvite || 'Needs invite'
    if (creditData.status.trialExpired)
      return t.tooltips.trialExpired || 'Trial expired'

    const currentCredits = creditData.credits.current || 0
    if (currentCredits < 10) return t.tooltips.lowCredits || 'Low credits'
    return t.tooltips.badge || 'Current credit balance'
  }

  // Handle click actions
  const handleClick = () => {
    if (!creditData || !creditData.status) return

    if (creditData.status.needsInvite && onInviteClick) {
      onInviteClick()
    } else if (onTopUpClick) {
      onTopUpClick()
    }
  }

  // Badge variant (compact)
  if (variant === 'badge') {
    return (
      <div className="relative">
        <div
          className={`inline-flex items-center ${config.padding} ${config.badge} rounded-full border cursor-pointer transition-all hover:scale-105 active:scale-95 ${colorClasses[statusColor]} ${className}`}
          onClick={handleClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <CreditCard className={`${config.icon} mr-2`} />
          <span className={`${config.text} font-medium`}>
            {getDisplayText()}
          </span>
          {creditData?.status?.needsInvite && (
            <Gift className={`${config.icon} ml-1`} />
          )}
          {(creditData?.credits?.current || 0) < 10 &&
            (creditData?.credits?.current || 0) > 0 && (
              <AlertTriangle className={`${config.icon} ml-1`} />
            )}
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 animate-tooltip-fade-in">
            {getTooltipText()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    )
  }

  // Card variant (detailed)
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
            <span className="font-medium text-gray-900">{t.credits}</span>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs ${colorClasses[statusColor]}`}
          >
            {(t.accountTypes &&
              creditData?.status?.accountType &&
              t.accountTypes[creditData.status.accountType]) ||
              'Unknown'}
          </div>
        </div>

        {/* Current Balance */}
        <div className="text-2xl font-bold text-gray-900 mb-2">
          {(creditData?.credits?.current || 0).toLocaleString()}
          <span className="text-sm font-normal text-gray-500 ml-2">
            {t.credits?.toLowerCase() || 'credits'}
          </span>
        </div>

        {/* Estimated Days */}
        {creditData?.credits?.estimated_days_remaining && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Clock className="w-4 h-4 mr-1" />
            {creditData.credits.estimated_days_remaining}{' '}
            {t.estimatedDays || 'days remaining'}
          </div>
        )}

        {/* Usage Stats */}
        {showDetails && creditData?.usage && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t.today || 'Today'}:</span>
              <span className="font-medium">{creditData.usage.today || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t.thisWeek || 'This week'}:
              </span>
              <span className="font-medium">{creditData.usage.week || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t.thisMonth || 'This month'}:
              </span>
              <span className="font-medium">{creditData.usage.month || 0}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          {creditData?.status?.needsInvite ? (
            <button
              onClick={onInviteClick}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Gift className="w-4 h-4 mr-2" />
              {t.getInvite || 'Get invite'}
            </button>
          ) : (
            <button
              onClick={onTopUpClick}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.buyCredits || 'Buy credits'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Inline variant (minimal)
  return (
    <span
      className={`inline-flex items-center ${config.text} text-gray-700 ${className}`}
    >
      <CreditCard className={`${config.icon} mr-1`} />
      {getDisplayText()}
    </span>
  )
}
