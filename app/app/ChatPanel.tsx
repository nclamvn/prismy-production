'use client'

import { useState, useRef, useEffect } from 'react'
import { useWorkspaceStore, type Document } from './hooks/useWorkspaceStore'
import {
  Bot,
  Send,
  MessageCircle,
  X,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Crown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { UpgradeModal } from './UpgradeModal'

interface ChatPanelProps {
  document: Document
}

export function ChatPanel({ document }: ChatPanelProps) {
  const { messages, ask, isTyping, credits, setChatPanelOpen } =
    useWorkspaceStore()

  const [inputText, setInputText] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Filter messages for current document
  const documentMessages = messages.filter(m => m.documentId === document.id)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [documentMessages, isTyping])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return

    // Check credits before sending
    if (credits <= 0) {
      setShowUpgradeModal(true)
      return
    }

    const message = inputText.trim()
    setInputText('')

    try {
      // Use the streaming ask method
      const stream = ask(document.id, message)

      for await (const chunk of stream) {
        if (chunk.type === 'content') {
          // Streaming content is handled by the store
          continue
        } else if (chunk.type === 'done') {
          // Chat completed successfully
          break
        }
      }
    } catch (error) {
      console.error('Chat error:', error)

      // Check if it's a credits error
      if (error instanceof Error && error.message.includes('credits')) {
        setShowUpgradeModal(true)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedQuestions = [
    'Summarize this document',
    'What are the key points?',
    'Translate specific sections',
    'Explain technical terms',
  ]

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-brand rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">AI Assistant</h3>
              <p className="text-xs text-secondary">
                Ask about "{document.name}"
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Credits Display */}
            <div className="flex items-center space-x-1 bg-bg-muted px-2 py-1 rounded-md">
              <Crown
                size={12}
                className={credits > 5 ? 'text-accent-brand' : 'text-red-500'}
              />
              <span className="text-xs font-medium text-primary">
                {credits}
              </span>
              {credits <= 5 && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-xs text-accent-brand hover:underline ml-1"
                >
                  Upgrade
                </button>
              )}
            </div>

            {isMobile && (
              <button
                onClick={() => setChatPanelOpen(false)}
                className="p-1 hover:bg-bg-muted rounded-md transition-colors"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {documentMessages.length === 0 ? (
          <EmptyState
            suggestions={suggestedQuestions}
            onSuggestionClick={setInputText}
          />
        ) : (
          <>
            {documentMessages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border-default">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about this document..."
              disabled={isTyping}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-surface text-primary placeholder-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-brand disabled:opacity-50"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            size="icon"
            className="self-end"
          >
            <Send size={16} />
          </Button>
        </div>

        <p className="text-xs text-muted mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="credits"
      />
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

function EmptyState({ suggestions, onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="text-center space-y-4 py-8">
      <div className="w-16 h-16 bg-accent-brand-light rounded-full flex items-center justify-center mx-auto">
        <MessageCircle size={32} className="text-accent-brand" />
      </div>

      <div>
        <h4 className="font-semibold text-primary mb-2">
          Ask me anything about this document
        </h4>
        <p className="text-sm text-secondary">
          I can help you understand, summarize, or answer questions about the
          content.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-secondary uppercase tracking-wide">
          Try asking:
        </p>
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="block w-full text-left px-3 py-2 text-sm bg-bg-muted hover:bg-border-default rounded-lg transition-colors"
            >
              <Sparkles size={14} className="inline mr-2 text-accent-brand" />
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Chat Message Component
interface ChatMessageProps {
  message: import('./hooks/useWorkspaceStore').ChatMessage
}

function ChatMessage({ message }: ChatMessageProps) {
  const [_copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} space-x-2`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-accent-brand rounded-full flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}

      <div
        className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}
      >
        <div
          className={`px-3 py-2 rounded-lg ${
            isUser
              ? 'bg-accent-brand text-white'
              : 'bg-bg-muted text-primary border border-border-default'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className="flex items-center space-x-1 text-xs text-muted">
          <span>{message.timestamp.toLocaleTimeString()}</span>

          {!isUser && (
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-bg-muted rounded transition-colors"
                title="Copy message"
              >
                <Copy size={12} />
              </button>

              <button
                className="p-1 hover:bg-bg-muted rounded transition-colors"
                title="Good response"
              >
                <ThumbsUp size={12} />
              </button>

              <button
                className="p-1 hover:bg-bg-muted rounded transition-colors"
                title="Poor response"
              >
                <ThumbsDown size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-accent-brand-light rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-accent-brand">U</span>
        </div>
      )}
    </div>
  )
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-accent-brand rounded-full flex items-center justify-center">
        <Bot size={16} className="text-white" />
      </div>

      <div className="bg-bg-muted border border-border-default rounded-lg px-3 py-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-accent-brand rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-accent-brand rounded-full animate-bounce"
            style={{ animationDelay: '0.1s' }}
          />
          <div
            className="w-2 h-2 bg-accent-brand rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
        </div>
      </div>
    </div>
  )
}
