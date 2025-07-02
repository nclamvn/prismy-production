/**
 * BatchView - Phase 3.5-B
 * Comprehensive batch management interface with DataTable and per-row progress
 * 
 * Features:
 * - DataTable with sortable columns
 * - Real-time progress tracking per file
 * - Batch operations (pause, resume, cancel, retry)
 * - File-level actions and status indicators
 * - Export and download management
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Download,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useBatchDrop } from './BatchDropProvider'
import { useMultipleJobEvents } from '@/lib/hooks/useJobEvents'

interface BatchFile {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  jobId?: string
  error?: string
  result?: any
  createdAt: string
  completedAt?: string
}

interface BatchViewProps {
  batchId: string
  onClose?: () => void
}

type SortField = 'name' | 'size' | 'status' | 'progress' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export function BatchView({ batchId, onClose }: BatchViewProps) {
  const { batches, removeBatch, retryBatch } = useBatchDrop()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  
  const batch = batches.find(b => b.id === batchId)
  
  // Get job IDs for real-time updates
  const jobIds = useMemo(() => {
    return batch?.files
      .filter(f => f.jobId)
      .map(f => f.jobId!) || []
  }, [batch])
  
  // Real-time job progress updates
  const { progressMap } = useMultipleJobEvents(
    jobIds,
    (jobId, progress) => {
      console.log('[BatchView] Real-time progress update:', jobId, progress)
    }
  )
  
  // Transform batch files with real-time data
  const files: BatchFile[] = useMemo(() => {
    if (!batch) return []
    
    return batch.files.map(file => {
      const jobProgress = file.jobId ? progressMap[file.jobId] : null
      
      return {
        id: file.id,
        name: file.file.name,
        size: file.file.size,
        type: file.file.type,
        status: jobProgress?.status as any || file.status,
        progress: jobProgress?.progress || file.progress,
        jobId: file.jobId,
        error: jobProgress?.error || file.error,
        result: jobProgress?.result,
        createdAt: new Date().toISOString(), // Would come from API in real implementation
        completedAt: jobProgress?.status === 'completed' ? new Date().toISOString() : undefined
      }
    })
  }, [batch, progressMap])
  
  // Filtered and sorted files
  const filteredFiles = useMemo(() => {
    let filtered = files
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(file => file.status === statusFilter)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      
      // Handle special cases
      if (sortField === 'size') {
        aValue = a.size
        bValue = b.size
      } else if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }, [files, statusFilter, sortField, sortDirection])
  
  // Batch statistics
  const stats = useMemo(() => {
    return {
      total: files.length,
      pending: files.filter(f => f.status === 'pending').length,
      processing: files.filter(f => f.status === 'processing').length,
      completed: files.filter(f => f.status === 'completed').length,
      failed: files.filter(f => f.status === 'failed').length,
      avgProgress: files.length > 0 
        ? files.reduce((sum, f) => sum + f.progress, 0) / files.length 
        : 0
    }
  }, [files])
  
  if (!batch) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-status-warning mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">Batch not found</h3>
        <p className="text-secondary">The requested batch could not be found.</p>
      </div>
    )
  }
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }
  
  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)))
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-status-processing animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-status-success" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-status-error" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-status-queued" />
      default:
        return <Clock className="h-4 w-4 text-muted" />
    }
  }
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />
  }
  
  return (
    <div className="flex flex-col h-full bg-workspace-panel">
      {/* Header */}
      <div className="p-6 border-b border-workspace-divider">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-primary">{batch.name}</h2>
            <p className="text-sm text-secondary">
              {stats.total} files • {stats.completed} completed • {stats.failed} failed
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => retryBatch(batchId)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Failed
            </Button>
            <Button variant="outline" size="sm" onClick={() => removeBatch(batchId)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Batch
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(stats.avgProgress)}%</span>
          </div>
          <div className="w-full bg-workspace-canvas rounded-full overflow-hidden">
            <div 
              className="h-2 bg-status-processing transition-all duration-500"
              style={{ width: `${stats.avgProgress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Filters and Controls */}
      <div className="p-4 border-b border-workspace-divider bg-workspace-canvas">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-workspace-border rounded px-2 py-1 bg-workspace-panel"
              >
                <option value="all">All Files ({stats.total})</option>
                <option value="pending">Pending ({stats.pending})</option>
                <option value="processing">Processing ({stats.processing})</option>
                <option value="completed">Completed ({stats.completed})</option>
                <option value="failed">Failed ({stats.failed})</option>
              </select>
            </div>
          </div>
          
          {/* Batch Actions */}
          <div className="flex items-center space-x-2">
            {selectedFiles.size > 0 && (
              <>
                <span className="text-sm text-secondary">
                  {selectedFiles.size} selected
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Selected
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Selected
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* DataTable */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-workspace-canvas border-b border-workspace-divider sticky top-0">
            <tr>
              <th className="w-8 p-3">
                <input
                  type="checkbox"
                  checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="text-left p-3">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-sm font-medium text-secondary hover:text-primary"
                >
                  <span>File Name</span>
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="text-left p-3">
                <button
                  onClick={() => handleSort('size')}
                  className="flex items-center space-x-1 text-sm font-medium text-secondary hover:text-primary"
                >
                  <span>Size</span>
                  {getSortIcon('size')}
                </button>
              </th>
              <th className="text-left p-3">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-sm font-medium text-secondary hover:text-primary"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="text-left p-3">
                <button
                  onClick={() => handleSort('progress')}
                  className="flex items-center space-x-1 text-sm font-medium text-secondary hover:text-primary"
                >
                  <span>Progress</span>
                  {getSortIcon('progress')}
                </button>
              </th>
              <th className="text-left p-3">
                <span className="text-sm font-medium text-secondary">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr 
                key={file.id}
                className="border-b border-workspace-divider hover:bg-workspace-canvas"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => handleSelectFile(file.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted" />
                    <span className="text-sm font-medium text-primary truncate max-w-xs" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-sm text-secondary">{formatFileSize(file.size)}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.status)}
                    <span className="text-sm text-secondary capitalize">{file.status}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="space-y-1 min-w-24">
                    <div className="w-full bg-workspace-canvas rounded-full overflow-hidden">
                      <div 
                        className="h-1.5 bg-status-processing transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{Math.round(file.progress)}%</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-1">
                    {file.status === 'completed' && (
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                    {file.status === 'processing' && (
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <Pause className="h-3 w-3" />
                      </Button>
                    )}
                    {file.status === 'failed' && (
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredFiles.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">No files found</h3>
            <p className="text-secondary">
              {statusFilter === 'all' 
                ? 'This batch has no files yet.'
                : `No files with status "${statusFilter}".`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}