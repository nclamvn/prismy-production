/**
 * Authentication Test Suite
 * Tests for lib/auth.ts - Admin checking functionality
 * Target: 90%+ coverage with comprehensive edge cases
 */

import { cookies } from 'next/headers'
import { checkAdmin } from '../auth'

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  }
}

jest.mock('@/lib/supabase', () => ({
  createServerComponentClient: jest.fn(() => mockSupabaseClient)
}))

describe('Authentication System', () => {
  const mockCookies = cookies as jest.MockedFunction<typeof cookies>

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ADMIN_EMAILS = 'admin@prismy.com,manager@prismy.com'
  })

  afterEach(() => {
    delete process.env.ADMIN_EMAILS
  })

  describe('checkAdmin Function', () => {
    it('should return admin status for valid admin email', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'admin-user-123',
              email: 'admin@prismy.com'
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(true)
      expect(result.userId).toBe('admin-user-123')
    })

    it('should return non-admin status for regular user email', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'regular-user-123',
              email: 'user@example.com'
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBe('regular-user-123')
    })

    it('should handle multiple admin emails', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'manager-user-123',
              email: 'manager@prismy.com'
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(true)
      expect(result.userId).toBe('manager-user-123')
    })

    it('should handle no session', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBeNull()
    })

    it('should handle auth error', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Authentication failed' }
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBeNull()
    })

    it('should handle missing ADMIN_EMAILS environment variable', async () => {
      delete process.env.ADMIN_EMAILS
      
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'admin@prismy.com'
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBe('user-123')
    })

    it('should handle empty ADMIN_EMAILS environment variable', async () => {
      process.env.ADMIN_EMAILS = ''
      
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'admin@prismy.com'
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBe('user-123')
    })

    it('should handle missing user email', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: null
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBe('user-123')
    })

    it('should handle undefined user email', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123'
              // email is undefined
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBe('user-123')
    })

    it('should handle case sensitivity in email comparison', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'ADMIN@PRISMY.COM' // Uppercase
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      // Should not match due to case sensitivity
      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBe('user-123')
    })

    it('should handle whitespace in admin emails configuration', async () => {
      process.env.ADMIN_EMAILS = ' admin@prismy.com , manager@prismy.com '
      
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'admin@prismy.com'
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      // Should not match due to whitespace unless trimmed
      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBe('user-123')
    })

    it('should handle exception during auth check', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockRejectedValue(
        new Error('Network error')
      )

      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error checking admin status:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should handle malformed session data', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            // Missing user object
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBeNull()
    })

    it('should handle null response from getSession', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue(null)

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBeNull()
    })
  })

  describe('Environment Configuration', () => {
    it('should parse comma-separated admin emails', () => {
      const testEmail = 'test@prismy.com'
      process.env.ADMIN_EMAILS = `admin@prismy.com,${testEmail},manager@prismy.com`
      
      const adminEmails = process.env.ADMIN_EMAILS.split(',')
      
      expect(adminEmails).toContain(testEmail)
      expect(adminEmails).toHaveLength(3)
    })

    it('should handle single admin email', () => {
      process.env.ADMIN_EMAILS = 'admin@prismy.com'
      
      const adminEmails = process.env.ADMIN_EMAILS.split(',')
      
      expect(adminEmails).toEqual(['admin@prismy.com'])
    })

    it('should handle empty string in split', () => {
      process.env.ADMIN_EMAILS = 'admin@prismy.com,,manager@prismy.com'
      
      const adminEmails = process.env.ADMIN_EMAILS.split(',')
      
      expect(adminEmails).toContain('')
      expect(adminEmails).toHaveLength(3)
    })
  })

  describe('Integration Tests', () => {
    it('should successfully check admin status in complete flow', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'integration-admin-123',
              email: 'admin@prismy.com',
              created_at: '2024-01-01T00:00:00Z',
              last_sign_in_at: '2024-01-01T12:00:00Z'
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result).toEqual({
        isAdmin: true,
        userId: 'integration-admin-123'
      })
    })

    it('should handle production-like environment', async () => {
      // Simulate production environment
      process.env.ADMIN_EMAILS = 'prod-admin@prismy.com'
      
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'prod-user-123',
              email: 'regular-user@example.com'
            }
          }
        },
        error: null
      })

      const result = await checkAdmin()

      expect(result.isAdmin).toBe(false)
      expect(result.userId).toBe('prod-user-123')
    })
  })

  describe('Performance Tests', () => {
    it('should complete admin check quickly', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'perf-user-123',
              email: 'admin@prismy.com'
            }
          }
        },
        error: null
      })

      const startTime = performance.now()
      await checkAdmin()
      const endTime = performance.now()

      // Should complete within 100ms in test environment
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle multiple concurrent admin checks', async () => {
      mockCookies.mockReturnValue({} as any)
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'concurrent-user-123',
              email: 'admin@prismy.com'
            }
          }
        },
        error: null
      })

      const promises = Array(10).fill(null).map(() => checkAdmin())
      const results = await Promise.all(promises)

      // All should return the same result
      results.forEach(result => {
        expect(result.isAdmin).toBe(true)
        expect(result.userId).toBe('concurrent-user-123')
      })
    })
  })
})