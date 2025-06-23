'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
// DISABLED: This context was creating multiple Supabase client instances
// Use AuthContext.tsx instead which implements singleton pattern
// import { createBrowserClient } from '@supabase/ssr'
import type { User, Session } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Enhanced Auth State with Premium Features
export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  userProfile: UserProfile | null
  subscription: SubscriptionInfo | null
  preferences: UserPreferences | null
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'standard' | 'premium' | 'enterprise'
  usage_count: number
  created_at: string
  last_active: string
  verification_status:
    | 'unverified'
    | 'email_verified'
    | 'phone_verified'
    | 'fully_verified'
  api_quota: {
    used: number
    limit: number
    reset_date: string
  }
}

export interface SubscriptionInfo {
  tier: 'free' | 'standard' | 'premium' | 'enterprise'
  status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  features: string[]
  limits: {
    translations_per_month: number
    file_size_limit_mb: number
    api_calls_per_day: number
    concurrent_jobs: number
  }
}

export interface UserPreferences {
  language: 'vi' | 'en'
  theme: 'light' | 'dark' | 'auto'
  default_translation_direction: 'vi-en' | 'en-vi'
  auto_detect_language: boolean
  save_translation_history: boolean
  email_notifications: boolean
  marketing_emails: boolean
  quality_preference: 'fast' | 'balanced' | 'accurate'
  preferred_payment_method: 'vnpay' | 'momo' | 'stripe'
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>
  updatePreferences: (
    updates: Partial<UserPreferences>
  ) => Promise<{ error?: string }>
  refreshUserData: () => Promise<void>
  checkQuotaUsage: () => Promise<{
    canProceed: boolean
    usage: number
    limit: number
  }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  initialSession?: Session | null
}

export function SSRSafeAuthProvider({
  children,
  initialSession,
}: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: initialSession?.user || null,
    session: initialSession || null,
    isLoading: !initialSession, // If we have initial session, we're not loading
    isAuthenticated: !!initialSession?.user,
    userProfile: null,
    subscription: null,
    preferences: null,
  })

  // DISABLED: Preventing multiple Supabase client instances
  // This context was creating a second Supabase client instance
  // which caused "Multiple GoTrueClient instances" warnings
  // Use AuthContext.tsx instead which implements singleton pattern

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        // Get current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.error({ error }, 'Failed to get auth session')
          if (mounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }))
          }
          return
        }

        if (session?.user && mounted) {
          // Load user profile and preferences
          await loadUserData(session.user.id)

          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
          }))
        } else if (mounted) {
          setAuthState(prev => ({
            ...prev,
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            userProfile: null,
            subscription: null,
            preferences: null,
          }))
        }
      } catch (error) {
        logger.error({ error }, 'Auth initialization failed')
        if (mounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }))
        }
      }
    }

    // Only initialize if we don't have initial session
    if (!initialSession) {
      initializeAuth()
    } else if (initialSession.user) {
      // We have initial session, load user data
      loadUserData(initialSession.user.id)
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      logger.info({ event, userId: session?.user?.id }, 'Auth state changed')

      if (session?.user) {
        await loadUserData(session.user.id)
        setAuthState(prev => ({
          ...prev,
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
        }))
      } else {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          userProfile: null,
          subscription: null,
          preferences: null,
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, initialSession])

  // Load user profile, subscription, and preferences
  async function loadUserData(userId: string) {
    try {
      const [profileResponse, subscriptionResponse, preferencesResponse] =
        await Promise.allSettled([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single(),
        ])

      setAuthState(prev => ({
        ...prev,
        userProfile:
          profileResponse.status === 'fulfilled'
            ? profileResponse.value.data
            : null,
        subscription:
          subscriptionResponse.status === 'fulfilled'
            ? subscriptionResponse.value.data
            : null,
        preferences:
          preferencesResponse.status === 'fulfilled'
            ? preferencesResponse.value.data
            : getDefaultPreferences(),
      }))
    } catch (error) {
      logger.error({ error, userId }, 'Failed to load user data')
    }
  }

  // Auth actions
  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { error: error.message }
      }

      // State will be updated by onAuthStateChange
      return {}
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { error: 'Đăng nhập thất bại' }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { error: error.message }
      }

      // Create user profile
      if (data.user) {
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          subscription_tier: 'free',
          usage_count: 0,
          verification_status: 'email_verified',
        })
      }

      return {}
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { error: 'Đăng ký thất bại' }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // State will be updated by onAuthStateChange
    } catch (error) {
      logger.error({ error }, 'Sign out failed')
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) return { error: 'Chưa đăng nhập' }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', authState.user.id)

      if (error) return { error: error.message }

      // Refresh user data
      await loadUserData(authState.user.id)
      return {}
    } catch (error) {
      return { error: 'Cập nhật thông tin thất bại' }
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!authState.user) return { error: 'Chưa đăng nhập' }

    try {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: authState.user.id,
        ...authState.preferences,
        ...updates,
        updated_at: new Date().toISOString(),
      })

      if (error) return { error: error.message }

      // Update local state
      setAuthState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...updates } as UserPreferences,
      }))

      return {}
    } catch (error) {
      return { error: 'Cập nhật tùy chọn thất bại' }
    }
  }

  const refreshUserData = async () => {
    if (authState.user) {
      await loadUserData(authState.user.id)
    }
  }

  const checkQuotaUsage = async () => {
    if (!authState.userProfile || !authState.subscription) {
      return { canProceed: false, usage: 0, limit: 0 }
    }

    const { used, limit } = authState.userProfile.api_quota
    return {
      canProceed: used < limit,
      usage: used,
      limit,
    }
  }

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePreferences,
    refreshUserData,
    checkQuotaUsage,
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

// Hook to use auth context
export function useSSRSafeAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSSRSafeAuth must be used within an SSRSafeAuthProvider')
  }
  return context
}

// Default preferences
function getDefaultPreferences(): UserPreferences {
  return {
    language: 'vi',
    theme: 'light',
    default_translation_direction: 'vi-en',
    auto_detect_language: true,
    save_translation_history: true,
    email_notifications: true,
    marketing_emails: false,
    quality_preference: 'balanced',
    preferred_payment_method: 'vnpay',
  }
}

// Utility hook for checking if user has feature access
export function useFeatureAccess() {
  const { subscription } = useSSRSafeAuth()

  return {
    hasFeature: (feature: string) => {
      return subscription?.features.includes(feature) || false
    },
    canUseOCR: () => {
      return ['standard', 'premium', 'enterprise'].includes(
        subscription?.tier || 'free'
      )
    },
    canUseBatchProcessing: () => {
      return ['premium', 'enterprise'].includes(subscription?.tier || 'free')
    },
    hasAPIAccess: () => {
      return subscription?.tier !== 'free'
    },
  }
}
