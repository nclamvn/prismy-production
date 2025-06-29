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
import SourcesPanel from '@/components/panels/SourcesPanel'
import ExportPanel from '@/components/panels/ExportPanel'
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
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [exportData, setExportData] = useState<any>(null)

  // Handle text extracted from documents
  const handleTextExtracted = (text: string, document: any) => {
    console.log('Text extracted from document:', document.name)
    setSelectedDocument(document)
    setUploadedDocument(document)
    // Auto-switch to translate panel to show DocumentInteractionHub
    setActivePanel('translate')
  }

  // Handle translation completion
  const handleTranslationComplete = (result: any) => {
    console.log('Translation completed:', result)
    // Populate export data
    console.log('🐛 DEBUG: Translation result received:', result)
    setExportData({
      originalText: result.original || '',
      translatedText: result.translated || '',
      sourceLanguage: result.sourceLang || 'auto',
      targetLanguage: result.targetLang || 'vi',
      timestamp: new Date(),
      qualityScore: 0.95,
      processingTime: result.processingTime || 1200,
    })
    console.log('🐛 DEBUG: Export data set:', {
      originalText: result.original || '',
      translatedText: result.translated || '',
      sourceLanguage: result.sourceLang || 'auto',
      targetLanguage: result.targetLang || 'vi',
    })
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

  // Handle export download
  const handleDownload = async (format: string, options: any) => {
    if (!exportData) {
      console.error('No export data available')
      return
    }

    try {
      const {
        exportAsText,
        exportAsDocx,
        exportAsJson,
        exportAsPdf,
        downloadFile,
        generateFilename,
      } = await import('@/lib/export-utils')

      const filename = generateFilename(
        'translation',
        exportData.sourceLanguage,
        exportData.targetLanguage,
        format
      )

      switch (format) {
        case 'txt':
          const textContent = exportAsText(exportData, options.includeMetadata)
          downloadFile(textContent, filename, 'text/plain')
          break

        case 'docx':
          const docxBlob = await exportAsDocx(
            exportData,
            options.includeMetadata
          )
          downloadFile(
            docxBlob,
            filename,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          )
          break

        case 'json':
          const jsonContent = exportAsJson(exportData, options.includeMetadata)
          downloadFile(jsonContent, filename, 'application/json')
          break

        case 'pdf':
          const pdfBlob = exportAsPdf(exportData, options.includeMetadata)
          downloadFile(pdfBlob, filename, 'application/pdf')
          break

        default:
          console.error('Unsupported export format:', format)
          return
      }

      console.log(`File downloaded: ${filename}`)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

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
          sourcesPanel={
            <SourcesPanel
              onDocumentSelect={setSelectedDocument}
              onTextExtracted={handleTextExtracted}
            />
          }
          exportPanel={
            <ExportPanel exportData={exportData} onDownload={handleDownload} />
          }
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
            />
          </motion.div>
        </NotebookLMLayout>

        {/* Contextual AI Assistant - Floating globally */}
        <ContextualAssistant position="bottom-right" />
      </PerformanceMonitor>
    </AuthGuard>
  )
}
