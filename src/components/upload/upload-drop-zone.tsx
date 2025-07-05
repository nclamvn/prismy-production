'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface UploadDropZoneProps {
  onUploadComplete?: (result: { documentId: string; conversationId: string; filename: string }) => void
  className?: string
}

export function UploadDropZone({ onUploadComplete, className = "" }: UploadDropZoneProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{ documentId: string; conversationId: string; filename: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 1024 * 1024 * 1024 // 1GB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown'
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 1GB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported file type' }
    }

    return { valid: true }
  }

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validation = validateFile(selectedFile)
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setFile(selectedFile)
    setError(null)
    setUploadComplete(false)
    
    if (onUploadComplete) {
      onUploadComplete([selectedFile])
    }
  }, [onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const resetFile = () => {
    setFile(null)
    setError(null)
    setUploadComplete(false)
    setIsUploading(false)
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const startUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fromLang', 'auto')
      formData.append('toLang', 'vi') // Default to Vietnamese
      
      console.log('🚀 Starting upload for file:', file.name)
      
      // Try full upload first, fallback to simple if it fails
      let response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      // If full upload fails, try simple upload
      if (!response.ok) {
        console.log('📡 Full upload failed, trying simple upload...')
        response = await fetch('/api/upload-simple', {
          method: 'POST',
          body: formData,
        })
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Upload result:', result)
      
      if (result.success) {
        setUploadComplete(true)
        const uploadData = {
          documentId: result.documentId,
          conversationId: result.conversationId,
          filename: result.filename
        }
        setUploadResult(uploadData)
        
        if (onUploadComplete) {
          onUploadComplete(uploadData)
        }
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (err) {
      console.error('❌ Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // File selected state
  if (file) {
    return (
      <div className={`
        flex flex-col items-center justify-center gap-4
        h-60 rounded-lg border-2 border-solid border-primary/60
        bg-primary/5 transition-colors
        ${className}
      `}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            {isUploading && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
            {uploadComplete && <CheckCircle className="h-8 w-8 text-green-600" />}
            {error && <AlertCircle className="h-8 w-8 text-red-600" />}
            {!isUploading && !uploadComplete && !error && <File className="h-8 w-8 text-primary" />}
          </div>
          <p className="font-medium text-lg mb-1">{file.name}</p>
          <p className="text-sm text-muted-foreground mb-2">
            {formatFileSize(file.size)}
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-2">{error}</p>
          )}
          {uploadComplete && (
            <p className="text-sm text-green-600 mb-2">Upload completed!</p>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isUploading && !uploadComplete && !error && (
            <Button onClick={startUpload} size="sm">
              Start Upload
            </Button>
          )}
          {uploadComplete && uploadResult && (
            <Button 
              size="sm"
              onClick={() => {
                // Navigate to chat with the conversation
                window.location.href = `/app/chat?conversation=${uploadResult.conversationId}`
              }}
            >
              Start Chat
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFile}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    )
  }

  // Empty state - drop zone
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-4
        h-60 rounded-lg border-2 border-dashed border-input/60
        bg-muted/40 transition hover:bg-muted/60
        cursor-pointer
        ${isDragOver ? 'border-primary bg-primary/5' : ''}
        ${className}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="h-12 w-12 text-primary/80" />
      <div className="text-center">
        <p className="font-medium text-lg mb-1">
          Drop your file here
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          or click to browse your computer
        </p>
      </div>
      <Button variant="secondary" size="sm">
        Select File
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.doc,.txt,.md"
        onChange={handleFileInputChange}
      />
    </div>
  )
}