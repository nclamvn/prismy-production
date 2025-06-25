'use client'

import { useState, useEffect } from 'react'
import { Agent } from '@/components/workspace/types'

interface SwarmMetrics {
  totalAgents: number
  activeAgents: number
  totalCollaborations: number
  averageEfficiency: number
  emergentBehaviors: number
  collectiveIntelligence: number
}

interface AgentCollaboration {
  id: string
  participants: string[]
  objective: string
  status: 'forming' | 'active' | 'completed' | 'failed'
  startTime: string
  endTime?: string
}

interface DashboardData {
  swarmMetrics: SwarmMetrics
  agents: Agent[]
  collaborations: AgentCollaboration[]
  timestamp: string
}

export default function AgentsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [swarmQuery, setSwarmQuery] = useState('')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)

  // Load dashboard data
  useEffect(() => {
    fetchDashboardData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/agents/dashboard')
      const result = await response.json()

      if (result.success) {
        setDashboardData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      setError('Network error loading dashboard')
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendInstruction = async (agentId: string, instruction: string) => {
    try {
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_instruction',
          agentId,
          instruction
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('Instruction sent successfully!')
        fetchDashboardData()
      } else {
        alert('Failed to send instruction: ' + result.error)
      }
    } catch (err) {
      alert('Error sending instruction')
    }
  }

  const querySwarm = async () => {
    if (!swarmQuery.trim()) return

    setQueryLoading(true)
    try {
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query_swarm',
          query: swarmQuery,
          timeout: 30000
        })
      })

      const result = await response.json()
      if (result.success) {
        setQueryResult(result.data)
      } else {
        alert('Swarm query failed: ' + result.error)
      }
    } catch (err) {
      alert('Error querying swarm')
    } finally {
      setQueryLoading(false)
    }
  }

  const pauseAgent = async (agentId: string) => {
    try {
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause_agent',
          agentId
        })
      })

      const result = await response.json()
      if (result.success) {
        fetchDashboardData()
      } else {
        alert('Failed to pause agent: ' + result.error)
      }
    } catch (err) {
      alert('Error pausing agent')
    }
  }

  const resumeAgent = async (agentId: string) => {
    try {
      const response = await fetch('/api/agents/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume_agent',
          agentId
        })
      })

      const result = await response.json()
      if (result.success) {
        fetchDashboardData()
      } else {
        alert('Failed to resume agent: ' + result.error)
      }
    } catch (err) {
      alert('Error resuming agent')
    }
  }

  if (loading) {
    return (
      <div className="zen-container space-zen">
        <div className="content-zen text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading agent swarm...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="zen-container space-zen">
        <div className="content-zen text-center text-red-600">
          <h1 className="text-display-lg mb-4">Agent Dashboard</h1>
          <p>Error: {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="zen-container space-zen">
        <div className="content-zen text-center">
          <h1 className="text-display-lg mb-4">Agent Dashboard</h1>
          <p>No dashboard data available</p>
        </div>
      </div>
    )
  }

  const { swarmMetrics, agents, collaborations } = dashboardData

  return (
    <div className="zen-container space-zen max-w-7xl">
      <div className="content-zen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-lg mb-4">🤖 Autonomous Agent Swarm</h1>
          <p className="text-body-lg text-mono-medium">
            Revolutionary document agents working autonomously for you 24/7
          </p>
        </div>

        {/* Swarm Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{swarmMetrics.totalAgents}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{swarmMetrics.activeAgents}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{swarmMetrics.totalCollaborations}</div>
            <div className="text-sm text-gray-600">Collaborations</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{Math.round(swarmMetrics.averageEfficiency)}%</div>
            <div className="text-sm text-gray-600">Efficiency</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-red-600">{swarmMetrics.emergentBehaviors}</div>
            <div className="text-sm text-gray-600">Emergent</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-indigo-600">{Math.round(swarmMetrics.collectiveIntelligence)}</div>
            <div className="text-sm text-gray-600">Collective IQ</div>
          </div>
        </div>

        {/* Swarm Query */}
        <div className="bg-white p-6 rounded-lg border shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">🧠 Query Your Agent Swarm</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={swarmQuery}
              onChange={(e) => setSwarmQuery(e.target.value)}
              placeholder="Ask your agents anything..."
              className="flex-1 px-3 py-2 border rounded-md"
              onKeyPress={(e) => e.key === 'Enter' && querySwarm()}
            />
            <button
              onClick={querySwarm}
              disabled={queryLoading || !swarmQuery.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
            >
              {queryLoading ? '🤔 Thinking...' : 'Query Swarm'}
            </button>
          </div>
          
          {queryResult && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Swarm Response:</h3>
              <p className="mb-2"><strong>Query:</strong> {queryResult.query}</p>
              <p className="mb-2"><strong>Confidence:</strong> {(queryResult.averageConfidence * 100).toFixed(1)}%</p>
              <p className="mb-2"><strong>Perspectives:</strong> {queryResult.perspectives?.join(', ')}</p>
              <p className="mb-2"><strong>Synthesis:</strong> {queryResult.synthesis}</p>
              {queryResult.recommendations && (
                <div>
                  <strong>Recommendations:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {queryResult.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agent List */}
        <div className="bg-white p-6 rounded-lg border shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">👥 Your Autonomous Agents</h2>
          
          {agents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No agents yet. Upload documents to create autonomous agents!</p>
              <a href="/dashboard" className="text-blue-500 hover:underline">
                Go to Dashboard to upload documents
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{agent.avatar}</span>
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-sm text-gray-600">{agent.specialty}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      agent.status === 'active' ? 'bg-green-100 text-green-800' :
                      agent.status === 'thinking' ? 'bg-blue-100 text-blue-800' :
                      agent.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.status}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span>Efficiency</span>
                      <span>{agent.efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${agent.efficiency}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    <div>Tasks: {agent.tasksCompleted} completed, {agent.tasksInProgress} in progress</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const instruction = prompt('Enter instruction for agent:')
                        if (instruction) sendInstruction(agent.id, instruction)
                      }}
                      className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Instruct
                    </button>
                    {agent.status === 'active' ? (
                      <button
                        onClick={() => pauseAgent(agent.id)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => resumeAgent(agent.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collaborations */}
        {collaborations.length > 0 && (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">🤝 Agent Collaborations</h2>
            <div className="space-y-3">
              {collaborations.map((collab) => (
                <div key={collab.id} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{collab.objective}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      collab.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      collab.status === 'completed' ? 'bg-green-100 text-green-800' :
                      collab.status === 'forming' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {collab.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Participants: {collab.participants.length} agents
                  </div>
                  <div className="text-sm text-gray-600">
                    Started: {new Date(collab.startTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: {new Date(dashboardData.timestamp).toLocaleString()}</p>
          <p className="mt-1">Autonomous agents are working continuously in the background</p>
        </div>
      </div>
    </div>
  )
}