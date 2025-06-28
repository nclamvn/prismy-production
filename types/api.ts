// API-related TypeScript definitions
// Comprehensive type system for all API interactions

import type { SupportedLanguage } from './index'

// Base API types
export interface ApiRequestConfig {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  requiresAuth?: boolean
  rateLimit?: {
    requests: number
    window: number // seconds
  }
}

// Authentication API
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  language?: SupportedLanguage
  acceptTerms: boolean
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  token: string
  password: string
}

// User API
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  language: SupportedLanguage
  timezone: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  subscription?: {
    plan: string
    status: string
    expiresAt?: string
  }
  preferences: UserPreferences
  roles: string[]
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
  workspace: {
    defaultLanguage: SupportedLanguage
    autoSave: boolean
    showTutorials: boolean
  }
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  avatar?: string
  language?: SupportedLanguage
  timezone?: string
  preferences?: Partial<UserPreferences>
}

// Translation API
export interface TranslationRequest {
  text: string
  sourceLanguage: SupportedLanguage | 'auto'
  targetLanguage: SupportedLanguage
  context?: string
  domain?: 'general' | 'technical' | 'medical' | 'legal' | 'business'
  preserveFormatting?: boolean
}

export interface TranslationResponse {
  translatedText: string
  detectedLanguage?: SupportedLanguage
  confidence: number
  alternatives?: string[]
  usage: {
    charactersUsed: number
    charactersRemaining: number
  }
  metadata: {
    model: string
    processingTime: number
    timestamp: string
  }
}

export interface BatchTranslationRequest {
  items: Array<{
    id: string
    text: string
    sourceLanguage: SupportedLanguage | 'auto'
    targetLanguage: SupportedLanguage
    context?: string
  }>
  options?: {
    domain?: string
    preserveFormatting?: boolean
    priority?: 'low' | 'normal' | 'high'
  }
}

export interface BatchTranslationResponse {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  results?: Array<{
    id: string
    translatedText: string
    confidence: number
    error?: string
  }>
  progress: {
    completed: number
    total: number
    percentage: number
  }
  estimatedCompletion?: string
}

// Document API
export interface Document {
  id: string
  name: string
  type: string
  size: number
  url: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  sourceLanguage?: SupportedLanguage
  targetLanguages: SupportedLanguage[]
  createdAt: string
  updatedAt: string
  translations?: DocumentTranslation[]
  metadata: {
    pages?: number
    words?: number
    characters?: number
    extractedText?: string
  }
}

export interface DocumentTranslation {
  id: string
  targetLanguage: SupportedLanguage
  status: 'pending' | 'processing' | 'completed' | 'error'
  url?: string
  progress: number
  createdAt: string
  completedAt?: string
  error?: string
}

export interface DocumentUploadRequest {
  file: File
  targetLanguages: SupportedLanguage[]
  options?: {
    preserveFormatting?: boolean
    domain?: string
    priority?: 'low' | 'normal' | 'high'
  }
}

export interface DocumentUploadResponse {
  document: Document
  uploadUrl: string
}

// AI Agent API
export interface Agent {
  id: string
  name: string
  type: 'translator' | 'analyzer' | 'editor' | 'reviewer'
  status: 'idle' | 'busy' | 'offline' | 'error'
  capabilities: string[]
  performance: {
    accuracy: number
    speed: number
    reliability: number
  }
  currentTask?: {
    id: string
    type: string
    progress: number
  }
  lastActive: string
}

export interface AgentTask {
  id: string
  type: string
  status: 'pending' | 'assigned' | 'processing' | 'completed' | 'failed'
  agentId?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  payload: Record<string, any>
  result?: Record<string, any>
  error?: string
  createdAt: string
  assignedAt?: string
  completedAt?: string
}

export interface CreateAgentTaskRequest {
  type: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  payload: Record<string, any>
  requiredCapabilities?: string[]
}

// Workspace API
export interface Workspace {
  id: string
  name: string
  description?: string
  type: 'personal' | 'team' | 'enterprise'
  owner: User
  members: WorkspaceMember[]
  settings: WorkspaceSettings
  statistics: WorkspaceStatistics
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  id: string
  user: User
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: string
  permissions: string[]
}

export interface WorkspaceSettings {
  defaultSourceLanguage: SupportedLanguage
  defaultTargetLanguages: SupportedLanguage[]
  allowedDomains: string[]
  autoTranslation: boolean
  qualityThreshold: number
  notifications: {
    taskCompletion: boolean
    errorAlerts: boolean
    weeklyReports: boolean
  }
}

export interface WorkspaceStatistics {
  totalTranslations: number
  totalCharacters: number
  totalDocuments: number
  activeAgents: number
  averageAccuracy: number
  thisMonth: {
    translations: number
    characters: number
    documents: number
  }
}

export interface CreateWorkspaceRequest {
  name: string
  description?: string
  type: 'personal' | 'team' | 'enterprise'
  settings?: Partial<WorkspaceSettings>
}

export interface UpdateWorkspaceRequest {
  name?: string
  description?: string
  settings?: Partial<WorkspaceSettings>
}

// Analytics API
export interface AnalyticsQuery {
  metric: string
  dimensions?: string[]
  filters?: Record<string, any>
  dateRange: {
    start: string
    end: string
  }
  granularity?: 'hour' | 'day' | 'week' | 'month'
}

export interface AnalyticsResponse {
  query: AnalyticsQuery
  data: Array<{
    timestamp: string
    value: number
    dimensions?: Record<string, string>
  }>
  summary: {
    total: number
    average: number
    min: number
    max: number
    change?: {
      value: number
      percentage: number
    }
  }
}

// Billing API
export interface BillingInfo {
  subscription: {
    id: string
    plan: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }
  usage: {
    current: {
      characters: number
      documents: number
      apiCalls: number
    }
    limits: {
      characters: number
      documents: number
      apiCalls: number
    }
    resetDate: string
  }
  invoices: Invoice[]
  paymentMethod?: PaymentMethod
}

export interface Invoice {
  id: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void'
  dueDate: string
  paidAt?: string
  downloadUrl: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  last4: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
}

export interface CreateSubscriptionRequest {
  planId: string
  paymentMethodId: string
}

export interface UpdateSubscriptionRequest {
  planId?: string
  cancelAtPeriodEnd?: boolean
}

// API Client interface
export interface ApiClient {
  // Authentication
  login(request: LoginRequest): Promise<LoginResponse>
  register(request: RegisterRequest): Promise<LoginResponse>
  refreshToken(request: RefreshTokenRequest): Promise<LoginResponse>
  logout(): Promise<void>
  
  // User management
  getCurrentUser(): Promise<User>
  updateUser(request: UpdateUserRequest): Promise<User>
  deleteUser(): Promise<void>
  
  // Translation
  translate(request: TranslationRequest): Promise<TranslationResponse>
  batchTranslate(request: BatchTranslationRequest): Promise<BatchTranslationResponse>
  getBatchTranslationStatus(jobId: string): Promise<BatchTranslationResponse>
  
  // Documents
  getDocuments(): Promise<Document[]>
  getDocument(id: string): Promise<Document>
  uploadDocument(request: DocumentUploadRequest): Promise<DocumentUploadResponse>
  deleteDocument(id: string): Promise<void>
  
  // AI Agents
  getAgents(): Promise<Agent[]>
  getAgent(id: string): Promise<Agent>
  createAgentTask(request: CreateAgentTaskRequest): Promise<AgentTask>
  getAgentTasks(): Promise<AgentTask[]>
  getAgentTask(id: string): Promise<AgentTask>
  
  // Workspace
  getWorkspaces(): Promise<Workspace[]>
  getWorkspace(id: string): Promise<Workspace>
  createWorkspace(request: CreateWorkspaceRequest): Promise<Workspace>
  updateWorkspace(id: string, request: UpdateWorkspaceRequest): Promise<Workspace>
  deleteWorkspace(id: string): Promise<void>
  
  // Analytics
  queryAnalytics(query: AnalyticsQuery): Promise<AnalyticsResponse>
  
  // Billing
  getBillingInfo(): Promise<BillingInfo>
  createSubscription(request: CreateSubscriptionRequest): Promise<void>
  updateSubscription(request: UpdateSubscriptionRequest): Promise<void>
  downloadInvoice(invoiceId: string): Promise<Blob>
}