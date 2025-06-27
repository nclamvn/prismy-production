'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useSSRSafeLanguage } from './SSRSafeLanguageContext'
import { PipelineOrchestrator, PipelineRequest, PipelineResponse } from '@/lib/pipeline/PipelineOrchestrator'

interface PipelineContextValue {
  // Core pipeline operations
  processRequest: (request: Omit<PipelineRequest, 'id' | 'userId' | 'sessionId' | 'timestamp'>) => Promise<PipelineResponse>
  
  // Request builders for different modes
  translation: {
    translateText: (text: string, options?: TranslationOptions) => Promise<PipelineResponse>
    detectLanguage: (text: string) => Promise<PipelineResponse>
  }
  
  documents: {
    processDocument: (file: File, options?: DocumentOptions) => Promise<PipelineResponse>
    extractText: (file: File) => Promise<PipelineResponse>
    analyzeDocument: (file: File) => Promise<PipelineResponse>
  }
  
  intelligence: {
    querySwarm: (query: string, options?: IntelligenceOptions) => Promise<PipelineResponse>
    analyzeContent: (content: string, type: string) => Promise<PipelineResponse>
  }
  
  analytics: {
    getUserMetrics: (timeRange?: string) => Promise<PipelineResponse>
    getSystemMetrics: (timeRange?: string) => Promise<PipelineResponse>
  }
  
  // Pipeline status and metrics
  status: {
    activeRequests: number
    metrics: any
    isHealthy: boolean
  }
  
  // Request tracking
  requests: Map<string, PipelineRequest>
  responses: Map<string, PipelineResponse>
  
  // Utilities
  cancelRequest: (requestId: string) => void
  clearHistory: () => void
}

interface TranslationOptions {
  sourceLang?: string
  targetLang?: string
  qualityTier?: 'free' | 'standard' | 'premium' | 'enterprise'
  cacheEnabled?: boolean
}

interface DocumentOptions {
  targetLang?: string
  extractImages?: boolean
  qualityTier?: 'free' | 'standard' | 'premium' | 'enterprise'
  agentAnalysis?: boolean
}

interface IntelligenceOptions {
  agentCount?: number
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  includeAnalytics?: boolean
}

const PipelineContext = createContext<PipelineContextValue | null>(null)

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { language } = useSSRSafeLanguage()
  const orchestratorRef = useRef<PipelineOrchestrator>(new PipelineOrchestrator())
  
  const [requests] = useState<Map<string, PipelineRequest>>(new Map())
  const [responses] = useState<Map<string, PipelineResponse>>(new Map())
  const [activeRequests, setActiveRequests] = useState(0)
  const [metrics, setMetrics] = useState({})
  
  // Generate session ID
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  // Core pipeline operation
  const processRequest = useCallback(async (
    request: Omit<PipelineRequest, 'id' | 'userId' | 'sessionId' | 'timestamp'>
  ): Promise<PipelineResponse> => {
    const fullRequest: PipelineRequest = {
      ...request,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user?.id,
      sessionId: sessionId.current,
      timestamp: new Date()
    }
    
    requests.set(fullRequest.id, fullRequest)
    setActiveRequests(prev => prev + 1)
    
    try {
      const response = await orchestratorRef.current.processRequest(fullRequest)
      responses.set(response.id, response)
      
      // Update metrics
      setMetrics(orchestratorRef.current.getMetrics())
      
      return response
    } finally {
      setActiveRequests(prev => prev - 1)
    }
  }, [user, requests, responses])

  // Translation operations
  const translation = {
    translateText: useCallback(async (text: string, options: TranslationOptions = {}): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'translation',
        type: 'text',
        input: {
          content: text,
          metadata: {
            sourceLang: options.sourceLang || 'auto',
            targetLang: options.targetLang || (language === 'vi' ? 'en' : 'vi')
          },
          preferences: {
            language,
            qualityPreference: options.qualityTier || 'standard'
          }
        },
        options: {
          qualityTier: options.qualityTier || 'standard',
          cacheEnabled: options.cacheEnabled !== false,
          priority: 'normal'
        }
      })
    }, [processRequest, language]),

    detectLanguage: useCallback(async (text: string): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'translation',
        type: 'query',
        input: {
          content: text,
          metadata: { operation: 'detect_language' }
        },
        options: {
          priority: 'normal',
          cacheEnabled: true
        }
      })
    }, [processRequest])
  }

  // Document operations
  const documents = {
    processDocument: useCallback(async (file: File, options: DocumentOptions = {}): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'documents',
        type: 'document',
        input: {
          content: file,
          metadata: {
            targetLang: options.targetLang || language,
            extractImages: options.extractImages || false,
            agentAnalysis: options.agentAnalysis !== false
          }
        },
        options: {
          qualityTier: options.qualityTier || 'standard',
          priority: 'normal',
          async: true
        }
      })
    }, [processRequest, language]),

    extractText: useCallback(async (file: File): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'documents',
        type: 'text',
        input: {
          content: file,
          metadata: { operation: 'extract_text' }
        },
        options: {
          priority: 'normal',
          cacheEnabled: true
        }
      })
    }, [processRequest]),

    analyzeDocument: useCallback(async (file: File): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'intelligence',
        type: 'document',
        input: {
          content: file,
          metadata: { operation: 'analyze' }
        },
        options: {
          priority: 'high',
          async: true
        }
      })
    }, [processRequest])
  }

  // Intelligence operations
  const intelligence = {
    querySwarm: useCallback(async (query: string, options: IntelligenceOptions = {}): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'intelligence',
        type: 'query',
        input: {
          content: query,
          metadata: {
            agentCount: options.agentCount || 3,
            includeAnalytics: options.includeAnalytics !== false
          }
        },
        options: {
          priority: options.priority || 'normal',
          async: true
        }
      })
    }, [processRequest]),

    analyzeContent: useCallback(async (content: string, type: string): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'intelligence',
        type: 'text',
        input: {
          content,
          metadata: { contentType: type }
        },
        options: {
          priority: 'normal',
          cacheEnabled: true
        }
      })
    }, [processRequest])
  }

  // Analytics operations
  const analytics = {
    getUserMetrics: useCallback(async (timeRange: string = '30d'): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'analytics',
        type: 'query',
        input: {
          content: 'user_metrics',
          metadata: { timeRange }
        },
        options: {
          priority: 'low',
          cacheEnabled: true
        }
      })
    }, [processRequest]),

    getSystemMetrics: useCallback(async (timeRange: string = '30d'): Promise<PipelineResponse> => {
      return processRequest({
        mode: 'analytics',
        type: 'query',
        input: {
          content: 'system_metrics',
          metadata: { timeRange }
        },
        options: {
          priority: 'low',
          cacheEnabled: true
        }
      })
    }, [processRequest])
  }

  // Utility functions
  const cancelRequest = useCallback((requestId: string) => {
    requests.delete(requestId)
    // Note: Would need to implement actual cancellation in orchestrator
  }, [requests])

  const clearHistory = useCallback(() => {
    requests.clear()
    responses.clear()
  }, [requests, responses])

  const value: PipelineContextValue = {
    processRequest,
    translation,
    documents,
    intelligence,
    analytics,
    status: {
      activeRequests,
      metrics,
      isHealthy: true // TODO: Implement health checks
    },
    requests,
    responses,
    cancelRequest,
    clearHistory
  }

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  )
}

// Hook for accessing pipeline
export function usePipeline() {
  const context = useContext(PipelineContext)
  if (!context) {
    throw new Error('usePipeline must be used within a PipelineProvider')
  }
  return context
}

// Specialized hooks for different modes
export function useTranslationPipeline() {
  const { translation, status } = usePipeline()
  return { ...translation, status }
}

export function useDocumentPipeline() {
  const { documents, status } = usePipeline()
  return { ...documents, status }
}

export function useIntelligencePipeline() {
  const { intelligence, status } = usePipeline()
  return { ...intelligence, status }
}

export function useAnalyticsPipeline() {
  const { analytics, status } = usePipeline()
  return { ...analytics, status }
}

// Hook for monitoring pipeline performance
export function usePipelineMetrics() {
  const { status, requests, responses } = usePipeline()
  
  return {
    ...status,
    totalRequests: requests.size,
    totalResponses: responses.size,
    successRate: responses.size > 0 ? 
      Array.from(responses.values()).filter(r => r.status === 'completed').length / responses.size * 100 : 0
  }
}