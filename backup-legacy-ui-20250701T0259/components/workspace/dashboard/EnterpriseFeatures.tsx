/**
 * PRISMY ENTERPRISE FEATURES COMPONENT
 * Advanced learning network and voice control interface
 * Manages knowledge transfer, swarm learning, and voice interactions
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  BookOpen,
  GraduationCap,
  Share2,
  Zap,
  Brain,
  Settings,
  Plus,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  Award,
  Target,
  MessageSquare,
  Command
} from 'lucide-react'

interface EnterpriseFeatureProps {
  onLearningSessionStart?: (session: any) => void
  onVoiceCommand?: (command: any) => void
}

export default function EnterpriseFeatures({ 
  onLearningSessionStart, 
  onVoiceCommand 
}: EnterpriseFeatureProps) {
  const [activeTab, setActiveTab] = useState<'network' | 'voice' | 'knowledge'>('network')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Learning Network States
  const [learningNodes, setLearningNodes] = useState<any[]>([])
  const [learningAnalytics, setLearningAnalytics] = useState<any>(null)
  const [knowledgeArticles, setKnowledgeArticles] = useState<any[]>([])
  const [learningSessions, setLearningSessions] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  
  // Voice Control States
  const [isListening, setIsListening] = useState(false)
  const [voiceProfile, setVoiceProfile] = useState<any>(null)
  const [voiceHistory, setVoiceHistory] = useState<any[]>([])
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    language: 'vi'
  })
  
  // UI States
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showKnowledgeForm, setShowKnowledgeForm] = useState(false)
  const [showLearningForm, setShowLearningForm] = useState(false)

  useEffect(() => {
    loadEnterpriseData()
  }, [])

  const loadEnterpriseData = async () => {
    try {
      setLoading(true)
      
      const [analyticsRes, nodesRes, articlesRes, sessionsRes, profileRes, historyRes] = await Promise.all([
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_learning_analytics' })
        }),
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_learning_nodes' })
        }),
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_knowledge_articles' })
        }),
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_learning_sessions' })
        }),
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_voice_profile' })
        }),
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_voice_history' })
        })
      ])

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setLearningAnalytics(data.data)
      }

      if (nodesRes.ok) {
        const data = await nodesRes.json()
        setLearningNodes(data.data || [])
      }

      if (articlesRes.ok) {
        const data = await articlesRes.json()
        setKnowledgeArticles(data.data || [])
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setLearningSessions(data.data || [])
      }

      if (profileRes.ok) {
        const data = await profileRes.json()
        setVoiceProfile(data.data)
      }

      if (historyRes.ok) {
        const data = await historyRes.json()
        setVoiceHistory(data.data || [])
      }

    } catch (err) {
      setError('Failed to load enterprise features')
      console.error('Enterprise data loading failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const startVoiceListening = async () => {
    try {
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_voice_listening' })
      })

      if (response.ok) {
        setIsListening(true)
      } else {
        setError('Failed to start voice listening')
      }
    } catch (err) {
      setError('Voice listening error')
      console.error('Voice listening failed:', err)
    }
  }

  const stopVoiceListening = async () => {
    try {
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop_voice_listening' })
      })

      if (response.ok) {
        setIsListening(false)
      }
    } catch (err) {
      console.error('Stop voice listening failed:', err)
    }
  }

  const processVoiceCommand = async (transcript: string) => {
    try {
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'process_voice_command',
          transcript,
          confidence: 1.0
        })
      })

      if (response.ok) {
        const result = await response.json()
        onVoiceCommand?.(result.data)
        
        // Refresh voice history
        const historyRes = await fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_voice_history' })
        })
        
        if (historyRes.ok) {
          const historyData = await historyRes.json()
          setVoiceHistory(historyData.data || [])
        }
      }
    } catch (err) {
      console.error('Voice command processing failed:', err)
    }
  }

  const createLearningSession = async (type: string, participants: string[], objective: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_swarm_learning',
          agentIds: participants,
          objective,
          learningDomain: type
        })
      })

      if (response.ok) {
        const result = await response.json()
        onLearningSessionStart?.(result.data)
        await loadEnterpriseData() // Refresh data
      } else {
        setError('Failed to create learning session')
      }
    } catch (err) {
      setError('Learning session creation failed')
      console.error('Learning session failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const createKnowledgeArticle = async (title: string, content: string, domain: string, difficulty: string) => {
    try {
      setLoading(true)
      
      // Use first available learning node as author
      const authorNodeId = learningNodes[0]?.agentId
      if (!authorNodeId) {
        setError('No agents available to author knowledge article')
        return
      }

      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_knowledge_article',
          authorAgentId: authorNodeId,
          title,
          content,
          articleDomain: domain,
          difficulty
        })
      })

      if (response.ok) {
        setShowKnowledgeForm(false)
        await loadEnterpriseData() // Refresh data
      } else {
        setError('Failed to create knowledge article')
      }
    } catch (err) {
      setError('Knowledge article creation failed')
      console.error('Knowledge article failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const speakText = async (text: string) => {
    try {
      await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'speak_text',
          text,
          language: voiceSettings.language
        })
      })
    } catch (err) {
      console.error('Text-to-speech failed:', err)
    }
  }

  const updateVoiceSettings = async (newSettings: any) => {
    try {
      const updatedSettings = { ...voiceSettings, ...newSettings }
      setVoiceSettings(updatedSettings)
      
      await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_voice_settings',
          voiceSettings: updatedSettings
        })
      })
    } catch (err) {
      console.error('Voice settings update failed:', err)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">Enterprise Features Error</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button 
          onClick={loadEnterpriseData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Network className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Enterprise Features
            </h3>
            <p className="text-sm text-gray-600">
              Learning networks and voice control
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={loadEnterpriseData}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enterprise Analytics Overview */}
      {learningAnalytics && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
          <h4 className="font-semibold text-gray-900 mb-4">Enterprise Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{learningAnalytics.totalNodes || 0}</div>
              <div className="text-sm text-gray-600">Learning Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{learningAnalytics.totalConnections || 0}</div>
              <div className="text-sm text-gray-600">Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{learningAnalytics.learningActivity || 0}</div>
              <div className="text-sm text-gray-600">Learning Activity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((learningAnalytics.networkHealth || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Network Health</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'network', label: 'Learning Network', icon: Network },
            { key: 'voice', label: 'Voice Control', icon: Mic },
            { key: 'knowledge', label: 'Knowledge Base', icon: BookOpen }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Learning Network Tab */}
        {activeTab === 'network' && (
          <div className="space-y-6">
            {/* Top Performers */}
            {learningAnalytics?.topPerformers && learningAnalytics.topPerformers.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Top Performing Nodes</h4>
                <div className="grid gap-4">
                  {learningAnalytics.topPerformers.slice(0, 3).map((node: any) => (
                    <div key={node.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Award className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{node.agentId}</div>
                          <div className="text-sm text-gray-600">Score: {node.contributionScore}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {Math.round(node.performance.efficiency * 100)}% efficiency
                        </div>
                        <div className="text-xs text-gray-500">
                          {node.specialization.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Sessions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Learning Sessions</h4>
                <button
                  onClick={() => setShowLearningForm(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Session</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {learningSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No learning sessions yet</p>
                    <p className="text-sm">Create a session to start collaborative learning</p>
                  </div>
                ) : (
                  learningSessions.slice(0, 5).map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          session.status === 'completed' ? 'bg-green-100' :
                          session.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Users className={`w-4 h-4 ${
                            session.status === 'completed' ? 'text-green-600' :
                            session.status === 'active' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{session.objective}</div>
                          <div className="text-sm text-gray-600">
                            {session.participants.length} participants • {session.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Learning Form Modal */}
            <AnimatePresence>
              {showLearningForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    className="bg-white rounded-lg p-6 w-full max-w-md"
                  >
                    <h4 className="font-semibold text-gray-900 mb-4">Create Learning Session</h4>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      createLearningSession(
                        formData.get('domain') as string,
                        learningNodes.slice(0, 2).map(node => node.agentId), // Use first 2 nodes
                        formData.get('objective') as string
                      )
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Learning Domain
                          </label>
                          <select
                            name="domain"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="document_analysis">Document Analysis</option>
                            <option value="collaboration">Collaboration</option>
                            <option value="efficiency">Efficiency Optimization</option>
                            <option value="specialization">Specialization</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Learning Objective
                          </label>
                          <textarea
                            name="objective"
                            required
                            rows={3}
                            placeholder="Describe what the agents should learn..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowLearningForm(false)}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          Create Session
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Voice Control Tab */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            {/* Voice Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Voice Controls</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Listening */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Voice Listening</span>
                    <button
                      onClick={isListening ? stopVoiceListening : startVoiceListening}
                      className={`p-3 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {isListening ? 'Listening for voice commands...' : 'Click to start listening'}
                  </div>
                  
                  {/* Test Voice Command */}
                  <div>
                    <input
                      type="text"
                      placeholder="Type a test command..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          processVoiceCommand(e.currentTarget.value.trim())
                          e.currentTarget.value = ''
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Press Enter to test voice command
                    </div>
                  </div>
                </div>

                {/* Voice Settings */}
                <div className="space-y-4">
                  <span className="text-sm font-medium text-gray-700">Voice Settings</span>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Language</label>
                      <select
                        value={voiceSettings.language}
                        onChange={(e) => updateVoiceSettings({ language: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="vi">Vietnamese</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Speed: {voiceSettings.speed}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceSettings.speed}
                        onChange={(e) => updateVoiceSettings({ speed: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Volume: {Math.round(voiceSettings.volume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceSettings.volume}
                        onChange={(e) => updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    
                    <button
                      onClick={() => speakText('Xin chào! Đây là hệ thống điều khiển giọng nói của Prismy.')}
                      className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center space-x-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Test Voice</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Command History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Voice Command History</h4>
              
              <div className="space-y-3">
                {voiceHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No voice commands yet</p>
                    <p className="text-sm">Start talking to your agents</p>
                  </div>
                ) : (
                  voiceHistory.slice(0, 10).map((command: any) => (
                    <div key={command.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        command.status === 'executed' ? 'bg-green-100' :
                        command.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        <Command className={`w-4 h-4 ${
                          command.status === 'executed' ? 'text-green-600' :
                          command.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{command.transcript}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {command.intent?.category} • {Math.round(command.confidence * 100)}% confidence
                        </div>
                        {command.response && (
                          <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                            {command.response.text}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(command.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            {/* Knowledge Articles */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Knowledge Articles</h4>
                <button
                  onClick={() => setShowKnowledgeForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Article</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {knowledgeArticles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No knowledge articles yet</p>
                    <p className="text-sm">Create articles to share knowledge across agents</p>
                  </div>
                ) : (
                  knowledgeArticles.slice(0, 10).map((article: any) => (
                    <div key={article.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{article.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{article.domain}</div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Difficulty: {article.difficulty}</span>
                          <span>Views: {article.usage?.viewCount || 0}</span>
                          <span>Success: {Math.round((article.usage?.successRate || 0) * 100)}%</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        article.difficulty === 'expert' ? 'bg-red-100 text-red-800' :
                        article.difficulty === 'advanced' ? 'bg-orange-100 text-orange-800' :
                        article.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {article.difficulty}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Knowledge Form Modal */}
            <AnimatePresence>
              {showKnowledgeForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    className="bg-white rounded-lg p-6 w-full max-w-lg"
                  >
                    <h4 className="font-semibold text-gray-900 mb-4">Create Knowledge Article</h4>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      createKnowledgeArticle(
                        formData.get('title') as string,
                        formData.get('content') as string,
                        formData.get('domain') as string,
                        formData.get('difficulty') as string
                      )
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            required
                            placeholder="Article title..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Domain
                          </label>
                          <select
                            name="domain"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="document_analysis">Document Analysis</option>
                            <option value="legal">Legal</option>
                            <option value="financial">Financial</option>
                            <option value="project_management">Project Management</option>
                            <option value="research">Research</option>
                            <option value="general">General</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Difficulty
                          </label>
                          <select
                            name="difficulty"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                          </label>
                          <textarea
                            name="content"
                            required
                            rows={5}
                            placeholder="Article content..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowKnowledgeForm(false)}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Create Article
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}