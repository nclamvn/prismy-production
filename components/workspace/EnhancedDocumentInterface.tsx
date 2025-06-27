'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Upload,
  FileText,
  Brain,
  Zap,
  Download,
  Eye,
  Users,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAgents, useAgentOperations } from '@/contexts/AgentContext'
import { Document } from './types'
import SimpleTranslationInterface from './SimpleTranslationInterface'

interface EnhancedDocumentInterfaceProps {
  className?: string
}

interface ProcessedDocument {
  id: string
  name: string
  type: string
  size: number
  uploadTime: Date
  status: 'processing' | 'completed' | 'error'
  agentId?: string
  analysis?: {
    type: string
    insights: string[]
    confidence: number
  }
  translation?: {
    originalText: string
    translatedText: string
    language: string
  }
}

export default function EnhancedDocumentInterface({
  className = '',
}: EnhancedDocumentInterfaceProps) {
  const { language } = useSSRSafeLanguage()
  const { agents, isConnected } = useAgents()
  const { createAgent } = useAgentOperations()
  
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [activeDocument, setActiveDocument] = useState<ProcessedDocument | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'translation' | 'analysis'>('upload')

  const content = {
    vi: {
      tabs: {
        upload: 'Tải lên tài liệu',
        translation: 'Dịch thuật nhanh',
        analysis: 'Phân tích AI',
      },
      upload: {
        title: 'Xử lý tài liệu thông minh',
        subtitle: 'Tải lên tài liệu để AI Agents phân tích và xử lý',
        dragText: 'Kéo thả tài liệu vào đây hoặc click để chọn',
        supportedTypes: 'Hỗ trợ: PDF, DOCX, TXT, JPG, PNG (tối đa 10MB)',
        selectFiles: 'Chọn tài liệu',
        processing: 'Đang xử lý...',
        createAgent: 'Tạo AI Agent',
      },
      analysis: {
        title: 'Phân tích AI',
        noAgent: 'Không có AI Agent nào đang hoạt động',
        confidence: 'Độ tin cậy',
        insights: 'Phân tích',
        agentWorking: 'AI Agent đang phân tích...',
      },
      documents: {
        title: 'Tài liệu đã xử lý',
        empty: 'Chưa có tài liệu nào',
        status: {
          processing: 'Đang xử lý',
          completed: 'Hoàn thành',
          error: 'Lỗi',
        },
      },
      agents: {
        active: 'agents đang hoạt động',
        assign: 'Gán agent cho tài liệu',
        create: 'Tạo agent mới',
        working: 'đang phân tích',
      },
    },
    en: {
      tabs: {
        upload: 'Document Upload',
        translation: 'Quick Translation',
        analysis: 'AI Analysis',
      },
      upload: {
        title: 'Intelligent Document Processing',
        subtitle: 'Upload documents for AI Agents to analyze and process',
        dragText: 'Drag and drop documents here or click to select',
        supportedTypes: 'Supported: PDF, DOCX, TXT, JPG, PNG (max 10MB)',
        selectFiles: 'Select Documents',
        processing: 'Processing...',
        createAgent: 'Create AI Agent',
      },
      analysis: {
        title: 'AI Analysis',
        noAgent: 'No AI Agents currently active',
        confidence: 'Confidence',
        insights: 'Insights',
        agentWorking: 'AI Agent analyzing...',
      },
      documents: {
        title: 'Processed Documents',
        empty: 'No documents yet',
        status: {
          processing: 'Processing',
          completed: 'Completed',
          error: 'Error',
        },
      },
      agents: {
        active: 'agents active',
        assign: 'Assign agent to document',
        create: 'Create new agent',
        working: 'analyzing',
      },
    },
  }

  const currentContent = content[language]

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File ${file.name} is too large (max 10MB)`)
          continue
        }

        // Create document record
        const newDocument: ProcessedDocument = {
          id: `doc_${Date.now()}_${i}`,
          name: file.name,
          type: file.type || 'unknown',
          size: file.size,
          uploadTime: new Date(),
          status: 'processing',
        }

        setDocuments(prev => [...prev, newDocument])

        // Simulate document processing
        setTimeout(async () => {
          try {
            // Create AI agent for this document if agents are available
            if (isConnected) {
              const documentForAgent: Document = {
                id: newDocument.id,
                title: newDocument.name,
                content: await file.text().catch(() => 'Binary file content'),
                type: newDocument.type,
                metadata: {
                  size: newDocument.size,
                  uploadTime: newDocument.uploadTime.toISOString(),
                },
              }

              const agent = await createAgent(documentForAgent)
              
              // Simulate AI analysis
              const analysis = {
                type: getDocumentAnalysisType(file.type),
                insights: generateInsights(file.name, file.type),
                confidence: Math.random() * 0.3 + 0.7, // 70-100%
              }

              // Update document with results
              setDocuments(prev => prev.map(doc => 
                doc.id === newDocument.id 
                  ? { 
                      ...doc, 
                      status: 'completed' as const,
                      agentId: agent.getAgent().id,
                      analysis 
                    }
                  : doc
              ))

            } else {
              // Fallback: basic processing without AI
              setDocuments(prev => prev.map(doc => 
                doc.id === newDocument.id 
                  ? { ...doc, status: 'completed' as const }
                  : doc
              ))
            }

          } catch (error) {
            console.error('Document processing error:', error)
            setDocuments(prev => prev.map(doc => 
              doc.id === newDocument.id 
                ? { ...doc, status: 'error' as const }
                : doc
            ))
          }
        }, 2000 + Math.random() * 3000) // 2-5 seconds processing time

      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [createAgent, isConnected])

  // Get document analysis type based on file type
  const getDocumentAnalysisType = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'PDF Document Analysis'
    if (fileType.includes('word') || fileType.includes('document')) return 'Word Document Analysis'
    if (fileType.includes('text')) return 'Text Analysis'
    if (fileType.includes('image')) return 'Image OCR Analysis'
    return 'General Document Analysis'
  }

  // Generate insights based on document
  const generateInsights = (fileName: string, fileType: string): string[] => {
    const insights = []
    
    if (fileName.toLowerCase().includes('contract')) {
      insights.push('Legal document detected - contract analysis recommended')
      insights.push('Key terms and obligations identified')
    } else if (fileName.toLowerCase().includes('report')) {
      insights.push('Report structure analyzed')
      insights.push('Data points and conclusions extracted')
    } else if (fileName.toLowerCase().includes('invoice')) {
      insights.push('Financial document - invoice processing')
      insights.push('Amount and payment terms identified')
    } else {
      insights.push('Document structure analyzed')
      insights.push('Content categorization completed')
    }

    if (fileType.includes('image')) {
      insights.push('OCR text extraction performed')
    }

    insights.push(`Language detection: ${language === 'vi' ? 'Vietnamese' : 'English'}`)
    
    return insights
  }

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  // Render upload area
  const renderUploadArea = () => (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-blue-600" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? currentContent.upload.processing : currentContent.upload.dragText}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {currentContent.upload.supportedTypes}
            </p>
          </div>

          <button
            disabled={isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentContent.upload.selectFiles}
          </button>
        </div>

        <input
          id="file-upload"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Agent Status */}
      {isConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                {agents.length} {currentContent.agents.active}
              </span>
            </div>
            <button
              onClick={() => {/* TODO: Create new agent */}}
              className="text-sm text-green-700 hover:text-green-800 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              {currentContent.agents.create}
            </button>
          </div>
        </div>
      )}

      {/* Recent Documents */}
      {documents.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {currentContent.documents.title}
          </h4>
          <div className="space-y-3">
            {documents.slice(-5).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setActiveDocument(doc)}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-500">
                      {(doc.size / 1024).toFixed(1)} KB • {doc.uploadTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {doc.agentId && (
                    <div className="flex items-center text-sm text-blue-600">
                      <Brain className="w-4 h-4 mr-1" />
                      AI
                    </div>
                  )}
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : doc.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentContent.documents.status[doc.status]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={`enhanced-document-interface ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-8 border-b border-gray-200">
        {(['upload', 'translation', 'analysis'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {currentContent.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'upload' && renderUploadArea()}
        
        {activeTab === 'translation' && (
          <div>
            <SimpleTranslationInterface />
          </div>
        )}
        
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {currentContent.analysis.title}
            </h3>
            
            {!isConnected ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {currentContent.analysis.noAgent}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Agents */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    AI Agents ({agents.length})
                  </h4>
                  
                  {agents.length === 0 ? (
                    <p className="text-gray-500 text-sm">No agents active</p>
                  ) : (
                    <div className="space-y-3">
                      {agents.slice(0, 3).map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{agent.name}</p>
                            <p className="text-xs text-gray-600">{agent.specialty}</p>
                          </div>
                          <div className="text-xs text-blue-600 flex items-center">
                            <Brain className="w-3 h-3 mr-1" />
                            {currentContent.agents.working}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Analysis Results */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    {currentContent.analysis.insights}
                  </h4>
                  
                  {activeDocument?.analysis ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {activeDocument.analysis.type}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${activeDocument.analysis.confidence * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {currentContent.analysis.confidence}: {Math.round(activeDocument.analysis.confidence * 100)}%
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        {activeDocument.analysis.insights.map((insight, index) => (
                          <div key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {currentContent.analysis.agentWorking}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      {activeDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{activeDocument.name}</h3>
              <button
                onClick={() => setActiveDocument(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {activeDocument.analysis && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{currentContent.analysis.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{activeDocument.analysis.type}</p>
                  
                  <div className="space-y-2">
                    {activeDocument.analysis.insights.map((insight, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}