'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Document, Page, pdfjs } from 'react-pdf'
import { ProcessedDocument, DocumentChunk } from '@/lib/enhanced-document-processor'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

interface EnhancedDocumentPreviewProps {
  document: ProcessedDocument
  onTextSelect?: (selectedText: string, chunk?: DocumentChunk) => void
  onTranslateChunk?: (chunk: DocumentChunk) => void
  className?: string
  showMetadata?: boolean
  interactive?: boolean
}

export default function EnhancedDocumentPreview({
  document,
  onTextSelect,
  onTranslateChunk,
  className = '',
  showMetadata = true,
  interactive = true
}: EnhancedDocumentPreviewProps) {
  const [selectedText, setSelectedText] = useState('')
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'text' | 'images' | 'metadata'>('text')
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedText, setHighlightedText] = useState('')

  // Handle text selection
  const handleTextSelection = () => {
    if (!interactive) return

    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      setSelectedText(text)
      
      // Find which chunk contains this text
      const chunk = document.chunks.find(c => c.content.includes(text))
      setSelectedChunk(chunk || null)
      
      if (onTextSelect) {
        onTextSelect(text, chunk)
      }
    }
  }

  // Filter and highlight search results
  const filteredChunks = useMemo(() => {
    if (!searchQuery) return document.chunks

    return document.chunks.filter(chunk =>
      chunk.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [document.chunks, searchQuery])

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query) return text

    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('word')) return '📄'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️'
    if (type.includes('pdf')) return '📕'
    if (type.includes('image')) return '🖼️'
    if (type.includes('text')) return '📝'
    return '📋'
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(document.metadata.type)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{document.metadata.filename}</h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.metadata.size)}
                {document.metadata.pages && ` • ${document.metadata.pages} pages`}
                {document.metadata.words && ` • ${document.metadata.words} words`}
              </p>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            {(['text', 'images', 'metadata'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                disabled={mode === 'images' && !document.images?.length}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        {viewMode === 'text' && (
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search in document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                Found {filteredChunks.length} result(s) for &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {viewMode === 'text' && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Text Content */}
              <div className="max-h-96 overflow-y-auto">
                {filteredChunks.length > 0 ? (
                  filteredChunks.map((chunk, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border mb-3 cursor-pointer transition-colors ${
                        selectedChunk === chunk
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onMouseUp={handleTextSelection}
                      onClick={() => setSelectedChunk(chunk)}
                    >
                      {chunk.page && (
                        <div className="text-xs text-gray-500 mb-2">
                          Page {chunk.page}
                          {chunk.confidence && (
                            <span className="ml-2">
                              Confidence: {Math.round(chunk.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        className="text-sm leading-relaxed select-text"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(chunk.content, searchQuery)
                        }}
                      />
                      {interactive && onTranslateChunk && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onTranslateChunk(chunk)
                          }}
                          className="mt-2 text-xs text-black hover:text-gray-700 transition-colors"
                        >
                          Translate this section →
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No content found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>

              {/* Selected Text Action */}
              {selectedText && interactive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Selected Text:</p>
                      <p className="text-sm text-blue-700 mt-1">&quot;{selectedText}&quot;</p>
                    </div>
                    <button
                      onClick={() => {
                        if (onTextSelect) {
                          onTextSelect(selectedText, selectedChunk)
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Translate
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {viewMode === 'images' && (
            <motion.div
              key="images"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {document.images && document.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {document.images.map((image, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={image.data}
                        alt={`Document image ${index + 1}`}
                        className="w-full h-48 object-contain bg-gray-50"
                      />
                      <div className="p-3 bg-gray-50 border-t">
                        <p className="text-xs text-gray-600">
                          Format: {image.format}
                          {image.page && ` • Page ${image.page}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No images found in this document
                </div>
              )}
            </motion.div>
          )}

          {viewMode === 'metadata' && showMetadata && (
            <motion.div
              key="metadata"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">File Information</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Filename:</span>
                      <span className="font-mono">{document.metadata.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span>{document.metadata.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span>{formatFileSize(document.metadata.size)}</span>
                    </div>
                    {document.metadata.pages && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pages:</span>
                        <span>{document.metadata.pages}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Content Analysis</h4>
                  <div className="text-sm space-y-1">
                    {document.metadata.characters && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Characters:</span>
                        <span>{document.metadata.characters.toLocaleString()}</span>
                      </div>
                    )}
                    {document.metadata.words && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Words:</span>
                        <span>{document.metadata.words.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chunks:</span>
                      <span>{document.chunks.length}</span>
                    </div>
                    {document.metadata.language && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Language:</span>
                        <span>{document.metadata.language}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Processing Errors */}
              {document.errors && document.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-900 mb-2">Processing Warnings</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    {document.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {document.preview || document.fullText.substring(0, 300)}
                    {document.fullText.length > 300 && '...'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}