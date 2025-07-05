'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, File, X } from 'lucide-react'

interface SimpleFileUploadProps {
  onUploadComplete?: (files: File[]) => void
}

export function SimpleFileUpload({ onUploadComplete }: SimpleFileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (file) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full h-72 rounded-lg border-2 border-solid border-primary/60 bg-primary/5">
        <div className="text-center">
          <File className="h-12 w-12 text-primary mx-auto mb-3" />
          <p className="font-medium text-lg">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            Start Translation
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFile}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        gap-3
        w-full h-72
        rounded-lg border-2 border-dashed
        transition-colors cursor-pointer
        ${isDragOver 
          ? 'border-primary bg-primary/5' 
          : 'border-primary/40 hover:border-primary bg-muted/20'
        }
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="h-12 w-12 text-primary/80" />
      <p className="font-medium text-lg text-foreground">
        Drop your file here
      </p>
      <p className="text-sm text-muted-foreground -mt-1">
        or click to browse (PDF, DOCX, TXT · ≤ 1 GB)
      </p>
      <Button variant="secondary" size="sm" className="mt-2">
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