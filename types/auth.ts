// Authentication and Authorization TypeScript definitions
// Comprehensive type system for user management and security

import type { SupportedLanguage, WithTimestamps } from './index'

// Core Authentication Types
export interface User extends WithTimestamps {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  language: SupportedLanguage
  timezone: string
  emailVerified: boolean
  phoneNumber?: string
  phoneVerified: boolean
  twoFactorEnabled: boolean
  lastLoginAt?: Date
  lastActiveAt?: Date
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  roles: Role[]
  permissions: Permission[]
  preferences: UserPreferences
  subscription?: UserSubscription
  metadata?: Record<string, any>
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
}

export interface UserPreferences {
  language: SupportedLanguage
  timezone: string
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
    digest: 'daily' | 'weekly' | 'monthly' | 'never'
  }
  accessibility: {
    reducedMotion: boolean
    highContrast: boolean
    largeText: boolean
    screenReader: boolean
  }
  workspace: {
    defaultView: string
    autoSave: boolean
    showTutorials: boolean
    compactMode: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'team'
    showOnlineStatus: boolean
    allowMessageRequests: boolean
  }
}

export interface UserSubscription {
  id: string
  planId: string
  planName: string
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  usage: {
    charactersUsed: number
    charactersLimit: number
    documentsUsed: number
    documentsLimit: number
    apiCallsUsed: number
    apiCallsLimit: number
  }
}

// Authentication State Types
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: AuthError | null
  session: Session | null
  tokens: AuthTokens | null
}

export interface Session {
  id: string
  userId: string
  deviceId: string
  deviceName: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  ipAddress: string
  userAgent: string
  location?: {
    country: string
    city: string
    region: string
  }
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
  isActive: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
  expiresAt: Date
  scope?: string[]
}

export interface AuthError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
}

// Role and Permission Types
export interface Role {
  id: string
  name: string
  displayName: string
  description?: string
  permissions: Permission[]
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  conditions?: PermissionCondition[]
  description?: string
}

export interface PermissionCondition {
  field: string
  operator:
    | 'equals'
    | 'not_equals'
    | 'in'
    | 'not_in'
    | 'contains'
    | 'starts_with'
    | 'ends_with'
  value: any
}

// Authentication Request/Response Types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
  deviceInfo?: {
    name: string
    type: string
    userAgent: string
  }
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
  session: Session
  requiresTwoFactor?: boolean
  twoFactorChallenge?: {
    challengeId: string
    methods: TwoFactorMethod[]
  }
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  language?: SupportedLanguage
  timezone?: string
  acceptTerms: boolean
  acceptMarketing?: boolean
  inviteCode?: string
}

export interface RegisterResponse {
  user: User
  tokens?: AuthTokens
  session?: Session
  requiresVerification: boolean
  verificationMethod: 'email' | 'phone'
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
  type: 'email' | 'phone'
}

// Two-Factor Authentication Types
export interface TwoFactorMethod {
  id: string
  type: 'authenticator' | 'sms' | 'email' | 'backup_codes'
  name: string
  enabled: boolean
  verified: boolean
  createdAt: Date
  lastUsedAt?: Date
}

export interface TwoFactorSetupRequest {
  type: 'authenticator' | 'sms'
  phoneNumber?: string
}

export interface TwoFactorSetupResponse {
  secret?: string
  qrCode?: string
  backupCodes?: string[]
  challengeId: string
}

export interface TwoFactorVerifyRequest {
  challengeId: string
  code: string
  method: 'authenticator' | 'sms' | 'email' | 'backup_code'
}

export interface TwoFactorChallengeRequest {
  challengeId: string
  code: string
}

// OAuth and Social Authentication Types
export interface OAuthProvider {
  id: string
  name: string
  type: 'google' | 'github' | 'microsoft' | 'apple' | 'facebook'
  enabled: boolean
  clientId: string
  scopes: string[]
  redirectUri: string
}

export interface OAuthConnection {
  id: string
  provider: string
  providerUserId: string
  email: string
  name: string
  avatar?: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  createdAt: Date
  lastUsedAt?: Date
}

export interface SocialAuthRequest {
  provider: string
  code: string
  state?: string
  redirectUri: string
}

// API Key and Token Management Types
export interface ApiKey {
  id: string
  name: string
  description?: string
  key: string
  permissions: string[]
  rateLimit?: {
    requests: number
    window: number
  }
  allowedOrigins?: string[]
  allowedIPs?: string[]
  isActive: boolean
  lastUsedAt?: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateApiKeyRequest {
  name: string
  description?: string
  permissions: string[]
  expiresIn?: number
  rateLimit?: {
    requests: number
    window: number
  }
  allowedOrigins?: string[]
  allowedIPs?: string[]
}

export interface PersonalAccessToken {
  id: string
  name: string
  description?: string
  token: string
  scopes: string[]
  lastUsedAt?: Date
  expiresAt?: Date
  createdAt: Date
}

// Security and Audit Types
export interface SecurityEvent {
  id: string
  userId: string
  type:
    | 'login'
    | 'logout'
    | 'password_change'
    | 'email_change'
    | 'two_factor_enabled'
    | 'two_factor_disabled'
    | 'suspicious_activity'
  description: string
  ipAddress: string
  userAgent: string
  location?: {
    country: string
    city: string
    region: string
  }
  metadata?: Record<string, any>
  timestamp: Date
}

export interface LoginAttempt {
  id: string
  email: string
  success: boolean
  reason?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
    preventReuse: number
    maxAge: number
  }
  sessionSettings: {
    maxDuration: number
    inactivityTimeout: number
    allowMultipleSessions: boolean
    requireReauth: boolean
  }
  twoFactorSettings: {
    required: boolean
    methods: string[]
    backupCodesCount: number
  }
  rateLimiting: {
    loginAttempts: {
      max: number
      window: number
      lockoutDuration: number
    }
    apiRequests: {
      max: number
      window: number
    }
  }
}

// Context and Hook Types
export interface AuthContextValue {
  state: AuthState
  actions: {
    login: (credentials: LoginRequest) => Promise<LoginResponse>
    register: (data: RegisterRequest) => Promise<RegisterResponse>
    logout: () => Promise<void>
    refreshToken: () => Promise<AuthTokens>
    forgotPassword: (email: string) => Promise<void>
    resetPassword: (data: ResetPasswordRequest) => Promise<void>
    changePassword: (data: ChangePasswordRequest) => Promise<void>
    verifyEmail: (token: string) => Promise<void>
    resendVerification: (data: ResendVerificationRequest) => Promise<void>
    updateProfile: (data: Partial<UserProfile>) => Promise<User>
    updatePreferences: (preferences: Partial<UserPreferences>) => Promise<User>
    enableTwoFactor: (
      data: TwoFactorSetupRequest
    ) => Promise<TwoFactorSetupResponse>
    verifyTwoFactor: (data: TwoFactorVerifyRequest) => Promise<void>
    disableTwoFactor: (code: string) => Promise<void>
    createApiKey: (data: CreateApiKeyRequest) => Promise<ApiKey>
    revokeApiKey: (id: string) => Promise<void>
    getSessions: () => Promise<Session[]>
    revokeSession: (id: string) => Promise<void>
    getSecurityEvents: () => Promise<SecurityEvent[]>
  }
}

export interface UseAuth {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
  login: (credentials: LoginRequest) => Promise<LoginResponse>
  register: (data: RegisterRequest) => Promise<RegisterResponse>
  logout: () => Promise<void>
  refreshToken: () => Promise<AuthTokens>
  updateProfile: (data: Partial<UserProfile>) => Promise<User>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<User>
}

export interface UsePermissions {
  hasPermission: (permission: string, resource?: string) => boolean
  hasRole: (role: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  can: (action: string, resource: string) => boolean
  cannot: (action: string, resource: string) => boolean
}

// Guard and Protection Types
export interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requirePermissions?: string[]
  requireRoles?: string[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export interface ProtectedRouteProps extends RouteGuardProps {
  path: string
  component: React.ComponentType<any>
}

// Validation Types
export interface AuthValidationRules {
  email: {
    required: boolean
    pattern: RegExp
    message: string
  }
  password: {
    required: boolean
    minLength: number
    pattern?: RegExp
    message: string
  }
  firstName: {
    required: boolean
    minLength: number
    maxLength: number
    pattern?: RegExp
    message: string
  }
  lastName: {
    required: boolean
    minLength: number
    maxLength: number
    pattern?: RegExp
    message: string
  }
}

// Error Codes
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_DISABLED = 'USER_DISABLED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_TWO_FACTOR_CODE = 'INVALID_TWO_FACTOR_CODE',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  DEVICE_NOT_TRUSTED = 'DEVICE_NOT_TRUSTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}
