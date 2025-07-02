'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff,
  X,
  Bot,
  User,
  MoreVertical,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface AgentPaneProps {
  isOpen?: boolean
  onClose?: () => void
  onToggleMaximize?: () => void
  isMaximized?: boolean
  className?: string
}

interface Message {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: Date
  isTyping?: boolean
  attachments?: string[]
}

/**
 * AgentPane - AI chat/agent interaction panel
 * 400px width (expandable), contains chat interface and agent controls
 */
export function AgentPane({ 
  isOpen = true,
  onClose,
  onToggleMaximize,
  isMaximized = false,
  className = ''
}: AgentPaneProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'AI Agent is ready to help with document processing, translation, and analysis.',
      timestamp: new Date(Date.now() - 5 * 60000),
    },
    {
      id: '2', 
      type: 'user',
      content: 'Can you help me analyze the contract document I just uploaded?',
      timestamp: new Date(Date.now() - 4 * 60000),
    },
    {
      id: '3',
      type: 'agent',
      content: 'I\'d be happy to help analyze your contract document. I can identify key terms, clauses, risks, and provide a summary. Let me process the document first.',
      timestamp: new Date(Date.now() - 3 * 60000),
    },
    {
      id: '4',
      type: 'agent',
      content: 'I\'ve analyzed your contract. Here are the key findings:\n\n• **Contract Type**: Service Agreement\n• **Duration**: 12 months with auto-renewal\n• **Payment Terms**: Net 30 days\n• **Key Risks**: Limited liability clause, broad termination rights\n\nWould you like me to elaborate on any specific aspect?',
      timestamp: new Date(Date.now() - 2 * 60000),
    },
  ])

  const [inputValue, setInputValue] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    
    // Simulate agent typing
    setIsTyping(true)
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent', 
        content: 'I understand your request. Let me help you with that...',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, agentResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  if (!isOpen) return null

  return (
    <aside className={`w-agent-pane bg-workspace-panel border-l border-workspace-border flex flex-col ${isMaximized ? 'fixed inset-0 z-50 w-full' : ''} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-workspace-divider">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary-blue" />
          <h2 className="font-semibold text-primary">AI Agent</h2>
          <div className="h-2 w-2 bg-status-success rounded-full" title="Online" />
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={onToggleMaximize} className="p-1 h-6 w-6">
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-primary-blue text-white' 
                  : message.type === 'agent'
                  ? 'bg-workspace-selected text-primary-blue'
                  : 'bg-workspace-hover text-muted'
              }`}>
                {message.type === 'user' ? (
                  <User className="h-4 w-4" />
                ) : message.type === 'agent' ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <div className="h-2 w-2 bg-current rounded-full" />
                )}
              </div>

              {/* Message bubble */}
              <div className={`rounded-2xl px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-primary-blue text-white'
                  : message.type === 'agent'
                  ? 'bg-workspace-hover text-primary'
                  : 'bg-workspace-canvas text-muted text-center text-sm'
              }`}>
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {/* Message actions for agent messages */}
                {message.type === 'agent' && (
                  <div className="flex items-center justify-end space-x-1 mt-2 pt-2 border-t border-workspace-border">
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6 opacity-60 hover:opacity-100">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6 opacity-60 hover:opacity-100">
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6 opacity-60 hover:opacity-100">
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6 opacity-60 hover:opacity-100">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-2 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-workspace-selected text-primary-blue flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              
              <div className="bg-workspace-hover text-primary rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-workspace-divider">
        <div className="flex items-end space-x-2">
          {/* Attachment button */}
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8 flex-shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your documents..."
              className="w-full min-h-[32px] max-h-32 px-3 py-2 bg-workspace-canvas border border-workspace-border rounded-lg text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-border-focus resize-none"
              rows={1}
            />
          </div>

          {/* Voice button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2 h-8 w-8 flex-shrink-0 ${isRecording ? 'text-status-error' : ''}`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* Send button */}
          <Button 
            size="sm" 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="p-2 h-8 w-8 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="text-xs bg-workspace-hover text-secondary px-2 py-1 rounded-full hover:bg-workspace-selected hover:text-primary-blue transition-colors">
            Analyze document
          </button>
          <button className="text-xs bg-workspace-hover text-secondary px-2 py-1 rounded-full hover:bg-workspace-selected hover:text-primary-blue transition-colors">
            Translate to English
          </button>
          <button className="text-xs bg-workspace-hover text-secondary px-2 py-1 rounded-full hover:bg-workspace-selected hover:text-primary-blue transition-colors">
            Extract key points
          </button>
          <button className="text-xs bg-workspace-hover text-secondary px-2 py-1 rounded-full hover:bg-workspace-selected hover:text-primary-blue transition-colors">
            Generate summary
          </button>
        </div>
      </div>
    </aside>
  )
}