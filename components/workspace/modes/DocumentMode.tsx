'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import DocumentUpload from '@/components/documents/DocumentUpload'
import {
  Upload,
  FileText,
  Brain,
  Download,
  Languages,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react'

interface DocumentModeProps {
  language: 'vi' | 'en'
}

interface RecentDocument {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'txt'
  size: string
  uploadedAt: string
  status: 'completed' | 'processing' | 'failed'
  hasAiAnalysis: boolean
  languages: string[]
}

export default function DocumentMode({ language }: DocumentModeProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const content = {
    vi: {
      title: 'Không gian tài liệu',
      subtitle: 'Tải lên, dịch và phân tích tài liệu với AI thông minh',
      uploadZone: {
        title: 'Tải lên tài liệu',
        description: 'Kéo thả hoặc chọn tệp để bắt đầu',
        supported: 'Hỗ trợ PDF, DOCX, TXT, và nhiều định dạng khác',
      },
      quickActions: {
        title: 'Thao tác nhanh',
        translate: 'Dịch ngay',
        analyze: 'Phân tích AI',
        extract: 'Trích xuất dữ liệu',
        summarize: 'Tóm tắt',
      },
      recentDocuments: {
        title: 'Tài liệu gần đây',
        empty: 'Chưa có tài liệu nào',
        status: {
          completed: 'Hoàn thành',
          processing: 'Đang xử lý',
          failed: 'Thất bại',
        },
      },
      features: {
        instant: 'Dịch thuật tức thì',
        ai: 'Phân tích AI thông minh',
        preserve: 'Giữ nguyên định dạng',
        secure: 'Bảo mật tuyệt đối',
      },
    },
    en: {
      title: 'Document Workspace',
      subtitle: 'Upload, translate and analyze documents with intelligent AI',
      uploadZone: {
        title: 'Upload Document',
        description: 'Drag and drop or select files to get started',
        supported: 'Supports PDF, DOCX, TXT, and many other formats',
      },
      quickActions: {
        title: 'Quick Actions',
        translate: 'Translate Now',
        analyze: 'AI Analysis',
        extract: 'Extract Data',
        summarize: 'Summarize',
      },
      recentDocuments: {
        title: 'Recent Documents',
        empty: 'No documents yet',
        status: {
          completed: 'Completed',
          processing: 'Processing',
          failed: 'Failed',
        },
      },
      features: {
        instant: 'Instant Translation',
        ai: 'Smart AI Analysis',
        preserve: 'Format Preservation',
        secure: 'Absolute Security',
      },
    },
  }

  // Mock recent documents data
  const recentDocuments: RecentDocument[] = [
    {
      id: '1',
      name: 'Annual Report 2024.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadedAt: '2 hours ago',
      status: 'completed',
      hasAiAnalysis: true,
      languages: ['EN', 'VI'],
    },
    {
      id: '2',
      name: 'Contract Agreement.docx',
      type: 'docx',
      size: '856 KB',
      uploadedAt: '5 hours ago',
      status: 'processing',
      hasAiAnalysis: false,
      languages: ['EN'],
    },
    {
      id: '3',
      name: 'Research Notes.txt',
      type: 'txt',
      size: '124 KB',
      uploadedAt: '1 day ago',
      status: 'completed',
      hasAiAnalysis: true,
      languages: ['EN', 'VI', 'FR'],
    },
  ]

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setIsProcessing(true)
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
    }, 3000)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />
      case 'processing':
        return <Clock size={16} className="text-blue-500" />
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />
      default:
        return null
    }
  }

  const getFileIcon = (type: string) => {
    return <FileText size={20} className="text-gray-500" />
  }

  return (
    <div className="h-full p-6">
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)} className="text-center">
          <h2 className="heading-2 text-gray-900 mb-4">
            {content[language].title}
          </h2>
          <p className="body-lg text-gray-600 max-w-2xl mx-auto">
            {content[language].subtitle}
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <motion.div variants={motionSafe(slideUp)} className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-border-subtle p-8 h-full">
              <h3 className="heading-4 text-gray-900 mb-6">
                {content[language].uploadZone.title}
              </h3>

              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-gray-300 transition-colors">
                  <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                  <h4 className="heading-4 text-gray-700 mb-2">
                    {content[language].uploadZone.description}
                  </h4>
                  <p className="body-sm text-gray-500 mb-6">
                    {content[language].uploadZone.supported}
                  </p>

                  <DocumentUpload
                    language={language}
                    onFileSelect={handleFileSelect}
                    isProcessing={isProcessing}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {isProcessing ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
                      <h4 className="heading-4 text-gray-900 mb-2">
                        {language === 'vi' ? 'Đang xử lý...' : 'Processing...'}
                      </h4>
                      <p className="body-sm text-gray-500">
                        {language === 'vi'
                          ? 'AI đang phân tích tài liệu của bạn'
                          : 'AI is analyzing your document'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle
                        size={48}
                        className="text-green-500 mx-auto mb-4"
                      />
                      <h4 className="heading-4 text-gray-900 mb-2">
                        {language === 'vi'
                          ? 'Tải lên thành công!'
                          : 'Upload Successful!'}
                      </h4>
                      <p className="body-sm text-gray-500 mb-6">
                        {selectedFile.name} -{' '}
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button className="btn-primary btn-pill-compact-md">
                          <Languages size={16} className="mr-2" />
                          {content[language].quickActions.translate}
                        </button>
                        <button className="btn-secondary btn-pill-compact-md">
                          <Brain size={16} className="mr-2" />
                          {content[language].quickActions.analyze}
                        </button>
                        <button className="btn-secondary btn-pill-compact-md">
                          <Download size={16} className="mr-2" />
                          {content[language].quickActions.extract}
                        </button>
                        <button className="btn-secondary btn-pill-compact-md">
                          <FileText size={16} className="mr-2" />
                          {content[language].quickActions.summarize}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={motionSafe(slideUp)} className="space-y-6">
            {/* Features */}
            <div className="bg-white rounded-3xl border border-border-subtle p-6">
              <h3 className="heading-4 text-gray-900 mb-4">
                {language === 'vi' ? 'Tính năng nổi bật' : 'Key Features'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Zap size={20} className="text-blue-500 mt-0.5" />
                  <div>
                    <div className="body-sm font-medium text-gray-900">
                      {content[language].features.instant}
                    </div>
                    <div className="body-xs text-gray-500">
                      {language === 'vi'
                        ? 'Xử lý trong vài giây'
                        : 'Process in seconds'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Brain size={20} className="text-purple-500 mt-0.5" />
                  <div>
                    <div className="body-sm font-medium text-gray-900">
                      {content[language].features.ai}
                    </div>
                    <div className="body-xs text-gray-500">
                      {language === 'vi'
                        ? 'Hiểu sâu nội dung'
                        : 'Deep content understanding'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText size={20} className="text-green-500 mt-0.5" />
                  <div>
                    <div className="body-sm font-medium text-gray-900">
                      {content[language].features.preserve}
                    </div>
                    <div className="body-xs text-gray-500">
                      {language === 'vi'
                        ? 'Giữ nguyên bố cục'
                        : 'Maintain layout'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Documents */}
            <div className="bg-white rounded-3xl border border-border-subtle p-6">
              <h3 className="heading-4 text-gray-900 mb-4">
                {content[language].recentDocuments.title}
              </h3>
              {recentDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="body-sm text-gray-500">
                    {content[language].recentDocuments.empty}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <div className="flex-shrink-0 mr-3">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="body-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </div>
                          {doc.hasAiAnalysis && (
                            <Brain size={12} className="text-purple-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(doc.status)}
                          <span className="body-xs text-gray-500">
                            {doc.size}
                          </span>
                          <span className="body-xs text-gray-400">•</span>
                          <span className="body-xs text-gray-500">
                            {doc.uploadedAt}
                          </span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal size={16} className="text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
