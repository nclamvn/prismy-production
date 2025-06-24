'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  MoreVertical, 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Zap,
  Brain,
  Heart,
  Shield,
  Briefcase,
  GraduationCap
} from 'lucide-react'

import { useLanguage } from '@/contexts/LanguageContext'
import { useAgentGestures } from './MobileGestureProvider'
import '../../styles/ai-workspace-components.css'

interface Agent {
  id: string
  name: string
  nameVi: string
  specialty: string
  specialtyVi: string
  avatar: string
  status: 'active' | 'thinking' | 'idle' | 'paused'
  personality: string
  personalityVi: string
  tasksCompleted: number
  tasksInProgress: number
  efficiency: number
  specializations: string[]
  culturalContext: string
  lastActivity: string
  collaboration?: string[]
}

interface Task {
  id: string
  title: string
  titleVi: string
  agentId: string
  status: 'pending' | 'in_progress' | 'completed' | 'requires_review'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedTime: string
  progress: number
  documentId?: string
}

interface AgentDashboardProps {
  selectedAgentId?: string
  onAgentSelect?: (agent: Agent) => void
  onTaskAssign?: (task: Task, agentId: string) => void
  className?: string
}

export default function AgentDashboard({
  selectedAgentId,
  onAgentSelect,
  onTaskAssign,
  className = ''
}: AgentDashboardProps) {
  const { language } = useLanguage()
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCollaborationMode, setShowCollaborationMode] = useState(false)
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0)
  
  // Agent-specific gesture handling
  const agentGestures = useAgentGestures()

  // Initialize agents with 12+ specialized personalities
  useEffect(() => {
    const initialAgents: Agent[] = [
      {
        id: 'legal-expert',
        name: 'Legal Expert',
        nameVi: 'Chuyên Gia Pháp Lý',
        specialty: 'Vietnamese Legal Documents',
        specialtyVi: 'Tài Liệu Pháp Lý Việt Nam',
        avatar: '⚖️',
        status: 'active',
        personality: 'Professional, detail-oriented, compliance-focused',
        personalityVi: 'Chuyên nghiệp, tỉ mỉ, tập trung vào tuân thủ',
        tasksCompleted: 23,
        tasksInProgress: 3,
        efficiency: 95,
        specializations: ['Contract Analysis', 'Compliance Review', 'Legal Research'],
        culturalContext: 'Vietnamese business law and regulations',
        lastActivity: '2 minutes ago',
        collaboration: ['financial-analyst', 'project-manager']
      },
      {
        id: 'financial-analyst',
        name: 'Financial Analyst',
        nameVi: 'Chuyên Viên Tài Chính',
        specialty: 'Financial Analysis & Reports',
        specialtyVi: 'Phân Tích Tài Chính & Báo Cáo',
        avatar: '📊',
        status: 'thinking',
        personality: 'Analytical, data-driven, strategic thinking',
        personalityVi: 'Phân tích, dựa trên dữ liệu, tư duy chiến lược',
        tasksCompleted: 31,
        tasksInProgress: 2,
        efficiency: 89,
        specializations: ['Budget Analysis', 'Market Research', 'Risk Assessment'],
        culturalContext: 'Vietnamese financial markets and regulations',
        lastActivity: '5 minutes ago',
        collaboration: ['legal-expert', 'business-strategist']
      },
      {
        id: 'research-assistant',
        name: 'Research Assistant',
        nameVi: 'Trợ Lý Nghiên Cứu',
        specialty: 'Academic Research & Citations',
        specialtyVi: 'Nghiên Cứu Học Thuật & Trích Dẫn',
        avatar: '🔬',
        status: 'active',
        personality: 'Thorough, methodical, evidence-based',
        personalityVi: 'Kỹ lưỡng, có phương pháp, dựa trên bằng chứng',
        tasksCompleted: 18,
        tasksInProgress: 4,
        efficiency: 92,
        specializations: ['Literature Review', 'Data Analysis', 'Citation Management'],
        culturalContext: 'Vietnamese academic standards and practices',
        lastActivity: '1 minute ago'
      },
      {
        id: 'content-strategist',
        name: 'Content Strategist',
        nameVi: 'Chuyên Gia Nội Dung',
        specialty: 'Marketing & Cultural Content',
        specialtyVi: 'Marketing & Nội Dung Văn Hóa',
        avatar: '✨',
        status: 'idle',
        personality: 'Creative, culturally aware, audience-focused',
        personalityVi: 'Sáng tạo, hiểu biết văn hóa, tập trung khách hàng',
        tasksCompleted: 27,
        tasksInProgress: 1,
        efficiency: 88,
        specializations: ['Content Planning', 'Cultural Adaptation', 'SEO Optimization'],
        culturalContext: 'Vietnamese market preferences and cultural nuances',
        lastActivity: '10 minutes ago'
      },
      {
        id: 'technical-writer',
        name: 'Technical Writer',
        nameVi: 'Biên Tập Viên Kỹ Thuật',
        specialty: 'Technical Documentation',
        specialtyVi: 'Tài Liệu Kỹ Thuật',
        avatar: '📝',
        status: 'active',
        personality: 'Clear, structured, user-centric',
        personalityVi: 'Rõ ràng, có cấu trúc, lấy người dùng làm trung tâm',
        tasksCompleted: 15,
        tasksInProgress: 3,
        efficiency: 94,
        specializations: ['API Documentation', 'User Guides', 'Process Documentation'],
        culturalContext: 'Vietnamese technical terminology and standards',
        lastActivity: '3 minutes ago'
      },
      {
        id: 'project-manager',
        name: 'Project Manager',
        nameVi: 'Quản Lý Dự Án',
        specialty: 'Project Planning & Coordination',
        specialtyVi: 'Lập Kế Hoạch & Điều Phối Dự Án',
        avatar: '🎯',
        status: 'active',
        personality: 'Organized, collaborative, results-oriented',
        personalityVi: 'Có tổ chức, hợp tác, hướng kết quả',
        tasksCompleted: 12,
        tasksInProgress: 5,
        efficiency: 91,
        specializations: ['Timeline Management', 'Resource Planning', 'Risk Management'],
        culturalContext: 'Vietnamese business hierarchy and workflow',
        lastActivity: '1 minute ago',
        collaboration: ['legal-expert', 'technical-writer']
      },
      {
        id: 'cultural-advisor',
        name: 'Cultural Advisor',
        nameVi: 'Cố Vấn Văn Hóa',
        specialty: 'Vietnamese Cultural Intelligence',
        specialtyVi: 'Trí Tuệ Văn Hóa Việt Nam',
        avatar: '🏮',
        status: 'thinking',
        personality: 'Culturally sensitive, diplomatic, insightful',
        personalityVi: 'Nhạy cảm văn hóa, khéo léo, sâu sắc',
        tasksCompleted: 8,
        tasksInProgress: 2,
        efficiency: 97,
        specializations: ['Cultural Analysis', 'Etiquette Guidance', 'Local Customs'],
        culturalContext: 'Deep Vietnamese cultural knowledge and traditions',
        lastActivity: '4 minutes ago'
      },
      {
        id: 'business-strategist',
        name: 'Business Strategist',
        nameVi: 'Chuyên Gia Chiến Lược',
        specialty: 'Strategic Business Analysis',
        specialtyVi: 'Phân Tích Chiến Lược Kinh Doanh',
        avatar: '🚀',
        status: 'idle',
        personality: 'Strategic, innovative, forward-thinking',
        personalityVi: 'Chiến lược, đổi mới, tư duy tương lai',
        tasksCompleted: 19,
        tasksInProgress: 1,
        efficiency: 86,
        specializations: ['Market Analysis', 'Competitive Intelligence', 'Growth Strategy'],
        culturalContext: 'Vietnamese market dynamics and business practices',
        lastActivity: '15 minutes ago',
        collaboration: ['financial-analyst', 'content-strategist']
      },
      {
        id: 'data-scientist',
        name: 'Data Scientist',
        nameVi: 'Nhà Khoa Học Dữ Liệu',
        specialty: 'Data Analysis & Insights',
        specialtyVi: 'Phân Tích Dữ Liệu & Thông Tin',
        avatar: '📈',
        status: 'active',
        personality: 'Analytical, curious, pattern-focused',
        personalityVi: 'Phân tích, tò mò, tập trung vào mẫu hình',
        tasksCompleted: 14,
        tasksInProgress: 3,
        efficiency: 93,
        specializations: ['Statistical Analysis', 'Predictive Modeling', 'Data Visualization'],
        culturalContext: 'Vietnamese data privacy and analysis standards',
        lastActivity: '2 minutes ago'
      },
      {
        id: 'customer-advocate',
        name: 'Customer Advocate',
        nameVi: 'Đại Diện Khách Hàng',
        specialty: 'Customer Experience & Support',
        specialtyVi: 'Trải Nghiệm & Hỗ Trợ Khách Hàng',
        avatar: '💝',
        status: 'active',
        personality: 'Empathetic, solution-focused, responsive',
        personalityVi: 'Đồng cảm, tập trung giải pháp, phản ứng nhanh',
        tasksCompleted: 25,
        tasksInProgress: 2,
        efficiency: 90,
        specializations: ['Customer Support', 'Feedback Analysis', 'Experience Design'],
        culturalContext: 'Vietnamese customer service expectations and etiquette',
        lastActivity: '1 minute ago'
      },
      {
        id: 'innovation-catalyst',
        name: 'Innovation Catalyst',
        nameVi: 'Chuyên Gia Đổi Mới',
        specialty: 'Innovation & Future Trends',
        specialtyVi: 'Đổi Mới & Xu Hướng Tương Lai',
        avatar: '💡',
        status: 'thinking',
        personality: 'Creative, disruptive, future-oriented',
        personalityVi: 'Sáng tạo, đột phá, hướng tương lai',
        tasksCompleted: 7,
        tasksInProgress: 4,
        efficiency: 85,
        specializations: ['Trend Analysis', 'Innovation Strategy', 'Technology Scouting'],
        culturalContext: 'Vietnamese innovation landscape and startup ecosystem',
        lastActivity: '6 minutes ago'
      },
      {
        id: 'compliance-guardian',
        name: 'Compliance Guardian',
        nameVi: 'Người Giám Sát Tuân Thủ',
        specialty: 'Regulatory Compliance & Ethics',
        specialtyVi: 'Tuân Thủ Quy Định & Đạo Đức',
        avatar: '🛡️',
        status: 'idle',
        personality: 'Meticulous, ethical, risk-aware',
        personalityVi: 'Tỉ mỉ, có đạo đức, nhận thức rủi ro',
        tasksCompleted: 11,
        tasksInProgress: 1,
        efficiency: 96,
        specializations: ['Regulatory Review', 'Ethics Assessment', 'Risk Compliance'],
        culturalContext: 'Vietnamese regulatory environment and compliance standards',
        lastActivity: '12 minutes ago'
      }
    ]

    setAgents(initialAgents)
  }, [])
  
  // Gesture handlers for agent dashboard
  useEffect(() => {
    // Swipe for agent navigation
    const unsubscribeSwipe = agentGestures.registerAgentGesture('swipe', (gesture) => {
      if (gesture.direction === 'left' && currentAgentIndex < agents.length - 1) {
        const nextIndex = currentAgentIndex + 1
        setCurrentAgentIndex(nextIndex)
        if (onAgentSelect && agents[nextIndex]) {
          onAgentSelect(agents[nextIndex])
        }
      } else if (gesture.direction === 'right' && currentAgentIndex > 0) {
        const prevIndex = currentAgentIndex - 1
        setCurrentAgentIndex(prevIndex)
        if (onAgentSelect && agents[prevIndex]) {
          onAgentSelect(agents[prevIndex])
        }
      }
    })
    
    // Long press for collaboration mode
    const unsubscribeLongPress = agentGestures.registerAgentGesture('longpress', (gesture) => {
      setShowCollaborationMode(!showCollaborationMode)
    })
    
    // Tap for agent selection
    const unsubscribeTap = agentGestures.registerAgentGesture('tap', (gesture) => {
      // Get tapped agent from DOM context if available
      const target = gesture.target as HTMLElement
      const agentCard = target.closest('.agent-card')
      if (agentCard) {
        const agentId = agentCard.getAttribute('data-agent-id')
        const agent = agents.find(a => a.id === agentId)
        if (agent && onAgentSelect) {
          onAgentSelect(agent)
          setCurrentAgentIndex(agents.indexOf(agent))
        }
      }
    })
    
    return () => {
      unsubscribeSwipe()
      unsubscribeLongPress()
      unsubscribeTap()
    }
  }, [agentGestures, agents, currentAgentIndex, onAgentSelect, showCollaborationMode])

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'thinking': return 'text-yellow-600 bg-yellow-100'
      case 'idle': return 'text-gray-600 bg-gray-100'
      case 'paused': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active': return <Zap className="w-3 h-3" />
      case 'thinking': return <Brain className="w-3 h-3" />
      case 'idle': return <Clock className="w-3 h-3" />
      case 'paused': return <Pause className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  const activeAgents = agents.filter(agent => agent.status === 'active').length
  const totalTasks = agents.reduce((sum, agent) => sum + agent.tasksCompleted + agent.tasksInProgress, 0)
  const averageEfficiency = Math.round(agents.reduce((sum, agent) => sum + agent.efficiency, 0) / agents.length)

  return (
    <div className={`agent-dashboard ${className}`}>
      {/* Dashboard Header */}
      <div className="agent-dashboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="agent-dashboard-title">
              {language === 'vi' ? 'AI Agents Dashboard' : 'AI Agents Dashboard'}
            </h3>
            <p className="agent-dashboard-subtitle">
              {language === 'vi' 
                ? `${activeAgents} agents đang hoạt động • ${totalTasks} nhiệm vụ`
                : `${activeAgents} active agents • ${totalTasks} tasks`
              }
            </p>
          </div>
          
          <button
            onClick={() => setShowCollaborationMode(!showCollaborationMode)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              showCollaborationMode 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            {language === 'vi' ? 'Cộng Tác' : 'Collaborate'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {language === 'vi' ? 'Hiệu Suất' : 'Efficiency'}
              </span>
            </div>
            <p className="text-xl font-bold text-green-900 mt-1">{averageEfficiency}%</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {language === 'vi' ? 'Hoạt Động' : 'Active'}
              </span>
            </div>
            <p className="text-xl font-bold text-blue-900 mt-1">{activeAgents}/{agents.length}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                {language === 'vi' ? 'Nhiệm Vụ' : 'Tasks'}
              </span>
            </div>
            <p className="text-xl font-bold text-purple-900 mt-1">{totalTasks}</p>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="agent-list">
        <AnimatePresence>
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              className={`agent-card ${selectedAgentId === agent.id ? 'active' : ''}`}
              data-agent-id={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => onAgentSelect && onAgentSelect(agent)}
            >
              <div className="agent-avatar">
                {agent.avatar}
              </div>
              
              <div className="agent-info">
                <h4 className="agent-name">
                  {language === 'vi' ? agent.nameVi : agent.name}
                </h4>
                <p className="agent-specialty">
                  {language === 'vi' ? agent.specialtyVi : agent.specialty}
                </p>
                
                {/* Collaboration indicators */}
                {agent.collaboration && showCollaborationMode && (
                  <div className="flex gap-1 mt-1">
                    {agent.collaboration.map(collaboratorId => {
                      const collaborator = agents.find(a => a.id === collaboratorId)
                      return collaborator ? (
                        <span key={collaboratorId} className="text-xs" title={collaborator.name}>
                          {collaborator.avatar}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`agent-status-badge ${agent.status}`}>
                  {getStatusIcon(agent.status)}
                  <span>
                    {agent.status === 'active' 
                      ? (language === 'vi' ? 'Hoạt động' : 'Active')
                      : agent.status === 'thinking'
                      ? (language === 'vi' ? 'Suy nghĩ' : 'Thinking')
                      : agent.status === 'idle'
                      ? (language === 'vi' ? 'Sẵn sàng' : 'Ready')
                      : (language === 'vi' ? 'Tạm dừng' : 'Paused')
                    }
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 text-right">
                  <p>{agent.efficiency}% {language === 'vi' ? 'hiệu suất' : 'efficiency'}</p>
                  <p>{agent.tasksInProgress} {language === 'vi' ? 'đang làm' : 'in progress'}</p>
                </div>
              </div>

              {/* Agent controls */}
              <div className="ml-2">
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Agent Details */}
      {selectedAgentId && (
        <AnimatePresence>
          <motion.div
            className="p-4 border-t border-gray-200 bg-gray-50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {(() => {
              const selectedAgent = agents.find(a => a.id === selectedAgentId)
              if (!selectedAgent) return null

              return (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {language === 'vi' ? selectedAgent.nameVi : selectedAgent.name}
                  </h4>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>{language === 'vi' ? 'Tính cách:' : 'Personality:'}</strong>{' '}
                      {language === 'vi' ? selectedAgent.personalityVi : selectedAgent.personality}
                    </p>
                    
                    <p>
                      <strong>{language === 'vi' ? 'Bối cảnh văn hóa:' : 'Cultural Context:'}</strong>{' '}
                      {selectedAgent.culturalContext}
                    </p>
                    
                    <div>
                      <strong>{language === 'vi' ? 'Chuyên môn:' : 'Specializations:'}</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedAgent.specializations.map(spec => (
                          <span 
                            key={spec}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      {language === 'vi' ? 'Hoạt động cuối:' : 'Last activity:'} {selectedAgent.lastActivity}
                    </p>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}