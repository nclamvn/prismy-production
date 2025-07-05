'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning' | 'loading'
  message: string
  details?: any
}

export function SupabaseDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result])
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Environment Variables
    addResult({
      test: 'Environment Variables',
      status: 'loading',
      message: 'Checking Supabase configuration...'
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      addResult({
        test: 'Environment Variables',
        status: 'error',
        message: 'Missing Supabase environment variables',
        details: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'Set' : 'Missing'
        }
      })
      setIsRunning(false)
      return
    }

    addResult({
      test: 'Environment Variables',
      status: 'success',
      message: 'Environment variables are configured',
      details: {
        url: `${supabaseUrl.substring(0, 20)}...`,
        key: `${supabaseKey.substring(0, 20)}...`
      }
    })

    // Test 2: Supabase Client Creation
    addResult({
      test: 'Client Creation',
      status: 'loading',
      message: 'Testing Supabase client initialization...'
    })

    try {
      const supabase = createClient()
      addResult({
        test: 'Client Creation',
        status: 'success',
        message: 'Supabase client created successfully'
      })

      // Test 3: Basic Connection
      addResult({
        test: 'Connection Test',
        status: 'loading',
        message: 'Testing connection to Supabase...'
      })

      try {
        // Test basic connection with auth endpoint
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          addResult({
            test: 'Connection Test',
            status: 'error',
            message: 'Failed to connect to Supabase auth',
            details: {
              error: error.message,
              code: error.code || 'unknown'
            }
          })
        } else {
          addResult({
            test: 'Connection Test',
            status: 'success',
            message: 'Successfully connected to Supabase auth'
          })
        }
      } catch (connError: any) {
        addResult({
          test: 'Connection Test',
          status: 'error',
          message: 'Network error connecting to Supabase',
          details: {
            error: connError.message,
            stack: connError.stack?.split('\n')[0]
          }
        })
      }

      // Test 4: Test Signup (with fake email)
      addResult({
        test: 'Signup Test',
        status: 'loading',
        message: 'Testing signup endpoint...'
      })

      try {
        // Use a deliberately invalid email to test the endpoint response
        const { data, error } = await supabase.auth.signUp({
          email: 'test-diagnostic@invalid-domain-12345.com',
          password: 'TestPassword123!',
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })

        if (error) {
          // Expected - we're using an invalid email
          if (error.message.includes('invalid') || error.message.includes('domain')) {
            addResult({
              test: 'Signup Test',
              status: 'success',
              message: 'Signup endpoint is working (rejected invalid email as expected)',
              details: { error: error.message }
            })
          } else if (error.status === 422) {
            addResult({
              test: 'Signup Test',
              status: 'warning',
              message: 'Signup endpoint returned 422 - configuration issue',
              details: {
                error: error.message,
                status: error.status,
                possibleCauses: [
                  'Email domain restrictions',
                  'Password policy violations',
                  'Invalid redirect URL',
                  'Email provider disabled'
                ]
              }
            })
          } else if (error.status === 400) {
            addResult({
              test: 'Signup Test',
              status: 'error',
              message: 'Signup endpoint returned 400 - bad request',
              details: {
                error: error.message,
                status: error.status,
                possibleCauses: [
                  'Invalid Supabase URL or API key',
                  'Malformed request',
                  'Missing required fields'
                ]
              }
            })
          } else {
            addResult({
              test: 'Signup Test',
              status: 'error',
              message: `Signup failed with status ${error.status}`,
              details: error
            })
          }
        } else {
          addResult({
            test: 'Signup Test',
            status: 'warning',
            message: 'Signup succeeded with test email (unexpected)',
            details: data
          })
        }
      } catch (signupError: any) {
        addResult({
          test: 'Signup Test',
          status: 'error',
          message: 'Network error during signup test',
          details: {
            error: signupError.message,
            stack: signupError.stack?.split('\n')[0]
          }
        })
      }

    } catch (clientError: any) {
      addResult({
        test: 'Client Creation',
        status: 'error',
        message: 'Failed to create Supabase client',
        details: {
          error: clientError.message,
          stack: clientError.stack?.split('\n')[0]
        }
      })
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="opacity-50 hover:opacity-100"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Supabase Diagnostics
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Supabase Diagnostics</CardTitle>
              <CardDescription className="text-xs">
                Debug authentication issues
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            size="sm"
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(result.status)}
                    <span className="text-xs font-medium">{result.test}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {result.message}
                  </p>
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Details
                      </summary>
                      <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}