'use client'

import React, { useState, useEffect } from 'react'
import NotebookLMLayout from '@/components/layouts/NotebookLMLayout'
import MobileNotebookLMLayout from '@/components/layouts/MobileNotebookLMLayout'
import SimpleTranslationInterface from '@/components/workspace/SimpleTranslationInterface'
import SourcesPanel from '@/components/panels/SourcesPanel'
import ExportPanel from '@/components/panels/ExportPanel'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'

/**
 * NOTEBOOKLM-INSPIRED WORKSPACE V2
 * Clean, professional 3-panel interface
 * Testing ground for new design system
 */
export default function WorkspaceV2Page() {
  const { language } = useSSRSafeLanguage()
  const [activePanel, setActivePanel] = useState<
    'sources' | 'translate' | 'export'
  >('translate')
  const [exportData, setExportData] = useState<any>(null)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleTranslationComplete = (result: any) => {
    console.log('Translation completed:', result)
    console.log('🐛 DEBUG: Translation result received:', result)
    // Populate export data
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
  }

  const handleTextExtracted = (text: string, document: any) => {
    console.log('Text extracted from document:', document.name)
    setSelectedDocument(document)
    // Auto-populate translation interface with extracted text
  }

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

  // Mobile layout for screens < 1024px
  if (isMobile) {
    return (
      <NotebookLMLayout
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        sourcesPanel={
          <MobileNotebookLMLayout
            activePanel={activePanel}
            sourcesPanel={
              <SourcesPanel
                onDocumentSelect={setSelectedDocument}
                onTextExtracted={handleTextExtracted}
              />
            }
            translatePanel={
              <div className="h-full flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {language === 'vi' ? 'Dịch Thuật AI' : 'AI Translation'}
                  </h2>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <SimpleTranslationInterface
                    variant="clean"
                    className="max-w-none"
                    onTranslationComplete={handleTranslationComplete}
                  />
                </div>
              </div>
            }
            exportPanel={
              <ExportPanel
                exportData={exportData}
                onDownload={handleDownload}
              />
            }
          />
        }
      >
        {/* Empty - Mobile uses MobileNotebookLMLayout */}
      </NotebookLMLayout>
    )
  }

  // Desktop layout
  return (
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
    >
      {/* Enhanced Translation Interface */}
      <div className="h-full flex flex-col">
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'vi' ? 'Dịch Thuật AI' : 'AI Translation'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {language === 'vi'
              ? 'Dịch văn bản và tài liệu với độ chính xác cao'
              : 'Translate text and documents with high accuracy'}
          </p>
        </div>

        {/* Translation Interface */}
        <div className="flex-1 overflow-auto p-6">
          <SimpleTranslationInterface
            variant="clean"
            className="max-w-none"
            onTranslationComplete={handleTranslationComplete}
          />
        </div>

        {/* Quick Actions Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {language === 'vi' ? 'Dịch vụ hoạt động' : 'Service operational'}
            </div>
            <div className="text-gray-400">•</div>
            <div>
              {language === 'vi' ? 'Độ chính xác 99.9%' : '99.9% accuracy'}
            </div>
            <div className="text-gray-400">•</div>
            <div>{language === 'vi' ? '150+ ngôn ngữ' : '150+ languages'}</div>
          </div>
        </div>
      </div>
    </NotebookLMLayout>
  )
}
