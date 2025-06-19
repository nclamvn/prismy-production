'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
import { batchProcessor, BatchJob, BatchProcessingOptions } from '@/lib/batch-processor'

interface BatchUploadProps {
  language?: 'vi' | 'en'
  maxFiles?: number
  maxSizeMB?: number
  onBatchComplete?: (job: BatchJob) => void
  onBatchError?: (error: Error) => void
}

interface FileItem {
  file: File
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  result?: any
}

export default function BatchUpload({
  language = 'en',
  maxFiles = 20,
  maxSizeMB = 10,
  onBatchComplete,
  onBatchError
}: BatchUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const content = {
    vi: {
      title: 'Xử lý hàng loạt tài liệu',
      subtitle: 'Tải lên và xử lý nhiều tài liệu cùng một lúc',
      selectFiles: 'Chọn tệp',
      dragDrop: 'Kéo và thả tệp vào đây',
      maxFiles: `Tối đa ${maxFiles} tệp`,
      maxSize: `Kích thước tối đa: ${maxSizeMB}MB mỗi tệp`,
      processing: 'Đang xử lý...',
      completed: 'Hoàn thành',
      failed: 'Thất bại',
      cancel: 'Hủy',
      retry: 'Thử lại',
      clear: 'Xóa tất cả',
      startBatch: 'Bắt đầu xử lý',
      progress: 'Tiến độ',
      fileCount: 'tệp',
      removeFile: 'Xóa tệp',
      errors: {
        tooManyFiles: `Chỉ có thể tải lên tối đa ${maxFiles} tệp`,
        fileTooBig: `Tệp quá lớn. Kích thước tối đa là ${maxSizeMB}MB`,
        processingFailed: 'Xử lý thất bại',
        noFiles: 'Vui lòng chọn ít nhất một tệp'
      }
    },
    en: {
      title: 'Batch Document Processing',
      subtitle: 'Upload and process multiple documents at once',
      selectFiles: 'Select Files',
      dragDrop: 'Drag and drop files here',
      maxFiles: `Maximum ${maxFiles} files`,
      maxSize: `Maximum size: ${maxSizeMB}MB per file`,
      processing: 'Processing...',
      completed: 'Completed',
      failed: 'Failed',
      cancel: 'Cancel',
      retry: 'Retry',
      clear: 'Clear All',
      startBatch: 'Start Processing',
      progress: 'Progress',
      fileCount: 'files',
      removeFile: 'Remove file',
      errors: {
        tooManyFiles: `Maximum ${maxFiles} files allowed`,
        fileTooBig: `File too large. Maximum size is ${maxSizeMB}MB`,
        processingFailed: 'Processing failed',
        noFiles: 'Please select at least one file'
      }
    }
  }

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles = Array.from(selectedFiles)
    
    // Validate file count
    if (files.length + newFiles.length > maxFiles) {
      alert(content[language].errors.tooManyFiles)
      return
    }

    // Validate file sizes and create file items
    const fileItems: FileItem[] = []
    for (const file of newFiles) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`${file.name}: ${content[language].errors.fileTooBig}`)
        continue
      }

      fileItems.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        progress: 0
      })
    }

    setFiles(prev => [...prev, ...fileItems])
  }, [files.length, maxFiles, maxSizeMB, language, content])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const handleClearAll = useCallback(() => {
    if (isProcessing) return
    setFiles([])
    setBatchProgress(0)
    setCurrentJob(null)
  }, [isProcessing])

  const handleStartBatch = useCallback(async () => {
    if (files.length === 0) {
      alert(content[language].errors.noFiles)
      return
    }

    setIsProcessing(true)
    setBatchProgress(0)

    try {
      const fileList = files.map(f => f.file)
      
      const options: BatchProcessingOptions = {
        maxConcurrency: 3,
        retryAttempts: 2,
        onProgress: (job) => {
          setBatchProgress(job.progress.percentage)
          setCurrentJob(job)
        },
        onFileComplete: (file, result) => {
          setFiles(prev => prev.map(f => {
            if (f.file === file) {
              return {
                ...f,
                status: result instanceof Error ? 'error' : 'completed',
                progress: 100,
                error: result instanceof Error ? result.message : undefined,
                result: result instanceof Error ? undefined : result
              }
            }
            return f
          }))
        },
        onBatchComplete: (job) => {
          setIsProcessing(false)
          setCurrentJob(job)
          onBatchComplete?.(job)
        },
        onError: (error) => {
          setIsProcessing(false)
          onBatchError?.(error)
        }
      }

      const job = await batchProcessor.createBatchJob(fileList, options)
      setCurrentJob(job)

    } catch (error) {
      setIsProcessing(false)
      onBatchError?.(error as Error)
    }
  }, [files, language, content, onBatchComplete, onBatchError])

  const handleCancelBatch = useCallback(async () => {
    if (currentJob) {
      await batchProcessor.cancelBatchJob(currentJob.id)
      setIsProcessing(false)
      setBatchProgress(0)
    }
  }, [currentJob])

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
        )
      case 'processing':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )
      case 'completed':
        return (
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )
    }
  }

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      variants={motionSafe(slideUp)}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="heading-3 text-gray-900 mb-2">{content[language].title}</h2>
        <p className="body-base text-gray-600">{content[language].subtitle}</p>
      </div>

      {/* File Drop Zone */}
      <motion.div
        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-6 hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
        variants={motionSafe(fadeIn)}
        whileHover={{ scale: 1.01 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".pdf,.docx,.doc,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          
          <div>
            <p className="heading-4 text-gray-900 mb-2">{content[language].dragDrop}</p>
            <p className="body-sm text-gray-500 mb-4">
              {content[language].maxFiles} • {content[language].maxSize}
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            disabled={isProcessing}
          >
            {content[language].selectFiles}
          </button>
        </div>
      </motion.div>

      {/* Batch Progress */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900">{content[language].progress}</span>
              <span className="text-blue-700">{batchProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${batchProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {files.length} {content[language].fileCount}
              </span>
              <div className="space-x-2">
                {!isProcessing && (
                  <>
                    <button
                      onClick={handleStartBatch}
                      className="btn-primary text-sm"
                      disabled={files.length === 0}
                    >
                      {content[language].startBatch}
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="btn-secondary text-sm"
                    >
                      {content[language].clear}
                    </button>
                  </>
                )}
                {isProcessing && (
                  <button
                    onClick={handleCancelBatch}
                    className="btn-secondary text-sm"
                  >
                    {content[language].cancel}
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {files.map((fileItem, index) => (
                <motion.div
                  key={fileItem.id}
                  className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(fileItem.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {fileItem.error && (
                        <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                      )}
                    </div>
                  </div>
                  
                  {!isProcessing && (
                    <button
                      onClick={() => handleRemoveFile(fileItem.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title={content[language].removeFile}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}