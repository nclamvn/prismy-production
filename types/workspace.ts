// Workspace and Intelligence System TypeScript definitions
// Comprehensive types for workspace functionality and AI intelligence

import type { SupportedLanguage, WithId, WithTimestamps, AsyncState } from './index'
import type { User, Agent, Document } from './api'

// Core Workspace Types
export type WorkspaceMode = 
  | 'translation' 
  | 'documents' 
  | 'intelligence' 
  | 'analytics' 
  | 'api' 
  | 'enterprise' 
  | 'billing' 
  | 'settings'

export interface WorkspaceContext {
  currentMode: WorkspaceMode
  previousMode?: WorkspaceMode
  activeDocuments: string[]
  selectedText?: string
  cursor: {
    line: number
    column: number
  }
  viewport: {
    scroll: number
    zoom: number
  }
  recentActions: WorkspaceAction[]
}

export interface WorkspaceAction {
  id: string
  type: string
  timestamp: Date
  details: Record<string, any>
  undoable: boolean
}

// Intelligence System Types
export interface WorkspaceIntelligenceState {
  currentMode: WorkspaceMode
  previousMode?: WorkspaceMode
  context: WorkspaceContext
  activities: Activity[]
  patterns: UserPattern
  activeOperations: AIOperation[]
  completedOperations: AIOperation[]
  suggestions: SmartSuggestion[]
  insights: WorkspaceInsight[]
  isProcessing: boolean
  lastSync: Date
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
}

export interface Activity {
  id: string
  type: 'translation' | 'document_upload' | 'batch_process' | 'agent_interaction' | 'settings_change'
  timestamp: Date
  duration?: number
  status: 'started' | 'completed' | 'failed' | 'cancelled'
  details: ActivityDetails
  metadata?: Record<string, any>
}

export interface ActivityDetails {
  description: string
  sourceLanguage?: SupportedLanguage
  targetLanguage?: SupportedLanguage
  documentId?: string
  agentId?: string
  charactersProcessed?: number
  accuracy?: number
  error?: string
}

export interface UserPattern {
  preferredLanguages: {
    source: SupportedLanguage[]
    target: SupportedLanguage[]
  }
  workingHours: {
    start: string
    end: string
    timezone: string
  }
  frequentActions: Array<{
    action: string
    frequency: number
    lastUsed: Date
  }>
  efficiency: {
    averageTranslationTime: number
    preferredWorkflowSteps: string[]
    errorRate: number
  }
  preferences: {
    preferredAgents: string[]
    autoTranslation: boolean
    qualityThreshold: number
  }
}

export interface AIOperation {
  id: string
  type: 'translation' | 'analysis' | 'optimization' | 'suggestion' | 'batch_process'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  agentId?: string
  input: OperationInput
  output?: OperationOutput
  progress: number
  estimatedCompletion?: Date
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: OperationError
}

export interface OperationInput {
  text?: string
  documentId?: string
  sourceLanguage?: SupportedLanguage
  targetLanguage?: SupportedLanguage
  context?: string
  options?: Record<string, any>
}

export interface OperationOutput {
  result: string | Document | any[]
  confidence: number
  alternatives?: any[]
  metadata: {
    processingTime: number
    model: string
    cost?: number
  }
}

export interface OperationError {
  code: string
  message: string
  details?: Record<string, any>
  retryable: boolean
}

export interface SmartSuggestion {
  id: string
  type: 'workflow' | 'optimization' | 'language' | 'agent' | 'automation'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  reasoning: string
  action: SuggestionAction
  confidence: number
  expectedBenefit: string
  estimatedTime: string
  createdAt: Date
  dismissedAt?: Date
  appliedAt?: Date
}

export interface SuggestionAction {
  type: 'redirect' | 'modal' | 'inline' | 'background'
  payload: Record<string, any>
  handler: () => void | Promise<void>
}

export interface WorkspaceInsight {
  id: string
  category: 'productivity' | 'quality' | 'efficiency' | 'usage' | 'cost'
  title: string
  description: string
  value: number | string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    period: string
  }
  comparison?: {
    value: number | string
    label: string
  }
  actionable: boolean
  relatedSuggestions: string[]
  createdAt: Date
}

// Swarm Intelligence Types
export interface SwarmMetrics {
  totalAgents: number
  activeAgents: number
  totalCollaborations: number
  averageEfficiency: number
  networkHealth: number
  responseTime: number
  successRate: number
  lastUpdate: Date
}

export interface AgentCollaboration {
  id: string
  participants: string[]
  task: string
  status: 'active' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  result?: CollaborationResult
}

export interface CollaborationResult {
  output: any
  quality: number
  contributors: Array<{
    agentId: string
    contribution: number
  }>
  efficiency: number
}

// Batch Processing Types
export interface BatchJob {
  id: string
  name: string
  type: 'translation' | 'analysis' | 'extraction'
  status: 'pending' | 'processing' | 'completed' | 'error' | 'paused'
  priority: 'low' | 'normal' | 'high'
  documents: BatchDocument[]
  config: BatchJobConfig
  progress: BatchProgress
  statistics: BatchStatistics
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface BatchDocument {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  result?: any
  error?: string
  estimatedCompletion?: Date
}

export interface BatchJobConfig {
  sourceLanguage?: SupportedLanguage
  targetLanguages: SupportedLanguage[]
  domain?: string
  qualityLevel: 'fast' | 'balanced' | 'accurate'
  preserveFormatting: boolean
  parallelProcessing: boolean
  maxRetries: number
  notifications: {
    onProgress: boolean
    onCompletion: boolean
    onError: boolean
  }
}

export interface BatchProgress {
  total: number
  completed: number
  failed: number
  percentage: number
  estimatedTimeRemaining?: number
  currentDocument?: string
}

export interface BatchStatistics {
  documentsProcessed: number
  charactersProcessed: number
  averageAccuracy: number
  totalProcessingTime: number
  costEstimate?: number
}

// Recommendation System Types
export interface Recommendation {
  id: string
  type: 'workflow' | 'feature' | 'optimization' | 'learning'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  benefit: string
  estimatedTime: string
  category: 'productivity' | 'efficiency' | 'learning' | 'automation'
  prerequisites?: string[]
  steps?: RecommendationStep[]
  action: () => void
  metadata: {
    confidence: number
    basedOn: string[]
    frequency: number
  }
  createdAt: Date
  viewedAt?: Date
  dismissedAt?: Date
  completedAt?: Date
}

export interface RecommendationStep {
  title: string
  description: string
  optional: boolean
  estimatedTime: string
  action?: () => void
}

// Context Provider Types
export interface WorkspaceIntelligenceContextValue {
  state: WorkspaceIntelligenceState
  actions: {
    setMode: (mode: WorkspaceMode) => void
    updateContext: (context: Partial<WorkspaceContext>) => void
    addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void
    startOperation: (operation: Omit<AIOperation, 'id' | 'createdAt' | 'progress'>) => string
    updateOperation: (id: string, updates: Partial<AIOperation>) => void
    completeOperation: (id: string, output: OperationOutput) => void
    failOperation: (id: string, error: OperationError) => void
    addSuggestion: (suggestion: Omit<SmartSuggestion, 'id' | 'createdAt'>) => void
    dismissSuggestion: (id: string) => void
    applySuggestion: (id: string) => void
    addInsight: (insight: Omit<WorkspaceInsight, 'id' | 'createdAt'>) => void
    syncWithServer: () => Promise<void>
  }
}

// Analytics and Performance Types
export interface WorkspaceAnalytics {
  usage: UsageMetrics
  performance: PerformanceMetrics
  quality: QualityMetrics
  efficiency: EfficiencyMetrics
  trends: TrendAnalysis
}

export interface UsageMetrics {
  period: {
    start: Date
    end: Date
  }
  translations: {
    total: number
    byLanguage: Record<string, number>
    byType: Record<string, number>
  }
  documents: {
    uploaded: number
    processed: number
    byFormat: Record<string, number>
  }
  agents: {
    totalInteractions: number
    byAgent: Record<string, number>
    averageResponseTime: number
  }
  features: {
    mostUsed: string[]
    leastUsed: string[]
    newFeatures: string[]
  }
}

export interface PerformanceMetrics {
  responseTime: {
    average: number
    p95: number
    p99: number
  }
  throughput: {
    charactersPerMinute: number
    documentsPerHour: number
  }
  reliability: {
    uptime: number
    errorRate: number
    successRate: number
  }
  resourceUsage: {
    cpuUsage: number
    memoryUsage: number
    networkUsage: number
  }
}

export interface QualityMetrics {
  accuracy: {
    overall: number
    byLanguagePair: Record<string, number>
    byDomain: Record<string, number>
  }
  userSatisfaction: {
    ratings: number[]
    averageRating: number
    feedbackCount: number
  }
  errorAnalysis: {
    totalErrors: number
    errorTypes: Record<string, number>
    criticalErrors: number
  }
}

export interface EfficiencyMetrics {
  timeToCompletion: {
    average: number
    byTaskType: Record<string, number>
  }
  automationRate: number
  manualInterventions: number
  workflowOptimization: {
    potentialTimeSavings: number
    suggestedImprovements: string[]
  }
}

export interface TrendAnalysis {
  period: {
    start: Date
    end: Date
  }
  growth: {
    usage: number
    performance: number
    quality: number
  }
  patterns: {
    peakHours: number[]
    busyDays: string[]
    seasonality: Record<string, number>
  }
  predictions: {
    nextMonth: {
      usage: number
      performance: number
    }
    recommendations: string[]
  }
}

// Hook return types
export interface UseWorkspaceIntelligence {
  state: WorkspaceIntelligenceState
  setMode: (mode: WorkspaceMode) => void
  updateContext: (context: Partial<WorkspaceContext>) => void
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void
  operations: {
    start: (operation: Omit<AIOperation, 'id' | 'createdAt' | 'progress'>) => string
    update: (id: string, updates: Partial<AIOperation>) => void
    complete: (id: string, output: OperationOutput) => void
    fail: (id: string, error: OperationError) => void
  }
  suggestions: {
    add: (suggestion: Omit<SmartSuggestion, 'id' | 'createdAt'>) => void
    dismiss: (id: string) => void
    apply: (id: string) => void
  }
  insights: {
    add: (insight: Omit<WorkspaceInsight, 'id' | 'createdAt'>) => void
    getByCategory: (category: string) => WorkspaceInsight[]
  }
  sync: () => Promise<void>
}

export interface UseBatchProcessing {
  jobs: AsyncState<BatchJob[]>
  createJob: (config: Partial<BatchJob>) => Promise<BatchJob>
  startJob: (id: string) => Promise<void>
  pauseJob: (id: string) => Promise<void>
  cancelJob: (id: string) => Promise<void>
  getJobStatus: (id: string) => Promise<BatchJob>
  retryJob: (id: string) => Promise<void>
  deleteJob: (id: string) => Promise<void>
}