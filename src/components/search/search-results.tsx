'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchResult, SearchResponse } from '@/lib/search/search-engine'
import { 
  FileText, 
  Languages, 
  Calendar, 
  Download, 
  Star,
  Clock,
  HardDrive
} from 'lucide-react'

interface SearchResultsProps {
  searchResponse: SearchResponse | null
  loading: boolean
  onToggleFavorite?: (id: string, type: 'document' | 'translation') => void
  favorites?: Set<string>
}

export function SearchResults({ 
  searchResponse, 
  loading, 
  onToggleFavorite,
  favorites = new Set()
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!searchResponse || searchResponse.results.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Try adjusting your search terms or filters to find what you&apos;re looking for.
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'translated':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (result: SearchResult) => {
    if (result.type === 'translation') {
      return <Languages className="h-8 w-8 text-muted-foreground" />
    }
    return <FileText className="h-8 w-8 text-muted-foreground" />
  }

  const renderHighlights = (highlights: string[]) => {
    if (highlights.length === 0) return null

    return (
      <div className="mt-2">
        <p className="text-xs text-muted-foreground mb-1">Matches:</p>
        <div className="space-y-1">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: highlight }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {searchResponse.totalCount} results found in {searchResponse.searchTime}ms
        </span>
        <div className="flex items-center gap-4">
          <span>Sorted by relevance</span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {searchResponse.results.map((result) => {
          const isFavorite = favorites.has(result.id)
          
          return (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getTypeIcon(result)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{result.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(result.metadata.status)}`}
                        >
                          {result.metadata.status}
                        </Badge>
                        {result.type === 'translation' && result.metadata.language && (
                          <Badge variant="secondary" className="text-xs">
                            {result.metadata.language.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {result.excerpt}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(result.metadata.createdAt)}
                        </span>
                        {result.metadata.fileSize && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(result.metadata.fileSize)}
                          </span>
                        )}
                        {result.metadata.fileType && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {result.metadata.fileType.split('/').pop()?.toUpperCase()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Score: {Math.round(result.relevanceScore)}
                        </span>
                      </div>

                      {renderHighlights(result.highlights)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {onToggleFavorite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleFavorite(result.id, result.type)}
                        className={isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}
                      >
                        <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                    )}
                    
                    {result.metadata.status === 'completed' && (
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

      {/* Load More */}
      {searchResponse.totalCount > searchResponse.results.length && (
        <div className="text-center">
          <Button variant="outline">
            Load More Results
          </Button>
        </div>
      )}

      {/* Facets */}
      {(Object.keys(searchResponse.facets.status).length > 0 ||
        Object.keys(searchResponse.facets.languages).length > 0 ||
        Object.keys(searchResponse.facets.fileTypes).length > 0) && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium mb-4">Refine Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Facets */}
              {Object.keys(searchResponse.facets.status).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">By Status</h5>
                  <div className="space-y-1">
                    {Object.entries(searchResponse.facets.status).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{status}</span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Language Facets */}
              {Object.keys(searchResponse.facets.languages).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">By Language</h5>
                  <div className="space-y-1">
                    {Object.entries(searchResponse.facets.languages).map(([lang, count]) => (
                      <div key={lang} className="flex items-center justify-between text-sm">
                        <span className="uppercase">{lang}</span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Type Facets */}
              {Object.keys(searchResponse.facets.fileTypes).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">By File Type</h5>
                  <div className="space-y-1">
                    {Object.entries(searchResponse.facets.fileTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span>{type.split('/').pop()?.toUpperCase()}</span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}