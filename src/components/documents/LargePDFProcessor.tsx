'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { streamingPDFProcessor, PDFProcessingProgress, PDFProcessingResult, PDFProcessingOptions } from '@/src/lib/streaming-pdf-processor'
import { backgroundQueue, ProcessingJob } from '@/src/lib/background-processing-queue'
import { useAnalytics } from '@/src/lib/analytics'

interface LargePDFProcessorProps {
  onProcessingComplete?: (result: PDFProcessingResult) => void
  onError?: (error: string) => void
  className?: string
}

export default function LargePDFProcessor({
  onProcessingComplete,
  onError,
  className = ''
}: LargePDFProcessorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<PDFProcessingProgress | null>(null)
  const [result, setResult] = useState<PDFProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<ProcessingJob | null>(null)
  const [estimate, setEstimate] = useState<{
    estimatedMinutes: number
    estimatedPages: number
    recommendations: string[]
  } | null>(null)
  const [options, setOptions] = useState<PDFProcessingOptions>({
    batchSize: 5,
    maxConcurrentBatches: 2,
    ocrLanguage: 'vie+eng',
    extractImages: false,
    qualityMode: 'balanced',
    enableOCR: true,
    skipEmptyPages: true
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { trackDocument, trackFeatureUsage } = useAnalytics()

  // Subscribe to job updates
  useEffect(() => {
    if (!jobId) return

    const handleJobUpdate = (updatedJob: ProcessingJob) => {
      if (updatedJob.id === jobId) {
        setJob(updatedJob)
        
        // Update progress from job progress
        if (updatedJob.progress !== undefined) {
          setProgress({
            currentPage: Math.round((updatedJob.progress / 100) * (updatedJob.metadata.totalPages || 0)),
            totalPages: updatedJob.metadata.totalPages || 0,
            percentage: updatedJob.progress,
            estimatedTimeRemaining: Math.max(0, (updatedJob.estimatedDuration || 0) - (Date.now() - updatedJob.startedAt!.getTime())),
            processingSpeed: 0,
            status: updatedJob.status === 'processing' ? 'processing' : 
                   updatedJob.status === 'completed' ? 'completed' : 
                   updatedJob.status === 'failed' ? 'error' : 'initializing',
            message: updatedJob.status === 'processing' ? 'Processing in background...' : 
                    updatedJob.status === 'completed' ? 'Processing completed!' :
                    updatedJob.status === 'failed' ? updatedJob.error : 'Initializing...'
          })
        }

        // Handle completion
        if (updatedJob.status === 'completed' && updatedJob.result) {
          setResult(updatedJob.result)
          setProcessing(false)
          
          if (onProcessingComplete) {
            onProcessingComplete(updatedJob.result)
          }
        }

        // Handle failure
        if (updatedJob.status === 'failed') {
          setError(updatedJob.error || 'Processing failed')
          setProcessing(false)
          
          if (onError && updatedJob.error) {
            onError(updatedJob.error)
          }
        }
      }
    }

    backgroundQueue.onJobUpdate('started', handleJobUpdate)
    backgroundQueue.onJobUpdate('progress', handleJobUpdate)
    backgroundQueue.onJobUpdate('completed', handleJobUpdate)
    backgroundQueue.onJobUpdate('failed', handleJobUpdate)

    // Subscribe to progress updates for this specific job
    backgroundQueue.onProgress(jobId, (id, progressValue, message) => {
      if (id === jobId) {
        const currentJob = backgroundQueue.getJob(jobId)
        if (currentJob) {
          setProgress(prev => prev ? {
            ...prev,
            percentage: progressValue,
            message: message || prev.message
          } : null)
        }
      }
    })

    return () => {
      // Cleanup is handled by the queue itself
    }
  }, [jobId, onProcessingComplete, onError])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    // Large file size check (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB')
      return
    }

    setSelectedFile(file)
    setError(null)
    setResult(null)

    // Get processing estimate
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const estimateResult = await streamingPDFProcessor.estimateProcessingTime(buffer, options)
      setEstimate(estimateResult)
      
      trackFeatureUsage('large_pdf_selected', {
        fileSize: file.size,
        estimatedPages: estimateResult.estimatedPages,
        estimatedMinutes: estimateResult.estimatedMinutes
      })
    } catch (err) {
      console.error('Failed to estimate processing time:', err)
    }
  }, [options, trackFeatureUsage])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setError(null)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const startProcessing = async () => {
    if (!selectedFile) return

    setProcessing(true)
    setError(null)
    setProgress(null)
    setJob(null)

    try {
      const buffer = Buffer.from(await selectedFile.arrayBuffer())
      
      // Estimate processing time for job metadata
      const estimate = await streamingPDFProcessor.estimateProcessingTime(buffer, options)
      
      // Create background job for PDF processing
      const newJobId = backgroundQueue.addJob({
        type: 'pdf_processing',
        priority: 'high',
        data: {
          buffer,
          filename: selectedFile.name,
          options
        },
        estimatedDuration: estimate.estimatedMinutes * 60 * 1000, // Convert to milliseconds
        maxRetries: 2,
        metadata: {
          filename: selectedFile.name,
          fileSize: selectedFile.size,
          totalPages: estimate.estimatedPages,
          processingOptions: options
        }
      })

      setJobId(newJobId)
      
      // Initial progress state
      setProgress({
        currentPage: 0,
        totalPages: estimate.estimatedPages,
        percentage: 0,
        estimatedTimeRemaining: estimate.estimatedMinutes * 60,
        processingSpeed: 0,
        status: 'initializing',
        message: 'Job queued for background processing...'
      })

      trackFeatureUsage('background_pdf_processing_started', {
        fileSize: selectedFile.size,
        estimatedPages: estimate.estimatedPages,
        estimatedMinutes: estimate.estimatedMinutes,
        jobId: newJobId
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start processing'
      setError(errorMessage)
      setProcessing(false)
      
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const cancelProcessing = () => {
    if (jobId) {
      backgroundQueue.cancelJob(jobId)
      setProcessing(false)
      setProgress(null)
      setJobId(null)
      setJob(null)
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Upload Large PDF Document
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Supports PDF files up to 100MB • Optimized for 500+ pages
            </p>
          </div>
        </div>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📄</div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null)
                setEstimate(null)
                setError(null)
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Processing Options */}
      {selectedFile && !processing && !result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Mode
              </label>
              <select
                value={options.qualityMode}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  qualityMode: e.target.value as 'fast' | 'balanced' | 'high' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fast">Fast (Lower quality, faster processing)</option>
                <option value="balanced">Balanced (Good quality, reasonable speed)</option>
                <option value="high">High (Best quality, slower processing)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size
              </label>
              <select
                value={options.batchSize}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  batchSize: parseInt(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={3}>3 pages (Slower, less memory)</option>
                <option value={5}>5 pages (Balanced)</option>
                <option value={10}>10 pages (Faster, more memory)</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableOCR"
                checked={options.enableOCR}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  enableOCR: e.target.checked 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableOCR" className="ml-2 text-sm text-gray-700">
                Enable OCR for scanned pages
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="extractImages"
                checked={options.extractImages}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  extractImages: e.target.checked 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="extractImages" className="ml-2 text-sm text-gray-700">
                Extract images from pages
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Processing Estimate */}
      {estimate && !processing && !result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h4 className="text-sm font-medium text-blue-900 mb-2">Processing Estimate</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800 mb-3">
            <div>
              <span className="font-medium">Pages:</span> {estimate.estimatedPages}
            </div>
            <div>
              <span className="font-medium">Estimated time:</span> {estimate.estimatedMinutes} minutes
            </div>
          </div>
          
          {estimate.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-blue-900 mb-1">Recommendations:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {estimate.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={startProcessing}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Processing
          </button>
        </motion.div>
      )}

      {/* Processing Progress */}
      <AnimatePresence>
        {processing && progress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`border rounded-lg p-6 ${getStatusColor(progress.status)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {job?.status === 'pending' ? 'Queued for Processing' : 'Processing PDF'}
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">
                  {progress.percentage}%
                </span>
                {job && (job.status === 'pending' || job.status === 'processing') && (
                  <button
                    onClick={cancelProcessing}
                    className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <motion.div
                className="bg-blue-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-600">Page:</span>
                <span className="ml-1 font-medium">{progress.currentPage}/{progress.totalPages}</span>
              </div>
              <div>
                <span className="text-gray-600">Speed:</span>
                <span className="ml-1 font-medium">{Math.round(progress.processingSpeed)} pages/min</span>
              </div>
              <div>
                <span className="text-gray-600">Time left:</span>
                <span className="ml-1 font-medium">{formatTime(progress.estimatedTimeRemaining)}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-1 font-medium capitalize">{progress.status}</span>
              </div>
            </div>

            {progress.message && (
              <p className="text-sm text-gray-700 mt-2">{progress.message}</p>
            )}

            {/* Job Information */}
            {job && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Job ID: {job.id}</span>
                  <span>
                    {job.status === 'pending' && 'Waiting in queue...'}
                    {job.status === 'processing' && `Started ${new Date(job.startedAt!).toLocaleTimeString()}`}
                    {job.retryCount > 0 && ` (Retry ${job.retryCount})`}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            ✅ Processing Complete!
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <span className="text-green-700">Pages processed:</span>
              <span className="ml-1 font-medium text-green-900">{result.pages.length}</span>
            </div>
            <div>
              <span className="text-green-700">Words extracted:</span>
              <span className="ml-1 font-medium text-green-900">{result.wordCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-green-700">OCR pages:</span>
              <span className="ml-1 font-medium text-green-900">{result.ocrPagesCount}</span>
            </div>
            <div>
              <span className="text-green-700">Processing time:</span>
              <span className="ml-1 font-medium text-green-900">{formatTime(Math.round(result.totalProcessingTime / 1000))}</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                const blob = new Blob([result.fullText], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${result.metadata.filename}-extracted-text.txt`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Download Text
            </button>
            
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${result.metadata.filename}-processing-report.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              Download Report
            </button>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex">
            <div className="text-red-500 mr-3">❌</div>
            <div>
              <h3 className="text-sm font-medium text-red-900">Processing Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}