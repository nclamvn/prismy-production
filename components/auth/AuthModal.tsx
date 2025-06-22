'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { motionSafe } from '@/lib/motion'
import ModalPortal from './ModalPortal'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  language?: 'vi' | 'en'
  redirectTo?: string
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth()

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
    },
  }

  const handleClose = useCallback(() => {
    // Reset form when closing
    setEmail('')
    setPassword('')
    setFullName('')
    setError('')
    setLoading(false)
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
    setLoading(true)
    setError('')

    try {
      let result
      if (mode === 'signin') {
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password, fullName)
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        handleClose()
        // Redirect to intended destination after successful authentication
        if (redirectTo) {
          window.location.href = redirectTo
        }
      }
    } catch (err) {
      setError(content[language].error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setError(result.error.message)
      } else {
        handleClose()
        // Redirect to intended destination after successful authentication
        if (redirectTo) {
          window.location.href = redirectTo
        }
      }
    } catch (err) {
      setError(content[language].error)
    } finally {
      setLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await signInWithApple()
      if (result.error) {
        setError(result.error.message)
      } else {
        handleClose()
        // Redirect to intended destination after successful authentication
        if (redirectTo) {
          window.location.href = redirectTo
        }
      }
    } catch (err) {
      setError(content[language].error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleBackdropClick}
              aria-label="Close modal"
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto pointer-events-none">
              {/* Modal */}
              <motion.div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto pointer-events-auto"
                variants={motionSafe({
                  hidden: { opacity: 0, scale: 0.9, y: 20 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      type: 'spring',
                      duration: 0.3,
                      bounce: 0.1,
                    },
                  },
                })}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  y: 10,
                  transition: { duration: 0.2 },
                }}
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

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="body-sm text-red-600">{error}</p>
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
                      </button>

                      <button
                        type="button"
                        onClick={handleAppleSignIn}
                        disabled={loading}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        Apple
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
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ModalPortal>
  )
}
