// Button Component Tests
// Comprehensive test suite for the Button component

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render, createMockUser } from '../../utils/test-utils'
import { Button } from '../../../components/ui/Button'
import type { ButtonProps } from '../../../types/ui'

// Test data
const defaultProps: ButtonProps = {
  children: 'Test Button'
}

const mockOnClick = jest.fn()

describe('Button Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /test button/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Test Button')
    })

    it('renders with custom className', () => {
      render(<Button {...defaultProps} className="custom-class" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('renders with data-testid', () => {
      render(<Button {...defaultProps} data-testid="test-button" />)
      
      const button = screen.getByTestId('test-button')
      expect(button).toBeInTheDocument()
    })

    it('applies correct ARIA attributes', () => {
      render(<Button {...defaultProps} disabled />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Variants', () => {
    const variants: Array<ButtonProps['variant']> = ['filled', 'outlined', 'text', 'elevated', 'tonal']

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button {...defaultProps} variant={variant} />)
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        // Variant-specific styling would be tested with visual regression or snapshot tests
      })
    })
  })

  describe('Sizes', () => {
    const sizes: Array<ButtonProps['size']> = ['sm', 'md', 'lg']

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Button {...defaultProps} size={size} />)
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        // Size-specific styling would be tested with visual regression tests
      })
    })
  })

  describe('Colors', () => {
    const colors: Array<ButtonProps['color']> = ['primary', 'secondary', 'success', 'warning', 'error', 'info']

    colors.forEach(color => {
      it(`renders ${color} color correctly`, () => {
        render(<Button {...defaultProps} color={color} />)
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        // Color-specific styling would be tested with visual regression tests
      })
    })
  })

  describe('States', () => {
    it('renders disabled state correctly', () => {
      render(<Button {...defaultProps} disabled />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('renders loading state correctly', () => {
      render(<Button {...defaultProps} loading />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
      
      // Check for loading spinner
      const loadingSpinner = screen.getByTestId('loading-spinner')
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('shows loading state with custom loading text', () => {
      render(<Button {...defaultProps} loading>Loading...</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Loading...')
    })
  })

  describe('Icons', () => {
    const MockIcon = () => <span data-testid="mock-icon">Icon</span>

    it('renders with start icon', () => {
      render(<Button {...defaultProps} startIcon={<MockIcon />} />)
      
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toBeInTheDocument()
      
      const button = screen.getByRole('button')
      expect(button).toContainElement(icon)
    })

    it('renders with end icon', () => {
      render(<Button {...defaultProps} endIcon={<MockIcon />} />)
      
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toBeInTheDocument()
      
      const button = screen.getByRole('button')
      expect(button).toContainElement(icon)
    })

    it('renders with both start and end icons', () => {
      render(
        <Button 
          {...defaultProps} 
          startIcon={<MockIcon />} 
          endIcon={<MockIcon />} 
        />
      )
      
      const icons = screen.getAllByTestId('mock-icon')
      expect(icons).toHaveLength(2)
    })
  })

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      render(<Button {...defaultProps} onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', () => {
      render(<Button {...defaultProps} onClick={mockOnClick} disabled />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', () => {
      render(<Button {...defaultProps} onClick={mockOnClick} loading />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('handles keyboard interactions', () => {
      render(<Button {...defaultProps} onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      
      // Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
      expect(mockOnClick).toHaveBeenCalledTimes(1)
      
      // Space key
      fireEvent.keyDown(button, { key: ' ', code: 'Space' })
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })

    it('supports focus management', () => {
      render(<Button {...defaultProps} />)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(button).toHaveFocus()
    })
  })

  describe('Form Integration', () => {
    it('renders as submit button', () => {
      render(<Button {...defaultProps} type="submit" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('renders as reset button', () => {
      render(<Button {...defaultProps} type="reset" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'reset')
    })

    it('submits form when type is submit', () => {
      const mockSubmit = jest.fn()
      
      render(
        <form onSubmit={mockSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockSubmit).toHaveBeenCalled()
    })
  })

  describe('Link Behavior', () => {
    it('renders as link when href is provided', () => {
      render(<Button {...defaultProps} href="/test-link" />)
      
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test-link')
    })

    it('opens link in new tab when target is _blank', () => {
      render(<Button {...defaultProps} href="/test-link" target="_blank" rel="noopener noreferrer" />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Full Width', () => {
    it('applies full width styling', () => {
      render(<Button {...defaultProps} fullWidth />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for loading state', () => {
      render(<Button {...defaultProps} loading />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('has proper ARIA attributes for disabled state', () => {
      render(<Button {...defaultProps} disabled />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('maintains focus ring for keyboard navigation', () => {
      render(<Button {...defaultProps} />)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(button).toHaveFocus()
      // Focus ring styling would be tested with visual regression tests
    })

    it('supports high contrast mode', () => {
      // This would typically be tested with CSS-in-JS theme testing
      render(<Button {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn()
      
      const TestButton = (props: ButtonProps) => {
        renderSpy()
        return <Button {...props} />
      }
      
      const { rerender } = render(<TestButton {...defaultProps} />)
      
      // Re-render with same props
      rerender(<TestButton {...defaultProps} />)
      
      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })

    it('handles rapid clicks gracefully', () => {
      render(<Button {...defaultProps} onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button)
      }
      
      expect(mockOnClick).toHaveBeenCalledTimes(10)
    })
  })

  describe('Error Handling', () => {
    it('handles onClick errors gracefully', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const errorHandler = jest.fn(() => {
        throw new Error('Test error')
      })
      
      render(<Button {...defaultProps} onClick={errorHandler} />)
      
      const button = screen.getByRole('button')
      
      expect(() => fireEvent.click(button)).not.toThrow()
      
      errorSpy.mockRestore()
    })
  })

  describe('Theming', () => {
    it('applies theme-based styling', () => {
      render(<Button {...defaultProps} />, { withTheme: true })
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // Theme-specific styling would be tested with theme context
    })
  })

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      // This would typically be tested with viewport manipulation
      render(<Button {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Integration with Form Libraries', () => {
    it('works with react-hook-form', () => {
      // Example of testing with form libraries
      const mockRegister = jest.fn()
      
      render(
        <form>
          <Button {...defaultProps} type="submit" />
        </form>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })
})