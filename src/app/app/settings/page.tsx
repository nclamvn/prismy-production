'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useSupabase } from '@/hooks/use-supabase'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Palette,
  CreditCard,
  Download,
  Trash2
} from 'lucide-react'

export default function SettingsPage() {
  const { user, supabase } = useSupabase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-mono">{user?.id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Member Since</label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <Button variant="outline">Update Profile</Button>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Configure your language preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Interface Language</label>
                <div className="flex gap-2">
                  <Badge variant="default">Vietnamese</Badge>
                  <Badge variant="outline">English</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Translation Direction</label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">Vietnamese → English</p>
                </div>
              </div>

              <Button variant="outline">Change Language Settings</Button>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme</label>
                <div className="flex gap-2">
                  <Badge variant="default">Light</Badge>
                  <Badge variant="outline">Dark</Badge>
                  <Badge variant="outline">Auto</Badge>
                </div>
              </div>

              <Button variant="outline">Customize Theme</Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Button variant="outline">Change Password</Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Two-Factor Authentication</label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Not enabled</p>
                  <Button variant="outline" size="sm">Enable 2FA</Button>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <Button variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email notifications</span>
                <Badge variant="outline">On</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Translation updates</span>
                <Badge variant="outline">On</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Weekly summary</span>
                <Badge variant="outline">Off</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Manage Notifications
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <Badge variant="default" className="mb-2">Free Plan</Badge>
                <p className="text-sm text-muted-foreground">
                  50 documents/month
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Download your data and documents
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Export Data
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
              <Button variant="destructive" size="sm" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}