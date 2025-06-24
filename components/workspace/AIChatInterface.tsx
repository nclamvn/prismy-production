'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Mic, 
  Paperclip, 
  MoreVertical, 
  Bot, 
  User,
  ExternalLink,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react'

import { useLanguage } from '@/contexts/LanguageContext'
import '../../styles/ai-workspace-components.css'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: string
  agentName?: string
  citations?: Citation[]
  attachments?: Attachment[]
  thinking?: boolean
}

interface Citation {
  id: string
  documentId: string
  documentTitle: string
  pageNumber?: number
  snippet: string
  confidence: number
}

interface Attachment {
  id: string
  name: string
  type: string
  size: number
}

interface Agent {
  id: string
  name: string
  nameVi: string
  specialty: string
  specialtyVi: string
  avatar: string
  status: 'active' | 'thinking' | 'idle'
  personality: string
}

interface AIChatInterfaceProps {
  documentId?: string
  selectedAgent?: Agent
  onAgentChange?: (agent: Agent) => void
  className?: string
}

export default function AIChatInterface({ 
  documentId, 
  selectedAgent,
  onAgentChange,
  className = '' 
}: AIChatInterfaceProps) {
  const { language } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sample agents
  const agents: Agent[] = [
    {
      id: 'legal-expert',
      name: 'Legal Expert',
      nameVi: 'Chuyên Gia Pháp Lý',
      specialty: 'Vietnamese Legal Documents',
      specialtyVi: 'Tài Liệu Pháp Lý Việt Nam',
      avatar: '⚖️',
      status: 'active',
      personality: 'Professional and detail-oriented'
    },
    {
      id: 'financial-analyst',
      name: 'Financial Analyst',
      nameVi: 'Chuyên Viên Tài Chính',
      specialty: 'Financial Analysis & Reports',
      specialtyVi: 'Phân Tích Tài Chính & Báo Cáo',
      avatar: '📊',
      status: 'idle',
      personality: 'Analytical and data-driven'
    },
    {
      id: 'research-assistant',
      name: 'Research Assistant',
      nameVi: 'Trợ Lý Nghiên Cứu',
      specialty: 'Academic Research & Citations',
      specialtyVi: 'Nghiên Cứu Học Thuật & Trích Dẫn',
      avatar: '🔬',
      status: 'thinking',
      personality: 'Thorough and methodical'
    }
  ]

  const currentAgent = selectedAgent || agents[0]

  // Sample initial messages
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        type: 'assistant',
        content: language === 'vi' 
          ? `Xin chào! Tôi là ${currentAgent.nameVi}, ${currentAgent.specialtyVi}. Tôi có thể giúp bạn phân tích và hiểu rõ tài liệu này. Bạn có câu hỏi gì không?`
          : `Hello! I'm ${currentAgent.name}, specialized in ${currentAgent.specialty}. I can help you analyze and understand this document. What would you like to know?`,
        timestamp: new Date(),
        agentId: currentAgent.id,
        agentName: currentAgent.name
      }
      setMessages([welcomeMessage])
    }
  }, [currentAgent, language, messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(inputValue, currentAgent),
        timestamp: new Date(),
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        citations: generateSampleCitations()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 2000)
  }

  const generateAIResponse = (input: string, agent: Agent): string => {
    const responses = {
      'legal-expert': {
        en: `Based on my analysis of the legal document, I can see that ${input}. This relates to Vietnamese commercial law requirements. Let me break down the key legal implications for you.`,
        vi: `Dựa trên phân tích tài liệu pháp lý, tôi thấy rằng ${input}. Điều này liên quan đến yêu cầu luật thương mại Việt Nam. Hãy để tôi giải thích các ý nghĩa pháp lý chính.`
      },
      'financial-analyst': {
        en: `From a financial perspective, ${input} shows interesting patterns. The data indicates several key trends that align with Vietnamese market conditions.`,
        vi: `Từ góc độ tài chính, ${input} cho thấy những xu hướng thú vị. Dữ liệu chỉ ra một số xu hướng chính phù hợp với điều kiện thị trường Việt Nam.`
      },
      'research-assistant': {
        en: `I've conducted a thorough analysis of ${input}. Based on current research and Vietnamese academic standards, here are my findings with proper citations.`,
        vi: `Tôi đã tiến hành phân tích kỹ lưỡng về ${input}. Dựa trên nghiên cứu hiện tại và tiêu chuẩn học thuật Việt Nam, đây là những phát hiện với trích dẫn phù hợp.`
      }
    }

    const response = responses[agent.id as keyof typeof responses] || responses['research-assistant']
    return language === 'vi' ? response.vi : response.en
  }

  const generateSampleCitations = (): Citation[] => {
    return [
      {
        id: '1',
        documentId: 'doc1',
        documentTitle: 'Vietnamese Business Contract.pdf',
        pageNumber: 3,
        snippet: 'Article 15 clearly states the obligations of both parties...',
        confidence: 0.95
      },
      {
        id: '2',
        documentId: 'doc1',
        documentTitle: 'Vietnamese Business Contract.pdf',
        pageNumber: 7,
        snippet: 'The termination clause provides specific conditions...',
        confidence: 0.88
      }
    ]
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`ai-chat-container ${className}`}>
      {/* Chat Header */}
      <div className="ai-chat-header">
        <div className="flex items-center gap-3">
          <div className="agent-avatar text-lg">
            {currentAgent.avatar}
          </div>
          <div>
            <h3 className="ai-chat-title">
              {language === 'vi' ? currentAgent.nameVi : currentAgent.name}
            </h3>
            <p className="text-xs text-gray-500">
              {language === 'vi' ? currentAgent.specialtyVi : currentAgent.specialty}
            </p>
          </div>
        </div>
        
        <div className="ai-chat-status">
          <div className={`ai-status-indicator ${currentAgent.status}`} />
          <span className="text-sm">
            {currentAgent.status === 'active' 
              ? (language === 'vi' ? 'Đang hoạt động' : 'Active')
              : currentAgent.status === 'thinking'
              ? (language === 'vi' ? 'Đang suy nghĩ' : 'Thinking')
              : (language === 'vi' ? 'Sẵn sàng' : 'Ready')
            }
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-chat-messages">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`ai-message ${message.type}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`ai-message-avatar ${message.type}`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <span className="text-sm">{currentAgent.avatar}</span>
                )}
              </div>
              
              <div className="ai-message-content">
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="ai-message-citations">
                    <p className="text-xs font-medium mb-2">
                      {language === 'vi' ? 'Nguồn tham khảo:' : 'Sources:'}
                    </p>
                    {message.citations.map((citation) => (
                      <div key={citation.id} className="mb-1">
                        <a 
                          href="#" 
                          className="ai-citation-link text-xs"
                          onClick={(e) => {
                            e.preventDefault()
                            // Handle citation click
                          }}
                        >
                          {citation.documentTitle}
                          {citation.pageNumber && ` (Page ${citation.pageNumber})`}
                        </a>
                        <span className="text-xs text-gray-400 ml-2">
                          {Math.round(citation.confidence * 100)}% confidence
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message actions */}
                <div className="flex items-center gap-2 mt-2">
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                  {message.type === 'assistant' && (
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            className="ai-message assistant"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="ai-message-avatar assistant">
              <span className="text-sm">{currentAgent.avatar}</span>
            </div>
            <div className="ai-message-content">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="ai-chat-input">
        <div className="ai-input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'vi' 
              ? 'Hỏi AI agent về tài liệu này...' 
              : 'Ask the AI agent about this document...'
            }
            className="ai-input-field"
            rows={1}
            disabled={isTyping}
          />
          
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setIsRecording(!isRecording)}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500' : ''}`} />
            </button>
            
            <button
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="ai-input-send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {['Summarize', 'Key Points', 'Questions', 'Vietnamese Translation'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion === 'Vietnamese Translation' 
                ? (language === 'vi' ? 'Dịch sang tiếng Việt' : 'Translate to Vietnamese')
                : suggestion
              )}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full whitespace-nowrap transition-colors"
            >
              {suggestion === 'Summarize' ? (language === 'vi' ? 'Tóm tắt' : 'Summarize') :
               suggestion === 'Key Points' ? (language === 'vi' ? 'Điểm chính' : 'Key Points') :
               suggestion === 'Questions' ? (language === 'vi' ? 'Đặt câu hỏi' : 'Questions') :
               suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}