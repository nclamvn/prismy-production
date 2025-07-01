'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import { Zap, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface CreditBalance {
  balance: number
  isLoading: boolean
}

export default function CreditHUD() {
  const { user } = useAuth()
  const toast = useToast()
  const [credits, setCredits] = useState<CreditBalance>({
    balance: 0,
    isLoading: true,
  })
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!user) {
      setCredits({ balance: 0, isLoading: false })
      return
    }

    // Initial fetch
    fetchCreditBalance()

    // Setup polling instead of realtime (disabled for performance)
    const interval = setInterval(() => {
      fetchCreditBalance()
    }, 30000) // Poll every 30 seconds

    return () => {
      clearInterval(interval)
    }
  }, [user])

  const fetchCreditBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance', {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch credits')

      const data = await response.json()
      setCredits({ balance: data.balance, isLoading: false })

      // Show warning if credits are low
      if (data.balance > 0 && data.balance < 1000) {
        setShowWarning(true)
      } else {
        setShowWarning(false)
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error)
      setCredits({ balance: 0, isLoading: false })
    }
  }

  if (!user || credits.isLoading) return null

  const formatCredits = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  return (
    <div className="relative">
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200 cursor-pointer
          ${
            showWarning
              ? 'bg-orange-100 text-orange-800 border border-orange-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }
          hover:scale-105
        `}
        onClick={() => {
          if (showWarning) {
            toast.info('Upgrade to continue using premium features!', {
              action: {
                label: 'Upgrade',
                onClick: () => (window.location.href = '/pricing'),
              },
            })
          }
        }}
      >
        <Zap
          className={`w-4 h-4 ${showWarning ? 'text-orange-600' : 'text-blue-600'}`}
        />
        <span>{formatCredits(credits.balance)}</span>
        {showWarning && <AlertCircle className="w-4 h-4 text-orange-600" />}
      </div>

      {showWarning && (
        <div className="absolute top-full mt-2 right-0 p-3 bg-white rounded-lg shadow-lg border border-gray-200 w-64 z-50">
          <p className="text-sm text-gray-700">
            Credit của bạn sắp hết! Nâng cấp để tiếp tục sử dụng đầy đủ tính
            năng.
          </p>
          <button
            onClick={() => (window.location.href = '/pricing')}
            className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Nâng cấp ngay
          </button>
        </div>
      )}
    </div>
  )
}
