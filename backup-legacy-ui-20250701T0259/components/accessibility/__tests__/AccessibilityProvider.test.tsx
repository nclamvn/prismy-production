/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { 
  AccessibilityProvider, 
  useAccessibility 
} from '../AccessibilityProvider'

expect.extend(toHaveNoViolations)

// Test component to verify the hook works
const TestComponent = () => {
  const { 
    settings, 
    updateSetting, 
    announceToScreenReader 
  } = useAccessibility()

  return (
    <div>
      <div data-testid="high-contrast">{String(settings.highContrast)}</div>
      <div data-testid="reduced-motion">{String(settings.reducedMotion)}</div>
      <div data-testid="large-text">{String(settings.largeText)}</div>
      <div data-testid="keyboard-navigation">{String(settings.keyboardNavigation)}</div>
      <button 
        onClick={() => announceToScreenReader('Test announcement')}
        data-testid="announce-button"
      >
        Announce
      </button>
      <button 
        onClick={() => updateSetting('highContrast', !settings.highContrast)}
        data-testid="toggle-contrast"
      >
        Toggle High Contrast
      </button>
    </div>
  )
}

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    document.documentElement.className = ''
    document.body.className = ''
    
    // Clean up any announcement elements
    document.querySelectorAll('[aria-live]').forEach(el => {
      if (el.id !== 'accessibility-announcements') {
        el.remove()
      }
    })
  })

  it('renders children and provides accessibility context', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false')
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false')
    expect(screen.getByTestId('large-text')).toHaveTextContent('false')
    expect(screen.getByTestId('keyboard-navigation')).toHaveTextContent('true')
  })

  it('includes accessibility announcements region', () => {
    render(
      <AccessibilityProvider>
        <div>Content</div>
      </AccessibilityProvider>
    )

    const announcementsRegion = document.getElementById('accessibility-announcements')
    expect(announcementsRegion).toBeInTheDocument()
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAccessibility must be used within AccessibilityProvider')

    console.error = originalError
  })

  it('updates settings correctly', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    const toggleButton = screen.getByTestId('toggle-contrast')
    const contrastDisplay = screen.getByTestId('high-contrast')

    expect(contrastDisplay).toHaveTextContent('false')

    fireEvent.click(toggleButton)
    expect(contrastDisplay).toHaveTextContent('true')

    fireEvent.click(toggleButton)
    expect(contrastDisplay).toHaveTextContent('false')
  })

  it('loads saved settings from localStorage', () => {
    const savedSettings = {
      highContrast: true,
      reducedMotion: true,
      largeText: false,
      dyslexiaFriendly: false,
      keyboardNavigation: true,
      screenReaderMode: false
    }

    const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(savedSettings))
    window.localStorage.getItem = mockGetItem

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    expect(mockGetItem).toHaveBeenCalledWith('accessibility-settings')
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true')
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true')
  })

  it('saves settings to localStorage when updated', () => {
    const mockSetItem = jest.fn()
    window.localStorage.setItem = mockSetItem

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    const toggleButton = screen.getByTestId('toggle-contrast')
    fireEvent.click(toggleButton)

    expect(mockSetItem).toHaveBeenCalledWith('accessibility-settings', expect.stringContaining('"highContrast":true'))
  })

  it('detects system reduced motion preference', () => {
    const mockMatchMedia = jest.fn().mockImplementation(query => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return {
          matches: true,
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        }
      }
      return {
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }
    })
    
    window.matchMedia = mockMatchMedia

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true')
  })

  it('detects system high contrast preference', () => {
    const mockMatchMedia = jest.fn().mockImplementation(query => {
      if (query === '(prefers-contrast: high)') {
        return {
          matches: true,
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        }
      }
      return {
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }
    })
    
    window.matchMedia = mockMatchMedia

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true')
  })

  it('applies accessibility classes to document', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    const toggleButton = screen.getByTestId('toggle-contrast')
    fireEvent.click(toggleButton)

    // Should apply high contrast class
    expect(document.documentElement).toHaveClass('accessibility-high-contrast')
  })

  it('announces messages to screen readers', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    const announceButton = screen.getByTestId('announce-button')
    fireEvent.click(announceButton)

    // Check that announcement element is created
    await waitFor(() => {
      const announcements = document.querySelectorAll('[aria-live]')
      const messageAnnouncement = Array.from(announcements).find(
        el => el.textContent === 'Test announcement'
      )
      expect(messageAnnouncement).toBeInTheDocument()
    }, { timeout: 100 })
  })

  it('passes accessibility audit', async () => {
    const { container } = render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('provides default accessibility settings', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    // Check default values
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false')
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false')
    expect(screen.getByTestId('large-text')).toHaveTextContent('false')
    expect(screen.getByTestId('keyboard-navigation')).toHaveTextContent('true') // Default true
  })

  it('handles malformed localStorage data gracefully', () => {
    const mockGetItem = jest.fn().mockReturnValue('invalid json {')
    window.localStorage.getItem = mockGetItem

    // Should not throw error and use defaults
    expect(() => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      )
    }).not.toThrow()

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false')
  })
})

describe('AccessibilityProvider Integration', () => {
  it('works with real user workflow', async () => {
    const WorkflowComponent = () => {
      const { announceToScreenReader, updateSetting, settings } = useAccessibility()
      
      const handleSubmit = () => {
        announceToScreenReader('Form submitted successfully')
      }
      
      const handleError = () => {
        announceToScreenReader('Error: Please check your input', 'assertive')
      }
      
      return (
        <div>
          <button onClick={handleSubmit} data-testid="submit">Submit</button>
          <button onClick={handleError} data-testid="error">Trigger Error</button>
          <button 
            onClick={() => updateSetting('largeText', !settings.largeText)}
            data-testid="toggle-text"
          >
            Toggle Large Text
          </button>
          <div data-testid="large-text-status">{String(settings.largeText)}</div>
        </div>
      )
    }

    render(
      <AccessibilityProvider>
        <WorkflowComponent />
      </AccessibilityProvider>
    )

    const submitButton = screen.getByTestId('submit')
    const errorButton = screen.getByTestId('error')
    const toggleTextButton = screen.getByTestId('toggle-text')
    const textStatus = screen.getByTestId('large-text-status')

    // Test text size toggle
    expect(textStatus).toHaveTextContent('false')
    fireEvent.click(toggleTextButton)
    expect(textStatus).toHaveTextContent('true')

    // Test announcements
    fireEvent.click(submitButton)
    await waitFor(() => {
      const successMessage = document.querySelector('[aria-live="polite"]')
      expect(successMessage?.textContent).toBe('Form submitted successfully')
    })

    fireEvent.click(errorButton)
    await waitFor(() => {
      const errorMessage = document.querySelector('[aria-live="assertive"]')
      expect(errorMessage?.textContent).toBe('Error: Please check your input')
    })
  })

  it('persists settings across component remounts', () => {
    const mockGetItem = jest.fn()
    const mockSetItem = jest.fn()
    window.localStorage.getItem = mockGetItem
    window.localStorage.setItem = mockSetItem

    const { unmount } = render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    const toggleButton = screen.getByTestId('toggle-contrast')
    fireEvent.click(toggleButton)

    // Verify settings were saved
    expect(mockSetItem).toHaveBeenCalled()

    unmount()

    // Mock the saved data being returned
    mockGetItem.mockReturnValue('{"highContrast":true,"reducedMotion":false,"largeText":false,"dyslexiaFriendly":false,"keyboardNavigation":true,"screenReaderMode":false}')

    // Remount component
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    // Should load saved settings
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true')
  })
})