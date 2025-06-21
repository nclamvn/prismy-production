'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { enhancedDocumentProcessor, ProcessedDocument } from '@/lib/enhanced-document-processor'
import EnhancedDocumentPreview from './EnhancedDocumentPreview'

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  result?: ProcessedDocument
  error?: string
}

interface AdvancedDocumentUploadProps {
  onDocumentProcessed?: (document: ProcessedDocument) => void
  onBatchCompleted?: (documents: ProcessedDocument[]) => void
  maxFiles?: number
  maxFileSize?: number
  className?: string
  showPreview?: boolean
}

export default function AdvancedDocumentUpload({
  onDocumentProcessed,
  onBatchCompleted,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  className = '',
  showPreview = true
}: AdvancedDocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = enhancedDocumentProcessor.getSupportedFormats()

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newFiles: UploadFile[] = []

    for (const file of fileArray) {
      // Check if we've reached max files
      if (uploadFiles.length + newFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`)
        break
      }

      // Validate file
      const validation = enhancedDocumentProcessor.validateFile(file, maxFileSize)
      if (!validation.valid) {
        alert(`File "${file.name}": ${validation.error}`)
        continue
      }

      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'pending',
        progress: 0
      })
    }

    setUploadFiles(prev => [...prev, ...newFiles])
  }, [uploadFiles.length, maxFiles, maxFileSize])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Process individual file
  const processFile = async (uploadFile: UploadFile) => {
    setUploadFiles(prev =>
      prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'processing', progress: 0 }
          : f
      )
    )

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        )
      }, 500)

      const result = await enhancedDocumentProcessor.processDocument(
        uploadFile.file,
        uploadFile.file.name,
        {
          quality: 'balanced',
          extractImages: true,
          preserveFormatting: true
        }
      )

      clearInterval(progressInterval)

      setUploadFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'completed', progress: 100, result }
            : f
        )
      )

      if (onDocumentProcessed) {
        onDocumentProcessed(result)
      }

      return result

    } catch (error) {
      setUploadFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: (error as Error).message }
            : f
        )
      )
      throw error
    }
  }

  // Process all pending files
  const processAllFiles = async () => {
    setIsProcessing(true)
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
    const results: ProcessedDocument[] = []

    try {
      for (const file of pendingFiles) {
        try {
          const result = await processFile(file)
          results.push(result)
        } catch (error) {
          console.error(`Failed to process ${file.file.name}:`, error)
        }
      }

      if (onBatchCompleted && results.length > 0) {
        onBatchCompleted(results)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Remove file from list
  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id))
  }

  // Clear all files
  const clearAll = () => {
    setUploadFiles([])
    setSelectedDocument(null)
  }

  // Retry failed file
  const retryFile = (uploadFile: UploadFile) => {
    processFile(uploadFile)
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'processing': return '⚡'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '📄'
    }
  }

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500'
      case 'processing': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging
            ? 'border-black bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedFormats.map(f => `.${f}`).join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Drop files here or click to upload
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Supports: {supportedFormats.slice(0, 6).join(', ')}
              {supportedFormats.length > 6 && ` and ${supportedFormats.length - 6} more`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max {maxFiles} files, {formatFileSize(maxFileSize)} each
            </p>
          </div>
        </div>

        {isDragging && (
          <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg flex items-center justify-center">
            <div className="text-xl font-medium">Drop files here</div>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Files ({uploadFiles.length}/{maxFiles})
            </h3>
            <div className="space-x-2">
              {uploadFiles.some(f => f.status === 'pending') && (
                <button
                  onClick={processAllFiles}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Process All'}
                </button>
              )}
              <button
                onClick={clearAll}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {uploadFiles.map((uploadFile) => (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-xl">{getStatusIcon(uploadFile.status)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                          {uploadFile.result && (
                            <span className="ml-2">
                              • {uploadFile.result.chunks.length} chunks
                              • {uploadFile.result.metadata.words || 0} words
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getStatusColor(uploadFile.status)}`}>
                        {uploadFile.status.charAt(0).toUpperCase() + uploadFile.status.slice(1)}
                      </span>

                      {uploadFile.status === 'completed' && showPreview && (
                        <button
                          onClick={() => setSelectedDocument(uploadFile.result!)}
                          className="text-sm text-black hover:text-gray-700 transition-colors"
                        >
                          Preview
                        </button>
                      )}

                      {uploadFile.status === 'error' && (
                        <button
                          onClick={() => retryFile(uploadFile)}
                          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Retry
                        </button>
                      )}

                      {uploadFile.status === 'pending' && (
                        <button
                          onClick={() => processFile(uploadFile)}
                          className="text-sm text-green-600 hover:text-green-700 transition-colors"
                        >
                          Process
                        </button>
                      )}

                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {uploadFile.status === 'processing' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-blue-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadFile.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Processing... {uploadFile.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {uploadFile.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedDocument && showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedDocument(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full"
            >
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Document Preview</h2>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <EnhancedDocumentPreview
                  document={selectedDocument}
                  onTextSelect={(text, chunk) => {
                    console.log('Selected text:', text, chunk)
                  }}
                  showMetadata={true}
                  interactive={true}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}