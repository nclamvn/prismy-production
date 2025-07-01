// Comprehensive Type Definitions for AI Workspace
// Shared interfaces and types for the PRISMY AI Agent Workspace

export interface Agent {
  id: string
  name: string
  nameVi: string
  specialty: string
  specialtyVi: string
  avatar: string
  status: 'active' | 'thinking' | 'idle' | 'paused' | 'error'
  personality: string
  personalityVi: string
  tasksCompleted: number
  tasksInProgress: number
  efficiency: number
  specializations: string[]
  culturalContext: string
  lastActivity: string
  collaboration?: string[]
  capabilities?: AgentCapability[]
  settings?: AgentSettings
}

export interface AgentCapability {
  id: string
  name: string
  nameVi: string
  description: string
  descriptionVi: string
  enabled: boolean
  confidenceLevel: number
}

export interface AgentSettings {
  responseStyle: 'formal' | 'casual' | 'technical'
  verbosity: 'concise' | 'detailed' | 'comprehensive'
  culturalAdaptation: boolean
  collaboration: boolean
  notifications: boolean
}

export interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: string
  agentName?: string
  citations?: Citation[]
  attachments?: Attachment[]
  thinking?: boolean
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  processingTime?: number
  confidence?: number
  sources?: number
  wordCount?: number
  complexity?: 'simple' | 'medium' | 'complex'
}

export interface Citation {
  id: string
  documentId: string
  documentTitle: string
  pageNumber?: number
  snippet: string
  confidence: number
  relevance: number
  context?: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  processingStatus?: 'pending' | 'processing' | 'completed' | 'error'
}

export interface Document {
  id: string
  title: string
  type: 'pdf' | 'docx' | 'txt' | 'image' | 'audio' | 'video'
  size: string
  lastModified: string
  agentsAssigned: string[]
  status: 'uploading' | 'processing' | 'ready' | 'error'
  metadata?: DocumentMetadata
  insights?: DocumentInsight[]
  tags?: string[]
  language?: string
  pageCount?: number
  wordCount?: number
}

export interface DocumentMetadata {
  author?: string
  createdDate?: string
  modifiedDate?: string
  subject?: string
  keywords?: string[]
  language?: string
  encoding?: string
  security?: DocumentSecurity
}

export interface DocumentSecurity {
  encrypted: boolean
  passwordProtected: boolean
  permissions: string[]
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted'
}

export interface DocumentInsight {
  id: string
  type: 'summary' | 'key_points' | 'questions' | 'concerns' | 'recommendations'
  title: string
  titleVi: string
  content: string
  confidence: number
  agentId: string
  timestamp: Date
  relevantPages?: number[]
}

export interface Task {
  id: string
  title: string
  titleVi: string
  description?: string
  descriptionVi?: string
  agentId: string
  documentId?: string
  status: 'pending' | 'in_progress' | 'completed' | 'requires_review' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedTime: string
  actualTime?: string
  progress: number
  dependencies?: string[]
  assignedBy?: string
  dueDate?: Date
  results?: TaskResult[]
}

export interface TaskResult {
  id: string
  type: 'analysis' | 'summary' | 'translation' | 'extraction' | 'recommendation'
  content: string
  confidence: number
  metadata?: any
}

export interface Annotation {
  id: string
  documentId: string
  pageNumber: number
  position: Position
  content: string
  type: 'highlight' | 'note' | 'question' | 'concern' | 'suggestion'
  agentId?: string
  userId?: string
  timestamp: Date
  replies?: AnnotationReply[]
  resolved?: boolean
}

export interface AnnotationReply {
  id: string
  content: string
  agentId?: string
  userId?: string
  timestamp: Date
}

export interface Position {
  x: number
  y: number
  width: number
  height: number
}

export interface WorkspaceState {
  activeDocuments: Document[]
  selectedDocument?: Document
  activeAgents: Agent[]
  selectedAgent?: Agent
  currentTasks: Task[]
  recentMessages: Message[]
  collaborationMode: boolean
  layout: WorkspaceLayout
}

export interface WorkspaceLayout {
  sidebarCollapsed: boolean
  rightPanelVisible: boolean
  chatPanelSize: number
  documentViewerSize: number
  agentDashboardSize: number
}

export interface CollaborationSession {
  id: string
  name: string
  nameVi: string
  participants: Agent[]
  documents: string[]
  tasks: string[]
  status: 'active' | 'paused' | 'completed'
  startTime: Date
  endTime?: Date
  objective: string
  objectiveVi: string
}

export interface UserPreferences {
  language: 'en' | 'vi'
  theme: 'light' | 'dark' | 'auto'
  culturalAdaptation: boolean
  notificationsEnabled: boolean
  defaultAgents: string[]
  workspaceLayout: WorkspaceLayout
  agentSettings: Record<string, AgentSettings>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  errorVi?: string
  metadata?: {
    timestamp: string
    processingTime: number
    version: string
  }
}

// Event types for workspace communication
export interface WorkspaceEvent {
  type: WorkspaceEventType
  payload: any
  timestamp: Date
  source: 'user' | 'agent' | 'system'
}

export type WorkspaceEventType = 
  | 'document_uploaded'
  | 'document_processed'
  | 'agent_assigned'
  | 'agent_completed_task'
  | 'message_sent'
  | 'annotation_created'
  | 'collaboration_started'
  | 'collaboration_ended'
  | 'insight_generated'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'

// Cultural adaptation types
export interface CulturalContext {
  country: 'VN' | 'TH' | 'ID' | 'PH' | 'SG'
  language: string
  timeZone: string
  workingHours: {
    start: number
    end: number
  }
  culturalNorms: {
    formalityLevel: 'high' | 'medium' | 'low'
    directnessLevel: 'high' | 'medium' | 'low'
    hierarchyAwareness: boolean
  }
  businessPractices: {
    meetingStyle: 'formal' | 'informal' | 'mixed'
    communicationStyle: 'direct' | 'indirect' | 'context-dependent'
    decisionMaking: 'hierarchical' | 'consensus' | 'individual'
  }
}

// Performance and analytics types
export interface PerformanceMetrics {
  agentEfficiency: Record<string, number>
  taskCompletionRate: number
  averageResponseTime: number
  userSatisfactionScore: number
  documentProcessingSpeed: number
  collaborationEffectiveness: number
}

export interface AnalyticsData {
  period: {
    start: Date
    end: Date
  }
  metrics: PerformanceMetrics
  trends: {
    metric: string
    direction: 'up' | 'down' | 'stable'
    change: number
  }[]
  insights: string[]
  recommendations: string[]
}