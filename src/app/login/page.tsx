'use client'

import { useState } from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import Link from 'next/link'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              P
            </div>
            <span className="text-2xl font-bold">Prismy</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Professional document translation platform
          </p>
        </div>

        {/* Auth Form */}
        <AuthForm mode={mode} onModeChange={setMode} />

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}