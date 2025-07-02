'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/auth/UserMenu'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  return (
    <div className="h-screen flex flex-col bg-canvas">
      {/* App Header */}
      <header className="bg-surface border-b border-muted px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-5 w-5 text-secondary hover:text-primary transition-colors" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-accent-brand rounded flex items-center justify-center">
                <span className="text-white font-semibold text-xs">P</span>
              </div>
              <span className="text-sm font-semibold text-primary">Prismy Workspace</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user && <UserMenu />}
          </div>
        </div>
      </header>
      
      {/* App Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
