import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'

describe('Input', () => {
  it('renders with default styling', () => {
    render(<Input placeholder="Enter text" />)

    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-border-default',
      'bg-surface'
    )
  })

  it('handles different input types', () => {
    const { rerender } = render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" />)
    expect(
      screen.getByLabelText(/password/i) || screen.getByDisplayValue('')
    ).toHaveAttribute('type', 'password')

    rerender(<Input type="search" />)
    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search')
  })

  it('handles value and onChange', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    render(<Input value="" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test')

    expect(handleChange).toHaveBeenCalledTimes(4) // Once for each character
  })

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />)

    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass(
      'disabled:cursor-not-allowed',
      'disabled:opacity-50'
    )
  })

  it('applies placeholder text', () => {
    render(<Input placeholder="Search documents..." />)

    expect(
      screen.getByPlaceholderText('Search documents...')
    ).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    render(<Input className="custom-input" />)

    expect(screen.getByRole('textbox')).toHaveClass('custom-input')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} />)

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
  })

  it('passes through input props', () => {
    render(<Input name="test-input" id="test-input" maxLength={100} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('name', 'test-input')
    expect(input).toHaveAttribute('id', 'test-input')
    expect(input).toHaveAttribute('maxlength', '100')
  })

  it('has correct focus styles', () => {
    render(<Input />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-border-focus'
    )
  })

  it('handles controlled component pattern', async () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          data-testid="controlled-input"
        />
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)

    const input = screen.getByTestId('controlled-input')
    await user.type(input, 'controlled')

    expect(input).toHaveValue('controlled')
  })
})
