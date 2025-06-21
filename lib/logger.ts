// Simple logger for the minimalist system
export class Logger {
  info(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data || '')
    }
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data || '')
  }

  error(message: string | { error: any }, error?: any) {
    if (typeof message === 'object' && 'error' in message) {
      console.error(`[ERROR]`, message.error)
    } else {
      console.error(`[ERROR] ${message}`, error || '')
    }
  }

  security(message: string, data?: any) {
    console.warn(`[SECURITY] ${message}`, data || '')
  }
}

export const logger = new Logger()
export const performanceLogger = logger
export const securityLogger = logger

// API logging helpers
export const logApiRequest = (method: string, path: string, data?: any) => {
  logger.info(`API Request: ${method} ${path}`, data)
}

export const logApiResponse = (status: number, path: string, data?: any) => {
  logger.info(`API Response: ${status} ${path}`, data)
}