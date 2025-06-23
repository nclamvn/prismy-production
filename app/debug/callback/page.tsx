'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CallbackDebugContent() {
  const searchParams = useSearchParams()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const params = {
      code: searchParams.get('code'),
      error: searchParams.get('error'),
      error_description: searchParams.get('error_description'),
      redirectTo: searchParams.get('redirectTo'),
      redirect_to: searchParams.get('redirect_to'),
      state: searchParams.get('state'),
      all_params: Object.fromEntries(searchParams.entries()),
    }

    const info = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      params,
      userAgent: navigator.userAgent,
    }

    setDebugInfo(info)

    // Log to console for easy copying
    console.log('🔍 Callback Debug Info:', info)

    // Store in session for later analysis
    sessionStorage.setItem('callback_debug', JSON.stringify(info))
  }, [searchParams])

  const testActualCallback = () => {
    // Redirect to actual callback route with same params
    const currentUrl = new URL(window.location.href)
    currentUrl.pathname = '/auth/callback'
    window.location.href = currentUrl.toString()
  }

  const copyDebugInfo = () => {
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
    alert('Debug info copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">🔍 OAuth Callback Debug</h1>

          <div className="mb-6 space-x-4">
            <button
              onClick={testActualCallback}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🚀 Test Actual Callback Route
            </button>

            <button
              onClick={copyDebugInfo}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              📋 Copy Debug Info
            </button>
          </div>

          <div className="space-y-6">
            <div className="border rounded p-4">
              <h2 className="text-xl font-semibold mb-4">
                Callback Parameters
              </h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.params || {}, null, 2)}
              </pre>
            </div>

            <div className="border rounded p-4">
              <h2 className="text-xl font-semibold mb-4">Request Info</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(
                  {
                    timestamp: debugInfo.timestamp,
                    url: debugInfo.url,
                    origin: debugInfo.origin,
                    pathname: debugInfo.pathname,
                    search: debugInfo.search,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="border rounded p-4">
              <h2 className="text-xl font-semibold mb-4">Full Debug Info</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">
                📋 Analysis:
              </h3>
              <div className="text-sm text-yellow-700 space-y-2">
                {debugInfo.params?.code ? (
                  <div className="text-green-700">
                    ✅ Authorization code present - OAuth flow initiated
                    successfully
                  </div>
                ) : (
                  <div className="text-red-700">
                    ❌ No authorization code - OAuth flow failed to start
                  </div>
                )}

                {debugInfo.params?.error ? (
                  <div className="text-red-700">
                    ❌ OAuth error: {debugInfo.params.error} -{' '}
                    {debugInfo.params.error_description}
                  </div>
                ) : (
                  <div className="text-green-700">
                    ✅ No OAuth errors reported
                  </div>
                )}

                {debugInfo.params?.redirectTo ||
                debugInfo.params?.redirect_to ? (
                  <div className="text-green-700">
                    ✅ Redirect target specified:{' '}
                    {debugInfo.params?.redirectTo ||
                      debugInfo.params?.redirect_to}
                  </div>
                ) : (
                  <div className="text-yellow-700">
                    ⚠️ No redirect target specified - will use default
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                🔧 Next Steps:
              </h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>
                  If you have a code, test the actual callback route above
                </li>
                <li>If you have an error, check the error description</li>
                <li>
                  If no code or error, OAuth flow didn't initiate properly
                </li>
                <li>
                  Copy debug info and check with Supabase/Google console logs
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CallbackDebugPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mb-4 mx-auto"></div>
            <p>Loading debug info...</p>
          </div>
        </div>
      }
    >
      <CallbackDebugContent />
    </Suspense>
  )
}
