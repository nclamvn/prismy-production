'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Bot } from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  documentContext?: string
}

interface ChatInterfaceProps {
  documentName?: string
  documentContent?: string
  onNewMessage?: (message: ChatMessage) => void
}

export function ChatInterface({
  documentName,
  documentContent,
  onNewMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Add welcome message when document is available
    if (documentName && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: `Hi! I'm your AI assistant. I can help you understand, analyze, and work with your document "${documentName}". What would you like to know?`,
        role: 'assistant',
        timestamp: new Date(),
        documentContext: documentName,
      }
      setMessages([welcomeMessage])
    }
  }, [documentName, messages.length])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      content: inputText,
      role: 'user',
      timestamp: new Date(),
      documentContext: documentName,
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)
    onNewMessage?.(userMessage)

    // Simulate AI response
    setTimeout(
      () => {
        const responses = [
          `Based on the document "${documentName || 'your document'}", I can see that ${inputText.toLowerCase().includes('summary') ? 'this is a comprehensive document with key insights' : inputText.toLowerCase().includes('translate') ? 'translation services are available for this content' : 'there are several important points to consider'}.`,

          `Here's what I found in the document: ${documentContent ? documentContent.substring(0, 100) + '...' : 'The content contains relevant information that addresses your question.'} Would you like me to elaborate on any specific section?`,

          `Great question! ${inputText.toLowerCase().includes('how') ? 'Let me walk you through the process step by step' : inputText.toLowerCase().includes('what') ? 'Here are the key points you should know' : 'I can help you with that'}. ${documentName ? `In "${documentName}", ` : ''}this relates to the core concepts we're discussing.`,

          `I understand you're asking about "${inputText}". ${documentContent ? 'From the document content, ' : ''}I can provide insights on this topic. Would you like me to focus on any particular aspect?`,
        ]

        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          content: responses[Math.floor(Math.random() * responses.length)],
          role: 'assistant',
          timestamp: new Date(),
          documentContext: documentName,
        }

        setMessages(prev => [...prev, aiMessage])
        setIsTyping(false)
        onNewMessage?.(aiMessage)
      },
      1000 + Math.random() * 2000
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const suggestedQuestions = [
    'Can you summarize this document?',
    'What are the key points?',
    'Translate this to Vietnamese',
    'Explain the main concepts',
    'Find important dates and numbers',
    'What questions can I ask about this?',
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border-default bg-surface">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent-brand rounded-full flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-primary">AI Assistant</div>
            <div className="text-xs text-muted">
              {documentName ? `Analyzing: ${documentName}` : 'Ready to help'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-accent-brand text-white'
                  : 'bg-surface border border-border-default text-primary'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-muted'
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border-default rounded-lg px-4 py-2 max-w-[80%]">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-muted rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
                <span className="text-xs text-muted ml-2">AI is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && !isTyping && (
        <div className="flex-shrink-0 p-4 border-t border-border-default">
          <div className="text-sm font-medium text-primary mb-3">
            Suggested questions:
          </div>
          <div className="grid grid-cols-1 gap-2">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => setInputText(question)}
                className="text-left text-sm text-secondary hover:text-primary bg-bg-muted hover:bg-surface border border-border-default rounded-md px-3 py-2 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border-default bg-surface">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your document..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            Send
          </Button>
        </div>
        <div className="text-xs text-muted mt-2 mb-0">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
