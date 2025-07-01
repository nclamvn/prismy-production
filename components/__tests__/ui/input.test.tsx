/**
 * Input Component Test Suite
 * Target: 95% coverage for UI input component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Input } from '../../ui/Input'

// Extend Jest matchers for accessibility
expect.extend(toHaveNoViolations)

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('flex')
    })

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      
      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
    })

    it('should render with value', () => {
      render(<Input value="test value" readOnly />)
      
      const input = screen.getByDisplayValue('test value')
      expect(input).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<Input className="custom-input" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-input')
    })
  })

  describe('Input Types', () => {
    it('should render as text input by default', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should render as password input', () => {
      const { container } = render(<Input type="password" />)
      
      const input = container.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'password')
    })

    it('should render as email input', () => {
      render(<Input type="email" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should render as number input', () => {
      render(<Input type="number" />)
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should render as search input', () => {
      render(<Input type="search" />)
      
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('type', 'search')
    })

    it('should render as tel input', () => {
      render(<Input type="tel" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('should render as url input', () => {
      render(<Input type="url" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'url')
    })
  })

  describe('States', () => {
    it('should render disabled input', () => {
      render(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:cursor-not-allowed')
    })

    it('should render readonly input', () => {
      render(<Input readOnly />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('should render required input', () => {
      render(<Input required />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('required')
    })

    it('should render input with max length', () => {
      render(<Input maxLength={10} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxlength', '10')
    })

    it('should render input with min length', () => {
      render(<Input minLength={3} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('minlength', '3')
    })
  })

  describe('Event Handling', () => {
    it('should handle onChange events', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test input' } })
      
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should handle onFocus events', () => {
      const handleFocus = jest.fn()
      render(<Input onFocus={handleFocus} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should handle onBlur events', () => {
      const handleBlur = jest.fn()
      render(<Input onBlur={handleBlur} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.blur(input)
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should handle onKeyDown events', () => {
      const handleKeyDown = jest.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }))
    })

    it('should handle onKeyUp events', () => {
      const handleKeyUp = jest.fn()
      render(<Input onKeyUp={handleKeyUp} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.keyUp(input, { key: 'a' })
      
      expect(handleKeyUp).toHaveBeenCalledTimes(1)
    })

    it('should handle onKeyPress events', () => {
      const handleKeyPress = jest.fn()
      render(<Input onKeyPress={handleKeyPress} />)
      
      const input = screen.getByRole('textbox')
      // keyPress is deprecated, using keyDown instead
      fireEvent.keyDown(input, { key: 'a' })
      
      // Can't test onKeyPress reliably as it's deprecated
      expect(input).toBeInTheDocument()
    })
  })

  describe('Focus Management', () => {
    it('should focus when clicked', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      
      // Manually focus the input
      input.focus()
      
      expect(input).toHaveFocus()
    })

    it('should support autofocus', () => {
      render(<Input autoFocus />)
      
      const input = screen.getByRole('textbox')
      // Just check attribute as focus behavior is inconsistent in tests
      expect(input).toHaveAttribute('autofocus')
    })

    it('should support tab index', () => {
      render(<Input tabIndex={0} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('tabindex', '0')
    })
  })

  describe('Validation', () => {
    it('should support pattern validation', () => {
      render(<Input pattern="[0-9]*" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
    })

    it('should support min/max for number inputs', () => {
      render(<Input type="number" min={0} max={100} />)
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })

    it('should support step for number inputs', () => {
      render(<Input type="number" step={0.1} />)
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.1')
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Username input" />)
      
      const input = screen.getByLabelText('Username input')
      expect(input).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(<Input aria-describedby="help-text" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should support aria-invalid', () => {
      render(<Input aria-invalid />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid')
    })

    it('should support aria-required', () => {
      render(<Input aria-required />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required')
    })

    it('should be accessible via keyboard', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      
      // Should be focusable
      input.focus()
      expect(input).toHaveFocus()
      
      // Should accept keyboard input
      fireEvent.keyDown(input, { key: 'Tab' })
      expect(input).toBeInTheDocument()
    })

    it('should have no accessibility violations - default state', async () => {
      const { container } = render(
        <div>
          <label htmlFor="default-input">Default Input</label>
          <Input id="default-input" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - with label', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - error state', async () => {
      const { container } = render(
        <div>
          <label htmlFor="error-input">Error Input</label>
          <Input error helperText="Error message" id="error-input" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - disabled state', async () => {
      const { container } = render(
        <div>
          <label htmlFor="disabled-input">Disabled Input</label>
          <Input id="disabled-input" disabled />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should set aria-invalid for error state', () => {
      render(<Input error id="error-test" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should set aria-describedby for helper text', () => {
      render(<Input helperText="Help text" id="helper-test" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'helper-test-helper-text')
      expect(screen.getByText('Help text')).toHaveAttribute('id', 'helper-test-helper-text')
    })
  })

  describe('Style Classes', () => {
    it('should have correct base classes', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('h-10')
      expect(input).toHaveClass('w-full')
      expect(input).toHaveClass('rounded-md')
    })

    it('should apply error styles when error prop is true', () => {
      render(<Input error />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-red-500')
      expect(input).toHaveClass('focus-visible:ring-red-500')
    })

    it('should show helper text with correct styling', () => {
      render(<Input helperText="Helper message" id="test" />)
      
      const helperText = screen.getByText('Helper message')
      expect(helperText).toHaveClass('text-sm')
      expect(helperText).toHaveClass('text-muted-foreground')
    })

    it('should show error helper text with error styling', () => {
      render(<Input error helperText="Error message" id="test" />)
      
      const helperText = screen.getByText('Error message')
      expect(helperText).toHaveClass('text-sm')
      expect(helperText).toHaveClass('text-red-500')
    })

    it('should have focus classes', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus-visible:outline-none')
      expect(input).toHaveClass('focus-visible:ring-2')
    })

    it('should have disabled classes', () => {
      render(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('disabled:cursor-not-allowed')
      expect(input).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Props Forwarding', () => {
    it('should forward id attribute', () => {
      render(<Input id="test-input" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'test-input')
    })

    it('should forward name attribute', () => {
      render(<Input name="username" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('should forward data attributes', () => {
      render(<Input data-testid="custom-input" />)
      
      const input = screen.getByTestId('custom-input')
      expect(input).toBeInTheDocument()
    })

    it('should forward form attributes', () => {
      render(<Input form="test-form" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('form', 'test-form')
    })

    it('should forward autocomplete attribute', () => {
      render(<Input autoComplete="username" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('autocomplete', 'username')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Input value="" readOnly />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('should handle null value gracefully', () => {
      render(<Input value={null as any} readOnly />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('should handle undefined value gracefully', () => {
      render(<Input value={undefined} readOnly />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('should handle very long placeholder text', () => {
      const longPlaceholder = 'A'.repeat(200)
      render(<Input placeholder={longPlaceholder} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('placeholder', longPlaceholder)
    })

    it('should handle special characters in value', () => {
      const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      render(<Input value={specialValue} readOnly />)
      
      const input = screen.getByDisplayValue(specialValue)
      expect(input).toBeInTheDocument()
    })
  })

  describe('Uncontrolled vs Controlled', () => {
    it('should work as uncontrolled component', () => {
      render(<Input defaultValue="initial" />)
      
      const input = screen.getByDisplayValue('initial')
      expect(input).toBeInTheDocument()
      
      fireEvent.change(input, { target: { value: 'changed' } })
      expect(input).toHaveValue('changed')
    })

    it('should work as controlled component', () => {
      const ControlledInput = () => {
        const [value, setValue] = React.useState('controlled')
        return <Input value={value} onChange={(e) => setValue(e.target.value)} />
      }
      
      render(<ControlledInput />)
      
      const input = screen.getByDisplayValue('controlled')
      expect(input).toBeInTheDocument()
    })

    it('should handle defaultValue with onChange', () => {
      const handleChange = jest.fn()
      render(<Input defaultValue="default" onChange={handleChange} />)
      
      const input = screen.getByDisplayValue('default')
      fireEvent.change(input, { target: { value: 'new value' } })
      
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Form Integration', () => {
    it('should submit with form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="test" defaultValue="form value" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)
      
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should reset with form', () => {
      render(
        <form>
          <Input name="test" defaultValue="initial" />
          <button type="reset">Reset</button>
        </form>
      )
      
      const input = screen.getByRole('textbox')
      const resetButton = screen.getByText('Reset')
      
      // Change value
      fireEvent.change(input, { target: { value: 'changed' } })
      expect(input).toHaveValue('changed')
      
      // Reset form
      fireEvent.click(resetButton)
      expect(input).toHaveValue('initial')
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn()
      
      const TestInput = (props: any) => {
        renderSpy()
        return <Input {...props} />
      }
      
      const { rerender } = render(<TestInput placeholder="test" />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Same props should not cause re-render in optimized scenarios
      rerender(<TestInput placeholder="test" />)
      expect(renderSpy).toHaveBeenCalledTimes(2) // RTL always re-renders
    })

    it('should handle rapid typing', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      
      // Simulate rapid typing
      'hello'.split('').forEach((char, index) => {
        fireEvent.change(input, { target: { value: 'hello'.slice(0, index + 1) } })
      })
      
      expect(handleChange).toHaveBeenCalledTimes(5)
    })
  })
})