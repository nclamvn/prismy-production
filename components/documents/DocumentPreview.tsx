'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ProcessedDocument } from '@/lib/document-processor'

interface DocumentPreviewProps {
  document: ProcessedDocument
  language?: 'vi' | 'en'
  showMetadata?: boolean
  showChunks?: boolean
  maxHeight?: number
  onChunkSelect?: (chunkId: string) => void
  onTextSelect?: (selectedText: string) => void
}

interface TextSelection {
  text: string
  range: Range | null
}

export default function DocumentPreview({
  document,
  language = 'en',
  showMetadata = true,
  showChunks = false,
  maxHeight = 600,
  onChunkSelect,
  onTextSelect
}: DocumentPreviewProps) {
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null)
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const content = {
    vi: {
      metadata: 'Thông tin tài liệu',
      fileName: 'Tên tệp',
      fileType: 'Loại tệp',
      wordCount: 'Số từ',
      characterCount: 'Số ký tự',
      language: 'Ngôn ngữ',
      chunks: 'Đoạn văn bản',
      chunkCount: 'đoạn',
      expand: 'Mở rộng',
      collapse: 'Thu gọn',
      selectText: 'Chọn văn bản để dịch',
      noContent: 'Không có nội dung',
      processing: 'Đang xử lý...',
      error: 'Lỗi xử lý tài liệu'
    },
    en: {
      metadata: 'Document Information',
      fileName: 'File name',
      fileType: 'File type',
      wordCount: 'Word count',
      characterCount: 'Character count',
      language: 'Language',
      chunks: 'Text Chunks',
      chunkCount: 'chunks',
      expand: 'Expand',
      collapse: 'Collapse',
      selectText: 'Select text to translate',
      noContent: 'No content available',
      processing: 'Processing...',
      error: 'Document processing error'
    }
  }

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
        const selectedText = selection.toString().trim()
        const range = selection.getRangeAt(0)
        
        // Check if selection is within our preview area
        if (previewRef.current?.contains(range.commonAncestorContainer)) {
          setTextSelection({ text: selectedText, range })
          onTextSelect?.(selectedText)
        }
      } else {
        setTextSelection(null)
      }
    }

    window.document.addEventListener('selectionchange', handleSelectionChange)
    return () => window.document.removeEventListener('selectionchange', handleSelectionChange)
  }, [onTextSelect])

  const handleChunkClick = (chunkId: string) => {
    setSelectedChunk(chunkId === selectedChunk ? null : chunkId)
    onChunkSelect?.(chunkId)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      'en': 'English',
      'vi': 'Tiếng Việt',
      'fr': 'Français',
      'es': 'Español',
      'de': 'Deutsch',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文'
    }
    return languages[code] || code.toUpperCase()
  }

  const highlightChunk = (text: string, chunkId: string): string => {
    if (selectedChunk !== chunkId) return text
    return text // In a real implementation, you'd highlight the selected chunk
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{document.fileName}</h3>
            <p className="text-sm text-gray-500">
              {document.metadata.wordCount} {content[language].wordCount.toLowerCase()} • {' '}
              {document.chunks.length} {content[language].chunkCount}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg 
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="animate-accordion-open">
            {/* Metadata */}
            {showMetadata && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">{content[language].metadata}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{content[language].fileType}:</span>
                    <span className="ml-2 font-medium">{document.fileType.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{content[language].wordCount}:</span>
                    <span className="ml-2 font-medium">{document.metadata.wordCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{content[language].characterCount}:</span>
                    <span className="ml-2 font-medium">{document.metadata.characterCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{content[language].language}:</span>
                    <span className="ml-2 font-medium">
                      {getLanguageName(document.metadata.language || 'unknown')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Content Preview */}
            <div 
              ref={previewRef}
              className="px-4 py-3"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              {document.originalText ? (
                <div className="space-y-4">
                  {/* Full Text View */}
                  {!showChunks && (
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="whitespace-pre-wrap text-gray-800 leading-relaxed select-text"
                        style={{ maxHeight: `${maxHeight - 100}px`, overflowY: 'auto' }}
                      >
                        {document.originalText}
                      </div>
                    </div>
                  )}

                  {/* Chunked View */}
                  {showChunks && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">{content[language].chunks}</h5>
                        <span className="text-sm text-gray-500">
                          {document.chunks.length} {content[language].chunkCount}
                        </span>
                      </div>
                      
                      <div 
                        className="space-y-2"
                        style={{ maxHeight: `${maxHeight - 150}px`, overflowY: 'auto' }}
                      >
                        {document.chunks.map((chunk, index) => (
                          <div
                            key={chunk.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors select-text animate-fade-in ${
                              selectedChunk === chunk.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleChunkClick(chunk.id)}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">
                                Chunk {index + 1} • {chunk.wordCount} words
                              </span>
                              <span className="text-xs text-gray-400">
                                {Math.round((chunk.text.length / document.originalText.length) * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {chunk.text.substring(0, 200)}
                              {chunk.text.length > 200 && '...'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Selection Tooltip */}
                  {textSelection && (
                    <div
                      className="fixed z-50 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none animate-scale-in"
                      style={{
                        top: '10px',
                        right: '10px'
                      }}
                    >
                      {textSelection.text.length} characters selected
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">{content[language].noContent}</p>
                </div>
              )}
            </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showChunks}
              onChange={(e) => onChunkSelect && e.target.checked}
              className="mr-2"
              disabled={!onChunkSelect}
            />
            Show chunks
          </label>
        </div>
        
        <div className="text-xs text-gray-500">
          {content[language].selectText}
        </div>
      </div>
    </div>
  )
}