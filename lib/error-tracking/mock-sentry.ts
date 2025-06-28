// Mock Sentry for deployment compatibility
export const errorTracker = {
  initialize: () => {},
  captureError: () => '',
  captureMessage: () => '',
  setUser: () => {},
  setTag: () => {},
  addBreadcrumb: () => {},
  startTransaction: () => undefined,
  withScope: () => {},
  trackTranslationError: () => '',
  trackAPIError: () => '',
  trackPaymentError: () => '',
  trackPerformanceIssue: () => '',
  isHealthy: () => true,
  getConfig: () => ({
    initialized: false,
    environment: 'production',
    sampleRate: 0,
    dsn: 'not configured'
  })
}

export const captureError = errorTracker.captureError
export const captureMessage = errorTracker.captureMessage
export const setUser = errorTracker.setUser
export const addBreadcrumb = errorTracker.addBreadcrumb