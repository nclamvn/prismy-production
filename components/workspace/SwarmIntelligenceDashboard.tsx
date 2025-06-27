'use client'

import React, { useState, useEffect } from 'react'
import {
  Brain,
  Users,
  Zap,
  MessageSquare,
  Activity,
  Target,
  TrendingUp,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useSwarmIntelligence, useAgentOperations } from '@/contexts/AgentContext'

interface SwarmIntelligenceDashboardProps {
  className?: string
}

export default function SwarmIntelligenceDashboard({
  className = '',
}: SwarmIntelligenceDashboardProps) {
  const { language } = useSSRSafeLanguage()
  const { agents, collaborations, swarmMetrics, querySwarm, lastUpdate } = useSwarmIntelligence()
  const { pauseAgent, resumeAgent, sendInstruction } = useAgentOperations()
  
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [swarmQuery, setSwarmQuery] = useState('')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [isQuerying, setIsQuerying] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'collaborations' | 'query'>('overview')

  const content = {
    vi: {
      title: 'Bảng điều khiển thông minh nhân tạo',
      subtitle: 'Giám sát và điều khiển hệ thống AI Agent Swarm',
      tabs: {
        overview: 'Tổng quan',
        agents: 'AI Agents',
        collaborations: 'Cộng tác',
        query: 'Truy vấn Swarm',
      },
      metrics: {
        totalAgents: 'Tổng số Agents',
        activeAgents: 'Agents hoạt động',
        efficiency: 'Hiệu suất trung bình',
        collaborations: 'Cộng tác đang diễn ra',
        intelligence: 'Trí tuệ tập thể',
      },
      agents: {
        status: {
          active: 'Hoạt động',
          paused: 'Tạm dừng',
          thinking: 'Đang suy nghĩ',
        },
        actions: {
          pause: 'Tạm dừng',
          resume: 'Tiếp tục',
          instruct: 'Hướng dẫn',
        },
        specialty: 'Chuyên môn',
        efficiency: 'Hiệu suất',
        lastActivity: 'Hoạt động cuối',
      },
      collaborations: {
        active: 'Đang hoạt động',
        completed: 'Hoàn thành',
        participants: 'Tham gia',
        objective: 'Mục tiêu',
        duration: 'Thời gian',
      },
      query: {
        title: 'Truy vấn Swarm Intelligence',
        placeholder: 'Hỏi AI Swarm về bất kỳ điều gì...',
        button: 'Gửi truy vấn',
        querying: 'Đang truy vấn...',
        noResult: 'Chưa có kết quả',
        confidence: 'Độ tin cậy',
        perspectives: 'Góc nhìn',
        recommendations: 'Khuyến nghị',
      },
      status: {
        connected: 'Đã kết nối',
        disconnected: 'Mất kết nối',
        lastUpdate: 'Cập nhật lần cuối',
      },
    },
    en: {
      title: 'AI Intelligence Dashboard',
      subtitle: 'Monitor and control the AI Agent Swarm system',
      tabs: {
        overview: 'Overview',
        agents: 'AI Agents',
        collaborations: 'Collaborations',
        query: 'Swarm Query',
      },
      metrics: {
        totalAgents: 'Total Agents',
        activeAgents: 'Active Agents',
        efficiency: 'Average Efficiency',
        collaborations: 'Active Collaborations',
        intelligence: 'Collective Intelligence',
      },
      agents: {
        status: {
          active: 'Active',
          paused: 'Paused',
          thinking: 'Thinking',
        },
        actions: {
          pause: 'Pause',
          resume: 'Resume',
          instruct: 'Instruct',
        },
        specialty: 'Specialty',
        efficiency: 'Efficiency',
        lastActivity: 'Last Activity',
      },
      collaborations: {
        active: 'Active',
        completed: 'Completed',
        participants: 'Participants',
        objective: 'Objective',
        duration: 'Duration',
      },
      query: {
        title: 'Swarm Intelligence Query',
        placeholder: 'Ask the AI Swarm anything...',
        button: 'Send Query',
        querying: 'Querying...',
        noResult: 'No results yet',
        confidence: 'Confidence',
        perspectives: 'Perspectives',
        recommendations: 'Recommendations',
      },
      status: {
        connected: 'Connected',
        disconnected: 'Disconnected',
        lastUpdate: 'Last updated',
      },
    },
  }

  const currentContent = content[language]

  // Handle swarm query
  const handleSwarmQuery = async () => {
    if (!swarmQuery.trim() || isQuerying) return

    setIsQuerying(true)
    try {
      const result = await querySwarm(swarmQuery)
      setQueryResult(result)
    } catch (error) {
      console.error('Swarm query error:', error)
      setQueryResult({ error: 'Query failed' })
    } finally {
      setIsQuerying(false)
    }
  }

  // Render metrics overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-1 bg-green-100 rounded-full text-sm text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            {currentContent.status.connected}
          </div>
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              {currentContent.status.lastUpdate}: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      {swarmMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {currentContent.metrics.totalAgents}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {swarmMetrics.totalAgents}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {currentContent.metrics.activeAgents}
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {swarmMetrics.activeAgents}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {currentContent.metrics.efficiency}
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(swarmMetrics.averageEfficiency)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {currentContent.metrics.collaborations}
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {swarmMetrics.totalCollaborations}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {currentContent.metrics.intelligence}
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  {Math.round(swarmMetrics.collectiveIntelligence)}
                </p>
              </div>
              <Brain className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Agent Activity</h3>
        </div>
        <div className="p-6">
          {agents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No agents active</p>
          ) : (
            <div className="space-y-4">
              {agents.slice(0, 5).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-sm text-gray-600">{agent.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{agent.efficiency}%</p>
                    <p className="text-xs text-gray-500">
                      {new Date(agent.lastActivity).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Render agents list
  const renderAgents = () => (
    <div className="space-y-6">
      {agents.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No AI Agents currently active</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`bg-white rounded-lg border p-6 ${
                selectedAgent === agent.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.specialty}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  agent.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentContent.agents.status[agent.status] || agent.status}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">{currentContent.agents.efficiency}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${agent.efficiency}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{agent.efficiency}%</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">{currentContent.agents.lastActivity}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(agent.lastActivity).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedAgent === agent.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (agent.status === 'active') {
                          pauseAgent(agent.id)
                        } else {
                          resumeAgent(agent.id)
                        }
                      }}
                      className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      {agent.status === 'active' ? (
                        <>
                          <Pause className="w-3 h-3 mr-1" />
                          {currentContent.agents.actions.pause}
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          {currentContent.agents.actions.resume}
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const instruction = prompt('Enter instruction for agent:')
                        if (instruction) {
                          sendInstruction(agent.id, instruction)
                        }
                      }}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {currentContent.agents.actions.instruct}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Render collaborations
  const renderCollaborations = () => (
    <div className="space-y-6">
      {collaborations.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No active collaborations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborations.map((collab) => (
            <div key={collab.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{collab.objective}</h3>
                  <p className="text-sm text-gray-600">
                    {currentContent.collaborations.participants}: {collab.participants.length}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  collab.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : collab.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentContent.collaborations[collab.status] || collab.status}
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {currentContent.collaborations.duration}: {
                  Math.round((new Date().getTime() - collab.startTime.getTime()) / 60000)
                } minutes
              </div>

              {collab.results && collab.results.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Results:</h4>
                  <div className="space-y-2">
                    {collab.results.slice(0, 3).map((result, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                        {typeof result === 'string' ? result : result.contribution || 'Result available'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Render swarm query
  const renderQuery = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {currentContent.query.title}
        </h3>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={swarmQuery}
              onChange={(e) => setSwarmQuery(e.target.value)}
              placeholder={currentContent.query.placeholder}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSwarmQuery()}
            />
            <button
              onClick={handleSwarmQuery}
              disabled={isQuerying || !swarmQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isQuerying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {currentContent.query.querying}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  {currentContent.query.button}
                </>
              )}
            </button>
          </div>

          {queryResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              {queryResult.error ? (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Query failed: {queryResult.error}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Query Results</h4>
                    <p className="text-sm text-gray-600">{queryResult.synthesis}</p>
                  </div>

                  {queryResult.averageConfidence && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {currentContent.query.confidence}: {Math.round(queryResult.averageConfidence * 100)}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${queryResult.averageConfidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {queryResult.perspectives && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {currentContent.query.perspectives}: 
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {queryResult.perspectives.map((perspective: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {perspective.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {queryResult.recommendations && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {currentContent.query.recommendations}:
                      </p>
                      <ul className="space-y-1">
                        {queryResult.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`swarm-intelligence-dashboard ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-8 border-b border-gray-200">
        {(['overview', 'agents', 'collaborations', 'query'] as const).map((tab) => (
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
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'collaborations' && renderCollaborations()}
        {activeTab === 'query' && renderQuery()}
      </div>
    </div>
  )
}