// Simple logger for the minimalist system
export class Logger {
  info(message: string | object, data?: any) {
    if (typeof message === 'object') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[INFO]`, message)
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[INFO] ${message}`, data || '')
      }
    }
  }

  warn(message: string | object, data?: any) {
    if (typeof message === 'object') {
      console.warn(`[WARN]`, message)
    } else {
      console.warn(`[WARN] ${message}`, data || '')
    }
  }

  error(message: string | object, error?: any) {
    if (typeof message === 'object') {
      console.error(`[ERROR]`, message)
    } else {
      console.error(`[ERROR] ${message}`, error || '')
    }
  }

  security(message: string | object, data?: any) {
    if (typeof message === 'object') {
      console.warn(`[SECURITY]`, message)
    } else {
      console.warn(`[SECURITY] ${message}`, data || '')
    }
  }

  debug(message: string | object, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      if (typeof message === 'object') {
        console.debug(`[DEBUG]`, message)
      } else {
        console.debug(`[DEBUG] ${message}`, data || '')
      }
    }
  }

  child(options?: any) {
    // Simple child logger - just returns a new logger instance
    // In a more advanced implementation, this would inherit context
    return new Logger()
  }
}

export const logger = new Logger()
export const performanceLogger = logger
export const securityLogger = logger

// Factory function for creating child loggers
export const createLogger = (name?: string) => {
  return logger
}

// API logging helpers
export const logApiRequest = (method: string, path: string, data?: any) => {
  logger.info(`API Request: ${method} ${path}`, data)
}

export const logApiResponse = (status: number, path: string, data?: any) => {
  logger.info(`API Response: ${status} ${path}`, data)
}

// Domain-specific logging helpers for backward compatibility
export const logTranslation = (data: any) => {
  logger.info('Translation operation', data)
}

export const logPayment = (data: any) => {
  logger.info('Payment operation', data)
}

export const logCacheOperation = (data: any) => {
  logger.info('Cache operation', data)
}

export const logSecurityEvent = (data: any) => {
  logger.security('Security event', data)
}

export const logPerformance = (data: any) => {
  logger.info('Performance metric', data)
}

export const logError = (error: any, data?: any) => {
  logger.error('Application error', { error, data })
}
