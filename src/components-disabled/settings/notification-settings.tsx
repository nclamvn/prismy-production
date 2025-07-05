'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle, Loader2, Bell, Mail, MessageSquare } from 'lucide-react'

interface UserSettings {
  user_id: string
  enable_notifications: boolean
  email_notifications: boolean
  push_notifications: boolean
  notification_frequency: string
  created_at: string
  updated_at: string
}

interface NotificationSettingsProps {
  userId: string
  settings: UserSettings | null
}

export function NotificationSettings({ userId, settings }: NotificationSettingsProps) {
  const [formData, setFormData] = useState({
    enableNotifications: settings?.enable_notifications ?? true,
    emailNotifications: settings?.email_notifications ?? true,
    pushNotifications: settings?.push_notifications ?? false,
    notificationFrequency: settings?.notification_frequency || 'immediate'
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      const notificationData = {
        user_id: userId,
        enable_notifications: formData.enableNotifications,
        email_notifications: formData.emailNotifications,
        push_notifications: formData.pushNotifications,
        notification_frequency: formData.notificationFrequency,
        updated_at: new Date().toISOString()
      }

      let error

      if (settings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('user_settings')
          .update(notificationData)
          .eq('user_id', userId)
        error = updateError
      } else {
        // Create new settings
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            ...notificationData,
            created_at: new Date().toISOString()
          })
        error = insertError
      }

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Notification settings updated successfully!' })
      }
    } catch {
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const notificationTypes = [
    {
      id: 'translation_complete',
      title: 'Translation Completed',
      description: 'When your document translation is finished',
      enabled: true
    },
    {
      id: 'upload_complete',
      title: 'Upload Completed', 
      description: 'When your document upload is successful',
      enabled: true
    },
    {
      id: 'translation_failed',
      title: 'Translation Failed',
      description: 'When a translation encounters an error',
      enabled: true
    },
    {
      id: 'weekly_summary',
      title: 'Weekly Summary',
      description: 'Weekly report of your translation activity',
      enabled: false
    }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Master Notification Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <Label className="text-base font-medium">Enable Notifications</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Master switch for all notification types
          </p>
        </div>
        <Switch
          checked={formData.enableNotifications}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableNotifications: checked }))}
        />
      </div>

      {/* Notification Channels */}
      {formData.enableNotifications && (
        <div className="space-y-4">
          <h4 className="font-medium">Notification Channels</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Browser push notifications (coming soon)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Soon</Badge>
                <Switch
                  checked={formData.pushNotifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pushNotifications: checked }))}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Frequency */}
      {formData.enableNotifications && (
        <div className="space-y-2">
          <Label>Notification Frequency</Label>
          <Select 
            value={formData.notificationFrequency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, notificationFrequency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="hourly">Hourly Digest</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Digest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notification Types */}
      {formData.enableNotifications && (
        <div className="space-y-4">
          <h4 className="font-medium">Notification Types</h4>
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between">
                <div>
                  <Label>{type.title}</Label>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
                <Switch
                  checked={type.enabled}
                  disabled={!type.enabled}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {formData.enableNotifications && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium">Notification Preview</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• You will receive notifications via: {
              [
                formData.emailNotifications && 'Email',
                formData.pushNotifications && 'Push'
              ].filter(Boolean).join(', ') || 'None selected'
            }</p>
            <p>• Frequency: {formData.notificationFrequency}</p>
            <p>• Active types: Translation completed, Upload completed, Translation failed</p>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          'Save Notification Settings'
        )}
      </Button>
    </form>
  )
}