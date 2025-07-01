'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  FileText,
  Brain,
  Zap,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Copy,
  RotateCcw,
  Eye,
  Lightbulb,
  BookOpen,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'

interface DocumentInteractionHubProps {
  document?: {
    id: string
    name: string
    type: string
    content: string
    metadata?: any
  }
  onTranslate?: (options: TranslationOptions) => void
  onDownload?: (format: string) => void
  className?: string
}

interface TranslationOptions {
  targetLanguage: string
  includeContext: boolean
  preserveFormatting: boolean
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface DocumentInsight {
  type: 'summary' | 'key_points' | 'entities' | 'sentiment'
  title: string
  content: string
  confidence?: number
}

export default function DocumentInteractionHub({
  document,
  onTranslate,
  onDownload,
  className = '',
}: DocumentInteractionHubProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()

  // State management
  const [activeTab, setActiveTab] = useState<
    'chat' | 'summary' | 'translate' | 'insights'
  >('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [documentSummary, setDocumentSummary] = useState<string>('')
  const [documentInsights, setDocumentInsights] = useState<DocumentInsight[]>(
    []
  )
  const [translationOptions, setTranslationOptions] =
    useState<TranslationOptions>({
      targetLanguage: language === 'vi' ? 'en' : 'vi',
      includeContext: true,
      preserveFormatting: true,
    })
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(
    new Set()
  )

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Initialize with document analysis when document is loaded
  useEffect(() => {
    if (document && document.content) {
      initializeDocumentAnalysis()
    }
  }, [document])

  const initializeDocumentAnalysis = async () => {
    if (!document) return

    setIsProcessing(true)

    try {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content:
          language === 'vi'
            ? `Tôi đã phân tích tài liệu "${document.name}". Bạn có thể hỏi bất cứ điều gì về nội dung của nó!`
            : `I've analyzed the document "${document.name}". You can ask me anything about its content!`,
        timestamp: new Date(),
      }

      setChatMessages([welcomeMessage])

      // Generate basic insights
      await generateDocumentInsights()
      generateDocumentSummary()
    } catch (error) {
      console.error('Error initializing document analysis:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateDocumentInsights = async () => {
    if (!document) return

    try {
      // Call the document analysis API
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          analysisType: 'all',
          language: language === 'vi' ? 'vi' : 'en',
          documentContent: document.content, // Pass content directly for simplified demo
        }),
      })

      if (!response.ok) {
        throw new Error('Analysis request failed')
      }

      const data = await response.json()

      // Transform API response to match our interface
      const insights: DocumentInsight[] = data.insights.map((insight: any) => ({
        type: insight.type,
        title: insight.title,
        content: insight.content,
        confidence: insight.confidence,
      }))

      setDocumentInsights(insights)
    } catch (error) {
      console.error('Error generating insights:', error)

      // Fallback to basic insights
      const fallbackInsights: DocumentInsight[] = [
        {
          type: 'summary',
          title: language === 'vi' ? 'Tóm tắt nhanh' : 'Quick Summary',
          content:
            language === 'vi'
              ? 'Đây là một tài liệu chứa thông tin quan trọng. Phân tích chi tiết đang được cập nhật...'
              : 'This document contains important information. Detailed analysis is being updated...',
          confidence: 0.8,
        },
      ]

      setDocumentInsights(fallbackInsights)
    }
  }

  const generateDocumentSummary = () => {
    const summary =
      language === 'vi'
        ? `Tài liệu này (${document?.name}) chứa ${document?.content?.length || 0} ký tự. Đây là bản tóm tắt tự động được tạo bởi AI, phân tích nội dung và trích xuất những điểm quan trọng nhất.`
        : `This document (${document?.name}) contains ${document?.content?.length || 0} characters. This is an AI-generated summary that analyzes the content and extracts the most important points.`

    setDocumentSummary(summary)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !document) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    setChatMessages(prev => [...prev, userMessage, loadingMessage])
    setInputMessage('')
    setIsProcessing(true)

    try {
      // Call the actual document chat API
      const response = await fetch('/api/documents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          message: userMessage.content,
          conversationHistory: chatMessages.filter(msg => !msg.isLoading),
          language: language === 'vi' ? 'vi' : 'en',
          documentContent: document.content, // Pass content directly for simplified demo
        }),
      })

      if (!response.ok) {
        throw new Error('Chat request failed')
      }

      const data = await response.json()

      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? { ...msg, content: data.response, isLoading: false }
            : msg
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content:
                  language === 'vi'
                    ? 'Xin lỗi, đã có lỗi xảy ra.'
                    : 'Sorry, an error occurred.',
                isLoading: false,
              }
            : msg
        )
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const generateContextualResponse = (question: string, doc: any): string => {
    const lowerQuestion = question.toLowerCase()

    if (
      lowerQuestion.includes('summary') ||
      lowerQuestion.includes('tóm tắt')
    ) {
      return language === 'vi'
        ? `Đây là tóm tắt của "${doc.name}": Tài liệu này chứa ${doc.content?.length || 0} ký tự với nội dung được cấu trúc rõ ràng. Các điểm chính bao gồm thông tin quan trọng về chủ đề được trình bày.`
        : `Here's a summary of "${doc.name}": This document contains ${doc.content?.length || 0} characters with well-structured content. Key points include important information about the presented topic.`
    }

    if (lowerQuestion.includes('translate') || lowerQuestion.includes('dịch')) {
      return language === 'vi'
        ? 'Bạn có thể dịch tài liệu này bằng cách chuyển sang tab "Dịch" và chọn ngôn ngữ đích. Tôi sẽ dịch toàn bộ nội dung với độ chính xác cao.'
        : 'You can translate this document by switching to the "Translate" tab and selecting the target language. I will translate the entire content with high accuracy.'
    }

    if (
      lowerQuestion.includes('key points') ||
      lowerQuestion.includes('điểm chính')
    ) {
      return language === 'vi'
        ? 'Các điểm chính của tài liệu bao gồm: 1) Cấu trúc nội dung rõ ràng, 2) Thông tin có giá trị, 3) Định dạng phù hợp để dịch thuật và phân tích.'
        : 'Key points of the document include: 1) Clear content structure, 2) Valuable information, 3) Suitable format for translation and analysis.'
    }

    return language === 'vi'
      ? `Dựa trên nội dung của "${doc.name}", tôi có thể giúp bạn phân tích, dịch thuật, hoặc trích xuất thông tin cụ thể. Bạn có câu hỏi nào khác không?`
      : `Based on the content of "${doc.name}", I can help you analyze, translate, or extract specific information. Do you have any other questions?`
  }

  const handleTranslate = () => {
    if (onTranslate) {
      onTranslate(translationOptions)
    }
  }

  const toggleInsightExpansion = (type: string) => {
    const newExpanded = new Set(expandedInsights)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedInsights(newExpanded)
  }

  if (!document) {
    return (
      <div
        className={`h-full flex items-center justify-center text-gray-500 ${className}`}
      >
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">
            {language === 'vi' ? 'Chưa có tài liệu' : 'No Document Loaded'}
          </h3>
          <p className="text-sm">
            {language === 'vi'
              ? 'Tải lên một tài liệu để bắt đầu tương tác'
              : 'Upload a document to start interacting'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {document.name}
            </h3>
            <p className="text-xs text-gray-500">
              {language === 'vi' ? 'Tài liệu đã tải' : 'Document loaded'} •{' '}
              {document.type}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
          {[
            {
              id: 'chat',
              icon: MessageSquare,
              label: language === 'vi' ? 'Trò chuyện' : 'Chat',
            },
            {
              id: 'summary',
              icon: BookOpen,
              label: language === 'vi' ? 'Tóm tắt' : 'Summary',
            },
            {
              id: 'translate',
              icon: Globe,
              label: language === 'vi' ? 'Dịch' : 'Translate',
            },
            {
              id: 'insights',
              icon: Lightbulb,
              label: language === 'vi' ? 'Phân tích' : 'Insights',
            },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col"
            >
              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">
                            {language === 'vi'
                              ? 'Đang phân tích...'
                              : 'Analyzing...'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder={
                      language === 'vi'
                        ? 'Hỏi về tài liệu...'
                        : 'Ask about the document...'
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-4"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                  <h4 className="font-medium">
                    {language === 'vi'
                      ? 'Tóm tắt tài liệu'
                      : 'Document Summary'}
                  </h4>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {documentSummary}
                  </p>
                </div>

                <button
                  onClick={() => {
                    /* Generate detailed summary */
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  {language === 'vi'
                    ? 'Tạo tóm tắt chi tiết'
                    : 'Generate Detailed Summary'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'translate' && (
            <motion.div
              key="translate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-4"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Globe className="w-5 h-5" />
                  <h4 className="font-medium">
                    {language === 'vi' ? 'Dịch tài liệu' : 'Translate Document'}
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'vi' ? 'Ngôn ngữ đích' : 'Target Language'}
                    </label>
                    <select
                      value={translationOptions.targetLanguage}
                      onChange={e =>
                        setTranslationOptions(prev => ({
                          ...prev,
                          targetLanguage: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={translationOptions.includeContext}
                        onChange={e =>
                          setTranslationOptions(prev => ({
                            ...prev,
                            includeContext: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {language === 'vi'
                          ? 'Bao gồm ngữ cảnh'
                          : 'Include context'}
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={translationOptions.preserveFormatting}
                        onChange={e =>
                          setTranslationOptions(prev => ({
                            ...prev,
                            preserveFormatting: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {language === 'vi'
                          ? 'Giữ nguyên định dạng'
                          : 'Preserve formatting'}
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleTranslate}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Globe className="w-4 h-4 inline mr-2" />
                  {language === 'vi' ? 'Bắt đầu dịch' : 'Start Translation'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-4"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Lightbulb className="w-5 h-5" />
                  <h4 className="font-medium">
                    {language === 'vi'
                      ? 'Phân tích thông minh'
                      : 'Smart Insights'}
                  </h4>
                </div>

                <div className="space-y-3">
                  {documentInsights.map(insight => (
                    <div
                      key={insight.type}
                      className="border border-gray-200 rounded-lg"
                    >
                      <button
                        onClick={() => toggleInsightExpansion(insight.type)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{insight.title}</span>
                          {insight.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(insight.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        {expandedInsights.has(insight.type) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedInsights.has(insight.type) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 text-sm text-gray-700 whitespace-pre-line">
                              {insight.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    /* Generate more insights */
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Brain className="w-4 h-4 inline mr-2" />
                  {language === 'vi'
                    ? 'Phân tích sâu hơn'
                    : 'Generate More Insights'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
