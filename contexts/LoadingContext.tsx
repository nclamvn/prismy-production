'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'

interface LoadingState {
  [key: string]: boolean
}

interface LoadingContextType {
  loadingStates: LoadingState
  setLoading: (key: string, isLoading: boolean) => void
  isAnyLoading: boolean
  isGlobalLoading: boolean
  clearAll: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

// Global loading keys for coordination
export const LOADING_KEYS = {
  AUTH: 'auth',
  WORKSPACE: 'workspace',
  PRICING: 'pricing',
  TRANSLATION: 'translation',
  UPLOAD: 'upload',
  PAYMENT: 'payment',
  NAVIGATION: 'navigation',
} as const

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({})

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }))
  }, [])

  const clearAll = useCallback(() => {
    setLoadingStates({})
  }, [])

  // Calculate derived states
  const isAnyLoading = Object.values(loadingStates).some(Boolean)
  const isGlobalLoading =
    loadingStates[LOADING_KEYS.AUTH] || loadingStates[LOADING_KEYS.NAVIGATION]

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Loading states:', loadingStates)
    }
  }, [loadingStates])

  const value: LoadingContextType = {
    loadingStates,
    setLoading,
    isAnyLoading,
    isGlobalLoading,
    clearAll,
  }

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Specialized hooks for specific loading states
export function useAuthLoading() {
  const { loadingStates, setLoading } = useLoading()

  return {
    isLoading: loadingStates[LOADING_KEYS.AUTH] || false,
    setLoading: (isLoading: boolean) =>
      setLoading(LOADING_KEYS.AUTH, isLoading),
  }
}

export function useWorkspaceLoading() {
  const { loadingStates, setLoading } = useLoading()

  return {
    isLoading: loadingStates[LOADING_KEYS.WORKSPACE] || false,
    setLoading: (isLoading: boolean) =>
      setLoading(LOADING_KEYS.WORKSPACE, isLoading),
  }
}

export function usePricingLoading() {
  const { loadingStates, setLoading } = useLoading()

  return {
    isLoading: loadingStates[LOADING_KEYS.PRICING] || false,
    setLoading: (isLoading: boolean) =>
      setLoading(LOADING_KEYS.PRICING, isLoading),
  }
}

export function useNavigationLoading() {
  const { loadingStates, setLoading } = useLoading()

  return {
    isLoading: loadingStates[LOADING_KEYS.NAVIGATION] || false,
    setLoading: (isLoading: boolean) =>
      setLoading(LOADING_KEYS.NAVIGATION, isLoading),
  }
}

// Global loading indicator component
export function GlobalLoadingIndicator() {
  const { isGlobalLoading } = useLoading()

  if (!isGlobalLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className="h-1 animate-pulse"
        style={{ backgroundColor: 'var(--notebooklm-primary)' }}
      ></div>
    </div>
  )
}

// Loading spinner component with coordination
interface LoadingSpinnerProps {
  loadingKey?: string
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export function LoadingSpinner({
  loadingKey,
  size = 'md',
  message,
  className = '',
}: LoadingSpinnerProps) {
  const { loadingStates } = useLoading()

  const isVisible = loadingKey ? loadingStates[loadingKey] : true

  if (!isVisible) return null

  const getSizeStyles = () => {
    const sizes = {
      sm: { width: '16px', height: '16px' },
      md: { width: '24px', height: '24px' },
      lg: { width: '32px', height: '32px' },
    }
    return sizes[size]
  }

  const sizeStyles = getSizeStyles()

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <div
        className="animate-spin rounded-full border-2"
        style={{
          ...sizeStyles,
          borderColor: 'var(--surface-outline)',
          borderTopColor: 'var(--notebooklm-primary)',
        }}
      />
      {message && (
        <span
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--sys-body-small-size)',
          }}
        >
          {message}
        </span>
      )}
    </div>
  )
}
