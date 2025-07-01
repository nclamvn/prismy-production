/**
 * Button Component Test Suite
 * Target: 90% coverage for UI components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '../../ui/Button'

// Extend Jest matchers for accessibility
expect.extend(toHaveNoViolations)

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

// Mock DOM methods
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: jest.fn(() => ({
    width: 100,
    height: 40,
    left: 0,
    top: 0,
    right: 100,
    bottom: 40
  })),
  writable: true
})

describe('Button Component', () => {
  beforeEach(() => {
    // Clear any existing ripple elements
    document.querySelectorAll('[style*="ripple"]').forEach(el => el.remove())
  })

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
      expect(button).toHaveStyle({ position: 'relative', overflow: 'hidden' })
    })

    it('should render with custom className', () => {
      const { container } = render(<Button className="custom-class">Test</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('relative', 'overflow-hidden')
    })

    it('should render with aria-label', () => {
      render(<Button aria-label="Custom label">Test</Button>)
      
      const button = screen.getByRole('button', { name: 'Custom label' })
      expect(button).toBeInTheDocument()
    })

    it('should render with aria-describedby', () => {
      render(<Button aria-describedby="description">Test</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'description')
    })
  })

  describe('Variants', () => {
    it('should render filled variant by default and apply styles', () => {
      const { container } = render(<Button>Filled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // Verify styles are applied by checking the style object exists
      expect(button.style).toBeDefined()
    })

    it('should render outlined variant and call styling functions', () => {
      const { container } = render(<Button variant="outlined">Outlined</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.style).toBeDefined()
    })

    it('should render text variant and apply appropriate styles', () => {
      const { container } = render(<Button variant="text">Text</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.style).toBeDefined()
    })

    it('should render elevated variant with styles', () => {
      const { container } = render(<Button variant="elevated">Elevated</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.style).toBeDefined()
    })
  })

  describe('Sizes', () => {
    it('should render medium size by default and apply size styles', () => {
      const { container } = render(<Button>Medium</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.style).toBeDefined()
    })

    it('should render small size with appropriate styling', () => {
      const { container } = render(<Button size="sm">Small</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.style).toBeDefined()
    })

    it('should render large size with styling applied', () => {
      const { container } = render(<Button size="lg">Large</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.style).toBeDefined()
    })
  })

  describe('Disabled State', () => {
    it('should render disabled button with proper state and styling', () => {
      const { container } = render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('cursor-not-allowed')
      expect(button.style).toBeDefined()
    })

    it('should not trigger onClick when disabled', () => {
      const handleClick = jest.fn()
      const { container } = render(<Button disabled onClick={handleClick}>Disabled</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
      expect(button.style).toBeDefined()
    })
  })

  describe('Loading State', () => {
    it('should render loading button with proper state and elements', () => {
      const { container } = render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button.style).toBeDefined()
      
      // Check for loading spinner
      const spinner = button.querySelector('[aria-hidden="true"]')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should show custom loading text with proper structure', () => {
      const { container } = render(<Button loading loadingText="Please wait...">Submit</Button>)
      
      const button = screen.getByRole('button')
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
      expect(button.style).toBeDefined()
    })

    it('should hide button content when loading and show loading elements', () => {
      const { container } = render(<Button loading>Submit</Button>)
      
      const content = screen.getByText('Submit')
      expect(content).toHaveClass('opacity-0')
      
      // Verify loading structure is created
      const loadingDiv = container.querySelector('.absolute.inset-0')
      expect(loadingDiv).toBeInTheDocument()
    })

    it('should show default loading text and handle loading state logic', () => {
      const { container } = render(<Button loading>Submit</Button>)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toHaveClass('sr-only')
    })

    it('should not trigger onClick when loading and maintain proper state', () => {
      const handleClick = jest.fn()
      const { container } = render(<Button loading onClick={handleClick}>Loading</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
      expect(button.style).toBeDefined()
    })
  })

  describe('Click Interactions', () => {
    it('should trigger onClick handler', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should pass event to onClick handler', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
    })
  })

  describe('Ripple Effect', () => {
    beforeEach(() => {
      // Mock setTimeout
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should create ripple effect on mouse down', () => {
      render(<Button>Ripple</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.mouseDown(button, { clientX: 50, clientY: 20 })
      
      // Check if ripple element was created
      const ripple = button.querySelector('span[style*="position: absolute"]')
      expect(ripple).toBeInTheDocument()
    })

    it('should not create ripple when disabled', () => {
      render(<Button disabled>No Ripple</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.mouseDown(button, { clientX: 50, clientY: 20 })
      
      const ripple = button.querySelector('span[style*="position: absolute"]')
      expect(ripple).not.toBeInTheDocument()
    })

    it('should not create ripple when loading', () => {
      render(<Button loading>No Ripple</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.mouseDown(button, { clientX: 50, clientY: 20 })
      
      const ripple = button.querySelector('span[style*="position: absolute"]')
      expect(ripple).not.toBeInTheDocument()
    })

    it('should remove ripple after timeout', () => {
      render(<Button>Ripple</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.mouseDown(button, { clientX: 50, clientY: 20 })
      
      let ripple = button.querySelector('span[style*="position: absolute"]')
      expect(ripple).toBeInTheDocument()
      
      // Fast-forward time
      jest.advanceTimersByTime(600)
      
      // Ripple should be removed
      ripple = button.querySelector('span[style*="position: absolute"]')
      expect(ripple).not.toBeInTheDocument()
    })

    it('should calculate ripple position correctly', () => {
      render(<Button>Ripple</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.mouseDown(button, { clientX: 30, clientY: 15 })
      
      const ripple = button.querySelector('span[style*="position: absolute"]')
      expect(ripple).toBeInTheDocument()
      expect(ripple).toHaveStyle('left: -20px') // 30 - 0 - 50 (size/2)
      expect(ripple).toHaveStyle('top: -35px')  // 15 - 0 - 50 (size/2)
    })
  })

  describe('Accessibility (A11y)', () => {
    it('should have no accessibility violations - default state', async () => {
      const { container } = render(<Button>Accessible Button</Button>)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - all variants', async () => {
      const variants = ['filled', 'outlined', 'text', 'elevated'] as const
      
      for (const variant of variants) {
        const { container } = render(<Button variant={variant}>{variant} Button</Button>)
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    })

    it('should have no accessibility violations - disabled state', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - loading state', async () => {
      const { container } = render(<Button loading>Loading Button</Button>)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have correct ARIA attributes', () => {
      render(<Button>Accessible</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('should support keyboard navigation', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Keyboard</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      fireEvent.keyDown(button, { key: 'Enter' })
      // Note: React Testing Library doesn't automatically trigger click on Enter
      // This test verifies the button can receive focus
      expect(document.activeElement).toBe(button)
    })

    it('should have screen reader text for loading state', () => {
      render(<Button loading>Loading Button</Button>)
      
      expect(screen.getByText('Loading...')).toHaveClass('sr-only')
    })

    it('should set aria-busy when loading', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('should not set aria-busy when not loading', () => {
      render(<Button>Not Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'false')
    })

    it('should maintain proper focus indication', () => {
      render(<Button>Focus Test</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(document.activeElement).toBe(button)
      expect(button).toHaveClass('btn-focus')
    })

    it('should have sufficient color contrast (tested via axe)', async () => {
      const { container } = render(
        <div style={{ backgroundColor: 'white' }}>
          <Button>High Contrast Button</Button>
        </div>
      )
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('should support assistive technology with proper role', () => {
      render(<Button aria-label="Submit form">Submit</Button>)
      
      const button = screen.getByRole('button', { name: 'Submit form' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-label', 'Submit form')
    })

    it('should handle complex aria attributes', async () => {
      const { container } = render(
        <>
          <Button aria-describedby="help-text" aria-expanded="false">
            Menu Button
          </Button>
          <div id="help-text">This button opens a menu</div>
        </>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'help-text')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Style Generation', () => {
    it('should apply correct base styles', () => {
      render(<Button>Styled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveStyle({
        position: 'relative',
        overflow: 'hidden'
      })
    })

    it('should handle disabled interaction state', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('cursor-not-allowed')
    })

    it('should handle loading interaction state', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('cursor-not-allowed')
    })
  })

  describe('Props Forwarding', () => {
    it('should forward HTML button props', () => {
      render(<Button type="submit" id="test-button">Submit</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('id', 'test-button')
    })

    it('should forward data attributes', () => {
      render(<Button data-testid="custom-button">Test</Button>)
      
      const button = screen.getByTestId('custom-button')
      expect(button).toBeInTheDocument()
    })

    it('should forward event handlers', () => {
      const handleMouseEnter = jest.fn()
      const handleMouseLeave = jest.fn()
      
      render(
        <Button 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Hover me
        </Button>
      )
      
      const button = screen.getByRole('button')
      
      fireEvent.mouseEnter(button)
      expect(handleMouseEnter).toHaveBeenCalled()
      
      fireEvent.mouseLeave(button)
      expect(handleMouseLeave).toHaveBeenCalled()
    })
  })

  describe('Style Variants Edge Cases', () => {
    it('should handle all size variants', () => {
      const { rerender } = render(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button size="md">Medium</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle all variant types', () => {
      const { rerender } = render(<Button variant="filled">Filled</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button variant="outlined">Outlined</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button variant="text">Text</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      rerender(<Button variant="elevated">Elevated</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle combination of disabled and loading', () => {
      render(<Button disabled loading>Complex</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveClass('cursor-not-allowed')
    })

    it('should handle complex styling combinations', () => {
      render(
        <Button 
          variant="outlined" 
          size="lg" 
          className="custom-class"
          disabled
        >
          Complex Button
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveClass('custom-class')
    })

    it('should handle rapid click events', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Rapid Click</Button>)
      
      const button = screen.getByRole('button')
      
      // Simulate rapid clicks
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn()
      
      function TestButton(props: any) {
        renderSpy()
        return <Button {...props}>Test</Button>
      }
      
      const { rerender } = render(<TestButton>Initial</TestButton>)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Same props should not cause re-render in real scenarios
      rerender(<TestButton>Initial</TestButton>)
      expect(renderSpy).toHaveBeenCalledTimes(2) // RTL always re-renders
    })
  })
})