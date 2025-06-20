'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProcessedDocument, DocumentChunk } from '@/lib/enhanced-document-processor'
import { useGestures, getGestureCss, isTouchDevice } from '@/src/hooks/useGestures'

interface MobileDocumentViewerProps {
  document: ProcessedDocument
  onChunkSelect?: (chunk: DocumentChunk) => void
  onTranslateChunk?: (chunk: DocumentChunk) => void
  className?: string
}

export default function MobileDocumentViewer({
  document,
  onChunkSelect,
  onTranslateChunk,
  className = ''
}: MobileDocumentViewerProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentChunk = document.chunks[currentChunkIndex]
  const hasMultipleChunks = document.chunks.length > 1

  // Auto-hide controls after interaction
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  // Handle gesture events
  const { ref: gestureRef } = useGestures({
    // Swipe between chunks
    onSwipe: (gesture) => {
      if (!hasMultipleChunks) return
      
      if (gesture.direction === 'left' && currentChunkIndex < document.chunks.length - 1) {
        setCurrentChunkIndex(prev => prev + 1)
      } else if (gesture.direction === 'right' && currentChunkIndex > 0) {
        setCurrentChunkIndex(prev => prev - 1)
      }
      resetControlsTimeout()
    },

    // Pinch to zoom
    onPinch: (gesture) => {
      const newScale = Math.max(0.5, Math.min(3, gesture.scale))
      setScale(newScale)
      resetControlsTimeout()
    },

    // Pan to move content when zoomed
    onPan: (state) => {
      if (scale > 1) {
        setTranslateX(state.deltaX)
        setTranslateY(state.deltaY)
      }
    },

    onPanEnd: () => {
      // Smooth return to center if not significantly moved
      if (Math.abs(translateX) < 50 && Math.abs(translateY) < 50) {
        setTranslateX(0)
        setTranslateY(0)
      }
    },

    // Tap to show/hide controls
    onTap: () => {
      setShowControls(prev => !prev)
      resetControlsTimeout()
    },

    // Double tap to zoom
    onDoubleTap: () => {
      if (scale === 1) {
        setScale(2)
      } else {
        setScale(1)
        setTranslateX(0)
        setTranslateY(0)
      }
      resetControlsTimeout()
    },

    // Long press to translate chunk
    onLongPress: () => {
      if (onTranslateChunk && currentChunk) {
        onTranslateChunk(currentChunk)
      }
      resetControlsTimeout()
    }
  }, {
    swipeThreshold: 50,
    velocityThreshold: 0.3,
    longPressDelay: 800,
    preventDefault: true
  })

  // Navigation functions
  const goToNextChunk = () => {
    if (currentChunkIndex < document.chunks.length - 1) {
      setCurrentChunkIndex(prev => prev + 1)
    }
  }

  const goToPrevChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(prev => prev - 1)
    }
  }

  const resetView = () => {
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
  }

  const toggleFullscreen = () => {
    if (!globalThis.document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      globalThis.document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!globalThis.document.fullscreenElement)
    }

    globalThis.document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      globalThis.document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  // Initialize controls timeout
  useEffect(() => {
    resetControlsTimeout()
  }, [])

  // Combine refs
  useEffect(() => {
    if (containerRef.current && gestureRef.current !== containerRef.current) {
      // @ts-ignore
      gestureRef.current = containerRef.current
    }
  }, [gestureRef])

  const getFileIcon = (type: string) => {
    if (type.includes('word')) return '📄'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️'
    if (type.includes('pdf')) return '📕'
    if (type.includes('image')) return '🖼️'
    return '📋'
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-screen bg-black text-white overflow-hidden ${className}`}
      style={getGestureCss()}
    >
      {/* Document Content */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        style={{
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transition: scale === 1 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        <div className="max-w-4xl w-full">
          {/* Document Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-3xl mr-2">{getFileIcon(document.metadata.type)}</span>
              <h1 className="text-xl font-semibold truncate">{document.metadata.filename}</h1>
            </div>
            {hasMultipleChunks && (
              <p className="text-sm text-gray-400">
                Section {currentChunkIndex + 1} of {document.chunks.length}
              </p>
            )}
          </div>

          {/* Current Chunk Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChunkIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900 rounded-lg p-6 border border-gray-700"
            >
              {currentChunk?.page && (
                <div className="text-xs text-gray-500 mb-3">
                  Page {currentChunk.page}
                  {currentChunk.confidence && (
                    <span className="ml-2">
                      Confidence: {Math.round(currentChunk.confidence * 100)}%
                    </span>
                  )}
                </div>
              )}
              
              <div className="text-base leading-relaxed">
                {currentChunk?.content || 'No content available'}
              </div>

              {currentChunk && onTranslateChunk && (
                <button
                  onClick={() => onTranslateChunk(currentChunk)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Translate This Section
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <>
            {/* Top Controls */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 bg-black/50 rounded-lg backdrop-blur-sm"
                >
                  ← Back
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-300">
                    {document.metadata.words?.toLocaleString() || 0} words
                  </p>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-black/50 rounded-lg backdrop-blur-sm"
                >
                  {isFullscreen ? '⤧' : '⤢'}
                </button>
              </div>
            </motion.div>

            {/* Bottom Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4"
            >
              <div className="flex items-center justify-between">
                {/* Navigation */}
                {hasMultipleChunks && (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={goToPrevChunk}
                      disabled={currentChunkIndex === 0}
                      className="p-3 bg-black/50 rounded-lg backdrop-blur-sm disabled:opacity-50"
                    >
                      ← Prev
                    </button>
                    
                    <div className="text-sm text-gray-300">
                      {currentChunkIndex + 1} / {document.chunks.length}
                    </div>
                    
                    <button
                      onClick={goToNextChunk}
                      disabled={currentChunkIndex === document.chunks.length - 1}
                      className="p-3 bg-black/50 rounded-lg backdrop-blur-sm disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                )}

                {/* Zoom Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                    className="p-2 bg-black/50 rounded-lg backdrop-blur-sm"
                  >
                    −
                  </button>
                  
                  <span className="text-sm text-gray-300 min-w-[3rem] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  
                  <button
                    onClick={() => setScale(Math.min(3, scale + 0.25))}
                    className="p-2 bg-black/50 rounded-lg backdrop-blur-sm"
                  >
                    +
                  </button>
                  
                  {scale !== 1 && (
                    <button
                      onClick={resetView}
                      className="p-2 bg-black/50 rounded-lg backdrop-blur-sm"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Gesture Hints */}
      {isTouchDevice() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 0.7 : 0 }}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 text-center"
        >
          <p>Swipe left/right • Pinch to zoom • Tap to toggle controls</p>
          <p>Long press to translate • Double tap to zoom</p>
        </motion.div>
      )}
    </div>
  )
}