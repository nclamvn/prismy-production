'use client'

// NotebookLM-Inspired Unified Workspace
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { motionSafe, slideUp } from '@/lib/motion'
import AuthGuard from '@/components/auth/AuthGuard'
import NotebookLMLayout from '@/components/layouts/NotebookLMLayout'
import SimpleTranslationInterface from '@/components/workspace/SimpleTranslationInterface'
import PerformanceMonitor from '@/components/optimization/PerformanceMonitor'
import { createLazyComponent } from '@/components/optimization/LazyComponentLoader'

// Lazy load supporting components
const ContextualAssistant = createLazyComponent(
  () => import('@/components/workspace/ContextualAssistant')
)

export default function Workspace() {
  const { user } = useAuth()
  const { language } = useSSRSafeLanguage()

  // NotebookLM workspace state
  const [activePanel, setActivePanel] = useState<
    'sources' | 'translate' | 'export'
  >('translate')
  const [uploadedDocument, setUploadedDocument] = useState<any>(null)
  const [translationResult, setTranslationResult] = useState<any>(null)

  // Handle document upload and transformation
  const handleDocumentUpload = (document: any) => {
    setUploadedDocument(document)
    // Auto-switch to translate panel to show DocumentInteractionHub
    setActivePanel('translate')
  }

  // Handle translation completion
  const handleTranslationComplete = (result: any) => {
    setTranslationResult(result)
    // Auto-switch to export panel to show results
    setActivePanel('export')
  }

  // Handle document translation from DocumentInteractionHub
  const handleDocumentTranslate = (options: any) => {
    // TODO: Implement document translation
    console.log('Document translate options:', options)
  }

  // Handle document download
  const handleDocumentDownload = (format: string) => {
    // TODO: Implement document download
    console.log('Download format:', format)
  }

  // Render Sources Panel (Left Panel)
  const renderSourcesPanel = () => (
    <div className="p-4 h-full">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'vi' ? 'Nguồn dữ liệu' : 'Sources'}
        </h3>

        {/* Document Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <div className="space-y-2">
            <div className="text-gray-500">
              {language === 'vi'
                ? 'Kéo thả tài liệu hoặc'
                : 'Drag and drop documents or'}
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => {
                // TODO: Implement file picker
                console.log('File picker not implemented yet')
              }}
            >
              {language === 'vi' ? 'Chọn tệp' : 'Choose Files'}
            </button>
          </div>
        </div>

        {/* Uploaded Documents List */}
        {uploadedDocument && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">
              {language === 'vi' ? 'Tài liệu đã tải' : 'Uploaded Documents'}
            </h4>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                {uploadedDocument.name}
              </div>
              <div className="text-xs text-blue-600">
                {uploadedDocument.type}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Render Export Panel (Right Panel)
  const renderExportPanel = () => (
    <div className="p-4 h-full">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'vi' ? 'Xuất kết quả' : 'Export Results'}
        </h3>

        {translationResult ? (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-900">
                {language === 'vi'
                  ? 'Dịch thuật hoàn thành'
                  : 'Translation Complete'}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {translationResult.translatedText?.length || 0}{' '}
                {language === 'vi' ? 'ký tự' : 'characters'}
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                {language === 'vi' ? 'Tải về TXT' : 'Download TXT'}
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                {language === 'vi' ? 'Tải về DOCX' : 'Download DOCX'}
              </button>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                {language === 'vi' ? 'Tải về PDF' : 'Download PDF'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-sm">
              {language === 'vi'
                ? 'Kết quả dịch thuật sẽ xuất hiện ở đây'
                : 'Translation results will appear here'}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <AuthGuard>
      <PerformanceMonitor
        enableLogging={process.env.NODE_ENV === 'development'}
        threshold={{
          routeChange: 1000,
          componentMount: 500,
          render: 100,
        }}
      >
        <NotebookLMLayout
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          sourcesPanel={renderSourcesPanel()}
          exportPanel={renderExportPanel()}
          uploadedDocument={uploadedDocument}
          onDocumentTranslate={handleDocumentTranslate}
          onDocumentDownload={handleDocumentDownload}
        >
          {/* Middle Panel Content - Translation Interface */}
          <motion.div
            variants={motionSafe(slideUp)}
            initial="hidden"
            animate="visible"
            className="h-full"
          >
            <SimpleTranslationInterface
              variant="clean"
              onTranslationComplete={handleTranslationComplete}
              onDocumentUpload={handleDocumentUpload}
            />
          </motion.div>
        </NotebookLMLayout>

        {/* Contextual AI Assistant - Floating globally */}
        <ContextualAssistant position="bottom-right" />
      </PerformanceMonitor>
    </AuthGuard>
  )
}
