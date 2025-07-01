'use client'

import { useState, useEffect } from 'react'
import { ProcessedDocument, DocumentChunk } from '@/lib/enhanced-document-processor'

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
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg border">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 animate-fadeInUp">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {progress.percentage === 100 ? content[language].complete : content[language].title}
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">{content[language].fileName}:</span> {document.metadata.filename}
            </p>
            <p className="text-gray-600">
              {document.metadata.words || 0} {content[language].stats.words} • {' '}
              {document.metadata.characters || 0} {content[language].stats.characters} • {' '}
              {document.chunks.length} {content[language].stats.chunks}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 animate-slideUp">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {content[language].progress}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {progress.percentage}%
            </span>
          </div>
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 animate-fadeIn">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              {content[language].chunksProgress}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {progress.current} / {progress.total}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              {content[language].timeRemaining}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTime(progress.estimatedTimeRemaining)}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeInUp">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 animate-fadeInUp">
          {progress.percentage === 100 ? (
            <button className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {content[language].downloadTranslation}
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsTranslating(!isTranslating)}
                className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                disabled={progress.percentage === 100}
              >
                {isTranslating ? content[language].pause : content[language].resume}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {content[language].cancel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
