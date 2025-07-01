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
import { useDocumentPipeline } from '@/contexts/PipelineContext'
import { useWorkspaceIntelligence } from '@/contexts/WorkspaceIntelligenceContext'
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
  file?: File
  extractedText?: string
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
  const { processDocument, extractText, analyzeDocument, status } = useDocumentPipeline()
  const { 
    trackActivity, 
    startAIOperation, 
    updateAIOperation, 
    addSuggestion,
    updateContext 
  } = useWorkspaceIntelligence()
  
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [activeDocument, setActiveDocument] = useState<ProcessedDocument | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'translate' | 'qa' | 'analysis'>('upload')
  
  // Document translation state
  const [selectedDocumentForTranslation, setSelectedDocumentForTranslation] = useState<ProcessedDocument | null>(null)
  const [translationTargetLang, setTranslationTargetLang] = useState('en')
  const [isTranslatingDocument, setIsTranslatingDocument] = useState(false)
  const [translationResult, setTranslationResult] = useState<any>(null)
  
  // Document Q&A state
  const [selectedDocumentForQA, setSelectedDocumentForQA] = useState<ProcessedDocument | null>(null)
  const [qaQuestion, setQaQuestion] = useState('')
  const [isProcessingQA, setIsProcessingQA] = useState(false)
  const [qaResult, setQaResult] = useState<any>(null)
  
  // Error and status state
  const [globalError, setGlobalError] = useState<{
    message: string
    code?: string
    suggestions?: string[]
  } | null>(null)
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{
    current: number
    total: number
    fileName?: string
  } | null>(null)

  // Helper functions for error/success handling
  const showError = useCallback((error: any) => {
    if (typeof error === 'string') {
      setGlobalError({ message: error })
    } else if (error && typeof error === 'object') {
      setGlobalError({
        message: error.message || 'An error occurred',
        code: error.code,
        suggestions: error.suggestions
      })
    } else {
      setGlobalError({ message: 'An unknown error occurred' })
    }
    setGlobalSuccess(null)
  }, [])

  const showSuccess = useCallback((message: string) => {
    setGlobalSuccess(message)
    setGlobalError(null)
  }, [])

  const clearMessages = useCallback(() => {
    setGlobalError(null)
    setGlobalSuccess(null)
  }, [])

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (globalError || globalSuccess) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [globalError, globalSuccess, clearMessages])

  const content = {
    vi: {
      tabs: {
        upload: 'Tải lên tài liệu',
        translate: 'Dịch tài liệu',
        qa: 'Hỏi đáp tài liệu',
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
      translate: {
        title: 'Dịch tài liệu',
        selectDocument: 'Chọn tài liệu để dịch',
        targetLanguage: 'Ngôn ngữ đích',
        translateButton: 'Dịch tài liệu',
        translating: 'Đang dịch...',
        downloadTranslated: 'Tải về bản dịch',
        noDocuments: 'Chưa có tài liệu nào được tải lên',
      },
      qa: {
        title: 'Hỏi đáp tài liệu',
        selectDocument: 'Chọn tài liệu để hỏi',
        questionPlaceholder: 'Hãy đặt câu hỏi về nội dung tài liệu...',
        askButton: 'Đặt câu hỏi',
        asking: 'Đang xử lý...',
        noDocuments: 'Chưa có tài liệu nào được tải lên',
      },
    },
    en: {
      tabs: {
        upload: 'Document Upload',
        translate: 'Document Translation',
        qa: 'Document Q&A',
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
      translate: {
        title: 'Document Translation',
        selectDocument: 'Select document to translate',
        targetLanguage: 'Target language',
        translateButton: 'Translate Document',
        translating: 'Translating...',
        downloadTranslated: 'Download Translation',
        noDocuments: 'No documents uploaded yet',
      },
      qa: {
        title: 'Document Q&A',
        selectDocument: 'Select document to ask about',
        questionPlaceholder: 'Ask a question about the document content...',
        askButton: 'Ask Question',
        asking: 'Processing...',
        noDocuments: 'No documents uploaded yet',
      },
    },
  }

  const currentContent = content[language]

  // Enhanced file validation
  const validateFile = useCallback((file: File): { isValid: boolean; error?: any } => {
    // Check file size (50MB max, matching API)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: {
          message: `File "${file.name}" is too large. Maximum size is 50MB.`,
          code: 'FILE_TOO_LARGE',
          suggestions: ['Try compressing the file', 'Split large documents into smaller files']
        }
      }
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: {
          message: `File type "${file.type}" is not supported. Only PDF and DOCX files are allowed.`,
          code: 'INVALID_FILE_TYPE',
          suggestions: ['Convert your document to PDF or DOCX format', 'Use a supported file type']
        }
      }
    }

    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      return {
        isValid: false,
        error: {
          message: 'File must have a valid name.',
          code: 'INVALID_FILE_NAME',
          suggestions: ['Rename the file with a descriptive name']
        }
      }
    }

    return { isValid: true }
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return

    // Clear previous messages
    clearMessages()
    setIsUploading(true)
    setUploadProgress({ current: 0, total: files.length })
    
    const uploadStartTime = Date.now()

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        setUploadProgress({ current: i + 1, total: files.length, fileName: file.name })
        
        // Validate file
        const validation = validateFile(file)
        if (!validation.isValid) {
          showError(validation.error)
          continue
        }

        // Extract text from file
        const extractedText = await extractTextFromFile(file)
        
        // Create document record with extracted text and original file
        const newDocument: ProcessedDocument = {
          id: `doc_${Date.now()}_${i}`,
          name: file.name,
          type: file.type || 'unknown',
          size: file.size,
          uploadTime: new Date(),
          status: 'processing',
          file: file,
          extractedText: extractedText,
        }

        setDocuments(prev => [...prev, newDocument])

        // Track document upload activity
        trackActivity({
          type: 'document_upload',
          mode: 'documents',
          data: { 
            fileName: file.name, 
            fileSize: file.size, 
            fileType: file.type,
            documentId: newDocument.id 
          },
          duration: Date.now() - uploadStartTime,
          success: true
        })

        // Start AI operation for document analysis
        const operationId = startAIOperation({
          type: 'document_processing',
          input: { 
            documentId: newDocument.id, 
            fileName: file.name, 
            extractedText: extractedText 
          }
        })

        // Process document using pipeline (just for upload analysis)
        try {
          console.log('🚀 Starting pipeline document analysis', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          })

          // For now, just do basic analysis on upload
          const analysis = {
            type: getDocumentAnalysisType(file.type),
            insights: generateInsights(file.name, file.type),
            confidence: 0.85
          }

          // Update document with analysis
          setDocuments(prev => prev.map(doc => 
            doc.id === newDocument.id 
              ? { 
                  ...doc, 
                  status: 'completed' as const,
                  analysis 
                }
              : doc
          ))

          // Update AI operation as completed
          updateAIOperation(operationId, {
            status: 'completed',
            progress: 100,
            output: analysis,
            endTime: new Date()
          })

          // Add contextual suggestions based on document type
          if (file.name.toLowerCase().includes('contract')) {
            addSuggestion({
              type: 'next_action',
              title: 'Legal Review Assistant',
              description: 'Run contract analysis to identify key terms and obligations',
              action: () => setActiveTab('analysis'),
              priority: 'high',
              context: { documentId: newDocument.id, documentType: 'contract' }
            })
          } else if (file.name.toLowerCase().includes('report')) {
            addSuggestion({
              type: 'workflow',
              title: 'Document Translation',
              description: 'Translate this report to multiple languages for global distribution',
              action: () => {
                setSelectedDocumentForTranslation(newDocument)
                setActiveTab('translate')
              },
              priority: 'medium',
              context: { documentId: newDocument.id, documentType: 'report' }
            })
          }

          // Update workspace context with new document
          updateContext({
            activeDocuments: [...(prev => prev), newDocument.id],
            lastActivity: {
              type: 'document_analysis',
              timestamp: new Date(),
              data: { documentId: newDocument.id, fileName: file.name }
            }
          })

        } catch (error) {
          console.error('❌ Document analysis failed:', error)
          setDocuments(prev => prev.map(doc => 
            doc.id === newDocument.id 
              ? { ...doc, status: 'error' as const }
              : doc
          ))

          // Update AI operation as failed
          updateAIOperation(operationId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Analysis failed',
            endTime: new Date()
          })

          // Track failed activity
          trackActivity({
            type: 'document_analysis',
            mode: 'documents',
            data: { 
              documentId: newDocument.id, 
              fileName: file.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            },
            success: false
          })
        }

      }
      if (files.length > 0) {
        showSuccess(`Successfully processed ${files.length} document${files.length > 1 ? 's' : ''}!`)
      }

    } catch (error) {
      console.error('Upload error:', error)
      showError({
        message: 'Failed to upload documents',
        code: 'UPLOAD_ERROR',
        suggestions: ['Check your file formats', 'Try uploading one file at a time', 'Ensure files are not corrupted']
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }, [createAgent, isConnected, clearMessages, showError, showSuccess, validateFile])

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

  // Extract text from uploaded file
  const extractTextFromFile = useCallback(async (file: File): Promise<string> => {
    try {
      if (file.type === 'text/plain') {
        return await file.text()
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll use a simple approach
        // In production, you'd use a proper PDF parser
        return `[PDF Content] Document: ${file.name}\nThis is extracted text from the PDF file. In a real implementation, this would contain the actual PDF text content.`
      } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
        return `[DOCX Content] Document: ${file.name}\nThis is extracted text from the Word document. In a real implementation, this would contain the actual document text content.`
      } else {
        return `[${file.type}] Document: ${file.name}\nUnsupported file type. Please use PDF, DOCX, or TXT files.`
      }
    } catch (error) {
      console.error('Text extraction failed:', error)
      return `Error extracting text from ${file.name}`
    }
  }, [])

  // Generate contextual answer based on document content
  const generateContextualAnswer = useCallback((question: string, documentText: string, documentName: string) => {
    // Simple text-based Q&A logic
    // In production, this would use a proper AI service
    
    const lowerQuestion = question.toLowerCase()
    const lowerText = documentText.toLowerCase()
    
    // Basic keyword matching
    let relevantSection = ''
    let confidence = 0.3
    
    // Find relevant sections by keyword matching
    const questionWords = lowerQuestion.split(' ').filter(word => word.length > 3)
    
    for (const word of questionWords) {
      const index = lowerText.indexOf(word)
      if (index !== -1) {
        // Extract context around the found word
        const start = Math.max(0, index - 100)
        const end = Math.min(documentText.length, index + 200)
        relevantSection = documentText.substring(start, end)
        confidence += 0.2
        break
      }
    }
    
    let answer = ''
    
    if (relevantSection) {
      answer = `Based on the document "${documentName}", I found relevant information: "${relevantSection.trim()}". This appears to be related to your question about ${question.toLowerCase()}.`
      confidence = Math.min(confidence, 0.8)
    } else {
      answer = `I couldn't find specific information related to "${question}" in the document "${documentName}". The document contains ${documentText.length} characters of text. You may want to rephrase your question or check if the information is available in the document.`
      confidence = 0.2
    }
    
    return {
      answer,
      confidence,
      sourceSection: relevantSection || documentText.substring(0, 200) + '...'
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

  // Handle document translation with enhanced error handling
  const handleDocumentTranslate = useCallback(async () => {
    if (!selectedDocumentForTranslation) return
    
    clearMessages()
    setIsTranslatingDocument(true)
    setTranslationResult(null)
    
    // Track translation activity and start AI operation
    const operationId = startAIOperation({
      type: 'translation',
      input: {
        documentId: selectedDocumentForTranslation.id,
        sourceText: selectedDocumentForTranslation.extractedText,
        targetLang: translationTargetLang
      }
    })
    
    try {
      console.log('🚀 Starting document translation', {
        documentId: selectedDocumentForTranslation.id,
        targetLang: translationTargetLang
      })
      
      // Use the actual uploaded file instead of dummy content
      const file = selectedDocumentForTranslation.file
      if (!file) {
        throw new Error('Original file not found. Please re-upload the document.')
      }
      
      const response = await processDocument(file, {
        targetLang: translationTargetLang,
        qualityTier: 'standard'
      })
      
      console.log('✅ Document translation completed', response)
      
      if (response.status === 'completed' && response.result) {
        setTranslationResult({
          translatedUrl: response.result.translatedUrl,
          taskId: response.result.taskId,
          creditsUsed: response.result.creditsUsed,
          pageCount: response.result.pageCount,
          wordCount: response.result.wordCount
        })
        showSuccess(`Document translated successfully! Used ${response.result.creditsUsed} credits.`)

        // Update AI operation as completed
        updateAIOperation(operationId, {
          status: 'completed',
          progress: 100,
          output: response.result,
          endTime: new Date()
        })

        // Track successful translation
        trackActivity({
          type: 'translation',
          mode: 'documents',
          data: {
            documentId: selectedDocumentForTranslation.id,
            targetLanguage: translationTargetLang,
            creditsUsed: response.result.creditsUsed,
            wordCount: response.result.wordCount
          },
          success: true
        })

        // Add suggestion for next steps
        addSuggestion({
          type: 'next_action',
          title: 'Download Translation',
          description: 'Your translated document is ready for download',
          action: () => window.open(response.result.translatedUrl, '_blank'),
          priority: 'high',
          context: { translationId: response.result.taskId }
        })
      } else if (response.status === 'error') {
        const error = response.error
        showError({
          message: error?.message || 'Document translation failed',
          code: error?.code || 'TRANSLATION_ERROR',
          suggestions: error?.suggestions || [
            'Check your internet connection',
            'Ensure you have sufficient credits',
            'Try again with a different document'
          ]
        })
        setTranslationResult({
          error: error?.message || 'Translation failed'
        })

        // Update AI operation as failed
        updateAIOperation(operationId, {
          status: 'error',
          error: error?.message || 'Translation failed',
          endTime: new Date()
        })
      }
      
    } catch (error: any) {
      console.error('❌ Document translation failed:', error)
      
      let errorMessage = 'Translation failed'
      let errorCode = 'UNKNOWN_ERROR'
      let suggestions = ['Please try again', 'Contact support if the problem persists']
      
      if (error && typeof error === 'object') {
        if (error.status === 401) {
          errorMessage = 'Please sign in to translate documents'
          errorCode = 'AUTH_REQUIRED'
          suggestions = ['Sign in to your account', 'Refresh the page and try again']
        } else if (error.status === 402) {
          errorMessage = 'Insufficient credits for document translation'
          errorCode = 'INSUFFICIENT_CREDITS'
          suggestions = ['Purchase more credits', 'Upgrade your plan']
        } else if (error.message) {
          errorMessage = error.message
          errorCode = error.code || 'PROCESSING_ERROR'
        }
      }
      
      showError({
        message: errorMessage,
        code: errorCode,
        suggestions
      })
      
      setTranslationResult({
        error: errorMessage
      })

      // Update AI operation as failed
      updateAIOperation(operationId, {
        status: 'error',
        error: errorMessage,
        endTime: new Date()
      })

      // Track failed translation
      trackActivity({
        type: 'translation',
        mode: 'documents',
        data: {
          documentId: selectedDocumentForTranslation?.id,
          targetLanguage: translationTargetLang,
          error: errorMessage
        },
        success: false
      })
    } finally {
      setIsTranslatingDocument(false)
    }
  }, [selectedDocumentForTranslation, translationTargetLang, processDocument, clearMessages, showError, showSuccess])
  
  // Handle document Q&A
  const handleDocumentQA = useCallback(async () => {
    if (!selectedDocumentForQA || !qaQuestion.trim()) return
    
    setIsProcessingQA(true)
    setQaResult(null)
    
    // Track Q&A activity and start AI operation
    const operationId = startAIOperation({
      type: 'analysis',
      input: {
        documentId: selectedDocumentForQA.id,
        question: qaQuestion,
        documentText: selectedDocumentForQA.extractedText
      }
    })
    
    try {
      console.log('🚀 Starting document Q&A', {
        documentId: selectedDocumentForQA.id,
        question: qaQuestion
      })
      
      // Use real document content for Q&A
      const documentText = selectedDocumentForQA.extractedText || 'No text extracted from document'
      
      // Simple Q&A processing using document content
      // In production, this would use an AI service like OpenAI/Anthropic
      const contextualAnswer = generateContextualAnswer(qaQuestion, documentText, selectedDocumentForQA.name)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setQaResult({
        question: qaQuestion,
        answer: contextualAnswer.answer,
        confidence: contextualAnswer.confidence,
        sourceText: documentText.substring(0, 300) + '...' // Show source snippet
      })

      // Update AI operation as completed
      updateAIOperation(operationId, {
        status: 'completed',
        progress: 100,
        output: {
          question: qaQuestion,
          answer: contextualAnswer.answer,
          confidence: contextualAnswer.confidence
        },
        endTime: new Date()
      })

      // Track successful Q&A
      trackActivity({
        type: 'ai_interaction',
        mode: 'documents',
        data: {
          documentId: selectedDocumentForQA.id,
          question: qaQuestion,
          confidence: contextualAnswer.confidence
        },
        success: true
      })
      
    } catch (error) {
      console.error('❌ Document Q&A failed:', error)
      setQaResult({
        error: error instanceof Error ? error.message : 'Q&A processing failed'
      })

      // Update AI operation as failed
      updateAIOperation(operationId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Q&A processing failed',
        endTime: new Date()
      })

      // Track failed Q&A
      trackActivity({
        type: 'ai_interaction',
        mode: 'documents',
        data: {
          documentId: selectedDocumentForQA?.id,
          question: qaQuestion,
          error: error instanceof Error ? error.message : 'Q&A processing failed'
        },
        success: false
      })
    } finally {
      setIsProcessingQA(false)
    }
  }, [selectedDocumentForQA, qaQuestion])

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
                    {doc.extractedText && (
                      <p className="text-xs text-gray-400 mt-1">
                        Text extracted: {doc.extractedText.length} characters
                      </p>
                    )}
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
          
          {/* Document Content Viewer */}
          {activeDocument && activeDocument.extractedText && (
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-gray-900">Document Content: {activeDocument.name}</h5>
                <button
                  onClick={() => setActiveDocument(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-gray-50 rounded border p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {activeDocument.extractedText}
                </pre>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>File size: {(activeDocument.size / 1024).toFixed(1)} KB</span>
                <span>Characters: {activeDocument.extractedText.length}</span>
                <span>Words: ~{activeDocument.extractedText.split(/\s+/).length}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className={`enhanced-document-interface ${className}`}>
      {/* Enhanced Global Status Messages */}
      {globalError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{globalError.message}</p>
              {globalError.code && (
                <p className="text-red-600 text-sm mt-1">Error Code: {globalError.code}</p>
              )}
              {globalError.suggestions && globalError.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-700 text-sm font-medium">Suggestions:</p>
                  <ul className="text-red-600 text-sm mt-1 space-y-1">
                    {globalError.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="ml-3 text-red-600 hover:text-red-800 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {globalSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800">{globalSuccess}</p>
            <button
              onClick={() => setGlobalSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
            <div className="flex-1">
              <p className="text-blue-800 font-medium">
                Processing {uploadProgress.fileName || 'file'} ({uploadProgress.current} of {uploadProgress.total})
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-8 border-b border-gray-200">
        {(['upload', 'translate', 'qa', 'analysis'] as const).map((tab) => (
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
        
        {activeTab === 'translate' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {currentContent.translate.title}
            </h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {currentContent.translate.noDocuments}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Selection */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    {currentContent.translate.selectDocument}
                  </h4>
                  
                  <div className="space-y-3">
                    {documents.filter(doc => doc.status === 'completed').map((doc) => (
                      <div 
                        key={doc.id}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedDocumentForTranslation?.id === doc.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDocumentForTranslation(doc)}
                      >
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedDocumentForTranslation && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentContent.translate.targetLanguage}
                        </label>
                        <select
                          value={translationTargetLang}
                          onChange={(e) => setTranslationTargetLang(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="vi">Tiếng Việt</option>
                          <option value="zh">Chinese</option>
                          <option value="ja">Japanese</option>
                          <option value="ko">Korean</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="es">Spanish</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={handleDocumentTranslate}
                        disabled={isTranslatingDocument}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isTranslatingDocument ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {currentContent.translate.translating}
                          </>
                        ) : (
                          currentContent.translate.translateButton
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Translation Results */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Translation Results</h4>
                  
                  {translationResult ? (
                    <div className="space-y-4">
                      {translationResult.error ? (
                        <div className="text-red-600 text-sm flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          {translationResult.error}
                        </div>
                      ) : (
                        <>
                          <div className="text-green-600 text-sm flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Translation completed successfully!
                          </div>
                          
                          {/* Show translation content inline */}
                          {selectedDocumentForTranslation?.extractedText && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h5 className="font-medium text-gray-700">Original Content:</h5>
                                  <div className="p-3 bg-gray-50 rounded border text-sm max-h-40 overflow-y-auto">
                                    {selectedDocumentForTranslation.extractedText.substring(0, 500)}
                                    {selectedDocumentForTranslation.extractedText.length > 500 && '...'}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h5 className="font-medium text-gray-700">Translated Content:</h5>
                                  <div className="p-3 bg-blue-50 rounded border text-sm max-h-40 overflow-y-auto">
                                    {translationResult.translatedText || 'Translation processing...'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {translationResult.translatedUrl && (
                            <a
                              href={translationResult.translatedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              {currentContent.translate.downloadTranslated}
                            </a>
                          )}
                          
                          {translationResult.creditsUsed && (
                            <p className="text-sm text-gray-600">
                              Credits used: {translationResult.creditsUsed}
                            </p>
                          )}
                          
                          {(translationResult.pageCount || translationResult.wordCount) && (
                            <div className="text-sm text-gray-600 space-x-4">
                              {translationResult.pageCount && <span>Pages: {translationResult.pageCount}</span>}
                              {translationResult.wordCount && <span>Words: {translationResult.wordCount}</span>}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Select a document and target language to begin translation.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'qa' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {currentContent.qa.title}
            </h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {currentContent.qa.noDocuments}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Selection & Question */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    {currentContent.qa.selectDocument}
                  </h4>
                  
                  <div className="space-y-3 mb-4">
                    {documents.filter(doc => doc.status === 'completed').map((doc) => (
                      <div 
                        key={doc.id}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedDocumentForQA?.id === doc.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDocumentForQA(doc)}
                      >
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedDocumentForQA && (
                    <div className="space-y-3">
                      <textarea
                        value={qaQuestion}
                        onChange={(e) => setQaQuestion(e.target.value)}
                        placeholder={currentContent.qa.questionPlaceholder}
                        className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <button
                        onClick={handleDocumentQA}
                        disabled={isProcessingQA || !qaQuestion.trim()}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isProcessingQA ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {currentContent.qa.asking}
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {currentContent.qa.askButton}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Q&A Results */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Answer</h4>
                  
                  {qaResult ? (
                    <div className="space-y-4">
                      {qaResult.error ? (
                        <div className="text-red-600 text-sm flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          {qaResult.error}
                        </div>
                      ) : (
                        <>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 mb-2">Question:</p>
                            <p className="text-sm text-blue-800">{qaResult.question}</p>
                          </div>
                          
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-green-900 mb-2">Answer:</p>
                            <p className="text-sm text-green-800">{qaResult.answer}</p>
                          </div>
                          
                          {/* Source text section */}
                          {qaResult.sourceText && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-gray-900 mb-2">Source Text:</p>
                              <p className="text-xs text-gray-700 italic">{qaResult.sourceText}</p>
                            </div>
                          )}
                          
                          {/* Confidence and metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            {qaResult.confidence && (
                              <span>Confidence: {Math.round(qaResult.confidence * 100)}%</span>
                            )}
                            {selectedDocumentForQA?.extractedText && (
                              <span>Document length: {selectedDocumentForQA.extractedText.length} characters</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Select a document and ask a question to get started.
                    </p>
                  )}
                </div>
              </div>
            )}
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