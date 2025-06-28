'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceIntelligence } from '@/contexts/WorkspaceIntelligenceContext'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Send,
  Lightbulb,
  Zap,
  Brain,
  HelpCircle,
  ArrowRight,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Bot
} from 'lucide-react'

interface ContextualAssistantProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  suggestions?: Array<{
    text: string
    action: () => void
  }>
}

export default function ContextualAssistant({ 
  position = 'bottom-right',
  className = '' 
}: ContextualAssistantProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()
  const {
    state,
    addSuggestion,
    trackActivity,
    setMode,
    startAIOperation,
    getCurrentContext
  } = useWorkspaceIntelligence()

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [hasNewSuggestion, setHasNewSuggestion] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const content = {
    vi: {
      title: 'Trợ lý AI',
      subtitle: 'Hỗ trợ thông minh cho workspace',
      placeholder: 'Hỏi tôi bất cứ điều gì...',
      send: 'Gửi',
      minimize: 'Thu nhỏ',
      maximize: 'Mở rộng',
      close: 'Đóng',
      thinking: 'Đang suy nghĩ...',
      suggestions: {
        startTranslation: 'Bắt đầu dịch tài liệu',
        exploreFeatures: 'Khám phá tính năng mới',
        optimizeWorkflow: 'Tối ưu quy trình làm việc',
        viewAnalytics: 'Xem thống kê sử dụng'
      },
      greetings: [
        'Xin chào! Tôi có thể giúp gì cho bạn?',
        'Chào mừng đến workspace! Bạn cần hỗ trợ gì?',
        'Tôi ở đây để giúp bạn làm việc hiệu quả hơn.'
      ],
      contextualMessages: {
        translation: 'Tôi thấy bạn đang dịch. Bạn có muốn tôi gợi ý cách tối ưu không?',
        documents: 'Tài liệu của bạn đang được xử lý. Bạn có cần hỗ trợ thêm?',
        firstTime: 'Lần đầu sử dụng? Tôi sẽ hướng dẫn bạn các tính năng chính!'
      }
    },
    en: {
      title: 'AI Assistant',
      subtitle: 'Smart workspace support',
      placeholder: 'Ask me anything...',
      send: 'Send',
      minimize: 'Minimize',
      maximize: 'Maximize',
      close: 'Close',
      thinking: 'Thinking...',
      suggestions: {
        startTranslation: 'Start translation',
        exploreFeatures: 'Explore features',
        optimizeWorkflow: 'Optimize workflow',
        viewAnalytics: 'View analytics'
      },
      greetings: [
        'Hello! How can I help you today?',
        'Welcome to your workspace! What would you like to do?',
        'I\'m here to help you work more efficiently.'
      ],
      contextualMessages: {
        translation: 'I see you\'re translating. Would you like optimization suggestions?',
        documents: 'Your document is being processed. Need additional help?',
        firstTime: 'First time here? Let me show you the key features!'
      }
    }
  }

  const currentContent = content[language]

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Initialize with greeting message
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = currentContent.greetings[Math.floor(Math.random() * currentContent.greetings.length)]
      addMessage({
        type: 'assistant',
        content: greeting,
        suggestions: [
          {
            text: currentContent.suggestions.startTranslation,
            action: () => setMode('translation')
          },
          {
            text: currentContent.suggestions.exploreFeatures,
            action: () => setMode('intelligence')
          }
        ]
      })
    }
  }, [])

  // React to workspace changes and provide contextual messages
  useEffect(() => {
    const context = getCurrentContext()
    const recentActivities = state.activities.slice(0, 3)
    
    // Provide contextual assistance based on current mode and activities
    if (state.currentMode !== state.previousMode && state.previousMode) {
      let contextualMessage = ''
      let suggestions: Array<{text: string, action: () => void}> = []

      switch (state.currentMode) {
        case 'translation':
          contextualMessage = currentContent.contextualMessages.translation
          suggestions = [
            {
              text: currentContent.suggestions.optimizeWorkflow,
              action: () => addSuggestion({
                type: 'workflow',
                title: 'Translation Optimization',
                description: 'Use batch translation for multiple documents',
                action: () => setMode('documents'),
                priority: 'medium',
                context: { source: 'ai_assistant' }
              })
            }
          ]
          break
        case 'documents':
          contextualMessage = currentContent.contextualMessages.documents
          suggestions = [
            {
              text: 'Process multiple files',
              action: () => {/* Open batch upload */}
            }
          ]
          break
      }

      if (contextualMessage) {
        setTimeout(() => {
          addMessage({
            type: 'assistant',
            content: contextualMessage,
            suggestions
          })
          setHasNewSuggestion(true)
        }, 1500)
      }
    }

    // Check if user is new and provide onboarding
    if (recentActivities.length <= 2 && state.activities.length <= 5) {
      setTimeout(() => {
        addMessage({
          type: 'assistant',
          content: currentContent.contextualMessages.firstTime,
          suggestions: [
            {
              text: currentContent.suggestions.exploreFeatures,
              action: () => setMode('intelligence')
            },
            {
              text: currentContent.suggestions.viewAnalytics,
              action: () => setMode('analytics')
            }
          ]
        })
      }, 3000)
    }
  }, [state.currentMode, state.activities.length])

  // Clear new suggestion indicator after opening
  useEffect(() => {
    if (isOpen) {
      setHasNewSuggestion(false)
    }
  }, [isOpen])

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    addMessage({
      type: 'user',
      content: inputValue
    })

    const userMessage = inputValue
    setInputValue('')
    setIsThinking(true)

    // Track user interaction
    trackActivity({
      type: 'ai_interaction',
      mode: state.currentMode,
      data: { message: userMessage },
      success: true
    })

    // Simulate AI response (in production, this would call an AI service)
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage)
      addMessage(aiResponse)
      setIsThinking(false)
    }, 1000 + Math.random() * 2000)
  }

  const generateAIResponse = (userMessage: string): Omit<Message, 'id' | 'timestamp'> => {
    const message = userMessage.toLowerCase()
    const context = getCurrentContext()

    // Simple keyword-based responses (in production, use a proper AI service)
    if (message.includes('translate') || message.includes('dịch')) {
      return {
        type: 'assistant',
        content: language === 'vi' 
          ? 'Tôi có thể giúp bạn với dịch thuật! Bạn muốn dịch văn bản hay tài liệu?'
          : 'I can help with translation! Would you like to translate text or documents?',
        suggestions: [
          {
            text: language === 'vi' ? 'Dịch văn bản' : 'Translate text',
            action: () => setMode('translation')
          },
          {
            text: language === 'vi' ? 'Dịch tài liệu' : 'Translate documents',
            action: () => setMode('documents')
          }
        ]
      }
    }

    if (message.includes('help') || message.includes('hỗ trợ') || message.includes('giúp')) {
      return {
        type: 'assistant',
        content: language === 'vi'
          ? 'Tôi có thể hỗ trợ bạn điều hướng workspace, tối ưu quy trình làm việc, và gợi ý tính năng mới.'
          : 'I can help you navigate the workspace, optimize workflows, and suggest new features.',
        suggestions: [
          {
            text: language === 'vi' ? 'Xem hướng dẫn' : 'View tutorial',
            action: () => {/* Open tutorial */}
          },
          {
            text: language === 'vi' ? 'Tính năng nâng cao' : 'Advanced features',
            action: () => setMode('intelligence')
          }
        ]
      }
    }

    if (message.includes('analytics') || message.includes('thống kê')) {
      return {
        type: 'assistant',
        content: language === 'vi'
          ? 'Bạn có thể xem thống kê sử dụng, hiệu suất làm việc và phân tích xu hướng trong phần Analytics.'
          : 'You can view usage statistics, workflow efficiency, and trend analysis in the Analytics section.',
        suggestions: [
          {
            text: language === 'vi' ? 'Mở Analytics' : 'Open Analytics',
            action: () => setMode('analytics')
          }
        ]
      }
    }

    // Default response with contextual suggestions
    const responses = language === 'vi' ? [
      'Tôi hiểu bạn đang tìm kiếm thông tin. Bạn có thể cung cấp thêm chi tiết không?',
      'Hãy cho tôi biết cụ thể hơn về vấn đề bạn gặp phải.',
      'Tôi ở đây để giúp! Bạn đang làm việc với tính năng nào?'
    ] : [
      'I understand you\'re looking for information. Could you provide more details?',
      'Let me know more specifically about the issue you\'re facing.',
      'I\'m here to help! Which feature are you working with?'
    ]

    return {
      type: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)],
      suggestions: [
        {
          text: language === 'vi' ? 'Xem tất cả tính năng' : 'View all features',
          action: () => setMode('intelligence')
        }
      ]
    }
  }

  const handleSuggestionClick = (action: () => void) => {
    action()
    trackActivity({
      type: 'ai_interaction',
      mode: state.currentMode,
      data: { action: 'suggestion_clicked' },
      success: true
    })
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      <AnimatePresence>
        {!isOpen ? (
          // Floating Button
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 rounded-full shadow-lg transition-all duration-200"
            style={{
              backgroundColor: 'var(--notebooklm-primary)',
              color: 'var(--surface-elevated)'
            }}
          >
            <Bot className="w-6 h-6 mx-auto" />
            
            {/* New suggestion indicator */}
            {hasNewSuggestion && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                style={{ backgroundColor: 'var(--error-500)' }}
              >
                <Sparkles className="w-2.5 h-2.5 text-white m-auto mt-0.5" />
              </motion.div>
            )}
          </motion.button>
        ) : (
          // Chat Interface
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`w-80 ${isMinimized ? 'h-14' : 'h-96'} rounded-xl shadow-xl transition-all duration-300`}
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--surface-outline)'
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--surface-outline)' }}
            >
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                  style={{ backgroundColor: 'var(--notebooklm-primary-light)' }}
                >
                  <Bot className="w-4 h-4" style={{ color: 'var(--notebooklm-primary)' }} />
                </div>
                <div>
                  <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {currentContent.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {currentContent.subtitle}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  title={isMinimized ? currentContent.maximize : currentContent.minimize}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  title={currentContent.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="h-64 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user' 
                            ? 'rounded-br-none' 
                            : 'rounded-bl-none'
                        }`}
                        style={{
                          backgroundColor: message.type === 'user' 
                            ? 'var(--notebooklm-primary)' 
                            : 'var(--surface-panel)',
                          color: message.type === 'user' 
                            ? 'var(--surface-elevated)' 
                            : 'var(--text-primary)'
                        }}
                      >
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion.action)}
                                className="block w-full text-left text-xs p-2 rounded transition-colors"
                                style={{
                                  backgroundColor: 'var(--surface-elevated)',
                                  color: 'var(--notebooklm-primary)'
                                }}
                              >
                                <ArrowRight className="w-3 h-3 inline mr-1" />
                                {suggestion.text}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Thinking indicator */}
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div
                        className="p-3 rounded-lg rounded-bl-none"
                        style={{ backgroundColor: 'var(--surface-panel)' }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-muted)' }} />
                            <div className="w-2 h-2 rounded-full animate-bounce delay-100" style={{ backgroundColor: 'var(--text-muted)' }} />
                            <div className="w-2 h-2 rounded-full animate-bounce delay-200" style={{ backgroundColor: 'var(--text-muted)' }} />
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {currentContent.thinking}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div 
                  className="p-4 border-t"
                  style={{ borderColor: 'var(--surface-outline)' }}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={currentContent.placeholder}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border transition-colors"
                      style={{
                        backgroundColor: 'var(--surface-panel)',
                        borderColor: 'var(--surface-outline)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isThinking}
                      className="p-2 rounded-lg transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--notebooklm-primary)',
                        color: 'var(--surface-elevated)'
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}