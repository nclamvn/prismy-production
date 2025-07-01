'use client'

import React, { useState, useRef } from 'react'
import {
  Languages,
  ArrowRight,
  Copy,
  Upload,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface SimpleTranslationInterfaceProps {
  className?: string
  onTranslationComplete?: (result: any) => void
  onDocumentUpload?: (document: any) => void
  variant?: 'default' | 'clean'
}

export default function SimpleTranslationInterface({
  className = '',
  onTranslationComplete,
  onDocumentUpload,
  variant = 'default',
}: SimpleTranslationInterfaceProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()

  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [translationProgress, setTranslationProgress] = useState<{
    isChunking: boolean
    estimatedTime?: number
    currentStage?: string
  }>({ isChunking: false })

  // Document upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [inputMode, setInputMode] = useState<'text' | 'document'>('text')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Language options for translation
  const languageOptions = [
    { code: 'auto', name: 'Auto-detect', nameVi: 'Tự động nhận dạng' },
    { code: 'en', name: 'English', nameVi: 'Tiếng Anh' },
    { code: 'vi', name: 'Vietnamese', nameVi: 'Tiếng Việt' },
    { code: 'zh', name: 'Chinese', nameVi: 'Tiếng Trung' },
    { code: 'ja', name: 'Japanese', nameVi: 'Tiếng Nhật' },
    { code: 'ko', name: 'Korean', nameVi: 'Tiếng Hàn' },
    { code: 'fr', name: 'French', nameVi: 'Tiếng Pháp' },
    { code: 'de', name: 'German', nameVi: 'Tiếng Đức' },
    { code: 'es', name: 'Spanish', nameVi: 'Tiếng Tây Ban Nha' },
    { code: 'th', name: 'Thai', nameVi: 'Tiếng Thái' },
  ]

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError(
        language === 'vi'
          ? 'Vui lòng nhập văn bản cần dịch'
          : 'Please enter text to translate'
      )
      return
    }

    setIsTranslating(true)
    setError(null)
    setSuccess(false)

    // Set progress indicators for long texts
    const isLongText = sourceText.length > 30000
    const estimatedTime = isLongText
      ? Math.ceil(sourceText.length / 6000) * 3000
      : 2000

    if (isLongText) {
      setTranslationProgress({
        isChunking: true,
        estimatedTime,
        currentStage:
          language === 'vi'
            ? 'Đang chia nhỏ văn bản dài...'
            : 'Chunking long text...',
      })
    } else {
      setTranslationProgress({
        isChunking: false,
        currentStage: language === 'vi' ? 'Đang dịch...' : 'Translating...',
      })
    }

    try {
      const response = await fetch('/api/translate/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
          targetLang: targetLang,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success && data.result) {
        setTranslatedText(data.result.translatedText)
        setSuccess(true)

        if (onTranslationComplete) {
          onTranslationComplete({
            ...data.result,
            original: sourceText,
            translated: data.result.translatedText,
            sourceLang: data.result.detectedSourceLanguage || sourceLang,
            targetLang: targetLang,
            processingTime: data.metadata?.processingTime || 200,
          })
        }
      } else {
        throw new Error(data.error || 'Translation failed')
      }
    } catch (error) {
      let userMessage =
        language === 'vi' ? 'Dịch thuật thất bại' : 'Translation failed'

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          userMessage =
            language === 'vi'
              ? 'Lỗi cấu hình API. Vui lòng thử lại sau.'
              : 'API configuration error. Please try again later.'
        } else if (error.message.includes('quota')) {
          userMessage =
            language === 'vi'
              ? 'Đã vượt quá giới hạn dịch thuật. Vui lòng thử lại sau.'
              : 'Translation quota exceeded. Please try again later.'
        } else if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          userMessage =
            language === 'vi'
              ? 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.'
              : 'Network error. Please check your connection and try again.'
        } else {
          userMessage = error.message
        }
      }

      setError(userMessage)
    } finally {
      setIsTranslating(false)
      setTranslationProgress({ isChunking: false })
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleSwapLanguages = () => {
    if (sourceLang !== 'auto') {
      setSourceLang(targetLang)
      setTargetLang(sourceLang)
      setSourceText(translatedText)
      setTranslatedText('')
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true)
    setError(null)

    try {
      const document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: '',
        file: file,
      }

      let extractedText = ''
      if (file.type === 'text/plain') {
        extractedText = await file.text()
      } else {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/documents/process-simple', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          if (response.status === 401) {
            throw new Error(
              language === 'vi'
                ? 'Vui lòng đăng nhập để xử lý tài liệu'
                : 'Please sign in to process documents'
            )
          }
          throw new Error(errorData?.error || 'Document processing failed')
        }

        const result = await response.json()
        extractedText = result.extractedText || ''
        document.content = extractedText
        document.id = result.documentId || document.id
      }

      setSourceText(extractedText)
      setUploadedFile(file)
      setInputMode('document')

      if (onDocumentUpload) {
        onDocumentUpload({
          ...document,
          content: extractedText,
        })
      }
    } catch (error) {
      console.error('File upload error:', error)
      setError(
        language === 'vi'
          ? 'Lỗi xử lý tệp. Vui lòng thử lại.'
          : 'File processing error. Please try again.'
      )
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const switchToTextMode = () => {
    setInputMode('text')
    setUploadedFile(null)
    setSourceText('')
    setTranslatedText('')
  }

  const renderTranslationContent = () => (
    <div className="space-y-6">
      {/* Input Mode Selector */}
      <div className="flex items-center gap-2">
        <Button
          variant={inputMode === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setInputMode('text')}
        >
          {language === 'vi' ? 'Văn bản' : 'Text'}
        </Button>
        <Button
          variant={inputMode === 'document' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setInputMode('document')}
        >
          {language === 'vi' ? 'Tài liệu' : 'Document'}
        </Button>
      </div>

      {/* Document Upload Area */}
      {inputMode === 'document' && (
        <div>
          {!uploadedFile ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {isProcessingFile ? (
                <div className="space-y-4">
                  <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
                  <div className="text-gray-600">
                    {language === 'vi'
                      ? 'Đang xử lý tài liệu...'
                      : 'Processing document...'}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {language === 'vi' ? 'Tải lên tài liệu' : 'Upload Document'}
                    </p>
                    <p className="text-gray-600 mb-4">
                      {language === 'vi'
                        ? 'Kéo thả tệp vào đây hoặc nhấp để chọn'
                        : 'Drag and drop files here or click to select'}
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      {language === 'vi' ? 'Chọn tệp' : 'Choose File'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.docx,.doc"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {language === 'vi'
                      ? 'Hỗ trợ: TXT, PDF, DOCX (tối đa 200MB)'
                      : 'Supported: TXT, PDF, DOCX (max 200MB)'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-accent" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {uploadedFile.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Math.round(uploadedFile.size / 1024)}KB •{' '}
                      {sourceText.length}{' '}
                      {language === 'vi' ? 'ký tự' : 'characters'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchToTextMode}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Language Selector */}
      <div className="flex items-center gap-4">
        <select
          value={sourceLang}
          onChange={e => setSourceLang(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          {languageOptions.map(option => (
            <option key={option.code} value={option.code}>
              {language === 'vi' ? option.nameVi : option.name}
            </option>
          ))}
        </select>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSwapLanguages}
          disabled={sourceLang === 'auto'}
          className="h-8 w-8"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>

        <select
          value={targetLang}
          onChange={e => setTargetLang(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          {languageOptions
            .filter(option => option.code !== 'auto')
            .map(option => (
              <option key={option.code} value={option.code}>
                {language === 'vi' ? option.nameVi : option.name}
              </option>
            ))}
        </select>
      </div>

      {/* Translation Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'vi' ? 'Văn bản gốc' : 'Source text'}
          </label>
          <textarea
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder={
              language === 'vi'
                ? 'Nhập văn bản cần dịch...'
                : 'Enter text to translate...'
            }
            className="w-full h-40 p-3 border border-gray-300 rounded-button resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            maxLength={2000000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {sourceText.length}/2,000,000{' '}
              {language === 'vi' ? 'ký tự' : 'characters'}
            </span>
            {sourceText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(sourceText)}
                className="text-xs h-6"
              >
                <Copy className="w-3 h-3 mr-1" />
                {language === 'vi' ? 'Sao chép' : 'Copy'}
              </Button>
            )}
          </div>
        </div>

        {/* Translated Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'vi' ? 'Bản dịch' : 'Translation'}
          </label>
          <div className="relative">
            <textarea
              value={translatedText}
              readOnly
              placeholder={
                language === 'vi'
                  ? 'Bản dịch sẽ xuất hiện ở đây...'
                  : 'Translation will appear here...'
              }
              className="w-full h-40 p-3 border border-gray-300 rounded-button resize-none bg-gray-50 focus:outline-none"
            />
            {isTranslating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-button">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {translatedText.length}{' '}
              {language === 'vi' ? 'ký tự' : 'characters'}
            </span>
            {translatedText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(translatedText)}
                className="text-xs h-6"
              >
                <Copy className="w-3 h-3 mr-1" />
                {language === 'vi' ? 'Sao chép' : 'Copy'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicators for Long Texts */}
      {isTranslating && translationProgress.isChunking && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {language === 'vi'
                  ? 'Xử lý tài liệu siêu dài'
                  : 'Processing ultra-long document'}
              </div>
              <div className="text-xs text-gray-600">
                {translationProgress.currentStage}
                {translationProgress.estimatedTime && (
                  <span className="ml-2">
                    ({language === 'vi' ? 'Ước tính' : 'Est.'}:{' '}
                    {Math.ceil(translationProgress.estimatedTime / 1000)}s)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && !error && translatedText && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              {language === 'vi'
                ? `Dịch thành công! (${translatedText.length} ký tự)`
                : `Translation successful! (${translatedText.length} characters)`}
            </div>
          )}
        </div>

        <Button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          loading={isTranslating}
        >
          {isTranslating ? (
            language === 'vi' ? 'Đang dịch...' : 'Translating...'
          ) : (
            <>
              <Languages className="w-4 h-4 mr-2" />
              {language === 'vi' ? 'Dịch' : 'Translate'}
            </>
          )}
        </Button>
      </div>
    </div>
  )

  // Clean variant for NotebookLM layout
  if (variant === 'clean') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Success Banner for Clean Variant */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === 'vi'
                ? '✅ Translation pipeline is working perfectly!'
                : '✅ Translation pipeline is working perfectly!'}
            </span>
          </div>
        </div>
        {renderTranslationContent()}
      </div>
    )
  }

  // Default variant with container
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Languages className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-semibold text-gray-900">
            {language === 'vi' ? 'Dịch Thuật Nhanh' : 'Quick Translation'}
          </h2>
        </div>
      </div>

      {/* Translation Content */}
      <div className="p-6">{renderTranslationContent()}</div>
    </div>
  )
}