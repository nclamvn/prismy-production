'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, FileText, Zap, CheckCircle, Clock, AlertCircle, Activity } from 'lucide-react'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'

interface AgentVisualizationProps {
  selectedFile: File | null
  assignedAgent: string | null
  processingSteps: any[]
  language: 'vi' | 'en'
}

interface AgentNode {
  id: string
  name: string
  type: 'legal' | 'financial' | 'project' | 'research' | 'general'
  status: 'idle' | 'active' | 'processing' | 'completed'
  confidence: number
  currentTask?: string
}

export default function AgentVisualization({ 
  selectedFile, 
  assignedAgent, 
  processingSteps,
  language 
}: AgentVisualizationProps) {
  const content = {
    vi: {
      title: 'Hình ảnh hóa Agent',
      noAgent: 'Chưa có agent nào được gán',
      agentNetwork: 'Mạng lưới AI Agent',
      processingWorkflow: 'Quy trình xử lý',
      agentStatus: 'Trạng thái Agent',
      idle: 'Chờ',
      active: 'Hoạt động',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      confidence: 'Độ tin cậy',
      currentTask: 'Tác vụ hiện tại',
      noFile: 'Chưa có tài liệu nào được chọn'
    },
    en: {
      title: 'Agent Visualization',
      noAgent: 'No agent assigned yet',
      agentNetwork: 'AI Agent Network',
      processingWorkflow: 'Processing Workflow',
      agentStatus: 'Agent Status',
      idle: 'Idle',
      active: 'Active',
      processing: 'Processing',
      completed: 'Completed',
      confidence: 'Confidence',
      currentTask: 'Current Task',
      noFile: 'No document selected'
    }
  }

  // Mock agent network data
  const agentNodes: AgentNode[] = [
    {
      id: 'legal-agent',
      name: language === 'vi' ? 'Agent Luật Sư' : 'Legal Agent',
      type: 'legal',
      status: assignedAgent === 'legal' ? 'processing' : 'idle',
      confidence: 0.95,
      currentTask: assignedAgent === 'legal' ? 'Analyzing contract terms' : undefined
    },
    {
      id: 'financial-agent',
      name: language === 'vi' ? 'Agent Tài Chính' : 'Financial Agent',
      type: 'financial',
      status: assignedAgent === 'financial' ? 'processing' : 'idle',
      confidence: 0.88,
      currentTask: assignedAgent === 'financial' ? 'Processing financial data' : undefined
    },
    {
      id: 'project-agent',
      name: language === 'vi' ? 'Agent Quản Lý Dự Án' : 'Project Agent',
      type: 'project',
      status: assignedAgent === 'project' ? 'processing' : 'idle',
      confidence: 0.82,
      currentTask: assignedAgent === 'project' ? 'Analyzing project timeline' : undefined
    },
    {
      id: 'research-agent',
      name: language === 'vi' ? 'Agent Nghiên Cứu' : 'Research Agent',
      type: 'research',
      status: assignedAgent === 'research' ? 'processing' : 'idle',
      confidence: 0.90,
      currentTask: assignedAgent === 'research' ? 'Extracting research insights' : undefined
    }
  ]

  const getAgentColor = (type: string, status: string) => {
    const colors = {
      legal: status === 'processing' ? 'from-red-500 to-pink-500' : 'from-red-300 to-pink-300',
      financial: status === 'processing' ? 'from-green-500 to-emerald-500' : 'from-green-300 to-emerald-300',
      project: status === 'processing' ? 'from-blue-500 to-indigo-500' : 'from-blue-300 to-indigo-300',
      research: status === 'processing' ? 'from-purple-500 to-violet-500' : 'from-purple-300 to-violet-300',
      general: status === 'processing' ? 'from-gray-500 to-slate-500' : 'from-gray-300 to-slate-300'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-white" />
      case 'active':
        return <Activity className="w-3 h-3 text-white" />
      default:
        return <Clock className="w-3 h-3 text-white opacity-50" />
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'active':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  if (!selectedFile) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>{content[language].title}</span>
        </h3>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{content[language].noFile}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={motionSafe(staggerContainer)}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
    >
      <motion.div
        variants={motionSafe(slideUp)}
        className="flex items-center justify-between"
      >
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>{content[language].title}</span>
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">{content[language].active}</span>
        </div>
      </motion.div>

      {/* Agent Network Visualization */}
      <motion.div
        variants={motionSafe(slideUp)}
        className="space-y-4"
      >
        <h4 className="font-medium text-gray-900">{content[language].agentNetwork}</h4>
        <div className="relative">
          {/* Central Document Node */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-full border border-gray-200">
                  {selectedFile.name.substring(0, 10)}...
                </span>
              </div>
            </div>
          </div>

          {/* Agent Nodes */}
          <div className="grid grid-cols-2 gap-4">
            {agentNodes.map((agent, index) => (
              <motion.div
                key={agent.id}
                variants={motionSafe(slideUp)}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                  agent.status === 'processing' 
                    ? 'border-purple-400 bg-purple-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`relative w-10 h-10 bg-gradient-to-r ${getAgentColor(agent.type, agent.status)} rounded-full flex items-center justify-center`}>
                    <Brain className="w-5 h-5 text-white" />
                    <div className="absolute -top-1 -right-1">
                      {getStatusIcon(agent.status)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500 mb-1">
                      {content[language].confidence}: {Math.round(agent.confidence * 100)}%
                    </p>
                    {agent.currentTask && (
                      <p className="text-xs text-purple-600 font-medium">
                        {agent.currentTask}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Connection Lines */}
                {agent.status === 'processing' && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                    <div className="w-0.5 h-8 bg-gradient-to-t from-purple-400 to-transparent"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Processing Workflow */}
      {processingSteps.length > 0 && (
        <motion.div
          variants={motionSafe(slideUp)}
          className="space-y-4"
        >
          <h4 className="font-medium text-gray-900">{content[language].processingWorkflow}</h4>
          <div className="space-y-2">
            {processingSteps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={motionSafe(slideUp)}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  step.status === 'active' ? 'bg-blue-50 border border-blue-200' :
                  step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                {getStepIcon(step.status)}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    step.status === 'active' ? 'text-blue-900' :
                    step.status === 'completed' ? 'text-green-900' :
                    'text-gray-700'
                  }`}>
                    {step.name}
                  </p>
                  {step.status === 'active' && (
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{width: '60%'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Real-time Metrics */}
      <motion.div
        variants={motionSafe(slideUp)}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Real-time Processing</span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-purple-700">
            <span>Memory: 45MB</span>
            <span>CPU: 23%</span>
            <span>Processing: 1.2s</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}