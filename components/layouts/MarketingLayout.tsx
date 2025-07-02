'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { UserMenu } from '@/components/auth/UserMenu'
import { AuthModal } from '@/components/auth/AuthModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { Logo } from '@/components/ui/Logo'
import { useI18n } from '@/hooks/useI18n'
import { getBrowserClient } from '@/lib/supabase-browser'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { t } = useI18n()

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [mounted])

  const handleGetStarted = () => {
    if (user) {
      router.push('/app')
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
    router.push('/app')
  }

  return (
    <div className="min-h-screen bg-workspace-canvas">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-workspace-canvas/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center">
            <Link href="/">
              <Logo size={24} showText={true} textSize="md" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#features" // eslint-disable-line no-restricted-syntax
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language selector */}
            <LanguageSelector />
            
            {/* Theme toggle */}
            <ThemeToggle />

            {user ? (
              <>
                <Link href="/app">
                  <Button variant="outline" size="sm">
                    {t('auth.workspace')}
                  </Button>
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleSignIn}>
                  {t('auth.sign_in')}
                </Button>
                <Button size="sm" onClick={handleGetStarted}>
                  {t('auth.create_account')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            <LanguageSelector />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-workspace-border bg-workspace-canvas/95 backdrop-blur">
            <div className="px-4 py-6 space-y-4">
              <nav className="flex flex-col space-y-4">
                <a
                  href="#features"
                  className="text-secondary hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-secondary hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="/demo"
                  className="text-secondary hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Demo
                </a>
              </nav>

              <div className="flex flex-col space-y-3 pt-4 border-t border-workspace-border">
                {user ? (
                  <Link href="/app">
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      {t('auth.workspace')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleSignIn} className="w-full">
                      {t('auth.sign_in')}
                    </Button>
                    <Button size="sm" onClick={handleGetStarted} className="w-full">
                      {t('auth.create_account')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-workspace-canvas border-t border-workspace-border">
        <div className="container-content py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
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
