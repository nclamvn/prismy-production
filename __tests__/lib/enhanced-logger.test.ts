import {
  logger,
  createLogger,
  logApiRequest,
  logApiResponse,
  logTranslation,
  logPayment,
  logCacheOperation,
  logSecurityEvent,
  logPerformance,
  logError,
} from '@/lib/logger'

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Override console methods
Object.assign(console, mockConsole)

describe('Enhanced Logger', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
    // Set to development for most tests
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('Core Logger Functionality', () => {
    it('should log info messages with string parameters', () => {
      logger.info('Test info message', { extra: 'data' })

      expect(console.log).toHaveBeenCalledWith('[INFO] Test info message', {
        extra: 'data',
      })
    })

    it('should log info messages with object parameters', () => {
      const logData = { message: 'Test info', data: { key: 'value' } }
      logger.info(logData)

      expect(console.log).toHaveBeenCalledWith('[INFO]', logData)
    })

    it('should log warnings with string parameters', () => {
      logger.warn('Test warning', { context: 'test' })

      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warning', {
        context: 'test',
      })
    })

    it('should log warnings with object parameters', () => {
      const warnData = { warning: 'Something suspicious', level: 'medium' }
      logger.warn(warnData)

      expect(console.warn).toHaveBeenCalledWith('[WARN]', warnData)
    })

    it('should log errors with string parameters', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error)

      expect(console.error).toHaveBeenCalledWith(
        '[ERROR] Error occurred',
        error
      )
    })

    it('should log errors with object parameters', () => {
      const errorData = { error: new Error('Test error'), context: 'testing' }
      logger.error(errorData)

      expect(console.error).toHaveBeenCalledWith('[ERROR]', errorData)
    })

    it('should log security events', () => {
      const securityData = { event: 'unauthorized_access', ip: '192.168.1.1' }
      logger.security('Security incident', securityData)

      expect(console.warn).toHaveBeenCalledWith(
        '[SECURITY] Security incident',
        securityData
      )
    })

    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logger.debug('Debug message', { debug: 'info' })

      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Debug message', {
        debug: 'info',
      })

      process.env.NODE_ENV = originalEnv
    })

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      logger.debug('Debug message', { debug: 'info' })

      expect(console.debug).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Child Logger', () => {
    it('should create child logger instances', () => {
      const childLogger = logger.child({ component: 'test' })

      expect(childLogger).toBeDefined()
      expect(typeof childLogger.info).toBe('function')
      expect(typeof childLogger.error).toBe('function')
    })

    it('should work with createLogger factory', () => {
      const namedLogger = createLogger('test-module')

      expect(namedLogger).toBeDefined()
      expect(typeof namedLogger.info).toBe('function')
    })
  })

  describe('Domain-Specific Logging', () => {
    it('should log API requests', () => {
      logApiRequest('POST', '/api/translate', { text: 'hello' })

      expect(console.log).toHaveBeenCalledWith(
        '[INFO] API Request: POST /api/translate',
        { text: 'hello' }
      )
    })

    it('should log API responses', () => {
      logApiResponse(200, '/api/translate', { success: true })

      expect(console.log).toHaveBeenCalledWith(
        '[INFO] API Response: 200 /api/translate',
        { success: true }
      )
    })

    it('should log translation operations', () => {
      const translationData = {
        text: 'hello',
        from: 'en',
        to: 'vi',
        provider: 'anthropic',
      }

      logTranslation(translationData)

      expect(console.log).toHaveBeenCalledWith(
        '[INFO] Translation operation',
        translationData
      )
    })

    it('should log payment operations', () => {
      const paymentData = {
        amount: 1000,
        currency: 'usd',
        provider: 'stripe',
      }

      logPayment(paymentData)

      expect(console.log).toHaveBeenCalledWith(
        '[INFO] Payment operation',
        paymentData
      )
    })

    it('should log cache operations', () => {
      const cacheData = {
        operation: 'set',
        key: 'translation:key',
        ttl: 3600,
      }

      logCacheOperation(cacheData)

      expect(console.log).toHaveBeenCalledWith(
        '[INFO] Cache operation',
        cacheData
      )
    })

    it('should log security events', () => {
      const securityData = {
        event: 'failed_login',
        ip: '192.168.1.1',
        attempts: 3,
      }

      logSecurityEvent(securityData)

      expect(console.warn).toHaveBeenCalledWith(
        '[SECURITY] Security event',
        securityData
      )
    })

    it('should log performance metrics', () => {
      const performanceData = {
        operation: 'translation',
        duration: 1500,
        memory: 45.2,
      }

      logPerformance(performanceData)

      expect(console.log).toHaveBeenCalledWith(
        '[INFO] Performance metric',
        performanceData
      )
    })

    it('should log application errors', () => {
      const error = new Error('Application crashed')
      const context = { component: 'translator', action: 'process' }

      logError(error, context)

      expect(console.error).toHaveBeenCalledWith('[ERROR] Application error', {
        error,
        data: context,
      })
    })
  })

  describe('Environment Behavior', () => {
    it('should respect development environment for info logs', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logger.info('Development message')

      expect(console.log).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should suppress info logs in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      logger.info('Production message')

      expect(console.log).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should always log errors regardless of environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      logger.error('Production error')

      expect(console.error).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should always log warnings regardless of environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      logger.warn('Production warning')

      expect(console.warn).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })
})
