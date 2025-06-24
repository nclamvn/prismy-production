'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  Image, 
  Music, 
  Video, 
  FileSpreadsheet,
  Presentation,
  Check,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useLanguage } from '@/contexts/LanguageContext'
import { processDocumentWithAI, isFormatSupported, getSupportedFormats } from '@/lib/ai-document-processor'
import type { AIProcessingResult, ProcessingProgress } from '@/lib/ai-document-processor'

interface DocumentUploadProps {
  onDocumentProcessed?: (result: AIProcessingResult) => void
  onError?: (error: Error) => void
  className?: string
}

interface UploadingFile {
  file: File
  id: string
  progress: ProcessingProgress
  status: 'uploading' | 'processing' | 'completed' | 'error'
  result?: AIProcessingResult
  error?: string
}

export default function DocumentUpload({
  onDocumentProcessed,
  onError,
  className = ''
}: DocumentUploadProps) {
  const { language } = useLanguage()
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Add file to uploading list
      const uploadingFile: UploadingFile = {
        file,
        id: fileId,
        progress: {
          stage: 'uploading',
          progress: 0,
          message: 'Starting upload...',
          messageVi: 'Bắt đầu tải lên...'
        },
        status: 'uploading'
      }

      setUploadingFiles(prev => new Map(prev).set(fileId, uploadingFile))

      try {
        // Process document with AI
        const result = await processDocumentWithAI(
          file,
          {
            language: 'auto',
            extractMetadata: true,
            generateInsights: true,
            performOCR: true,
            culturalContext: 'vietnamese',
            assignAgents: true,
            deepAnalysis: true,
            extractEntities: true,
            generateSummary: true,
            detectSentiment: true
          },
          (progress) => {
            setUploadingFiles(prev => {
              const updated = new Map(prev)
              const current = updated.get(fileId)
              if (current) {
                current.progress = progress
                current.status = progress.progress === 100 ? 'completed' : 'processing'
              }
              return updated
            })
          }
        )

        // Update with result
        setUploadingFiles(prev => {
          const updated = new Map(prev)
          const current = updated.get(fileId)
          if (current) {
            current.status = 'completed'
            current.result = result
          }
          return updated
        })

        // Notify parent
        if (onDocumentProcessed) {
          onDocumentProcessed(result)
        }

        // Remove from list after delay
        setTimeout(() => {
          setUploadingFiles(prev => {
            const updated = new Map(prev)
            updated.delete(fileId)
            return updated
          })
        }, 3000)
      } catch (error) {
        console.error('Document processing error:', error)
        
        // Update with error
        setUploadingFiles(prev => {
          const updated = new Map(prev)
          const current = updated.get(fileId)
          if (current) {
            current.status = 'error'
            current.error = error instanceof Error ? error.message : 'Processing failed'
          }
          return updated
        })

        if (onError) {
          onError(error instanceof Error ? error : new Error('Processing failed'))
        }
      }
    }
  }, [onDocumentProcessed, onError])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    multiple: true,
    validator: (file) => {
      if (!isFormatSupported(file.name)) {
        return {
          code: 'unsupported-format',
          message: language === 'vi' 
            ? `Định dạng không được hỗ trợ: ${file.name}`
            : `Unsupported format: ${file.name}`
        }
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return {
          code: 'file-too-large',
          message: language === 'vi'
            ? `File quá lớn (tối đa 50MB): ${file.name}`
            : `File too large (max 50MB): ${file.name}`
        }
      }
      return null
    }
  })

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) return <Image className="w-5 h-5" />
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) return <Music className="w-5 h-5" />
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) return <Video className="w-5 h-5" />
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5" />
    if (['ppt', 'pptx'].includes(ext || '')) return <Presentation className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  const getStageMessage = (progress: ProcessingProgress) => {
    return language === 'vi' ? progress.messageVi : progress.message
  }

  return (
    <div className={`document-upload-container ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          dropzone relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center"
        >
          <Upload className={`w-12 h-12 mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-600">
              {language === 'vi' ? 'Thả file vào đây...' : 'Drop files here...'}
            </p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">
                {language === 'vi' 
                  ? 'Kéo thả file hoặc click để chọn'
                  : 'Drag & drop files or click to select'
                }
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {language === 'vi'
                  ? 'Hỗ trợ: PDF, Word, Images, Audio, Video, Excel, PowerPoint'
                  : 'Supports: PDF, Word, Images, Audio, Video, Excel, PowerPoint'
                }
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {language === 'vi' ? 'Tối đa 50MB mỗi file' : 'Max 50MB per file'}
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Uploading Files List */}
      <AnimatePresence>
        {uploadingFiles.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 space-y-2"
          >
            {Array.from(uploadingFiles.values()).map((uploadingFile) => (
              <motion.div
                key={uploadingFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`
                  upload-item p-4 rounded-lg border
                  ${uploadingFile.status === 'error' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(uploadingFile.file.name)}
                  </div>

                  {/* File Info & Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadingFile.file.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    {/* Progress Message */}
                    <p className="text-xs text-gray-600 mb-2">
                      {getStageMessage(uploadingFile.progress)}
                      {uploadingFile.progress.details && (
                        <span className="text-gray-400"> • {uploadingFile.progress.details}</span>
                      )}
                    </p>

                    {/* Progress Bar */}
                    {uploadingFile.status !== 'error' && (
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadingFile.progress.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadingFile.status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{uploadingFile.error}</span>
                      </div>
                    )}

                    {/* Success Info */}
                    {uploadingFile.status === 'completed' && uploadingFile.result && (
                      <div className="mt-2 text-xs text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>{uploadingFile.result.insights.length} insights</span>
                          <span>{uploadingFile.result.assignedAgents.length} agents assigned</span>
                          <span>{(uploadingFile.result.confidence * 100).toFixed(0)}% confidence</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {uploadingFile.status === 'uploading' || uploadingFile.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : uploadingFile.status === 'completed' ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supported Formats */}
      <details className="mt-4">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          {language === 'vi' ? 'Xem tất cả định dạng hỗ trợ' : 'View all supported formats'}
        </summary>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
          <div>
            <strong>{language === 'vi' ? 'Tài liệu:' : 'Documents:'}</strong>
            <div>PDF, DOCX, DOC, TXT, RTF</div>
          </div>
          <div>
            <strong>{language === 'vi' ? 'Hình ảnh:' : 'Images:'}</strong>
            <div>JPG, PNG, GIF, BMP, WEBP</div>
          </div>
          <div>
            <strong>{language === 'vi' ? 'Âm thanh:' : 'Audio:'}</strong>
            <div>MP3, WAV, M4A, OGG</div>
          </div>
          <div>
            <strong>{language === 'vi' ? 'Video:' : 'Video:'}</strong>
            <div>MP4, AVI, MOV, WMV</div>
          </div>
          <div>
            <strong>{language === 'vi' ? 'Bảng tính:' : 'Spreadsheets:'}</strong>
            <div>XLSX, XLS, CSV</div>
          </div>
          <div>
            <strong>{language === 'vi' ? 'Trình bày:' : 'Presentations:'}</strong>
            <div>PPTX, PPT</div>
          </div>
        </div>
      </details>
    </div>
  )
}