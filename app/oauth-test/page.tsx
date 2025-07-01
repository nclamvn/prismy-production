'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

// 🧪 MINIMAL OAUTH TEST PAGE
// This page tests OAuth flow in isolation without middleware or other complexity

export default function OAuthTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setSupabase(createClient())
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry)
    setLogs(prev => [...prev, logEntry])
  }

  useEffect(() => {
    if (!isMounted || !supabase) return
    
    addLog('🧪 OAuth Test Page initialized')
    addLog(`URL: ${window.location.href}`)
    addLog(`Supabase URL: ${supabase.supabaseUrl}`)
    
    // Check for auth code in URL
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    
    if (code) {
      addLog(`✅ Auth code detected: ${code.substring(0, 20)}...`)
      handleAuthCodeExchange(code)
    } else if (error) {
      addLog(`❌ OAuth error detected: ${error}`)
    }
  }, [isMounted, supabase])

  const handleAuthCodeExchange = async (code: string) => {
    if (!supabase) {
      addLog('❌ Supabase client not available')
      return
    }
    
    addLog('🔄 Starting code exchange...')
    
    try {
      // Test 1: Try to get existing session first
      const { data: sessionData } = await supabase.auth.getSession()
      addLog(`Current session: ${sessionData.session ? 'EXISTS' : 'NONE'}`)
      
      if (sessionData.session) {
        addLog(`✅ User already authenticated: ${sessionData.session.user.email}`)
        return
      }
      
      // Test 2: Try code exchange
      addLog('🔄 Attempting code exchange...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        addLog(`❌ Code exchange failed: ${error.message}`)
        
        // Test 3: Check cookies for code verifier
        const cookies = document.cookie.split(';').map(c => c.trim())
        const authCookies = cookies.filter(c => 
          c.includes('code-verifier') || 
          c.includes('sb-') || 
          c.includes('supabase')
        )
        addLog(`🍪 Found ${authCookies.length} potential auth cookies:`)
        authCookies.forEach(cookie => {
          const [name] = cookie.split('=')
          addLog(`  - ${name}`)
        })
        
        return
      }
      
      if (data.user) {
        addLog(`✅ Code exchange successful: ${data.user.email}`)
        addLog(`User ID: ${data.user.id}`)
      }
      
    } catch (err) {
      addLog(`💥 Exchange exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const startOAuthFlow = async () => {
    if (!supabase || !isMounted) {
      addLog('❌ Cannot start OAuth flow - client not ready')
      return
    }
    
    addLog('🚀 Starting OAuth flow...')
    setIsLoading(true)
    
    try {
      // Clear previous logs related to OAuth
      setLogs(prev => prev.filter(log => !log.includes('🚀') && !log.includes('🔄')))
      addLog('🚀 Starting fresh OAuth flow...')
      
      // Test: Manual PKCE generation to see if we can control it
      addLog('🔧 Testing PKCE generation...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth-test`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        addLog(`❌ OAuth initiation failed: ${error.message}`)
      } else {
        addLog(`✅ OAuth initiation successful`)
        addLog(`Redirect URL: ${data.url || 'No URL returned'}`)
      }
      
    } catch (err) {
      addLog(`💥 OAuth initiation exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    
    setIsLoading(false)
  }

  const testCookieAccess = () => {
    if (!isMounted) {
      addLog('❌ Cannot test cookies - not mounted')
      return
    }
    
    addLog('🍪 Testing cookie access...')
    
    // Test cookie setting
    document.cookie = 'test-cookie=test-value; path=/; secure; samesite=none'
    addLog('✅ Test cookie set with SameSite=None')
    
    // Read all cookies
    const cookies = document.cookie.split(';').map(c => c.trim())
    addLog(`Total cookies: ${cookies.length}`)
    
    cookies.forEach(cookie => {
      const [name, value] = cookie.split('=')
      if (name.includes('test') || name.includes('sb-') || name.includes('supabase')) {
        addLog(`  ${name}: ${value?.substring(0, 20)}...`)
      }
    })
  }

  const clearLogs = () => {
    setLogs([])
    addLog('🧹 Logs cleared')
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading OAuth Test Lab...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🧪 OAuth Flow Test Lab</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
              
              <div className="space-y-3">
                <button
                  onClick={startOAuthFlow}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '🔄 Processing...' : '🚀 Start OAuth Flow'}
                </button>
                
                <button
                  onClick={testCookieAccess}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  🍪 Test Cookie Access
                </button>
                
                <button
                  onClick={clearLogs}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  🧹 Clear Logs
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
              <div className="text-sm space-y-2">
                <div><strong>URL:</strong> {window.location.href}</div>
                <div><strong>User Agent:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</div>
                <div><strong>Cookies Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}</div>
                <div><strong>Supabase Ready:</strong> {supabase ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
          
          {/* Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Live Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">Waiting for logs...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}