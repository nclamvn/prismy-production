'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, RefreshCw } from 'lucide-react'

interface AuthErrorHandlerProps {
  language?: 'vi' | 'en'
}

function AuthErrorContent({ language = 'vi' }: AuthErrorHandlerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const content = {
    vi: {
      title: 'Lỗi đăng nhập',
      messages: {
        no_code: 'Không nhận được mã xác thực từ nhà cung cấp dịch vụ.',
        exchange_failed: 'Không thể xác thực tài khoản. Vui lòng thử lại.',
        invalid_session: 'Phiên đăng nhập không hợp lệ.',
        invalid_redirect: 'URL chuyển hướng không hợp lệ.',
        supabase_error: 'Lỗi từ nhà cung cấp dịch vụ xác thực.',
        unknown_error: 'Đã xảy ra lỗi không mong muốn.',
        default: 'Đăng nhập thất bại. Vui lòng thử lại.',
      },
      actions: {
        retry: 'Thử lại',
        close: 'Đóng',
      },
    },
    en: {
      title: 'Authentication Error',
      messages: {
        no_code: 'No authentication code received from provider.',
        exchange_failed: 'Failed to authenticate account. Please try again.',
        invalid_session: 'Invalid session.',
        invalid_redirect: 'Invalid redirect URL.',
        supabase_error: 'Error from authentication provider.',
        unknown_error: 'An unexpected error occurred.',
        default: 'Sign in failed. Please try again.',
      },
      actions: {
        retry: 'Try Again',
        close: 'Close',
      },
    },
  }

  useEffect(() => {
    const authError = searchParams.get('auth_error')
    const errorDetails = searchParams.get('error_details')

    if (authError) {
      console.log('🚨 AuthErrorHandler: Detected auth error:', {
        authError,
        errorDetails,
      })

      const errorMessage =
        content[language].messages[
          authError as keyof (typeof content)[typeof language]['messages']
        ] || content[language].messages.default

      setError(errorMessage)
      setIsVisible(true)

      // Clean URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_error')
      url.searchParams.delete('error_details')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, language])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => setError(null), 300)
  }

  const handleRetry = () => {
    handleClose()
    // Trigger auth modal (could emit event or use context)
    window.dispatchEvent(new CustomEvent('openAuthModal'))
  }

  if (!error) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] w-full max-w-md mx-auto"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 mx-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  {content[language].title}
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {content[language].actions.retry}
                  </button>
                  <button
                    onClick={handleClose}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    {content[language].actions.close}
                  </button>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={handleClose}
                  className="bg-red-50 rounded-md inline-flex text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AuthErrorHandler({
  language = 'vi',
}: AuthErrorHandlerProps) {
  return (
    <Suspense fallback={null}>
      <AuthErrorContent language={language} />
    </Suspense>
  )
}
