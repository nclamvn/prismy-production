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
    <div className="h-screen flex flex-col">
      {/* WorkspaceLayout handles its own TopBar - removed duplicate header */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
