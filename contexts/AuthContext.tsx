'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase-browser'
import type { UserProfile } from '@/lib/supabase'
import { logAuthEvent, logAuthError, markAuthTiming, startOAuthFlow, completeOAuthFlow } from '@/lib/auth-analytics'
import { supabaseEventLogger } from '@/lib/supabase-events'

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
  authStable: boolean
  authTransition: boolean

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
  const [authStable, setAuthStable] = useState(false)
  const [authTransition, setAuthTransition] = useState(false)
  
  // Refs for managing auth state debouncing
  const authStabilizeTimeoutRef = useRef<NodeJS.Timeout>()
  const authTransitionTimeoutRef = useRef<NodeJS.Timeout>()
  const lastAuthChangeRef = useRef<number>(0)
  const backgroundRetryRef = useRef<NodeJS.Timeout>()
  const backgroundRetryIntervalRef = useRef<NodeJS.Timeout>()

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

  // Auth stabilization helpers
  const markAuthTransition = () => {
    setAuthTransition(true)
    setAuthStable(false)
    
    // Clear existing transition timeout
    if (authTransitionTimeoutRef.current) {
      clearTimeout(authTransitionTimeoutRef.current)
    }
    
    // Mark transition end after 2 seconds
    authTransitionTimeoutRef.current = setTimeout(() => {
      setAuthTransition(false)
    }, 2000)
  }

  const stabilizeAuthState = () => {
    lastAuthChangeRef.current = Date.now()
    
    // Clear existing stabilization timeout
    if (authStabilizeTimeoutRef.current) {
      clearTimeout(authStabilizeTimeoutRef.current)
    }
    
    // Mark auth as stable after 1.5 seconds of no changes
    authStabilizeTimeoutRef.current = setTimeout(() => {
      const timeSinceLastChange = Date.now() - lastAuthChangeRef.current
      if (timeSinceLastChange >= 1400) { // 1.4s buffer
        setAuthStable(true)
        setAuthTransition(false)
        console.log('🔐 [AuthContext] Auth state stabilized')
      }
    }, 1500)
  }

  useEffect(() => {
    let isMounted = true
    let sessionRestoreTimeout: NodeJS.Timeout

    // 🩺 Sensor C: Initialize monitoring systems
    const supabaseClient = getSupabaseClient()
    supabaseEventLogger.initialize(supabaseClient)

    // Get initial session with enhanced reliability
    const getInitialSession = async () => {
      try {
        console.log('🔐 [AuthContext] Getting initial session...')
        
        // 🩺 Sensor C: Log session restoration start
        logAuthEvent('oauth_session_restored', {
          metadata: {
            source: 'auth_context_init',
            loading: true,
            authStable: authStable,
            authTransition: authTransition
          }
        })

        // Retry logic with exponential backoff for session restoration
        let session = null
        let retryAttempt = 0
        const maxRetries = 3
        
        while (retryAttempt < maxRetries && !session) {
          try {
            const result = await getSupabaseClient().auth.getSession()
            session = result.data.session
            
            if (!session && retryAttempt < maxRetries - 1) {
              const backoffDelay = Math.min(200 * Math.pow(2, retryAttempt), 1000)
              console.log(`🔐 [AuthContext] Retry attempt ${retryAttempt + 1}/${maxRetries} after ${backoffDelay}ms`)
              await new Promise(resolve => setTimeout(resolve, backoffDelay))
            }
          } catch (retryError) {
            console.warn(`🔐 [AuthContext] Session retry ${retryAttempt + 1} failed:`, retryError)
            if (retryAttempt === maxRetries - 1) throw retryError
          }
          retryAttempt++
        }

        if (!isMounted) return

        console.log('🔐 [AuthContext] Initial session result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userEmail: session?.user?.email 
        })

        // 🩺 Sensor C: Log session restoration result
        logAuthEvent('oauth_session_restored', {
          metadata: {
            source: 'initial_session_check',
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            expiresAt: session?.expires_at
          }
        })

        // Mark auth transition when session state changes
        markAuthTransition()
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('🔐 [AuthContext] Fetching user profile...')
          await fetchUserProfile(session.user.id)
        }

        setSessionRestored(true)
        stabilizeAuthState()
        console.log('🔐 [AuthContext] Session restoration completed')

        // 🩺 Sensor C: Complete OAuth flow if session exists
        if (session) {
          completeOAuthFlow(true)
        }
      } catch (error) {
        console.error('🔐 [AuthContext] Session restoration error:', error)
        
        // 🩺 Sensor C: Log session restoration error
        logAuthError('oauth_session_restored', error as Error, {
          source: 'initial_session_check',
          isMounted
        })
        
        setSessionRestored(true) // Mark as restored even on error to prevent infinite loading
      } finally {
        if (isMounted) {
          setLoading(false)
          console.log('🔐 [AuthContext] Loading state set to false')
        }
      }
    }

    // Session restoration timeout (1000ms to prevent race conditions)
    sessionRestoreTimeout = setTimeout(() => {
      if (!sessionRestored && isMounted) {
        setSessionRestored(true)
        setLoading(false)
      }
    }, 1000)

    getInitialSession()

    // SWR-style background retry mechanism for failed session restoration
    const startBackgroundRetry = () => {
      if (backgroundRetryIntervalRef.current) return // Already running
      
      backgroundRetryIntervalRef.current = setInterval(async () => {
        if (!isMounted || user || !sessionRestored) {
          // Stop retrying if component unmounted, user found, or still in initial restoration
          if (backgroundRetryIntervalRef.current) {
            clearInterval(backgroundRetryIntervalRef.current)
            backgroundRetryIntervalRef.current = undefined
          }
          return
        }

        try {
          console.log('🔐 [AuthContext] Background session retry...')
          const { data: { session } } = await getSupabaseClient().auth.getSession()
          
          if (session && session.user && isMounted) {
            console.log('🔐 [AuthContext] Background retry found session!')
            setSession(session)
            setUser(session.user)
            await fetchUserProfile(session.user.id)
            
            // Stop background retries
            if (backgroundRetryIntervalRef.current) {
              clearInterval(backgroundRetryIntervalRef.current)
              backgroundRetryIntervalRef.current = undefined
            }
          }
        } catch (error) {
          console.warn('🔐 [AuthContext] Background retry failed:', error)
        }
      }, 5000) // Retry every 5 seconds
    }

    // Start background retries after initial timeout
    backgroundRetryRef.current = setTimeout(() => {
      if (isMounted && !user && sessionRestored) {
        startBackgroundRetry()
      }
    }, 2000) // Start background retries 2 seconds after initial session restoration

    // Listen for auth changes
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log('🔐 [AuthContext] Auth state change:', { 
        event, 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email 
      })

      // 🩺 Sensor C: Log all auth state changes with detailed context
      const eventMap: Record<string, any> = {
        'SIGNED_IN': 'oauth_complete',
        'SIGNED_OUT': 'signout_complete',
        'TOKEN_REFRESHED': 'session_refresh',
        'USER_UPDATED': 'oauth_session_restored',
        'INITIAL_SESSION': 'oauth_session_restored'
      }

      const analyticsEvent = eventMap[event] || 'oauth_session_restored'
      logAuthEvent(analyticsEvent, {
        metadata: {
          supabaseEvent: event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          authStable: authStable,
          authTransition: authTransition,
          sessionRestored: sessionRestored,
          loading: loading,
          expiresAt: session?.expires_at
        }
      })

      // Mark auth transition for all non-initial events
      if (event !== 'INITIAL_SESSION') {
        markAuthTransition()
        markAuthTiming(`auth_state_${event.toLowerCase()}`)
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('🔐 [AuthContext] Auth state change - fetching profile...')
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }

      // Mark session as restored on any auth state change
      if (!sessionRestored) {
        setSessionRestored(true)
        console.log('🔐 [AuthContext] Session restored via auth state change')
      }

      // Only set loading false after initial load
      if (event === 'INITIAL_SESSION') {
        setLoading(false)
        console.log('🔐 [AuthContext] Loading set to false via INITIAL_SESSION')
      }

      // Stabilize auth state after any change
      stabilizeAuthState()

      // 🩺 Sensor C: Track workspace mount when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        logAuthEvent('oauth_workspace_mount', {
          metadata: {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider
          }
        })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (sessionRestoreTimeout) {
        clearTimeout(sessionRestoreTimeout)
      }
      if (authStabilizeTimeoutRef.current) {
        clearTimeout(authStabilizeTimeoutRef.current)
      }
      if (authTransitionTimeoutRef.current) {
        clearTimeout(authTransitionTimeoutRef.current)
      }
      if (backgroundRetryRef.current) {
        clearTimeout(backgroundRetryRef.current)
      }
      if (backgroundRetryIntervalRef.current) {
        clearInterval(backgroundRetryIntervalRef.current)
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
    const intendedRedirect = redirectTo || '/app'

    // 🩺 Sensor C: Start OAuth flow tracking
    const sessionId = startOAuthFlow(intendedRedirect)

    // Always use current domain for callback to prevent domain mismatch
    const currentOrigin = window.location.origin
    const callbackUrl = new URL('/auth/callback', currentOrigin)
    callbackUrl.searchParams.set('next', intendedRedirect)

    try {
      console.log('🔐 [AUTH] Initiating Google OAuth:', {
        startDomain: currentOrigin,
        callbackUrl: callbackUrl.toString(),
        intendedRedirect
      })

      // 🩺 Sensor C: Log OAuth initiation
      logAuthEvent('oauth_start', {
        metadata: {
          provider: 'google',
          sessionId,
          startDomain: currentOrigin,
          callbackUrl: callbackUrl.toString(),
          intendedRedirect,
          userAgent: navigator.userAgent
        }
      })

      markAuthTiming('oauth_start')
      
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
        
        // 🩺 Sensor C: Log OAuth errors
        logAuthError('oauth_start', error.message, {
          provider: 'google',
          sessionId,
          errorCode: error.status,
          errorName: error.name
        })
        
        return { error }
      }

      // 🩺 Sensor C: Log OAuth redirect initiation
      logAuthEvent('oauth_google_redirect', {
        metadata: {
          provider: 'google',
          sessionId,
          success: true
        }
      })

      markAuthTiming('oauth_google_redirect')

      console.log('🔐 [AUTH] Google OAuth initiated successfully')
      return { error: null }
    } catch (err) {
      console.error('🔐 [AUTH] Google OAuth failed:', err)
      
      // 🩺 Sensor C: Log unexpected OAuth errors
      logAuthError('oauth_start', err as Error, {
        provider: 'google',
        sessionId,
        stage: 'oauth_initiation'
      })
      
      return { error: err }
    }
  }

  const signInWithApple = async (redirectTo?: string) => {
    const intendedRedirect = redirectTo || '/app'

    // Always use current domain for callback to prevent domain mismatch
    const currentOrigin = window.location.origin
    const callbackUrl = new URL('/auth/callback', currentOrigin)
    callbackUrl.searchParams.set('next', intendedRedirect)

    try {
      console.log('🔐 [AUTH] Initiating Apple OAuth:', {
        startDomain: currentOrigin,
        callbackUrl: callbackUrl.toString(),
        intendedRedirect
      })

      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        console.error('🔐 [AUTH] Apple OAuth error:', error)
        return { error }
      }

      console.log('🔐 [AUTH] Apple OAuth initiated successfully')
      return { error: null }
    } catch (err) {
      console.error('🔐 [AUTH] Apple OAuth failed:', err)
      return { error: err }
    }
  }

  const signOut = async (redirectTo?: string) => {
    // 🩺 Sensor E: Start sign-out monitoring
    const startTime = Date.now()
    const currentUserId = user?.id
    
    logAuthEvent('signout_start', {
      metadata: {
        userId: currentUserId,
        redirectTo,
        hasSession: !!session,
        authStable,
        authTransition
      }
    })

    try {
      // 🩺 Sensor E: Log local state clearing
      logAuthEvent('signout_local_clear', {
        metadata: {
          userId: currentUserId,
          clearingLocalState: true
        }
      })

      // Clear local state immediately (non-blocking for UX)
      setUser(null)
      setSession(null)
      setProfile(null)
      setAuthStable(false)
      markAuthTransition()

      // 🩺 Sensor E: Monitor network sign-out call
      logAuthEvent('signout_network_call', {
        metadata: {
          userId: currentUserId,
          scope: 'global'
        }
      })

      // Wrap signOut with 2-second timeout to prevent hanging
      await Promise.race([
        getSupabaseClient().auth.signOut({ scope: 'global' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SignOut timeout after 2 seconds')), 2000)
        )
      ])
        .finally(() => {
          const duration = Date.now() - startTime

          // 🩺 Sensor E: Cookie cleanup verification
          const hasCookiesBefore = typeof window !== 'undefined' ? document.cookie : ''
          localStorage.removeItem('supabase.auth.token')
          
          // Verify cookie cleanup after a brief delay
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              const hasCookiesAfter = document.cookie.includes('sb-') || document.cookie.includes('supabase')
              
              if (hasCookiesAfter) {
                logAuthError('signout_complete', 'Cookies still present after sign-out', {
                  duration,
                  cookiesBefore: hasCookiesBefore,
                  cookiesAfter: document.cookie
                })
              } else {
                console.log('🩺 Cookies successfully cleared after sign-out')
              }
            }
          }, 1000)

          // 🩺 Sensor E: Complete sign-out with timing
          logAuthEvent('signout_complete', {
            duration,
            metadata: {
              userId: currentUserId,
              success: true,
              redirectTo,
              totalTime: duration
            }
          })

          console.log(`🩺 Sign-out completed in ${duration}ms`)

          // Note: Redirect is now handled by calling component for better performance
          // No automatic redirect here - caller should handle navigation
        })
    } catch (error) {
      const duration = Date.now() - startTime
      
      // 🩺 Sensor E: Log sign-out errors
      logAuthError('signout_complete', error as Error, {
        duration,
        userId: currentUserId,
        redirectTo,
        stage: 'network_call'
      })

      // Note: Redirect is now handled by calling component for better performance
      // No automatic redirect here - caller should handle navigation
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
        authStable,
        authTransition,
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
