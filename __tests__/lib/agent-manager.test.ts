import {
  agentManager,
  getAgentManager,
  type AgentConfig,
  type AgentStatus,
} from '@/lib/agents/agent-manager'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('AgentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Agent Management', () => {
    it('should initialize with default agents', () => {
      const agents = agentManager.getAllAgents()

      expect(agents.length).toBeGreaterThan(0)
      expect(agents.some(agent => agent.type === 'translation')).toBe(true)
      expect(agents.some(agent => agent.type === 'ocr')).toBe(true)
    })

    it('should get agent by ID', () => {
      const agents = agentManager.getAllAgents()
      const firstAgent = agents[0]

      const retrievedAgent = agentManager.getAgent(firstAgent.id)

      expect(retrievedAgent).toEqual(firstAgent)
    })

    it('should return undefined for non-existent agent', () => {
      const agent = agentManager.getAgent('non-existent-id')

      expect(agent).toBeUndefined()
    })

    it('should get all agent statuses', () => {
      const statuses = agentManager.getAllAgentStatuses()

      expect(Array.isArray(statuses)).toBe(true)
      expect(statuses.length).toBeGreaterThan(0)

      statuses.forEach(status => {
        expect(status).toHaveProperty('id')
        expect(status).toHaveProperty('status')
        expect(status).toHaveProperty('lastActivity')
        expect(status).toHaveProperty('performance')
      })
    })

    it('should filter active agents', () => {
      const activeAgents = agentManager.getActiveAgents()
      const allAgents = agentManager.getAllAgents()

      expect(activeAgents.length).toBeLessThanOrEqual(allAgents.length)
      activeAgents.forEach(agent => {
        expect(agent.active).toBe(true)
      })
    })

    it('should filter active agents by type', () => {
      const translationAgents = agentManager.getActiveAgents('translation')

      translationAgents.forEach(agent => {
        expect(agent.type).toBe('translation')
        expect(agent.active).toBe(true)
      })
    })
  })

  describe('Agent Processing', () => {
    it('should process data with valid agent', async () => {
      const agents = agentManager.getAllAgents()
      const translationAgent = agents.find(
        agent => agent.type === 'translation'
      )

      if (!translationAgent) {
        throw new Error('No translation agent found')
      }

      const testData = { text: 'Hello world' }
      const result = await agentManager.processWithAgent(
        translationAgent.id,
        testData
      )

      expect(result).toBeDefined()
      expect(result).toHaveProperty('translated')
      expect(result).toHaveProperty('confidence')
    })

    it('should throw error for inactive agent', async () => {
      const agents = agentManager.getAllAgents()
      const firstAgent = agents[0]

      // Deactivate the agent
      firstAgent.active = false

      await expect(
        agentManager.processWithAgent(firstAgent.id, {})
      ).rejects.toThrow()
    })

    it('should throw error for non-existent agent', async () => {
      await expect(
        agentManager.processWithAgent('non-existent', {})
      ).rejects.toThrow()
    })

    it('should update agent status during processing', async () => {
      const agents = agentManager.getAllAgents()
      const ocrAgent = agents.find(agent => agent.type === 'ocr')

      if (!ocrAgent) {
        throw new Error('No OCR agent found')
      }

      const initialStatus = agentManager.getAgentStatus(ocrAgent.id)
      expect(initialStatus?.status).toBe('idle')

      const result = await agentManager.processWithAgent(ocrAgent.id, {
        image: 'test',
      })

      const finalStatus = agentManager.getAgentStatus(ocrAgent.id)
      expect(finalStatus?.status).toBe('completed')
      expect(result).toHaveProperty('extractedText')
    })
  })

  describe('Dashboard Compatibility Methods', () => {
    it('should get swarm intelligence data', async () => {
      const swarmData = await agentManager.getSwarmIntelligence()

      expect(swarmData).toHaveProperty('totalAgents')
      expect(swarmData).toHaveProperty('activeAgents')
      expect(swarmData).toHaveProperty('averagePerformance')
      expect(swarmData).toHaveProperty('collaborationEvents')
      expect(swarmData).toHaveProperty('autonomousDecisions')

      expect(typeof swarmData.totalAgents).toBe('number')
      expect(typeof swarmData.activeAgents).toBe('number')
      expect(typeof swarmData.averagePerformance).toBe('number')
    })

    it('should find agent by document ID', () => {
      // First create an agent for a document
      const documentId = 'test-doc-123'
      const intelligence = { analysis: 'test' }
      const options = { tier: 'premium' }

      return agentManager
        .createAgentForDocument(documentId, intelligence, options)
        .then(createdAgent => {
          const foundAgent = agentManager.getAgentByDocument(documentId)

          expect(foundAgent).toBeDefined()
          expect(foundAgent?.documentId).toBe(documentId)
          expect(foundAgent?.agentId).toBe(createdAgent.agentId)
        })
    })

    it('should return null for non-existent document', () => {
      const agent = agentManager.getAgentByDocument('non-existent-doc')

      expect(agent).toBeNull()
    })

    it('should get notifications', () => {
      const allNotifications = agentManager.getNotifications(false)
      const unreadNotifications = agentManager.getNotifications(true)

      expect(Array.isArray(allNotifications)).toBe(true)
      expect(Array.isArray(unreadNotifications)).toBe(true)
    })

    it('should mark notifications as read', () => {
      expect(() => {
        agentManager.markNotificationAsRead('test-notification-123')
      }).not.toThrow()
    })

    it('should query swarm', async () => {
      const query = 'What is the status of all agents?'
      const response = await agentManager.querySwarm(query)

      expect(response).toHaveProperty('query', query)
      expect(response).toHaveProperty('agentResponses')
      expect(response).toHaveProperty('summary')
      expect(response).toHaveProperty('confidence')

      expect(Array.isArray(response.agentResponses)).toBe(true)
      expect(typeof response.summary).toBe('string')
      expect(typeof response.confidence).toBe('number')
    })

    it('should facilitate collaboration', async () => {
      const initiatorId = 'agent-123'
      const task = 'Translate and analyze document'
      const personalities = ['analytical', 'creative']

      const collaborationId = await agentManager.facilitateCollaboration(
        initiatorId,
        task,
        personalities
      )

      expect(typeof collaborationId).toBe('string')
      expect(collaborationId).toMatch(/^collab_\d+$/)
    })

    it('should process swarm learning', async () => {
      expect(async () => {
        await agentManager.processSwarmLearning()
      }).not.toThrow()
    })
  })

  describe('Document Agent Creation', () => {
    it('should create agent for document', async () => {
      const documentId = 'doc-456'
      const intelligence = {
        classification: { type: 'contract', domain: 'legal' },
        insights: { summary: 'Legal contract analysis' },
      }
      const options = {
        userTier: 'enterprise',
        preferences: { priority: 'high' },
      }

      const agent = await agentManager.createAgentForDocument(
        documentId,
        intelligence,
        options
      )

      expect(agent).toBeDefined()
      expect(agent.agentId).toBeDefined()
      expect(agent.documentId).toBe(documentId)
      expect(agent.personality).toBe('analytical')
      expect(agent.state).toBe('active')
      expect(agent.autonomyLevel).toBe(3)
      expect(Array.isArray(agent.capabilities)).toBe(true)
      expect(typeof agent.getAgentStatus).toBe('function')
      expect(typeof agent.sendInstruction).toBe('function')
    })

    it('should create agent status when creating document agent', async () => {
      const documentId = 'doc-789'
      const agent = await agentManager.createAgentForDocument(
        documentId,
        {},
        {}
      )

      const status = agentManager.getAgentStatus(agent.agentId!)

      expect(status).toBeDefined()
      expect(status?.id).toBe(agent.agentId)
      expect(status?.status).toBe('idle')
      expect(status?.performance).toHaveProperty('successRate', 1.0)
      expect(status?.performance).toHaveProperty('averageResponseTime', 500)
      expect(status?.performance).toHaveProperty('totalProcessed', 0)
    })

    it('should support agent methods', async () => {
      const agent = await agentManager.createAgentForDocument(
        'doc-test',
        {},
        {}
      )

      // Test getAgentStatus method
      const agentStatus = await agent.getAgentStatus!()
      expect(agentStatus).toHaveProperty('state', 'active')
      expect(agentStatus).toHaveProperty('autonomyLevel', 3)

      // Test sendInstruction method
      const instruction = 'Analyze this document for key insights'
      const userId = 'user-123'
      const response = await agent.sendInstruction!(instruction, userId)

      expect(response).toHaveProperty('instruction', instruction)
      expect(response).toHaveProperty('response')
      expect(response).toHaveProperty('timestamp')
    })
  })

  describe('Agent Removal', () => {
    it('should remove agent and its status', async () => {
      const agents = agentManager.getAllAgents()
      const agentToRemove = agents[0]

      expect(agentManager.getAgent(agentToRemove.id)).toBeDefined()
      expect(agentManager.getAgentStatus(agentToRemove.id)).toBeDefined()

      await agentManager.removeAgent(agentToRemove.id)

      expect(agentManager.getAgent(agentToRemove.id)).toBeUndefined()
      expect(agentManager.getAgentStatus(agentToRemove.id)).toBeUndefined()
    })
  })

  describe('Manager Statistics', () => {
    it('should provide comprehensive stats', () => {
      const stats = agentManager.getManagerStats()

      expect(stats).toHaveProperty('totalAgents')
      expect(stats).toHaveProperty('activeAgents')
      expect(stats).toHaveProperty('agentsByType')
      expect(stats).toHaveProperty('timestamp')

      expect(typeof stats.totalAgents).toBe('number')
      expect(typeof stats.activeAgents).toBe('number')
      expect(typeof stats.agentsByType).toBe('object')
      expect(stats.timestamp instanceof Date).toBe(true)
    })
  })

  describe('Singleton and Factory Functions', () => {
    it('should provide singleton instance', () => {
      expect(agentManager).toBeDefined()
      expect(typeof agentManager.getAllAgents).toBe('function')
    })

    it('should provide factory function', () => {
      const managerInstance = getAgentManager('user-123')

      expect(managerInstance).toBeDefined()
      expect(typeof managerInstance.getAllAgents).toBe('function')

      // Should return the same singleton for now
      expect(managerInstance).toBe(agentManager)
    })

    it('should work without user ID in factory', () => {
      const managerInstance = getAgentManager()

      expect(managerInstance).toBeDefined()
      expect(managerInstance).toBe(agentManager)
    })
  })
})
