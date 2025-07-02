'use client'

import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

interface UserCredits {
  credits_left: number
  credits_used: number
  tier: 'free' | 'basic' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  credits: UserCredits | null
  creditsLoading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    credits: null,
    creditsLoading: false,
  })

  const router = useRouter()
  const supabase = createClient()

  // Fetch user credits
  const fetchCredits = async () => {
    if (!state.user) {
      setState(prev => ({ ...prev, credits: null, creditsLoading: false }))
      return
    }

    setState(prev => ({ ...prev, creditsLoading: true }))

    try {
      const response = await fetch('/api/credits/me')
      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          credits: data.credits,
          creditsLoading: false,
        }))
      } else {
        console.error('Failed to fetch credits:', data.error)
        setState(prev => ({
          ...prev,
          credits: null,
          creditsLoading: false,
        }))
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
      setState(prev => ({
        ...prev,
        credits: null,
        creditsLoading: false,
      }))
    }
  }

  // Refresh credits (useful after credit usage)
  const refreshCredits = () => {
    fetchCredits()
  }

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState({
        user: null,
        session: null,
        loading: false,
        credits: null,
        creditsLoading: false,
      })

      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Check if user has sufficient credits
  const hasCredits = (cost: number = 1): boolean => {
    return state.credits ? state.credits.credits_left >= cost : false
  }

  // Get user's current tier
  const getUserTier = (): string => {
    return state.credits?.tier || 'free'
  }

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
      }

      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }))
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }))

        // Handle auth events
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch credits when user signs in
          setTimeout(fetchCredits, 100) // Small delay to ensure state is updated
        } else if (event === 'SIGNED_OUT') {
          setState(prev => ({
            ...prev,
            credits: null,
            creditsLoading: false,
          }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch credits when user changes
  useEffect(() => {
    if (state.user && !state.creditsLoading && !state.credits) {
      fetchCredits()
    }
  }, [state.user])

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    credits: state.credits,
    creditsLoading: state.creditsLoading,
    signOut,
    refreshCredits,
    hasCredits,
    getUserTier,
    isAuthenticated: !!state.user,
  }
}
