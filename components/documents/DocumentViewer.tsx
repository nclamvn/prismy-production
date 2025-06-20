'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionSafe, slideUp } from '@/lib/motion'

interface DocumentViewerProps {
  file: File
  language?: 'vi' | 'en'
  onTextExtract?: (text: string) => void
  onError?: (error: string) => void
}

interface ViewerState {
  type: 'loading' | 'image' | 'text' | 'pdf' | 'unsupported' | 'error'
  content?: string
  imageUrl?: string
  error?: string
}

export default function DocumentViewer({
  file,
  language = 'en',
  onTextExtract,
  onError
}: DocumentViewerProps) {
  const [viewerState, setViewerState] = useState<ViewerState>({ type: 'loading' })
  const [zoom, setZoom] = useState(100)
  const [showOCROverlay, setShowOCROverlay] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const content = {
    vi: {
      loading: 'Đang tải...',
      error: 'Lỗi khi tải tài liệu',
      unsupported: 'Định dạng tệp không được hỗ trợ',
      extractText: 'Trích xuất văn bản',
      extracting: 'Đang trích xuất...',
      zoomIn: 'Phóng to',
      zoomOut: 'Thu nhỏ',
      resetZoom: 'Đặt lại zoom',
      fullscreen: 'Toàn màn hình',
      download: 'Tải xuống',
      ocrOverlay: 'Hiển thị vùng OCR',
      textExtracted: 'Đã trích xuất văn bản',
      noTextFound: 'Không tìm thấy văn bản'
    },
    en: {
      loading: 'Loading...',
      error: 'Error loading document',
      unsupported: 'Unsupported file format',
      extractText: 'Extract Text',
      extracting: 'Extracting...',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetZoom: 'Reset Zoom',
      fullscreen: 'Fullscreen',
      download: 'Download',
      ocrOverlay: 'Show OCR regions',
      textExtracted: 'Text extracted',
      noTextFound: 'No text found'
    }
  }

  useEffect(() => {
    loadDocument()
  }, [file])

  const loadDocument = async () => {
    setViewerState({ type: 'loading' })

    try {
      const fileType = file.type
      const fileName = file.name.toLowerCase()

      if (fileType.startsWith('image/')) {
        await loadImageDocument()
      } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        await loadTextDocument()
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        await loadPdfDocument()
      } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        await loadCsvDocument()
      } else {
        setViewerState({ 
          type: 'unsupported', 
          error: `Unsupported file type: ${fileType}` 
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setViewerState({ type: 'error', error: errorMessage })
      onError?.(errorMessage)
    }
  }

  const loadImageDocument = async () => {
    const imageUrl = URL.createObjectURL(file)
    setViewerState({ type: 'image', imageUrl })
  }

  const loadTextDocument = async () => {
    const text = await file.text()
    setViewerState({ type: 'text', content: text })
    onTextExtract?.(text)
  }

  const loadCsvDocument = async () => {
    const text = await file.text()
    setViewerState({ type: 'text', content: text })
    onTextExtract?.(text)
  }

  const loadPdfDocument = async () => {
    // For now, show as unsupported since PDF.js isn't integrated
    // In a real implementation, you'd use PDF.js to render the PDF
    setViewerState({ 
      type: 'unsupported', 
      error: 'PDF viewer not yet implemented. Use document processing instead.' 
    })
  }

  const handleOCRExtraction = async () => {
    if (viewerState.type !== 'image' || !viewerState.imageUrl) return

    try {
      setViewerState(prev => ({ ...prev, type: 'loading' }))
      
      // Import OCR service dynamically
      const { ocrService } = await import('@/lib/ocr-service')
      
      const result = await ocrService.recognizeFromFile(file, {
        language: 'eng+vie',
        psm: 3
      })

      if (result.text && result.text.trim()) {
        onTextExtract?.(result.text)
        setViewerState(prev => ({ 
          ...prev, 
          type: 'image',
          content: result.text 
        }))
      } else {
        setViewerState(prev => ({ 
          ...prev, 
          type: 'image',
          error: content[language].noTextFound 
        }))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OCR failed'
      setViewerState(prev => ({ 
        ...prev, 
        type: 'image',
        error: errorMessage 
      }))
      onError?.(errorMessage)
    }
  }

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'reset') {
      setZoom(100)
    } else if (direction === 'in' && zoom < 300) {
      setZoom(prev => Math.min(prev + 25, 300))
    } else if (direction === 'out' && zoom > 25) {
      setZoom(prev => Math.max(prev - 25, 25))
    }
  }

  const handleDownload = () => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderContent = () => {
    switch (viewerState.type) {
      case 'loading':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{content[language].loading}</p>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="relative">
            <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
              <img
                ref={imageRef}
                src={viewerState.imageUrl}
                alt={file.name}
                className="max-w-full h-auto"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                onLoad={() => {
                  // Image loaded successfully
                }}
              />
            </div>
            
            {/* OCR Results Overlay */}
            {viewerState.content && (
              <AnimatePresence>
                <motion.div
                  className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h4 className="font-medium text-green-800 mb-2">{content[language].textExtracted}</h4>
                  <div className="max-h-32 overflow-y-auto text-sm text-green-700">
                    {viewerState.content}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )

      case 'text':
        return (
          <div className="border border-gray-200 rounded-lg">
            <div 
              className="p-4 max-h-96 overflow-auto font-mono text-sm whitespace-pre-wrap"
              style={{ fontSize: `${zoom}%` }}
            >
              {viewerState.content}
            </div>
          </div>
        )

      case 'unsupported':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-2">{content[language].unsupported}</p>
              <p className="text-sm text-gray-500">{viewerState.error}</p>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 mb-2">{content[language].error}</p>
              <p className="text-sm text-red-500">{viewerState.error}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      variants={motionSafe(slideUp)}
      initial="hidden"
      animate="visible"
    >
      {/* Header with controls */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{file.name}</h3>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* OCR Extract button for images */}
          {viewerState.type === 'image' && (
            <button
              onClick={handleOCRExtraction}
              className="btn-primary text-sm"
              disabled={false}
            >
              {content[language].extractText}
            </button>
          )}

          {/* Zoom controls */}
          {(viewerState.type === 'image' || viewerState.type === 'text') && (
            <>
              <button
                onClick={() => handleZoom('out')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={content[language].zoomOut}
                disabled={zoom <= 25}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>

              <span className="text-sm text-gray-500 min-w-12 text-center">{zoom}%</span>

              <button
                onClick={() => handleZoom('in')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={content[language].zoomIn}
                disabled={zoom >= 300}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>

              <button
                onClick={() => handleZoom('reset')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={content[language].resetZoom}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={content[language].download}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>

      {/* Error display */}
      {viewerState.error && viewerState.type !== 'error' && viewerState.type !== 'unsupported' && (
        <motion.div
          className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-red-600">{viewerState.error}</p>
        </motion.div>
      )}
    </motion.div>
  )
}