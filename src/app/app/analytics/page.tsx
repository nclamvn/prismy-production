import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Users, Shield } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has admin privileges (in a real app, this would be in a user_roles table)
  const isAdmin = user.email?.includes('admin') || false

  // Get user profile for additional context
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <AppLayout userEmail={user.email}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Track your usage patterns and system performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin View
              </Badge>
            )}
            <Badge variant="secondary">Beta</Badge>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Usage Metrics
              </CardTitle>
              <CardDescription>
                Track your document uploads, translations, and storage usage over time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Performance Insights
              </CardTitle>
              <CardDescription>
                Monitor translation speed, popular languages, and processing trends
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Activity Overview
              </CardTitle>
              <CardDescription>
                View your activity patterns and discover optimization opportunities
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard userId={user.id} isAdmin={isAdmin} />

        {/* Additional Info for New Users */}
        {userProfile && new Date(userProfile.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-muted-foreground">
                  <strong>Welcome!</strong> Your analytics will become more detailed as you use the platform. 
                  Upload some documents and create translations to see your personal metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}