/**
 * ===============================================
 * CARD COMPONENT UNIT TESTS
 * Vitest + React Testing Library
 * ===============================================
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

describe('Card Component', () => {
  // ==========================================
  // TEST 1: Basic Card Rendering
  // ==========================================
  it('renders basic card correctly', () => {
    render(
      <Card data-testid="test-card">
        <p>Card content</p>
      </Card>
    )
    
    const card = screen.getByTestId('test-card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm')
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 2: Custom className
  // ==========================================
  it('applies custom className to card', () => {
    render(
      <Card className="custom-class" data-testid="custom-card">
        Content
      </Card>
    )
    
    const card = screen.getByTestId('custom-card')
    expect(card).toHaveClass('custom-class')
    // Should still have default classes
    expect(card).toHaveClass('rounded-lg', 'border')
  })

  // ==========================================
  // TEST 3: CardHeader Component
  // ==========================================
  it('renders CardHeader correctly', () => {
    render(
      <Card>
        <CardHeader data-testid="card-header">
          <p>Header content</p>
        </CardHeader>
      </Card>
    )
    
    const header = screen.getByTestId('card-header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 4: CardTitle Component
  // ==========================================
  it('renders CardTitle correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    )
    
    const title = screen.getByText('Test Title')
    expect(title).toBeInTheDocument()
    expect(title.tagName).toBe('H3')
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
  })

  // ==========================================
  // TEST 5: CardDescription Component
  // ==========================================
  it('renders CardDescription correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Test description text</CardDescription>
        </CardHeader>
      </Card>
    )
    
    const description = screen.getByText('Test description text')
    expect(description).toBeInTheDocument()
    expect(description.tagName).toBe('P')
    expect(description).toHaveClass('text-sm', 'text-muted-foreground')
  })

  // ==========================================
  // TEST 6: CardContent Component
  // ==========================================
  it('renders CardContent correctly', () => {
    render(
      <Card>
        <CardContent data-testid="card-content">
          <p>Main content</p>
        </CardContent>
      </Card>
    )
    
    const content = screen.getByTestId('card-content')
    expect(content).toBeInTheDocument()
    expect(content).toHaveClass('p-6', 'pt-0')
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 7: CardFooter Component
  // ==========================================
  it('renders CardFooter correctly', () => {
    render(
      <Card>
        <CardFooter data-testid="card-footer">
          <button>Action</button>
        </CardFooter>
      </Card>
    )
    
    const footer = screen.getByTestId('card-footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 8: Complete Card Composition
  // ==========================================
  it('renders complete card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>This is a complete card example</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card body content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Save</button>
          <button>Cancel</button>
        </CardFooter>
      </Card>
    )
    
    expect(screen.getByText('Complete Card')).toBeInTheDocument()
    expect(screen.getByText('This is a complete card example')).toBeInTheDocument()
    expect(screen.getByText('Card body content goes here')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 9: ForwardRef Functionality
  // ==========================================
  it('forwards ref correctly', () => {
    const ref = { current: null }
    
    render(
      <Card ref={ref}>
        <p>Content</p>
      </Card>
    )
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  // ==========================================
  // TEST 10: Custom Props Forwarding
  // ==========================================
  it('forwards custom props correctly', () => {
    render(
      <Card 
        data-custom="test-value"
        aria-label="Custom card"
        onClick={() => {}}
        data-testid="props-card"
      >
        <p>Content</p>
      </Card>
    )
    
    const card = screen.getByTestId('props-card')
    expect(card).toHaveAttribute('data-custom', 'test-value')
    expect(card).toHaveAttribute('aria-label', 'Custom card')
  })

  // ==========================================
  // TEST 11: Multiple Cards on Page
  // ==========================================
  it('renders multiple cards independently', () => {
    render(
      <>
        <Card data-testid="card-1">
          <CardTitle>Card 1</CardTitle>
        </Card>
        <Card data-testid="card-2">
          <CardTitle>Card 2</CardTitle>
        </Card>
      </>
    )
    
    expect(screen.getByTestId('card-1')).toBeInTheDocument()
    expect(screen.getByTestId('card-2')).toBeInTheDocument()
    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
  })

  // ==========================================
  // TEST 12: Accessibility
  // ==========================================
  it('maintains proper heading hierarchy', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Accessible Title</CardTitle>
          <CardDescription>Accessible description</CardDescription>
        </CardHeader>
      </Card>
    )
    
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Accessible Title')
  })
})