'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import AdvancedDocumentUpload from '@/components/documents/AdvancedDocumentUpload'
import DocumentTranslator from '@/components/documents/DocumentTranslator'
import { ProcessedDocument } from '@/lib/enhanced-document-processor'

export default function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null)
  const [translationSettings, setTranslationSettings] = useState({
    sourceLang: 'auto',
    targetLang: 'vi'
  })
  const [isTranslating, setIsTranslating] = useState(false)

  const handleDocumentProcessed = (document: ProcessedDocument) => {
    setSelectedDocument(document)
  }

  const handleBatchCompleted = (documents: ProcessedDocument[]) => {
    console.log('Batch processing completed:', documents.length, 'documents')
    // For now, select the first document
    if (documents.length > 0) {
      setSelectedDocument(documents[0])
    }
  }

  const handleStartTranslation = () => {
    if (selectedDocument) {
      setIsTranslating(true)
    }
  }

  const handleTranslationComplete = (translations: Map<string, string>) => {
    console.log('Translation completed:', translations.size, 'chunks translated')
    setIsTranslating(false)
    // Handle completed translations
  }

  const handleTranslationCancel = () => {
    setIsTranslating(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Translation</h1>
          <p className="text-gray-600">
            Upload and translate documents with advanced AI processing
          </p>
        </motion.div>

        {!isTranslating ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
                <AdvancedDocumentUpload
                  onDocumentProcessed={handleDocumentProcessed}
                  onBatchCompleted={handleBatchCompleted}
                  maxFiles={5}
                  maxFileSize={100 * 1024 * 1024} // 100MB
                  showPreview={true}
                />
              </motion.div>
            </div>

            {/* Settings Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Translation Settings */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source Language
                      </label>
                      <select
                        value={translationSettings.sourceLang}
                        onChange={(e) => setTranslationSettings(prev => ({ ...prev, sourceLang: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      >
                        <option value="auto">Auto-detect</option>
                        <option value="en">English</option>
                        <option value="vi">Vietnamese</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="es">Spanish</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Language
                      </label>
                      <select
                        value={translationSettings.targetLang}
                        onChange={(e) => setTranslationSettings(prev => ({ ...prev, targetLang: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      >
                        <option value="vi">Vietnamese</option>
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="es">Spanish</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>

                    {selectedDocument && (
                      <button
                        onClick={handleStartTranslation}
                        className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Start Translation
                      </button>
                    )}
                  </div>
                </div>

                {/* Document Info */}
                {selectedDocument && (
                  <div className="bg-white rounded-lg border shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Document</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium truncate ml-2">{selectedDocument.metadata.filename}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span>{selectedDocument.metadata.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Size:</span>
                        <span>{Math.round(selectedDocument.metadata.size / 1024)} KB</span>
                      </div>
                      {selectedDocument.metadata.pages && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pages:</span>
                          <span>{selectedDocument.metadata.pages}</span>
                        </div>
                      )}
                      {selectedDocument.metadata.words && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Words:</span>
                          <span>{selectedDocument.metadata.words.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Chunks:</span>
                        <span>{selectedDocument.chunks.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        ) : (
          /* Translation in Progress */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            {selectedDocument && (
              <DocumentTranslator
                document={selectedDocument}
                sourceLang={translationSettings.sourceLang}
                targetLang={translationSettings.targetLang}
                onComplete={handleTranslationComplete}
                onCancel={handleTranslationCancel}
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}