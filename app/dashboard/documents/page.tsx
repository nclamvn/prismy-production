'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import EnhancedDocumentUpload from '@/components/documents/EnhancedDocumentUpload'
import AgentVisualization from '@/components/documents/AgentVisualization'
import { DocumentProcessor, ProcessedDocument } from '@/lib/document-processor'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import { FileText, Brain, Zap, Users, Activity } from 'lucide-react'

export default function DocumentsPage() {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [assignedAgent, setAssignedAgent] = useState<string | null>(null)
  const [processingSteps, setProcessingSteps] = useState<any[]>([])
  const [showVisualization, setShowVisualization] = useState(false)

  const content = {
    vi: {
      title: 'Quản lý tài liệu với AI',
      subtitle: 'Tải lên và phân tích tài liệu với sức mạnh của AI agents',
      recentDocuments: 'Tài liệu gần đây',
      agentActivity: 'Hoạt động AI Agent',
      documentStats: 'Thống kê tài liệu',
      totalDocuments: 'Tổng tài liệu',
      activeAgents: 'Agents đang hoạt động',
      processingTime: 'Thời gian xử lý trung bình',
      minutes: 'phút'
    },
    en: {
      title: 'AI-Powered Document Management',
      subtitle: 'Upload and analyze documents with the power of AI agents',
      recentDocuments: 'Recent Documents',
      agentActivity: 'AI Agent Activity',
      documentStats: 'Document Statistics',
      totalDocuments: 'Total Documents',
      activeAgents: 'Active Agents',
      processingTime: 'Average Processing Time',
      minutes: 'minutes'
    }
  }

  const language = 'en' // Get from context in real implementation

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setIsProcessing(true)
    setShowVisualization(true)

    try {
      const processed = await DocumentProcessor.processFile(file)
      setProcessedDocument(processed)
    } catch (error) {
      console.error('Error processing document:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAgentAssign = (file: File, agentType: string) => {
    setAssignedAgent(agentType)
    console.log(`Assigned ${agentType} agent to process ${file.name}`)
    
    // Simulate agent processing workflow
    const steps = [
      { id: 'analyze', name: 'Analyzing document structure', status: 'active' },
      { id: 'extract', name: 'Extracting key information', status: 'pending' },
      { id: 'insights', name: 'Generating AI insights', status: 'pending' },
      { id: 'complete', name: 'Processing complete', status: 'pending' }
    ]
    setProcessingSteps(steps)

    // Simulate step progression
    setTimeout(() => {
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'analyze' ? { ...step, status: 'completed' } :
        step.id === 'extract' ? { ...step, status: 'active' } : step
      ))
    }, 2000)
  }

  const mockStats = {
    totalDocuments: 47,
    activeAgents: 3,
    avgProcessingTime: 2.3
  }

  const mockRecentDocuments = [
    { name: 'Contract_Analysis.pdf', agent: 'Legal Agent', status: 'completed', time: '2 hours ago' },
    { name: 'Financial_Report_Q4.xlsx', agent: 'Financial Agent', status: 'processing', time: '1 hour ago' },
    { name: 'Project_Roadmap.docx', agent: 'Project Agent', status: 'completed', time: '3 hours ago' }
  ]

  return (
    <DashboardLayout language={language}>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          variants={motionSafe(slideUp)}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {content[language].title}
          </h1>
          <p className="text-gray-600">
            {content[language].subtitle}
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={motionSafe(slideUp)}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{content[language].totalDocuments}</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.totalDocuments}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={motionSafe(slideUp)}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{content[language].activeAgents}</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.activeAgents}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={motionSafe(slideUp)}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{content[language].processingTime}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockStats.avgProcessingTime} {content[language].minutes}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Upload */}
          <motion.div
            variants={motionSafe(slideUp)}
            initial="hidden"
            animate="visible"
          >
            <EnhancedDocumentUpload
              language={language as 'vi' | 'en'}
              onFileSelect={handleFileSelect}
              onAgentAssign={handleAgentAssign}
              isProcessing={isProcessing}
              showAgentVisualization={true}
            />
          </motion.div>

          {/* Agent Visualization */}
          <motion.div
            variants={motionSafe(slideUp)}
            initial="hidden"
            animate="visible"
          >
            {showVisualization && (
              <AgentVisualization
                selectedFile={selectedFile}
                assignedAgent={assignedAgent}
                processingSteps={processingSteps}
                language={language as 'vi' | 'en'}
              />
            )}
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Documents */}
          <motion.div
            variants={motionSafe(slideUp)}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <span>{content[language].recentDocuments}</span>
            </h3>
            <div className="space-y-3">
              {mockRecentDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-600">by {doc.agent}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      doc.status === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {doc.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{doc.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Agent Activity */}
          <motion.div
            variants={motionSafe(slideUp)}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span>{content[language].agentActivity}</span>
            </h3>
            <div className="space-y-4">
              {['Legal Agent', 'Financial Agent', 'Project Agent'].map((agent, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">{agent}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-500">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}