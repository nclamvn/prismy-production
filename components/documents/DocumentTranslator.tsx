'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProcessedDocument, DocumentChunk } from '@/lib/enhanced-document-processor'
import { motionSafe } from '@/lib/motion'

interface DocumentTranslatorProps {
  document: ProcessedDocument
  sourceLang: string
  targetLang: string
  language?: 'vi' | 'en'
  onComplete?: (translations: Map<string, string>) => void
  onCancel?: () => void
}

interface TranslationProgress {
  current: number
  total: number
  percentage: number
  estimatedTimeRemaining: number
  translatedChunks: Map<string, string>
}

export default function DocumentTranslator({
  document,
  sourceLang,
  targetLang,
  language = 'en',
  onComplete,
  onCancel
}: DocumentTranslatorProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState<TranslationProgress>({
    current: 0,
    total: document.chunks.length,
    percentage: 0,
    estimatedTimeRemaining: 0,
    translatedChunks: new Map()
  })
  const [error, setError] = useState<string | null>(null)

  const content = {
    vi: {
      title: 'Đang dịch tài liệu',
      fileName: 'Tệp',
      progress: 'Tiến độ',
      chunksProgress: 'Đoạn văn bản',
      timeRemaining: 'Thời gian còn lại',
      pause: 'Tạm dừng',
      resume: 'Tiếp tục',
      cancel: 'Hủy',
      complete: 'Hoàn thành!',
      error: 'Lỗi khi dịch',
      downloadTranslation: 'Tải xuống bản dịch',
      stats: {
        words: 'từ',
        characters: 'ký tự',
        chunks: 'đoạn'
      }
    },
    en: {
      title: 'Translating Document',
      fileName: 'File',
      progress: 'Progress',
      chunksProgress: 'Chunks',
      timeRemaining: 'Time remaining',
      pause: 'Pause',
      resume: 'Resume',
      cancel: 'Cancel',
      complete: 'Complete!',
      error: 'Translation error',
      downloadTranslation: 'Download Translation',
      stats: {
        words: 'words',
        characters: 'characters',
        chunks: 'chunks'
      }
    }
  }

  useEffect(() => {
    if (!isTranslating && progress.current === 0) {
      startTranslation()
    }
  }, [])

  const startTranslation = async () => {
    setIsTranslating(true)
    setError(null)

    try {
      const translatedChunks = new Map<string, string>()
      const startTime = Date.now()

      for (let i = 0; i < document.chunks.length; i++) {
        const chunk = document.chunks[i]
        
        // Simulate API call - replace with actual translation API
        const translatedText = await translateChunk(chunk, sourceLang, targetLang)
        translatedChunks.set(`chunk-${i}`, translatedText)

        // Update progress
        const current = i + 1
        const percentage = Math.round((current / document.chunks.length) * 100)
        const elapsedTime = (Date.now() - startTime) / 1000
        const averageTimePerChunk = elapsedTime / current
        const remainingChunks = document.chunks.length - current
        const estimatedTimeRemaining = Math.round(averageTimePerChunk * remainingChunks)

        setProgress({
          current,
          total: document.chunks.length,
          percentage,
          estimatedTimeRemaining,
          translatedChunks
        })

        // Check if translation was cancelled
        if (!isTranslating) break
      }

      if (progress.current === document.chunks.length && onComplete) {
        onComplete(translatedChunks)
      }
    } catch (err) {
      setError(content[language].error)
      console.error('Translation error:', err)
    } finally {
      setIsTranslating(false)
    }
  }

  const translateChunk = async (
    chunk: DocumentChunk,
    source: string,
    target: string
  ): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In production, call actual translation API
    // const response = await fetch('/api/translate', {
    //   method: 'POST',
    //   body: JSON.stringify({ text: chunk.text, source, target })
    // })
    
    return `[Translated: ${chunk.content.substring(0, 50)}...]`
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const handleCancel = () => {
    setIsTranslating(false)
    if (onCancel) onCancel()
  }

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      variants={motionSafe({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 }
      })}
      initial="initial"
      animate="animate"
    >
      <div 
        className="p-6"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderRadius: 'var(--mat-card-elevated-container-shape)',
          boxShadow: 'var(--elevation-level-2)',
          border: '1px solid var(--surface-outline)'
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <h3 
            className="mb-2"
            style={{
              fontSize: 'var(--sys-headline-medium-size)',
              lineHeight: 'var(--sys-headline-medium-line-height)',
              fontFamily: 'var(--sys-headline-medium-font)',
              fontWeight: 'var(--sys-headline-medium-weight)',
              color: 'var(--text-primary)'
            }}
          >
            {progress.percentage === 100 ? content[language].complete : content[language].title}
          </h3>
          <div className="space-y-1 text-sm">
            <p 
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)'
              }}
            >
              <span 
                style={{
                  fontWeight: 'var(--sys-label-medium-weight)'
                }}
              >
                {content[language].fileName}:
              </span> {document.metadata.filename}
            </p>
            <p 
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)'
              }}
            >
              {document.metadata.words || 0} {content[language].stats.words} • {' '}
              {document.metadata.characters || 0} {content[language].stats.characters} • {' '}
              {document.chunks.length} {content[language].stats.chunks}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span 
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {content[language].progress}
            </span>
            <span 
              style={{
                fontSize: 'var(--sys-label-medium-size)',
                lineHeight: 'var(--sys-label-medium-line-height)',
                fontFamily: 'var(--sys-label-medium-font)',
                fontWeight: 'var(--sys-label-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {progress.percentage}%
            </span>
          </div>
          <div 
            className="relative h-3 overflow-hidden"
            style={{
              backgroundColor: 'var(--surface-panel)',
              borderRadius: 'var(--shape-corner-full)'
            }}
          >
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{
                background: `linear-gradient(to right, var(--notebooklm-primary), var(--notebooklm-primary-dark))`,
                borderRadius: 'var(--shape-corner-full)'
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div 
            className="p-4"
            style={{
              backgroundColor: 'var(--surface-filled)',
              borderRadius: 'var(--mat-card-outlined-container-shape)'
            }}
          >
            <p 
              className="mb-1"
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)'
              }}
            >
              {content[language].chunksProgress}
            </p>
            <p 
              style={{
                fontSize: 'var(--sys-title-medium-size)',
                lineHeight: 'var(--sys-title-medium-line-height)',
                fontFamily: 'var(--sys-title-medium-font)',
                fontWeight: 'var(--sys-title-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {progress.current} / {progress.total}
            </p>
          </div>
          <div 
            className="p-4"
            style={{
              backgroundColor: 'var(--surface-filled)',
              borderRadius: 'var(--mat-card-outlined-container-shape)'
            }}
          >
            <p 
              className="mb-1"
              style={{
                fontSize: 'var(--sys-body-medium-size)',
                lineHeight: 'var(--sys-body-medium-line-height)',
                fontFamily: 'var(--sys-body-medium-font)',
                fontWeight: 'var(--sys-body-medium-weight)',
                color: 'var(--text-secondary)'
              }}
            >
              {content[language].timeRemaining}
            </p>
            <p 
              style={{
                fontSize: 'var(--sys-title-medium-size)',
                lineHeight: 'var(--sys-title-medium-line-height)',
                fontFamily: 'var(--sys-title-medium-font)',
                fontWeight: 'var(--sys-title-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {formatTime(progress.estimatedTimeRemaining)}
            </p>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--mat-card-outlined-container-shape)'
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p 
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  lineHeight: 'var(--sys-body-medium-line-height)',
                  fontFamily: 'var(--sys-body-medium-font)',
                  fontWeight: 'var(--sys-body-medium-weight)',
                  color: 'rgb(185, 28, 28)'
                }}
              >
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          {progress.percentage === 100 ? (
            <button 
              className="flex-1 flex items-center justify-center transition-all"
              style={{
                backgroundColor: 'var(--notebooklm-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--mat-button-filled-container-shape)',
                height: 'var(--mat-button-filled-container-height)',
                paddingLeft: 'var(--mat-button-filled-horizontal-padding)',
                paddingRight: 'var(--mat-button-filled-horizontal-padding)',
                fontSize: 'var(--sys-label-large-size)',
                lineHeight: 'var(--sys-label-large-line-height)',
                fontFamily: 'var(--sys-label-large-font)',
                fontWeight: 'var(--sys-label-large-weight)',
                boxShadow: 'var(--elevation-level-1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--notebooklm-primary-dark)'
                e.currentTarget.style.boxShadow = 'var(--elevation-level-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--notebooklm-primary)'
                e.currentTarget.style.boxShadow = 'var(--elevation-level-1)'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {content[language].downloadTranslation}
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsTranslating(!isTranslating)}
                className="flex-1 transition-all"
                disabled={progress.percentage === 100}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--notebooklm-primary)',
                  border: `1px solid var(--notebooklm-primary)`,
                  borderRadius: 'var(--mat-button-outlined-container-shape)',
                  height: 'var(--mat-button-outlined-container-height)',
                  paddingLeft: 'var(--mat-button-outlined-horizontal-padding)',
                  paddingRight: 'var(--mat-button-outlined-horizontal-padding)',
                  fontSize: 'var(--sys-label-large-size)',
                  lineHeight: 'var(--sys-label-large-line-height)',
                  fontFamily: 'var(--sys-label-large-font)',
                  fontWeight: 'var(--sys-label-large-weight)',
                  cursor: progress.percentage === 100 ? 'not-allowed' : 'pointer',
                  opacity: progress.percentage === 100 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (progress.percentage !== 100) {
                    e.currentTarget.style.backgroundColor = 'var(--notebooklm-primary-light)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (progress.percentage !== 100) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {isTranslating ? content[language].pause : content[language].resume}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--mat-button-text-container-shape)',
                  height: 'var(--mat-button-text-container-height)',
                  paddingLeft: 'var(--mat-button-text-horizontal-padding)',
                  paddingRight: 'var(--mat-button-text-horizontal-padding)',
                  fontSize: 'var(--sys-label-large-size)',
                  lineHeight: 'var(--sys-label-large-line-height)',
                  fontFamily: 'var(--sys-label-large-font)',
                  fontWeight: 'var(--sys-label-large-weight)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-filled)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {content[language].cancel}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}