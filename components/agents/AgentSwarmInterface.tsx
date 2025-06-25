'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Users, Zap, Activity, Network, Target, AlertCircle, CheckCircle, Settings, Play, Pause } from 'lucide-react'
import { motionSafe, slideUp, fadeIn, staggerContainer } from '@/lib/motion'
import OptimizedComponentWrapper from '@/components/optimization/OptimizedComponentWrapper'
import { OperationOptimizer } from '@/lib/performance-optimizer'
import { LiveRegionManager } from '@/lib/accessibility-enhancer'

interface Agent {
  id: string
  name: string
  type: 'legal' | 'financial' | 'project' | 'research' | 'general'
  status: 'idle' | 'active' | 'processing' | 'collaborating'
  confidence: number
  currentTask?: string
  connections: string[]
}

interface SwarmObjective {
  id: string
  title: string
  description: string
  requiredAgents: string[]
  progress: number
  status: 'planning' | 'executing' | 'completed' | 'failed'
}

interface SwarmMessage {
  id: string
  from: string
  to: string
  content: string
  type: 'task' | 'result' | 'query' | 'knowledge'
  timestamp: Date
}

interface AgentSwarmInterfaceProps {
  language?: 'vi' | 'en'
  onObjectiveComplete?: (objective: SwarmObjective) => void
}

export default function AgentSwarmInterface({ language = 'en', onObjectiveComplete }: AgentSwarmInterfaceProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [swarmActive, setSwarmActive] = useState(false)
  const [currentObjective, setCurrentObjective] = useState<SwarmObjective | null>(null)
  const [messages, setMessages] = useState<SwarmMessage[]>([])
  const [swarmEfficiency, setSwarmEfficiency] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const content = {
    vi: {
      title: 'Agent Swarm Control',
      subtitle: 'Điều khiển nhiều AI agents cùng lúc',
      selectAgents: 'Chọn Agents',
      setObjective: 'Đặt mục tiêu',
      startSwarm: 'Khởi động Swarm',
      stopSwarm: 'Dừng Swarm',
      efficiency: 'Hiệu suất',
      activeConnections: 'Kết nối hoạt động',
      messagesExchanged: 'Tin nhắn trao đổi',
      objectiveProgress: 'Tiến độ mục tiêu',
      agentStatus: {
        idle: 'Chờ',
        active: 'Hoạt động',
        processing: 'Đang xử lý',
        collaborating: 'Đang cộng tác'
      },
      objectives: {
        complexAnalysis: {
          title: 'Phân tích phức tạp',
          description: 'Phân tích đa chiều với nhiều góc nhìn'
        },
        documentSynthesis: {
          title: 'Tổng hợp tài liệu',
          description: 'Kết hợp thông tin từ nhiều nguồn'
        },
        problemSolving: {
          title: 'Giải quyết vấn đề',
          description: 'Tìm giải pháp tối ưu cho vấn đề phức tạp'
        }
      }
    },
    en: {
      title: 'Agent Swarm Control',
      subtitle: 'Orchestrate multiple AI agents simultaneously',
      selectAgents: 'Select Agents',
      setObjective: 'Set Objective',
      startSwarm: 'Start Swarm',
      stopSwarm: 'Stop Swarm',
      efficiency: 'Efficiency',
      activeConnections: 'Active Connections',
      messagesExchanged: 'Messages Exchanged',
      objectiveProgress: 'Objective Progress',
      agentStatus: {
        idle: 'Idle',
        active: 'Active',
        processing: 'Processing',
        collaborating: 'Collaborating'
      },
      objectives: {
        complexAnalysis: {
          title: 'Complex Analysis',
          description: 'Multi-dimensional analysis with diverse perspectives'
        },
        documentSynthesis: {
          title: 'Document Synthesis',
          description: 'Combine information from multiple sources'
        },
        problemSolving: {
          title: 'Problem Solving',
          description: 'Find optimal solutions for complex problems'
        }
      }
    }
  }

  // Initialize agents
  useEffect(() => {
    const initialAgents: Agent[] = [
      {
        id: 'legal-1',
        name: language === 'vi' ? 'Agent Luật Sư' : 'Legal Agent',
        type: 'legal',
        status: 'idle',
        confidence: 0.95,
        connections: ['financial-1', 'research-1']
      },
      {
        id: 'financial-1',
        name: language === 'vi' ? 'Agent Tài Chính' : 'Financial Agent',
        type: 'financial',
        status: 'idle',
        confidence: 0.88,
        connections: ['legal-1', 'project-1']
      },
      {
        id: 'project-1',
        name: language === 'vi' ? 'Agent Dự Án' : 'Project Agent',
        type: 'project',
        status: 'idle',
        confidence: 0.82,
        connections: ['financial-1', 'research-1']
      },
      {
        id: 'research-1',
        name: language === 'vi' ? 'Agent Nghiên Cứu' : 'Research Agent',
        type: 'research',
        status: 'idle',
        confidence: 0.90,
        connections: ['legal-1', 'project-1', 'general-1']
      },
      {
        id: 'general-1',
        name: language === 'vi' ? 'Agent Tổng Quát' : 'General Agent',
        type: 'general',
        status: 'idle',
        confidence: 0.75,
        connections: ['research-1']
      }
    ]
    setAgents(initialAgents)
  }, [language])

  // Draw network visualization
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const drawNetwork = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate positions
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * 0.3

      const agentPositions = agents.map((agent, index) => {
        const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2
        return {
          id: agent.id,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        }
      })

      // Draw connections
      if (swarmActive) {
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)'
        ctx.lineWidth = 2

        agents.forEach((agent) => {
          const fromPos = agentPositions.find(p => p.id === agent.id)
          if (!fromPos) return

          agent.connections.forEach((connectionId) => {
            const toPos = agentPositions.find(p => p.id === connectionId)
            if (!toPos) return

            if (selectedAgents.includes(agent.id) && selectedAgents.includes(connectionId)) {
              ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'
              ctx.lineWidth = 3
            } else {
              ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)'
              ctx.lineWidth = 1
            }

            ctx.beginPath()
            ctx.moveTo(fromPos.x, fromPos.y)
            ctx.lineTo(toPos.x, toPos.y)
            ctx.stroke()
          })
        })
      }

      // Draw agents
      agentPositions.forEach((pos, index) => {
        const agent = agents[index]
        const isSelected = selectedAgents.includes(agent.id)
        const size = isSelected ? 30 : 25

        // Agent circle
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI)
        
        if (agent.status === 'collaborating') {
          ctx.fillStyle = '#8B5CF6'
        } else if (agent.status === 'processing') {
          ctx.fillStyle = '#3B82F6'
        } else if (agent.status === 'active') {
          ctx.fillStyle = '#10B981'
        } else {
          ctx.fillStyle = '#9CA3AF'
        }
        
        ctx.fill()

        // Selection ring
        if (isSelected) {
          ctx.strokeStyle = '#8B5CF6'
          ctx.lineWidth = 3
          ctx.stroke()
        }

        // Agent icon (simplified)
        ctx.fillStyle = 'white'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🧠', pos.x, pos.y)

        // Agent name
        ctx.fillStyle = '#374151'
        ctx.font = '12px Arial'
        ctx.fillText(agent.name, pos.x, pos.y + size + 15)
      })
    }

    drawNetwork()
    const interval = setInterval(drawNetwork, 100)
    return () => clearInterval(interval)
  }, [agents, selectedAgents, swarmActive])

  // Simulate swarm activity
  useEffect(() => {
    if (!swarmActive || !currentObjective) return

    const activityInterval = setInterval(() => {
      // Update agent statuses
      setAgents(prevAgents => {
        return prevAgents.map(agent => {
          if (!selectedAgents.includes(agent.id)) return agent
          
          const statuses: Agent['status'][] = ['active', 'processing', 'collaborating']
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
          
          return {
            ...agent,
            status: randomStatus,
            currentTask: randomStatus === 'processing' ? 'Analyzing data...' : 
                        randomStatus === 'collaborating' ? 'Sharing insights...' : undefined
          }
        })
      })

      // Generate messages
      if (Math.random() > 0.5 && selectedAgents.length >= 2) {
        const fromAgent = selectedAgents[Math.floor(Math.random() * selectedAgents.length)]
        const toAgent = selectedAgents.filter(id => id !== fromAgent)[Math.floor(Math.random() * (selectedAgents.length - 1))]
        
        const messageTypes: SwarmMessage['type'][] = ['task', 'result', 'query', 'knowledge']
        const messageContents = {
          task: 'Analyzing section 3.2 of the document',
          result: 'Found 5 key insights in financial data',
          query: 'Need clarification on legal clause 7.1',
          knowledge: 'Sharing pattern recognition model'
        }
        
        const type = messageTypes[Math.floor(Math.random() * messageTypes.length)]
        
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          from: fromAgent,
          to: toAgent,
          content: messageContents[type],
          type,
          timestamp: new Date()
        }].slice(-10)) // Keep last 10 messages
      }

      // Update objective progress
      setCurrentObjective(prev => {
        if (!prev || prev.progress >= 100) return prev
        const newProgress = Math.min(prev.progress + Math.random() * 10, 100)
        
        if (newProgress >= 100) {
          onObjectiveComplete?.({
            ...prev,
            progress: 100,
            status: 'completed'
          })
        }
        
        return {
          ...prev,
          progress: newProgress,
          status: newProgress >= 100 ? 'completed' : 'executing'
        }
      })

      // Update efficiency
      setSwarmEfficiency(prev => {
        const target = 75 + selectedAgents.length * 5
        return prev + (target - prev) * 0.1
      })
    }, 1000)

    return () => clearInterval(activityInterval)
  }, [swarmActive, currentObjective, selectedAgents, onObjectiveComplete])

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId)
      }
      return [...prev, agentId]
    })
  }

  const handleStartSwarm = OperationOptimizer.debounce(
    'start-swarm',
    () => {
      if (selectedAgents.length < 2) return
      
      setSwarmActive(true)
      setCurrentObjective({
        id: 'obj-1',
        title: content[language].objectives.complexAnalysis.title,
        description: content[language].objectives.complexAnalysis.description,
        requiredAgents: selectedAgents,
        progress: 0,
        status: 'executing'
      })
      
      LiveRegionManager.announce('swarm-status', 
        language === 'vi' 
          ? 'Đã khởi động Agent Swarm'
          : 'Agent Swarm started'
      )
    },
    500
  )

  const handleStopSwarm = () => {
    setSwarmActive(false)
    setAgents(prev => prev.map(agent => ({ ...agent, status: 'idle', currentTask: undefined })))
    setMessages([])
  }

  const getAgentColor = (type: string) => {
    const colors = {
      legal: 'from-red-500 to-pink-500',
      financial: 'from-green-500 to-emerald-500',
      project: 'from-blue-500 to-indigo-500',
      research: 'from-purple-500 to-violet-500',
      general: 'from-gray-500 to-slate-500'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  return (
    <OptimizedComponentWrapper
      componentId="agent-swarm-interface"
      enablePerformanceOptimization={true}
      enableAccessibilityEnhancements={true}
      ariaLabel={content[language].title}
      ariaDescription={content[language].subtitle}
      role="application"
      onPerformanceIssue={(issue) => console.warn('AgentSwarm Performance:', issue)}
    >
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
      {/* Header */}
      <motion.div variants={motionSafe(slideUp)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content[language].title}
        </h2>
        <p className="text-gray-600">{content[language].subtitle}</p>
      </motion.div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Visualization */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Agent Network</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Processing</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Collaborating</span>
              </div>
            </div>
          </div>
          
          <canvas
            ref={canvasRef}
            className="w-full h-96 bg-gray-50 rounded-lg"
            style={{ minHeight: '384px' }}
          />

          {/* Agent Selection */}
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-gray-900">{content[language].selectAgents}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  disabled={swarmActive}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedAgents.includes(agent.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${swarmActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getAgentColor(agent.type)} rounded-full flex items-center justify-center`}>
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">
                        {content[language].agentStatus[agent.status]}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="mt-6 flex space-x-3">
            {!swarmActive ? (
              <button
                onClick={handleStartSwarm}
                disabled={selectedAgents.length < 2}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>{content[language].startSwarm}</span>
              </button>
            ) : (
              <button
                onClick={handleStopSwarm}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center justify-center space-x-2"
              >
                <Pause className="w-5 h-5" />
                <span>{content[language].stopSwarm}</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Status Panel */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="space-y-4"
        >
          {/* Efficiency Meter */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{content[language].efficiency}</h3>
            <div className="relative">
              <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-purple-300"
                  animate={{ height: `${swarmEfficiency}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">
                  {Math.round(swarmEfficiency)}%
                </span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600">{content[language].activeConnections}</p>
              <p className="text-2xl font-bold text-gray-900">
                {swarmActive ? selectedAgents.length * (selectedAgents.length - 1) / 2 : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{content[language].messagesExchanged}</p>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
            </div>
          </div>

          {/* Objective Progress */}
          {currentObjective && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {currentObjective.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {currentObjective.description}
              </p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {content[language].objectiveProgress}
                  </span>
                  <span className="text-sm font-medium text-purple-600">
                    {Math.round(currentObjective.progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    animate={{ width: `${currentObjective.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              {currentObjective.status === 'completed' && (
                <div className="mt-4 flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Completed!</span>
                </div>
              )}
            </div>
          )}

          {/* Message Stream */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Message Stream</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-purple-600">
                        {agents.find(a => a.id === message.from)?.name}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-blue-600">
                        {agents.find(a => a.id === message.to)?.name}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{message.content}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-400 text-center">No messages yet</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      </motion.div>
    </OptimizedComponentWrapper>
  )
}