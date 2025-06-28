'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  eventId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      eventId: Math.random().toString(36).substring(2, 15)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ 
      error, 
      errorInfo,
      eventId: Math.random().toString(36).substring(2, 15)
    })
    this.props.onError?.(error, errorInfo)
    
    // Log to analytics/monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.logErrorToService(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => prevProps.resetKeys?.[index] !== key
        )
        if (hasResetKeyChanged) {
          this.resetErrorBoundary()
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userId: 'anonymous'
      }

      if (process.env.NODE_ENV === 'production') {
        // In production, send to error monitoring service
        // fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(errorData)
        // }).catch(console.error)
      }
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError)
    }
  }

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      eventId: undefined
    })
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

  handleRetry = () => {
    this.resetErrorBoundary()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        eventId={this.state.eventId}
        showDetails={this.props.showDetails}
        onRetry={this.handleRetry}
        onReload={this.handleReload}
        onGoHome={this.handleGoHome}
      />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  errorInfo?: ErrorInfo
  eventId?: string
  showDetails?: boolean
  onRetry: () => void
  onReload: () => void
  onGoHome: () => void
  variant?: 'full' | 'inline'
}

export function ErrorFallback({ 
  error, 
  errorInfo,
  eventId,
  showDetails = false,
  onRetry, 
  onReload, 
  onGoHome,
  variant = 'full'
}: ErrorFallbackProps) {
  const isFullPage = variant === 'full'

  const copyErrorDetails = () => {
    const errorDetails = {
      eventId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    }

    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
        .then(() => console.log('Error details copied to clipboard'))
        .catch(console.error)
    }
  }

  const containerClass = isFullPage 
    ? 'min-h-screen flex items-center justify-center p-4'
    : 'p-6 rounded-lg border'

  const containerStyle = isFullPage 
    ? { backgroundColor: 'var(--surface-panel)' }
    : { 
        backgroundColor: 'var(--error-background)',
        borderColor: 'var(--error-border)'
      }

  return (
    <div className={containerClass} style={containerStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center"
      >
        <div 
          className="p-8 rounded-lg"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-outline)',
            borderRadius: 'var(--mat-card-elevated-container-shape)',
            boxShadow: 'var(--elevation-level-3)'
          }}
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--error-background)' }}
          >
            <AlertTriangle 
              className="w-8 h-8" 
              style={{ color: 'var(--error-color)' }}
            />
          </motion.div>

          {/* Error Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
            style={{
              fontSize: 'var(--sys-headline-medium-size)',
              lineHeight: 'var(--sys-headline-medium-line-height)',
              fontFamily: 'var(--sys-headline-medium-font)',
              fontWeight: 'var(--sys-headline-medium-weight)',
              color: 'var(--text-primary)'
            }}
          >
            Oops! Something went wrong
          </motion.h1>

          {/* Error Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
            style={{
              fontSize: 'var(--sys-body-large-size)',
              lineHeight: 'var(--sys-body-large-line-height)',
              fontFamily: 'var(--sys-body-large-font)',
              color: 'var(--text-secondary)'
            }}
          >
            We're sorry for the inconvenience. An unexpected error occurred while processing your request.
          </motion.p>

          {/* Event ID */}
          {eventId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-3 rounded-lg text-xs font-mono"
              style={{ 
                backgroundColor: 'var(--surface-muted)',
                color: 'var(--text-secondary)'
              }}
            >
              Error ID: {eventId}
            </motion.div>
          )}

          {/* Error Details */}
          {(showDetails || process.env.NODE_ENV === 'development') && error && (
            <motion.details
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 text-left"
            >
              <summary 
                className="cursor-pointer mb-2 flex items-center gap-2"
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Bug className="w-4 h-4" />
                Error Details
              </summary>
              <div 
                className="p-3 rounded text-xs overflow-auto max-h-60"
                style={{
                  backgroundColor: 'var(--surface-filled)',
                  border: '1px solid var(--surface-outline)',
                  fontFamily: 'monospace'
                }}
              >
                <div className="mb-4">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mb-4">
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap" style={{ color: 'var(--error-color)' }}>
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div className="mb-4">
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap" style={{ color: 'var(--error-color)' }}>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                <button
                  onClick={copyErrorDetails}
                  className="mt-3 px-3 py-1 rounded text-xs"
                  style={{
                    backgroundColor: 'var(--surface-outline)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Copy Error Details
                </button>
              </div>
            </motion.details>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              variant="filled"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>

            <Button
              variant="outlined"
              onClick={onReload}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>

            {isFullPage && (
              <Button
                variant="text"
                onClick={onGoHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            )}
          </motion.div>

          {/* Support Message */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--surface-outline)' }}>
            <p 
              style={{
                fontSize: 'var(--sys-body-small-size)',
                color: 'var(--text-disabled)'
              }}
            >
              If this problem persists, please{' '}
              <a 
                href="/support" 
                className="underline hover:no-underline"
                style={{ color: 'var(--notebooklm-primary)' }}
              >
                contact support
              </a>
              {' '}or report the issue on our{' '}
              <a 
                href="https://github.com/anthropics/claude-code/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline"
                style={{ color: 'var(--notebooklm-primary)' }}
              >
                GitHub repository
              </a>
              .
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Hook for programmatic error reporting
export function useErrorReporting() {
  const reportError = (error: Error, context?: string) => {
    console.error('Manual error report:', { error, context })
    
    // Here you would integrate with your error reporting service
    // e.g., Sentry, LogRocket, Bugsnag, etc.
    
    // Example for Sentry:
    // Sentry.captureException(error, { 
    //   tags: { context } 
    // })
  }

  return { reportError }
}

// Inline error display component
interface InlineErrorProps {
  error: string | Error
  retry?: () => void
  className?: string
}

// Lightweight error boundary for specific components
export const SimpleErrorBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}> = ({ children, fallback, onError }) => {
  return (
    <ErrorBoundary
      fallback={fallback || (
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: 'var(--surface-error-subtle)',
            color: 'var(--text-error)'
          }}
        >
          <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm">Component failed to load</p>
        </div>
      )}
      onError={(error) => onError?.(error)}
    >
      {children}
    </ErrorBoundary>
  )
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component ref={ref} {...props} />
      </ErrorBoundary>
    )
  })

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for triggering error boundary from within components
export const useErrorHandler = () => {
  return React.useCallback((error: Error) => {
    // Throw error to trigger error boundary
    throw error
  }, [])
}

// Async error boundary for handling promise rejections
export const AsyncErrorBoundary: React.FC<{
  children: ReactNode
  onError?: (error: Error) => void
}> = ({ children, onError }) => {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      if (onError) {
        onError(new Error(event.reason))
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection)
      return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [onError])

  return <>{children}</>
}

export function InlineError({ error, retry, className = '' }: InlineErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg flex items-start gap-3 ${className}`}
      style={{
        backgroundColor: 'var(--error-background)',
        border: '1px solid var(--error-border)'
      }}
      role="alert"
    >
      <AlertTriangle 
        className="w-5 h-5 flex-shrink-0 mt-0.5" 
        style={{ color: 'var(--error-color)' }}
      />
      
      <div className="flex-1 min-w-0">
        <p 
          style={{
            fontSize: 'var(--sys-body-medium-size)',
            color: 'var(--error-color)',
            marginBottom: retry ? '8px' : '0'
          }}
        >
          {errorMessage}
        </p>
        
        {retry && (
          <Button
            variant="text"
            size="sm"
            onClick={retry}
            className="flex items-center gap-1 p-0 h-auto"
            style={{ color: 'var(--error-color)' }}
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </Button>
        )}
      </div>
    </motion.div>
  )
}