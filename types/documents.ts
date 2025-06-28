// Document Management TypeScript definitions
// Comprehensive type system for document processing and AI analysis

import type { SupportedLanguage, WithId, WithTimestamps, AsyncState } from './index'
import type { Translation, TranslationRequest } from './translation'

// Core Document Types
export interface Document extends WithId, WithTimestamps {
  name: string
  originalName: string
  description?: string
  type: DocumentType
  format: DocumentFormat
  size: number
  url: string
  thumbnailUrl?: string
  status: DocumentStatus
  sourceLanguage?: SupportedLanguage
  targetLanguages: SupportedLanguage[]
  content: DocumentContent
  metadata: DocumentMetadata
  processing: ProcessingInfo
  translations: DocumentTranslation[]
  analyses: DocumentAnalysis[]
  userId: string
  workspaceId?: string
  projectId?: string
  tags: string[]
  isPublic: boolean
  shareSettings: ShareSettings
  version: number
  parentId?: string
  revisions: DocumentRevision[]
}

export type DocumentType = 
  | 'text'
  | 'presentation'
  | 'spreadsheet'
  | 'image'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'webpage'
  | 'ebook'
  | 'archive'

export type DocumentFormat = 
  | 'txt' | 'rtf' | 'md'
  | 'pdf' | 'docx' | 'doc' | 'odt'
  | 'pptx' | 'ppt' | 'odp'
  | 'xlsx' | 'xls' | 'ods' | 'csv'
  | 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'svg'
  | 'mp4' | 'avi' | 'mov' | 'wmv' | 'flv'
  | 'mp3' | 'wav' | 'flac' | 'aac'
  | 'html' | 'htm' | 'xml' | 'json'
  | 'epub' | 'mobi' | 'azw'
  | 'zip' | 'rar' | '7z' | 'tar'

export type DocumentStatus = 
  | 'uploading'
  | 'processing'
  | 'extracting'
  | 'analyzing'
  | 'translating'
  | 'completed'
  | 'error'
  | 'corrupted'

export interface DocumentContent {
  extractedText: string
  structure: DocumentStructure
  elements: DocumentElement[]
  pages?: DocumentPage[]
  sections?: DocumentSection[]
  media?: MediaElement[]
}

export interface DocumentStructure {
  type: 'linear' | 'hierarchical' | 'tabular' | 'mixed'
  outline: OutlineItem[]
  navigation: NavigationInfo
  formatting: FormattingInfo
}

export interface OutlineItem {
  id: string
  title: string
  level: number
  page?: number
  position: {
    start: number
    end: number
  }
  children?: OutlineItem[]
}

export interface NavigationInfo {
  totalPages: number
  bookmarks: Array<{
    title: string
    page: number
    position: number
  }>
  hyperlinks: Array<{
    text: string
    url: string
    page: number
  }>
}

export interface FormattingInfo {
  fonts: Array<{
    name: string
    size: number
    style: string
  }>
  colors: string[]
  styles: Array<{
    type: 'bold' | 'italic' | 'underline' | 'strikethrough'
    ranges: Array<{
      start: number
      end: number
    }>
  }>
}

export interface DocumentElement {
  id: string
  type: 'text' | 'heading' | 'paragraph' | 'list' | 'table' | 'image' | 'chart' | 'footer' | 'header'
  content: string
  position: ElementPosition
  formatting?: ElementFormatting
  metadata?: Record<string, any>
}

export interface ElementPosition {
  page: number
  x: number
  y: number
  width: number
  height: number
  zIndex?: number
}

export interface ElementFormatting {
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  color?: string
  backgroundColor?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  lineHeight?: number
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface DocumentPage {
  number: number
  width: number
  height: number
  elements: string[]
  thumbnail?: string
  annotations?: PageAnnotation[]
}

export interface PageAnnotation {
  id: string
  type: 'highlight' | 'note' | 'comment' | 'correction'
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  content: string
  author: string
  createdAt: Date
}

export interface DocumentSection {
  id: string
  title: string
  level: number
  startPage: number
  endPage: number
  wordCount: number
  elements: string[]
  subsections?: DocumentSection[]
}

export interface MediaElement {
  id: string
  type: 'image' | 'video' | 'audio' | 'chart' | 'diagram'
  url: string
  caption?: string
  description?: string
  position: ElementPosition
  metadata: {
    width?: number
    height?: number
    duration?: number
    format: string
    size: number
  }
  analysis?: MediaAnalysis
}

export interface MediaAnalysis {
  description: string
  objects: Array<{
    name: string
    confidence: number
    position?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  text?: string
  sentiment?: {
    score: number
    label: 'positive' | 'negative' | 'neutral'
  }
}

export interface DocumentMetadata {
  originalSize: number
  compressedSize?: number
  pageCount: number
  wordCount: number
  characterCount: number
  language?: SupportedLanguage
  author?: string
  title?: string
  subject?: string
  keywords?: string[]
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
  security: {
    encrypted: boolean
    passwordProtected: boolean
    permissions: string[]
  }
  quality: {
    score: number
    issues: Array<{
      type: string
      severity: 'low' | 'medium' | 'high'
      description: string
    }>
  }
}

export interface ProcessingInfo {
  stages: ProcessingStage[]
  currentStage?: string
  progress: number
  estimatedCompletion?: Date
  processingTime?: number
  errors: ProcessingError[]
  warnings: ProcessingWarning[]
  resources: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
}

export interface ProcessingStage {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'
  progress: number
  startTime?: Date
  endTime?: Date
  duration?: number
  details?: Record<string, any>
}

export interface ProcessingError {
  stage: string
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
  recoverable: boolean
}

export interface ProcessingWarning {
  stage: string
  message: string
  suggestion?: string
  timestamp: Date
}

// Document Translation Types
export interface DocumentTranslation extends WithId, WithTimestamps {
  documentId: string
  targetLanguage: SupportedLanguage
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  url?: string
  segments: TranslationSegment[]
  metadata: TranslationMetadata
  quality: TranslationQuality
  options: DocumentTranslationOptions
}

export interface TranslationSegment {
  id: string
  elementId: string
  sourceText: string
  translatedText?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reviewing'
  confidence?: number
  alternatives?: string[]
  reviewer?: string
  reviewedAt?: Date
  notes?: string
}

export interface TranslationMetadata {
  engine: string
  model: string
  processingTime: number
  totalSegments: number
  completedSegments: number
  failedSegments: number
  averageConfidence: number
  cost?: number
}

export interface TranslationQuality {
  overallScore: number
  fluency: number
  accuracy: number
  consistency: number
  issues: Array<{
    segmentId: string
    type: string
    severity: 'low' | 'medium' | 'high'
    description: string
  }>
}

export interface DocumentTranslationOptions {
  preserveFormatting: boolean
  translateImages: boolean
  translateCharts: boolean
  domain?: string
  glossaryIds: string[]
  customInstructions?: string
  reviewRequired: boolean
  qualityThreshold: number
}

// Document Analysis Types
export interface DocumentAnalysis extends WithId, WithTimestamps {
  documentId: string
  type: AnalysisType
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result: AnalysisResult
  metadata: AnalysisMetadata
  options: AnalysisOptions
}

export type AnalysisType = 
  | 'summary'
  | 'sentiment'
  | 'entities'
  | 'keywords'
  | 'topics'
  | 'language_detection'
  | 'readability'
  | 'plagiarism'
  | 'quality'
  | 'structure'
  | 'compliance'

export interface AnalysisResult {
  summary?: string
  sentiment?: SentimentAnalysis
  entities?: EntityAnalysis[]
  keywords?: KeywordAnalysis[]
  topics?: TopicAnalysis[]
  language?: LanguageAnalysis
  readability?: ReadabilityAnalysis
  plagiarism?: PlagiarismAnalysis
  quality?: QualityAnalysis
  structure?: StructureAnalysis
  compliance?: ComplianceAnalysis
}

export interface SentimentAnalysis {
  overall: {
    score: number
    label: 'positive' | 'negative' | 'neutral'
    confidence: number
  }
  bySection: Array<{
    sectionId: string
    score: number
    label: 'positive' | 'negative' | 'neutral'
  }>
  emotions: Array<{
    emotion: string
    intensity: number
  }>
}

export interface EntityAnalysis {
  text: string
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'percentage' | 'misc'
  confidence: number
  positions: Array<{
    start: number
    end: number
    page?: number
  }>
  linkedData?: {
    wikipediaUrl?: string
    description?: string
  }
}

export interface KeywordAnalysis {
  keyword: string
  frequency: number
  importance: number
  category?: string
  positions: Array<{
    start: number
    end: number
    page?: number
  }>
}

export interface TopicAnalysis {
  topic: string
  probability: number
  keywords: string[]
  description?: string
}

export interface LanguageAnalysis {
  detectedLanguage: SupportedLanguage
  confidence: number
  alternatives: Array<{
    language: SupportedLanguage
    confidence: number
  }>
  dialects?: Array<{
    dialect: string
    confidence: number
  }>
}

export interface ReadabilityAnalysis {
  scores: {
    fleschKincaid: number
    fleschReadingEase: number
    gunningFog: number
    smog: number
    automated: number
  }
  level: 'elementary' | 'middle_school' | 'high_school' | 'college' | 'graduate'
  recommendations: string[]
}

export interface PlagiarismAnalysis {
  overallSimilarity: number
  sources: Array<{
    url: string
    title: string
    similarity: number
    matches: Array<{
      sourceText: string
      documentText: string
      position: {
        start: number
        end: number
      }
    }>
  }>
  riskLevel: 'low' | 'medium' | 'high'
}

export interface QualityAnalysis {
  overallScore: number
  criteria: {
    grammar: number
    spelling: number
    style: number
    clarity: number
    coherence: number
  }
  issues: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    position: {
      start: number
      end: number
      page?: number
    }
    description: string
    suggestion?: string
  }>
}

export interface StructureAnalysis {
  documentType: string
  sections: Array<{
    title: string
    level: number
    wordCount: number
    quality: number
  }>
  headingStructure: {
    consistent: boolean
    levels: number[]
    issues: string[]
  }
  tableOfContents: boolean
  bibliography: boolean
  appendices: boolean
  recommendations: string[]
}

export interface ComplianceAnalysis {
  standards: Array<{
    name: string
    compliant: boolean
    score: number
    violations: Array<{
      rule: string
      severity: 'low' | 'medium' | 'high'
      description: string
      suggestions: string[]
    }>
  }>
  overallCompliance: number
  riskAssessment: 'low' | 'medium' | 'high'
}

export interface AnalysisMetadata {
  engine: string
  model: string
  processingTime: number
  cost?: number
  accuracy?: number
}

export interface AnalysisOptions {
  includeDetails: boolean
  language?: SupportedLanguage
  customRules?: string[]
  confidenceThreshold?: number
}

// Document Request/Response Types
export interface DocumentUploadRequest {
  file: File
  options?: {
    targetLanguages?: SupportedLanguage[]
    autoProcess?: boolean
    preserveFormatting?: boolean
    extractText?: boolean
    performAnalysis?: AnalysisType[]
    tags?: string[]
    isPublic?: boolean
  }
}

export interface DocumentUploadResponse {
  document: Document
  uploadUrl?: string
  processingJobId?: string
}

export interface DocumentBatchRequest {
  files: File[]
  options?: {
    targetLanguages?: SupportedLanguage[]
    autoProcess?: boolean
    preserveFormatting?: boolean
    extractText?: boolean
    performAnalysis?: AnalysisType[]
    tags?: string[]
    isPublic?: boolean
    priority?: 'low' | 'normal' | 'high'
  }
}

export interface DocumentSearchQuery {
  query?: string
  type?: DocumentType[]
  format?: DocumentFormat[]
  status?: DocumentStatus[]
  language?: SupportedLanguage[]
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  sizeRange?: {
    min: number
    max: number
  }
  userId?: string
  workspaceId?: string
  isPublic?: boolean
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'name' | 'size' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

// Share and Collaboration Types
export interface ShareSettings {
  isPublic: boolean
  allowDownload: boolean
  allowCopy: boolean
  allowPrint: boolean
  expiresAt?: Date
  password?: string
  permissions: SharePermission[]
}

export interface SharePermission {
  userId?: string
  email?: string
  role: 'viewer' | 'editor' | 'commenter'
  grantedAt: Date
  grantedBy: string
}

export interface DocumentRevision extends WithId, WithTimestamps {
  documentId: string
  version: number
  changes: RevisionChange[]
  author: string
  comment?: string
  size: number
  url: string
}

export interface RevisionChange {
  type: 'add' | 'remove' | 'modify'
  elementId: string
  oldValue?: any
  newValue?: any
  position?: ElementPosition
}

// Context and Hook Types
export interface DocumentContextValue {
  documents: Document[]
  currentDocument: Document | null
  uploadProgress: Record<string, number>
  actions: {
    uploadDocument: (request: DocumentUploadRequest) => Promise<Document>
    uploadBatch: (request: DocumentBatchRequest) => Promise<Document[]>
    getDocument: (id: string) => Promise<Document>
    updateDocument: (id: string, updates: Partial<Document>) => Promise<Document>
    deleteDocument: (id: string) => Promise<void>
    translateDocument: (id: string, options: DocumentTranslationOptions) => Promise<DocumentTranslation>
    analyzeDocument: (id: string, type: AnalysisType, options?: AnalysisOptions) => Promise<DocumentAnalysis>
    searchDocuments: (query: DocumentSearchQuery) => Promise<Document[]>
    shareDocument: (id: string, settings: ShareSettings) => Promise<void>
  }
}

export interface UseDocuments {
  documents: AsyncState<Document[]>
  uploadDocument: (request: DocumentUploadRequest) => Promise<Document>
  uploadBatch: (request: DocumentBatchRequest) => Promise<Document[]>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document>
  deleteDocument: (id: string) => Promise<void>
  searchDocuments: (query: DocumentSearchQuery) => Promise<Document[]>
}

export interface UseDocumentProcessing {
  translateDocument: (id: string, options: DocumentTranslationOptions) => Promise<DocumentTranslation>
  analyzeDocument: (id: string, type: AnalysisType, options?: AnalysisOptions) => Promise<DocumentAnalysis>
  getProcessingStatus: (id: string) => Promise<ProcessingInfo>
  cancelProcessing: (id: string) => Promise<void>
  isProcessing: boolean
  error: Error | null
}