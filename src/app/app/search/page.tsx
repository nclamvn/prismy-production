'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchBar } from '@/components/search/search-bar'
import { FileText, Filter, Clock } from 'lucide-react'

export default function SearchPage() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query)
    // TODO: Implement search functionality
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground">
          Search through your documents and translations
        </p>
      </div>

      {/* Search bar - Full width */}
      <SearchBar onSearch={handleSearch} />

      {/* Search results and filters */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent searches</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Document Type</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">PDF Documents</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Word Documents</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Text Files</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Vietnamese</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">English</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}