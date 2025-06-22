'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import {
  Brain,
  MessageSquare,
  FileText,
  Search,
  Lightbulb,
  Download,
  Eye,
  BarChart3,
  Zap,
  Send,
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
} from 'lucide-react'

interface IntelligenceModeProps {
  language: 'vi' | 'en'
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
  relatedSection?: string
}

export default function IntelligenceMode({ language }: IntelligenceModeProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(
    'annual-report-2024'
  )
  const [chatInput, setChatInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const content = {
    vi: {
      title: 'AI Phân tích tài liệu',
      subtitle: 'Trò chuyện và phân tích sâu tài liệu với AI thông minh',
      noDocument: {
        title: 'Chưa có tài liệu',
        description: 'Tải lên tài liệu từ tab Tài liệu để bắt đầu phân tích',
        action: 'Đi đến Tài liệu',
      },
      documentViewer: {
        title: 'Xem tài liệu',
        pages: 'trang',
        analyzing: 'Đang phân tích...',
      },
      aiChat: {
        title: 'Trò chuyện với AI',
        placeholder: 'Hỏi về tài liệu này...',
        suggestions: [
          'Tóm tắt nội dung chính',
          'Tìm các điểm quan trọng',
          'So sánh dữ liệu trong bảng',
          'Giải thích thuật ngữ chuyên môn',
        ],
      },
      insights: {
        title: 'Thông tin thông minh',
        documentType: 'Loại tài liệu',
        complexity: 'Độ phức tạp',
        keyTopics: 'Chủ đề chính',
        sentiment: 'Cảm xúc',
        readingTime: 'Thời gian đọc',
      },
      quickActions: {
        title: 'Thao tác nhanh',
        summarize: 'Tóm tắt',
        extract: 'Trích xuất dữ liệu',
        translate: 'Dịch thuật',
        export: 'Xuất báo cáo',
      },
    },
    en: {
      title: 'AI Document Intelligence',
      subtitle: 'Chat and analyze documents in-depth with intelligent AI',
      noDocument: {
        title: 'No document selected',
        description:
          'Upload a document from the Documents tab to start analyzing',
        action: 'Go to Documents',
      },
      documentViewer: {
        title: 'Document Viewer',
        pages: 'pages',
        analyzing: 'Analyzing...',
      },
      aiChat: {
        title: 'Chat with AI',
        placeholder: 'Ask about this document...',
        suggestions: [
          'Summarize main content',
          'Find key insights',
          'Compare data in tables',
          'Explain technical terms',
        ],
      },
      insights: {
        title: 'Smart Insights',
        documentType: 'Document Type',
        complexity: 'Complexity',
        keyTopics: 'Key Topics',
        sentiment: 'Sentiment',
        readingTime: 'Reading Time',
      },
      quickActions: {
        title: 'Quick Actions',
        summarize: 'Summarize',
        extract: 'Extract Data',
        translate: 'Translate',
        export: 'Export Report',
      },
    },
  }

  // Mock chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        language === 'vi'
          ? 'Xin chào! Tôi đã phân tích tài liệu "Annual Report 2024.pdf" của bạn. Tài liệu này có 45 trang với nội dung về báo cáo tài chính và kế hoạch kinh doanh. Bạn có muốn tôi tóm tắt các điểm chính không?'
          : 'Hello! I\'ve analyzed your "Annual Report 2024.pdf" document. This 45-page document contains financial reports and business plans. Would you like me to summarize the key points?',
      timestamp: '2 minutes ago',
    },
  ])

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: 'now',
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsAnalyzing(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content:
          language === 'vi'
            ? 'Dựa trên phân tích tài liệu, tôi thấy có 3 điểm chính: 1) Doanh thu tăng 15% so với năm trước, 2) Chi phí vận hành giảm 8%, 3) Kế hoạch mở rộng thị trường quốc tế. Bạn có muốn tôi đi sâu vào phần nào không?'
            : 'Based on my document analysis, I found 3 key points: 1) Revenue increased 15% from last year, 2) Operating costs decreased 8%, 3) Plans for international market expansion. Would you like me to dive deeper into any section?',
        timestamp: 'now',
      }

      setChatMessages(prev => [...prev, aiResponse])
      setIsAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="h-full p-6">
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto h-full flex flex-col"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)} className="text-center mb-8">
          <h2 className="heading-2 text-gray-900 mb-4">
            {content[language].title}
          </h2>
          <p className="body-lg text-gray-600 max-w-2xl mx-auto">
            {content[language].subtitle}
          </p>
        </motion.div>

        {!selectedDocument ? (
          // No document state
          <motion.div
            variants={motionSafe(slideUp)}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center max-w-md">
              <Brain size={64} className="text-gray-300 mx-auto mb-6" />
              <h3 className="heading-3 text-gray-900 mb-4">
                {content[language].noDocument.title}
              </h3>
              <p className="body-base text-gray-600 mb-6">
                {content[language].noDocument.description}
              </p>
              <button className="btn-primary btn-pill-lg">
                {content[language].noDocument.action}
              </button>
            </div>
          </motion.div>
        ) : (
          // Main workspace with document
          <motion.div
            variants={motionSafe(slideUp)}
            className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Document Viewer */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-border-subtle p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="heading-4 text-gray-900">
                  {content[language].documentViewer.title}
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="body-sm text-gray-500">
                    45 {content[language].documentViewer.pages}
                  </span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Eye size={18} className="text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Document Preview */}
              <div className="flex-1 bg-gray-50 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <h4 className="heading-4 text-gray-700 mb-2">
                    Annual Report 2024.pdf
                  </h4>
                  <p className="body-sm text-gray-500 mb-6">
                    {language === 'vi'
                      ? 'Xem trước tài liệu với AI highlights'
                      : 'Document preview with AI highlights'}
                  </p>

                  {/* AI highlights simulation */}
                  <div className="space-y-3 max-w-md">
                    <div className="bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded-r-lg text-left">
                      <div className="body-sm font-medium text-gray-900">
                        {language === 'vi'
                          ? 'Điểm quan trọng được AI phát hiện'
                          : 'Key insight detected by AI'}
                      </div>
                      <div className="body-xs text-gray-600 mt-1">
                        {language === 'vi'
                          ? 'Doanh thu Q4 tăng 15% so với cùng kỳ'
                          : 'Q4 revenue increased 15% year-over-year'}
                      </div>
                    </div>
                    <div className="bg-blue-100 border-l-4 border-blue-400 p-3 rounded-r-lg text-left">
                      <div className="body-sm font-medium text-gray-900">
                        {language === 'vi'
                          ? 'Dữ liệu quan trọng'
                          : 'Important data'}
                      </div>
                      <div className="body-xs text-gray-600 mt-1">
                        {language === 'vi'
                          ? 'Kế hoạch mở rộng 5 thị trường mới'
                          : 'Plans to expand to 5 new markets'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Chat & Insights Panel */}
            <div className="space-y-6">
              {/* Smart Insights */}
              <div className="bg-white rounded-3xl border border-border-subtle p-6">
                <h3 className="heading-4 text-gray-900 mb-4">
                  {content[language].insights.title}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="body-sm text-gray-600">
                      {content[language].insights.documentType}
                    </span>
                    <span className="body-sm font-medium text-gray-900">
                      Business Report
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="body-sm text-gray-600">
                      {content[language].insights.complexity}
                    </span>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                        <div className="w-12 h-2 bg-orange-400 rounded-full"></div>
                      </div>
                      <span className="body-sm font-medium text-gray-900">
                        High
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="body-sm text-gray-600">
                      {content[language].insights.readingTime}
                    </span>
                    <span className="body-sm font-medium text-gray-900">
                      12 min
                    </span>
                  </div>
                  <div>
                    <span className="body-sm text-gray-600">
                      {content[language].insights.keyTopics}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full body-xs">
                        Finance
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full body-xs">
                        Growth
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full body-xs">
                        Strategy
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Chat */}
              <div className="bg-white rounded-3xl border border-border-subtle p-6 flex flex-col h-96">
                <h3 className="heading-4 text-gray-900 mb-4">
                  {content[language].aiChat.title}
                </h3>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="body-sm">{message.content}</div>
                        <div
                          className={`body-xs mt-1 ${
                            message.type === 'user'
                              ? 'text-gray-300'
                              : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isAnalyzing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-2xl">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                          <span className="body-sm">
                            {content[language].documentViewer.analyzing}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder={content[language].aiChat.placeholder}
                    className="flex-1 p-3 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isAnalyzing}
                    className="btn-primary btn-pill-compact-md p-3"
                  >
                    <Send size={16} />
                  </button>
                </div>

                {/* Quick Suggestions */}
                <div className="mt-4">
                  <div className="body-xs text-gray-500 mb-2">
                    {language === 'vi' ? 'Gợi ý:' : 'Suggestions:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content[language].aiChat.suggestions.map(
                      (suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setChatInput(suggestion)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full body-xs text-gray-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
