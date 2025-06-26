'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionSafe } from '@/lib/motion'

interface DocumentUploadProps {
  language?: 'vi' | 'en'
  onFileSelect: (file: File) => void
  maxSizeMB?: number
  isProcessing?: boolean
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

export default function DocumentUpload({ 
  language = 'en', 
  onFileSelect,
  maxSizeMB = 10,
  isProcessing = false
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const content = {
    vi: {
      title: 'Tải lên tài liệu',
      subtitle: 'Kéo và thả tài liệu vào đây hoặc nhấp để chọn',
      supportedFormats: 'Hỗ trợ: PDF, DOCX, DOC, TXT, CSV, XLS, XLSX, JPG, PNG, GIF, BMP, TIFF, WEBP',
      maxSize: `Kích thước tối đa: ${maxSizeMB}MB`,
      uploadButton: 'Chọn tài liệu',
      processing: 'Đang xử lý...',
      dragActive: 'Thả tài liệu vào đây',
      errors: {
        fileType: 'Loại tệp không được hỗ trợ',
        fileSize: `Tệp quá lớn. Kích thước tối đa là ${maxSizeMB}MB`,
        generic: 'Đã xảy ra lỗi khi tải lên tệp'
      },
      fileInfo: {
        name: 'Tên tệp',
        size: 'Kích thước',
        type: 'Loại'
      }
    },
    en: {
      title: 'Upload Document',
      subtitle: 'Drag and drop your document here or click to select',
      supportedFormats: 'Supported: PDF, DOCX, DOC, TXT, CSV, XLS, XLSX, JPG, PNG, GIF, BMP, TIFF, WEBP',
      maxSize: `Maximum size: ${maxSizeMB}MB`,
      uploadButton: 'Select Document',
      processing: 'Processing...',
      dragActive: 'Drop your document here',
      errors: {
        fileType: 'File type not supported',
        fileSize: `File too large. Maximum size is ${maxSizeMB}MB`,
        generic: 'An error occurred while uploading the file'
      },
      fileInfo: {
        name: 'File name',
        size: 'Size',
        type: 'Type'
      }
    }
  }

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)
    if (!isValidType) {
      return content[language].errors.fileType
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return content[language].errors.fileSize
    }

    return null
  }, [language, maxSizeMB, content])

  const handleFile = useCallback((file: File) => {
    setError(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }, [validateFile, onFileSelect])

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <motion.div
        className="relative p-8 text-center transition-all duration-200 cursor-pointer"
        style={{
          border: `2px dashed ${
            isDragging 
              ? 'var(--notebooklm-primary)' 
              : 'var(--surface-outline)'
          }`,
          borderRadius: 'var(--mat-card-elevated-container-shape)',
          backgroundColor: isDragging 
            ? 'var(--notebooklm-primary-light)' 
            : 'var(--surface-elevated)',
          opacity: isProcessing ? 0.5 : 1,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          boxShadow: isDragging ? 'var(--elevation-level-2)' : 'var(--elevation-level-1)'
        }}
        onMouseEnter={(e) => {
          if (!isDragging && !isProcessing) {
            e.currentTarget.style.borderColor = 'var(--notebooklm-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging && !isProcessing) {
            e.currentTarget.style.borderColor = 'var(--surface-outline)'
          }
        }}
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
        transition={{ duration: 0.3 }}
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
          {/* Upload Icon */}
          <div className="flex justify-center">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                color: isDragging ? 'var(--notebooklm-primary)' : 'var(--text-secondary)'
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 
              style={{
                fontSize: 'var(--sys-title-large-size)',
                lineHeight: 'var(--sys-title-large-line-height)',
                fontFamily: 'var(--sys-title-large-font)',
                fontWeight: 'var(--sys-title-large-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {isDragging ? content[language].dragActive : content[language].title}
            </h3>
            <p 
              style={{
                fontSize: 'var(--sys-body-large-size)',
                lineHeight: 'var(--sys-body-large-line-height)',
                fontFamily: 'var(--sys-body-large-font)',
                fontWeight: 'var(--sys-body-large-weight)',
                color: 'var(--text-secondary)'
              }}
            >
              {content[language].subtitle}
            </p>
            <p 
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)'
              }}
            >
              {content[language].supportedFormats}
            </p>
            <p 
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)'
              }}
            >
              {content[language].maxSize}
            </p>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            className="transition-all"
            disabled={isProcessing}
            style={{
              backgroundColor: 'var(--notebooklm-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--mat-button-filled-container-shape)',
              height: 'var(--mat-button-filled-container-height)',
              paddingLeft: 'var(--mat-button-filled-horizontal-padding)',
              paddingRight: 'var(--mat-button-filled-horizontal-padding)',
              fontSize: 'var(--sys-label-large-size)',
              lineHeight: 'var(--sys-label-large-line-height)',
              fontFamily: 'var(--sys-label-large-font)',
              fontWeight: 'var(--sys-label-large-weight)',
              boxShadow: 'var(--elevation-level-1)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = 'var(--notebooklm-primary-dark)'
                e.currentTarget.style.boxShadow = 'var(--elevation-level-2)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = 'var(--notebooklm-primary)'
                e.currentTarget.style.boxShadow = 'var(--elevation-level-1)'
              }
            }}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⟳</span>
                {content[language].processing}
              </span>
            ) : (
              content[language].uploadButton
            )}
          </button>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-4 p-4"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--mat-card-outlined-container-shape)'
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p 
              className="flex items-center"
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'rgb(185, 28, 28)'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected File Info */}
      <AnimatePresence>
        {selectedFile && !error && (
          <motion.div
            className="mt-4 p-4"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--mat-card-outlined-container-shape)'
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-2">
              <p 
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  lineHeight: 'var(--sys-body-medium-line-height)',
                  fontFamily: 'var(--sys-body-medium-font)',
                  fontWeight: 'var(--sys-body-medium-weight)',
                  color: 'rgb(21, 128, 61)'
                }}
              >
                <span 
                  style={{
                    fontWeight: 'var(--sys-label-medium-weight)'
                  }}
                >
                  {content[language].fileInfo.name}:
                </span> {selectedFile.name}
              </p>
              <p 
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  lineHeight: 'var(--sys-body-medium-line-height)',
                  fontFamily: 'var(--sys-body-medium-font)',
                  fontWeight: 'var(--sys-body-medium-weight)',
                  color: 'rgb(21, 128, 61)'
                }}
              >
                <span 
                  style={{
                    fontWeight: 'var(--sys-label-medium-weight)'
                  }}
                >
                  {content[language].fileInfo.size}:
                </span> {formatFileSize(selectedFile.size)}
              </p>
              <p 
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  lineHeight: 'var(--sys-body-medium-line-height)',
                  fontFamily: 'var(--sys-body-medium-font)',
                  fontWeight: 'var(--sys-body-medium-weight)',
                  color: 'rgb(21, 128, 61)'
                }}
              >
                <span 
                  style={{
                    fontWeight: 'var(--sys-label-medium-weight)'
                  }}
                >
                  {content[language].fileInfo.type}:
                </span> {selectedFile.type.split('/').pop()?.toUpperCase()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}