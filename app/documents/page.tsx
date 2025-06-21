'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Footer from '@/components/Footer'
import DocumentUpload from '@/components/documents/DocumentUpload'
import DocumentTranslator from '@/components/documents/DocumentTranslator'
import UniversalDropdown from '@/components/ui/UniversalDropdown'
import { DocumentProcessor, ProcessedDocument } from '@/lib/document-processor'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'

function DocumentsPageContent() {
  const { language } = useLanguage()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedDocument, setProcessedDocument] =
    useState<ProcessedDocument | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('en')
  const [translatedChunks, setTranslatedChunks] = useState<Map<
    string,
    string
  > | null>(null)

  const { user } = useAuth()

  const content = {
    vi: {
      title: 'Dịch Tài Liệu',
      subtitle:
        'Dịch toàn bộ tài liệu của bạn với độ chính xác cao và giữ nguyên định dạng',
      features: [
        'Hỗ trợ PDF, Word, Excel, và nhiều định dạng khác',
        'Dịch hàng loạt với theo dõi tiến độ',
        'Giữ nguyên định dạng và bố cục',
        'Tải xuống bản dịch ngay lập tức',
      ],
      selectLanguages: 'Chọn ngôn ngữ',
      from: 'Từ',
      to: 'Sang',
      autoDetect: 'Tự động phát hiện',
      languages: {
        en: 'Tiếng Anh',
        vi: 'Tiếng Việt',
        es: 'Tiếng Tây Ban Nha',
        fr: 'Tiếng Pháp',
        de: 'Tiếng Đức',
        ja: 'Tiếng Nhật',
        ko: 'Tiếng Hàn',
        zh: 'Tiếng Trung',
      },
      signInRequired: 'Vui lòng đăng nhập để sử dụng tính năng dịch tài liệu',
      signIn: 'Đăng nhập',
      processing: 'Đang xử lý tài liệu...',
      reset: 'Dịch tài liệu khác',
      download: 'Tải xuống',
    },
    en: {
      title: 'Document Translation',
      subtitle:
        'Translate entire documents with high accuracy while preserving formatting',
      features: [
        'Support for PDF, Word, Excel, and more formats',
        'Batch translation with progress tracking',
        'Preserve original formatting and layout',
        'Instant download of translations',
      ],
      selectLanguages: 'Select Languages',
      from: 'From',
      to: 'To',
      autoDetect: 'Auto-detect',
      languages: {
        en: 'English',
        vi: 'Vietnamese',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        ja: 'Japanese',
        ko: 'Korean',
        zh: 'Chinese',
      },
      signInRequired: 'Please sign in to use document translation',
      signIn: 'Sign In',
      processing: 'Processing document...',
      reset: 'Translate another document',
      download: 'Download',
    },
  }

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setIsProcessing(true)

    try {
      const processed = await DocumentProcessor.processFile(file)
      setProcessedDocument(processed)

      // Auto-detect language if set to auto
      if (sourceLang === 'auto' && processed.metadata.language) {
        setSourceLang(processed.metadata.language)
      }
    } catch (error) {
      console.error('Error processing document:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTranslationComplete = (chunks: Map<string, string>) => {
    setTranslatedChunks(chunks)
  }

  const handleDownloadTranslation = async () => {
    if (!processedDocument || !translatedChunks) return

    try {
      const blob = await DocumentProcessor.exportTranslatedDocument(
        processedDocument,
        translatedChunks,
        targetLang
      )

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${processedDocument.fileName.split('.')[0]}_${targetLang}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading translation:', error)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setProcessedDocument(null)
    setTranslatedChunks(null)
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <main className="pt-24 pb-16">
        <motion.div
          className="content-container"
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            variants={motionSafe(slideUp)}
          >
            {/* Documents GIF */}
            <motion.div
              variants={motionSafe(slideUp)}
              className="mb-8 md:mb-12 lg:mb-16"
            >
              <div
                className="hero-gif-container mx-auto"
                style={{ maxWidth: '720px' }}
              >
                <img
                  src="/assets/documents.gif"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="hero-gif w-full"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </div>
            </motion.div>

            <h1 className="heading-1 text-gray-900 mb-4">
              {content[language].title}
            </h1>
            <p className="body-lg text-gray-600 max-w-2xl mx-auto">
              {content[language].subtitle}
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
            variants={motionSafe(slideUp)}
          >
            {content[language].features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="body-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </motion.div>

          {/* Language Selection - Redesigned */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
            variants={motionSafe(slideUp)}
          >
            <h3 className="heading-4 text-gray-900 mb-6">
              {content[language].selectLanguages}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block body-sm font-medium text-gray-700">
                  {content[language].from}
                </label>
                <UniversalDropdown
                  value={sourceLang}
                  onChange={value => setSourceLang(value)}
                  size="lg"
                  options={[
                    { value: 'auto', label: content[language].autoDetect },
                    ...Object.entries(content[language].languages).map(
                      ([code, name]) => ({
                        value: code,
                        label: name as string,
                      })
                    ),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="block body-sm font-medium text-gray-700">
                  {content[language].to}
                </label>
                <UniversalDropdown
                  value={targetLang}
                  onChange={value => setTargetLang(value)}
                  size="lg"
                  options={Object.entries(content[language].languages).map(
                    ([code, name]) => ({
                      value: code,
                      label: name as string,
                    })
                  )}
                />
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          {!user ? (
            <motion.div
              className="text-center py-12"
              variants={motionSafe(slideUp)}
            >
              <p className="body-lg text-gray-600 mb-6">
                {content[language].signInRequired}
              </p>
              <button className="btn-primary btn-pill-compact-md btn-text-safe">
                {content[language].signIn}
              </button>
            </motion.div>
          ) : (
            <>
              {!processedDocument && !isProcessing && (
                <motion.div variants={motionSafe(slideUp)}>
                  <DocumentUpload
                    language={language}
                    onFileSelect={handleFileSelect}
                    isProcessing={isProcessing}
                  />
                </motion.div>
              )}

              {isProcessing && (
                <motion.div
                  className="text-center py-12"
                  variants={motionSafe(slideUp)}
                >
                  <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
                  <p className="body-lg text-gray-600">
                    {content[language].processing}
                  </p>
                </motion.div>
              )}

              {processedDocument && !translatedChunks && (
                <motion.div variants={motionSafe(slideUp)}>
                  <DocumentTranslator
                    document={processedDocument as any}
                    sourceLang={sourceLang}
                    targetLang={targetLang}
                    language={language}
                    onComplete={handleTranslationComplete}
                    onCancel={handleReset}
                  />
                </motion.div>
              )}

              {translatedChunks && (
                <motion.div
                  className="text-center py-12"
                  variants={motionSafe(slideUp)}
                >
                  <svg
                    className="w-24 h-24 text-green-500 mx-auto mb-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="heading-3 text-gray-900 mb-4">
                    {content[language].title} Complete!
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleDownloadTranslation}
                      className="btn-primary"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      {content[language].download}
                    </button>
                    <button onClick={handleReset} className="btn-secondary">
                      {content[language].reset}
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <AuthProvider>
      <DocumentsPageContent />
    </AuthProvider>
  )
}
