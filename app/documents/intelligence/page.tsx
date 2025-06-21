'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import IntelligentDocumentUpload from '@/components/documents/IntelligentDocumentUpload'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'

interface DocumentIntelligence {
  documentId: string
  quickInsights: {
    documentType: string
    detectedLanguage: string
    estimatedReadingTime: number
    keyTopics: string[]
    complexity: 'low' | 'medium' | 'high'
    confidence: number
  }
  processingRecommendations: {
    suggestedAnalysisDepth: 'quick' | 'standard' | 'comprehensive'
    estimatedProcessingTime: number
    recommendedFeatures: string[]
  }
  backgroundJobId: string
  estimatedCompletion: Date
  finalResults?: {
    structure: any
    content: any
    insights: any
    knowledgeGraph: any
    predictiveInsights?: any
    processingMetrics: any
  }
}

function IntelligenceDashboardContent() {
  const { language } = useLanguage()
  const [documentIntelligence, setDocumentIntelligence] = useState<DocumentIntelligence | null>(null)
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()

  const content = {
    vi: {
      title: 'Phân Tích Tài Liệu Thông Minh',
      subtitle: 'AI sẽ phân tích và hiểu sâu tài liệu của bạn, tạo ra những hiểu biết có giá trị và khả năng tìm kiếm thông minh',
      features: [
        'Phân tích cấu trúc và nội dung tự động',
        'Trích xuất thực thể và khái niệm chính',
        'Xây dựng đồ thị tri thức liên kết',
        'Dự đoán câu hỏi và hành động tiếp theo'
      ],
      signInRequired: 'Vui lòng đăng nhập để sử dụng phân tích tài liệu thông minh',
      signIn: 'Đăng nhập',
      analysisComplete: 'Phân tích hoàn tất!',
      viewDetails: 'Xem chi tiết',
      backToUpload: 'Phân tích tài liệu khác',
      results: {
        documentStructure: 'Cấu trúc tài liệu',
        contentAnalysis: 'Phân tích nội dung',
        keyInsights: 'Thông tin chính',
        knowledgeGraph: 'Đồ thị tri thức',
        predictiveInsights: 'Dự đoán thông minh',
        processingMetrics: 'Thống kê xử lý'
      },
      processingStage: {
        title: 'Tiến trình phân tích AI',
        subtitle: 'AI đang áp dụng nhiều tầng phân tích để hiểu sâu tài liệu của bạn'
      }
    },
    en: {
      title: 'Intelligent Document Analysis',
      subtitle: 'AI will analyze and deeply understand your documents, creating valuable insights and intelligent search capabilities',
      features: [
        'Automatic structure and content analysis',
        'Extract key entities and concepts',
        'Build connected knowledge graphs',
        'Predict next questions and actions'
      ],
      signInRequired: 'Please sign in to use intelligent document analysis',
      signIn: 'Sign In',
      analysisComplete: 'Analysis Complete!',
      viewDetails: 'View Details',
      backToUpload: 'Analyze Another Document',
      results: {
        documentStructure: 'Document Structure',
        contentAnalysis: 'Content Analysis',
        keyInsights: 'Key Insights',
        knowledgeGraph: 'Knowledge Graph',
        predictiveInsights: 'Predictive Insights',
        processingMetrics: 'Processing Metrics'
      },
      processingStage: {
        title: 'AI Analysis Progress',
        subtitle: 'AI is applying multiple layers of analysis to deeply understand your document'
      }
    }
  }

  const handleIntelligenceReady = (intelligence: DocumentIntelligence) => {
    setDocumentIntelligence(intelligence)
    
    // If final results are already available (background processing completed)
    if (intelligence.finalResults) {
      setShowDetailedResults(true)
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleReset = () => {
    setDocumentIntelligence(null)
    setShowDetailedResults(false)
    setError(null)
  }

  const formatComplexity = (complexity: string) => {
    const complexityMap = {
      low: { 
        color: 'text-green-600 bg-green-50 border-green-200', 
        label: language === 'vi' ? 'Thấp' : 'Low',
        icon: '🟢'
      },
      medium: { 
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
        label: language === 'vi' ? 'Trung bình' : 'Medium',
        icon: '🟡'
      },
      high: { 
        color: 'text-red-600 bg-red-50 border-red-200', 
        label: language === 'vi' ? 'Cao' : 'High',
        icon: '🔴'
      }
    }
    return complexityMap[complexity as keyof typeof complexityMap] || complexityMap.medium
  }

  const renderDetailedResults = () => {
    if (!documentIntelligence?.finalResults) return null

    const results = documentIntelligence.finalResults

    return (
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Document Structure */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="heading-4 text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
            {content[language].results.documentStructure}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="body-xs text-gray-600 mb-1">Pages</div>
              <div className="body-sm font-medium text-gray-900">{results.structure?.metadata?.pageCount || 'N/A'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="body-xs text-gray-600 mb-1">Words</div>
              <div className="body-sm font-medium text-gray-900">{results.structure?.metadata?.wordCount || 'N/A'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="body-xs text-gray-600 mb-1">Language</div>
              <div className="body-sm font-medium text-gray-900">{results.structure?.metadata?.language || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Content Analysis */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="heading-4 text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {content[language].results.contentAnalysis}
          </h3>
          
          {results.content?.keyEntities && results.content.keyEntities.length > 0 && (
            <div className="mb-4">
              <div className="body-sm font-medium text-gray-700 mb-2">Key Entities</div>
              <div className="flex flex-wrap gap-2">
                {results.content.keyEntities.slice(0, 10).map((entity: any, index: number) => (
                  <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {entity.text || entity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {results.content?.concepts && results.content.concepts.length > 0 && (
            <div>
              <div className="body-sm font-medium text-gray-700 mb-2">Core Concepts</div>
              <div className="flex flex-wrap gap-2">
                {results.content.concepts.slice(0, 8).map((concept: any, index: number) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {concept.term || concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="heading-4 text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" clipRule="evenodd" />
            </svg>
            {content[language].results.keyInsights}
          </h3>
          
          <div className="space-y-3">
            {results.insights?.summary && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="body-xs text-green-600 mb-1">Summary</div>
                <div className="body-sm text-green-800">{results.insights.summary}</div>
              </div>
            )}
            
            {results.insights?.topics && results.insights.topics.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="body-xs text-blue-600 mb-2">Main Topics</div>
                <div className="flex flex-wrap gap-2">
                  {results.insights.topics.map((topic: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {results.insights?.classification && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="body-xs text-gray-600 mb-1">Document Classification</div>
                <div className="body-sm text-gray-800">
                  {results.insights.classification.documentType} ({results.insights.classification.domain})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Processing Metrics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="heading-4 text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            {content[language].results.processingMetrics}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="body-xs text-indigo-600 mb-1">Total Time</div>
              <div className="body-sm font-medium text-indigo-900">
                {Math.round((results.processingMetrics?.totalTime || 0) / 1000)}s
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="body-xs text-indigo-600 mb-1">AI Models</div>
              <div className="body-sm font-medium text-indigo-900">
                {results.processingMetrics?.aiModelsUsed?.length || 0}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="body-xs text-indigo-600 mb-1">Confidence</div>
              <div className="body-sm font-medium text-indigo-900">
                {Math.round((results.processingMetrics?.confidenceScores?.overallConfidence || 0) * 100)}%
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="body-xs text-indigo-600 mb-1">Tokens Used</div>
              <div className="body-sm font-medium text-indigo-900">
                {results.processingMetrics?.tokensConsumed || 0}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      
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
            <h1 className="heading-1 text-gray-900 mb-4">
              {content[language].title}
            </h1>
            <p className="body-lg text-gray-600 max-w-3xl mx-auto">
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
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="body-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </motion.div>

          {/* Main Content */}
          {!user ? (
            <motion.div 
              className="text-center py-12"
              variants={motionSafe(slideUp)}
            >
              <div className="max-w-md mx-auto">
                <svg className="w-24 h-24 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="body-lg text-gray-600 mb-6">{content[language].signInRequired}</p>
                <button className="btn-primary btn-pill-compact-md btn-text-safe">
                  {content[language].signIn}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Upload and Analysis Flow */}
              {!documentIntelligence && (
                <motion.div variants={motionSafe(slideUp)}>
                  <IntelligentDocumentUpload
                    language={language}
                    onIntelligenceReady={handleIntelligenceReady}
                    onError={handleError}
                    maxSizeMB={50}
                  />
                </motion.div>
              )}

              {/* Quick Insights and Progress (handled by IntelligentDocumentUpload) */}
              
              {/* Analysis Complete - Show Summary */}
              {documentIntelligence && documentIntelligence.finalResults && !showDetailedResults && (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="max-w-2xl mx-auto">
                    <div className="relative mb-8">
                      <svg className="w-24 h-24 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-pulse"></div>
                    </div>
                    
                    <h3 className="heading-2 text-gray-900 mb-4">{content[language].analysisComplete}</h3>
                    
                    {/* Quick Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="body-xs text-gray-600 mb-1">Document Type</div>
                          <div className="body-sm font-medium text-gray-900">{documentIntelligence.quickInsights.documentType}</div>
                        </div>
                        <div className="text-center">
                          <div className="body-xs text-gray-600 mb-1">Reading Time</div>
                          <div className="body-sm font-medium text-gray-900">{documentIntelligence.quickInsights.estimatedReadingTime} min</div>
                        </div>
                        <div className="text-center">
                          <div className="body-xs text-gray-600 mb-1">Complexity</div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${formatComplexity(documentIntelligence.quickInsights.complexity).color}`}>
                            <span className="mr-1">{formatComplexity(documentIntelligence.quickInsights.complexity).icon}</span>
                            {formatComplexity(documentIntelligence.quickInsights.complexity).label}
                          </div>
                        </div>
                      </div>
                      
                      {documentIntelligence.quickInsights.keyTopics.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <div className="body-xs text-gray-600 mb-2">Key Topics</div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {documentIntelligence.quickInsights.keyTopics.slice(0, 6).map((topic, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={() => setShowDetailedResults(true)}
                        className="btn-primary"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {content[language].viewDetails}
                      </button>
                      <button 
                        onClick={handleReset}
                        className="btn-secondary"
                      >
                        {content[language].backToUpload}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Detailed Results */}
              {showDetailedResults && (
                <motion.div 
                  variants={motionSafe(fadeIn)}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="heading-3 text-gray-900">Document Intelligence Report</h2>
                    <button 
                      onClick={() => setShowDetailedResults(false)}
                      className="btn-secondary text-sm"
                    >
                      ← Back to Summary
                    </button>
                  </div>
                  
                  {renderDetailedResults()}
                  
                  <div className="text-center mt-8">
                    <button 
                      onClick={handleReset}
                      className="btn-primary"
                    >
                      {content[language].backToUpload}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="bg-red-50 border border-red-200 rounded-2xl p-6 mt-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="body-sm text-red-800 font-medium">Analysis Error</p>
                        <p className="body-sm text-red-700 mt-1">{error}</p>
                        <button 
                          onClick={() => setError(null)}
                          className="text-sm text-red-600 hover:text-red-800 mt-2"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

export default function IntelligenceDashboard() {
  return (
    <AuthProvider>
      <IntelligenceDashboardContent />
    </AuthProvider>
  )
}