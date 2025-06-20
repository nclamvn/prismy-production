'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { motionSafe } from '@/lib/motion'
import { analytics } from '@/src/lib/analytics'

interface IntelligentDocumentUploadProps {
  language?: 'vi' | 'en'
  onIntelligenceReady: (intelligence: DocumentIntelligence) => void
  onError?: (error: string) => void
  maxSizeMB?: number
  className?: string
}

interface DocumentIntelligence {
  documentId: string
  quickInsights: {
    documentType: string
    detectedLanguage: string
    estimatedReadingTime: number
    keyTopics: string[]
    complexity: 'low' | 'medium' | 'high'
    confidence: number
  }
  processingRecommendations: {
    suggestedAnalysisDepth: 'quick' | 'standard' | 'comprehensive'
    estimatedProcessingTime: number
    recommendedFeatures: string[]
  }
  backgroundJobId: string
  estimatedCompletion: Date
  documentAgent: {
    agentId: string
    personality: string
    autonomyLevel: number
    capabilities: string[]
    status: string
  }
}

interface ProcessingStatus {
  stage: string
  progress: number
  message: string
  estimatedTimeRemaining: number
}

interface AIProcessingOptions {
  analysisDepth: 'quick' | 'standard' | 'comprehensive'
  enablePredictiveInsights: boolean
  domain?: string
  customLanguage?: string
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff'],
  'image/webp': ['.webp']
}

export default function IntelligentDocumentUpload({ 
  language = 'en', 
  onIntelligenceReady,
  onError,
  maxSizeMB = 10,
  className = ''
}: IntelligentDocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [quickInsights, setQuickInsights] = useState<DocumentIntelligence | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
  const [aiOptions, setAiOptions] = useState<AIProcessingOptions>({
    analysisDepth: 'standard',
    enablePredictiveInsights: true,
    domain: undefined,
    customLanguage: undefined
  })

  const { user, profile } = useAuth()
  const userTier = (profile as any)?.tier || 'free'

  const content = {
    vi: {
      title: 'Tải lên tài liệu thông minh',
      subtitle: 'AI sẽ phân tích và hiểu tài liệu của bạn trong thời gian thực',
      supportedFormats: 'Hỗ trợ: PDF, DOCX, DOC, TXT, CSV, XLS, XLSX và hình ảnh',
      uploadButton: 'Chọn tài liệu để phân tích AI',
      processingText: 'AI đang phân tích...',
      dragActive: 'Thả tài liệu vào đây để phân tích AI',
      aiOptions: {
        title: 'Tùy chọn phân tích AI',
        analysisDepth: 'Độ sâu phân tích',
        quick: 'Nhanh (< 30 giây)',
        standard: 'Tiêu chuẩn (1-2 phút)', 
        comprehensive: 'Toàn diện (2-5 phút)',
        predictiveInsights: 'Kích hoạt dự đoán thông minh',
        domain: 'Lĩnh vực chuyên môn',
        language: 'Ngôn ngữ tùy chỉnh'
      },
      quickInsights: {
        title: 'Thông tin nhanh từ AI',
        documentType: 'Loại tài liệu',
        language: 'Ngôn ngữ',
        readingTime: 'Thời gian đọc',
        complexity: 'Độ phức tạp',
        topics: 'Chủ đề chính',
        confidence: 'Độ tin cậy'
      },
      documentAgent: {
        title: 'Agent Tự Động Được Tạo',
        subtitle: 'Tài liệu của bạn giờ đây có một AI agent riêng làm việc cho bạn',
        personality: 'Chuyên môn',
        autonomy: 'Mức độ tự động',
        capabilities: 'Khả năng',
        status: 'Trạng thái',
        viewDashboard: 'Xem Bảng Điều Khiển Agent'
      },
      processing: {
        analyzing: 'AI đang phân tích cấu trúc...',
        extracting: 'Trích xuất thực thể và khái niệm...',
        building: 'Xây dựng đồ thị tri thức...',
        enhancing: 'Áp dụng cải tiến ngữ cảnh...',
        completing: 'Hoàn thiện phân tích thông minh...'
      },
      errors: {
        fileType: 'Loại tệp không được hỗ trợ cho phân tích AI',
        fileSize: `Tệp quá lớn. Kích thước tối đa cho gói ${userTier}: ${maxSizeMB}MB`,
        upload: 'Không thể tải lên tệp để phân tích AI',
        auth: 'Vui lòng đăng nhập để sử dụng phân tích AI'
      }
    },
    en: {
      title: 'Intelligent Document Upload',
      subtitle: 'AI will analyze and understand your document in real-time',
      supportedFormats: 'Supported: PDF, DOCX, DOC, TXT, CSV, XLS, XLSX and images',
      uploadButton: 'Select Document for AI Analysis',
      processingText: 'AI is analyzing...',
      dragActive: 'Drop your document here for AI analysis',
      aiOptions: {
        title: 'AI Analysis Options',
        analysisDepth: 'Analysis Depth',
        quick: 'Quick (< 30 seconds)',
        standard: 'Standard (1-2 minutes)',
        comprehensive: 'Comprehensive (2-5 minutes)',
        predictiveInsights: 'Enable Predictive Insights',
        domain: 'Domain Expertise',
        language: 'Custom Language'
      },
      quickInsights: {
        title: 'AI Quick Insights',
        documentType: 'Document Type',
        language: 'Language',
        readingTime: 'Reading Time',
        complexity: 'Complexity',
        topics: 'Key Topics',
        confidence: 'Confidence'
      },
      documentAgent: {
        title: 'Autonomous Agent Created',
        subtitle: 'Your document now has its own AI agent working autonomously for you',
        personality: 'Personality',
        autonomy: 'Autonomy Level',
        capabilities: 'Capabilities',
        status: 'Status',
        viewDashboard: 'View Agent Dashboard'
      },
      processing: {
        analyzing: 'AI analyzing document structure...',
        extracting: 'Extracting entities and concepts...',
        building: 'Building knowledge graph...',
        enhancing: 'Applying contextual enhancements...',
        completing: 'Completing intelligent analysis...'
      },
      errors: {
        fileType: 'File type not supported for AI analysis',
        fileSize: `File too large. Maximum size for ${userTier} tier: ${maxSizeMB}MB`,
        upload: 'Failed to upload file for AI analysis',
        auth: 'Please sign in to use AI analysis'
      }
    }
  }

  // Real-time processing status updates
  useEffect(() => {
    if (!quickInsights?.backgroundJobId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/intelligence?jobId=${quickInsights.backgroundJobId}`)
        const data = await response.json()

        if (data.success && data.job) {
          const job = data.job
          
          setProcessingStatus({
            stage: getProcessingStage(job.progress),
            progress: job.progress || 0,
            message: job.message || '',
            estimatedTimeRemaining: Math.max(0, (quickInsights.estimatedCompletion.getTime() - Date.now()) / 1000)
          })

          if (job.status === 'completed') {
            clearInterval(pollInterval)
            setIsProcessing(false)
            
            // Update intelligence with final results
            const finalIntelligence = {
              ...quickInsights,
              finalResults: job.result
            }
            
            analytics.track('ai_document_analysis_completed', {
              documentId: quickInsights.documentId,
              analysisDepth: aiOptions.analysisDepth,
              processingTime: Date.now() - new Date(quickInsights.estimatedCompletion.getTime() - quickInsights.processingRecommendations.estimatedProcessingTime * 1000).getTime()
            })
            
            onIntelligenceReady(finalIntelligence)
          } else if (job.status === 'failed') {
            clearInterval(pollInterval)
            setIsProcessing(false)
            setError('AI analysis failed. Please try again.')
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [quickInsights?.backgroundJobId])

  const validateFile = useCallback((file: File): string | null => {
    if (!user) {
      return content[language].errors.auth
    }

    // Check file type
    const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)
    if (!isValidType) {
      return content[language].errors.fileType
    }

    // Check file size based on user tier
    const tierLimits = {
      free: 10,
      premium: 50,
      enterprise: 100
    }
    const actualMaxSize = tierLimits[userTier as keyof typeof tierLimits] || 10
    const maxSizeBytes = actualMaxSize * 1024 * 1024
    
    if (file.size > maxSizeBytes) {
      return content[language].errors.fileSize.replace(`${maxSizeMB}MB`, `${actualMaxSize}MB`)
    }

    return null
  }, [language, userTier, user, content])

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setQuickInsights(null)
    setProcessingStatus(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setIsProcessing(true)

    try {
      // Create form data for multipart upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('options', JSON.stringify(aiOptions))

      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf')
      const { token } = await csrfResponse.json()

      const response = await fetch('/api/documents/intelligence', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const intelligence: DocumentIntelligence = {
          ...data.intelligence,
          estimatedCompletion: new Date(data.intelligence.estimatedCompletion)
        }
        
        setQuickInsights(intelligence)
        
        // Track analytics
        analytics.track('ai_document_analysis_started', {
          documentId: intelligence.documentId,
          documentType: intelligence.quickInsights.documentType,
          analysisDepth: aiOptions.analysisDepth,
          fileSize: file.size,
          complexity: intelligence.quickInsights.complexity
        })

        // Continue processing in background - status will be updated via polling
      } else {
        throw new Error(data.error || 'Failed to process document')
      }
    } catch (error) {
      setIsProcessing(false)
      setError(content[language].errors.upload)
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [validateFile, aiOptions, language, content, onError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const getProcessingStage = (progress: number): string => {
    if (progress < 20) return content[language].processing.analyzing
    if (progress < 50) return content[language].processing.extracting
    if (progress < 75) return content[language].processing.building
    if (progress < 95) return content[language].processing.enhancing
    return content[language].processing.completing
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.ceil(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatComplexity = (complexity: string): { color: string, label: string } => {
    const complexityMap = {
      low: { color: 'text-green-600 bg-green-50', label: language === 'vi' ? 'Thấp' : 'Low' },
      medium: { color: 'text-yellow-600 bg-yellow-50', label: language === 'vi' ? 'Trung bình' : 'Medium' },
      high: { color: 'text-red-600 bg-red-50', label: language === 'vi' ? 'Cao' : 'High' }
    }
    return complexityMap[complexity as keyof typeof complexityMap] || complexityMap.medium
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* AI Processing Options */}
      {!isProcessing && !quickInsights && (
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          variants={motionSafe({
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 }
          })}
          initial="initial"
          animate="animate"
        >
          <h3 className="heading-4 text-gray-900 mb-4">{content[language].aiOptions.title}</h3>
          
          <div className="space-y-4">
            {/* Analysis Depth */}
            <div>
              <label className="block body-sm text-gray-700 mb-2">
                {content[language].aiOptions.analysisDepth}
              </label>
              <select
                value={aiOptions.analysisDepth}
                onChange={(e) => setAiOptions(prev => ({ 
                  ...prev, 
                  analysisDepth: e.target.value as 'quick' | 'standard' | 'comprehensive'
                }))}
                className="input-base w-full"
              >
                <option value="quick">{content[language].aiOptions.quick}</option>
                <option value="standard">{content[language].aiOptions.standard}</option>
                <option value="comprehensive">{content[language].aiOptions.comprehensive}</option>
              </select>
            </div>

            {/* Predictive Insights (Premium/Enterprise only) */}
            {userTier !== 'free' && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="predictive-insights"
                  checked={aiOptions.enablePredictiveInsights}
                  onChange={(e) => setAiOptions(prev => ({ 
                    ...prev, 
                    enablePredictiveInsights: e.target.checked 
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="predictive-insights" className="body-sm text-gray-700">
                  {content[language].aiOptions.predictiveInsights}
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {userTier.toUpperCase()}
                  </span>
                </label>
              </div>
            )}

            {/* Domain Selection */}
            <div>
              <label className="block body-sm text-gray-700 mb-2">
                {content[language].aiOptions.domain}
              </label>
              <select
                value={aiOptions.domain || ''}
                onChange={(e) => setAiOptions(prev => ({ 
                  ...prev, 
                  domain: e.target.value || undefined 
                }))}
                className="input-base w-full"
              >
                <option value="">Auto-detect</option>
                <option value="legal">Legal</option>
                <option value="financial">Financial</option>
                <option value="technical">Technical</option>
                <option value="medical">Medical</option>
                <option value="academic">Academic</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* File Upload Area */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-white'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && document.getElementById('file-upload')?.click()}
        variants={motionSafe({
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 }
        })}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept={Object.values(ACCEPTED_FILE_TYPES).flat().join(',')}
          onChange={handleFileSelect}
          disabled={isProcessing}
        />

        <div className="space-y-4">
          {/* AI Brain Icon */}
          <div className="flex justify-center">
            <div className={`relative ${isDragging ? 'scale-110' : ''} transition-transform duration-200`}>
              <svg
                className={`w-16 h-16 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              {/* AI pulse effect */}
              {isProcessing && (
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="heading-4 text-gray-900">
              {isDragging ? content[language].dragActive : content[language].title}
            </h3>
            <p className="body-base text-gray-600">
              {content[language].subtitle}
            </p>
            <p className="body-sm text-gray-500">
              {content[language].supportedFormats}
            </p>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            className="btn-primary"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                {content[language].processingText}
              </span>
            ) : (
              content[language].uploadButton
            )}
          </button>
        </div>
      </motion.div>

      {/* Quick Insights Display */}
      <AnimatePresence>
        {quickInsights && (
          <motion.div
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="heading-4 text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
                {content[language].quickInsights.title}
              </h3>
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {Math.round(quickInsights.quickInsights.confidence * 100)}% {content[language].quickInsights.confidence}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3">
                <div className="body-xs text-gray-600 mb-1">{content[language].quickInsights.documentType}</div>
                <div className="body-sm font-medium text-gray-900">{quickInsights.quickInsights.documentType}</div>
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <div className="body-xs text-gray-600 mb-1">{content[language].quickInsights.readingTime}</div>
                <div className="body-sm font-medium text-gray-900">{quickInsights.quickInsights.estimatedReadingTime} min</div>
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <div className="body-xs text-gray-600 mb-1">{content[language].quickInsights.complexity}</div>
                <div className={`body-sm font-medium px-2 py-1 rounded ${formatComplexity(quickInsights.quickInsights.complexity).color}`}>
                  {formatComplexity(quickInsights.quickInsights.complexity).label}
                </div>
              </div>
            </div>

            {quickInsights.quickInsights.keyTopics.length > 0 && (
              <div className="bg-white rounded-lg p-3">
                <div className="body-xs text-gray-600 mb-2">{content[language].quickInsights.topics}</div>
                <div className="flex flex-wrap gap-2">
                  {quickInsights.quickInsights.keyTopics.map((topic, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revolutionary: Autonomous Agent Display */}
      <AnimatePresence>
        {quickInsights?.documentAgent && (
          <motion.div
            className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="relative">
                  <svg className="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="heading-4 text-gray-900">{content[language].documentAgent.title}</h3>
                  <p className="body-sm text-gray-600">{content[language].documentAgent.subtitle}</p>
                </div>
              </div>
              <div className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                🤖 AUTONOMOUS
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <div className="body-xs text-gray-600 mb-1">{content[language].documentAgent.personality}</div>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    quickInsights.documentAgent.personality === 'legal' ? 'bg-purple-100 text-purple-800' :
                    quickInsights.documentAgent.personality === 'financial' ? 'bg-green-100 text-green-800' :
                    quickInsights.documentAgent.personality === 'project' ? 'bg-blue-100 text-blue-800' :
                    quickInsights.documentAgent.personality === 'research' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quickInsights.documentAgent.personality.charAt(0).toUpperCase() + quickInsights.documentAgent.personality.slice(1)}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="body-xs text-gray-600 mb-1">{content[language].documentAgent.autonomy}</div>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <motion.div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${quickInsights.documentAgent.autonomyLevel * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="body-sm font-medium text-gray-900">
                    {Math.round(quickInsights.documentAgent.autonomyLevel * 100)}%
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="body-xs text-gray-600 mb-1">{content[language].documentAgent.status}</div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    quickInsights.documentAgent.status === 'active' ? 'bg-green-500 animate-pulse' :
                    quickInsights.documentAgent.status === 'learning' ? 'bg-blue-500 animate-pulse' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="body-sm font-medium text-gray-900 capitalize">
                    {quickInsights.documentAgent.status}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="body-xs text-gray-600 mb-1">Agent ID</div>
                <div className="body-sm font-mono text-gray-700">
                  {quickInsights.documentAgent.agentId.substring(0, 12)}...
                </div>
              </div>
            </div>

            {quickInsights.documentAgent.capabilities.length > 0 && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="body-xs text-gray-600 mb-2">{content[language].documentAgent.capabilities}</div>
                <div className="grid grid-cols-1 gap-2">
                  {quickInsights.documentAgent.capabilities.slice(0, 3).map((capability, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {capability}
                    </div>
                  ))}
                  {quickInsights.documentAgent.capabilities.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{quickInsights.documentAgent.capabilities.length - 3} more capabilities...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                🧠 Your document is now an autonomous AI worker that will continuously monitor, learn, and act on your behalf.
              </div>
              <a
                href="/dashboard/agents"
                className="btn-primary text-sm px-4 py-2 flex items-center"
              >
                {content[language].documentAgent.viewDashboard}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-1M10 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 6h8M16 10l4-4m0 0l-4-4m4 4H8" />
                </svg>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Status */}
      <AnimatePresence>
        {processingStatus && isProcessing && (
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-4 text-gray-900">AI Analysis Progress</h3>
              <div className="text-sm text-gray-600">
                {formatTime(processingStatus.estimatedTimeRemaining)} remaining
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="body-sm text-gray-700">{processingStatus.stage}</span>
                <span className="body-sm font-medium text-gray-900">{Math.round(processingStatus.progress)}%</span>
              </div>
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${processingStatus.progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {processingStatus.message && (
              <p className="body-sm text-gray-600">{processingStatus.message}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="body-sm text-red-800">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}