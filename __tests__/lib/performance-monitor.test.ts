import { performanceMonitor, type AlertConfig } from '@/lib/performance-monitor'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock system metrics collection
jest.mock('os', () => ({
  cpus: jest.fn(() => Array(4).fill({ model: 'Mock CPU', speed: 2400 })),
  totalmem: jest.fn(() => 8 * 1024 * 1024 * 1024), // 8GB
  freemem: jest.fn(() => 4 * 1024 * 1024 * 1024), // 4GB free
  loadavg: jest.fn(() => [0.5, 0.7, 0.9]),
  uptime: jest.fn(() => 86400), // 24 hours
}))

describe('Performance Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset performance monitor state
    performanceMonitor.reset()
  })

  describe('Basic Metrics Collection', () => {
    it('should collect request performance metrics', () => {
      performanceMonitor.startRequest(
        'test-request-1',
        '/api/translate',
        'POST'
      )

      // Simulate some processing time
      setTimeout(() => {
        performanceMonitor.endRequest('test-request-1', 200, {
          charactersProcessed: 150,
          provider: 'anthropic',
        })
      }, 10)

      const metrics = performanceMonitor.getRequestMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.totalRequests).toBe(1)
      expect(metrics.averageResponseTime).toBeGreaterThan(0)
    })

    it('should track database query performance', () => {
      const query = 'SELECT * FROM translations WHERE user_id = ?'

      performanceMonitor.trackDatabaseQuery(query, 45, true)
      performanceMonitor.trackDatabaseQuery(query, 67, true)
      performanceMonitor.trackDatabaseQuery('SELECT * FROM users', 23, false)

      const metrics = performanceMonitor.getDatabaseMetrics()

      expect(metrics.totalQueries).toBe(3)
      expect(metrics.averageQueryTime).toBeGreaterThan(0)
      expect(metrics.slowQueries).toBeDefined()
      expect(metrics.failedQueries).toBe(1)
    })

    it('should monitor cache performance', () => {
      performanceMonitor.trackCacheOperation('get', 'translation:key1', true, 2)
      performanceMonitor.trackCacheOperation('set', 'translation:key2', true, 5)
      performanceMonitor.trackCacheOperation(
        'get',
        'translation:key3',
        false,
        0
      )

      const metrics = performanceMonitor.getCacheMetrics()

      expect(metrics.totalOperations).toBe(3)
      expect(metrics.hitRate).toBe(2 / 3) // 2 hits out of 3 operations
      expect(metrics.averageResponseTime).toBeGreaterThan(0)
      expect(metrics.operations.get).toBe(2)
      expect(metrics.operations.set).toBe(1)
    })

    it('should collect system resource metrics', async () => {
      const systemMetrics = await performanceMonitor.collectSystemMetrics()

      expect(systemMetrics).toHaveProperty('cpu')
      expect(systemMetrics).toHaveProperty('memory')
      expect(systemMetrics).toHaveProperty('timestamp')

      expect(systemMetrics.cpu).toHaveProperty('usage')
      expect(systemMetrics.cpu).toHaveProperty('loadAverage')

      expect(systemMetrics.memory).toHaveProperty('total')
      expect(systemMetrics.memory).toHaveProperty('free')
      expect(systemMetrics.memory).toHaveProperty('used')
      expect(systemMetrics.memory).toHaveProperty('usagePercentage')

      expect(systemMetrics.memory.usagePercentage).toBeLessThanOrEqual(100)
      expect(systemMetrics.memory.usagePercentage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Real-time Monitoring', () => {
    it('should track concurrent requests', () => {
      performanceMonitor.startRequest('req1', '/api/translate', 'POST')
      performanceMonitor.startRequest('req2', '/api/translate', 'POST')
      performanceMonitor.startRequest('req3', '/api/ocr', 'POST')

      const realTimeMetrics = performanceMonitor.getRealTimeMetrics()

      expect(realTimeMetrics.activeRequests).toBe(3)
      expect(realTimeMetrics.requestsPerEndpoint['/api/translate']).toBe(2)
      expect(realTimeMetrics.requestsPerEndpoint['/api/ocr']).toBe(1)

      // Complete some requests
      performanceMonitor.endRequest('req1', 200)
      performanceMonitor.endRequest('req2', 200)

      const updatedMetrics = performanceMonitor.getRealTimeMetrics()
      expect(updatedMetrics.activeRequests).toBe(1)
    })

    it('should calculate throughput metrics', () => {
      // Simulate multiple requests over time
      const timestamps = [
        Date.now() - 5000,
        Date.now() - 4000,
        Date.now() - 3000,
        Date.now() - 2000,
        Date.now() - 1000,
      ]

      timestamps.forEach((timestamp, index) => {
        performanceMonitor.startRequest(`req${index}`, '/api/test', 'GET')
        performanceMonitor.endRequest(`req${index}`, 200, undefined, timestamp)
      })

      const throughput = performanceMonitor.getThroughputMetrics()

      expect(throughput.requestsPerSecond).toBeGreaterThan(0)
      expect(throughput.requestsPerMinute).toBeGreaterThan(0)
      expect(throughput.peakThroughput).toBeGreaterThan(0)
    })

    it('should detect performance anomalies', () => {
      // Simulate normal response times
      for (let i = 0; i < 10; i++) {
        performanceMonitor.startRequest(`normal${i}`, '/api/test', 'GET')
        performanceMonitor.endRequest(
          `normal${i}`,
          200,
          undefined,
          Date.now() + 100
        )
      }

      // Simulate slow response
      performanceMonitor.startRequest('slow1', '/api/test', 'GET')
      performanceMonitor.endRequest('slow1', 200, undefined, Date.now() + 2000)

      const anomalies = performanceMonitor.detectAnomalies()

      expect(anomalies).toBeDefined()
      expect(anomalies.slowRequests.length).toBeGreaterThan(0)
      expect(anomalies.slowRequests[0].responseTime).toBeGreaterThan(1000)
    })
  })

  describe('Performance Alerts', () => {
    it('should configure and trigger alerts', () => {
      const alertConfig: AlertConfig = {
        id: 'high-response-time',
        name: 'High Response Time Alert',
        type: 'response_time',
        threshold: 1000,
        condition: 'greater_than',
        enabled: true,
        action: 'log',
      }

      performanceMonitor.configureAlert(alertConfig)

      // Trigger the alert condition
      performanceMonitor.startRequest('slow-request', '/api/test', 'GET')
      performanceMonitor.endRequest(
        'slow-request',
        200,
        undefined,
        Date.now() + 1500
      )

      const triggeredAlerts = performanceMonitor.getTriggeredAlerts()

      expect(triggeredAlerts.length).toBeGreaterThan(0)
      expect(triggeredAlerts[0].alertId).toBe('high-response-time')
      expect(triggeredAlerts[0].triggered).toBe(true)
    })

    it('should handle memory usage alerts', async () => {
      const memoryAlert: AlertConfig = {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        type: 'memory_usage',
        threshold: 80, // 80% memory usage
        condition: 'greater_than',
        enabled: true,
        action: 'log',
      }

      performanceMonitor.configureAlert(memoryAlert)

      // Mock high memory usage
      const os = jest.requireMock('os')
      jest.mocked(os.freemem).mockReturnValue(1024 * 1024 * 1024) // 1GB free out of 8GB

      await performanceMonitor.checkSystemAlerts()

      const alerts = performanceMonitor.getTriggeredAlerts()
      expect(alerts.some(alert => alert.alertId === 'high-memory-usage')).toBe(
        true
      )
    })

    it('should handle error rate alerts', () => {
      const errorAlert: AlertConfig = {
        id: 'high-error-rate',
        name: 'High Error Rate',
        type: 'error_rate',
        threshold: 10, // 10% error rate
        condition: 'greater_than',
        enabled: true,
        action: 'webhook',
        webhookUrl: 'https://example.com/alerts',
      }

      performanceMonitor.configureAlert(errorAlert)

      // Simulate requests with errors
      for (let i = 0; i < 8; i++) {
        performanceMonitor.startRequest(`success${i}`, '/api/test', 'GET')
        performanceMonitor.endRequest(`success${i}`, 200)
      }

      for (let i = 0; i < 2; i++) {
        performanceMonitor.startRequest(`error${i}`, '/api/test', 'GET')
        performanceMonitor.endRequest(`error${i}`, 500)
      }

      performanceMonitor.checkErrorRateAlerts()

      const alerts = performanceMonitor.getTriggeredAlerts()
      expect(alerts.some(alert => alert.alertId === 'high-error-rate')).toBe(
        true
      )
    })
  })

  describe('Performance Optimization', () => {
    it('should provide performance recommendations', () => {
      // Simulate various performance patterns

      // Slow database queries
      performanceMonitor.trackDatabaseQuery(
        'SELECT * FROM large_table',
        2000,
        true
      )
      performanceMonitor.trackDatabaseQuery(
        'SELECT * FROM large_table',
        1800,
        true
      )

      // High cache miss rate
      for (let i = 0; i < 10; i++) {
        performanceMonitor.trackCacheOperation('get', `key${i}`, false, 0)
      }

      // Slow API responses
      performanceMonitor.startRequest(
        'slow-api',
        '/api/heavy-operation',
        'POST'
      )
      performanceMonitor.endRequest(
        'slow-api',
        200,
        undefined,
        Date.now() + 3000
      )

      const recommendations =
        performanceMonitor.generateOptimizationRecommendations()

      expect(recommendations).toBeDefined()
      expect(recommendations.database).toBeDefined()
      expect(recommendations.cache).toBeDefined()
      expect(recommendations.api).toBeDefined()

      expect(
        recommendations.database.some(rec => rec.type === 'query_optimization')
      ).toBe(true)

      expect(
        recommendations.cache.some(rec => rec.type === 'cache_strategy')
      ).toBe(true)
    })

    it('should track performance improvements over time', () => {
      const baselineMetrics = {
        averageResponseTime: 500,
        errorRate: 5,
        throughput: 100,
      }

      performanceMonitor.setPerformanceBaseline(baselineMetrics)

      // Simulate improved performance
      for (let i = 0; i < 20; i++) {
        performanceMonitor.startRequest(`improved${i}`, '/api/test', 'GET')
        performanceMonitor.endRequest(
          `improved${i}`,
          200,
          undefined,
          Date.now() + 200
        )
      }

      const improvement = performanceMonitor.calculatePerformanceImprovement()

      expect(improvement).toBeDefined()
      expect(improvement.responseTimeImprovement).toBeGreaterThan(0)
      expect(improvement.overallImprovement).toBeGreaterThan(0)
    })

    it('should identify performance bottlenecks', () => {
      // Simulate different types of bottlenecks

      // CPU-intensive operations
      performanceMonitor.trackResourceUsage('cpu', 95, Date.now())
      performanceMonitor.trackResourceUsage('cpu', 90, Date.now() + 1000)

      // Memory pressure
      performanceMonitor.trackResourceUsage('memory', 85, Date.now())

      // Database bottlenecks
      performanceMonitor.trackDatabaseQuery('SLOW_QUERY', 5000, true)

      const bottlenecks = performanceMonitor.identifyBottlenecks()

      expect(bottlenecks).toBeDefined()
      expect(bottlenecks.cpu).toBeDefined()
      expect(bottlenecks.memory).toBeDefined()
      expect(bottlenecks.database).toBeDefined()

      expect(bottlenecks.cpu.severity).toBe('high')
      expect(bottlenecks.database.slowQueries.length).toBeGreaterThan(0)
    })
  })

  describe('Reporting and Analytics', () => {
    it('should generate performance reports', () => {
      // Simulate a day of traffic
      const startTime = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago

      for (let hour = 0; hour < 24; hour++) {
        const hourlyRequests = Math.floor(Math.random() * 100) + 50

        for (let req = 0; req < hourlyRequests; req++) {
          const requestTime = startTime + hour * 60 * 60 * 1000 + req * 1000
          const responseTime = Math.floor(Math.random() * 500) + 100

          performanceMonitor.startRequest(`h${hour}r${req}`, '/api/test', 'GET')
          performanceMonitor.endRequest(
            `h${hour}r${req}`,
            200,
            undefined,
            requestTime + responseTime
          )
        }
      }

      const report = performanceMonitor.generatePerformanceReport('24h')

      expect(report).toBeDefined()
      expect(report.timeRange).toBe('24h')
      expect(report.summary).toBeDefined()
      expect(report.hourlyBreakdown).toBeDefined()
      expect(report.summary.totalRequests).toBeGreaterThan(0)
      expect(report.hourlyBreakdown.length).toBe(24)
    })

    it('should export metrics in different formats', () => {
      // Add some sample data
      performanceMonitor.startRequest('export-test', '/api/test', 'GET')
      performanceMonitor.endRequest('export-test', 200)

      const jsonExport = performanceMonitor.exportMetrics('json')
      const csvExport = performanceMonitor.exportMetrics('csv')

      expect(jsonExport).toBeDefined()
      expect(typeof jsonExport).toBe('string')
      expect(() => JSON.parse(jsonExport)).not.toThrow()

      expect(csvExport).toBeDefined()
      expect(typeof csvExport).toBe('string')
      expect(csvExport).toContain(
        'timestamp,endpoint,method,responseTime,statusCode'
      )
    })

    it('should provide real-time dashboard data', () => {
      // Simulate current activity
      performanceMonitor.startRequest('dashboard1', '/api/translate', 'POST')
      performanceMonitor.startRequest('dashboard2', '/api/ocr', 'POST')

      const dashboardData = performanceMonitor.getDashboardData()

      expect(dashboardData).toBeDefined()
      expect(dashboardData.realTime).toBeDefined()
      expect(dashboardData.trends).toBeDefined()
      expect(dashboardData.alerts).toBeDefined()

      expect(dashboardData.realTime.activeRequests).toBe(2)
      expect(dashboardData.realTime.currentThroughput).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Integration with External Systems', () => {
    it('should send metrics to external monitoring services', () => {
      const mockMetricsService = {
        send: jest.fn(),
      }

      performanceMonitor.configureExternalMonitoring(mockMetricsService)

      performanceMonitor.startRequest('external-test', '/api/test', 'GET')
      performanceMonitor.endRequest('external-test', 200)

      // Should trigger external metrics sending
      performanceMonitor.flushMetrics()

      expect(mockMetricsService.send).toHaveBeenCalled()
    })

    it('should integrate with APM tools', () => {
      const mockAPM = {
        setCustomMetric: jest.fn(),
        addTag: jest.fn(),
        startSpan: jest.fn(),
        finishSpan: jest.fn(),
      }

      performanceMonitor.configureAPMIntegration(mockAPM)

      performanceMonitor.startRequest('apm-test', '/api/test', 'GET')
      performanceMonitor.endRequest('apm-test', 200, {
        provider: 'anthropic',
        charactersProcessed: 100,
      })

      expect(mockAPM.startSpan).toHaveBeenCalled()
      expect(mockAPM.finishSpan).toHaveBeenCalled()
    })
  })
})
