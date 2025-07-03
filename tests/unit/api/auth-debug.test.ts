/**
 * ===============================================
 * API ROUTE TEST: /api/auth/debug
 * Vitest + Mock API Testing
 * ===============================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/debug/route'

// Mock Next.js cookies
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: () => mockCookies,
}))

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}))

describe('API Route: /api/auth/debug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  // ==========================================
  // TEST 1: Successful Debug Info - Authenticated User
  // ==========================================
  it('returns complete debug info for authenticated user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: { provider: 'google' },
    }

    const mockSession = {
      access_token: 'mock-access-token',
      user: mockUser,
    }

    const mockCredits = {
      id: 'credit-1',
      user_id: 'user-123',
      credits_left: 100,
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCredits,
        error: null,
      }),
    })

    mockCookies.get.mockImplementation((name: string) => {
      if (name === 'sb-access-token') return { value: 'mock-access-token' }
      if (name === 'sb-refresh-token') return { value: 'mock-refresh-token' }
      return undefined
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.timestamp).toBeDefined()
    
    expect(data.auth).toEqual({
      hasSession: true,
      hasUser: true,
      sessionError: undefined,
      userError: undefined,
      userId: 'user-123',
      userEmail: 'test@example.com',
      provider: 'google',
    })

    expect(data.cookies).toEqual({
      hasAccessToken: true,
      hasRefreshToken: true,
    })

    expect(data.credits).toEqual({
      exists: true,
      data: mockCredits,
    })

    expect(data.environment).toEqual({
      supabaseUrl: 'https://test.supabase.co...',
      hasAnonKey: true,
      hasServiceKey: true,
    })
  })

  // ==========================================
  // TEST 2: Unauthenticated User
  // ==========================================
  it('returns debug info for unauthenticated user', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    mockCookies.get.mockReturnValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    
    expect(data.auth).toEqual({
      hasSession: false,
      hasUser: false,
      sessionError: undefined,
      userError: undefined,
      userId: undefined,
      userEmail: undefined,
      provider: undefined,
    })

    expect(data.cookies).toEqual({
      hasAccessToken: false,
      hasRefreshToken: false,
    })

    expect(data.credits).toEqual({
      exists: false,
      data: null,
    })
  })

  // ==========================================
  // TEST 3: Session Error Handling
  // ==========================================
  it('handles session errors gracefully', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid session' },
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.auth.sessionError).toBe('Invalid session')
    expect(data.auth.hasSession).toBe(false)
  })

  // ==========================================
  // TEST 4: User Error Handling
  // ==========================================
  it('handles user errors gracefully', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.auth.userError).toBe('Token expired')
    expect(data.auth.hasUser).toBe(false)
  })

  // ==========================================
  // TEST 5: Credits Error Handling
  // ==========================================
  it('handles credits fetch errors gracefully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.credits.exists).toBe(false)
    expect(data.credits.data).toBe(null)
  })

  // ==========================================
  // TEST 6: Environment Variable Truncation
  // ==========================================
  it('truncates Supabase URL for security', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://very-long-supabase-url-that-should-be-truncated.supabase.co'

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(data.environment.supabaseUrl).toBe('https://very-long-supabase-url-...')
    expect(data.environment.supabaseUrl.length).toBe(33) // 30 chars + '...'
  })

  // ==========================================
  // TEST 7: Missing Environment Variables
  // ==========================================
  it('handles missing environment variables', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(data.environment.hasAnonKey).toBe(false)
    expect(data.environment.hasServiceKey).toBe(false)
  })

  // ==========================================
  // TEST 8: Unexpected Error Handling
  // ==========================================
  it('handles unexpected errors gracefully', async () => {
    mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Network error')
    expect(data.timestamp).toBeDefined()
  })

  // ==========================================
  // TEST 9: Cookie Handling
  // ==========================================
  it('correctly checks for auth cookies', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    // Mock partial cookie presence
    mockCookies.get.mockImplementation((name: string) => {
      if (name === 'sb-access-token') return { value: 'token-value' }
      if (name === 'sb-refresh-token') return undefined
      return undefined
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(data.cookies).toEqual({
      hasAccessToken: true,
      hasRefreshToken: false,
    })
  })

  // ==========================================
  // TEST 10: Data Sanitization
  // ==========================================
  it('does not expose sensitive data', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: { provider: 'google' },
    }

    const mockSession = {
      access_token: 'sensitive-access-token',
      refresh_token: 'sensitive-refresh-token',
      user: mockUser,
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    const dataStr = JSON.stringify(data)

    // Should not expose sensitive tokens
    expect(dataStr).not.toContain('sensitive-access-token')
    expect(dataStr).not.toContain('sensitive-refresh-token')
    expect(dataStr).not.toContain('test-service-key')
    expect(dataStr).not.toContain('test-anon-key')
  })

  // ==========================================
  // TEST 11: Timestamp Validation
  // ==========================================
  it('includes valid ISO timestamp', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    const response = await GET(request)
    const data = await response.json()

    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
  })

  // ==========================================
  // TEST 12: Error Logging
  // ==========================================
  it('logs errors appropriately', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Test error'))

    const request = new NextRequest('http://localhost:3000/api/auth/debug')
    await GET(request)

    expect(consoleSpy).toHaveBeenCalledWith('Auth debug error:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})