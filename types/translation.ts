// Translation System TypeScript definitions
// Comprehensive type system for translation functionality

import type { SupportedLanguage, WithId, WithTimestamps } from './index'

// Core Translation Types
export interface Translation extends WithId, WithTimestamps {
  sourceText: string
  translatedText: string
  sourceLanguage: SupportedLanguage
  targetLanguage: SupportedLanguage
  context?: string
  domain?: TranslationDomain
  confidence: number
  status: TranslationStatus
  alternatives?: string[]
  metadata: TranslationMetadata
  userId?: string
  workspaceId?: string
  documentId?: string
  version: number
  parentId?: string
  isPublic: boolean
  tags: string[]
  notes?: string
}

export type TranslationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'reviewed'
  | 'approved'
  | 'rejected'

export type TranslationDomain =
  | 'general'
  | 'technical'
  | 'medical'
  | 'legal'
  | 'business'
  | 'academic'
  | 'literary'
  | 'marketing'
  | 'scientific'
  | 'financial'

export interface TranslationMetadata {
  model: string
  engine: 'gpt-4' | 'claude-3' | 'gemini-pro' | 'custom'
  processingTime: number
  charactersCount: number
  wordsCount: number
  cost?: number
  quality: {
    fluency: number
    accuracy: number
    coherence: number
  }
  flags: TranslationFlag[]
  revisions: TranslationRevision[]
}

export type TranslationFlag =
  | 'potential_error'
  | 'low_confidence'
  | 'context_missing'
  | 'cultural_adaptation'
  | 'technical_term'
  | 'review_required'

export interface TranslationRevision {
  id: string
  userId: string
  userName: string
  action: 'edit' | 'approve' | 'reject' | 'comment'
  changes?: {
    originalText: string
    revisedText: string
    reason: string
  }
  comment?: string
  timestamp: Date
}

// Translation Request Types
export interface TranslationRequest {
  text: string
  sourceLanguage: SupportedLanguage | 'auto'
  targetLanguage: SupportedLanguage
  context?: string
  domain?: TranslationDomain
  options?: TranslationOptions
}

export interface TranslationOptions {
  preserveFormatting?: boolean
  includeAlternatives?: boolean
  maxAlternatives?: number
  qualityLevel?: 'fast' | 'balanced' | 'accurate'
  formality?: 'informal' | 'formal' | 'auto'
  glossaryId?: string
  customPrompt?: string
  preventHallucination?: boolean
  culturalAdaptation?: boolean
}

export interface BatchTranslationRequest {
  items: Array<{
    id: string
    text: string
    sourceLanguage: SupportedLanguage | 'auto'
    targetLanguage: SupportedLanguage
    context?: string
    domain?: TranslationDomain
  }>
  options?: TranslationOptions
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  callbackUrl?: string
}

// Translation Response Types
export interface TranslationResponse {
  id: string
  translatedText: string
  detectedLanguage?: SupportedLanguage
  confidence: number
  alternatives?: string[]
  metadata: TranslationMetadata
  usage: {
    charactersUsed: number
    charactersRemaining: number
    costEstimate?: number
  }
  warnings?: TranslationWarning[]
}

export interface TranslationWarning {
  type:
    | 'low_confidence'
    | 'context_missing'
    | 'potential_error'
    | 'cultural_note'
  message: string
  severity: 'low' | 'medium' | 'high'
  suggestion?: string
}

export interface BatchTranslationResponse {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  results: Array<{
    id: string
    status: TranslationStatus
    translatedText?: string
    confidence?: number
    error?: string
  }>
  progress: {
    total: number
    completed: number
    failed: number
    percentage: number
  }
  metadata: {
    estimatedCompletion?: Date
    processingTime?: number
    totalCost?: number
  }
}

// Language Detection Types
export interface LanguageDetectionRequest {
  text: string
  candidateLanguages?: SupportedLanguage[]
}

export interface LanguageDetectionResponse {
  detectedLanguage: SupportedLanguage
  confidence: number
  alternatives: Array<{
    language: SupportedLanguage
    confidence: number
  }>
}

// Glossary and Terminology Types
export interface Glossary extends WithId, WithTimestamps {
  name: string
  description?: string
  sourceLanguage: SupportedLanguage
  targetLanguage: SupportedLanguage
  domain?: TranslationDomain
  entries: GlossaryEntry[]
  isPublic: boolean
  userId: string
  workspaceId?: string
  tags: string[]
  statistics: {
    totalEntries: number
    lastModified: Date
    usageCount: number
  }
}

export interface GlossaryEntry {
  id: string
  sourceTerm: string
  targetTerm: string
  context?: string
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase'
  definition?: string
  examples?: Array<{
    source: string
    target: string
  }>
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateGlossaryRequest {
  name: string
  description?: string
  sourceLanguage: SupportedLanguage
  targetLanguage: SupportedLanguage
  domain?: TranslationDomain
  entries?: Omit<GlossaryEntry, 'id' | 'createdAt' | 'updatedAt'>[]
  isPublic?: boolean
  tags?: string[]
}

// Translation Memory Types
export interface TranslationMemory extends WithId, WithTimestamps {
  name: string
  description?: string
  sourceLanguage: SupportedLanguage
  targetLanguage: SupportedLanguage
  domain?: TranslationDomain
  segments: TranslationMemorySegment[]
  isPublic: boolean
  userId: string
  workspaceId?: string
  statistics: {
    totalSegments: number
    totalWords: number
    lastModified: Date
    quality: number
  }
}

export interface TranslationMemorySegment {
  id: string
  sourceText: string
  targetText: string
  context?: string
  metadata: {
    confidence: number
    lastUsed: Date
    usageCount: number
    quality: number
  }
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface TranslationMemoryMatch {
  segment: TranslationMemorySegment
  similarity: number
  matchType: 'exact' | 'fuzzy' | 'context'
  edits?: Array<{
    type: 'insert' | 'delete' | 'replace'
    position: number
    text: string
  }>
}

// Quality Assessment Types
export interface QualityAssessment {
  id: string
  translationId: string
  assessorId: string
  assessorName: string
  overallScore: number
  criteria: {
    fluency: number
    accuracy: number
    terminology: number
    style: number
    coherence: number
  }
  issues: QualityIssue[]
  feedback: string
  recommendation: 'approve' | 'reject' | 'revise'
  createdAt: Date
}

export interface QualityIssue {
  type:
    | 'grammar'
    | 'spelling'
    | 'terminology'
    | 'style'
    | 'accuracy'
    | 'coherence'
  severity: 'minor' | 'major' | 'critical'
  position: {
    start: number
    end: number
  }
  description: string
  suggestion?: string
}

// Translation Project Types
export interface TranslationProject extends WithId, WithTimestamps {
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  sourceLanguage: SupportedLanguage
  targetLanguages: SupportedLanguage[]
  deadline?: Date
  budget?: {
    amount: number
    currency: string
  }
  settings: ProjectSettings
  statistics: ProjectStatistics
  team: ProjectMember[]
  documents: string[]
  userId: string
  workspaceId?: string
}

export interface ProjectSettings {
  domain?: TranslationDomain
  qualityLevel: 'fast' | 'balanced' | 'accurate'
  reviewRequired: boolean
  autoTranslation: boolean
  glossaryIds: string[]
  translationMemoryIds: string[]
  customInstructions?: string
  notifications: {
    onProgress: boolean
    onCompletion: boolean
    onIssues: boolean
  }
}

export interface ProjectStatistics {
  progress: {
    total: number
    completed: number
    inProgress: number
    pending: number
    percentage: number
  }
  quality: {
    averageScore: number
    issuesCount: number
    approvalsCount: number
  }
  timeline: {
    estimatedCompletion: Date
    actualProgress: number
    daysRemaining: number
  }
  cost: {
    estimated: number
    actual: number
    currency: string
  }
}

export interface ProjectMember {
  userId: string
  userName: string
  role: 'manager' | 'translator' | 'reviewer' | 'proofreader'
  languages: SupportedLanguage[]
  assignedTasks: number
  completedTasks: number
  joinedAt: Date
}

// Translation Analytics Types
export interface TranslationAnalytics {
  period: {
    start: Date
    end: Date
  }
  volume: {
    totalTranslations: number
    totalCharacters: number
    totalWords: number
    byLanguage: Record<string, number>
    byDomain: Record<string, number>
  }
  performance: {
    averageProcessingTime: number
    averageConfidence: number
    successRate: number
    errorRate: number
  }
  quality: {
    averageScore: number
    distributionByScore: Record<string, number>
    commonIssues: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
  usage: {
    activeUsers: number
    topUsers: Array<{
      userId: string
      userName: string
      translationsCount: number
    }>
    apiCalls: number
    costAnalysis: {
      total: number
      average: number
      currency: string
    }
  }
  trends: {
    volumeTrend: Array<{
      date: Date
      value: number
    }>
    qualityTrend: Array<{
      date: Date
      value: number
    }>
  }
}

// Context Hooks and Providers
export interface TranslationContextValue {
  currentTranslation: Translation | null
  recentTranslations: Translation[]
  preferences: TranslationPreferences
  actions: {
    translate: (request: TranslationRequest) => Promise<TranslationResponse>
    batchTranslate: (
      request: BatchTranslationRequest
    ) => Promise<BatchTranslationResponse>
    saveTranslation: (translation: Partial<Translation>) => Promise<Translation>
    deleteTranslation: (id: string) => Promise<void>
    updatePreferences: (
      preferences: Partial<TranslationPreferences>
    ) => Promise<void>
    detectLanguage: (text: string) => Promise<LanguageDetectionResponse>
    searchTranslations: (
      query: TranslationSearchQuery
    ) => Promise<Translation[]>
  }
}

export interface TranslationPreferences {
  defaultSourceLanguage: SupportedLanguage
  defaultTargetLanguage: SupportedLanguage
  preferredDomain: TranslationDomain
  qualityLevel: 'fast' | 'balanced' | 'accurate'
  autoSave: boolean
  showAlternatives: boolean
  enableGlossary: boolean
  enableTranslationMemory: boolean
  formality: 'informal' | 'formal' | 'auto'
}

export interface TranslationSearchQuery {
  query?: string
  sourceLanguage?: SupportedLanguage
  targetLanguage?: SupportedLanguage
  domain?: TranslationDomain
  status?: TranslationStatus
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
  minConfidence?: number
  userId?: string
  workspaceId?: string
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'confidence' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

// Custom Hooks Return Types
export interface UseTranslation {
  translate: (request: TranslationRequest) => Promise<TranslationResponse>
  isTranslating: boolean
  error: Error | null
  recentTranslations: Translation[]
  clearHistory: () => void
}

export interface UseLanguageDetection {
  detectLanguage: (text: string) => Promise<LanguageDetectionResponse>
  isDetecting: boolean
  error: Error | null
  lastDetection: LanguageDetectionResponse | null
}

export interface UseGlossary {
  glossaries: Glossary[]
  createGlossary: (request: CreateGlossaryRequest) => Promise<Glossary>
  updateGlossary: (id: string, updates: Partial<Glossary>) => Promise<Glossary>
  deleteGlossary: (id: string) => Promise<void>
  searchTerms: (query: string, glossaryId?: string) => Promise<GlossaryEntry[]>
  isLoading: boolean
  error: Error | null
}

export interface UseTranslationMemory {
  memories: TranslationMemory[]
  findMatches: (
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ) => Promise<TranslationMemoryMatch[]>
  addSegment: (
    memoryId: string,
    segment: Omit<TranslationMemorySegment, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
  isLoading: boolean
  error: Error | null
}
