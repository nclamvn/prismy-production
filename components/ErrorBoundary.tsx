'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showErrorDetails?: boolean
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
  showErrorDetails?: boolean
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  showErrorDetails = false,
}) => {
  const isAuthError =
    error?.message?.includes('auth') || error?.message?.includes('login')
  const isNetworkError =
    error?.message?.includes('fetch') || error?.message?.includes('network')

  const getErrorTitle = () => {
    if (isAuthError) return 'Lỗi xác thực'
    if (isNetworkError) return 'Lỗi kết nối'
    return 'Đã xảy ra lỗi'
  }

  const getErrorMessage = () => {
    if (isAuthError) return 'Vui lòng đăng nhập lại để tiếp tục.'
    if (isNetworkError) return 'Kiểm tra kết nối internet và thử lại.'
    return 'Một lỗi không mong muốn đã xảy ra. Vui lòng thử lại.'
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {getErrorTitle()}
          </h2>
          <p className="text-gray-600 mb-6">{getErrorMessage()}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full btn-primary btn-pill-lg flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full btn-secondary btn-pill-lg flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </button>
        </div>

        {showErrorDetails && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Chi tiết lỗi (dành cho nhà phát triển)
            </summary>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-xs text-gray-700 font-mono overflow-auto">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              <div>
                <strong>Stack:</strong>
                <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external error tracking service (Sentry, etc.)
    // if (typeof window !== 'undefined') {
    //   window.Sentry?.captureException(error, { contexts: { errorInfo } })
    // }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
          showErrorDetails={this.props.showErrorDetails}
        />
      )
    }

    return this.props.children
  }
}

// Specialized error boundaries for specific use cases
export const AuthErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    onError={error => {
      console.error('Auth Error:', error)
      // Could trigger re-authentication flow
    }}
    showErrorDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </ErrorBoundary>
)

export const WorkspaceErrorBoundary: React.FC<{
  children: React.ReactNode
}> = ({ children }) => (
  <ErrorBoundary
    onError={error => {
      console.error('Workspace Error:', error)
      // Could save workspace state before reload
    }}
    showErrorDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </ErrorBoundary>
)

export const PricingErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    onError={error => {
      console.error('Pricing Error:', error)
      // Could track pricing page errors for analytics
    }}
    showErrorDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </ErrorBoundary>
)
