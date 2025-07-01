import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  Sparkles,
  MessageSquare,
  X
} from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'agent'
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
  metadata?: {
    confidence?: number
    sources?: string[]
    suggestions?: string[]
  }
}

interface ChatAgentProps {
  className?: string
  placeholder?: string
  title?: string
  isOpen?: boolean
  onClose?: () => void
  contextData?: {
    documentId?: string
    translationText?: string
    sourceLanguage?: string
    targetLanguage?: string
  }
  variant?: 'drawer' | 'embedded'
}

export function ChatAgent({
  className,
  placeholder = "Ask me anything about your translation...",
  title = "AI Translation Assistant",
  isOpen = true,
  onClose,
  contextData,
  variant = 'embedded'
}: ChatAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your AI translation assistant. I can help you with translation quality, context clarification, and language optimization. How can I assist you today?",
      role: 'agent',
      timestamp: new Date(),
      metadata: {
        confidence: 0.95,
        suggestions: [
          "Check translation quality",
          "Explain cultural context",
          "Suggest improvements",
          "Alternative translations"
        ]
      }
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
      status: 'sending'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Simulate API call to AI agent
      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          context: contextData,
          history: messages.slice(-5) // Send last 5 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Update user message status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      )

      // Add agent response
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'agent',
        timestamp: new Date(),
        metadata: {
          confidence: data.confidence || 0.85,
          sources: data.sources,
          suggestions: data.suggestions
        }
      }

      setMessages(prev => [...prev, agentMessage])
    } catch (error) {
      // Update user message to error state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' }
            : msg
        )
      )

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        role: 'agent',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user'
    const isError = message.status === 'error'
    const isSending = message.status === 'sending'

    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 p-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser && 'items-end')}>
          <div
            className={cn(
              'rounded-lg px-4 py-2 text-sm',
              isUser
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-900',
              isError && 'bg-red-100 text-red-900',
              isSending && 'opacity-70'
            )}
          >
            {message.content}
            
            {isSending && (
              <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-current rounded-full animate-pulse delay-100" />
                  <div className="w-1 h-1 bg-current rounded-full animate-pulse delay-200" />
                </div>
                <span>Sending...</span>
              </div>
            )}
          </div>

          {/* Message actions */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{message.timestamp.toLocaleTimeString()}</span>
            
            {!isUser && !isSending && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyMessage(message.content)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </>
            )}

            {message.metadata?.confidence && (
              <div className="ml-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{Math.round(message.metadata.confidence * 100)}%</span>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {message.metadata?.suggestions && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.metadata.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="h-6 text-xs px-2"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        )}
      </div>
    )
  }

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {variant === 'drawer' && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map(renderMessage)}
        
        {isTyping && (
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  if (variant === 'drawer') {
    if (!isOpen) return null

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
        
        {/* Drawer */}
        <div className={cn(
          'fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 z-50 shadow-xl',
          className
        )}>
          {chatContent}
        </div>
      </>
    )
  }

  return (
    <div className={cn('h-96 bg-white border border-gray-200 rounded-lg', className)}>
      {chatContent}
    </div>
  )
}