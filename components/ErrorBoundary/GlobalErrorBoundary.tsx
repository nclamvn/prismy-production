'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging with context
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      retryCount: this.retryCount,
    }

    // Log to console with enhanced details
    console.group(`🚨 [Global Error Boundary] Error ${this.state.errorId}`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Full Context:', errorDetails)
    console.groupEnd()

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send to monitoring service (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error, {
        contexts: {
          errorBoundary: {
            componentStack: errorInfo.componentStack,
            errorId: this.state.errorId,
            retryCount: this.retryCount,
          },
        },
      })
    }

    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.retryCount++
    if (this.retryCount <= this.maxRetries) {
      console.log(
        `🔄 [Error Boundary] Retry attempt ${this.retryCount}/${this.maxRetries}`
      )
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      })
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI with recovery options
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Don't worry, our team has been
              notified.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-gray-100 rounded text-left text-xs">
                <div className="font-mono text-red-600">
                  <strong>Error ID:</strong> {this.state.errorId}
                </div>
                <div className="font-mono text-red-600 mt-1">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-700">
                      Stack Trace
                    </summary>
                    <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Recovery Actions */}
            <div className="space-y-3">
              {this.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Homepage
              </button>
            </div>

            {/* Support Information */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help? Contact support with error ID:
                <span className="font-mono text-gray-700 ml-1">
                  {this.state.errorId}
                </span>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
