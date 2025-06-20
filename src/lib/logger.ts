// Simple logger for the minimalist system
export class Logger {
  static info(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data || '')
    }
  }
  
  static warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data || '')
  }
  
  static error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error || '')
  }
}

export const logger = new Logger()
export const performanceLogger = logger