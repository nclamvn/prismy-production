'use client'

import React, { useState, useCallback } from 'react'
import {
  FileText,
  Upload,
  Trash2,
  File,
  Eye,
  Search,
  Plus,
  Clock,
  Download,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'

interface Document {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  content?: string
  status: 'uploading' | 'ready' | 'processing' | 'error'
}

interface SourcesPanelProps {
  onDocumentSelect?: (document: Document) => void
  onTextExtracted?: (text: string, document: Document) => void
}

/**
 * SOURCES PANEL - NotebookLM Style
 * Document management and text sources
 */
export default function SourcesPanel({
  onDocumentSelect,
  onTextExtracted,
}: SourcesPanelProps) {
  const { language } = useSSRSafeLanguage()
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const newDoc: Document = {
          id: `doc_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          status: 'uploading',
        }

        setDocuments(prev => [...prev, newDoc])

        try {
          // Process the file based on type
          let content = ''
          if (file.type === 'text/plain') {
            content = await file.text()
          } else if (file.type === 'application/pdf') {
            // TODO: Implement PDF processing
            content = `[PDF Content] ${file.name} - Ready for translation`
          } else {
            content = `[File] ${file.name} - Supported format`
          }

          // Update document status
          setDocuments(prev =>
            prev.map(doc =>
              doc.id === newDoc.id ? { ...doc, status: 'ready', content } : doc
            )
          )

          // Auto-extract text for first document
          if (documents.length === 0) {
            onTextExtracted?.(content, { ...newDoc, content, status: 'ready' })
          }
        } catch (error) {
          setDocuments(prev =>
            prev.map(doc =>
              doc.id === newDoc.id ? { ...doc, status: 'error' } : doc
            )
          )
        }
      }
    },
    [documents.length, onTextExtracted]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files) {
        handleFileUpload(e.dataTransfer.files)
      }
    },
    [handleFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document.id)
    onDocumentSelect?.(document)
    if (document.content) {
      onTextExtracted?.(document.content, document)
    }
  }

  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
    if (selectedDocument === docId) {
      setSelectedDocument(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={
              language === 'vi' ? 'Tìm kiếm tài liệu...' : 'Search documents...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Upload Area */}
      <div className="p-4 border-b border-gray-200">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            {language === 'vi'
              ? 'Kéo thả tài liệu hoặc'
              : 'Drag & drop documents or'}
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
            <Plus className="w-4 h-4" />
            {language === 'vi' ? 'Chọn tệp' : 'Browse files'}
            <input
              type="file"
              multiple
              accept=".txt,.pdf,.docx,.doc"
              onChange={e => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-auto">
        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {language === 'vi'
                ? 'Chưa có tài liệu nào. Tải lên để bắt đầu.'
                : 'No documents yet. Upload to get started.'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                  selectedDocument === doc.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => handleDocumentClick(doc)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      <File className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.size)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {doc.uploadedAt.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            doc.status === 'ready'
                              ? 'bg-green-100 text-green-800'
                              : doc.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : doc.status === 'uploading'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {doc.status === 'ready' && '✓'}
                          {doc.status === 'processing' && '⏳'}
                          {doc.status === 'uploading' && '📤'}
                          {doc.status === 'error' && '❌'}
                          <span className="capitalize">{doc.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                      title={language === 'vi' ? 'Xem' : 'View'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        deleteDocument(doc.id)
                      }}
                      className="p-1.5 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                      title={language === 'vi' ? 'Xóa' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {documents.length} {language === 'vi' ? 'tài liệu' : 'documents'}
          </span>
          <span>
            {documents.filter(d => d.status === 'ready').length}{' '}
            {language === 'vi' ? 'sẵn sàng' : 'ready'}
          </span>
        </div>
      </div>
    </div>
  )
}
