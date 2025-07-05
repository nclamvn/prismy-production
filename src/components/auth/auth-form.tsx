'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onModeChange: (mode: 'login' | 'signup') => void
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Enhanced validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address' })
        setLoading(false)
        return
      }

      if (password.length < 8) {
        setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
        setLoading(false)
        return
      }

      const redirectUrl = `${window.location.origin}/auth/callback`
      
      if (mode === 'signup') {
        console.log('🔧 DEBUG: Signup attempt:', {
          email: email,
          passwordLength: password.length,
          redirectUrl: redirectUrl,
          origin: window.location.origin
        })

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })

        console.log('🔧 DEBUG: Supabase response:', { data, error })

        if (error) {
          console.error('🚨 Supabase signup error:', {
            message: error.message,
            status: error.status,
            code: error.code || 'unknown',
            details: error
          })
          
          // Enhanced error messages based on common 422 causes
          let userMessage = error.message
          if (error.message?.includes('Invalid email') || error.message?.includes('invalid_email')) {
            userMessage = 'Invalid email address format. Please check and try again.'
          } else if (error.message?.includes('password') || error.message?.includes('Password')) {
            userMessage = 'Password does not meet requirements. Try a stronger password with 8+ characters.'
          } else if (error.message?.includes('redirect') || error.message?.includes('invalid_redirect_url')) {
            userMessage = 'Authentication configuration error. Please contact support.'
          } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
            userMessage = 'Too many attempts. Please wait a few minutes and try again.'
          } else if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
            userMessage = 'Email already registered. Try signing in instead.'
          }
          
          setMessage({ type: 'error', text: userMessage })
        } else {
          console.log('✅ Signup successful:', data)
          setMessage({
            type: 'success',
            text: 'Check your email for the confirmation link!',
          })
        }
      } else {
        console.log('🔧 DEBUG: Login attempt:', { email })
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        console.log('🔧 DEBUG: Login response:', { data, error })

        if (error) {
          console.error('🚨 Supabase login error:', error)
          setMessage({ type: 'error', text: error.message })
        } else {
          console.log('✅ Login successful, redirecting...')
          window.location.href = '/app'
        }
      }
    } catch (err) {
      console.error('🚨 Unexpected error:', err)
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Enter your credentials to access your account'
            : 'Enter your email and password to get started'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? 'Loading...'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </Button>
        </form>

        <Separator className="my-6" />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              type="button"
              onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
              className="font-medium text-primary hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}