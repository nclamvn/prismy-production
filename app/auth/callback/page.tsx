'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Loader2 } from 'lucide-react'

export default function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'error' | 'success'>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const next = searchParams.get('next') || searchParams.get('redirectTo') || '/app'

        console.log('🔐 [OAUTH CALLBACK] Processing callback:', { code: !!code, error, next })

        // Handle OAuth errors
        if (error) {
          console.error('🔐 [OAUTH CALLBACK] OAuth error:', error)
          setError(error)
          setStatus('error')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (!code) {
          console.error('🔐 [OAUTH CALLBACK] No authorization code')
          setError('Missing authorization code')
          setStatus('error')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        const supabase = createClient()
        
        console.log('🔐 [OAUTH CALLBACK] Exchanging code for session...')
        
        // Exchange code for session - this will automatically set cookies and localStorage
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('🔐 [OAUTH CALLBACK] Code exchange failed:', exchangeError)
          setError(exchangeError.message)
          setStatus('error')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (data.user && data.session) {
          console.log('🔐 [OAUTH CALLBACK] Session established successfully:', {
            userId: data.user.id,
            email: data.user.email,
            expires: data.session.expires_at
          })

          // Initialize user credits for new users
          try {
            const { data: existingCredits } = await supabase
              .from('user_credits')
              .select('user_id')
              .eq('user_id', data.user.id)
              .single()

            if (!existingCredits) {
              console.log('🔐 [OAUTH CALLBACK] Initializing credits for new user')
              await supabase
                .from('user_credits')
                .insert({
                  user_id: data.user.id,
                  credits_left: 20,
                  total_earned: 20,
                  total_spent: 0,
                  trial_credits: 20,
                  purchased_credits: 0,
                  daily_usage_count: 0,
                  daily_usage_reset: new Date().toISOString().split('T')[0],
                  tier: 'free',
                })
            }
          } catch (creditsError) {
            console.warn('🔐 [OAUTH CALLBACK] Credits initialization failed:', creditsError)
            // Don't fail the auth flow for credits
          }

          setStatus('success')
          
          // Small delay to ensure session is fully established
          setTimeout(() => {
            console.log('🔐 [OAUTH CALLBACK] Redirecting to:', next)
            router.replace(next)
          }, 500)
        } else {
          console.error('🔐 [OAUTH CALLBACK] No user or session in response')
          setError('Authentication failed')
          setStatus('error')
          setTimeout(() => router.push('/login'), 3000)
        }
      } catch (err) {
        console.error('🔐 [OAUTH CALLBACK] Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-workspace-canvas">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent-brand" />
          <h2 className="text-lg font-semibold text-primary mb-2">Completing sign-in...</h2>
          <p className="text-muted">Please wait while we set up your workspace</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-workspace-canvas">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <h2 className="text-lg font-semibold text-primary mb-2">Authentication Failed</h2>
          <p className="text-muted mb-4">{error}</p>
          <p className="text-sm text-muted">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-workspace-canvas">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-primary mb-2">Welcome to Prismy!</h2>
          <p className="text-muted">Taking you to your workspace...</p>
        </div>
      </div>
    )
  }

  return null
}