'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AnalyticsTracker, UsageMetrics, UserActivityMetrics } from '@/lib/analytics/tracker'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Languages,
  HardDrive,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react'

interface AnalyticsDashboardProps {
  userId?: string
  isAdmin?: boolean
}

export function AnalyticsDashboard({ userId, isAdmin = false }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [systemMetrics, setSystemMetrics] = useState<UsageMetrics | null>(null)
  const [userMetrics, setUserMetrics] = useState<UserActivityMetrics | null>(null)
  const [popularLanguages, setPopularLanguages] = useState<{ language: string; count: number }[]>([])
  const [usageTrends, setUsageTrends] = useState<{
    uploads: { date: string; count: number }[]
    translations: { date: string; count: number }[]
  }>({ uploads: [], translations: [] })

  useEffect(() => {
    loadAnalytics()
  }, [timeRange, userId])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const days = parseInt(timeRange)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      // Load system metrics (for admins or general stats)
      if (isAdmin) {
        const [metrics, languages, trends] = await Promise.all([
          AnalyticsTracker.getSystemMetrics(startDate, endDate),
          AnalyticsTracker.getPopularLanguages(days),
          AnalyticsTracker.getUsageTrends(days)
        ])
        
        setSystemMetrics(metrics)
        setPopularLanguages(languages)
        setUsageTrends(trends)
      }

      // Load user-specific metrics
      if (userId) {
        const userStats = await AnalyticsTracker.getUserMetrics(userId)
        setUserMetrics(userStats)
      }

      // Track dashboard view
      await AnalyticsTracker.trackPageView('/app/analytics', userId)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getLanguageFlag = (langCode: string): string => {
    const flags: Record<string, string> = {
      'en': '🇺🇸', 'vi': '🇻🇳', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪',
      'it': '🇮🇹', 'pt': '🇵🇹', 'ru': '🇷🇺', 'ja': '🇯🇵', 'ko': '🇰🇷',
      'zh': '🇨🇳', 'ar': '🇸🇦', 'hi': '🇮🇳', 'th': '🇹🇭'
    }
    return flags[langCode] || '🏳️'
  }

  const exportData = async () => {
    try {
      await AnalyticsTracker.trackFeatureUsage('analytics', 'export', { time_range: timeRange }, userId)
      
      const data = {
        systemMetrics,
        userMetrics,
        popularLanguages,
        usageTrends,
        exportedAt: new Date().toISOString(),
        timeRange: `${timeRange} days`
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prismy-analytics-${timeRange}d-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            {isAdmin ? 'System-wide analytics and usage metrics' : 'Your personal usage statistics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* User Personal Metrics */}
      {userMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(userMetrics.totalUploads)}</div>
              <p className="text-xs text-muted-foreground">
                Since {new Date(userMetrics.joinDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Translations</CardTitle>
              <Languages className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(userMetrics.totalTranslations)}</div>
              <p className="text-xs text-muted-foreground">
                Avg. {AnalyticsTracker.formatDuration(userMetrics.averageProcessingTime)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{AnalyticsTracker.formatBytes(userMetrics.storageUsed)}</div>
              <p className="text-xs text-muted-foreground">
                Last active {new Date(userMetrics.lastActive).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Languages</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {userMetrics.favoriteLanguages.slice(0, 3).map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {getLanguageFlag(lang)} {lang.toUpperCase()}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Top {userMetrics.favoriteLanguages.length} languages
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Metrics (Admin only) */}
      {isAdmin && systemMetrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(systemMetrics.totalUploads)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg. {AnalyticsTracker.formatBytes(systemMetrics.averageFileSize)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Translations</CardTitle>
                <Languages className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(systemMetrics.totalTranslations)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg. {AnalyticsTracker.formatDuration(systemMetrics.processingTime.average)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(systemMetrics.userActivity.activeUsers)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +{systemMetrics.userActivity.newUsers} new
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{AnalyticsTracker.formatBytes(systemMetrics.storageUsage)}</div>
                <p className="text-xs text-muted-foreground">
                  System-wide usage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Popular Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Popular Languages
              </CardTitle>
              <CardDescription>
                Most frequently translated languages in the last {timeRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popularLanguages.slice(0, 10).map((lang, index) => {
                  const maxCount = Math.max(...popularLanguages.map(l => l.count))
                  const percentage = (lang.count / maxCount) * 100
                  
                  return (
                    <div key={lang.language} className="flex items-center gap-3">
                      <div className="w-8 text-center text-sm text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-lg">{getLanguageFlag(lang.language)}</span>
                        <span className="font-medium">{lang.language.toUpperCase()}</span>
                        <div className="flex-1 bg-muted rounded-full h-2 ml-3">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground min-w-0">
                          {formatNumber(lang.count)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Usage Trends Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Trends
          </CardTitle>
          <CardDescription>
            Upload and translation activity over the last {timeRange} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Interactive charts coming soon
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {usageTrends.uploads.length} upload events • {usageTrends.translations.length} translation events
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Day 8 - Analytics Dashboard Complete</span>
        </div>
      </div>
    </div>
  )
}