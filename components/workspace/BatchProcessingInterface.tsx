'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  FileText,
  Download,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Loader2,
  Settings,
  Filter,
  BarChart3,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useWorkspaceIntelligence } from '@/contexts/WorkspaceIntelligenceContext'
import { useDocumentPipeline } from '@/contexts/PipelineContext'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'

interface BatchJob {
  id: string
  name: string
  type: 'translation' | 'analysis' | 'extraction'
  status: 'pending' | 'processing' | 'completed' | 'error' | 'paused'
  documents: {
    id: string
    name: string
    size: number
    status: 'waiting' | 'processing' | 'completed' | 'error'
    progress: number
    result?: any
    error?: string
  }[]
  config: {
    targetLanguage?: string
    qualityTier?: 'standard' | 'premium'
    outputFormat?: 'pdf' | 'docx' | 'txt'
    analysisType?: 'content' | 'legal' | 'financial'
  }
  progress: {
    completed: number
    total: number
    startTime?: Date
    estimatedCompletion?: Date
  }
  statistics: {
    totalCredits: number
    totalWords: number
    avgProcessingTime: number
  }
}

interface BatchProcessingInterfaceProps {
  className?: string
}

export default function BatchProcessingInterface({
  className = ''
}: BatchProcessingInterfaceProps) {
  const { language } = useSSRSafeLanguage()
  const { 
    trackActivity, 
    startAIOperation, 
    updateAIOperation, 
    addSuggestion 
  } = useWorkspaceIntelligence()
  const { processDocument } = useDocumentPipeline()

  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([])
  const [activeBatchJob, setActiveBatchJob] = useState<BatchJob | null>(null)
  const [isCreatingJob, setIsCreatingJob] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [jobConfig, setJobConfig] = useState({
    name: '',
    type: 'translation' as BatchJob['type'],
    targetLanguage: 'en',
    qualityTier: 'standard' as 'standard' | 'premium',
    outputFormat: 'pdf' as 'pdf' | 'docx' | 'txt'
  })

  const content = {
    vi: {
      title: 'Xử lý hàng loạt',
      subtitle: 'Xử lý nhiều tài liệu cùng lúc với AI',
      createJob: 'Tạo công việc mới',
      jobName: 'Tên công việc',
      jobType: 'Loại xử lý',
      selectFiles: 'Chọn tài liệu',
      startJob: 'Bắt đầu xử lý',
      pauseJob: 'Tạm dừng',
      resumeJob: 'Tiếp tục',
      downloadResults: 'Tải kết quả',
      statistics: 'Thống kê',
      progress: 'Tiến độ',
      estimatedTime: 'Thời gian ước tính',
      totalCredits: 'Tổng credits',
      totalWords: 'Tổng từ',
      types: {
        translation: 'Dịch thuật',
        analysis: 'Phân tích',
        extraction: 'Trích xuất văn bản'
      },
      status: {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        completed: 'Hoàn thành',
        error: 'Lỗi',
        paused: 'Tạm dừng'
      },
      qualityTiers: {
        standard: 'Tiêu chuẩn',
        premium: 'Cao cấp'
      },
      outputFormats: {
        pdf: 'PDF',
        docx: 'Word',
        txt: 'Văn bản'
      }
    },
    en: {
      title: 'Batch Processing',
      subtitle: 'Process multiple documents simultaneously with AI',
      createJob: 'Create New Job',
      jobName: 'Job Name',
      jobType: 'Processing Type',
      selectFiles: 'Select Documents',
      startJob: 'Start Processing',
      pauseJob: 'Pause',
      resumeJob: 'Resume',
      downloadResults: 'Download Results',
      statistics: 'Statistics',
      progress: 'Progress',
      estimatedTime: 'Estimated Time',
      totalCredits: 'Total Credits',
      totalWords: 'Total Words',
      types: {
        translation: 'Translation',
        analysis: 'Analysis',
        extraction: 'Text Extraction'
      },
      status: {
        pending: 'Pending',
        processing: 'Processing',
        completed: 'Completed',
        error: 'Error',
        paused: 'Paused'
      },
      qualityTiers: {
        standard: 'Standard',
        premium: 'Premium'
      },
      outputFormats: {
        pdf: 'PDF',
        docx: 'Word',
        txt: 'Text'
      }
    }
  }

  const currentContent = content[language]

  // Handle file selection
  const handleFileSelection = useCallback((files: FileList) => {
    const fileArray = Array.from(files)
    setSelectedFiles(prev => [...prev, ...fileArray])
  }, [])

  // Create new batch job
  const createBatchJob = useCallback(async () => {
    if (!jobConfig.name.trim() || selectedFiles.length === 0) return

    setIsCreatingJob(true)

    try {
      const newJob: BatchJob = {
        id: `batch_${Date.now()}`,
        name: jobConfig.name,
        type: jobConfig.type,
        status: 'pending',
        documents: selectedFiles.map((file, index) => ({
          id: `doc_${Date.now()}_${index}`,
          name: file.name,
          size: file.size,
          status: 'waiting',
          progress: 0
        })),
        config: {
          targetLanguage: jobConfig.targetLanguage,
          qualityTier: jobConfig.qualityTier,
          outputFormat: jobConfig.outputFormat
        },
        progress: {
          completed: 0,
          total: selectedFiles.length
        },
        statistics: {
          totalCredits: 0,
          totalWords: 0,
          avgProcessingTime: 0
        }
      }

      setBatchJobs(prev => [...prev, newJob])
      setActiveBatchJob(newJob)

      // Track batch job creation
      trackActivity({
        type: 'workflow_creation',
        mode: 'documents',
        data: {
          jobId: newJob.id,
          jobName: newJob.name,
          jobType: newJob.type,
          documentCount: selectedFiles.length
        },
        success: true
      })

      // Add suggestion for monitoring
      addSuggestion({
        type: 'workflow',
        title: 'Monitor Batch Progress',
        description: `Track the progress of your ${newJob.name} batch job`,
        action: () => setActiveBatchJob(newJob),
        priority: 'medium',
        context: { jobId: newJob.id }
      })

      // Reset form
      setSelectedFiles([])
      setJobConfig({
        name: '',
        type: 'translation',
        targetLanguage: 'en',
        qualityTier: 'standard',
        outputFormat: 'pdf'
      })

    } catch (error) {
      console.error('Failed to create batch job:', error)
    } finally {
      setIsCreatingJob(false)
    }
  }, [jobConfig, selectedFiles, trackActivity, addSuggestion])

  // Start batch job processing
  const startBatchJob = useCallback(async (job: BatchJob) => {
    setBatchJobs(prev => prev.map(j => 
      j.id === job.id 
        ? { 
            ...j, 
            status: 'processing',
            progress: { ...j.progress, startTime: new Date() }
          }
        : j
    ))

    // Start AI operation for the batch
    const operationId = startAIOperation({
      type: job.type === 'translation' ? 'translation' : 'document_processing',
      input: {
        jobId: job.id,
        documents: job.documents,
        config: job.config
      }
    })

    // Process documents sequentially
    for (let i = 0; i < job.documents.length; i++) {
      const doc = job.documents[i]
      
      try {
        // Update document status to processing
        setBatchJobs(prev => prev.map(j => 
          j.id === job.id 
            ? {
                ...j,
                documents: j.documents.map(d => 
                  d.id === doc.id 
                    ? { ...d, status: 'processing', progress: 0 }
                    : d
                )
              }
            : j
        ))

        // Simulate document processing (replace with real API calls)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

        // Update document as completed
        setBatchJobs(prev => prev.map(j => 
          j.id === job.id 
            ? {
                ...j,
                documents: j.documents.map(d => 
                  d.id === doc.id 
                    ? { 
                        ...d, 
                        status: 'completed', 
                        progress: 100,
                        result: {
                          downloadUrl: `#download_${doc.id}`,
                          creditsUsed: Math.floor(Math.random() * 50) + 10
                        }
                      }
                    : d
                ),
                progress: {
                  ...j.progress,
                  completed: i + 1
                }
              }
            : j
        ))

      } catch (error) {
        // Mark document as failed
        setBatchJobs(prev => prev.map(j => 
          j.id === job.id 
            ? {
                ...j,
                documents: j.documents.map(d => 
                  d.id === doc.id 
                    ? { 
                        ...d, 
                        status: 'error', 
                        error: 'Processing failed' 
                      }
                    : d
                )
              }
            : j
        ))
      }
    }

    // Mark job as completed
    setBatchJobs(prev => prev.map(j => 
      j.id === job.id 
        ? { 
            ...j, 
            status: 'completed',
            progress: {
              ...j.progress,
              estimatedCompletion: new Date()
            }
          }
        : j
    ))

    // Update AI operation as completed
    updateAIOperation(operationId, {
      status: 'completed',
      progress: 100,
      endTime: new Date()
    })

    // Track completion
    trackActivity({
      type: 'workflow_creation',
      mode: 'documents',
      data: {
        jobId: job.id,
        status: 'completed',
        documentsProcessed: job.documents.length
      },
      success: true
    })

  }, [startAIOperation, updateAIOperation, trackActivity])

  // Pause batch job
  const pauseBatchJob = useCallback((jobId: string) => {
    setBatchJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'paused' } : j
    ))
  }, [])

  // Resume batch job
  const resumeBatchJob = useCallback((job: BatchJob) => {
    startBatchJob(job)
  }, [startBatchJob])

  // Render job creation form
  const renderJobCreation = () => (
    <motion.div
      variants={motionSafe(slideUp)}
      className="bg-white rounded-xl p-6 border border-gray-200"
    >
      <div className="flex items-center mb-6">
        <Plus className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {currentContent.createJob}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Job Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {currentContent.jobName}
          </label>
          <input
            type="text"
            value={jobConfig.name}
            onChange={(e) => setJobConfig(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--surface-outline)',
              color: 'var(--text-primary)'
            }}
            placeholder="My Batch Translation Job"
          />
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {currentContent.jobType}
          </label>
          <select
            value={jobConfig.type}
            onChange={(e) => setJobConfig(prev => ({ ...prev, type: e.target.value as BatchJob['type'] }))}
            className="w-full px-3 py-2 border rounded-lg"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--surface-outline)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="translation">{currentContent.types.translation}</option>
            <option value="analysis">{currentContent.types.analysis}</option>
            <option value="extraction">{currentContent.types.extraction}</option>
          </select>
        </div>

        {/* Configuration based on job type */}
        {jobConfig.type === 'translation' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Target Language
              </label>
              <select
                value={jobConfig.targetLanguage}
                onChange={(e) => setJobConfig(prev => ({ ...prev, targetLanguage: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--surface-outline)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Quality Tier
              </label>
              <select
                value={jobConfig.qualityTier}
                onChange={(e) => setJobConfig(prev => ({ ...prev, qualityTier: e.target.value as 'standard' | 'premium' }))}
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--surface-outline)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="standard">{currentContent.qualityTiers.standard}</option>
                <option value="premium">{currentContent.qualityTiers.premium}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Output Format
              </label>
              <select
                value={jobConfig.outputFormat}
                onChange={(e) => setJobConfig(prev => ({ ...prev, outputFormat: e.target.value as 'pdf' | 'docx' | 'txt' }))}
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--surface-outline)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="pdf">{currentContent.outputFormats.pdf}</option>
                <option value="docx">{currentContent.outputFormats.docx}</option>
                <option value="txt">{currentContent.outputFormats.txt}</option>
              </select>
            </div>
          </div>
        )}

        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {currentContent.selectFiles} ({selectedFiles.length} selected)
          </label>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            style={{ borderColor: 'var(--surface-outline)' }}
            onClick={() => document.getElementById('batch-file-upload')?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              Click to select documents for batch processing
            </p>
          </div>
          <input
            id="batch-file-upload"
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: 'var(--surface-panel)' }}
              >
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Job Button */}
        <button
          onClick={createBatchJob}
          disabled={isCreatingJob || !jobConfig.name.trim() || selectedFiles.length === 0}
          className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--notebooklm-primary)',
            color: 'var(--surface-elevated)'
          }}
        >
          {isCreatingJob ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
              Creating...
            </>
          ) : (
            currentContent.createJob
          )}
        </button>
      </div>
    </motion.div>
  )

  // Render batch job card
  const renderBatchJob = (job: BatchJob) => (
    <motion.div
      key={job.id}
      variants={motionSafe(fadeIn)}
      className="bg-white rounded-xl p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setActiveBatchJob(job)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {job.name}
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {currentContent.types[job.type]} • {job.documents.length} documents
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          job.status === 'completed' ? 'bg-green-100 text-green-800' :
          job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
          job.status === 'error' ? 'bg-red-100 text-red-800' :
          job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {currentContent.status[job.status]}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span>{currentContent.progress}</span>
          <span>{job.progress.completed}/{job.progress.total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(job.progress.completed / job.progress.total) * 100}%`,
              backgroundColor: 'var(--notebooklm-primary)'
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {job.status === 'pending' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              startBatchJob(job)
            }}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--notebooklm-primary)',
              color: 'var(--surface-elevated)'
            }}
          >
            <Play className="w-4 h-4 mr-1 inline" />
            {currentContent.startJob}
          </button>
        )}
        
        {job.status === 'processing' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              pauseBatchJob(job.id)
            }}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium border"
            style={{
              borderColor: 'var(--surface-outline)',
              color: 'var(--text-primary)'
            }}
          >
            <Pause className="w-4 h-4 mr-1 inline" />
            {currentContent.pauseJob}
          </button>
        )}

        {job.status === 'paused' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              resumeBatchJob(job)
            }}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--notebooklm-primary)',
              color: 'var(--surface-elevated)'
            }}
          >
            <Play className="w-4 h-4 mr-1 inline" />
            {currentContent.resumeJob}
          </button>
        )}

        {job.status === 'completed' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Handle bulk download
            }}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--success-500)',
              color: 'white'
            }}
          >
            <Download className="w-4 h-4 mr-1 inline" />
            {currentContent.downloadResults}
          </button>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className={`batch-processing-interface ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {currentContent.title}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {currentContent.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Creation Panel */}
        <div className="lg:col-span-1">
          {renderJobCreation()}
        </div>

        {/* Job List */}
        <div className="lg:col-span-2 space-y-6">
          {batchJobs.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>
                No batch jobs yet. Create your first batch processing job.
              </p>
            </div>
          ) : (
            <motion.div
              variants={motionSafe({ hidden: { opacity: 0 }, visible: { opacity: 1 } })}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {batchJobs.map(job => renderBatchJob(job))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {activeBatchJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {activeBatchJob.name}
              </h3>
              <button
                onClick={() => setActiveBatchJob(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Job Statistics */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--notebooklm-primary)' }}>
                    {activeBatchJob.progress.completed}/{activeBatchJob.progress.total}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {currentContent.progress}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--success-500)' }}>
                    {activeBatchJob.statistics.totalCredits}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {currentContent.totalCredits}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--warning-500)' }}>
                    {activeBatchJob.statistics.totalWords}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {currentContent.totalWords}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {activeBatchJob.statistics.avgProcessingTime}s
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Avg Time
                  </div>
                </div>
              </div>
            </div>

            {/* Document List */}
            <div className="p-6">
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Documents ({activeBatchJob.documents.length})
              </h4>
              <div className="space-y-3">
                {activeBatchJob.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-panel)' }}
                  >
                    <div className="flex items-center flex-1">
                      <FileText className="w-5 h-5 mr-3" style={{ color: 'var(--text-muted)' }} />
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {doc.name}
                        </p>
                        <div className="flex items-center space-x-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span>{(doc.size / 1024).toFixed(1)} KB</span>
                          <span>{doc.progress}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {doc.status === 'processing' && (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--notebooklm-primary)' }} />
                      )}
                      {doc.status === 'completed' && (
                        <CheckCircle className="w-4 h-4" style={{ color: 'var(--success-500)' }} />
                      )}
                      {doc.status === 'error' && (
                        <AlertTriangle className="w-4 h-4" style={{ color: 'var(--error-500)' }} />
                      )}
                      
                      {doc.result?.downloadUrl && (
                        <button
                          onClick={() => window.open(doc.result.downloadUrl, '_blank')}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Download className="w-4 h-4" style={{ color: 'var(--notebooklm-primary)' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}