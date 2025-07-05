'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/design-system/components/button'
import { Badge } from '@/design-system/components/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChunkedUploader } from '@/lib/upload/chunked-uploader'
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'

interface UploadProgress {
  uploadedBytes: number
  totalBytes: number
  percentage: number
  chunksUploaded: number
  totalChunks: number
  currentChunk?: number
}

interface FileUploadState {
  file: File | null
  status: 'idle' | 'uploading' | 'completed' | 'error'
  progress: UploadProgress | null
  error: string | null
  fileId: string | null
}

export function FileUpload() {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    status: 'idle',
    progress: null,
    error: null,
    fileId: null
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const resetUpload = () => {
    setUploadState({
      file: null,
      status: 'idle',
      progress: null,
      error: null,
      fileId: null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = useCallback((file: File) => {
    const validation = ChunkedUploader.validateFile(file)
    
    if (!validation.valid) {
      setUploadState(prev => ({
        ...prev,
        file,
        status: 'error',
        error: validation.error || 'Invalid file'
      }))
      return
    }

    setUploadState(prev => ({
      ...prev,
      file,
      status: 'idle',
      error: null
    }))
  }, [])

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

  const startUpload = async () => {
    if (!uploadState.file) return

    setUploadState(prev => ({ ...prev, status: 'uploading', error: null }))

    const result = await ChunkedUploader.uploadFile(
      uploadState.file,
      (progress) => {
        setUploadState(prev => ({ ...prev, progress }))
      },
      (chunkIndex) => {
        console.log(`Chunk ${chunkIndex} completed`)
      }
    )

    if (result.success) {
      setUploadState(prev => ({
        ...prev,
        status: 'completed',
        fileId: result.fileId || null
      }))
    } else {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: result.error || 'Upload failed'
      }))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('text')) return '📃'
    return '📄'
  }

  return (
    <div className="w-full space-y-6">
        {/* Upload Area */}
        {uploadState.status === 'idle' && !uploadState.file && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              hover:border-primary hover:bg-primary/5 cursor-pointer
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Drop your file here</h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse your computer
            </p>
            <Button variant="outline">
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
        )}

        {/* File Selected */}
        {uploadState.file && uploadState.status !== 'uploading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getFileIcon(uploadState.file.type)}
                </div>
                <div>
                  <p className="font-medium">{uploadState.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadState.file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uploadState.status === 'error' && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </Badge>
                )}
                {uploadState.status === 'completed' && (
                  <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetUpload}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {uploadState.status === 'idle' && (
              <Button onClick={startUpload} className="w-full">
                Start Upload
              </Button>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {uploadState.status === 'uploading' && uploadState.progress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">{uploadState.file?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploading chunk {uploadState.progress.currentChunk ?? 0} of {uploadState.progress.totalChunks}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {uploadState.progress.percentage}%
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {formatFileSize(uploadState.progress.uploadedBytes)} / {formatFileSize(uploadState.progress.totalBytes)}
                </span>
              </div>
              <Progress value={uploadState.progress.percentage} className="w-full" />
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadState.status === 'error' && uploadState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {uploadState.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {uploadState.status === 'completed' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              File uploaded successfully! Your document is ready for translation.
              {uploadState.fileId && (
                <span className="block text-xs text-muted-foreground mt-1">
                  File ID: {uploadState.fileId}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
    </div>
  )
}