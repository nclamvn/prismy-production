// AuthModal Component Tests
// Comprehensive test suite for authentication modal

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../utils/test-utils'
import { AuthModal } from '../../../components/auth/AuthModal'

// Mock authentication functions
const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignInWithGoogle = jest.fn()
const mockSignInWithApple = jest.fn()

// Mock auth context
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
    loading: false,
    error: null
  })
}))

describe('AuthModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    defaultMode: 'signin' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders sign in form by default', () => {
      render(<AuthModal {...defaultProps} />)
      
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders sign up form when mode is signup', () => {
      render(<AuthModal {...defaultProps} defaultMode="signup" />)
      
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<AuthModal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    })

    it('renders social login options', () => {
      render(<AuthModal {...defaultProps} />)
      
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument()
      expect(screen.getByText(/continue with apple/i)).toBeInTheDocument()
    })

    it('shows mode toggle link', () => {
      render(<AuthModal {...defaultProps} />)
      
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      expect(screen.getByText(/sign up/i)).toBeInTheDocument()
    })
  })

  describe('Sign In Form', () => {
    it('accepts email input', () => {
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('accepts password input', () => {
      render(<AuthModal {...defaultProps} />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      expect(passwordInput).toHaveValue('password123')
    })

    it('validates required fields', async () => {
      render(<AuthModal {...defaultProps} />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('submits form with valid data', async () => {
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('shows loading state during submission', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(signInButton).toBeDisabled()
    })

    it('handles remember me checkbox', () => {
      render(<AuthModal {...defaultProps} />)
      
      const rememberCheckbox = screen.getByLabelText(/remember me/i)
      fireEvent.click(rememberCheckbox)
      
      expect(rememberCheckbox).toBeChecked()
    })

    it('shows forgot password link', () => {
      render(<AuthModal {...defaultProps} />)
      
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    })
  })

  describe('Sign Up Form', () => {
    it('accepts all required fields', () => {
      render(<AuthModal {...defaultProps} defaultMode="signup" />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      expect(firstNameInput).toHaveValue('John')
      expect(lastNameInput).toHaveValue('Doe')
      expect(emailInput).toHaveValue('john@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    it('validates password strength', async () => {
      render(<AuthModal {...defaultProps} defaultMode="signup" />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      fireEvent.change(passwordInput, { target: { value: '123' } })
      
      const signUpButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signUpButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('validates password confirmation', async () => {
      render(<AuthModal {...defaultProps} defaultMode="signup" />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
      
      const signUpButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signUpButton)
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('requires terms acceptance', async () => {
      render(<AuthModal {...defaultProps} defaultMode="signup" />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signUpButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signUpButton)
      
      await waitFor(() => {
        expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument()
      })
    })

    it('submits form with valid data', async () => {
      render(<AuthModal {...defaultProps} defaultMode="signup" />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const termsCheckbox = screen.getByLabelText(/accept terms/i)
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(termsCheckbox)
      
      const signUpButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signUpButton)
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123'
        })
      })
    })
  })

  describe('Social Authentication', () => {
    it('handles Google sign in', () => {
      render(<AuthModal {...defaultProps} />)
      
      const googleButton = screen.getByText(/continue with google/i)
      fireEvent.click(googleButton)
      
      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })

    it('handles Apple sign in', () => {
      render(<AuthModal {...defaultProps} />)
      
      const appleButton = screen.getByText(/continue with apple/i)
      fireEvent.click(appleButton)
      
      expect(mockSignInWithApple).toHaveBeenCalled()
    })

    it('shows loading state for social auth', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      
      render(<AuthModal {...defaultProps} />)
      
      const googleButton = screen.getByText(/continue with google/i)
      fireEvent.click(googleButton)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Mode Switching', () => {
    it('switches from sign in to sign up', () => {
      render(<AuthModal {...defaultProps} />)
      
      const signUpLink = screen.getByText(/sign up/i)
      fireEvent.click(signUpLink)
      
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    })

    it('switches from sign up to sign in', () => {
      render(<AuthModal {...defaultProps} defaultMode="signup" />)
      
      const signInLink = screen.getByText(/sign in/i)
      fireEvent.click(signInLink)
      
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument()
    })

    it('clears form when switching modes', () => {
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      const signUpLink = screen.getByText(/sign up/i)
      fireEvent.click(signUpLink)
      
      const signInLink = screen.getByText(/sign in/i)
      fireEvent.click(signInLink)
      
      expect(screen.getByLabelText(/email/i)).toHaveValue('')
    })
  })

  describe('Error Handling', () => {
    it('displays authentication errors', () => {
      const errorProps = {
        ...defaultProps,
        error: 'Invalid credentials'
      }
      
      render(<AuthModal {...errorProps} />)
      
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    it('clears errors when switching modes', () => {
      const errorProps = {
        ...defaultProps,
        error: 'Invalid credentials'
      }
      
      render(<AuthModal {...errorProps} />)
      
      const signUpLink = screen.getByText(/sign up/i)
      fireEvent.click(signUpLink)
      
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    })

    it('handles network errors', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'))
      
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('manages focus properly', () => {
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveFocus()
    })

    it('supports keyboard navigation', () => {
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      fireEvent.keyDown(emailInput, { key: 'Tab' })
      expect(passwordInput).toHaveFocus()
    })

    it('has proper ARIA attributes', () => {
      render(<AuthModal {...defaultProps} />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-labelledby')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    it('traps focus within modal', () => {
      render(<AuthModal {...defaultProps} />)
      
      const closeButton = screen.getByLabelText(/close/i)
      closeButton.focus()
      
      fireEvent.keyDown(closeButton, { key: 'Tab' })
      
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveFocus()
    })

    it('closes on Escape key', () => {
      const onClose = jest.fn()
      render(<AuthModal {...defaultProps} onClose={onClose} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Modal Behavior', () => {
    it('closes when clicking outside', () => {
      const onClose = jest.fn()
      render(<AuthModal {...defaultProps} onClose={onClose} />)
      
      const backdrop = screen.getByTestId('modal-backdrop')
      fireEvent.click(backdrop)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('does not close when clicking inside modal', () => {
      const onClose = jest.fn()
      render(<AuthModal {...defaultProps} onClose={onClose} />)
      
      const modal = screen.getByRole('dialog')
      fireEvent.click(modal)
      
      expect(onClose).not.toHaveBeenCalled()
    })

    it('closes on close button click', () => {
      const onClose = jest.fn()
      render(<AuthModal {...defaultProps} onClose={onClose} />)
      
      const closeButton = screen.getByLabelText(/close/i)
      fireEvent.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('shows real-time validation', async () => {
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('clears validation errors on input', async () => {
      render(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
      
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } })
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument()
      })
    })

    it('prevents submission with invalid form', async () => {
      render(<AuthModal {...defaultProps} />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)
      
      expect(mockSignIn).not.toHaveBeenCalled()
    })
  })
})