'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function DebugPage() {
  const { user, session, loading } = useAuth()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Authentication</h1>

      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {loading ? 'true' : 'false'}
        </div>

        <div>
          <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}
        </div>

        <div>
          <strong>Session:</strong>{' '}
          {session ? JSON.stringify(session, null, 2) : 'null'}
        </div>

        <div>
          <strong>Supabase URL:</strong>{' '}
          {process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined'}
        </div>
      </div>
    </div>
  )
}
