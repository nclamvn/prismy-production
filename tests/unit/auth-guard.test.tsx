/**
 * ===============================================
 * AUTH GUARD COMPONENT UNIT TESTS
 * Vitest + React Testing Library
 * ===============================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthGuard } from '@/components/auth/AuthGuard'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock Supabase client
const mockGetUser = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase-browser', () => ({
  getBrowserClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange
    }
  })
}))

describe('AuthGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock for auth state change subscription
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    })
  })

  // ==========================================
  // TEST 1: Loading State
  // ==========================================
  it('shows loading state while checking auth', () => {
    mockGetUser.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  // ==========================================
  // TEST 2: Custom Fallback
  // ==========================================
  it('shows custom fallback while loading', () => {
    mockGetUser.mockImplementation(() => new Promise(() => {}))
    
    render(
      <AuthGuard fallback={<div>Custom Loading...</div>}>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  // ==========================================
  // TEST 3: Authenticated User
  // ==========================================
  it('renders children when user is authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  // ==========================================
  // TEST 4: Unauthenticated User
  // ==========================================
  it('redirects to home when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
    
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  // ==========================================
  // TEST 5: Auth State Change - User Logs Out
  // ==========================================
  it('redirects when user logs out', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    
    let authChangeCallback: any
    mockOnAuthStateChange.mockImplementation((callback: any) => {
      authChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }
    })
    
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
    
    // Simulate user logout
    authChangeCallback('SIGNED_OUT', null)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  // ==========================================
  // TEST 6: Auth State Change - User Logs In
  // ==========================================
  it('shows content when user logs in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    
    let authChangeCallback: any
    mockOnAuthStateChange.mockImplementation((callback: any) => {
      authChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }
    })
    
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
    
    // Simulate user login
    const newUser = { id: '456', email: 'newuser@example.com' }
    authChangeCallback('SIGNED_IN', { user: newUser })
    
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 7: Cleanup on Unmount
  // ==========================================
  it('unsubscribes from auth changes on unmount', async () => {
    const mockUnsubscribe = vi.fn()
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe
        }
      }
    })
    
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    
    const { unmount } = render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
    
    unmount()
    
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  // ==========================================
  // TEST 8: Multiple Children
  // ==========================================
  it('renders multiple children when authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    
    render(
      <AuthGuard>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </AuthGuard>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
      expect(screen.getByText('Child 3')).toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 9: Error Handling
  // ==========================================
  it('handles getUser errors gracefully', async () => {
    mockGetUser.mockRejectedValue(new Error('Network error'))
    
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    // Should still show loading or handle error appropriately
    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 10: Loading Animation
  // ==========================================
  it('shows spinning animation in loading state', () => {
    mockGetUser.mockImplementation(() => new Promise(() => {}))
    
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    const spinner = screen.getByText('Loading...').parentElement?.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-accent-brand')
  })

  // ==========================================
  // TEST 11: Nested AuthGuard
  // ==========================================
  it('works with nested AuthGuard components', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    
    render(
      <AuthGuard>
        <div>Outer Content</div>
        <AuthGuard>
          <div>Inner Content</div>
        </AuthGuard>
      </AuthGuard>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Outer Content')).toBeInTheDocument()
      expect(screen.getByText('Inner Content')).toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 12: Re-render Behavior
  // ==========================================
  it('maintains auth state on re-render', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    
    const { rerender } = render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
    
    // Re-render with different children
    rerender(
      <AuthGuard>
        <div>Updated Content</div>
      </AuthGuard>
    )
    
    expect(screen.getByText('Updated Content')).toBeInTheDocument()
    // Should not call getUser again
    expect(mockGetUser).toHaveBeenCalledTimes(1)
  })
})