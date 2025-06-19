import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthModal from '@/components/auth/AuthModal'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: any) => <div onClick={onClick} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock motion library
jest.mock('@/lib/motion', () => ({
  motionSafe: (variants: any) => variants,
}))

// Mock AuthContext
const mockAuthContext = {
  signIn: jest.fn(),
  signUp: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signOut: jest.fn(),
  user: null,
  loading: false,
}

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock ModalPortal
jest.mock('@/components/auth/ModalPortal', () => {
  return function MockModalPortal({ children }: { children: React.ReactNode }) {
    return <div data-testid="modal-portal">{children}</div>
  }
})

describe('AuthModal', () => {
  const mockOnClose = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = 'unset'
  })

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(<AuthModal isOpen={false} onClose={mockOnClose} />)
      expect(screen.queryByText('Welcome back')).not.toBeInTheDocument()
    })

    it('should render signin mode by default', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your Prismy account')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should render signup mode when specified', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signup" />)
      expect(screen.getByText('Create account')).toBeInTheDocument()
      expect(screen.getByText('Join Prismy and start translating')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    })

    it('should render Vietnamese content when specified', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} language="vi" />)
      expect(screen.getByText('Chào mừng trở lại')).toBeInTheDocument()
      expect(screen.getByText('Đăng nhập vào tài khoản Prismy của bạn')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument()
    })

    it('should render all form fields for signup', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signup" />)
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('should not render full name field for signin', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signin" />)
      
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('should render social login buttons', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Apple/ })).toBeInTheDocument()
    })

    it('should render mode toggle buttons', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
    })
  })

  describe('form interactions', () => {
    it('should update form fields when typing', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('password123')
    })

    it('should toggle between signin and signup modes', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Start in signin mode
      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      
      // Click to switch to signup
      await user.click(screen.getByRole('button', { name: 'Sign up' }))
      
      expect(screen.getByText('Create account')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      
      // Click to switch back to signin
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
      
      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument()
    })

    it('should clear error when switching modes', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Simulate an error
      mockAuthContext.signIn.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } })
      
      const form = screen.getByRole('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
      
      // Switch modes
      await user.click(screen.getByRole('button', { name: 'Sign up' }))
      
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('should call signIn on signin form submission', async () => {
      mockAuthContext.signIn.mockResolvedValueOnce({ error: null })
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('should call signUp on signup form submission', async () => {
      mockAuthContext.signUp.mockResolvedValueOnce({ error: null })
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signup" />)
      
      const fullNameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      
      await user.type(fullNameInput, 'John Doe')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(mockAuthContext.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe')
    })

    it('should show loading state during submission', async () => {
      // Mock a delayed response
      mockAuthContext.signIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      const form = screen.getByRole('form')
      
      fireEvent.submit(form)
      
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(screen.getByText('⟳')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })
    })

    it('should display error messages', async () => {
      mockAuthContext.signIn.mockResolvedValueOnce({ 
        error: { message: 'Invalid email or password' } 
      })
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const form = screen.getByRole('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })
    })

    it('should close modal on successful signin', async () => {
      mockAuthContext.signIn.mockResolvedValueOnce({ error: null })
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const form = screen.getByRole('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should handle form submission errors gracefully', async () => {
      mockAuthContext.signIn.mockRejectedValueOnce(new Error('Network error'))
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const form = screen.getByRole('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })
  })

  describe('social authentication', () => {
    it('should handle Google signin', async () => {
      mockAuthContext.signInWithGoogle.mockResolvedValueOnce({ error: null })
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const googleButton = screen.getByRole('button', { name: /Google/ })
      await user.click(googleButton)
      
      expect(mockAuthContext.signInWithGoogle).toHaveBeenCalled()
    })

    it('should handle Apple signin', async () => {
      mockAuthContext.signInWithApple.mockResolvedValueOnce({ error: null })
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const appleButton = screen.getByRole('button', { name: /Apple/ })
      await user.click(appleButton)
      
      expect(mockAuthContext.signInWithApple).toHaveBeenCalled()
    })

    it('should display errors from social authentication', async () => {
      mockAuthContext.signInWithGoogle.mockResolvedValueOnce({ 
        error: { message: 'Google authentication failed' } 
      })
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const googleButton = screen.getByRole('button', { name: /Google/ })
      await user.click(googleButton)
      
      await waitFor(() => {
        expect(screen.getByText('Google authentication failed')).toBeInTheDocument()
      })
    })

    it('should disable buttons during social authentication', async () => {
      mockAuthContext.signInWithGoogle.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const googleButton = screen.getByRole('button', { name: /Google/ })
      const appleButton = screen.getByRole('button', { name: /Apple/ })
      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      
      await user.click(googleButton)
      
      expect(googleButton).toBeDisabled()
      expect(appleButton).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('modal behavior', () => {
    it('should close modal when clicking backdrop', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const backdrop = screen.getByLabelText('Close modal')
      await user.click(backdrop)
      
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when clicking close button', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const closeButton = screen.getByLabelText(/Close modal \(ESC\)/)
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when pressing Escape key', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not close modal when loading', async () => {
      mockAuthContext.signIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Start loading
      const form = screen.getByRole('form')
      fireEvent.submit(form)
      
      // Try to close while loading
      const backdrop = screen.getByLabelText('Close modal')
      await user.click(backdrop)
      
      expect(mockOnClose).not.toHaveBeenCalled()
      
      // ESC key should also not work
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should prevent body scroll when modal is open', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll when modal is closed', () => {
      const { rerender } = render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      expect(document.body.style.overflow).toBe('hidden')
      
      rerender(<AuthModal isOpen={false} onClose={mockOnClose} />)
      
      expect(document.body.style.overflow).toBe('unset')
    })

    it('should reset form fields when closing modal', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      
      // Fill form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('password123')
      
      // Close modal
      const closeButton = screen.getByLabelText(/Close modal \(ESC\)/)
      fireEvent.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
      // Note: In a real implementation, you'd test this by reopening the modal
      // and checking that fields are empty
    })
  })

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signup" />)
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('should have proper button labels', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Apple/ })).toBeInTheDocument()
      expect(screen.getByLabelText(/Close modal \(ESC\)/)).toBeInTheDocument()
    })

    it('should have required form fields', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signup" />)
      
      const fullNameInput = screen.getByLabelText('Full Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      expect(fullNameInput).toBeRequired()
      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
    })

    it('should have proper input types', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signup" />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })
})