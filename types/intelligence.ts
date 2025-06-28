// AI Intelligence System TypeScript definitions
// Comprehensive type system for AI agents and swarm intelligence

import type { SupportedLanguage, WithId, WithTimestamps, AsyncState } from './index'
import type { Translation } from './translation'
import type { Document } from './documents'

// Core AI Agent Types
export interface Agent extends WithId, WithTimestamps {
  name: string
  description?: string
  type: AgentType
  specialization: AgentSpecialization[]
  status: AgentStatus
  capabilities: AgentCapability[]
  performance: AgentPerformance
  configuration: AgentConfiguration
  resources: AgentResources
  currentTask?: AgentTask
  taskHistory: AgentTask[]
  collaboration: CollaborationInfo
  learning: LearningProgress
  version: string
  isActive: boolean
  userId?: string
  workspaceId?: string
}

export type AgentType = 
  | 'translator'
  | 'analyzer' 
  | 'editor'
  | 'reviewer'
  | 'summarizer'
  | 'researcher'
  | 'optimizer'
  | 'validator'
  | 'coordinator'
  | 'specialist'

export type AgentSpecialization = 
  | 'language_pairs'
  | 'domain_expertise'
  | 'document_types'
  | 'quality_assurance'
  | 'cultural_adaptation'
  | 'technical_writing'
  | 'creative_writing'
  | 'legal_documents'
  | 'medical_texts'
  | 'financial_reports'

export type AgentStatus = 
  | 'idle'
  | 'busy'
  | 'learning'
  | 'collaborating'
  | 'offline'
  | 'error'
  | 'maintenance'
  | 'upgrading'

export interface AgentCapability {
  name: string
  category: 'core' | 'specialized' | 'learned'
  level: number
  description: string
  requirements: string[]
  limitations: string[]
  lastUpdated: Date
}

export interface AgentPerformance {
  overall: {
    score: number
    reliability: number
    efficiency: number
    accuracy: number
  }
  metrics: {
    tasksCompleted: number
    averageCompletionTime: number
    successRate: number
    errorRate: number
    collaborationScore: number
  }
  benchmarks: {
    translation: {
      speed: number // chars per minute
      accuracy: number
      consistency: number
    }
    analysis: {
      depth: number
      insights: number
      accuracy: number
    }
    collaboration: {
      responseTime: number
      helpfulness: number
      adaptability: number
    }
  }
  trends: Array<{
    metric: string
    values: Array<{
      timestamp: Date
      value: number
    }>
  }>
}

export interface AgentConfiguration {
  model: string
  parameters: Record<string, any>
  personality: AgentPersonality
  preferences: AgentPreferences
  constraints: AgentConstraints
  integrations: AgentIntegration[]
}

export interface AgentPersonality {
  traits: {
    confidence: number
    creativity: number
    attention_to_detail: number
    collaboration: number
    learning_rate: number
  }
  communication_style: 'formal' | 'casual' | 'adaptive'
  decision_making: 'conservative' | 'balanced' | 'aggressive'
  error_handling: 'strict' | 'tolerant' | 'learning'
}

export interface AgentPreferences {
  preferredLanguages: SupportedLanguage[]
  workingHours: {
    start: string
    end: string
    timezone: string
    days: string[]
  }
  taskPriority: {
    types: AgentType[]
    domains: string[]
    urgency: 'low' | 'medium' | 'high'
  }
  collaborationStyle: {
    preferred_partners: string[]
    max_concurrent_collaborations: number
    communication_frequency: 'minimal' | 'regular' | 'frequent'
  }
}

export interface AgentConstraints {
  maxConcurrentTasks: number
  maxTaskDuration: number
  allowedResources: string[]
  prohibitedContent: string[]
  qualityThresholds: Record<string, number>
  rateLimits: {
    requests_per_minute: number
    tokens_per_hour: number
  }
}

export interface AgentIntegration {
  service: string
  type: 'api' | 'webhook' | 'database' | 'file_system'
  configuration: Record<string, any>
  status: 'active' | 'inactive' | 'error'
  lastSync: Date
}

export interface AgentResources {
  allocated: {
    cpu: number
    memory: number
    storage: number
    network: number
  }
  current_usage: {
    cpu: number
    memory: number
    storage: number
    network: number
  }
  limits: {
    cpu: number
    memory: number
    storage: number
    network: number
  }
  cost: {
    hourly: number
    daily: number
    monthly: number
    currency: string
  }
}

export interface CollaborationInfo {
  active_collaborations: AgentCollaboration[]
  collaboration_history: AgentCollaboration[]
  reputation: {
    as_leader: number
    as_contributor: number
    reliability: number
    communication: number
  }
  network: {
    trusted_agents: string[]
    frequent_collaborators: string[]
    avoided_agents: string[]
  }
  preferences: {
    max_group_size: number
    preferred_roles: string[]
    communication_style: string
  }
}

export interface LearningProgress {
  current_training: LearningSession[]
  completed_training: LearningSession[]
  knowledge_base: KnowledgeItem[]
  skills: SkillProgress[]
  adaptation_rate: number
  learning_efficiency: number
  retention_rate: number
}

export interface LearningSession {
  id: string
  type: 'supervised' | 'unsupervised' | 'reinforcement' | 'transfer'
  topic: string
  status: 'active' | 'completed' | 'paused' | 'failed'
  progress: number
  start_time: Date
  estimated_completion: Date
  actual_completion?: Date
  metrics: {
    accuracy: number
    loss: number
    validation_score: number
  }
  data_sources: string[]
}

export interface KnowledgeItem {
  id: string
  category: string
  content: any
  confidence: number
  source: string
  learned_at: Date
  last_accessed: Date
  usage_count: number
  validation_status: 'verified' | 'unverified' | 'disputed'
}

export interface SkillProgress {
  skill: string
  level: number
  experience: number
  proficiency: number
  last_practiced: Date
  improvement_rate: number
  certification_level?: string
}

// AI Task Management Types
export interface AgentTask extends WithId, WithTimestamps {
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assignedAgents: string[]
  requiredCapabilities: string[]
  input: TaskInput
  output?: TaskOutput
  progress: TaskProgress
  deadline?: Date
  estimatedDuration: number
  actualDuration?: number
  dependencies: string[]
  subtasks: AgentTask[]
  parentTaskId?: string
  workspaceId?: string
  userId?: string
  metadata: TaskMetadata
}

export type TaskType = 
  | 'translation'
  | 'analysis'
  | 'optimization'
  | 'review'
  | 'research'
  | 'summarization'
  | 'validation'
  | 'collaboration'
  | 'learning'
  | 'maintenance'

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical'

export type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'waiting'
  | 'reviewing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'suspended'

export interface TaskInput {
  data: any
  format: string
  constraints?: Record<string, any>
  context?: string
  requirements?: string[]
  preferences?: Record<string, any>
}

export interface TaskOutput {
  result: any
  format: string
  confidence: number
  quality_metrics: Record<string, number>
  alternative_results?: any[]
  explanation?: string
  reasoning?: string
  warnings?: string[]
  recommendations?: string[]
}

export interface TaskProgress {
  percentage: number
  currentStage: string
  stages: Array<{
    name: string
    status: 'pending' | 'active' | 'completed' | 'failed'
    progress: number
    startTime?: Date
    endTime?: Date
  }>
  milestones: Array<{
    name: string
    completed: boolean
    timestamp?: Date
  }>
  blockers: Array<{
    type: string
    description: string
    severity: 'low' | 'medium' | 'high'
    estimated_resolution: Date
  }>
}

export interface TaskMetadata {
  creator: string
  source: 'user' | 'system' | 'agent' | 'workflow'
  tags: string[]
  category: string
  complexity: number
  effort_estimate: number
  quality_requirements: Record<string, number>
  collaboration_required: boolean
  learning_opportunity: boolean
  cost_estimate?: number
}

// Swarm Intelligence Types
export interface SwarmIntelligence {
  id: string
  name: string
  description: string
  agents: string[]
  coordinator: string
  objectives: SwarmObjective[]
  strategies: SwarmStrategy[]
  performance: SwarmPerformance
  communication: SwarmCommunication
  learning: SwarmLearning
  status: 'forming' | 'active' | 'adapting' | 'dormant' | 'disbanded'
  createdAt: Date
  lastActive: Date
}

export interface SwarmObjective {
  id: string
  description: string
  priority: number
  metrics: Array<{
    name: string
    target: number
    current: number
    unit: string
  }>
  deadline?: Date
  status: 'active' | 'achieved' | 'failed' | 'modified'
}

export interface SwarmStrategy {
  id: string
  name: string
  description: string
  type: 'coordination' | 'optimization' | 'learning' | 'adaptation'
  parameters: Record<string, any>
  effectiveness: number
  applicability: string[]
  lastUsed: Date
}

export interface SwarmPerformance {
  efficiency: number
  quality: number
  speed: number
  adaptability: number
  collaboration_score: number
  learning_rate: number
  metrics: {
    tasks_completed: number
    average_completion_time: number
    success_rate: number
    resource_utilization: number
    cost_effectiveness: number
  }
  comparisons: {
    vs_individual_agents: number
    vs_previous_period: number
    vs_benchmarks: Record<string, number>
  }
}

export interface SwarmCommunication {
  protocols: CommunicationProtocol[]
  channels: CommunicationChannel[]
  patterns: CommunicationPattern[]
  efficiency: number
  clarity: number
  responsiveness: number
}

export interface CommunicationProtocol {
  name: string
  type: 'broadcast' | 'direct' | 'hierarchical' | 'mesh'
  rules: string[]
  frequency: 'continuous' | 'periodic' | 'event_driven'
  encryption: boolean
}

export interface CommunicationChannel {
  id: string
  name: string
  participants: string[]
  type: 'public' | 'private' | 'group'
  messages: SwarmMessage[]
  activity_level: number
}

export interface SwarmMessage {
  id: string
  sender: string
  recipients: string[]
  type: 'info' | 'request' | 'response' | 'alert' | 'coordination'
  content: any
  priority: number
  timestamp: Date
  acknowledged: string[]
  responses: SwarmMessage[]
}

export interface CommunicationPattern {
  pattern: string
  frequency: number
  effectiveness: number
  context: string[]
  participants: string[]
}

export interface SwarmLearning {
  collective_knowledge: KnowledgeBase
  learning_sessions: CollectiveLearningSession[]
  knowledge_sharing: KnowledgeSharingMetrics
  adaptation_history: AdaptationEvent[]
  emergent_behaviors: EmergentBehavior[]
}

export interface KnowledgeBase {
  categories: KnowledgeCategory[]
  total_items: number
  quality_score: number
  coverage: Record<string, number>
  last_updated: Date
}

export interface KnowledgeCategory {
  name: string
  items: KnowledgeItem[]
  expertise_level: number
  contributors: string[]
  validation_status: 'verified' | 'under_review' | 'disputed'
}

export interface CollectiveLearningSession {
  id: string
  topic: string
  participants: string[]
  type: 'knowledge_sharing' | 'problem_solving' | 'skill_development'
  duration: number
  outcomes: LearningOutcome[]
  knowledge_gained: KnowledgeItem[]
  start_time: Date
  end_time: Date
}

export interface LearningOutcome {
  type: 'knowledge' | 'skill' | 'capability' | 'strategy'
  description: string
  impact: number
  applicability: string[]
  validation: 'pending' | 'verified' | 'applied'
}

export interface KnowledgeSharingMetrics {
  sharing_frequency: number
  knowledge_transfer_rate: number
  retention_rate: number
  application_rate: number
  quality_improvement: number
}

export interface AdaptationEvent {
  id: string
  trigger: string
  type: 'strategy_change' | 'role_adjustment' | 'capability_enhancement'
  description: string
  impact: number
  success: boolean
  timestamp: Date
  participants: string[]
}

export interface EmergentBehavior {
  id: string
  name: string
  description: string
  first_observed: Date
  frequency: number
  conditions: string[]
  impact: 'positive' | 'negative' | 'neutral'
  stability: number
}

// Agent Collaboration Types
export interface AgentCollaboration extends WithId, WithTimestamps {
  name: string
  type: 'pair' | 'team' | 'network' | 'hierarchy'
  participants: CollaborationParticipant[]
  coordinator?: string
  objective: string
  status: 'forming' | 'active' | 'completing' | 'completed' | 'failed'
  tasks: string[]
  communication: CollaborationCommunication
  performance: CollaborationPerformance
  resources: CollaborationResources
  timeline: CollaborationTimeline
  outcomes: CollaborationOutcome[]
}

export interface CollaborationParticipant {
  agentId: string
  role: 'leader' | 'specialist' | 'supporter' | 'observer'
  contributions: string[]
  performance: {
    reliability: number
    quality: number
    timeliness: number
    communication: number
  }
  joined_at: Date
  last_active: Date
}

export interface CollaborationCommunication {
  total_messages: number
  message_types: Record<string, number>
  response_time: {
    average: number
    median: number
    max: number
  }
  clarity_score: number
  coordination_efficiency: number
}

export interface CollaborationPerformance {
  overall_score: number
  efficiency: number
  quality: number
  speed: number
  innovation: number
  individual_contributions: Array<{
    agentId: string
    contribution_score: number
    role_effectiveness: number
  }>
}

export interface CollaborationResources {
  allocated_budget: number
  actual_cost: number
  time_allocation: Record<string, number>
  shared_knowledge: string[]
  tools_used: string[]
}

export interface CollaborationTimeline {
  planned_start: Date
  actual_start: Date
  planned_end: Date
  estimated_end: Date
  actual_end?: Date
  milestones: Array<{
    name: string
    planned_date: Date
    actual_date?: Date
    status: 'pending' | 'completed' | 'delayed' | 'cancelled'
  }>
}

export interface CollaborationOutcome {
  type: 'deliverable' | 'insight' | 'improvement' | 'learning'
  description: string
  quality: number
  impact: number
  stakeholders: string[]
  validation: 'pending' | 'approved' | 'rejected'
}

// Context and Hook Types
export interface IntelligenceContextValue {
  agents: Agent[]
  activeCollaborations: AgentCollaboration[]
  swarmIntelligence: SwarmIntelligence[]
  currentTasks: AgentTask[]
  performance: SwarmPerformance
  actions: {
    createAgent: (config: Partial<Agent>) => Promise<Agent>
    updateAgent: (id: string, updates: Partial<Agent>) => Promise<Agent>
    deleteAgent: (id: string) => Promise<void>
    assignTask: (taskId: string, agentIds: string[]) => Promise<void>
    createCollaboration: (config: Partial<AgentCollaboration>) => Promise<AgentCollaboration>
    joinCollaboration: (collaborationId: string, agentId: string) => Promise<void>
    leaveCollaboration: (collaborationId: string, agentId: string) => Promise<void>
    sendMessage: (message: Partial<SwarmMessage>) => Promise<void>
    getPerformanceMetrics: () => Promise<SwarmPerformance>
    optimizeSwarm: () => Promise<void>
  }
}

export interface UseAgents {
  agents: AsyncState<Agent[]>
  createAgent: (config: Partial<Agent>) => Promise<Agent>
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<Agent>
  deleteAgent: (id: string) => Promise<void>
  getAgentPerformance: (id: string) => Promise<AgentPerformance>
}

export interface UseSwarmIntelligence {
  swarms: AsyncState<SwarmIntelligence[]>
  performance: SwarmPerformance
  createSwarm: (config: Partial<SwarmIntelligence>) => Promise<SwarmIntelligence>
  joinSwarm: (swarmId: string, agentId: string) => Promise<void>
  optimizeSwarm: (swarmId: string) => Promise<void>
  getSwarmMetrics: (swarmId: string) => Promise<SwarmPerformance>
}

export interface UseCollaboration {
  collaborations: AsyncState<AgentCollaboration[]>
  createCollaboration: (config: Partial<AgentCollaboration>) => Promise<AgentCollaboration>
  joinCollaboration: (id: string, agentId: string) => Promise<void>
  sendMessage: (collaborationId: string, message: Partial<SwarmMessage>) => Promise<void>
  getCollaborationHistory: (id: string) => Promise<SwarmMessage[]>
}