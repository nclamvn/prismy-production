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
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Menu, X, Loader2 } from 'lucide-react'

interface MarketingLayoutProps {
  children: React.ReactNode
}

/**
 * Marketing Layout - NotebookML inspired
 * Clean, minimal, content-focused design
 */
export function MarketingLayout({ children }: MarketingLayoutProps) {
  const { user, signInWithGoogle, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const { error } = await signInWithGoogle('/app')
      if (error) {
        console.error('Google sign-in error:', error)
        // Handle error (could show toast or alert)
      }
      // Note: If successful, user will be redirected to Google, then back to /app
    } catch (err) {
      console.error('Google sign-in failed:', err)
    } finally {
      // Reset loading state after a timeout to handle redirect cases
      setTimeout(() => setGoogleLoading(false), 3000)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    router.push('/app')
  }

  return (
    <div className="min-h-screen bg-workspace-canvas">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-workspace-canvas/80 backdrop-blur">
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="currentColor"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="currentColor"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="currentColor"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  Google
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="w-full"
                    >
                      {googleLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="currentColor"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="currentColor"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="currentColor"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                      Google
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
