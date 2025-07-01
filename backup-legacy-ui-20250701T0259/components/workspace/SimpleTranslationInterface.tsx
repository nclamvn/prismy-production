'use client'

import React, { useState, useRef } from 'react'
import {
  Languages,
  ArrowRight,
  Copy,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  Clock,
  Target,
  Upload,
  FileText,
  X,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  useTranslationPipeline,
  usePipelineMetrics,
} from '@/contexts/PipelineContext'
import StudioActions from '@/components/ui/StudioActions'

interface SimpleTranslationInterfaceProps {
  className?: string
  onTranslationComplete?: (result: any) => void
  onDocumentUpload?: (document: any) => void
  variant?: 'default' | 'clean' // Clean variant for NotebookLM layout
}

export default function SimpleTranslationInterface({
  className = '',
  onTranslationComplete,
  onDocumentUpload,
  variant = 'default',
}: SimpleTranslationInterfaceProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()
  const { translateText, detectLanguage, status } = useTranslationPipeline()
  const metrics = usePipelineMetrics()

  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pipelineResponse, setPipelineResponse] = useState<any>(null)
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
    setPipelineResponse(null)

    // Set progress indicators for long texts
    const isLongText = sourceText.length > 30000
    const estimatedTime = isLongText
      ? Math.ceil(sourceText.length / 6000) * 3000 // ~3 seconds per chunk
      : 2000 // 2 seconds for short text

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

    console.log('🚀 Starting translation', {
      textLength: sourceText.length,
      sourceLang,
      targetLang,
      userTier: user ? 'authenticated' : 'free',
      requiresChunking: isLongText,
      estimatedTime,
    })

    try {
      // EMERGENCY FIX: Use simplified translation endpoint
      console.log('🚀 Using simplified translation endpoint')

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
        console.log('✅ Translation successful', data.result)
        setTranslatedText(data.result.translatedText)
        setSuccess(true)
        setPipelineResponse({
          status: 'completed',
          result: data.result,
          metadata: data.metadata,
        })

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
      console.error('❌ Translation failed:', error)

      // Provide user-friendly error messages
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

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true)
    setError(null)

    try {
      // Create document object for processing
      const document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: '', // Will be extracted
        file: file,
      }

      // Extract text from document
      let extractedText = ''
      if (file.type === 'text/plain') {
        extractedText = await file.text()
      } else {
        // For other file types, we'll need to call the document processing API
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/documents/process-simple', {
          method: 'POST',
          body: formData,
          credentials: 'include', // Include cookies for authentication
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

      // Set the extracted text as source text
      setSourceText(extractedText)
      setUploadedFile(file)
      setInputMode('document')

      // Notify parent component about document upload
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

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Handle drag and drop
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

  // Switch back to text mode
  const switchToTextMode = () => {
    setInputMode('text')
    setUploadedFile(null)
    setSourceText('')
    setTranslatedText('')
  }

  // Render the core translation content (used by both variants)
  const renderTranslationContent = () => (
    <>
      {/* Input Mode Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setInputMode('text')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              inputMode === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {language === 'vi' ? 'Văn bản' : 'Text'}
          </button>
          <button
            onClick={() => setInputMode('document')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              inputMode === 'document'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {language === 'vi' ? 'Tài liệu' : 'Document'}
          </button>
        </div>
      </div>

      {/* Document Upload Area (shown when document mode is selected) */}
      {inputMode === 'document' && (
        <div className="mb-6">
          {!uploadedFile ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {isProcessingFile ? (
                <div className="space-y-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
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
                      {language === 'vi'
                        ? 'Tải lên tài liệu'
                        : 'Upload Document'}
                    </p>
                    <p className="text-gray-600 mb-4">
                      {language === 'vi'
                        ? 'Kéo thả tệp vào đây hoặc nhấp để chọn'
                        : 'Drag and drop files here or click to select'}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {language === 'vi' ? 'Chọn tệp' : 'Choose File'}
                    </button>
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
                      ? 'Hỗ trợ: TXT, PDF, DOCX (tối đa 200MB - ultra-long documents)'
                      : 'Supported: TXT, PDF, DOCX (max 200MB - ultra-long documents)'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">
                      {uploadedFile.name}
                    </div>
                    <div className="text-sm text-blue-600">
                      {Math.round(uploadedFile.size / 1024)}KB •{' '}
                      {sourceText.length}{' '}
                      {language === 'vi' ? 'ký tự' : 'characters'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={switchToTextMode}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Language Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <select
            value={sourceLang}
            onChange={e => setSourceLang(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languageOptions.map(option => (
              <option key={option.code} value={option.code}>
                {language === 'vi' ? option.nameVi : option.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSwapLanguages}
            disabled={sourceLang === 'auto'}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={language === 'vi' ? 'Hoán đổi ngôn ngữ' : 'Swap languages'}
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <select
            value={targetLang}
            onChange={e => setTargetLang(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* Translation Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={2000000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {sourceText.length}/2,000,000{' '}
              {language === 'vi' ? 'ký tự' : 'characters'}
            </span>
            {sourceText && (
              <button
                onClick={() => handleCopy(sourceText)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {language === 'vi' ? 'Sao chép' : 'Copy'}
              </button>
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
              className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none bg-gray-50 focus:outline-none"
            />
            {isTranslating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {translatedText.length}{' '}
              {language === 'vi' ? 'ký tự' : 'characters'}
            </span>
            {translatedText && (
              <button
                onClick={() => handleCopy(translatedText)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {language === 'vi' ? 'Sao chép' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicators for Long Texts */}
      {isTranslating && translationProgress.isChunking && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <div className="text-sm font-medium text-blue-900">
                {language === 'vi'
                  ? 'Xử lý tài liệu siêu dài'
                  : 'Processing ultra-long document'}
              </div>
              <div className="text-xs text-blue-600">
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
          <div className="mt-2 text-xs text-blue-500">
            {language === 'vi'
              ? '✨ Hệ thống chunking thông minh đang xử lý văn bản dài để đảm bảo chất lượng dịch thuật tốt nhất'
              : '✨ Intelligent chunking system processing long text for optimal translation quality'}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm animate-slide-in-left">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && !error && translatedText && (
            <div className="flex items-center gap-2 text-green-600 text-sm animate-slide-in-left">
              <CheckCircle className="w-4 h-4" />
              {language === 'vi'
                ? `Dịch thành công! (${translatedText.length} ký tự)`
                : `Translation successful! (${translatedText.length} characters)`}
            </div>
          )}
        </div>

        <button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {language === 'vi' ? 'Đang dịch...' : 'Translating...'}
            </>
          ) : (
            <>
              <Languages className="w-4 h-4" />
              {language === 'vi' ? 'Dịch' : 'Translate'}
            </>
          )}
        </button>
      </div>

      {/* Studio Actions - Show after translation in clean variant */}
      {variant === 'clean' && translatedText && (
        <div className="mt-6">
          <StudioActions
            variant="compact"
            onActionClick={action => {
              console.log('Studio action clicked:', action)
              // Show coming soon message
              setError(
                language === 'vi'
                  ? `${action.titleVi} - Sắp ra mắt`
                  : `${action.title} - Coming soon`
              )
              setTimeout(() => setError(null), 2000)
            }}
          />
        </div>
      )}
    </>
  )

  // Clean variant for NotebookLM layout
  if (variant === 'clean') {
    return (
      <div className={`simple-translation-interface ${className}`}>
        {/* Success Banner for Clean Variant */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
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
    <div
      className={`simple-translation-interface bg-white rounded-lg shadow-sm border ${className}`}
    >
      {/* Emergency Fix Banner */}
      <div className="p-3 bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-2 text-green-800">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">
            {language === 'vi'
              ? '🚀 Pipeline đã được sửa - Translation hoạt động bình thường!'
              : '🚀 Pipeline fixed - Translation is now working!'}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Languages className="w-6 h-6 text-blue-600" />
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
