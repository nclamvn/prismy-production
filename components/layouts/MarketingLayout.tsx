'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { UserMenu } from '@/components/auth/UserMenu'
import { AuthModal } from '@/components/auth/AuthModal'
import { getBrowserClient } from '@/lib/supabase-browser'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface MarketingLayoutProps {
  children: React.ReactNode
}

/**
 * Marketing Layout - NotebookML inspired
 * Clean, minimal, content-focused design
 */
export function MarketingLayout({ children }: MarketingLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const supabase = getBrowserClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [mounted])

  const handleGetStarted = () => {
    if (user) {
      router.push('/workspace')
    } else {
      setAuthMode('signup')
      setShowAuthModal(true)
    }
  }

  const handleSignIn = () => {
    setAuthMode('signin')
    setShowAuthModal(true)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    router.push('/workspace')
  }

  return (
    <div className="min-h-screen bg-default">
      {/* Header */}
      <header className="bg-surface border-b border-muted">
        <div className="container-content py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent-brand rounded-md flex items-center justify-center">
                <span className="text-white font-semibold text-sm">P</span>
              </div>
              <span className="text-lg font-semibold text-primary">Prismy</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="#features"
                className="text-secondary hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-secondary hover:text-primary transition-colors"
              >
                Pricing
              </a>
              <a
                href="/demo"
                className="text-secondary hover:text-primary transition-colors"
              >
                Demo
              </a>
            </nav>

            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Link href="/workspace">
                    <Button variant="outline" size="sm">
                      Workspace
                    </Button>
                  </Link>
                  <UserMenu />
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSignIn}
                  >
                    Sign In
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-surface border-t border-muted">
        <div className="container-content py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-accent-brand rounded flex items-center justify-center">
                <span className="text-white font-semibold text-xs">P</span>
              </div>
              <span className="text-sm text-muted">
                © 2024 Prismy. Enterprise Document Processing.
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="/privacy"
                className="text-xs text-muted hover:text-secondary transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-xs text-muted hover:text-secondary transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        mode={authMode}
      />
    </div>
  )
}