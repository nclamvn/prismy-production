'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface FeatureDiscoveryState {
  hasSeenDiscovery: boolean
  completedFeatures: string[]
  currentFeature: string | null
  userLevel: 'beginner' | 'intermediate' | 'advanced'
  dismissedNotifications: string[]
}

interface FeatureDiscoveryContextType {
  state: FeatureDiscoveryState
  isDiscoveryOpen: boolean
  showDiscovery: () => void
  hideDiscovery: () => void
  completeFeature: (feature: string) => void
  dismissNotification: (notificationId: string) => void
  shouldShowFeatureHint: (feature: string) => boolean
  getUserLevel: () => 'beginner' | 'intermediate' | 'advanced'
  updateUserLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void
}

const FeatureDiscoveryContext = createContext<FeatureDiscoveryContextType | undefined>(undefined)

interface FeatureDiscoveryProviderProps {
  children: React.ReactNode
}

export function FeatureDiscoveryProvider({ children }: FeatureDiscoveryProviderProps) {
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false)
  const [state, setState] = useState<FeatureDiscoveryState>({
    hasSeenDiscovery: false,
    completedFeatures: [],
    currentFeature: null,
    userLevel: 'beginner',
    dismissedNotifications: []
  })

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('prismy-feature-discovery-state')
      if (savedState) {
        const parsed = JSON.parse(savedState)
        setState(prevState => ({
          ...prevState,
          ...parsed
        }))
      }

      // Auto-show discovery for new users
      const discoveryData = localStorage.getItem('prismy-feature-discovery')
      if (!discoveryData) {
        // Delay to allow page to render first
        setTimeout(() => {
          setIsDiscoveryOpen(true)
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to load feature discovery state:', error)
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('prismy-feature-discovery-state', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save feature discovery state:', error)
    }
  }, [state])

  const showDiscovery = () => {
    setIsDiscoveryOpen(true)
    setState(prev => ({ ...prev, hasSeenDiscovery: true }))
  }

  const hideDiscovery = () => {
    setIsDiscoveryOpen(false)
  }

  const completeFeature = (feature: string) => {
    setState(prev => ({
      ...prev,
      completedFeatures: [...prev.completedFeatures, feature].filter((f, i, arr) => arr.indexOf(f) === i),
      currentFeature: null
    }))

    // Auto-advance user level based on completed features
    setState(prev => {
      const completedCount = prev.completedFeatures.length + 1 // +1 for the feature being completed
      let newLevel = prev.userLevel

      if (completedCount >= 3 && prev.userLevel === 'beginner') {
        newLevel = 'intermediate'
      } else if (completedCount >= 5 && prev.userLevel === 'intermediate') {
        newLevel = 'advanced'
      }

      return { ...prev, userLevel: newLevel }
    })
  }

  const dismissNotification = (notificationId: string) => {
    setState(prev => ({
      ...prev,
      dismissedNotifications: [...prev.dismissedNotifications, notificationId].filter((id, i, arr) => arr.indexOf(id) === i)
    }))
  }

  const shouldShowFeatureHint = (feature: string): boolean => {
    return !state.completedFeatures.includes(feature) && 
           !state.dismissedNotifications.includes(`hint-${feature}`) &&
           state.hasSeenDiscovery
  }

  const getUserLevel = (): 'beginner' | 'intermediate' | 'advanced' => {
    return state.userLevel
  }

  const updateUserLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setState(prev => ({ ...prev, userLevel: level }))
  }

  const contextValue: FeatureDiscoveryContextType = {
    state,
    isDiscoveryOpen,
    showDiscovery,
    hideDiscovery,
    completeFeature,
    dismissNotification,
    shouldShowFeatureHint,
    getUserLevel,
    updateUserLevel
  }

  return (
    <FeatureDiscoveryContext.Provider value={contextValue}>
      {children}
    </FeatureDiscoveryContext.Provider>
  )
}

export function useFeatureDiscovery() {
  const context = useContext(FeatureDiscoveryContext)
  if (context === undefined) {
    throw new Error('useFeatureDiscovery must be used within a FeatureDiscoveryProvider')
  }
  return context
}

// Hook for checking if a specific feature should show hints
export function useFeatureHint(feature: string) {
  const { shouldShowFeatureHint, dismissNotification } = useFeatureDiscovery()
  
  return {
    shouldShow: shouldShowFeatureHint(feature),
    dismiss: () => dismissNotification(`hint-${feature}`)
  }
}

// Hook for progressive feature unlock
export function useProgressiveFeatures() {
  const { state, getUserLevel } = useFeatureDiscovery()
  
  const getAvailableFeatures = () => {
    const level = getUserLevel()
    const baseFeatures = ['translation', 'history', 'analytics']
    
    switch (level) {
      case 'beginner':
        return baseFeatures
      case 'intermediate':
        return [...baseFeatures, 'agents', 'insights']
      case 'advanced':
        return [...baseFeatures, 'agents', 'insights', 'enterprise', 'voice-control', 'learning-networks']
      default:
        return baseFeatures
    }
  }

  const isFeatureUnlocked = (feature: string): boolean => {
    return getAvailableFeatures().includes(feature)
  }

  const getFeatureUnlockMessage = (feature: string): string | null => {
    const level = getUserLevel()
    
    if (isFeatureUnlocked(feature)) return null
    
    const unlockRequirements = {
      'agents': 'Complete 2 translations to unlock AI Agents',
      'insights': 'Complete 3 translations to unlock Smart Insights', 
      'enterprise': 'Upgrade to Pro plan to unlock Enterprise Features',
      'voice-control': 'Upgrade to Pro plan to unlock Voice Control',
      'learning-networks': 'Upgrade to Pro plan to unlock Learning Networks'
    }

    return unlockRequirements[feature as keyof typeof unlockRequirements] || null
  }

  return {
    availableFeatures: getAvailableFeatures(),
    isFeatureUnlocked,
    getFeatureUnlockMessage,
    userLevel: getUserLevel(),
    completedFeaturesCount: state.completedFeatures.length
  }
}