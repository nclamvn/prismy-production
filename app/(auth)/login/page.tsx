import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Prismy',
  description:
    'Sign in to access your AI-powered document translation workspace',
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AuthLayout />
    </Suspense>
  )
}
