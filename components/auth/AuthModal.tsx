'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getBrowserClient } from '@/lib/supabase-browser'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  mode?: 'signin' | 'signup'
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  mode = 'signin',
}: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState(mode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAuthMode(mode)
  }, [mode])

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmail('')
      setPassword('')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getBrowserClient()

      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        // Success
        onSuccess?.()
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Success
        onSuccess?.()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface border border-border-default rounded-lg elevation-xl w-full max-w-md p-6 m-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {authMode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-secondary mt-2">
            {authMode === 'signin'
              ? 'Sign in to access your workspace'
              : 'Start your 14-day free trial'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? 'Processing...'
              : authMode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </Button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <p className="text-sm text-secondary">
            {authMode === 'signin'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              onClick={() =>
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
              }
              className="text-accent-brand hover:text-accent-brand-dark font-medium"
              disabled={loading}
            >
              {authMode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Additional info for signup */}
        {authMode === 'signup' && (
          <div className="mt-6 pt-6 border-t border-border-default">
            <div className="text-xs text-muted text-center space-y-1">
              <p>By creating an account, you agree to our</p>
              <p>
                <a href="/terms" className="text-accent-brand hover:underline">
                  Terms of Service
                </a>
                {' and '}
                <a
                  href="/privacy"
                  className="text-accent-brand hover:underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
