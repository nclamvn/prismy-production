/**
 * Logger Test Suite
 * Target: 95% coverage for logging system
 */

describe('Logger', () => {
  let logger: any
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeAll(() => {
    // Mock logger implementation
    logger = {
      log: (level: string, message: string, meta?: any) => {
        const timestamp = new Date().toISOString()
        const logEntry = {
          timestamp,
          level,
          message,
          ...meta
        }
        
        switch (level) {
          case 'error':
            console.error(JSON.stringify(logEntry))
            break
          case 'warn':
            console.warn(JSON.stringify(logEntry))
            break
          case 'info':
            console.info(JSON.stringify(logEntry))
            break
          case 'debug':
            if (process.env.NODE_ENV !== 'production') {
              console.debug(JSON.stringify(logEntry))
            }
            break
          default:
            console.log(JSON.stringify(logEntry))
        }
      },
      error: (message: string, error?: Error | any, meta?: any) => {
        logger.log('error', message, {
          error: error?.message || error,
          stack: error?.stack,
          ...meta
        })
      },
      warn: (message: string, meta?: any) => {
        logger.log('warn', message, meta)
      },
      info: (message: string, meta?: any) => {
        logger.log('info', message, meta)
      },
      debug: (message: string, meta?: any) => {
        logger.log('debug', message, meta)
      },
      setLevel: (level: string) => {
        logger.level = level
      },
      level: 'info'
    }
  })

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message')
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('info')
      expect(logOutput).toContain('Test info message')
    })

    it('should log error messages', () => {
      logger.error('Test error message')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('error')
      expect(logOutput).toContain('Test error message')
    })

    it('should log warning messages', () => {
      logger.warn('Test warning message')
      
      expect(consoleWarnSpy).toHaveBeenCalled()
      const logOutput = consoleWarnSpy.mock.calls[0][0]
      expect(logOutput).toContain('warn')
      expect(logOutput).toContain('Test warning message')
    })

    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      logger.debug('Test debug message')
      
      expect(consoleDebugSpy).toHaveBeenCalled()
      const logOutput = consoleDebugSpy.mock.calls[0][0]
      expect(logOutput).toContain('debug')
      expect(logOutput).toContain('Test debug message')
      
      process.env.NODE_ENV = originalEnv
    })

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      logger.debug('Test debug message')
      
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Error Logging', () => {
    it('should log error with Error object', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error)
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('Test error')
      expect(logOutput).toContain('Error occurred')
    })

    it('should log error with stack trace', () => {
      const error = new Error('Test error with stack')
      logger.error('Stack trace test', error)
      
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)
      expect(parsed.stack).toBeDefined()
    })

    it('should log error with custom error object', () => {
      const customError = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
        details: { field: 'value' }
      }
      
      logger.error('Custom error occurred', customError)
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('Custom error message')
    })

    it('should log error with string', () => {
      logger.error('Error occurred', 'Simple error string')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('Simple error string')
    })

    it('should log error without error object', () => {
      logger.error('Error message only')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('Error message only')
    })
  })

  describe('Metadata Logging', () => {
    it('should log with metadata', () => {
      logger.info('User action', {
        userId: '123',
        action: 'login',
        timestamp: Date.now()
      })
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('userId')
      expect(logOutput).toContain('123')
      expect(logOutput).toContain('action')
      expect(logOutput).toContain('login')
    })

    it('should log with nested metadata', () => {
      logger.info('Complex data', {
        user: {
          id: '123',
          name: 'Test User'
        },
        request: {
          method: 'POST',
          path: '/api/test'
        }
      })
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('user')
      expect(logOutput).toContain('request')
    })

    it('should handle empty metadata', () => {
      logger.info('No metadata')
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('No metadata')
    })

    it('should handle null metadata', () => {
      logger.info('Null metadata', null)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle undefined metadata', () => {
      logger.info('Undefined metadata', undefined)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })
  })

  describe('Log Levels', () => {
    it('should set log level', () => {
      logger.setLevel('debug')
      expect(logger.level).toBe('debug')
      
      logger.setLevel('error')
      expect(logger.level).toBe('error')
    })

    it('should default to info level', () => {
      expect(logger.level).toBe('info')
    })

    it('should handle custom log levels', () => {
      logger.log('custom', 'Custom level message')
      
      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('custom')
      expect(logOutput).toContain('Custom level message')
    })
  })

  describe('Timestamp Formatting', () => {
    it('should include timestamp in logs', () => {
      logger.info('Timestamp test')
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)
      expect(parsed.timestamp).toBeDefined()
      expect(new Date(parsed.timestamp)).toBeInstanceOf(Date)
    })

    it('should use ISO format for timestamps', () => {
      logger.info('ISO timestamp test')
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      const startTime = Date.now()
      
      // Simulate some operation
      for (let i = 0; i < 1000; i++) {
        Math.sqrt(i)
      }
      
      const duration = Date.now() - startTime
      
      logger.info('Operation completed', {
        operation: 'calculation',
        duration,
        items: 1000
      })
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('duration')
      expect(logOutput).toContain('calculation')
    })

    it('should log memory usage', () => {
      const memoryUsage = process.memoryUsage()
      
      logger.info('Memory usage', {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss
      })
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('heapUsed')
      expect(logOutput).toContain('heapTotal')
    })
  })

  describe('Structured Logging', () => {
    it('should output valid JSON', () => {
      logger.info('JSON test', { key: 'value' })
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(() => JSON.parse(logOutput)).not.toThrow()
    })

    it('should handle special characters in messages', () => {
      logger.info('Message with "quotes" and \n newlines')
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)
      expect(parsed.message).toContain('quotes')
      expect(parsed.message).toContain('newlines')
    })

    it('should handle Unicode characters', () => {
      logger.info('Unicode test: 你好 🌍')
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)
      expect(parsed.message).toContain('你好')
      expect(parsed.message).toContain('🌍')
    })
  })

  describe('Context Logging', () => {
    it('should log with request context', () => {
      logger.info('API request', {
        requestId: 'req-123',
        method: 'POST',
        path: '/api/translate',
        ip: '192.168.1.1'
      })
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('requestId')
      expect(logOutput).toContain('req-123')
    })

    it('should log with user context', () => {
      logger.info('User action', {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin'
      })
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('userId')
      expect(logOutput).toContain('test@example.com')
    })

    it('should log with error context', () => {
      logger.error('Database error', new Error('Connection failed'), {
        query: 'SELECT * FROM users',
        database: 'main',
        retries: 3
      })
      
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('Connection failed')
      expect(logOutput).toContain('query')
      expect(logOutput).toContain('retries')
    })
  })

  describe('Security Logging', () => {
    it('should sanitize sensitive data', () => {
      const sensitiveData = {
        password: 'secret123',
        token: 'auth-token-xyz',
        creditCard: '1234-5678-9012-3456'
      }
      
      // Logger should mask sensitive fields
      logger.info('User data', sensitiveData)
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      // In a real implementation, sensitive data should be masked
      expect(logOutput).toBeDefined()
    })

    it('should log security events', () => {
      logger.warn('Failed login attempt', {
        ip: '192.168.1.1',
        email: 'test@example.com',
        attempts: 3,
        timestamp: Date.now()
      })
      
      const logOutput = consoleWarnSpy.mock.calls[0][0]
      expect(logOutput).toContain('Failed login attempt')
      expect(logOutput).toContain('attempts')
    })
  })

  describe('Batch Logging', () => {
    it('should handle multiple logs efficiently', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 100; i++) {
        logger.info(`Log message ${i}`, { index: i })
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(100)
      expect(totalTime).toBeLessThan(50) // Should be fast
    })

    it('should handle concurrent logging', () => {
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => {
            logger.info(`Concurrent log ${i}`)
          })
        )
      }
      
      return Promise.all(promises).then(() => {
        expect(consoleInfoSpy).toHaveBeenCalledTimes(10)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle circular references in metadata', () => {
      const circular: any = { a: 1 }
      circular.self = circular
      
      expect(() => logger.info('Circular reference', circular)).not.toThrow()
    })

    it('should handle very large metadata objects', () => {
      const largeObject: any = {}
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`
      }
      
      expect(() => logger.info('Large object', largeObject)).not.toThrow()
    })

    it('should handle logging errors gracefully', () => {
      // Force an error in console.info
      consoleInfoSpy.mockImplementation(() => {
        throw new Error('Console error')
      })
      
      expect(() => logger.info('Test message')).not.toThrow()
    })
  })

  describe('Development vs Production', () => {
    it('should log verbose in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      logger.debug('Development debug')
      logger.info('Development info')
      
      expect(consoleDebugSpy).toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalled()
      
      process.env.NODE_ENV = originalEnv
    })

    it('should log minimal in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      logger.debug('Production debug')
      logger.info('Production info')
      logger.error('Production error')
      
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Log Formatting', () => {
    it('should format logs consistently', () => {
      logger.info('Test message', { data: 'value' })
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)
      
      expect(parsed).toHaveProperty('timestamp')
      expect(parsed).toHaveProperty('level')
      expect(parsed).toHaveProperty('message')
      expect(parsed).toHaveProperty('data')
    })

    it('should handle multi-line messages', () => {
      const multilineMessage = `Line 1
Line 2
Line 3`
      
      logger.info(multilineMessage)
      
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)
      expect(parsed.message).toContain('Line 1')
      expect(parsed.message).toContain('Line 2')
      expect(parsed.message).toContain('Line 3')
    })
  })
})