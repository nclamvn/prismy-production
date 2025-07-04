'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { SearchBar } from '@/components/search/search-bar'
import { SearchResults } from '@/components/search/search-results'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchEngine, SearchFilters, SearchResponse } from '@/lib/search/search-engine'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Search, Sparkles, TrendingUp } from 'lucide-react'

function SearchPageContent() {
  const [user, setUser] = useState<User | null>(null)
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Parse initial filters from URL
  const [filters, setFilters] = useState<SearchFilters>(() => 
    SearchEngine.parseSearchQuery(searchParams)
  )

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Load user's favorites
        const { data: userFavorites } = await supabase
          .from('user_favorites')
          .select('translation_id')
          .eq('user_id', user.id)
        
        if (userFavorites) {
          setFavorites(new Set(userFavorites.map(f => f.translation_id)))
        }
      }
    }
    getUser()
  }, [])

  // Perform search when filters change
  useEffect(() => {
    if (user) {
      performSearch()
    }
  }, [filters, user]) // performSearch is stable due to useCallback

  // Update URL when filters change
  useEffect(() => {
    const queryString = SearchEngine.buildSearchQuery(filters)
    router.replace(`/app/search${queryString}`, { scroll: false })
  }, [filters, router])

  const performSearch = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await SearchEngine.searchDocuments(user.id, filters)
      setSearchResponse(response)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResponse({
        results: [],
        totalCount: 0,
        facets: { status: {}, languages: {}, fileTypes: {} },
        searchTime: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async (id: string, type: 'document' | 'translation') => {
    if (!user || type !== 'translation') return

    const supabase = createClient()
    const isFavorite = favorites.has(id)

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('translation_id', id)
        
        setFavorites(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      } else {
        // Add to favorites
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            translation_id: id
          })
        
        setFavorites(prev => new Set([...prev, id]))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading search...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userEmail={user.email}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground">
            Find documents, translations, and content across your workspace
          </p>
        </div>

        {/* Search Interface */}
        <div className="space-y-6">
          <SearchBar
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={performSearch}
            loading={loading}
          />

          {/* Quick Actions */}
          {!filters.query && searchResponse === null && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setFilters({ ...filters, favorites: true })}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    My Favorites
                  </CardTitle>
                  <CardDescription>
                    Browse your favorited translations
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setFilters({ ...filters, status: ['completed'] })}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    Completed
                  </CardTitle>
                  <CardDescription>
                    View all completed translations
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setFilters({ 
                      ...filters, 
                      dateRange: {
                        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        end: new Date()
                      }
                    })}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Search className="h-4 w-4" />
                    Recent
                  </CardTitle>
                  <CardDescription>
                    Documents from the past week
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Search Results */}
          <SearchResults
            searchResponse={searchResponse}
            loading={loading}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Day 7 - Advanced Search Complete</span>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}