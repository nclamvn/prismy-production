// Simple logger for the minimalist system
export class Logger {
  info(data: any, message?: any) {
    if (typeof data === 'string') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[INFO] ${data}`, message || '')
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[INFO] ${message || 'Info'}`, data || '')
      }
    }
  }
  
  warn(data: any, message?: any) {
    if (typeof data === 'string') {
      console.warn(`[WARN] ${data}`, message || '')
    } else {
      console.warn(`[WARN] ${message || 'Warning'}`, data || '')
    }
  }
  
  error(data: any, message?: any) {
    if (typeof data === 'string') {
      console.error(`[ERROR] ${data}`, message || '')
    } else {
      console.error(`[ERROR] ${message || 'Error occurred'}`, data || '')
    }
  }
  
  debug(data: any, message?: any) {
    if (typeof data === 'string') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] ${data}`, message || '')
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] ${message || 'Debug'}`, data || '')
      }
    }
  }
  
  // Create a child logger for components
  child(context: any) {
    return {
      info: (data: any, message?: any) => this.info(data, message),
      warn: (data: any, message?: any) => this.warn(data, message),
      error: (data: any, message?: any) => this.error(data, message),
      debug: (data: any, message?: any) => this.debug(data, message)
    }
  }
}

export const logger = new Logger()

// Specialized loggers for different components
export const createLogger = (component: string) => {
  return logger.child({ component })
}

// API request/response logger
export const apiLogger = createLogger('api')

// Translation service logger
export const translationLogger = createLogger('translation')

// Payment service logger
export const paymentLogger = createLogger('payment')

// Cache system logger
export const cacheLogger = createLogger('cache')

// Authentication logger
export const authLogger = createLogger('auth')

// Database logger
export const dbLogger = createLogger('database')

// Security logger for security events
export const securityLogger = createLogger('security')

// Performance logger for monitoring
export const performanceLogger = createLogger('performance')

// Utility functions for common logging patterns
export const logApiRequest = (req: any, extra?: object) => {
  logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.headers?.['user-agent'],
    ip: req.headers?.['x-forwarded-for'] || req.ip,
    ...extra
  }, 'API Request')
}

export const logApiResponse = (req: any, res: any, duration: number, extra?: object) => {
  const level = res.statusCode >= 400 ? 'error' : 'info'
  
  logger[level]({
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ...extra
  }, 'API Response')
}

export const logTranslation = (sourceText: string, targetLang: string, success: boolean, extra?: object) => {
  logger.info({
    sourceTextLength: sourceText.length,
    targetLanguage: targetLang,
    success,
    ...extra
  }, 'Translation Request')
}

export const logPayment = (paymentMethod: string, amount: number, currency: string, success: boolean, extra?: object) => {
  logger.info({
    paymentMethod,
    amount,
    currency,
    success,
    ...extra
  }, 'Payment Processing')
}

export const logCacheOperation = (operation: string, key: string, hit: boolean, duration?: number, extra?: object) => {
  logger.debug({
    operation,
    key: key.substring(0, 50), // Truncate long keys
    hit,
    duration: duration ? `${duration}ms` : undefined,
    ...extra
  }, 'Cache Operation')
}

export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', extra?: object) => {
  const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info'
  
  logger[level]({
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...extra
  }, 'Security Event')
}

export const logPerformance = (operation: string, duration: number, extra?: object) => {
  const level = duration > 1000 ? 'warn' : 'info'
  
  logger[level]({
    operation,
    duration: `${duration}ms`,
    ...extra
  }, 'Performance Metric')
}

// Error logging with context
export const logError = (error: Error, context?: object) => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  }, 'Error occurred')
}

// Structured error for API responses
export const createApiError = (message: string, statusCode: number, details?: object) => {
  const error = new Error(message) as any
  error.statusCode = statusCode
  error.details = details
  return error
}