'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function QuickAuthDebug() {
  const [results, setResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addLog = (msg: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const testSupabase = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Environment
    addLog(`ENV Check - URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`)
    addLog(`ENV Check - Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`)

    // Test 2: Client creation
    try {
      const supabase = createClient()
      addLog('✅ Supabase client created successfully')

      // Test 3: Basic connection
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        addLog(`❌ Auth connection failed: ${error.message}`)
        addLog(`❌ Error status: ${error.status}`)
      } else {
        addLog('✅ Auth connection successful')
      }

      // Test 4: Test signup
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'test@invalid-domain-12345.com',
        password: 'TestPassword123!',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signupError) {
        addLog(`Signup test result: ${signupError.status} - ${signupError.message}`)
        if (signupError.status === 400) {
          addLog('🚨 400 ERROR: Invalid Supabase configuration!')
        } else if (signupError.status === 422) {
          addLog('⚠️ 422 ERROR: Auth settings issue')
        } else {
          addLog(`✅ Signup endpoint working (expected error for test email)`)
        }
      } else {
        addLog('⚠️ Signup succeeded with test email (unexpected)')
      }

    } catch (err: any) {
      addLog(`❌ Client creation failed: ${err.message}`)
    }

    setIsRunning(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Auth Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={testSupabase} disabled={isRunning} size="sm" className="w-full">
            {isRunning ? 'Testing...' : 'Test Supabase Auth'}
          </Button>
          
          {results.length > 0 && (
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto">
              {results.map((result, i) => (
                <div key={i}>{result}</div>
              ))}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            🔍 This will test your Supabase configuration and show what's failing.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}