'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'
import UnifiedUserMenu from '@/components/auth/UnifiedUserMenu'

export type LayoutVariant = 'main' | 'workspace' | 'dashboard' | 'admin' | 'minimal'

export interface LayoutConfig {
  variant: LayoutVariant
  showFooter?: boolean
  showUserMenu?: boolean
  title?: string
  subtitle?: string
}

export interface UnifiedLayoutSimpleProps {
  children: ReactNode
  config: LayoutConfig
  user?: any
}

export default function UnifiedLayoutSimple({ children, config, user }: UnifiedLayoutSimpleProps) {
  const { user: authUser } = useAuth()
  const currentUser = user || authUser

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {/* Header for variants that need it */}
      {(config.variant === 'admin' || config.variant === 'workspace') && (
        <header 
          className="px-4 py-3 lg:px-6 lg:py-4"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderBottom: `1px solid var(--surface-outline)`,
            boxShadow: 'var(--elevation-level-1)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="font-semibold"
                style={{
                  fontSize: 'var(--sys-title-medium-size)',
                  color: 'var(--text-primary)'
                }}
              >
                {config.title || 'Dashboard'}
              </h1>
              {config.subtitle && (
                <p 
                  className="mt-0.5"
                  style={{
                    fontSize: 'var(--sys-body-small-size)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {config.subtitle}
                </p>
              )}
            </div>

            {config.showUserMenu && (
              <UnifiedUserMenu 
                variant="workspace"
                position="bottom-left"
                showSubscriptionTier={true}
                showAdminPanel={true}
              />
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main 
        className="flex-1"
        style={{ backgroundColor: 'var(--surface-panel)' }}
      >
        {children}
      </main>

      {/* Footer */}
      {config.showFooter && <Footer />}
    </div>
  )
}