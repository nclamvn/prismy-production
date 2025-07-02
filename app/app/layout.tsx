'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/auth/UserMenu'
import { Logo } from '@/components/ui/Logo'

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
            <Logo size={24} textSize="sm" className="text-sm" />
          </div>

          <div className="flex items-center space-x-3">
            {user && <UserMenu />}
          </div>
        </div>
      </header>

      {/* App Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
