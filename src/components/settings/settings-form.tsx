'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { TranslationWorker } from '@/lib/translation/worker'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface UserSettings {
  user_id: string
  default_source_language: string
  default_target_language: string
  auto_detect_language: boolean
  save_translation_history: boolean
  enable_notifications: boolean
  created_at: string
  updated_at: string
}

interface SettingsFormProps {
  userId: string
  settings: UserSettings | null
}

export function SettingsForm({ userId, settings }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    defaultSourceLanguage: settings?.default_source_language || 'auto',
    defaultTargetLanguage: settings?.default_target_language || 'vi',
    autoDetectLanguage: settings?.auto_detect_language ?? true,
    saveTranslationHistory: settings?.save_translation_history ?? true,
    enableNotifications: settings?.enable_notifications ?? true
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supportedLanguages = TranslationWorker.getSupportedLanguages()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      const settingsData = {
        user_id: userId,
        default_source_language: formData.defaultSourceLanguage,
        default_target_language: formData.defaultTargetLanguage,
        auto_detect_language: formData.autoDetectLanguage,
        save_translation_history: formData.saveTranslationHistory,
        enable_notifications: formData.enableNotifications,
        updated_at: new Date().toISOString()
      }

      let error

      if (settings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', userId)
        error = updateError
      } else {
        // Create new settings
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            ...settingsData,
            created_at: new Date().toISOString()
          })
        error = insertError
      }

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Settings updated successfully!' })
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Default Source Language */}
        <div className="space-y-2">
          <Label htmlFor="sourceLanguage">Default Source Language</Label>
          <Select 
            value={formData.defaultSourceLanguage}
            onValueChange={(value) => setFormData(prev => ({ ...prev, defaultSourceLanguage: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>Auto-detect</span>
                </div>
              </SelectItem>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Target Language */}
        <div className="space-y-2">
          <Label htmlFor="targetLanguage">Default Target Language</Label>
          <Select 
            value={formData.defaultTargetLanguage}
            onValueChange={(value) => setFormData(prev => ({ ...prev, defaultTargetLanguage: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-detect Language</Label>
            <p className="text-sm text-muted-foreground">
              Automatically detect the source language of uploaded documents
            </p>
          </div>
          <Switch
            checked={formData.autoDetectLanguage}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoDetectLanguage: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Save Translation History</Label>
            <p className="text-sm text-muted-foreground">
              Keep a record of all your translations for easy access
            </p>
          </div>
          <Switch
            checked={formData.saveTranslationHistory}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveTranslationHistory: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications when translations are completed
            </p>
          </div>
          <Switch
            checked={formData.enableNotifications}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableNotifications: checked }))}
          />
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium">Current Settings Summary</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            • Default translation: {formData.defaultSourceLanguage === 'auto' ? 'Auto-detect' : 
              supportedLanguages.find(l => l.code === formData.defaultSourceLanguage)?.name} → {
              supportedLanguages.find(l => l.code === formData.defaultTargetLanguage)?.name}
          </p>
          <p>• Auto-detection: {formData.autoDetectLanguage ? 'Enabled' : 'Disabled'}</p>
          <p>• History saving: {formData.saveTranslationHistory ? 'Enabled' : 'Disabled'}</p>
          <p>• Notifications: {formData.enableNotifications ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>

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
          'Save Preferences'
        )}
      </Button>
    </form>
  )
}