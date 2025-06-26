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
      {/* Header - NotebookLM Style */}
      <motion.div variants={motionSafe(slideUp)}>
        <h2 
          className="mb-2"
          style={{
            fontSize: 'var(--sys-headline-large-size)',
            lineHeight: 'var(--sys-headline-large-line-height)',
            fontFamily: 'var(--sys-headline-large-font)',
            fontWeight: 'var(--sys-headline-large-weight)',
            color: 'var(--text-primary)'
          }}
        >
          {content[language].title}
        </h2>
        <p 
          style={{
            fontSize: 'var(--sys-body-large-size)',
            lineHeight: 'var(--sys-body-large-line-height)',
            fontFamily: 'var(--sys-body-large-font)',
            fontWeight: 'var(--sys-body-large-weight)',
            color: 'var(--text-secondary)'
          }}
        >
          {content[language].subtitle}
        </p>
      </motion.div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Visualization - Material Design 3 Style */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="lg:col-span-2 p-6"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderRadius: 'var(--mat-card-elevated-container-shape)',
            border: '1px solid var(--surface-outline)',
            boxShadow: 'var(--elevation-level-1)'
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 
              style={{
                fontSize: 'var(--sys-title-medium-size)',
                lineHeight: 'var(--sys-title-medium-line-height)',
                fontFamily: 'var(--sys-title-medium-font)',
                fontWeight: 'var(--sys-title-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              Agent Network
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span 
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Active
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span 
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Processing
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span 
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Collaborating
                </span>
              </div>
            </div>
          </div>
          
          <canvas
            ref={canvasRef}
            className="w-full h-96"
            style={{ 
              minHeight: '384px',
              backgroundColor: 'var(--surface-panel)',
              borderRadius: 'var(--shape-corner-medium)'
            }}
          />

          {/* Agent Selection */}
          <div className="mt-6 space-y-3">
            <h4 
              style={{
                fontSize: 'var(--sys-label-large-size)',
                lineHeight: 'var(--sys-label-large-line-height)',
                fontFamily: 'var(--sys-label-large-font)',
                fontWeight: 'var(--sys-label-large-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {content[language].selectAgents}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  disabled={swarmActive}
                  className="p-3 transition-all"
                  style={{
                    borderRadius: 'var(--mat-card-outlined-container-shape)',
                    border: selectedAgents.includes(agent.id) 
                      ? '2px solid var(--notebooklm-primary)'
                      : '1px solid var(--surface-outline)',
                    backgroundColor: selectedAgents.includes(agent.id)
                      ? 'var(--notebooklm-primary-light)'
                      : 'var(--surface-elevated)',
                    opacity: swarmActive ? 0.6 : 1,
                    cursor: swarmActive ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getAgentColor(agent.type)} rounded-full flex items-center justify-center`}>
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p 
                        className="text-sm"
                        style={{
                          fontSize: 'var(--sys-label-medium-size)',
                          lineHeight: 'var(--sys-label-medium-line-height)',
                          fontFamily: 'var(--sys-label-medium-font)',
                          fontWeight: 'var(--sys-label-medium-weight)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {agent.name}
                      </p>
                      <p 
                        className="text-xs"
                        style={{
                          fontSize: 'var(--sys-body-small-size)',
                          lineHeight: 'var(--sys-body-small-line-height)',
                          fontFamily: 'var(--sys-body-small-font)',
                          fontWeight: 'var(--sys-body-small-weight)',
                          color: 'var(--text-secondary)'
                        }}
                      >
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
                className="flex-1 py-3 text-white flex items-center justify-center space-x-2 transition-all"
                style={{
                  backgroundColor: 'var(--notebooklm-primary)',
                  borderRadius: 'var(--mat-button-filled-container-shape)',
                  fontSize: 'var(--sys-label-large-size)',
                  lineHeight: 'var(--sys-label-large-line-height)',
                  fontFamily: 'var(--sys-label-large-font)',
                  fontWeight: 'var(--sys-label-large-weight)',
                  border: 'none',
                  opacity: selectedAgents.length < 2 ? 0.5 : 1,
                  cursor: selectedAgents.length < 2 ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (selectedAgents.length >= 2) {
                    e.currentTarget.style.backgroundColor = 'var(--notebooklm-primary-dark)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAgents.length >= 2) {
                    e.currentTarget.style.backgroundColor = 'var(--notebooklm-primary)'
                  }
                }}
              >
                <Play className="w-5 h-5" />
                <span>{content[language].startSwarm}</span>
              </button>
            ) : (
              <button
                onClick={handleStopSwarm}
                className="flex-1 py-3 text-white flex items-center justify-center space-x-2 transition-all"
                style={{
                  backgroundColor: '#DC2626',
                  borderRadius: 'var(--mat-button-filled-container-shape)',
                  fontSize: 'var(--sys-label-large-size)',
                  lineHeight: 'var(--sys-label-large-line-height)',
                  fontFamily: 'var(--sys-label-large-font)',
                  fontWeight: 'var(--sys-label-large-weight)',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B91C1C'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#DC2626'
                }}
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
          {/* Efficiency Meter - Material Design 3 Style */}
          <div 
            className="p-6"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)'
            }}
          >
            <h3 
              className="mb-4"
              style={{
                fontSize: 'var(--sys-title-medium-size)',
                lineHeight: 'var(--sys-title-medium-line-height)',
                fontFamily: 'var(--sys-title-medium-font)',
                fontWeight: 'var(--sys-title-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {content[language].efficiency}
            </h3>
            <div className="relative">
              <div 
                className="w-full h-32 overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface-panel)',
                  borderRadius: 'var(--shape-corner-medium)'
                }}
              >
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    background: `linear-gradient(to top, var(--notebooklm-primary), var(--notebooklm-primary-light))`
                  }}
                  animate={{ height: `${swarmEfficiency}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-3xl font-bold"
                  style={{
                    fontSize: 'var(--sys-headline-medium-size)',
                    lineHeight: 'var(--sys-headline-medium-line-height)',
                    fontFamily: 'var(--sys-headline-medium-font)',
                    fontWeight: 'var(--sys-headline-medium-weight)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {Math.round(swarmEfficiency)}%
                </span>
              </div>
            </div>
          </div>

          {/* Metrics - Material Design 3 Style */}
          <div 
            className="p-6 space-y-4"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)'
            }}
          >
            <div>
              <p 
                className="text-sm"
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  lineHeight: 'var(--sys-body-medium-line-height)',
                  fontFamily: 'var(--sys-body-medium-font)',
                  fontWeight: 'var(--sys-body-medium-weight)',
                  color: 'var(--text-secondary)'
                }}
              >
                {content[language].activeConnections}
              </p>
              <p 
                className="text-2xl font-bold"
                style={{
                  fontSize: 'var(--sys-headline-medium-size)',
                  lineHeight: 'var(--sys-headline-medium-line-height)',
                  fontFamily: 'var(--sys-headline-medium-font)',
                  fontWeight: 'var(--sys-headline-medium-weight)',
                  color: 'var(--text-primary)'
                }}
              >
                {swarmActive ? selectedAgents.length * (selectedAgents.length - 1) / 2 : 0}
              </p>
            </div>
            <div>
              <p 
                className="text-sm"
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  lineHeight: 'var(--sys-body-medium-line-height)',
                  fontFamily: 'var(--sys-body-medium-font)',
                  fontWeight: 'var(--sys-body-medium-weight)',
                  color: 'var(--text-secondary)'
                }}
              >
                {content[language].messagesExchanged}
              </p>
              <p 
                className="text-2xl font-bold"
                style={{
                  fontSize: 'var(--sys-headline-medium-size)',
                  lineHeight: 'var(--sys-headline-medium-line-height)',
                  fontFamily: 'var(--sys-headline-medium-font)',
                  fontWeight: 'var(--sys-headline-medium-weight)',
                  color: 'var(--text-primary)'
                }}
              >
                {messages.length}
              </p>
            </div>
          </div>

          {/* Objective Progress */}
          {currentObjective && (
            <div 
              className="p-6"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderRadius: 'var(--mat-card-elevated-container-shape)',
                border: '1px solid var(--surface-outline)',
                boxShadow: 'var(--elevation-level-1)'
              }}
            >
              <h3 
                className="mb-2"
                style={{
                  fontSize: 'var(--sys-title-medium-size)',
                  lineHeight: 'var(--sys-title-medium-line-height)',
                  fontFamily: 'var(--sys-title-medium-font)',
                  fontWeight: 'var(--sys-title-medium-weight)',
                  color: 'var(--text-primary)'
                }}
              >
                {currentObjective.title}
              </h3>
              <p 
                className="text-sm mb-4"
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  lineHeight: 'var(--sys-body-medium-line-height)',
                  fontFamily: 'var(--sys-body-medium-font)',
                  fontWeight: 'var(--sys-body-medium-weight)',
                  color: 'var(--text-secondary)'
                }}
              >
                {currentObjective.description}
              </p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className="text-sm"
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      fontWeight: 'var(--sys-body-medium-weight)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {content[language].objectiveProgress}
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{
                      fontSize: 'var(--sys-label-medium-size)',
                      lineHeight: 'var(--sys-label-medium-line-height)',
                      fontFamily: 'var(--sys-label-medium-font)',
                      fontWeight: 'var(--sys-label-medium-weight)',
                      color: 'var(--notebooklm-primary)'
                    }}
                  >
                    {Math.round(currentObjective.progress)}%
                  </span>
                </div>
                <div 
                  className="w-full h-2"
                  style={{
                    backgroundColor: 'var(--surface-panel)',
                    borderRadius: 'var(--shape-corner-full)'
                  }}
                >
                  <motion.div
                    className="h-2"
                    style={{
                      borderRadius: 'var(--shape-corner-full)',
                      background: `linear-gradient(to right, var(--notebooklm-primary), var(--notebooklm-primary-dark))`
                    }}
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

          {/* Message Stream - Material Design 3 Style */}
          <div 
            className="p-6"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--mat-card-elevated-container-shape)',
              border: '1px solid var(--surface-outline)',
              boxShadow: 'var(--elevation-level-1)'
            }}
          >
            <h3 
              className="mb-4"
              style={{
                fontSize: 'var(--sys-title-medium-size)',
                lineHeight: 'var(--sys-title-medium-line-height)',
                fontFamily: 'var(--sys-title-medium-font)',
                fontWeight: 'var(--sys-title-medium-weight)',
                color: 'var(--text-primary)'
              }}
            >
              Message Stream
            </h3>
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
                      <span 
                        className="font-medium"
                        style={{ color: 'var(--notebooklm-primary)' }}
                      >
                        {agents.find(a => a.id === message.from)?.name}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>→</span>
                      <span 
                        className="font-medium"
                        style={{ color: 'var(--notebooklm-primary-dark)' }}
                      >
                        {agents.find(a => a.id === message.to)?.name}
                      </span>
                    </div>
                    <p 
                      className="mt-1"
                      style={{
                        fontSize: 'var(--sys-body-small-size)',
                        lineHeight: 'var(--sys-body-small-line-height)',
                        fontFamily: 'var(--sys-body-small-font)',
                        fontWeight: 'var(--sys-body-small-weight)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {message.content}
                    </p>
                  </motion.div>
                ))
              ) : (
                <p 
                  className="text-center"
                  style={{
                    fontSize: 'var(--sys-body-medium-size)',
                    lineHeight: 'var(--sys-body-medium-line-height)',
                    fontFamily: 'var(--sys-body-medium-font)',
                    fontWeight: 'var(--sys-body-medium-weight)',
                    color: 'var(--text-disabled)'
                  }}
                >
                  No messages yet
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      </motion.div>
    </OptimizedComponentWrapper>
  )
}