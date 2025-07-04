'use client'

import { useState } from 'react'
import { AuthForm } from '@/components/auth/auth-form'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Prismy v2</h1>
          <p className="text-muted-foreground mt-2">
            Modern document translation platform
          </p>
        </div>
        
        <AuthForm mode={mode} onModeChange={setMode} />
        
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Email-first authentication</span>
          </div>
        </div>
      </div>
    </div>
  )
}