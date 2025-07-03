/**
 * ===============================================
 * API ROUTE TEST: /api/credits/me
 * Vitest + Mock API Testing
 * ===============================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/credits/me/route'

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
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}))

describe('API Route: /api/credits/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  // ==========================================
  // TEST 1: Successful Credits Fetch
  // ==========================================
  it('returns user credits when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockCredits = {
      credits_left: 100,
      credits_used: 50,
      tier: 'premium',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    }

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

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.credits).toEqual({
      credits_left: 100,
      credits_used: 50,
      tier: 'premium',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    })
  })

  // ==========================================
  // TEST 2: Unauthorized Access
  // ==========================================
  it('returns 401 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  // ==========================================
  // TEST 3: Auth Error Handling
  // ==========================================
  it('returns 401 when auth error occurs', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    })

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  // ==========================================
  // TEST 4: Credits Not Found (New User)
  // ==========================================
  it('returns 404 when credits not found for new user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Credits not found. Please try logging out and back in.')
  })

  // ==========================================
  // TEST 5: Database Error
  // ==========================================
  it('returns 500 when database error occurs', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database connection failed' },
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch credits')
  })

  // ==========================================
  // TEST 6: Unexpected Error Handling
  // ==========================================
  it('handles unexpected errors gracefully', async () => {
    mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  // ==========================================
  // TEST 7: Supabase Client Creation
  // ==========================================
  it('creates Supabase client with correct configuration', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { credits_left: 100 },
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    await GET(request)

    const { createServerClient } = await import('@supabase/ssr')
    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          get: expect.any(Function),
          set: expect.any(Function),
          remove: expect.any(Function),
        }),
      })
    )
  })

  // ==========================================
  // TEST 8: RLS Query Validation
  // ==========================================
  it('queries credits with correct user_id filter', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({
      data: { credits_left: 100 },
      error: null,
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    })

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    await GET(request)

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_credits')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockSingle).toHaveBeenCalled()
  })

  // ==========================================
  // TEST 9: Data Sanitization
  // ==========================================
  it('only returns expected credit fields', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockCredits = {
      credits_left: 100,
      credits_used: 50,
      tier: 'premium',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
      // These should not be included in response
      id: 'credit-id',
      user_id: 'user-123',
      secret_field: 'should-not-appear',
    }

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

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    const response = await GET(request)
    const data = await response.json()

    expect(data.credits).toEqual({
      credits_left: 100,
      credits_used: 50,
      tier: 'premium',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    })

    // Should not include these fields
    expect(data.credits.id).toBeUndefined()
    expect(data.credits.user_id).toBeUndefined()
    expect(data.credits.secret_field).toBeUndefined()
  })

  // ==========================================
  // TEST 10: Error Logging
  // ==========================================
  it('logs errors appropriately', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/credits/me')
    await GET(request)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching user credits:',
      expect.objectContaining({
        code: 'PGRST500',
        message: 'Database error',
      })
    )

    consoleSpy.mockRestore()
  })
})