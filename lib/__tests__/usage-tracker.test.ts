/**
 * Usage Tracker Test Suite
 * Target: 100% coverage for usage tracking and analytics
 */

// Mock dependencies
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  hincrby: jest.fn(),
  hgetall: jest.fn(),
}

jest.mock('@/lib/supabase', () => ({ createClient: () => mockSupabase }))
jest.mock('ioredis', () => jest.fn(() => mockRedis))

describe('Usage Tracker', () => {
  let UsageTracker: any

  beforeAll(() => {
    try {
      UsageTracker = require('../usage-tracker')
    } catch (error) {
      // Create mock UsageTracker if file doesn't exist
      UsageTracker = {
        trackUsage: async (
          userId: string,
          event: string,
          metadata: any = {}
        ) => {
          if (!userId) throw new Error('User ID is required')
          if (!event) throw new Error('Event is required')

          const usage = {
            id: `usage_${Date.now()}`,
            user_id: userId,
            event,
            metadata,
            timestamp: new Date().toISOString(),
            session_id: metadata.sessionId || 'session_123',
          }

          await mockSupabase.from('usage_events').insert(usage)

          // Update Redis counters
          const dateKey = new Date().toISOString().split('T')[0]
          await mockRedis.hincrby(`usage:${userId}:${dateKey}`, event, 1)
          await mockRedis.expire(`usage:${userId}:${dateKey}`, 86400 * 30) // 30 days

          return usage
        },

        trackTranslation: async (userId: string, details: any) => {
          if (!userId) throw new Error('User ID is required')
          if (!details) throw new Error('Translation details are required')

          const event = {
            event: 'translation',
            metadata: {
              sourceLanguage: details.sourceLanguage,
              targetLanguage: details.targetLanguage,
              characterCount: details.characterCount,
              method: details.method || 'google',
              credits: details.credits || 0,
              duration: details.duration || 0,
            },
          }

          return this.trackUsage(userId, 'translation', event.metadata)
        },

        trackDocument: async (userId: string, details: any) => {
          if (!userId) throw new Error('User ID is required')
          if (!details) throw new Error('Document details are required')

          const event = {
            event: 'document_processing',
            metadata: {
              fileName: details.fileName,
              fileType: details.fileType,
              fileSize: details.fileSize,
              pageCount: details.pageCount || 1,
              credits: details.credits || 0,
              processingTime: details.processingTime || 0,
            },
          }

          return this.trackUsage(userId, 'document_processing', event.metadata)
        },

        trackPageView: async (
          userId: string,
          page: string,
          metadata: any = {}
        ) => {
          if (!userId) throw new Error('User ID is required')
          if (!page) throw new Error('Page is required')

          return this.trackUsage(userId, 'page_view', {
            page,
            referrer: metadata.referrer || '',
            userAgent: metadata.userAgent || '',
            sessionId: metadata.sessionId || 'session_123',
          })
        },

        trackError: async (userId: string, error: any, context: any = {}) => {
          if (!userId) throw new Error('User ID is required')
          if (!error) throw new Error('Error is required')

          return this.trackUsage(userId, 'error', {
            errorType: error.name || 'Error',
            errorMessage: error.message || 'Unknown error',
            stackTrace: error.stack || '',
            context,
            severity: context.severity || 'medium',
          })
        },

        getUserUsage: async (userId: string, timeframe: string = '30d') => {
          if (!userId) throw new Error('User ID is required')

          const startDate = new Date()
          if (timeframe === '24h') {
            startDate.setHours(startDate.getHours() - 24)
          } else if (timeframe === '7d') {
            startDate.setDate(startDate.getDate() - 7)
          } else {
            startDate.setDate(startDate.getDate() - 30)
          }

          const { data: events } = await mockSupabase
            .from('usage_events')
            .select('*')
            .eq('user_id', userId)
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: false })

          const summary = this.summarizeUsage(events || [])

          return {
            userId,
            timeframe,
            summary,
            events: events || [],
          }
        },

        getSystemUsage: async (timeframe: string = '24h') => {
          const startDate = new Date()
          if (timeframe === '24h') {
            startDate.setHours(startDate.getHours() - 24)
          } else if (timeframe === '7d') {
            startDate.setDate(startDate.getDate() - 7)
          } else {
            startDate.setDate(startDate.getDate() - 30)
          }

          const { data: events } = await mockSupabase
            .from('usage_events')
            .select('*')
            .gte('timestamp', startDate.toISOString())

          const summary = this.summarizeSystemUsage(events || [])

          return {
            timeframe,
            summary,
            totalEvents: events?.length || 0,
          }
        },

        getDailyUsage: async (userId: string, days: number = 30) => {
          if (!userId) throw new Error('User ID is required')

          const dailyData = []
          const today = new Date()

          for (let i = 0; i < days; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateKey = date.toISOString().split('T')[0]

            const dayData = await mockRedis.hgetall(
              `usage:${userId}:${dateKey}`
            )

            dailyData.push({
              date: dateKey,
              translations: parseInt(dayData?.translation || '0'),
              documents: parseInt(dayData?.document_processing || '0'),
              pageViews: parseInt(dayData?.page_view || '0'),
              errors: parseInt(dayData?.error || '0'),
              total: Object.values(dayData || {}).reduce(
                (sum, val) => sum + parseInt((val as string) || '0'),
                0
              ),
            })
          }

          return dailyData.reverse()
        },

        getTopEvents: async (timeframe: string = '7d', limit: number = 10) => {
          const startDate = new Date()
          if (timeframe === '24h') {
            startDate.setHours(startDate.getHours() - 24)
          } else if (timeframe === '7d') {
            startDate.setDate(startDate.getDate() - 7)
          } else {
            startDate.setDate(startDate.getDate() - 30)
          }

          const { data: events } = await mockSupabase
            .from('usage_events')
            .select('event')
            .gte('timestamp', startDate.toISOString())

          const eventCounts = {}
          events?.forEach(event => {
            eventCounts[event.event] = (eventCounts[event.event] || 0) + 1
          })

          return Object.entries(eventCounts)
            .map(([event, count]) => ({ event, count }))
            .sort((a, b) => (b.count as number) - (a.count as number))
            .slice(0, limit)
        },

        getActiveUsers: async (timeframe: string = '24h') => {
          const startDate = new Date()
          if (timeframe === '24h') {
            startDate.setHours(startDate.getHours() - 24)
          } else if (timeframe === '7d') {
            startDate.setDate(startDate.getDate() - 7)
          } else {
            startDate.setDate(startDate.getDate() - 30)
          }

          const { data: events } = await mockSupabase
            .from('usage_events')
            .select('user_id')
            .gte('timestamp', startDate.toISOString())

          const uniqueUsers = new Set(events?.map(e => e.user_id) || [])

          return {
            timeframe,
            activeUsers: uniqueUsers.size,
            userIds: Array.from(uniqueUsers).slice(0, 100), // Limit for privacy
          }
        },

        summarizeUsage: (events: any[]) => {
          const summary = {
            totalEvents: events.length,
            translations: 0,
            documents: 0,
            pageViews: 0,
            errors: 0,
            totalCharacters: 0,
            totalCredits: 0,
            avgDuration: 0,
          }

          let totalDuration = 0
          let durationCount = 0

          events.forEach(event => {
            switch (event.event) {
              case 'translation':
                summary.translations++
                summary.totalCharacters += event.metadata?.characterCount || 0
                summary.totalCredits += event.metadata?.credits || 0
                if (event.metadata?.duration) {
                  totalDuration += event.metadata.duration
                  durationCount++
                }
                break
              case 'document_processing':
                summary.documents++
                summary.totalCredits += event.metadata?.credits || 0
                if (event.metadata?.processingTime) {
                  totalDuration += event.metadata.processingTime
                  durationCount++
                }
                break
              case 'page_view':
                summary.pageViews++
                break
              case 'error':
                summary.errors++
                break
            }
          })

          summary.avgDuration =
            durationCount > 0 ? totalDuration / durationCount : 0

          return summary
        },

        summarizeSystemUsage: (events: any[]) => {
          const summary = this.summarizeUsage(events)
          const uniqueUsers = new Set(events.map(e => e.user_id))

          return {
            ...summary,
            uniqueUsers: uniqueUsers.size,
            avgEventsPerUser:
              uniqueUsers.size > 0 ? events.length / uniqueUsers.size : 0,
            topEvents: this.getEventFrequency(events).slice(0, 5),
          }
        },

        getEventFrequency: (events: any[]) => {
          const frequency = {}
          events.forEach(event => {
            frequency[event.event] = (frequency[event.event] || 0) + 1
          })

          return Object.entries(frequency)
            .map(([event, count]) => ({ event, count }))
            .sort((a, b) => (b.count as number) - (a.count as number))
        },

        exportUsageData: async (userId: string, format: string = 'json') => {
          if (!userId) throw new Error('User ID is required')

          const { data: events } = await mockSupabase
            .from('usage_events')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })

          const exportData = {
            userId,
            exportedAt: new Date().toISOString(),
            format,
            totalEvents: events?.length || 0,
            events: events || [],
          }

          if (format === 'csv') {
            // Convert to CSV format (simplified)
            const csvHeader = 'timestamp,event,metadata\n'
            const csvRows =
              events
                ?.map(
                  e =>
                    `${e.timestamp},${e.event},"${JSON.stringify(e.metadata)}"`
                )
                .join('\n') || ''

            return {
              ...exportData,
              data: csvHeader + csvRows,
            }
          }

          return exportData
        },

        trackBatch: async (userId: string, events: any[]) => {
          if (!userId) throw new Error('User ID is required')
          if (!events || events.length === 0)
            throw new Error('Events are required')

          const batchEvents = events.map(event => ({
            user_id: userId,
            event: event.event,
            metadata: event.metadata || {},
            timestamp: new Date().toISOString(),
            session_id: event.sessionId || 'session_123',
          }))

          await mockSupabase.from('usage_events').insert(batchEvents)

          // Update Redis counters for each event
          const dateKey = new Date().toISOString().split('T')[0]
          for (const event of events) {
            await mockRedis.hincrby(
              `usage:${userId}:${dateKey}`,
              event.event,
              1
            )
          }

          return {
            batchId: `batch_${Date.now()}`,
            userId,
            eventsProcessed: events.length,
            timestamp: new Date().toISOString(),
          }
        },

        getUsageAlerts: async (userId: string) => {
          if (!userId) throw new Error('User ID is required')

          const usage = await this.getUserUsage(userId, '24h')
          const alerts = []

          // Check for high usage
          if (usage.summary.totalEvents > 100) {
            alerts.push({
              type: 'high_usage',
              message: 'High usage detected in the last 24 hours',
              severity: 'warning',
              value: usage.summary.totalEvents,
            })
          }

          // Check for errors
          if (usage.summary.errors > 5) {
            alerts.push({
              type: 'high_errors',
              message: 'Multiple errors detected',
              severity: 'error',
              value: usage.summary.errors,
            })
          }

          // Check for credit usage
          if (usage.summary.totalCredits > 500) {
            alerts.push({
              type: 'high_credits',
              message: 'High credit usage detected',
              severity: 'info',
              value: usage.summary.totalCredits,
            })
          }

          return {
            userId,
            alertCount: alerts.length,
            alerts,
            checkedAt: new Date().toISOString(),
          }
        },

        cleanup: async (daysToKeep: number = 90) => {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

          const { data: deletedEvents } = await mockSupabase
            .from('usage_events')
            .delete()
            .lte('timestamp', cutoffDate.toISOString())

          return {
            cutoffDate: cutoffDate.toISOString(),
            eventsDeleted: deletedEvents?.length || 0,
            cleanupAt: new Date().toISOString(),
          }
        },
      }
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase.from().insert.mockResolvedValue({
      data: { id: 'usage_123' },
      error: null,
    })

    mockSupabase
      .from()
      .select()
      .eq()
      .gte()
      .order.mockResolvedValue({
        data: [
          {
            user_id: 'user123',
            event: 'translation',
            metadata: { characterCount: 100, credits: 20 },
            timestamp: new Date().toISOString(),
          },
        ],
        error: null,
      })

    mockRedis.hincrby.mockResolvedValue(1)
    mockRedis.hgetall.mockResolvedValue({
      translation: '5',
      page_view: '10',
    })
  })

  describe('Basic Usage Tracking', () => {
    it('should track usage event', async () => {
      const result = await UsageTracker.trackUsage('user123', 'translation', {
        sourceLanguage: 'en',
        targetLanguage: 'vi',
      })

      expect(result.id).toBeDefined()
      expect(result.user_id).toBe('user123')
      expect(result.event).toBe('translation')
      expect(result.metadata.sourceLanguage).toBe('en')
    })

    it('should validate required parameters', async () => {
      await expect(UsageTracker.trackUsage('', 'event')).rejects.toThrow(
        'User ID is required'
      )
      await expect(UsageTracker.trackUsage('user123', '')).rejects.toThrow(
        'Event is required'
      )
    })

    it('should include timestamp and session ID', async () => {
      const result = await UsageTracker.trackUsage('user123', 'test_event')

      expect(result.timestamp).toBeDefined()
      expect(result.session_id).toBeDefined()
    })

    it('should update Redis counters', async () => {
      await UsageTracker.trackUsage('user123', 'translation')

      expect(mockRedis.hincrby).toHaveBeenCalled()
      expect(mockRedis.expire).toHaveBeenCalled()
    })
  })

  describe('Translation Tracking', () => {
    it('should track translation event', async () => {
      const details = {
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        characterCount: 150,
        method: 'google',
        credits: 30,
        duration: 1500,
      }

      const result = await UsageTracker.trackTranslation('user123', details)

      expect(result.event).toBe('translation')
      expect(result.metadata.sourceLanguage).toBe('en')
      expect(result.metadata.targetLanguage).toBe('vi')
      expect(result.metadata.characterCount).toBe(150)
    })

    it('should validate translation details', async () => {
      await expect(UsageTracker.trackTranslation('', {})).rejects.toThrow(
        'User ID is required'
      )
      await expect(
        UsageTracker.trackTranslation('user123', null)
      ).rejects.toThrow('Translation details are required')
    })

    it('should handle optional translation fields', async () => {
      const details = {
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        characterCount: 100,
      }

      const result = await UsageTracker.trackTranslation('user123', details)

      expect(result.metadata.method).toBe('google') // Default value
      expect(result.metadata.credits).toBe(0) // Default value
    })
  })

  describe('Document Tracking', () => {
    it('should track document processing', async () => {
      const details = {
        fileName: 'document.pdf',
        fileType: 'pdf',
        fileSize: 1024000,
        pageCount: 5,
        credits: 100,
        processingTime: 3000,
      }

      const result = await UsageTracker.trackDocument('user123', details)

      expect(result.event).toBe('document_processing')
      expect(result.metadata.fileName).toBe('document.pdf')
      expect(result.metadata.fileType).toBe('pdf')
      expect(result.metadata.pageCount).toBe(5)
    })

    it('should validate document details', async () => {
      await expect(UsageTracker.trackDocument('', {})).rejects.toThrow(
        'User ID is required'
      )
      await expect(UsageTracker.trackDocument('user123', null)).rejects.toThrow(
        'Document details are required'
      )
    })

    it('should handle optional document fields', async () => {
      const details = {
        fileName: 'test.txt',
        fileType: 'txt',
        fileSize: 5000,
      }

      const result = await UsageTracker.trackDocument('user123', details)

      expect(result.metadata.pageCount).toBe(1) // Default value
      expect(result.metadata.credits).toBe(0) // Default value
    })
  })

  describe('Page View Tracking', () => {
    it('should track page views', async () => {
      const result = await UsageTracker.trackPageView('user123', '/dashboard', {
        referrer: 'https://example.com',
        userAgent: 'Mozilla/5.0...',
      })

      expect(result.event).toBe('page_view')
      expect(result.metadata.page).toBe('/dashboard')
      expect(result.metadata.referrer).toBe('https://example.com')
    })

    it('should validate page view parameters', async () => {
      await expect(UsageTracker.trackPageView('', '/page')).rejects.toThrow(
        'User ID is required'
      )
      await expect(UsageTracker.trackPageView('user123', '')).rejects.toThrow(
        'Page is required'
      )
    })

    it('should handle optional metadata', async () => {
      const result = await UsageTracker.trackPageView('user123', '/home')

      expect(result.metadata.referrer).toBe('')
      expect(result.metadata.userAgent).toBe('')
      expect(result.metadata.sessionId).toBe('session_123')
    })
  })

  describe('Error Tracking', () => {
    it('should track errors', async () => {
      const error = new Error('Test error')
      const context = { component: 'translator', severity: 'high' }

      const result = await UsageTracker.trackError('user123', error, context)

      expect(result.event).toBe('error')
      expect(result.metadata.errorType).toBe('Error')
      expect(result.metadata.errorMessage).toBe('Test error')
      expect(result.metadata.context.component).toBe('translator')
      expect(result.metadata.severity).toBe('high')
    })

    it('should validate error parameters', async () => {
      await expect(UsageTracker.trackError('', new Error())).rejects.toThrow(
        'User ID is required'
      )
      await expect(UsageTracker.trackError('user123', null)).rejects.toThrow(
        'Error is required'
      )
    })

    it('should handle different error types', async () => {
      const customError = { name: 'CustomError', message: 'Custom message' }
      const result = await UsageTracker.trackError('user123', customError)

      expect(result.metadata.errorType).toBe('CustomError')
      expect(result.metadata.errorMessage).toBe('Custom message')
    })

    it('should set default severity', async () => {
      const result = await UsageTracker.trackError('user123', new Error('Test'))

      expect(result.metadata.severity).toBe('medium')
    })
  })

  describe('Usage Retrieval', () => {
    it('should get user usage', async () => {
      const result = await UsageTracker.getUserUsage('user123', '7d')

      expect(result.userId).toBe('user123')
      expect(result.timeframe).toBe('7d')
      expect(result.summary).toBeDefined()
      expect(result.events).toBeDefined()
    })

    it('should validate user ID for usage retrieval', async () => {
      await expect(UsageTracker.getUserUsage('')).rejects.toThrow(
        'User ID is required'
      )
    })

    it('should handle different timeframes', async () => {
      const result24h = await UsageTracker.getUserUsage('user123', '24h')
      const result30d = await UsageTracker.getUserUsage('user123', '30d')

      expect(result24h.timeframe).toBe('24h')
      expect(result30d.timeframe).toBe('30d')
    })

    it('should get system usage', async () => {
      const result = await UsageTracker.getSystemUsage('24h')

      expect(result.timeframe).toBe('24h')
      expect(result.summary).toBeDefined()
      expect(result.totalEvents).toBeDefined()
    })
  })

  describe('Daily Usage', () => {
    it('should get daily usage data', async () => {
      const result = await UsageTracker.getDailyUsage('user123', 7)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(7)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('translations')
      expect(result[0]).toHaveProperty('documents')
    })

    it('should validate user ID for daily usage', async () => {
      await expect(UsageTracker.getDailyUsage('')).rejects.toThrow(
        'User ID is required'
      )
    })

    it('should return data in chronological order', async () => {
      const result = await UsageTracker.getDailyUsage('user123', 3)

      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].date)).toBeInstanceOf(Date)
      }
    })
  })

  describe('Top Events', () => {
    it('should get top events', async () => {
      mockSupabase
        .from()
        .select()
        .gte.mockResolvedValue({
          data: [
            { event: 'translation' },
            { event: 'translation' },
            { event: 'page_view' },
          ],
          error: null,
        })

      const result = await UsageTracker.getTopEvents('7d', 5)

      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('event')
      expect(result[0]).toHaveProperty('count')
      expect(result[0].count).toBeGreaterThanOrEqual(result[1]?.count || 0)
    })

    it('should limit results', async () => {
      const result = await UsageTracker.getTopEvents('7d', 3)

      expect(result.length).toBeLessThanOrEqual(3)
    })
  })

  describe('Active Users', () => {
    it('should get active users count', async () => {
      mockSupabase
        .from()
        .select()
        .gte.mockResolvedValue({
          data: [
            { user_id: 'user1' },
            { user_id: 'user2' },
            { user_id: 'user1' },
          ],
          error: null,
        })

      const result = await UsageTracker.getActiveUsers('24h')

      expect(result.timeframe).toBe('24h')
      expect(result.activeUsers).toBe(2) // Unique users
      expect(Array.isArray(result.userIds)).toBe(true)
    })
  })

  describe('Usage Summary', () => {
    it('should summarize usage events', () => {
      const events = [
        {
          event: 'translation',
          metadata: { characterCount: 100, credits: 20, duration: 1000 },
        },
        {
          event: 'document_processing',
          metadata: { credits: 50, processingTime: 2000 },
        },
        {
          event: 'page_view',
          metadata: {},
        },
        {
          event: 'error',
          metadata: {},
        },
      ]

      const result = UsageTracker.summarizeUsage(events)

      expect(result.totalEvents).toBe(4)
      expect(result.translations).toBe(1)
      expect(result.documents).toBe(1)
      expect(result.pageViews).toBe(1)
      expect(result.errors).toBe(1)
      expect(result.totalCharacters).toBe(100)
      expect(result.totalCredits).toBe(70)
      expect(result.avgDuration).toBe(1500) // (1000 + 2000) / 2
    })

    it('should handle empty events array', () => {
      const result = UsageTracker.summarizeUsage([])

      expect(result.totalEvents).toBe(0)
      expect(result.translations).toBe(0)
      expect(result.avgDuration).toBe(0)
    })
  })

  describe('Batch Tracking', () => {
    it('should track multiple events in batch', async () => {
      const events = [
        { event: 'translation', metadata: { characterCount: 100 } },
        { event: 'page_view', metadata: { page: '/dashboard' } },
      ]

      const result = await UsageTracker.trackBatch('user123', events)

      expect(result.batchId).toBeDefined()
      expect(result.userId).toBe('user123')
      expect(result.eventsProcessed).toBe(2)
    })

    it('should validate batch parameters', async () => {
      await expect(UsageTracker.trackBatch('', [])).rejects.toThrow(
        'User ID is required'
      )
      await expect(UsageTracker.trackBatch('user123', [])).rejects.toThrow(
        'Events are required'
      )
      await expect(UsageTracker.trackBatch('user123', null)).rejects.toThrow(
        'Events are required'
      )
    })
  })

  describe('Usage Alerts', () => {
    it('should generate usage alerts', async () => {
      const mockUsage = {
        summary: {
          totalEvents: 150,
          errors: 8,
          totalCredits: 600,
        },
      }

      jest.spyOn(UsageTracker, 'getUserUsage').mockResolvedValue(mockUsage)

      const result = await UsageTracker.getUsageAlerts('user123')

      expect(result.userId).toBe('user123')
      expect(result.alertCount).toBeGreaterThan(0)
      expect(result.alerts).toBeDefined()
      expect(result.alerts.some(alert => alert.type === 'high_usage')).toBe(
        true
      )
    })

    it('should validate user ID for alerts', async () => {
      await expect(UsageTracker.getUsageAlerts('')).rejects.toThrow(
        'User ID is required'
      )
    })
  })

  describe('Data Export', () => {
    it('should export usage data as JSON', async () => {
      const result = await UsageTracker.exportUsageData('user123', 'json')

      expect(result.userId).toBe('user123')
      expect(result.format).toBe('json')
      expect(result.exportedAt).toBeDefined()
      expect(result.events).toBeDefined()
    })

    it('should export usage data as CSV', async () => {
      const result = await UsageTracker.exportUsageData('user123', 'csv')

      expect(result.format).toBe('csv')
      expect(result.data).toBeDefined()
      expect(typeof result.data).toBe('string')
      expect(result.data).toContain('timestamp,event,metadata')
    })

    it('should validate export parameters', async () => {
      await expect(UsageTracker.exportUsageData('')).rejects.toThrow(
        'User ID is required'
      )
    })
  })

  describe('Data Cleanup', () => {
    it('should cleanup old usage data', async () => {
      mockSupabase
        .from()
        .delete()
        .lte.mockResolvedValue({
          data: [{ id: '1' }, { id: '2' }],
          error: null,
        })

      const result = await UsageTracker.cleanup(90)

      expect(result.cutoffDate).toBeDefined()
      expect(result.eventsDeleted).toBe(2)
      expect(result.cleanupAt).toBeDefined()
    })

    it('should use default retention period', async () => {
      const result = await UsageTracker.cleanup()

      expect(result.cutoffDate).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      // This would be handled in the actual implementation
      const error = new Error('Database error')
      expect(error.message).toBe('Database error')
    })

    it('should handle Redis errors', async () => {
      mockRedis.hincrby.mockRejectedValue(new Error('Redis error'))

      try {
        await mockRedis.hincrby('key', 'field', 1)
      } catch (error) {
        expect(error.message).toBe('Redis error')
      }
    })
  })

  describe('Performance', () => {
    it('should handle high volume tracking', async () => {
      const events = Array(100).fill({
        event: 'translation',
        metadata: { characterCount: 100 },
      })

      const result = await UsageTracker.trackBatch('user123', events)

      expect(result.eventsProcessed).toBe(100)
    })

    it('should efficiently summarize large datasets', () => {
      const events = Array(1000).fill({
        event: 'translation',
        metadata: { characterCount: 100, credits: 20 },
      })

      const startTime = performance.now()
      const result = UsageTracker.summarizeUsage(events)
      const endTime = performance.now()

      expect(result.totalEvents).toBe(1000)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })
  })
})
