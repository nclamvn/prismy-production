'use client'

import { useWorkspaceStore } from './hooks/useWorkspaceStore'
import { FileText, X, Loader, AlertCircle, CheckCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function DocumentTabs() {
  const { 
    documents, 
    activeDocumentId, 
    setActiveDocument, 
    removeDocument,
    upload 
  } = useWorkspaceStore()

  const handleTabClick = (docId: string) => {
    setActiveDocument(docId)
  }

  const handleCloseTab = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    removeDocument(docId)
  }

  const handleNewUpload = () => {
    // Trigger file input
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.pdf,.docx,.txt'
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        try {
          await upload(files)
        } catch (error) {
          console.error('Upload error:', error)
        }
      }
    }
    input.click()
  }

  if (documents.length === 0) return null

  return (
    <div className="bg-surface">
      <div className="flex items-center overflow-x-auto scrollbar-hide">
        {/* Document Tabs */}
        {documents.map((doc) => (
          <DocumentTab
            key={doc.id}
            document={doc}
            isActive={doc.id === activeDocumentId}
            onClick={() => handleTabClick(doc.id)}
            onClose={(e) => handleCloseTab(e, doc.id)}
          />
        ))}

        {/* Add New Tab */}
        <button
          onClick={handleNewUpload}
          className="flex-shrink-0 flex items-center space-x-2 px-4 py-3 border-r border-border-default hover:bg-bg-muted transition-colors group"
          title="Upload new document"
        >
          <Plus size={16} className="text-muted group-hover:text-primary" />
        </button>
      </div>
    </div>
  )
}

interface DocumentTabProps {
  document: import('./hooks/useWorkspaceStore').Document
  isActive: boolean
  onClick: () => void
  onClose: (e: React.MouseEvent) => void
}

function DocumentTab({ document, isActive, onClick, onClose }: DocumentTabProps) {
  const getStatusIcon = () => {
    switch (document.status) {
      case 'uploading':
        return <Loader size={14} className="animate-spin text-accent-brand" />
      case 'processing':
        return <Loader size={14} className="animate-spin text-accent-brand" />
      case 'translated':
        return <CheckCircle size={14} className="text-green-500" />
      case 'error':
        return <AlertCircle size={14} className="text-red-500" />
      default:
        return null
    }
  }

  const getFileTypeIcon = () => {
    if (document.type.includes('pdf')) {
      return <FileText size={16} className="text-red-500" />
    } else if (document.type.includes('doc')) {
      return <FileText size={16} className="text-blue-500" />
    } else {
      return <FileText size={16} className="text-gray-500" />
    }
  }

  const truncateFileName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name
    const ext = name.split('.').pop()
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'))
    const truncated = nameWithoutExt.substring(0, maxLength - ext!.length - 4) + '...'
    return `${truncated}.${ext}`
  }

  const isProcessing = document.status === 'uploading' || document.status === 'processing'

  return (
    <div
      onClick={onClick}
      className={`
        flex-shrink-0 flex items-center space-x-2 px-4 py-3 border-r border-border-default cursor-pointer transition-colors group relative
        ${isActive 
          ? 'bg-bg-default border-b-2 border-b-accent-brand text-primary' 
          : 'hover:bg-bg-muted text-secondary hover:text-primary'
        }
        ${isProcessing ? 'cursor-wait' : ''}
      `}
      title={document.name}
    >
      {/* File Type Icon */}
      {getFileTypeIcon()}

      {/* File Name */}
      <span className="text-sm font-medium">
        {truncateFileName(document.name)}
      </span>

      {/* Status Icon */}
      {getStatusIcon()}

      {/* Progress Bar for Processing */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bg-muted">
          <div 
            className="h-full bg-accent-brand transition-all duration-300"
            style={{ width: `${document.progress}%` }}
          />
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className={`
          flex-shrink-0 p-1 rounded-md transition-all
          ${isActive 
            ? 'opacity-100 hover:bg-bg-muted' 
            : 'opacity-0 group-hover:opacity-100 hover:bg-border-default'
          }
        `}
        title="Close document"
        disabled={isProcessing}
      >
        <X size={12} />
      </button>

      {/* Unsaved Indicator */}
      {isProcessing && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </div>
  )
}

// Custom scrollbar styles (add to globals.css if needed)
const scrollbarStyles = `
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
`