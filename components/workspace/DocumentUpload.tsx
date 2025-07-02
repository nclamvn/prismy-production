'use client'

import { useState } from 'react'
import { FileDropZone } from '@/components/ui/FileDropZone'
import { Button } from '@/components/ui/Button'
import { FileText, FileEdit, Clipboard, Folder } from 'lucide-react'

interface UploadedDocument {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  status: 'uploading' | 'ready' | 'processing' | 'error'
}

interface DocumentUploadProps {
  onDocumentUploaded?: (document: UploadedDocument) => void
}

export function DocumentUpload({ onDocumentUploaded }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true)

    for (const file of files) {
      const document: UploadedDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: 'uploading',
      }

      setDocuments(prev => [...prev, document])

      // Simulate upload process
      setTimeout(
        () => {
          setDocuments(prev =>
            prev.map(doc =>
              doc.id === document.id ? { ...doc, status: 'ready' } : doc
            )
          )
          onDocumentUploaded?.(document)
        },
        1000 + Math.random() * 2000
      )
    }

    setIsProcessing(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-indigo-600'
      case 'ready':
        return 'text-green-600'
      case 'processing':
        return 'text-orange-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-muted'
    }
  }

  const getStatusText = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'ready':
        return 'Ready'
      case 'processing':
        return 'Processing...'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Upload Documents</h2>
        <FileDropZone
          onFilesSelected={handleFilesSelected}
          accept=".pdf,.docx,.txt"
          maxFiles={10}
          maxSize={50 * 1024 * 1024} // 50MB
          disabled={isProcessing}
        >
          <div className="space-y-4">
            <FileText size={48} className="text-accent-brand mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                Drop documents here
              </h3>
              <p className="text-sm text-muted">
                Supports PDF, DOCX, and TXT files up to 50MB each
              </p>
            </div>
          </div>
        </FileDropZone>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">
            Uploaded Documents ({documents.length})
          </h3>
          <div className="space-y-3">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="bg-surface border border-border-default rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      {doc.type.includes('pdf') ? (
                        <FileText size={20} className="text-accent-brand" />
                      ) : doc.type.includes('doc') ? (
                        <FileEdit size={20} className="text-accent-brand" />
                      ) : (
                        <Clipboard size={20} className="text-accent-brand" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-primary">{doc.name}</div>
                      <div className="text-sm text-muted">
                        {formatFileSize(doc.size)} •{' '}
                        {doc.uploadedAt.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-sm font-medium ${getStatusColor(doc.status)}`}
                    >
                      {getStatusText(doc.status)}
                    </span>
                    {doc.status === 'ready' && (
                      <Button size="sm" variant="outline">
                        Translate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <div className="text-center py-12">
          <Folder size={64} className="text-accent-brand mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">
            No documents uploaded yet
          </h3>
          <p className="text-muted">
            Upload your first document to get started with AI-powered
            translation
          </p>
        </div>
      )}
    </div>
  )
}
