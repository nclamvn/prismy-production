import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  History, 
  Search, 
  Filter,
  Download,
  Star,
  Calendar,
  FileText,
  Languages
} from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch translation history
  const { data: translations, error } = await supabase
    .from('translations')
    .select(`
      *,
      documents!inner(
        id,
        file_name,
        file_size,
        file_type
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching translation history:', error)
  }

  // Fetch user's favorites
  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('translation_id')
    .eq('user_id', user.id)

  const favoriteIds = new Set(favorites?.map(f => f.translation_id) || [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLanguageDisplay = (code: string) => {
    const languages: Record<string, { name: string; flag: string }> = {
      'auto': { name: 'Auto-detect', flag: '🔍' },
      'en': { name: 'English', flag: '🇺🇸' },
      'vi': { name: 'Vietnamese', flag: '🇻🇳' },
      'es': { name: 'Spanish', flag: '🇪🇸' },
      'fr': { name: 'French', flag: '🇫🇷' },
      'de': { name: 'German', flag: '🇩🇪' },
      'it': { name: 'Italian', flag: '🇮🇹' },
      'pt': { name: 'Portuguese', flag: '🇵🇹' },
      'ru': { name: 'Russian', flag: '🇷🇺' },
      'ja': { name: 'Japanese', flag: '🇯🇵' },
      'ko': { name: 'Korean', flag: '🇰🇷' },
      'zh': { name: 'Chinese', flag: '🇨🇳' },
      'ar': { name: 'Arabic', flag: '🇸🇦' },
      'hi': { name: 'Hindi', flag: '🇮🇳' },
      'th': { name: 'Thai', flag: '🇹🇭' }
    }
    return languages[code] || { name: code, flag: '🏳️' }
  }

  const stats = {
    total: translations?.length || 0,
    completed: translations?.filter(t => t.status === 'completed').length || 0,
    processing: translations?.filter(t => t.status === 'processing').length || 0,
    failed: translations?.filter(t => t.status === 'failed').length || 0
  }

  return (
    <AppLayout userEmail={user.email}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Translation History</h1>
            <p className="text-muted-foreground">
              View and manage your translation history and favorites
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Translations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">Processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="vi">🇻🇳 Vietnamese</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                    <SelectItem value="fr">🇫🇷 French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Translation History */}
        {translations && translations.length > 0 ? (
          <div className="grid gap-4">
            {translations.map((translation) => {
              const sourceDisplay = getLanguageDisplay(translation.source_language)
              const targetDisplay = getLanguageDisplay(translation.target_language)
              const isFavorite = favoriteIds.has(translation.id)

              return (
                <Card key={translation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{translation.documents.file_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Languages className="h-3 w-3" />
                              {sourceDisplay.flag} {sourceDisplay.name} → {targetDisplay.flag} {targetDisplay.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(translation.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isFavorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                        <Badge className={getStatusColor(translation.status)}>
                          {translation.status}
                        </Badge>
                        {translation.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No translation history</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Start translating documents to see your history here. All your completed translations will be saved for easy access.
              </p>
              <Button asChild>
                <a href="/app/upload">
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Document
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Day 6 - History & Favorites Complete</span>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}