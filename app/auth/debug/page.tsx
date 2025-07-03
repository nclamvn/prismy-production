'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function AuthDebug() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const supabase = createClient()
    
    const gatherInfo = async () => {
      try {
        // Check Supabase client
        const supabaseInfo = {
          url: supabase.supabaseUrl,
          key: supabase.supabaseKey.substring(0, 20) + '...',
        }

        // Check current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        // Check user
        const { data: userData, error: userError } = await supabase.auth.getUser()

        // Check environment
        const envInfo = {
          NODE_ENV: process.env.NODE_ENV,
          SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          HAS_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }

        setInfo({
          supabase: supabaseInfo,
          session: sessionData.session ? {
            user_id: sessionData.session.user?.id,
            expires_at: sessionData.session.expires_at,
            has_access_token: !!sessionData.session.access_token,
          } : null,
          sessionError,
          user: userData.user ? {
            id: userData.user.id,
            email: userData.user.email,
          } : null,
          userError,
          environment: envInfo,
          localStorage: typeof window !== 'undefined' ? {
            keys: Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-')),
          } : null,
          cookies: typeof document !== 'undefined' ? {
            all: document.cookie,
          } : null,
        })
      } catch (error) {
        setInfo({ error: error.message })
      }
    }

    gatherInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
        <pre className="bg-white p-4 rounded border overflow-auto text-xs">
          {JSON.stringify(info, null, 2)}
        </pre>
        
        <div className="mt-6 space-y-2">
          <button 
            onClick={() => window.location.href = '/auth/callback?code=test-code&next=/app'}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Test Callback Page
          </button>
          <button 
            onClick={() => window.location.href = '/app'}
            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          >
            Go to App
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}