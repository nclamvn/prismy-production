'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { motionSafe } from '@/lib/motion'
import { getPaymentMethodName, formatPrice } from '@/lib/payments/payment-service'
import type { PaymentMethod } from '@/lib/payments/payment-service'

interface PaymentResultProps {
  success: boolean
  paymentMethod: PaymentMethod
  transaction: any
  language?: 'vi' | 'en'
}

export default function PaymentResult({ 
  success, 
  paymentMethod, 
  transaction, 
  language = 'vi' 
}: PaymentResultProps) {
  const router = useRouter()

  const content = {
    vi: {
      successTitle: 'Thanh toán thành công!',
      successMessage: 'Cảm ơn bạn đã đăng ký dịch vụ Prismy. Tài khoản của bạn đã được nâng cấp.',
      failureTitle: 'Thanh toán thất bại',
      failureMessage: 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.',
      orderInfo: 'Thông tin đơn hàng',
      orderId: 'Mã đơn hàng',
      paymentMethod: 'Phương thức thanh toán',
      amount: 'Số tiền',
      status: 'Trạng thái',
      goToDashboard: 'Đi đến Dashboard',
      tryAgain: 'Thử lại',
      backToHome: 'Về trang chủ',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      failed: 'Thất bại'
    },
    en: {
      successTitle: 'Payment Successful!',
      successMessage: 'Thank you for subscribing to Prismy. Your account has been upgraded.',
      failureTitle: 'Payment Failed',
      failureMessage: 'An error occurred during payment processing. Please try again.',
      orderInfo: 'Order Information',
      orderId: 'Order ID',
      paymentMethod: 'Payment Method',
      amount: 'Amount',
      status: 'Status',
      goToDashboard: 'Go to Dashboard',
      tryAgain: 'Try Again',
      backToHome: 'Back to Home',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return content[language].completed
      case 'failed':
        return content[language].failed
      case 'pending':
        return content[language].processing
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center"
          {...motionSafe({
            initial: { opacity: 0, y: 30, scale: 0.9 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: { duration: 0.6, type: "spring", bounce: 0.1 }
          })}
        >
          {/* Status Icon */}
          <motion.div
            className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
              success ? 'bg-green-100' : 'bg-red-100'
            }`}
            {...motionSafe({
              initial: { scale: 0 },
              animate: { scale: 1 },
              transition: { delay: 0.2, type: "spring", bounce: 0.3 }
            })}
          >
            {success ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </motion.div>

          {/* Title and Message */}
          <motion.h1
            className={`heading-3 mb-4 ${success ? 'text-green-600' : 'text-red-600'}`}
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.3 }
            })}
          >
            {success ? content[language].successTitle : content[language].failureTitle}
          </motion.h1>

          <motion.p
            className="body-base text-gray-600 mb-8"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.4 }
            })}
          >
            {success ? content[language].successMessage : content[language].failureMessage}
          </motion.p>

          {/* Transaction Details */}
          {transaction && (
            <motion.div
              className="bg-gray-50 rounded-xl p-6 mb-8 text-left"
              {...motionSafe({
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.5 }
              })}
            >
              <h3 className="heading-4 text-gray-900 mb-4">{content[language].orderInfo}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="body-sm text-gray-600">{content[language].orderId}:</span>
                  <span className="body-sm font-medium text-gray-900 font-mono">{transaction.order_id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="body-sm text-gray-600">{content[language].paymentMethod}:</span>
                  <span className="body-sm font-medium text-gray-900">
                    {getPaymentMethodName(paymentMethod, language)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="body-sm text-gray-600">{content[language].amount}:</span>
                  <span className="body-sm font-medium text-gray-900">
                    {formatPrice(transaction.amount, transaction.currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="body-sm text-gray-600">{content[language].status}:</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            className="space-y-3"
            {...motionSafe({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.6 }
            })}
          >
            {success ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full btn-primary"
              >
                {content[language].goToDashboard}
              </button>
            ) : (
              <button
                onClick={() => router.push('/pricing')}
                className="w-full btn-primary"
              >
                {content[language].tryAgain}
              </button>
            )}
            
            <button
              onClick={() => router.push('/')}
              className="w-full btn-secondary"
            >
              {content[language].backToHome}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}