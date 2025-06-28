'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useSSRSafeLanguage } from './SSRSafeLanguageContext'

// Import comprehensive type definitions
import type {
  WorkspaceIntelligenceState,
  WorkspaceIntelligenceContextValue,
  WorkspaceMode,
  Activity,
  AIOperation,
  SmartSuggestion,
  WorkspaceContext,
  UserPattern,
  WorkspaceInsight,
  OperationInput,
  OperationOutput,
  OperationError
} from '../types/workspace'
import type { User } from '../types/auth'
import type { SupportedLanguage } from '../types'

// Enhanced type definitions for strict typing
type ActivityType = Activity['type']
type AIOperationStatus = AIOperation['status']
type SuggestionType = SmartSuggestion['type']
type ConnectionStatus = WorkspaceIntelligenceState['connectionStatus']

// Strict action type definitions
type WorkspaceIntelligenceAction = 
  | { type: 'SET_MODE'; payload: WorkspaceMode }
  | { type: 'ADD_ACTIVITY'; payload: Omit<Activity, 'id' | 'timestamp'> }
  | { type: 'START_AI_OPERATION'; payload: Omit<AIOperation, 'id' | 'createdAt' | 'progress'> }
  | { type: 'UPDATE_AI_OPERATION'; payload: { id: string; updates: Partial<AIOperation> } }
  | { type: 'COMPLETE_AI_OPERATION'; payload: { id: string; output: OperationOutput } }
  | { type: 'FAIL_AI_OPERATION'; payload: { id: string; error: OperationError } }
  | { type: 'ADD_SUGGESTION'; payload: Omit<SmartSuggestion, 'id' | 'createdAt'> }
  | { type: 'REMOVE_SUGGESTION'; payload: string }
  | { type: 'APPLY_SUGGESTION'; payload: string }
  | { type: 'DISMISS_SUGGESTION'; payload: string }
  | { type: 'ADD_INSIGHT'; payload: Omit<WorkspaceInsight, 'id' | 'createdAt'> }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<WorkspaceContext> }
  | { type: 'UPDATE_PATTERNS'; payload: Partial<UserPattern> }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SYNC_COMPLETE'; payload: { timestamp: Date } }
  | { type: 'CLEAR_COMPLETED_OPERATIONS' }
  | { type: 'RESET_STATE' }

// ============================================================================
// CONTEXT DEFINITION WITH STRICT TYPING
// ============================================================================

// Use the comprehensive interface from types
type WorkspaceIntelligenceContextType = WorkspaceIntelligenceContextValue & {
  // Context management
  updateContext: (updates: Partial<WorkspaceContext>) => void
  getCurrentContext: () => WorkspaceContext
  
  // Analytics & patterns
  getUserPatterns: () => UserPattern
  generateInsights: () => void
  getWorkflowEfficiency: () => number
  
  // Real-time features
  syncWorkspace: () => Promise<void>
  getConnectionStatus: () => 'connected' | 'disconnected' | 'reconnecting'
}

// ============================================================================
// REDUCER
// ============================================================================

function workspaceIntelligenceReducer(
  state: WorkspaceIntelligenceState,
  action: WorkspaceIntelligenceAction
): WorkspaceIntelligenceState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        previousMode: state.currentMode,
        currentMode: action.payload,
        context: {
          ...state.context,
          currentMode: action.payload
        }
      }
      
    case 'ADD_ACTIVITY':
      const newActivity: Activity = {
        ...action.payload,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      }
      
      return {
        ...state,
        activities: [newActivity, ...state.activities].slice(0, 100), // Keep last 100 activities
        context: {
          ...state.context,
          lastActivity: newActivity
        }
      }
      
    case 'START_AI_OPERATION':
      const operation: AIOperation = {
        ...action.payload,
        id: `operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        status: 'processing',
        progress: 0
      }
      
      return {
        ...state,
        activeOperations: [...state.activeOperations, operation],
        isProcessing: true
      }
      
    case 'UPDATE_AI_OPERATION':
      const updatedActiveOps = state.activeOperations.map(op =>
        op.id === action.payload.id ? { ...op, ...action.payload.updates } : op
      )
      
      // Move completed operations to completed array
      const completedOp = updatedActiveOps.find(op => 
        op.id === action.payload.id && 
        (op.status === 'completed' || op.status === 'error')
      )
      
      let newActiveOps = updatedActiveOps
      let newCompletedOps = state.completedOperations
      
      if (completedOp) {
        newActiveOps = updatedActiveOps.filter(op => op.id !== action.payload.id)
        newCompletedOps = [completedOp, ...state.completedOperations].slice(0, 50) // Keep last 50
      }
      
      return {
        ...state,
        activeOperations: newActiveOps,
        completedOperations: newCompletedOps,
        isProcessing: newActiveOps.length > 0
      }
      
    case 'ADD_SUGGESTION':
      const suggestion: SmartSuggestion = {
        ...action.payload,
        id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      return {
        ...state,
        suggestions: [suggestion, ...state.suggestions]
      }
      
    case 'REMOVE_SUGGESTION':
      return {
        ...state,
        suggestions: state.suggestions.filter(s => s.id !== action.payload)
      }
      
    case 'UPDATE_CONTEXT':
      return {
        ...state,
        context: { ...state.context, ...action.payload }
      }
      
    case 'UPDATE_PATTERNS':
      return {
        ...state,
        patterns: { ...state.patterns, ...action.payload }
      }
      
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload
      }
      
    case 'SYNC_COMPLETE':
      return {
        ...state,
        lastSync: action.payload.timestamp
      }
      
    default:
      return state
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: WorkspaceIntelligenceState = {
  currentMode: 'translation',
  context: {
    currentMode: 'translation',
    activeDocuments: [],
    recentTranslations: []
  },
  activities: [],
  patterns: {
    preferredModes: ['translation'],
    commonWorkflows: [],
    usageTime: {},
    featureUsage: {},
    lastAnalysis: new Date()
  },
  activeOperations: [],
  completedOperations: [],
  suggestions: [],
  insights: [],
  isProcessing: false,
  lastSync: new Date(),
  connectionStatus: 'connected'
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const WorkspaceIntelligenceContext = createContext<WorkspaceIntelligenceContextType | undefined>(undefined)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface WorkspaceIntelligenceProviderProps {
  children: ReactNode
}

export function WorkspaceIntelligenceProvider({ children }: WorkspaceIntelligenceProviderProps) {
  const [state, dispatch] = useReducer(workspaceIntelligenceReducer, initialState)
  const { user } = useAuth()
  const { language } = useSSRSafeLanguage()

  // ========================================================================
  // MODE MANAGEMENT
  // ========================================================================
  
  const setMode = useCallback((mode: WorkspaceMode) => {
    dispatch({ type: 'SET_MODE', payload: mode })
    
    // Track mode change activity
    trackActivity({
      type: 'navigation',
      mode,
      data: { previousMode: state.currentMode, newMode: mode },
      success: true
    })
  }, [state.currentMode])
  
  const getPreviousMode = useCallback(() => {
    return state.previousMode
  }, [state.previousMode])

  // ========================================================================
  // ACTIVITY TRACKING
  // ========================================================================
  
  const trackActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: activity })
    
    // Update user patterns based on activity
    const newUsageTime = { ...state.patterns.usageTime }
    const modeKey = activity.mode
    newUsageTime[modeKey] = (newUsageTime[modeKey] || 0) + (activity.duration || 1)
    
    const newFeatureUsage = { ...state.patterns.featureUsage }
    const featureKey = activity.type
    newFeatureUsage[featureKey] = (newFeatureUsage[featureKey] || 0) + 1
    
    dispatch({ 
      type: 'UPDATE_PATTERNS', 
      payload: { 
        usageTime: newUsageTime,
        featureUsage: newFeatureUsage
      }
    })
  }, [state.patterns])
  
  const getRecentActivities = useCallback((limit = 10) => {
    return state.activities.slice(0, limit)
  }, [state.activities])
  
  const getActivitiesByType = useCallback((type: ActivityType) => {
    return state.activities.filter(activity => activity.type === type)
  }, [state.activities])

  // ========================================================================
  // AI OPERATIONS
  // ========================================================================
  
  const startAIOperation = useCallback((operation: Omit<AIOperation, 'id' | 'startTime' | 'status' | 'progress'>) => {
    dispatch({ type: 'START_AI_OPERATION', payload: operation })
    
    // Track AI operation start
    trackActivity({
      type: 'ai_interaction',
      mode: state.currentMode,
      data: { operationType: operation.type, input: operation.input },
      success: true
    })
    
    return `operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [state.currentMode, trackActivity])
  
  const updateAIOperation = useCallback((id: string, updates: Partial<AIOperation>) => {
    dispatch({ type: 'UPDATE_AI_OPERATION', payload: { id, updates } })
  }, [])
  
  const getActiveOperations = useCallback(() => {
    return state.activeOperations
  }, [state.activeOperations])

  // ========================================================================
  // SMART SUGGESTIONS
  // ========================================================================
  
  const addSuggestion = useCallback((suggestion: Omit<SmartSuggestion, 'id'>) => {
    dispatch({ type: 'ADD_SUGGESTION', payload: suggestion })
  }, [])
  
  const removeSuggestion = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_SUGGESTION', payload: id })
  }, [])
  
  const getSuggestionsByPriority = useCallback((priority?: 'low' | 'medium' | 'high') => {
    if (!priority) return state.suggestions
    return state.suggestions.filter(s => s.priority === priority)
  }, [state.suggestions])

  // ========================================================================
  // CONTEXT MANAGEMENT
  // ========================================================================
  
  const updateContext = useCallback((updates: Partial<WorkspaceContext>) => {
    dispatch({ type: 'UPDATE_CONTEXT', payload: updates })
  }, [])
  
  const getCurrentContext = useCallback(() => {
    return state.context
  }, [state.context])

  // ========================================================================
  // ANALYTICS & PATTERNS
  // ========================================================================
  
  const getUserPatterns = useCallback(() => {
    return state.patterns
  }, [state.patterns])
  
  const generateInsights = useCallback(() => {
    // Generate insights based on user patterns and activities
    // This would typically call an AI service or analytics engine
    console.log('Generating insights based on user patterns:', state.patterns)
  }, [state.patterns])
  
  const getWorkflowEfficiency = useCallback(() => {
    // Calculate workflow efficiency based on activities and patterns
    const totalActivities = state.activities.length
    const successfulActivities = state.activities.filter(a => a.success).length
    return totalActivities > 0 ? (successfulActivities / totalActivities) * 100 : 0
  }, [state.activities])

  // ========================================================================
  // REAL-TIME FEATURES
  // ========================================================================
  
  const syncWorkspace = useCallback(async () => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' })
    
    try {
      // Sync workspace state with server
      // This would typically send current state to server and receive updates
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' })
      dispatch({ type: 'SYNC_COMPLETE', payload: { timestamp: new Date() } })
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' })
      console.error('Workspace sync failed:', error)
    }
  }, [])
  
  const getConnectionStatus = useCallback(() => {
    return state.connectionStatus
  }, [state.connectionStatus])

  // ========================================================================
  // EFFECTS
  // ========================================================================
  
  // Auto-sync workspace periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.connectionStatus === 'connected') {
        syncWorkspace()
      }
    }, 30000) // Sync every 30 seconds
    
    return () => clearInterval(interval)
  }, [state.connectionStatus, syncWorkspace])
  
  // Generate contextual suggestions based on current mode and activity
  useEffect(() => {
    const generateContextualSuggestions = () => {
      // Clear expired suggestions
      const now = new Date()
      state.suggestions.forEach(suggestion => {
        if (suggestion.expires && suggestion.expires < now) {
          removeSuggestion(suggestion.id)
        }
      })
      
      // Generate new suggestions based on current context
      if (state.currentMode === 'translation' && state.activities.length > 0) {
        const recentTranslations = getActivitiesByType('translation')
        if (recentTranslations.length > 3) {
          addSuggestion({
            type: 'feature',
            title: 'Try Document Translation',
            description: 'Upload a document for batch translation processing',
            action: () => setMode('documents'),
            priority: 'medium',
            context: { source: 'usage_pattern' },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          })
        }
      }
    }
    
    const timeout = setTimeout(generateContextualSuggestions, 2000)
    return () => clearTimeout(timeout)
  }, [state.currentMode, state.activities.length, addSuggestion, removeSuggestion, getActivitiesByType, setMode])

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================
  
  const contextValue: WorkspaceIntelligenceContextType = {
    state,
    
    // Mode management
    setMode,
    getPreviousMode,
    
    // Activity tracking
    trackActivity,
    getRecentActivities,
    getActivitiesByType,
    
    // AI operations
    startAIOperation,
    updateAIOperation,
    getActiveOperations,
    
    // Smart suggestions
    addSuggestion,
    removeSuggestion,
    getSuggestionsByPriority,
    
    // Context management
    updateContext,
    getCurrentContext,
    
    // Analytics & patterns
    getUserPatterns,
    generateInsights,
    getWorkflowEfficiency,
    
    // Real-time features
    syncWorkspace,
    getConnectionStatus
  }

  return (
    <WorkspaceIntelligenceContext.Provider value={contextValue}>
      {children}
    </WorkspaceIntelligenceContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useWorkspaceIntelligence() {
  const context = useContext(WorkspaceIntelligenceContext)
  if (context === undefined) {
    throw new Error('useWorkspaceIntelligence must be used within a WorkspaceIntelligenceProvider')
  }
  return context
}

export default WorkspaceIntelligenceContext