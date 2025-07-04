import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/settings/settings-form'
import { ProfileForm } from '@/components/settings/profile-form'
import { NotificationSettings } from '@/components/settings/notification-settings'
import { Separator } from '@/components/ui/separator'
import { Settings, User, Bell } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user settings
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <AppLayout userEmail={user.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm 
                user={user} 
                profile={userProfile}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Translation Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Translation Preferences
              </CardTitle>
              <CardDescription>
                Configure your default translation settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm 
                userId={user.id}
                settings={userSettings}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choose what notifications you&apos;d like to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings 
                userId={user.id}
                settings={userSettings}
              />
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Day 6 - Settings & Preferences</span>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}