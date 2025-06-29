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
  Zap,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import {
  ChunkedFileUploader,
  ChunkUploadProgress,
  shouldUseChunkedUpload,
  getUploadMethod,
  formatFileSize as formatFileSizeUtil,
  estimateProcessingTime,
} from '@/lib/chunked-upload'

interface Document {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  content?: string
  status:
    | 'uploading'
    | 'ready'
    | 'processing'
    | 'error'
    | 'chunked-uploading'
    | 'chunked-processing'
  metadata?: any
  uploadMethod?: 'standard' | 'chunked' | 'enterprise'
  chunkProgress?: ChunkUploadProgress
  isLargeFile?: boolean
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
        const uploadMethod = getUploadMethod(file)
        const isLargeFile = shouldUseChunkedUpload(file)

        const newDoc: Document = {
          id: `doc_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          status: isLargeFile ? 'chunked-uploading' : 'uploading',
          uploadMethod,
          isLargeFile,
        }

        setDocuments(prev => [...prev, newDoc])

        try {
          let content = ''

          // Handle enterprise-scale files
          if (uploadMethod === 'enterprise') {
            setDocuments(prev =>
              prev.map(doc =>
                doc.id === newDoc.id
                  ? {
                      ...doc,
                      status: 'error',
                      metadata: {
                        error: 'Enterprise processing required',
                        message:
                          'File exceeds 1GB. Contact enterprise@prismy.in for processing.',
                        requiresEnterprise: true,
                      },
                    }
                  : doc
              )
            )
            continue
          }

          // Handle chunked upload for large files
          if (isLargeFile && uploadMethod === 'chunked') {
            console.log(
              `🚀 Starting chunked upload for large file: ${file.name} (${formatFileSizeUtil(file.size)})`
            )

            const chunkedUploader = new ChunkedFileUploader(
              {
                chunkSize: 50 * 1024 * 1024, // 50MB chunks
                maxConcurrentUploads: 3,
                retryAttempts: 3,
              },
              // Progress callback
              (progress: ChunkUploadProgress) => {
                setDocuments(prev =>
                  prev.map(doc =>
                    doc.id === newDoc.id
                      ? {
                          ...doc,
                          chunkProgress: progress,
                          status:
                            progress.status === 'complete'
                              ? 'ready'
                              : 'chunked-uploading',
                        }
                      : doc
                  )
                )
              }
            )

            setDocuments(prev =>
              prev.map(doc =>
                doc.id === newDoc.id
                  ? { ...doc, status: 'chunked-processing' }
                  : doc
              )
            )

            const result = await chunkedUploader.uploadFile(file)

            if (result.success) {
              content = result.extractedText || ''

              // Update document with final result
              setDocuments(prev =>
                prev.map(doc =>
                  doc.id === newDoc.id
                    ? {
                        ...doc,
                        status: 'ready',
                        content,
                        metadata: {
                          ...result.metadata,
                          processingMethod: 'chunked',
                          isEnterpriseScale: true,
                        },
                      }
                    : doc
                )
              )
            } else {
              throw new Error(result.error || 'Chunked upload failed')
            }
          }
          // Handle standard upload for smaller files
          else if (file.type === 'text/plain') {
            content = await file.text()

            setDocuments(prev =>
              prev.map(doc =>
                doc.id === newDoc.id
                  ? { ...doc, status: 'ready', content }
                  : doc
              )
            )
          } else if (
            file.type === 'application/pdf' ||
            file.type ===
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.type === 'application/msword'
          ) {
            // Update status to processing
            setDocuments(prev =>
              prev.map(doc =>
                doc.id === newDoc.id ? { ...doc, status: 'processing' } : doc
              )
            )

            // Process through standard API
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/documents/process-simple', {
              method: 'POST',
              body: formData,
              credentials: 'include',
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => null)
              throw new Error(errorData?.error || 'Document processing failed')
            }

            const result = await response.json()
            content = result.extractedText || ''

            // Update document with final result
            setDocuments(prev =>
              prev.map(doc =>
                doc.id === newDoc.id
                  ? {
                      ...doc,
                      status: 'ready',
                      content,
                      metadata: {
                        ...result.metadata,
                        processingMethod: 'standard',
                      },
                    }
                  : doc
              )
            )
          } else {
            content = `[File] ${file.name} - Supported format`

            setDocuments(prev =>
              prev.map(doc =>
                doc.id === newDoc.id
                  ? { ...doc, status: 'ready', content }
                  : doc
              )
            )
          }

          // Auto-extract text for first document
          if (documents.length === 0 && content) {
            const finalDoc = documents.find(d => d.id === newDoc.id) || {
              ...newDoc,
              content,
              status: 'ready' as const,
            }
            onTextExtracted?.(content, finalDoc)
          }
        } catch (error) {
          console.error('File upload error:', error)
          setDocuments(prev =>
            prev.map(doc =>
              doc.id === newDoc.id
                ? {
                    ...doc,
                    status: 'error',
                    metadata: {
                      error:
                        error instanceof Error
                          ? error.message
                          : 'Upload failed',
                    },
                  }
                : doc
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
    return formatFileSizeUtil(bytes)
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

          {/* Enterprise Scale Information */}
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Up to 50MB: Standard processing</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>50MB-1GB: Chunked processing</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>1GB+: Enterprise processing (contact support)</span>
            </div>
          </div>
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
                        {doc.metadata?.pageCount && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {doc.metadata.pageCount}{' '}
                              {language === 'vi' ? 'trang' : 'pages'}
                            </span>
                          </>
                        )}
                        {doc.content && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {doc.content.length.toLocaleString()}{' '}
                              {language === 'vi' ? 'ký tự' : 'chars'}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 space-y-2">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              doc.status === 'ready'
                                ? 'bg-green-100 text-green-800'
                                : doc.status === 'processing' ||
                                    doc.status === 'chunked-processing'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : doc.status === 'uploading' ||
                                      doc.status === 'chunked-uploading'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {doc.status === 'ready' && '✅'}
                            {(doc.status === 'processing' ||
                              doc.status === 'chunked-processing') &&
                              '⏳'}
                            {(doc.status === 'uploading' ||
                              doc.status === 'chunked-uploading') &&
                              '📤'}
                            {doc.status === 'error' && '❌'}
                            <span className="capitalize">
                              {doc.status === 'chunked-uploading'
                                ? 'Chunked Upload'
                                : doc.status === 'chunked-processing'
                                  ? 'Processing Chunks'
                                  : doc.status}
                            </span>
                          </div>

                          {/* Enterprise/Large File Indicators */}
                          {doc.isLargeFile && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                              <Zap className="w-3 h-3" />
                              <span>Large File</span>
                            </div>
                          )}

                          {doc.uploadMethod === 'enterprise' && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Enterprise</span>
                            </div>
                          )}

                          {doc.metadata?.processingMethod === 'chunked' && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              <BarChart3 className="w-3 h-3" />
                              <span>Chunked</span>
                            </div>
                          )}
                        </div>

                        {/* Chunked Upload Progress */}
                        {doc.chunkProgress &&
                          doc.status === 'chunked-uploading' && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>
                                  Chunk {doc.chunkProgress.currentChunk}/
                                  {doc.chunkProgress.totalChunks}
                                </span>
                                <span>{doc.chunkProgress.percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${doc.chunkProgress.percentage}%`,
                                  }}
                                />
                              </div>
                              {doc.chunkProgress.speed > 0 && (
                                <div className="text-xs text-gray-500">
                                  {formatFileSize(doc.chunkProgress.speed)}/s
                                  {doc.chunkProgress.estimatedTimeRemaining >
                                    0 &&
                                    ` • ${Math.ceil(doc.chunkProgress.estimatedTimeRemaining / 1000)}s remaining`}
                                </div>
                              )}
                            </div>
                          )}

                        {/* Enterprise Processing Message */}
                        {doc.metadata?.requiresEnterprise && (
                          <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                            <div className="font-medium text-orange-800">
                              Enterprise Processing Required
                            </div>
                            <div className="text-orange-600 mt-1">
                              File exceeds 1GB limit. Contact
                              enterprise@prismy.in for processing.
                            </div>
                          </div>
                        )}

                        {/* Error Messages */}
                        {doc.status === 'error' &&
                          doc.metadata?.error &&
                          !doc.metadata?.requiresEnterprise && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <div className="font-medium text-red-800">
                                Processing Error
                              </div>
                              <div className="text-red-600 mt-1">
                                {doc.metadata.error}
                              </div>
                            </div>
                          )}
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
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>
                {documents.length}{' '}
                {language === 'vi' ? 'tài liệu' : 'documents'}
              </span>
              <span>
                {documents.filter(d => d.status === 'ready').length}{' '}
                {language === 'vi' ? 'sẵn sàng' : 'ready'}
              </span>
            </div>
            {documents.filter(d => d.isLargeFile).length > 0 && (
              <div className="flex items-center justify-between text-purple-600">
                <span>Large files</span>
                <span>{documents.filter(d => d.isLargeFile).length}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-right">
              <span className="font-medium">Enterprise Ready</span>
            </div>
            <div className="text-right text-gray-500">Up to 1GB processing</div>
          </div>
        </div>
      </div>
    </div>
  )
}
