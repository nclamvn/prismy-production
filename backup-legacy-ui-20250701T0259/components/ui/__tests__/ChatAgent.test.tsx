/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { ChatAgent } from '../ChatAgent'

expect.extend(toHaveNoViolations)

// Mock fetch API
global.fetch = jest.fn()

const mockContextData = {
  documentId: 'doc-123',
  translationText: 'Hello world',
  sourceLanguage: 'en',
  targetLanguage: 'vi',
}

describe('ChatAgent Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            response: 'This is a test response from the AI agent.',
            confidence: 0.95,
            suggestions: ['Try rephrasing', 'Check context'],
          }),
      })
    )
  })

  it('renders embedded variant by default', () => {
    render(<ChatAgent />)

    const chatContainer = screen.getByRole('region', { name: /chat/i })
    expect(chatContainer).toBeInTheDocument()
    expect(chatContainer).not.toHaveClass('fixed') // Not a drawer
  })

  it('renders drawer variant when specified', () => {
    render(<ChatAgent variant="drawer" isOpen={true} />)

    const chatContainer = screen.getByRole('region', { name: /chat/i })
    expect(chatContainer).toHaveClass('fixed') // Drawer styling
  })

  it('shows and hides drawer correctly', () => {
    const onClose = jest.fn()
    const { rerender } = render(
      <ChatAgent variant="drawer" isOpen={false} onClose={onClose} />
    )

    // Should not be visible when closed
    expect(
      screen.queryByRole('region', { name: /chat/i })
    ).not.toBeInTheDocument()

    // Should be visible when open
    rerender(<ChatAgent variant="drawer" isOpen={true} onClose={onClose} />)
    expect(screen.getByRole('region', { name: /chat/i })).toBeInTheDocument()
  })

  it('displays custom title and placeholder', () => {
    render(
      <ChatAgent
        title="AI Translation Assistant"
        placeholder="Ask me about your translation..."
      />
    )

    expect(screen.getByText('AI Translation Assistant')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Ask me about your translation...')
    ).toBeInTheDocument()
  })

  it('allows users to send messages', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'How do I translate this text?')
    await user.click(sendButton)

    // Should show user message
    expect(
      screen.getByText('How do I translate this text?')
    ).toBeInTheDocument()

    // Should call API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'How do I translate this text?',
          contextData: undefined,
        }),
      })
    })
  })

  it('sends message on Enter key', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })

    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')

    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalled()
  })

  it('prevents sending empty messages', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.click(sendButton)

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('displays AI responses correctly', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Help me translate')
    await user.click(sendButton)

    // Wait for AI response
    await waitFor(() => {
      expect(
        screen.getByText('This is a test response from the AI agent.')
      ).toBeInTheDocument()
    })
  })

  it('shows typing indicator during API call', async () => {
    global.fetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ response: 'Test response' }),
              }),
            100
          )
        )
    )

    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test message')
    await user.click(sendButton)

    // Should show typing indicator
    expect(screen.getByText(/typing/i)).toBeInTheDocument()

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument()
    })

    // Typing indicator should be gone
    expect(screen.queryByText(/typing/i)).not.toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('API Error'))

    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test message')
    await user.click(sendButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('includes context data in API calls', async () => {
    const user = userEvent.setup()
    render(<ChatAgent contextData={mockContextData} />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Translate this')
    await user.click(sendButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Translate this',
          contextData: mockContextData,
        }),
      })
    })
  })

  it('displays confidence scores for AI responses', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/95%/)).toBeInTheDocument() // Confidence score
    })
  })

  it('allows message copying', async () => {
    const user = userEvent.setup()

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    })

    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test')
    await user.click(sendButton)

    await waitFor(() => {
      const copyButton = screen.getByLabelText(/copy/i)
      expect(copyButton).toBeInTheDocument()
    })

    const copyButton = screen.getByLabelText(/copy/i)
    await user.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'This is a test response from the AI agent.'
    )
  })

  it('supports message feedback (thumbs up/down)', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/thumbs up/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/thumbs down/i)).toBeInTheDocument()
    })

    const thumbsUp = screen.getByLabelText(/thumbs up/i)
    await user.click(thumbsUp)

    // Should show feedback was recorded
    expect(thumbsUp).toHaveAttribute('aria-pressed', 'true')
  })

  it('displays clickable suggestions', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Try rephrasing')).toBeInTheDocument()
      expect(screen.getByText('Check context')).toBeInTheDocument()
    })

    // Click on suggestion
    const suggestion = screen.getByText('Try rephrasing')
    await user.click(suggestion)

    // Should fill input with suggestion
    expect(input).toHaveValue('Try rephrasing')
  })

  it('auto-scrolls to latest messages', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const scrollIntoView = jest.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoView

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test message')
    await user.click(sendButton)

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled()
    })
  })

  it('supports bilingual content', async () => {
    const user = userEvent.setup()
    render(
      <ChatAgent
        title="Trợ lý AI Dịch thuật"
        placeholder="Hỏi tôi về bản dịch..."
      />
    )

    expect(screen.getByText('Trợ lý AI Dịch thuật')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Hỏi tôi về bản dịch...')
    ).toBeInTheDocument()

    const input = screen.getByRole('textbox', { name: /message/i })
    await user.type(input, 'Làm thế nào để dịch văn bản này?')

    expect(input).toHaveValue('Làm thế nào để dịch văn bản này?')
  })

  it('handles long messages properly', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const longMessage =
      'This is a very long message that should be handled properly by the chat interface without breaking the layout or causing display issues. The component should wrap text appropriately and maintain readability.'

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, longMessage)
    await user.click(sendButton)

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })

  it('closes drawer on close button click', async () => {
    const onClose = jest.fn()
    const user = userEvent.setup()

    render(<ChatAgent variant="drawer" isOpen={true} onClose={onClose} />)

    const closeButton = screen.getByLabelText(/close/i)
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('closes drawer on Escape key', () => {
    const onClose = jest.fn()
    render(<ChatAgent variant="drawer" isOpen={true} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('passes accessibility audit', async () => {
    const { container } = render(
      <ChatAgent title="AI Assistant" contextData={mockContextData} />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has proper ARIA attributes', () => {
    render(<ChatAgent title="AI Assistant" />)

    const chatRegion = screen.getByRole('region', { name: /chat/i })
    expect(chatRegion).toHaveAttribute(
      'aria-label',
      expect.stringContaining('chat')
    )

    const messagesList = screen.getByRole('log')
    expect(messagesList).toHaveAttribute('aria-live', 'polite')
    expect(messagesList).toHaveAttribute(
      'aria-label',
      expect.stringContaining('conversation')
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute(
      'aria-label',
      expect.stringContaining('message')
    )

    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeInTheDocument()
  })

  it('announces new messages to screen readers', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test message')
    await user.click(sendButton)

    const messagesList = screen.getByRole('log')
    expect(messagesList).toHaveAttribute('aria-live', 'polite')

    await waitFor(() => {
      expect(
        screen.getByText('This is a test response from the AI agent.')
      ).toBeInTheDocument()
    })
  })

  it('handles keyboard navigation properly', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox')
    const sendButton = screen.getByRole('button', { name: /send/i })

    // Tab navigation
    input.focus()
    expect(input).toHaveFocus()

    await user.tab()
    expect(sendButton).toHaveFocus()
  })

  it('maintains message history', async () => {
    const user = userEvent.setup()
    render(<ChatAgent />)

    const input = screen.getByRole('textbox', { name: /message/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    // Send first message
    await user.type(input, 'First message')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument()
    })

    // Clear input and send second message
    await user.clear(input)
    await user.type(input, 'Second message')
    await user.click(sendButton)

    // Both messages should be visible
    expect(screen.getByText('First message')).toBeInTheDocument()
    expect(screen.getByText('Second message')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<ChatAgent className="custom-chat" />)

    const chatContainer = screen.getByRole('region', { name: /chat/i })
    expect(chatContainer).toHaveClass('custom-chat')
  })
})
