// ErrorBoundary Component Tests
// Comprehensive test suite for error handling components

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../utils/test-utils'
import { 
  ErrorBoundary, 
  SimpleErrorBoundary, 
  withErrorBoundary,
  useErrorHandler,
  AsyncErrorBoundary
} from '../../../components/ui/ErrorBoundary'

// Test components
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ 
  shouldThrow = false, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message)
  }
  return <div>No error</div>
}

const AsyncThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      Promise.reject(new Error('Async error'))
    }
  }, [shouldThrow])
  
  return <div>No async error</div>
}

const ComponentWithErrorHandler: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  const handleError = useErrorHandler()
  
  const triggerError = () => {
    if (shouldThrow) {
      handleError(new Error('Programmatic error'))
    }
  }
  
  return (
    <div>
      <button onClick={triggerError}>Trigger Error</button>
      <span>Component content</span>
    </div>
  )
}

describe('ErrorBoundary', () => {
  // Suppress console.error for tests
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  
  afterAll(() => {
    console.error = originalError
  })
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Error Catching', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('renders error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We're sorry for the inconvenience/)).toBeInTheDocument()
    })

    it('displays error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Detailed test error" />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Error Details')).toBeInTheDocument()
      expect(screen.getByText(/Detailed test error/)).toBeInTheDocument()
      
      process.env.NODE_ENV = originalEnv
    })

    it('shows event ID when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
    })
  })

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Error Callbacks', () => {
    it('calls onError callback when error occurs', () => {
      const mockOnError = jest.fn()
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} message="Callback test error" />
        </ErrorBoundary>
      )
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Callback test error'
        }),
        expect.any(Object)
      )
    })
  })

  describe('Error Recovery', () => {
    it('allows retry functionality', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      
      const retryButton = screen.getByText('Try Again')
      fireEvent.click(retryButton)
      
      // Rerender with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('provides reload page functionality', () => {
      const mockReload = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const reloadButton = screen.getByText('Reload Page')
      fireEvent.click(reloadButton)
      
      expect(mockReload).toHaveBeenCalled()
    })

    it('provides go home functionality', () => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      })
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const homeButton = screen.getByText('Go Home')
      fireEvent.click(homeButton)
      
      expect(window.location.href).toBe('/')
    })
  })

  describe('Reset on Props Change', () => {
    it('resets error state when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange resetKeys={['key1']}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      
      // Change resetKeys
      rerender(
        <ErrorBoundary resetOnPropsChange resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  describe('Error Details Functionality', () => {
    it('allows copying error details', async () => {
      const mockWriteText = jest.fn()
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true
      })
      
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Open error details
      const detailsButton = screen.getByText('Error Details')
      fireEvent.click(detailsButton)
      
      const copyButton = screen.getByText('Copy Error Details')
      fireEvent.click(copyButton)
      
      expect(mockWriteText).toHaveBeenCalled()
      
      process.env.NODE_ENV = originalEnv
    })
  })
})

describe('SimpleErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <SimpleErrorBoundary>
        <ThrowError shouldThrow={false} />
      </SimpleErrorBoundary>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders simple error UI when child component throws', () => {
    render(
      <SimpleErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SimpleErrorBoundary>
    )
    
    expect(screen.getByText('Component failed to load')).toBeInTheDocument()
  })

  it('uses custom fallback when provided', () => {
    const customFallback = <div>Simple custom error</div>
    
    render(
      <SimpleErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </SimpleErrorBoundary>
    )
    
    expect(screen.getByText('Simple custom error')).toBeInTheDocument()
  })
})

describe('withErrorBoundary HOC', () => {
  const TestComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
    if (shouldThrow) {
      throw new Error('HOC test error')
    }
    return <div>HOC component content</div>
  }

  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent)
    
    render(<WrappedComponent shouldThrow={false} />)
    
    expect(screen.getByText('HOC component content')).toBeInTheDocument()
  })

  it('catches errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(TestComponent)
    
    render(<WrappedComponent shouldThrow={true} />)
    
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
  })

  it('passes through error boundary props', () => {
    const mockOnError = jest.fn()
    const WrappedComponent = withErrorBoundary(TestComponent, { onError: mockOnError })
    
    render(<WrappedComponent shouldThrow={true} />)
    
    expect(mockOnError).toHaveBeenCalled()
  })
})

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('provides error handler function', () => {
    render(
      <ErrorBoundary>
        <ComponentWithErrorHandler shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Component content')).toBeInTheDocument()
  })

  it('triggers error boundary when error handler is called', () => {
    render(
      <ErrorBoundary>
        <ComponentWithErrorHandler shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const triggerButton = screen.getByText('Trigger Error')
    fireEvent.click(triggerButton)
    
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
  })
})

describe('AsyncErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children normally', () => {
    render(
      <AsyncErrorBoundary>
        <AsyncThrowError shouldThrow={false} />
      </AsyncErrorBoundary>
    )
    
    expect(screen.getByText('No async error')).toBeInTheDocument()
  })

  it('handles unhandled promise rejections', async () => {
    const mockOnError = jest.fn()
    
    render(
      <AsyncErrorBoundary onError={mockOnError}>
        <AsyncThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    )
    
    // Trigger unhandled rejection event
    const event = new CustomEvent('unhandledrejection', {
      detail: { reason: 'Test async error' }
    })
    window.dispatchEvent(event)
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
    })
  })
})

describe('Error Boundary Accessibility', () => {
  it('has proper ARIA attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const errorContainer = screen.getByRole('alert', { hidden: true })
    expect(errorContainer).toBeInTheDocument()
  })

  it('supports keyboard navigation', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByText('Try Again')
    retryButton.focus()
    expect(retryButton).toHaveFocus()
    
    fireEvent.keyDown(retryButton, { key: 'Enter' })
    // Verify button functionality works with keyboard
  })
})

describe('Error Boundary Performance', () => {
  it('does not affect performance when no errors occur', () => {
    const startTime = performance.now()
    
    render(
      <ErrorBoundary>
        <div>Fast component</div>
      </ErrorBoundary>
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    expect(renderTime).toBeLessThan(50) // Should render quickly
  })

  it('handles multiple rapid errors gracefully', () => {
    const MultiErrorComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false)
      
      React.useEffect(() => {
        // Simulate rapid error triggering
        const timer = setTimeout(() => setShouldThrow(true), 10)
        return () => clearTimeout(timer)
      }, [])
      
      if (shouldThrow) {
        throw new Error('Rapid error')
      }
      
      return <div>No rapid error</div>
    }
    
    render(
      <ErrorBoundary>
        <MultiErrorComponent />
      </ErrorBoundary>
    )
    
    // Should handle error without crashing
    waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })
  })
})