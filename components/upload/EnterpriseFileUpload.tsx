'use client'

import React, { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle,
  Clock,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { uploadService, UploadProgress, UploadError, UploadResult } from '@/lib/upload-service'

interface EnterpriseFileUploadProps {
  onUploadComplete?: (result: UploadResult) => void
  onUploadProgress?: (progress: UploadProgress) => void
  onUploadError?: (error: UploadError) => void
  maxFileSize?: number // bytes
  allowedTypes?: string[]
  chunkSize?: number // bytes
  className?: string
}

interface FileUploadState {
  file: File | null
  uploadId: string | null
  progress: UploadProgress | null
  isDragOver: boolean
  error: string | null
}

/**
 * EnterpriseFileUpload - Advanced file upload with chunking and resumable support
 */
export function EnterpriseFileUpload({
  onUploadComplete,
  onUploadProgress,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  chunkSize = 1024 * 1024, // 1MB chunks
  className = ''
}: EnterpriseFileUploadProps) {
  const [state, setState] = useState<FileUploadState>({
    file: null,
    uploadId: null,
    progress: null,
    isDragOver: false,
    error: null,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState(prev => ({ ...prev, isDragOver: true }))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState(prev => ({ ...prev, isDragOver: false }))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState(prev => ({ ...prev, isDragOver: false }))
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [])

  // Handle file selection
  const handleFileSelection = useCallback((file: File) => {
    // Validate file size
    if (file.size > maxFileSize) {
      const error = `File too large. Maximum size is ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`
      setState(prev => ({ ...prev, error }))
      return
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      const error = 'Unsupported file type'
      setState(prev => ({ ...prev, error }))
      return
    }

    setState(prev => ({
      ...prev,
      file,
      error: null,
      progress: null,
      uploadId: null,
    }))
  }, [maxFileSize, allowedTypes])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [handleFileSelection])

  // Start upload
  const startUpload = useCallback(async () => {
    if (!state.file) return

    try {
      setState(prev => ({ ...prev, error: null }))

      const uploadId = await uploadService.uploadFile(state.file, {
        chunkSize,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }))
          onUploadProgress?.(progress)
        },
        onError: (error) => {
          setState(prev => ({ ...prev, error: error.message }))
          onUploadError?.(error)
        },
        onComplete: (result) => {
          setState(prev => ({ 
            ...prev, 
            progress: { ...prev.progress!, status: 'completed' }
          }))
          onUploadComplete?.(result)
        },
      })

      setState(prev => ({ ...prev, uploadId }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({ ...prev, error: errorMessage }))
    }
  }, [state.file, chunkSize, onUploadProgress, onUploadError, onUploadComplete])

  // Pause upload
  const pauseUpload = useCallback(() => {
    if (state.uploadId) {
      uploadService.pauseUpload(state.uploadId)
    }
  }, [state.uploadId])

  // Resume upload
  const resumeUpload = useCallback(() => {
    if (state.uploadId) {
      uploadService.resumeUpload(state.uploadId)
    }
  }, [state.uploadId])

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (state.uploadId) {
      uploadService.cancelUpload(state.uploadId)
    }
    setState({
      file: null,
      uploadId: null,
      progress: null,
      isDragOver: false,
      error: null,
    })
  }, [state.uploadId])

  // Retry upload
  const retryUpload = useCallback(() => {
    setState(prev => ({ ...prev, error: null, progress: null, uploadId: null }))
    startUpload()
  }, [startUpload])

  // Clear selection
  const clearSelection = useCallback(() => {
    setState({
      file: null,
      uploadId: null,
      progress: null,
      isDragOver: false,
      error: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatFileSize(bytesPerSecond)}/s`
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const renderUploadZone = () => (
    <div
      className={`upload-dropzone flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer ${
        state.isDragOver ? 'active border-border-focus bg-workspace-dropzone-active' : 'border-workspace-border bg-workspace-dropzone hover:bg-workspace-dropzone-active'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className={`h-12 w-12 mb-4 ${state.isDragOver ? 'text-primary-blue' : 'text-muted'}`} />
      <h3 className="text-lg font-medium text-primary mb-2">
        {state.isDragOver ? 'Drop files here' : 'Upload Documents'}
      </h3>
      <p className="text-muted text-center mb-4">
        Drag and drop files here, or click to browse<br />
        Supports PDF, DOCX, TXT, images, and more
      </p>
      <Button variant="outline">Choose Files</Button>
      <p className="text-xs text-muted mt-2">
        Maximum file size: {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
      </p>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
      />
    </div>
  )

  const renderSelectedFile = () => {
    if (!state.file) return null

    return (
      <div className="workspace-panel p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(state.file.type)}
            <div>
              <h3 className="font-medium text-primary">{state.file.name}</h3>
              <p className="text-sm text-muted">{formatFileSize(state.file.size)}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress section */}
        {state.progress && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">
                {state.progress.status === 'preparing' && 'Preparing upload...'}
                {state.progress.status === 'uploading' && `Uploading ${state.progress.progress}%`}
                {state.progress.status === 'paused' && 'Upload paused'}
                {state.progress.status === 'completed' && 'Upload completed'}
                {state.progress.status === 'error' && 'Upload failed'}
              </span>
              
              <div className="flex items-center space-x-2 text-xs text-muted">
                {state.progress.status === 'uploading' && (
                  <>
                    <span>{formatSpeed(state.progress.speed)}</span>
                    <span>•</span>
                    <span>{formatTime(state.progress.timeRemaining)} left</span>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-workspace-canvas rounded-full overflow-hidden mb-2">
              <div 
                className={`h-2 transition-all duration-300 ${
                  state.progress.status === 'error' ? 'bg-status-error' :
                  state.progress.status === 'completed' ? 'bg-status-success' :
                  'bg-status-processing'
                }`}
                style={{ width: `${state.progress.progress}%` }}
              />
            </div>

            {/* Chunk progress */}
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                Chunk {state.progress.currentChunk} of {state.progress.totalChunks}
              </span>
              <span>
                {formatFileSize(state.progress.uploadedBytes)} / {formatFileSize(state.progress.totalSize)}
              </span>
            </div>
          </div>
        )}

        {/* Error section */}
        {state.error && (
          <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-status-error" />
              <span className="text-sm text-status-error">{state.error}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {!state.progress && !state.error && (
            <Button onClick={startUpload} className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Start Upload</span>
            </Button>
          )}

          {state.progress?.status === 'uploading' && (
            <Button variant="outline" onClick={pauseUpload} className="flex items-center space-x-2">
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </Button>
          )}

          {state.progress?.status === 'paused' && (
            <Button onClick={resumeUpload} className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Resume</span>
            </Button>
          )}

          {state.progress?.status === 'completed' && (
            <div className="flex items-center space-x-2 text-status-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Upload completed</span>
            </div>
          )}

          {state.error && (
            <Button variant="outline" onClick={retryUpload} className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          )}

          {(state.progress?.status === 'uploading' || state.progress?.status === 'paused') && (
            <Button variant="ghost" onClick={cancelUpload} className="text-status-error">
              Cancel
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {!state.file ? renderUploadZone() : renderSelectedFile()}
    </div>
  )
}