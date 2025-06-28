// AI Agent Collaboration Integration Tests
// End-to-end testing of AI agent swarm intelligence and collaborative workflows

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, createMockUser } from '../utils/test-utils'
import { IntelligenceHub } from '../../components/workspace/IntelligenceHub'
import { ContextualAssistant } from '../../components/workspace/ContextualAssistant'
import { SimpleTranslationInterface } from '../../components/workspace/SimpleTranslationInterface'
import { WorkspaceIntelligenceProvider } from '../../contexts/WorkspaceIntelligenceContext'
import type { Agent, AgentTask, SwarmMetrics, CollaborationSession } from '../../types/intelligence'

// Mock AI agent collaboration context
const mockCollaborativeContext = {
  state: {
    currentMode: 'collaborative_translation' as const,
    activities: [],
    patterns: {
      preferredLanguages: { source: ['en'], target: ['vi', 'es', 'fr'] },
      workingHours: { start: '09:00', end: '17:00', timezone: 'UTC' },
      frequentActions: ['translate', 'analyze', 'collaborate'],
      efficiency: { averageTranslationTime: 2000, preferredWorkflowSteps: [], errorRate: 0.02 },
      preferences: { 
        preferredAgents: ['translator-alpha', 'analyzer-beta'], 
        autoTranslation: true, 
        qualityThreshold: 0.92,
        collaborationMode: 'swarm'
      }
    },
    activeOperations: [
      {
        id: 'op-collab-1',
        type: 'collaborative_translation',
        status: 'in_progress',
        assignedAgents: ['agent-1', 'agent-2', 'agent-3'],
        progress: 45,
        startTime: new Date(),
        estimatedCompletion: new Date(Date.now() + 30000)
      }
    ],
    suggestions: [
      {
        id: 'sug-collab-1',
        type: 'agent_collaboration',
        title: 'Form translation team',
        description: 'Multiple agents can work together for higher quality',
        confidence: 0.88,
        action: { type: 'start_collaboration', agents: ['translator-alpha', 'reviewer-gamma'] }
      }
    ],
    insights: [
      {
        id: 'insight-collab-1',
        type: 'swarm_performance',
        title: 'Collaboration efficiency increased',
        description: 'Team translations are 35% faster with 15% higher quality',
        confidence: 0.91,
        metadata: { efficiencyGain: 0.35, qualityImprovement: 0.15 }
      }
    ],
    isProcessing: true,
    connectionStatus: 'connected' as const
  },
  setMode: jest.fn(),
  updateContext: jest.fn(),
  addActivity: jest.fn(),
  operations: {
    start: jest.fn(),
    update: jest.fn(),
    complete: jest.fn(),
    fail: jest.fn()
  },
  suggestions: {
    add: jest.fn(),
    dismiss: jest.fn(),
    apply: jest.fn()
  },
  insights: {
    add: jest.fn(),
    getByCategory: jest.fn()
  },
  sync: jest.fn()
}

// Mock agent data
const mockAgents: Agent[] = [
  {
    id: 'agent-translator-1',
    name: 'Translation Specialist Alpha',
    description: 'Expert in English-Vietnamese translation',
    type: 'translator',
    specialization: ['en-vi', 'technical_translation'],
    status: 'active',
    capabilities: ['translate', 'quality_check', 'context_analysis'],
    performance: {
      overall: { score: 0.93, reliability: 0.96, efficiency: 0.89, accuracy: 0.94 },
      metrics: {
        tasksCompleted: 1250,
        averageCompletionTime: 2200,
        successRate: 0.96,
        errorRate: 0.04,
        collaborationScore: 0.91
      },
      benchmarks: {
        translation: { speed: 1200, accuracy: 0.94, consistency: 0.92 },
        analysis: { depth: 0.87, insights: 0.82, accuracy: 0.89 },
        collaboration: { responseTime: 350, helpfulness: 0.93, adaptability: 0.88 }
      },
      trends: []
    },
    configuration: {
      model: 'gpt-4',
      parameters: { temperature: 0.3, top_p: 0.9 },
      personality: {
        traits: {
          confidence: 0.85,
          creativity: 0.7,
          attention_to_detail: 0.95,
          collaboration: 0.91,
          learning_rate: 0.82
        },
        communication_style: 'professional',
        decision_making: 'consensus',
        error_handling: 'collaborative'
      },
      preferences: {
        preferredLanguages: ['en', 'vi'],
        workingHours: { start: '09:00', end: '17:00', timezone: 'UTC', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        taskPriority: { types: ['translator'], domains: ['technical'], urgency: 'high' },
        collaborationStyle: {
          preferred_partners: ['agent-reviewer-1', 'agent-analyzer-1'],
          max_concurrent_collaborations: 3,
          communication_frequency: 'high'
        }
      },
      constraints: {
        maxConcurrentTasks: 5,
        maxTaskDuration: 1800000,
        allowedResources: ['translation', 'analysis'],
        prohibitedContent: ['explicit', 'illegal'],
        qualityThresholds: { accuracy: 0.92, fluency: 0.88 },
        rateLimits: { requests_per_minute: 120, tokens_per_hour: 50000 }
      },
      integrations: []
    },
    resources: {
      allocated: { cpu: 4, memory: 8192, storage: 20480, network: 500 },
      current_usage: { cpu: 0.6, memory: 4096, storage: 8192, network: 150 },
      limits: { cpu: 8, memory: 16384, storage: 40960, network: 1000 },
      cost: { hourly: 1.20, daily: 28.80, monthly: 864.00, currency: 'USD' }
    },
    taskHistory: [],
    collaboration: {
      active_collaborations: ['collab-session-1'],
      collaboration_history: [],
      reputation: { as_leader: 0.89, as_contributor: 0.95, reliability: 0.96, communication: 0.92 },
      network: {
        trusted_agents: ['agent-reviewer-1', 'agent-analyzer-1'],
        frequent_collaborators: ['agent-reviewer-1'],
        avoided_agents: []
      },
      preferences: {
        max_group_size: 4,
        preferred_roles: ['primary_translator', 'quality_reviewer'],
        communication_style: 'structured'
      }
    },
    learning: {
      current_training: [],
      completed_training: ['advanced_translation', 'collaborative_workflows'],
      knowledge_base: ['translation_patterns', 'quality_metrics'],
      skills: ['en-vi_translation', 'technical_terminology', 'collaboration'],
      adaptation_rate: 0.82,
      learning_efficiency: 0.87,
      retention_rate: 0.94
    },
    version: '2.1.0',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'agent-reviewer-1',
    name: 'Quality Review Specialist',
    description: 'Expert in translation quality assessment and improvement',
    type: 'reviewer',
    specialization: ['quality_assurance', 'linguistic_analysis'],
    status: 'active',
    capabilities: ['quality_review', 'error_detection', 'improvement_suggestions'],
    performance: {
      overall: { score: 0.91, reliability: 0.94, efficiency: 0.87, accuracy: 0.96 },
      metrics: {
        tasksCompleted: 980,
        averageCompletionTime: 1800,
        successRate: 0.97,
        errorRate: 0.03,
        collaborationScore: 0.93
      },
      benchmarks: {
        translation: { speed: 800, accuracy: 0.96, consistency: 0.94 },
        analysis: { depth: 0.93, insights: 0.89, accuracy: 0.96 },
        collaboration: { responseTime: 280, helpfulness: 0.95, adaptability: 0.91 }
      },
      trends: []
    },
    configuration: {
      model: 'gpt-4',
      parameters: { temperature: 0.2, top_p: 0.8 },
      personality: {
        traits: {
          confidence: 0.88,
          creativity: 0.6,
          attention_to_detail: 0.98,
          collaboration: 0.93,
          learning_rate: 0.79
        },
        communication_style: 'analytical',
        decision_making: 'methodical',
        error_handling: 'systematic'
      },
      preferences: {
        preferredLanguages: ['en', 'vi', 'es'],
        workingHours: { start: '08:00', end: '18:00', timezone: 'UTC', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        taskPriority: { types: ['reviewer'], domains: ['quality'], urgency: 'medium' },
        collaborationStyle: {
          preferred_partners: ['agent-translator-1'],
          max_concurrent_collaborations: 2,
          communication_frequency: 'regular'
        }
      },
      constraints: {
        maxConcurrentTasks: 3,
        maxTaskDuration: 1200000,
        allowedResources: ['review', 'analysis'],
        prohibitedContent: ['explicit', 'illegal'],
        qualityThresholds: { accuracy: 0.95, fluency: 0.92 },
        rateLimits: { requests_per_minute: 80, tokens_per_hour: 30000 }
      },
      integrations: []
    },
    resources: {
      allocated: { cpu: 2, memory: 4096, storage: 10240, network: 200 },
      current_usage: { cpu: 0.4, memory: 2048, storage: 4096, network: 80 },
      limits: { cpu: 4, memory: 8192, storage: 20480, network: 500 },
      cost: { hourly: 0.80, daily: 19.20, monthly: 576.00, currency: 'USD' }
    },
    taskHistory: [],
    collaboration: {
      active_collaborations: ['collab-session-1'],
      collaboration_history: [],
      reputation: { as_leader: 0.85, as_contributor: 0.97, reliability: 0.94, communication: 0.95 },
      network: {
        trusted_agents: ['agent-translator-1'],
        frequent_collaborators: ['agent-translator-1'],
        avoided_agents: []
      },
      preferences: {
        max_group_size: 3,
        preferred_roles: ['quality_reviewer', 'mentor'],
        communication_style: 'detailed'
      }
    },
    learning: {
      current_training: ['multilingual_quality_assessment'],
      completed_training: ['quality_frameworks', 'collaborative_review'],
      knowledge_base: ['quality_patterns', 'error_taxonomies'],
      skills: ['quality_assessment', 'error_detection', 'feedback_delivery'],
      adaptation_rate: 0.79,
      learning_efficiency: 0.84,
      retention_rate: 0.92
    },
    version: '1.8.0',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
]

const mockSwarmMetrics: SwarmMetrics = {
  totalAgents: 15,
  activeAgents: 12,
  totalCollaborations: 45,
  averageEfficiency: 0.89,
  networkHealth: 0.94,
  responseTime: 380,
  successRate: 0.96,
  lastUpdate: new Date()
}

const mockCollaborationSession: CollaborationSession = {
  id: 'collab-session-1',
  title: 'Multi-agent Translation Project',
  description: 'Collaborative translation with quality review',
  participants: ['agent-translator-1', 'agent-reviewer-1'],
  leader: 'agent-translator-1',
  status: 'active',
  tasks: [],
  communication: {
    messages: [],
    lastActivity: new Date(),
    protocol: 'structured'
  },
  metrics: {
    efficiency: 0.91,
    quality: 0.94,
    speed: 0.87,
    collaboration_score: 0.89
  },
  createdAt: new Date(),
  updatedAt: new Date()
}

// Enhanced MSW handlers for AI agent collaboration
import { rest } from 'msw'
import { server } from '../mocks/server'

const collaborationHandlers = [
  rest.get('/api/agents', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: mockAgents,
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1, hasNext: false, hasPrev: false }
        }
      })
    )
  }),
  
  rest.get('/api/agents/metrics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: mockSwarmMetrics })
    )
  }),
  
  rest.post('/api/agents/collaborate', async (req, res, ctx) => {
    const body = await req.json()
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          sessionId: 'collab-session-new',
          participants: body.agents,
          estimatedDuration: 45000,
          qualityImprovement: 0.15
        }
      })
    )
  }),
  
  rest.get('/api/collaboration/sessions/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: mockCollaborationSession })
    )
  }),
  
  rest.post('/api/collaboration/sessions/:id/tasks', async (req, res, ctx) => {
    const body = await req.json()
    
    const task: AgentTask = {
      id: 'task-collab-' + Date.now(),
      title: body.title,
      description: body.description,
      type: body.type || 'collaborative_translation',
      priority: body.priority || 'normal',
      status: 'pending',
      assignedAgents: body.agents || [],
      requiredCapabilities: body.capabilities || [],
      input: {
        data: body.input,
        format: 'json',
        constraints: body.constraints || {},
        context: body.context || '',
        requirements: body.requirements || []
      },
      progress: {
        percentage: 0,
        currentStage: 'assignment',
        stages: ['assignment', 'execution', 'review', 'completion'],
        milestones: [],
        blockers: []
      },
      estimatedDuration: body.estimatedDuration || 30000,
      dependencies: [],
      subtasks: [],
      metadata: {
        creator: 'user-123',
        source: 'collaboration',
        tags: ['collaborative'],
        category: 'translation',
        complexity: body.complexity || 2,
        effort_estimate: body.effort || 2,
        quality_requirements: { accuracy: 0.92, fluency: 0.88 },
        collaboration_required: true,
        learning_opportunity: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return res(
      ctx.status(201),
      ctx.json({ success: true, data: task })
    )
  }),
  
  rest.get('/api/collaboration/sessions/:id/messages', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          {
            id: 'msg-1',
            sender: 'agent-translator-1',
            content: 'Starting translation analysis...',
            timestamp: new Date(Date.now() - 5000),
            type: 'status'
          },
          {
            id: 'msg-2',
            sender: 'agent-reviewer-1',
            content: 'Quality checkpoints established. Ready for review.',
            timestamp: new Date(Date.now() - 2000),
            type: 'confirmation'
          }
        ]
      })
    )
  })
]

describe('AI Agent Collaboration Integration', () => {
  const mockUser = createMockUser()

  beforeAll(() => {
    server.use(...collaborationHandlers)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Agent Swarm Formation and Management', () => {
    it('forms collaborative agent teams for complex tasks', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <IntelligenceHub />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // View available agents
      const agentsTab = screen.getByText(/agents/i)
      fireEvent.click(agentsTab)

      // Verify agents are listed
      expect(screen.getByText('Translation Specialist Alpha')).toBeInTheDocument()
      expect(screen.getByText('Quality Review Specialist')).toBeInTheDocument()

      // Initiate collaboration
      const collaborateButton = screen.getByText(/start collaboration/i)
      fireEvent.click(collaborateButton)

      // Select agents for collaboration
      const translatorCheckbox = screen.getByLabelText(/select translation specialist alpha/i)
      const reviewerCheckbox = screen.getByLabelText(/select quality review specialist/i)
      
      fireEvent.click(translatorCheckbox)
      fireEvent.click(reviewerCheckbox)

      // Configure collaboration
      const taskTypeSelect = screen.getByLabelText(/collaboration type/i)
      fireEvent.change(taskTypeSelect, { target: { value: 'translation_with_review' } })

      const qualityThreshold = screen.getByLabelText(/quality threshold/i)
      fireEvent.change(qualityThreshold, { target: { value: '0.92' } })

      // Start collaboration
      const startButton = screen.getByText(/form team/i)
      fireEvent.click(startButton)

      // Verify collaboration session creation
      await waitFor(() => {
        expect(screen.getByText(/collaboration session started/i)).toBeInTheDocument()
      })

      expect(mockCollaborativeContext.operations.start).toHaveBeenCalledWith({
        type: 'agent_collaboration',
        input: {
          agents: ['agent-translator-1', 'agent-reviewer-1'],
          collaborationType: 'translation_with_review',
          qualityThreshold: 0.92
        }
      })
    })

    it('displays real-time swarm metrics and health', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <IntelligenceHub />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const metricsTab = screen.getByText(/swarm metrics/i)
      fireEvent.click(metricsTab)

      // Verify swarm health indicators
      expect(screen.getByText(/15 total agents/i)).toBeInTheDocument()
      expect(screen.getByText(/12 active agents/i)).toBeInTheDocument()
      expect(screen.getByText(/94% network health/i)).toBeInTheDocument()
      expect(screen.getByText(/96% success rate/i)).toBeInTheDocument()

      // Check efficiency metrics
      expect(screen.getByText(/89% average efficiency/i)).toBeInTheDocument()
      expect(screen.getByText(/380ms response time/i)).toBeInTheDocument()

      // Verify real-time updates
      await waitFor(() => {
        expect(screen.getByText(/last updated: just now/i)).toBeInTheDocument()
      })
    })

    it('handles agent availability and load balancing', async () => {
      const overloadedContext = {
        ...mockCollaborativeContext,
        state: {
          ...mockCollaborativeContext.state,
          activeOperations: [
            {
              id: 'op-1',
              type: 'translation',
              status: 'in_progress',
              assignedAgents: ['agent-translator-1'],
              progress: 30,
              startTime: new Date(),
              estimatedCompletion: new Date(Date.now() + 60000)
            },
            {
              id: 'op-2',
              type: 'translation',
              status: 'in_progress',
              assignedAgents: ['agent-translator-1'],
              progress: 60,
              startTime: new Date(),
              estimatedCompletion: new Date(Date.now() + 30000)
            }
          ]
        }
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={overloadedContext}>
          <IntelligenceHub />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const agentsTab = screen.getByText(/agents/i)
      fireEvent.click(agentsTab)

      // Verify load indicators
      expect(screen.getByText(/busy/i)).toBeInTheDocument()
      expect(screen.getByText(/2 active tasks/i)).toBeInTheDocument()

      // Try to assign another task
      const assignButton = screen.getByText(/assign task/i)
      fireEvent.click(assignButton)

      // Verify load balancing warning
      expect(screen.getByText(/agent is at capacity/i)).toBeInTheDocument()
      expect(screen.getByText(/recommend alternative agent/i)).toBeInTheDocument()
    })
  })

  describe('Collaborative Translation Workflows', () => {
    it('executes multi-agent translation with quality review', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <div>
            <SimpleTranslationInterface />
            <IntelligenceHub />
          </div>
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Enable collaborative mode
      const collaborativeToggle = screen.getByLabelText(/collaborative translation/i)
      fireEvent.click(collaborativeToggle)

      // Enter complex text for translation
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { 
        target: { value: 'This is a complex technical document that requires expert translation and thorough quality review.' } 
      })

      // Set languages
      const sourceSelect = screen.getByLabelText(/source language/i)
      const targetSelect = screen.getByLabelText(/target language/i)
      fireEvent.change(sourceSelect, { target: { value: 'en' } })
      fireEvent.change(targetSelect, { target: { value: 'vi' } })

      // Initiate collaborative translation
      const translateButton = screen.getByText(/translate collaboratively/i)
      fireEvent.click(translateButton)

      // Verify agent assignment
      await waitFor(() => {
        expect(screen.getByText(/assigning to translation team/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/translation specialist alpha/i)).toBeInTheDocument()
      expect(screen.getByText(/quality review specialist/i)).toBeInTheDocument()

      // Monitor collaboration progress
      await waitFor(() => {
        expect(screen.getByText(/agents collaborating/i)).toBeInTheDocument()
      })

      // Check collaboration stages
      expect(screen.getByText(/stage 1: initial translation/i)).toBeInTheDocument()
      expect(screen.getByText(/stage 2: quality review/i)).toBeInTheDocument()
      expect(screen.getByText(/stage 3: refinement/i)).toBeInTheDocument()

      // Verify completion
      await waitFor(() => {
        expect(screen.getByText(/collaborative translation completed/i)).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(screen.getByText(/quality score: 94%/i)).toBeInTheDocument()
      expect(screen.getByText(/reviewed by quality specialist/i)).toBeInTheDocument()
    })

    it('handles agent communication and consensus building', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <IntelligenceHub />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // View active collaboration
      const collaborationsTab = screen.getByText(/active collaborations/i)
      fireEvent.click(collaborationsTab)

      expect(screen.getByText('Multi-agent Translation Project')).toBeInTheDocument()

      // Open collaboration details
      const viewButton = screen.getByText(/view collaboration/i)
      fireEvent.click(viewButton)

      // Check agent communication
      const communicationTab = screen.getByText(/communication/i)
      fireEvent.click(communicationTab)

      expect(screen.getByText(/starting translation analysis/i)).toBeInTheDocument()
      expect(screen.getByText(/quality checkpoints established/i)).toBeInTheDocument()

      // Verify consensus mechanisms
      expect(screen.getByText(/agents in agreement/i)).toBeInTheDocument()
      expect(screen.getByText(/consensus: 95%/i)).toBeInTheDocument()

      // Check decision making process
      const decisionsTab = screen.getByText(/decisions/i)
      fireEvent.click(decisionsTab)

      expect(screen.getByText(/translation approach selected/i)).toBeInTheDocument()
      expect(screen.getByText(/quality criteria agreed upon/i)).toBeInTheDocument()
    })

    it('provides collaborative learning and improvement', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <IntelligenceHub />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const learningTab = screen.getByText(/agent learning/i)
      fireEvent.click(learningTab)

      // Verify learning metrics
      expect(screen.getByText(/collaboration efficiency: +35%/i)).toBeInTheDocument()
      expect(screen.getByText(/quality improvement: +15%/i)).toBeInTheDocument()

      // Check knowledge sharing
      expect(screen.getByText(/knowledge patterns identified/i)).toBeInTheDocument()
      expect(screen.getByText(/best practices shared/i)).toBeInTheDocument()

      // Verify adaptation
      const adaptationMetrics = screen.getByText(/adaptation rate: 82%/i)
      expect(adaptationMetrics).toBeInTheDocument()

      // Check training recommendations
      expect(screen.getByText(/recommended training: multilingual quality assessment/i)).toBeInTheDocument()
    })
  })

  describe('Contextual Assistant Integration', () => {
    it('provides intelligent collaboration suggestions', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <div>
            <SimpleTranslationInterface />
            <ContextualAssistant />
          </div>
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Enter text that would benefit from collaboration
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { 
        target: { value: 'Complex legal document with technical terminology requiring expert review.' } 
      })

      // Verify contextual suggestions
      await waitFor(() => {
        expect(screen.getByText(/collaboration recommended/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/form translation team/i)).toBeInTheDocument()
      expect(screen.getByText(/multiple agents can work together/i)).toBeInTheDocument()

      // Apply collaboration suggestion
      const applyButton = screen.getByText(/apply suggestion/i)
      fireEvent.click(applyButton)

      expect(mockCollaborativeContext.suggestions.apply).toHaveBeenCalledWith('sug-collab-1')

      // Verify agent selection assistance
      expect(screen.getByText(/recommended agents/i)).toBeInTheDocument()
      expect(screen.getByText(/translation specialist alpha/i)).toBeInTheDocument()
      expect(screen.getByText(/quality review specialist/i)).toBeInTheDocument()
    })

    it('monitors collaboration progress and provides updates', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <ContextualAssistant />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Verify collaboration monitoring
      expect(screen.getByText(/collaboration in progress/i)).toBeInTheDocument()
      expect(screen.getByText(/45% complete/i)).toBeInTheDocument()

      // Check agent status updates
      expect(screen.getByText(/translation specialist: active/i)).toBeInTheDocument()
      expect(screen.getByText(/quality reviewer: reviewing/i)).toBeInTheDocument()

      // Verify progress notifications
      expect(screen.getByText(/stage 2 of 4 in progress/i)).toBeInTheDocument()
      expect(screen.getByText(/estimated completion: 30 seconds/i)).toBeInTheDocument()

      // Check intervention suggestions
      expect(screen.getByText(/collaboration running smoothly/i)).toBeInTheDocument()
    })

    it('handles collaboration conflicts and resolutions', async () => {
      const conflictContext = {
        ...mockCollaborativeContext,
        state: {
          ...mockCollaborativeContext.state,
          activeOperations: [
            {
              id: 'op-conflict',
              type: 'collaborative_translation',
              status: 'blocked',
              assignedAgents: ['agent-translator-1', 'agent-reviewer-1'],
              progress: 70,
              blockers: ['terminology_disagreement'],
              startTime: new Date(),
              estimatedCompletion: new Date(Date.now() + 60000)
            }
          ]
        }
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={conflictContext}>
          <ContextualAssistant />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Verify conflict detection
      expect(screen.getByText(/collaboration conflict detected/i)).toBeInTheDocument()
      expect(screen.getByText(/terminology disagreement/i)).toBeInTheDocument()

      // Check resolution suggestions
      expect(screen.getByText(/suggest mediation/i)).toBeInTheDocument()
      expect(screen.getByText(/consult domain expert/i)).toBeInTheDocument()
      expect(screen.getByText(/review reference materials/i)).toBeInTheDocument()

      // Apply resolution
      const mediationButton = screen.getByText(/start mediation/i)
      fireEvent.click(mediationButton)

      expect(screen.getByText(/mediating terminology conflict/i)).toBeInTheDocument()
    })
  })

  describe('Performance and Scalability', () => {
    it('handles large-scale agent collaborations', async () => {
      const largeScaleContext = {
        ...mockCollaborativeContext,
        state: {
          ...mockCollaborativeContext.state,
          activeOperations: Array.from({ length: 10 }, (_, i) => ({
            id: `op-scale-${i}`,
            type: 'collaborative_translation',
            status: 'in_progress',
            assignedAgents: [`agent-${i}-1`, `agent-${i}-2`],
            progress: 30 + (i * 5),
            startTime: new Date(),
            estimatedCompletion: new Date(Date.now() + (30000 + i * 10000))
          }))
        }
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={largeScaleContext}>
          <IntelligenceHub />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Verify large-scale monitoring
      const operationsTab = screen.getByText(/operations/i)
      fireEvent.click(operationsTab)

      expect(screen.getByText(/10 active collaborations/i)).toBeInTheDocument()
      expect(screen.getByText(/system load: optimal/i)).toBeInTheDocument()

      // Check resource utilization
      expect(screen.getByText(/cpu utilization: 65%/i)).toBeInTheDocument()
      expect(screen.getByText(/memory usage: 78%/i)).toBeInTheDocument()

      // Verify load balancing
      expect(screen.getByText(/load balancing: active/i)).toBeInTheDocument()
      expect(screen.getByText(/agents distributed efficiently/i)).toBeInTheDocument()
    })

    it('optimizes collaboration routing and task assignment', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <IntelligenceHub />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const optimizationTab = screen.getByText(/optimization/i)
      fireEvent.click(optimizationTab)

      // Verify routing optimization
      expect(screen.getByText(/optimal agent pairing identified/i)).toBeInTheDocument()
      expect(screen.getByText(/efficiency gain: 23%/i)).toBeInTheDocument()

      // Check task assignment algorithms
      expect(screen.getByText(/smart task distribution/i)).toBeInTheDocument()
      expect(screen.getByText(/workload balanced across agents/i)).toBeInTheDocument()

      // Verify predictive analytics
      expect(screen.getByText(/predicted completion time: 95% accurate/i)).toBeInTheDocument()
      expect(screen.getByText(/quality forecast: 94%/i)).toBeInTheDocument()

      // Check continuous improvement
      expect(screen.getByText(/collaboration patterns learned/i)).toBeInTheDocument()
      expect(screen.getByText(/optimization rules updated/i)).toBeInTheDocument()
    })

    it('maintains fault tolerance and recovery', async () => {
      // Simulate agent failure
      server.use(
        rest.get('/api/agents/agent-translator-1/status', (req, res, ctx) => {
          return res(
            ctx.status(503),
            ctx.json({ success: false, error: { code: 'AGENT_UNAVAILABLE', message: 'Agent temporarily unavailable' } })
          )
        })
      )

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockCollaborativeContext}>
          <IntelligenceHub />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Verify failure detection
      await waitFor(() => {
        expect(screen.getByText(/agent failure detected/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/translation specialist alpha unavailable/i)).toBeInTheDocument()

      // Check automatic recovery
      expect(screen.getByText(/initiating failover/i)).toBeInTheDocument()
      expect(screen.getByText(/reassigning tasks/i)).toBeInTheDocument()

      // Verify backup agent activation
      await waitFor(() => {
        expect(screen.getByText(/backup agent activated/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/collaboration resumed/i)).toBeInTheDocument()
      expect(screen.getByText(/minimal impact on progress/i)).toBeInTheDocument()
    })
  })
})