'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  Image, 
  CheckCircle, 
  XCircle, 
  Brain, 
  Users, 
  Zap,
  Clock,
  AlertTriangle,
  Eye,
  Settings
} from 'lucide-react'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'

interface DocumentUploadProps {
  language?: 'vi' | 'en'
  onFileSelect: (file: File) => void
  onAgentAssign?: (file: File, agentType: string) => void
  maxSizeMB?: number
  isProcessing?: boolean
  showAgentVisualization?: boolean
}

interface AgentAssignment {
  id: string
  name: string
  type: 'legal' | 'financial' | 'project' | 'research' | 'general'
  confidence: number
  estimatedTime: string
  capabilities: string[]
}

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'active' | 'completed' | 'error'
  estimatedTime?: string
  agent?: string
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

export default function EnhancedDocumentUpload({ 
  language = 'en', 
  onFileSelect,
  onAgentAssign,
  maxSizeMB = 10,
  isProcessing = false,
  showAgentVisualization = true
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [suggestedAgents, setSuggestedAgents] = useState<AgentAssignment[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentAssignment | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const content = {
    vi: {
      title: 'Tải lên và xử lý tài liệu với AI',
      subtitle: 'Kéo và thả tài liệu vào đây để các AI agents phân tích',
      supportedFormats: 'Hỗ trợ: PDF, DOCX, DOC, TXT, CSV, XLS, XLSX, JPG, PNG, GIF, BMP, TIFF, WEBP',
      maxSize: `Kích thước tối đa: ${maxSizeMB}MB`,
      uploadButton: 'Chọn tài liệu',
      processing: 'Đang xử lý...',
      dragActive: 'Thả tài liệu vào đây',
      agentAssignment: 'Gán AI Agent',
      recommendedAgent: 'Agent được đề xuất',
      estimatedTime: 'Thời gian ước tính',
      processingSteps: 'Các bước xử lý',
      selectAgent: 'Chọn Agent',
      startProcessing: 'Bắt đầu xử lý',
      preview: 'Xem trước',
      errors: {
        fileType: 'Loại tệp không được hỗ trợ',
        fileSize: `Tệp quá lớn. Kích thước tối đa: ${maxSizeMB}MB`,
        upload: 'Lỗi tải lên tệp'
      }
    },
    en: {
      title: 'Upload and process documents with AI',
      subtitle: 'Drag and drop documents here for AI agents to analyze',
      supportedFormats: 'Supported: PDF, DOCX, DOC, TXT, CSV, XLS, XLSX, JPG, PNG, GIF, BMP, TIFF, WEBP',
      maxSize: `Maximum size: ${maxSizeMB}MB`,
      uploadButton: 'Choose Document',
      processing: 'Processing...',
      dragActive: 'Drop document here',
      agentAssignment: 'AI Agent Assignment',
      recommendedAgent: 'Recommended Agent',
      estimatedTime: 'Estimated Time',
      processingSteps: 'Processing Steps',
      selectAgent: 'Select Agent',
      startProcessing: 'Start Processing',
      preview: 'Preview',
      errors: {
        fileType: 'File type not supported',
        fileSize: `File too large. Maximum size: ${maxSizeMB}MB`,
        upload: 'Error uploading file'
      }
    }
  }

  const analyzeFileAndSuggestAgents = useCallback((file: File) => {
    const fileName = file.name.toLowerCase()
    const fileType = file.type
    
    // AI-powered agent suggestions based on file characteristics
    const suggestions: AgentAssignment[] = []

    if (fileName.includes('contract') || fileName.includes('legal') || fileName.includes('agreement')) {
      suggestions.push({
        id: 'legal-agent',
        name: language === 'vi' ? 'Agent Luật Sư' : 'Legal Agent',
        type: 'legal',
        confidence: 0.95,
        estimatedTime: '3-5 mins',
        capabilities: [
          language === 'vi' ? 'Phân tích hợp đồng' : 'Contract analysis',
          language === 'vi' ? 'Xác định rủi ro pháp lý' : 'Legal risk identification',
          language === 'vi' ? 'Tóm tắt điều khoản' : 'Terms summarization'
        ]
      })
    }

    if (fileName.includes('financial') || fileName.includes('budget') || fileName.includes('report') || fileType.includes('spreadsheet')) {
      suggestions.push({
        id: 'financial-agent',
        name: language === 'vi' ? 'Agent Tài Chính' : 'Financial Agent',
        type: 'financial',
        confidence: 0.88,
        estimatedTime: '2-4 mins',
        capabilities: [
          language === 'vi' ? 'Phân tích tài chính' : 'Financial analysis',
          language === 'vi' ? 'Tạo biểu đồ' : 'Chart generation',
          language === 'vi' ? 'Dự báo xu hướng' : 'Trend forecasting'
        ]
      })
    }

    if (fileName.includes('project') || fileName.includes('plan') || fileName.includes('roadmap')) {
      suggestions.push({
        id: 'project-agent',
        name: language === 'vi' ? 'Agent Quản Lý Dự Án' : 'Project Agent',
        type: 'project',
        confidence: 0.82,
        estimatedTime: '4-6 mins',
        capabilities: [
          language === 'vi' ? 'Lập kế hoạch dự án' : 'Project planning',
          language === 'vi' ? 'Theo dõi tiến độ' : 'Progress tracking',
          language === 'vi' ? 'Quản lý rủi ro' : 'Risk management'
        ]
      })
    }

    if (fileName.includes('research') || fileName.includes('study') || fileName.includes('analysis')) {
      suggestions.push({
        id: 'research-agent',
        name: language === 'vi' ? 'Agent Nghiên Cứu' : 'Research Agent',
        type: 'research',
        confidence: 0.90,
        estimatedTime: '5-8 mins',
        capabilities: [
          language === 'vi' ? 'Phân tích nghiên cứu' : 'Research analysis',
          language === 'vi' ? 'Tổng hợp dữ liệu' : 'Data synthesis',
          language === 'vi' ? 'Tạo insights' : 'Insight generation'
        ]
      })
    }

    // Default general agent
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'general-agent',
        name: language === 'vi' ? 'Agent Đa Năng' : 'General Agent',
        type: 'general',
        confidence: 0.75,
        estimatedTime: '2-3 mins',
        capabilities: [
          language === 'vi' ? 'Phân tích tổng quát' : 'General analysis',
          language === 'vi' ? 'Tóm tắt nội dung' : 'Content summarization',
          language === 'vi' ? 'Trích xuất thông tin' : 'Information extraction'
        ]
      })
    }

    setSuggestedAgents(suggestions)
    setSelectedAgent(suggestions[0])

    // Generate processing steps based on selected agent
    generateProcessingSteps(suggestions[0], file)
  }, [language])

  const generateProcessingSteps = (agent: AgentAssignment, file: File) => {
    const baseSteps: ProcessingStep[] = [
      {
        id: 'upload',
        name: language === 'vi' ? 'Tải lên tài liệu' : 'Upload document',
        status: 'completed'
      },
      {
        id: 'analyze',
        name: language === 'vi' ? 'Phân tích nội dung' : 'Analyze content',
        status: 'pending',
        estimatedTime: '30s',
        agent: agent.name
      },
      {
        id: 'extract',
        name: language === 'vi' ? 'Trích xuất thông tin' : 'Extract information',
        status: 'pending',
        estimatedTime: '45s',
        agent: agent.name
      },
      {
        id: 'insights',
        name: language === 'vi' ? 'Tạo insights' : 'Generate insights',
        status: 'pending',
        estimatedTime: '1m',
        agent: agent.name
      },
      {
        id: 'complete',
        name: language === 'vi' ? 'Hoàn thành' : 'Complete',
        status: 'pending'
      }
    ]

    setProcessingSteps(baseSteps)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [])

  const handleFileSelection = useCallback((file: File) => {
    // Validate file type
    const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type) || 
                       Object.values(ACCEPTED_FILE_TYPES).flat().some(ext => 
                         file.name.toLowerCase().endsWith(ext)
                       )

    if (!isValidType) {
      setError(content[language].errors.fileType)
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      setError(content[language].errors.fileSize)
      return
    }

    setSelectedFile(file)
    setError(null)
    
    if (showAgentVisualization) {
      analyzeFileAndSuggestAgents(file)
    } else {
      onFileSelect(file)
    }
  }, [maxSizeMB, language, showAgentVisualization, analyzeFileAndSuggestAgents, onFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleStartProcessing = () => {
    if (selectedFile && selectedAgent) {
      onFileSelect(selectedFile)
      if (onAgentAssign) {
        onAgentAssign(selectedFile, selectedAgent.type)
      }
      
      // Simulate processing steps
      simulateProcessing()
    }
  }

  const simulateProcessing = () => {
    setUploadProgress(0)
    const steps = [...processingSteps]
    
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Simulate processing steps
    steps.forEach((step, index) => {
      setTimeout(() => {
        setProcessingSteps(prev => 
          prev.map(s => 
            s.id === step.id 
              ? { ...s, status: 'active' }
              : s
          )
        )
        
        setTimeout(() => {
          setProcessingSteps(prev => 
            prev.map(s => 
              s.id === step.id 
                ? { ...s, status: 'completed' }
                : s
            )
          )
        }, 1000)
      }, index * 1500)
    })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8" />
    }
    return <FileText className="w-8 h-8" />
  }

  const getAgentIcon = (type: string) => {
    return <Brain className="w-5 h-5" />
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'active':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <motion.div
      variants={motionSafe(staggerContainer)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Upload Area */}
      <motion.div
        variants={motionSafe(slideUp)}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${selectedFile ? 'border-green-400 bg-green-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={Object.keys(ACCEPTED_FILE_TYPES).join(',')}
          onChange={handleFileInputChange}
        />

        <div className="space-y-4">
          {selectedFile ? (
            <div className="flex items-center justify-center space-x-3">
              {getFileIcon(selectedFile)}
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {content[language].title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isDragging ? content[language].dragActive : content[language].subtitle}
                </p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  {content[language].uploadButton}
                </button>
              </div>
            </>
          )}
        </div>

        {/* File format info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">{content[language].supportedFormats}</p>
          <p className="text-xs text-gray-500">{content[language].maxSize}</p>
        </div>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Agent Assignment */}
      {selectedFile && showAgentVisualization && (
        <motion.div
          variants={motionSafe(slideUp)}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>{content[language].agentAssignment}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agent Selection */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{content[language].recommendedAgent}</h4>
              <div className="space-y-3">
                {suggestedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${selectedAgent?.id === agent.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getAgentIcon(agent.type)}
                        <span className="font-medium text-gray-900">{agent.name}</span>
                      </div>
                      <span className="text-sm text-purple-600 font-medium">
                        {Math.round(agent.confidence * 100)}% match
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {content[language].estimatedTime}: {agent.estimatedTime}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 2).map((capability, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Preview */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{content[language].processingSteps}</h4>
              <div className="space-y-2">
                {processingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg
                      ${step.status === 'active' ? 'bg-blue-50' : 
                        step.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'}
                    `}
                  >
                    {getStepIcon(step.status)}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {step.name}
                      </div>
                      {step.agent && (
                        <div className="text-xs text-gray-500">
                          by {step.agent}
                        </div>
                      )}
                    </div>
                    {step.estimatedTime && step.status === 'pending' && (
                      <span className="text-xs text-gray-500">{step.estimatedTime}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Uploading...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setSelectedFile(null)
                setSuggestedAgents([])
                setSelectedAgent(null)
                setProcessingSteps([])
                setUploadProgress(0)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex space-x-3">
              <button
                className="px-4 py-2 text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>{content[language].preview}</span>
              </button>
              
              <button
                onClick={handleStartProcessing}
                disabled={!selectedAgent || isProcessing}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{content[language].startProcessing}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}