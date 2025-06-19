'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProcessedDocument, DocumentChunk } from '@/lib/document-processor'
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
        translatedChunks.set(chunk.id, translatedText)

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
    
    return `[Translated: ${chunk.text.substring(0, 50)}...]`
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="heading-3 text-gray-900 mb-2">
            {progress.percentage === 100 ? content[language].complete : content[language].title}
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">{content[language].fileName}:</span> {document.fileName}
            </p>
            <p className="text-gray-500">
              {document.metadata.wordCount} {content[language].stats.words} • {' '}
              {document.metadata.characterCount} {content[language].stats.characters} • {' '}
              {document.chunks.length} {content[language].stats.chunks}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="body-sm text-gray-700">{content[language].progress}</span>
            <span className="body-sm font-medium text-gray-900">{progress.percentage}%</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="body-sm text-gray-600 mb-1">{content[language].chunksProgress}</p>
            <p className="heading-4 text-gray-900">
              {progress.current} / {progress.total}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="body-sm text-gray-600 mb-1">{content[language].timeRemaining}</p>
            <p className="heading-4 text-gray-900">
              {formatTime(progress.estimatedTimeRemaining)}
            </p>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="body-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          {progress.percentage === 100 ? (
            <button className="btn-primary flex-1">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {content[language].downloadTranslation}
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsTranslating(!isTranslating)}
                className="btn-secondary flex-1"
                disabled={progress.percentage === 100}
              >
                {isTranslating ? content[language].pause : content[language].resume}
              </button>
              <button
                onClick={handleCancel}
                className="btn-ghost flex-1"
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