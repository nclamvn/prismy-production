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
  logError
} from '@/lib/logger'

// Mock console methods to test logging
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}

// Mock pino
jest.mock('pino', () => {
  const mockLogger = {
    info: mockConsole.info,
    error: mockConsole.error,
    warn: mockConsole.warn,
    debug: mockConsole.debug,
    child: jest.fn().mockReturnThis()
  }
  
  return jest.fn(() => mockLogger)
})

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Logging', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined()
      expect(logger.child).toBeDefined()
    })

    it('should create component logger', () => {
      const componentLogger = createLogger('test-component')
      expect(componentLogger).toBeDefined()
      expect(logger.child).toHaveBeenCalledWith({ component: 'test-component' })
    })

    it('should log errors with context', () => {
      const error = new Error('Test error')
      const context = { userId: '123', operation: 'translation' }
      
      logError(error, context)
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String)
          },
          ...context
        }),
        'Error occurred'
      )
    })
  })

  describe('API Logging', () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/translate',
      headers: {
        'user-agent': 'Test Agent',
        'x-forwarded-for': '192.168.1.1'
      }
    }

    const mockResponse = {
      statusCode: 200
    }

    it('should log API requests', () => {
      logApiRequest(mockRequest, { extra: 'data' })
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/translate',
          userAgent: 'Test Agent',
          ip: '192.168.1.1',
          extra: 'data'
        }),
        'API Request'
      )
    })

    it('should log API responses with success status', () => {
      logApiResponse(mockRequest, mockResponse, 150)
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/translate',
          statusCode: 200,
          duration: '150ms'
        }),
        'API Response'
      )
    })

    it('should log API responses with error status', () => {
      const errorResponse = { ...mockResponse, statusCode: 500 }
      logApiResponse(mockRequest, errorResponse, 200)
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          duration: '200ms'
        }),
        'API Response'
      )
    })
  })

  describe('Translation Logging', () => {
    it('should log successful translation', () => {
      logTranslation('Hello world', 'vi', true, { model: 'google' })
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceTextLength: 11,
          targetLanguage: 'vi',
          success: true,
          model: 'google'
        }),
        'Translation Request'
      )
    })

    it('should log failed translation', () => {
      logTranslation('Hello world', 'vi', false, { error: 'API timeout' })
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'API timeout'
        }),
        'Translation Request'
      )
    })
  })

  describe('Payment Logging', () => {
    it('should log successful payment', () => {
      logPayment('stripe', 1000, 'USD', true, { customerId: 'cus_123' })
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'stripe',
          amount: 1000,
          currency: 'USD',
          success: true,
          customerId: 'cus_123'
        }),
        'Payment Processing'
      )
    })

    it('should log failed payment', () => {
      logPayment('vnpay', 50000, 'VND', false, { errorCode: 'INSUFFICIENT_FUNDS' })
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: 'INSUFFICIENT_FUNDS'
        }),
        'Payment Processing'
      )
    })
  })

  describe('Cache Logging', () => {
    it('should log cache hit', () => {
      logCacheOperation('get', 'translation:hello:vi', true, 5)
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'get',
          key: 'translation:hello:vi',
          hit: true,
          duration: '5ms'
        }),
        'Cache Operation'
      )
    })

    it('should log cache miss', () => {
      logCacheOperation('get', 'translation:goodbye:vi', false)
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          hit: false,
          duration: undefined
        }),
        'Cache Operation'
      )
    })

    it('should truncate long cache keys', () => {
      const longKey = 'a'.repeat(100)
      logCacheOperation('set', longKey, false)
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          key: longKey.substring(0, 50)
        }),
        'Cache Operation'
      )
    })
  })

  describe('Security Logging', () => {
    it('should log critical security events as errors', () => {
      logSecurityEvent('unauthorized_access_attempt', 'critical', { ip: '192.168.1.1' })
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'unauthorized_access_attempt',
          severity: 'critical',
          ip: '192.168.1.1',
          timestamp: expect.any(String)
        }),
        'Security Event'
      )
    })

    it('should log high severity events as warnings', () => {
      logSecurityEvent('rate_limit_exceeded', 'high', { userId: '123' })
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'rate_limit_exceeded',
          severity: 'high'
        }),
        'Security Event'
      )
    })

    it('should log low severity events as info', () => {
      logSecurityEvent('login_success', 'low', { userId: '123' })
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'low'
        }),
        'Security Event'
      )
    })
  })

  describe('Performance Logging', () => {
    it('should log fast operations as info', () => {
      logPerformance('database_query', 50, { query: 'SELECT * FROM users' })
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'database_query',
          duration: '50ms',
          query: 'SELECT * FROM users'
        }),
        'Performance Metric'
      )
    })

    it('should log slow operations as warnings', () => {
      logPerformance('translation_api_call', 1500, { provider: 'google' })
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'translation_api_call',
          duration: '1500ms'
        }),
        'Performance Metric'
      )
    })
  })
})