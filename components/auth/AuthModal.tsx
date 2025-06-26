'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ModalPortal from './ModalPortal'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  language?: 'vi' | 'en'
  redirectTo?: string
}

// Enhanced auth states for better UX
type AuthLoadingState = 'idle' | 'redirecting' | 'authenticating' | 'completing'
type AuthErrorType = 'network' | 'validation' | 'oauth' | 'server' | 'unknown'

interface AuthError {
  type: AuthErrorType
  message: string
  details?: string
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
  language = 'en',
  redirectTo,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loadingState, setLoadingState] = useState<AuthLoadingState>('idle')
  const [authError, setAuthError] = useState<AuthError | null>(null)

  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth()

  // Legacy loading state for backward compatibility
  const loading = loadingState !== 'idle'
  const error = authError?.message || ''

  const content = {
    vi: {
      signin: {
        title: 'Chào mừng trở lại',
        subtitle: 'Đăng nhập vào tài khoản Prismy của bạn',
        email: 'Email',
        emailPlaceholder: 'Nhập email của bạn',
        password: 'Mật khẩu',
        passwordPlaceholder: 'Nhập mật khẩu của bạn',
        submit: 'Đăng nhập',
        submitting: 'Đang đăng nhập...',
        noAccount: 'Chưa có tài khoản?',
        switchToSignup: 'Đăng ký',
      },
      signup: {
        title: 'Tạo tài khoản',
        subtitle: 'Tham gia Prismy và bắt đầu dịch thuật',
        fullName: 'Họ và tên',
        fullNamePlaceholder: 'Nhập họ và tên của bạn',
        email: 'Email',
        emailPlaceholder: 'Nhập email của bạn',
        password: 'Mật khẩu',
        passwordPlaceholder: 'Nhập mật khẩu của bạn',
        submit: 'Tạo tài khoản',
        submitting: 'Đang tạo tài khoản...',
        hasAccount: 'Đã có tài khoản?',
        switchToSignin: 'Đăng nhập',
      },
      error: 'Đã xảy ra lỗi không mong muốn',
      close: 'Đóng modal (ESC)',
      social: {
        orContinueWith: 'Hoặc tiếp tục với',
        google: 'Tiếp tục với Google',
        apple: 'Tiếp tục với Apple',
      },
      loading: {
        redirecting: 'Đang chuyển hướng...',
        authenticating: 'Đang xác thực...',
        completing: 'Đang hoàn tất...',
      },
      errors: {
        network: 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.',
        oauth: 'Đăng nhập không thành công. Vui lòng thử lại.',
        server: 'Lỗi máy chủ. Vui lòng thử lại sau.',
        validation: 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.',
        unknown: 'Lỗi không xác định. Vui lòng thử lại.',
        retry: 'Thử lại',
        details: 'Chi tiết lỗi',
      },
    },
    en: {
      signin: {
        title: 'Welcome back',
        subtitle: 'Sign in to your Prismy account',
        email: 'Email',
        emailPlaceholder: 'Enter your email',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        submit: 'Sign In',
        submitting: 'Signing in...',
        noAccount: "Don't have an account?",
        switchToSignup: 'Sign up',
      },
      signup: {
        title: 'Create account',
        subtitle: 'Join Prismy and start translating',
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter your full name',
        email: 'Email',
        emailPlaceholder: 'Enter your email',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        submit: 'Create Account',
        submitting: 'Creating account...',
        hasAccount: 'Already have an account?',
        switchToSignin: 'Sign in',
      },
      error: 'An unexpected error occurred',
      close: 'Close modal (ESC)',
      social: {
        orContinueWith: 'Or continue with',
        google: 'Continue with Google',
        apple: 'Continue with Apple',
      },
      loading: {
        redirecting: 'Redirecting...',
        authenticating: 'Authenticating...',
        completing: 'Completing...',
      },
      errors: {
        network: 'Network error. Please check your connection and try again.',
        oauth: 'Sign in failed. Please try again.',
        server: 'Server error. Please try again later.',
        validation: 'Invalid information. Please check and try again.',
        unknown: 'Unknown error. Please try again.',
        retry: 'Retry',
        details: 'Error details',
      },
    },
  }

  const handleClose = useCallback(() => {
    // Reset form when closing
    setEmail('')
    setPassword('')
    setFullName('')
    setAuthError(null)
    setLoadingState('idle')
    onClose()
  }, [onClose])

  // Update all onClose calls to use handleClose
  const handleBackdropClick = useCallback(() => {
    if (!loading) {
      handleClose()
    }
  }, [loading, handleClose])

  const handleEscapeClose = useCallback(() => {
    if (!loading) {
      handleClose()
    }
  }, [loading, handleClose])

  // ESC key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleEscapeClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscapeClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingState('authenticating')
    setAuthError(null)

    try {
      let result
      if (mode === 'signin') {
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password, fullName)
      }

      if (result.error) {
        setAuthError({
          type: 'validation',
          message: result.error.message,
        })
        setLoadingState('idle')
      } else {
        setLoadingState('completing')
        handleClose()
        // Redirect to intended destination after successful authentication
        if (redirectTo) {
          window.location.href = redirectTo
        }
      }
    } catch (err: any) {
      setAuthError({
        type: 'unknown',
        message: content[language].error,
        details: err.message,
      })
      setLoadingState('idle')
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setAuthError(null)
  }

  const handleGoogleSignIn = async () => {
    setLoadingState('redirecting')
    setAuthError(null)

    try {
      // Set authenticating state
      setLoadingState('authenticating')

      // Pass redirectTo to Google OAuth so it handles the redirect automatically
      const result = await signInWithGoogle(redirectTo)

      if (result.error) {
        setAuthError({
          type: 'oauth',
          message: content[language].error,
          details: result.error.message,
        })
        setLoadingState('idle')
      } else {
        setLoadingState('completing')
        // OAuth will redirect automatically, modal will close when page redirects
        // If redirect doesn't happen in 10s, show error
        setTimeout(() => {
          if (loadingState === 'completing') {
            setAuthError({
              type: 'network',
              message:
                language === 'vi'
                  ? 'Đăng nhập thất bại. Vui lòng thử lại.'
                  : 'Sign in failed. Please try again.',
              details: 'OAuth redirect timeout',
            })
            setLoadingState('idle')
          }
        }, 10000)
      }
    } catch (err: any) {
      setAuthError({
        type: 'unknown',
        message: content[language].error,
        details: err.message,
      })
      setLoadingState('idle')
    }
  }

  const handleAppleSignIn = async () => {
    setLoadingState('redirecting')
    setAuthError(null)

    try {
      setLoadingState('authenticating')

      const result = await signInWithApple(redirectTo)

      if (result.error) {
        setAuthError({
          type: 'oauth',
          message: content[language].error,
          details: result.error.message,
        })
        setLoadingState('idle')
      } else {
        setLoadingState('completing')
        // OAuth timeout handling
        setTimeout(() => {
          if (loadingState === 'completing') {
            setAuthError({
              type: 'network',
              message:
                language === 'vi'
                  ? 'Đăng nhập thất bại. Vui lòng thử lại.'
                  : 'Sign in failed. Please try again.',
              details: 'OAuth redirect timeout',
            })
            setLoadingState('idle')
          }
        }, 10000)
      }
    } catch (err: any) {
      setAuthError({
        type: 'unknown',
        message: content[language].error,
        details: err.message,
      })
      setLoadingState('idle')
    }
  }

  return (
    <ModalPortal>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm cursor-pointer animate-fade-in"
            onClick={handleBackdropClick}
            aria-label="Close modal"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto pointer-events-none">
            {/* Modal */}
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto pointer-events-auto animate-modal-spring"
              onClick={e => e.stopPropagation()}
            >
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h2 className="heading-3 text-gray-900 mb-2">
                      {content[language][mode].title}
                    </h2>
                    <p className="body-base text-gray-600">
                      {content[language][mode].subtitle}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'signup' && (
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block body-sm font-medium text-gray-700 mb-2"
                        >
                          {content[language].signup.fullName}
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          className="input-base"
                          placeholder={
                            content[language].signup.fullNamePlaceholder
                          }
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="email"
                        className="block body-sm font-medium text-gray-700 mb-2"
                      >
                        {content[language][mode].email}
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="input-base"
                        placeholder={content[language][mode].emailPlaceholder}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block body-sm font-medium text-gray-700 mb-2"
                      >
                        {content[language][mode].password}
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input-base"
                        placeholder={
                          content[language][mode].passwordPlaceholder
                        }
                        minLength={6}
                      />
                    </div>

                    {/* Enhanced Error Display */}
                    {authError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-red-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="body-sm font-medium text-red-800">
                              {content[language].errors[authError.type] ||
                                content[language].error}
                            </h4>
                            {authError.details && (
                              <details className="mt-2">
                                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                                  {content[language].errors.details}
                                </summary>
                                <p className="text-xs text-red-600 mt-1 font-mono">
                                  {authError.details}
                                </p>
                              </details>
                            )}
                          </div>
                          <button
                            onClick={() => setAuthError(null)}
                            className="flex-shrink-0 p-1 text-red-400 hover:text-red-600"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary btn-auth-modal w-full"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2">⟳</span>
                          {content[language][mode].submitting}
                        </span>
                      ) : (
                        content[language][mode].submit
                      )}
                    </button>
                  </form>

                  {/* Social Login */}
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          {content[language].social.orContinueWith}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading &&
                        (loadingState === 'redirecting' ||
                          loadingState === 'authenticating' ||
                          loadingState === 'completing') ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            <span className="text-xs">
                              {content[language].loading[loadingState]}
                            </span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            Google
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleAppleSignIn}
                        disabled={loading}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading &&
                        (loadingState === 'redirecting' ||
                          loadingState === 'authenticating' ||
                          loadingState === 'completing') ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            <span className="text-xs">
                              {content[language].loading[loadingState]}
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                            Apple
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Toggle Mode */}
                  <div className="text-center mt-6">
                    <p className="body-sm text-gray-600">
                      {mode === 'signin'
                        ? content[language].signin.noAccount
                        : content[language].signup.hasAccount}{' '}
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-gray-900 font-medium hover:underline focus:outline-none focus:underline"
                      >
                        {mode === 'signin'
                          ? content[language].signin.switchToSignup
                          : content[language].signup.switchToSignin}
                      </button>
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full 
                         transition-colors duration-200 z-10"
                  aria-label={content[language].close}
                  title={content[language].close}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
            </div>
          </div>
        </>
      )}
    </ModalPortal>
  )
}
