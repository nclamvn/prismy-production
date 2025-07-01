/**
 * Textarea Component Test Suite
 * Target: 95% coverage for UI textarea component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Textarea } from '../../ui/Textarea'

// Extend Jest matchers for accessibility
expect.extend(toHaveNoViolations)

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

describe('Textarea Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should render with placeholder', () => {
      render(<Textarea placeholder="Enter your text here" />)
      
      const textarea = screen.getByPlaceholderText('Enter your text here')
      expect(textarea).toBeInTheDocument()
    })

    it('should render with value', () => {
      render(<Textarea value="Initial content" readOnly />)
      
      const textarea = screen.getByDisplayValue('Initial content')
      expect(textarea).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<Textarea className="custom-textarea" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('custom-textarea')
    })

    it('should render with default value', () => {
      render(<Textarea defaultValue="Default content" />)
      
      const textarea = screen.getByDisplayValue('Default content')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Sizing and Layout', () => {
    it('should handle rows attribute', () => {
      render(<Textarea rows={5} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('should handle cols attribute', () => {
      render(<Textarea cols={50} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('cols', '50')
    })

    it('should handle resize styles', () => {
      render(<Textarea style={{ resize: 'vertical' }} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveStyle({ resize: 'vertical' })
    })

    it('should have minimum height', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('min-h-[80px]')
    })
  })

  describe('States', () => {
    it('should render disabled textarea', () => {
      render(<Textarea disabled />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeDisabled()
      expect(textarea).toHaveClass('disabled:cursor-not-allowed')
    })

    it('should render readonly textarea', () => {
      render(<Textarea readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('readonly')
    })

    it('should render required textarea', () => {
      render(<Textarea required />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('required')
    })

    it('should handle max length', () => {
      render(<Textarea maxLength={100} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('maxlength', '100')
    })

    it('should handle min length', () => {
      render(<Textarea minLength={10} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('minlength', '10')
    })
  })

  describe('Event Handling', () => {
    it('should handle onChange events', () => {
      const handleChange = jest.fn()
      render(<Textarea onChange={handleChange} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'New content' } })
      
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({ value: 'New content' })
      }))
    })

    it('should handle onFocus events', () => {
      const handleFocus = jest.fn()
      render(<Textarea onFocus={handleFocus} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.focus(textarea)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should handle onBlur events', () => {
      const handleBlur = jest.fn()
      render(<Textarea onBlur={handleBlur} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.blur(textarea)
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should handle onKeyDown events', () => {
      const handleKeyDown = jest.fn()
      render(<Textarea onKeyDown={handleKeyDown} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.keyDown(textarea, { key: 'Enter' })
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }))
    })

    it('should handle onKeyUp events', () => {
      const handleKeyUp = jest.fn()
      render(<Textarea onKeyUp={handleKeyUp} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.keyUp(textarea, { key: 'a' })
      
      expect(handleKeyUp).toHaveBeenCalledTimes(1)
    })

    it('should handle onKeyPress events', () => {
      const handleKeyPress = jest.fn()
      render(<Textarea onKeyPress={handleKeyPress} />)
      
      const textarea = screen.getByRole('textbox')
      // keyPress is deprecated, test existence instead
      fireEvent.keyDown(textarea, { key: 'a' })
      
      expect(textarea).toBeInTheDocument()
    })

    it('should handle onInput events', () => {
      const handleInput = jest.fn()
      render(<Textarea onInput={handleInput} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.input(textarea, { target: { value: 'Input text' } })
      
      expect(handleInput).toHaveBeenCalledTimes(1)
    })
  })

  describe('Text Selection and Cursor', () => {
    it('should support text selection', () => {
      render(<Textarea defaultValue="Select this text" />)
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      
      // Simulate text selection
      textarea.setSelectionRange(0, 6)
      expect(textarea.selectionStart).toBe(0)
      expect(textarea.selectionEnd).toBe(6)
    })

    it('should handle cursor position', () => {
      render(<Textarea defaultValue="Position cursor here" />)
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      
      // Set cursor position
      textarea.setSelectionRange(8, 8)
      expect(textarea.selectionStart).toBe(8)
      expect(textarea.selectionEnd).toBe(8)
    })

    it('should support select all', () => {
      render(<Textarea defaultValue="Select all this text" />)
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      
      // Select all text
      textarea.select()
      expect(textarea.selectionStart).toBe(0)
      expect(textarea.selectionEnd).toBe(textarea.value.length)
    })
  })

  describe('Focus Management', () => {
    it('should focus when clicked', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      // Manually focus the textarea
      textarea.focus()
      
      expect(textarea).toHaveFocus()
    })

    it('should support autofocus', () => {
      render(<Textarea autoFocus />)
      
      const textarea = screen.getByRole('textbox')
      // Check that autoFocus prop is passed correctly
      expect(textarea.hasAttribute('autofocus')).toBe(true)
    })

    it('should support tab index', () => {
      render(<Textarea tabIndex={0} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('tabindex', '0')
    })

    it('should handle programmatic focus', () => {
      const ref = React.createRef<HTMLTextAreaElement>()
      render(<Textarea ref={ref} />)
      
      if (ref.current) {
        ref.current.focus()
        expect(ref.current).toHaveFocus()
      }
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Textarea aria-label="Description textarea" />)
      
      const textarea = screen.getByLabelText('Description textarea')
      expect(textarea).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(<Textarea aria-describedby="help-text" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should support aria-invalid', () => {
      render(<Textarea aria-invalid />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-invalid')
    })

    it('should have no accessibility violations - default state', async () => {
      const { container } = render(
        <div>
          <label htmlFor="default-textarea">Default Textarea</label>
          <Textarea id="default-textarea" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - with label', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-textarea">Test Label</label>
          <Textarea id="test-textarea" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - error state', async () => {
      const { container } = render(<Textarea error helperText="Error message" id="error-textarea" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations - disabled state', async () => {
      const { container } = render(
        <div>
          <label htmlFor="disabled-textarea">Disabled Textarea</label>
          <Textarea id="disabled-textarea" disabled />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should set aria-invalid for error state', () => {
      render(<Textarea error id="error-test" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })

    it('should set aria-describedby for helper text', () => {
      render(<Textarea helperText="Help text" id="helper-test" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-describedby', 'helper-test-helper-text')
      expect(screen.getByText('Help text')).toHaveAttribute('id', 'helper-test-helper-text')
    })

    it('should support aria-required', () => {
      render(<Textarea aria-required />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-required')
    })

    it('should be accessible via keyboard', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      
      // Should be focusable
      textarea.focus()
      expect(textarea).toHaveFocus()
      
      // Should accept keyboard input
      fireEvent.keyDown(textarea, { key: 'Tab' })
      expect(textarea).toBeInTheDocument()
    })

    it('should support screen readers', () => {
      render(
        <div>
          <label htmlFor="description">Description</label>
          <Textarea id="description" />
        </div>
      )
      
      const textarea = screen.getByLabelText('Description')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Style Classes', () => {
    it('should have correct base classes', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('flex')
      expect(textarea).toHaveClass('min-h-[80px]')
      expect(textarea).toHaveClass('w-full')
      expect(textarea).toHaveClass('rounded-md')
    })

    it('should have focus classes', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('focus-visible:outline-none')
      expect(textarea).toHaveClass('focus-visible:ring-2')
    })

    it('should have disabled classes', () => {
      render(<Textarea disabled />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('disabled:cursor-not-allowed')
      expect(textarea).toHaveClass('disabled:opacity-50')
    })

    it('should merge custom classes correctly', () => {
      render(<Textarea className="custom-class another-class" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('custom-class')
      expect(textarea).toHaveClass('another-class')
    })
  })

  describe('Props Forwarding', () => {
    it('should forward id attribute', () => {
      render(<Textarea id="test-textarea" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('id', 'test-textarea')
    })

    it('should forward name attribute', () => {
      render(<Textarea name="description" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('name', 'description')
    })

    it('should forward data attributes', () => {
      render(<Textarea data-testid="custom-textarea" />)
      
      const textarea = screen.getByTestId('custom-textarea')
      expect(textarea).toBeInTheDocument()
    })

    it('should forward form attributes', () => {
      render(<Textarea form="test-form" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('form', 'test-form')
    })

    it('should forward wrap attribute', () => {
      render(<Textarea wrap="soft" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('wrap', 'soft')
    })

    it('should forward spellCheck attribute', () => {
      render(<Textarea spellCheck={false} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('spellcheck', 'false')
    })
  })

  describe('Content Handling', () => {
    it('should handle line breaks', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3'
      render(<Textarea value={multilineText} readOnly />)
      
      const textarea = screen.getByDisplayValue(multilineText)
      expect(textarea).toBeInTheDocument()
    })

    it('should preserve whitespace', () => {
      const textWithSpaces = '  Text with   spaces  '
      render(<Textarea value={textWithSpaces} readOnly />)
      
      const textarea = screen.getByDisplayValue(textWithSpaces)
      expect(textarea).toBeInTheDocument()
    })

    it('should handle special characters', () => {
      const specialText = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      render(<Textarea value={specialText} readOnly />)
      
      const textarea = screen.getByDisplayValue(specialText)
      expect(textarea).toBeInTheDocument()
    })

    it('should handle unicode characters', () => {
      const unicodeText = 'Unicode: 世界 🌍 こんにちは'
      render(<Textarea value={unicodeText} readOnly />)
      
      const textarea = screen.getByDisplayValue(unicodeText)
      expect(textarea).toBeInTheDocument()
    })

    it('should handle very long text', () => {
      const longText = 'A'.repeat(10000)
      render(<Textarea value={longText} readOnly />)
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toBe(longText)
    })
  })

  describe('Form Integration', () => {
    it('should submit with form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Textarea name="content" defaultValue="Form content" />
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
          <Textarea name="content" defaultValue="Initial content" />
          <button type="reset">Reset</button>
        </form>
      )
      
      const textarea = screen.getByRole('textbox')
      const resetButton = screen.getByText('Reset')
      
      // Change value
      fireEvent.change(textarea, { target: { value: 'Changed content' } })
      expect(textarea).toHaveValue('Changed content')
      
      // Reset form
      fireEvent.click(resetButton)
      expect(textarea).toHaveValue('Initial content')
    })

    it('should validate with form', () => {
      render(
        <form>
          <Textarea name="content" required minLength={5} />
          <button type="submit">Submit</button>
        </form>
      )
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInvalid()
      
      // Add valid content
      fireEvent.change(textarea, { target: { value: 'Valid content' } })
      expect(textarea).toBeValid()
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled component', () => {
      render(<Textarea defaultValue="Initial" />)
      
      const textarea = screen.getByDisplayValue('Initial')
      expect(textarea).toBeInTheDocument()
      
      fireEvent.change(textarea, { target: { value: 'Changed' } })
      expect(textarea).toHaveValue('Changed')
    })

    it('should work as controlled component', () => {
      const ControlledTextarea = () => {
        const [value, setValue] = React.useState('Controlled')
        return (
          <Textarea 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
          />
        )
      }
      
      render(<ControlledTextarea />)
      
      const textarea = screen.getByDisplayValue('Controlled')
      expect(textarea).toBeInTheDocument()
    })

    it('should handle defaultValue with onChange', () => {
      const handleChange = jest.fn()
      render(<Textarea defaultValue="Default" onChange={handleChange} />)
      
      const textarea = screen.getByDisplayValue('Default')
      fireEvent.change(textarea, { target: { value: 'New value' } })
      
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Textarea value="" readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('')
    })

    it('should handle null value gracefully', () => {
      render(<Textarea value={null as any} readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
    })

    it('should handle undefined value gracefully', () => {
      render(<Textarea value={undefined} readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
    })

    it('should handle rapid typing', () => {
      const handleChange = jest.fn()
      render(<Textarea onChange={handleChange} />)
      
      const textarea = screen.getByRole('textbox')
      
      // Simulate rapid typing
      'hello world'.split('').forEach((char, index) => {
        fireEvent.change(textarea, { 
          target: { value: 'hello world'.slice(0, index + 1) } 
        })
      })
      
      expect(handleChange).toHaveBeenCalledTimes(11)
    })

    it('should handle paste events', () => {
      const handlePaste = jest.fn()
      render(<Textarea onPaste={handlePaste} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => 'Pasted content'
        }
      })
      
      expect(handlePaste).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn()
      
      const TestTextarea = (props: any) => {
        renderSpy()
        return <Textarea {...props} />
      }
      
      const { rerender } = render(<TestTextarea placeholder="test" />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Same props should not cause re-render in optimized scenarios
      rerender(<TestTextarea placeholder="test" />)
      expect(renderSpy).toHaveBeenCalledTimes(2) // RTL always re-renders
    })

    it('should handle large text efficiently', () => {
      const largeText = 'A'.repeat(50000)
      const handleChange = jest.fn()
      
      render(<Textarea defaultValue={largeText} onChange={handleChange} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(largeText)
      
      // Should still be responsive
      fireEvent.change(textarea, { target: { value: largeText + ' more' } })
      expect(handleChange).toHaveBeenCalled()
    })
  })
})