'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Brain, Zap, CheckCircle, ArrowRight, Upload, Settings, Eye } from 'lucide-react'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'

interface SmartDocumentWorkflowProps {
  language: 'vi' | 'en'
  onFileSelect: (file: File) => void
  onWorkflowComplete?: (result: any) => void
}

interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'skipped'
  optional?: boolean
  estimatedTime?: string
}

interface DocumentInsight {
  type: 'summary' | 'recommendation' | 'warning' | 'insight'
  title: string
  content: string
  confidence: number
}

export default function SmartDocumentWorkflow({ 
  language, 
  onFileSelect, 
  onWorkflowComplete 
}: SmartDocumentWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [workflowActive, setWorkflowActive] = useState(false)
  const [documentInsights, setDocumentInsights] = useState<DocumentInsight[]>([])
  const [processingProgress, setProcessingProgress] = useState(0)

  const content = {
    vi: {
      title: 'Quy trình xử lý tài liệu thông minh',
      subtitle: 'Hệ thống AI sẽ hướng dẫn bạn qua toàn bộ quy trình',
      steps: {
        upload: {
          name: 'Tải lên tài liệu',
          description: 'Chọn và tải lên tài liệu của bạn'
        },
        analyze: {
          name: 'Phân tích nội dung',
          description: 'AI phân tích cấu trúc và nội dung tài liệu'
        },
        agent: {
          name: 'Chọn AI Agent',
          description: 'Hệ thống đề xuất agent phù hợp nhất'
        },
        process: {
          name: 'Xử lý chuyên sâu',
          description: 'Agent thực hiện phân tích chuyên môn'
        },
        insights: {
          name: 'Tạo insights',
          description: 'Trích xuất thông tin và kiến thức quan trọng'
        },
        complete: {
          name: 'Hoàn thành',
          description: 'Xem kết quả và tải xuống báo cáo'
        }
      },
      startWorkflow: 'Bắt đầu quy trình',
      skipStep: 'Bỏ qua',
      nextStep: 'Tiếp theo',
      previousStep: 'Trở lại',
      processing: 'Đang xử lý...',
      completed: 'Hoàn thành!',
      estimatedTime: 'Thời gian ước tính',
      insights: {
        summary: 'Tóm tắt',
        recommendation: 'Đề xuất',
        warning: 'Cảnh báo',
        insight: 'Nhận xét'
      }
    },
    en: {
      title: 'Smart Document Processing Workflow',
      subtitle: 'Our AI system will guide you through the entire process',
      steps: {
        upload: {
          name: 'Upload Document',
          description: 'Select and upload your document'
        },
        analyze: {
          name: 'Analyze Content',
          description: 'AI analyzes document structure and content'
        },
        agent: {
          name: 'Select AI Agent',
          description: 'System recommends the most suitable agent'
        },
        process: {
          name: 'Deep Processing',
          description: 'Agent performs specialized analysis'
        },
        insights: {
          name: 'Generate Insights',
          description: 'Extract key information and knowledge'
        },
        complete: {
          name: 'Complete',
          description: 'View results and download reports'
        }
      },
      startWorkflow: 'Start Workflow',
      skipStep: 'Skip',
      nextStep: 'Next',
      previousStep: 'Previous',
      processing: 'Processing...',
      completed: 'Completed!',
      estimatedTime: 'Estimated Time',
      insights: {
        summary: 'Summary',
        recommendation: 'Recommendation',
        warning: 'Warning',
        insight: 'Insight'
      }
    }
  }

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'upload',
      name: content[language].steps.upload.name,
      description: content[language].steps.upload.description,
      status: 'active',
      estimatedTime: '30s'
    },
    {
      id: 'analyze',
      name: content[language].steps.analyze.name,
      description: content[language].steps.analyze.description,
      status: 'pending',
      estimatedTime: '1m'
    },
    {
      id: 'agent',
      name: content[language].steps.agent.name,
      description: content[language].steps.agent.description,
      status: 'pending',
      estimatedTime: '15s'
    },
    {
      id: 'process',
      name: content[language].steps.process.name,
      description: content[language].steps.process.description,
      status: 'pending',
      estimatedTime: '2-5m'
    },
    {
      id: 'insights',
      name: content[language].steps.insights.name,
      description: content[language].steps.insights.description,
      status: 'pending',
      estimatedTime: '1m'
    },
    {
      id: 'complete',
      name: content[language].steps.complete.name,
      description: content[language].steps.complete.description,
      status: 'pending'
    }
  ]

  const [steps, setSteps] = useState(workflowSteps)

  const handleFileUpload = (file: File) => {
    setSelectedFile(file)
    onFileSelect(file)
    
    // Start workflow
    setWorkflowActive(true)
    proceedToNextStep()
  }

  const proceedToNextStep = () => {
    setSteps(prev => {
      const newSteps = [...prev]
      newSteps[currentStep].status = 'completed'
      if (currentStep + 1 < newSteps.length) {
        newSteps[currentStep + 1].status = 'active'
        setCurrentStep(currentStep + 1)
      }
      return newSteps
    })
  }

  // Simulate processing progress
  useEffect(() => {
    if (workflowActive && currentStep > 0) {
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            // Auto-proceed to next step when current step completes
            setTimeout(() => {
              if (currentStep < steps.length - 1) {
                proceedToNextStep()
              }
            }, 1000)
            return 100
          }
          return prev + Math.random() * 15
        })
      }, 500)

      return () => clearInterval(interval)
    }
  }, [workflowActive, currentStep])

  // Generate mock insights
  useEffect(() => {
    if (currentStep >= 4 && selectedFile) {
      const mockInsights: DocumentInsight[] = [
        {
          type: 'summary',
          title: language === 'vi' ? 'Tóm tắt tài liệu' : 'Document Summary',
          content: language === 'vi' 
            ? 'Tài liệu chứa 45 trang với 12 phần chính, tập trung vào phân tích tài chính Q4.'
            : 'Document contains 45 pages with 12 main sections, focusing on Q4 financial analysis.',
          confidence: 0.95
        },
        {
          type: 'recommendation',
          title: language === 'vi' ? 'Đề xuất hành động' : 'Action Recommendations',
          content: language === 'vi'
            ? 'Nên xem xét kỹ phần dự báo ngân sách và điều chỉnh chiến lược đầu tư.'
            : 'Review budget forecasts carefully and adjust investment strategy.',
          confidence: 0.88
        },
        {
          type: 'insight',
          title: language === 'vi' ? 'Nhận xét quan trọng' : 'Key Insights',
          content: language === 'vi'
            ? 'Phát hiện xu hướng tăng trưởng 15% trong lĩnh vực công nghệ.'
            : 'Identified 15% growth trend in technology sector.',
          confidence: 0.92
        }
      ]
      setDocumentInsights(mockInsights)
    }
  }, [currentStep, selectedFile, language])

  const getStepIcon = (step: WorkflowStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-600" />
    } else if (step.status === 'active') {
      return <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    } else {
      const icons = [Upload, Brain, Settings, Zap, Eye, CheckCircle]
      const Icon = icons[index] || FileText
      return <Icon className="w-6 h-6 text-gray-400" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'summary': return '📋'
      case 'recommendation': return '💡'
      case 'warning': return '⚠️'
      case 'insight': return '🎯'
      default: return '📄'
    }
  }

  return (
    <motion.div
      variants={motionSafe(staggerContainer)}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={motionSafe(slideUp)}>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {content[language].title}
        </h3>
        <p className="text-gray-600">
          {content[language].subtitle}
        </p>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div
        variants={motionSafe(slideUp)}
        className="space-y-4"
      >
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all ${
              step.status === 'active' 
                ? 'border-blue-400 bg-blue-50' 
                : step.status === 'completed'
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0">
              {getStepIcon(step, index)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`font-medium ${
                  step.status === 'active' ? 'text-blue-900' :
                  step.status === 'completed' ? 'text-green-900' :
                  'text-gray-700'
                }`}>
                  {step.name}
                </h4>
                {step.estimatedTime && step.status === 'pending' && (
                  <span className="text-xs text-gray-500">
                    {content[language].estimatedTime}: {step.estimatedTime}
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${
                step.status === 'active' ? 'text-blue-700' :
                step.status === 'completed' ? 'text-green-700' :
                'text-gray-600'
              }`}>
                {step.description}
              </p>
              
              {/* Progress bar for active step */}
              {step.status === 'active' && workflowActive && currentStep > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(processingProgress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-blue-600 mt-1">
                    <span>{content[language].processing}</span>
                    <span>{Math.round(Math.min(processingProgress, 100))}%</span>
                  </div>
                </div>
              )}

              {/* File upload area for first step */}
              {step.id === 'upload' && step.status === 'active' && !selectedFile && (
                <div className="mt-4">
                  <div 
                    className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => document.getElementById('workflow-file-input')?.click()}
                  >
                    <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-blue-700 font-medium">{content[language].startWorkflow}</p>
                    <input
                      id="workflow-file-input"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                      accept=".pdf,.docx,.doc,.txt,.xlsx,.xls"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Document Insights */}
      <AnimatePresence>
        {documentInsights.length > 0 && (
          <motion.div
            variants={motionSafe(slideUp)}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>AI {content[language].insights.insight}</span>
            </h4>
            <div className="grid gap-4">
              {documentInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  variants={motionSafe(slideUp)}
                  className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-purple-900">{insight.title}</h5>
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-purple-800 text-sm">{insight.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow Complete */}
      {currentStep >= steps.length - 1 && steps[steps.length - 1].status === 'completed' && (
        <motion.div
          variants={motionSafe(slideUp)}
          className="text-center py-6 border-t border-gray-200"
        >
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {content[language].completed}
          </h3>
          <button
            onClick={() => onWorkflowComplete?.({
              file: selectedFile,
              insights: documentInsights,
              steps: steps
            })}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 mx-auto"
          >
            <span>View Results</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}