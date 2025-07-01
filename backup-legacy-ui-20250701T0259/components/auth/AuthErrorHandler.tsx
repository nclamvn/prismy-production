'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, X, RefreshCw, Bug } from 'lucide-react'
import { debugClientInstances } from '@/lib/supabase'

interface AuthErrorHandlerProps {
  language?: 'vi' | 'en'
}

function AuthErrorContent({ language = 'vi' }: AuthErrorHandlerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasClientIssues, setHasClientIssues] = useState(false)
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
        client_conflict: 'Phát hiện xung đột kết nối. Vui lòng làm mới trang.',
      },
      actions: {
        retry: 'Thử lại',
        close: 'Đóng',
        debug: 'Debug Client',
        refresh: 'Làm mới trang',
      },
      clientIssues: {
        title: 'Vấn đề kết nối',
        description: 'Phát hiện multiple client instances có thể gây xung đột đăng nhập.',
        suggestion: 'Thử làm mới trang hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục.',
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
        client_conflict: 'Client conflict detected. Please refresh the page.',
      },
      actions: {
        retry: 'Try Again',
        close: 'Close',
        debug: 'Debug Client',
        refresh: 'Refresh Page',
      },
      clientIssues: {
        title: 'Connection Issues',
        description: 'Multiple client instances detected that may cause authentication conflicts.',
        suggestion: 'Try refreshing the page or contact support if the issue persists.',
      },
    },
  }

  // Check for multiple client instances on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Check for multiple Supabase-related properties
      const windowProps = Object.keys(window).filter(key => 
        key.includes('supabase') || key.includes('gotrue')
      )
      
      if (windowProps.length > 1) {
        console.warn('⚠️ [AuthErrorHandler] Multiple Supabase client instances detected:', windowProps)
        setHasClientIssues(true)
      }
    }
  }, [])

  useEffect(() => {
    const authError = searchParams.get('auth_error')
    const errorDetails = searchParams.get('error_details')

    if (authError) {
      console.log('🚨 AuthErrorHandler: Detected auth error:', {
        authError,
        errorDetails,
        hasClientIssues,
      })

      const errorMessage =
        content[language].messages[
          authError as keyof (typeof content)[typeof language]['messages']
        ] || content[language].messages.default

      setError(errorMessage)
      setIsVisible(true)

      // If we detect client issues, log additional debug info
      if (hasClientIssues && process.env.NODE_ENV === 'development') {
        console.group('🔍 [AuthErrorHandler] Debug Information')
        console.log('Error Details:', errorDetails)
        console.log('Client Issues Detected:', hasClientIssues)
        debugClientInstances()
        console.groupEnd()
      }

      // Clean URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_error')
      url.searchParams.delete('error_details')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, language, hasClientIssues])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => setError(null), 300)
  }

  const handleRetry = () => {
    handleClose()
    // Trigger auth modal (could emit event or use context)
    window.dispatchEvent(new CustomEvent('openAuthModal'))
  }

  const handleDebug = () => {
    if (process.env.NODE_ENV === 'development') {
      debugClientInstances()
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!error) return null

  return (
    <>
      {isVisible && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] w-full max-w-md mx-auto animate-slide-down">
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
                
                {/* Client Issues Warning */}
                {hasClientIssues && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-start">
                      <Bug className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-yellow-800">
                          {content[language].clientIssues.title}
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          {content[language].clientIssues.description}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          {content[language].clientIssues.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {content[language].actions.retry}
                  </button>
                  
                  {hasClientIssues && (
                    <button
                      onClick={handleRefresh}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {content[language].actions.refresh}
                    </button>
                  )}
                  
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={handleDebug}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <Bug className="h-3 w-3 mr-1" />
                      {content[language].actions.debug}
                    </button>
                  )}
                  
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
        </div>
      )}
    </>
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
