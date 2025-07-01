/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { ProgressIndicator, ProgressStep } from '../ProgressIndicator'

expect.extend(toHaveNoViolations)

// Mock Server-Sent Events
global.EventSource = jest.fn().mockImplementation(url => ({
  url,
  readyState: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
}))

const mockSteps: ProgressStep[] = [
  {
    id: 'upload',
    label: 'Upload Document',
    description: 'Uploading your file to the server',
    status: 'completed',
    progress: 100,
  },
  {
    id: 'process',
    label: 'Processing',
    description: 'Analyzing document content',
    status: 'processing',
    progress: 65,
  },
  {
    id: 'translate',
    label: 'Translation',
    description: 'Translating text to target language',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Translation finished successfully',
    status: 'pending',
    progress: 0,
  },
]

const mockErrorSteps: ProgressStep[] = [
  ...mockSteps.slice(0, 2),
  {
    id: 'translate',
    label: 'Translation',
    description: 'Failed to translate document',
    status: 'error',
    progress: 0,
  },
]

describe('ProgressIndicator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders vertical progress indicator by default', () => {
    render(<ProgressIndicator steps={mockSteps} />)

    const container = screen.getByRole('region', { name: /progress/i })
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('space-y-4') // Vertical spacing
  })

  it('renders horizontal layout when specified', () => {
    render(<ProgressIndicator steps={mockSteps} variant="horizontal" />)

    const container = screen.getByRole('region', { name: /progress/i })
    expect(container).toHaveClass('flex', 'space-x-4') // Horizontal spacing
  })

  it('displays all step labels and descriptions', () => {
    render(<ProgressIndicator steps={mockSteps} />)

    mockSteps.forEach(step => {
      expect(screen.getByText(step.label)).toBeInTheDocument()
      if (step.description) {
        expect(screen.getByText(step.description)).toBeInTheDocument()
      }
    })
  })

  it('shows correct status icons for different states', () => {
    render(<ProgressIndicator steps={mockSteps} />)

    // Check for completed step icon (should be check circle)
    const completedStep = screen
      .getByText('Upload Document')
      .closest('[role="listitem"]')
    expect(
      completedStep?.querySelector('[data-testid="check-icon"]')
    ).toBeInTheDocument()

    // Check for processing step icon (should be spinning loader)
    const processingStep = screen
      .getByText('Processing')
      .closest('[role="listitem"]')
    expect(processingStep?.querySelector('.animate-spin')).toBeInTheDocument()

    // Check for pending step icon (should be clock)
    const pendingStep = screen
      .getByText('Translation')
      .closest('[role="listitem"]')
    expect(
      pendingStep?.querySelector('[data-testid="clock-icon"]')
    ).toBeInTheDocument()
  })

  it('displays error status correctly', () => {
    render(<ProgressIndicator steps={mockErrorSteps} />)

    const errorStep = screen
      .getByText('Translation')
      .closest('[role="listitem"]')
    expect(
      errorStep?.querySelector('[data-testid="alert-circle-icon"]')
    ).toBeInTheDocument()
    expect(errorStep).toHaveClass('text-red-600') // Error styling
  })

  it('shows progress bars when enabled', () => {
    render(<ProgressIndicator steps={mockSteps} showProgress={true} />)

    // Should show progress bar for processing step
    const progressBars = screen.getAllByRole('progressbar')
    expect(progressBars.length).toBeGreaterThan(0)

    // Check progress value
    const processingProgress = screen.getByDisplayValue('65')
    expect(processingProgress).toBeInTheDocument()
  })

  it('hides progress bars when disabled', () => {
    render(<ProgressIndicator steps={mockSteps} showProgress={false} />)

    const progressBars = screen.queryAllByRole('progressbar')
    expect(progressBars).toHaveLength(0)
  })

  it('highlights current step when specified', () => {
    render(<ProgressIndicator steps={mockSteps} currentStep="process" />)

    const currentStep = screen
      .getByText('Processing')
      .closest('[role="listitem"]')
    expect(currentStep).toHaveClass('border-accent') // Current step highlighting
  })

  it('applies custom className', () => {
    render(<ProgressIndicator steps={mockSteps} className="custom-progress" />)

    const container = screen.getByRole('region', { name: /progress/i })
    expect(container).toHaveClass('custom-progress')
  })

  it('handles empty steps array gracefully', () => {
    render(<ProgressIndicator steps={[]} />)

    const container = screen.getByRole('region', { name: /progress/i })
    expect(container).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('shows progress percentage text for processing steps', () => {
    render(<ProgressIndicator steps={mockSteps} showProgress={true} />)

    expect(screen.getByText('65%')).toBeInTheDocument()
  })

  it('supports bilingual content', () => {
    const vietnameseSteps: ProgressStep[] = [
      {
        id: 'upload',
        label: 'Tải lên tài liệu',
        description: 'Đang tải tệp của bạn lên máy chủ',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'process',
        label: 'Xử lý',
        description: 'Phân tích nội dung tài liệu',
        status: 'processing',
        progress: 45,
      },
    ]

    render(<ProgressIndicator steps={vietnameseSteps} />)

    expect(screen.getByText('Tải lên tài liệu')).toBeInTheDocument()
    expect(
      screen.getByText('Đang tải tệp của bạn lên máy chủ')
    ).toBeInTheDocument()
    expect(screen.getByText('Xử lý')).toBeInTheDocument()
  })

  it('handles long step descriptions gracefully', () => {
    const longDescSteps: ProgressStep[] = [
      {
        id: 'process',
        label: 'Processing',
        description:
          'This is a very long description that should wrap properly and not break the layout when displayed in the progress indicator component',
        status: 'processing',
        progress: 50,
      },
    ]

    render(<ProgressIndicator steps={longDescSteps} />)

    const description = screen.getByText(/This is a very long description/)
    expect(description).toBeInTheDocument()
    // Check that text wraps properly
    expect(description).toHaveClass('text-sm')
  })

  it('passes accessibility audit', async () => {
    const { container } = render(
      <ProgressIndicator
        steps={mockSteps}
        currentStep="process"
        showProgress={true}
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has proper ARIA attributes', () => {
    render(<ProgressIndicator steps={mockSteps} currentStep="process" />)

    const container = screen.getByRole('region', { name: /progress/i })
    expect(container).toHaveAttribute(
      'aria-label',
      expect.stringContaining('progress')
    )

    const stepList = screen.getByRole('list')
    expect(stepList).toBeInTheDocument()

    const steps = screen.getAllByRole('listitem')
    expect(steps).toHaveLength(mockSteps.length)

    // Check current step has proper aria-current
    const currentStep = screen
      .getByText('Processing')
      .closest('[role="listitem"]')
    expect(currentStep).toHaveAttribute('aria-current', 'step')
  })

  it('provides screen reader friendly status descriptions', () => {
    render(<ProgressIndicator steps={mockSteps} />)

    // Check for screen reader text
    expect(screen.getByText(/completed/i)).toBeInTheDocument()
    expect(screen.getByText(/processing/i)).toBeInTheDocument()
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<ProgressIndicator steps={mockSteps} />)

    const container = screen.getByRole('region')
    container.focus()
    expect(container).toHaveFocus()

    // Test tab navigation through steps
    await user.tab()
    // Should navigate to focusable elements within steps
  })

  it('updates progress dynamically', () => {
    const { rerender } = render(
      <ProgressIndicator steps={mockSteps} showProgress={true} />
    )

    expect(screen.getByText('65%')).toBeInTheDocument()

    const updatedSteps = [...mockSteps]
    updatedSteps[1] = { ...updatedSteps[1], progress: 85 }

    rerender(<ProgressIndicator steps={updatedSteps} showProgress={true} />)

    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.queryByText('65%')).not.toBeInTheDocument()
  })

  it('handles status transitions correctly', () => {
    const { rerender } = render(<ProgressIndicator steps={mockSteps} />)

    // Initially processing
    expect(
      screen
        .getByText('Processing')
        .closest('[role="listitem"]')
        ?.querySelector('.animate-spin')
    ).toBeInTheDocument()

    // Update to completed
    const updatedSteps = [...mockSteps]
    updatedSteps[1] = { ...updatedSteps[1], status: 'completed', progress: 100 }

    rerender(<ProgressIndicator steps={updatedSteps} />)

    expect(
      screen
        .getByText('Processing')
        .closest('[role="listitem"]')
        ?.querySelector('[data-testid="check-icon"]')
    ).toBeInTheDocument()
  })

  it('maintains proper contrast ratios', () => {
    render(<ProgressIndicator steps={mockSteps} />)

    // Check that text colors provide sufficient contrast
    const completedStep = screen
      .getByText('Upload Document')
      .closest('[role="listitem"]')
    expect(completedStep).toHaveClass('text-green-600') // Good contrast for success

    const pendingStep = screen
      .getByText('Translation')
      .closest('[role="listitem"]')
    expect(pendingStep).toHaveClass('text-gray-400') // Appropriate contrast for inactive
  })

  it('handles real-time progress updates', async () => {
    const mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
    }

    global.EventSource = jest.fn(() => mockEventSource)

    render(<ProgressIndicator steps={mockSteps} />)

    // Simulate real-time update
    const messageHandler = mockEventSource.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1]

    if (messageHandler) {
      messageHandler({
        data: JSON.stringify({
          stepId: 'process',
          progress: 80,
          status: 'processing',
        }),
      })
    }

    expect(mockEventSource.addEventListener).toHaveBeenCalled()
  })
})
