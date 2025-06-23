'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'

export default function EnvDebugPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  // Single Supabase client instance for the entire component
  const supabase = createClientComponentClient()

  const runEnvironmentTests = async () => {
    const results: Record<string, any> = {}

    // Check environment variables
    results.environment = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      origin: window.location.origin,
    }

    // Test Supabase connection
    try {
      const { data, error } = await supabase.auth.getSession()

      results.supabaseConnection = {
        connected: !error,
        error: error?.message,
        hasSession: !!data.session,
        userId: data.session?.user?.id,
      }
    } catch (err: any) {
      results.supabaseConnection = {
        connected: false,
        error: err.message,
      }
    }

    // Test OAuth configuration
    try {
      // This will show us the actual callback URL being generated
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('redirectTo', '/workspace')

      results.oauthConfig = {
        callbackUrl: callbackUrl.toString(),
        origin: window.location.origin,
        domain: window.location.hostname,
      }
    } catch (err: any) {
      results.oauthConfig = {
        error: err.message,
      }
    }

    // Test current auth state
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      results.currentAuth = {
        authenticated: !!user,
        userId: user?.id,
        email: user?.email,
        provider: user?.app_metadata?.provider,
      }
    } catch (err: any) {
      results.currentAuth = {
        error: err.message,
      }
    }

    setTestResults(results)
  }

  const testGoogleOAuth = async () => {
    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('redirectTo', '/debug/env')

      console.log(
        '🚀 Testing Google OAuth with callback:',
        callbackUrl.toString()
      )

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        console.error('❌ Google OAuth test error:', error)
        alert(`OAuth Error: ${error.message}`)
      }
    } catch (err: any) {
      console.error('❌ Critical OAuth error:', err)
      alert(`Critical Error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">
            🔧 Prismy Environment Debug
          </h1>

          <div className="space-y-4 mb-6">
            <button
              onClick={runEnvironmentTests}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔍 Run Environment Tests
            </button>

            <button
              onClick={testGoogleOAuth}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-4"
            >
              🧪 Test Google OAuth
            </button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Test Results:</h2>

              {Object.entries(testResults).map(([category, data]) => (
                <div key={category} className="border rounded p-4">
                  <h3 className="font-semibold text-lg mb-2 capitalize">
                    {category.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              ))}

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  📋 Troubleshooting Checklist:
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>✅ Supabase URL should match your project URL</li>
                  <li>✅ Callback URL should include current domain</li>
                  <li>
                    ✅ Check if Supabase allows this domain in redirect URLs
                  </li>
                  <li>
                    ✅ Verify Google OAuth is configured in Supabase dashboard
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">
              🔍 Console Debug Commands:
            </h3>
            <code className="text-sm text-blue-700">
              __prismyAuthDebug.getEvents() // Get auth debug events
              <br />
              __prismyAuthDebug.getReport() // Get full debug report
              <br />
              __prismyAuthDebug.copy() // Copy report to clipboard
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
