'use client'

import React, { useState, useCallback } from 'react'
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music,
  Archive,
  X,
  Plus,
  Grid3x3,
  List,
  Search,
  Filter,
  Languages,
  Bot,
  Settings,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EnterpriseFileUpload } from '@/components/upload/EnterpriseFileUpload'
import { BatchDashboard } from '@/components/batch/BatchDashboard'
import { SearchTrigger } from '@/components/search/SearchTrigger'
import { useSearch } from '@/components/search/SearchProvider'

interface CanvasAreaProps {
  activeSection?: string
  className?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  thumbnail?: string
}

/**
 * CanvasArea - Main content area of the workspace
 * Flexible width (minimum 600px), contains upload zones, file grids, and content views
 */
export function CanvasArea({ 
  activeSection = 'documents',
  className = ''
}: CanvasAreaProps) {
  const { openSearch } = useSearch()
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Annual_Report_2024.pdf',
      size: 2048576,
      type: 'application/pdf',
      status: 'completed',
      progress: 100,
    },
    {
      id: '2', 
      name: 'Contract_Review.docx',
      size: 1024000,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      status: 'processing',
      progress: 45,
    },
    {
      id: '3',
      name: 'Product_Image.jpg',
      size: 512000,
      type: 'image/jpeg',
      status: 'completed',
      progress: 100,
    },
  ])

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [dragActive, setDragActive] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (type.startsWith('video/')) return <Film className="h-8 w-8 text-purple-500" />
    if (type.startsWith('audio/')) return <Music className="h-8 w-8 text-green-500" />
    if (type.includes('zip') || type.includes('archive')) return <Archive className="h-8 w-8 text-orange-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    // Handle file upload logic here
    console.log('Dropped files:', droppedFiles)
  }, [])

  const renderUploadSection = () => (
    <div className="space-y-6">
      {/* Enterprise file upload with chunking support */}
      <EnterpriseFileUpload
        onUploadComplete={(result) => {
          console.log('Upload completed:', result)
          // Add the new file to the files list
          const newFile: UploadedFile = {
            id: result.jobId,
            name: result.fileName,
            size: result.fileSize,
            type: 'application/octet-stream', // Will be updated by job status
            status: 'completed',
            progress: 100,
          }
          setFiles(prev => [newFile, ...prev])
        }}
        onUploadProgress={(progress) => {
          console.log('Upload progress:', progress)
        }}
        onUploadError={(error) => {
          console.error('Upload error:', error)
        }}
        maxFileSize={100 * 1024 * 1024} // 100MB
        chunkSize={1024 * 1024} // 1MB chunks
      />

      {/* Quick upload options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="workspace-panel p-4 cursor-pointer hover:bg-workspace-hover transition-colors">
          <FileText className="h-6 w-6 text-blue-500 mb-2" />
          <h4 className="font-medium text-primary text-sm">Documents</h4>
          <p className="text-xs text-muted">PDF, DOCX, TXT, RTF</p>
        </div>
        
        <div className="workspace-panel p-4 cursor-pointer hover:bg-workspace-hover transition-colors">
          <ImageIcon className="h-6 w-6 text-green-500 mb-2" />
          <h4 className="font-medium text-primary text-sm">Images</h4>
          <p className="text-xs text-muted">JPG, PNG, GIF, SVG</p>
        </div>
        
        <div className="workspace-panel p-4 cursor-pointer hover:bg-workspace-hover transition-colors">
          <Archive className="h-6 w-6 text-orange-500 mb-2" />
          <h4 className="font-medium text-primary text-sm">Archives</h4>
          <p className="text-xs text-muted">ZIP, RAR, 7Z</p>
        </div>
      </div>
    </div>
  )

  const renderDocumentsSection = () => (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-primary">Documents</h2>
          <span className="text-sm text-muted">{files.length} files</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <SearchTrigger
            onOpenSearch={() => openSearch('documents:')}
            variant="button"
            placeholder="Search files..."
            className="w-64"
          />

          {/* Filter */}
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4" />
          </Button>

          {/* View toggle */}
          <div className="flex items-center border border-workspace-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-workspace-selected text-primary-blue' : 'text-muted hover:text-primary'}`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-workspace-selected text-primary-blue' : 'text-muted hover:text-primary'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* File grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file.id} className="workspace-panel p-4 hover:bg-workspace-hover transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                {getFileIcon(file.type)}
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <h3 className="font-medium text-primary text-sm truncate mb-1">{file.name}</h3>
              <p className="text-xs text-muted mb-2">{formatFileSize(file.size)}</p>
              
              {file.status === 'processing' && (
                <div className="w-full bg-workspace-canvas rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-1 bg-status-processing transition-all duration-500"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  file.status === 'completed' ? 'bg-status-success/10 text-status-success' :
                  file.status === 'processing' ? 'bg-status-processing/10 text-status-processing' :
                  file.status === 'error' ? 'bg-status-error/10 text-status-error' :
                  'bg-status-idle/10 text-status-idle'
                }`}>
                  {file.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="workspace-panel p-4 flex items-center space-x-4 hover:bg-workspace-hover transition-colors cursor-pointer">
              {getFileIcon(file.type)}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-primary text-sm truncate">{file.name}</h3>
                <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {file.status === 'processing' && (
                  <div className="w-24 bg-workspace-canvas rounded-full overflow-hidden">
                    <div 
                      className="h-1 bg-status-processing transition-all duration-500"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                
                <span className={`text-xs px-2 py-1 rounded-full ${
                  file.status === 'completed' ? 'bg-status-success/10 text-status-success' :
                  file.status === 'processing' ? 'bg-status-processing/10 text-status-processing' :
                  file.status === 'error' ? 'bg-status-error/10 text-status-error' :
                  'bg-status-idle/10 text-status-idle'
                }`}>
                  {file.status}
                </span>
                
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderBatchesSection = () => (
    <BatchDashboard className="h-full" />
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'upload':
        return renderUploadSection()
      case 'documents':
        return renderDocumentsSection()
      case 'batches':
        return renderBatchesSection()
      case 'translate':
        return (
          <div className="text-center py-12">
            <Languages className="h-12 w-12 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-primary mb-2">Translation Tools</h2>
            <p className="text-muted">Translation interface will be implemented here</p>
          </div>
        )
      case 'agent':
        return (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-primary mb-2">AI Agent</h2>
            <p className="text-muted">AI agent interface will be implemented here</p>
          </div>
        )
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-primary mb-2">Settings</h2>
            <p className="text-muted">Settings interface will be implemented here</p>
          </div>
        )
      default:
        return renderDocumentsSection()
    }
  }

  return (
    <main className={`flex-1 min-w-min-canvas bg-[#F9FAFB] h-full pt-14 overflow-y-auto ${className}`} data-testid="workspace-canvas">
      <div className="p-6 min-h-full pb-0">
        {renderContent()}
      </div>
    </main>
  )
}