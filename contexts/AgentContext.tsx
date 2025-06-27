'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { DocumentAgentManager, SwarmMetrics, AgentCollaboration } from '@/lib/agents/agent-manager'
import { Agent, Document } from '@/components/workspace/types'

interface AgentContextValue {
  // Agent Manager
  agentManager: DocumentAgentManager | null
  
  // Swarm State
  agents: Agent[]
  collaborations: AgentCollaboration[]
  swarmMetrics: SwarmMetrics | null
  
  // Agent Operations
  createAgent: (document: Document) => Promise<void>
  removeAgent: (agentId: string) => Promise<void>
  sendInstruction: (agentId: string, instruction: string) => Promise<void>
  pauseAgent: (agentId: string) => Promise<void>
  resumeAgent: (agentId: string) => Promise<void>
  querySwarm: (query: string) => Promise<any>
  
  // Real-time Updates
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
}

const AgentContext = createContext<AgentContextValue | null>(null)

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [agentManager, setAgentManager] = useState<DocumentAgentManager | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [collaborations, setCollaborations] = useState<AgentCollaboration[]>([])
  const [swarmMetrics, setSwarmMetrics] = useState<SwarmMetrics | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize agent manager when user is available
  useEffect(() => {
    if (user && !agentManager) {
      console.log('[AgentContext] Initializing DocumentAgentManager for user:', user.id)
      
      try {
        const manager = new DocumentAgentManager(user.id)
        
        // Set up event listeners
        manager.on('agent_created', (data) => {
          console.log('[AgentContext] Agent created:', data)
          updateAgentData()
        })
        
        manager.on('agent_removed', (data) => {
          console.log('[AgentContext] Agent removed:', data)
          updateAgentData()
        })
        
        manager.on('collaboration_initiated', (collaboration) => {
          console.log('[AgentContext] Collaboration initiated:', collaboration)
          updateCollaborationData()
        })
        
        manager.on('collaboration_completed', (collaboration) => {
          console.log('[AgentContext] Collaboration completed:', collaboration)
          updateCollaborationData()
        })
        
        manager.on('swarm_coordination', (data) => {
          console.log('[AgentContext] Swarm coordination:', data)
          setSwarmMetrics(data.metrics)
          setLastUpdate(new Date())
        })
        
        manager.on('swarm_notification', (data) => {
          console.log('[AgentContext] Swarm notification:', data)
          // Could integrate with toast notifications here
        })
        
        setAgentManager(manager)
        setIsConnected(true)
        setError(null)
        updateAgentData()
        
      } catch (err) {
        console.error('[AgentContext] Failed to initialize agent manager:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize agents')
        setIsConnected(false)
      }
    }
    
    // Cleanup on unmount or user change
    return () => {
      if (agentManager && (!user || agentManager.userId !== user.id)) {
        console.log('[AgentContext] Cleaning up agent manager')
        agentManager.destroy()
        setAgentManager(null)
        setIsConnected(false)
        setAgents([])
        setCollaborations([])
        setSwarmMetrics(null)
      }
    }
  }, [user, agentManager])

  // Update agent data from manager
  const updateAgentData = useCallback(() => {
    if (agentManager) {
      const agentsList = agentManager.getAgents()
      setAgents(agentsList)
      setLastUpdate(new Date())
    }
  }, [agentManager])

  // Update collaboration data from manager
  const updateCollaborationData = useCallback(() => {
    if (agentManager) {
      const collaborationsList = agentManager.getCollaborations()
      setCollaborations(collaborationsList)
      setLastUpdate(new Date())
    }
  }, [agentManager])

  // Create agent for document
  const createAgent = useCallback(async (document: Document) => {
    if (!agentManager) {
      throw new Error('Agent manager not initialized')
    }
    
    try {
      await agentManager.createAgent(document)
      updateAgentData()
    } catch (err) {
      console.error('[AgentContext] Failed to create agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to create agent')
      throw err
    }
  }, [agentManager, updateAgentData])

  // Remove agent
  const removeAgent = useCallback(async (agentId: string) => {
    if (!agentManager) {
      throw new Error('Agent manager not initialized')
    }
    
    try {
      await agentManager.removeAgent(agentId)
      updateAgentData()
    } catch (err) {
      console.error('[AgentContext] Failed to remove agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove agent')
      throw err
    }
  }, [agentManager, updateAgentData])

  // Send instruction to agent
  const sendInstruction = useCallback(async (agentId: string, instruction: string) => {
    if (!agentManager) {
      throw new Error('Agent manager not initialized')
    }
    
    try {
      await agentManager.sendInstructionToAgent(agentId, instruction)
    } catch (err) {
      console.error('[AgentContext] Failed to send instruction:', err)
      setError(err instanceof Error ? err.message : 'Failed to send instruction')
      throw err
    }
  }, [agentManager])

  // Pause agent
  const pauseAgent = useCallback(async (agentId: string) => {
    if (!agentManager) {
      throw new Error('Agent manager not initialized')
    }
    
    try {
      await agentManager.pauseAgent(agentId)
      updateAgentData()
    } catch (err) {
      console.error('[AgentContext] Failed to pause agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to pause agent')
      throw err
    }
  }, [agentManager, updateAgentData])

  // Resume agent
  const resumeAgent = useCallback(async (agentId: string) => {
    if (!agentManager) {
      throw new Error('Agent manager not initialized')
    }
    
    try {
      await agentManager.resumeAgent(agentId)
      updateAgentData()
    } catch (err) {
      console.error('[AgentContext] Failed to resume agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to resume agent')
      throw err
    }
  }, [agentManager, updateAgentData])

  // Query swarm with collective intelligence
  const querySwarm = useCallback(async (query: string) => {
    if (!agentManager) {
      throw new Error('Agent manager not initialized')
    }
    
    try {
      const result = await agentManager.querySwarm(query)
      return result
    } catch (err) {
      console.error('[AgentContext] Failed to query swarm:', err)
      setError(err instanceof Error ? err.message : 'Failed to query swarm')
      throw err
    }
  }, [agentManager])

  // Update metrics periodically
  useEffect(() => {
    if (!agentManager || !isConnected) return

    const updateMetrics = () => {
      const metrics = agentManager.getSwarmMetrics()
      setSwarmMetrics(metrics)
      setLastUpdate(new Date())
    }

    // Initial update
    updateMetrics()

    // Periodic updates every 30 seconds
    const interval = setInterval(updateMetrics, 30000)

    return () => clearInterval(interval)
  }, [agentManager, isConnected])

  const value: AgentContextValue = {
    agentManager,
    agents,
    collaborations,
    swarmMetrics,
    createAgent,
    removeAgent,
    sendInstruction,
    pauseAgent,
    resumeAgent,
    querySwarm,
    isConnected,
    lastUpdate,
    error,
  }

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgents() {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgents must be used within an AgentProvider')
  }
  return context
}

// Utility hooks for specific agent operations
export function useAgentOperations() {
  const { createAgent, removeAgent, sendInstruction, pauseAgent, resumeAgent } = useAgents()
  return { createAgent, removeAgent, sendInstruction, pauseAgent, resumeAgent }
}

export function useSwarmIntelligence() {
  const { agents, collaborations, swarmMetrics, querySwarm, lastUpdate } = useAgents()
  return { agents, collaborations, swarmMetrics, querySwarm, lastUpdate }
}

export function useAgentStatus() {
  const { isConnected, error, lastUpdate } = useAgents()
  return { isConnected, error, lastUpdate }
}