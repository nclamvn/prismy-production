'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase-browser'
import type { UserProfile } from '@/lib/supabase'

// Import comprehensive auth types
import type {
  AuthContextValue,
  AuthState,
  AuthError,
  LoginRequest,
  RegisterRequest,
  User as PrismyUser,
} from '../types/auth'
import type { SupportedLanguage } from '../types'
import {
  isUser,
  isAuthTokens,
  validateEmail,
  validatePassword,
} from '../lib/type-guards'

// Enhanced AuthContext with strict typing
interface AuthContextType extends Omit<AuthContextValue, 'state' | 'actions'> {
  // Legacy compatibility
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  sessionRestored: boolean

  // Enhanced typed methods
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    language?: SupportedLanguage
  ) => Promise<{ error: AuthError | null }>
  signInWithGoogle: (
    redirectTo?: string
  ) => Promise<{ error: AuthError | null }>
  signInWithApple: (redirectTo?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>

  // New typed methods
  login: (credentials: LoginRequest) => Promise<{ error: AuthError | null }>
  register: (data: RegisterRequest) => Promise<{ error: AuthError | null }>

  // State management
  state: AuthState
  isAuthenticated: boolean
  error: AuthError | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Type-safe hook with proper error handling
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Use true singleton client - getBrowserClient ensures only one instance
const getSupabaseClient = () => {
  return getBrowserClient()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionRestored, setSessionRestored] = useState(false)

  // Environment check on initialization
  useEffect(() => {
    const env = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      origin:
        typeof window !== 'undefined' ? window.location.origin : 'unknown',
    }

    // Check for common misconfigurations
    if (!env.supabaseUrl || env.supabaseUrl.includes('placeholder')) {
      console.error('Invalid Supabase URL configuration')
    }

    if (!env.hasAnonKey) {
      console.error('Missing Supabase Anon Key')
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let sessionRestoreTimeout: NodeJS.Timeout

    // Get initial session with enhanced reliability
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await getSupabaseClient().auth.getSession()

        if (!isMounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }

        setSessionRestored(true)
      } catch (error) {
        // Silent error handling for production
        setSessionRestored(true) // Mark as restored even on error to prevent infinite loading
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Session restoration timeout (500ms for ultra-fast UX)
    sessionRestoreTimeout = setTimeout(() => {
      if (!sessionRestored && isMounted) {
        setSessionRestored(true)
        setLoading(false)
      }
    }, 500)

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }

      // Mark session as restored on any auth state change
      if (!sessionRestored) {
        setSessionRestored(true)
      }

      // Only set loading false after initial load
      if (event === 'INITIAL_SESSION') {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (sessionRestoreTimeout) {
        clearTimeout(sessionRestoreTimeout)
      }
    }
  }, []) // Remove supabase.auth dependency to prevent re-runs

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await getSupabaseClient()
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        return
      }

      setProfile(data)
    } catch (error) {
      // Silent error handling for production
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    return { error }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    const intendedRedirect = redirectTo || '/workspace'

    // Build callback URL with intended redirect as query param
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('next', intendedRedirect)

    try {
      console.log('🔐 [AUTH] Initiating Google OAuth with callback:', callbackUrl.toString())
      
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('🔐 [AUTH] Google OAuth error:', error)
        return { error }
      }

      console.log('🔐 [AUTH] Google OAuth initiated successfully')
      return { error: null }
    } catch (err) {
      console.error('🔐 [AUTH] Google OAuth failed:', err)
      return { error: err }
    }
  }

  const signInWithApple = async (redirectTo?: string) => {
    const intendedRedirect = redirectTo || '/workspace'

    // Build callback URL with intended redirect as query param
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirectTo', intendedRedirect)

    try {
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (err) {
      return { error: err }
    }
  }

  const signOut = async (redirectTo?: string) => {
    try {
      console.log('🔐 [AUTH] Initiating sign out...')
      
      const { error } = await getSupabaseClient().auth.signOut()
      
      if (error) {
        console.error('🔐 [AUTH] Sign out error:', error)
        throw error
      }

      // Clear all state immediately
      setUser(null)
      setSession(null)
      setProfile(null)

      console.log('🔐 [AUTH] Sign out successful - state cleared')

      // Clear any additional cached data
      if (typeof window !== 'undefined') {
        // Clear local storage items that might contain user data
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('sb-') || key.includes('supabase') || key.includes('user')
        )
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Clear session storage
        sessionStorage.clear()
        
        console.log('🔐 [AUTH] Local storage cleared')
      }

      // Optional redirect
      if (redirectTo && typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = redirectTo
        }, 100) // Small delay to ensure state is cleared
      }
      
    } catch (error) {
      console.error('🔐 [AUTH] Sign out failed:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' }

    const { error } = await getSupabaseClient()
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)

    if (!error) {
      await fetchUserProfile(user.id)
    }

    return { error }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  // Helper functions for new typed methods
  const login = async (credentials: LoginRequest) => {
    return await signIn(credentials.email, credentials.password)
  }

  const register = async (data: RegisterRequest) => {
    return await signUp(
      data.email,
      data.password,
      `${data.firstName} ${data.lastName}`,
      data.language
    )
  }

  // Computed state values
  const isAuthenticated = !!user && !!session
  const error: AuthError | null = null // Implement error state as needed
  const state: AuthState = {
    user: user as any, // Cast to match type definition
    isAuthenticated,
    isLoading: loading,
    isInitialized: sessionRestored,
    error,
    session: session as any, // Cast to match type definition
    tokens: null, // Implement tokens as needed
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        sessionRestored,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        updateProfile,
        refreshProfile,
        login,
        register,
        state,
        isAuthenticated,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
