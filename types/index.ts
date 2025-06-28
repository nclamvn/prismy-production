// Core TypeScript definitions for Prismy Application
// Phase 3.2: Comprehensive type system for production readiness

export * from './api'
export * from './auth'
export * from './workspace'
export * from './translation'
export * from './documents'
export * from './intelligence'
export * from './ui'
export * from './analytics'
export * from './utilities'

// Global application types
export interface PrismyConfig {
  version: string
  environment: 'development' | 'staging' | 'production'
  features: FeatureFlags
  api: {
    baseUrl: string
    timeout: number
    retryAttempts: number
  }
  analytics: {
    enabled: boolean
    trackingId?: string
  }
  performance: {
    enableMonitoring: boolean
    budgets: PerformanceBudgets
  }
}

export interface FeatureFlags {
  aiAgents: boolean
  batchProcessing: boolean
  realTimeCollaboration: boolean
  advancedAnalytics: boolean
  enterpriseFeatures: boolean
  experimentalUI: boolean
}

export interface PerformanceBudgets {
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  totalBlockingTime: number
}

// Language and localization
export type SupportedLanguage = 'en' | 'vi' | 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru'

export interface LocalizationContent {
  [key: string]: string | LocalizationContent
}

export interface LocalizedContent {
  [K in SupportedLanguage]: LocalizationContent
}

// Common utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type WithId<T> = T & { id: string }

export type WithTimestamps<T> = T & {
  createdAt: Date
  updatedAt: Date
}

export type WithMetadata<T> = T & {
  metadata?: Record<string, any>
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: {
    timestamp: string
    requestId: string
    version: string
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  stack?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Loading and async states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T = any, E = ApiError> {
  data: T | null
  loading: boolean
  error: E | null
  lastUpdated?: Date
}

// Theme and styling
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  error: string
  warning: string
  success: string
  info: string
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  style?: React.CSSProperties
  'data-testid'?: string
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

// Form and validation types
export interface FormField<T = any> {
  value: T
  error?: string
  touched: boolean
  required?: boolean
}

export interface FormState<T extends Record<string, any>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  isSubmitting: boolean
}

export type ValidationRule<T = any> = {
  message: string
  validator: (value: T) => boolean
}

// Event types
export interface AppEvent<T = any> {
  type: string
  payload: T
  timestamp: Date
  source?: string
}

export type EventHandler<T = any> = (event: AppEvent<T>) => void

// Error types
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  severity: ErrorSeverity
  context?: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId?: string
}

// File and upload types
export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  lastModified: Date
  url?: string
}

export interface UploadProgress {
  fileId: string
  loaded: number
  total: number
  percentage: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
}

// Search and filtering
export interface SearchFilters {
  query?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult<T> {
  item: T
  score: number
  highlights?: Record<string, string[]>
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  actions?: NotificationAction[]
  timestamp: Date
}

export interface NotificationAction {
  label: string
  action: () => void
  primary?: boolean
}

// Permission and access control
export type Permission = string

export interface Role {
  id: string
  name: string
  permissions: Permission[]
  description?: string
}

export interface AccessControl {
  roles: Role[]
  permissions: Permission[]
}

// Settings and preferences
export interface UserPreferences {
  language: SupportedLanguage
  theme: ThemeMode
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
  accessibility: {
    reducedMotion: boolean
    highContrast: boolean
    largeText: boolean
  }
  workspace: {
    defaultView: string
    autoSave: boolean
    collaborationMode: boolean
  }
}

// Analytics and tracking
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId: string
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  context?: Record<string, any>
}

// Integration types
export interface Integration {
  id: string
  name: string
  type: string
  enabled: boolean
  config: Record<string, any>
  lastSync?: Date
}

// Subscription and billing
export interface Subscription {
  id: string
  planId: string
  status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

export interface UsageMetrics {
  period: {
    start: Date
    end: Date
  }
  metrics: {
    [key: string]: {
      used: number
      limit: number
      unit: string
    }
  }
}