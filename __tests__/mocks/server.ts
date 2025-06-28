// MSW (Mock Service Worker) server setup
// Comprehensive API mocking for testing

import { setupServer } from 'msw/node'
import { rest } from 'msw'
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '../../types/auth'
import type {
  TranslationRequest,
  TranslationResponse,
  Translation
} from '../../types/translation'
import type {
  Document,
  DocumentUploadResponse
} from '../../types/documents'
import type {
  Agent,
  AgentTask,
  SwarmMetrics
} from '../../types/intelligence'

// Mock data
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatar: 'https://example.com/avatar.jpg',
  language: 'en',
  timezone: 'UTC',
  emailVerified: true,
  phoneNumber: '+1234567890',
  phoneVerified: false,
  twoFactorEnabled: false,
  lastLoginAt: new Date('2024-01-01T00:00:00Z'),
  lastActiveAt: new Date('2024-01-01T00:00:00Z'),
  status: 'active',
  roles: [],
  permissions: [],
  preferences: {
    language: 'en',
    timezone: 'UTC',
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      inApp: true,
      digest: 'weekly'
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false
    },
    workspace: {
      defaultView: 'translation',
      autoSave: true,
      showTutorials: true,
      compactMode: false
    },
    privacy: {
      profileVisibility: 'private',
      showOnlineStatus: true,
      allowMessageRequests: false
    }
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
}

const mockTranslation: Translation = {
  id: 'translation-123',
  sourceText: 'Hello world',
  translatedText: 'Xin chào thế giới',
  sourceLanguage: 'en',
  targetLanguage: 'vi',
  confidence: 0.95,
  status: 'completed',
  alternatives: ['Chào thế giới', 'Xin chào thế giới'],
  metadata: {
    model: 'gpt-4',
    engine: 'gpt-4',
    processingTime: 1500,
    charactersCount: 11,
    wordsCount: 2,
    cost: 0.002,
    quality: {
      fluency: 0.95,
      accuracy: 0.92,
      coherence: 0.98
    },
    flags: [],
    revisions: []
  },
  userId: 'user-123',
  version: 1,
  isPublic: false,
  tags: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
}

const mockDocument: Document = {
  id: 'doc-123',
  name: 'test-document.pdf',
  originalName: 'test-document.pdf',
  type: 'pdf',
  format: 'pdf',
  size: 1024000,
  url: 'https://example.com/documents/test-document.pdf',
  status: 'completed',
  targetLanguages: ['vi', 'es'],
  content: {
    extractedText: 'This is a test document.',
    structure: {
      type: 'linear',
      outline: [],
      navigation: {
        totalPages: 1,
        bookmarks: [],
        hyperlinks: []
      },
      formatting: {
        fonts: [],
        colors: [],
        styles: []
      }
    },
    elements: [],
    pages: [],
    sections: []
  },
  metadata: {
    originalSize: 1024000,
    pageCount: 1,
    wordCount: 5,
    characterCount: 25,
    language: 'en',
    security: {
      encrypted: false,
      passwordProtected: false,
      permissions: []
    },
    quality: {
      score: 0.9,
      issues: []
    }
  },
  processing: {
    stages: [],
    progress: 100,
    errors: [],
    warnings: [],
    resources: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0
    }
  },
  translations: [],
  analyses: [],
  userId: 'user-123',
  tags: [],
  isPublic: false,
  shareSettings: {
    isPublic: false,
    allowDownload: true,
    allowCopy: true,
    allowPrint: true,
    permissions: []
  },
  version: 1,
  revisions: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
}

const mockAgent: Agent = {
  id: 'agent-123',
  name: 'Translation Agent',
  description: 'AI agent for translation tasks',
  type: 'translator',
  specialization: ['language_pairs'],
  status: 'idle',
  capabilities: [],
  performance: {
    overall: {
      score: 0.9,
      reliability: 0.95,
      efficiency: 0.88,
      accuracy: 0.92
    },
    metrics: {
      tasksCompleted: 150,
      averageCompletionTime: 2500,
      successRate: 0.95,
      errorRate: 0.05,
      collaborationScore: 0.85
    },
    benchmarks: {
      translation: {
        speed: 1000,
        accuracy: 0.92,
        consistency: 0.88
      },
      analysis: {
        depth: 0.85,
        insights: 0.78,
        accuracy: 0.90
      },
      collaboration: {
        responseTime: 500,
        helpfulness: 0.88,
        adaptability: 0.82
      }
    },
    trends: []
  },
  configuration: {
    model: 'gpt-4',
    parameters: {},
    personality: {
      traits: {
        confidence: 0.8,
        creativity: 0.7,
        attention_to_detail: 0.9,
        collaboration: 0.85,
        learning_rate: 0.75
      },
      communication_style: 'formal',
      decision_making: 'balanced',
      error_handling: 'learning'
    },
    preferences: {
      preferredLanguages: ['en', 'vi'],
      workingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      taskPriority: {
        types: ['translator'],
        domains: ['general'],
        urgency: 'medium'
      },
      collaborationStyle: {
        preferred_partners: [],
        max_concurrent_collaborations: 3,
        communication_frequency: 'regular'
      }
    },
    constraints: {
      maxConcurrentTasks: 5,
      maxTaskDuration: 3600000,
      allowedResources: ['translation', 'analysis'],
      prohibitedContent: ['explicit', 'illegal'],
      qualityThresholds: {
        accuracy: 0.9,
        fluency: 0.85
      },
      rateLimits: {
        requests_per_minute: 60,
        tokens_per_hour: 10000
      }
    },
    integrations: []
  },
  resources: {
    allocated: {
      cpu: 2,
      memory: 4096,
      storage: 10240,
      network: 100
    },
    current_usage: {
      cpu: 0.1,
      memory: 512,
      storage: 1024,
      network: 10
    },
    limits: {
      cpu: 4,
      memory: 8192,
      storage: 20480,
      network: 1000
    },
    cost: {
      hourly: 0.50,
      daily: 12.00,
      monthly: 360.00,
      currency: 'USD'
    }
  },
  taskHistory: [],
  collaboration: {
    active_collaborations: [],
    collaboration_history: [],
    reputation: {
      as_leader: 0.85,
      as_contributor: 0.92,
      reliability: 0.95,
      communication: 0.88
    },
    network: {
      trusted_agents: [],
      frequent_collaborators: [],
      avoided_agents: []
    },
    preferences: {
      max_group_size: 5,
      preferred_roles: ['contributor'],
      communication_style: 'formal'
    }
  },
  learning: {
    current_training: [],
    completed_training: [],
    knowledge_base: [],
    skills: [],
    adaptation_rate: 0.75,
    learning_efficiency: 0.80,
    retention_rate: 0.92
  },
  version: '1.0.0',
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
}

const mockSwarmMetrics: SwarmMetrics = {
  totalAgents: 10,
  activeAgents: 7,
  totalCollaborations: 25,
  averageEfficiency: 0.85,
  networkHealth: 0.92,
  responseTime: 450,
  successRate: 0.94,
  lastUpdate: new Date('2024-01-01T00:00:00Z')
}

// API handlers
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', async (req, res, ctx) => {
    const body = await req.json() as LoginRequest
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      const response: LoginResponse = {
        user: mockUser,
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          expiresAt: new Date(Date.now() + 3600000)
        },
        session: {
          id: 'session-123',
          userId: mockUser.id,
          deviceId: 'device-123',
          deviceName: 'Test Device',
          deviceType: 'desktop',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Test',
          createdAt: new Date(),
          lastActiveAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          isActive: true
        }
      }
      
      return res(ctx.status(200), ctx.json(response))
    }
    
    return res(
      ctx.status(401),
      ctx.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } })
    )
  }),

  rest.post('/api/auth/register', async (req, res, ctx) => {
    const body = await req.json() as RegisterRequest
    
    const response: RegisterResponse = {
      user: {
        ...mockUser,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        expiresAt: new Date(Date.now() + 3600000)
      },
      session: {
        id: 'session-123',
        userId: mockUser.id,
        deviceId: 'device-123',
        deviceName: 'Test Device',
        deviceType: 'desktop',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Test',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        isActive: true
      },
      requiresVerification: true,
      verificationMethod: 'email'
    }
    
    return res(ctx.status(201), ctx.json(response))
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }))
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization')
    
    if (authHeader && authHeader.includes('mock-access-token')) {
      return res(ctx.status(200), ctx.json({ success: true, data: mockUser }))
    }
    
    return res(
      ctx.status(401),
      ctx.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } })
    )
  }),

  // Translation endpoints
  rest.post('/api/translate', async (req, res, ctx) => {
    const body = await req.json() as TranslationRequest
    
    const response: TranslationResponse = {
      id: 'translation-123',
      translatedText: 'Mock translated text',
      detectedLanguage: body.sourceLanguage !== 'auto' ? body.sourceLanguage : 'en',
      confidence: 0.95,
      alternatives: ['Alternative 1', 'Alternative 2'],
      metadata: mockTranslation.metadata,
      usage: {
        charactersUsed: body.text.length,
        charactersRemaining: 10000 - body.text.length,
        costEstimate: 0.001
      },
      warnings: []
    }
    
    return res(ctx.status(200), ctx.json({ success: true, data: response }))
  }),

  rest.get('/api/translations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: [mockTranslation],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      })
    )
  }),

  // Document endpoints
  rest.post('/api/documents/upload', async (req, res, ctx) => {
    const response: DocumentUploadResponse = {
      document: mockDocument,
      uploadUrl: 'https://example.com/upload-endpoint',
      processingJobId: 'job-123'
    }
    
    return res(ctx.status(200), ctx.json({ success: true, data: response }))
  }),

  rest.get('/api/documents', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: [mockDocument],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      })
    )
  }),

  rest.get('/api/documents/:id', (req, res, ctx) => {
    const { id } = req.params
    
    if (id === 'doc-123') {
      return res(ctx.status(200), ctx.json({ success: true, data: mockDocument }))
    }
    
    return res(
      ctx.status(404),
      ctx.json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } })
    )
  }),

  // AI Agent endpoints
  rest.get('/api/agents', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: [mockAgent],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      })
    )
  }),

  rest.get('/api/agents/metrics', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true, data: mockSwarmMetrics }))
  }),

  rest.post('/api/agents/:id/tasks', async (req, res, ctx) => {
    const { id } = req.params
    const body = await req.json()
    
    const task: AgentTask = {
      id: 'task-123',
      title: body.title || 'Test Task',
      description: body.description || 'Test task description',
      type: body.type || 'translation',
      priority: body.priority || 'normal',
      status: 'pending',
      assignedAgents: [id as string],
      requiredCapabilities: [],
      input: {
        data: body.input,
        format: 'json',
        constraints: {},
        context: '',
        requirements: []
      },
      progress: {
        percentage: 0,
        currentStage: 'pending',
        stages: [],
        milestones: [],
        blockers: []
      },
      estimatedDuration: 3600,
      dependencies: [],
      subtasks: [],
      metadata: {
        creator: mockUser.id,
        source: 'user',
        tags: [],
        category: 'translation',
        complexity: 1,
        effort_estimate: 1,
        quality_requirements: {},
        collaboration_required: false,
        learning_opportunity: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return res(ctx.status(201), ctx.json({ success: true, data: task }))
  }),

  // Error simulation endpoints
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
    )
  }),

  rest.get('/api/error/timeout', (req, res, ctx) => {
    return res(ctx.delay('infinite'))
  }),

  // Catch-all handler
  rest.all('*', (req, res, ctx) => {
    console.warn(`No handler found for ${req.method} ${req.url}`)
    return res(
      ctx.status(404),
      ctx.json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } })
    )
  }),
]

// Create and export the server
export const server = setupServer(...handlers)