import React, { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  maxFiles?: number
  maxSize?: number // in bytes
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

export function FileDropZone({
  onFilesSelected,
  accept = '.pdf,.docx,.txt,.doc',
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false,
  children,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFiles = useCallback(
    (files: FileList) => {
      const fileArray = Array.from(files)

      if (fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`)
        return []
      }

      const validFiles = fileArray.filter(file => {
        if (file.size > maxSize) {
          setError(
            `File ${file.name} is too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`
          )
          return false
        }
        return true
      })

      if (validFiles.length !== fileArray.length) {
        return []
      }

      setError(null)
      return validFiles
    },
    [maxFiles, maxSize]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragOver(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (disabled) return

      const files = validateFiles(e.dataTransfer.files)
      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [disabled, validateFiles, onFilesSelected]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || disabled) return

      const files = validateFiles(e.target.files)
      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [disabled, validateFiles, onFilesSelected]
  )

  return (
    <div className={cn('relative', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragOver && !disabled
            ? 'border-border-focus bg-accent-brand-light'
            : 'border-border-default hover:border-border-focus',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {children || (
          <div className="space-y-4">
            <div className="text-4xl">📄</div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-sm text-muted">
                Supports {accept.replace(/\./g, '').toUpperCase()} files up to{' '}
                {Math.round(maxSize / 1024 / 1024)}MB
              </p>
              {maxFiles > 1 && (
                <p className="text-xs text-muted mt-1">
                  Maximum {maxFiles} files
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  )
}
