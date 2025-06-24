'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Share, 
  MoreVertical,
  Search,
  BookOpen,
  Eye,
  FileText,
  Image as ImageIcon,
  Volume2,
  Bookmark,
  MessageSquare
} from 'lucide-react'

import { useLanguage } from '@/contexts/LanguageContext'
import { useDocumentGestures } from './MobileGestureProvider'
import '../../styles/ai-workspace-components.css'

interface DocumentViewerProps {
  documentId?: string
  documentUrl?: string
  documentType?: 'pdf' | 'docx' | 'txt' | 'image' | 'audio'
  title?: string
  onAnnotationCreate?: (annotation: Annotation) => void
  onTextSelect?: (selectedText: string, position: Position) => void
  className?: string
  
  // Translation support
  originalContent?: string
  translatedContent?: string
  translation?: {
    targetLanguage: string
    qualityScore: number
    chunkTranslations?: Array<{
      id: string
      originalText: string
      translatedText: string
      confidence: number
    }>
  }
}

interface Annotation {
  id: string
  pageNumber: number
  position: Position
  content: string
  type: 'highlight' | 'note' | 'question'
  agentId?: string
  timestamp: Date
}

interface Position {
  x: number
  y: number
  width: number
  height: number
}

interface DocumentPage {
  pageNumber: number
  url: string
  width: number
  height: number
  text?: string
}

export default function DocumentViewer({
  documentId = 'sample-doc',
  documentUrl,
  documentType = 'pdf',
  title = 'Vietnamese Business Contract.pdf',
  onAnnotationCreate,
  onTextSelect,
  className = '',
  originalContent,
  translatedContent,
  translation
}: DocumentViewerProps) {
  const { language } = useLanguage()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(15)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedText, setSelectedText] = useState('')
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [viewMode, setViewMode] = useState<'original' | 'translated' | 'side-by-side'>('original')
  const [activeChunk, setActiveChunk] = useState<string | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  
  // Document-specific gesture handling
  const documentGestures = useDocumentGestures()
  
  // Auto-set view mode based on available content
  React.useEffect(() => {
    if (translatedContent && originalContent) {
      setViewMode('side-by-side')
    } else if (translatedContent) {
      setViewMode('translated')
    } else {
      setViewMode('original')
    }
  }, [originalContent, translatedContent])

  // Sample document pages for demo
  const documentPages: DocumentPage[] = Array.from({ length: totalPages }, (_, i) => ({
    pageNumber: i + 1,
    url: `/api/documents/${documentId}/page/${i + 1}`,
    width: 595,
    height: 842,
    text: `Sample text content for page ${i + 1}. This would contain the actual document text extracted from PDF or other formats.`
  }))

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    const text = selection?.toString()
    
    if (text && text.length > 0) {
      setSelectedText(text)
      
      // Get selection position
      const range = selection?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()
      
      if (rect && onTextSelect) {
        onTextSelect(text, {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        })
      }
    }
  }, [onTextSelect])

  // Gesture handlers for document viewer
  React.useEffect(() => {
    // Pinch to zoom handler
    const unsubscribePinch = documentGestures.registerDocumentGesture('pinch', (gesture) => {
      const newZoom = zoom * gesture.scale
      setZoom(Math.max(0.25, Math.min(3, newZoom)))
    })
    
    // Swipe for page navigation
    const unsubscribeSwipe = documentGestures.registerDocumentGesture('swipe', (gesture) => {
      if (gesture.direction === 'left' && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1)
      } else if (gesture.direction === 'right' && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      }
    })
    
    // Long press for annotation creation
    const unsubscribeLongPress = documentGestures.registerDocumentGesture('longpress', (gesture) => {
      // Create highlight annotation at touch position
      createAnnotation('highlight')
    })
    
    // Double tap to zoom
    const unsubscribeDoubleTap = documentGestures.registerDocumentGesture('tap', (gesture) => {
      // Simple double-tap detection (production should use proper gesture library)
      if (zoom === 1) {
        setZoom(2)
      } else {
        setZoom(1)
      }
    })
    
    return () => {
      unsubscribePinch()
      unsubscribeSwipe()
      unsubscribeLongPress()
      unsubscribeDoubleTap()
    }
  }, [documentGestures, zoom, currentPage, totalPages])
  
  // Listen for workspace zoom events
  React.useEffect(() => {
    const handleZoomEvent = (event: CustomEvent) => {
      const { scale } = event.detail
      if (scale > 1) {
        handleZoomIn()
      } else {
        handleZoomOut()
      }
    }
    
    document.addEventListener('workspace:zoom:in', handleZoomEvent as EventListener)
    document.addEventListener('workspace:zoom:out', handleZoomEvent as EventListener)
    
    return () => {
      document.removeEventListener('workspace:zoom:in', handleZoomEvent as EventListener)
      document.removeEventListener('workspace:zoom:out', handleZoomEvent as EventListener)
    }
  }, [handleZoomIn, handleZoomOut])

  // Helper function to render content with chunk highlighting
  const renderContent = (content: string, type: 'original' | 'translated') => {
    // Split content into paragraphs for better readability
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0)
    
    return paragraphs.map((paragraph, index) => {
      const isActiveChunk = activeChunk === `chunk_${index}`
      return (
        <div 
          key={index}
          className={`mb-4 p-3 rounded-lg transition-all cursor-pointer ${
            isActiveChunk 
              ? 'bg-blue-100 border border-blue-300' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => setActiveChunk(isActiveChunk ? null : `chunk_${index}`)}
          onMouseEnter={() => {
            // Highlight corresponding chunk in other view
            if (viewMode === 'side-by-side') {
              setActiveChunk(`chunk_${index}`)
            }
          }}
          onMouseLeave={() => {
            if (viewMode === 'side-by-side') {
              setActiveChunk(null)
            }
          }}
        >
          {paragraph.split('\n').map((line, lineIndex) => (
            <p key={lineIndex} className="mb-2 last:mb-0">
              {line}
            </p>
          ))}
          {translation?.chunkTranslations && type === 'translated' && (
            <div className="mt-2 text-xs text-blue-600">
              {language === 'vi' ? 'Độ tin cậy:' : 'Confidence:'} {
                Math.round((translation.chunkTranslations[index]?.confidence || 0) * 100)
              }%
            </div>
          )}
        </div>
      )
    })
  }

  const createAnnotation = useCallback((type: 'highlight' | 'note' | 'question') => {
    if (!selectedText) return

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      pageNumber: currentPage,
      position: { x: 100, y: 100, width: 200, height: 20 }, // Mock position
      content: selectedText,
      type,
      timestamp: new Date()
    }

    setAnnotations(prev => [...prev, newAnnotation])
    
    if (onAnnotationCreate) {
      onAnnotationCreate(newAnnotation)
    }

    setSelectedText('')
  }, [selectedText, currentPage, onAnnotationCreate])

  const getDocumentIcon = () => {
    switch (documentType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />
      case 'txt':
        return <FileText className="w-5 h-5 text-gray-500" />
      case 'image':
        return <ImageIcon className="w-5 h-5 text-green-500" />
      case 'audio':
        return <Volume2 className="w-5 h-5 text-purple-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const renderDocumentContent = () => {
    if (isLoading) {
      return (
        <div className="document-loading">
          <div className="document-loading-spinner" />
          <p>{language === 'vi' ? 'Đang tải tài liệu...' : 'Loading document...'}</p>
        </div>
      )
    }

    const currentPageData = documentPages[currentPage - 1]

    // Render side-by-side view for translations
    if (viewMode === 'side-by-side' && originalContent && translatedContent) {
      return (
        <div className="document-canvas-split">
          <div className="flex h-full">
            {/* Original Content */}
            <div className="flex-1 pr-2">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden h-full">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="text-sm font-medium text-gray-700">
                    {language === 'vi' ? 'Bản Gốc' : 'Original'}
                  </h3>
                </div>
                <div className="p-6 overflow-auto h-full prose prose-sm max-w-none">
                  {renderContent(originalContent, 'original')}
                </div>
              </div>
            </div>

            {/* Translated Content */}
            <div className="flex-1 pl-2">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden h-full">
                <div className="bg-blue-50 px-4 py-2 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-blue-700">
                      {language === 'vi' ? 'Bản Dịch' : 'Translation'}
                      {translation && (
                        <span className="ml-2 text-xs text-blue-600">
                          ({translation.targetLanguage.toUpperCase()})
                        </span>
                      )}
                    </h3>
                    {translation && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {translation.qualityScore}% {language === 'vi' ? 'chất lượng' : 'quality'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 overflow-auto h-full prose prose-sm max-w-none">
                  {renderContent(translatedContent, 'translated')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Single view for original or translated content
    const content = viewMode === 'translated' ? translatedContent : originalContent
    if (content) {
      return (
        <div className="document-canvas">
          <motion.div
            className="document-page"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: zoom }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-8">
                <div className="prose prose-lg max-w-none">
                  {renderContent(content, viewMode)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    return (
      <div className="document-canvas">
        <motion.div
          className="document-page"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: zoom }}
          transition={{ duration: 0.3 }}
        >
          {/* Mock document content */}
          <div 
            className="p-8 bg-white shadow-lg"
            style={{ 
              width: `${currentPageData.width}px`,
              height: `${currentPageData.height}px`,
              minHeight: '800px'
            }}
            onMouseUp={handleTextSelection}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'vi' ? 'HỢP ĐỒNG THƯƠNG MẠI' : 'BUSINESS CONTRACT'}
              </h1>
              <p className="text-sm text-gray-600">
                {language === 'vi' ? `Trang ${currentPage} / ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
              </p>
            </div>

            <div className="space-y-4 text-gray-800 leading-relaxed">
              <p>
                {language === 'vi' 
                  ? 'Điều 1: Mục đích và phạm vi hợp đồng. Hợp đồng này được ký kết giữa hai bên nhằm thiết lập quan hệ hợp tác kinh doanh dài hạn, bao gồm các hoạt động xuất nhập khẩu, phân phối sản phẩm và dịch vụ hỗ trợ khách hàng.'
                  : 'Article 1: Purpose and scope of contract. This contract is signed between two parties to establish a long-term business cooperation relationship, including import and export activities, product distribution and customer support services.'
                }
              </p>
              
              <p>
                {language === 'vi'
                  ? 'Điều 2: Nghĩa vụ và quyền lợi của các bên. Bên A có trách nhiệm cung cấp hàng hóa chất lượng cao, đúng thời hạn và theo đúng quy cách đã thỏa thuận. Bên B có nghĩa vụ thanh toán đầy đủ, đúng hạn và tạo điều kiện thuận lợi cho việc giao nhận hàng hóa.'
                  : 'Article 2: Obligations and rights of the parties. Party A is responsible for providing high-quality goods, on time and according to agreed specifications. Party B has the obligation to pay in full, on time and facilitate the delivery and receipt of goods.'
                }
              </p>

              <p>
                {language === 'vi'
                  ? 'Điều 3: Điều khoản thanh toán. Tất cả các khoản thanh toán sẽ được thực hiện bằng đồng Việt Nam (VND) thông qua các hình thức chuyển khoản ngân hàng, VNPay hoặc MoMo. Thời hạn thanh toán không quá 30 ngày kể từ ngày nhận hàng.'
                  : 'Article 3: Payment terms. All payments will be made in Vietnamese Dong (VND) through bank transfer, VNPay or MoMo. Payment period shall not exceed 30 days from the date of receipt of goods.'
                }
              </p>

              {/* Sample annotations overlay */}
              {showAnnotations && annotations
                .filter(ann => ann.pageNumber === currentPage)
                .map(annotation => (
                  <motion.div
                    key={annotation.id}
                    className={`absolute border-2 rounded ${
                      annotation.type === 'highlight' ? 'border-yellow-400 bg-yellow-100' :
                      annotation.type === 'note' ? 'border-blue-400 bg-blue-100' :
                      'border-green-400 bg-green-100'
                    } opacity-80 cursor-pointer`}
                    style={{
                      left: annotation.position.x,
                      top: annotation.position.y,
                      width: annotation.position.width,
                      height: annotation.position.height
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.8, scale: 1 }}
                    whileHover={{ opacity: 1, scale: 1.02 }}
                    title={annotation.content}
                  />
                ))
              }
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`document-viewer-container ${className}`}>
      {/* Document Header */}
      <div className="document-viewer-header">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getDocumentIcon()}
          <h3 className="document-title">{title}</h3>
        </div>

        <div className="document-controls">
          {/* Page Navigation */}
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="document-control-btn"
            >
              ←
            </button>
            
            <span className="text-sm text-gray-600 min-w-0">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value))}
                className="w-12 text-center text-sm border rounded px-1"
                min={1}
                max={totalPages}
              />
              {' / ' + totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="document-control-btn"
            >
              →
            </button>
          </div>

          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="document-control-btn"
            title={language === 'vi' ? 'Thu nhỏ' : 'Zoom Out'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-gray-600 min-w-0 mx-2">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="document-control-btn"
            title={language === 'vi' ? 'Phóng to' : 'Zoom In'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Other Controls */}
          <button
            onClick={handleRotate}
            className="document-control-btn"
            title={language === 'vi' ? 'Xoay' : 'Rotate'}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`document-control-btn ${showAnnotations ? 'bg-blue-100 text-blue-600' : ''}`}
            title={language === 'vi' ? 'Hiện/Ẩn chú thích' : 'Show/Hide Annotations'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            className="document-control-btn"
            title={language === 'vi' ? 'Chia sẻ' : 'Share'}
          >
            <Share className="w-4 h-4" />
          </button>

          <button
            className="document-control-btn"
            title={language === 'vi' ? 'Tải về' : 'Download'}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Translation View Controls */}
          {(originalContent || translatedContent) && (
            <>
              <div className="h-6 w-px bg-gray-300 mx-2" />
              
              <div className="flex items-center gap-2">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {originalContent && (
                    <option value="original">
                      {language === 'vi' ? 'Bản gốc' : 'Original'}
                    </option>
                  )}
                  {translatedContent && (
                    <option value="translated">
                      {language === 'vi' ? 'Bản dịch' : 'Translation'}
                    </option>
                  )}
                  {originalContent && translatedContent && (
                    <option value="side-by-side">
                      {language === 'vi' ? 'Song song' : 'Side-by-side'}
                    </option>
                  )}
                </select>

                {translation && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {translation.targetLanguage.toUpperCase()}
                  </span>
                )}
              </div>
            </>
          )}

          <button
            className="document-control-btn"
            title={language === 'vi' ? 'Thêm' : 'More'}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="document-viewer-content" ref={viewerRef}>
        {renderDocumentContent()}
      </div>

      {/* Text Selection Actions */}
      {selectedText && (
        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-3 flex gap-2 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <button
            onClick={() => createAnnotation('highlight')}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded hover:bg-yellow-200 transition-colors"
          >
            {language === 'vi' ? 'Đánh dấu' : 'Highlight'}
          </button>
          
          <button
            onClick={() => createAnnotation('note')}
            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 transition-colors"
          >
            {language === 'vi' ? 'Ghi chú' : 'Note'}
          </button>
          
          <button
            onClick={() => createAnnotation('question')}
            className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200 transition-colors"
          >
            {language === 'vi' ? 'Câu hỏi' : 'Question'}
          </button>
          
          <button
            onClick={() => setSelectedText('')}
            className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </motion.div>
      )}
    </div>
  )
}