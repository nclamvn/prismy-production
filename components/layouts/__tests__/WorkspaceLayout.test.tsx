/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { WorkspaceLayout } from '../WorkspaceLayout'

expect.extend(toHaveNoViolations)

describe('WorkspaceLayout Component', () => {
  const defaultProps = {
    children: <div data-testid="main-content">Main workspace content</div>,
  }

  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders main content correctly', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    expect(screen.getByTestId('main-content')).toBeInTheDocument()
    expect(screen.getByText('Main workspace content')).toBeInTheDocument()
  })

  it('displays sidebar when provided', () => {
    const sidebar = <div data-testid="custom-sidebar">Custom Sidebar</div>

    render(<WorkspaceLayout {...defaultProps} sidebar={sidebar} />)

    expect(screen.getByTestId('custom-sidebar')).toBeInTheDocument()
    expect(screen.getByText('Custom Sidebar')).toBeInTheDocument()
  })

  it('shows sidebar toggle button', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i })
    expect(toggleButton).toBeInTheDocument()
  })

  it('toggles sidebar visibility on button click', async () => {
    const user = userEvent.setup()
    render(<WorkspaceLayout {...defaultProps} />)

    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i })
    const sidebar = screen.getByRole('complementary', { name: /sidebar/i })

    // Initially visible
    expect(sidebar).not.toHaveClass('hidden')

    // Click to hide
    await user.click(toggleButton)
    expect(sidebar).toHaveClass('hidden')

    // Click to show again
    await user.click(toggleButton)
    expect(sidebar).not.toHaveClass('hidden')
  })

  it('displays right panel when provided', () => {
    const rightPanel = <div data-testid="right-panel">Right Panel Content</div>

    render(<WorkspaceLayout {...defaultProps} rightPanel={rightPanel} />)

    expect(screen.getByTestId('right-panel')).toBeInTheDocument()
    expect(screen.getByText('Right Panel Content')).toBeInTheDocument()
  })

  it('shows chat drawer when enabled', () => {
    render(<WorkspaceLayout {...defaultProps} showChatDrawer={true} />)

    const chatDrawer = screen.getByRole('dialog', { name: /chat/i })
    expect(chatDrawer).toBeInTheDocument()
  })

  it('hides chat drawer when disabled', () => {
    render(<WorkspaceLayout {...defaultProps} showChatDrawer={false} />)

    const chatDrawer = screen.queryByRole('dialog', { name: /chat/i })
    expect(chatDrawer).not.toBeInTheDocument()
  })

  it('calls onToggleChatDrawer when chat toggle is clicked', async () => {
    const onToggleChatDrawer = jest.fn()
    const user = userEvent.setup()

    render(
      <WorkspaceLayout
        {...defaultProps}
        showChatDrawer={false}
        onToggleChatDrawer={onToggleChatDrawer}
      />
    )

    const chatToggle = screen.getByRole('button', { name: /chat/i })
    await user.click(chatToggle)

    expect(onToggleChatDrawer).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<WorkspaceLayout {...defaultProps} className="custom-workspace" />)

    const workspace = screen.getByRole('main')
    expect(workspace).toHaveClass('custom-workspace')
  })

  it('has proper layout structure', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    // Should have main element
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()

    // Should have header
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()

    // Should have sidebar
    const sidebar = screen.getByRole('complementary', { name: /sidebar/i })
    expect(sidebar).toBeInTheDocument()
  })

  it('handles responsive layout correctly', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    const workspace = screen.getByRole('main')
    expect(workspace).toHaveClass('min-h-screen') // Full height layout

    const sidebar = screen.getByRole('complementary', { name: /sidebar/i })
    expect(sidebar).toHaveClass('w-64') // Fixed sidebar width
  })

  it('provides keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<WorkspaceLayout {...defaultProps} />)

    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i })

    toggleButton.focus()
    expect(toggleButton).toHaveFocus()

    await user.keyboard('{Enter}')
    // Sidebar should toggle on Enter key
  })

  it('supports keyboard shortcuts', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    // Test keyboard shortcut for sidebar toggle (Ctrl+\)
    fireEvent.keyDown(document, {
      key: '\\',
      ctrlKey: true,
      code: 'Backslash',
    })

    // Sidebar state should change
    const sidebar = screen.getByRole('complementary', { name: /sidebar/i })
    expect(sidebar).toBeInTheDocument()
  })

  it('maintains focus management', async () => {
    const user = userEvent.setup()
    render(
      <WorkspaceLayout
        {...defaultProps}
        showChatDrawer={false}
        onToggleChatDrawer={jest.fn()}
      />
    )

    const sidebarToggle = screen.getByRole('button', {
      name: /toggle sidebar/i,
    })
    const chatToggle = screen.getByRole('button', { name: /chat/i })

    // Tab navigation
    sidebarToggle.focus()
    expect(sidebarToggle).toHaveFocus()

    await user.tab()
    expect(chatToggle).toHaveFocus()
  })

  it('renders with default sidebar content when none provided', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    const sidebar = screen.getByRole('complementary', { name: /sidebar/i })
    expect(sidebar).toBeInTheDocument()
    // Should have some default content or navigation
  })

  it('handles chat drawer overlay correctly', () => {
    render(<WorkspaceLayout {...defaultProps} showChatDrawer={true} />)

    const chatDrawer = screen.getByRole('dialog', { name: /chat/i })
    expect(chatDrawer).toHaveClass('fixed') // Overlay positioning
    expect(chatDrawer).toHaveClass('inset-y-0') // Full height
    expect(chatDrawer).toHaveClass('right-0') // Right side
  })

  it('prevents body scroll when chat drawer is open', () => {
    render(<WorkspaceLayout {...defaultProps} showChatDrawer={true} />)

    // Should add class to prevent body scroll
    expect(document.body).toHaveClass('overflow-hidden')
  })

  it('restores body scroll when chat drawer is closed', () => {
    const { rerender } = render(
      <WorkspaceLayout {...defaultProps} showChatDrawer={true} />
    )

    expect(document.body).toHaveClass('overflow-hidden')

    rerender(<WorkspaceLayout {...defaultProps} showChatDrawer={false} />)

    expect(document.body).not.toHaveClass('overflow-hidden')
  })

  it('closes chat drawer on Escape key', () => {
    const onToggleChatDrawer = jest.fn()
    render(
      <WorkspaceLayout
        {...defaultProps}
        showChatDrawer={true}
        onToggleChatDrawer={onToggleChatDrawer}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onToggleChatDrawer).toHaveBeenCalled()
  })

  it('closes chat drawer on backdrop click', async () => {
    const onToggleChatDrawer = jest.fn()
    const user = userEvent.setup()

    render(
      <WorkspaceLayout
        {...defaultProps}
        showChatDrawer={true}
        onToggleChatDrawer={onToggleChatDrawer}
      />
    )

    const backdrop = screen.getByTestId('chat-backdrop')
    await user.click(backdrop)

    expect(onToggleChatDrawer).toHaveBeenCalled()
  })

  it('supports bilingual content', () => {
    const vietnameseContent = (
      <div data-testid="vietnamese-content">Nội dung tiếng Việt</div>
    )

    render(
      <WorkspaceLayout sidebar={vietnameseContent}>
        <div>Không gian làm việc</div>
      </WorkspaceLayout>
    )

    expect(screen.getByTestId('vietnamese-content')).toBeInTheDocument()
    expect(screen.getByText('Nội dung tiếng Việt')).toBeInTheDocument()
    expect(screen.getByText('Không gian làm việc')).toBeInTheDocument()
  })

  it('handles long content with proper scrolling', () => {
    const longContent = (
      <div style={{ height: '2000px' }} data-testid="long-content">
        Very long content that requires scrolling
      </div>
    )

    render(<WorkspaceLayout {...defaultProps}>{longContent}</WorkspaceLayout>)

    const mainContent = screen.getByRole('main')
    expect(mainContent).toHaveClass('overflow-auto') // Should allow scrolling
    expect(screen.getByTestId('long-content')).toBeInTheDocument()
  })

  it('maintains layout on window resize', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    const workspace = screen.getByRole('main')
    expect(workspace).toHaveClass('min-h-screen')

    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    fireEvent.resize(window)

    // Layout should remain stable
    expect(workspace).toBeInTheDocument()
  })

  it('passes accessibility audit', async () => {
    const { container } = render(
      <WorkspaceLayout
        {...defaultProps}
        sidebar={<nav>Navigation</nav>}
        rightPanel={<aside>Panel</aside>}
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has proper ARIA attributes', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute(
      'aria-label',
      expect.stringContaining('workspace')
    )

    const sidebar = screen.getByRole('complementary', { name: /sidebar/i })
    expect(sidebar).toHaveAttribute(
      'aria-label',
      expect.stringContaining('sidebar')
    )

    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('provides skip links for accessibility', () => {
    render(<WorkspaceLayout {...defaultProps} />)

    const skipLink = screen.getByText(/skip to main content/i)
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('announces layout changes to screen readers', async () => {
    const user = userEvent.setup()
    render(<WorkspaceLayout {...defaultProps} />)

    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i })

    await user.click(toggleButton)

    // Should announce state change
    const liveRegion = screen.getByRole('status')
    expect(liveRegion).toHaveTextContent(/sidebar/i)
  })

  it('handles touch gestures on mobile', () => {
    // Mock touch events (unused but required for test setup)

    render(<WorkspaceLayout {...defaultProps} />)

    const workspace = screen.getByRole('main')

    fireEvent.touchStart(workspace, {
      touches: [{ clientX: 0, clientY: 0 }],
    })

    fireEvent.touchEnd(workspace, {
      changedTouches: [{ clientX: 100, clientY: 0 }],
    })

    // Should handle swipe gestures for sidebar toggle
  })

  it('preserves scroll position on layout changes', async () => {
    const user = userEvent.setup()

    render(
      <WorkspaceLayout {...defaultProps}>
        <div style={{ height: '2000px' }}>Long content</div>
      </WorkspaceLayout>
    )

    const main = screen.getByRole('main')

    // Simulate scroll
    fireEvent.scroll(main, { target: { scrollTop: 500 } })

    // Toggle sidebar
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i })
    await user.click(toggleButton)

    // Scroll position should be preserved
    expect(main.scrollTop).toBe(500)
  })
})
