'use client'

/**
 * PRISMY ERROR REPORT DIALOG
 * User-friendly error reporting interface
 * Allows users to provide additional context for errors
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { errorTracker } from '@/lib/error-tracking/sentry-config'
import { logger } from '@/lib/logger'

interface ErrorReportDialogProps {
  isOpen: boolean
  onClose: () => void
  error?: Error
  errorId?: string
  context?: Record<string, any>
}

interface ErrorReport {
  description: string
  expectedBehavior: string
  actualBehavior: string
  stepsToReproduce: string
  browserInfo: string
  userAgent: string
  url: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'bug' | 'performance' | 'ui' | 'feature' | 'other'
}

export default function ErrorReportDialog({
  isOpen,
  onClose,
  error,
  errorId,
  context
}: ErrorReportDialogProps) {
  const [report, setReport] = useState<ErrorReport>({
    description: '',
    expectedBehavior: '',
    actualBehavior: error?.message || '',
    stepsToReproduce: '',
    browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    severity: 'medium',
    category: 'bug'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true)

  const handleInputChange = (field: keyof ErrorReport, value: string) => {
    setReport(prev => ({ ...prev, [field]: value }))
  }

  const getSystemInfo = () => {
    if (typeof window === 'undefined') return {}

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!report.description.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const systemInfo = includeSystemInfo ? getSystemInfo() : {}
      
      // Create comprehensive error report
      const errorReport = {
        type: 'user_error_report',
        originalErrorId: errorId,
        report,
        systemInfo,
        originalError: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : null,
        context
      }

      // Send to error tracking
      const reportId = errorTracker.captureMessage(
        `User Error Report: ${report.description}`,
        'info',
        {
          tags: {
            type: 'user_report',
            severity: report.severity,
            category: report.category,
            originalErrorId: errorId
          },
          extra: errorReport
        }
      )

      // Log locally
      logger.info('User error report submitted', {
        reportId,
        errorId,
        severity: report.severity,
        category: report.category
      })

      setSubmitted(true)
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
        setSubmitted(false)
        setReport({
          description: '',
          expectedBehavior: '',
          actualBehavior: '',
          stepsToReproduce: '',
          browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: new Date().toISOString(),
          severity: 'medium',
          category: 'bug'
        })
      }, 2000)

    } catch (error) {
      logger.error('Failed to submit error report', { error })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {submitted ? (
              // Success State
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Report Submitted Successfully
                </h3>
                <p className="text-gray-600">
                  Thank you for helping us improve Prismy. Your report has been sent to our development team.
                </p>
              </div>
            ) : (
              // Report Form
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Report an Issue
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Help us fix this problem by providing additional details
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Error Info */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Error Details</h4>
                      <p className="text-sm text-red-700 font-mono break-all">
                        {error.message}
                      </p>
                      {errorId && (
                        <p className="text-xs text-red-600 mt-2">
                          Error ID: {errorId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Severity and Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity
                      </label>
                      <select
                        value={report.severity}
                        onChange={(e) => handleInputChange('severity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low - Minor inconvenience</option>
                        <option value="medium">Medium - Affects functionality</option>
                        <option value="high">High - Major functionality broken</option>
                        <option value="critical">Critical - App unusable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={report.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="bug">Bug - Something is broken</option>
                        <option value="performance">Performance - Slow or unresponsive</option>
                        <option value="ui">UI/UX - Design or usability issue</option>
                        <option value="feature">Feature Request - Missing functionality</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What happened? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={report.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      required
                      placeholder="Describe the issue you encountered..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Expected vs Actual Behavior */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What did you expect to happen?
                      </label>
                      <textarea
                        value={report.expectedBehavior}
                        onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                        rows={3}
                        placeholder="What should have happened instead..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What actually happened?
                      </label>
                      <textarea
                        value={report.actualBehavior}
                        onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                        rows={3}
                        placeholder="What actually occurred..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Steps to Reproduce */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How can we reproduce this issue?
                    </label>
                    <textarea
                      value={report.stepsToReproduce}
                      onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                      rows={4}
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* System Info Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeSystemInfo"
                      checked={includeSystemInfo}
                      onChange={(e) => setIncludeSystemInfo(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeSystemInfo" className="ml-2 text-sm text-gray-700">
                      Include system information (browser, screen size, etc.)
                    </label>
                  </div>

                  {/* System Info Preview */}
                  {includeSystemInfo && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        System Information (Preview)
                      </h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Browser: {navigator.userAgent.split(' ')[0]}</div>
                        <div>Screen: {screen.width}x{screen.height}</div>
                        <div>Viewport: {window.innerWidth}x{window.innerHeight}</div>
                        <div>Language: {navigator.language}</div>
                        <div>URL: {window.location.pathname}</div>
                      </div>
                    </div>
                  )}
                </form>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!report.description.trim() || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Report</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

// Hook for using the error report dialog
export function useErrorReportDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentError, setCurrentError] = useState<{
    error?: Error
    errorId?: string
    context?: Record<string, any>
  }>({})

  const showReportDialog = (error?: Error, errorId?: string, context?: Record<string, any>) => {
    setCurrentError({ error, errorId, context })
    setIsOpen(true)
  }

  const hideReportDialog = () => {
    setIsOpen(false)
    setCurrentError({})
  }

  return {
    isOpen,
    showReportDialog,
    hideReportDialog,
    ErrorReportDialog: (props: Omit<ErrorReportDialogProps, 'isOpen' | 'onClose' | 'error' | 'errorId' | 'context'>) => (
      <ErrorReportDialog
        {...props}
        isOpen={isOpen}
        onClose={hideReportDialog}
        error={currentError.error}
        errorId={currentError.errorId}
        context={currentError.context}
      />
    )
  }
}