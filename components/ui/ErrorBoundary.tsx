'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    this.props.onError?.(error, errorInfo)
    
    // Log to analytics/monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback 
        error={this.state.error}
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
  onRetry: () => void
  onReload: () => void
  onGoHome: () => void
  variant?: 'full' | 'inline'
}

export function ErrorFallback({ 
  error, 
  onRetry, 
  onReload, 
  onGoHome,
  variant = 'full'
}: ErrorFallbackProps) {
  const isFullPage = variant === 'full'

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
      <div
        className="max-w-md w-full text-center animate-slide-up"
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
          <div 
            className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--error-background)' }}
          >
            <AlertTriangle 
              className="w-8 h-8" 
              style={{ color: 'var(--error-color)' }}
            />
          </div>

          {/* Error Title */}
          <h1 
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
          </h1>

          {/* Error Description */}
          <p 
            className="mb-6"
            style={{
              fontSize: 'var(--sys-body-large-size)',
              lineHeight: 'var(--sys-body-large-line-height)',
              fontFamily: 'var(--sys-body-large-font)',
              color: 'var(--text-secondary)'
            }}
          >
            We're sorry for the inconvenience. An unexpected error occurred while processing your request.
          </p>

          {/* Error Details (Development Mode) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mb-6 text-left">
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
                className="p-3 rounded text-xs overflow-auto max-h-32"
                style={{
                  backgroundColor: 'var(--surface-filled)',
                  border: '1px solid var(--surface-outline)',
                  fontFamily: 'monospace'
                }}
              >
                <pre style={{ color: 'var(--error-color)' }}>
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
          </div>

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
      </div>
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

export function InlineError({ error, retry, className = '' }: InlineErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div 
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
    </div>
  )
}