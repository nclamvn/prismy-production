/**
 * Admin Settings Panel Component
 * 
 * Provides an interface for administrators to configure system-wide settings
 * including file upload limits, OCR processing, and translation parameters.
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/design-system/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/card'
import { Input } from '@/design-system/components/input'
import { Label } from '@/design-system/components/label'
import { Switch } from '@/design-system/components/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system/components/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/components/tabs'
import { Badge } from '@/design-system/components/badge'
import { Separator } from '@/design-system/components/separator'
import { Alert, AlertDescription } from '@/design-system/components/alert'
import { Spinner } from '@/design-system/components/loading'
import { 
  Settings, 
  Upload, 
  Eye, 
  Languages, 
  Database, 
  Shield, 
  Activity,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import type { SystemSettings } from '@/lib/admin/settings-manager'

interface SettingsPanelProps {
  className?: string
}

export function AdminSettingsPanel({ className = '' }: SettingsPanelProps) {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Load current settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings || !hasChanges) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' })
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings/reset', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await loadSettings()
      setMessage({ type: 'success', text: 'Settings reset to defaults' })
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to reset settings:', error)
      setMessage({ type: 'error', text: 'Failed to reset settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path: string, value: any) => {
    if (!settings) return

    const pathParts = path.split('.')
    const newSettings = { ...settings }
    let current = newSettings as any

    // Navigate to parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {}
      }
      current = current[pathParts[i]]
    }

    // Set the value
    current[pathParts[pathParts.length - 1]] = value
    
    setSettings(newSettings)
    setHasChanges(true)
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  const parseBytes = (value: string, unit: string): number => {
    const num = parseFloat(value)
    switch (unit) {
      case 'KB': return num * 1024
      case 'MB': return num * 1024 * 1024
      case 'GB': return num * 1024 * 1024 * 1024
      default: return num
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
        <span className="ml-2 text-sm text-gray-600">Loading settings...</span>
      </div>
    )
  }

  if (!settings) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load admin settings. Please check your permissions and try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-600">
            Configure file upload limits, processing parameters, and system behavior
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Unsaved Changes
            </Badge>
          )}
          
          <Button
            variant="outline"
            onClick={resetSettings}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </Button>
          
          <Button
            onClick={saveSettings}
            disabled={saving || !hasChanges}
            className="flex items-center space-x-2"
          >
            {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          {message.type === 'error' ? 
            <AlertTriangle className="h-4 w-4 text-red-600" /> : 
            <CheckCircle className="h-4 w-4 text-green-600" />
          }
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="ocr" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>OCR</span>
          </TabsTrigger>
          <TabsTrigger value="translation" className="flex items-center space-x-2">
            <Languages className="h-4 w-4" />
            <span>Translation</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Storage</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* Upload Settings */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>File Upload Configuration</CardTitle>
              <CardDescription>
                Configure file size limits and upload behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Size Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Maximum File Size</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={Math.round(settings.upload.maxFileSize / (1024 * 1024))}
                      onChange={(e) => updateSetting('upload.maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                      className="flex-1"
                    />
                    <Select defaultValue="MB">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB">MB</SelectItem>
                        <SelectItem value="GB">GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Current: {formatBytes(settings.upload.maxFileSize)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFileSizeEdge">Edge Function Limit</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="maxFileSizeEdge"
                      type="number"
                      value={Math.round(settings.upload.maxFileSizeEdge / (1024 * 1024))}
                      onChange={(e) => updateSetting('upload.maxFileSizeEdge', parseInt(e.target.value) * 1024 * 1024)}
                      className="flex-1"
                    />
                    <Select defaultValue="MB">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB">MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Current: {formatBytes(settings.upload.maxFileSizeEdge)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFileSizeQueue">Queue Worker Limit</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="maxFileSizeQueue"
                      type="number"
                      value={Math.round(settings.upload.maxFileSizeQueue / (1024 * 1024))}
                      onChange={(e) => updateSetting('upload.maxFileSizeQueue', parseInt(e.target.value) * 1024 * 1024)}
                      className="flex-1"
                    />
                    <Select defaultValue="MB">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB">MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Current: {formatBytes(settings.upload.maxFileSizeQueue)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Chunked Upload Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chunkedUploadThreshold">Chunked Upload Threshold</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="chunkedUploadThreshold"
                      type="number"
                      value={Math.round(settings.upload.chunkedUploadThreshold / (1024 * 1024))}
                      onChange={(e) => updateSetting('upload.chunkedUploadThreshold', parseInt(e.target.value) * 1024 * 1024)}
                      className="flex-1"
                    />
                    <Select defaultValue="MB">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB">MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Files larger than this will use chunked upload
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultChunkSize">Default Chunk Size</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="defaultChunkSize"
                      type="number"
                      value={Math.round(settings.upload.defaultChunkSize / (1024 * 1024))}
                      onChange={(e) => updateSetting('upload.defaultChunkSize', parseInt(e.target.value) * 1024 * 1024)}
                      className="flex-1"
                    />
                    <Select defaultValue="MB">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB">MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Size of each chunk for large file uploads
                  </p>
                </div>
              </div>

              <Separator />

              {/* Allowed File Types */}
              <div className="space-y-3">
                <Label>Allowed File Types</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.upload.allowedFileTypes.map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  These file types are allowed for upload. Contact system administrator to modify.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OCR Settings */}
        <TabsContent value="ocr">
          <Card>
            <CardHeader>
              <CardTitle>OCR Processing Configuration</CardTitle>
              <CardDescription>
                Configure OCR engines, processing limits, and quality settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OCR Thresholds */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="queueThreshold">Queue Threshold</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="queueThreshold"
                      type="number"
                      value={Math.round(settings.ocr.queueThreshold / (1024 * 1024))}
                      onChange={(e) => updateSetting('ocr.queueThreshold', parseInt(e.target.value) * 1024 * 1024)}
                      className="flex-1"
                    />
                    <Select defaultValue="MB">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB">MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Files larger than this use queue processing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxProcessingTime">Max Processing Time</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="maxProcessingTime"
                      type="number"
                      value={Math.round(settings.ocr.maxProcessingTime / 60)}
                      onChange={(e) => updateSetting('ocr.maxProcessingTime', parseInt(e.target.value) * 60)}
                      className="flex-1"
                    />
                    <Select defaultValue="min">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="min">min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Maximum time for OCR processing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concurrentJobs">Concurrent Jobs</Label>
                  <Input
                    id="concurrentJobs"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.ocr.concurrentJobs}
                    onChange={(e) => updateSetting('ocr.concurrentJobs', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    Number of simultaneous OCR jobs
                  </p>
                </div>
              </div>

              <Separator />

              {/* OCR Engines */}
              <div className="space-y-4">
                <Label>OCR Engines</Label>
                
                {Object.entries(settings.ocr.engines).map(([engine, config]) => (
                  <div key={engine} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(checked) => updateSetting(`ocr.engines.${engine}.enabled`, checked)}
                      />
                      <div>
                        <h4 className="font-medium capitalize">{engine.replace(/([A-Z])/g, ' $1')}</h4>
                        <p className="text-sm text-gray-500">Priority: {config.priority}</p>
                      </div>
                    </div>
                    
                    <Badge variant={config.enabled ? 'default' : 'secondary'}>
                      {config.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would continue similarly... */}
        <TabsContent value="translation">
          <Card>
            <CardHeader>
              <CardTitle>Translation Settings</CardTitle>
              <CardDescription>Configure translation providers and processing limits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Translation settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
              <CardDescription>Configure storage limits and retention policies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Storage settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>Configure system maintenance and user access</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Maintenance settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring & Alerts</CardTitle>
              <CardDescription>Configure system monitoring and alerting</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Monitoring settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}