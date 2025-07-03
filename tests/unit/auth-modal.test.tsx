/**
 * ===============================================
 * AUTH MODAL COMPONENT UNIT TESTS
 * Vitest + React Testing Library
 * ===============================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthModal } from '@/components/auth/AuthModal'

// Mock AuthContext
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp
  })
}))

describe('AuthModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================
  // TEST 1: Basic Rendering
  // ==========================================
  it('renders nothing when closed', () => {
    render(<AuthModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument()
  })

  it('renders sign in mode by default', () => {
    render(<AuthModal {...defaultProps} />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to access your workspace')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  // ==========================================
  // TEST 2: Sign Up Mode
  // ==========================================
  it('renders sign up mode when specified', () => {
    render(<AuthModal {...defaultProps} mode="signup" />)
    
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByText('Start your 14-day free trial')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  // ==========================================
  // TEST 3: Mode Toggle
  // ==========================================
  it('toggles between sign in and sign up modes', async () => {
    const user = userEvent.setup()
    render(<AuthModal {...defaultProps} />)
    
    // Initially in sign in mode
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    
    // Click to switch to sign up
    await user.click(screen.getByText('Sign up'))
    
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    
    // Click to switch back to sign in
    await user.click(screen.getByText('Sign in'))
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 4: Form Inputs
  // ==========================================
  it('renders email and password inputs', () => {
    render(<AuthModal {...defaultProps} />)
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 5: Form Submission - Sign In
  // ==========================================
  it('handles sign in form submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })
    
    render(<AuthModal {...defaultProps} />)
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })
  })

  // ==========================================
  // TEST 6: Form Submission - Sign Up
  // ==========================================
  it('handles sign up form submission', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    
    render(<AuthModal {...defaultProps} mode="signup" />)
    
    await user.type(screen.getByLabelText('Email'), 'newuser@example.com')
    await user.type(screen.getByLabelText('Password'), 'newpassword123')
    
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'newpassword123', 'User Name')
      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })
  })

  // ==========================================
  // TEST 7: Error Handling
  // ==========================================
  it('displays error message on sign in failure', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: new Error('Invalid credentials') })
    
    render(<AuthModal {...defaultProps} />)
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpassword')
    
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  // ==========================================
  // TEST 8: Loading State
  // ==========================================
  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<AuthModal {...defaultProps} />)
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
  })

  // ==========================================
  // TEST 9: Close Button
  // ==========================================
  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<AuthModal {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: '' }).parentElement?.querySelector('button')
    if (closeButton) {
      await user.click(closeButton)
    }
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  // ==========================================
  // TEST 10: Backdrop Click
  // ==========================================
  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<AuthModal {...defaultProps} />)
    
    const backdrop = container.querySelector('.bg-bg-overlay')
    if (backdrop) {
      await user.click(backdrop)
    }
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  // ==========================================
  // TEST 11: Form Reset on Close
  // ==========================================
  it('resets form when modal closes and reopens', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<AuthModal {...defaultProps} />)
    
    // Fill in form
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    
    // Close modal
    rerender(<AuthModal {...defaultProps} isOpen={false} />)
    
    // Reopen modal
    rerender(<AuthModal {...defaultProps} isOpen={true} />)
    
    // Form should be reset
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  // ==========================================
  // TEST 12: Terms and Privacy Links (Sign Up)
  // ==========================================
  it('shows terms and privacy links in sign up mode', () => {
    render(<AuthModal {...defaultProps} mode="signup" />)
    
    expect(screen.getByText('By creating an account, you agree to our')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy')
  })

  // ==========================================
  // TEST 13: Form Validation
  // ==========================================
  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<AuthModal {...defaultProps} />)
    
    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    // Should not call signIn with empty fields
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  // ==========================================
  // TEST 14: Password Minimum Length
  // ==========================================
  it('enforces password minimum length', () => {
    render(<AuthModal {...defaultProps} />)
    
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
    expect(passwordInput.minLength).toBe(6)
  })

  // ==========================================
  // TEST 15: Email Input Type
  // ==========================================
  it('uses email input type for email field', () => {
    render(<AuthModal {...defaultProps} />)
    
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement
    expect(emailInput.type).toBe('email')
  })
})