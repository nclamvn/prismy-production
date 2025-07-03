'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export function AuthDebugPanel() {
  const { user, loading, sessionRestored, session } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [serverAuthState, setServerAuthState] = useState<any>(null)

  useEffect(() => {
    setMounted(true)

    // Delay fetching server-side auth state to avoid race conditions
    const timer = setTimeout(() => {
      // Fetch server-side auth state to compare
      fetch('/api/auth/debug')
        .then(res => res.json())
        .then(data => setServerAuthState(data))
        .catch(err =>
          console.debug('Debug panel: Failed to fetch server auth state:', err)
        )
    }, 1000) // Wait for auth to settle

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return null

  const clientState = {
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    loading,
    sessionRestored,
    hasSession: !!session,
    sessionUserId: session?.user?.id,
    timestamp: new Date().toISOString(),
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-md text-xs z-50 opacity-90 hover:opacity-100">
      <div className="font-bold mb-2">🐛 Auth Debug Panel</div>

      <div className="mb-3">
        <div className="font-semibold text-green-400">Client State:</div>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(clientState, null, 2)}
        </pre>
      </div>

      {serverAuthState && (
        <div className="mb-3">
          <div className="font-semibold text-blue-400">Server State:</div>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(
              {
                hasUser: serverAuthState.auth?.hasUser,
                userEmail: serverAuthState.auth?.userEmail,
                userId: serverAuthState.auth?.userId,
                hasSession: serverAuthState.auth?.hasSession,
                timestamp: serverAuthState.timestamp,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      <div className="text-yellow-400 text-xs mt-2">
        {user
          ? '✅ User authenticated in client'
          : '❌ No user in client context'}
      </div>
    </div>
  )
}
