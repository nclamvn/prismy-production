/**
 * BatchDropProvider - Phase 3.5-A
 * Global drag-and-drop provider for batch file processing
 * 
 * Features:
 * - Global drop zone overlay
 * - Multi-file selection and validation
 * - Batch job creation with dependency management
 * - Progress tracking for entire batches
 * - File type validation and size limits
 * 
 * Usage:
 * Wrap your app with <BatchDropProvider> and files can be dropped anywhere
 */

'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BatchFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  jobId?: string
  error?: string
}

interface BatchJob {
  id: string
  name: string
  files: BatchFile[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  targetLanguage?: string
  options?: {
    preserveFormatting: boolean
    outputFormats: string[]
    quality: 'standard' | 'premium'
  }
}

interface BatchDropContextType {
  isDragActive: boolean
  batches: BatchJob[]
  activeBatch: BatchJob | null
  createBatch: (files: File[], options?: Partial<BatchJob['options']>) => Promise<string>
  addFilesToBatch: (batchId: string, files: File[]) => Promise<void>
  removeBatch: (batchId: string) => Promise<void>
  retryBatch: (batchId: string) => Promise<void>
  setActiveBatch: (batchId: string | null) => void
}

const BatchDropContext = createContext<BatchDropContextType | null>(null)

interface BatchDropProviderProps {
  children: React.ReactNode
  maxFileSize?: number // in bytes
  maxFiles?: number
  acceptedTypes?: string[]
}

export function BatchDropProvider({
  children,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 20,
  acceptedTypes = ['.pdf', '.docx', '.txt', '.md']
}: BatchDropProviderProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [batches, setBatches] = useState<BatchJob[]>([])
  const [activeBatch, setActiveBatchState] = useState<BatchJob | null>(null)
  const [showDropOverlay, setShowDropOverlay] = useState(false)
  
  const dragCounter = useRef(0)

  /**
   * Validate dropped files
   */
  const validateFiles = useCallback((files: File[]): { valid: File[], invalid: Array<{file: File, reason: string}> } => {
    const valid: File[] = []
    const invalid: Array<{file: File, reason: string}> = []
    
    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        invalid.push({ file, reason: `File too large (max ${maxFileSize / 1024 / 1024}MB)` })
        continue
      }
      
      // Check file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedTypes.includes(extension)) {
        invalid.push({ file, reason: `Unsupported file type (${extension})` })
        continue
      }
      
      valid.push(file)
    }
    
    // Check total file count
    if (valid.length > maxFiles) {
      const excess = valid.splice(maxFiles)
      excess.forEach(file => {
        invalid.push({ file, reason: `Too many files (max ${maxFiles})` })
      })
    }
    
    return { valid, invalid }
  }, [maxFileSize, maxFiles, acceptedTypes])

  /**
   * Create a new batch job
   */
  const createBatch = useCallback(async (
    files: File[], 
    options?: Partial<BatchJob['options']>
  ): Promise<string> => {
    const { valid, invalid } = validateFiles(files)
    
    if (invalid.length > 0) {
      console.warn('[BATCH] Invalid files detected:', invalid)
    }
    
    if (valid.length === 0) {
      throw new Error('No valid files to process')
    }
    
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    const batchFiles: BatchFile[] = valid.map(file => ({
      file,
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      status: 'pending',
      progress: 0
    }))
    
    const newBatch: BatchJob = {
      id: batchId,
      name: `Batch ${batches.length + 1}`,
      files: batchFiles,
      status: 'pending',
      createdAt: new Date().toISOString(),
      options: {
        preserveFormatting: true,
        outputFormats: ['pdf', 'docx'],
        quality: 'standard',
        ...options
      }
    }
    
    setBatches(prev => [...prev, newBatch])
    setActiveBatchState(newBatch)
    
    // Start processing the batch
    await processBatch(newBatch)
    
    return batchId
  }, [batches.length, validateFiles])

  /**
   * Process batch by creating individual jobs
   */
  const processBatch = useCallback(async (batch: BatchJob): Promise<void> => {
    console.log('[BATCH] Starting batch processing:', batch.id)
    
    // Update batch status
    setBatches(prev => prev.map(b => 
      b.id === batch.id ? { ...b, status: 'processing' } : b
    ))
    
    try {
      // Create individual jobs for each file
      const jobPromises = batch.files.map(async (batchFile) => {
        // Update file status
        setBatches(prev => prev.map(b => 
          b.id === batch.id 
            ? {
                ...b,
                files: b.files.map(f => 
                  f.id === batchFile.id ? { ...f, status: 'uploading' } : f
                )
              }
            : b
        ))
        
        // Create form data for upload
        const formData = new FormData()
        formData.append('file', batchFile.file)
        formData.append('targetLanguage', batch.targetLanguage || 'en')
        formData.append('preserveFormatting', batch.options?.preserveFormatting ? 'true' : 'false')
        formData.append('outputFormats', JSON.stringify(batch.options?.outputFormats || ['pdf']))
        formData.append('quality', batch.options?.quality || 'standard')
        formData.append('batchId', batch.id)
        
        // Upload and queue job
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Update file with job ID
          setBatches(prev => prev.map(b => 
            b.id === batch.id 
              ? {
                  ...b,
                  files: b.files.map(f => 
                    f.id === batchFile.id 
                      ? { ...f, status: 'processing', jobId: data.jobId }
                      : f
                  )
                }
              : b
          ))
          
          return data.jobId
        } else {
          throw new Error(`Upload failed for ${batchFile.file.name}`)
        }
      })
      
      // Wait for all uploads to complete
      const jobIds = await Promise.allSettled(jobPromises)
      
      // Check for any failures
      const failures = jobIds.filter(result => result.status === 'rejected')
      if (failures.length > 0) {
        console.error('[BATCH] Some uploads failed:', failures)
      }
      
      console.log('[BATCH] Batch processing initiated for:', batch.id)
      
    } catch (error) {
      console.error('[BATCH] Batch processing failed:', error)
      
      // Mark batch as failed
      setBatches(prev => prev.map(b => 
        b.id === batch.id ? { ...b, status: 'failed' } : b
      ))
    }
  }, [])

  /**
   * Add files to existing batch
   */
  const addFilesToBatch = useCallback(async (batchId: string, files: File[]): Promise<void> => {
    const { valid } = validateFiles(files)
    
    if (valid.length === 0) {
      throw new Error('No valid files to add')
    }
    
    const newBatchFiles: BatchFile[] = valid.map(file => ({
      file,
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      status: 'pending',
      progress: 0
    }))
    
    setBatches(prev => prev.map(batch => 
      batch.id === batchId 
        ? { ...batch, files: [...batch.files, ...newBatchFiles] }
        : batch
    ))
  }, [validateFiles])

  /**
   * Remove batch
   */
  const removeBatch = useCallback(async (batchId: string): Promise<void> => {
    setBatches(prev => prev.filter(batch => batch.id !== batchId))
    
    if (activeBatch?.id === batchId) {
      setActiveBatchState(null)
    }
  }, [activeBatch])

  /**
   * Retry failed batch
   */
  const retryBatch = useCallback(async (batchId: string): Promise<void> => {
    const batch = batches.find(b => b.id === batchId)
    if (batch) {
      // Reset failed files to pending
      const updatedBatch = {
        ...batch,
        status: 'pending' as const,
        files: batch.files.map(f => 
          f.status === 'failed' 
            ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
            : f
        )
      }
      
      setBatches(prev => prev.map(b => b.id === batchId ? updatedBatch : b))
      await processBatch(updatedBatch)
    }
  }, [batches, processBatch])

  /**
   * Set active batch
   */
  const setActiveBatch = useCallback((batchId: string | null) => {
    const batch = batchId ? batches.find(b => b.id === batchId) : null
    setActiveBatchState(batch || null)
  }, [batches])

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current++
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
      setShowDropOverlay(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current--
    
    if (dragCounter.current === 0) {
      setIsDragActive(false)
      setShowDropOverlay(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragActive(false)
    setShowDropOverlay(false)
    dragCounter.current = 0
    
    const files = Array.from(e.dataTransfer.files)
    
    if (files.length > 0) {
      try {
        await createBatch(files)
      } catch (error) {
        console.error('[BATCH] Failed to create batch:', error)
      }
    }
  }, [createBatch])

  const contextValue: BatchDropContextType = {
    isDragActive,
    batches,
    activeBatch,
    createBatch,
    addFilesToBatch,
    removeBatch,
    retryBatch,
    setActiveBatch
  }

  return (
    <BatchDropContext.Provider value={contextValue}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative min-h-screen"
      >
        {children}
        
        {/* Global Drop Overlay */}
        {showDropOverlay && (
          <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-workspace-panel border-2 border-dashed border-primary rounded-lg p-8 mx-4 max-w-md text-center">
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary mb-2">
                Drop files to create batch
              </h3>
              <p className="text-sm text-secondary mb-4">
                Support for {acceptedTypes.join(', ')} files
              </p>
              <p className="text-xs text-muted">
                Max {maxFiles} files, {maxFileSize / 1024 / 1024}MB each
              </p>
            </div>
          </div>
        )}
      </div>
    </BatchDropContext.Provider>
  )
}

/**
 * Hook to use batch drop context
 */
export function useBatchDrop(): BatchDropContextType {
  const context = useContext(BatchDropContext)
  if (!context) {
    throw new Error('useBatchDrop must be used within a BatchDropProvider')
  }
  return context
}

/**
 * Mini batch indicator component
 */
export function BatchIndicator() {
  const { batches, setActiveBatch } = useBatchDrop()
  
  const activeBatches = batches.filter(b => b.status === 'processing')
  
  if (activeBatches.length === 0) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Button
        onClick={() => setActiveBatch(activeBatches[0]?.id)}
        className="bg-workspace-panel border border-workspace-border shadow-lg"
        variant="outline"
      >
        <FileText className="h-4 w-4 mr-2" />
        {activeBatches.length} active batch{activeBatches.length !== 1 ? 'es' : ''}
      </Button>
    </div>
  )
}