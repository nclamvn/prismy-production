'use client'

import { useSupabase } from '@/hooks/use-supabase'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ErrorBoundary from '@/components/error-boundary'
import { FullPageLoading } from '@/components/loading-spinner'
import Link from 'next/link'

interface AppLayoutWrapperProps {
  children: React.ReactNode
}

export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const { user, loading, supabase } = useSupabase()

  if (loading) {
    return <FullPageLoading message="Loading workspace..." />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <AppLayout userEmail={user.email}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </AppLayout>
    </ErrorBoundary>
  )
}