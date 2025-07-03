'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function GoogleButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const _router = useRouter()
  const { signInWithGoogle } = useAuth()

  // 🎯 Note: Auth code detection moved to AuthLayout to ensure it works regardless of active tab

  const handleGoogleSignIn = async () => {
    console.log('🚨 [GOOGLE OAUTH] Button clicked, starting OAuth flow...')
    setIsLoading(true)
    setError(null)

    // 🎯 SAFETY: Auto-reset loading after 10 seconds to prevent stuck state
    const loadingTimeout = setTimeout(() => {
      console.log('🚨 [GOOGLE OAUTH] Timeout reached, resetting loading state')
      setIsLoading(false)
      setError('OAuth timeout - please try again')
    }, 10000)

    try {
      // Get the intended redirect URL from search params or default to /app
      const redirectTo = searchParams.get('next') || '/app'

      console.log('🚨 [GOOGLE OAUTH] Initiating OAuth flow:', {
        timestamp: new Date().toISOString(),
        redirectTo,
        windowOrigin: window.location.origin,
        windowHref: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries()),
      })

      const { error } = await signInWithGoogle(redirectTo)

      if (error) {
        throw error
      }

      console.log(
        '🚨 [GOOGLE OAUTH] OAuth initiated successfully, should redirect to Google...'
      )

      // Clear timeout since OAuth call succeeded
      clearTimeout(loadingTimeout)

      // Note: User should be redirected to Google at this point
      // If we reach here without redirect, something is wrong
      setTimeout(() => {
        console.log(
          '🚨 [GOOGLE OAUTH] WARNING: No redirect occurred after OAuth call'
        )
        setIsLoading(false)
        setError('OAuth did not redirect - please try again')
      }, 3000)
    } catch (err) {
      console.error('🚨 [GOOGLE OAUTH] Error during OAuth initiation:', err)
      clearTimeout(loadingTimeout)

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to sign in with Google'
      setError(errorMessage)
      toast.error('Google sign-in failed', {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        variant="outline"
        className="w-full h-12 border-gray-300 hover:bg-gray-50 focus:ring-gray-500"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
        ) : (
          <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="currentColor"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="currentColor"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="currentColor"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="currentColor"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      <div className="text-center space-y-2">
        <p className="text-xs text-gray-500">
          Sign in securely with your Google account
        </p>
        <p className="text-xs text-gray-400">
          We'll never post to your Google account without permission
        </p>
      </div>
    </div>
  )
}
