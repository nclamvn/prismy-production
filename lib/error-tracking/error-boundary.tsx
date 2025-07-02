'use client'

/**
 * PRISMY ERROR BOUNDARY COMPONENT
 * React error boundary with Sentry integration
 * Provides graceful error handling and user feedback
 */

import React, { Component, ReactNode, ErrorInfo } from 'react'
import Link from 'next/link'
import { errorTracker } from './mock-sentry'
import { logger } from '@/lib/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  level?: 'page' | 'component' | 'critical'
  name?: string
  showReportDialog?: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const {
      onError,
      level = 'component',
      name = 'Unknown',
      showReportDialog = false,
    } = this.props

    // Log error locally
    logger.error('Error boundary caught error', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      level,
      name,
    })

    // Track error with Sentry
    const errorId = errorTracker.captureError(error, {
      level: level === 'critical' ? 'fatal' : 'error',
      tags: {
        errorBoundary: name,
        errorLevel: level,
        component: name,
      },
      extra: {
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: level,
        props: this.sanitizeProps(this.props),
      },
      fingerprint: [`error-boundary-${name}`, error.name, error.message],
    })

    // Update state with error details
    this.setState({
      errorId,
      errorInfo,
    })

    // Call custom error handler
    if (onError) {
      try {
        onError(error, errorInfo)
      } catch (handlerError) {
        logger.error('Error in custom error handler', { handlerError })
      }
    }

    // Show Sentry report dialog for critical errors
    if (
      showReportDialog &&
      level === 'critical' &&
      typeof window !== 'undefined'
    ) {
      import('@sentry/nextjs').then(({ showReportDialog }) => {
        showReportDialog({
          eventId: errorId || undefined,
        })
      })
    }

    // Auto-reset for component-level errors
    if (level === 'component') {
      this.scheduleReset()
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, children } = this.props
    const { hasError } = this.state

    // Reset error state if props changed and resetOnPropsChange is enabled
    if (hasError && prevProps.children !== children && resetOnPropsChange) {
      this.resetError()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }
  }

  private sanitizeProps(props: ErrorBoundaryProps): Record<string, any> {
    // Remove sensitive data and functions
    const { children, onError, ...sanitized } = props
    return {
      ...sanitized,
      hasChildren: !!children,
      hasOnError: !!onError,
    }
  }

  private scheduleReset() {
    // Auto-reset component errors after 5 seconds
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError()
    }, 5000)
  }

  private resetError = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      errorInfo: null,
    })
  }

  private reloadPage = () => {
    window.location.reload()
  }

  private reportProblem = () => {
    const { errorId } = this.state

    if (errorId && typeof window !== 'undefined') {
      import('@sentry/nextjs').then(({ showReportDialog }) => {
        showReportDialog({
          eventId: errorId,
        })
      })
    }
  }

  render() {
    const { hasError, error, errorId } = this.state
    const {
      children,
      fallback,
      level = 'component',
      name = 'Component',
    } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Render appropriate error UI based on level
      return this.renderErrorUI(error, errorId, level, name)
    }

    return children
  }

  private renderErrorUI(
    error: Error | null,
    errorId: string | null,
    level: string,
    name: string
  ) {
    if (level === 'critical' || level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try
                refreshing the page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Error Details (Development)
                </h3>
                <p className="text-sm text-gray-700 font-mono break-all">
                  {error.message}
                </p>
                {errorId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {errorId}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.reloadPage}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>

              {errorId && (
                <button
                  onClick={this.reportProblem}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Report Problem
                </button>
              )}

              <Link
                href="/"
                className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // Component-level error UI
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">{name} Error</h3>
            <p className="text-sm text-red-700 mt-1">
              This component encountered an error and will retry automatically.
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-2">
                <summary className="text-xs text-red-600 cursor-pointer">
                  Show Details
                </summary>
                <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
                  {error.message}
                </pre>
              </details>
            )}

            <div className="mt-3">
              <button
                onClick={this.resetError}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// Higher-order component for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Specialized error boundaries for different use cases
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary level="page" name="Page" showReportDialog={true}>
    {children}
  </ErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{
  children: ReactNode
  name?: string
}> = ({ children, name = 'Component' }) => (
  <ErrorBoundary level="component" name={name} resetOnPropsChange={true}>
    {children}
  </ErrorBoundary>
)

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary level="critical" name="Critical" showReportDialog={true}>
    {children}
  </ErrorBoundary>
)

export default ErrorBoundary
