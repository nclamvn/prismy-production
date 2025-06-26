'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, CreditCard, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface InviteRedemptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: { credits: number; total: number }) => void
  userEmail?: string
}

interface RedemptionResult {
  success: boolean
  message: string
  credits?: {
    added: number
    total: number
  }
  trial?: {
    endsAt: string
  }
  error?: string
}

export default function InviteRedemptionModal({
  isOpen,
  onClose,
  onSuccess,
  userEmail
}: InviteRedemptionModalProps) {
  const { language } = useLanguage()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedemptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const content = {
    vi: {
      title: 'Nhập Mã Mời',
      subtitle: 'Sử dụng mã mời để nhận credits miễn phí và trải nghiệm Prismy',
      inputLabel: 'Mã mời',
      inputPlaceholder: 'PRISMY-XXXX-XXXX',
      inputHelp: 'Nhập mã mời 13 ký tự mà bạn đã nhận',
      redeemButton: 'Đổi Mã Mời',
      cancelButton: 'Hủy',
      loading: 'Đang xử lý...',
      success: {
        title: 'Thành công!',
        message: 'Mã mời đã được đổi thành công',
        creditsAdded: 'Credits nhận được',
        totalCredits: 'Tổng credits',
        trialInfo: 'Thời gian dùng thử kết thúc',
        continueButton: 'Tiếp tục sử dụng'
      },
      errors: {
        required: 'Vui lòng nhập mã mời',
        invalid: 'Mã mời không đúng định dạng',
        notFound: 'Mã mời không tồn tại hoặc đã hết hạn',
        alreadyUsed: 'Mã mời này đã được sử dụng',
        alreadyRedeemed: 'Bạn đã đổi mã mời rồi',
        expired: 'Mã mời đã hết hạn',
        serverError: 'Lỗi hệ thống, vui lòng thử lại'
      },
      formatInfo: {
        title: 'Định dạng mã mời',
        format: 'PRISMY-XXXX-XXXX',
        example: 'Ví dụ: PRISMY-A1B2-C3D4'
      }
    },
    en: {
      title: 'Enter Invite Code',
      subtitle: 'Use your invite code to get free credits and experience Prismy',
      inputLabel: 'Invite Code',
      inputPlaceholder: 'PRISMY-XXXX-XXXX',
      inputHelp: 'Enter the 13-character invite code you received',
      redeemButton: 'Redeem Code',
      cancelButton: 'Cancel',
      loading: 'Processing...',
      success: {
        title: 'Success!',
        message: 'Invite code redeemed successfully',
        creditsAdded: 'Credits received',
        totalCredits: 'Total credits',
        trialInfo: 'Trial expires on',
        continueButton: 'Continue using Prismy'
      },
      errors: {
        required: 'Please enter an invite code',
        invalid: 'Invalid invite code format',
        notFound: 'Invite code not found or expired',
        alreadyUsed: 'This invite code has already been used',
        alreadyRedeemed: 'You have already redeemed an invite code',
        expired: 'This invite code has expired',
        serverError: 'System error, please try again'
      },
      formatInfo: {
        title: 'Invite code format',
        format: 'PRISMY-XXXX-XXXX',
        example: 'Example: PRISMY-A1B2-C3D4'
      }
    }
  }

  const t = content[language]

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInviteCode('')
      setLoading(false)
      setResult(null)
      setError(null)
    }
  }, [isOpen])

  // Format invite code as user types
  const handleCodeChange = (value: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    // Format as PRISMY-XXXX-XXXX
    let formatted = cleaned
    if (cleaned.length > 6) {
      formatted = cleaned.slice(0, 6) + '-' + cleaned.slice(6, 10)
      if (cleaned.length > 10) {
        formatted = cleaned.slice(0, 6) + '-' + cleaned.slice(6, 10) + '-' + cleaned.slice(10, 14)
      }
    }
    
    setInviteCode(formatted)
    setError(null)
  }

  // Validate invite code format
  const isValidFormat = (code: string): boolean => {
    const pattern = /^PRISMY-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    return pattern.test(code)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteCode.trim()) {
      setError(t.errors.required)
      return
    }

    if (!isValidFormat(inviteCode)) {
      setError(t.errors.invalid)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/redeem-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: inviteCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = t.errors.serverError
        
        switch (data.error) {
          case 'Invalid invite code':
            errorMessage = t.errors.notFound
            break
          case 'Invite code already used':
            errorMessage = t.errors.alreadyUsed
            break
          case 'Invite code already redeemed':
            errorMessage = t.errors.alreadyRedeemed
            break
          case 'Invite code expired':
            errorMessage = t.errors.expired
            break
          default:
            errorMessage = data.message || t.errors.serverError
        }
        
        setError(errorMessage)
        return
      }

      // Success
      setResult(data)
      
      // Call success callback
      if (onSuccess && data.credits) {
        onSuccess({
          credits: data.credits.added,
          total: data.credits.total
        })
      }

    } catch (error) {
      console.error('Invite redemption error:', error)
      setError(t.errors.serverError)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
                  <p className="text-sm text-gray-500">{t.subtitle}</p>
                </div>
              </div>
              {!loading && (
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!result ? (
              <>
                {/* Redemption Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.inputLabel}
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder={t.inputPlaceholder}
                      className={`w-full px-4 py-3 border rounded-lg text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 transition-colors ${
                        error 
                          ? 'border-gray-400 focus:ring-gray-500' 
                          : 'border-gray-300 focus:ring-gray-500'
                      }`}
                      disabled={loading}
                      maxLength={13}
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t.inputHelp}</p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{error}</span>
                    </motion.div>
                  )}

                  {/* Format Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-800">
                      <div className="font-medium">{t.formatInfo.title}:</div>
                      <div className="font-mono">{t.formatInfo.format}</div>
                      <div className="text-gray-600 mt-1">{t.formatInfo.example}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {t.cancelButton}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !inviteCode.trim() || !isValidFormat(inviteCode)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.loading}
                        </>
                      ) : (
                        t.redeemButton
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-gray-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t.success.title}</h3>
                    <p className="text-gray-600">{t.success.message}</p>
                  </div>

                  {/* Credit Information */}
                  {result.credits && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t.success.creditsAdded}:</span>
                        <span className="text-lg font-semibold text-gray-800">
                          +{result.credits.added.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                        <span className="text-sm text-gray-700">{t.success.totalCredits}:</span>
                        <span className="text-lg font-semibold text-gray-800">
                          {result.credits.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Trial Information */}
                  {result.trial && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-sm text-gray-700">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        {t.success.trialInfo}: {formatDate(result.trial.endsAt)}
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t.success.continueButton}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}