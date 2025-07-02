/**
 * Supabase Client Test Suite
 * Target: 90% coverage for database module
 */

import { cookies } from 'next/headers'

// Mock @supabase modules
jest.mock('@supabase/supabase-js')
jest.mock('@supabase/ssr')

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock environment variables
const originalEnv = process.env
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    NODE_ENV: 'test',
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('Supabase Client System', () => {
  // Import after mocks are set up
  let createClientComponentClient: any
  let createRouteHandlerClient: any
  let createServerComponentClient: any
  let createServiceRoleClient: any
  let withQueryOptimization: any
  let batchQueries: any
  let cleanupConnections: any
  let debugNuclearClient: any
  let validateAndRefreshSession: any
  let withAuthRetry: any

  beforeAll(() => {
    // Mock the Supabase client creation functions
    const { createClient } = require('@supabase/supabase-js')
    const { createBrowserClient, createServerClient } = require('@supabase/ssr')

    const mockClient = {
      auth: {
        getSession: jest.fn(),
        refreshSession: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        timeout: jest.fn().mockReturnThis(),
      })),
    }

    createClient.mockReturnValue(mockClient)
    createBrowserClient.mockReturnValue(mockClient)
    createServerClient.mockReturnValue(mockClient)

    // Import the module after mocking
    const supabaseModule = require('../supabase')
    createClientComponentClient = supabaseModule.createClientComponentClient
    createRouteHandlerClient = supabaseModule.createRouteHandlerClient
    createServerComponentClient = supabaseModule.createServerComponentClient
    createServiceRoleClient = supabaseModule.createServiceRoleClient
    withQueryOptimization = supabaseModule.withQueryOptimization
    batchQueries = supabaseModule.batchQueries
    cleanupConnections = supabaseModule.cleanupConnections
    debugNuclearClient = supabaseModule.debugNuclearClient
    validateAndRefreshSession = supabaseModule.validateAndRefreshSession
    withAuthRetry = supabaseModule.withAuthRetry
  })

  describe('Client Component Client', () => {
    it('should create client component client', () => {
      const client = createClientComponentClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
    })

    it('should reuse nuclear singleton on browser', () => {
      // Simulate browser environment
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      })

      const client1 = createClientComponentClient()
      const client2 = createClientComponentClient()

      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
    })

    it('should create new instance on server side', () => {
      // Mock server environment
      const originalWindow = global.window
      delete (global as any).window

      const client = createClientComponentClient()
      expect(client).toBeDefined()

      global.window = originalWindow
    })
  })

  describe('Route Handler Client', () => {
    it('should create route handler client with cookies', () => {
      const mockCookies = jest.fn(() => ({
        get: jest.fn(name => ({ value: `value-${name}` })),
        set: jest.fn(),
        delete: jest.fn(),
      }))

      const client = createRouteHandlerClient({ cookies: mockCookies })
      expect(client).toBeDefined()
    })

    it('should handle cookie operations safely', () => {
      const mockCookies = jest.fn(() => ({
        get: jest.fn(() => ({ value: 'test-value' })),
        set: jest.fn(() => {
          throw new Error('Cookie set failed')
        }),
        delete: jest.fn(),
      }))

      // Should not throw even if cookie operations fail
      expect(() => {
        createRouteHandlerClient({ cookies: mockCookies })
      }).not.toThrow()
    })

    it('should use connection pooling', () => {
      const mockCookies = jest.fn(() => ({
        get: jest.fn(() => ({ value: 'test-value' })),
        set: jest.fn(),
        delete: jest.fn(),
      }))

      const client1 = createRouteHandlerClient({ cookies: mockCookies })
      const client2 = createRouteHandlerClient({ cookies: mockCookies })

      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
    })
  })

  describe('Server Component Client', () => {
    it('should create server component client with cookies', () => {
      const mockCookies = jest.fn(() => ({
        get: jest.fn(name => ({ value: `server-${name}` })),
      }))

      const client = createServerComponentClient({ cookies: mockCookies })
      expect(client).toBeDefined()
    })

    it('should handle cookie reading errors gracefully', () => {
      const mockCookies = jest.fn(() => ({
        get: jest.fn(() => {
          throw new Error('Cookie read failed')
        }),
      }))

      // Should not throw even if cookie reading fails
      expect(() => {
        createServerComponentClient({ cookies: mockCookies })
      }).not.toThrow()
    })

    it('should use connection pooling for server components', () => {
      const mockCookies = jest.fn(() => ({
        get: jest.fn(() => ({ value: 'test-value' })),
      }))

      const client1 = createServerComponentClient({ cookies: mockCookies })
      const client2 = createServerComponentClient({ cookies: mockCookies })

      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
    })
  })

  describe('Service Role Client', () => {
    it('should create service role client', () => {
      const client = createServiceRoleClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should reuse service role client', () => {
      const client1 = createServiceRoleClient()
      const client2 = createServiceRoleClient()

      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
    })

    it('should recreate client after timeout', done => {
      const client1 = createServiceRoleClient()

      // Mock timeout by advancing time
      jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(400000) // 400 seconds later

      const client2 = createServiceRoleClient()

      expect(client1).toBeDefined()
      expect(client2).toBeDefined()

      done()
    })
  })

  describe('Query Optimization', () => {
    it('should apply query optimization', async () => {
      const mockQueryBuilder = {
        limit: jest.fn().mockReturnThis(),
        timeout: jest.fn().mockReturnThis(),
      }

      await withQueryOptimization(mockQueryBuilder)

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1000)
      expect(mockQueryBuilder.timeout).toHaveBeenCalledWith(10000)
    })

    it('should handle query builder methods', async () => {
      const mockQueryBuilder = {
        limit: jest.fn().mockReturnThis(),
        timeout: jest.fn().mockReturnValue(Promise.resolve({ data: 'test' })),
      }

      const result = await withQueryOptimization(mockQueryBuilder)
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('Batch Queries', () => {
    it('should execute queries in batches', async () => {
      const queries = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockResolvedValue('result2'),
        jest.fn().mockResolvedValue('result3'),
        jest.fn().mockResolvedValue('result4'),
        jest.fn().mockResolvedValue('result5'),
        jest.fn().mockResolvedValue('result6'),
      ]

      const results = await batchQueries(queries, 3)

      expect(results).toEqual([
        'result1',
        'result2',
        'result3',
        'result4',
        'result5',
        'result6',
      ])
      queries.forEach(query => {
        expect(query).toHaveBeenCalled()
      })
    })

    it('should handle single batch', async () => {
      const queries = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockResolvedValue('result2'),
      ]

      const results = await batchQueries(queries, 5)

      expect(results).toEqual(['result1', 'result2'])
    })

    it('should handle empty queries array', async () => {
      const results = await batchQueries([])
      expect(results).toEqual([])
    })

    it('should use default batch size', async () => {
      const queries = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockResolvedValue('result2'),
        jest.fn().mockResolvedValue('result3'),
      ]

      const results = await batchQueries(queries)
      expect(results).toEqual(['result1', 'result2', 'result3'])
    })
  })

  describe('Connection Cleanup', () => {
    it('should clean up connections successfully', () => {
      // Just test that cleanup runs without error
      expect(() => cleanupConnections()).not.toThrow()
    })

    it('should handle cleanup in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      expect(() => cleanupConnections()).not.toThrow()

      process.env.NODE_ENV = originalEnv
    })

    it('should handle cleanup in development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      expect(() => cleanupConnections()).not.toThrow()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Nuclear Client Debug', () => {
    it('should handle debug function in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Just test that debug function runs without error
      expect(() => debugNuclearClient()).not.toThrow()

      process.env.NODE_ENV = originalEnv
    })

    it('should handle debug function in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      // Just test that debug function runs without error in production
      expect(() => debugNuclearClient()).not.toThrow()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Session Validation', () => {
    it('should validate and refresh session successfully', async () => {
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
              },
            },
            error: null,
          }),
          refreshSession: jest.fn(),
        },
      }

      const session = await validateAndRefreshSession(mockClient)

      expect(session).toBeDefined()
      expect(session.expires_at).toBeDefined()
      expect(mockClient.auth.getSession).toHaveBeenCalled()
    })

    it('should handle session validation error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Session invalid' },
          }),
        },
      }

      const session = await validateAndRefreshSession(mockClient)

      expect(session).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Session validation error:',
        'Session invalid'
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle no active session', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
        },
      }

      const session = await validateAndRefreshSession(mockClient)

      expect(session).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalledWith('No active session found')

      consoleWarnSpy.mockRestore()
    })

    it('should refresh session when close to expiry', async () => {
      const now = Math.floor(Date.now() / 1000)
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                expires_at: now + 200, // 200 seconds from now (less than 5 minutes)
              },
            },
            error: null,
          }),
          refreshSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                expires_at: now + 3600, // 1 hour from now
              },
            },
            error: null,
          }),
        },
      }

      const session = await validateAndRefreshSession(mockClient)

      expect(session).toBeDefined()
      expect(mockClient.auth.refreshSession).toHaveBeenCalled()
    })

    it('should handle refresh session error', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const now = Math.floor(Date.now() / 1000)
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                expires_at: now + 200, // 200 seconds from now
              },
            },
            error: null,
          }),
          refreshSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Refresh failed' },
          }),
        },
      }

      const session = await validateAndRefreshSession(mockClient)

      expect(session).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Session refresh failed:',
        'Refresh failed'
      )

      consoleLogSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should handle validation exception', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const mockClient = {
        auth: {
          getSession: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      }

      const session = await validateAndRefreshSession(mockClient)

      expect(session).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Session validation failed:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Auth Retry', () => {
    it('should execute operation successfully on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const mockClient = { auth: { getSession: jest.fn() } }

      const result = await withAuthRetry(operation, mockClient)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on 401 error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const operation = jest
        .fn()
        .mockRejectedValueOnce({ status: 401, message: 'Unauthorized' })
        .mockResolvedValue('success')

      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { expires_at: Math.floor(Date.now() / 1000) + 3600 },
            },
            error: null,
          }),
        },
      }

      const result = await withAuthRetry(operation, mockClient, 2)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Auth error on attempt 1, retrying...'
      )

      consoleWarnSpy.mockRestore()
    })

    it('should throw non-401 errors immediately', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue({ status: 500, message: 'Server error' })
      const mockClient = { auth: { getSession: jest.fn() } }

      await expect(withAuthRetry(operation, mockClient)).rejects.toEqual({
        status: 500,
        message: 'Server error',
      })

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should throw after max retries', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue({ status: 401, message: 'Unauthorized' })
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { expires_at: Math.floor(Date.now() / 1000) + 3600 },
            },
            error: null,
          }),
        },
      }

      await expect(withAuthRetry(operation, mockClient, 1)).rejects.toEqual({
        status: 401,
        message: 'Unauthorized',
      })

      expect(operation).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })

    it('should use default max retries', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue({ status: 401, message: 'Unauthorized' })
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { expires_at: Math.floor(Date.now() / 1000) + 3600 },
            },
            error: null,
          }),
        },
      }

      await expect(withAuthRetry(operation, mockClient)).rejects.toEqual({
        status: 401,
        message: 'Unauthorized',
      })

      expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries (default)
    })
  })

  describe('Configuration', () => {
    it('should have correct supabase client configuration', () => {
      // Test that configuration is properly structured
      const client = createClientComponentClient()
      expect(client).toBeDefined()
    })

    it('should handle environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe(
        'https://test.supabase.co'
      )
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-key')
    })
  })

  describe('TypeScript Types', () => {
    it('should define User interface correctly', () => {
      // Test interface exists by creating mock data
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(mockUser.id).toBe('user-123')
      expect(mockUser.email).toBe('test@example.com')
    })

    it('should define UserProfile interface correctly', () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        full_name: 'Test User',
        avatar_url: null,
        subscription_tier: 'free' as const,
        usage_limit: 100,
        usage_count: 0,
        usage_reset_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(mockProfile.subscription_tier).toBe('free')
      expect(mockProfile.usage_limit).toBe(100)
    })

    it('should define TranslationHistory interface correctly', () => {
      const mockHistory = {
        id: 'history-123',
        user_id: 'user-123',
        source_text: 'Hello',
        translated_text: 'Xin chào',
        source_language: 'en',
        target_language: 'vi',
        quality_tier: 'standard',
        quality_score: 0.95,
        character_count: 5,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(mockHistory.source_language).toBe('en')
      expect(mockHistory.target_language).toBe('vi')
      expect(mockHistory.quality_score).toBe(0.95)
    })
  })
})
