'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/auth/UserMenu'
import BrandLogo from '@/components/ui/BrandLogo'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <div className="h-screen flex flex-col bg-canvas">
      {/* App Header */}
      <header className="bg-canvas border-b border-muted">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-5 w-5 text-secondary hover:text-primary transition-colors" />
            </Link>
            <BrandLogo size={24} showText={true} linkHref="" />
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
