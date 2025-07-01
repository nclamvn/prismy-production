'use client'

import { useState, useCallback, useRef } from 'react'
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

interface DocumentUploadProps {
  language?: 'vi' | 'en'
  onFileSelect?: (file: File) => void
  onAgentAssign?: (file: File, agentType: string) => void
  showAgentVisualization?: boolean
  isProcessing?: boolean
}

interface AgentType {
  id: string
  name: string
  type: 'speed' | 'accuracy' | 'context'
  confidence: number
  estimatedTime: string
  capabilities: string[]
  icon: string
}

const ACCEPTED_FILE_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function EnhancedDocumentUpload({
  language = 'en',
  onFileSelect,
  onAgentAssign,
  showAgentVisualization = false,
  isProcessing = false
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const content = {
    vi: {
      title: 'Tải lên tài liệu',
      subtitle: 'Kéo thả tài liệu hoặc nhấp để chọn',
      dragActive: 'Thả tài liệu tại đây',
      supportedFormats: 'Hỗ trợ: PDF, DOCX, TXT, PNG, JPG',
      maxSize: 'Kích thước tối đa: 10MB',
      fileSelected: 'Đã chọn tệp',
      selectFile: 'Chọn tệp',
      agentAssignment: 'Chỉ định Agent',
      recommendedAgent: 'Agent được đề xuất',
      processingSteps: 'Các bước xử lý',
      estimatedTime: 'Thời gian ước tính',
      startProcessing: 'Bắt đầu xử lý',
      processing: 'Đang xử lý...',
      cancel: 'Hủy'
    },
    en: {
      title: 'Upload Document',
      subtitle: 'Drag and drop your document or click to select',
      dragActive: 'Drop your document here',
      supportedFormats: 'Supported: PDF, DOCX, TXT, PNG, JPG',
      maxSize: 'Max size: 10MB',
      fileSelected: 'File selected',
      selectFile: 'Select File',
      agentAssignment: 'Agent Assignment',
      recommendedAgent: 'Recommended Agent',
      processingSteps: 'Processing Steps',
      estimatedTime: 'Estimated time',
      startProcessing: 'Start Processing',
      processing: 'Processing...',
      cancel: 'Cancel'
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    setError(null)
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`)
      return
    }

    // Validate file type
    const isValidType = Object.values(ACCEPTED_FILE_TYPES).includes(file.type) ||
      Object.keys(ACCEPTED_FILE_TYPES).some(ext => file.name.toLowerCase().endsWith(ext))
    
    if (!isValidType) {
      setError('Unsupported file type')
      return
    }

    setSelectedFile(file)
    onFileSelect?.(file)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-600" />
    }
    return <FileText className="w-8 h-8 text-blue-600" />
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Upload Area */}
      <div
        className={`relative p-8 text-center transition-all duration-300 cursor-pointer border-2 border-dashed rounded-xl ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50'
        }`}
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
          onChange={handleFileChange}
        />

        <div className="space-y-4">
          {selectedFile ? (
            <div className="flex items-center justify-center space-x-3">
              {getFileIcon(selectedFile)}
              <div>
                <p className="font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {content[language].title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isDragging ? content[language].dragActive : content[language].subtitle}
                </p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {content[language].selectFile}
                </button>
              </div>
            </>
          )}
        </div>

        {/* File format info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">
            {content[language].supportedFormats}
          </p>
          <p className="text-xs text-gray-500">
            {content[language].maxSize}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">
                {error}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Processing progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-6 animate-fadeInUp">
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
    </div>
  )
}