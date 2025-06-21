import pino from 'pino'

// Create different loggers for different environments
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Base logger configuration
const baseConfig = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Add custom fields for Prismy context
  base: {
    service: 'prismy-translation',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // Format timestamps
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Redact sensitive information
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'authorization',
      'secret',
      'key',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]'
    ],
    remove: true
  }
}

// Development logger with pretty printing (disabled in serverless)
const developmentLogger = pino({
  ...baseConfig,
  // Disable transport in serverless environments to avoid worker threads
  ...(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? {} : {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  })
})

// Production logger optimized for structured logging (disable workers for Vercel)
const productionLogger = pino({
  ...baseConfig,
  formatters: {
    level: (label) => {
      return { level: label }
    }
  },
  // Disable worker threads in production to avoid Vercel deployment issues
  ...(process.env.VERCEL || process.env.VERCEL_ENV ? {
    transport: undefined,
    worker: undefined,
    sync: true
  } : {})
})

// Export the appropriate logger
export const logger = isDevelopment ? developmentLogger : productionLogger

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
  apiLogger.info({
    method: req.method,
    url: req.url,
    userAgent: req.headers?.['user-agent'],
    ip: req.headers?.['x-forwarded-for'] || req.ip,
    ...extra
  }, 'API Request')
}

export const logApiResponse = (req: any, res: any, duration: number, extra?: object) => {
  const level = res.statusCode >= 400 ? 'error' : 'info'
  
  apiLogger[level]({
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ...extra
  }, 'API Response')
}

export const logTranslation = (sourceText: string, targetLang: string, success: boolean, extra?: object) => {
  translationLogger.info({
    sourceTextLength: sourceText.length,
    targetLanguage: targetLang,
    success,
    ...extra
  }, 'Translation Request')
}

export const logPayment = (paymentMethod: string, amount: number, currency: string, success: boolean, extra?: object) => {
  paymentLogger.info({
    paymentMethod,
    amount,
    currency,
    success,
    ...extra
  }, 'Payment Processing')
}

export const logCacheOperation = (operation: string, key: string, hit: boolean, duration?: number, extra?: object) => {
  cacheLogger.debug({
    operation,
    key: key.substring(0, 50), // Truncate long keys
    hit,
    duration: duration ? `${duration}ms` : undefined,
    ...extra
  }, 'Cache Operation')
}

export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', extra?: object) => {
  const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info'
  
  securityLogger[level]({
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...extra
  }, 'Security Event')
}

export const logPerformance = (operation: string, duration: number, extra?: object) => {
  const level = duration > 1000 ? 'warn' : 'info'
  
  performanceLogger[level]({
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